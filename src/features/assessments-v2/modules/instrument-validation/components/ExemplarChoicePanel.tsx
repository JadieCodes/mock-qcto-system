import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { exemplarChoiceDiffers, instrumentSittingLabel, NO_EXEMPLAR_LABEL } from '../exemplars';
import type { SubmittedInstrument } from '../types';

const NO_EXEMPLAR = 'no-exemplar';

// Batch U (29.6): what the ASD sees for each submitted instrument, and (while validating) the
// exemplar choice, pre-selected to the QP's proposal.
export function ExemplarChoicePanel({
  instruments,
  editable,
  hasExemplar,
  choice,
  onChoice,
  note,
  onNote,
}: {
  instruments: SubmittedInstrument[];
  editable: boolean;
  hasExemplar: boolean;
  choice: string | null | undefined;
  onChoice: (choice: string | null) => void;
  note: string;
  onNote: (note: string) => void;
}) {
  const differs = choice !== undefined && exemplarChoiceDiffers(instruments, choice);
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instruments and exemplar</p>
      <RadioGroup
        value={choice === undefined ? '' : (choice ?? NO_EXEMPLAR)}
        onValueChange={(v) => onChoice(v === NO_EXEMPLAR ? null : v)}
        disabled={!editable}
        className="space-y-2"
      >
        {instruments.map((instrument) => (
          <div key={instrument.id} className="flex items-start gap-2 rounded-xl border bg-gray-50 px-3 py-2">
            {editable && <RadioGroupItem id={`exemplar-${instrument.id}`} value={instrument.id} className="mt-1" />}
            <Label htmlFor={`exemplar-${instrument.id}`} className="flex-1 space-y-0.5 font-normal">
              <span className="block text-sm font-mono break-all">
                {instrument.fileName} ({Math.round(instrument.fileSize / 1024)} KB)
              </span>
              <span className="block text-xs text-gray-500">EISA sitting: {instrumentSittingLabel(instrument)}</span>
            </Label>
            <div className="flex flex-col items-end gap-1">
              {instrument.proposedExemplar && <Badge variant="outline">Proposed by the QP</Badge>}
              {instrument.confirmedExemplar && !instrument.replacedAt && <Badge>Exemplar</Badge>}
            </div>
          </div>
        ))}
        {editable && (
          <div className="flex items-center gap-2">
            <RadioGroupItem id="exemplar-none" value={NO_EXEMPLAR} disabled={!hasExemplar} />
            <Label htmlFor="exemplar-none" className="text-sm font-normal">
              {NO_EXEMPLAR_LABEL}
              {!hasExemplar && <span className="text-xs text-gray-400"> (only when the qualification already has a confirmed exemplar)</span>}
            </Label>
          </div>
        )}
      </RadioGroup>
      {editable && differs && (
        <div className="space-y-1">
          <Label htmlFor="exemplar-note" className="text-xs">
            Why is this different from the QP's proposal? *
          </Label>
          <Textarea id="exemplar-note" value={note} onChange={(e) => onNote(e.target.value)} rows={2} />
          <p className="text-xs text-gray-400">This note is shown in the audit trail.</p>
        </div>
      )}
    </div>
  );
}
