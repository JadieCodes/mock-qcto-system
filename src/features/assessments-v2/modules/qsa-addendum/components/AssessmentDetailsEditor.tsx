import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import {
  ADDENDUM_END_MISSING_TEXT,
  ADDENDUM_START_PENDING_TEXT,
  ASSESSMENT_COMPONENT_TYPE_LABELS,
  approvedAddendumOf,
  componentsOf,
  MAX_ASSESSMENT_COMPONENTS,
  totalMarksOf,
  totalWeighting,
  validateAssessmentDetails,
} from '../assessmentDetails';
import { useSaveAssessmentDetails } from '../hooks';
import type { AssessmentComponentType, QsaAddendumApplication } from '../types';

interface ComponentRow {
  id: string;
  name: string;
  type: AssessmentComponentType;
  weightingPercent: string;
  days: string;
  highestMark: string;
  lowestMark: string;
}

type FlcChoice = 'yes' | 'no' | '';

interface FormValues {
  components: ComponentRow[];
  addendumPassPercent: string;
  flcRequired: FlcChoice;
}

function toNumber(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value);
}

function flcFrom(choice: FlcChoice): boolean | null {
  return choice === '' ? null : choice === 'yes';
}

function choiceFrom(flcRequired: boolean | null | undefined): FlcChoice {
  return flcRequired == null ? '' : flcRequired ? 'yes' : 'no';
}

// QCTO feedback 3.3: optional assessment components, captured by the ASD on the Evaluation tab.
// Batch L1.1: the fields follow QCTO's QAS Addendum Control Sheet — per component the highest
// mark (component total), lowest mark (competence mark) and weighting; per QASA the addendum
// pass % and FLC. Saved only when the weightings add up to exactly 100. QCTO feedback 05.2: no
// validity period field — the start date is set when the CEO signs, the end date is the
// qualification's registration end date.
export function AssessmentDetailsEditor({ application }: { application: QsaAddendumApplication }) {
  const saveDetails = useSaveAssessmentDetails();
  const { control, register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      components: componentsOf(application).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        weightingPercent: String(c.weightingPercent),
        days: String(c.days),
        highestMark: Number.isFinite(c.highestMark) ? String(c.highestMark) : '',
        lowestMark: Number.isFinite(c.lowestMark) ? String(c.lowestMark) : '',
      })),
      addendumPassPercent: application.addendumPassPercent == null ? '' : String(application.addendumPassPercent),
      flcRequired: choiceFrom(application.flcRequired),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'components', keyName: 'fieldKey' });

  const watchedComponents = useWatch({ control, name: 'components' });
  const watchedPassPercent = useWatch({ control, name: 'addendumPassPercent' });
  const watchedFlc = useWatch({ control, name: 'flcRequired' });
  const input = {
    components: watchedComponents.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      weightingPercent: toNumber(c.weightingPercent),
      days: toNumber(c.days),
      highestMark: toNumber(c.highestMark),
      lowestMark: toNumber(c.lowestMark),
    })),
    addendumPassPercent: watchedPassPercent.trim() === '' ? null : toNumber(watchedPassPercent),
    flcRequired: flcFrom(watchedFlc),
  };
  const issues = validateAssessmentDetails(input);
  const addendum = approvedAddendumOf(application);
  const atLimit = fields.length >= MAX_ASSESSMENT_COMPONENTS;

  const onSubmit = () => {
    if (issues.length === 0) saveDetails.mutate({ applicationId: application.id, input });
  };

  return (
    <form className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Details (optional)</p>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Assessment components</p>
        {fields.length === 0 && <p className="text-xs text-gray-400">No components added.</p>}
        {fields.map((field, index) => (
          <div key={field.fieldKey} className="grid gap-2 rounded-xl border bg-gray-50 p-3 sm:grid-cols-[auto_2fr_1fr_1fr_1fr_1.2fr_1.2fr_auto] sm:items-end">
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">Component no</p>
              <p className="flex h-9 items-center text-sm font-semibold">{index + 1}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`component-name-${field.id}`}>Name</Label>
              <Input id={`component-name-${field.id}`} {...register(`components.${index}.name`)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`component-type-${field.id}`}>Type</Label>
              <Controller
                control={control}
                name={`components.${index}.type`}
                render={({ field: typeField }) => (
                  <Select value={typeField.value} onValueChange={typeField.onChange}>
                    <SelectTrigger id={`component-type-${field.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ASSESSMENT_COMPONENT_TYPE_LABELS) as AssessmentComponentType[]).map((t) => (
                        <SelectItem key={t} value={t}>{ASSESSMENT_COMPONENT_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`component-weighting-${field.id}`}>Weighting (%)</Label>
              <Input id={`component-weighting-${field.id}`} type="number" min={1} max={100} step={1} {...register(`components.${index}.weightingPercent`)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`component-days-${field.id}`}>Days</Label>
              <Input id={`component-days-${field.id}`} type="number" min={1} step={1} {...register(`components.${index}.days`)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`component-highest-${field.id}`}>Highest mark (component total)</Label>
              <Input id={`component-highest-${field.id}`} type="number" min={1} step={1} {...register(`components.${index}.highestMark`)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`component-lowest-${field.id}`}>Lowest mark (competence mark for this component)</Label>
              <Input id={`component-lowest-${field.id}`} type="number" min={0} step={1} {...register(`components.${index}.lowestMark`)} />
            </div>
            <Button type="button" variant="ghost" size="sm" aria-label={`Remove component ${index + 1}`} onClick={() => remove(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={atLimit}
            onClick={() => append({ id: crypto.randomUUID(), name: '', type: 'written', weightingPercent: '', days: '1', highestMark: '', lowestMark: '' })}
          >
            <Plus className="h-4 w-4" />Add component
          </Button>
          {fields.length > 0 && <span className="text-sm text-gray-600">Total weighting: {totalWeighting(input.components)}%</span>}
          {atLimit && <span className="text-xs text-gray-500">At most {MAX_ASSESSMENT_COMPONENTS} components (the limit of QCTO's EISA Calculator).</span>}
        </div>
      </div>

      {fields.length > 0 && (
        <div className="space-y-3 rounded-xl border bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-700">QAS Addendum control sheet</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="addendum-pass-percent">Addendum pass %</Label>
              <Input id="addendum-pass-percent" type="number" min={1} max={100} step={1} {...register('addendumPassPercent')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="flc-required">FLC required</Label>
              <Controller
                control={control}
                name="flcRequired"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="flc-required"><SelectValue placeholder="Select Yes or No" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs text-gray-400 uppercase">Number of components</dt>
              <dd className="font-medium">{fields.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 uppercase">Total marks</dt>
              <dd className="font-medium">{totalMarksOf(input.components)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 uppercase">Addendum start date</dt>
              <dd className="font-medium">{addendum.startDate ?? ADDENDUM_START_PENDING_TEXT}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 uppercase">Addendum end date</dt>
              <dd className="font-medium">{addendum.endDate ?? ADDENDUM_END_MISSING_TEXT}</dd>
            </div>
          </dl>
          <p className="text-xs text-gray-500">
            Number of components and total marks are worked out from the components. The start date is set when the CEO signs the feedback letter; the end date is the
            qualification's registration end date.
          </p>
        </div>
      )}

      {formState.isSubmitted && <ValidationSummary issues={issues} title="Fix these before saving:" />}
      <Button type="submit" size="sm" disabled={saveDetails.isPending}>Save assessment details</Button>
    </form>
  );
}
