import type { ResultsBatch } from '../approval-of-results/types';
import type { SiteVisit } from './types';

export const QUESTIONNAIRES_LOCKED_MESSAGE = 'Available once the results for this sitting are approved.';

// CR-057 (6 Aug 2:23:20): the Facilitator and Learner Questionnaires on a Post-EISA Monitoring visit
// open only when that sitting's EISA results batch is approved in Approval of Results. Read from the
// real batch list — nobody switches it by hand.
export function resultsApprovedForVisit(visit: SiteVisit, batches: ResultsBatch[]): boolean {
  return batches.some((b) => b.workflow.stageId === 'approved' && (b.pemVisitId === visit.id || (!!visit.sittingId && b.sittingId === visit.sittingId)));
}
