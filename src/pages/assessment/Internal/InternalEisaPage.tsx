import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  ClipboardList, FileText, Eye, CheckCircle2, CalendarClock, ShieldCheck,
  Wrench, Layers, Hash, Award, BookOpen, X, CheckCircle, Calendar,
  MapPin, Paperclip, FileSignature, ThumbsUp, AlertCircle, MessageSquare,
  BarChart3, User as UserIcon, Mail, Clock, Send, FolderOpen, RefreshCw,
  Building2, Phone, Tag, HardDrive, ExternalLink, ListChecks, UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 
type EisaTab = 'trades' | 'nonTrades';
 
type RegistrationStage =
  | 'sdp_submission'
  | 'assessment_domain_split'
  | 'assistant_director_validation'
  | 'trades_registered'
  | 'non_trades_prepared'
  | 'completed';
 
type ModalTab = 'details' | 'schedule' | 'outcome' | 'registration' | 'processing';
 
interface EisaRegistrationRecord {
  id: string;
  sourceValidationId?: string;
  
  stream: 'trades' | 'nonTrades';
  eisaRegNo: string;
  title: string;
  eisaDate: string;
  sourceFrom: string;
  createdAt: string;
  saqaId?: string;
  nqfLevel?: string;
  credits?: string;
  leisaFile: boolean;
  leisaFileName?: string;
  sorAndQaReports: boolean;
  sorQaReportsFileName?: string;
  eisaRegDocument: boolean;
  eisaRegFileName?: string;
  leisaFormData?: {
    compilerName: string; compilerEmail: string; compilerPhone: string;
    institutionPhone: string; qualificationName: string; startDate: string;
    expectedCompletionDate: string; sdpName: string; sdpAddress: string; province: string;
  };
  outcomeDecision?: string;
  outcomeReport?: {
    ddRecommendations: string; ddChangesRequired: string; outcomeDecision: string;
    outcomeNotes: string; ddReviewedBy: string; ddReviewedAt: string;
    reportFinalised: boolean; reportFinalisedAt?: string;
  };
  eisaSchedule?: {
    validationDate: string; startTime: string; endTime: string; venue: string;
    assessorName: string; assessorEmail: string; notes: string;
    scheduleDocumentName?: string; submittedToInternalAt?: string;
    internalStatus?: string;
    qpContactPerson?: string; qpContactNumber?: string; qpContactEmail?: string;
    validationConfirmed?: boolean; logisticsArranged?: boolean;
    internalNotes?: string; internalUpdatedBy?: string; internalUpdatedAt?: string;
    instrumentValidation?: any;
  };
  saqaQualificationDocument?: string;
  curriculumDocument?: string;
  qasAddendum?: string;
  acknowledgementLetterName?: string | null;
  finalApprovalLetterName?: string | null;
  ceoApprovalNotes?: string;
  acknowledgementStatus?: string;
  currentStage: RegistrationStage;
  registrationNumber?: string;
  validationStatus?: 'pending' | 'validated';
  file4Prepared: boolean;
  sdpListPrepared: boolean;
  submittedToQaAndQp: boolean;
  submittedToQpTwoMonthsPrior: boolean;
  submittedToExternalQp?: boolean;
  // Processing workflow state for Trades
  tradesDocValidated?: boolean;
  tradesRegNoCreated?: boolean;
  tradesSubmittedToQp?: boolean;
  tradesRegNo?: string;
  // Processing workflow state for NonTrades
  nonTradesDocValidated?: boolean;
  nonTradesFile4Prepared?: boolean;
  nonTradesFile4SubmittedToQp?: boolean;
  nonTradesSdpListPrepared?: boolean;
  nonTradesSdpListSubmittedToQaQp?: boolean;
  nonTradesSubmittedToExternalQp?: boolean;
  // Processing notes
  processingNotes?: string;
  processingCompletedAt?: string;
  processingCompletedBy?: string;
}
 
const STORAGE_KEY = 'eisa_registration_records';
 
// ─── Sub-components ──────────────────────────────────────────────────────────
 
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
 
function RegistrationStageBadge({ stage }: { stage: RegistrationStage }) {
  const map: Record<RegistrationStage, { label: string; cls: string }> = {
    sdp_submission:              { label: 'SDP Submission',              cls: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
    assessment_domain_split:     { label: 'Assessment Domain Split',     cls: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
    assistant_director_validation: { label: 'Awaiting Processing',       cls: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
    trades_registered:           { label: 'Trades — Registered',         cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
    non_trades_prepared:         { label: 'Non-Trades — Prepared',       cls: 'bg-violet-50 text-violet-700 ring-violet-600/20' },
    completed:                   { label: 'Completed',                   cls: 'bg-green-50 text-green-700 ring-green-600/20' },
  };
  const d = map[stage] ?? { label: stage, cls: 'bg-gray-50 text-gray-700 ring-gray-600/20' };
  return <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ring-1 ring-inset ${d.cls}`}>{d.label}</span>;
}
 
function OutcomeDecisionBadge({ decision }: { decision?: string }) {
  if (!decision) return null;
  const map: Record<string, { label: string; cls: string }> = {
    approved:                { label: '✓ Approved',                  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    approved_with_conditions:{ label: '⚠ Approved with Conditions',  cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    not_approved:            { label: '✗ Not Approved',              cls: 'bg-red-100 text-red-700 border-red-200' },
  };
  const d = map[decision];
  if (!d) return null;
  return <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${d.cls}`}>{d.label}</span>;
}
 
function MiniDocBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
      {ok ? '✓' : '○'} {label}
    </span>
  );
}
 
function StepCard({ step, done, label, description, children }: { step: number; done: boolean; label: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${done ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200 bg-white'}`}>
      <div className={`px-4 py-3 flex items-center gap-3 ${done ? 'bg-emerald-100/60' : 'bg-gray-50'}`}>
        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {done ? '✓' : step}
        </div>
        <div>
          <p className={`text-sm font-semibold ${done ? 'text-emerald-800' : 'text-gray-700'}`}>{label}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {children && <div className="p-4">{children}</div>}
    </div>
  );
}
 
// ─── Main Component ───────────────────────────────────────────────────────────
 
export default function InternalEisaPage() {
  const [activeTab, setActiveTab] = useState<EisaTab>('trades');
  const [records, setRecords] = useState<EisaRegistrationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('details');
  const { currentRole } = useApp();
 const EXTERNAL_REGISTRATION_KEY = 'eisa_registration_records';
  // Processing form state
  const [tradesRegNo, setTradesRegNo] = useState('');
  const [processingNotes, setProcessingNotes] = useState('');
 
  const selectedRecord = useMemo(
    () => (selectedId ? records.find(r => r.id === selectedId) ?? null : null),
    [selectedId, records]
  );
 
  useEffect(() => {
    loadRecords();
    const onStorage = (e: StorageEvent) => { if (!e.key || e.key === STORAGE_KEY) loadRecords(); };
    window.addEventListener('storage', onStorage);
    const interval = setInterval(loadRecords, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
  }, []);
 
  const loadRecords = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const all: EisaRegistrationRecord[] = stored ? JSON.parse(stored) : [];
      setRecords(all.filter(r => r.currentStage !== 'sdp_submission'));
    } catch (e) {
      console.error('InternalEisaPage: loadRecords error', e);
    }
  };
 
  const saveRecords = (updated: EisaRegistrationRecord[]) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all: EisaRegistrationRecord[] = stored ? JSON.parse(stored) : [];
    const merged = all.map(r => updated.find(u => u.id === r.id) ?? r);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    setRecords(merged.filter(r => r.currentStage !== 'sdp_submission'));
    showToast('Saved successfully');
  };
 
  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-2xl z-[200] flex items-center gap-2';
    el.innerHTML = `<span style="color:#34d399">✓</span> ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };
 
  const filteredRecords = useMemo(
    () => records.filter(r => r.stream === activeTab),
    [records, activeTab]
  );
 
  const counts = useMemo(() => ({
    trades:    records.filter(r => r.stream === 'trades').length,
    nonTrades: records.filter(r => r.stream === 'nonTrades').length,
    files:     records.filter(r => r.eisaRegDocument && r.leisaFile && r.sorAndQaReports).length,
  }), [records]);
 
  // ── Trades processing steps ──────────────────────────────────────────────────
 
const handleTradesStep = (recordId: string, field: keyof EisaRegistrationRecord, value: any) => {
  const updated = records.map(r => r.id === recordId ? { ...r, [field]: value } : r);
  const record = updated.find(r => r.id === recordId);
  saveRecords(updated);
  
  // If this is marking as submitted to QP, send to external
  if (field === 'tradesSubmittedToQp' && value === true && record) {
    sendToExternalEisaRegistration(record, 'trades_submitted_to_qp');
  }
};
 
  const handleTradesCreateRegNo = (recordId: string) => {
    if (!tradesRegNo.trim()) return;
    const updated = records.map(r =>
      r.id === recordId ? {
        ...r,
        tradesRegNo: tradesRegNo.trim(),
        tradesRegNoCreated: true,
        registrationNumber: tradesRegNo.trim(),
      } : r
    );
    saveRecords(updated);
    setTradesRegNo('');
  };
 
  const handleTradesComplete = (recordId: string) => {
    const rec = records.find(r => r.id === recordId);
    if (!rec?.tradesDocValidated || !rec?.tradesRegNoCreated || !rec?.tradesSubmittedToQp) return;
    const updated = records.map(r =>
      r.id === recordId ? {
        ...r,
        currentStage: 'completed' as RegistrationStage,
        processingCompletedAt: new Date().toISOString(),
        processingCompletedBy: currentRole,
        processingNotes,
        validationStatus: 'validated' as const,
      } : r
    );
    saveRecords(updated);
    setProcessingNotes('');
  };
 // Add this function to send data to external EISA Registration
// Replace the entire sendToExternalEisaRegistration function with this:
const sendToExternalEisaRegistration = (record: EisaRegistrationRecord, submissionType: 'trades_submitted_to_qp' | 'non_trades_submitted_to_external') => {
  console.log('sendToExternalEisaRegistration called with:', { recordId: record.id, submissionType });
  try {
    const stored = localStorage.getItem(EXTERNAL_REGISTRATION_KEY);
    let externalRecords = stored ? JSON.parse(stored) : [];
    console.log('Existing external records:', externalRecords.length);
    
    // Check if this record already exists in external storage by sourceInternalId
    const existingIndex = externalRecords.findIndex((r: any) => r.sourceInternalId === record.id);
    
    // Also check by the original internal ID (if the record was created from validation)
    const existingByOriginalId = externalRecords.findIndex((r: any) => r.sourceValidationId === record.sourceValidationId);
    const indexToUpdate = existingIndex !== -1 ? existingIndex : existingByOriginalId;
    
    if (indexToUpdate !== -1) {
      // UPDATE existing record with the new processing data
      console.log('Updating existing external record at index:', indexToUpdate);
      const updatedRecord = {
        ...externalRecords[indexToUpdate],
        // Update with the latest internal processing data
        tradesDocValidated: record.tradesDocValidated,
        tradesRegNoCreated: record.tradesRegNoCreated,
        tradesSubmittedToQp: record.tradesSubmittedToQp,
        tradesRegNo: record.tradesRegNo,
        nonTradesDocValidated: record.nonTradesDocValidated,
        nonTradesFile4Prepared: record.nonTradesFile4Prepared,
        nonTradesFile4SubmittedToQp: record.nonTradesFile4SubmittedToQp,
        nonTradesSdpListPrepared: record.nonTradesSdpListPrepared,
        nonTradesSdpListSubmittedToQaQp: record.nonTradesSdpListSubmittedToQaQp,
        nonTradesSubmittedToExternalQp: record.nonTradesSubmittedToExternalQp,
        registrationNumber: record.registrationNumber || externalRecords[indexToUpdate].registrationNumber,
        validationStatus: record.validationStatus || externalRecords[indexToUpdate].validationStatus,
        processingNotes: record.processingNotes || externalRecords[indexToUpdate].processingNotes,
        processingCompletedAt: record.processingCompletedAt || externalRecords[indexToUpdate].processingCompletedAt,
        processingCompletedBy: record.processingCompletedBy || externalRecords[indexToUpdate].processingCompletedBy,
        submissionType: submissionType,
        updatedFromInternalAt: new Date().toISOString(),
        // Don't change the stage if it's already past sdp_submission
        currentStage: externalRecords[indexToUpdate].currentStage === 'sdp_submission' && (record.tradesSubmittedToQp || record.nonTradesSubmittedToExternalQp) 
          ? 'sdp_submission' 
          : externalRecords[indexToUpdate].currentStage
      };
      
      externalRecords[indexToUpdate] = updatedRecord;
      localStorage.setItem(EXTERNAL_REGISTRATION_KEY, JSON.stringify(externalRecords));
      window.dispatchEvent(new StorageEvent('storage', { key: EXTERNAL_REGISTRATION_KEY }));
      console.log('Successfully updated external record');
      showToast(`Updated External EISA Registration successfully!`);
    } else {
      // CREATE new record if it doesn't exist
      console.log('Creating new external record');
      const externalRecord = {
        id: `ext_${record.id}_${Date.now()}`,
        sourceInternalId: record.id,
        sourceValidationId: record.sourceValidationId,
        stream: record.stream,
        eisaRegNo: record.eisaRegNo,
        title: record.title,
        eisaDate: record.eisaDate,
        sourceFrom: record.sourceFrom,
        createdAt: new Date().toISOString(),
        saqaId: record.saqaId,
        nqfLevel: record.nqfLevel,
        credits: record.credits,
        saqaQualificationDocument: record.saqaQualificationDocument,
        curriculumDocument: record.curriculumDocument,
        qasAddendum: record.qasAddendum,
        acknowledgementLetterName: record.acknowledgementLetterName,
        finalApprovalLetterName: record.finalApprovalLetterName,
        ceoApprovalNotes: record.ceoApprovalNotes,
        acknowledgementStatus: record.acknowledgementStatus,
        leisaFile: record.leisaFile,
        leisaFileName: record.leisaFileName,
        sorAndQaReports: record.sorAndQaReports,
        sorQaReportsFileName: record.sorQaReportsFileName,
        eisaRegDocument: record.eisaRegDocument,
        eisaRegFileName: record.eisaRegFileName,
        leisaFormData: record.leisaFormData,
        outcomeDecision: record.outcomeDecision,
        outcomeReport: record.outcomeReport,
        eisaSchedule: record.eisaSchedule,
        currentStage: 'sdp_submission',
        registrationNumber: record.registrationNumber,
        file4Prepared: record.file4Prepared,
        sdpListPrepared: record.sdpListPrepared,
        submittedToQaAndQp: record.submittedToQaAndQp,
        submittedToQpTwoMonthsPrior: record.submittedToQpTwoMonthsPrior,
        submissionType: submissionType,
        submittedToExternalAt: new Date().toISOString(),
        // Add processing fields
        tradesDocValidated: record.tradesDocValidated,
        tradesRegNoCreated: record.tradesRegNoCreated,
        tradesSubmittedToQp: record.tradesSubmittedToQp,
        tradesRegNo: record.tradesRegNo,
        nonTradesDocValidated: record.nonTradesDocValidated,
        nonTradesFile4Prepared: record.nonTradesFile4Prepared,
        nonTradesFile4SubmittedToQp: record.nonTradesFile4SubmittedToQp,
        nonTradesSdpListPrepared: record.nonTradesSdpListPrepared,
        nonTradesSdpListSubmittedToQaQp: record.nonTradesSdpListSubmittedToQaQp,
        nonTradesSubmittedToExternalQp: record.nonTradesSubmittedToExternalQp,
        validationStatus: record.validationStatus,
        processingNotes: record.processingNotes,
        processingCompletedAt: record.processingCompletedAt,
        processingCompletedBy: record.processingCompletedBy,
      };
      
      externalRecords.push(externalRecord);
      localStorage.setItem(EXTERNAL_REGISTRATION_KEY, JSON.stringify(externalRecords));
      window.dispatchEvent(new StorageEvent('storage', { key: EXTERNAL_REGISTRATION_KEY }));
      console.log('Successfully created new external record. Total records now:', externalRecords.length);
      showToast(`Sent to External EISA Registration successfully!`);
    }
  } catch (error) {
    console.error('Error sending to external:', error);
    showToast('Error sending to external registration.');
  }
};
 
 const handleNonTradesStep = (recordId: string, field: keyof EisaRegistrationRecord, value: any) => {
  const updated = records.map(r => r.id === recordId ? { ...r, [field]: value } : r);
  const record = updated.find(r => r.id === recordId);
  saveRecords(updated);
  
  // If this is marking as submitted to external QPs, send to external
  if (field === 'nonTradesSubmittedToExternalQp' && value === true && record) {
    sendToExternalEisaRegistration(record, 'non_trades_submitted_to_external');
  }
};
 
  const handleNonTradesComplete = (recordId: string) => {
    const rec = records.find(r => r.id === recordId);
    if (!rec?.nonTradesDocValidated || !rec?.nonTradesFile4Prepared || !rec?.nonTradesFile4SubmittedToQp || !rec?.nonTradesSdpListPrepared || !rec?.nonTradesSdpListSubmittedToQaQp || !rec?.nonTradesSubmittedToExternalQp) return;
    const updated = records.map(r =>
      r.id === recordId ? {
        ...r,
        currentStage: 'completed' as RegistrationStage,
        file4Prepared: true, sdpListPrepared: true, submittedToQaAndQp: true,
        submittedToQpTwoMonthsPrior: true, submittedToExternalQp: true,
        validationStatus: 'validated' as const,
        processingCompletedAt: new Date().toISOString(),
        processingCompletedBy: currentRole,
        processingNotes,
      } : r
    );
    saveRecords(updated);
    setProcessingNotes('');
  };
 
  const openModal = (record: EisaRegistrationRecord, tab: ModalTab = 'details') => {
    setSelectedId(record.id);
    setActiveModalTab(tab);
    setTradesRegNo(record.tradesRegNo ?? '');
    setProcessingNotes(record.processingNotes ?? '');
  };
 
  const closeModal = () => setSelectedId(null);
 
  const formatDate     = (d?: string) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('en-ZA'); }  catch { return d ?? '-'; } };
  const formatDateTime = (d?: string) => { if (!d) return '-'; try { return new Date(d).toLocaleString('en-ZA'); }      catch { return d ?? '-'; } };
 
  const hasSchedule = !!(selectedRecord?.eisaSchedule);
  const hasOutcome  = !!(selectedRecord?.outcomeReport?.reportFinalised);
  const outcomeDecision = selectedRecord?.outcomeReport?.outcomeDecision ?? '';
 
  const stats = useMemo(() => [
    { title: 'Total Registrations', value: counts.trades + counts.nonTrades, icon: <ClipboardList className="h-5 w-5" />, color: 'from-red-500 to-rose-600' },
    { title: 'Supporting Files',    value: counts.files,                     icon: <FileText className="h-5 w-5" />,     color: 'from-blue-500 to-indigo-600' },
    { title: 'Completed',           value: records.filter(r => r.currentStage === 'completed').length, icon: <CheckCircle2 className="h-5 w-5" />, color: 'from-green-500 to-emerald-600' },
  ], [records, counts]);
 
  // ── Determine if all trades steps are done ───────────────────────────────────
  const isTradesAllDone = (r: EisaRegistrationRecord) =>
    !!(r.tradesDocValidated && r.tradesRegNoCreated && r.tradesSubmittedToQp);
 
  // ── Determine if all non-trades steps are done ───────────────────────────────
  const isNonTradesAllDone = (r: EisaRegistrationRecord) =>
    !!(r.nonTradesDocValidated && r.nonTradesFile4Prepared && r.nonTradesFile4SubmittedToQp && r.nonTradesSdpListPrepared && r.nonTradesSdpListSubmittedToQaQp && r.nonTradesSubmittedToExternalQp);
 
  return (
    <div className="space-y-6">
 
      {/* ── Gradient Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-red-200 font-medium uppercase tracking-widest mb-1">Internal Portal</p>
            <h1 className="text-2xl font-bold">EISA Registration</h1>
            <p className="mt-1 text-sm text-red-100">Manage EISA registration streams — records arrive here after DD validation approval</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => { loadRecords(); showToast('Refreshed'); }} className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <div className="inline-flex w-fit items-center rounded-xl bg-white/20 backdrop-blur px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-red-200">Current role</span>
              <span className="ml-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">{currentRole || 'Assistant Director'}</span>
            </div>
          </div>
        </div>
      </div>
 
      {/* ── Stats Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((card) => (
          <div key={card.title} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${card.color} items-center justify-center mb-3 text-white`}>{card.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.title}</p>
          </div>
        ))}
      </div>
 
      {/* ── Tab card ── */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50/80 px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button type="button" onClick={() => setActiveTab('trades')}
              className={`rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'trades' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Wrench className="h-4 w-4" /> EISA Trades
              {counts.trades > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'trades' ? 'bg-white/30' : 'bg-red-100 text-red-700'}`}>{counts.trades}</span>}
            </button>
            <button type="button" onClick={() => setActiveTab('nonTrades')}
              className={`rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'nonTrades' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Layers className="h-4 w-4" /> EISA Non-Trades
              {counts.nonTrades > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'nonTrades' ? 'bg-white/30' : 'bg-red-100 text-red-700'}`}>{counts.nonTrades}</span>}
            </button>
          </div>
          <span className="text-xs text-gray-400">{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</span>
        </div>
 
        <div className="px-6 pt-4 pb-2">
          <h2 className="text-base font-semibold text-gray-900">{activeTab === 'trades' ? 'EISA Trades' : 'EISA Non-Trades'}</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {activeTab === 'trades'
              ? 'Validate documentation, create a Registration No and submit to the Quality Partner.'
              : 'Validate documentation, Prepare File 4, prepare SDP list and submit to QA, QP and External Quality Partners.'}
          </p>
        </div>
 
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              {activeTab === 'trades' ? <Wrench className="h-8 w-8 text-gray-300" /> : <Layers className="h-8 w-8 text-gray-300" />}
            </div>
            <p className="font-medium text-gray-500">No {activeTab === 'trades' ? 'Trades' : 'Non-Trades'} registrations yet</p>
            <p className="text-sm text-gray-400 mt-1">Records arrive here after the DD approves on the Validation Management page.</p>
            <Button onClick={() => { loadRecords(); showToast('Refreshed'); }} variant="outline" className="mt-4 gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  {['#', 'Registration', 'Qualification', 'Documents', 'Validation Outcome', 'Stage', 'Actions'].map(h => (
                    <TableHead key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, idx) => (
                  <TableRow key={record.id} className="hover:bg-red-50/30 transition-colors group">
                    <TableCell className="text-gray-400 text-xs font-mono">{String(idx + 1).padStart(2, '0')}</TableCell>
                    <TableCell className="align-top">
                      <div className="font-semibold text-gray-900">{record.eisaRegNo}</div>
                      <div className="mt-0.5 text-xs text-gray-500">{formatDate(record.eisaDate)}</div>
                      {record.registrationNumber && (
                        <div className="mt-1 text-xs font-mono font-bold text-emerald-700">{record.registrationNumber}</div>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-sm text-gray-700 truncate max-w-[180px]" title={record.title}>{record.title}</div>
                      {record.saqaId && <div className="text-xs text-gray-400 font-mono mt-0.5">SAQA: {record.saqaId}</div>}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1.5">
                        <MiniDocBadge ok={record.eisaRegDocument} label="EISA Reg" />
                        <MiniDocBadge ok={record.leisaFile}       label="LEISA" />
                        <MiniDocBadge ok={record.sorAndQaReports} label="SOR & QA" />
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <OutcomeDecisionBadge decision={record.outcomeDecision} />
                    </TableCell>
                    <TableCell className="align-top">
                      <RegistrationStageBadge stage={record.currentStage} />
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openModal(record)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-lg hover:bg-red-100">
                          <Eye className="h-4 w-4 text-red-600" />
                        </Button>
                        {record.currentStage !== 'completed' && (
                          <Button size="sm" onClick={() => openModal(record, 'processing')}
                            className="bg-red-600 hover:bg-red-700 h-8 text-xs gap-1">
                            <ListChecks className="h-3.5 w-3.5" /> Process
                          </Button>
                        )}
                        {record.currentStage === 'completed' && (
                          <Button size="sm" variant="outline" onClick={() => openModal(record, 'details')}
                            className="h-8 text-xs gap-1 border-emerald-300 text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> View
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
 
      {/* ─────────────────────────────────────────────────────────────────
          FULL DETAIL MODAL
      ───────────────────────────────────────────────────────────────── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
 
            {/* Sticky header + tabs */}
            <div className="sticky top-0 z-10 bg-white border-b px-6 pt-5 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {selectedRecord.stream === 'trades' ? <Wrench className="h-5 w-5 text-blue-600" /> : <Layers className="h-5 w-5 text-violet-600" />}
                    {selectedRecord.eisaRegNo}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">{selectedRecord.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <RegistrationStageBadge stage={selectedRecord.currentStage} />
                  <button type="button" onClick={closeModal} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {([
                  { id: 'details',      label: 'Application Details',        emoji: '📄', show: true },
                  { id: 'schedule',     label: 'Validation Schedule',         emoji: '📅', show: hasSchedule },
                  { id: 'outcome',      label: 'Validation Report & Outcome', emoji: '📊', show: hasOutcome },
                  { id: 'registration', label: 'Registration Docs',           emoji: '📋', show: true },
                  { id: 'processing',   label: selectedRecord.stream === 'trades' ? 'Trades Processing' : 'Non-Trades Processing', emoji: selectedRecord.stream === 'trades' ? '🔧' : '📂', show: true },
                ] as { id: ModalTab; label: string; emoji: string; show: boolean }[]).filter(t => t.show).map((tab) => (
                  <button key={tab.id} type="button" onClick={() => setActiveModalTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap flex-shrink-0 transition-all ${
                      activeModalTab === tab.id ? 'border-red-500 text-red-700 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}>
                    <span>{tab.emoji}</span> {tab.label}
                    {tab.id === 'outcome' && hasOutcome && <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 inline-block" />}
                    {tab.id === 'processing' && selectedRecord.currentStage === 'completed' && <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 inline-block" />}
                  </button>
                ))}
              </div>
            </div>
 
            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
 
              {/* ── Application Details ── */}
              {activeModalTab === 'details' && (
                <div className="p-6 space-y-6">
                  <div className="rounded-2xl border p-4 flex items-center gap-3 bg-blue-50 border-blue-200">
                    <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Gate Evaluation</p>
                      <p className="font-bold text-blue-700">Gate Check Passed — Qualification exists in SAQA registry</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AQP & Qualification</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={BookOpen}     label="Qualification Title" value={selectedRecord.title} />
                        <DetailRow icon={Hash}         label="SAQA ID"             value={<span className="font-mono">{selectedRecord.saqaId}</span>} />
                        <DetailRow icon={Award}        label="NQF Level"           value={selectedRecord.nqfLevel} />
                        <DetailRow icon={Hash}         label="Credits"             value={selectedRecord.credits} />
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registration Details</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={Calendar}      label="Proposed EISA Date" value={formatDate(selectedRecord.eisaDate)} />
                        <DetailRow icon={CalendarClock} label="Submitted"           value={formatDate(selectedRecord.createdAt)} />
                        <DetailRow icon={Tag}           label="Stream"              value={
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${selectedRecord.stream === 'trades' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                            {selectedRecord.stream === 'trades' ? <Wrench className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                            {selectedRecord.stream === 'trades' ? 'Trades' : 'Non-Trades'}
                          </span>
                        } />
                        {selectedRecord.registrationNumber && (
                          <DetailRow icon={CheckCircle2} label="Registration Number" value={<span className="font-mono font-bold text-emerald-700">{selectedRecord.registrationNumber}</span>} />
                        )}
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
                      <div className="p-4">
                        <div className="flex items-center gap-3 bg-white rounded-xl border border-emerald-200 p-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0"><Paperclip className="h-5 w-5 text-white" /></div>
                          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-900">{selectedRecord.acknowledgementLetterName}</p><p className="text-xs text-gray-500">Approved by CEO</p></div>
                        </div>
                        {selectedRecord.ceoApprovalNotes && (<div className="mt-3"><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">CEO Approval Notes</p><p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-emerald-100 whitespace-pre-wrap">{selectedRecord.ceoApprovalNotes}</p></div>)}
                      </div>
                    </div>
                  )}
                  {selectedRecord.finalApprovalLetterName && (
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/50 overflow-hidden">
                      <div className="px-4 py-3 bg-purple-100 border-b border-purple-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-purple-600" /><p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Signed Approval Letter — Received from QCTO</p></div>
                      <div className="p-4">
                        <div className="flex items-center gap-3 bg-white rounded-xl border border-purple-200 p-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0"><FileSignature className="h-5 w-5 text-white" /></div>
                          <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-gray-900">{selectedRecord.finalApprovalLetterName}</p><p className="text-xs text-gray-500">Signed by CEO and submitted to QP Portfolio</p></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl border bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">Current Status</p>
                    <RegistrationStageBadge stage={selectedRecord.currentStage} />
                  </div>
                </div>
              )}
 
              {/* ── Validation Schedule ── */}
              {activeModalTab === 'schedule' && selectedRecord.eisaSchedule && (
                <div className="p-6 space-y-6">
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-blue-600" /><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">EISA Validation Schedule</p></div>
                    <div className="p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Validation Date:</span><span className="text-sm text-gray-700">{formatDate(selectedRecord.eisaSchedule.validationDate)}</span></div>
                          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Time:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.startTime || '-'} – {selectedRecord.eisaSchedule.endTime || '-'}</span></div>
                          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Venue:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.venue || '-'}</span></div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Assessor:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.assessorName || '-'}</span></div>
                          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Email:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.assessorEmail || '-'}</span></div>
                          {selectedRecord.eisaSchedule.scheduleDocumentName && (
                            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Schedule Doc:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.scheduleDocumentName}</span></div>
                          )}
                        </div>
                      </div>
                      {selectedRecord.eisaSchedule.notes && (<div className="p-3 bg-gray-50 rounded-xl border border-gray-200"><p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">SDP Notes</p><p className="text-sm text-gray-700">{selectedRecord.eisaSchedule.notes}</p></div>)}
                      <div className="text-xs text-gray-500 flex items-center gap-1"><Send className="h-3 w-3" /> Submitted by SDP: {formatDate(selectedRecord.eisaSchedule.submittedToInternalAt)}</div>
                      {selectedRecord.eisaSchedule.qpContactPerson && (
                        <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">Internal Liaison Details</p>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-600" /><span className="text-sm font-medium">QP Contact:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.qpContactPerson}</span></div>
                            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-indigo-600" /><span className="text-sm font-medium">Contact Number:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.qpContactNumber}</span></div>
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-indigo-600" /><span className="text-sm font-medium">Email:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.qpContactEmail}</span></div>
                            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-indigo-600" /><span className="text-sm font-medium">Validation Confirmed:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.validationConfirmed ? 'Yes' : 'No'}</span></div>
                          </div>
                          {selectedRecord.eisaSchedule.internalNotes && (<div className="mt-3 p-2 bg-white rounded-lg"><p className="text-xs text-indigo-600 mb-1">Liaison Notes:</p><p className="text-sm text-gray-700">{selectedRecord.eisaSchedule.internalNotes}</p></div>)}
                          <div className="mt-3 text-xs text-gray-500">Liaised by: {selectedRecord.eisaSchedule.internalUpdatedBy} on {formatDateTime(selectedRecord.eisaSchedule.internalUpdatedAt)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
 
              {/* ── Validation Report & Outcome ── */}
              {activeModalTab === 'outcome' && selectedRecord.outcomeReport?.reportFinalised && (
                <div className="p-6 space-y-6">
                  <div className={`rounded-2xl border-2 p-6 text-center ${outcomeDecision === 'approved' ? 'border-emerald-300 bg-emerald-50' : outcomeDecision === 'approved_with_conditions' ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'}`}>
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${outcomeDecision === 'approved' ? 'bg-emerald-500' : outcomeDecision === 'approved_with_conditions' ? 'bg-amber-500' : 'bg-red-500'}`}>
                      {outcomeDecision === 'approved' ? <ThumbsUp className="h-7 w-7 text-white" /> : outcomeDecision === 'approved_with_conditions' ? <AlertCircle className="h-7 w-7 text-white" /> : <X className="h-7 w-7 text-white" />}
                    </div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">EISA Validation Outcome</p>
                    <OutcomeDecisionBadge decision={outcomeDecision} />
                    <p className="text-xs text-gray-500 mt-3">Report finalised by {selectedRecord.outcomeReport.ddReviewedBy} on {formatDateTime(selectedRecord.outcomeReport.reportFinalisedAt)}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualification</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={BookOpen}     label="Qualification Title" value={selectedRecord.title} />
                        <DetailRow icon={Hash}         label="SAQA ID"             value={<span className="font-mono">{selectedRecord.saqaId}</span>} />
                        <DetailRow icon={Award}        label="NQF Level"           value={selectedRecord.nqfLevel} />
                        <DetailRow icon={CalendarClock} label="EISA Reg No"        value={selectedRecord.eisaRegNo} />
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Validation Info</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={Calendar}     label="Validation Date" value={formatDate(selectedRecord.eisaSchedule?.validationDate)} />
                        <DetailRow icon={MapPin}       label="Venue"           value={selectedRecord.eisaSchedule?.venue} />
                        <DetailRow icon={UserIcon}     label="Assessor"        value={selectedRecord.eisaSchedule?.assessorName} />
                        <DetailRow icon={CalendarClock} label="Report Date"    value={formatDate(selectedRecord.outcomeReport.reportFinalisedAt)} />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-purple-50 border-b border-purple-200 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-purple-600" /><p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Deputy Director Recommendations</p></div>
                    <div className="p-4 space-y-4">
                      <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recommendations / Feedback</p><div className="p-3 bg-gray-50 rounded-xl border border-gray-200"><p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRecord.outcomeReport.ddRecommendations || '—'}</p></div></div>
                      {selectedRecord.outcomeReport.ddChangesRequired && (<div><p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Changes Required</p><div className="p-3 bg-amber-50 rounded-xl border border-amber-200"><p className="text-sm text-amber-900 whitespace-pre-wrap">{selectedRecord.outcomeReport.ddChangesRequired}</p></div></div>)}
                      {selectedRecord.outcomeReport.outcomeNotes && (<div><p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Outcome Notes / Conditions</p><div className="p-3 bg-blue-50 rounded-xl border border-blue-200"><p className="text-sm text-blue-900 whitespace-pre-wrap">{selectedRecord.outcomeReport.outcomeNotes}</p></div></div>)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><UserIcon className="h-4 w-4 text-gray-400" /><span>Reviewed & approved by <span className="font-semibold text-gray-900">{selectedRecord.outcomeReport.ddReviewedBy || 'Deputy Director'}</span></span></div>
                    <span className="text-xs text-gray-400">{formatDateTime(selectedRecord.outcomeReport.ddReviewedAt)}</span>
                  </div>
                </div>
              )}
 
              {/* ── Registration Docs ── */}
              {activeModalTab === 'registration' && (
                <div className="p-6 space-y-5">
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2"><HardDrive className="h-4 w-4 text-gray-600" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted Registration Documents (from SDP)</p></div>
                    <div className="p-4 space-y-2">
                      {[
                        { label: 'EISA Reg Document', checked: selectedRecord.eisaRegDocument, name: selectedRecord.eisaRegFileName },
                        { label: 'LEISA File',         checked: selectedRecord.leisaFile,       name: selectedRecord.leisaFileName },
                        { label: 'SOR & QA Reports',  checked: selectedRecord.sorAndQaReports,  name: selectedRecord.sorQaReportsFileName },
                      ].map(({ label, checked, name }) => (
                        <div key={label} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${checked ? 'text-emerald-600' : 'text-gray-400'}`}>{checked ? '✓' : '○'}</span>
                            <span className={`text-sm font-medium ${checked ? 'text-emerald-800' : 'text-gray-600'}`}>{label}</span>
                          </div>
                          {name && <span className="text-xs text-gray-400 truncate max-w-[160px]">{name}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedRecord.leisaFormData?.compilerName && (
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2"><FileText className="h-4 w-4 text-gray-600" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">LEISA File Details (Compulsory Information)</p></div>
                      <div className="p-4 grid md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div><p className="text-xs text-gray-400">Compiler Full Name</p><p className="font-medium">{selectedRecord.leisaFormData.compilerName}</p></div>
                        <div><p className="text-xs text-gray-400">Compiler Email</p><p className="font-medium">{selectedRecord.leisaFormData.compilerEmail || '—'}</p></div>
                        <div><p className="text-xs text-gray-400">Compiler Contact Number</p><p className="font-medium">{selectedRecord.leisaFormData.compilerPhone || '—'}</p></div>
                        <div><p className="text-xs text-gray-400">Institution Contact Number</p><p className="font-medium">{selectedRecord.leisaFormData.institutionPhone || '—'}</p></div>
                        <div className="md:col-span-2"><p className="text-xs text-gray-400">Name of Qualification</p><p className="font-medium">{selectedRecord.leisaFormData.qualificationName}</p></div>
                        <div><p className="text-xs text-gray-400">Training Start Date</p><p className="font-medium">{formatDate(selectedRecord.leisaFormData.startDate)}</p></div>
                        <div><p className="text-xs text-gray-400">Expected Completion Date</p><p className="font-medium">{formatDate(selectedRecord.leisaFormData.expectedCompletionDate)}</p></div>
                        <div><p className="text-xs text-gray-400">Name of SDP</p><p className="font-medium">{selectedRecord.leisaFormData.sdpName || '—'}</p></div>
                        <div><p className="text-xs text-gray-400">Province</p><p className="font-medium">{selectedRecord.leisaFormData.province || '—'}</p></div>
                        {selectedRecord.leisaFormData.sdpAddress && (<div className="md:col-span-2"><p className="text-xs text-gray-400">Address of SDP</p><p className="font-medium">{selectedRecord.leisaFormData.sdpAddress}</p></div>)}
                      </div>
                    </div>
                  )}
                  {selectedRecord.registrationNumber && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <div><p className="text-xs text-emerald-600 font-medium">Registration Number</p><p className="text-lg font-bold text-emerald-800">{selectedRecord.registrationNumber}</p></div>
                    </div>
                  )}
                </div>
              )}
 
              {/* ── PROCESSING TAB ──────────────────────────────────────────────── */}
              {activeModalTab === 'processing' && (
                <div className="p-6 space-y-5">
 
                  {/* ──────── TRADES PROCESSING ──────── */}
                  {selectedRecord.stream === 'trades' && (
                    <>
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 flex gap-3">
                        <Wrench className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-blue-800">EISA Trades — Processing Workflow</p>
                          <p className="text-xs text-blue-700 mt-0.5">Complete all three steps below: Validate documentation, create a Registration Number, then submit to the Quality Partner.</p>
                        </div>
                      </div>
 
                      {/* Step 1: Validate Documentation */}
                      <StepCard
                        step={1}
                        done={!!selectedRecord.tradesDocValidated}
                        label="Validate Documentation"
                        description="Review and validate all submitted documentation for this EISA Trades application."
                      >
                        {!selectedRecord.tradesDocValidated ? (
                          <div className="space-y-3">
                            <p className="text-xs text-gray-500">Confirm that all required documentation has been reviewed and is valid before proceeding.</p>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {[
                                { label: 'EISA Reg Document', ok: selectedRecord.eisaRegDocument },
                                { label: 'LEISA File',         ok: selectedRecord.leisaFile },
                                { label: 'SOR & QA Reports',  ok: selectedRecord.sorAndQaReports },
                                { label: 'Outcome Report',    ok: !!selectedRecord.outcomeReport?.reportFinalised },
                              ].map(({ label, ok }) => (
                                <div key={label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                  <span>{ok ? '✓' : '○'}</span>{label}
                                </div>
                              ))}
                            </div>
                            <Button size="sm" onClick={() => handleTradesStep(selectedRecord.id, 'tradesDocValidated', true)}
                              className="bg-blue-600 hover:bg-blue-700 gap-1">
                              <CheckCircle className="h-4 w-4" /> Mark Documentation as Validated
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-700 font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Documentation validated successfully.</p>
                        )}
                      </StepCard>
 
                      {/* Step 2: Create Registration Number */}
                      <StepCard
                        step={2}
                        done={!!selectedRecord.tradesRegNoCreated}
                        label="Create Registration Number"
                        description="Generate and assign an official Registration Number for this EISA Trades application."
                      >
                        {!selectedRecord.tradesRegNoCreated ? (
                          <div className="space-y-3">
                            {!selectedRecord.tradesDocValidated && (
                              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Complete Step 1 first.
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Registration Number <span className="text-red-500">*</span></Label>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="e.g. EISA-TRD-2025-0001"
                                  value={tradesRegNo}
                                  onChange={(e) => setTradesRegNo(e.target.value)}
                                  disabled={!selectedRecord.tradesDocValidated}
                                  className="flex-1"
                                />
                                <Button
                                  onClick={() => handleTradesCreateRegNo(selectedRecord.id)}
                                  disabled={!selectedRecord.tradesDocValidated || !tradesRegNo.trim()}
                                  className="bg-emerald-600 hover:bg-emerald-700 gap-1 whitespace-nowrap">
                                  <CheckCircle2 className="h-4 w-4" /> Create Reg No
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Registration Number Created</p>
                              <p className="text-base font-bold text-emerald-800 font-mono">{selectedRecord.registrationNumber}</p>
                            </div>
                          </div>
                        )}
                      </StepCard>
 
                      {/* Step 3: Submit to Quality Partner */}
                      <StepCard
                        step={3}
                        done={!!selectedRecord.tradesSubmittedToQp}
                        label="Submit to Quality Partner"
                        description="Submit the completed registration and documentation to the Quality Partner."
                      >
                        {!selectedRecord.tradesSubmittedToQp ? (
                          <div className="space-y-3">
                            {!selectedRecord.tradesRegNoCreated && (
                              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Complete Step 2 first.
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Processing Notes (optional)</Label>
                              <Textarea
                                rows={2}
                                placeholder="Any notes about the submission to the Quality Partner..."
                                value={processingNotes}
                                onChange={(e) => setProcessingNotes(e.target.value)}
                                disabled={!selectedRecord.tradesRegNoCreated}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleTradesStep(selectedRecord.id, 'tradesSubmittedToQp', true)}
                                disabled={!selectedRecord.tradesRegNoCreated}
                                className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                                <UploadCloud className="h-4 w-4" /> Mark as Submitted to QP
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-700 font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Submitted to Quality Partner.</p>
                        )}
                      </StepCard>
 
                      {/* Summary and Complete */}
                      {isTradesAllDone(selectedRecord) && selectedRecord.currentStage !== 'completed' && (
                        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 space-y-3">
                          <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> All 3 steps complete. Mark this record as Completed.</p>
                          <Button onClick={() => handleTradesComplete(selectedRecord.id)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                            <ThumbsUp className="h-4 w-4" /> Mark as Completed
                          </Button>
                        </div>
                      )}
 
                      {selectedRecord.currentStage === 'completed' && (
                        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 flex items-center gap-3">
                          <ThumbsUp className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="text-sm font-bold text-emerald-800">EISA Trades Processing — Completed</p>
                            {selectedRecord.processingCompletedAt && (
                              <p className="text-xs text-emerald-600 mt-0.5">Completed by {selectedRecord.processingCompletedBy} on {formatDateTime(selectedRecord.processingCompletedAt)}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
 
                  {/* ──────── NON-TRADES PROCESSING ──────── */}
                  {selectedRecord.stream === 'nonTrades' && (
                    <>
                      <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 flex gap-3">
                        <Layers className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-violet-800">EISA Non-Trades — Processing Workflow</p>
                          <p className="text-xs text-violet-700 mt-0.5">Complete all six steps: Validate documentation, Prepare and submit File 4 to QP (2 months prior to EISA date), Prepare SDP list, Submit to QA and QPs, then Submit to External Quality Partners.</p>
                        </div>
                      </div>
 
                      {/* Step 1: Validate Documentation */}
                      <StepCard
                        step={1}
                        done={!!selectedRecord.nonTradesDocValidated}
                        label="Validate Documentation"
                        description="Review and validate all submitted documentation for this Non-Trades EISA application."
                      >
                        {!selectedRecord.nonTradesDocValidated ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {[
                                { label: 'EISA Reg Document', ok: selectedRecord.eisaRegDocument },
                                { label: 'LEISA File',         ok: selectedRecord.leisaFile },
                                { label: 'SOR & QA Reports',  ok: selectedRecord.sorAndQaReports },
                                { label: 'Outcome Report',    ok: !!selectedRecord.outcomeReport?.reportFinalised },
                              ].map(({ label, ok }) => (
                                <div key={label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                  <span>{ok ? '✓' : '○'}</span>{label}
                                </div>
                              ))}
                            </div>
                            <Button size="sm" onClick={() => handleNonTradesStep(selectedRecord.id, 'nonTradesDocValidated', true)}
                              className="bg-violet-600 hover:bg-violet-700 gap-1">
                              <CheckCircle className="h-4 w-4" /> Mark Documentation as Validated
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-700 font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Documentation validated.</p>
                        )}
                      </StepCard>
 
                      {/* Step 2: Prepare File 4 */}
                      <StepCard
                        step={2}
                        done={!!selectedRecord.nonTradesFile4Prepared}
                        label="Prepare File 4"
                        description="Prepare File 4 for submission to the Quality Partner (must be submitted 2 months prior to EISA date)."
                      >
                        {!selectedRecord.nonTradesFile4Prepared ? (
                          <div className="space-y-3">
                            {!selectedRecord.nonTradesDocValidated && (
                              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Complete Step 1 first.
                              </div>
                            )}
                            {selectedRecord.eisaDate && (
                              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-700">
                                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                                EISA Date: <strong>{formatDate(selectedRecord.eisaDate)}</strong> — File 4 must be submitted at least 2 months prior.
                              </div>
                            )}
                            <Button size="sm" onClick={() => handleNonTradesStep(selectedRecord.id, 'nonTradesFile4Prepared', true)}
                              disabled={!selectedRecord.nonTradesDocValidated}
                              className="bg-blue-600 hover:bg-blue-700 gap-1">
                              <FolderOpen className="h-4 w-4" /> Mark File 4 as Prepared
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-700 font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> File 4 prepared.</p>
                        )}
                      </StepCard>
 
                      {/* Step 3: Submit File 4 to QP (2 months prior) */}
                      <StepCard
                        step={3}
                        done={!!selectedRecord.nonTradesFile4SubmittedToQp}
                        label="Submit File 4 to QP — 2 Months Prior to EISA Date"
                        description="Submit the prepared File 4 to the Quality Partner at least 2 months before the EISA date."
                      >
                        {!selectedRecord.nonTradesFile4SubmittedToQp ? (
                          <div className="space-y-3">
                            {!selectedRecord.nonTradesFile4Prepared && (
                              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Complete Step 2 first.
                              </div>
                            )}
                            <Button size="sm" onClick={() => handleNonTradesStep(selectedRecord.id, 'nonTradesFile4SubmittedToQp', true)}
                              disabled={!selectedRecord.nonTradesFile4Prepared}
                              className="bg-indigo-600 hover:bg-indigo-700 gap-1">
                              <UploadCloud className="h-4 w-4" /> Mark File 4 as Submitted to QP
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-700 font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> File 4 submitted to QP (2 months prior).</p>
                        )}
                      </StepCard>
 
                      {/* Step 4: Prepare SDP List */}
                      <StepCard
                        step={4}
                        done={!!selectedRecord.nonTradesSdpListPrepared}
                        label="Prepare SDP List"
                        description="Compile and prepare the SDP list for distribution to QA and QPs."
                      >
                        {!selectedRecord.nonTradesSdpListPrepared ? (
                          <div className="space-y-3">
                            {!selectedRecord.nonTradesFile4SubmittedToQp && (
                              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Complete Step 3 first.
                              </div>
                            )}
                            <Button size="sm" onClick={() => handleNonTradesStep(selectedRecord.id, 'nonTradesSdpListPrepared', true)}
                              disabled={!selectedRecord.nonTradesFile4SubmittedToQp}
                              className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                              <ClipboardList className="h-4 w-4" /> Mark SDP List as Prepared
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-700 font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> SDP List prepared.</p>
                        )}
                      </StepCard>
 
                      {/* Step 5: Submit SDP List to QA and QPs */}
                      <StepCard
                        step={5}
                        done={!!selectedRecord.nonTradesSdpListSubmittedToQaQp}
                        label="Submit SDP List to QA and QPs"
                        description="Submit the prepared SDP list to both the Quality Assurer (QA) and Quality Partners (QPs)."
                      >
                        {!selectedRecord.nonTradesSdpListSubmittedToQaQp ? (
                          <div className="space-y-3">
                            {!selectedRecord.nonTradesSdpListPrepared && (
                              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Complete Step 4 first.
                              </div>
                            )}
                            <Button size="sm" onClick={() => handleNonTradesStep(selectedRecord.id, 'nonTradesSdpListSubmittedToQaQp', true)}
                              disabled={!selectedRecord.nonTradesSdpListPrepared}
                              className="bg-orange-600 hover:bg-orange-700 gap-1">
                              <Send className="h-4 w-4" /> Mark as Submitted to QA and QPs
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-700 font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> SDP List submitted to QA and QPs.</p>
                        )}
                      </StepCard>
 
                      {/* Step 6: Submit to External Quality Partners */}
                      <StepCard
                        step={6}
                        done={!!selectedRecord.nonTradesSubmittedToExternalQp}
                        label="Submit to External Quality Partners"
                        description="Submit the SDP list and documentation to the External Quality Partners."
                      >
                        {!selectedRecord.nonTradesSubmittedToExternalQp ? (
                          <div className="space-y-3">
                            {!selectedRecord.nonTradesSdpListSubmittedToQaQp && (
                              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Complete Step 5 first.
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Processing Notes (optional)</Label>
                              <Textarea
                                rows={2}
                                placeholder="Notes about external QP submission..."
                                value={processingNotes}
                                onChange={(e) => setProcessingNotes(e.target.value)}
                                disabled={!selectedRecord.nonTradesSdpListSubmittedToQaQp}
                              />
                            </div>
                            <Button size="sm" onClick={() => handleNonTradesStep(selectedRecord.id, 'nonTradesSubmittedToExternalQp', true)}
                              disabled={!selectedRecord.nonTradesSdpListSubmittedToQaQp}
                              className="bg-rose-600 hover:bg-rose-700 gap-1">
                              <ExternalLink className="h-4 w-4" /> Mark as Submitted to External QPs
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-700 font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Submitted to External Quality Partners.</p>
                        )}
                      </StepCard>
 
                      {/* Summary and Complete */}
                      {isNonTradesAllDone(selectedRecord) && selectedRecord.currentStage !== 'completed' && (
                        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 space-y-3">
                          <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> All 6 steps complete. Mark this record as Completed.</p>
                          <Button onClick={() => handleNonTradesComplete(selectedRecord.id)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                            <ThumbsUp className="h-4 w-4" /> Mark as Completed
                          </Button>
                        </div>
                      )}
 
                      {selectedRecord.currentStage === 'completed' && (
                        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 flex items-center gap-3">
                          <ThumbsUp className="h-5 w-5 text-emerald-600" />
                          <div>
                            <p className="text-sm font-bold text-emerald-800">EISA Non-Trades Processing — Completed</p>
                            {selectedRecord.processingCompletedAt && (
                              <p className="text-xs text-emerald-600 mt-0.5">Completed by {selectedRecord.processingCompletedBy} on {formatDateTime(selectedRecord.processingCompletedAt)}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
 
            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
              <RegistrationStageBadge stage={selectedRecord.currentStage} />
              <button type="button" onClick={closeModal} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}