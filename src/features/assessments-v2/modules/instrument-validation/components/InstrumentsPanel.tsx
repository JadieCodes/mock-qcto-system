import { useRef } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { checkInstrumentsForSubmit, hasConfirmedExemplar, NO_EXEMPLAR_LABEL, NOT_FOR_A_SITTING_LABEL, proposedExemplarId, sittingOptionLabel } from '../exemplars';
import {
  useAddInstruments,
  useInstrumentSittings,
  useInstrumentValidationRecords,
  useRemoveInstrument,
  useSetInstrumentSitting,
  useSetProposedExemplar,
  useValidationAction,
} from '../hooks';
import type { InstrumentValidationRecord } from '../types';

const NO_SITTING = 'none';
const NO_EXEMPLAR = 'no-exemplar';

// Batch U (29.6): the QP's Instrument tab — one or more instruments, each for a sitting or not,
// and exactly one proposed exemplar (or none, once the qualification already has one).
export function InstrumentsPanel({ record, canUpload }: { record: InstrumentValidationRecord; canUpload: boolean }) {
  const { role, person } = useV2Role();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: records = [] } = useInstrumentValidationRecords();
  const { data: sittings = [] } = useInstrumentSittings(record.qualificationTitle);
  const addInstruments = useAddInstruments();
  const setSitting = useSetInstrumentSitting();
  const setExemplar = useSetProposedExemplar();
  const removeInstrument = useRemoveInstrument();
  const validationAction = useValidationAction();

  const hasExemplar = hasConfirmedExemplar(records, record.qsaAddendumId);
  const problem = checkInstrumentsForSubmit(record.instruments, hasExemplar);
  const proposedId = proposedExemplarId(record.instruments);
  const radioValue = proposedId ?? (hasExemplar && record.instruments.length > 0 ? NO_EXEMPLAR : '');

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instruments</p>
      <p className="text-xs text-gray-500">
        {hasExemplar
          ? `This qualification already has a confirmed exemplar. Mark one instrument as the proposed exemplar, or choose "${NO_EXEMPLAR_LABEL}".`
          : 'This qualification has no confirmed exemplar yet. Mark exactly one instrument as the proposed exemplar. QCTO agrees it at validation.'}
      </p>

      {record.instruments.length === 0 ? (
        <p className="text-sm text-gray-400">No instrument uploaded yet.</p>
      ) : (
        <RadioGroup value={radioValue} onValueChange={(v) => setExemplar.mutate({ recordId: record.id, instrumentId: v === NO_EXEMPLAR ? null : v })} disabled={!canUpload} className="space-y-2">
          {record.instruments.map((instrument) => (
            <div key={instrument.id} className="rounded-xl border bg-gray-50 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-700 font-mono break-all">
                  {instrument.fileName} ({Math.round(instrument.fileSize / 1024)} KB)
                </p>
                {canUpload && (
                  <Button type="button" size="sm" variant="ghost" className="gap-1 text-red-600" onClick={() => removeInstrument.mutate({ recordId: record.id, instrumentId: instrument.id })}>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">For EISA sitting</Label>
                  <Select
                    value={instrument.sittingId ?? NO_SITTING}
                    onValueChange={(v) => setSitting.mutate({ recordId: record.id, instrumentId: instrument.id, sittingId: v === NO_SITTING ? null : v })}
                    disabled={!canUpload}
                  >
                    <SelectTrigger className="w-72" aria-label={`EISA sitting for ${instrument.fileName}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SITTING}>{NOT_FOR_A_SITTING_LABEL}</SelectItem>
                      {sittings.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {sittingOptionLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <RadioGroupItem id={`proposed-${instrument.id}`} value={instrument.id} />
                  <Label htmlFor={`proposed-${instrument.id}`} className="text-sm font-normal">
                    Proposed exemplar
                  </Label>
                </div>
              </div>
            </div>
          ))}
          {hasExemplar && (
            <div className="flex items-center gap-2">
              <RadioGroupItem id="proposed-none" value={NO_EXEMPLAR} />
              <Label htmlFor="proposed-none" className="text-sm font-normal">
                {NO_EXEMPLAR_LABEL}
              </Label>
            </div>
          )}
        </RadioGroup>
      )}

      {canUpload && (
        <>
          {problem && record.instruments.length > 0 && <p className="text-xs text-amber-700">{problem}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []).map((f) => ({ fileName: f.name, fileSize: f.size }));
                if (files.length > 0) addInstruments.mutate({ recordId: record.id, files });
                e.target.value = '';
              }}
            />
            <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Add instruments
            </Button>
            <Button
              size="sm"
              disabled={!!problem || validationAction.isPending}
              onClick={() => validationAction.mutate({ recordId: record.id, actionId: 'val-submit', actorRole: role, actorId: person.id, actorName: person.name })}
            >
              {record.cycleCount > 1 ? 'Resubmit to ASD' : 'Submit for validation'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
