// src/pages/assessment/External/ExternalEisaRegistration.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  ClipboardList, FileText, Eye, CheckCircle2, CalendarClock, Send,
  Wrench, Layers, Hash, Award, BookOpen, X, CheckCircle, Calendar,
  MapPin, ShieldCheck, Paperclip, FileSignature, ThumbsUp, AlertCircle,
  MessageSquare, BarChart3, User as UserIcon, Mail, Clock, ArrowRight,
  HardDrive, Tag, Bell,
} from 'lucide-react';

type EisaRegistrationTab = 'trades' | 'nonTrades';
type ModalTab = 'details' | 'schedule' | 'outcome' | 'registration';
type ExternalRole = 'SDP' | 'Quality Partner';

type RegistrationStage =
  | 'sdp_submission'
  | 'assessment_domain_split'
  | 'assistant_director_validation'
  | 'trades_registered'
  | 'non_trades_prepared'
  | 'completed';

interface EisaRegistrationRecord {
  id: string;
  sourceValidationId?: string;
  sourceInternalId?: string;
  stream: 'trades' | 'nonTrades';
  eisaRegNo: string;
  title: string;
  eisaDate: string;
  sourceFrom: string;
  createdAt: string;
  notifiedAt?: string;
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
  submissionType?: string;
  submittedToExternalAt?: string;
   // Processing workflow state for Trades (added from internal)
  tradesDocValidated?: boolean;
  tradesRegNoCreated?: boolean;
  tradesSubmittedToQp?: boolean;
  tradesRegNo?: string;
  
  // Processing workflow state for NonTrades (added from internal)
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
  updatedFromInternalAt?: string;
}

const STORAGE_KEY = 'eisa_registration_records';
const EXTERNAL_MONITORING_KEY = 'site_visits_monitoring_records';

// ─── Shared sub-components ────────────────────────────────────────────────────

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
    sdp_submission:             { label: 'SDP Submission',              cls: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
    assessment_domain_split:    { label: 'Assessment Domain Split',     cls: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
    assistant_director_validation: { label: 'Notified — Awaiting Processing', cls: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
    trades_registered:          { label: 'Trades Registered',           cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
    non_trades_prepared:        { label: 'Non-Trades Prepared',         cls: 'bg-violet-50 text-violet-700 ring-violet-600/20' },
    completed:                  { label: 'Completed',                   cls: 'bg-green-50 text-green-700 ring-green-600/20' },
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExternalEisaRegistration() {
  const [activeTab, setActiveTab]         = useState<EisaRegistrationTab>('trades');
  const [records, setRecords]             = useState<EisaRegistrationRecord[]>([]);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('details');
  const INTERNAL_MONITORING_KEY = 'site_visits_monitoring_records';

  const selectedRecord = useMemo(
    () => (selectedId ? records.find(r => r.id === selectedId) ?? null : null),
    [selectedId, records]
  );

  const { currentRole } = useApp();
  const activeExternalRole: ExternalRole = currentRole === 'Quality Partner' ? 'Quality Partner' : 'SDP';

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
      setRecords(stored ? JSON.parse(stored) : []);
    } catch (e) {
      console.error('ExternalEisaRegistration: loadRecords error', e);
      setRecords([]);
    }
  };

  const saveRecords = (updated: EisaRegistrationRecord[]) => {
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
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
    allDocs:   records.filter(r => r.eisaRegDocument && r.leisaFile && r.sorAndQaReports).length,
  }), [records]);

  const handleNotifyAssessmentDomain = (recordId: string) => {
    saveRecords(records.map(r =>
      r.id === recordId ? { ...r, currentStage: 'assistant_director_validation' as RegistrationStage, notifiedAt: new Date().toISOString() } : r
    ));
    
    const notified = records.find(r => r.id === recordId);
    if (notified?.sourceValidationId) {
      try {
        const valStored = localStorage.getItem('eisa_validation_records');
        if (valStored) {
          const valRecords = JSON.parse(valStored);
          const updated = valRecords.map((r: any) =>
            r.id === notified.sourceValidationId
              ? { ...r, routedToRegistrationInternal: true }
              : r
          );
          localStorage.setItem('eisa_validation_records', JSON.stringify(updated));
          window.dispatchEvent(new StorageEvent('storage', { key: 'eisa_validation_records' }));
        }
      } catch (e) { console.error('handleNotifyAssessmentDomain: val update error', e); }
    }
  };
  

const handleMarkRegistered = (recordId: string) => {
  const record = records.find(r => r.id === recordId);
  console.log('handleMarkRegistered - Current record:', record);
  console.log('Current stage before:', record?.currentStage);
  
  const newStage = record?.stream === 'trades' ? 'trades_registered' : 'non_trades_prepared';
  const newRegNumber = `REG-${Date.now().toString().slice(-6)}`;
  
  console.log('New stage should be:', newStage);
  
  const updatedRecords = records.map(r =>
    r.id === recordId ? {
      ...r,
      currentStage: newStage as RegistrationStage,
      registrationNumber: newRegNumber,
    } : r
  );
  
  saveRecords(updatedRecords);
  
  // Verify the update
  const savedRecord = updatedRecords.find(r => r.id === recordId);
  console.log('After save - record stage:', savedRecord?.currentStage);
  
  // Force reload the selected record
  setSelectedId(null);
  setTimeout(() => {
    setSelectedId(recordId);
    setActiveModalTab('registration');
  }, 100);
};
  // Function to send to External Site Visits & Monitoring
 // Replace the sendToExternalMonitoring function with this:
const sendToInternalMonitoring = (record: EisaRegistrationRecord) => {
  try {
    const stored = localStorage.getItem(INTERNAL_MONITORING_KEY);
    const monitoringRecords = stored ? JSON.parse(stored) : [];
    
    const alreadyExists = monitoringRecords.some((r: any) => r.sourceEisaRegId === record.id);
    
    if (!alreadyExists) {
      const processType = record.stream === 'trades' ? 'marked_moderated_scripts' : 'post_eisa_monitoring';
      const subStage = record.stream === 'trades' ? 'eisa_notification_received' : 'approved_results_received';
      
      const monitoringRecord = {
        id: `mon_${record.id}_${Date.now()}`,
        processType: processType,
        title: record.title,
        sourceFrom: 'Quality Partner',
        submittedBy: 'Quality Partner',
        siteName: record.leisaFormData?.sdpName || 'SDP Site',
        visitDate: record.eisaDate,
        stage: 'incoming_request',
        subStage: subStage,
        eisaNotificationSubmitted: record.stream === 'trades',
        approvedResultsSubmitted: record.stream === 'nonTrades',
        schedulePrepared: false,
        monthlyPlanPrepared: false,
        competencyRateChecked: false,
        sdpIdentified: false,
        siteVisitBooked: false,
        evaluationToolCompleted: false,
        evaluationReportCompiled: false,
        pemReportGenerated: false,
        sentToQp: false,
        deputyDirectorStatus: 'pending',
        domainDirectorStatus: 'pending',
        directorStatus: 'pending',
        sourceEisaRegId: record.id,
        eisaRegNo: record.eisaRegNo,
        registrationNumber: record.registrationNumber,
        stream: record.stream,
        saqaId: record.saqaId,
        nqfLevel: record.nqfLevel,
        credits: record.credits,
        eisaRegDocument: record.eisaRegDocument,
        eisaRegFileName: record.eisaRegFileName,
        leisaFile: record.leisaFile,
        leisaFileName: record.leisaFileName,
        sorAndQaReports: record.sorAndQaReports,
        sorQaReportsFileName: record.sorQaReportsFileName,
        leisaFormData: record.leisaFormData,
        outcomeDecision: record.outcomeDecision,
        outcomeReport: record.outcomeReport,
        eisaSchedule: record.eisaSchedule,
        saqaQualificationDocument: record.saqaQualificationDocument,
        curriculumDocument: record.curriculumDocument,
        qasAddendum: record.qasAddendum,
        acknowledgementLetterName: record.acknowledgementLetterName,
        finalApprovalLetterName: record.finalApprovalLetterName,
        ceoApprovalNotes: record.ceoApprovalNotes,
        acknowledgementStatus: record.acknowledgementStatus,
        createdAt: new Date().toISOString(),
      };
      
      monitoringRecords.push(monitoringRecord);
      localStorage.setItem(INTERNAL_MONITORING_KEY, JSON.stringify(monitoringRecords));
      window.dispatchEvent(new StorageEvent('storage', { key: INTERNAL_MONITORING_KEY }));
      showToast(`EISA Notification sent to Internal Site Visits & Monitoring successfully!`);
      return true;
    } else {
      showToast(`This EISA Registration has already been sent to Internal Site Visits & Monitoring.`);
      return false;
    }
  } catch (error) {
    console.error('Error sending to monitoring:', error);
    showToast('Error sending to Internal Site Visits & Monitoring.');
    return false;
  }
};

const handleSendEisaNotification = (record: EisaRegistrationRecord) => {
  const success = sendToInternalMonitoring(record);
  if (success) {
    // Remove the record from the registration storage (delete it)
    const updatedRecords = records.filter(r => r.id !== record.id);
    saveRecords(updatedRecords);
    
    // Close the modal
    closeModal();
    showToast('EISA Notification sent successfully! Record moved to Internal Site Visits & Monitoring.');
  }
};



  const openModal = (record: EisaRegistrationRecord, tab: ModalTab = 'details') => {
    setSelectedId(record.id);
    setActiveModalTab(tab);
  };

  const closeModal = () => setSelectedId(null);

  const formatDate     = (d?: string) => { if (!d) return '-'; try { return new Date(d).toLocaleDateString('en-ZA'); }  catch { return d ?? '-'; } };
  const formatDateTime = (d?: string) => { if (!d) return '-'; try { return new Date(d).toLocaleString('en-ZA'); }      catch { return d ?? '-'; } };

  const hasSchedule  = !!(selectedRecord?.eisaSchedule);
  const hasOutcome   = !!(selectedRecord?.outcomeReport?.reportFinalised);
  const outcomeDecision = selectedRecord?.outcomeReport?.outcomeDecision ?? '';

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-red-200 font-medium uppercase tracking-widest mb-1">SDP Portal</p>
            <h1 className="text-2xl font-bold">EISA Registration</h1>
            <p className="mt-1 text-sm text-red-100">Manage EISA registration submissions for trades and non-trades qualifications</p>
          </div>
          <div className="inline-flex w-fit items-center rounded-xl bg-white/20 backdrop-blur px-3 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-red-200">Current role</span>
            <span className="ml-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">{activeExternalRole}</span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {([
          { tab: 'trades',    title: 'Trades Registrations',    value: counts.trades,    icon: <Wrench className="h-5 w-5" />,       color: 'from-blue-500 to-indigo-600' },
          { tab: 'nonTrades', title: 'Non-Trades Registrations',value: counts.nonTrades, icon: <Layers className="h-5 w-5" />,       color: 'from-violet-500 to-purple-600' },
          { tab: null,        title: 'All Documents Submitted',  value: counts.allDocs,   icon: <FileText className="h-5 w-5" />,     color: 'from-emerald-500 to-teal-600' },
        ] as const).map((card) => (
          <button key={card.title} type="button"
            onClick={() => card.tab && setActiveTab(card.tab as EisaRegistrationTab)}
            className={`rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-all text-left w-full ${card.tab && activeTab === card.tab ? 'ring-2 ring-red-500' : ''} ${!card.tab ? 'cursor-default' : ''}`}>
            <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${card.color} items-center justify-center mb-3 text-white`}>{card.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.title}</p>
          </button>
        ))}
      </div>

      {/* ── Table card ── */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50/80 px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button type="button" onClick={() => setActiveTab('trades')}
              className={`rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'trades' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Wrench className="h-4 w-4" /> EISA Trades
              {counts.trades > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'trades' ? 'bg-white/30' : 'bg-blue-100 text-blue-700'}`}>{counts.trades}</span>}
            </button>
            <button type="button" onClick={() => setActiveTab('nonTrades')}
              className={`rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-2 ${activeTab === 'nonTrades' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <Layers className="h-4 w-4" /> EISA Non-Trades
              {counts.nonTrades > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'nonTrades' ? 'bg-white/30' : 'bg-violet-100 text-violet-700'}`}>{counts.nonTrades}</span>}
            </button>
          </div>
          <span className="text-xs text-gray-400">{filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="px-6 pt-4 pb-2">
          <h2 className="text-base font-semibold text-gray-900">{activeTab === 'trades' ? 'EISA Trades' : 'EISA Non-Trades'}</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {activeTab === 'trades'
              ? 'SDP notifies Assessment Domain with EISA Reg, LEISA File, and SOR & QA Reports for trade processing.'
              : 'SDP notifies Assessment Domain with EISA Reg, LEISA File, and SOR & QA Reports for non-trade processing.'}
          </p>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              {activeTab === 'trades' ? <Wrench className="h-8 w-8 text-gray-300" /> : <Layers className="h-8 w-8 text-gray-300" />}
            </div>
            <p className="font-medium text-gray-500">No {activeTab === 'trades' ? 'Trades' : 'Non-Trades'} registrations yet</p>
            <p className="text-sm text-gray-400 mt-1">Records sent from the EISA Validation page will appear here once categorised.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white border-b border-gray-200">
                <tr>
                  {['#', 'Registration', 'EISA Date', 'Documents', 'Outcome', 'Stage', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, idx) => (
                  <tr key={record.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70 group">
                    <td className="px-5 py-4 text-gray-400 text-xs font-mono">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-5 py-4 align-top">
                      <div className="font-semibold text-gray-900">{record.eisaRegNo}</div>
                      <div className="mt-0.5 text-sm text-gray-500 truncate max-w-[200px]" title={record.title}>{record.title}</div>
                      {record.saqaId && <div className="mt-0.5 text-xs text-gray-400 font-mono">SAQA: {record.saqaId}</div>}
                    </td>
                    <td className="px-5 py-4 align-top text-sm text-gray-700 whitespace-nowrap">{formatDate(record.eisaDate)}</td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        <MiniDocBadge ok={record.eisaRegDocument} label="EISA Reg" />
                        <MiniDocBadge ok={record.leisaFile}       label="LEISA" />
                        <MiniDocBadge ok={record.sorAndQaReports} label="SOR & QA" />
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <OutcomeDecisionBadge decision={record.outcomeDecision} />
                    </td>
                    <td className="px-5 py-4 align-top"><RegistrationStageBadge stage={record.currentStage} /></td>
                    <td className="px-5 py-4 align-top">
                      <button type="button" onClick={() => openModal(record)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          FULL DETAIL MODAL
      ───────────────────────────────────────────────────────────────────── */}
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
                {[
                  { id: 'details',      label: 'Application Details',          emoji: '📄', show: true },
                  { id: 'schedule',     label: 'EISA Validation Schedule',      emoji: '📅', show: hasSchedule },
                  { id: 'outcome',      label: 'Validation Report & Outcome',   emoji: '📊', show: hasOutcome },
                  { id: 'registration', label: 'Registration Docs',             emoji: '📋', show: true },
                ].filter(t => t.show).map((tab) => (
                  <button key={tab.id} type="button" onClick={() => setActiveModalTab(tab.id as ModalTab)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap flex-shrink-0 transition-all ${
                      activeModalTab === tab.id ? 'border-red-500 text-red-700 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}>
                    <span>{tab.emoji}</span> {tab.label}
                    {tab.id === 'outcome' && hasOutcome && <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 inline-block" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* ─── TAB: Application Details ─── */}
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
                        <DetailRow icon={BookOpen} label="Qualification Title"  value={selectedRecord.title} />
                        <DetailRow icon={Hash}     label="SAQA ID"              value={<span className="font-mono">{selectedRecord.saqaId}</span>} />
                        <DetailRow icon={Award}    label="NQF Level"            value={selectedRecord.nqfLevel} />
                        <DetailRow icon={Hash}     label="Credits"              value={selectedRecord.credits} />
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registration Details</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={Calendar}     label="Proposed EISA Date"  value={formatDate(selectedRecord.eisaDate)} />
                        <DetailRow icon={CalendarClock} label="Submitted"          value={formatDate(selectedRecord.createdAt)} />
                        <DetailRow icon={Tag}           label="Stream"             value={
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${selectedRecord.stream === 'trades' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                            {selectedRecord.stream === 'trades' ? <Wrench className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                            {selectedRecord.stream === 'trades' ? 'Trades' : 'Non-Trades'}
                          </span>
                        } />
                        <DetailRow icon={ClipboardList} label="EISA Reg No"        value={<span className="font-mono">{selectedRecord.eisaRegNo}</span>} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents from QAS Addendum</p></div>
                    <div className="divide-y">
                      {[
                        { label: 'SAQA Qualification Document', val: selectedRecord.saqaQualificationDocument },
                        { label: 'Curriculum Document',         val: selectedRecord.curriculumDocument },
                        { label: 'QAS Addendum',                val: selectedRecord.qasAddendum },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-blue-600" /></div>
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-mono">{val || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedRecord.acknowledgementStatus === 'sent_to_quality_partner' && selectedRecord.acknowledgementLetterName && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 overflow-hidden">
                      <div className="px-4 py-3 bg-emerald-100 border-b border-emerald-200 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Acknowledgement Letter — Received</p>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3 bg-white rounded-xl border border-emerald-200 p-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0"><Paperclip className="h-5 w-5 text-white" /></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900">{selectedRecord.acknowledgementLetterName}</p>
                            <p className="text-xs text-gray-500">Approved by CEO</p>
                          </div>
                        </div>
                        {selectedRecord.ceoApprovalNotes && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">CEO Approval Notes</p>
                            <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-emerald-100 whitespace-pre-wrap">{selectedRecord.ceoApprovalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRecord.finalApprovalLetterName && (
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/50 overflow-hidden">
                      <div className="px-4 py-3 bg-purple-100 border-b border-purple-200 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-purple-600" />
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Signed Approval Letter — Received from QCTO</p>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3 bg-white rounded-xl border border-purple-200 p-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0"><FileSignature className="h-5 w-5 text-white" /></div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900">{selectedRecord.finalApprovalLetterName}</p>
                            <p className="text-xs text-gray-500">Signed by CEO and submitted to QP Portfolio</p>
                          </div>
                        </div>
                        {selectedRecord.ceoApprovalNotes && (
                          <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 p-3">
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">CEO Approval Notes</p>
                            <p className="text-sm text-purple-900">{selectedRecord.ceoApprovalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {hasOutcome && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-800">EISA Validation Report Available</p>
                          <div className="mt-1"><OutcomeDecisionBadge decision={outcomeDecision} /></div>
                        </div>
                      </div>
                      <button type="button" onClick={() => setActiveModalTab('outcome')}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg">
                        View Report <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {selectedRecord.registrationNumber && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-emerald-600 font-medium">Registration Number</p>
                        <p className="text-lg font-bold text-emerald-800">{selectedRecord.registrationNumber}</p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">Current Status</p>
                    <RegistrationStageBadge stage={selectedRecord.currentStage} />
                  </div>
                </div>
              )}

              {/* ─── TAB: EISA Validation Schedule ─── */}
              {activeModalTab === 'schedule' && (
                <div className="p-6 space-y-6">
                  {selectedRecord.eisaSchedule ? (
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">EISA Validation Schedule</p>
                      </div>
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
                        {selectedRecord.eisaSchedule.notes && (
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Notes</p>
                            <p className="text-sm text-gray-700">{selectedRecord.eisaSchedule.notes}</p>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Send className="h-3 w-3" /> Submitted to Internal: {formatDate(selectedRecord.eisaSchedule.submittedToInternalAt)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><CalendarClock className="h-8 w-8 text-gray-300" /></div>
                      <p className="font-medium text-gray-500">No schedule available</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB: Validation Report & Outcome ─── */}
              {activeModalTab === 'outcome' && selectedRecord.outcomeReport?.reportFinalised && (
                <div className="p-6 space-y-6">

                  <div className={`rounded-2xl border-2 p-6 text-center ${outcomeDecision === 'approved' ? 'border-emerald-300 bg-emerald-50' : outcomeDecision === 'approved_with_conditions' ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'}`}>
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${outcomeDecision === 'approved' ? 'bg-emerald-500' : outcomeDecision === 'approved_with_conditions' ? 'bg-amber-500' : 'bg-red-500'}`}>
                      {outcomeDecision === 'approved' ? <ThumbsUp className="h-7 w-7 text-white" /> : outcomeDecision === 'approved_with_conditions' ? <AlertCircle className="h-7 w-7 text-white" /> : <X className="h-7 w-7 text-white" />}
                    </div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">EISA Validation Outcome</p>
                    <OutcomeDecisionBadge decision={outcomeDecision} />
                    <p className="text-xs text-gray-500 mt-3">
                      Report finalised by {selectedRecord.outcomeReport.ddReviewedBy} on {formatDateTime(selectedRecord.outcomeReport.reportFinalisedAt)}
                    </p>
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
                        <DetailRow icon={Calendar}     label="Validation Date"     value={formatDate(selectedRecord.eisaSchedule?.validationDate)} />
                        <DetailRow icon={MapPin}       label="Venue"               value={selectedRecord.eisaSchedule?.venue} />
                        <DetailRow icon={UserIcon}     label="Assessor"            value={selectedRecord.eisaSchedule?.assessorName} />
                        <DetailRow icon={CalendarClock} label="Report Date"        value={formatDate(selectedRecord.outcomeReport.reportFinalisedAt)} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-purple-50 border-b border-purple-200 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Deputy Director Recommendations</p>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recommendations / Feedback</p>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200"><p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRecord.outcomeReport.ddRecommendations || '—'}</p></div>
                      </div>
                      {selectedRecord.outcomeReport.ddChangesRequired && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Changes Required</p>
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200"><p className="text-sm text-amber-900 whitespace-pre-wrap">{selectedRecord.outcomeReport.ddChangesRequired}</p></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRecord.outcomeReport.outcomeNotes && (
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Outcome Notes / Conditions</p>
                      </div>
                      <div className="p-4"><p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRecord.outcomeReport.outcomeNotes}</p></div>
                    </div>
                  )}

                  <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span>Reviewed & approved by <span className="font-semibold text-gray-900">{selectedRecord.outcomeReport.ddReviewedBy || 'Deputy Director'}</span></span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDateTime(selectedRecord.outcomeReport.ddReviewedAt)}</span>
                  </div>
                </div>
              )}

              {/* ─── TAB: Registration Docs ─── */}
         {/* ─── TAB: Registration Docs ─── */}
{activeModalTab === 'registration' && (
  <div className="p-6 space-y-5">

    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-gray-600" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted Documents</p>
      </div>
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
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-600" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">LEISA File Details (Compulsory Information)</p>
        </div>
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
          {selectedRecord.leisaFormData.sdpAddress && (
            <div className="md:col-span-2"><p className="text-xs text-gray-400">Address of SDP</p><p className="font-medium">{selectedRecord.leisaFormData.sdpAddress}</p></div>
          )}
        </div>
      </div>
    )}

    {selectedRecord.registrationNumber && (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div><p className="text-xs text-emerald-600 font-medium">Registration Number</p><p className="text-lg font-bold text-emerald-800">{selectedRecord.registrationNumber}</p></div>
      </div>
    )}

    {/* NOTIFY ASSESSMENT DOMAIN - Step 1 - Only show when stage is sdp_submission */}
    {activeExternalRole === 'SDP' && selectedRecord.currentStage === 'sdp_submission' && (
      <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-5">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">Available Action</p>
        <p className="text-xs text-indigo-600 mb-4">All documents have been submitted. Notify the Assessment Domain to proceed with processing this {selectedRecord.stream === 'trades' ? 'Trades' : 'Non-Trades'} registration.</p>
        <button type="button"
          onClick={() => { handleNotifyAssessmentDomain(selectedRecord.id); closeModal(); }}
          className={`inline-flex items-center gap-2 h-10 rounded-xl px-5 text-sm font-semibold text-white ${selectedRecord.stream === 'trades' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-violet-600 hover:bg-violet-700'}`}>
          <Send className="h-4 w-4" /> Notify Assessment Domain
        </button>
      </div>
    )}

    {/* SEND EISA NOTIFICATION - Step 2 - Show when record has been processed internally (has registration number) */}
    {(selectedRecord.registrationNumber && (selectedRecord.tradesSubmittedToQp || selectedRecord.nonTradesSubmittedToExternalQp)) && (
      <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-5">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">EISA Notification Ready</p>
        <p className="text-xs text-emerald-600 mb-4">
          The assessment domain has processed this registration. Send the EISA Notification to the Site Visits & Monitoring section.
        </p>
        <div className="flex items-center gap-3 mb-3 p-2 bg-white rounded-lg border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="text-sm text-emerald-700">Registration Number: <strong>{selectedRecord.registrationNumber}</strong></span>
        </div>
        <button
          type="button"
          onClick={() => handleSendEisaNotification(selectedRecord)}
          className="inline-flex items-center gap-2 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 text-sm font-semibold text-white"
        >
          <Bell className="h-4 w-4" /> Send EISA Notification
        </button>
      </div>
    )}

    {/* Message when waiting for internal processing */}
    {(!selectedRecord.registrationNumber && selectedRecord.currentStage !== 'sdp_submission') && (
      <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-5">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Awaiting Internal Processing</p>
            <p className="text-xs text-amber-700 mt-1">
              The Assessment Domain has been notified and is currently processing your registration. 
              Once completed, you will be able to send the EISA Notification.
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
)}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
              <RegistrationStageBadge stage={selectedRecord.currentStage} />
              <button type="button" onClick={closeModal}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}