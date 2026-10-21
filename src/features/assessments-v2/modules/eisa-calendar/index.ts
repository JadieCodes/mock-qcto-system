export { ExternalCalendarView as EisaCalendarExternal } from './external/ExternalCalendarView';
export { InternalCalendarView as EisaCalendarInternal } from './internal/InternalCalendarView';

// CR: the typed function other modules (registration, confirmation, site visits) will read
// once they are built, instead of duplicating EISA Calendar logic.
export { listPublishedSittings } from './api';
export type { EisaSitting, EisaSittingStatus } from './types';
