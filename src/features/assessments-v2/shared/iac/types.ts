// QCTO feedback 2.1 / 2.9: the IAC committee minutes the DD uploads when recording the outcome.
// UI-only, the same shape as the Site Visits evidence files (name, size, type, date, who).
export interface IacMinutesFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
}

// One outcome the DD can record for the IAC. `actionId` is the module's workflow action.
export interface IacOutcomeOption {
  actionId: string;
  label: string;
  commentRequired: boolean;
}
