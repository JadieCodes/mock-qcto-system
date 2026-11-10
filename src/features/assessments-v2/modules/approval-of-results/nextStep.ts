// Batch N.1: the "Next step" card on the Summary tab — what the person using the screen must do now.
import { canActInStage } from '../../shared/workflow/engine';
import type { WorkflowDefinition } from '../../shared/workflow/types';
import type { Role } from '../../types';
import type { ResultsTabId } from './tabs';

export interface NextStep {
  text: string;
  // The tab where the person does it; null when there is nothing to open.
  tab: ResultsTabId | null;
  buttonLabel: string;
}

function stageLabelOf(definition: WorkflowDefinition, stageId: string): string {
  return definition.stages.find((s) => s.id === stageId)?.label ?? stageId;
}

export function internalNextStep(definition: WorkflowDefinition, stageId: string, role: Role, track: 'eisa' | 'fisa', outcome: 'approved' | 'declined' | null): NextStep {
  const submitter = track === 'eisa' ? 'QP' : 'SDP';
  const reviewTab: ResultsTabId = track === 'eisa' ? 'compliance' : 'section-e';
  if (outcome) {
    return {
      text: outcome === 'approved' ? 'This batch is approved. Its Outcome Letter has gone to the ' + submitter + '.' : 'This batch was declined. The decision is final.',
      tab: 'letter',
      buttonLabel: 'Open the Outcome Letter',
    };
  }
  if (stageId === 'more-evidence') {
    return { text: `Waiting for the ${submitter} to add evidence and resubmit. Nothing for you to do.`, tab: 'chain', buttonLabel: 'Open the Approval Chain' };
  }
  if (!canActInStage(definition, stageId, role)) {
    return {
      text: `Nothing for you to do on this batch. It is with the ${stageLabelOf(definition, stageId)} stage.`,
      tab: 'chain',
      buttonLabel: 'Open the Approval Chain',
    };
  }
  switch (stageId) {
    case 'ad-review':
      return {
        text:
          track === 'eisa'
            ? 'Complete the compliance review (section 2 and the notes), then send the batch to the Deputy Director from the Approval Chain tab.'
            : 'Complete Section E1, the notes and the folder checklist, then send the batch to the Deputy Director from the Approval Chain tab.',
        tab: reviewTab,
        buttonLabel: track === 'eisa' ? 'Open Compliance Review' : 'Open Section E',
      };
    case 'dd-review':
      return {
        text:
          track === 'eisa'
            ? 'Tick every line of the Approval of Results letter checklist against the draft Outcome Letter, then send the batch on from the Approval Chain tab.'
            : 'Complete Section E2, then send the batch on from the Approval Chain tab.',
        tab: track === 'eisa' ? 'checklist' : 'section-e',
        buttonLabel: track === 'eisa' ? 'Open Letter Checklist' : 'Open Section E',
      };
    default:
      return {
        text: 'Read the draft Outcome Letter and the Verification Report, then act from the Approval Chain tab.',
        tab: 'chain',
        buttonLabel: 'Open the Approval Chain',
      };
  }
}

export function externalNextStep(stageId: string, outcome: 'approved' | 'declined' | null): NextStep {
  if (outcome) {
    return {
      text: outcome === 'approved' ? 'Your batch is approved. Read or download the Outcome Letter.' : 'Your batch was declined. Read the Outcome Letter for the reasons and the corrective actions.',
      tab: 'letter',
      buttonLabel: 'Open the Outcome Letter',
    };
  }
  if (stageId === 'more-evidence') {
    return { text: 'QCTO asked for more evidence. Read the request below and resubmit.', tab: null, buttonLabel: '' };
  }
  return { text: 'QCTO is reviewing your batch. Nothing for you to do.', tab: null, buttonLabel: '' };
}
