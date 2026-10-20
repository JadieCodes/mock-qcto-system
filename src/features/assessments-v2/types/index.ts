// Shared cross-module types. Module-specific types live in each module's own types.ts.

export type Portal = 'external' | 'internal';

// CR-015: work is assigned by process-stage team, not QP portfolio.
export type ProcessStageTeam =
  | 'qsa-evaluation'
  | 'instrument-validation'
  | 'eisa-calendar'
  | 'registration'
  | 'site-visits'
  | 'approval-of-results'
  | 'fisa'
  | 'rpl-toolkit';

// External portal roles.
export type ExternalRole = 'QP' | 'SDP';

// Internal portal roles. "Deputy & Assistant Director" and "AIC" are deliberately excluded —
// the combined DD/AD role caused the old build's self-approval bug, and AIC is a duplicate of IAC.
export type InternalRole =
  | 'ASD'
  | 'Assistant Director'
  | 'Deputy Director'
  | 'Director'
  | 'Domain Director'
  | 'Chief Director'
  | 'IAC'
  | 'CEO'
  | 'Sub Domain Admin'
  | 'Director & Team'
  | 'Qualifications Development';

export type Role = ExternalRole | InternalRole;

export interface RoleDescriptor {
  role: Role;
  portal: Portal;
  label: string;
  teams: ProcessStageTeam[];
}
