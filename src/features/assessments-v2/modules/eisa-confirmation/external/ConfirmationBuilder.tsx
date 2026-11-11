import { useMemo, useState } from 'react';
import { AlertCircle, AlertTriangle, Plus, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CentreMap } from '../components/CentreMap';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { CONFIRMATION_DECLARATION_TEXT, defaultResultsSubmissionDate } from '../config';
import { useAccreditedCentres, useSaveConfirmationDraft, useSubmitConfirmation } from '../hooks';
import type { ConfirmationDraftInput, EisaConfirmationRecord } from '../types';

function DateListField({ label, dates, min, onChange }: { label: string; dates: string[]; min: string; onChange: (dates: string[]) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label} *</Label>
      {dates.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input type="date" min={min} aria-label={`${label} ${i + 1}`} value={d} onChange={(e) => onChange(dates.map((x, j) => (j === i ? e.target.value : x)))} />
          {dates.length > 1 && (
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label.toLowerCase()} ${i + 1}`} onClick={() => onChange(dates.filter((_, j) => j !== i))}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...dates, ''])}>
        <Plus className="h-4 w-4 mr-1" />
        Add a date
      </Button>
    </div>
  );
}

// 29.20, 29.21: the QP picks the accredited centres, allocates every learner, enters the dates and
// submits (or saves a draft first).
export function ConfirmationBuilder({ record }: { record: EisaConfirmationRecord }) {
  const { person } = useV2Role();
  const { data: accredited = [] } = useAccreditedCentres(record.qualificationTitle);
  const saveDraft = useSaveConfirmationDraft();
  const submit = useSubmitConfirmation();
  const [error, setError] = useState<string | null>(null);

  const [centres, setCentres] = useState<string[]>(record.centres);
  const [allocation, setAllocation] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(record.learners.map((l) => [l.learnerId, l.assessmentCentre])),
  );
  const [markingDates, setMarkingDates] = useState<string[]>(record.markingDates.length > 0 ? record.markingDates : ['']);
  const [moderationDates, setModerationDates] = useState<string[]>(record.moderationDates.length > 0 ? record.moderationDates : ['']);
  const defaultResultsDate = defaultResultsSubmissionDate(record.sittingDate);
  const [resultsDate, setResultsDate] = useState(record.resultsSubmissionDate ?? defaultResultsDate);
  const [declared, setDeclared] = useState(false);
  const [bulkSdp, setBulkSdp] = useState('');
  const [bulkCentre, setBulkCentre] = useState('');
  const [centreView, setCentreView] = useState<'list' | 'map'>('list');

  const sdpNames = useMemo(() => [...new Set(record.learners.map((l) => l.sdpName))], [record.learners]);
  const unallocated = record.learners.filter((l) => !allocation[l.learnerId]).length;

  const toggleCentre = (name: string, picked: boolean) => {
    if (picked) {
      setCentres((prev) => [...prev, name]);
      return;
    }
    setCentres((prev) => prev.filter((c) => c !== name));
    setAllocation((prev) => Object.fromEntries(Object.entries(prev).map(([id, c]) => [id, c === name ? null : c])));
    if (bulkCentre === name) setBulkCentre('');
  };

  const allocateBulk = () => {
    if (!bulkSdp || !bulkCentre) return;
    setAllocation((prev) => ({
      ...prev,
      ...Object.fromEntries(record.learners.filter((l) => l.sdpName === bulkSdp).map((l) => [l.learnerId, bulkCentre])),
    }));
  };

  const input: ConfirmationDraftInput = {
    recordId: record.id,
    centres,
    allocation,
    markingDates,
    moderationDates,
    resultsSubmissionDate: resultsDate,
    actorId: person.id,
    actorName: person.name,
  };

  const busy = saveDraft.isPending || submit.isPending;

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-400 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Centres Accredited for this Qualification</p>
        {accredited.length > 0 && (
          <ToggleGroup type="single" variant="outline" size="sm" value={centreView} onValueChange={(v) => v && setCentreView(v as 'list' | 'map')} aria-label="Centre view" className="justify-start">
            <ToggleGroupItem value="list">List</ToggleGroupItem>
            <ToggleGroupItem value="map">Map</ToggleGroupItem>
          </ToggleGroup>
        )}
        {accredited.length === 0 ? (
          <p className="text-sm text-gray-500">No assessment centres are accredited for this qualification.</p>
        ) : centreView === 'map' ? (
          <div className="space-y-2">
            <CentreMap
              centres={accredited}
              selectedIds={accredited.filter((c) => centres.includes(c.name)).map((c) => c.centreId)}
              onToggle={(id) => {
                const c = accredited.find((x) => x.centreId === id);
                if (c) toggleCentre(c.name, !centres.includes(c.name));
              }}
            />
            <p className="text-sm text-gray-600">
              {accredited.filter((c) => centres.includes(c.name)).length} of {accredited.length} centres selected
            </p>
          </div>
        ) : (
          accredited.map((c) => (
            <div key={c.centreId} className="flex items-center gap-3 rounded-xl border px-3 py-2">
              <Checkbox id={`centre-${c.centreId}`} checked={centres.includes(c.name)} onCheckedChange={(v) => toggleCentre(c.name, v === true)} />
              <Label htmlFor={`centre-${c.centreId}`} className="flex-1 text-sm font-normal">
                {c.name}
              </Label>
              <span className="text-xs text-gray-500">
                {c.town}, {c.province}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocate Learners ({unallocated} not allocated)</p>
        <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-gray-50 p-3">
          <div className="space-y-1">
            <Label>Allocate all learners from</Label>
            <Select value={bulkSdp || undefined} onValueChange={setBulkSdp}>
              <SelectTrigger className="w-56" aria-label="SDP">
                <SelectValue placeholder="Choose an SDP" />
              </SelectTrigger>
              <SelectContent>
                {sdpNames.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>to</Label>
            <Select value={bulkCentre || undefined} onValueChange={setBulkCentre}>
              <SelectTrigger className="w-56" aria-label="Assessment centre">
                <SelectValue placeholder="Choose a chosen centre" />
              </SelectTrigger>
              <SelectContent>
                {centres.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" disabled={!bulkSdp || !bulkCentre} onClick={allocateBulk}>
            Allocate
          </Button>
        </div>
        <div className="rounded-xl border max-h-64 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {['Learner', 'SDP', 'Pathway', 'Assessment centre'].map((h) => (
                  <TableHead key={h} className="whitespace-nowrap">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {record.learners.map((l) => (
                <TableRow key={l.learnerId}>
                  <TableCell className="font-medium whitespace-nowrap">{l.fullName}</TableCell>
                  <TableCell className="whitespace-nowrap">{l.sdpName}</TableCell>
                  <TableCell>{l.pathway}</TableCell>
                  <TableCell>
                    <Select value={allocation[l.learnerId] ?? undefined} onValueChange={(v) => setAllocation((prev) => ({ ...prev, [l.learnerId]: v }))}>
                      <SelectTrigger className="w-56" aria-label={`Assessment centre for ${l.fullName}`}>
                        <SelectValue placeholder="Not allocated" />
                      </SelectTrigger>
                      <SelectContent>
                        {centres.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DateListField label="Marking date" dates={markingDates} min={record.sittingDate} onChange={setMarkingDates} />
        <DateListField label="Moderation date" dates={moderationDates} min={markingDates.find((d) => d !== '') ?? record.sittingDate} onChange={setModerationDates} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="results-submission-date">Results submission date *</Label>
        <Input id="results-submission-date" type="date" className="w-56" value={resultsDate} onChange={(e) => setResultsDate(e.target.value)} />
        <p className="text-xs text-gray-500">Suggested: {defaultResultsDate} (21 working days after the EISA).</p>
        {resultsDate > defaultResultsDate && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">This is later than the 21 working days allowed after the EISA ({defaultResultsDate}). You can still submit it.</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-xl border bg-gray-50 p-3">
        <Checkbox id="confirmation-declaration" checked={declared} onCheckedChange={(v) => setDeclared(v === true)} className="mt-0.5" />
        <Label htmlFor="confirmation-declaration" className="text-sm font-normal leading-snug text-gray-700">
          {CONFIRMATION_DECLARATION_TEXT}
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={() => saveDraft.mutate(input, { onError: (e: Error) => setError(e.message), onSuccess: () => setError(null) })}>
          Save draft
        </Button>
        <Button
          type="button"
          disabled={busy || !declared}
          onClick={() => submit.mutate({ ...input, declarationAccepted: declared }, { onError: (e: Error) => setError(e.message), onSuccess: () => setError(null) })}
        >
          Submit EISA Confirmation
        </Button>
      </div>
    </div>
  );
}
