import { useState } from 'react';
import { CheckCircle2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSavePrefilledFields } from '../hooks';
import type { InstrumentValidationRecord, PrefilledField } from '../types';

// CR-021: every pre-filled field needs an explicit Confirm or Recapture action. ASD-editable
// only (the QP sees the same fields read-only via `readonly`).
export function PrefilledFieldsPanel({ record, readonly }: { record: InstrumentValidationRecord; readonly?: boolean }) {
  const savePrefilledFields = useSavePrefilledFields();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState('');

  const updateFields = (fields: PrefilledField[]) => savePrefilledFields.mutate({ recordId: record.id, fields });

  const confirm = (field: PrefilledField) => {
    updateFields(record.prefilledFields.map((f) => (f.key === field.key ? { ...f, action: 'confirmed' } : f)));
  };

  const startRecapture = (field: PrefilledField) => {
    setEditingKey(field.key);
    setDraftValue(field.value);
  };

  const saveRecapture = (field: PrefilledField) => {
    updateFields(record.prefilledFields.map((f) => (f.key === field.key ? { ...f, value: draftValue, action: 'recaptured' } : f)));
    setEditingKey(null);
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Pre-filled from the QASA</p>
      </div>
      <div className="divide-y">
        {record.prefilledFields.map((field) => (
          <div key={field.key} className="px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 uppercase tracking-wide">{field.label}</p>
                {editingKey === field.key ? (
                  <Input className="mt-1" value={draftValue} onChange={(e) => setDraftValue(e.target.value)} />
                ) : (
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{field.value}</p>
                )}
              </div>
              {field.action && editingKey !== field.key && (
                <span className="text-[10px] uppercase tracking-wide text-gray-400 flex-shrink-0 mt-1">
                  {field.action === 'confirmed' ? 'Confirmed' : 'Recaptured'}
                </span>
              )}
            </div>
            {!readonly &&
              (editingKey === field.key ? (
                <div className="flex gap-2">
                  <Button size="sm" disabled={!draftValue.trim()} onClick={() => saveRecapture(field)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => confirm(field)}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirm
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => startRecapture(field)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Recapture
                  </Button>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
