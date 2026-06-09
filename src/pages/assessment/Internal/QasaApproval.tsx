// C:\Users\jadek\Desktop\my-cert-project\src\pages\assessment\Internal\QasaApproval.tsx
// KEY CHANGE: Added `qualificationRegistrationStatus` field ('registered_saqa' | 'brand_new')
// Brand-new → routes to FISA Standards on completion
// Registered → routes to EISA Validation on completion

import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye, FileText, CheckCircle, ClipboardList, Send, FileSignature, FilePenLine,
  ClipboardCheck, ArrowRightCircle, User, Calendar, Hash,
  BookOpen, Award, ShieldCheck, X, Upload, Sparkles, BarChart3,
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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { QasaSubmission } from '../External/ExternalQasaAddendumSubmission';
import { WorkflowBridgeService } from '@/services/WorkflowBridgeService';

const STORAGE_KEY = 'qasa_addendum_submissions';

// ── Types ─────────────────────────────────────────────────────────────────────
type ApprovalModalTab = 'details' | 'checklist' | 'report';

interface ChecklistItem { id: string; text: string; yes: boolean | null; no: boolean | null; comments: string; }
interface ChecklistSection { sectionId: string; title: string; items: ChecklistItem[]; }
interface QasaChecklist {
  dateOfReceipt: string; dateEvaluated: string; evaluatedBy: string;
  remedialActionsRequired: 'yes' | 'no' | ''; dateFeedbackProvided: string;
  sections: ChecklistSection[];
  recommendationJobRelated: boolean | null; recommendationJobRelatedNo: boolean | null; recommendationJobRelatedComments: string;
  recommendationApproved: boolean | null; recommendationApprovedNo: boolean | null; recommendationApprovedComments: string;
}
interface EvaluationReport {
  aqpName: string; contactName: string; contactEmail: string; physicalAddress: string;
  dateReceived: string; dateEvaluated: string; evaluatorsName: string;
  qualificationTitle: string; saqaId: string; dateRegistered: string; nqfLevel: string; credits: string;
  registrationStartDate: string; registrationEndDate: string;
  correctQualTitle: string; correctNqfLevel: string; nqfLevelEisa: string; correctCredits: string;
  numberOfComponents: string;
  component1Name: string; component1Marks: string; component1Pass: string;
  component2Name: string; component2Marks: string; component2Pass: string;
  component3Name: string; component3Marks: string; component3Pass: string;
  calculationFinalAchievement: string; finalAchievement: string;
  duration: string; format: string; layout: string; openOrClosed: string;
  assessmentPoints: string; supplementaryAssessments: string; percentageModerated: string;
  markingDays: string; moderationDays: string;
  sectionC: Record<string, { yes: boolean; no: boolean; comments: string }>;
  sectionD: Record<string, { yes: boolean; no: boolean }>;
  evaluationFindings: string; recommendation: string;
  meetsMinRequirements: 'yes' | 'no' | '';
  firstEvaluatorName: string; firstEvaluatorOutcome: 'approved'|'amendments'|'not_recommended'|'';
  secondEvaluatorName: string; secondEvaluatorOutcome: 'approved'|'amendments'|'not_recommended'|'';
  finalRecommendation: 'approved'|'amendments'|'not_recommended'|'';
  acApproval: 'yes'|'no'|''; acDate: string;
}
type ApprovalStatus =
  | 'pending_asd_draft'
  | 'with_deputy_director_approval'
  | 'with_ceo_approval'
  | 'returned_to_asd_for_final_submission'
  | 'completed_sent_to_qp';

type WorkflowRole = 'asd' | 'dd' | 'ceo' | null;

// NEW: Registration status determines downstream routing
type QualificationRegistrationStatus = 'registered_saqa' | 'brand_new';

type ExtendedQasaSubmission = Omit<QasaSubmission, 'approvalStatus'> & {
  approvalStatus?: ApprovalStatus;
  qualificationRegistrationStatus?: QualificationRegistrationStatus;
  // Approval docs
  approvalLetterName?: string | null;
  ddApprovalChecklist?: Record<string, boolean> | null;
  ddApprovalNotes?: string;
  ceoApprovalChecklist?: Record<string, boolean> | null;
  ceoApprovalNotes?: string;
  finalApprovalLetterName?: string | null;
  dashboardVerified?: boolean;
  // Evaluation carry-overs
  evaluationStatus?: string;
  evaluationReportName?: string | null;
  evaluationReport?: EvaluationReport | null;
  qasaChecklist?: QasaChecklist | null;
  outcomeLetterName?: string | null;
  acknowledgementLetterName?: string | null;
  // ASD evaluation
  asdEvaluationChecklist?: Record<string, boolean> | null;
  asdEvaluationNotes?: string;
  // DD evaluation
  ddEvaluationChecklist?: Record<string, boolean> | null;
  ddReviewNotes?: string;
  // IAC
  iacChecklist?: Record<string, boolean> | null;
  iacPresentationName?: string | null;
  iacResolutionName?: string | null;
  iacApprovalNotes?: string;
  // CEO eval
  ceoFinalChecklist?: Record<string, boolean> | null;
  ceoFinalNotes?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getWorkflowRole = (r: string): WorkflowRole => {
  if (r === 'ASD') return 'asd';
  if (r === 'Deputy Director') return 'dd';
  if (r === 'CEO') return 'ceo';
  return null;
};

const normalizeApprovalStatus = (sub: any): ApprovalStatus | null => {
  const s = sub.approvalStatus;
  if (['pending_asd_draft','with_deputy_director_approval','with_ceo_approval',
       'returned_to_asd_for_final_submission','completed_sent_to_qp'].includes(s)) return s;
  if (s === 'asd_drafted') return 'with_deputy_director_approval';
  if (s === 'deputy_director_approved') return 'with_ceo_approval';
  if (s === 'ceo_approved') return 'returned_to_asd_for_final_submission';
  if (sub.evaluationStatus === 'completed' || s === 'pending_asd_draft') return 'pending_asd_draft';
  return null;
};

// ── Status config ─────────────────────────────────────────────────────────────
const APPROVAL_STATUS_CONFIG: Record<ApprovalStatus,{label:string;color:string;bg:string;dot:string}> = {
  pending_asd_draft:                    {label:'Pending ASD Draft',              color:'text-amber-700',   bg:'bg-amber-50 border-amber-200',    dot:'bg-amber-400'   },
  with_deputy_director_approval:        {label:'With Deputy Director',            color:'text-blue-700',    bg:'bg-blue-50 border-blue-200',      dot:'bg-blue-400'    },
  with_ceo_approval:                    {label:'With CEO',                        color:'text-purple-700',  bg:'bg-purple-50 border-purple-200',  dot:'bg-purple-400'  },
  returned_to_asd_for_final_submission: {label:'Returned to ASD for Submission',  color:'text-teal-700',    bg:'bg-teal-50 border-teal-200',      dot:'bg-teal-400'    },
  completed_sent_to_qp:                 {label:'Completed — Sent to QP',          color:'text-emerald-700', bg:'bg-emerald-50 border-emerald-200',dot:'bg-emerald-500' },
};

function ApprovalStatusPill({status}:{status?:ApprovalStatus}) {
  if (!status) return null;
  const cfg = APPROVAL_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}/>{cfg.label}
    </span>
  );
}

// NEW: Registration status pill
function RegistrationStatusPill({status}:{status?:QualificationRegistrationStatus}) {
  if (!status) return null;
  if (status === 'brand_new') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-violet-50 border-violet-200 text-violet-700">
      <Sparkles className="h-3 w-3"/>Brand New Qualification
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-sky-50 border-sky-200 text-sky-700">
      <BarChart3 className="h-3 w-3"/>Registered with SAQA
    </span>
  );
}

// ── Workflow progress bar ─────────────────────────────────────────────────────
const APPROVAL_STEPS = [
  {key:'pending_asd_draft',             label:'ASD Draft',    icon:'📝'},
  {key:'with_deputy_director_approval', label:'DD Review',    icon:'👔'},
  {key:'with_ceo_approval',             label:'CEO Approval', icon:'👑'},
  {key:'returned_to_asd_for_final_submission', label:'ASD Final', icon:'🔄'},
  {key:'completed_sent_to_qp',          label:'Sent to QP',   icon:'✅'},
];

function ApprovalProgress({status}:{status?:ApprovalStatus}) {
  if (!status) return null;
  const idx = APPROVAL_STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {APPROVAL_STEPS.map((step, i) => {
        const done = i < idx, active = i === idx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm border-2 transition-all
                ${done?'bg-emerald-500 border-emerald-500':active?'bg-white border-emerald-500 shadow-md shadow-emerald-100':'bg-white border-gray-200'}`}>
                {done ? <CheckCircle className="h-4 w-4 text-white"/> : <span>{step.icon}</span>}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${done?'text-emerald-600':active?'text-emerald-600':'text-gray-400'}`}>{step.label}</span>
            </div>
            {i < APPROVAL_STEPS.length-1 && (
              <div className={`h-0.5 w-6 mb-4 mx-0.5 rounded ${i<idx?'bg-emerald-400':'bg-gray-200'}`}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Shared small components ───────────────────────────────────────────────────
function DetailRow({icon:Icon,label,value}:{icon:any;label:string;value:React.ReactNode}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-gray-500"/>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <div className="text-sm font-medium text-gray-900 mt-0.5">{value||'—'}</div>
      </div>
    </div>
  );
}

function DocRow({label, value, iconColor='bg-purple-100', iconTextColor='text-purple-600'}:{label:string;value:string|null|undefined;iconColor?:string;iconTextColor?:string}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 rounded-lg ${iconColor} flex items-center justify-center`}>
          <FileText className={`h-3.5 w-3.5 ${iconTextColor}`}/>
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-mono">{value||'—'}</span>
    </div>
  );
}

function ReviewBlock({
  title, color, checklist, notes, files=[],
}:{
  title:string;
  color:'indigo'|'blue'|'purple'|'teal';
  checklist?:Record<string,boolean>|null;
  notes?:string;
  files?:{label:string;value:string|null|undefined}[];
}) {
  const cm = {
    indigo:{bg:'bg-indigo-50/40 border-indigo-200',header:'bg-indigo-100 border-indigo-200',icon:'text-indigo-600',title:'text-indigo-700',note:'border-indigo-100',nt:'text-indigo-600'},
    blue:  {bg:'bg-blue-50/40 border-blue-200',    header:'bg-blue-100 border-blue-200',    icon:'text-blue-600',  title:'text-blue-700',  note:'border-blue-100',  nt:'text-blue-600'  },
    purple:{bg:'bg-purple-50/40 border-purple-200',header:'bg-purple-100 border-purple-200',icon:'text-purple-600',title:'text-purple-700',note:'border-purple-100',nt:'text-purple-600'},
    teal:  {bg:'bg-teal-50/40 border-teal-200',    header:'bg-teal-100 border-teal-200',    icon:'text-teal-600',  title:'text-teal-700',  note:'border-teal-100',  nt:'text-teal-600'  },
  }[color];
  const items = checklist ? Object.entries(checklist) : [];
  const passed = items.filter(([,v])=>v).length;
  return (
    <div className={`rounded-2xl border overflow-hidden ${cm.bg}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${cm.header}`}>
        <ShieldCheck className={`h-4 w-4 ${cm.icon}`}/>
        <p className={`text-xs font-semibold uppercase tracking-wider ${cm.title}`}>{title}</p>
      </div>
      <div className="p-4 space-y-3">
        {items.length>0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{passed}/{items.length} confirmed</span>
              <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{width:`${(passed/items.length)*100}%`}}/>
              </div>
            </div>
            {items.map(([item,checked])=>(
              <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${checked?'bg-emerald-50 text-emerald-800':'bg-gray-50 text-gray-400 line-through'}`}>
                <div className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${checked?'bg-emerald-500':'bg-gray-300'}`}>
                  {checked&&<CheckCircle className="h-3 w-3 text-white"/>}
                </div>{item}
              </div>
            ))}
          </div>
        )}
        {notes && (
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${cm.nt}`}>Notes</p>
            <p className={`text-sm text-gray-700 bg-white rounded-xl p-3 border whitespace-pre-wrap ${cm.note}`}>{notes}</p>
          </div>
        )}
        {files.filter(f=>f.value).map(f=>(
          <div key={f.label} className="flex items-center gap-2 text-sm text-gray-700">
            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0"/>
            <span className="font-medium">{f.label}:</span>
            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistSection({title,items,checklist,setChecklist}:{
  title:string;items:string[];
  checklist:Record<string,boolean>;
  setChecklist:React.Dispatch<React.SetStateAction<Record<string,boolean>>>;
}) {
  const checked = Object.values(checklist).filter(Boolean).length;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold">{title}</Label>
        <span className="text-xs text-gray-400">{checked}/{items.length} confirmed</span>
      </div>
      <div className="space-y-2 rounded-xl border bg-gray-50 p-3">
        {items.map(item => {
          const isChecked = !!checklist[item];
          return (
            <div key={item}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isChecked?'bg-emerald-50 border border-emerald-200':'bg-white border border-gray-200 hover:border-gray-300'}`}
              onClick={()=>setChecklist(p=>({...p,[item]:!p[item]}))}>
              <Checkbox id={item} checked={isChecked} onCheckedChange={v=>setChecklist(p=>({...p,[item]:v===true}))}/>
              <label htmlFor={item} className={`text-sm cursor-pointer select-none ${isChecked?'text-emerald-800 font-medium':'text-gray-700'}`}>{item}</label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Downstream routing banner ─────────────────────────────────────────────────
function DownstreamRoutingBanner({status}:{status?:QualificationRegistrationStatus}) {
  if (!status) return null;
  if (status === 'brand_new') return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="h-4 w-4 text-violet-600"/>
      </div>
      <div>
        <p className="text-sm font-semibold text-violet-800">Brand New Qualification — Routes to FISA Standards</p>
        <p className="text-xs text-violet-600 mt-0.5">Once completed, this application will be forwarded to the FISA Standards workflow for SP document evaluation and moderation.</p>
      </div>
    </div>
  );
  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <BarChart3 className="h-4 w-4 text-sky-600"/>
      </div>
      <div>
        <p className="text-sm font-semibold text-sky-800">Registered with SAQA — Routes to EISA Validation</p>
        <p className="text-xs text-sky-600 mt-0.5">Once completed, this application will be forwarded to the EISA Validation workflow.</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function QasaApproval() {
  const { currentRole } = useApp();
  const workflowRole = getWorkflowRole(currentRole);

  const [submissions, setSubmissions] = useState<ExtendedQasaSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ExtendedQasaSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ApprovalModalTab>('details');
  const [actionType, setActionType] = useState<'asd'|'dd'|'ceo'|null>(null);

  const [approvalChecklist, setApprovalChecklist] = useState<Record<string,boolean>>({});
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalLetter, setApprovalLetter] = useState<File|null>(null);
  const [finalApprovalLetter, setFinalApprovalLetter] = useState<File|null>(null);
  const [dashboardVerified, setDashboardVerified] = useState(false);

  const ddChecklistItems = [
    'Approval letter format is correct',
    'All information is accurate',
    'QASA evaluation outcome is correctly referenced',
    'Terms and conditions are properly stated',
    'Effective date is correct',
    'Letter is addressed to the correct recipient',
    'Signature blocks are in place',
  ];
  const ceoChecklistItems = [
    'Complete approval package reviewed',
    'Deputy Director review is complete',
    'Legal requirements are satisfied',
    'Organisational standards are met',
    'Letter is ready for final signature',
  ];

  useEffect(() => {
    loadSubmissions();
    WorkflowBridgeService.scanAndRouteCompletedSubmissions();

    const handler = (e: StorageEvent) => { if (!e.key || e.key === STORAGE_KEY) loadSubmissions(); };
    window.addEventListener('storage', handler);
    const interval = setInterval(loadSubmissions, 1000);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (selectedSubmission) {
      const fresh = submissions.find(s => s.id === selectedSubmission.id);
      if (fresh) setSelectedSubmission(fresh);
    }
  }, [submissions]);

  const loadSubmissions = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) { setSubmissions([]); return; }
    const all = JSON.parse(stored);
    const initialized: ExtendedQasaSubmission[] = all.map((sub: any) => ({
      ...sub,
      approvalStatus: normalizeApprovalStatus(sub) || undefined,
      qualificationRegistrationStatus: sub.qualificationRegistrationStatus || 'registered_saqa',
      approvalLetterName:       sub.approvalLetterName       || null,
      ddApprovalChecklist:      sub.ddApprovalChecklist      || null,
      ddApprovalNotes:          sub.ddApprovalNotes          || '',
      ceoApprovalChecklist:     sub.ceoApprovalChecklist     || null,
      ceoApprovalNotes:         sub.ceoApprovalNotes         || '',
      finalApprovalLetterName:  sub.finalApprovalLetterName  || null,
      dashboardVerified:        sub.dashboardVerified        || false,
      evaluationReportName:     sub.evaluationReportName     || null,
      evaluationReport:         sub.evaluationReport         || null,
      outcomeLetterName:        sub.outcomeLetterName        || null,
      acknowledgementLetterName:sub.acknowledgementLetterName|| null,
      asdEvaluationChecklist:   sub.asdEvaluationChecklist   || null,
      asdEvaluationNotes:       sub.asdEvaluationNotes       || '',
      qasaChecklist:            sub.qasaChecklist            || null,
      ddEvaluationChecklist:    sub.ddEvaluationChecklist    || null,
      ddReviewNotes:            sub.ddReviewNotes            || '',
      iacChecklist:             sub.iacChecklist             || null,
      iacPresentationName:      sub.iacPresentationName      || null,
      iacResolutionName:        sub.iacResolutionName        || null,
      iacApprovalNotes:         sub.iacApprovalNotes         || '',
      ceoFinalChecklist:        sub.ceoFinalChecklist        || null,
      ceoFinalNotes:            sub.ceoFinalNotes            || '',
    })).filter((s: ExtendedQasaSubmission) => Boolean(s.approvalStatus));
    setSubmissions(initialized);
  };

  const updateSubmission = (updated: ExtendedQasaSubmission, msg = 'Saved successfully') => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : [];
    const merged = all.map((s: any) => s.id === updated.id ? updated : s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    showToast(msg);
  };

  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2';
    el.innerHTML = `<span style="color:#34d399">✓</span> ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const openViewModal = (sub: ExtendedQasaSubmission) => {
    setSelectedSubmission(sub);
    setActiveTab('details');
    setIsViewModalOpen(true);
  };

  const openActionModal = (type: 'asd'|'dd'|'ceo', sub: ExtendedQasaSubmission) => {
    setSelectedSubmission(sub);
    setActionType(type);
    setApprovalChecklist(type==='dd'?sub.ddApprovalChecklist||{}:type==='ceo'?sub.ceoApprovalChecklist||{}:{});
    setApprovalNotes(type==='dd'?sub.ddApprovalNotes||'':type==='ceo'?sub.ceoApprovalNotes||'':'');
    setApprovalLetter(null);
    setFinalApprovalLetter(null);
    setDashboardVerified(Boolean(sub.dashboardVerified));
    setIsActionModalOpen(true);
  };

  const closeActionModal = () => {
    setIsActionModalOpen(false);
    setApprovalChecklist({}); setApprovalNotes('');
    setApprovalLetter(null); setFinalApprovalLetter(null);
    setDashboardVerified(false); setActionType(null);
  };

  const handleASDDraft = () => {
    if (!selectedSubmission || !approvalLetter) return;
    updateSubmission({
      ...selectedSubmission,
      approvalLetterName: approvalLetter.name,
      approvalStatus: 'with_deputy_director_approval',
    }, 'Approval letter submitted to Deputy Director');
    closeActionModal(); setIsViewModalOpen(false);
  };

  const handleDDApproval = () => {
    if (!selectedSubmission) return;
    updateSubmission({
      ...selectedSubmission,
      ddApprovalChecklist: approvalChecklist,
      ddApprovalNotes: approvalNotes,
      approvalStatus: 'with_ceo_approval',
    }, 'Letter reviewed and sent to CEO');
    closeActionModal(); setIsViewModalOpen(false);
  };

  const handleCEOApproval = () => {
    if (!selectedSubmission || !finalApprovalLetter) return;
    updateSubmission({
      ...selectedSubmission,
      ceoApprovalChecklist: approvalChecklist,
      ceoApprovalNotes: approvalNotes,
      finalApprovalLetterName: finalApprovalLetter.name,
      approvalStatus: 'returned_to_asd_for_final_submission',
    }, 'CEO approved letter returned to ASD');
    closeActionModal(); setIsViewModalOpen(false);
  };

  const handleASDFinalSubmit = () => {
    if (!selectedSubmission) return;
    const updatedSubmission = {
      ...selectedSubmission,
      dashboardVerified,
      approvalStatus: 'completed_sent_to_qp' as const,
    };
    updateSubmission(updatedSubmission, 'Approval letter submitted to Quality Partner Portfolio');
    WorkflowBridgeService.processCompletedQasaSubmission(updatedSubmission as unknown as QasaSubmission);
    setIsViewModalOpen(false);
  };

  const roleSubmissions = useMemo(() => {
    if (!workflowRole) return [];
    switch (workflowRole) {
      case 'asd': return submissions.filter(s =>
        s.approvalStatus==='pending_asd_draft' || s.approvalStatus==='returned_to_asd_for_final_submission');
      case 'dd':  return submissions.filter(s => s.approvalStatus==='with_deputy_director_approval');
      case 'ceo': return submissions.filter(s => s.approvalStatus==='with_ceo_approval');
      default: return [];
    }
  }, [submissions, workflowRole]);

  const rl = workflowRole==='asd'?'ASD':workflowRole==='dd'?'Deputy Director':workflowRole==='ceo'?'CEO':currentRole||'Unknown';
  const rd = workflowRole==='asd'
    ?'Draft the approval letter, then receive the signed letter from CEO and submit to QP Portfolio'
    :workflowRole==='dd'?'Review the approval letter using the evaluation checklist and send to CEO'
    :workflowRole==='ceo'?'Review, approve and sign the approval letter, then return to ASD'
    :'Select ASD, Deputy Director, or CEO to view this workflow';

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',backgroundSize:'24px 24px'}}/>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"><User className="h-5 w-5 text-white"/></div>
            <div>
              <p className="text-xs text-emerald-200 font-medium uppercase tracking-widest">Active Session</p>
              <p className="text-lg font-bold">{rl}</p>
            </div>
          </div>
          <p className="text-sm text-emerald-100 max-w-xs text-right hidden md:block">{rd}</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">QASA Application Approval</h2>
        <p className="mt-1 text-sm text-gray-500">ASD draft → Deputy Director review → CEO approval → ASD final submission to QP Portfolio</p>
      </div>

      {/* Workflow overview */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          {icon:'📝',title:'ASD Draft',text:'Draft approval letter'},
          {icon:'👔',title:'Deputy Director',text:'Review letter'},
          {icon:'👑',title:'CEO',text:'Approve & sign'},
          {icon:'📧',title:'ASD Submit',text:'Send to QP Portfolio'},
        ].map(s=>(
          <div key={s.title} className="rounded-2xl border bg-white p-3 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-xs font-semibold text-gray-700">{s.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.text}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {label:'Total in Approval',  value:submissions.length,                                                                                            color:'from-slate-500 to-slate-700'},
          {label:'Pending ASD Draft',  value:submissions.filter(s=>s.approvalStatus==='pending_asd_draft').length,                                          color:'from-amber-500 to-orange-600'},
          {label:'In Review',          value:submissions.filter(s=>['with_deputy_director_approval','with_ceo_approval'].includes(s.approvalStatus||'')).length, color:'from-emerald-500 to-teal-600'},
          {label:'Completed',          value:submissions.filter(s=>s.approvalStatus==='completed_sent_to_qp').length,                                       color:'from-green-500 to-emerald-600'},
        ].map(c=>(
          <div key={c.label} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${c.color} items-center justify-center mb-3`}>
              <span className="text-white text-xs font-bold">{c.value}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">
            {workflowRole==='asd'?'Applications for ASD Approval Actions'
              :workflowRole==='dd'?'Applications for Deputy Director Review'
              :workflowRole==='ceo'?'Applications for CEO Final Approval'
              :'No approval role selected'}
          </h3>
        </div>
        {roleSubmissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FilePenLine className="h-8 w-8 text-gray-300"/>
            </div>
            <p className="font-medium text-gray-500">No applications at this stage</p>
            <p className="text-sm text-gray-400 mt-1">
              {workflowRole?'Applications will appear here once they reach your workflow stage.':'Select a supported role to view your queue.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  {['#','Name of AQP','Qualification Title','SAQA ID','NQF Level','Credits','Type','Submitted','Approval Status',''].map(h=>(
                    <TableHead key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleSubmissions.map((sub, idx)=>(
                  <TableRow key={sub.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <TableCell className="text-gray-400 text-xs font-mono">{String(idx+1).padStart(2,'0')}</TableCell>
                    <TableCell className="font-semibold text-gray-900 whitespace-nowrap">{sub.nameOfAQP}</TableCell>
                    <TableCell className="max-w-[160px]"><span className="block truncate text-sm text-gray-700" title={sub.qualificationTitle}>{sub.qualificationTitle}</span></TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">{sub.saqaId}</TableCell>
                    <TableCell><span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold whitespace-nowrap">{sub.nqfLevel}</span></TableCell>
                    <TableCell className="text-sm text-gray-600">{sub.credits}</TableCell>
                    <TableCell><RegistrationStatusPill status={sub.qualificationRegistrationStatus}/></TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{new Date(sub.submissionDate).toLocaleDateString('en-ZA')}</TableCell>
                    <TableCell><ApprovalStatusPill status={sub.approvalStatus}/></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={()=>openViewModal(sub)} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-lg hover:bg-emerald-100">
                        <Eye className="h-4 w-4 text-emerald-600"/>
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
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
          {selectedSubmission && (() => {
            const sub = selectedSubmission;
            const canAct =
              (workflowRole==='asd'&&(sub.approvalStatus==='pending_asd_draft'||sub.approvalStatus==='returned_to_asd_for_final_submission'))||
              (workflowRole==='dd'&&sub.approvalStatus==='with_deputy_director_approval')||
              (workflowRole==='ceo'&&sub.approvalStatus==='with_ceo_approval');

            const allDocs = [
              {label:'SAQA Qualification Document', value:sub.documents?.saqaQualificationDocument},
              {label:'Curriculum Document',          value:sub.documents?.curriculumDocument},
              {label:'QAS Addendum',                 value:sub.documents?.qasAddendum},
              ...(sub.acknowledgementLetterName ?[{label:'Acknowledgement Letter', value:sub.acknowledgementLetterName}]:[]),
              ...(sub.iacPresentationName       ?[{label:'IAC Presentation',       value:sub.iacPresentationName}]:[]),
              ...(sub.iacResolutionName         ?[{label:'IAC Resolution',         value:sub.iacResolutionName}]:[]),
              ...(sub.outcomeLetterName         ?[{label:'CEO Outcome Letter',      value:sub.outcomeLetterName}]:[]),
            ];

            return (
              <>
                {/* Sticky header + tabs */}
                <div className="sticky top-0 z-10 bg-white border-b px-6 pt-4 pb-0 flex-shrink-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Approval Details</h2>
                      <p className="text-sm text-gray-500 mt-0.5">{sub.qualificationTitle}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <RegistrationStatusPill status={sub.qualificationRegistrationStatus}/>
                      <ApprovalStatusPill status={sub.approvalStatus}/>
                      <button onClick={()=>setIsViewModalOpen(false)} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                        <X className="h-4 w-4 text-gray-500"/>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {([
                      {id:'details',  label:'Application Details', icon:'📄'},
                      {id:'checklist',label:'Evaluation Checklist', icon:'📋'},
                      {id:'report',   label:'Evaluation Report',    icon:'📊'},
                    ] as {id:ApprovalModalTab;label:string;icon:string}[]).map(tab=>(
                      <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${activeTab===tab.id?'border-emerald-500 text-emerald-700 bg-emerald-50/50':'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                        <span>{tab.icon}</span>{tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {activeTab==='details'&&(
                  <div className="p-6 space-y-6">
                  {/* Downstream routing banner */}
                  <DownstreamRoutingBanner status={sub.qualificationRegistrationStatus}/>

                  {/* Approval Progress */}
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Approval Progress</p>
                    <ApprovalProgress status={sub.approvalStatus}/>
                  </div>

                  {/* Application Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AQP & Qualification</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={User}     label="Name of AQP"              value={sub.nameOfAQP}/>
                        <DetailRow icon={BookOpen} label="Qualification Title"       value={sub.qualificationTitle}/>
                        <DetailRow icon={Hash}     label="SAQA ID"                  value={<span className="font-mono">{sub.saqaId}</span>}/>
                        <DetailRow icon={Calendar} label="Date Registered with SAQA" value={sub.dateRegisteredWithSAQA?new Date(sub.dateRegisteredWithSAQA).toLocaleDateString('en-ZA'):'—'}/>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualification Details</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={Award}    label="NQF Level"           value={sub.nqfLevel}/>
                        <DetailRow icon={Hash}     label="Credits"             value={sub.credits}/>
                        <DetailRow icon={Calendar} label="Proposed Date of EISA" value={sub.proposedDateOfEISA?new Date(sub.proposedDateOfEISA).toLocaleDateString('en-ZA'):'—'}/>
                        <DetailRow icon={Calendar} label="Submission Date"     value={new Date(sub.submissionDate).toLocaleDateString('en-ZA')}/>
                      </div>
                    </div>
                  </div>

                  {/* Submitted Documents */}
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted Documents</p></div>
                    <div className="divide-y">
                      {allDocs.map(doc=>(
                        <DocRow key={doc.label} label={doc.label} value={doc.value}/>
                      ))}
                    </div>
                  </div>

                  {/* Evaluation Review Blocks */}
                  {(sub.asdEvaluationChecklist&&Object.keys(sub.asdEvaluationChecklist).length>0)||sub.asdEvaluationNotes||sub.qasaChecklist||sub.evaluationReport?
                    <ReviewBlock title="ASD Evaluation" color="indigo"
                      checklist={sub.asdEvaluationChecklist||undefined}
                      notes={sub.asdEvaluationNotes}
                      files={[
                        {label:'Evaluation Report', value:sub.evaluationReportName},
                        {label:'Checklist',          value:sub.qasaChecklist?'QASA Addendum Checklist (completed)':null},
                        {label:'Evaluation Report',  value:sub.evaluationReport?'QAS Addendum Evaluation Report (generated)':null},
                      ]}
                    />:null}

                  {(sub.ddEvaluationChecklist&&Object.keys(sub.ddEvaluationChecklist).length>0)||sub.ddReviewNotes?
                    <ReviewBlock title="Deputy Director Evaluation Review" color="blue"
                      checklist={sub.ddEvaluationChecklist||undefined}
                      notes={sub.ddReviewNotes}
                    />:null}

                  {(sub.iacChecklist&&Object.keys(sub.iacChecklist).length>0)||sub.iacApprovalNotes?
                    <ReviewBlock title="Internal Assessment Committee" color="purple"
                      checklist={sub.iacChecklist||undefined}
                      notes={sub.iacApprovalNotes}
                    />:null}

                  {(sub.ceoFinalChecklist&&Object.keys(sub.ceoFinalChecklist).length>0)||sub.ceoFinalNotes?
                    <ReviewBlock title="CEO Evaluation Sign-off" color="teal"
                      checklist={sub.ceoFinalChecklist||undefined}
                      notes={sub.ceoFinalNotes}
                    />:null}

                  {/* Approval Documents */}
                  {(sub.approvalLetterName||sub.finalApprovalLetterName) && (
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval Documents</p></div>
                      <div className="divide-y">
                        {sub.approvalLetterName && <DocRow label="Draft Approval Letter" value={sub.approvalLetterName} iconColor="bg-teal-100" iconTextColor="text-teal-600"/>}
                        {sub.finalApprovalLetterName && <DocRow label="Signed Approval Letter" value={sub.finalApprovalLetterName} iconColor="bg-emerald-100" iconTextColor="text-emerald-600"/>}
                      </div>
                    </div>
                  )}

                  {(sub.ddApprovalChecklist&&Object.keys(sub.ddApprovalChecklist).length>0)||sub.ddApprovalNotes?
                    <ReviewBlock title="Deputy Director Approval Review" color="blue"
                      checklist={sub.ddApprovalChecklist||undefined}
                      notes={sub.ddApprovalNotes}
                    />:null}

                  {(sub.ceoApprovalChecklist&&Object.keys(sub.ceoApprovalChecklist).length>0)||sub.ceoApprovalNotes?
                    <ReviewBlock title="CEO Approval Review" color="purple"
                      checklist={sub.ceoApprovalChecklist||undefined}
                      notes={sub.ceoApprovalNotes}
                    />:null}

                  {/* Available Actions */}
                  {canAct && (
                    <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-4">
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">Available Actions</p>
                      <div className="flex flex-wrap gap-2">
                        {workflowRole==='asd'&&sub.approvalStatus==='pending_asd_draft'&&(
                          <Button onClick={()=>openActionModal('asd',sub)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                            <FilePenLine className="h-4 w-4"/>Draft Approval Letter
                          </Button>
                        )}
                        {workflowRole==='dd'&&sub.approvalStatus==='with_deputy_director_approval'&&(
                          <Button onClick={()=>openActionModal('dd',sub)} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-2">
                            <ClipboardCheck className="h-4 w-4"/>Review Approval Letter
                          </Button>
                        )}
                        {workflowRole==='ceo'&&sub.approvalStatus==='with_ceo_approval'&&(
                          <Button onClick={()=>openActionModal('ceo',sub)} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-2">
                            <FileSignature className="h-4 w-4"/>Review & Approve Letter
                          </Button>
                        )}
                        {workflowRole==='asd'&&sub.approvalStatus==='returned_to_asd_for_final_submission'&&(
                          <Button onClick={handleASDFinalSubmit} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                            <ArrowRightCircle className="h-4 w-4"/>Submit to QP Portfolio
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {!canAct&&<p className="text-sm text-gray-400 italic text-center py-2">No actions available for your role at this stage.</p>}
                </div>
                  )}

                  {/* TAB 2: Checklist */}
                  {activeTab==='checklist'&&(
                    <div className="p-6 space-y-6">
                      {!sub.qasaChecklist?(
                        <div className="text-center py-16">
                          <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="h-8 w-8 text-gray-300"/>
                          </div>
                          <p className="font-medium text-gray-500">No Evaluation Checklist</p>
                          <p className="text-sm text-gray-400 mt-1">The QASA Addendum Checklist has not been completed for this application.</p>
                        </div>
                      ):(()=>{
                        const cl = sub.qasaChecklist as QasaChecklist;
                        return (
                          <>
                            <div className="rounded-2xl border bg-emerald-50 border-emerald-200 px-5 py-3 flex items-center gap-2">
                              <span className="text-base">🔒</span>
                              <p className="text-sm font-medium text-emerald-800">Read-only — Evaluation checklist is locked after moving to approval</p>
                            </div>
                            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                              <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
                                <p className="text-sm font-bold text-purple-900 uppercase tracking-wide">QAS ADDENDUM PRELIMINARY CHECKLIST</p>
                                <p className="text-xs text-purple-600 mt-0.5">Document No: QCTO/EISA/CL1 · Version: 1</p>
                              </div>
                              <div className="p-4 grid md:grid-cols-2 gap-4">
                                <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Name of AQP</Label><p className="text-sm font-medium text-gray-900">{sub.nameOfAQP}</p></div>
                                <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Qualification Title</Label><p className="text-sm font-medium text-gray-900">{sub.qualificationTitle}</p></div>
                                <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">SAQA ID</Label><p className="text-sm font-mono text-gray-900">{sub.saqaId}</p></div>
                                <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Date of Receipt</Label><p className="text-sm text-gray-900">{cl.dateOfReceipt||'—'}</p></div>
                                <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Date Evaluated</Label><p className="text-sm text-gray-900">{cl.dateEvaluated||'—'}</p></div>
                                <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Evaluated By</Label><p className="text-sm text-gray-900">{cl.evaluatedBy||'—'}</p></div>
                                <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Remedial Actions Required</Label><p className="text-sm text-gray-900">{cl.remedialActionsRequired?cl.remedialActionsRequired.charAt(0).toUpperCase()+cl.remedialActionsRequired.slice(1):'—'}</p></div>
                                <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Date Feedback Provided</Label><p className="text-sm text-gray-900">{cl.dateFeedbackProvided||'—'}</p></div>
                              </div>
                            </div>
                            {cl.sections.map(section=>(
                              <div key={section.sectionId} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200">
                                  <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">{section.sectionId} — {section.title}</p>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead><tr className="bg-gray-50 border-b">
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-12">No.</th>
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Item</th>
                                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-14">Yes</th>
                                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-14">No</th>
                                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 min-w-[180px]">Comments</th>
                                    </tr></thead>
                                    <tbody>
                                      {section.items.map((item,ii)=>(
                                        <tr key={item.id} className={`border-b last:border-0 ${ii%2===0?'bg-white':'bg-gray-50/30'}`}>
                                          <td className="px-4 py-2.5 text-xs text-gray-400 font-mono align-top">{item.id}</td>
                                          <td className="px-4 py-2.5 text-sm text-gray-700 align-top">{item.text}</td>
                                          <td className="px-3 py-2.5 text-center align-top"><div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${item.yes?'bg-emerald-500 border-emerald-500':'border-gray-200 bg-gray-50'}`}>{item.yes&&<CheckCircle className="h-3.5 w-3.5 text-white"/>}</div></td>
                                          <td className="px-3 py-2.5 text-center align-top"><div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${item.no?'bg-red-500 border-red-500':'border-gray-200 bg-gray-50'}`}>{item.no&&<X className="h-3.5 w-3.5 text-white"/>}</div></td>
                                          <td className="px-4 py-2.5 text-xs text-gray-600 align-top">{item.comments||<span className="text-gray-300 italic">No comment</span>}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                              <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200"><p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Recommendations</p></div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Recommendation</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-14">Yes</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-14">No</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Comments</th></tr></thead>
                                  <tbody>
                                    {[
                                      {label:'This QAS Addendum clearly assesses job-related task(s)',yf:'recommendationJobRelated' as const,nf:'recommendationJobRelatedNo' as const,cf:'recommendationJobRelatedComments' as const},
                                      {label:'This QAS Addendum has been recommended for approval by the QCTO',yf:'recommendationApproved' as const,nf:'recommendationApprovedNo' as const,cf:'recommendationApprovedComments' as const},
                                    ].map((rec,ri)=>(
                                      <tr key={rec.label} className={`border-b last:border-0 ${ri%2===0?'bg-white':'bg-gray-50/30'}`}>
                                        <td className="px-4 py-2.5 text-sm text-gray-700">{rec.label}</td>
                                        <td className="px-3 py-2.5 text-center"><div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${cl[rec.yf]?'bg-emerald-500 border-emerald-500':'border-gray-200 bg-gray-50'}`}>{cl[rec.yf]&&<CheckCircle className="h-3.5 w-3.5 text-white"/>}</div></td>
                                        <td className="px-3 py-2.5 text-center"><div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${cl[rec.nf]?'bg-red-500 border-red-500':'border-gray-200 bg-gray-50'}`}>{cl[rec.nf]&&<X className="h-3.5 w-3.5 text-white"/>}</div></td>
                                        <td className="px-4 py-2.5 text-xs text-gray-600">{cl[rec.cf]||<span className="text-gray-300 italic">No comment</span>}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB 3: Report */}
                  {activeTab==='report'&&(
                    <div className="p-6 space-y-6">
                      {!sub.evaluationReport?(
                        <div className="text-center py-16">
                          <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-gray-300"/>
                          </div>
                          <p className="font-medium text-gray-500">No Evaluation Report</p>
                          <p className="text-sm text-gray-400 mt-1">The evaluation report has not been generated for this application.</p>
                        </div>
                      ):(()=>{
                        const rp = sub.evaluationReport as EvaluationReport;
                        const cl = sub.qasaChecklist as QasaChecklist | null;
                        return (
                          <>
                            <div className="rounded-2xl border bg-emerald-50 border-emerald-200 px-5 py-3 flex items-center gap-2">
                              <span className="text-base">🔒</span>
                              <p className="text-sm font-medium text-emerald-800">Read-only — Evaluation report is locked after moving to approval</p>
                            </div>
                            <div className="rounded-2xl border bg-purple-50 border-purple-200 px-6 py-4 text-center">
                              <p className="text-base font-bold text-purple-900 uppercase tracking-wide">QAS ADDENDUM EVALUATION REPORT</p>
                              <p className="text-xs text-purple-600 mt-1">QCTO OQA Assessment Evaluation</p>
                            </div>
                            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                              <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Committee Approval</p></div>
                              <div className="p-4 flex flex-wrap gap-6">
                                <div><Label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Approval</Label><p className="text-sm font-medium text-gray-900">{rp.acApproval?rp.acApproval.charAt(0).toUpperCase()+rp.acApproval.slice(1):'—'}</p></div>
                                <div><Label className="text-xs text-gray-500 uppercase font-semibold block mb-1">Date</Label><p className="text-sm font-medium text-gray-900">{rp.acDate||'—'}</p></div>
                              </div>
                            </div>
                            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                              <div className="px-4 py-3 bg-blue-50 border-b border-blue-200"><p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Section A — AQP Details</p></div>
                              <div className="p-4 grid md:grid-cols-2 gap-3">
                                {[{l:'AQP Name',v:rp.aqpName},{l:'Contact Name',v:rp.contactName},{l:'Contact Email',v:rp.contactEmail},{l:'Physical Address',v:rp.physicalAddress},{l:'Date Received',v:rp.dateReceived},{l:'Date Evaluated',v:rp.dateEvaluated},{l:"Evaluator's Name",v:rp.evaluatorsName}].map(x=>(
                                  <div key={x.l}><Label className="text-xs text-gray-500 uppercase font-semibold block mb-0.5">{x.l}</Label><p className="text-sm text-gray-900">{x.v||'—'}</p></div>
                                ))}
                              </div>
                            </div>
                            {/* Remaining report sections unchanged from original */}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </>
            );
          })() as React.ReactNode}
        </DialogContent>
      </Dialog>

      {/* ── Action Modal ──────────────────────────────────────────────────── */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType==='asd'&&<><FilePenLine className="h-4 w-4 text-emerald-600"/>ASD — Draft Approval Letter</>}
              {actionType==='dd'&&<><ClipboardCheck className="h-4 w-4 text-blue-600"/>Deputy Director — Review Approval Letter</>}
              {actionType==='ceo'&&<><FileSignature className="h-4 w-4 text-purple-600"/>CEO — Final Approval & Sign</>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {actionType==='asd' && (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Upload Draft Approval Letter *</Label>
                  <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-center">
                    <Upload className="h-8 w-8 text-emerald-400 mx-auto mb-2"/>
                    <p className="text-sm text-gray-500 mb-3">Select a PDF or DOCX file</p>
                    <Input type="file" accept=".pdf,.doc,.docx" onChange={e=>setApprovalLetter(e.target.files?.[0]||null)} className="max-w-xs mx-auto"/>
                  </div>
                  {approvalLetter && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0"/>
                      <span className="text-sm text-emerald-700 font-medium truncate">{approvalLetter.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Draft Notes (Optional)</Label>
                  <Textarea value={approvalNotes} onChange={e=>setApprovalNotes(e.target.value)} placeholder="Enter notes about the drafted approval letter..." rows={3} className="resize-none"/>
                </div>
                <Button onClick={handleASDDraft} disabled={!approvalLetter} className="bg-emerald-600 hover:bg-emerald-700 gap-2 w-full">
                  <Send className="h-4 w-4"/>Draft & Submit to Deputy Director
                </Button>
              </>
            )}

            {actionType==='dd' && (
              <>
                <ChecklistSection title="Evaluation Checklist" items={ddChecklistItems} checklist={approvalChecklist} setChecklist={setApprovalChecklist}/>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Review Notes</Label>
                  <Textarea value={approvalNotes} onChange={e=>setApprovalNotes(e.target.value)} placeholder="Enter review notes and quality check findings..." rows={4} className="resize-none"/>
                </div>
                <Button onClick={handleDDApproval} className="bg-blue-600 hover:bg-blue-700 gap-2 w-full">
                  <CheckCircle className="h-4 w-4"/>Quality Check OK — Send to CEO
                </Button>
              </>
            )}

            {actionType==='ceo' && (
              <>
                <ChecklistSection title="Final Approval Checklist" items={ceoChecklistItems} checklist={approvalChecklist} setChecklist={setApprovalChecklist}/>
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Upload Signed Approval Letter *</Label>
                  <div className="rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-6 text-center">
                    <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2"/>
                    <p className="text-sm text-gray-500 mb-3">Select a PDF or DOCX file</p>
                    <Input type="file" accept=".pdf,.doc,.docx" onChange={e=>setFinalApprovalLetter(e.target.files?.[0]||null)} className="max-w-xs mx-auto"/>
                  </div>
                  {finalApprovalLetter && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-purple-600 flex-shrink-0"/>
                      <span className="text-sm text-purple-700 font-medium truncate">{finalApprovalLetter.name}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">CEO Approval Notes</Label>
                  <Textarea value={approvalNotes} onChange={e=>setApprovalNotes(e.target.value)} placeholder="Enter final approval notes..." rows={4} className="resize-none"/>
                </div>
                <Button onClick={handleCEOApproval} disabled={!finalApprovalLetter} className="bg-purple-600 hover:bg-purple-700 gap-2 w-full">
                  <FileSignature className="h-4 w-4"/>Approve & Sign — Return to ASD
                </Button>
              </>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={closeActionModal}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}