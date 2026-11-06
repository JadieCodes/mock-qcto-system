// Demo seed (QCTO feedback Batch C) — so every module opens with records at every stage after
// "Reset demo data". Records per module are listed at the top of each file:
//   qasa.ts                  13 QASA submissions (phase C1; the 13th added in Batch E)
//   eisaCalendar.ts          3 QP batches, 24 sittings — 7 from the batches, 17 added by the ASD (phases C1, C2);
//                            3 postponement/cancellation requests (QCTO feedback 2.4)
//   instrumentValidation.ts  4 EISA Instrument Validations (phase C1)
//   eisaRegistration.ts      20 Learner EISA Registrations — 7 open-demo, 13 behind past sittings (phase C2)
//   eisaConfirmation.ts      12 EISA Confirmations — 1 ready to confirm, 11 confirmed (phase C2)
//   approvalOfResults.ts     10 results batches at every stage, 1 sitting awaiting submission (phase C2)
//   fisaResults.ts           4 FISA results batches: awaiting submission, with the ASD, with the DD,
//                            approved with the letter sent (QCTO feedback 3.14)
//   siteVisits.ts            16 site visits — every type, every planning and report stage (phase C3, Batch G)
//   fisaValidation.ts        6 FISA Instrument Validations against the approved FISA Standard (phase C3;
//                            the 6th, Approved with conditions, added with QCTO's report form in 3.10)
//   rplToolkit.ts            11 RPL Toolkit submissions at every stage (phase C3)
// FISA Standards keep their own fallback seed (mock/data/fisaStandardsSeed.ts).
//
// Order matters: the calendar reads the approved QASAs' sittings per year; Instrument
// Validation needs approved QASAs and the published sittings; Registration needs published
// sittings; Confirmation needs Registered registrations; Approval of Results needs Confirmed
// confirmations; Site Visits needs the sittings, the RPL/ARPL monitoring items from
// Registration and the low-competency results batch (it sets that batch's pemVisitId).
import { KEY as RESULTS_KEY } from '../../../modules/approval-of-results/api';
import { FISA_RESULTS_KEY } from '../../../modules/approval-of-results/fisaApi';
import { BATCHES_KEY, SITTINGS_KEY } from '../../../modules/eisa-calendar/api';
import { CHANGE_REQUESTS_KEY } from '../../../modules/eisa-calendar/changeRequests';
import { KEY as CONFIRMATION_KEY } from '../../../modules/eisa-confirmation/api';
import { KEY as REGISTRATION_KEY } from '../../../modules/eisa-registration/api';
import { VALIDATION_KEY as FISA_VALIDATION_KEY } from '../../../modules/fisa/api';
import { KEY as INSTRUMENT_VALIDATION_KEY } from '../../../modules/instrument-validation/api';
import { KEY as QASA_KEY } from '../../../modules/qsa-addendum/api';
import { KEY as RPL_TOOLKIT_KEY } from '../../../modules/rpl-toolkit/api';
import { KEY as SITE_VISITS_KEY } from '../../../modules/site-visits/api';
import { KEY as AUDIT_KEY } from '../../../shared/audit/auditLog';
import { KEY as NOTIFICATIONS_KEY } from '../../../shared/notifications/store';
import { KEY as MONITORING_ITEMS_KEY } from '../../api/siteVisitsStore';
import { clearWorkflowStores, isSeedCurrent, markSeedCurrent, writeStore } from '../../api/storage';
import { seedResultsBatches } from './approvalOfResults';
import { seedEisaCalendar } from './eisaCalendar';
import { seedEisaConfirmations } from './eisaConfirmation';
import { seedEisaRegistrations } from './eisaRegistration';
import { seedFisaValidations } from './fisaValidation';
import { seedFisaResultsBatches } from './fisaResults';
import { createSeedLog } from './helpers';
import { seedInstrumentValidations } from './instrumentValidation';
import { seedQasaSubmissions } from './qasa';
import { seedRplToolkits } from './rplToolkit';
import { seedSiteVisits } from './siteVisits';

export function seedDemoData(): void {
  const log = createSeedLog();
  const qasa = seedQasaSubmissions(log);
  const calendar = seedEisaCalendar(log, qasa);
  const validations = seedInstrumentValidations(log, qasa, calendar.sittings);
  const { registrations, monitoringItems } = seedEisaRegistrations(log, calendar.sittings);
  const confirmations = seedEisaConfirmations(log, calendar.sittings, registrations);
  const siteVisits = seedSiteVisits(log, calendar.sittings, registrations, monitoringItems, seedResultsBatches(log, confirmations));
  const fisaValidations = seedFisaValidations(log);
  const fisaResults = seedFisaResultsBatches(log);
  const rplToolkits = seedRplToolkits(log);

  writeStore(QASA_KEY, qasa);
  writeStore(BATCHES_KEY, calendar.batches);
  writeStore(SITTINGS_KEY, calendar.sittings);
  writeStore(CHANGE_REQUESTS_KEY, calendar.requests);
  writeStore(INSTRUMENT_VALIDATION_KEY, validations);
  writeStore(REGISTRATION_KEY, registrations);
  writeStore(CONFIRMATION_KEY, confirmations);
  writeStore(RESULTS_KEY, siteVisits.results);
  writeStore(MONITORING_ITEMS_KEY, monitoringItems);
  writeStore(SITE_VISITS_KEY, siteVisits.visits);
  writeStore(FISA_VALIDATION_KEY, fisaValidations);
  writeStore(FISA_RESULTS_KEY, fisaResults);
  writeStore(RPL_TOOLKIT_KEY, rplToolkits);
  // The audit log is read oldest-first (getAuditTrail callers take the latest by reversing);
  // notifications are stored newest-first, as addNotification() leaves them.
  writeStore(AUDIT_KEY, [...log.audit].sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
  writeStore(NOTIFICATIONS_KEY, [...log.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

// Runs once per SEED_VERSION (mock/api/storage.ts): on first load, after "Reset demo data"
// (which clears the stored version), and once in a browser holding an older seed.
export function ensureDemoSeed(): void {
  if (isSeedCurrent()) return;
  clearWorkflowStores();
  try {
    seedDemoData();
    markSeedCurrent();
  } catch (error) {
    // A broken seed must not take the app down — the modules fall back to empty lists.
    console.error('Assessments v2 demo seed failed:', error);
    clearWorkflowStores();
  }
}
