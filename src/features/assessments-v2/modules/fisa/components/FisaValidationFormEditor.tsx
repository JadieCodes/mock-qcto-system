import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { FISA_VALIDATION_SECTION_2_TITLE } from '../../../mock/data/fisaInstrumentValidationChecklistItems';
import type { ChecklistSection } from '../../../shared/checklist/types';
import type { FisaValidationFormPatch, FisaValidationRecord, FisaValidationReportHeader } from '../types';
import { fisaValidationFormOf } from '../validationForm';

type EditableHeaderField = Exclude<keyof FisaValidationReportHeader, 'evaluatorName' | 'dateCompleted'>;

const HEADER_FIELDS: { field: EditableHeaderField; label: string }[] = [
  { field: 'qapSdpName', label: 'Name of QAP/SDP' },
  { field: 'contactNumber', label: 'Contact number' },
  { field: 'qualificationTitle', label: 'Title of qualification/skills programme' },
  { field: 'spId', label: 'SP ID' },
  { field: 'nqfLevel', label: 'NQF level' },
  { field: 'credits', label: 'Credits' },
  { field: 'fisaDatePeriod', label: 'Date/period of FISA' },
  { field: 'duration', label: 'Duration' },
  { field: 'totalMarks', label: 'Total marks' },
  { field: 'passMark', label: 'Competency/pass mark' },
];

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en-ZA') : '';
}

function ChecklistSectionCard({
  section,
  readonly,
  onChange,
}: {
  section: ChecklistSection;
  readonly: boolean;
  onChange: (section: ChecklistSection) => void;
}) {
  const updateItem = (itemId: string, patch: Partial<{ answer: 'yes' | 'no'; comment: string }>) => {
    onChange({ ...section, items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)) });
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <p className="text-sm font-semibold text-gray-700">
          {section.id}. {section.title}
        </p>
      </div>
      <div className="divide-y">
        {section.items.map((item) => (
          <div key={item.id} className="px-4 py-3 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-gray-700 flex-1">
                <span className="font-mono text-xs text-gray-400 mr-2">{item.id}</span>
                {item.text}
              </p>
              <RadioGroup
                value={item.answer ?? undefined}
                onValueChange={(v) => updateItem(item.id, { answer: v === 'no' ? 'no' : 'yes' })}
                className="flex gap-3"
                disabled={readonly}
              >
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem id={`fisa-${item.id}-yes`} value="yes" />
                  <Label htmlFor={`fisa-${item.id}-yes`} className="text-xs">Yes</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <RadioGroupItem id={`fisa-${item.id}-no`} value="no" />
                  <Label htmlFor={`fisa-${item.id}-no`} className="text-xs">No</Label>
                </div>
              </RadioGroup>
            </div>
            {(!readonly || item.comment) && (
              <Textarea
                aria-label={`Comment on ${item.id}`}
                value={item.comment}
                onChange={(e) => updateItem(item.id, { comment: e.target.value })}
                placeholder="Comment (optional)..."
                rows={1}
                disabled={readonly}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// QCTO feedback 3.10: the ASD fills in QCTO's "FISA Validation of Instrument Report" here,
// in the form's own order: header, sections 1–5 (section 2 is a comment box), findings, sign-off.
export function FisaValidationFormEditor({
  record,
  readonly,
  evaluatorName,
  onSave,
}: {
  record: FisaValidationRecord;
  readonly: boolean;
  evaluatorName: string;
  onSave: (patch: FisaValidationFormPatch) => void;
}) {
  const form = fisaValidationFormOf(record);
  const [firstSection, ...laterSections] = form.checklist;

  const saveSection = (updated: ChecklistSection) => {
    onSave({ checklist: form.checklist.map((s) => (s.id === updated.id ? updated : s)) });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-sm font-semibold text-gray-700">Details</p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {HEADER_FIELDS.slice(0, 2).map(({ field, label }) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`fisa-header-${field}`}>{label}</Label>
              <Input
                id={`fisa-header-${field}`}
                value={form.header[field]}
                disabled={readonly}
                onChange={(e) => onSave({ reportHeader: { [field]: e.target.value } })}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="fisa-header-evaluator">Evaluator full names</Label>
            <Input id="fisa-header-evaluator" value={form.header.evaluatorName || evaluatorName} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fisa-header-date-completed">Date completed</Label>
            <Input
              id="fisa-header-date-completed"
              value={formatDate(form.header.dateCompleted)}
              placeholder="Filled in when the outcome is recorded"
              disabled
            />
          </div>
          {HEADER_FIELDS.slice(2).map(({ field, label }) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`fisa-header-${field}`}>{label}</Label>
              <Input
                id={`fisa-header-${field}`}
                value={form.header[field]}
                disabled={readonly}
                onChange={(e) => onSave({ reportHeader: { [field]: e.target.value } })}
              />
            </div>
          ))}
        </div>
      </div>

      {firstSection && <ChecklistSectionCard section={firstSection} readonly={readonly} onChange={saveSection} />}

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-sm font-semibold text-gray-700">2. {FISA_VALIDATION_SECTION_2_TITLE}</p>
        </div>
        <div className="p-4">
          <Textarea
            aria-label={`2. ${FISA_VALIDATION_SECTION_2_TITLE}`}
            value={form.section2Comment}
            onChange={(e) => onSave({ section2Comment: e.target.value })}
            placeholder="Comment (optional)..."
            rows={3}
            disabled={readonly}
          />
        </div>
      </div>

      {laterSections.map((section) => (
        <ChecklistSectionCard key={section.id} section={section} readonly={readonly} onChange={saveSection} />
      ))}

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <Label htmlFor="fisa-findings" className="text-sm font-semibold text-gray-700">
            6. Findings and Recommendations *
          </Label>
        </div>
        <div className="p-4">
          <Textarea
            id="fisa-findings"
            value={form.findings}
            onChange={(e) => onSave({ findings: e.target.value })}
            rows={5}
            disabled={readonly}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-sm font-semibold text-gray-700">Sign-off</p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fisa-signoff-names">Full names *</Label>
            <Input
              id="fisa-signoff-names"
              value={form.signOff.fullNames}
              placeholder={evaluatorName}
              disabled={readonly}
              onChange={(e) => onSave({ signOff: { fullNames: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fisa-signoff-designation">Designation *</Label>
            <Input
              id="fisa-signoff-designation"
              value={form.signOff.designation}
              disabled={readonly}
              onChange={(e) => onSave({ signOff: { designation: e.target.value } })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="fisa-signoff-signed"
              checked={form.signOff.signed}
              disabled={readonly || !form.signOff.fullNames.trim()}
              onCheckedChange={(checked) => onSave({ signOff: { signed: checked === true } })}
            />
            <Label htmlFor="fisa-signoff-signed">
              Signed{form.signOff.fullNames.trim() ? ` — ${form.signOff.fullNames.trim()}` : ''} *
            </Label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fisa-signoff-date">Date</Label>
            <Input id="fisa-signoff-date" value={formatDate(form.signOff.date)} placeholder="Filled in when you sign" disabled />
          </div>
        </div>
      </div>
    </div>
  );
}
