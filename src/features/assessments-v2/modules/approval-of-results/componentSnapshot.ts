import { approvedComponentsOf } from '../qsa-addendum/assessmentDetails';
import type { QsaAddendumApplication } from '../qsa-addendum/types';
import { isQasaApproved } from '../qsa-addendum/workflow';
import { componentEisaDates } from './componentDates';
import type { ResultsComponent } from './types';

export const NO_COMPONENTS_MESSAGE =
  'Results cannot be captured for this EISA yet: the approved QASA for this qualification has no assessment components. The ASD must add the components (with total marks and pass marks) to the QASA first.';

// QCTO feedback 29.31: the components of a results batch come from the approved QASA for the
// same QP and qualification (same match as the EISA Calendar). Under review (05.2) the approved
// components are the ones in the Certification hand-off.
export function snapshotResultsComponents(
  qasas: QsaAddendumApplication[],
  sitting: { qpId: string; qualificationTitle: string; sittingDate: string },
): ResultsComponent[] {
  const qasa = qasas.find(
    (a) => isQasaApproved(a) && a.qpId === sitting.qpId && a.qualificationTitle.toLowerCase() === sitting.qualificationTitle.toLowerCase(),
  );
  const components = qasa ? approvedComponentsOf(qasa) : [];
  const dates = componentEisaDates(sitting.sittingDate, components.length);
  return components.map((c, i) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    weightingPercent: c.weightingPercent,
    totalMarks: c.totalMarks,
    passMark: c.passMark,
    eisaDate: dates[i],
  }));
}
