import { listRecords } from '../instrument-validation/api';
import { listApplications } from '../qsa-addendum/api';
import type { QsaAddendumApplication } from '../qsa-addendum/types';
import { isQasaApproved, isQasaUnderReview, QASA_UNDER_REVIEW_LABEL } from '../qsa-addendum/workflow';

// QCTO feedback 2.2: a status-only view for every system user, on both portals. These
// functions return only the fields the view shows — never documents, evaluations, letters,
// comments or audit entries — so a real backend can expose the same rows as one public
// endpoint without opening the QASA or EISA Instrument Validation records themselves.

// QCTO feedback 29.5: the SAQA ID sits next to the title — two qualifications can share a name.
export interface QasaStatusRow {
  id: string;
  qualificationTitle: string;
  saqaId: string;
  qpName: string;
  status: string;
}

export interface ApprovedInstrumentRow {
  id: string;
  qualificationTitle: string;
  saqaId: string;
  validationDate: string;
  conditions: string | null;
}

// Plain-language status, without the internal letter/drafting steps the QASA screens show.
export function qasaPlainStatus(app: QsaAddendumApplication): string {
  // QCTO feedback 05.2: approved for everyone while the review runs.
  if (isQasaUnderReview(app)) return QASA_UNDER_REVIEW_LABEL;
  switch (app.evalState.stageId) {
    case 'asd-evaluation':
      return 'Under evaluation';
    case 'qp-corrections':
      return 'Remediation requested from the QP';
    case 'dd-review':
      return 'Under review';
    case 'director-office-review':
      return 'Under quality assurance';
    case 'iac-review':
      return 'Awaiting IAC decision';
    case 'approved':
      // QCTO feedback 05.6: approved once the CEO signs the feedback letter.
      return isQasaApproved(app) ? 'Approved' : 'Approved by the IAC — feedback letter awaiting CEO signature';
    default:
      return 'In progress';
  }
}

export async function listQasaStatusRows(): Promise<QasaStatusRow[]> {
  const applications = await listApplications();
  return applications
    .map((app) => ({ id: app.id, qualificationTitle: app.qualificationTitle, saqaId: app.saqaId, qpName: app.qpName, status: qasaPlainStatus(app) }))
    .sort((a, b) => a.qualificationTitle.localeCompare(b.qualificationTitle));
}

export async function listApprovedInstruments(): Promise<ApprovedInstrumentRow[]> {
  const [records, applications] = await Promise.all([listRecords(), listApplications()]);
  return records
    .filter((r) => r.instrumentStatus === 'validated')
    .map((r) => {
      const outcome = r.outcomeHistory[r.outcomeHistory.length - 1];
      return {
        id: r.id,
        qualificationTitle: r.qualificationTitle,
        saqaId: applications.find((a) => a.id === r.qsaAddendumId)?.saqaId ?? '',
        validationDate: outcome?.decidedAt.slice(0, 10) ?? '',
        conditions: outcome?.decision === 'approved-with-conditions' ? outcome.notes : null,
      };
    })
    .sort((a, b) => b.validationDate.localeCompare(a.validationDate));
}
