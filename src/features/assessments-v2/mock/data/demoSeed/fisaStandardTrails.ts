// Demo seed (Batch W) — the audit trail behind each seeded FISA Standard. The Standards themselves
// come from mock/data/fisaStandardsSeed.ts, which holds no audit entries, so every Standard used to
// be measured from its creation date (overdue for weeks). Each trail follows the route the Standard
// has taken (FISA_STANDARD_WORKFLOW), written the way performStandardAction() writes it, so the
// overdue list reads the real stage-entered times. Days are "days ago".
import { FISA_STANDARD_WORKFLOW } from '../../../modules/fisa/workflow';
import type { WorkflowRecordState } from '../../../shared/workflow/types';
import { createClock, seedPerson, step, type SeedLog } from './helpers';

interface Trail {
  standardId: string;
  qd: string;
  asd: string;
  dd: string;
  director: string;
  iac: string;
  ceo: string;
  declined?: boolean;
  // How many of the six steps (submit, ASD, DD, Director Office, IAC outcome, CEO) are done, and when.
  daysAgo: number[];
}

const TRAILS: Trail[] = [
  { standardId: 'seed-fisa-standard-approved', qd: 'fundiswa-ngcobo', asd: 'sipho-ndlovu', dd: 'grace-mokoena', director: 'elsabe-steyn', iac: 'grace-mokoena', ceo: 'angela-fourie', daysAgo: [66, 62, 58, 54, 50, 46] },
  { standardId: 'seed-fisa-standard-ceo-signature', qd: 'fundiswa-ngcobo', asd: 'sipho-ndlovu', dd: 'peter-botha', director: 'elsabe-steyn', iac: 'peter-botha', ceo: 'angela-fourie', daysAgo: [52, 48, 44, 40, 36] },
  { standardId: 'seed-fisa-standard-iac-review', qd: 'fundiswa-ngcobo', asd: 'sipho-ndlovu', dd: 'grace-mokoena', director: 'elsabe-steyn', iac: 'grace-mokoena', ceo: 'angela-fourie', daysAgo: [45, 42, 38, 34] },
  {
    standardId: 'seed-fisa-standard-ceo-signature-declined',
    qd: 'ayesha-patel',
    asd: 'thandeka-zulu',
    dd: 'grace-mokoena',
    director: 'elsabe-steyn',
    iac: 'grace-mokoena',
    ceo: 'angela-fourie',
    declined: true,
    daysAgo: [50, 46, 42, 38, 34],
  },
  { standardId: 'seed-fisa-standard-director-office-review', qd: 'fundiswa-ngcobo', asd: 'sipho-ndlovu', dd: 'peter-botha', director: 'elsabe-steyn', iac: 'peter-botha', ceo: 'angela-fourie', daysAgo: [42, 38, 34] },
  { standardId: 'seed-fisa-standard-dd-review', qd: 'fundiswa-ngcobo', asd: 'sipho-ndlovu', dd: 'grace-mokoena', director: 'elsabe-steyn', iac: 'grace-mokoena', ceo: 'angela-fourie', daysAgo: [38, 34] },
  { standardId: 'seed-fisa-standard-asd-evaluation', qd: 'fundiswa-ngcobo', asd: 'sipho-ndlovu', dd: 'grace-mokoena', director: 'elsabe-steyn', iac: 'grace-mokoena', ceo: 'angela-fourie', daysAgo: [32] },
  // 'seed-fisa-standard-qd-submission' has no trail: Qualifications Development has not sent it yet.
];

const IAC_DECLINE_NOTE = 'The final-assessment requirements are not clear enough for an SDP to develop an instrument against.';

export function seedFisaStandardTrails(log: SeedLog): void {
  for (const trail of TRAILS) {
    const clock = createClock();
    const actors = [trail.qd, trail.asd, trail.dd, trail.director, trail.iac, trail.ceo];
    const actionIds = [
      'standard-submit',
      'standard-asd-send-to-dd',
      'standard-dd-send-to-director-office',
      'standard-do-approve-for-tabling',
      trail.declined ? 'standard-iac-decline' : 'standard-iac-approve',
      trail.declined ? 'standard-ceo-sign-declined' : 'standard-ceo-sign',
    ];
    let state: WorkflowRecordState = { stageId: 'qd-submission', submittedBy: seedPerson(trail.qd).name, submittedById: trail.qd };
    trail.daysAgo.forEach((daysAgo, i) => {
      state = step(log, {
        definition: FISA_STANDARD_WORKFLOW,
        state,
        actionId: actionIds[i],
        actor: seedPerson(actors[i]),
        at: clock.at(daysAgo, 11),
        recordType: 'fisa-standard',
        recordId: trail.standardId,
        note: actionIds[i] === 'standard-iac-decline' ? IAC_DECLINE_NOTE : undefined,
      });
    });
  }
}
