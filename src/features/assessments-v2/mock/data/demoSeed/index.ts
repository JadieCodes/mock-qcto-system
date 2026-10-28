// Demo seed (QCTO feedback Batch C) — so every module opens with records at every stage after
// "Reset demo data". Records per module are listed at the top of each file:
//   qasa.ts                  12 QASA submissions (phase C1)
//   eisaCalendar.ts          3 QP batches, 15 sittings — 7 from the batches, 8 added by the ASD (phase C1)
//   instrumentValidation.ts  4 EISA Instrument Validations (phase C1)
// FISA Standards keep their own fallback seed (mock/data/fisaStandardsSeed.ts).
//
// Order matters: the calendar reads the approved QASAs' sittings per year, and Instrument
// Validation needs approved QASAs and the published sittings.
import { BATCHES_KEY, SITTINGS_KEY } from '../../../modules/eisa-calendar/api';
import { KEY as INSTRUMENT_VALIDATION_KEY } from '../../../modules/instrument-validation/api';
import { KEY as QASA_KEY } from '../../../modules/qsa-addendum/api';
import { KEY as AUDIT_KEY } from '../../../shared/audit/auditLog';
import { KEY as NOTIFICATIONS_KEY } from '../../../shared/notifications/store';
import { clearWorkflowStores, isSeedCurrent, markSeedCurrent, writeStore } from '../../api/storage';
import { seedEisaCalendar } from './eisaCalendar';
import { createSeedLog } from './helpers';
import { seedInstrumentValidations } from './instrumentValidation';
import { seedQasaSubmissions } from './qasa';

export function seedDemoData(): void {
  const log = createSeedLog();
  const qasa = seedQasaSubmissions(log);
  const calendar = seedEisaCalendar(log, qasa);
  const validations = seedInstrumentValidations(log, qasa, calendar.sittings);

  writeStore(QASA_KEY, qasa);
  writeStore(BATCHES_KEY, calendar.batches);
  writeStore(SITTINGS_KEY, calendar.sittings);
  writeStore(INSTRUMENT_VALIDATION_KEY, validations);
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
  } catch {
    // A broken seed must not take the app down — the modules fall back to empty lists.
    clearWorkflowStores();
  }
  markSeedCurrent();
}
