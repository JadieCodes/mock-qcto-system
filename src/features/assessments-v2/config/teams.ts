import type { ProcessStageTeam } from '../types';

// CR-015: process-stage teams. Work is assigned by stage, not by QP portfolio ownership.
export const PROCESS_STAGE_TEAMS: { id: ProcessStageTeam; label: string }[] = [
  { id: 'qsa-evaluation', label: 'QSA Evaluation Team' },
  { id: 'instrument-validation', label: 'Instrument Validation Team' },
  { id: 'eisa-calendar', label: 'EISA Calendar Team' },
  { id: 'registration', label: 'Registration Team' },
  { id: 'site-visits', label: 'Site Visits Team' },
  { id: 'approval-of-results', label: 'Approval of Results Team' },
  { id: 'fisa', label: 'FISA Team' },
  { id: 'rpl-toolkit', label: 'RPL Toolkit Team' },
];

export function teamLabel(id: ProcessStageTeam): string {
  return PROCESS_STAGE_TEAMS.find((t) => t.id === id)?.label ?? id;
}
