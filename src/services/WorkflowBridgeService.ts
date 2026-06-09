// src/services/WorkflowBridgeService.ts

import type { QasaSubmission } from '@/pages/assessment/External/ExternalQasaAddendumSubmission';

// ── Storage keys ──────────────────────────────────────────────────────────────
const QASA_STORAGE_KEY    = 'qasa_addendum_submissions';
const FISA_STORAGE_KEY    = 'fisa_validation_submissions';   // Validation of FISA tab
const FISA_STANDARDS_KEY  = 'fisa_standards_from_qasa';     // FISA Standards tab (brand-new quals)
const EISA_STORAGE_KEY    = 'eisa_validation_records';       // For existing qualifications

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface FisaValidationSubmission {
  id: string;
  fisaCode: string;
  fisaTitle: string;
  instrumentName: string;
  validationDate: string;
  status: 'pending' | 'allocated' | 'in_progress' | 'completed';
  sourceFrom: string;
  allocatedAsd?: string;
  submissionDate: string;
}

export interface EisaValidationRecord {
  id: string;
  parentQasaId: string;
  eisaRegNo: string;
  title: string;
  eisaDate: string;
  sourceFrom: string;
  leisaFile: boolean;
  sorAndQaReports: boolean;
  eisaRegDocument: boolean;
  currentStage: 'sdp_submission' | 'assistant_director_validation' | 'completed';
  createdAt: string;
}

/**
 * A full FISA Standards record created when a brand-new qualification
 * (gateStatus === 'failed') completes the QASA Approval workflow.
 * Appears in InternalFisaPage → FISA Standards tab.
 */
export interface QasaToFisaStandardsRecord {
  // Identity
  id: string;
  sourceQasaId: string;
  routedAt: string;

  // SP / curriculum fields
  spCode: string;
  spTitle: string;
  curriculumCode: string;
  curriculumTitle: string;
  purpose: string;
  eloFocus: string;
  aacFocus: string;

  // Qualification metadata
  nqfLevel: string;
  credits: string;
  nameOfAQP: string;
  saqaId: string;
  proposedDateOfEISA: string;
  submissionDate: string;

  // Workflow state (mirrors FisaStandardsRecord in InternalFisaPage)
  currentStage: string;
  evaluationReportSubmitted: boolean;
  deputyDirectorModerationStatus: string;
  directorTeamModerationStatus: string;
  aicModerationStatus: string;
  qualificationsDevelopmentApprovalStatus: string;
  databaseUpdated: boolean;
  createdAt: string;
  allocatedAsd?: string;

  // Full QASA payload for detail modal
  qasaPayload: Record<string, unknown>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function deriveSpCode(saqaId: string): string {
  return saqaId ? `SP-${saqaId}` : 'SP-NEW';
}

function deriveCurriculumCode(saqaId: string): string {
  return saqaId ? `CURR-${saqaId}` : 'CURR-NEW';
}

// ── Service ───────────────────────────────────────────────────────────────────
export class WorkflowBridgeService {

  /**
   * Main orchestrator — called when a QAS Addendum reaches 'completed_sent_to_qp'.
   *
   * Routing logic:
   *   gateStatus === 'failed'  → Brand-new qualification → FISA Standards
   *   gateStatus === 'passed'  → Existing qualification  → EISA Validation
   */
  static processCompletedQasaSubmission(qasa: QasaSubmission) {
    // Prevent duplicate processing (legacy flags + new Standards key check)
    if (qasa.routedToFisa || qasa.routedToEisa) {
      console.log(`⚠️ QAS ${qasa.id} already routed, skipping`);
      return;
    }

    if (qasa.gateStatus === 'failed') {
      console.log(`🎯 QAS ${qasa.id}: Gate FAILED → Routing to FISA Standards (New Qualification)`);
      this.createFisaStandardsRecord(qasa);     // Standards pipeline only — Validation tab populated later by SDP instrument upload
    } else if (qasa.gateStatus === 'passed') {
      console.log(`🎯 QAS ${qasa.id}: Gate PASSED → Routing to EISA Validation (Existing Qualification)`);
      this.createEisaValidationRecord(qasa);
    } else {
      console.log(`⚠️ QAS ${qasa.id}: Unknown gate status: ${qasa.gateStatus}`);
    }
  }

  // ── FISA Standards (brand-new qualifications) ─────────────────────────────

  /**
   * Creates a full FISA Standards pipeline record that appears in
   * InternalFisaPage → FISA Standards tab.
   * Carries the entire QASA payload so the detail modal can display it.
   */
  private static createFisaStandardsRecord(qasa: QasaSubmission) {
    const existing = this.getFisaStandardsRecords();

    // Idempotency: don't create twice for the same QASA submission
    if (existing.some(r => r.sourceQasaId === qasa.id)) {
      console.log(`⚠️ FISA Standards record already exists for QAS ${qasa.id}`);
      return;
    }

    const record: QasaToFisaStandardsRecord = {
      id: `FISA-QASA-${qasa.id}`,
      sourceQasaId: qasa.id,
      routedAt: new Date().toISOString(),

      spCode: deriveSpCode(qasa.saqaId || ''),
      spTitle: qasa.qualificationTitle || '',
      curriculumCode: deriveCurriculumCode(qasa.saqaId || ''),
      curriculumTitle: `${qasa.qualificationTitle || ''} Curriculum`,
      purpose: `Develop occupational competence for ${qasa.qualificationTitle || ''} as submitted by ${(qasa as any).nameOfAQP || ''}.`,
      eloFocus: 'Evaluate exit level outcomes alignment, coherence, sequencing, and occupational relevance.',
      aacFocus: 'Review associated assessment criteria for completeness, quality, and alignment to outcomes.',

      nqfLevel:          (qasa as any).nqfLevel          || '',
      credits:           (qasa as any).credits           || '',
      nameOfAQP:         (qasa as any).nameOfAQP         || '',
      saqaId:            qasa.saqaId                     || '',
      proposedDateOfEISA:(qasa as any).proposedDateOfEISA || '',
      submissionDate:    (qasa as any).submissionDate     || new Date().toISOString(),

      // Start at the first stage of the FISA Standards pipeline
      currentStage: 'deputy_director_allocation',
      evaluationReportSubmitted: false,
      deputyDirectorModerationStatus: 'pending',
      directorTeamModerationStatus: 'pending',
      aicModerationStatus: 'pending',
      qualificationsDevelopmentApprovalStatus: 'pending',
      databaseUpdated: false,
      createdAt: new Date().toISOString(),

      qasaPayload: qasa as unknown as Record<string, unknown>,
    };

    localStorage.setItem(FISA_STANDARDS_KEY, JSON.stringify([...existing, record]));
    window.dispatchEvent(new StorageEvent('storage', { key: FISA_STANDARDS_KEY }));

    console.log(`✅ Created FISA Standards record: ${record.spCode} for QAS ${qasa.id}`);
  }

  // ── FISA Validation tab (also notified for brand-new quals) ───────────────

  /**
   * Creates a lightweight FISA Validation submission record.
   * Appears in InternalFisaPage → Validation of FISA tab.
   * Called for gate FAILED (brand-new) qualifications.
   */
  private static createFisaValidationRecord(qasa: QasaSubmission) {
    const fisaCode = `FISA-${qasa.saqaId || Date.now().toString().slice(-6)}`;

    const fisaRecord: FisaValidationSubmission = {
      id: `FISA_${Date.now()}_${qasa.id}`,
      fisaCode,
      fisaTitle: qasa.qualificationTitle,
      instrumentName: this.generateInstrumentName(qasa),
      validationDate: (qasa as any).proposedDateOfEISA || new Date().toISOString().split('T')[0],
      status: 'pending',
      sourceFrom: 'QAS Addendum',
      allocatedAsd: undefined,
      submissionDate: new Date().toISOString(),
    };

    this.saveToFisaStorage(fisaRecord);
    this.markQasAsRouted(qasa.id, 'fisa', fisaRecord.id);

    console.log(`✅ Created FISA Validation record: ${fisaCode} for QAS ${qasa.id}`);
    this.showNotification('FISA', qasa.qualificationTitle);
  }

  // ── EISA Validation (existing qualifications) ─────────────────────────────

  /**
   * Creates an EISA Validation record for EXISTING qualifications (gate PASSED).
   * Appears in ExternalEisaRegistration.tsx.
   */
  private static createEisaValidationRecord(qasa: QasaSubmission) {
    const eisaRegNo = `EISA-${qasa.saqaId || Date.now().toString().slice(-6)}`;

    const eisaRecord = {
      id: `EISA_VAL_${Date.now()}_${qasa.id}`,
      parentQasaId: qasa.id,
      eisaRegNo,
      title: qasa.qualificationTitle,
      saqaId: qasa.saqaId,
      nqfLevel: (qasa as any).nqfLevel,
      credits: (qasa as any).credits,
      proposedEisaDate: (qasa as any).proposedDateOfEISA,
      qualificationType: null,       // To be selected by SDP
      currentStage: 'pending_review',
      sourceFrom: 'QAS Addendum',
      saqaQualificationDocument: qasa.documents?.saqaQualificationDocument || '',
      curriculumDocument:         qasa.documents?.curriculumDocument        || '',
      qasAddendum:                qasa.documents?.qasAddendum               || '',
      createdAt: new Date().toISOString(),
    };

    this.saveToEisaValidationStorage(eisaRecord);
    this.markQasAsRouted(qasa.id, 'eisa', eisaRecord.id);

    console.log(`✅ Created EISA Validation record: ${eisaRegNo} for QAS ${qasa.id}`);
  }

  // ── Persistence helpers ───────────────────────────────────────────────────

  private static saveToFisaStorage(record: FisaValidationSubmission) {
    const existing = localStorage.getItem(FISA_STORAGE_KEY);
    const records: any[] = existing ? JSON.parse(existing) : [];
    if (!records.some(r => r.id === record.id)) {
      records.push(record);
      localStorage.setItem(FISA_STORAGE_KEY, JSON.stringify(records));
      window.dispatchEvent(new StorageEvent('storage', { key: FISA_STORAGE_KEY }));
    }
  }

  private static saveToEisaValidationStorage(record: any) {
    const existing = localStorage.getItem('eisa_validation_records');
    const records: any[] = existing ? JSON.parse(existing) : [];
    if (!records.some(r => r.id === record.id)) {
      records.unshift(record);
      localStorage.setItem('eisa_validation_records', JSON.stringify(records));
      window.dispatchEvent(new StorageEvent('storage', { key: 'eisa_validation_records' }));
    }
  }

  /** @deprecated — kept for any legacy callers that reference saveToEisaStorage */
  private static saveToEisaStorage(record: EisaValidationRecord) {
    const existing = localStorage.getItem('eisa_registration_records');
    const records: any[] = existing ? JSON.parse(existing) : [];
    if (!records.some(r => r.id === record.id)) {
      records.push(record);
      localStorage.setItem('eisa_registration_records', JSON.stringify(records));
      window.dispatchEvent(new StorageEvent('storage', { key: 'eisa_registration_records' }));
    }
  }

  private static markQasAsRouted(qasaId: string, routeTo: 'fisa' | 'eisa', recordId: string) {
    const stored = localStorage.getItem(QASA_STORAGE_KEY);
    if (!stored) return;
    const all = JSON.parse(stored);
    const updated = all.map((s: any) =>
      s.id === qasaId
        ? {
            ...s,
            [`routedTo${routeTo === 'fisa' ? 'Fisa' : 'Eisa'}`]: true,
            [`${routeTo}RecordId`]: recordId,
            routedDate: new Date().toISOString(),
          }
        : s
    );
    localStorage.setItem(QASA_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: QASA_STORAGE_KEY }));
  }

  private static generateInstrumentName(qasa: QasaSubmission): string {
    const evalReport = (qasa as any).evaluationReport;
    if (evalReport?.component1Name) {
      return `${evalReport.component1Name} / ${evalReport.component2Name || 'N/A'} / ${evalReport.component3Name || 'N/A'}`;
    }
    return `${qasa.qualificationTitle} - Assessment Instrument`;
  }

  private static showNotification(processType: 'FISA' | 'EISA', title: string) {
    console.log(`🔔 Notification: ${title} has been routed to ${processType} Validation process`);
  }

  // ── Public read/write API for FISA Standards ──────────────────────────────

  /**
   * Returns all FISA Standards records that were routed from QASA Approval.
   * Used by InternalFisaPage to merge into the standards register.
   */
  static getFisaStandardsRecords(): QasaToFisaStandardsRecord[] {
    try {
      return JSON.parse(localStorage.getItem(FISA_STANDARDS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Persists workflow state changes made inside InternalFisaPage back to
   * the FISA Standards store (e.g. after allocation or stage advancement).
   */
  static updateFisaStandardsRecord(updated: QasaToFisaStandardsRecord): void {
    const all = this.getFisaStandardsRecords();
    const merged = all.map(r => r.id === updated.id ? updated : r);
    localStorage.setItem(FISA_STANDARDS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new StorageEvent('storage', { key: FISA_STANDARDS_KEY }));
  }

  // ── Scanner ───────────────────────────────────────────────────────────────

  /**
   * Scans all QASA submissions and routes any completed ones not yet routed.
   * Safe to call on mount — already-routed records are skipped via the flags.
   */
  static scanAndRouteCompletedSubmissions() {
    const stored = localStorage.getItem(QASA_STORAGE_KEY);
    if (!stored) return;

    const submissions: QasaSubmission[] = JSON.parse(stored);
    const pending = submissions.filter(
      s => (s as any).approvalStatus === 'completed_sent_to_qp' &&
           !s.routedToFisa &&
           !s.routedToEisa
    );

    console.log(`🔍 Found ${pending.length} completed QAS submission(s) to route`);
    pending.forEach(s => this.processCompletedQasaSubmission(s));
  }
}