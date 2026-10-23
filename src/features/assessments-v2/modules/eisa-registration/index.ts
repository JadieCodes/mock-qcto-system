export { ExternalDashboard as EisaRegistrationExternal } from './external/ExternalDashboard';
export { InternalDashboard as EisaRegistrationInternal } from './internal/InternalDashboard';

// Read by EISA Confirmation (CR-043): registration must be complete for a sitting first.
export { listRegisteredRegistrationsForSitting, listSittingIdsWithCompletedRegistrations } from './api';
export type { EisaRegistrationRecord } from './types';
