import { listFisaStandards } from '../fisa/api';
import { FISA_STANDARD_WORKFLOW, fisaStandardStatusLabel } from '../fisa/workflow';

// QCTO feedback 3.8: a status-only list of every FISA Standard for the Qualifications
// Development domain. Only these columns are returned — never source documents, checklists,
// evaluation reports, notes or audit entries — and no row opens a FISA record.

export interface FisaStandardStatusRow {
  id: string;
  skillsProgrammeTitle: string;
  stage: string;
  status: string;
}

export async function listFisaStandardStatusRows(): Promise<FisaStandardStatusRow[]> {
  const standards = await listFisaStandards();
  return standards
    .map((s) => ({
      id: s.id,
      skillsProgrammeTitle: s.skillsProgrammeTitle,
      stage: FISA_STANDARD_WORKFLOW.stages.find((stage) => stage.id === s.workflow.stageId)?.label ?? s.workflow.stageId,
      status: fisaStandardStatusLabel(s),
    }))
    .sort((a, b) => a.skillsProgrammeTitle.localeCompare(b.skillsProgrammeTitle));
}
