// src/pages/assessment/External/ExternalValidationOfFisa.tsx
// SDP user receives notifications from the completed FISA Standards pipeline.
// They can view all the details and upload the Instrument for Validation document,
// then submit it back to InternalFisaPage → Validation of FISA (Assistant Director).

import React, { useState, useEffect } from 'react';
import {
  FileCheck, FileText, Clock, Plus, Send, Eye, CheckCircle2, AlertCircle,
  Upload, X, BookOpen, Hash, ShieldCheck, User, Award, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const SUBMISSION_KEY    = 'fisa_validation_submissions';
const NOTIFICATION_KEY  = 'fisa_sdp_notifications';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SdpNotification {
  id: string;
  sourceStandardsId: string;
  spCode: string;
  spTitle: string;
  curriculumCode: string;
  curriculumTitle: string;
  purpose: string;
  eloFocus: string;
  aacFocus: string;
  nqfLevel?: string;
  credits?: string;
  nameOfAQP?: string;
  saqaId?: string;
  isFromQasa?: boolean;
  evaluationReport?: any;
  evaluationSubmittedAt?: string | null;
  directorTeamChecklist?: Record<string, boolean> | null;
  directorTeamNotes?: string;
  aicChecklist?: Record<string, boolean> | null;
  aicNotes?: string;
  qualDevChecklist?: Record<string, boolean> | null;
  qualDevNotes?: string;
  qasaPayload?: any;
  status: 'pending_sdp_instrument' | 'instrument_submitted';
  notifiedAt: string;
  instrumentFileName: string | null;
  instrumentSubmittedAt: string | null;
}

interface FisaValidationSubmission {
  id: string;
  fisaCode: string;
  fisaTitle: string;
  instrumentName: string;
  description: string;
  submissionDate: string;
  status: 'pending' | 'allocated' | 'in_progress' | 'completed';
  allocatedAsd?: string;
  validationDate?: string;
  sourceFrom: string;
  sdpPayload?: SdpNotification;
}

type ModalTab = 'details' | 'evaluation' | 'reviews' | 'upload';

// ── Small shared UI ───────────────────────────────────────────────────────────
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

function ReviewerBlock({ title, color, checklist, notes }: {
  title: string; color: 'violet' | 'purple' | 'teal';
  checklist?: Record<string, boolean> | null; notes?: string;
}) {
  const cm = {
    violet: { bg: 'bg-violet-50/40 border-violet-200', header: 'bg-violet-100 border-violet-200', title: 'text-violet-700' },
    purple: { bg: 'bg-purple-50/40 border-purple-200', header: 'bg-purple-100 border-purple-200', title: 'text-purple-700' },
    teal:   { bg: 'bg-teal-50/40 border-teal-200',     header: 'bg-teal-100 border-teal-200',     title: 'text-teal-700'   },
  }[color];
  const items = checklist ? Object.entries(checklist) : [];
  const passed = items.filter(([, v]) => v).length;
  if (items.length === 0 && !notes) return null;
  return (
    <div className={`rounded-2xl border overflow-hidden ${cm.bg}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${cm.header}`}>
        <ShieldCheck className={`h-4 w-4 ${cm.title}`} />
        <p className={`text-xs font-semibold uppercase tracking-wider ${cm.title}`}>{title}</p>
        {items.length > 0 && <span className="ml-auto text-xs text-gray-500">{passed}/{items.length} confirmed</span>}
      </div>
      <div className="p-4 space-y-3">
        {items.length > 0 && (
          <div className="space-y-1.5">
            {items.map(([item, checked]) => (
              <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${checked ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-400 line-through'}`}>
                <div className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>{item}
              </div>
            ))}
          </div>
        )}
        {notes && <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border whitespace-pre-wrap">{notes}</p>}
      </div>
    </div>
  );
}

// ── Notification Detail Modal ─────────────────────────────────────────────────
function NotificationModal({
  notification,
  onClose,
  onInstrumentSubmit,
}: {
  notification: SdpNotification;
  onClose: () => void;
  onInstrumentSubmit: (notifId: string, fileName: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<ModalTab>('details');
  const [instrumentFile, setInstrumentFile] = useState<File | null>(null);
  const alreadySubmitted = notification.status === 'instrument_submitted';

  const handleSubmit = () => {
    if (!instrumentFile) return;
    onInstrumentSubmit(notification.id, instrumentFile.name);
    onClose();
  };

  const tabs: { id: ModalTab; label: string; icon: string; show?: boolean }[] = ([
    { id: 'details'    as ModalTab, label: 'Standards Details', icon: '📐' },
    { id: 'evaluation' as ModalTab, label: 'Evaluation Report',  icon: '📝', show: !!notification.evaluationReport },
    { id: 'reviews'    as ModalTab, label: 'Review Records',     icon: '🔍', show: !!notification.directorTeamChecklist || !!notification.aicChecklist || !!notification.qualDevChecklist },
    { id: 'upload'     as ModalTab, label: 'Upload Instrument',  icon: '📎' },
  ] as { id: ModalTab; label: string; icon: string; show?: boolean }[]).filter(t => t.show !== false);

  const rp = notification.evaluationReport;
  const recCfg: Record<string, { bg: string; label: string }> = {
    recommended:                 { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Recommended' },
    recommended_with_amendments: { bg: 'bg-amber-50 border-amber-200 text-amber-700',   label: 'With Amendments' },
    not_recommended:             { bg: 'bg-red-50 border-red-200 text-red-700',          label: 'Not Recommended' },
  };
  const cfg = rp ? (recCfg[rp.recommendation || ''] || { bg: 'bg-gray-100 text-gray-500', label: '—' }) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 flex-shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {notification.isFromQasa && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                  <Sparkles className="h-3 w-3" />Brand New Qualification
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${alreadySubmitted ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${alreadySubmitted ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                {alreadySubmitted ? 'Instrument Submitted' : 'Pending Instrument Upload'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{notification.spTitle}</h3>
            <p className="mt-0.5 text-sm text-gray-500">{notification.spCode} · {notification.curriculumCode}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center flex-shrink-0">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-b bg-white flex-shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap
                ${activeTab === tab.id ? 'border-red-500 text-red-700 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── DETAILS TAB ── */}
          {activeTab === 'details' && (
            <>
              {notification.isFromQasa && (
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-violet-800">Brand New Qualification — Routed from QASA Approval</p>
                    <p className="text-xs text-violet-600 mt-0.5">
                      Submitted by <span className="font-semibold">{notification.nameOfAQP}</span>
                      {notification.saqaId && <> · SAQA ID: <span className="font-mono">{notification.saqaId}</span></>}
                      {notification.nqfLevel && <> · NQF Level {notification.nqfLevel}</>}
                      {notification.credits && <> · {notification.credits} credits</>}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SP Document</p></div>
                  <div className="px-4 divide-y divide-gray-50">
                    <DetailRow icon={Hash}     label="SP Code"    value={<span className="font-mono">{notification.spCode}</span>} />
                    <DetailRow icon={BookOpen} label="SP Title"   value={notification.spTitle} />
                    <DetailRow icon={FileText} label="Purpose"    value={notification.purpose} />
                    {notification.nqfLevel && <DetailRow icon={Award} label="NQF Level" value={notification.nqfLevel} />}
                    {notification.credits   && <DetailRow icon={Hash}  label="Credits"   value={notification.credits} />}
                  </div>
                </div>
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Curriculum Document</p></div>
                  <div className="px-4 divide-y divide-gray-50">
                    <DetailRow icon={Hash}         label="Curriculum Code"  value={<span className="font-mono">{notification.curriculumCode}</span>} />
                    <DetailRow icon={BookOpen}     label="Curriculum Title" value={notification.curriculumTitle} />
                    <DetailRow icon={ShieldCheck}  label="ELO Focus"        value={notification.eloFocus} />
                    <DetailRow icon={ShieldCheck}  label="AAC Focus"        value={notification.aacFocus} />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── EVALUATION REPORT TAB ── */}
          {activeTab === 'evaluation' && rp && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-violet-50 border-violet-200 px-5 py-3 flex items-center gap-2">
                <span className="text-base">🔒</span>
                <p className="text-sm font-medium text-violet-800">Read-only — FISA Standards evaluation report</p>
              </div>
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Header</p></div>
                <div className="p-4 grid md:grid-cols-3 gap-4 text-sm">
                  <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Evaluator</p><p className="font-medium">{rp.evaluatorName || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Date</p><p className="font-medium">{rp.evaluationDate || '—'}</p></div>
                  <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Reference</p><p className="font-medium font-mono">{rp.reportReference || '—'}</p></div>
                </div>
              </div>
              {/* ELOs */}
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200"><p className="text-xs font-semibold text-indigo-700 uppercase">ELO Evaluation</p></div>
                <div className="p-4 space-y-3">
                  {rp.eloItems?.map((elo: any) => (
                    <div key={elo.id} className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-800">{elo.code}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${elo.aligned === true ? 'bg-emerald-100 text-emerald-700' : elo.aligned === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                          {elo.aligned === true ? 'Aligned ✓' : elo.aligned === false ? 'Not Aligned ✗' : '—'}
                        </span>
                      </div>
                      {elo.description && <p className="text-gray-700">{elo.description}</p>}
                      {elo.comments && <p className="text-gray-500 italic">{elo.comments}</p>}
                    </div>
                  ))}
                  {rp.eloOverallConclusion && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border">{rp.eloOverallConclusion}</p>}
                </div>
              </div>
              {/* AACs */}
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-purple-50 border-b border-purple-200"><p className="text-xs font-semibold text-purple-700 uppercase">AAC Evaluation</p></div>
                <div className="p-4 space-y-3">
                  {rp.aacItems?.map((aac: any) => (
                    <div key={aac.id} className="rounded-xl border border-purple-100 bg-purple-50/30 p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-800">{aac.code}</span>
                        <div className="flex gap-1.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${aac.measurable === true ? 'bg-emerald-100 text-emerald-700' : aac.measurable === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                            {aac.measurable === true ? 'Measurable' : aac.measurable === false ? 'Not measurable' : '—'}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${aac.alignedToElo === true ? 'bg-emerald-100 text-emerald-700' : aac.alignedToElo === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                            {aac.alignedToElo === true ? 'ELO aligned' : aac.alignedToElo === false ? 'Not aligned' : '—'}
                          </span>
                        </div>
                      </div>
                      {aac.description && <p className="text-gray-700">{aac.description}</p>}
                      {aac.comments && <p className="text-gray-500 italic">{aac.comments}</p>}
                    </div>
                  ))}
                  {rp.aacOverallConclusion && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border">{rp.aacOverallConclusion}</p>}
                </div>
              </div>
              {/* Findings */}
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200"><p className="text-xs font-semibold text-emerald-700 uppercase">Findings & Recommendation</p></div>
                <div className="p-4 space-y-3">
                  {rp.overallFindings && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border whitespace-pre-wrap">{rp.overallFindings}</p>}
                  {rp.recommendation && cfg && <span className={`inline-flex px-3 py-1.5 rounded-xl text-sm font-semibold border ${cfg.bg}`}>{cfg.label}</span>}
                </div>
              </div>
            </div>
          )}

          {/* ── REVIEWS TAB ── */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-violet-50 border-violet-200 px-5 py-3 flex items-center gap-2">
                <span className="text-base">🔒</span>
                <p className="text-sm font-medium text-violet-800">Read-only — Review records from the FISA Standards pipeline</p>
              </div>
              {notification.directorTeamChecklist && (
                <ReviewerBlock title="Director & Team Review" color="violet"
                  checklist={notification.directorTeamChecklist} notes={notification.directorTeamNotes} />
              )}
              {notification.aicChecklist && (
                <ReviewerBlock title="AIC Review & Validation" color="purple"
                  checklist={notification.aicChecklist} notes={notification.aicNotes} />
              )}
              {notification.qualDevChecklist && (
                <ReviewerBlock title="Qualifications Development Approval" color="teal"
                  checklist={notification.qualDevChecklist} notes={notification.qualDevNotes} />
              )}
            </div>
          )}

          {/* ── UPLOAD INSTRUMENT TAB ── */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              {alreadySubmitted ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-emerald-800">Instrument Submitted Successfully</p>
                    <p className="text-sm text-emerald-700 mt-1 font-mono">{notification.instrumentFileName}</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Submitted {notification.instrumentSubmittedAt ? new Date(notification.instrumentSubmittedAt).toLocaleDateString('en-ZA') : '—'} · Now with Assistant Director for allocation
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Upload className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Upload the Instrument for Validation</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Upload the finalised FISA instrument document. Once submitted, it will be sent to the Assistant Director for allocation and validation scheduling.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 border-dashed border-red-200 bg-red-50/20 p-8 text-center">
                    <Upload className="h-10 w-10 text-red-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Select the Instrument for Validation</p>
                    <p className="text-xs text-gray-400 mb-4">PDF or DOCX files accepted</p>
                    <input type="file" accept=".pdf,.doc,.docx" id="instrument-upload"
                      onChange={e => setInstrumentFile(e.target.files?.[0] || null)}
                      className="hidden" />
                    <label htmlFor="instrument-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer transition-colors">
                      <Upload className="h-4 w-4" />Choose File
                    </label>
                  </div>
                  {instrumentFile && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-emerald-800 truncate">{instrumentFile.name}</p>
                        <p className="text-xs text-emerald-600">Ready to submit</p>
                      </div>
                      <button onClick={() => setInstrumentFile(null)} className="h-7 w-7 rounded-lg hover:bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <X className="h-3.5 w-3.5 text-emerald-500" />
                      </button>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleSubmit} disabled={!instrumentFile}
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Send className="h-4 w-4" />Submit Instrument to Assistant Director
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ExternalValidationOfFisa() {
  // Notifications from FISA Standards (DD final step)
  const [notifications, setNotifications] = useState<SdpNotification[]>([]);
  // Legacy self-submitted validations
  const [submissions, setSubmissions] = useState<FisaValidationSubmission[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<SdpNotification | null>(null);

  // Legacy form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ fisaCode: '', fisaTitle: '', instrumentName: '', description: '' });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Load notifications from FISA Standards pipeline
  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem(NOTIFICATION_KEY);
      if (stored) setNotifications(JSON.parse(stored));
    };
    load();
    const handler = (e: StorageEvent) => { if (!e.key || e.key === NOTIFICATION_KEY) load(); };
    window.addEventListener('storage', handler);
    const interval = setInterval(load, 2000);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  // Load self-submitted (legacy) validation submissions
  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem(SUBMISSION_KEY);
      if (stored) {
        // Only show ones NOT from FISA Standards pipeline (sourceFrom !== 'FISA Standards')
        const all: FisaValidationSubmission[] = JSON.parse(stored);
        setSubmissions(all.filter(s => s.sourceFrom !== 'FISA Standards'));
      }
    };
    load();
    const handler = (e: StorageEvent) => { if (e.key === SUBMISSION_KEY) load(); };
    window.addEventListener('storage', handler);
    const interval = setInterval(load, 2000);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  // SDP submits instrument → write to fisa_validation_submissions + mark notification done
  const handleInstrumentSubmit = (notifId: string, fileName: string) => {
    const notif = notifications.find(n => n.id === notifId);
    if (!notif) return;

    // 1. Update notification status
    const updatedNotifs = notifications.map(n =>
      n.id === notifId
        ? { ...n, status: 'instrument_submitted' as const, instrumentFileName: fileName, instrumentSubmittedAt: new Date().toISOString() }
        : n
    );
    setNotifications(updatedNotifs);
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(updatedNotifs));
    window.dispatchEvent(new StorageEvent('storage', { key: NOTIFICATION_KEY }));

    // 2. Create validation submission for Assistant Director
    const existing: FisaValidationSubmission[] = (() => {
      try { return JSON.parse(localStorage.getItem(SUBMISSION_KEY) || '[]'); } catch { return []; }
    })();
    const newSub: FisaValidationSubmission = {
      id: `VAL-${notif.id}`,
      fisaCode: notif.spCode,
      fisaTitle: notif.spTitle,
      instrumentName: fileName,
      description: `Instrument submitted by SDP. SP: ${notif.spTitle}${notif.purpose ? ` — ${notif.purpose}` : ''}`,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      sourceFrom: 'FISA Standards',
      // Carry full notification data for the AD detail view
      sdpPayload: { ...updatedNotifs.find(n => n.id === notifId)! },
    };
    if (!existing.some(s => s.id === newSub.id)) {
      localStorage.setItem(SUBMISSION_KEY, JSON.stringify([newSub, ...existing]));
      window.dispatchEvent(new StorageEvent('storage', { key: SUBMISSION_KEY }));
    }

    showToast('Instrument submitted to Assistant Director for validation scheduling');
  };

  // Legacy self-submit
  const handleLegacySubmit = () => {
    const newSub: FisaValidationSubmission = {
      id: Date.now().toString(),
      fisaCode: formData.fisaCode,
      fisaTitle: formData.fisaTitle,
      instrumentName: formData.instrumentName,
      description: formData.description,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      sourceFrom: 'SDP Direct',
    };
    const existing: FisaValidationSubmission[] = (() => {
      try { return JSON.parse(localStorage.getItem(SUBMISSION_KEY) || '[]'); } catch { return []; }
    })();
    localStorage.setItem(SUBMISSION_KEY, JSON.stringify([newSub, ...existing]));
    window.dispatchEvent(new StorageEvent('storage', { key: SUBMISSION_KEY }));
    setIsFormOpen(false);
    setFormData({ fisaCode: '', fisaTitle: '', instrumentName: '', description: '' });
    showToast('FISA validation notification submitted successfully!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  const getStatusBadge = (status: string) => {
    const cfg: Record<string, string> = {
      pending:   'bg-amber-100 text-amber-800 border-amber-200',
      allocated: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    const labels: Record<string, string> = {
      pending: 'Pending Allocation', allocated: 'Allocated to ASD',
      in_progress: 'In Progress', completed: 'Completed ✓',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const pendingInstruments = notifications.filter(n => n.status === 'pending_sdp_instrument').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-gray-900 text-white px-5 py-3 shadow-2xl">
          <span style={{ color: '#34d399' }}>✓</span><span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Validation of FISA</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review notifications from the FISA Standards pipeline and upload your instrument for validation.
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
            <Plus className="h-4 w-4" />Notify New Validation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Awaiting Instrument Upload', value: pendingInstruments,                                                     color: 'from-amber-500 to-orange-600' },
          { label: 'Instrument Submitted',        value: notifications.filter(n => n.status === 'instrument_submitted').length, color: 'from-blue-500 to-indigo-600'  },
          { label: 'Self-submitted Validations',  value: submissions.length,                                                    color: 'from-slate-500 to-slate-700'  },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${c.color} items-center justify-center mb-3`}>
              <span className="text-white text-xs font-bold">{c.value}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* FISA Standards Notifications */}
      {notifications.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">📐 FISA Standards Notifications</h2>
              <p className="text-xs text-gray-400 mt-0.5">Qualifications approved through the full FISA Standards pipeline — upload your instrument to proceed</p>
            </div>
            {pendingInstruments > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{pendingInstruments} pending upload
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  {['#', 'SP Code', 'SP Title', 'NQF Level', 'Source', 'Notified', 'Status', ''].map(h => (
                    <TableHead key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notif, idx) => (
                  <TableRow key={notif.id} className="hover:bg-red-50/20 transition-colors group">
                    <TableCell className="text-gray-400 text-xs font-mono">{String(idx + 1).padStart(2, '0')}</TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-gray-900">{notif.spCode}</TableCell>
                    <TableCell className="max-w-[200px]"><span className="block truncate text-sm text-gray-700" title={notif.spTitle}>{notif.spTitle}</span></TableCell>
                    <TableCell>
                      {notif.nqfLevel && <span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">{notif.nqfLevel}</span>}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${notif.isFromQasa ? 'bg-violet-100 text-violet-700' : 'bg-red-100 text-red-700'}`}>
                        {notif.isFromQasa ? <><Sparkles className="h-2.5 w-2.5" />QASA</> : 'FISA Standards'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {new Date(notif.notifiedAt).toLocaleDateString('en-ZA')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${notif.status === 'instrument_submitted' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${notif.status === 'instrument_submitted' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        {notif.status === 'instrument_submitted' ? 'Instrument Submitted' : 'Upload Required'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setSelectedNotification(notif)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-lg hover:bg-red-100 flex items-center justify-center">
                        <Eye className="h-4 w-4 text-red-600" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Legacy self-submitted */}
      {submissions.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/80">
            <h2 className="text-base font-semibold text-gray-900">My Direct Validation Notifications</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  {['#', 'FISA Code', 'FISA Title', 'Instrument', 'Submitted', 'Status', 'Validation Date'].map(h => (
                    <TableHead key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub, idx) => (
                  <TableRow key={sub.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-400 text-xs font-mono">{idx + 1}</TableCell>
                    <TableCell className="font-mono text-sm font-semibold">{sub.fisaCode}</TableCell>
                    <TableCell className="max-w-[160px]"><span className="block truncate text-sm">{sub.fisaTitle}</span></TableCell>
                    <TableCell className="text-sm">{sub.instrumentName}</TableCell>
                    <TableCell className="text-sm text-gray-600">{sub.submissionDate}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{sub.validationDate || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {notifications.length === 0 && submissions.length === 0 && (
        <div className="rounded-2xl border bg-white p-14 text-center shadow-sm">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Validation Notifications Yet</h3>
          <p className="text-sm text-gray-500">Notifications will appear here once a qualification completes the FISA Standards pipeline.</p>
        </div>
      )}

      {/* Notification detail modal */}
      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onInstrumentSubmit={handleInstrumentSubmit}
        />
      )}

      {/* Legacy new validation form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notify FISA Validation</DialogTitle>
            <DialogDescription>Submit a new FISA validation request directly to the assessment standards domain.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>FISA Code *</Label><Input value={formData.fisaCode} onChange={e => setFormData(p => ({ ...p, fisaCode: e.target.value }))} placeholder="e.g., FISA-001" /></div>
            <div className="space-y-2"><Label>FISA Title *</Label><Input value={formData.fisaTitle} onChange={e => setFormData(p => ({ ...p, fisaTitle: e.target.value }))} placeholder="Enter FISA title" /></div>
            <div className="space-y-2"><Label>Instrument Name *</Label><Input value={formData.instrumentName} onChange={e => setFormData(p => ({ ...p, instrumentName: e.target.value }))} placeholder="Enter instrument name" /></div>
            <div className="space-y-2"><Label>Description / Notes</Label><Textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Additional details..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleLegacySubmit} disabled={!formData.fisaCode || !formData.fisaTitle || !formData.instrumentName} className="bg-red-600 hover:bg-red-700">
              <Send className="h-4 w-4 mr-2" />Submit Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}