import type { ProcessStageTeam } from '../types';

// CR-015: process-stage teams. Work is assigned by stage, not by QP portfolio ownership.
// QCTO item 1.5: the labels name the roles that act in each process, never a "team".
export const PROCESS_STAGE_TEAMS: { id: ProcessStageTeam; label: string }[] = [
  { id: 'qsa-evaluation', label: 'ASD, DD, IAC, CEO' },
  { id: 'instrument-validation', label: 'ASD' },
  { id: 'eisa-calendar', label: 'ASD, DD, Director, CEO' },
  { id: 'registration', label: 'ASD' },
  { id: 'site-visits', label: 'ASD, DD, Domain Director, Sub Domain Admin' },
  { id: 'approval-of-results', label: 'ASD, DD, Director, CD' },
  { id: 'fisa', label: 'Qualifications Development, ASD, DD, IAC' },
  { id: 'rpl-toolkit', label: 'ASD, DD, Director Office, IAC, CEO' },
];

export function teamLabel(id: ProcessStageTeam): string {
  return PROCESS_STAGE_TEAMS.find((t) => t.id === id)?.label ?? id;
}
