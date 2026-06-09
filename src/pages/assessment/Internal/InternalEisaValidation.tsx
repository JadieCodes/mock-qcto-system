import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  ClipboardList, FileText, Eye, CheckCircle2, CalendarClock, Send, BookOpen,
  X, Calendar, Hash, Award, ShieldCheck, Clock, MapPin, User as UserIcon,
  Mail, Paperclip, FileSignature, CheckCircle, Phone, Building2, RefreshCw,
  AlertTriangle, ChevronRight, MessageSquare, ThumbsUp, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 
// ─── Types ─────────────────────────────────────────────────────────────────────
 
type ModalTab = 'details' | 'schedule' | 'liaise' | 'validation' | 'dd_review';
 
type ValidationStage =
  | 'pending_review'
  | 'assessment_domain_notified'
  | 'assistant_director_validation'
  | 'dd_review'
  | 'completed';
 
type YesNo = 'yes' | 'no' | '';
type OutcomeDecision = 'approved' | 'approved_with_conditions' | 'not_approved' | '';
 
interface ChecklistSection { findings: string; recommendations: string; }
 
interface InstrumentValidationData {
  qpName: string; qpAddress: string; qpContactNumber: string; qpContactPerson: string;
  dateOfEisa: string; dateInstrumentViewed: string; instrumentOrExemplar: string;
  qualificationTitle: string; qualificationRegStatus: string; saqaId: string;
  credits: string; nqfLevel: string; completedByName: string; completedByDesignation: string;
  completedByDate: string; previousValidationDate: string; previousRecommendations: string;
  qas: { addendumDeveloped: YesNo; addendumFiled: YesNo; componentDetailsCapture: YesNo; currentTemplate: YesNo; componentDetailsMatch: YesNo; file3TemplateProvided: YesNo; calculatorProvided: YesNo; section: ChecklistSection; };
  examiner: { criteriaSpecified: YesNo; meetsCriteria: YesNo; reportCompleted: YesNo; reportOnTemplate: YesNo; reportChecked: YesNo; remediationsRequested: YesNo; section: ChecklistSection; };
  moderator: { criteriaSpecified: YesNo; meetsCriteria: YesNo; reportCompleted: YesNo; reportOnTemplate: YesNo; remediationRequested: YesNo; changesM: YesNo; changesCommunicated: YesNo; reportChecked: YesNo; section: ChecklistSection; };
  overall: { approvedByModerator: YesNo; separatedDocuments: YesNo; memoCorresponds: YesNo; frontPageCorrect: YesNo; eisaRulesStipulated: YesNo; assessmentInstructions: YesNo; instructionsClear: YesNo; grammarChecked: YesNo; spellingChecked: YesNo; questionNumbersMatch: YesNo; languageLevel: YesNo; cognitiveOrder: YesNo; section: ChecklistSection; };
  documents: { moderatorReport: boolean; examinerReport: boolean; cv: boolean; confidentialityAgreement: boolean; eisaInstrumentMemo: boolean; eisaInstrumentRubric: boolean; };
}
 
export interface EisaOutcomeReport {
  ddRecommendations: string;
  ddChangesRequired: string;
  outcomeDecision: OutcomeDecision;
  outcomeNotes: string;
  ddReviewedBy: string;
  ddReviewedAt: string;
  reportFinalised: boolean;
  reportFinalisedAt?: string;
}
 
export interface EisaValidationRecord {
  id: string; parentQasaId: string; eisaRegNo: string; title: string; saqaId: string;
  nqfLevel: string; credits: string; proposedEisaDate: string; currentStage: ValidationStage;
  sourceFrom: string; saqaQualificationDocument: string; curriculumDocument: string;
  qasAddendum: string; createdAt: string; notifiedAt?: string; validatedAt?: string;
  acknowledgementLetterName?: string | null; finalApprovalLetterName?: string | null;
  ceoApprovalNotes?: string; acknowledgementStatus?: string;
  outcomeReport?: EisaOutcomeReport;
  // NEW: track if this record has been sent to InternalEisaPage
  sentToInternalEisaPage?: boolean;
  eisaSchedule?: {
    validationDate: string; startTime: string; endTime: string; venue: string;
    assessorName: string; assessorEmail: string; notes: string; scheduleDocumentName?: string;
    submittedToInternalAt?: string; internalUpdatedAt?: string; internalUpdatedBy?: string;
    internalNotes?: string; internalStatus?: 'pending' | 'arranged' | 'confirmed';
    qpContactPerson?: string; qpContactNumber?: string; qpContactEmail?: string;
    validationConfirmed?: boolean; logisticsArranged?: boolean; confirmationDate?: string;
    instrumentValidation?: InstrumentValidationData;
  };
}
 
const STORAGE_KEY = 'eisa_validation_records';
const REGISTRATION_STORAGE_KEY = 'eisa_registration_records';
 
// ─── Defaults ──────────────────────────────────────────────────────────────────
 
function defaultValidationData(record?: EisaValidationRecord | null): InstrumentValidationData {
  const empty: ChecklistSection = { findings: '', recommendations: '' };
  return {
    qpName: '', qpAddress: '', qpContactNumber: '', qpContactPerson: '',
    dateOfEisa: record?.proposedEisaDate ?? '', dateInstrumentViewed: '', instrumentOrExemplar: '',
    qualificationTitle: record?.title ?? '', qualificationRegStatus: '',
    saqaId: record?.saqaId ?? '', credits: record?.credits ?? '', nqfLevel: record?.nqfLevel ?? '',
    completedByName: '', completedByDesignation: '', completedByDate: '',
    previousValidationDate: '', previousRecommendations: '',
    qas: { addendumDeveloped: '', addendumFiled: '', componentDetailsCapture: '', currentTemplate: '', componentDetailsMatch: '', file3TemplateProvided: '', calculatorProvided: '', section: { ...empty } },
    examiner: { criteriaSpecified: '', meetsCriteria: '', reportCompleted: '', reportOnTemplate: '', reportChecked: '', remediationsRequested: '', section: { ...empty } },
    moderator: { criteriaSpecified: '', meetsCriteria: '', reportCompleted: '', reportOnTemplate: '', remediationRequested: '', changesM: '', changesCommunicated: '', reportChecked: '', section: { ...empty } },
    overall: { approvedByModerator: '', separatedDocuments: '', memoCorresponds: '', frontPageCorrect: '', eisaRulesStipulated: '', assessmentInstructions: '', instructionsClear: '', grammarChecked: '', spellingChecked: '', questionNumbersMatch: '', languageLevel: '', cognitiveOrder: '', section: { ...empty } },
    documents: { moderatorReport: false, examinerReport: false, cv: false, confidentialityAgreement: false, eisaInstrumentMemo: false, eisaInstrumentRubric: false },
  };
}
 
function defaultOutcome(): EisaOutcomeReport {
  return { ddRecommendations: '', ddChangesRequired: '', outcomeDecision: '', outcomeNotes: '', ddReviewedBy: '', ddReviewedAt: '', reportFinalised: false };
}
 
// ─── Sub-components ─────────────────────────────────────────────────────────────
 
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
    pending_review: 'Pending Review',
    assessment_domain_notified: 'Schedule Submitted',
    assistant_director_validation: 'Assistant Director Review',
    dd_review: 'Deputy Director Review',
    completed: 'Completed',
  };
  return <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ring-1 ring-inset ${styles[stage]}`}>{labels[stage]}</span>;
}
 
function YesNoToggle({ value, onChange }: { value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <div className="flex gap-1 flex-shrink-0">
      {(['yes', 'no'] as YesNo[]).map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(value === opt ? '' : opt)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${value === opt ? (opt === 'yes' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-500 text-white border-red-500') : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
          {opt === 'yes' ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}
 
function CriteriaRow({ label, value, onChange }: { label: string; value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <YesNoToggle value={value} onChange={onChange} />
    </div>
  );
}
 
function SectionFindings({ findings, recommendations, onFindingsChange, onRecommendationsChange }: { findings: string; recommendations: string; onFindingsChange: (v: string) => void; onRecommendationsChange: (v: string) => void; }) {
  return (
    <div className="mt-3 space-y-3 border-t border-dashed border-gray-200 pt-3">
      <div>
        <Label className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Finding and Recommendations for improvement before commencement of EISA</Label>
        <Textarea rows={2} className="mt-1 text-sm" placeholder="Enter findings..." value={findings} onChange={(e) => onFindingsChange(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Recommendations for improvement going forward</Label>
        <Textarea rows={2} className="mt-1 text-sm" placeholder="Enter recommendations..." value={recommendations} onChange={(e) => onRecommendationsChange(e.target.value)} />
      </div>
    </div>
  );
}
 
function ChecklistSummaryRow({ label, value }: { label: string; value: YesNo }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600 flex-1">{label}</span>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${value === 'yes' ? 'bg-emerald-100 text-emerald-700' : value === 'no' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
        {value === 'yes' ? 'Yes' : value === 'no' ? 'No' : 'Not answered'}
      </span>
    </div>
  );
}
 
function OutcomeBadge({ decision }: { decision: OutcomeDecision }) {
  if (!decision) return null;
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: '✓ Approved', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    approved_with_conditions: { label: '⚠ Approved with Conditions', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    not_approved: { label: '✗ Not Approved', cls: 'bg-red-100 text-red-700 border-red-200' },
  };
  const d = map[decision];
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${d.cls}`}>{d.label}</span>;
}
 
// ─── Main Component ─────────────────────────────────────────────────────────────
 
export default function InternalEisaValidation() {
  const [records, setRecords] = useState<EisaValidationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<EisaValidationRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('details');
 
  const [liaiseData, setLiaiseData] = useState({ qpContactPerson: '', qpContactNumber: '', qpContactEmail: '', logisticsArranged: false, validationConfirmed: false, notes: '' });
  const [ivData, setIvData] = useState<InstrumentValidationData>(defaultValidationData(null));
  const [ddData, setDdData] = useState<EisaOutcomeReport>(defaultOutcome());
 
  const { currentRole } = useApp();
 
  const loadRecords = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setRecords(JSON.parse(stored));
  };
 
  useEffect(() => {
    loadRecords();
    const handleStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) loadRecords(); };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(loadRecords, 2000);
    return () => { window.removeEventListener('storage', handleStorage); clearInterval(interval); };
  }, []);
 
  const saveValidationRecords = (updated: EisaValidationRecord[]) => {
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };
 
  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-2xl z-[200] flex items-center gap-2';
    el.innerHTML = `<span style="color:#34d399">✓</span> ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };
 
  const saveRecords = (updated: EisaValidationRecord[]) => {
    saveValidationRecords(updated);
    showToast('Saved successfully');
  };
 
  // Only show records that have NOT been sent to InternalEisaPage yet
  const visibleRecords = useMemo(
    () => records.filter(r => !r.sentToInternalEisaPage),
    [records]
  );
 
  const stats = useMemo(() => [
    { title: 'Pending Review', value: records.filter(r => r.currentStage === 'pending_review' && !r.sentToInternalEisaPage).length, icon: <Clock className="h-5 w-5" />, color: 'from-amber-500 to-orange-600' },
    { title: 'Schedule Submitted', value: records.filter(r => r.currentStage === 'assessment_domain_notified' && !r.sentToInternalEisaPage).length, icon: <Send className="h-5 w-5" />, color: 'from-blue-500 to-indigo-600' },
    { title: 'Assistant Director Review', value: records.filter(r => r.currentStage === 'assistant_director_validation' && !r.sentToInternalEisaPage).length, icon: <ClipboardList className="h-5 w-5" />, color: 'from-purple-500 to-pink-600' },
    { title: 'Deputy Director Review', value: records.filter(r => r.currentStage === 'dd_review' && !r.sentToInternalEisaPage).length, icon: <MessageSquare className="h-5 w-5" />, color: 'from-violet-500 to-purple-600' },
    { title: 'Completed', value: records.filter(r => r.currentStage === 'completed' && !r.sentToInternalEisaPage).length, icon: <CheckCircle2 className="h-5 w-5" />, color: 'from-green-500 to-emerald-600' },
  ], [records]);
 
  const openModal = (record: EisaValidationRecord, tab: ModalTab = 'details') => {
    setSelectedRecord(record);
    setActiveTab(tab);
    setLiaiseData({
      qpContactPerson: record.eisaSchedule?.qpContactPerson ?? '',
      qpContactNumber: record.eisaSchedule?.qpContactNumber ?? '',
      qpContactEmail: record.eisaSchedule?.qpContactEmail ?? '',
      logisticsArranged: record.eisaSchedule?.logisticsArranged ?? false,
      validationConfirmed: record.eisaSchedule?.validationConfirmed ?? false,
      notes: record.eisaSchedule?.internalNotes ?? '',
    });
    setIvData(record.eisaSchedule?.instrumentValidation ?? defaultValidationData(record));
    setDdData(record.outcomeReport ?? defaultOutcome());
    setIsModalOpen(true);
  };
 
  // Step 1: Assistant Director confirms + sends to DD
  const handleSendToDD = () => {
    if (!selectedRecord) return;
    const updated = records.map((r): EisaValidationRecord => {
      if (r.id === selectedRecord.id) {
        return {
          ...r,
          eisaSchedule: {
            ...r.eisaSchedule!,
            qpContactPerson: liaiseData.qpContactPerson,
            qpContactNumber: liaiseData.qpContactNumber,
            qpContactEmail: liaiseData.qpContactEmail,
            logisticsArranged: liaiseData.logisticsArranged,
            validationConfirmed: liaiseData.validationConfirmed,
            confirmationDate: new Date().toISOString(),
            internalUpdatedAt: new Date().toISOString(),
            internalUpdatedBy: currentRole,
            internalNotes: liaiseData.notes,
            internalStatus: 'arranged',
            instrumentValidation: ivData,
          },
          currentStage: 'dd_review',
        };
      }
      return r;
    });
    saveRecords(updated);
    setIsModalOpen(false);
  };
 
  // Step 2: Deputy Director approves & sends report — also pushes to InternalEisaPage
  const handleDDApproveAndSend = () => {
    if (!selectedRecord || !ddData.outcomeDecision) return;
    const finalOutcome: EisaOutcomeReport = {
      ...ddData,
      ddReviewedBy: currentRole,
      ddReviewedAt: new Date().toISOString(),
      reportFinalised: true,
      reportFinalisedAt: new Date().toISOString(),
    };
 
    // Build the merged updated validation record
    const updatedRecord: EisaValidationRecord = {
      ...selectedRecord,
      currentStage: 'completed',
      validatedAt: new Date().toISOString(),
      outcomeReport: finalOutcome,
      sentToInternalEisaPage: true, // ← hides from this page
    };
 
    const updatedValidationRecords = records.map(r =>
      r.id === selectedRecord.id ? updatedRecord : r
    );
    saveValidationRecords(updatedValidationRecords);
 
    // Push a new record to eisa_registration_records for InternalEisaPage
    const registrationStored = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    const registrationRecords = registrationStored ? JSON.parse(registrationStored) : [];
 
    // Determine stream from category or default to 'trades'
    const categoryRaw = (selectedRecord as any).category ?? '';
    const streamGuess = categoryRaw.toLowerCase().includes('non') ? 'nonTrades' : 'trades';
 
    // Check if it already exists to avoid duplicates
    const alreadyExists = registrationRecords.some(
      (r: any) => r.sourceValidationId === selectedRecord.id
    );
 
    if (!alreadyExists) {
      const newRegRecord = {
        id: `reg_${selectedRecord.id}_${Date.now()}`,
        sourceValidationId: selectedRecord.id,
        stream: streamGuess,
        eisaRegNo: selectedRecord.eisaRegNo,
        title: selectedRecord.title,
        eisaDate: selectedRecord.proposedEisaDate,
        sourceFrom: selectedRecord.sourceFrom,
        createdAt: new Date().toISOString(),
        saqaId: selectedRecord.saqaId,
        nqfLevel: selectedRecord.nqfLevel,
        credits: selectedRecord.credits,
        saqaQualificationDocument: selectedRecord.saqaQualificationDocument,
        curriculumDocument: selectedRecord.curriculumDocument,
        qasAddendum: selectedRecord.qasAddendum,
        acknowledgementLetterName: selectedRecord.acknowledgementLetterName,
        finalApprovalLetterName: selectedRecord.finalApprovalLetterName,
        ceoApprovalNotes: selectedRecord.ceoApprovalNotes,
        acknowledgementStatus: selectedRecord.acknowledgementStatus,
        leisaFile: false,
        sorAndQaReports: false,
        eisaRegDocument: false,
        file4Prepared: false,
        sdpListPrepared: false,
        submittedToQaAndQp: false,
        submittedToQpTwoMonthsPrior: false,
        submittedToExternalQp: false,
        outcomeDecision: finalOutcome.outcomeDecision,
        outcomeReport: finalOutcome,
        eisaSchedule: selectedRecord.eisaSchedule,
        currentStage: 'assistant_director_validation',
        validationStatus: 'pending',
      };
      registrationRecords.push(newRegRecord);
      localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(registrationRecords));
      window.dispatchEvent(new StorageEvent('storage', { key: REGISTRATION_STORAGE_KEY }));
    }
 
    showToast('Report finalised & sent to EISA Registration page');
    setIsModalOpen(false);
  };
 
  const formatDate = (d?: string) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('en-ZA'); } catch { return d; } };
  const formatDateTime = (d?: string) => { if (!d) return '-'; try { return new Date(d).toLocaleString('en-ZA'); } catch { return d; } };
 
  const canSeeLiaiseTabs = ['assessment_domain_notified', 'assistant_director_validation', 'dd_review', 'completed'].includes(selectedRecord?.currentStage ?? '');
  const canSeeDDTab = ['dd_review', 'completed'].includes(selectedRecord?.currentStage ?? '');
  const liaiseComplete = !!(liaiseData.qpContactPerson && liaiseData.qpContactNumber && liaiseData.qpContactEmail);
  const ddComplete = !!(ddData.outcomeDecision && ddData.ddRecommendations);
 
  const setIv = <K extends keyof InstrumentValidationData>(key: K, val: InstrumentValidationData[K]) => setIvData(prev => ({ ...prev, [key]: val }));
  const setQas = (key: keyof typeof ivData.qas, val: any) => setIvData(prev => ({ ...prev, qas: { ...prev.qas, [key]: val } }));
  const setExaminer = (key: keyof typeof ivData.examiner, val: any) => setIvData(prev => ({ ...prev, examiner: { ...prev.examiner, [key]: val } }));
  const setModerator = (key: keyof typeof ivData.moderator, val: any) => setIvData(prev => ({ ...prev, moderator: { ...prev.moderator, [key]: val } }));
  const setOverall = (key: keyof typeof ivData.overall, val: any) => setIvData(prev => ({ ...prev, overall: { ...prev.overall, [key]: val } }));
  const setDocs = (key: keyof typeof ivData.documents, val: boolean) => setIvData(prev => ({ ...prev, documents: { ...prev.documents, [key]: val } }));
 
  const ALL_TABS: { id: ModalTab; label: string; emoji: string }[] = [
    { id: 'details', label: 'Application Details', emoji: '📄' },
    { id: 'schedule', label: 'Validation Schedule', emoji: '📅' },
    { id: 'liaise', label: 'Liaise with QP', emoji: '📞' },
    { id: 'validation', label: 'Instrument Validation', emoji: '✅' },
    { id: 'dd_review', label: 'DD Review & Outcome', emoji: '🔍' },
  ];
 
  const visibleTabs = ALL_TABS.filter(t => {
    if (t.id === 'details' || t.id === 'schedule') return true;
    if (t.id === 'liaise' || t.id === 'validation') return canSeeLiaiseTabs;
    if (t.id === 'dd_review') return canSeeDDTab;
    return false;
  });
 
  const iv = ivData;
 
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-200 font-medium uppercase tracking-widest mb-1">Internal Portal</p>
            <h1 className="text-2xl font-bold">EISA Validation Management</h1>
            <p className="mt-1 text-sm text-emerald-100">Manage EISA validation schedules submitted by SDPs</p>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => { loadRecords(); showToast('Refreshed'); }} className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <div className="inline-flex w-fit items-center rounded-xl bg-white/20 backdrop-blur px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-200">Current role</span>
              <span className="ml-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">{currentRole}</span>
            </div>
          </div>
        </div>
      </div>
 
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        {stats.map((card) => (
          <div key={card.title} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${card.color} items-center justify-center mb-3 text-white`}>{card.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.title}</p>
          </div>
        ))}
      </div>
 
      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">All EISA Validation Records</h2>
          <span className="text-xs text-gray-400">{visibleRecords.length} record{visibleRecords.length !== 1 ? 's' : ''}</span>
        </div>
        {visibleRecords.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><ClipboardList className="h-8 w-8 text-gray-300" /></div>
            <p className="font-medium text-gray-500">No records found</p>
            <p className="text-sm text-gray-400 mt-1">When SDPs submit EISA validation schedules, they will appear here.</p>
            <Button onClick={() => { loadRecords(); showToast('Refreshed'); }} variant="outline" className="mt-4 gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  {['#', 'EISA Reg No', 'Qualification Title', 'SAQA ID', 'NQF Level', 'Stage', 'Schedule Submitted', 'Actions'].map(h => (
                    <TableHead key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRecords.map((record, idx) => (
                  <TableRow key={record.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <TableCell className="text-gray-400 text-xs font-mono">{String(idx + 1).padStart(2, '0')}</TableCell>
                    <TableCell className="font-semibold text-gray-900">{record.eisaRegNo}</TableCell>
                    <TableCell className="max-w-[200px]"><span className="block truncate text-sm text-gray-700" title={record.title}>{record.title}</span></TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">{record.saqaId}</TableCell>
                    <TableCell><span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">{record.nqfLevel}</span></TableCell>
                    <TableCell><StageBadge stage={record.currentStage} /></TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(record.eisaSchedule?.submittedToInternalAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openModal(record, 'details')} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-lg hover:bg-emerald-100">
                          <Eye className="h-4 w-4 text-emerald-600" />
                        </Button>
                        {record.currentStage === 'assessment_domain_notified' && (
                          <Button size="sm" onClick={() => openModal(record, 'liaise')} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs gap-1">
                            <Phone className="h-3 w-3" /> Liaise with QP
                          </Button>
                        )}
                        {record.currentStage === 'assistant_director_validation' && (
                          <Button size="sm" onClick={() => openModal(record, 'validation')} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs gap-1">
                            <ClipboardList className="h-3 w-3" /> Complete & Send to DD
                          </Button>
                        )}
                        {record.currentStage === 'dd_review' && (
                          <Button size="sm" onClick={() => openModal(record, 'dd_review')} className="bg-purple-600 hover:bg-purple-700 h-8 text-xs gap-1">
                            <MessageSquare className="h-3 w-3" /> DD Review
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
 
      {/* ─── Single Unified Modal ─────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {selectedRecord && (
            <>
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b px-6 pt-4 pb-0 flex-shrink-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedRecord.eisaRegNo}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedRecord.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StageBadge stage={selectedRecord.currentStage} />
                    <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {visibleTabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-all flex-shrink-0 ${activeTab === tab.id ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                      <span>{tab.emoji}</span> {tab.label}
                    </button>
                  ))}
                </div>
              </div>
 
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
 
                {/* ── Application Details ── */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
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
                          {selectedRecord.eisaSchedule?.submittedToInternalAt && (
                            <DetailRow icon={Send} label="Schedule Submitted" value={formatDateTime(selectedRecord.eisaSchedule.submittedToInternalAt)} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents from QAS Addendum</p></div>
                      <div className="divide-y">
                        {[{ label: 'SAQA Qualification Document', val: selectedRecord.saqaQualificationDocument }, { label: 'Curriculum Document', val: selectedRecord.curriculumDocument }, { label: 'QAS Addendum', val: selectedRecord.qasAddendum }].map(({ label, val }) => (
                          <div key={label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-blue-600" /></div><span className="text-sm font-medium text-gray-700">{label}</span></div>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-mono">{val || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedRecord.acknowledgementStatus === 'sent_to_quality_partner' && selectedRecord.acknowledgementLetterName && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 overflow-hidden">
                        <div className="px-4 py-3 bg-emerald-100 border-b border-emerald-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Acknowledgement Letter — Received</p></div>
                        <div className="p-4"><div className="flex items-center gap-3 bg-white rounded-xl border border-emerald-200 p-3"><div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0"><Paperclip className="h-5 w-5 text-white" /></div><div><p className="text-sm font-semibold text-gray-900">{selectedRecord.acknowledgementLetterName}</p><p className="text-xs text-gray-500">Approved by CEO</p></div></div></div>
                      </div>
                    )}
                    {selectedRecord.finalApprovalLetterName && (
                      <div className="rounded-2xl border border-purple-200 bg-purple-50/50 overflow-hidden">
                        <div className="px-4 py-3 bg-purple-100 border-b border-purple-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-purple-600" /><p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Signed Approval Letter — Received from QCTO</p></div>
                        <div className="p-4"><div className="flex items-center gap-3 bg-white rounded-xl border border-purple-200 p-3"><div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0"><FileSignature className="h-5 w-5 text-white" /></div><div><p className="text-sm font-semibold text-gray-900">{selectedRecord.finalApprovalLetterName}</p><p className="text-xs text-gray-500">Signed by CEO</p></div></div></div>
                      </div>
                    )}
                    {selectedRecord.outcomeReport?.reportFinalised && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                        <div><p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">EISA Validation Outcome</p><div className="mt-1"><OutcomeBadge decision={selectedRecord.outcomeReport.outcomeDecision} /></div></div>
                      </div>
                    )}
                  </div>
                )}
 
                {/* ── Validation Schedule ── */}
                {activeTab === 'schedule' && selectedRecord.eisaSchedule && (
                  <div className="space-y-6">
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
                            {selectedRecord.eisaSchedule.scheduleDocumentName && (<div className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Schedule Doc:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.scheduleDocumentName}</span></div>)}
                          </div>
                        </div>
                        {selectedRecord.eisaSchedule.notes && (<div className="p-3 bg-gray-50 rounded-xl border border-gray-200"><p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">SDP Notes</p><p className="text-sm text-gray-700">{selectedRecord.eisaSchedule.notes}</p></div>)}
                        <div className="text-xs text-gray-500 flex items-center gap-1"><Send className="h-3 w-3" /> Submitted by SDP: {formatDateTime(selectedRecord.eisaSchedule.submittedToInternalAt)}</div>
                        {selectedRecord.eisaSchedule.qpContactPerson && (
                          <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">Internal Liaison Details</p>
                            <div className="grid md:grid-cols-2 gap-3">
                              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-indigo-600" /><span className="text-sm font-medium">QP Contact:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.qpContactPerson}</span></div>
                              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-indigo-600" /><span className="text-sm font-medium">Contact Number:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.qpContactNumber}</span></div>
                              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-indigo-600" /><span className="text-sm font-medium">Email:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.qpContactEmail}</span></div>
                              <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-indigo-600" /><span className="text-sm font-medium">Validation Confirmed:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.validationConfirmed ? 'Yes' : 'No'}</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedRecord.currentStage === 'assessment_domain_notified' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                        <p className="text-sm text-emerald-700 font-medium">Ready to liaise with the Quality Partner?</p>
                        <Button size="sm" onClick={() => setActiveTab('liaise')} className="bg-emerald-600 hover:bg-emerald-700 gap-1">Go to Liaise with QP <ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                )}
 
                {/* ── Liaise with QP ── */}
                {activeTab === 'liaise' && (
                  <div className="space-y-5">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                      <Phone className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">Liaise with the Quality Partner and arrange the following:</p>
                        <ul className="mt-1 text-sm text-emerald-700 space-y-0.5 list-disc list-inside"><li>Date of Validation of Instruments</li><li>Basic logistics</li></ul>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QP Contact Details</p></div>
                      <div className="p-4 grid gap-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label className="text-sm font-semibold">QP Contact Person <span className="text-red-500">*</span></Label><Input placeholder="Full name" value={liaiseData.qpContactPerson} onChange={(e) => setLiaiseData({ ...liaiseData, qpContactPerson: e.target.value })} /></div>
                          <div className="space-y-2"><Label className="text-sm font-semibold">Contact Number <span className="text-red-500">*</span></Label><Input placeholder="Phone number" value={liaiseData.qpContactNumber} onChange={(e) => setLiaiseData({ ...liaiseData, qpContactNumber: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label className="text-sm font-semibold">Contact Email <span className="text-red-500">*</span></Label><Input type="email" placeholder="Email address" value={liaiseData.qpContactEmail} onChange={(e) => setLiaiseData({ ...liaiseData, qpContactEmail: e.target.value })} /></div>
                        <div className="space-y-2"><Label className="text-sm font-semibold">Additional Notes</Label><Textarea rows={3} placeholder="Any additional notes about the arrangements..." value={liaiseData.notes} onChange={(e) => setLiaiseData({ ...liaiseData, notes: e.target.value })} /></div>
                        <div className="flex flex-wrap gap-6 pt-1">
                          <div className="flex items-center gap-2.5"><Checkbox id="logisticsArranged" checked={liaiseData.logisticsArranged} onCheckedChange={(c) => setLiaiseData({ ...liaiseData, logisticsArranged: c === true })} /><Label htmlFor="logisticsArranged" className="text-sm cursor-pointer">Basic Logistics Arranged</Label></div>
                          <div className="flex items-center gap-2.5"><Checkbox id="validationConfirmed" checked={liaiseData.validationConfirmed} onCheckedChange={(c) => setLiaiseData({ ...liaiseData, validationConfirmed: c === true })} /><Label htmlFor="validationConfirmed" className="text-sm cursor-pointer">Validation Date Confirmed</Label></div>
                        </div>
                      </div>
                    </div>
                    {liaiseComplete && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                        <p className="text-sm text-blue-700 font-medium">Contact details captured. Now conduct the Instrument Validation.</p>
                        <Button size="sm" onClick={() => setActiveTab('validation')} className="bg-blue-600 hover:bg-blue-700 gap-1">Next: Instrument Validation <ChevronRight className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                )}
 
                {/* ── Instrument Validation Tool ── */}
                {activeTab === 'validation' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 overflow-hidden">
                      <div className="px-4 py-3 bg-blue-100 border-b border-blue-200 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-blue-700" /><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">QA Validation of Assessment Instrument Checklist</p></div>
                      <p className="px-4 py-3 text-xs text-blue-700 leading-relaxed">The purpose of this checklist is to Quality Assure the systematic process implemented by the Quality Partner (QP) against the QCTO Assessment Policy for Qualifications and Part Qualifications on the OQSF with regards to the development of the EISA instrument to be implemented per EISA session.</p>
                    </div>
 
                    {/* Required documents */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-violet-50 border-b border-violet-200 flex items-center gap-2"><Paperclip className="h-4 w-4 text-violet-600" /><p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Required Documents — Confirm Receipt</p></div>
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {[{ key: 'moderatorReport', label: 'Moderator Report' }, { key: 'examinerReport', label: 'Examiner Report' }, { key: 'cv', label: 'CV' }, { key: 'confidentialityAgreement', label: 'Confidentiality Agreement' }, { key: 'eisaInstrumentMemo', label: 'EISA Instrument and Memo (written)' }, { key: 'eisaInstrumentRubric', label: 'EISA Instrument and Rubric (practical)' }].map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-2.5 p-3 rounded-xl border bg-gray-50 hover:bg-gray-100 transition-colors">
                            <Checkbox id={`doc-${key}`} checked={iv.documents[key as keyof typeof iv.documents]} onCheckedChange={(c) => setDocs(key as keyof typeof iv.documents, c === true)} />
                            <Label htmlFor={`doc-${key}`} className="text-sm cursor-pointer font-medium text-gray-700">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
 
                    {/* QP Info */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QP & Qualification Information</p></div>
                      <div className="p-4 grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name of QP</Label><Input value={iv.qpName} onChange={(e) => setIv('qpName', e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address of QP</Label><Input value={iv.qpAddress} onChange={(e) => setIv('qpAddress', e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Number</Label><Input value={iv.qpContactNumber} onChange={(e) => setIv('qpContactNumber', e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Person</Label><Input value={iv.qpContactPerson} onChange={(e) => setIv('qpContactPerson', e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Upcoming EISA</Label><Input type="date" value={iv.dateOfEisa} onChange={(e) => setIv('dateOfEisa', e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Instrument / Exemplar Viewed</Label><Input type="date" value={iv.dateInstrumentViewed} onChange={(e) => setIv('dateInstrumentViewed', e.target.value)} /></div>
                        <div className="space-y-2 md:col-span-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Instrument or Exemplar?</Label><Input value={iv.instrumentOrExemplar} onChange={(e) => setIv('instrumentOrExemplar', e.target.value)} placeholder="e.g. Instrument / Exemplar" /></div>
                        <div className="space-y-2 md:col-span-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title of Qualification</Label><Input value={iv.qualificationTitle} onChange={(e) => setIv('qualificationTitle', e.target.value)} /></div>
                        <div className="space-y-2 md:col-span-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Qualification Registration Status</Label><Input value={iv.qualificationRegStatus} onChange={(e) => setIv('qualificationRegStatus', e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SAQA ID</Label><Input value={iv.saqaId} onChange={(e) => setIv('saqaId', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credits</Label><Input value={iv.credits} onChange={(e) => setIv('credits', e.target.value)} /></div>
                          <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">NQF Level</Label><Input value={iv.nqfLevel} onChange={(e) => setIv('nqfLevel', e.target.value)} /></div>
                        </div>
                      </div>
                    </div>
 
                    {/* Completed By */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QA Checklist Completed By</p></div>
                      <div className="p-4 grid md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</Label><Input value={iv.completedByName} onChange={(e) => setIv('completedByName', e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Designation</Label><Input value={iv.completedByDesignation} onChange={(e) => setIv('completedByDesignation', e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</Label><Input type="date" value={iv.completedByDate} onChange={(e) => setIv('completedByDate', e.target.value)} /></div>
                        <div className="space-y-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Previous Validation</Label><Input type="date" value={iv.previousValidationDate} onChange={(e) => setIv('previousValidationDate', e.target.value)} /></div>
                        <div className="space-y-2 md:col-span-2"><Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Previous Recommendations</Label><Textarea rows={2} value={iv.previousRecommendations} onChange={(e) => setIv('previousRecommendations', e.target.value)} /></div>
                      </div>
                    </div>
 
                    {/* Section 1 — QAS Addendum */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2"><FileText className="h-4 w-4 text-amber-600" /><p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Section 1 — QAS Addendum</p></div>
                      <div className="px-4 py-2">
                        <CriteriaRow label="Has the QAS Addendum been developed and approved?" value={iv.qas.addendumDeveloped} onChange={(v) => setQas('addendumDeveloped', v)} />
                        <CriteriaRow label="Is the QAS Addendum correctly filed on the Assessment SharePoint?" value={iv.qas.addendumFiled} onChange={(v) => setQas('addendumFiled', v)} />
                        <CriteriaRow label="Is the Component Details correctly captured on the EISA Component Control Register?" value={iv.qas.componentDetailsCapture} onChange={(v) => setQas('componentDetailsCapture', v)} />
                        <CriteriaRow label="Is the QAS Addendum on the current template?" value={iv.qas.currentTemplate} onChange={(v) => setQas('currentTemplate', v)} />
                        <CriteriaRow label="Do the Component details (Total Marks and Pass/Competency Requirements) match the instrument being validated?" value={iv.qas.componentDetailsMatch} onChange={(v) => setQas('componentDetailsMatch', v)} />
                        <CriteriaRow label="Was a template for FILE 3 as well as an example of FILE 3 provided to the QP?" value={iv.qas.file3TemplateProvided} onChange={(v) => setQas('file3TemplateProvided', v)} />
                        <CriteriaRow label="Was an EISA Final Percentage Calculator (where applicable) developed and provided to the QP?" value={iv.qas.calculatorProvided} onChange={(v) => setQas('calculatorProvided', v)} />
                        <SectionFindings findings={iv.qas.section.findings} recommendations={iv.qas.section.recommendations} onFindingsChange={(v) => setQas('section', { ...iv.qas.section, findings: v })} onRecommendationsChange={(v) => setQas('section', { ...iv.qas.section, recommendations: v })} />
                      </div>
                    </div>
 
                    {/* Section 2 — Examiner */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2"><UserIcon className="h-4 w-4 text-blue-600" /><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Section 2 — Examiner / Developer Details and Findings</p></div>
                      <div className="px-4 py-2">
                        <CriteriaRow label="Has the criteria for the Examiner / Developer been specified?" value={iv.examiner.criteriaSpecified} onChange={(v) => setExaminer('criteriaSpecified', v)} />
                        <CriteriaRow label="Does Examiner / Developer meet the specified criteria according to his/her CV?" value={iv.examiner.meetsCriteria} onChange={(v) => setExaminer('meetsCriteria', v)} />
                        <CriteriaRow label="Has the Examiner / Developer completed their report on this instrument?" value={iv.examiner.reportCompleted} onChange={(v) => setExaminer('reportCompleted', v)} />
                        <CriteriaRow label="Has the Examiner / Developer's report been completed on the QCTO prescribed template?" value={iv.examiner.reportOnTemplate} onChange={(v) => setExaminer('reportOnTemplate', v)} />
                        <CriteriaRow label="Examiner / Assessor Report checked for compliance to QAS addendum, content coverage, marking memorandum and technical aspects?" value={iv.examiner.reportChecked} onChange={(v) => setExaminer('reportChecked', v)} />
                        <CriteriaRow label="Was the Examiner / Developer requested to do any remediations as per Moderator findings?" value={iv.examiner.remediationsRequested} onChange={(v) => setExaminer('remediationsRequested', v)} />
                        <SectionFindings findings={iv.examiner.section.findings} recommendations={iv.examiner.section.recommendations} onFindingsChange={(v) => setExaminer('section', { ...iv.examiner.section, findings: v })} onRecommendationsChange={(v) => setExaminer('section', { ...iv.examiner.section, recommendations: v })} />
                      </div>
                    </div>
 
                    {/* Section 3 — Moderator */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-indigo-600" /><p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Section 3 — Moderator Details and Findings</p></div>
                      <div className="px-4 py-2">
                        <CriteriaRow label="Has the criteria for the Moderator been specified?" value={iv.moderator.criteriaSpecified} onChange={(v) => setModerator('criteriaSpecified', v)} />
                        <CriteriaRow label="Does Moderator meet the specified criteria according to his/her CV?" value={iv.moderator.meetsCriteria} onChange={(v) => setModerator('meetsCriteria', v)} />
                        <CriteriaRow label="Has the Moderator completed their report on this instrument?" value={iv.moderator.reportCompleted} onChange={(v) => setModerator('reportCompleted', v)} />
                        <CriteriaRow label="Has the Moderator's report been completed on the QCTO prescribed template?" value={iv.moderator.reportOnTemplate} onChange={(v) => setModerator('reportOnTemplate', v)} />
                        <CriteriaRow label="Did the moderator request remediation from the Examiner / Developer?" value={iv.moderator.remediationRequested} onChange={(v) => setModerator('remediationRequested', v)} />
                        <CriteriaRow label="Has the moderator made any changes to the instrument?" value={iv.moderator.changesM} onChange={(v) => setModerator('changesM', v)} />
                        <CriteriaRow label="Were changes, if any, communicated to the Examiner / Developer?" value={iv.moderator.changesCommunicated} onChange={(v) => setModerator('changesCommunicated', v)} />
                        <CriteriaRow label="Moderator Report checked for compliance to QAS addendum, content coverage, marking memorandum and technical aspects?" value={iv.moderator.reportChecked} onChange={(v) => setModerator('reportChecked', v)} />
                        <SectionFindings findings={iv.moderator.section.findings} recommendations={iv.moderator.section.recommendations} onFindingsChange={(v) => setModerator('section', { ...iv.moderator.section, findings: v })} onRecommendationsChange={(v) => setModerator('section', { ...iv.moderator.section, recommendations: v })} />
                      </div>
                    </div>
 
                    {/* Section 4 — Overall */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Section 4 — Overall Evaluation</p></div>
                      <div className="px-4 py-2">
                        <CriteriaRow label="Has the EISA assessment instrument been approved by the Moderator?" value={iv.overall.approvedByModerator} onChange={(v) => setOverall('approvedByModerator', v)} />
                        <CriteriaRow label="The assessment instrument and the marking memo / guideline are clearly separated documents?" value={iv.overall.separatedDocuments} onChange={(v) => setOverall('separatedDocuments', v)} />
                        <CriteriaRow label="The memorandum / guideline corresponds to the assessment instrument with regards to question numbers and mark allocation?" value={iv.overall.memoCorresponds} onChange={(v) => setOverall('memoCorresponds', v)} />
                        <CriteriaRow label="All details on the front page correct (Logo, Date, Duration, Total Marks, Pass Mark, Instructions to candidates are clear)?" value={iv.overall.frontPageCorrect} onChange={(v) => setOverall('frontPageCorrect', v)} />
                        <CriteriaRow label="EISA rules have been clearly stipulated on the instrument?" value={iv.overall.eisaRulesStipulated} onChange={(v) => setOverall('eisaRulesStipulated', v)} />
                        <CriteriaRow label="Assessment instructions have been included?" value={iv.overall.assessmentInstructions} onChange={(v) => setOverall('assessmentInstructions', v)} />
                        <CriteriaRow label="Instructions in questions are clear (candidates will know what is expected of them)?" value={iv.overall.instructionsClear} onChange={(v) => setOverall('instructionsClear', v)} />
                        <CriteriaRow label="Grammar has been checked?" value={iv.overall.grammarChecked} onChange={(v) => setOverall('grammarChecked', v)} />
                        <CriteriaRow label="Spelling has been checked?" value={iv.overall.spellingChecked} onChange={(v) => setOverall('spellingChecked', v)} />
                        <CriteriaRow label="Question numbers and marks allocated per question are as indicated in the QAS Addendum (Blueprint)?" value={iv.overall.questionNumbersMatch} onChange={(v) => setOverall('questionNumbersMatch', v)} />
                        <CriteriaRow label="The language used is pitched at a suitable level?" value={iv.overall.languageLevel} onChange={(v) => setOverall('languageLevel', v)} />
                        <CriteriaRow label="Does the instrument inspire confidence by starting with lower cognitive questions first and thereafter increasing the cognitive levels?" value={iv.overall.cognitiveOrder} onChange={(v) => setOverall('cognitiveOrder', v)} />
                        <SectionFindings findings={iv.overall.section.findings} recommendations={iv.overall.section.recommendations} onFindingsChange={(v) => setOverall('section', { ...iv.overall.section, findings: v })} onRecommendationsChange={(v) => setOverall('section', { ...iv.overall.section, recommendations: v })} />
                      </div>
                    </div>
 
                    {!liaiseComplete && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <p className="text-sm text-amber-700">Please complete QP contact details on the <button className="font-semibold underline" onClick={() => setActiveTab('liaise')}>Liaise with QP</button> tab before submitting.</p>
                      </div>
                    )}
                  </div>
                )}
 
                {/* ── DD Review & Outcome ── */}
                {activeTab === 'dd_review' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/50 overflow-hidden">
                      <div className="px-4 py-3 bg-purple-100 border-b border-purple-200 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-purple-700" />
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Deputy Director — Review & Outcome</p>
                      </div>
                      <p className="px-4 py-3 text-xs text-purple-700 leading-relaxed">
                        Review the completed Instrument Validation Checklist and recommend any changes. Once satisfied, record the outcome decision and send the EISA Validation Report back to the SDP. The record will then automatically move to the EISA Registration page.
                      </p>
                    </div>
 
                    {/* Read-only checklist summary */}
                    {selectedRecord.eisaSchedule?.instrumentValidation && (
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instrument Validation Checklist Summary</p>
                          <button onClick={() => setActiveTab('validation')} className="text-xs text-blue-600 hover:underline font-medium">View full checklist →</button>
                        </div>
                        <div className="p-4 space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Documents Received</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[{ key: 'moderatorReport', label: 'Moderator Report' }, { key: 'examinerReport', label: 'Examiner Report' }, { key: 'cv', label: 'CV' }, { key: 'confidentialityAgreement', label: 'Confidentiality Agreement' }, { key: 'eisaInstrumentMemo', label: 'EISA Instrument & Memo' }, { key: 'eisaInstrumentRubric', label: 'EISA Instrument & Rubric' }].map(({ key, label }) => {
                                const checked = selectedRecord.eisaSchedule!.instrumentValidation!.documents[key as keyof typeof selectedRecord.eisaSchedule.instrumentValidation.documents];
                                return (
                                  <div key={key} className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium ${checked ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                    <span>{checked ? '✓' : '○'}</span>{label}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Overall Evaluation — Key Criteria</p>
                            <ChecklistSummaryRow label="Instrument approved by Moderator?" value={selectedRecord.eisaSchedule.instrumentValidation.overall.approvedByModerator} />
                            <ChecklistSummaryRow label="Assessment instrument and memo clearly separated?" value={selectedRecord.eisaSchedule.instrumentValidation.overall.separatedDocuments} />
                            <ChecklistSummaryRow label="Grammar checked?" value={selectedRecord.eisaSchedule.instrumentValidation.overall.grammarChecked} />
                            <ChecklistSummaryRow label="Spelling checked?" value={selectedRecord.eisaSchedule.instrumentValidation.overall.spellingChecked} />
                            <ChecklistSummaryRow label="Question numbers match QAS Addendum blueprint?" value={selectedRecord.eisaSchedule.instrumentValidation.overall.questionNumbersMatch} />
                          </div>
                          {[
                            { title: 'QAS Addendum Findings', data: selectedRecord.eisaSchedule.instrumentValidation.qas.section },
                            { title: 'Examiner/Developer Findings', data: selectedRecord.eisaSchedule.instrumentValidation.examiner.section },
                            { title: 'Moderator Findings', data: selectedRecord.eisaSchedule.instrumentValidation.moderator.section },
                            { title: 'Overall Evaluation Findings', data: selectedRecord.eisaSchedule.instrumentValidation.overall.section },
                          ].filter(s => s.data.findings || s.data.recommendations).map(({ title, data }) => (
                            <div key={title} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{title}</p>
                              {data.findings && <div className="mb-2"><p className="text-xs text-amber-700 font-medium">Findings:</p><p className="text-sm text-gray-700">{data.findings}</p></div>}
                              {data.recommendations && <div><p className="text-xs text-blue-700 font-medium">Recommendations:</p><p className="text-sm text-gray-700">{data.recommendations}</p></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
 
                    {/* DD Recommendations */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-purple-50 border-b border-purple-200 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-purple-600" />
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Deputy Director Recommendations</p>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Recommendations / Feedback <span className="text-red-500">*</span></Label>
                          <Textarea rows={4} placeholder="Record your review recommendations, feedback, or any changes required..." value={ddData.ddRecommendations} onChange={(e) => setDdData({ ...ddData, ddRecommendations: e.target.value })} disabled={selectedRecord.currentStage === 'completed'} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Changes Required (if any)</Label>
                          <Textarea rows={3} placeholder="Specify any changes required before the EISA can proceed..." value={ddData.ddChangesRequired} onChange={(e) => setDdData({ ...ddData, ddChangesRequired: e.target.value })} disabled={selectedRecord.currentStage === 'completed'} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Reviewed By</Label>
                          <Input placeholder="Deputy Director full name" value={ddData.ddReviewedBy} onChange={(e) => setDdData({ ...ddData, ddReviewedBy: e.target.value })} disabled={selectedRecord.currentStage === 'completed'} />
                        </div>
                      </div>
                    </div>
 
                    {/* Outcome Decision */}
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">EISA Validation Outcome Decision</p>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Outcome Decision <span className="text-red-500">*</span></Label>
                          <div className="flex flex-wrap gap-3">
                            {[
                              { val: 'approved', label: '✓ Approved', cls: ddData.outcomeDecision === 'approved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400' },
                              { val: 'approved_with_conditions', label: '⚠ Approved with Conditions', cls: ddData.outcomeDecision === 'approved_with_conditions' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400' },
                              { val: 'not_approved', label: '✗ Not Approved', cls: ddData.outcomeDecision === 'not_approved' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-400' },
                            ].map(({ val, label, cls }) => (
                              <button key={val} type="button" disabled={selectedRecord.currentStage === 'completed'}
                                onClick={() => setDdData({ ...ddData, outcomeDecision: val as OutcomeDecision })}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${cls} ${selectedRecord.currentStage === 'completed' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Outcome Notes / Conditions</Label>
                          <Textarea rows={3} placeholder="Any conditions, notes, or context for the outcome decision..." value={ddData.outcomeNotes} onChange={(e) => setDdData({ ...ddData, outcomeNotes: e.target.value })} disabled={selectedRecord.currentStage === 'completed'} />
                        </div>
                        {selectedRecord.outcomeReport?.reportFinalised && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                            <ThumbsUp className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-emerald-800">Outcome Report Finalised — Sent to EISA Registration Page</p>
                              <p className="text-xs text-emerald-600 mt-0.5">Finalised by {selectedRecord.outcomeReport.ddReviewedBy} on {formatDateTime(selectedRecord.outcomeReport.reportFinalisedAt)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
 
              {/* Footer */}
              <div className="px-6 py-4 border-t bg-gray-50/80 flex items-center justify-between flex-shrink-0">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                <div className="flex gap-2">
                  {activeTab === 'schedule' && canSeeLiaiseTabs && (
                    <Button variant="outline" onClick={() => setActiveTab('liaise')} className="gap-1">Liaise with QP <ChevronRight className="h-4 w-4" /></Button>
                  )}
                  {activeTab === 'liaise' && (
                    <Button variant="outline" onClick={() => setActiveTab('validation')} disabled={!liaiseComplete} className="gap-1">Instrument Validation <ChevronRight className="h-4 w-4" /></Button>
                  )}
                  {(activeTab === 'liaise' || activeTab === 'validation') && (selectedRecord.currentStage === 'assessment_domain_notified' || selectedRecord.currentStage === 'assistant_director_validation') && (
                    <Button onClick={handleSendToDD} disabled={!liaiseComplete} className="bg-purple-600 hover:bg-purple-700 gap-2">
                      <Send className="h-4 w-4" /> Send to Deputy Director
                    </Button>
                  )}
                  {activeTab === 'dd_review' && selectedRecord.currentStage === 'dd_review' && (
                    <Button onClick={handleDDApproveAndSend} disabled={!ddComplete} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <ThumbsUp className="h-4 w-4" /> Approve & Send to EISA Registration
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}