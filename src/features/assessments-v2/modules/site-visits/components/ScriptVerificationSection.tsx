import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSaveScriptVerification } from '../hooks';
import {
  emptyScriptRow,
  SCRIPT_FINDING_LABELS,
  SCRIPT_RESULT_LABELS,
  SCRIPT_RESULT_OPTIONS,
  scriptQualificationIdOf,
  scriptSampleSizes,
  scriptVerificationOf,
} from '../scriptVerification';
import { visitQualificationsOf } from '../visitQualifications';
import type { ScriptModerationFinding, ScriptVerification, ScriptVerificationResult, ScriptVerificationRow, SiteVisit } from '../types';

const FINDING_OPTIONS = Object.keys(SCRIPT_FINDING_LABELS) as ScriptModerationFinding[];

// QCTO feedback 3.7: a sample of marked and moderated scripts, one row per verified script.
export function ScriptVerificationSection({ visit, readonly }: { visit: SiteVisit; readonly: boolean }) {
  const save = useSaveScriptVerification();
  const verification = scriptVerificationOf(visit);
  const { rows, overallResult } = verification;
  // Batch V1 (05.13): each script says which of the visit's qualifications it belongs to; the sample
  // size is shown per qualification and in total.
  const qualifications = visitQualificationsOf(visit);
  const sampleSizes = scriptSampleSizes(visit);

  const commit = (next: ScriptVerification) => save.mutate({ id: visit.id, scriptVerification: next });
  const updateRow = (id: string, patch: Partial<ScriptVerificationRow>) =>
    commit({ ...verification, rows: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase">Script Verification</p>
        <p className="text-sm text-gray-600">
          Sample size: <span className="font-semibold">{sampleSizes.total}</span> {sampleSizes.total === 1 ? 'script' : 'scripts'}
        </p>
      </div>
      {qualifications.length > 1 && (
        <ul className="text-xs text-gray-600 space-y-0.5" aria-label="Sample size per qualification">
          {sampleSizes.perQualification.map((q) => (
            <li key={q.id}>
              {q.title}: <span className="font-semibold">{q.count}</span> {q.count === 1 ? 'script' : 'scripts'}
            </li>
          ))}
        </ul>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">No scripts verified yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {['Qualification *', 'Script / learner reference *', 'Component *', 'Marked outcome *', 'Moderated finding *', 'Comment', ''].map((h) => (
                  <TableHead key={h} className="whitespace-nowrap">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={row.id}>
                  <TableCell className="min-w-[180px]">
                    <Select
                      value={scriptQualificationIdOf(visit, row) ?? ''}
                      onValueChange={(v) => updateRow(row.id, { qualificationId: v })}
                      disabled={readonly}
                    >
                      <SelectTrigger aria-label={`Script ${i + 1} qualification`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {qualifications.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.qualificationTitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[160px]">
                    <Input aria-label={`Script ${i + 1} reference`} value={row.scriptReference} disabled={readonly} onChange={(e) => updateRow(row.id, { scriptReference: e.target.value })} />
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <Input aria-label={`Script ${i + 1} component`} value={row.component} disabled={readonly} onChange={(e) => updateRow(row.id, { component: e.target.value })} />
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <Input aria-label={`Script ${i + 1} marked outcome`} value={row.markedOutcome} disabled={readonly} onChange={(e) => updateRow(row.id, { markedOutcome: e.target.value })} />
                  </TableCell>
                  <TableCell className="min-w-[130px]">
                    <Select
                      value={row.moderatedFinding ?? ''}
                      onValueChange={(v) => updateRow(row.id, { moderatedFinding: v as ScriptModerationFinding })}
                      disabled={readonly}
                    >
                      <SelectTrigger aria-label={`Script ${i + 1} moderated finding`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {FINDING_OPTIONS.map((f) => (
                          <SelectItem key={f} value={f}>
                            {SCRIPT_FINDING_LABELS[f]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <Input aria-label={`Script ${i + 1} comment`} value={row.comment} disabled={readonly} onChange={(e) => updateRow(row.id, { comment: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    {!readonly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove script ${i + 1}`}
                        onClick={() => commit({ ...verification, rows: rows.filter((r) => r.id !== row.id) })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!readonly && (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => commit({ ...verification, rows: [...rows, emptyScriptRow(qualifications.length === 1 ? qualifications[0].id : undefined)] })}>
          <Plus className="h-4 w-4" />
          Add script
        </Button>
      )}

      <div className="space-y-1.5 max-w-xs">
        <Label>Overall result *</Label>
        <Select value={overallResult ?? ''} onValueChange={(v) => commit({ ...verification, overallResult: v as ScriptVerificationResult })} disabled={readonly}>
          <SelectTrigger aria-label="Overall result">
            <SelectValue placeholder="Select the overall result" />
          </SelectTrigger>
          <SelectContent>
            {SCRIPT_RESULT_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {SCRIPT_RESULT_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
