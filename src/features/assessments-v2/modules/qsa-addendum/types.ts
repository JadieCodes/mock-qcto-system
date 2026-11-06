import type { ChecklistSection } from '../../shared/checklist/types';
import type { IacMinutesFile } from '../../shared/iac/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

export type SaqaGateOutcome = 'registered' | 'not-registered';

export interface RequiredDocument {
  key: 'saqaQualificationDocument' | 'curriculumDocument' | 'qsaAddendumDocument';
  label: string;
  fileName: string;
  // CR-004: the gate check only decides where the document came from, nothing else.
  source: 'saqa-auto' | 'qp-upload';
}

export type EvaluationRecommendation = 'recommended' | 'not-recommended' | '';

export interface EvaluationReport {
  findings: string;
  recommendation: EvaluationRecommendation;
  // CR-030 assumption: captured here on the ASD's evaluation report until QCTO confirms the
  // real home for this value. Flagged as an open question in progress.md.
  approvedEisaSittingsPerYear: number | null;
  // QCTO feedback 3.3: trades can sit the EISA "on demand" instead of a fixed number per year.
  // Optional so reports stored before this change still load (missing = not on demand).
  eisaSittingsOnDemand?: boolean;
}

// QCTO feedback 3.3: one component of the external assessment, as approved in the QASA.
export type AssessmentComponentType = 'written' | 'practical';

export interface AssessmentComponent {
  id: string;
  name: string;
  type: AssessmentComponentType;
  weightingPercent: number;
  days: number;
}

// QCTO feedback 3.3 / 05.1: the simulated "Certification notified of the assessment details"
// hand-off, recorded when the CEO signs the feedback letter on an approved QASA. A snapshot of
// the details at that moment — other modules read the approved sittings from here.
export interface QasaCertificationHandoff {
  notifiedAt: string;
  notifiedBy: string;
  components: AssessmentComponent[];
  approvedEisaSittingsPerYear: number | null;
  eisaSittingsOnDemand: boolean;
}

// QCTO feedback 05.2: a review of an approved QASA, started by the DD with a reason. While it
// is set, the QASA stays approved for every other module; it is cleared when the CEO signs the
// new feedback letter.
export interface QasaReview {
  startedAt: string;
  startedBy: string;
  startedById: string;
  reason: string;
}

export type { IacMinutesFile };

export interface QsaAddendumApplication {
  id: string;

  // Submission fields (CR-003: no "Proposed EISA Date" on this form).
  // qpId is the stable identity the record belongs to; qpName stays for display.
  qpId: string;
  qpName: string;
  qualificationTitle: string;
  saqaId: string;
  dateRegisteredWithSaqa: string;
  nqfLevel: string;
  credits: string;
  submissionDate: string;
  notes: string;

  saqaGateOutcome: SaqaGateOutcome;
  documents: RequiredDocument[];

  // QCTO feedback 05.5: the acknowledgement letter is issued at the moment of submission —
  // no internal preview or review step.
  acknowledgementIssuedAt: string;
  // CR-014 Flow 1: evaluation approval — ASD -> DD -> Director Office -> IAC.
  evalState: WorkflowRecordState;
  // CR-014 Flow 2: feedback letter — CEO signature only. QCTO feedback 05.6: the signed
  // feedback letter is the approval; there is no separate approval letter.
  outcomeState: WorkflowRecordState;

  qsaChecklist: ChecklistSection[];
  ddReviewChecklist: ChecklistSection[];
  evaluationReport: EvaluationReport;
  iacPresentationFileName: string | null;
  // QCTO feedback 2.1: optional, so QASAs stored before this change still load.
  iacMinutesFile?: IacMinutesFile | null;

  // QCTO feedback 3.3: optional and additive — read them through assessmentDetails.ts, which
  // treats a missing value as "not captured".
  assessmentComponents?: AssessmentComponent[];
  certificationHandoff?: QasaCertificationHandoff | null;
  review?: QasaReview | null;
}

export interface NewApplicationInput {
  qpId: string;
  qpName: string;
  qualificationTitle: string;
  saqaId: string;
  dateRegisteredWithSaqa: string;
  nqfLevel: string;
  credits: string;
  submissionDate: string;
  notes: string;
  saqaGateOutcome: SaqaGateOutcome;
  documents: RequiredDocument[];
}
