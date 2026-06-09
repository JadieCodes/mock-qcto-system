// src/pages/assessment/External/ExternalEisaValidation.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  ClipboardList, FileText, Eye, CheckCircle2, CalendarClock, Send, BookOpen,
  Wrench, X, Calendar, Hash, Award, ShieldCheck, Upload, Clock,
  MapPin, User as UserIcon, Mail, Paperclip, FileSignature, CheckCircle,
  AlertCircle, Bell, BarChart3, ThumbsUp, MessageSquare, ChevronRight,
  Tag, ArrowRight, HardDrive, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type EisaValidationTab = 'pending' | 'in_review' | 'completed';
type ModalTab = 'details' | 'schedule' | 'outcome' | 'registration';
type ExternalRole = 'SDP' | 'Quality Partner';
type ValidationStage = 'pending_review' | 'assessment_domain_notified' | 'assistant_director_validation' | 'dd_review' | 'completed';
type OutcomeDecision = 'approved' | 'approved_with_conditions' | 'not_approved' | '';
type RegistrationStream = 'trades' | 'nonTrades' | '';

export interface EisaOutcomeReport {
  ddRecommendations: string; ddChangesRequired: string; outcomeDecision: OutcomeDecision;
  outcomeNotes: string; ddReviewedBy: string; ddReviewedAt: string;
  reportFinalised: boolean; reportFinalisedAt?: string;
}

export interface EisaRegistrationSubmission {
  eisaRegFileUploaded: boolean; eisaRegFileName?: string;
  leisaFileUploaded: boolean; leisaFileName?: string;
  sorQaReportsUploaded: boolean; sorQaReportsFileName?: string;
  stream: RegistrationStream; sentToRegistrationAt?: string;
  leisa: {
    compilerName: string; compilerEmail: string; compilerPhone: string; institutionPhone: string;
    qualificationName: string; startDate: string; expectedCompletionDate: string;
    sdpName: string; sdpAddress: string; province: string;
  };
}

export interface EisaValidationRecord {
  id: string; parentQasaId: string; eisaRegNo: string; title: string; saqaId: string;
  nqfLevel: string; credits: string; proposedEisaDate: string; currentStage: ValidationStage;
  sourceFrom: string; saqaQualificationDocument: string; curriculumDocument: string;
  qasAddendum: string; createdAt: string; notifiedAt?: string; validatedAt?: string;
  acknowledgementLetterName?: string | null; finalApprovalLetterName?: string | null;
  ceoApprovalNotes?: string; acknowledgementStatus?: string;
  outcomeReport?: EisaOutcomeReport;
  registrationSubmission?: EisaRegistrationSubmission;
  eisaSchedule?: {
    validationDate: string; startTime: string; endTime: string; venue: string;
    assessorName: string; assessorEmail: string; notes: string; scheduleDocumentName?: string;
    submittedToInternalAt?: string; internalUpdatedAt?: string; internalUpdatedBy?: string;
    internalNotes?: string; internalStatus?: 'pending' | 'arranged' | 'confirmed';
  };
}

const STORAGE_KEY = 'eisa_validation_records';
const QASA_STORAGE_KEY = 'qasa_addendum_submissions';
const REGISTRATION_STORAGE_KEY = 'eisa_registration_records';

function recordHasOutcome(r: EisaValidationRecord | null): boolean {
  if (!r) return false;
  return r.currentStage === 'completed' && (r.outcomeReport?.reportFinalised ?? false);
}

function recordSentToRegistration(r: EisaValidationRecord | null): boolean {
  return !!(r?.registrationSubmission?.sentToRegistrationAt);
}

function recordReadyForRegistration(r: EisaValidationRecord | null): boolean {
  return recordHasOutcome(r) && !recordSentToRegistration(r);
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <div className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</div>
      </div>
    </div>
  );
}

function StageBadge({ stage }: { stage: ValidationStage }) {
  const styles: Record<ValidationStage, string> = {
    pending_review: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    assessment_domain_notified: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    assistant_director_validation: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
    dd_review: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    completed: 'bg-green-50 text-green-700 ring-green-600/20',
  };
  const labels: Record<ValidationStage, string> = {
    pending_review: 'Pending Review', assessment_domain_notified: 'Schedule Submitted',
    assistant_director_validation: 'Under Internal Review', dd_review: 'Under Internal Review',
    completed: 'Completed',
  };
  return <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ring-1 ring-inset ${styles[stage]}`}>{labels[stage]}</span>;
}

function OutcomeBadge({ decision }: { decision: OutcomeDecision }) {
  if (!decision) return null;
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: '✓ Approved', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    approved_with_conditions: { label: '⚠ Approved with Conditions', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    not_approved: { label: '✗ Not Approved', cls: 'bg-red-100 text-red-700 border-red-200' },
  };
  const d = map[decision];
  if (!d) return null;
  return <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${d.cls}`}>{d.label}</span>;
}

function defaultLeisa(record: EisaValidationRecord) {
  return {
    compilerName: '', compilerEmail: '', compilerPhone: '', institutionPhone: '',
    qualificationName: record.title, startDate: '', expectedCompletionDate: record.proposedEisaDate ?? '',
    sdpName: '', sdpAddress: '', province: '',
  };
}

export default function ExternalEisaValidation() {
  const [activePageTab, setActivePageTab] = useState<EisaValidationTab>('pending');
  const [records, setRecords] = useState<EisaValidationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRecord = useMemo(
    () => (selectedId ? records.find(r => r.id === selectedId) ?? null : null),
    [selectedId, records]
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('details');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    validationDate: '', startTime: '', endTime: '', venue: '',
    assessorName: '', assessorEmail: '', notes: '', scheduleFile: null as File | null,
  });
  const [regData, setRegData] = useState<EisaRegistrationSubmission>({
    eisaRegFileUploaded: false, leisaFileUploaded: false, sorQaReportsUploaded: false,
    stream: '', leisa: { compilerName: '', compilerEmail: '', compilerPhone: '', institutionPhone: '', qualificationName: '', startDate: '', expectedCompletionDate: '', sdpName: '', sdpAddress: '', province: '' },
  });
  const [showStreamConfirm, setShowStreamConfirm] = useState(false);
  const { currentRole } = useApp();
  const activeExternalRole: ExternalRole = currentRole === 'Quality Partner' ? 'Quality Partner' : 'SDP';

  const loadRecords = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let eisaRecords: EisaValidationRecord[] = stored ? JSON.parse(stored) : [];
      const qasaStored = localStorage.getItem(QASA_STORAGE_KEY);
      if (qasaStored) {
        const qasaSubmissions = JSON.parse(qasaStored);
        const completedQasas = qasaSubmissions.filter(
          (q: any) => q.approvalStatus === 'completed_sent_to_qp' && q.gateStatus === 'passed' && !q.routedToEisa
        );
        for (const qasa of completedQasas) {
          if (!eisaRecords.some((r) => r.parentQasaId === qasa.id)) {
            eisaRecords.unshift(createEisaRecordFromQasa(qasa));
            markQasAsRouted(qasa.id);
          }
        }
      }
      setRecords(eisaRecords);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eisaRecords));
    } catch (e) { console.error('ExternalEisaValidation: loadRecords error', e); }
  };

  useEffect(() => {
    loadRecords();
    const handleStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY || e.key === QASA_STORAGE_KEY) loadRecords(); };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(loadRecords, 2000);
    return () => { window.removeEventListener('storage', handleStorage); clearInterval(interval); };
  }, []);

  const createEisaRecordFromQasa = (qasa: any): EisaValidationRecord => ({
    id: `EISA_VAL_${Date.now()}_${qasa.id}`, parentQasaId: qasa.id,
    eisaRegNo: `EISA-${qasa.saqaId || Date.now().toString().slice(-6)}`,
    title: qasa.qualificationTitle, saqaId: qasa.saqaId, nqfLevel: qasa.nqfLevel,
    credits: qasa.credits, proposedEisaDate: qasa.proposedDateOfEISA,
    currentStage: 'pending_review', sourceFrom: 'QAS Addendum',
    saqaQualificationDocument: qasa.documents?.saqaQualificationDocument || '',
    curriculumDocument: qasa.documents?.curriculumDocument || '',
    qasAddendum: qasa.documents?.qasAddendum || '',
    createdAt: new Date().toISOString(),
    acknowledgementLetterName: qasa.acknowledgementLetterName,
    finalApprovalLetterName: qasa.finalApprovalLetterName,
    ceoApprovalNotes: qasa.ceoApprovalNotes,
    acknowledgementStatus: qasa.acknowledgementStatus,
  });

  const markQasAsRouted = (qasaId: string) => {
    try {
      const stored = localStorage.getItem(QASA_STORAGE_KEY);
      if (!stored) return;
      const updated = JSON.parse(stored).map((s: any) => s.id === qasaId ? { ...s, routedToEisa: true } : s);
      localStorage.setItem(QASA_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent('storage', { key: QASA_STORAGE_KEY }));
    } catch (e) { console.error('markQasAsRouted error', e); }
  };

  const saveRecords = (updated: EisaValidationRecord[]) => {
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  // ── Filtering: exclude records that have been sent to registration ──
  const visibleRecords = useMemo(
    () => records.filter(r => !recordSentToRegistration(r)),
    [records]
  );

  const filteredRecords = useMemo(() => {
    if (activePageTab === 'pending') return visibleRecords.filter(r => r.currentStage === 'pending_review' || r.currentStage === 'assessment_domain_notified');
    if (activePageTab === 'in_review') return visibleRecords.filter(r => r.currentStage === 'assistant_director_validation' || r.currentStage === 'dd_review');
    if (activePageTab === 'completed') return visibleRecords.filter(r => r.currentStage === 'completed');
    return [];
  }, [visibleRecords, activePageTab]);

  const counts = useMemo(() => ({
    pending: visibleRecords.filter(r => r.currentStage === 'pending_review' || r.currentStage === 'assessment_domain_notified').length,
    inReview: visibleRecords.filter(r => r.currentStage === 'assistant_director_validation' || r.currentStage === 'dd_review').length,
    completed: visibleRecords.filter(r => r.currentStage === 'completed').length,
  }), [visibleRecords]);

  const pendingCount = counts.pending;
  const showOutcomeTab = recordHasOutcome(selectedRecord);
  const showRegTab = recordHasOutcome(selectedRecord);

  useEffect(() => {
    if (counts.completed > 0 && activePageTab === 'pending' && counts.pending === 0) setActivePageTab('completed');
  }, [counts.completed]);

  const openViewModal = (record: EisaValidationRecord, tab: ModalTab = 'details') => {
    setSelectedId(record.id);
    setActiveModalTab(tab);
    setRegData(record.registrationSubmission ?? { eisaRegFileUploaded: false, leisaFileUploaded: false, sorQaReportsUploaded: false, stream: '', leisa: defaultLeisa(record) });
    setIsViewModalOpen(true);
  };

  const closeModal = () => setIsViewModalOpen(false);

  const handleSubmitSchedule = () => {
    if (!selectedRecord) return;
    const updated = records.map((r): EisaValidationRecord => {
      if (r.id !== selectedRecord.id) return r;
      return {
        ...r,
        eisaSchedule: {
          validationDate: scheduleData.validationDate, startTime: scheduleData.startTime,
          endTime: scheduleData.endTime, venue: scheduleData.venue,
          assessorName: scheduleData.assessorName, assessorEmail: scheduleData.assessorEmail,
          notes: scheduleData.notes, scheduleDocumentName: scheduleData.scheduleFile?.name,
          submittedToInternalAt: new Date().toISOString(), internalStatus: 'pending',
        },
        currentStage: 'assessment_domain_notified',
      };
    });
    saveRecords(updated);
    setShowScheduleModal(false);
    setScheduleData({ validationDate: '', startTime: '', endTime: '', venue: '', assessorName: '', assessorEmail: '', notes: '', scheduleFile: null });
    setIsViewModalOpen(false);
  };

  const handleSaveRegistration = () => {
    if (!selectedRecord) return;
    saveRecords(records.map((r) => r.id !== selectedRecord.id ? r : { ...r, registrationSubmission: { ...regData } }));
    showToast('Registration details saved');
  };

  const handleSendToRegistration = () => {
    if (!selectedRecord || !regData.stream) return;
    const finalReg: EisaRegistrationSubmission = { ...regData, sentToRegistrationAt: new Date().toISOString() };

    // Update validation record
    saveRecords(records.map((r) => r.id !== selectedRecord.id ? r : { ...r, registrationSubmission: finalReg }));

    // Create registration record — includes ALL validation data
    const existingReg = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    const regRecords: any[] = existingReg ? JSON.parse(existingReg) : [];
    if (!regRecords.some((r: any) => r.sourceValidationId === selectedRecord.id)) {
      regRecords.unshift({
        id: `ER-${Date.now()}`,
        sourceValidationId: selectedRecord.id,
        // Categorisation
        stream: regData.stream,
        // Core identity
        eisaRegNo: selectedRecord.eisaRegNo,
        title: selectedRecord.title,
        eisaDate: selectedRecord.proposedEisaDate,
        sourceFrom: 'SDP',
        // Qualification
        saqaId: selectedRecord.saqaId,
        nqfLevel: selectedRecord.nqfLevel,
        credits: selectedRecord.credits,
        // Documents
        leisaFile: regData.leisaFileUploaded,
        leisaFileName: regData.leisaFileName,
        sorAndQaReports: regData.sorQaReportsUploaded,
        sorQaReportsFileName: regData.sorQaReportsFileName,
        eisaRegDocument: regData.eisaRegFileUploaded,
        eisaRegFileName: regData.eisaRegFileName,
        // LEISA form
        leisaFormData: regData.leisa,
        // Validation outcome
        outcomeDecision: selectedRecord.outcomeReport?.outcomeDecision,
        outcomeReport: selectedRecord.outcomeReport,
        // Schedule
        eisaSchedule: selectedRecord.eisaSchedule,
        // Letters
        acknowledgementLetterName: selectedRecord.acknowledgementLetterName,
        finalApprovalLetterName: selectedRecord.finalApprovalLetterName,
        ceoApprovalNotes: selectedRecord.ceoApprovalNotes,
        acknowledgementStatus: selectedRecord.acknowledgementStatus,
        // QAS Addendum docs
        saqaQualificationDocument: selectedRecord.saqaQualificationDocument,
        curriculumDocument: selectedRecord.curriculumDocument,
        qasAddendum: selectedRecord.qasAddendum,
        // Stage tracking
        currentStage: 'sdp_submission',
        registrationNumber: '',
        file4Prepared: false,
        sdpListPrepared: false,
        submittedToQaAndQp: false,
        submittedToQpTwoMonthsPrior: false,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(regRecords));
      window.dispatchEvent(new StorageEvent('storage', { key: REGISTRATION_STORAGE_KEY }));
    }

    setShowStreamConfirm(false);
    setIsViewModalOpen(false);
    showToast(`Sent to EISA ${regData.stream === 'trades' ? 'Trades' : 'Non-Trades'} Registration ✓`);
  };

  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-2xl z-[200] flex items-center gap-2';
    el.innerHTML = `<span style="color:#34d399">✓</span> ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const formatDate = (d?: string) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('en-ZA'); } catch { return d; } };
  const formatDateTime = (d?: string) => { if (!d) return '-'; try { return new Date(d).toLocaleString('en-ZA'); } catch { return d; } };

  const allDocsUploaded = regData.eisaRegFileUploaded && regData.leisaFileUploaded && regData.sorQaReportsUploaded;
  const canSend = allDocsUploaded && !!regData.stream && !!regData.leisa.compilerName && !!regData.leisa.sdpName;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-200 font-medium uppercase tracking-widest mb-1">Quality Partner Portal</p>
            <h1 className="text-2xl font-bold">EISA Validation</h1>
            <p className="mt-1 text-sm text-blue-100">Review QAS-approved qualifications and manage EISA validation process</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-xl px-3 py-2">
                <Bell className="h-4 w-4 text-blue-300" />
                <span className="text-xs text-blue-200 font-medium">{pendingCount} pending</span>
              </div>
            )}
            <div className="inline-flex w-fit items-center rounded-xl bg-white/20 backdrop-blur px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-blue-200">Current role</span>
              <span className="ml-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">{activeExternalRole}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {([
          { tab: 'pending', title: 'Pending Review', value: counts.pending, icon: <ClipboardList className="h-5 w-5" />, color: 'from-amber-500 to-orange-600' },
          { tab: 'in_review', title: 'Under Internal Review', value: counts.inReview, icon: <Wrench className="h-5 w-5" />, color: 'from-blue-500 to-indigo-600' },
          { tab: 'completed', title: 'Completed', value: counts.completed, icon: <CheckCircle2 className="h-5 w-5" />, color: 'from-green-500 to-emerald-600' },
        ] as const).map((card) => (
          <button key={card.tab} onClick={() => setActivePageTab(card.tab as EisaValidationTab)}
            className={`rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all text-left w-full ${activePageTab === card.tab ? 'ring-2 ring-blue-500' : ''}`}>
            <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${card.color} items-center justify-center mb-3 text-white`}>{card.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.title}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            {activePageTab === 'pending' ? 'Pending EISA Validations' : activePageTab === 'in_review' ? 'Under Internal Review' : 'Completed Validations'}
          </h2>
          <span className="text-xs text-gray-400">{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</span>
        </div>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><ClipboardList className="h-8 w-8 text-gray-300" /></div>
            <p className="font-medium text-gray-500">No records found</p>
            <p className="text-sm text-gray-400 mt-1">
              {activePageTab === 'pending' ? 'When QAS Addendum applications are approved with Gate PASSED, they will appear here.'
                : activePageTab === 'in_review' ? 'No records are currently under internal review.'
                : 'Records move here once the Deputy Director approves them. Records sent to Registration will appear in the Registration module.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  {['#', 'EISA Reg No', 'Qualification Title', 'SAQA ID', 'NQF Level', 'Stage', 'Outcome', 'Actions'].map(h => (
                    <TableHead key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, idx) => (
                  <TableRow key={record.id} className="hover:bg-blue-50/30 transition-colors group">
                    <TableCell className="text-gray-400 text-xs font-mono">{String(idx + 1).padStart(2, '00')}</TableCell>
                    <TableCell className="font-semibold text-gray-900">{record.eisaRegNo}</TableCell>
                    <TableCell className="max-w-[180px]"><span className="block truncate text-sm text-gray-700" title={record.title}>{record.title}</span></TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">{record.saqaId}</TableCell>
                    <TableCell><span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">{record.nqfLevel}</span></TableCell>
                    <TableCell><StageBadge stage={record.currentStage} /></TableCell>
                    <TableCell>
                      {record.outcomeReport?.reportFinalised ? <OutcomeBadge decision={record.outcomeReport.outcomeDecision} /> : <span className="text-xs text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openViewModal(record, 'details')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-lg hover:bg-blue-100">
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        {recordHasOutcome(record) && (
                          <Button size="sm" onClick={() => openViewModal(record, 'outcome')} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs gap-1">
                            <BarChart3 className="h-3 w-3" /> View Report
                          </Button>
                        )}
                        {recordReadyForRegistration(record) && (
                          <Button size="sm" onClick={() => openViewModal(record, 'registration')} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs gap-1">
                            <ArrowRight className="h-3 w-3" /> Register
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ─── View Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={isViewModalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {selectedRecord && (
            <>
              <div className="sticky top-0 z-10 bg-white border-b px-6 pt-4 pb-0 flex-shrink-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">EISA Validation Details</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedRecord.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StageBadge stage={selectedRecord.currentStage} />
                    <button onClick={closeModal} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="h-4 w-4 text-gray-500" /></button>
                  </div>
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {[
                    { id: 'details', label: 'Application Details', emoji: '📄', show: true },
                    { id: 'schedule', label: 'Validation Schedule', emoji: '📅', show: true },
                    { id: 'outcome', label: 'Validation Report & Outcome', emoji: '📊', show: showOutcomeTab },
                    { id: 'registration', label: 'EISA Registration', emoji: '📋', show: showRegTab },
                  ].filter(t => t.show).map((tab) => (
                    <button key={tab.id} onClick={() => setActiveModalTab(tab.id as ModalTab)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap flex-shrink-0 transition-all ${activeModalTab === tab.id ? 'border-blue-500 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                      <span>{tab.emoji}</span> {tab.label}
                      {tab.id === 'outcome' && showOutcomeTab && <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 inline-block" />}
                      {tab.id === 'registration' && recordReadyForRegistration(selectedRecord) && <span className="ml-1 h-2 w-2 rounded-full bg-indigo-500 inline-block" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">

                {/* ── Application Details ── */}
                {activeModalTab === 'details' && (
                  <div className="p-6 space-y-6">
                    <div className="rounded-2xl border p-4 flex items-center gap-3 bg-blue-50 border-blue-200">
                      <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0"><CheckCircle className="h-5 w-5 text-white" /></div>
                      <div><p className="text-xs text-gray-500 font-medium">Gate Evaluation</p><p className="font-bold text-blue-700">Gate Check Passed — Qualification exists in SAQA registry</p></div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AQP & Qualification</p></div>
                        <div className="px-4 divide-y divide-gray-50">
                          <DetailRow icon={BookOpen} label="Qualification Title" value={selectedRecord.title} />
                          <DetailRow icon={Hash} label="SAQA ID" value={<span className="font-mono">{selectedRecord.saqaId}</span>} />
                          <DetailRow icon={Award} label="NQF Level" value={selectedRecord.nqfLevel} />
                          <DetailRow icon={Hash} label="Credits" value={selectedRecord.credits} />
                        </div>
                      </div>
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Validation Details</p></div>
                        <div className="px-4 divide-y divide-gray-50">
                          <DetailRow icon={Calendar} label="Proposed EISA Date" value={formatDate(selectedRecord.proposedEisaDate)} />
                          <DetailRow icon={CalendarClock} label="Created" value={formatDate(selectedRecord.createdAt)} />
                          {selectedRecord.notifiedAt && <DetailRow icon={Send} label="Notified to Assessment Domain" value={formatDate(selectedRecord.notifiedAt)} />}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents from QAS Addendum</p></div>
                      <div className="divide-y">
                        {[{ label: 'SAQA Qualification Document', val: selectedRecord.saqaQualificationDocument }, { label: 'Curriculum Document', val: selectedRecord.curriculumDocument }, { label: 'QAS Addendum', val: selectedRecord.qasAddendum }].map(({ label, val }) => (
                          <div key={label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-blue-600" /></div><span className="text-sm font-medium text-gray-700">{label}</span></div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-mono">{val || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedRecord.acknowledgementStatus === 'sent_to_quality_partner' && selectedRecord.acknowledgementLetterName && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 overflow-hidden">
                        <div className="px-4 py-3 bg-emerald-100 border-b border-emerald-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Acknowledgement Letter — Received</p></div>
                        <div className="p-4"><div className="flex items-center gap-3 bg-white rounded-xl border border-emerald-200 p-3"><div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0"><Paperclip className="h-5 w-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-900">{selectedRecord.acknowledgementLetterName}</p><p className="text-xs text-gray-500">Approved by CEO</p></div><button onClick={() => alert(`Opening: ${selectedRecord.acknowledgementLetterName}`)} className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap">Open Letter</button></div></div>
                      </div>
                    )}
                    {selectedRecord.finalApprovalLetterName && (
                      <div className="rounded-2xl border border-purple-200 bg-purple-50/50 overflow-hidden">
                        <div className="px-4 py-3 bg-purple-100 border-b border-purple-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-purple-600" /><p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Signed Approval Letter — Received from QCTO</p></div>
                        <div className="p-4"><div className="flex items-center gap-3 bg-white rounded-xl border border-purple-200 p-3"><div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0"><FileSignature className="h-5 w-5 text-white" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-900">{selectedRecord.finalApprovalLetterName}</p><p className="text-xs text-gray-500">Signed by CEO and submitted to QP Portfolio</p></div></div></div>
                      </div>
                    )}
                    {recordHasOutcome(selectedRecord) && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-emerald-600" /><div><p className="text-sm font-semibold text-emerald-800">EISA Validation Report Available</p><div className="mt-1"><OutcomeBadge decision={selectedRecord.outcomeReport!.outcomeDecision} /></div></div></div>
                        <Button size="sm" onClick={() => setActiveModalTab('outcome')} className="bg-emerald-600 hover:bg-emerald-700 gap-1">View Report <ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    )}
                    {recordReadyForRegistration(selectedRecord) && (
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3"><ArrowRight className="h-5 w-5 text-indigo-600" /><p className="text-sm font-semibold text-indigo-800">Ready to proceed to EISA Registration</p></div>
                        <Button size="sm" onClick={() => setActiveModalTab('registration')} className="bg-indigo-600 hover:bg-indigo-700 gap-1">Go to Registration <ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    )}
                    {selectedRecord.currentStage === 'pending_review' && !selectedRecord.eisaSchedule && (
                      <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Available Action</p>
                        <Button onClick={() => setShowScheduleModal(true)} className="bg-blue-600 hover:bg-blue-700 gap-2"><CalendarClock className="h-4 w-4" /> Populate EISA Validation Schedule</Button>
                      </div>
                    )}
                    <div className="rounded-2xl border bg-gray-50 p-4"><p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">Application Status</p><StageBadge stage={selectedRecord.currentStage} /></div>
                  </div>
                )}

                {/* ── Validation Schedule ── */}
                {activeModalTab === 'schedule' && (
                  <div className="p-6 space-y-6">
                    {selectedRecord.eisaSchedule ? (
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-blue-600" /><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">EISA Validation Schedule</p></div>
                        <div className="p-4 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Validation Date:</span><span className="text-sm text-gray-700">{formatDate(selectedRecord.eisaSchedule.validationDate)}</span></div>
                              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Time:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.startTime || '-'} - {selectedRecord.eisaSchedule.endTime || '-'}</span></div>
                              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Venue:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.venue || '-'}</span></div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Assessor:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.assessorName || '-'}</span></div>
                              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Email:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.assessorEmail || '-'}</span></div>
                            </div>
                          </div>
                          {selectedRecord.eisaSchedule.notes && (<div className="p-3 bg-gray-50 rounded-xl border border-gray-200"><p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Notes</p><p className="text-sm text-gray-700">{selectedRecord.eisaSchedule.notes}</p></div>)}
                          <div className="text-xs text-gray-500 flex items-center gap-1"><Send className="h-3 w-3" /> Submitted to Internal: {formatDate(selectedRecord.eisaSchedule.submittedToInternalAt)}</div>
                          {selectedRecord.eisaSchedule.internalStatus === 'pending' && (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-2"><AlertCircle className="h-4 w-4" /><span className="text-sm">Schedule submitted. Waiting for internal team to liaise with Quality Partner.</span></div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><CalendarClock className="h-8 w-8 text-gray-300" /></div>
                        <p className="font-medium text-gray-500">No EISA Validation Schedule</p>
                        <p className="text-sm text-gray-400 mt-1">Please go to the Application Details tab to populate the schedule.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Validation Report & Outcome ── */}
                {activeModalTab === 'outcome' && selectedRecord.outcomeReport?.reportFinalised && (
                  <div className="p-6 space-y-6">
                    <div className={`rounded-2xl border-2 p-6 text-center ${selectedRecord.outcomeReport.outcomeDecision === 'approved' ? 'border-emerald-300 bg-emerald-50' : selectedRecord.outcomeReport.outcomeDecision === 'approved_with_conditions' ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'}`}>
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${selectedRecord.outcomeReport.outcomeDecision === 'approved' ? 'bg-emerald-500' : selectedRecord.outcomeReport.outcomeDecision === 'approved_with_conditions' ? 'bg-amber-500' : 'bg-red-500'}`}>
                        {selectedRecord.outcomeReport.outcomeDecision === 'approved' ? <ThumbsUp className="h-7 w-7 text-white" /> : selectedRecord.outcomeReport.outcomeDecision === 'approved_with_conditions' ? <AlertCircle className="h-7 w-7 text-white" /> : <X className="h-7 w-7 text-white" />}
                      </div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">EISA Validation Outcome</p>
                      <OutcomeBadge decision={selectedRecord.outcomeReport.outcomeDecision} />
                      <p className="text-xs text-gray-500 mt-3">Report finalised by {selectedRecord.outcomeReport.ddReviewedBy} on {formatDateTime(selectedRecord.outcomeReport.reportFinalisedAt)}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualification</p></div>
                        <div className="px-4 divide-y divide-gray-50">
                          <DetailRow icon={BookOpen} label="Qualification Title" value={selectedRecord.title} />
                          <DetailRow icon={Hash} label="SAQA ID" value={<span className="font-mono">{selectedRecord.saqaId}</span>} />
                          <DetailRow icon={Award} label="NQF Level" value={selectedRecord.nqfLevel} />
                          <DetailRow icon={CalendarClock} label="EISA Reg No" value={selectedRecord.eisaRegNo} />
                        </div>
                      </div>
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Validation Info</p></div>
                        <div className="px-4 divide-y divide-gray-50">
                          <DetailRow icon={Calendar} label="Validation Date" value={formatDate(selectedRecord.eisaSchedule?.validationDate)} />
                          <DetailRow icon={MapPin} label="Venue" value={selectedRecord.eisaSchedule?.venue} />
                          <DetailRow icon={UserIcon} label="Assessor" value={selectedRecord.eisaSchedule?.assessorName} />
                          <DetailRow icon={CalendarClock} label="Report Date" value={formatDate(selectedRecord.outcomeReport.reportFinalisedAt)} />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-purple-50 border-b border-purple-200 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-purple-600" /><p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Deputy Director Recommendations</p></div>
                      <div className="p-4 space-y-4">
                        <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recommendations / Feedback</p><div className="p-3 bg-gray-50 rounded-xl border border-gray-200"><p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRecord.outcomeReport.ddRecommendations || '—'}</p></div></div>
                        {selectedRecord.outcomeReport.ddChangesRequired && (
                          <div><p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Changes Required</p><div className="p-3 bg-amber-50 rounded-xl border border-amber-200"><p className="text-sm text-amber-900 whitespace-pre-wrap">{selectedRecord.outcomeReport.ddChangesRequired}</p></div></div>
                        )}
                      </div>
                    </div>
                    {selectedRecord.outcomeReport.outcomeNotes && (
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-600" /><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Outcome Notes / Conditions</p></div>
                        <div className="p-4"><p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRecord.outcomeReport.outcomeNotes}</p></div>
                      </div>
                    )}
                    <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600"><UserIcon className="h-4 w-4 text-gray-400" /><span>Reviewed & approved by <span className="font-semibold text-gray-900">{selectedRecord.outcomeReport.ddReviewedBy || 'Deputy Director'}</span></span></div>
                      <span className="text-xs text-gray-400">{formatDateTime(selectedRecord.outcomeReport.ddReviewedAt)}</span>
                    </div>
                    {recordReadyForRegistration(selectedRecord) && (
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 flex items-center justify-between">
                        <p className="text-sm text-indigo-800 font-medium">Proceed to EISA Registration to submit documents and categorise this qualification.</p>
                        <Button size="sm" onClick={() => setActiveModalTab('registration')} className="bg-indigo-600 hover:bg-indigo-700 gap-1">Go to Registration <ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── EISA Registration Tab ── */}
                {activeModalTab === 'registration' && (
                  <div className="p-6 space-y-6">
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 overflow-hidden">
                      <div className="px-4 py-3 bg-indigo-100 border-b border-indigo-200 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-indigo-700" />
                        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">EISA Registration — Required Steps</p>
                      </div>
                      <p className="px-4 py-3 text-xs text-indigo-700 leading-relaxed">Upload the three required documents, complete the LEISA file details, and categorise as <strong>Trades</strong> or <strong>Non-Trades</strong>. Once submitted the record will move to the Registration module and be removed from this Validation view.</p>
                    </div>

                    {/* Documents */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2"><HardDrive className="h-4 w-4 text-gray-600" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 1 — Upload Required Documents</p></div>
                      <div className="p-4 space-y-4">
                        {[
                          { key: 'eisaReg', label: 'EISA Reg Document', uploaded: regData.eisaRegFileUploaded, fileName: regData.eisaRegFileName, accept: '.pdf,.doc,.docx,.xlsx', desc: 'The official EISA Registration document for this qualification.', onChange: (f: File) => setRegData(p => ({ ...p, eisaRegFileUploaded: true, eisaRegFileName: f.name })) },
                          { key: 'leisa', label: 'LEISA File', uploaded: regData.leisaFileUploaded, fileName: regData.leisaFileName, accept: '.xlsx,.xls', desc: `Learner Enrolment and Readiness for EISA File. Naming: LEISAyyyymmdd-SDP/AC name. Must be Excel (.xlsx) with 43 columns A–AQ.`, onChange: (f: File) => setRegData(p => ({ ...p, leisaFileUploaded: true, leisaFileName: f.name })) },
                          { key: 'sor', label: 'SOR & QA Reports', uploaded: regData.sorQaReportsUploaded, fileName: regData.sorQaReportsFileName, accept: '.pdf,.doc,.docx,.xlsx,.zip', desc: 'Statement of Results and Quality Assurance Reports for this EISA session.', onChange: (f: File) => setRegData(p => ({ ...p, sorQaReportsUploaded: true, sorQaReportsFileName: f.name })) },
                        ].map(({ key, label, uploaded, fileName, accept, desc, onChange }) => (
                          <div key={key} className={`rounded-xl border p-4 ${uploaded ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {uploaded ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <FileText className="h-4 w-4 text-gray-400" />}
                                <span className="text-sm font-semibold text-gray-800">{label}</span>
                                <span className="text-xs text-red-500 font-medium">*Required</span>
                              </div>
                              {uploaded && <span className="text-xs text-emerald-700 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">✓ Uploaded</span>}
                            </div>
                            <p className="text-xs text-gray-500 mb-3">{desc}</p>
                            <Input type="file" accept={accept}
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} className="text-xs" />
                            {fileName && <p className="text-xs text-gray-500 mt-1 truncate">{fileName}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* LEISA Details */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2"><FileText className="h-4 w-4 text-gray-600" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 2 — LEISA File Details (Compulsory Information)</p></div>
                      <div className="p-4 grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Compiler Full Name <span className="text-red-500">*</span></Label><Input value={regData.leisa.compilerName} onChange={(e) => setRegData(p => ({ ...p, leisa: { ...p.leisa, compilerName: e.target.value } }))} placeholder="Name and Surname" /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Compiler Email</Label><Input type="email" value={regData.leisa.compilerEmail} onChange={(e) => setRegData(p => ({ ...p, leisa: { ...p.leisa, compilerEmail: e.target.value } }))} placeholder="compiler@sdp.co.za" /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Compiler Contact Number</Label><Input value={regData.leisa.compilerPhone} onChange={(e) => setRegData(p => ({ ...p, leisa: { ...p.leisa, compilerPhone: e.target.value } }))} placeholder="0xx xxx xxxx" /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Institution Contact Number</Label><Input value={regData.leisa.institutionPhone} onChange={(e) => setRegData(p => ({ ...p, leisa: { ...p.leisa, institutionPhone: e.target.value } }))} placeholder="0xx xxx xxxx" /></div>
                        <div className="space-y-2 md:col-span-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name of Qualification</Label><Input value={regData.leisa.qualificationName} disabled className="bg-gray-50" /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Training Start Date</Label><Input type="date" value={regData.leisa.startDate} onChange={(e) => setRegData(p => ({ ...p, leisa: { ...p.leisa, startDate: e.target.value } }))} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expected Completion Date</Label><Input type="date" value={regData.leisa.expectedCompletionDate} onChange={(e) => setRegData(p => ({ ...p, leisa: { ...p.leisa, expectedCompletionDate: e.target.value } }))} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name of SDP <span className="text-red-500">*</span></Label><Input value={regData.leisa.sdpName} onChange={(e) => setRegData(p => ({ ...p, leisa: { ...p.leisa, sdpName: e.target.value } }))} placeholder="SDP / Institution name" /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Province</Label><Input value={regData.leisa.province} onChange={(e) => setRegData(p => ({ ...p, leisa: { ...p.leisa, province: e.target.value } }))} placeholder="e.g. Gauteng" /></div>
                        <div className="space-y-2 md:col-span-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address of SDP</Label><Input value={regData.leisa.sdpAddress} onChange={(e) => setRegData(p => ({ ...p, leisa: { ...p.leisa, sdpAddress: e.target.value } }))} placeholder="Full address" /></div>
                      </div>
                    </div>

                    {/* Categorise */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2"><Tag className="h-4 w-4 text-gray-600" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 3 — Categorise Qualification <span className="text-red-500">*</span></p></div>
                      <div className="p-4">
                        <p className="text-xs text-gray-500 mb-4">Select the stream. Once sent, this record will move to the Registration module in the selected category and will no longer appear here.</p>
                        <div className="grid grid-cols-2 gap-4">
                          <button type="button" onClick={() => setRegData(p => ({ ...p, stream: 'trades' }))}
                            className={`rounded-2xl border-2 p-5 text-left transition-all ${regData.stream === 'trades' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${regData.stream === 'trades' ? 'bg-blue-500' : 'bg-gray-100'}`}><Wrench className={`h-5 w-5 ${regData.stream === 'trades' ? 'text-white' : 'text-gray-400'}`} /></div>
                              <div><p className={`text-sm font-bold ${regData.stream === 'trades' ? 'text-blue-800' : 'text-gray-700'}`}>EISA Trades</p>{regData.stream === 'trades' && <span className="text-xs text-blue-600 font-medium">Selected ✓</span>}</div>
                            </div>
                            <p className="text-xs text-gray-500">Trade qualifications processed via the Trades Registration stream.</p>
                          </button>
                          <button type="button" onClick={() => setRegData(p => ({ ...p, stream: 'nonTrades' }))}
                            className={`rounded-2xl border-2 p-5 text-left transition-all ${regData.stream === 'nonTrades' ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-violet-300'}`}>
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${regData.stream === 'nonTrades' ? 'bg-violet-500' : 'bg-gray-100'}`}><Layers className={`h-5 w-5 ${regData.stream === 'nonTrades' ? 'text-white' : 'text-gray-400'}`} /></div>
                              <div><p className={`text-sm font-bold ${regData.stream === 'nonTrades' ? 'text-violet-800' : 'text-gray-700'}`}>EISA Non-Trades</p>{regData.stream === 'nonTrades' && <span className="text-xs text-violet-600 font-medium">Selected ✓</span>}</div>
                            </div>
                            <p className="text-xs text-gray-500">Non-trade qualifications processed via the Non-Trades stream.</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t bg-gray-50/80 flex items-center justify-between flex-shrink-0">
                <Button variant="outline" onClick={closeModal}>Close</Button>
                <div className="flex gap-2">
                  {activeModalTab === 'registration' && (
                    <>
                      <Button variant="outline" onClick={handleSaveRegistration} disabled={!regData.leisa.compilerName}>Save Progress</Button>
                      <Button onClick={() => setShowStreamConfirm(true)} disabled={!canSend} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Send to {regData.stream === 'trades' ? 'Trades' : regData.stream === 'nonTrades' ? 'Non-Trades' : '...'} Registration
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <Dialog open={showStreamConfirm} onOpenChange={setShowStreamConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {regData.stream === 'trades' ? <Wrench className="h-5 w-5 text-blue-600" /> : <Layers className="h-5 w-5 text-violet-600" />}
              Confirm Registration Submission
            </DialogTitle>
            <DialogDescription>This will move the qualification to the EISA {regData.stream === 'trades' ? 'Trades' : 'Non-Trades'} Registration module and remove it from the Validation view.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Qualification:</span><span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{selectedRecord?.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">EISA Reg No:</span><span className="font-mono font-medium">{selectedRecord?.eisaRegNo}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Stream:</span><span className={`font-semibold ${regData.stream === 'trades' ? 'text-blue-700' : 'text-violet-700'}`}>{regData.stream === 'trades' ? 'EISA Trades' : 'EISA Non-Trades'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Documents:</span><span className="font-medium text-emerald-700">3 / 3 uploaded</span></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowStreamConfirm(false)}>Cancel</Button>
            <Button onClick={handleSendToRegistration} className={`gap-2 ${regData.stream === 'trades' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-violet-600 hover:bg-violet-700'}`}>
              <ArrowRight className="h-4 w-4" /> Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-blue-600" /> Populate EISA Validation Schedule</DialogTitle>
            <DialogDescription>Fill in the schedule details. This will be submitted to the internal team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3"><p className="text-xs text-blue-700">This schedule will be submitted to the internal team. They will liaise with the Quality Partner to arrange the date of validation and basic logistics.</p></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label className="text-sm font-semibold">Validation Date *</Label><Input type="date" value={scheduleData.validationDate} onChange={(e) => setScheduleData({ ...scheduleData, validationDate: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Start Time *</Label><Input type="time" value={scheduleData.startTime} onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">End Time *</Label><Input type="time" value={scheduleData.endTime} onChange={(e) => setScheduleData({ ...scheduleData, endTime: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Venue *</Label><Input placeholder="e.g., QCTO Boardroom" value={scheduleData.venue} onChange={(e) => setScheduleData({ ...scheduleData, venue: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Assessor Name *</Label><Input placeholder="Full name" value={scheduleData.assessorName} onChange={(e) => setScheduleData({ ...scheduleData, assessorName: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Assessor Email *</Label><Input type="email" placeholder="assessor@email.com" value={scheduleData.assessorEmail} onChange={(e) => setScheduleData({ ...scheduleData, assessorEmail: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label className="text-sm font-semibold">Notes / Instructions</Label><Textarea rows={3} placeholder="Any additional notes..." value={scheduleData.notes} onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })} /></div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Upload Schedule Document (Optional)</Label>
              <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-6 text-center">
                <Upload className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">Select a PDF or DOCX file</p>
                <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setScheduleData({ ...scheduleData, scheduleFile: e.target.files?.[0] || null })} className="max-w-xs mx-auto" />
              </div>
              {scheduleData.scheduleFile && (<div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg"><CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" /><span className="text-sm text-blue-700 font-medium truncate">{scheduleData.scheduleFile.name}</span></div>)}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitSchedule} disabled={!scheduleData.validationDate || !scheduleData.startTime || !scheduleData.endTime || !scheduleData.venue || !scheduleData.assessorName || !scheduleData.assessorEmail} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Send className="h-4 w-4" /> Submit Schedule to Internal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}