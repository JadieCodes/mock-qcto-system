import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { CHECKLIST_REQUIRE_COMMENT_PER_LINE } from '../../config/featureFlags';
import { ValidationSummary } from '../validation/ValidationSummary';
import { getChecklistIssues, type ChecklistSection } from './types';

// CR-011: every line gets a comment field; it is mandatory before the checklist can be
// saved/submitted. One component, reused by QSA evaluation, FISA Standards evaluation,
// RPL Toolkit evaluation and Instrument Validation (all share this evaluate-shape).
export function Checklist({
  sections,
  onChange,
  readonly,
  requireComment = CHECKLIST_REQUIRE_COMMENT_PER_LINE,
}: {
  sections: ChecklistSection[];
  onChange: (sections: ChecklistSection[]) => void;
  readonly?: boolean;
  requireComment?: boolean;
}) {
  const updateItem = (sectionId: string, itemId: string, patch: Partial<{ answer: 'yes' | 'no'; comment: string }>) => {
    onChange(
      sections.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            },
      ),
    );
  };

  const issues = readonly ? [] : getChecklistIssues(sections, requireComment);

  return (
    <div className="space-y-6">
      <ValidationSummary issues={issues} title="Complete every line before you can submit:" />
      {sections.map((section) => (
        <div key={section.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{section.title}</p>
          </div>
          <div className="divide-y">
            {section.items.map((item) => {
              const commentMissing = requireComment && item.comment.trim().length === 0;
              return (
                <div key={item.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-gray-700 flex-1">
                      <span className="font-mono text-xs text-gray-400 mr-2">{item.id}</span>
                      {item.text}
                    </p>
                    <RadioGroup
                      value={item.answer ?? undefined}
                      onValueChange={(v) => updateItem(section.id, item.id, { answer: v as 'yes' | 'no' })}
                      className="flex gap-3"
                      disabled={readonly}
                    >
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem id={`${item.id}-yes`} value="yes" />
                        <Label htmlFor={`${item.id}-yes`} className="text-xs">Yes</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem id={`${item.id}-no`} value="no" />
                        <Label htmlFor={`${item.id}-no`} className="text-xs">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Textarea
                      value={item.comment}
                      onChange={(e) => updateItem(section.id, item.id, { comment: e.target.value })}
                      placeholder={requireComment ? 'Comment (required)...' : 'Comment...'}
                      rows={2}
                      disabled={readonly}
                      className={commentMissing ? 'border-amber-400' : undefined}
                    />
                    {commentMissing && (
                      <p className="text-xs text-amber-600 mt-1">A comment is required for this line.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
