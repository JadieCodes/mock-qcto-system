// Row 11 (test findings): one shared shape for "why is Submit blocked" messages, used by
// every form/checklist in the domain instead of each screen inventing its own disabled-button
// silence.
export interface ValidationIssue {
  field: string;
  message: string;
}
