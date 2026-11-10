import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { RPL_SELF_AUDIT_PARTS } from '../../../mock/data/rplToolkitChecklistItems';
import { RPL_ANSWER_OPTIONS } from '../selfAudit';
import type { RplSelfAudit, RplSelfAuditCompletedBy, RplSelfAuditLine } from '../types';

// 'qp': the QP answers and writes the notes. 'asd': the ASD writes the QCTO feedback and the QP's
// answers are read-only. 'read': everything is read-only.
export type SelfAuditMode = 'qp' | 'asd' | 'read';

export function SelfAuditForm({
  audit,
  mode,
  onChange,
  idPrefix,
  showFeedback,
}: {
  audit: RplSelfAudit;
  mode: SelfAuditMode;
  onChange?: (audit: RplSelfAudit) => void;
  idPrefix: string;
  // Show the QCTO feedback column. The QP's own form (before evaluation) does not show it.
  showFeedback: boolean;
}) {
  const setLine = (questionId: string, patch: Partial<RplSelfAuditLine>) =>
    onChange?.({ ...audit, lines: { ...audit.lines, [questionId]: { ...audit.lines[questionId], ...patch } } });
  const setCompletedBy = (patch: Partial<RplSelfAuditCompletedBy>) => onChange?.({ ...audit, completedBy: { ...audit.completedBy, ...patch } });

  return (
    <div className="space-y-6">
      {RPL_SELF_AUDIT_PARTS.map((part) => (
        <div key={part.id} className="space-y-3">
          <p className="text-sm font-semibold text-gray-800">{part.title}</p>
          {part.groups.map((group) => (
            <div key={group.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {group.id} {group.title}
                </p>
              </div>
              <div className="divide-y">
                {group.questions.map((question) => {
                  const line: RplSelfAuditLine = audit.lines[question.id] ?? { answer: null, notes: '', qctoFeedback: '' };
                  const qpReadonly = mode !== 'qp';
                  return (
                    <div key={question.id} className="px-4 py-3 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-sm text-gray-700 flex-1 min-w-[220px]">
                          <span className="font-mono text-xs text-gray-400 mr-2">{question.id}</span>
                          {question.text}
                        </p>
                        <RadioGroup
                          value={line.answer ?? undefined}
                          onValueChange={(v) => setLine(question.id, { answer: v as RplSelfAuditLine['answer'] })}
                          className="flex gap-3"
                          disabled={qpReadonly}
                        >
                          {RPL_ANSWER_OPTIONS.map((option) => (
                            <div key={option.value} className="flex items-center gap-1.5">
                              <RadioGroupItem id={`${idPrefix}-${question.id}-${option.value}`} value={option.value} />
                              <Label htmlFor={`${idPrefix}-${question.id}-${option.value}`} className="text-xs">
                                {option.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      <Textarea
                        value={line.notes}
                        onChange={(e) => setLine(question.id, { notes: e.target.value })}
                        placeholder='Notes / Evidence (write "n/a" and the reason under No)...'
                        rows={2}
                        disabled={qpReadonly}
                        aria-label={`Notes / Evidence for ${question.id}`}
                      />
                      {showFeedback && (
                        <div>
                          <Label className="text-xs text-gray-500">QCTO feedback</Label>
                          <Textarea
                            value={line.qctoFeedback}
                            onChange={(e) => setLine(question.id, { qctoFeedback: e.target.value })}
                            placeholder={mode === 'asd' ? 'QCTO feedback (required)...' : ''}
                            rows={2}
                            disabled={mode !== 'asd'}
                            className={mode === 'asd' && !line.qctoFeedback.trim() ? 'border-amber-400' : undefined}
                            aria-label={`QCTO feedback for ${question.id}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Self audit checklist completed by</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-by-name`}>Full name *</Label>
            <Input id={`${idPrefix}-by-name`} value={audit.completedBy.fullName} disabled={mode !== 'qp'} onChange={(e) => setCompletedBy({ fullName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-by-designation`}>Designation *</Label>
            <Input id={`${idPrefix}-by-designation`} value={audit.completedBy.designation} disabled={mode !== 'qp'} onChange={(e) => setCompletedBy({ designation: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-by-organisation`}>Organisation *</Label>
            <Input id={`${idPrefix}-by-organisation`} value={audit.completedBy.organisation} disabled={mode !== 'qp'} onChange={(e) => setCompletedBy({ organisation: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${idPrefix}-by-date`}>Date *</Label>
            <Input id={`${idPrefix}-by-date`} type="date" value={audit.completedBy.date} disabled={mode !== 'qp'} onChange={(e) => setCompletedBy({ date: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}
