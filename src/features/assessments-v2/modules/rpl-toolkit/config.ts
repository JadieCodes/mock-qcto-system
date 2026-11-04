import type { Role } from '../../types';

// PM-09: a submitted RPL Toolkit is allocated to a named ASD. QCTO feedback 3.11 (29 Oct 2026):
// the "Assistant Director" who used to allocate is the ASD, and the DD allocates work to the
// ASDs, so the DD allocates here. Same rule as FISA_VALIDATION_ALLOCATOR_ROLE (fisa/config.ts).
export const RPL_ALLOCATOR_ROLE: Role = 'Deputy Director';
