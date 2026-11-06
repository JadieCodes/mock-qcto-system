import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import { ASSESSMENT_COMPONENT_TYPE_LABELS, componentsOf, totalWeighting, validateAssessmentDetails } from '../assessmentDetails';
import { useSaveAssessmentDetails } from '../hooks';
import type { AssessmentComponentType, QsaAddendumApplication } from '../types';

interface ComponentRow {
  id: string;
  name: string;
  type: AssessmentComponentType;
  weightingPercent: string;
  days: string;
}

interface FormValues {
  components: ComponentRow[];
}

function toNumber(value: string): number {
  return value.trim() === '' ? Number.NaN : Number(value);
}

// QCTO feedback 3.3: optional assessment components, captured by the ASD on the Evaluation tab.
// Saved only when the weightings add up to 100%. QCTO feedback 05.2: no validity period field —
// an approved QASA is valid for the lifespan of the qualification.
export function AssessmentDetailsEditor({ application }: { application: QsaAddendumApplication }) {
  const saveDetails = useSaveAssessmentDetails();
  const { control, register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      components: componentsOf(application).map((c) => ({ ...c, weightingPercent: String(c.weightingPercent), days: String(c.days) })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'components', keyName: 'fieldKey' });

  const watchedComponents = useWatch({ control, name: 'components' });
  const input = {
    components: watchedComponents.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      weightingPercent: toNumber(c.weightingPercent),
      days: toNumber(c.days),
    })),
  };
  const issues = validateAssessmentDetails(input);

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
          <div key={field.fieldKey} className="grid gap-2 rounded-xl border bg-gray-50 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
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
              <Input id={`component-weighting-${field.id}`} type="number" min={1} max={100} {...register(`components.${index}.weightingPercent`)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`component-days-${field.id}`}>Days</Label>
              <Input id={`component-days-${field.id}`} type="number" min={1} step={1} {...register(`components.${index}.days`)} />
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
            onClick={() => append({ id: crypto.randomUUID(), name: '', type: 'written', weightingPercent: '', days: '1' })}
          >
            <Plus className="h-4 w-4" />Add component
          </Button>
          {fields.length > 0 && <span className="text-sm text-gray-600">Total weighting: {totalWeighting(input.components)}%</span>}
        </div>
      </div>

      {formState.isSubmitted && <ValidationSummary issues={issues} title="Fix these before saving:" />}
      <Button type="submit" size="sm" disabled={saveDetails.isPending}>Save assessment details</Button>
    </form>
  );
}
