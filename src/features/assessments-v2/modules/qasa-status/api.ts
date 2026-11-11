import { listRecords } from '../instrument-validation/api';
import { exemplarStandings, instrumentSittingLabel, latestOutcome, outcomeLabel } from '../instrument-validation/exemplars';
import type { InstrumentValidationRecord } from '../instrument-validation/types';
import type { Portal } from '../../types';
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

// Batch U (29.6): SDPs and QPs only need the exemplar. The instruments validated for each sitting,
// with their dates, are for QCTO officials only — so the two portals get different row shapes
// from the API, and the external one has no field that could hold the instrument list.
export interface ExemplarRow {
  id: string;
  qualificationTitle: string;
  saqaId: string;
  qpName: string;
  validationDate: string;
  conditions: string | null;
}

export interface ValidatedInstrumentRow {
  id: string;
  fileName: string;
  sittingLabel: string;
  validationDate: string;
  outcome: string;
  isCurrentExemplar: boolean;
  // Set on a former exemplar.
  replacedAt: string | null;
}

export interface ValidatedInstrumentGroup {
  qualificationTitle: string;
  saqaId: string;
  qpName: string;
  instruments: ValidatedInstrumentRow[];
}

export type ApprovedInstrumentsResult =
  | { portal: 'external'; exemplars: ExemplarRow[] }
  | { portal: 'internal'; groups: ValidatedInstrumentGroup[] };

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

function validationDateOf(record: InstrumentValidationRecord): string {
  return latestOutcome(record)?.decidedAt.slice(0, 10) ?? '';
}

export async function listApprovedInstruments(portal: Portal): Promise<ApprovedInstrumentsResult> {
  const [records, applications] = await Promise.all([listRecords(), listApplications()]);
  const validated = records.filter((r) => r.instrumentStatus === 'validated');
  const saqaIdOf = (r: InstrumentValidationRecord) => applications.find((a) => a.id === r.qsaAddendumId)?.saqaId ?? '';

  if (portal === 'external') {
    const exemplars: ExemplarRow[] = [];
    for (const qsaAddendumId of new Set(validated.map((r) => r.qsaAddendumId))) {
      const current = exemplarStandings(validated, qsaAddendumId).find((st) => st.replacedAt === null);
      const record = validated.find((r) => r.id === current?.recordId);
      if (!record) continue;
      const outcome = latestOutcome(record);
      exemplars.push({
        id: record.id,
        qualificationTitle: record.qualificationTitle,
        saqaId: saqaIdOf(record),
        qpName: record.qpName,
        validationDate: validationDateOf(record),
        conditions: outcome?.decision === 'approved-with-conditions' ? outcome.notes : null,
      });
    }
    return { portal, exemplars: exemplars.sort((a, b) => b.validationDate.localeCompare(a.validationDate)) };
  }

  const groups: ValidatedInstrumentGroup[] = [];
  for (const qsaAddendumId of new Set(validated.map((r) => r.qsaAddendumId))) {
    const ofQualification = validated.filter((r) => r.qsaAddendumId === qsaAddendumId);
    const standings = exemplarStandings(ofQualification, qsaAddendumId);
    const instruments = ofQualification.flatMap((r) =>
      r.instruments.map((i): ValidatedInstrumentRow => {
        const standing = standings.find((st) => st.instrumentId === i.id);
        const outcome = latestOutcome(r);
        return {
          id: i.id,
          fileName: i.fileName,
          sittingLabel: instrumentSittingLabel(i),
          validationDate: validationDateOf(r),
          outcome: outcome ? outcomeLabel(outcome.decision) : '',
          isCurrentExemplar: standing?.replacedAt === null,
          replacedAt: standing?.replacedAt ?? null,
        };
      }),
    );
    const first = ofQualification[0];
    groups.push({ qualificationTitle: first.qualificationTitle, saqaId: saqaIdOf(first), qpName: first.qpName, instruments: instruments.sort((x, y) => y.validationDate.localeCompare(x.validationDate)) });
  }
  return { portal, groups: groups.sort((a, b) => a.qualificationTitle.localeCompare(b.qualificationTitle)) };
}
