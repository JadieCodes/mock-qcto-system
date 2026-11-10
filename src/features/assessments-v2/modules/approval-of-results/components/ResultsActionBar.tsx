import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { availableActions, canActInStage } from '../../../shared/workflow/engine';
import type { WorkflowAction, WorkflowDefinition } from '../../../shared/workflow/types';
import type { Role } from '../../../types';

// A single generic button that opens an inline mandatory-reason box for decline actions, and
// fires immediately for ones that don't need one. Same shape as the QSA Addendum workspace's
// ActionButton — duplicated locally rather than shared, matching this codebase's existing
// per-module convention. Used by the EISA and the FISA results workspaces.
function ActionButton({ action, onRun, disabled }: { action: WorkflowAction; onRun: (note?: string) => void; disabled?: boolean }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  // Batch N1: "Request more evidence" and "Recommend decline" are softer than the final decline.
  const variant = action.kind === 'reject' ? 'destructive' : action.kind === 'send-back' || action.id.endsWith('-recommend-decline') ? 'outline' : 'default';

  if (!action.requiresNote) {
    return (
      <Button size="sm" variant={variant} disabled={disabled} onClick={() => onRun()}>
        {action.label}
      </Button>
    );
  }
  if (!noteOpen) {
    return (
      <Button size="sm" variant={variant} disabled={disabled} onClick={() => setNoteOpen(true)}>
        {action.label}
      </Button>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border p-3 bg-gray-50 w-full">
      <p className="text-xs font-medium text-gray-600">{action.label} — a reason is required</p>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Explain why..." />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={variant}
          disabled={!note.trim() || disabled}
          onClick={() => {
            onRun(note);
            setNoteOpen(false);
            setNote('');
          }}
        >
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setNoteOpen(false); setNote(''); }}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function isPrimary(action: WorkflowAction): boolean {
  return action.kind !== 'reject' && action.kind !== 'send-back' && !action.id.endsWith('-recommend-decline');
}

export function ResultsActionBar({
  definition,
  stageId,
  role,
  onRun,
  disabledActionIds,
  hiddenActionIds,
}: {
  definition: WorkflowDefinition;
  stageId: string;
  role: Role;
  onRun: (actionId: string, note?: string) => void;
  disabledActionIds?: string[];
  // Batch N1: the Chief Director's final decline has its own form (DeclineResultsForm).
  hiddenActionIds?: string[];
}) {
  if (!canActInStage(definition, stageId, role)) return null;
  const actions = availableActions(definition, stageId).filter((a) => !hiddenActionIds?.includes(a.id));
  if (actions.length === 0) return null;
  // Batch N.1: secondary actions (request more evidence, recommend decline, decline) on the left,
  // the primary action on the right, in the same order on every stage.
  const ordered = [...actions].sort((a, b) => Number(isPrimary(a)) - Number(isPrimary(b)));
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-2">
      {ordered.map((action) => (
        <ActionButton key={action.id} action={action} disabled={disabledActionIds?.includes(action.id)} onRun={(note) => onRun(action.id, note)} />
      ))}
    </div>
  );
}
