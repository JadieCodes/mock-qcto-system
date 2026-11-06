import { buildDdReviewChecklist } from '../../mock/data/ddReviewChecklistItems';
import { buildQsaAddendumChecklist } from '../../mock/data/qsaChecklistItems';
import type { WorkflowRecordState } from '../../shared/workflow/types';
import type { QasaReview, QsaAddendumApplication } from './types';

export const REVIEW_COMPLETED_LABEL = 'Review completed — QASA approved again';

// QCTO feedback 05.2: starting a review sends the QASA back through the normal route (ASD
// evaluation, DD, Director Office, IAC, CEO), so the evaluation work starts fresh and the
// feedback letter waits for a new CEO signature. The approved sittings stay in force through
// the stored Certification hand-off (assessmentDetails.ts approvedSittingsOf), and the
// assessment components stay for the ASD to confirm or change.
export function withReviewStarted(app: QsaAddendumApplication, evalState: WorkflowRecordState, review: QasaReview): QsaAddendumApplication {
  return {
    ...app,
    evalState,
    outcomeState: { stageId: 'ceo-signature' },
    review,
    qsaChecklist: buildQsaAddendumChecklist(),
    ddReviewChecklist: buildDdReviewChecklist(),
    evaluationReport: { ...app.evaluationReport, findings: '', recommendation: '' },
    iacPresentationFileName: null,
    iacMinutesFile: null,
  };
}
