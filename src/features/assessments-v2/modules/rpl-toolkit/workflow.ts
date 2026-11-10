import type { WorkflowDefinition } from '../../shared/workflow/types';
import { RPL_ALLOCATOR_ROLE } from './config';
import type { RplToolkitApplication } from './types';

// Batch W: only the ASD can Reject (shown 5 Nov 1:05:23 without objection); process map 5 returns every "No"
// for rework, so the DD, the Director Office and the IAC have no Reject/Decline. Records already
// declined through a removed action stay declined.
// PM-09: QP -> Deputy Director (allocates to an ASD, QCTO feedback 3.11) -> ASD evaluation ->
// Deputy Director review -> Director & Team review -> IAC -> approved/declined. Corrections only
// ever travel back through the ASD (CR-012's rule applied domain-wide) — no stage returns
// straight to the QP. The stage id 'ad-allocation' is kept so stored records still load.
export const RPL_EVAL_WORKFLOW: WorkflowDefinition = {
  id: 'rpl-toolkit-evaluation',
  stages: [
    { id: 'ad-allocation', label: 'Awaiting Deputy Director allocation', allowedRoles: [RPL_ALLOCATOR_ROLE] },
    { id: 'asd-evaluation', label: 'ASD evaluation', allowedRoles: ['ASD'] },
    { id: 'qp-corrections', label: 'Corrections requested from QP', allowedRoles: ['QP'] },
    { id: 'dd-review', label: 'Deputy Director review', allowedRoles: ['Deputy Director'] },
    { id: 'director-team-review', label: 'Director Office review', allowedRoles: ['Director & Team'] },
    { id: 'iac-review', label: 'IAC review', allowedRoles: ['IAC'] },
    { id: 'approved', label: 'Approved', allowedRoles: [] },
    { id: 'declined', label: 'Declined', allowedRoles: [] },
  ],
  actions: [
    { id: 'rpl-allocate', label: 'Allocate to an ASD', fromStage: 'ad-allocation', toStage: 'asd-evaluation', kind: 'advance' },

    { id: 'rpl-asd-send-to-dd', label: 'Send to Deputy Director', fromStage: 'asd-evaluation', toStage: 'dd-review', kind: 'advance' },
    {
      id: 'rpl-return-to-qp',
      label: 'Return to QP for corrections',
      fromStage: 'asd-evaluation',
      toStage: 'qp-corrections',
      kind: 'send-back',
      requiresNote: true,
    },
    { id: 'rpl-asd-reject', label: 'Reject', fromStage: 'asd-evaluation', toStage: 'declined', kind: 'reject', requiresNote: true },

    { id: 'rpl-qp-resubmit', label: 'Resubmit to ASD', fromStage: 'qp-corrections', toStage: 'asd-evaluation', kind: 'advance' },

    {
      id: 'rpl-dd-send-to-director-team',
      label: 'Send to Director Office',
      fromStage: 'dd-review',
      toStage: 'director-team-review',
      kind: 'advance',
      requiresDifferentActor: true,
    },
    {
      id: 'rpl-dd-return-to-asd',
      label: 'Return to ASD',
      fromStage: 'dd-review',
      toStage: 'asd-evaluation',
      kind: 'send-back',
      requiresNote: true,
    },

    {
      id: 'rpl-director-team-send-to-iac',
      label: 'Send to IAC',
      fromStage: 'director-team-review',
      toStage: 'iac-review',
      kind: 'advance',
      requiresDifferentActor: true,
    },
    {
      id: 'rpl-director-team-return-to-asd',
      label: 'Return to ASD',
      fromStage: 'director-team-review',
      toStage: 'asd-evaluation',
      kind: 'send-back',
      requiresNote: true,
    },

    {
      id: 'rpl-iac-approve',
      label: 'Approve',
      fromStage: 'iac-review',
      toStage: 'approved',
      kind: 'advance',
      requiresDifferentActor: true,
    },
    {
      id: 'rpl-iac-remediation',
      label: 'Send for remediation',
      fromStage: 'iac-review',
      toStage: 'asd-evaluation',
      kind: 'send-back',
      requiresNote: true,
    },
  ],
};

// CEO signs the outcome only — no checklist, mirrors the QSA Addendum's CR-008 rule.
export const RPL_OUTCOME_WORKFLOW: WorkflowDefinition = {
  id: 'rpl-toolkit-outcome',
  stages: [
    { id: 'ceo-signature', label: 'Awaiting CEO signature', allowedRoles: ['CEO'] },
    { id: 'signed', label: 'Signed', allowedRoles: [] },
  ],
  actions: [{ id: 'rpl-outcome-sign', label: 'Sign outcome letter', fromStage: 'ceo-signature', toStage: 'signed', kind: 'complete' }],
};

export type RplStatusTone = 'amber' | 'blue' | 'indigo' | 'emerald' | 'red';

export function rplOverallStatusLabel(app: RplToolkitApplication): string {
  switch (app.evalState.stageId) {
    case 'ad-allocation':
      return 'Awaiting Deputy Director allocation';
    case 'asd-evaluation':
      return `Under ASD evaluation${app.allocatedAsdName ? ` (${app.allocatedAsdName})` : ''}`;
    case 'qp-corrections':
      return 'Corrections requested';
    case 'dd-review':
      return 'Under Deputy Director review';
    case 'director-team-review':
      return 'Under Director Office review';
    case 'iac-review':
      return 'With IAC';
    case 'declined':
      return app.outcomeState.stageId === 'signed' ? 'Declined' : 'Declined — outcome letter pending CEO signature';
    case 'approved':
      return app.outcomeState.stageId === 'signed' ? 'Approved' : 'Approved — outcome letter pending CEO signature';
    default:
      return app.evalState.stageId;
  }
}

export function rplOverallStatusTone(app: RplToolkitApplication): RplStatusTone {
  switch (app.evalState.stageId) {
    case 'ad-allocation':
    case 'asd-evaluation':
    case 'qp-corrections':
      return 'amber';
    case 'dd-review':
    case 'director-team-review':
      return 'blue';
    case 'iac-review':
      return 'indigo';
    case 'declined':
      return 'red';
    case 'approved':
      return app.outcomeState.stageId === 'signed' ? 'emerald' : 'blue';
    default:
      return 'blue';
  }
}
