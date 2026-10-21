export { ExternalDashboard as EisaConfirmationExternal } from './external/ExternalDashboard';
export { InternalDashboard as EisaConfirmationInternal } from './internal/InternalDashboard';

// Exposed for Phase 5 (CR-050: link marking/moderation visits to the confirmed dates).
export { getConfirmationForSitting } from './api';
export type { EisaConfirmationRecord } from './types';
