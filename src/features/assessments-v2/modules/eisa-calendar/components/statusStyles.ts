import type { EisaSittingStatus } from '../types';

// CR-033: status colours for the visual calendar — split out from StatusBadge.tsx so that
// file only exports components (react-refresh/only-export-components).
export const STATUS_LABELS: Record<EisaSittingStatus, string> = {
  proposed: 'Proposed',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Published',
  postponed: 'Postponed',
  cancelled: 'Cancelled',
};

export const STATUS_CLASSES: Record<EisaSittingStatus, string> = {
  proposed: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  postponed: 'bg-purple-50 text-purple-700 border-purple-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};
