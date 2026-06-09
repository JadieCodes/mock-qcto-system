// C:\Users\jadek\Desktop\my-cert-project\src\pages\assessment\Internal\QasaAddendumSubmission.tsx
// Updated: Submissions moved to Evaluation are hidden from this table

import React, { useState, useEffect } from 'react';
import {
  Eye, FileText, CheckCircle, Upload, Paperclip, Send,
  CheckSquare, X, User, Calendar, Hash,
  BookOpen, Award, ClipboardList, ShieldCheck, FileCheck2, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { QasaSubmission } from '../External/ExternalQasaAddendumSubmission';

const STORAGE_KEY = 'qasa_addendum_submissions';

const getWorkflowRole = (appRole: string): 'asd' | 'dd' | 'ceo' | null => {
  if (appRole === 'ASD') return 'asd';
  if (appRole === 'Deputy Director') return 'dd';
  if (appRole === 'CEO') return 'ceo';
  return null;
};

const canUploadLetter  = (r: string | null, s: string) => r === 'asd' && s === 'pending';
const canEvaluateAsDD  = (r: string | null, s: string) => r === 'dd'  && s === 'submitted_to_dd';
const canEvaluateAsCEO = (r: string | null, s: string) => r === 'ceo' && s === 'sent_to_ceo';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:                  { label: 'Pending Upload',       color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',    dot: 'bg-amber-400'   },
  submitted_to_dd:          { label: 'With Deputy Director', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',      dot: 'bg-blue-400'    },
  dd_reviewed:              { label: 'DD Evaluated',         color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200',  dot: 'bg-indigo-400'  },
  sent_to_ceo:              { label: 'With CEO',             color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200',  dot: 'bg-purple-400'  },
  ceo_approved:             { label: 'CEO Approved',         color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',dot: 'bg-emerald-400' },
  sent_to_quality_partner:  { label: 'Moved to Evaluation',  color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200',      dot: 'bg-teal-500'    },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const WORKFLOW_STEPS = [
  { key: 'pending',                 label: 'Submitted'    },
  { key: 'submitted_to_dd',         label: 'Ack. Letter'  },
  { key: 'dd_reviewed',             label: 'DD Review'    },
  { key: 'sent_to_ceo',             label: 'Sent to CEO'  },
  { key: 'ceo_approved',            label: 'CEO Approved' },
  { key: 'sent_to_quality_partner', label: 'Completed'    },
];

function WorkflowProgress({ status }: { status: string }) {
  const currentIdx = WORKFLOW_STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center">
      {WORKFLOW_STEPS.map((step, idx) => {
        const done   = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${done   ? 'bg-emerald-500 border-emerald-500 text-white'                     : ''}
                ${active ? 'bg-white border-blue-500 text-blue-600 shadow-md shadow-blue-100' : ''}
                ${!done && !active ? 'bg-white border-gray-200 text-gray-300'                 : ''}
              `}>
                {done ? <CheckCircle className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap
                ${done ? 'text-emerald-600' : active ? 'text-blue-600' : 'text-gray-400'}
              `}>{step.label}</span>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div className={`h-0.5 w-8 mb-4 mx-0.5 rounded ${idx < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
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

function ChecklistDisplay({ checklist }: { checklist: Record<string, boolean> }) {
  const items  = Object.entries(checklist);
  const passed = items.filter(([, v]) => v).length;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{passed} / {items.length} items confirmed</span>
        <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(passed / items.length) * 100}%` }} />
        </div>
      </div>
      {items.map(([item, checked]) => (
        <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
          ${checked ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-400 line-through'}`}>
          <div className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}>
            {checked && <CheckCircle className="h-3 w-3 text-white" />}
          </div>
          {item}
        </div>
      ))}
    </div>
  );
}

export function QasaAddendumSubmission() {
  const { currentRole } = useApp();
  const workflowRole = getWorkflowRole(currentRole);

  const [submissions, setSubmissions]             = useState<QasaSubmission[]>([]);
  const [selectedSubmission, setSelected]         = useState<QasaSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen]     = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [actionType, setActionType]               = useState<'upload' | 'dd_evaluate' | 'ceo_evaluate' | null>(null);
  const [uploadedLetter, setUploadedLetter]       = useState<File | null>(null);
  const [ddChecklist, setDdChecklist]             = useState<Record<string, boolean>>({});
  const [ddNotes, setDdNotes]                     = useState('');
  const [ceoChecklist, setCeoChecklist]           = useState<Record<string, boolean>>({});
  const [ceoNotes, setCeoNotes]                   = useState('');

  const checklistItems = [
    'Document is complete and legible',
    'Qualification title matches submission',
    'NQF Level is correctly stated',
    'Supporting documents are attached',
    'Letter format meets requirements',
    'Submission is within the required timeframe',
    'All required signatures are present',
  ];

  useEffect(() => {
    loadSubmissions();
    const handler = (e: StorageEvent) => { if (e.key === STORAGE_KEY) loadSubmissions(); };
    window.addEventListener('storage', handler);
    const interval = setInterval(loadSubmissions, 1000);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  const loadSubmissions = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    setSubmissions(JSON.parse(stored).map((sub: any) => ({
      ...sub,
      acknowledgementLetter:     sub.acknowledgementLetter     || null,
      acknowledgementLetterName: sub.acknowledgementLetterName || null,
      acknowledgementStatus:     sub.acknowledgementStatus     || 'pending',
      ddEvaluationChecklist:     sub.ddEvaluationChecklist     || null,
      ddRecommendationNotes:     sub.ddRecommendationNotes     || '',
      ceoEvaluationChecklist:    sub.ceoEvaluationChecklist    || null,
      ceoApprovalNotes:          sub.ceoApprovalNotes          || '',
      movedToEvaluation:         sub.movedToEvaluation         || false,
      evaluationStatus:          sub.evaluationStatus          || 'pending_asd_evaluation',
    })));
  };

  const updateSubmission = (updated: QasaSubmission) => {
    const list = submissions.map(s => s.id === updated.id ? updated : s);
    setSubmissions(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    showToast(getToastMessage(updated.acknowledgementStatus));
  };

  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2';
    el.innerHTML = `<span style="color:#34d399">✓</span> ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const getToastMessage = (status: string) => {
    const map: Record<string, string> = {
      submitted_to_dd:         'Acknowledgement Letter submitted to Deputy Director',
      dd_reviewed:             'DD evaluation saved. Ready to send to CEO',
      sent_to_ceo:             'Letter sent to CEO for approval',
      ceo_approved:            'CEO evaluation saved. Ready to approve',
      sent_to_quality_partner: 'Letter approved and sent to Quality Partner — moving to Evaluation',
    };
    return map[status] ?? 'Action completed successfully';
  };

  const handleUploadLetter = () => {
    if (!selectedSubmission || !uploadedLetter) return;
    updateSubmission({ ...selectedSubmission, acknowledgementLetterName: uploadedLetter.name, acknowledgementStatus: 'submitted_to_dd' });
    setIsActionModalOpen(false); setUploadedLetter(null); setIsViewModalOpen(false);
  };

  const handleDDEvaluation = () => {
    if (!selectedSubmission) return;
    updateSubmission({ ...selectedSubmission, ddEvaluationChecklist: ddChecklist, ddRecommendationNotes: ddNotes, acknowledgementStatus: 'dd_reviewed' });
    setIsActionModalOpen(false); setIsViewModalOpen(false);
  };

  const handleSendToCEO = () => {
    if (!selectedSubmission) return;
    updateSubmission({ ...selectedSubmission, acknowledgementStatus: 'sent_to_ceo' });
    setIsViewModalOpen(false);
  };

  const handleCEOEvaluation = () => {
    if (!selectedSubmission) return;
    updateSubmission({ ...selectedSubmission, ceoEvaluationChecklist: ceoChecklist, ceoApprovalNotes: ceoNotes, acknowledgementStatus: 'ceo_approved' });
    setIsActionModalOpen(false); setIsViewModalOpen(false);
  };

  const handleApproveAndSend = () => {
    if (!selectedSubmission) return;
    updateSubmission({
      ...selectedSubmission,
      acknowledgementStatus: 'sent_to_quality_partner',
      movedToEvaluation: true,
      evaluationStatus: 'pending_asd_evaluation',
    });
    setIsViewModalOpen(false);
  };

  const openActionModal = (type: 'upload' | 'dd_evaluate' | 'ceo_evaluate', sub: QasaSubmission) => {
    setSelected(sub); setActionType(type);
    const blank: Record<string, boolean> = {};
    checklistItems.forEach(i => { blank[i] = false; });
    if (type === 'dd_evaluate')  { setDdChecklist(sub.ddEvaluationChecklist || blank);  setDdNotes(sub.ddRecommendationNotes || ''); }
    if (type === 'ceo_evaluate') { setCeoChecklist(sub.ceoEvaluationChecklist || blank); setCeoNotes(sub.ceoApprovalNotes || ''); }
    setIsActionModalOpen(true);
  };

  // ── KEY CHANGE: active = not yet moved to evaluation; moved = completed this section
  const activeSubmissions = submissions.filter(s => !s.movedToEvaluation);
  const movedCount        = submissions.filter(s => s.movedToEvaluation).length;

  const roleLabel = workflowRole === 'asd' ? 'ASD' : workflowRole === 'dd' ? 'Deputy Director' : workflowRole === 'ceo' ? 'CEO' : currentRole || 'Unknown';
  const roleDesc  = workflowRole === 'asd' ? 'Upload acknowledgement letters and initiate the QASA evaluation workflow'
    : workflowRole === 'dd'  ? 'Review and evaluate letters, then forward to CEO for final approval'
    : workflowRole === 'ceo' ? 'Final review and approval — approved letters are sent to the Quality Partner'
    : 'Select a role from the dropdown to begin';

  return (
    <div className="space-y-6">

      {/* Role Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-200 font-medium uppercase tracking-widest">Active Session</p>
              <p className="text-lg font-bold">{roleLabel}</p>
            </div>
          </div>
          <p className="text-sm text-blue-100 max-w-xs text-right hidden md:block">{roleDesc}</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">QASA Addendum Submissions</h2>
        <p className="mt-1 text-sm text-gray-500">Manage incoming submissions and process the acknowledgement workflow</p>
      </div>

      {/* Moved-to-evaluation info banner */}
      {movedCount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
          <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
            <ArrowRight className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-teal-800">
              {movedCount} application{movedCount > 1 ? 's' : ''} moved to QASA Evaluation
            </p>
            <p className="text-xs text-teal-600 mt-0.5">
              These have completed the acknowledgement workflow and are now visible in the Evaluation tab.
            </p>
          </div>
        </div>
      )}

      {/* Stats — based on ALL submissions for totals, active for actionable counts */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Submissions', value: submissions.length,                                                                                                   color: 'from-slate-500 to-slate-700' },
          { label: 'Pending Upload',    value: activeSubmissions.filter(s => s.acknowledgementStatus === 'pending').length,                                          color: 'from-amber-500 to-orange-600' },
          { label: 'Under Review',      value: activeSubmissions.filter(s => ['submitted_to_dd','dd_reviewed','sent_to_ceo','ceo_approved'].includes(s.acknowledgementStatus)).length, color: 'from-blue-500 to-indigo-600' },
          { label: 'Moved to Evaluation', value: movedCount,                                                                                                         color: 'from-teal-500 to-emerald-600' },
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

      {/* Table — only active (not moved) submissions */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Active Submissions</h3>
          {movedCount > 0 && (
            <span className="text-xs text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full font-medium">
              {movedCount} moved to Evaluation tab
            </span>
          )}
        </div>

        {activeSubmissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-gray-300" />
            </div>
            {movedCount > 0 ? (
              <>
                <p className="font-medium text-gray-500">All submissions have moved to Evaluation</p>
                <p className="text-sm text-gray-400 mt-1">Check the QASA Evaluation tab to continue processing them.</p>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-500">No submissions yet</p>
                <p className="text-sm text-gray-400 mt-1">Quality Partners will submit applications here</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  {['#','Name of AQP','Qualification Title','SAQA ID','Date Reg. SAQA','NQF','Credits','Proposed EISA','Submitted','Gate','Ack. Letter','Status',''].map(h => (
                    <TableHead key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSubmissions.map((sub, idx) => (
                  <TableRow key={sub.id} className="hover:bg-blue-50/30 transition-colors group">
                    <TableCell className="text-gray-400 text-xs font-mono">{String(idx + 1).padStart(2, '0')}</TableCell>
                    <TableCell className="font-semibold text-gray-900 whitespace-nowrap">{sub.nameOfAQP}</TableCell>
                    <TableCell className="max-w-[160px]">
                      <span className="block truncate text-sm text-gray-700" title={sub.qualificationTitle}>{sub.qualificationTitle}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">{sub.saqaId}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {sub.dateRegisteredWithSAQA ? new Date(sub.dateRegisteredWithSAQA).toLocaleDateString('en-ZA') : '—'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold whitespace-nowrap">{sub.nqfLevel}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{sub.credits}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {sub.proposedDateOfEISA ? new Date(sub.proposedDateOfEISA).toLocaleDateString('en-ZA') : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {new Date(sub.submissionDate).toLocaleDateString('en-ZA')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border
                        ${sub.gateStatus === 'passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {sub.gateStatus === 'passed' ? '✓ Passed' : '✕ Failed'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {sub.acknowledgementLetterName ? (
                        <button
                          onClick={() => { setSelected(sub); setIsLetterModalOpen(true); }}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium whitespace-nowrap"
                        >
                          <Paperclip className="h-3 w-3" />
                          View Letter
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not uploaded</span>
                      )}
                    </TableCell>
                    <TableCell><StatusPill status={sub.acknowledgementStatus} /></TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => { setSelected(sub); setIsViewModalOpen(true); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-lg hover:bg-blue-100"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── View Details Modal ─────────────────────────────────────────────── */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
          {selectedSubmission && (() => {
            const sub = selectedSubmission;
            const hasActions =
              canUploadLetter(workflowRole, sub.acknowledgementStatus) ||
              canEvaluateAsDD(workflowRole, sub.acknowledgementStatus) ||
              canEvaluateAsCEO(workflowRole, sub.acknowledgementStatus) ||
              (workflowRole === 'dd'  && sub.acknowledgementStatus === 'dd_reviewed') ||
              (workflowRole === 'ceo' && sub.acknowledgementStatus === 'ceo_approved');

            return (
              <>
                <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Application Details</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{sub.qualificationTitle}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={sub.acknowledgementStatus} />
                    <button onClick={() => setIsViewModalOpen(false)} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Workflow Progress</p>
                    <WorkflowProgress status={sub.acknowledgementStatus} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AQP & Qualification</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={User}    label="Name of AQP"               value={sub.nameOfAQP} />
                        <DetailRow icon={BookOpen} label="Qualification Title"        value={sub.qualificationTitle} />
                        <DetailRow icon={Hash}     label="SAQA ID"                   value={<span className="font-mono">{sub.saqaId}</span>} />
                        <DetailRow icon={Calendar} label="Date Registered with SAQA"  value={sub.dateRegisteredWithSAQA ? new Date(sub.dateRegisteredWithSAQA).toLocaleDateString('en-ZA') : '—'} />
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualification Details</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={Award}    label="NQF Level"             value={sub.nqfLevel} />
                        <DetailRow icon={Hash}     label="Credits"               value={sub.credits} />
                        <DetailRow icon={Calendar} label="Proposed Date of EISA" value={sub.proposedDateOfEISA ? new Date(sub.proposedDateOfEISA).toLocaleDateString('en-ZA') : '—'} />
                        <DetailRow icon={Calendar} label="Submission Date"       value={new Date(sub.submissionDate).toLocaleDateString('en-ZA')} />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${sub.gateStatus === 'passed' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sub.gateStatus === 'passed' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        {sub.gateStatus === 'passed' ? <CheckCircle className="h-5 w-5 text-white" /> : <X className="h-5 w-5 text-white" />}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Gate Evaluation</p>
                        <p className={`font-bold ${sub.gateStatus === 'passed' ? 'text-emerald-700' : 'text-red-700'}`}>
                          {sub.gateStatus === 'passed' ? 'Gate Check Passed' : 'Gate Check Failed'}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white p-4 flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sub.acknowledgementLetterName ? 'bg-blue-500' : 'bg-gray-200'}`}>
                        <Paperclip className={`h-5 w-5 ${sub.acknowledgementLetterName ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-medium">Acknowledgement Letter</p>
                        {sub.acknowledgementLetterName ? (
                          <button onClick={() => setIsLetterModalOpen(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-full text-left">
                            {sub.acknowledgementLetterName}
                          </button>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Not yet uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {sub.notes && (
                    <div className="rounded-2xl border bg-amber-50 border-amber-200 p-4">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Notes from Applicant</p>
                      <p className="text-sm text-amber-900">{sub.notes}</p>
                    </div>
                  )}

                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attached Documents</p></div>
                    <div className="divide-y">
                      {[
                        { label: 'SAQA Qualification Document', value: sub.documents.saqaQualificationDocument },
                        { label: 'Curriculum Document',         value: sub.documents.curriculumDocument },
                        { label: 'QAS Addendum',                value: sub.documents.qasAddendum },
                      ].map(doc => (
                        <div key={doc.label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center"><FileCheck2 className="h-3.5 w-3.5 text-blue-600" /></div>
                            <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-mono">{doc.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(sub.ddEvaluationChecklist || sub.ddRecommendationNotes) && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 overflow-hidden">
                      <div className="px-4 py-3 bg-indigo-100 border-b border-indigo-200 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-indigo-600" />
                        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Deputy Director Review</p>
                      </div>
                      <div className="p-4 space-y-4">
                        {sub.ddEvaluationChecklist && <ChecklistDisplay checklist={sub.ddEvaluationChecklist} />}
                        {sub.ddRecommendationNotes && (
                          <div>
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1.5">Recommendation Notes</p>
                            <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-indigo-100 whitespace-pre-wrap">{sub.ddRecommendationNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(sub.ceoEvaluationChecklist || sub.ceoApprovalNotes) && (
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/40 overflow-hidden">
                      <div className="px-4 py-3 bg-purple-100 border-b border-purple-200 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-purple-600" />
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">CEO Review</p>
                      </div>
                      <div className="p-4 space-y-4">
                        {sub.ceoEvaluationChecklist && <ChecklistDisplay checklist={sub.ceoEvaluationChecklist} />}
                        {sub.ceoApprovalNotes && (
                          <div>
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1.5">Approval Notes</p>
                            <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-purple-100 whitespace-pre-wrap">{sub.ceoApprovalNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {hasActions && (
                    <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-4">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">Available Actions</p>
                      <div className="flex flex-wrap gap-2">
                        {canUploadLetter(workflowRole, sub.acknowledgementStatus) && (
                          <Button onClick={() => openActionModal('upload', sub)} className="bg-blue-600 hover:bg-blue-700 gap-2">
                            <Upload className="h-4 w-4" />Upload Acknowledgement Letter
                          </Button>
                        )}
                        {canEvaluateAsDD(workflowRole, sub.acknowledgementStatus) && (
                          <Button onClick={() => openActionModal('dd_evaluate', sub)} variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 gap-2">
                            <CheckSquare className="h-4 w-4" />Review & Evaluate
                          </Button>
                        )}
                        {workflowRole === 'dd' && sub.acknowledgementStatus === 'dd_reviewed' && (
                          <Button onClick={handleSendToCEO} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-2">
                            <Send className="h-4 w-4" />Send to CEO
                          </Button>
                        )}
                        {canEvaluateAsCEO(workflowRole, sub.acknowledgementStatus) && (
                          <Button onClick={() => openActionModal('ceo_evaluate', sub)} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-2">
                            <CheckSquare className="h-4 w-4" />Review & Approve
                          </Button>
                        )}
                        {workflowRole === 'ceo' && sub.acknowledgementStatus === 'ceo_approved' && (
                          <Button onClick={handleApproveAndSend} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                            <CheckCircle className="h-4 w-4" />Approve & Send to Quality Partner
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {!hasActions && (
                    <p className="text-sm text-gray-400 italic text-center py-2">No actions available for your role at this stage.</p>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Acknowledgement Letter Modal ───────────────────────────────────── */}
      <Dialog open={isLetterModalOpen} onOpenChange={setIsLetterModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-blue-600" />Acknowledgement Letter
            </DialogTitle>
            <DialogDescription>Uploaded letter on file for this submission</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border bg-blue-50 border-blue-200 p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0"><FileText className="h-5 w-5 text-white" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm break-all">{selectedSubmission.acknowledgementLetterName}</p>
                  <p className="text-xs text-gray-500 mt-1">Uploaded document</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 border p-3">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Qualification</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{selectedSubmission.qualificationTitle}</p>
                </div>
                <div className="rounded-xl bg-gray-50 border p-3">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">AQP</p>
                  <p className="text-sm font-medium text-gray-800">{selectedSubmission.nameOfAQP}</p>
                </div>
              </div>
              <div className="rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 p-8 flex flex-col items-center gap-3 text-center">
                <div className="h-14 w-14 rounded-2xl bg-white shadow flex items-center justify-center"><FileText className="h-7 w-7 text-blue-500" /></div>
                <div>
                  <p className="font-semibold text-gray-700">Document Preview</p>
                  <p className="text-xs text-gray-400 mt-1">File previews are not available in this environment.<br />The document has been saved to the system.</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${selectedSubmission.acknowledgementStatus === 'sent_to_quality_partner' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                  <CheckCircle className="h-3 w-3" />
                  {selectedSubmission.acknowledgementStatus === 'sent_to_quality_partner' ? 'Approved & Moved to Evaluation' : 'On File'}
                </span>
              </div>
              {selectedSubmission.ceoApprovalNotes && (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">CEO Approval Notes</p>
                  <p className="text-sm text-purple-900">{selectedSubmission.ceoApprovalNotes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setIsLetterModalOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Action Modal ──────────────────────────────────────────────────── */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'upload'       && <><Upload className="h-4 w-4 text-blue-600" />Upload Acknowledgement Letter</>}
              {actionType === 'dd_evaluate'  && <><ClipboardList className="h-4 w-4 text-indigo-600" />Deputy Director — Evaluation</>}
              {actionType === 'ceo_evaluate' && <><ShieldCheck className="h-4 w-4 text-purple-600" />CEO — Final Approval</>}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'upload'       && 'Upload the acknowledgement letter to proceed to Deputy Director review'}
              {actionType === 'dd_evaluate'  && 'Complete the evaluation checklist and add your recommendation notes'}
              {actionType === 'ceo_evaluate' && 'Complete the final approval checklist and add your notes'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {actionType === 'upload' && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Acknowledgement Letter File *</Label>
                <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-6 text-center">
                  <Upload className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">Select a PDF or DOCX file</p>
                  <Input type="file" accept=".pdf,.docx" onChange={(e) => setUploadedLetter(e.target.files?.[0] || null)} className="max-w-xs mx-auto" />
                </div>
                {uploadedLetter && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-emerald-700 font-medium truncate">{uploadedLetter.name}</span>
                  </div>
                )}
              </div>
            )}

            {(actionType === 'dd_evaluate' || actionType === 'ceo_evaluate') && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-semibold">Evaluation Checklist</Label>
                    <span className="text-xs text-gray-400">
                      {Object.values(actionType === 'dd_evaluate' ? ddChecklist : ceoChecklist).filter(Boolean).length} / {checklistItems.length} confirmed
                    </span>
                  </div>
                  <div className="space-y-2 rounded-xl border bg-gray-50 p-3">
                    {checklistItems.map((item) => {
                      const checked = actionType === 'dd_evaluate' ? ddChecklist[item] : ceoChecklist[item];
                      return (
                        <div key={item}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all
                            ${checked ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-gray-200 hover:border-gray-300'}`}
                          onClick={() => {
                            if (actionType === 'dd_evaluate') setDdChecklist(p => ({ ...p, [item]: !p[item] }));
                            else setCeoChecklist(p => ({ ...p, [item]: !p[item] }));
                          }}>
                          <Checkbox id={item} checked={!!checked}
                            onCheckedChange={(v) => {
                              if (actionType === 'dd_evaluate') setDdChecklist(p => ({ ...p, [item]: v === true }));
                              else setCeoChecklist(p => ({ ...p, [item]: v === true }));
                            }} />
                          <label htmlFor={item} className={`text-sm cursor-pointer select-none ${checked ? 'text-emerald-800 font-medium' : 'text-gray-700'}`}>{item}</label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{actionType === 'dd_evaluate' ? 'Recommendation Notes' : 'Approval Notes'}</Label>
                  <Textarea
                    value={actionType === 'dd_evaluate' ? ddNotes : ceoNotes}
                    onChange={(e) => actionType === 'dd_evaluate' ? setDdNotes(e.target.value) : setCeoNotes(e.target.value)}
                    placeholder={actionType === 'dd_evaluate' ? 'Enter your recommendation notes for the CEO...' : 'Enter your final approval notes...'}
                    rows={4} className="resize-none" />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (actionType === 'upload')            handleUploadLetter();
                else if (actionType === 'dd_evaluate')  handleDDEvaluation();
                else if (actionType === 'ceo_evaluate') handleCEOEvaluation();
              }}
              disabled={actionType === 'upload' && !uploadedLetter}
              className={actionType === 'dd_evaluate' ? 'bg-indigo-600 hover:bg-indigo-700' : actionType === 'ceo_evaluate' ? 'bg-purple-600 hover:bg-purple-700' : ''}>
              {actionType === 'upload'       && <><Upload className="h-4 w-4 mr-2" />Submit to Deputy Director</>}
              {actionType === 'dd_evaluate'  && <><Send className="h-4 w-4 mr-2" />Save & Forward to CEO</>}
              {actionType === 'ceo_evaluate' && <><ShieldCheck className="h-4 w-4 mr-2" />Save Approval</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}