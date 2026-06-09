// C:\Users\jadek\Desktop\my-cert-project\src\pages\assessment\External\ExternalQasaAddendumSubmission.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, FileText, CheckCircle, X, Eye, AlertCircle, Plus,
  Paperclip, RefreshCw, User, Calendar, Hash, BookOpen,
  Award, ShieldCheck, Bell,FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STORAGE_KEY = 'qasa_addendum_submissions';

export interface QasaSubmission {
  id: string;
  nameOfAQP: string;
  qualificationTitle: string;
  proposedDateOfEISA: string;
  saqaId: string;
  dateRegisteredWithSAQA: string;
  nqfLevel: string;
  credits: string;
  submissionDate: string;
  notes: string;
  gateStatus: 'passed' | 'failed';
  documents: {
    saqaQualificationDocument: string;
    curriculumDocument: string;
    qasAddendum: string;
  };
  status: 'Pending Review';
  acknowledgementLetter: string | null;
  acknowledgementLetterName: string | null;
  acknowledgementStatus: 'pending' | 'uploaded' | 'submitted_to_dd' |
                          'dd_reviewed' | 'sent_to_ceo' |
                          'ceo_approved' | 'sent_to_quality_partner';
  ddEvaluationChecklist: { [checkItem: string]: boolean } | null;
  ddRecommendationNotes: string;
  ceoEvaluationChecklist: { [checkItem: string]: boolean } | null;
  ceoApprovalNotes: string;
  movedToEvaluation: boolean;
  evaluationStatus: 'pending_asd_evaluation' | 'asd_evaluated_negative' | 'asd_evaluated_positive' |
                    'with_deputy_director' | 'deputy_director_reviewed' | 'with_iac' |
                    'iac_approved' | 'with_ceo_final' | 'ceo_final_approved' | 'completed';
  evaluationChecklist: { [key: string]: boolean } | null;
  evaluationReportName: string | null;
  ddEvaluationReview: { [key: string]: boolean } | null;
  ddReviewNotes: string;
  iacPresentationName: string | null;
  iacResolutionName: string | null;
  iacApprovalNotes: string;
  ceoFinalChecklist: { [key: string]: boolean } | null;
  ceoFinalNotes: string;
  outcomeLetterName: string | null;
  approvalStatus: 'pending_asd_draft' | 'asd_drafted' | 'with_deputy_director_approval' |
                  'deputy_director_approved' | 'with_ceo_approval' | 'ceo_approved' | 'completed_sent_to_qp';
  approvalLetterName: string | null;
  ddApprovalChecklist: { [key: string]: boolean } | null;
  ddApprovalNotes: string;
  ceoApprovalChecklist: { [key: string]: boolean } | null;
  finalApprovalLetterName: string | null;
    routedToFisa?: boolean;
  routedToEisa?: boolean;
  fisaRecordId?: string;
  eisaRecordId?: string;
  routedDate?: string;
}

const AUTO_RETRIEVED_DOCS = {
  saqaQualificationDocument: 'SAQA_Qualification_Document_AUTO.pdf',
  curriculumDocument: 'Curriculum_Document_AUTO.pdf',
  qasAddendum: 'QAS_Addendum_AUTO.pdf',
};

// ── Status config ─────────────────────────────────────────────────────────────
const ACK_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:                 { label: 'Pending',           color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',    dot: 'bg-amber-400'   },
  submitted_to_dd:         { label: 'Under Review',      color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',      dot: 'bg-blue-400'    },
  dd_reviewed:             { label: 'Under Review',      color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',      dot: 'bg-blue-400'    },
  sent_to_ceo:             { label: 'Under Review',      color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',      dot: 'bg-blue-400'    },
  ceo_approved:            { label: 'Under Review',      color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',      dot: 'bg-blue-400'    },
  sent_to_quality_partner: { label: 'Letter Received ✓', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',dot: 'bg-emerald-500' },
};

function AckStatusPill({ status }: { status: string }) {
  const cfg = ACK_STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Detail row helper ─────────────────────────────────────────────────────────
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

// ── Read-only load from localStorage (never overwrites internal changes) ──────
function readSubmissionsFromStorage(): QasaSubmission[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((sub: any) => ({
      ...sub,
      acknowledgementLetter:     sub.acknowledgementLetter     ?? null,
      acknowledgementLetterName: sub.acknowledgementLetterName ?? null,
      acknowledgementStatus:     sub.acknowledgementStatus     ?? 'pending',
      ddEvaluationChecklist:     sub.ddEvaluationChecklist     ?? null,
      ddRecommendationNotes:     sub.ddRecommendationNotes     ?? '',
      ceoEvaluationChecklist:    sub.ceoEvaluationChecklist    ?? null,
      ceoApprovalNotes:          sub.ceoApprovalNotes          ?? '',
      movedToEvaluation:         sub.movedToEvaluation         ?? false,
    }));
  } catch {
    return [];
  }
}

export default function ExternalQasaAddendumSubmission() {
  const [submissions, setSubmissions]               = useState<QasaSubmission[]>(readSubmissionsFromStorage);
  const [isFormOpen, setIsFormOpen]                 = useState(false);
  const [isGateCheckOpen, setIsGateCheckOpen]       = useState(false);
  const [isViewModalOpen, setIsViewModalOpen]       = useState(false);
  const [isAckLetterModalOpen, setIsAckLetterModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<QasaSubmission | null>(null);
  const [selectedAckSubmission, setSelectedAckSubmission] = useState<QasaSubmission | null>(null);
  const [gateCheckResult, setGateCheckResult]       = useState<'passed' | 'failed' | null>(null);
  const [isRetrievingDocs, setIsRetrievingDocs]     = useState(false);
  const [docsRetrieved, setDocsRetrieved]           = useState(false);

  // Track which IDs were submitted in *this session* so we only write those
  const sessionIdsRef = useRef<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    nameOfAQP: '',
    qualificationTitle: '',
    proposedDateOfEISA: '',
    saqaId: '',
    dateRegisteredWithSAQA: '',
    nqfLevel: '',
    credits: '',
    submissionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    saqaQualificationDocument: null as File | null,
    curriculumDocument: null as File | null,
    qasAddendum: null as File | null,
  });

  // ── Poll localStorage for updates (read-only — never writes back) ──────────
  useEffect(() => {
    const sync = () => {
      const fresh = readSubmissionsFromStorage();
      setSubmissions(fresh);
    };

    // Listen for cross-tab storage events (internal side writing)
    const handler = (e: StorageEvent) => { if (e.key === STORAGE_KEY) sync(); };
    window.addEventListener('storage', handler);

    // Also poll every 2 s to catch same-tab updates from internal side
    const interval = setInterval(sync, 2000);

    return () => {
      window.removeEventListener('storage', handler);
      clearInterval(interval);
    };
  }, []);

  // Keep open modals in sync when submissions refresh
  useEffect(() => {
    if (selectedSubmission) {
      const fresh = submissions.find(s => s.id === selectedSubmission.id);
      if (fresh) setSelectedSubmission(fresh);
    }
    if (selectedAckSubmission) {
      const fresh = submissions.find(s => s.id === selectedAckSubmission.id);
      if (fresh) setSelectedAckSubmission(fresh);
    }
  }, [submissions]);

  // ── Write helper — merges new submission into storage without overwriting ──
  const addSubmissionToStorage = (newSub: QasaSubmission) => {
    const current = readSubmissionsFromStorage();
    // Prepend the new submission and save
    const updated = [newSub, ...current.filter(s => s.id !== newSub.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Notify other tabs/components
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    setSubmissions(updated);
    sessionIdsRef.current.add(newSub.id);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (type: keyof typeof uploadedFiles, file: File | null) => {
    setUploadedFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleGateCheck = (result: 'passed' | 'failed') => {
    setGateCheckResult(result);
    setIsGateCheckOpen(false);
    if (result === 'passed') {
      setIsRetrievingDocs(true);
      setDocsRetrieved(false);
      setTimeout(() => { setIsRetrievingDocs(false); setDocsRetrieved(true); }, 2000);
    } else {
      setDocsRetrieved(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nameOfAQP: '', qualificationTitle: '', proposedDateOfEISA: '',
      saqaId: '', dateRegisteredWithSAQA: '', nqfLevel: '', credits: '',
      submissionDate: new Date().toISOString().split('T')[0], notes: '',
    });
    setUploadedFiles({ saqaQualificationDocument: null, curriculumDocument: null, qasAddendum: null });
    setGateCheckResult(null);
    setDocsRetrieved(false);
    setIsRetrievingDocs(false);
  };

  const handleSubmit = () => {
    if (!gateCheckResult) return;
    if (gateCheckResult === 'failed' && (!uploadedFiles.saqaQualificationDocument || !uploadedFiles.curriculumDocument || !uploadedFiles.qasAddendum)) {
      alert('Please upload all required documents');
      return;
    }
    if (gateCheckResult === 'passed' && !docsRetrieved) return;

    const newSubmission: QasaSubmission = {
      id: Date.now().toString(),
      nameOfAQP: formData.nameOfAQP,
      qualificationTitle: formData.qualificationTitle,
      proposedDateOfEISA: formData.proposedDateOfEISA,
      saqaId: formData.saqaId,
      dateRegisteredWithSAQA: formData.dateRegisteredWithSAQA,
      nqfLevel: formData.nqfLevel,
      credits: formData.credits,
      submissionDate: formData.submissionDate,
      notes: formData.notes,
      gateStatus: gateCheckResult,
      documents: gateCheckResult === 'passed'
        ? { ...AUTO_RETRIEVED_DOCS }
        : {
            saqaQualificationDocument: uploadedFiles.saqaQualificationDocument?.name || '',
            curriculumDocument: uploadedFiles.curriculumDocument?.name || '',
            qasAddendum: uploadedFiles.qasAddendum?.name || '',
          },
      status: 'Pending Review',
      acknowledgementLetter: null,
      acknowledgementLetterName: null,
      acknowledgementStatus: 'pending',
      ddEvaluationChecklist: null,
      ddRecommendationNotes: '',
      ceoEvaluationChecklist: null,
      ceoApprovalNotes: '',
      movedToEvaluation: false,
      evaluationStatus: 'pending_asd_evaluation',
      evaluationChecklist: null,
      evaluationReportName: null,
      ddEvaluationReview: null,
      ddReviewNotes: '',
      iacPresentationName: null,
      iacResolutionName: null,
      iacApprovalNotes: '',
      ceoFinalChecklist: null,
      ceoFinalNotes: '',
      outcomeLetterName: null,
      approvalStatus: 'pending_asd_draft',
      approvalLetterName: null,
      ddApprovalChecklist: null,
      ddApprovalNotes: '',
      ceoApprovalChecklist: null,
      finalApprovalLetterName: null,
    };

    addSubmissionToStorage(newSubmission);
    setIsFormOpen(false);
    resetForm();
  };

  const isSubmitEnabled = () => {
    const required = [formData.nameOfAQP, formData.qualificationTitle, formData.proposedDateOfEISA,
      formData.saqaId, formData.dateRegisteredWithSAQA, formData.nqfLevel, formData.credits];
    if (required.some(f => !f.trim())) return false;
    if (!gateCheckResult) return false;
    if (gateCheckResult === 'passed') return docsRetrieved;
    return !!(uploadedFiles.saqaQualificationDocument && uploadedFiles.curriculumDocument && uploadedFiles.qasAddendum);
  };

  const newLetterCount = submissions.filter(s => s.acknowledgementStatus === 'sent_to_quality_partner').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── Header Banner ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white shadow-lg">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300 font-medium uppercase tracking-widest mb-1">Quality Partner Portal</p>
              <h1 className="text-2xl font-bold">QASA Addendum Submission</h1>
              <p className="mt-1 text-sm text-slate-300">Submit and track your QASA addendum applications</p>
            </div>
            <div className="flex items-center gap-3">
              {newLetterCount > 0 && (
                <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-3 py-2">
                  <Bell className="h-4 w-4 text-emerald-300" />
                  <span className="text-xs text-emerald-200 font-medium">{newLetterCount} letter{newLetterCount > 1 ? 's' : ''} received</span>
                </div>
              )}
              <Button onClick={() => setIsFormOpen(true)} className="bg-white text-slate-800 hover:bg-slate-100 gap-2 font-semibold shadow-md">
                <Plus className="h-4 w-4" />New Application
              </Button>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Total Submitted',  value: submissions.length,                                                                                                       color: 'from-slate-500 to-slate-700' },
            { label: 'Under Review',     value: submissions.filter(s => !['pending','sent_to_quality_partner'].includes(s.acknowledgementStatus)).length,                  color: 'from-blue-500 to-indigo-600' },
            { label: 'Letters Received', value: submissions.filter(s => s.acknowledgementStatus === 'sent_to_quality_partner').length,                                    color: 'from-emerald-500 to-teal-600' },
          ].map(card => (
            <div key={card.label} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${card.color} items-center justify-center mb-3`}>
                <span className="text-white text-xs font-bold">{card.value}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* ── Received Letters notification banner ── */}
        {submissions.some(s => s.acknowledgementStatus === 'sent_to_quality_partner') && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-800 text-sm">Acknowledgement Letter(s) Available</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {submissions.filter(s => s.acknowledgementStatus === 'sent_to_quality_partner').length} application(s) approved by CEO — click "View Letter" to open your acknowledgement letter.
              </p>
            </div>
          </div>
        )}

        {/* ── Submissions Table ── */}
        {submissions.length > 0 ? (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/80 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">My Submissions</h2>
              <span className="text-xs text-gray-400">{submissions.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60">
                    {['#','Name of AQP','Qualification Title','SAQA ID','NQF Level','Credits','Proposed EISA','Gate Status','Ack. Letter','Routed To'].map(h => (
                      <TableHead key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">{h}</TableHead>
                    ))}
                  </TableRow>
                 
                </TableHeader>
                <TableBody>
                  {submissions.map((sub, idx) => (
                    <TableRow key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="text-gray-400 text-xs font-mono">{String(idx + 1).padStart(2, '0')}</TableCell>
                      <TableCell className="font-semibold text-gray-900 whitespace-nowrap">{sub.nameOfAQP}</TableCell>
                      <TableCell className="max-w-[180px]">
                        <span className="block truncate text-sm text-gray-700" title={sub.qualificationTitle}>{sub.qualificationTitle}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">{sub.saqaId}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold whitespace-nowrap">{sub.nqfLevel}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{sub.credits}</TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {sub.proposedDateOfEISA ? new Date(sub.proposedDateOfEISA).toLocaleDateString('en-ZA') : '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border
                          ${sub.gateStatus === 'passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {sub.gateStatus === 'passed' ? '✓ Passed' : '✕ Failed'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {sub.acknowledgementStatus === 'sent_to_quality_partner' ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <AckStatusPill status={sub.acknowledgementStatus} />
                            <button
                              onClick={() => { setSelectedAckSubmission(sub); setIsAckLetterModalOpen(true); }}
                              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium whitespace-nowrap"
                            >
                              <Paperclip className="h-3 w-3" />View Letter
                            </button>
                          </div>
                        ) : (
                          <AckStatusPill status={sub.acknowledgementStatus} />
                        )}
                      </TableCell>
                                <TableCell>
  {sub.approvalStatus === 'completed_sent_to_qp' && (
    sub.gateStatus === 'failed' ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
        🎯 FISA Validation
      </span>
    ) : sub.gateStatus === 'passed' ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        📋 EISA Registration
      </span>
    ) : (
      <span className="text-xs text-gray-400">Pending</span>
    )
  )}
  {sub.approvalStatus !== 'completed_sent_to_qp' && (
    <span className="text-xs text-gray-400">—</span>
  )}
</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { setSelectedSubmission(sub); setIsViewModalOpen(true); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                      </TableCell>
            
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">No applications yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Click "New Application" above to submit your first QASA addendum</p>
            <Button onClick={() => setIsFormOpen(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />Create New Application
            </Button>
          </div>
        )}

        {/* ── New Application Form Modal ── */}
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New QASA Addendum Application</DialogTitle>
              <DialogDescription>Fill in the details below, run the gate evaluation check, then submit.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name of AQP *</Label>
                  <Input value={formData.nameOfAQP} onChange={(e) => handleInputChange('nameOfAQP', e.target.value)} placeholder="Enter name of AQP" />
                </div>
                <div className="space-y-2">
                  <Label>Qualification Title *</Label>
                  <Input value={formData.qualificationTitle} onChange={(e) => handleInputChange('qualificationTitle', e.target.value)} placeholder="Enter qualification title" />
                </div>
                <div className="space-y-2">
                  <Label>SAQA ID *</Label>
                  <Input value={formData.saqaId} onChange={(e) => handleInputChange('saqaId', e.target.value)} placeholder="Enter SAQA ID" />
                </div>
                <div className="space-y-2">
                  <Label>Date Registered with SAQA *</Label>
                  <Input type="date" value={formData.dateRegisteredWithSAQA} onChange={(e) => handleInputChange('dateRegisteredWithSAQA', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>NQF Level *</Label>
                  <Select value={formData.nqfLevel} onValueChange={(v) => handleInputChange('nqfLevel', v)}>
                    <SelectTrigger><SelectValue placeholder="Select NQF Level" /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10].map(l => (
                        <SelectItem key={l} value={`Level ${l}`}>Level {l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Credits *</Label>
                  <Input type="number" min="0" value={formData.credits} onChange={(e) => handleInputChange('credits', e.target.value)} placeholder="Enter credits" />
                </div>
                <div className="space-y-2">
                  <Label>Proposed Date of EISA *</Label>
                  <Input type="date" value={formData.proposedDateOfEISA} onChange={(e) => handleInputChange('proposedDateOfEISA', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Submission Date *</Label>
                  <Input type="date" value={formData.submissionDate} onChange={(e) => handleInputChange('submissionDate', e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes / Comments</Label>
                <Textarea value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Enter any additional notes..." rows={3} />
              </div>

              {/* Gate Evaluation */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">Gate Evaluation Check</Label>
                    <p className="text-xs text-gray-500 mt-1">Run the gate check before submitting. A passed check retrieves documents automatically.</p>
                  </div>
                  <Button variant="outline" onClick={() => setIsGateCheckOpen(true)} disabled={gateCheckResult !== null}>
                    Run Gate Evaluation Check
                  </Button>
                </div>

                {gateCheckResult === 'passed' && (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">Gate Check Passed — Qualification is registered with SAQA.</AlertDescription>
                  </Alert>
                )}
                {gateCheckResult === 'passed' && isRetrievingDocs && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-800">Retrieving documents from SAQA registry…</span>
                  </div>
                )}
                {gateCheckResult === 'passed' && docsRetrieved && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <Label className="text-sm font-medium">Documents Retrieved Automatically</Label>
                    {[
                      { label: 'SAQA Qualification Document', name: AUTO_RETRIEVED_DOCS.saqaQualificationDocument },
                      { label: 'Curriculum Document',         name: AUTO_RETRIEVED_DOCS.curriculumDocument },
                      { label: 'QAS Addendum',                name: AUTO_RETRIEVED_DOCS.qasAddendum },
                    ].map(doc => (
                      <div key={doc.label} className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{doc.label}</span>
                        <span className="text-gray-500">— {doc.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {gateCheckResult === 'failed' && (
                  <>
                    <Alert className="border-red-500 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">Gate Check Failed — Please upload all required documents manually.</AlertDescription>
                    </Alert>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <Label className="text-sm font-medium">Required Documents Upload</Label>
                      {[
                        { key: 'saqaQualificationDocument' as const, label: '1. SAQA Qualification Document' },
                        { key: 'curriculumDocument' as const,         label: '2. Curriculum Document' },
                        { key: 'qasAddendum' as const,                label: '3. QAS Addendum' },
                      ].map(doc => (
                        <div key={doc.key} className="space-y-2">
                          <Label>{doc.label} *</Label>
                          <Input type="file" onChange={(e) => handleFileUpload(doc.key, e.target.files?.[0] || null)} accept=".pdf,.doc,.docx" />
                          {uploadedFiles[doc.key] && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />{uploadedFiles[doc.key]!.name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {gateCheckResult !== null && (
                  <Button variant="ghost" size="sm" className="text-xs text-gray-500"
                    onClick={() => { setGateCheckResult(null); setDocsRetrieved(false); setIsRetrievingDocs(false); setUploadedFiles({ saqaQualificationDocument: null, curriculumDocument: null, qasAddendum: null }); }}>
                    <X className="h-3 w-3 mr-1" />Reset Gate Check
                  </Button>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsFormOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!isSubmitEnabled() || isRetrievingDocs} className="gap-2">
                <Upload className="h-4 w-4" />Submit QASA Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Gate Check Modal ── */}
        <Dialog open={isGateCheckOpen} onOpenChange={setIsGateCheckOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gate Evaluation Check</DialogTitle>
              <DialogDescription>Simulate the gate evaluation check result for this application.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-sm text-gray-600">Select the outcome to simulate:</p>
              <div className="flex gap-3">
                <Button variant="destructive" className="flex-1" onClick={() => handleGateCheck('failed')}>
                  <X className="h-4 w-4 mr-2" />Fail
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleGateCheck('passed')}>
                  <CheckCircle className="h-4 w-4 mr-2" />Pass
                </Button>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Pass = Qualification found in SAQA registry, documents auto-retrieved.<br />
                Fail = Manual document upload required.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── View Submission Modal ── */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
            {selectedSubmission && (
              <>
                <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Submission Details</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedSubmission.qualificationTitle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AckStatusPill status={selectedSubmission.acknowledgementStatus} />
                    <button onClick={() => setIsViewModalOpen(false)} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AQP & Qualification</p>
                      </div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={User}     label="Name of AQP"               value={selectedSubmission.nameOfAQP} />
                        <DetailRow icon={BookOpen}  label="Qualification Title"        value={selectedSubmission.qualificationTitle} />
                        <DetailRow icon={Hash}      label="SAQA ID"                   value={<span className="font-mono">{selectedSubmission.saqaId}</span>} />
                        <DetailRow icon={Calendar}  label="Date Registered with SAQA"  value={selectedSubmission.dateRegisteredWithSAQA ? new Date(selectedSubmission.dateRegisteredWithSAQA).toLocaleDateString('en-ZA') : '—'} />
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualification Details</p>
                      </div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={Award}    label="NQF Level"             value={selectedSubmission.nqfLevel} />
                        <DetailRow icon={Hash}     label="Credits"               value={selectedSubmission.credits} />
                        <DetailRow icon={Calendar} label="Proposed Date of EISA" value={selectedSubmission.proposedDateOfEISA ? new Date(selectedSubmission.proposedDateOfEISA).toLocaleDateString('en-ZA') : '—'} />
                        <DetailRow icon={Calendar} label="Submission Date"       value={new Date(selectedSubmission.submissionDate).toLocaleDateString('en-ZA')} />
                      </div>
                    </div>
                  </div>

                  {/* Gate Status */}
                  <div className={`rounded-2xl border p-4 flex items-center gap-3 ${selectedSubmission.gateStatus === 'passed' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedSubmission.gateStatus === 'passed' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {selectedSubmission.gateStatus === 'passed' ? <CheckCircle className="h-5 w-5 text-white" /> : <X className="h-5 w-5 text-white" />}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Gate Evaluation</p>
                      <p className={`font-bold ${selectedSubmission.gateStatus === 'passed' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {selectedSubmission.gateStatus === 'passed' ? 'Gate Check Passed' : 'Gate Check Failed'}
                      </p>
                    </div>
                  </div>

                  {selectedSubmission.notes && (
                    <div className="rounded-2xl border bg-amber-50 border-amber-200 p-4">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm text-amber-900">{selectedSubmission.notes}</p>
                    </div>
                  )}

                  {/* Documents */}
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attached Documents</p>
                    </div>
                    <div className="divide-y">
                      {[
                        { label: 'SAQA Qualification Document', value: selectedSubmission.documents.saqaQualificationDocument },
                        { label: 'Curriculum Document',         value: selectedSubmission.documents.curriculumDocument },
                        { label: 'QAS Addendum',                value: selectedSubmission.documents.qasAddendum },
                      ].map(doc => (
                        <div key={doc.label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FileText className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-mono">{doc.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Acknowledgement Letter section (only when received) */}
                  {selectedSubmission.acknowledgementStatus === 'sent_to_quality_partner' && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 overflow-hidden">
                      <div className="px-4 py-3 bg-emerald-100 border-b border-emerald-200 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Acknowledgement Letter — Received</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3 bg-white rounded-xl border border-emerald-200 p-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <Paperclip className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900">{selectedSubmission.acknowledgementLetterName}</p>
                            <p className="text-xs text-gray-500">Approved by CEO</p>
                          </div>
                          <button
                            onClick={() => { setSelectedAckSubmission(selectedSubmission); setIsAckLetterModalOpen(true); }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline whitespace-nowrap"
                          >
                            Open Letter
                          </button>
                        </div>
                        {selectedSubmission.ceoApprovalNotes && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">CEO Approval Notes</p>
                            <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-emerald-100 whitespace-pre-wrap">{selectedSubmission.ceoApprovalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedSubmission.finalApprovalLetterName && (
  <div className="rounded-2xl border border-purple-200 bg-purple-50/50 overflow-hidden">
    <div className="px-4 py-3 bg-purple-100 border-b border-purple-200 flex items-center gap-2">
      <ShieldCheck className="h-4 w-4 text-purple-600" />
      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Signed Approval Letter — Received from QCTO</p>
    </div>
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3 bg-white rounded-xl border border-purple-200 p-3">
        <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
          <FileSignature className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{selectedSubmission.finalApprovalLetterName}</p>
          <p className="text-xs text-gray-500">Signed by CEO and submitted to QP Portfolio</p>
        </div>
        <button
          onClick={() => {
            // You can add a download/preview functionality here
            alert(`Opening: ${selectedSubmission.finalApprovalLetterName}\n\nIn production, this would open the actual document.`);
          }}
          className="text-xs text-purple-600 hover:text-purple-800 font-medium hover:underline whitespace-nowrap flex items-center gap-1"
        >
          <Eye className="h-3 w-3" /> View Letter
        </button>
      </div>
      
      {/* Show any final approval notes from CEO if available */}
      {selectedSubmission.ceoApprovalNotes && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">CEO Approval Notes</p>
          <p className="text-sm text-purple-900">{selectedSubmission.ceoApprovalNotes}</p>
        </div>
      )}
      
      {/* Show submission timestamp */}
      <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-purple-100 pt-2 mt-2">
        <Calendar className="h-3 w-3" />
        <span>Submitted to QP Portfolio: {new Date().toLocaleDateString('en-ZA')}</span>
      </div>
    </div>
  </div>
)}

                  <div className="rounded-2xl border bg-gray-50 p-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1.5">Application Status</p>
                    <AckStatusPill status={selectedSubmission.acknowledgementStatus} />
                  </div>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50/80 flex justify-end">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Acknowledgement Letter Modal ── */}
        <Dialog open={isAckLetterModalOpen} onOpenChange={setIsAckLetterModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-emerald-600" />
                Acknowledgement Letter
              </DialogTitle>
              <DialogDescription>CEO-approved acknowledgement letter for your application</DialogDescription>
            </DialogHeader>

            {selectedAckSubmission && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Approved by CEO</p>
                    <p className="text-xs text-emerald-600">Reviewed and approved through the full internal workflow</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-blue-50 border-blue-200 p-4 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm break-all">{selectedAckSubmission.acknowledgementLetterName}</p>
                    <p className="text-xs text-gray-500 mt-1">Uploaded by ASD — Approved by CEO</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Qualification', value: selectedAckSubmission.qualificationTitle },
                    { label: 'AQP',           value: selectedAckSubmission.nameOfAQP },
                    { label: 'SAQA ID',       value: selectedAckSubmission.saqaId },
                    { label: 'NQF Level',     value: selectedAckSubmission.nqfLevel },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl bg-gray-50 border p-3">
                      <p className="text-xs text-gray-400 uppercase font-semibold mb-1">{item.label}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 p-8 flex flex-col items-center gap-3 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-white shadow flex items-center justify-center">
                    <FileText className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">Document Preview</p>
                    <p className="text-xs text-gray-400 mt-1">File previews are not available in this environment.<br />The document has been saved to the system.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    <CheckCircle className="h-3 w-3" />Approved & Sent to Quality Partner
                  </span>
                </div>

                {selectedAckSubmission.ceoApprovalNotes && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">CEO Approval Notes</p>
                    <p className="text-sm text-purple-900">{selectedAckSubmission.ceoApprovalNotes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAckLetterModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}