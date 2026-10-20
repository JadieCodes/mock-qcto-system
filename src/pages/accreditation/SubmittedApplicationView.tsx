import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import type { ApplicationForm, FlatAnswers } from '@/types';
import { applicationSchemas } from '@/pages/accreditation/applicationRegistration';
import type { FieldSchema } from '@/pages/accreditation/applicationRegistration';

/** Turn a stored value (or values) into human-readable labels. */
function toDisplayValues(field: FieldSchema, value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value) ? value.length === 0 : value.trim() === '') return [];
  const labelFor = (v: string) => field.options?.find((o) => o.value === v)?.label ?? v;
  return Array.isArray(value) ? value.map(labelFor) : [labelFor(value)];
}

function isVisible(field: FieldSchema, scope: FlatAnswers): boolean {
  if (!field.showIf) return true;
  const actual = scope[field.showIf.fieldId];
  const expected = field.showIf.equals;
  return Array.isArray(expected)
    ? typeof actual === 'string' && expected.includes(actual)
    : actual === expected;
}

function AnswerRow({ field, value }: { field: FieldSchema; value: string | string[] | undefined }) {
  const values = toDisplayValues(field, value);
  return (
    <div className={field.fullWidth || field.type === 'checkbox-group' ? 'md:col-span-2' : ''}>
      <p className="text-xs text-gray-500">{field.label}</p>
      {values.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Not provided</p>
      ) : values.length === 1 ? (
        <p className="text-sm font-medium text-gray-800 break-words">{values[0]}</p>
      ) : (
        <ul className="list-disc list-inside text-sm font-medium text-gray-800 space-y-1">
          {values.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SubmittedApplicationView({ applicationData }: { applicationData?: ApplicationForm }) {
  if (!applicationData?.answers) return null;

  const schema = applicationSchemas[applicationData.applicationType];
  if (!schema) return null;

  const { values, repeats } = applicationData.answers;

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{schema.formTitle}</h3>
        <p className="text-xs text-gray-500">Submitted application form (read-only)</p>
      </div>

      {schema.blocks.map((block) => {
        if (block.kind === 'section') {
          return (
            <section key={block.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">{block.title}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {block.fields
                  .filter((f) => isVisible(f, values))
                  .map((f) => (
                    <AnswerRow key={f.id} field={f} value={values[f.id]} />
                  ))}
              </div>
            </section>
          );
        }

        if (block.kind === 'repeatable') {
          const items = repeats?.[block.id] ?? [];
          if (items.length === 0) return null; // e.g. no additional contact added
          return (
            <section key={block.id} className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-800">{block.title}</h4>
              {items.map((item, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-3">
                    {block.itemLabel} {items.length > 1 ? `#${index + 1}` : ''}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {block.fields
                      .filter((f) => isVisible(f, item))
                      .map((f) => (
                        <AnswerRow key={f.id} field={f} value={item[f.id]} />
                      ))}
                  </div>
                </div>
              ))}
            </section>
          );
        }

        if (block.kind === 'checklist') {
          const selected = (values[block.id] as string[] | undefined) ?? [];
          return (
            <section key={block.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-800">{block.title}</h4>
              <p className="text-xs text-gray-500 mb-3">
                {selected.length} of {block.items.length} items declared
              </p>
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {block.items.map((text, index) => {
                  const checked = selected.includes(String(index));
                  return (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      {checked ? (
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      )}
                      <span className={checked ? 'text-gray-800' : 'text-gray-400'}>
                        {index + 1}. {text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}