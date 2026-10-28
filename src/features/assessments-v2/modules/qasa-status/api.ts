import { listRecords } from '../instrument-validation/api';
import { listApplications } from '../qsa-addendum/api';
import type { QsaAddendumApplication } from '../qsa-addendum/types';
import { isApprovalLetterFinal } from '../qsa-addendum/workflow';

// QCTO feedback 2.2: a status-only view for every system user, on both portals. These
// functions return only the fields the view shows — never documents, evaluations, letters,
// comments or audit entries — so a real backend can expose the same rows as one public
// endpoint without opening the QASA or EISA Instrument Validation records themselves.

export interface QasaStatusRow {
  id: string;
  qualificationTitle: string;
  qpName: string;
  status: string;
}

export interface ApprovedInstrumentRow {
  id: string;
  qualificationTitle: string;
  validationDate: string;
  conditions: string | null;
}

// Plain-language status, without the internal letter/drafting steps the QASA screens show.
export function qasaPlainStatus(app: QsaAddendumApplication): string {
  switch (app.evalState.stageId) {
    case 'asd-evaluation':
      return 'Under evaluation';
    case 'qp-corrections':
      return 'Returned to the QP for corrections';
    case 'dd-review':
      return 'Under review';
    case 'iac-review':
      return 'Awaiting IAC decision';
    case 'approved':
      if (app.outcomeState.stageId !== 'signed') return 'Approved by the IAC — feedback letter awaiting CEO signature';
      return isApprovalLetterFinal(app.approvalState) ? 'Approved' : 'Approved — approval letter being finalised';
    case 'declined':
      return app.outcomeState.stageId === 'signed' ? 'Declined' : 'Declined by the IAC — feedback letter awaiting CEO signature';
    default:
      return 'In progress';
  }
}

export async function listQasaStatusRows(): Promise<QasaStatusRow[]> {
  const applications = await listApplications();
  return applications
    .map((app) => ({ id: app.id, qualificationTitle: app.qualificationTitle, qpName: app.qpName, status: qasaPlainStatus(app) }))
    .sort((a, b) => a.qualificationTitle.localeCompare(b.qualificationTitle));
}

export async function listApprovedInstruments(): Promise<ApprovedInstrumentRow[]> {
  const records = await listRecords();
  return records
    .filter((r) => r.instrumentStatus === 'validated')
    .map((r) => {
      const outcome = r.outcomeHistory[r.outcomeHistory.length - 1];
      return {
        id: r.id,
        qualificationTitle: r.qualificationTitle,
        validationDate: outcome?.decidedAt.slice(0, 10) ?? '',
        conditions: outcome?.decision === 'approved-with-conditions' ? outcome.notes : null,
      };
    })
    .sort((a, b) => b.validationDate.localeCompare(a.validationDate));
}
