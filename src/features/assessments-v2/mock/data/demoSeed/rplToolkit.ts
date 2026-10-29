// Demo seed — RPL Toolkit, item 2.8 of the C3 brief (one submission at every stage). Written in
// the same shape as rpl-toolkit/api.ts (createRplToolkitApplication, saveRplToolkitChecklist,
// saveRplEvaluationReport, saveRplModerationChecklist, saveRplIacEndorsementNote,
// performRplEvaluationAction, performRplOutcomeAction), with the audit entries and notifications
// each step implies. Days are "days ago".
//
//  #    QP                   Toolkit                               Stage
//  R1   Johan van der Merwe  Plumbing RPL Toolkit (new)            Just submitted — awaiting Assistant Director allocation
//  R2   Nomvula Dlamini      Electrical Trades RPL Toolkit (v2)    Updated toolkit (supersedes R8) — awaiting allocation for 5 days
//  R3   Precious Mahlangu    Welding RPL Toolkit                   ASD evaluation (Thandeka Zulu; first checklist section done)
//  R4   Johan van der Merwe  Drainlayer RPL Toolkit                Returned to the QP for corrections (by Sipho Ndlovu)
//  R5   Precious Mahlangu    Boilermaker RPL Toolkit               With the Deputy Director (Peter Botha's team)
//  R6   Nomvula Dlamini      Electrical Line Mechanic RPL Toolkit  Director Office moderation (moderation checklist half done)
//  R7   Johan van der Merwe  Lift Mechanic RPL Toolkit             With the IAC — endorsement note still to be written
//  R8   Nomvula Dlamini      Electrical Trades RPL Toolkit (v1)    Approved by the IAC, outcome letter signed by the CEO
//  R9   Precious Mahlangu    Metal Fabricator RPL Toolkit          Declined by the IAC, outcome letter signed by the CEO
//  R10  Johan van der Merwe  Gas Practitioner RPL Toolkit          Approved by the IAC — outcome letter waiting for the CEO (signable now)
//  R11  Precious Mahlangu    Rigger RPL Toolkit                    Declined by the IAC — outcome letter waiting for the CEO (signable now)
//
// Officials: Assistant Director Lindiwe Khumalo / Riaan Pretorius (allocate); ASD Sipho Ndlovu
// (Nomvula's and Johan's) / Thandeka Zulu (Precious's); Deputy Director Grace Mokoena / Peter
// Botha; Director Office Elsabe Steyn / Johannes Pretorius; IAC Thabiso Molefe / Palesa Nkosi;
// CEO Angela Fourie / David Molewa. The R numbers are labels; seed ids follow the order the
// records are created below (oldest first).
import { buildRplToolkitChecklist } from '../rplToolkitChecklistItems';
import { buildRplToolkitModerationChecklist } from '../rplToolkitModerationChecklistItems';
import { isChecklistComplete } from '../../../shared/checklist/types';
import type { RplRecommendation, RplToolkitApplication, RplToolkitType } from '../../../modules/rpl-toolkit/types';
import { RPL_EVAL_WORKFLOW, RPL_OUTCOME_WORKFLOW } from '../../../modules/rpl-toolkit/workflow';
import { answerChecklist, createClock, dateOf, notify, seedId, seedPerson, step, type SeedLog } from './helpers';

const RPL_ID_GROUP = 11;

const LINDIWE = 'lindiwe-khumalo';
const RIAAN = 'riaan-pretorius';
const SIPHO = 'sipho-ndlovu';
const THANDEKA = 'thandeka-zulu';
const GRACE = 'grace-mokoena';
const PETER = 'peter-botha';
const ELSABE = 'elsabe-steyn';
const JOHANNES = 'johannes-pretorius';
const THABISO = 'thabiso-molefe';
const PALESA = 'palesa-nkosi';
const ANGELA = 'angela-fourie';
const DAVID = 'david-molewa';
const NOMVULA = 'qp-nomvula-dlamini';
const JOHAN = 'qp-johan-van-der-merwe';
const PRECIOUS = 'qp-precious-mahlangu';

const ASD_CHECKLIST_COMMENT = 'Checked against the submitted toolkit — in order.';
const MODERATION_COMMENT = 'The Director Office agrees with the ASD evaluation.';

const IAC_DECISION_ACTION_IDS = ['rpl-iac-approve', 'rpl-iac-decline', 'rpl-iac-remediation'];

interface RplSeedBuilder {
  allocate: (adId: string, asdId: string, atDaysAgo: number) => RplSeedBuilder;
  evaluate: (asdId: string, options: { sectionCount?: number; findings?: string; recommendation?: RplRecommendation; noOnFirstItem?: string }) => RplSeedBuilder;
  moderate: (directorOfficeId: string, sectionCount?: number) => RplSeedBuilder;
  endorse: (iacId: string, note: string) => RplSeedBuilder;
  act: (actionId: string, actorId: string, atDaysAgo: number, note?: string, allocatedAsdId?: string) => RplSeedBuilder;
  sign: (ceoId: string, atDaysAgo: number) => RplSeedBuilder;
  done: () => void;
}

interface NewToolkit {
  qpId: string;
  toolkitTitle: string;
  toolkitType?: RplToolkitType;
  updatesToolkitId?: string;
  description: string;
  createdDaysAgo: number;
}

export function seedRplToolkits(log: SeedLog): RplToolkitApplication[] {
  const records: RplToolkitApplication[] = [];
  let n = 0;

  // createRplToolkitApplication() — the outcome letter starts at `ceo-signature`, as the api
  // does; the CEO can only sign it once the IAC has decided.
  function create(input: NewToolkit): RplSeedBuilder {
    const clock = createClock();
    const qp = seedPerson(input.qpId);
    const createdAt = clock.at(input.createdDaysAgo, 9);
    const toolkitType = input.toolkitType ?? 'new';
    let version = 1;
    let updatesToolkitId: string | null = null;
    if (toolkitType === 'updated') {
      // listApprovedRplToolkitsForQp(): only the QP's own approved toolkit can be updated.
      const previous = records.find((r) => r.id === input.updatesToolkitId && r.qpId === input.qpId && r.evalState.stageId === 'approved');
      if (!previous) throw new Error('Demo seed: the selected toolkit is not one of this QP\'s approved toolkits.');
      version = previous.version + 1;
      updatesToolkitId = previous.id;
    }
    let app: RplToolkitApplication = {
      id: seedId(RPL_ID_GROUP, ++n),
      qpId: input.qpId,
      qpName: qp.name,
      toolkitTitle: input.toolkitTitle,
      toolkitType,
      description: input.description,
      submissionDate: dateOf(createdAt),
      notes: '',
      evalState: { stageId: 'ad-allocation', submittedBy: qp.name, submittedById: input.qpId },
      outcomeState: { stageId: 'ceo-signature' },
      allocatedAsdId: null,
      allocatedAsdName: null,
      checklist: buildRplToolkitChecklist(),
      evaluationReport: { findings: '', recommendation: '' },
      moderationChecklist: buildRplToolkitModerationChecklist(),
      iacEndorsementNote: '',
      version,
      updatesToolkitId,
      createdBy: qp.name,
      createdAt,
    };

    const api: RplSeedBuilder = {
      allocate(adId, asdId, atDaysAgo) {
        return api.act('rpl-allocate', adId, atDaysAgo, undefined, asdId);
      },
      // saveRplToolkitChecklist() + saveRplEvaluationReport(): the ASD's evaluation; no audit entry.
      evaluate(asdId, options) {
        if (app.evalState.stageId !== 'asd-evaluation' || app.allocatedAsdId !== asdId) throw new Error('Demo seed: only the allocated ASD evaluates.');
        const sections = buildRplToolkitChecklist();
        const onlySectionIds = options.sectionCount === undefined ? undefined : sections.slice(0, options.sectionCount).map((s) => s.id);
        const firstItemId = sections[0].items[0].id;
        const overrides = options.noOnFirstItem ? { [firstItemId]: { answer: 'no' as const, comment: options.noOnFirstItem } } : undefined;
        app = {
          ...app,
          checklist: answerChecklist(sections, ASD_CHECKLIST_COMMENT, { onlySectionIds, overrides }),
          evaluationReport: { findings: options.findings ?? '', recommendation: options.recommendation ?? '' },
        };
        return api;
      },
      // saveRplModerationChecklist(): the Director Office's moderation; no audit entry.
      moderate(directorOfficeId, sectionCount) {
        if (app.evalState.stageId !== 'director-team-review' || seedPerson(directorOfficeId).role !== 'Director & Team') {
          throw new Error('Demo seed: only the Director Office moderates, at its own stage.');
        }
        const sections = buildRplToolkitModerationChecklist();
        const onlySectionIds = sectionCount === undefined ? undefined : sections.slice(0, sectionCount).map((s) => s.id);
        app = { ...app, moderationChecklist: answerChecklist(sections, MODERATION_COMMENT, { onlySectionIds }) };
        return api;
      },
      // saveRplIacEndorsementNote(); no audit entry.
      endorse(iacId, note) {
        if (app.evalState.stageId !== 'iac-review' || seedPerson(iacId).role !== 'IAC') throw new Error('Demo seed: only the IAC writes the endorsement note.');
        app = { ...app, iacEndorsementNote: note };
        return api;
      },
      // performRplEvaluationAction().
      act(actionId, actorId, atDaysAgo, note, allocatedAsdId) {
        if (actionId === 'rpl-allocate' && !allocatedAsdId) throw new Error('Demo seed: pick the ASD this RPL Toolkit is allocated to.');
        if (actionId === 'rpl-asd-send-to-dd') {
          if (!isChecklistComplete(app.checklist, true)) throw new Error('Demo seed: every checklist line needs an answer and a comment before sending to the Deputy Director.');
          if (!app.evaluationReport.findings.trim() || !app.evaluationReport.recommendation) throw new Error('Demo seed: complete the evaluation report before sending to the Deputy Director.');
        }
        if (actionId === 'rpl-director-team-send-to-iac' && !isChecklistComplete(app.moderationChecklist, true)) {
          throw new Error('Demo seed: every moderation checklist line needs an answer and a comment before sending to the IAC.');
        }
        if (IAC_DECISION_ACTION_IDS.includes(actionId) && !app.iacEndorsementNote.trim()) throw new Error('Demo seed: record the IAC endorsement note before reaching a decision.');

        const actor = seedPerson(actorId);
        const at = clock.at(atDaysAgo, 14);
        const evalState = step(log, { definition: RPL_EVAL_WORKFLOW, state: app.evalState, actionId, actor, at, recordType: 'rpl-toolkit-evaluation', recordId: app.id, note });
        app = { ...app, evalState };

        if (actionId === 'rpl-allocate' && allocatedAsdId) {
          const asd = seedPerson(allocatedAsdId);
          if (asd.role !== 'ASD') throw new Error('Demo seed: the allocation target must be a named ASD.');
          app = { ...app, allocatedAsdId: asd.id, allocatedAsdName: asd.name };
          notify(log, at, { recipientRole: 'ASD', title: 'RPL Toolkit allocated', body: `"${app.toolkitTitle}" has been allocated to ${asd.name} for evaluation.` });
        }
        if (evalState.stageId === 'qp-corrections') {
          notify(log, at, { recipientRole: 'QP', title: 'Corrections requested', body: `Corrections were requested on "${app.toolkitTitle}": ${note ?? ''}` });
        } else if (evalState.stageId === 'approved' || evalState.stageId === 'declined') {
          notify(log, at, {
            recipientRole: 'QP',
            title: 'RPL Toolkit decision reached',
            body: `The IAC has reached a decision on "${app.toolkitTitle}". The outcome letter is being prepared.`,
          });
        } else if (actionId !== 'rpl-allocate') {
          const nextStage = RPL_EVAL_WORKFLOW.stages.find((s) => s.id === evalState.stageId);
          const action = RPL_EVAL_WORKFLOW.actions.find((a) => a.id === actionId);
          const title = action?.kind === 'send-back' ? 'RPL Toolkit sent back for clarification' : `RPL Toolkit ready: ${nextStage?.label ?? evalState.stageId}`;
          const body = note ? `"${app.toolkitTitle}": ${note}` : `"${app.toolkitTitle}" is now at ${nextStage?.label ?? evalState.stageId}.`;
          if (nextStage?.allowedRoles[0]) notify(log, at, { recipientRole: nextStage.allowedRoles[0], title, body });
        }
        return api;
      },
      // performRplOutcomeAction(): only once the IAC has decided.
      sign(ceoId, atDaysAgo) {
        if (app.evalState.stageId !== 'approved' && app.evalState.stageId !== 'declined') {
          throw new Error('Demo seed: the outcome letter is only ready once the IAC has reached a decision.');
        }
        const actor = seedPerson(ceoId);
        const at = clock.at(atDaysAgo, 15);
        const outcomeState = step(log, {
          definition: RPL_OUTCOME_WORKFLOW,
          state: app.outcomeState,
          actionId: 'rpl-outcome-sign',
          actor,
          at,
          recordType: 'rpl-toolkit-outcome',
          recordId: app.id,
        });
        app = { ...app, outcomeState };
        notify(log, at, { recipientRole: 'QP', title: 'RPL Toolkit outcome letter signed', body: `The outcome letter for "${app.toolkitTitle}" has been signed and is ready to view.` });
        return api;
      },
      done() {
        records.push(app);
      },
    };
    return api;
  }

  const recommended = {
    findings: 'The toolkit covers every exit-level outcome, gives clear evidence guidance for RPL candidates and includes assessor instructions.',
    recommendation: 'recommended' as const,
  };
  const notRecommended = {
    findings: 'The toolkit does not map the RPL evidence requirements to the qualification\'s practical skills modules.',
    recommendation: 'not-recommended' as const,
  };

  // R8 — Nomvula: approved and signed (v1, updated by R2).
  create({ qpId: NOMVULA, toolkitTitle: 'Electrical Trades RPL Toolkit', description: 'RPL toolkit for the Electrical Trades occupational qualification.', createdDaysAgo: 120 })
    .allocate(LINDIWE, SIPHO, 117)
    .evaluate(SIPHO, recommended)
    .act('rpl-asd-send-to-dd', SIPHO, 105)
    .act('rpl-dd-send-to-director-team', GRACE, 98)
    .moderate(ELSABE)
    .act('rpl-director-team-send-to-iac', ELSABE, 90)
    .endorse(THABISO, 'The IAC endorses the toolkit as evaluated and moderated.')
    .act('rpl-iac-approve', THABISO, 80)
    .sign(ANGELA, 76)
    .done();
  const electricalV1Id = seedId(RPL_ID_GROUP, n);

  // R9 — Precious: declined by the IAC, letter signed.
  create({ qpId: PRECIOUS, toolkitTitle: 'Metal Fabricator RPL Toolkit', description: 'RPL toolkit for the Metal Fabricator qualification.', createdDaysAgo: 140 })
    .allocate(RIAAN, THANDEKA, 137)
    .evaluate(THANDEKA, notRecommended)
    .act('rpl-asd-send-to-dd', THANDEKA, 125)
    .act('rpl-dd-send-to-director-team', PETER, 118)
    .moderate(JOHANNES)
    .act('rpl-director-team-send-to-iac', JOHANNES, 110)
    .endorse(PALESA, 'The IAC agrees with the ASD: the evidence requirements are not mapped to the practical modules.')
    .act('rpl-iac-decline', PALESA, 100, 'The RPL evidence requirements are not mapped to the practical skills modules. Submit a new toolkit once they are.')
    .sign(DAVID, 96)
    .done();

  // R10 — Johan: approved by the IAC, waiting for the CEO.
  create({ qpId: JOHAN, toolkitTitle: 'Gas Practitioner RPL Toolkit', description: 'RPL toolkit for the Gas Practitioner qualification.', createdDaysAgo: 95 })
    .allocate(RIAAN, SIPHO, 92)
    .evaluate(SIPHO, recommended)
    .act('rpl-asd-send-to-dd', SIPHO, 70)
    .act('rpl-dd-send-to-director-team', GRACE, 55)
    .moderate(ELSABE)
    .act('rpl-director-team-send-to-iac', ELSABE, 40)
    .endorse(PALESA, 'The IAC endorses the toolkit as evaluated and moderated.')
    .act('rpl-iac-approve', PALESA, 12)
    .done();

  // R11 — Precious: declined by the IAC, waiting for the CEO.
  create({ qpId: PRECIOUS, toolkitTitle: 'Rigger RPL Toolkit', description: 'RPL toolkit for the Rigger qualification.', createdDaysAgo: 100 })
    .allocate(LINDIWE, THANDEKA, 97)
    .evaluate(THANDEKA, notRecommended)
    .act('rpl-asd-send-to-dd', THANDEKA, 75)
    .act('rpl-dd-send-to-director-team', PETER, 60)
    .moderate(JOHANNES)
    .act('rpl-director-team-send-to-iac', JOHANNES, 45)
    .endorse(THABISO, 'The IAC does not endorse the toolkit: the assessor guide is missing.')
    .act('rpl-iac-decline', THABISO, 9, 'The assessor guide is missing and the evidence requirements are not mapped. Submit a new toolkit.')
    .done();

  // R7 — Johan: with the IAC, endorsement note not yet written.
  create({ qpId: JOHAN, toolkitTitle: 'Lift Mechanic RPL Toolkit', description: 'RPL toolkit for the Lift Mechanic qualification.', createdDaysAgo: 70 })
    .allocate(RIAAN, SIPHO, 67)
    .evaluate(SIPHO, recommended)
    .act('rpl-asd-send-to-dd', SIPHO, 52)
    .act('rpl-dd-send-to-director-team', GRACE, 45)
    .moderate(JOHANNES)
    .act('rpl-director-team-send-to-iac', JOHANNES, 35)
    .done();

  // R6 — Nomvula: Director Office moderation, first moderation section done.
  create({ qpId: NOMVULA, toolkitTitle: 'Electrical Line Mechanic RPL Toolkit', description: 'RPL toolkit for the Electrical Line Mechanic qualification.', createdDaysAgo: 55 })
    .allocate(LINDIWE, SIPHO, 52)
    .evaluate(SIPHO, recommended)
    .act('rpl-asd-send-to-dd', SIPHO, 38)
    .act('rpl-dd-send-to-director-team', GRACE, 30)
    .moderate(ELSABE, 1)
    .done();

  // R5 — Precious: with the Deputy Director.
  create({ qpId: PRECIOUS, toolkitTitle: 'Boilermaker RPL Toolkit', description: 'RPL toolkit for the Boilermaker qualification.', createdDaysAgo: 40 })
    .allocate(LINDIWE, THANDEKA, 37)
    .evaluate(THANDEKA, recommended)
    .act('rpl-asd-send-to-dd', THANDEKA, 20)
    .done();

  // R4 — Johan: returned to the QP for corrections.
  create({ qpId: JOHAN, toolkitTitle: 'Drainlayer RPL Toolkit', description: 'RPL toolkit for the Drainlayer qualification.', createdDaysAgo: 30 })
    .allocate(RIAAN, SIPHO, 28)
    .evaluate(SIPHO, { ...notRecommended, noOnFirstItem: 'The toolkit has no candidate guide.' })
    .act('rpl-return-to-qp', SIPHO, 15, 'Add a candidate guide and map the evidence requirements to the practical skills modules, then resubmit.')
    .done();

  // R3 — Precious: ASD evaluation under way.
  create({ qpId: PRECIOUS, toolkitTitle: 'Welding RPL Toolkit', description: 'RPL toolkit for the Welding occupational qualification.', createdDaysAgo: 20 })
    .allocate(RIAAN, THANDEKA, 17)
    .evaluate(THANDEKA, { sectionCount: 1 })
    .done();

  // R2 — Nomvula: updated toolkit (v2 of R8), awaiting allocation.
  create({
    qpId: NOMVULA,
    toolkitTitle: 'Electrical Trades RPL Toolkit',
    toolkitType: 'updated',
    updatesToolkitId: electricalV1Id,
    description: 'Updated RPL toolkit for Electrical Trades: adds the solar PV installation module.',
    createdDaysAgo: 5,
  }).done();

  // R1 — Johan: just submitted.
  create({ qpId: JOHAN, toolkitTitle: 'Plumbing RPL Toolkit', description: 'RPL toolkit for the Plumbing occupational qualification.', createdDaysAgo: 1 }).done();

  // Newest first, the order createRplToolkitApplication() leaves the list in.
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
