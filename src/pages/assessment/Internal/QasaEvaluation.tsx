// C:\Users\jadek\Desktop\my-cert-project\src\pages\assessment\Internal\QasaEvaluation.tsx
// Part 1: Types, helpers, constants, small UI components

import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye, FileText, CheckCircle, ClipboardList, Send,
  ThumbsUp, ThumbsDown, Users, Award, FileSignature,
  CheckSquare, X, ArrowRightCircle, User, Calendar,
  Hash, BookOpen, ShieldCheck, Paperclip, AlertCircle,
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

// ── Types ─────────────────────────────────────────────────────────────────────
type EvaluationStatus =
  | 'pending_asd_evaluation'
  | 'returned_to_qp_negative'
  | 'with_deputy_director'
  | 'with_iac'
  | 'with_ceo_final'
  | 'returned_to_asd_for_approval'
  | 'completed';

type WorkflowRole = 'asd' | 'dd' | 'iac' | 'ceo' | null;
type ModalTab = 'details' | 'checklist' | 'report';

interface ChecklistItem {
  id: string; text: string; yes: boolean | null; no: boolean | null; comments: string;
}
interface ChecklistSection {
  sectionId: string; title: string; items: ChecklistItem[];
}
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
type ExtendedQasaSubmission = Omit<QasaSubmission, 'evaluationStatus'> & {
  evaluationStatus: EvaluationStatus;
  asdEvaluationChecklist?: Record<string, boolean> | null;
  asdEvaluationNotes?: string;
  asdEvaluationOutcome?: 'positive' | 'negative' | null;
  evaluationReportName?: string | null;
  qasaChecklist?: QasaChecklist | null;
  evaluationReport?: EvaluationReport | null;
  ddEvaluationChecklist?: Record<string, boolean> | null;
  ddReviewNotes?: string;
  iacChecklist?: Record<string, boolean> | null;
  iacPresentationName?: string | null;
  iacResolutionName?: string | null;
  iacApprovalNotes?: string;
  ceoFinalChecklist?: Record<string, boolean> | null;
  ceoFinalNotes?: string;
  outcomeLetterName?: string | null;
  movedToEvaluation?: boolean;
  acknowledgementStatus?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getWorkflowRole = (r: string): WorkflowRole => {
  if (r === 'ASD') return 'asd';
  if (r === 'Deputy Director') return 'dd';
  if (r === 'Internal Assessment Committee') return 'iac';
  if (r === 'CEO') return 'ceo';
  return null;
};

const normalizeEvaluationStatus = (sub: any): EvaluationStatus => {
  if (sub.evaluationStatus && sub.evaluationStatus !== 'pending_asd_evaluation') return sub.evaluationStatus as EvaluationStatus;
  if (sub.movedToEvaluation === true || sub.acknowledgementStatus === 'sent_to_quality_partner') return (sub.evaluationStatus as EvaluationStatus) || 'pending_asd_evaluation';
  return 'pending_asd_evaluation';
};

const buildDefaultChecklist = (sub: ExtendedQasaSubmission): QasaChecklist => ({
  dateOfReceipt: sub.submissionDate || '', dateEvaluated: new Date().toISOString().split('T')[0],
  evaluatedBy: '', remedialActionsRequired: '', dateFeedbackProvided: '',
  sections: [
    { sectionId:'1.1', title:'Assessment Model and Distribution', items:[
      {id:'1.1.1',text:'Evaluator has read all relevant documentation (SAQA Qualification Document, Curriculum Document, External Assessment Specifications)',yes:null,no:null,comments:''},
      {id:'1.1.2',text:'Type of Model has been clearly defined (min required: written/practical; how many final EISAs)',yes:null,no:null,comments:''},
      {id:'1.1.3',text:'Described model is the same as in the original external assessment specifications',yes:null,no:null,comments:''},
      {id:'1.1.4',text:'AQP has clearly stated where copies will be made (e.g. by AQP or Assessment Centres)',yes:null,no:null,comments:''},
      {id:'1.1.5',text:'The AQP has explained the distribution process of the EISA (for each one if more than one)',yes:null,no:null,comments:''},
      {id:'1.1.6',text:'AQP has clearly provided a timeline of how many days/weeks in advance the EISA will be distributed',yes:null,no:null,comments:''},
      {id:'1.1.7',text:'The AQP has explained acceptable security precautions',yes:null,no:null,comments:''},
    ]},
    { sectionId:'1.2', title:'Qualification Outcomes (table)', items:[
      {id:'1.2.1',text:'The Exit Level Outcomes listed are the same as in the SAQA qualification document',yes:null,no:null,comments:''},
      {id:'1.2.2',text:'The Exit Level Outcomes listed are the same as in the Curriculum document (Section 2 - Occupational Profile)',yes:null,no:null,comments:''},
      {id:'1.2.3',text:'Integrated Assessment Focus Areas (numbered) in the Assessment Standards match the qualification',yes:null,no:null,comments:''},
      {id:'1.2.4',text:'The weighting per ELO is the same as in the curriculum',yes:null,no:null,comments:''},
      {id:'1.2.5',text:'The Key Assessment Focus Areas are bulleted concisely as job specifications / job competencies (not a copy-paste of ACs)',yes:null,no:null,comments:''},
    ]},
    { sectionId:'1.3', title:"Distribution of Cognitive Application (Bloom's Taxonomy)", items:[
      {id:'1.3.1',text:'The correct level of the qualification has been indicated',yes:null,no:null,comments:''},
      {id:'1.3.2',text:'The spread of percentages in the lower, medium and higher order should suit the type of model described',yes:null,no:null,comments:''},
      {id:'1.3.3',text:'All percentages must add up to 100%',yes:null,no:null,comments:''},
    ]},
    { sectionId:'1.4', title:'Assessment Requirements', items:[
      {id:'1.4.1',text:'Correct Qualification Title (as per SAQA)',yes:null,no:null,comments:''},
      {id:'1.4.2',text:'Correct NQF Level',yes:null,no:null,comments:''},
      {id:'1.4.3',text:'Correct total number of Credits',yes:null,no:null,comments:''},
      {id:'1.4.4',text:'Duration: stipulated in hours/days for each EISA',yes:null,no:null,comments:''},
      {id:'1.4.5',text:'Total Marks / Total Competency stated (written: total mark; practical: core competencies)',yes:null,no:null,comments:''},
      {id:'1.4.6',text:'Format indicated (written/practical/presentation/computer-based; number of final assessment instruments)',yes:null,no:null,comments:''},
      {id:'1.4.7',text:'Layout: technical aspects (number of sections; overview of question types)',yes:null,no:null,comments:''},
      {id:'1.4.8',text:'Open or Closed Book: stated whether candidates may have reference material',yes:null,no:null,comments:''},
      {id:'1.4.9',text:'Points: at which stage the EISA will take place (for each if more than one)',yes:null,no:null,comments:''},
      {id:'1.4.10',text:'Supplementary Assessments: indicated whether re-assessments will be allowed and requirements',yes:null,no:null,comments:''},
      {id:'1.4.11',text:'% to be moderated stated (cannot be less than 10%)',yes:null,no:null,comments:''},
      {id:'1.4.12',text:'Days allowed for marking are indicated',yes:null,no:null,comments:''},
      {id:'1.4.13',text:'Days allowed for moderation are indicated',yes:null,no:null,comments:''},
      {id:'1.4.14',text:'Days from assessment date to submission of learner achievements to QCTO has been indicated',yes:null,no:null,comments:''},
    ]},
    { sectionId:'1.5', title:'Assessment Grid (Blueprint)', items:[
      {id:'1.5.1',text:'Step 1: ELOs can either be listed separately or combined',yes:null,no:null,comments:''},
      {id:'1.5.2',text:'Step 2: Key assessment Focus Areas are listed in the block below the ELOs (IAFAs)',yes:null,no:null,comments:''},
      {id:'1.5.3',text:'Step 3: Under "Evidence required" column, the most suitable form of evidence is listed',yes:null,no:null,comments:''},
      {id:'1.5.4',text:'Step 4: For each identified evidence there is a question number',yes:null,no:null,comments:''},
      {id:'1.5.5',text:'Step 5: Key for types of questions indicated (MC, TE, etc.)',yes:null,no:null,comments:''},
      {id:'1.5.6',text:'Step 6: Marks per question have been indicated',yes:null,no:null,comments:''},
      {id:'1.5.7',text:'Step 7: Time has been indicated (in minutes) for each question',yes:null,no:null,comments:''},
      {id:'1.5.8',text:'Step 8: Module(s) and module code(s) for each question have been indicated',yes:null,no:null,comments:''},
      {id:'1.5.9',text:'Step 9: Cognitive order allocated: Marks written under applicable column / Competencies marked in crosses',yes:null,no:null,comments:''},
      {id:'1.5.10',text:'Final Check: Marks have been subtotalled',yes:null,no:null,comments:''},
      {id:'1.5.11',text:'Final Check: Grand total of marks has been indicated',yes:null,no:null,comments:''},
      {id:'1.5.12',text:'Final Check: Marks is the same as stipulated under 1.4',yes:null,no:null,comments:''},
      {id:'1.5.13',text:'Final Check: Time has been subtotalled (in minutes)',yes:null,no:null,comments:''},
      {id:'1.5.14',text:'Final Check: Grand total of minutes is the same as the time (in hours) stipulated under 1.4',yes:null,no:null,comments:''},
      {id:'1.5.15',text:'Final Check: Cognitive marks distribution % is the same as indicated in 1.3 (L/M/H)',yes:null,no:null,comments:''},
    ]},
  ],
  recommendationJobRelated:null, recommendationJobRelatedNo:null, recommendationJobRelatedComments:'',
  recommendationApproved:null, recommendationApprovedNo:null, recommendationApprovedComments:'',
});

const buildReportFromChecklist = (sub: ExtendedQasaSubmission, cl: QasaChecklist): EvaluationReport => {
  const sectionC: Record<string, {yes:boolean;no:boolean;comments:string}> = {};
  cl.sections.forEach(sec => sec.items.forEach(item => {
    sectionC[item.id] = { yes: item.yes===true, no: item.no===true, comments: item.comments };
  }));
  return {
    aqpName: sub.nameOfAQP||'', contactName:'', contactEmail:'', physicalAddress:'',
    dateReceived: cl.dateOfReceipt, dateEvaluated: cl.dateEvaluated, evaluatorsName: cl.evaluatedBy,
    qualificationTitle: sub.qualificationTitle||'', saqaId: sub.saqaId||'',
    dateRegistered: sub.dateRegisteredWithSAQA||'', nqfLevel: sub.nqfLevel||'', credits: sub.credits||'',
    registrationStartDate:'', registrationEndDate:'',
    correctQualTitle:'', correctNqfLevel:'', nqfLevelEisa:'', correctCredits:'', numberOfComponents:'',
    component1Name:'', component1Marks:'', component1Pass:'',
    component2Name:'', component2Marks:'', component2Pass:'',
    component3Name:'', component3Marks:'', component3Pass:'',
    calculationFinalAchievement:'', finalAchievement:'',
    duration:'', format:'', layout:'', openOrClosed:'', assessmentPoints:'',
    supplementaryAssessments:'', percentageModerated:'', markingDays:'', moderationDays:'',
    sectionC,
    sectionD: { relevance:{yes:false,no:false}, setStandards:{yes:false,no:false}, accuracy:{yes:false,no:false}, bestPractice:{yes:false,no:false} },
    evaluationFindings:'', recommendation:'',
    meetsMinRequirements:'',
    firstEvaluatorName: cl.evaluatedBy, firstEvaluatorOutcome:'',
    secondEvaluatorName:'', secondEvaluatorOutcome:'',
    finalRecommendation:'', acApproval:'', acDate:'',
  };
};

// ── Status config ─────────────────────────────────────────────────────────────
const EVAL_STATUS_CONFIG: Record<EvaluationStatus,{label:string;color:string;bg:string;dot:string}> = {
  pending_asd_evaluation:       {label:'Pending ASD Evaluation',      color:'text-amber-700',  bg:'bg-amber-50 border-amber-200',    dot:'bg-amber-400'   },
  returned_to_qp_negative:      {label:'Returned to QP — Negative',   color:'text-red-700',    bg:'bg-red-50 border-red-200',        dot:'bg-red-500'     },
  with_deputy_director:         {label:'With Deputy Director',         color:'text-blue-700',   bg:'bg-blue-50 border-blue-200',      dot:'bg-blue-400'    },
  with_iac:                     {label:'With IAC',                     color:'text-indigo-700', bg:'bg-indigo-50 border-indigo-200',  dot:'bg-indigo-400'  },
  with_ceo_final:               {label:'With CEO Final Approval',      color:'text-purple-700', bg:'bg-purple-50 border-purple-200',  dot:'bg-purple-400'  },
  returned_to_asd_for_approval: {label:'Returned to ASD for Approval',color:'text-teal-700',   bg:'bg-teal-50 border-teal-200',      dot:'bg-teal-400'    },
  completed:                    {label:'Moved to Approval Process',    color:'text-emerald-700',bg:'bg-emerald-50 border-emerald-200',dot:'bg-emerald-500' },
};

function EvalStatusPill({status}:{status:EvaluationStatus}) {
  const cfg = EVAL_STATUS_CONFIG[status]??{label:status,color:'text-gray-600',bg:'bg-gray-100 border-gray-200',dot:'bg-gray-400'};
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}><span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}/>{cfg.label}</span>;
}

const EVAL_STEPS=[
  {key:'pending_asd_evaluation',label:'ASD Evaluation',icon:'📋'},
  {key:'with_deputy_director',label:'Deputy Director',icon:'👔'},
  {key:'with_iac',label:'IAC Review',icon:'👥'},
  {key:'with_ceo_final',label:'CEO Sign-off',icon:'👑'},
  {key:'returned_to_asd_for_approval',label:'ASD Return',icon:'🔄'},
  {key:'completed',label:'Approval Process',icon:'✅'},
];

function EvalWorkflowProgress({status}:{status:EvaluationStatus}) {
  const idx=EVAL_STEPS.findIndex(s=>s.key===status);
  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {EVAL_STEPS.map((step,i)=>{
        const done=i<idx,active=i===idx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm border-2 transition-all
                ${done?'bg-emerald-500 border-emerald-500':active?'bg-white border-purple-500 shadow-md shadow-purple-100':'bg-white border-gray-200'}`}>
                {done?<CheckCircle className="h-4 w-4 text-white"/>:<span>{step.icon}</span>}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${done?'text-emerald-600':active?'text-purple-600':'text-gray-400'}`}>{step.label}</span>
            </div>
            {i<EVAL_STEPS.length-1&&<div className={`h-0.5 w-6 mb-4 mx-0.5 rounded ${i<idx?'bg-emerald-400':'bg-gray-200'}`}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function DetailRow({icon:Icon,label,value}:{icon:any;label:string;value:React.ReactNode}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Icon className="h-3.5 w-3.5 text-gray-500"/></div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <div className="text-sm font-medium text-gray-900 mt-0.5">{value||'—'}</div>
      </div>
    </div>
  );
}

function ReviewBlock({title,color,checklist,notes,files=[]}:{title:string;color:'indigo'|'blue'|'purple'|'teal';checklist?:Record<string,boolean>|null;notes?:string;files?:{label:string;value:string|null|undefined}[]}) {
  const cm={indigo:{bg:'bg-indigo-50/40 border-indigo-200',header:'bg-indigo-100 border-indigo-200',icon:'text-indigo-600',title:'text-indigo-700',note:'border-indigo-100',nt:'text-indigo-600'},blue:{bg:'bg-blue-50/40 border-blue-200',header:'bg-blue-100 border-blue-200',icon:'text-blue-600',title:'text-blue-700',note:'border-blue-100',nt:'text-blue-600'},purple:{bg:'bg-purple-50/40 border-purple-200',header:'bg-purple-100 border-purple-200',icon:'text-purple-600',title:'text-purple-700',note:'border-purple-100',nt:'text-purple-600'},teal:{bg:'bg-teal-50/40 border-teal-200',header:'bg-teal-100 border-teal-200',icon:'text-teal-600',title:'text-teal-700',note:'border-teal-100',nt:'text-teal-600'}}[color];
  const items=checklist?Object.entries(checklist):[];
  const passed=items.filter(([,v])=>v).length;
  return (
    <div className={`rounded-2xl border overflow-hidden ${cm.bg}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${cm.header}`}><ShieldCheck className={`h-4 w-4 ${cm.icon}`}/><p className={`text-xs font-semibold uppercase tracking-wider ${cm.title}`}>{title}</p></div>
      <div className="p-4 space-y-3">
        {items.length>0&&<div className="space-y-1.5">
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500">{passed}/{items.length} confirmed</span><div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${(passed/items.length)*100}%`}}/></div></div>
          {items.map(([item,checked])=>(
            <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${checked?'bg-emerald-50 text-emerald-800':'bg-gray-50 text-gray-400 line-through'}`}>
              <div className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${checked?'bg-emerald-500':'bg-gray-300'}`}>{checked&&<CheckCircle className="h-3 w-3 text-white"/>}</div>{item}
            </div>
          ))}
        </div>}
        {notes&&<div><p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${cm.nt}`}>Notes</p><p className={`text-sm text-gray-700 bg-white rounded-xl p-3 border whitespace-pre-wrap ${cm.note}`}>{notes}</p></div>}
        {files.filter(f=>f.value).map(f=>(<div key={f.label} className="flex items-center gap-2 text-sm text-gray-700"><Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0"/><span className="font-medium">{f.label}:</span><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{f.value}</span></div>))}
      </div>
    </div>
  );
}


// ── Main Component ────────────────────────────────────────────────────────────
export function QasaEvaluation() {
  const { currentRole } = useApp();
  const workflowRole = getWorkflowRole(currentRole);

  const [submissions, setSubmissions] = useState<ExtendedQasaSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ExtendedQasaSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('details');
  const [checklist, setChecklist] = useState<QasaChecklist | null>(null);
  const [checklistDirty, setChecklistDirty] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [reportDirty, setReportDirty] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluationType, setEvaluationType] = useState<'dd' | 'iac' | 'ceo' | null>(null);
  const [evalChecklist, setEvalChecklist] = useState<Record<string, boolean>>({});
  const [evalNotes, setEvalNotes] = useState('');
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [outcomeLetter, setOutcomeLetter] = useState<File | null>(null);

  const ddItems = ['ASD evaluation report is thorough','All checklist items were properly assessed','Recommendations are appropriate','Supporting evidence is sufficient','Risk assessment is accurate'];
  const iacItems = ['QASA presentation is complete and clear','All documentation has been reviewed','Quality standards are met','Compliance requirements satisfied','Resolution is properly documented'];
  const ceoItems = ['Complete evaluation package reviewed','All approvals are in place','Outcome letter is ready for signature','Legal and compliance requirements met'];

  useEffect(() => {
    loadSubmissions();
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
    setSubmissions(JSON.parse(stored).map((sub: any) => ({
      ...sub,
      evaluationStatus: normalizeEvaluationStatus(sub),
      asdEvaluationChecklist: sub.asdEvaluationChecklist ?? sub.evaluationChecklist ?? null,
      asdEvaluationNotes: sub.asdEvaluationNotes ?? '',
      asdEvaluationOutcome: sub.asdEvaluationOutcome ?? null,
      qasaChecklist: sub.qasaChecklist ?? null,
      evaluationReport: sub.evaluationReport ?? null,
      ddEvaluationChecklist: sub.ddEvaluationChecklist ?? sub.ddEvaluationReview ?? null,
      ddReviewNotes: sub.ddReviewNotes ?? '',
      iacChecklist: sub.iacChecklist ?? null,
      iacPresentationName: sub.iacPresentationName ?? null,
      iacResolutionName: sub.iacResolutionName ?? null,
      iacApprovalNotes: sub.iacApprovalNotes ?? '',
      ceoFinalChecklist: sub.ceoFinalChecklist ?? null,
      ceoFinalNotes: sub.ceoFinalNotes ?? '',
      outcomeLetterName: sub.outcomeLetterName ?? null,
      movedToEvaluation: sub.movedToEvaluation ?? false,
      acknowledgementStatus: sub.acknowledgementStatus ?? 'pending',
    })));
  };

  const updateSubmission = (updated: ExtendedQasaSubmission) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : [];
    const merged = all.map((s: any) => s.id === updated.id ? updated : s);
    setSubmissions(prev => prev.map(s => s.id === updated.id ? updated : s));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    showToast('Saved successfully');
  };

  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2';
    el.innerHTML = `<span style="color:#a78bfa">✓</span> ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const openViewModal = (sub: ExtendedQasaSubmission) => {
    setSelectedSubmission(sub);
    setActiveTab('details');
    setChecklist(sub.qasaChecklist ? { ...sub.qasaChecklist } : buildDefaultChecklist(sub));
    setReport(sub.evaluationReport ? { ...sub.evaluationReport } : null);
    setChecklistDirty(false); setReportDirty(false);
    setIsViewModalOpen(true);
  };

  const saveChecklist = () => {
    if (!selectedSubmission || !checklist) return;
    const updated = { ...selectedSubmission, qasaChecklist: checklist };
    updateSubmission(updated); setSelectedSubmission(updated); setChecklistDirty(false);
  };

  const generateReport = () => {
    if (!selectedSubmission || !checklist) return;
    const r = buildReportFromChecklist(selectedSubmission, checklist);
    setReport(r); setReportDirty(true); setActiveTab('report');
    showToast('Evaluation report generated from checklist data');
  };

  const saveReport = () => {
    if (!selectedSubmission || !report) return;
    const updated = { ...selectedSubmission, evaluationReport: report };
    updateSubmission(updated); setSelectedSubmission(updated); setReportDirty(false);
  };

  const handleASDSubmit = (outcome: 'positive' | 'negative') => {
    if (!selectedSubmission) return;
    updateSubmission({
      ...selectedSubmission,
      qasaChecklist: checklist ?? selectedSubmission.qasaChecklist,
      evaluationReport: report ?? selectedSubmission.evaluationReport,
      asdEvaluationOutcome: outcome,
      evaluationStatus: outcome === 'positive' ? 'with_deputy_director' : 'returned_to_qp_negative',
    });
    setIsViewModalOpen(false);
  };

  const handleDDReview = () => {
    if (!selectedSubmission) return;
    updateSubmission({ ...selectedSubmission, ddEvaluationChecklist: evalChecklist, ddReviewNotes: evalNotes, evaluationStatus: 'with_iac' });
    setIsEvaluationModalOpen(false); setIsViewModalOpen(false);
  };

  const handleIACApproval = () => {
    if (!selectedSubmission) return;
    updateSubmission({
      ...selectedSubmission, iacChecklist: evalChecklist,
      iacPresentationName: presentationFile?.name || selectedSubmission.iacPresentationName || null,
      iacResolutionName: resolutionFile?.name || selectedSubmission.iacResolutionName || null,
      iacApprovalNotes: evalNotes, evaluationStatus: 'with_ceo_final',
    });
    setIsEvaluationModalOpen(false); setIsViewModalOpen(false);
  };

  const handleCEOApproval = () => {
    if (!selectedSubmission) return;
    updateSubmission({
      ...selectedSubmission, ceoFinalChecklist: evalChecklist, ceoFinalNotes: evalNotes,
      outcomeLetterName: outcomeLetter?.name || selectedSubmission.outcomeLetterName || null,
      evaluationStatus: 'returned_to_asd_for_approval', approvalStatus: 'pending_asd_draft' as const,
    });
    setIsEvaluationModalOpen(false); setIsViewModalOpen(false);
  };

  const handleMoveToApproval = () => {
    if (!selectedSubmission) return;
    updateSubmission({ ...selectedSubmission, evaluationStatus: 'completed', approvalStatus: selectedSubmission.approvalStatus || 'pending_asd_draft' as const });
    setIsViewModalOpen(false);
  };

  const openEvalModal = (type: 'dd' | 'iac' | 'ceo', sub: ExtendedQasaSubmission) => {
    setSelectedSubmission(sub); setEvaluationType(type);
    if (type === 'dd')  { setEvalChecklist(sub.ddEvaluationChecklist || {}); setEvalNotes(sub.ddReviewNotes || ''); }
    if (type === 'iac') { setEvalChecklist(sub.iacChecklist || {}); setEvalNotes(sub.iacApprovalNotes || ''); }
    if (type === 'ceo') { setEvalChecklist(sub.ceoFinalChecklist || {}); setEvalNotes(sub.ceoFinalNotes || ''); }
    setPresentationFile(null); setResolutionFile(null); setOutcomeLetter(null);
    setIsEvaluationModalOpen(true);
  };

  // Only show submissions that have completed the acknowledgement workflow
  const // Exclude 'completed' — those have moved to the Approval section
  evaluationSubmissions = useMemo(() =>
    submissions.filter(s =>
      (s.movedToEvaluation === true || s.acknowledgementStatus === 'sent_to_quality_partner') &&
      s.evaluationStatus !== 'completed'
    ),
    [submissions]);

  const roleSubmissions = useMemo(() => {
    if (!workflowRole) return [];
    switch (workflowRole) {
      case 'asd': return evaluationSubmissions.filter(s =>
        ['pending_asd_evaluation','returned_to_qp_negative','returned_to_asd_for_approval'].includes(s.evaluationStatus));
      case 'dd':  return evaluationSubmissions.filter(s => s.evaluationStatus === 'with_deputy_director');
      case 'iac': return evaluationSubmissions.filter(s => s.evaluationStatus === 'with_iac');
      case 'ceo': return evaluationSubmissions.filter(s => s.evaluationStatus === 'with_ceo_final');
      default: return [];
    }
  }, [evaluationSubmissions, workflowRole]);

  const checklistProgress = useMemo(() => {
    if (!checklist) return { total: 0, answered: 0 };
    let total = 0, answered = 0;
    checklist.sections.forEach(sec => sec.items.forEach(item => { total++; if (item.yes === true || item.no === true) answered++; }));
    return { total, answered };
  }, [checklist]);

  const canSubmitEvaluation = checklistProgress.answered >= Math.ceil(checklistProgress.total * 0.8);

  const toggleChecklistItem = (secId: string, itemId: string, field: 'yes'|'no') => {
    if (!checklist) return;
    setChecklist({ ...checklist, sections: checklist.sections.map(sec =>
      sec.sectionId !== secId ? sec : { ...sec, items: sec.items.map(item =>
        item.id !== itemId ? item : { ...item, yes: field==='yes'?!item.yes:false, no: field==='no'?!item.no:false }
      )}
    )});
    setChecklistDirty(true);
  };

  const updateItemComment = (secId: string, itemId: string, val: string) => {
    if (!checklist) return;
    setChecklist({ ...checklist, sections: checklist.sections.map(sec =>
      sec.sectionId !== secId ? sec : { ...sec, items: sec.items.map(item =>
        item.id !== itemId ? item : { ...item, comments: val }
      )}
    )});
    setChecklistDirty(true);
  };

  const updateReport = (field: string, value: any) => {
    if (!report) return;
    setReport({ ...report, [field]: value }); setReportDirty(true);
  };

  const updateReportC = (id: string, field: string, val: any) => {
    if (!report) return;
    setReport({ ...report, sectionC: { ...report.sectionC, [id]: { ...(report.sectionC[id]||{yes:false,no:false,comments:''}), [field]: val }}});
    setReportDirty(true);
  };

  const updateReportD = (key: string, field: string, val: boolean) => {
    if (!report) return;
    setReport({ ...report, sectionD: { ...report.sectionD, [key]: { ...(report.sectionD[key]||{yes:false,no:false}), [field]: val }}});
    setReportDirty(true);
  };

  const rl = workflowRole==='asd'?'ASD':workflowRole==='dd'?'Deputy Director':workflowRole==='iac'?'Internal Assessment Committee':workflowRole==='ceo'?'CEO':currentRole||'Unknown';
  const rd = workflowRole==='asd'?'Conduct evaluation using the QAS Evaluation Tool and QASA Addendum Checklist':workflowRole==='dd'?'Review the ASD evaluation report and checklist before sending to IAC':workflowRole==='iac'?'Review the QASA presentation, supporting information, and loaded resolution':workflowRole==='ceo'?'Review all documents, sign the outcome letter, and return to ASD':'Select a supported workflow role to continue';

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 p-5 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',backgroundSize:'24px 24px'}}/>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center"><User className="h-5 w-5 text-white"/></div>
            <div><p className="text-xs text-purple-200 font-medium uppercase tracking-widest">Active Session</p><p className="text-lg font-bold">{rl}</p></div>
          </div>
          <p className="text-sm text-purple-100 max-w-xs text-right hidden md:block">{rd}</p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">QASA Application Evaluation</h2>
        <p className="mt-1 text-sm text-gray-500">ASD evaluation → Deputy Director → IAC → CEO sign-off → Return to ASD for approval</p>
      </div>

      {/* Workflow overview */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {[{icon:'📋',title:'ASD Evaluation',text:'Initial assessment'},{icon:'👔',title:'Deputy Director',text:'Review & quality check'},{icon:'👥',title:'IAC',text:'Committee approval'},{icon:'👑',title:'CEO',text:'Final sign-off'},{icon:'✅',title:'ASD Return',text:'Move to approval'}].map(s=>(
          <div key={s.title} className="rounded-2xl border bg-white p-3 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-1">{s.icon}</div><p className="text-xs font-semibold text-gray-700">{s.title}</p><p className="text-xs text-gray-400 mt-0.5">{s.text}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {label:'Total in Evaluation',value:evaluationSubmissions.length,color:'from-slate-500 to-slate-700'},
          {label:'Pending ASD',value:evaluationSubmissions.filter(s=>s.evaluationStatus==='pending_asd_evaluation').length,color:'from-amber-500 to-orange-600'},
          {label:'In Progress',value:evaluationSubmissions.filter(s=>['with_deputy_director','with_iac','with_ceo_final'].includes(s.evaluationStatus)).length,color:'from-purple-500 to-indigo-600'},
          {label:'Completed',value:evaluationSubmissions.filter(s=>s.evaluationStatus==='completed').length,color:'from-emerald-500 to-teal-600'},
        ].map(c=>(
          <div key={c.label} className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${c.color} items-center justify-center mb-3`}><span className="text-white text-xs font-bold">{c.value}</span></div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p><p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">
            {workflowRole==='asd'?'QASA Applications for ASD Evaluation':workflowRole==='dd'?'Applications for Deputy Director Review':workflowRole==='iac'?'Applications for Internal Assessment Committee':workflowRole==='ceo'?'Applications for CEO Final Approval':'No workflow role selected'}
          </h3>
        </div>
        {roleSubmissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><ClipboardList className="h-8 w-8 text-gray-300"/></div>
            <p className="font-medium text-gray-500">No applications at this stage</p>
            <p className="text-sm text-gray-400 mt-1">{workflowRole?'Applications will appear here once they reach your workflow stage.':'Select a supported role to view your queue.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  {['#','Name of AQP','Qualification Title','SAQA ID','NQF Level','Credits','Proposed EISA','Submitted','Evaluation Status',''].map(h=>(
                    <TableHead key={h} className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap py-3">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleSubmissions.map((sub,idx)=>(
                  <TableRow key={sub.id} className="hover:bg-purple-50/30 transition-colors group">
                    <TableCell className="text-gray-400 text-xs font-mono">{String(idx+1).padStart(2,'0')}</TableCell>
                    <TableCell className="font-semibold text-gray-900 whitespace-nowrap">{sub.nameOfAQP}</TableCell>
                    <TableCell className="max-w-[160px]"><span className="block truncate text-sm text-gray-700" title={sub.qualificationTitle}>{sub.qualificationTitle}</span></TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">{sub.saqaId}</TableCell>
                    <TableCell><span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold whitespace-nowrap">{sub.nqfLevel}</span></TableCell>
                    <TableCell className="text-sm text-gray-600">{sub.credits}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{sub.proposedDateOfEISA?new Date(sub.proposedDateOfEISA).toLocaleDateString('en-ZA'):'—'}</TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">{new Date(sub.submissionDate).toLocaleDateString('en-ZA')}</TableCell>
                    <TableCell><EvalStatusPill status={sub.evaluationStatus}/></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={()=>openViewModal(sub)} className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-lg hover:bg-purple-100">
                        <Eye className="h-4 w-4 text-purple-600"/>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── 3-tab modal ─────────────────────────────────────────────────────── */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
          {selectedSubmission && (()=>{
            const sub = selectedSubmission;
            const canAct =
              (workflowRole==='asd'&&['pending_asd_evaluation','returned_to_asd_for_approval'].includes(sub.evaluationStatus))||
              (workflowRole==='dd'&&sub.evaluationStatus==='with_deputy_director')||
              (workflowRole==='iac'&&sub.evaluationStatus==='with_iac')||
              (workflowRole==='ceo'&&sub.evaluationStatus==='with_ceo_final');
            return (
              <>
                {/* Modal header + tabs */}
                <div className="sticky top-0 z-10 bg-white border-b px-6 pt-4 pb-0 flex-shrink-0">
                  <div className="flex items-start justify-between mb-3">
                    <div><h2 className="text-lg font-bold text-gray-900">Evaluation Details</h2><p className="text-sm text-gray-500 mt-0.5">{sub.qualificationTitle}</p></div>
                    <div className="flex items-center gap-3"><EvalStatusPill status={sub.evaluationStatus}/><button onClick={()=>setIsViewModalOpen(false)} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="h-4 w-4 text-gray-500"/></button></div>
                  </div>
                  <div className="flex gap-1">
                    {([{id:'details',label:'Application Details',icon:'📄'},{id:'checklist',label:'Evaluation Checklist',icon:'📋'},{id:'report',label:'Evaluation Report',icon:'📊'}] as {id:ModalTab;label:string;icon:string}[]).map(tab=>(
                      <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${activeTab===tab.id?'border-purple-500 text-purple-700 bg-purple-50/50':'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                        <span>{tab.icon}</span>{tab.label}
                        {tab.id==='checklist'&&checklistDirty&&<span className="h-2 w-2 rounded-full bg-amber-400 ml-1"/>}
                        {tab.id==='report'&&reportDirty&&<span className="h-2 w-2 rounded-full bg-amber-400 ml-1"/>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {/* ── TAB 1: Details ── */}
                  {activeTab==='details'&&(
                    <div className="p-6 space-y-6">
                      <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/50 border border-purple-200 p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Evaluation Progress</p>
                        <EvalWorkflowProgress status={sub.evaluationStatus}/>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AQP & Qualification</p></div>
                          <div className="px-4 divide-y divide-gray-50">
                            <DetailRow icon={User} label="Name of AQP" value={sub.nameOfAQP}/>
                            <DetailRow icon={BookOpen} label="Qualification Title" value={sub.qualificationTitle}/>
                            <DetailRow icon={Hash} label="SAQA ID" value={<span className="font-mono">{sub.saqaId}</span>}/>
                            <DetailRow icon={Calendar} label="Date Registered with SAQA" value={sub.dateRegisteredWithSAQA?new Date(sub.dateRegisteredWithSAQA).toLocaleDateString('en-ZA'):'—'}/>
                          </div>
                        </div>
                        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualification Details</p></div>
                          <div className="px-4 divide-y divide-gray-50">
                            <DetailRow icon={Award} label="NQF Level" value={sub.nqfLevel}/>
                            <DetailRow icon={Hash} label="Credits" value={sub.credits}/>
                            <DetailRow icon={Calendar} label="Proposed Date of EISA" value={sub.proposedDateOfEISA?new Date(sub.proposedDateOfEISA).toLocaleDateString('en-ZA'):'—'}/>
                            <DetailRow icon={Calendar} label="Submission Date" value={new Date(sub.submissionDate).toLocaleDateString('en-ZA')}/>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted Documents</p></div>
                        <div className="divide-y">
                          {[
                            {label:'SAQA Qualification Document',value:sub.documents.saqaQualificationDocument},
                            {label:'Curriculum Document',value:sub.documents.curriculumDocument},
                            {label:'QAS Addendum',value:sub.documents.qasAddendum},
                            ...(sub.acknowledgementLetterName?[{label:'Acknowledgement Letter',value:sub.acknowledgementLetterName}]:[]),
                            ...(sub.iacPresentationName?[{label:'IAC Presentation',value:sub.iacPresentationName}]:[]),
                            ...(sub.iacResolutionName?[{label:'IAC Resolution',value:sub.iacResolutionName}]:[]),
                            ...(sub.outcomeLetterName?[{label:'CEO Outcome Letter',value:sub.outcomeLetterName}]:[]),
                          ].map(doc=>(
                            <div key={doc.label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-2.5"><div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-purple-600"/></div><span className="text-sm font-medium text-gray-700">{doc.label}</span></div>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-mono">{doc.value||'—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {(sub.asdEvaluationChecklist&&Object.keys(sub.asdEvaluationChecklist).length>0)||sub.asdEvaluationNotes||sub.evaluationReportName||sub.qasaChecklist?<ReviewBlock title="ASD Evaluation" color="indigo" checklist={sub.asdEvaluationChecklist||undefined} notes={sub.asdEvaluationNotes} files={[{label:'Evaluation Report',value:sub.evaluationReportName},{label:'Checklist',value:sub.qasaChecklist?'QASA Addendum Checklist (completed)':null},{label:'Evaluation Report',value:sub.evaluationReport?'QAS Addendum Evaluation Report (generated)':null}]}/>:null}
                      {(sub.ddEvaluationChecklist&&Object.keys(sub.ddEvaluationChecklist).length>0)||sub.ddReviewNotes?<ReviewBlock title="Deputy Director Review" color="blue" checklist={sub.ddEvaluationChecklist||undefined} notes={sub.ddReviewNotes}/>:null}
                      {(sub.iacChecklist&&Object.keys(sub.iacChecklist).length>0)||sub.iacApprovalNotes||sub.iacPresentationName||sub.iacResolutionName?<ReviewBlock title="Internal Assessment Committee" color="purple" checklist={sub.iacChecklist||undefined} notes={sub.iacApprovalNotes}/>:null}
                      {(sub.ceoFinalChecklist&&Object.keys(sub.ceoFinalChecklist).length>0)||sub.ceoFinalNotes||sub.outcomeLetterName?<ReviewBlock title="CEO Final Approval" color="teal" checklist={sub.ceoFinalChecklist||undefined} notes={sub.ceoFinalNotes}/>:null}
                      {canAct&&(
                        <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/30 p-4">
                          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-3">Available Actions</p>
                          <div className="flex flex-wrap gap-2">
                            {workflowRole==='asd'&&sub.evaluationStatus==='pending_asd_evaluation'&&(<><Button onClick={()=>setActiveTab('checklist')} className="bg-purple-600 hover:bg-purple-700 gap-2"><ClipboardList className="h-4 w-4"/>Complete Evaluation Checklist</Button><Button onClick={()=>setActiveTab('report')} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-2"><FileText className="h-4 w-4"/>View Evaluation Report</Button></>)}
                            {workflowRole==='asd'&&sub.evaluationStatus==='returned_to_asd_for_approval'&&(<Button onClick={handleMoveToApproval} className="bg-emerald-600 hover:bg-emerald-700 gap-2"><ArrowRightCircle className="h-4 w-4"/>Send to QASA Application Approval</Button>)}
                            {workflowRole==='dd'&&sub.evaluationStatus==='with_deputy_director'&&(<Button onClick={()=>openEvalModal('dd',sub)} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-2"><CheckSquare className="h-4 w-4"/>Review & Send to IAC</Button>)}
                            {workflowRole==='iac'&&sub.evaluationStatus==='with_iac'&&(<Button onClick={()=>openEvalModal('iac',sub)} variant="outline" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 gap-2"><Users className="h-4 w-4"/>Review & Approve to CEO</Button>)}
                            {workflowRole==='ceo'&&sub.evaluationStatus==='with_ceo_final'&&(<Button onClick={()=>openEvalModal('ceo',sub)} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-2"><Award className="h-4 w-4"/>Final Review & Sign Outcome Letter</Button>)}
                          </div>
                        </div>
                      )}
                      {!canAct&&<p className="text-sm text-gray-400 italic text-center py-2">No actions available for your role at this stage.</p>}
                    </div>
                  )}

                  {/* ── TAB 2: Checklist ── */}
                  {activeTab==='checklist'&&checklist&&(
                    <div className="p-6 space-y-6">
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-purple-900 uppercase tracking-wide">QAS ADDENDUM PRELIMINARY CHECKLIST</p>
                            <p className="text-xs text-purple-600 mt-0.5">Document No: QCTO/EISA/CL1 · Version: 1</p>
                          </div>
                          {report && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                              🔒 Locked — Report Generated
                            </span>
                          )}
                        </div>
                        <div className="p-4 grid md:grid-cols-2 gap-4">
                          <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Name of AQP</Label><p className="text-sm font-medium text-gray-900">{sub.nameOfAQP}</p></div>
                          <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Qualification Title</Label><p className="text-sm font-medium text-gray-900">{sub.qualificationTitle}</p></div>
                          <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">SAQA ID</Label><p className="text-sm font-mono text-gray-900">{sub.saqaId}</p></div>
                          <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Proposed Date of EISA</Label><p className="text-sm text-gray-900">{sub.proposedDateOfEISA?new Date(sub.proposedDateOfEISA).toLocaleDateString('en-ZA'):'—'}</p></div>
                          <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">NQF Level</Label><p className="text-sm text-gray-900">{sub.nqfLevel}</p></div>
                          <div className="space-y-1"><Label className="text-xs text-gray-500 uppercase font-semibold">Credits</Label><p className="text-sm text-gray-900">{sub.credits}</p></div>
                          <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Date of Receipt</Label><Input type="date" value={checklist.dateOfReceipt} onChange={e=>{setChecklist({...checklist,dateOfReceipt:e.target.value});setChecklistDirty(true);}}/></div>
                          <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Date Evaluated</Label><Input type="date" value={checklist.dateEvaluated} onChange={e=>{setChecklist({...checklist,dateEvaluated:e.target.value});setChecklistDirty(true);}}/></div>
                          <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Evaluated By</Label><Input value={checklist.evaluatedBy} onChange={e=>{setChecklist({...checklist,evaluatedBy:e.target.value});setChecklistDirty(true);}} placeholder="Evaluator name"/></div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500 uppercase font-semibold">Remedial Actions Required</Label>
                            <div className="flex gap-3">
                              {(['yes','no'] as const).map(opt=>(
                                <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${checklist.remedialActionsRequired===opt?'bg-purple-50 border-purple-300 text-purple-800 font-medium':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                  <input type="radio" name="remedial" value={opt} checked={checklist.remedialActionsRequired===opt} onChange={()=>{setChecklist({...checklist,remedialActionsRequired:opt});setChecklistDirty(true);}} className="sr-only"/>
                                  {opt.charAt(0).toUpperCase()+opt.slice(1)}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Date Feedback Provided to AQP</Label><Input type="date" value={checklist.dateFeedbackProvided} onChange={e=>{setChecklist({...checklist,dateFeedbackProvided:e.target.value});setChecklistDirty(true);}}/></div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="rounded-2xl border bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-purple-800">Checklist Progress</p>
                          <span className="text-sm font-bold text-purple-700">{checklistProgress.answered} / {checklistProgress.total} items answered</span>
                        </div>
                        <div className="h-2.5 bg-white rounded-full overflow-hidden border border-purple-200">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{width:`${checklistProgress.total>0?(checklistProgress.answered/checklistProgress.total)*100:0}%`}}/>
                        </div>
                      </div>

                      {/* Sections */}
                      {checklist.sections.map(section=>(
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
                                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 min-w-[180px]">Comments / Remedial</th>
                              </tr></thead>
                              <tbody>
                                {section.items.map((item,ii)=>(
                                  <tr key={item.id} className={`border-b last:border-0 ${ii%2===0?'bg-white':'bg-gray-50/30'}`}>
                                    <td className="px-4 py-2.5 text-xs text-gray-400 font-mono align-top">{item.id}</td>
                                    <td className="px-4 py-2.5 text-sm text-gray-700 align-top">{item.text}</td>
                                    <td className="px-3 py-2.5 text-center align-top">
                                      <button onClick={()=>!report&&toggleChecklistItem(section.sectionId,item.id,'yes')} disabled={!!report} className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto transition-all ${item.yes?'bg-emerald-500 border-emerald-500':report?'border-gray-200 bg-gray-50 cursor-not-allowed':'border-gray-300 hover:border-emerald-400'}`}>
                                        {item.yes&&<CheckCircle className={`h-3.5 w-3.5 ${report?'text-gray-300':'text-white'}`}/>}
                                      </button>
                                    </td>
                                    <td className="px-3 py-2.5 text-center align-top">
                                      <button onClick={()=>!report&&toggleChecklistItem(section.sectionId,item.id,'no')} disabled={!!report} className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto transition-all ${item.no?'bg-red-500 border-red-500':report?'border-gray-200 bg-gray-50 cursor-not-allowed':'border-gray-300 hover:border-red-400'}`}>
                                        {item.no&&<X className={`h-3.5 w-3.5 ${report?'text-gray-300':'text-white'}`}/>}
                                      </button>
                                    </td>
                                    <td className="px-4 py-2.5 align-top">
                                      <Input value={item.comments} onChange={e=>!report&&updateItemComment(section.sectionId,item.id,e.target.value)} readOnly={!!report} placeholder="Comments..." className={`text-xs h-7 ${report?'bg-gray-50 text-gray-400 cursor-not-allowed':''}`}/>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}

                      {/* Recommendations */}
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200"><p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Recommendations</p></div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Recommendation</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-14">Yes</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-14">No</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 min-w-[200px]">Comments</th></tr></thead>
                            <tbody>
                              {[
                                {label:'This QAS Addendum clearly assesses job-related task(s)',yf:'recommendationJobRelated' as const,nf:'recommendationJobRelatedNo' as const,cf:'recommendationJobRelatedComments' as const},
                                {label:'This QAS Addendum has been recommended for approval by the QCTO',yf:'recommendationApproved' as const,nf:'recommendationApprovedNo' as const,cf:'recommendationApprovedComments' as const},
                              ].map((rec,ri)=>(
                                <tr key={rec.label} className={`border-b last:border-0 ${ri%2===0?'bg-white':'bg-gray-50/30'}`}>
                                  <td className="px-4 py-2.5 text-sm text-gray-700">{rec.label}</td>
                                  <td className="px-3 py-2.5 text-center"><button onClick={()=>!report&&(setChecklist({...checklist,[rec.yf]:!checklist[rec.yf],[rec.nf]:false}),setChecklistDirty(true))} disabled={!!report} className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto transition-all ${checklist[rec.yf]?'bg-emerald-500 border-emerald-500':report?'border-gray-200 bg-gray-50 cursor-not-allowed':'border-gray-300 hover:border-emerald-400'}`}>{checklist[rec.yf]&&<CheckCircle className="h-3.5 w-3.5 text-white"/>}</button></td>
                                  <td className="px-3 py-2.5 text-center"><button onClick={()=>!report&&(setChecklist({...checklist,[rec.nf]:!checklist[rec.nf],[rec.yf]:false}),setChecklistDirty(true))} disabled={!!report} className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto transition-all ${checklist[rec.nf]?'bg-red-500 border-red-500':report?'border-gray-200 bg-gray-50 cursor-not-allowed':'border-gray-300 hover:border-red-400'}`}>{checklist[rec.nf]&&<X className="h-3.5 w-3.5 text-white"/>}</button></td>
                                  <td className="px-4 py-2.5"><Input value={checklist[rec.cf]} onChange={e=>!report&&(setChecklist({...checklist,[rec.cf]:e.target.value}),setChecklistDirty(true))} readOnly={!!report} placeholder="Comments..." className={`text-xs h-7 ${report?'bg-gray-50 text-gray-400 cursor-not-allowed':''}`}/></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Checklist actions */}
                      {!report ? (
                        <div className="flex flex-wrap gap-3 pt-2">
                          <Button onClick={saveChecklist} variant="outline" className="gap-2"><CheckCircle className="h-4 w-4"/>Save Checklist</Button>
                          <Button onClick={generateReport} className="bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={!canSubmitEvaluation}><FileText className="h-4 w-4"/>Generate Evaluation Report</Button>
                          {!canSubmitEvaluation&&workflowRole==='asd'&&sub.evaluationStatus==='pending_asd_evaluation'&&(
                            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"><AlertCircle className="h-3.5 w-3.5"/>Complete at least 80% of checklist items to generate the report</div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-amber-800">
                            <span className="text-base">🔒</span>
                            <span className="font-medium">Checklist is locked.</span>
                            <span className="text-amber-600">The evaluation report has been generated — the checklist can no longer be modified.</span>
                          </div>
                          <Button onClick={()=>setActiveTab('report')} variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100 gap-1.5 ml-4 flex-shrink-0"><FileText className="h-3.5 w-3.5"/>View Report</Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB 3: Report ── */}
                  {activeTab==='report'&&(
                    <div className="p-6 space-y-6">
                      {!report?(
                        <div className="text-center py-16">
                          <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><FileText className="h-8 w-8 text-gray-300"/></div>
                          <p className="font-medium text-gray-500">No Evaluation Report Yet</p>
                          <p className="text-sm text-gray-400 mt-1 mb-4">Complete the Evaluation Checklist first, then generate the report.</p>
                          <Button onClick={()=>setActiveTab('checklist')} variant="outline" className="gap-2"><ClipboardList className="h-4 w-4"/>Go to Checklist</Button>
                        </div>
                      ):(
                        <>
                          <div className="rounded-2xl border bg-purple-50 border-purple-200 px-6 py-4 text-center">
                            <p className="text-base font-bold text-purple-900 uppercase tracking-wide">QAS ADDENDUM EVALUATION REPORT</p>
                            <p className="text-xs text-purple-600 mt-1">QCTO OQA Assessment Evaluation</p>
                          </div>

                          {/* AC Approval */}
                          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Committee Approval</p></div>
                            <div className="p-4 flex flex-wrap gap-4 items-end">
                              <div><Label className="text-xs text-gray-500 uppercase font-semibold mb-1.5 block">Approval</Label>
                                <div className="flex gap-2">{(['yes','no'] as const).map(opt=>(<label key={opt} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-sm ${report.acApproval===opt?'bg-purple-50 border-purple-300 text-purple-800 font-medium':'border-gray-200 text-gray-600'}`}><input type="radio" checked={report.acApproval===opt} onChange={()=>updateReport('acApproval',opt)} className="sr-only"/>{opt.charAt(0).toUpperCase()+opt.slice(1)}</label>))}</div>
                              </div>
                              <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Date</Label><Input type="date" value={report.acDate} onChange={e=>updateReport('acDate',e.target.value)}/></div>
                            </div>
                          </div>

                          {/* Section A */}
                          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-blue-50 border-b border-blue-200"><p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Section A — AQP Details</p></div>
                            <div className="p-4 grid md:grid-cols-2 gap-4">
                              {[{f:'aqpName',l:'AQP Name',v:report.aqpName},{f:'contactName',l:'Contact Name',v:report.contactName},{f:'contactEmail',l:'Contact Email',v:report.contactEmail},{f:'physicalAddress',l:'Physical Address',v:report.physicalAddress},{f:'dateReceived',l:'Date Received',v:report.dateReceived,t:'date'},{f:'dateEvaluated',l:'Date Evaluated',v:report.dateEvaluated,t:'date'},{f:'evaluatorsName',l:"Evaluator's Name",v:report.evaluatorsName}].map(x=>(
                                <div key={x.f} className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">{x.l}</Label><Input type={(x as any).t||'text'} value={x.v} onChange={e=>updateReport(x.f,e.target.value)}/></div>
                              ))}
                            </div>
                          </div>

                          {/* Section B */}
                          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200"><p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Section B — Assessment Specification Requirements</p></div>
                            <div className="p-4 space-y-4">
                              <div className="grid md:grid-cols-3 gap-4">
                                <div className="md:col-span-3 space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Qualification Title</Label><Input value={report.qualificationTitle} onChange={e=>updateReport('qualificationTitle',e.target.value)}/></div>
                                <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">SAQA ID</Label><Input value={report.saqaId} onChange={e=>updateReport('saqaId',e.target.value)}/></div>
                                <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Date Registered</Label><Input type="date" value={report.dateRegistered} onChange={e=>updateReport('dateRegistered',e.target.value)}/></div>
                                <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">NQF Level</Label><Input value={report.nqfLevel} onChange={e=>updateReport('nqfLevel',e.target.value)}/></div>
                                <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Credits</Label><Input value={report.credits} onChange={e=>updateReport('credits',e.target.value)}/></div>
                                <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Reg. Start Date</Label><Input type="date" value={report.registrationStartDate} onChange={e=>updateReport('registrationStartDate',e.target.value)}/></div>
                                <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Reg. End Date</Label><Input type="date" value={report.registrationEndDate} onChange={e=>updateReport('registrationEndDate',e.target.value)}/></div>
                              </div>
                              <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full text-sm">
                                  <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Item</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 min-w-[200px]">Findings</th></tr></thead>
                                  <tbody>
                                    {[{f:'correctQualTitle',l:'Correct Qualification Title (as per SAQA)'},{f:'correctNqfLevel',l:'Correct NQF Level'},{f:'nqfLevelEisa',l:'NQF Level of EISA'},{f:'correctCredits',l:'Correct total Credits identified'},{f:'numberOfComponents',l:'Number of Components'},{f:'duration',l:'Duration of each component'},{f:'format',l:'Format for each component'},{f:'layout',l:'Layout of question types'},{f:'openOrClosed',l:'Open or Closed Book'},{f:'assessmentPoints',l:'Assessment Points indicated'},{f:'supplementaryAssessments',l:'Supplementary Assessments'},{f:'percentageModerated',l:'% to be moderated (min 10%)'},{f:'markingDays',l:'Marking days (min 21)'},{f:'moderationDays',l:'Moderation days (min 21)'}].map((x,ii)=>(
                                      <tr key={x.f} className={`border-b last:border-0 ${ii%2===0?'bg-white':'bg-gray-50/30'}`}>
                                        <td className="px-4 py-2.5 text-sm text-gray-700">{x.l}</td>
                                        <td className="px-4 py-2.5"><Input value={(report as any)[x.f]||''} onChange={e=>updateReport(x.f,e.target.value)} placeholder="Findings..." className="text-xs h-7"/></td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full text-sm">
                                  <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Component</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Name</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Total Marks</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Pass Mark</th></tr></thead>
                                  <tbody>{[1,2,3].map(n=>(<tr key={n} className={`border-b last:border-0 ${n%2===0?'bg-gray-50/30':'bg-white'}`}><td className="px-4 py-2.5 text-sm font-medium text-gray-700">Component {n}</td><td className="px-4 py-2.5"><Input value={(report as any)[`component${n}Name`]||''} onChange={e=>updateReport(`component${n}Name`,e.target.value)} placeholder="Name..." className="text-xs h-7"/></td><td className="px-4 py-2.5"><Input value={(report as any)[`component${n}Marks`]||''} onChange={e=>updateReport(`component${n}Marks`,e.target.value)} placeholder="Marks..." className="text-xs h-7"/></td><td className="px-4 py-2.5"><Input value={(report as any)[`component${n}Pass`]||''} onChange={e=>updateReport(`component${n}Pass`,e.target.value)} placeholder="Pass..." className="text-xs h-7"/></td></tr>))}</tbody>
                                </table>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Calculation of Final Achievement</Label><Textarea value={report.calculationFinalAchievement} onChange={e=>updateReport('calculationFinalAchievement',e.target.value)} rows={2} className="resize-none text-xs"/></div>
                                <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Final Achievement (pass mark/result)</Label><Textarea value={report.finalAchievement} onChange={e=>updateReport('finalAchievement',e.target.value)} rows={2} className="resize-none text-xs"/></div>
                              </div>
                            </div>
                          </div>

                          {/* Section C */}
                          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-purple-50 border-b border-purple-200"><p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Section C — Core Qualification Assessment (Blueprint) Evaluation</p></div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-14">No.</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Item</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-12">Yes</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-12">No</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 min-w-[160px]">Comments</th></tr></thead>
                                <tbody>
                                  {checklist?.sections.flatMap(sec=>sec.items).map((item,ii)=>{
                                    const ci=report.sectionC[item.id]||{yes:false,no:false,comments:''};
                                    return (
                                      <tr key={item.id} className={`border-b last:border-0 ${ii%2===0?'bg-white':'bg-gray-50/30'}`}>
                                        <td className="px-3 py-2.5 text-xs text-gray-400 font-mono align-top">{item.id}</td>
                                        <td className="px-4 py-2.5 text-xs text-gray-700 align-top">{item.text}</td>
                                        <td className="px-3 py-2.5 text-center align-top"><button onClick={()=>updateReportC(item.id,'yes',!ci.yes)} className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto transition-all ${ci.yes?'bg-emerald-500 border-emerald-500':'border-gray-300 hover:border-emerald-400'}`}>{ci.yes&&<CheckCircle className="h-3.5 w-3.5 text-white"/>}</button></td>
                                        <td className="px-3 py-2.5 text-center align-top"><button onClick={()=>updateReportC(item.id,'no',!ci.no)} className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto transition-all ${ci.no?'bg-red-500 border-red-500':'border-gray-300 hover:border-red-400'}`}>{ci.no&&<X className="h-3.5 w-3.5 text-white"/>}</button></td>
                                        <td className="px-4 py-2.5 align-top"><Input value={ci.comments} onChange={e=>updateReportC(item.id,'comments',e.target.value)} placeholder="Comments..." className="text-xs h-7"/></td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Section D */}
                          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-teal-50 border-b border-teal-200"><p className="text-xs font-bold text-teal-900 uppercase tracking-wider">Section D — Overall General Evaluation</p></div>
                            <div className="p-4 space-y-4">
                              <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full text-sm">
                                  <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Characteristic</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Description</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-12">Yes</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-12">No</th></tr></thead>
                                  <tbody>
                                    {[{key:'relevance',char:'Relevance',desc:'Assessment instruments will be able to assess occupational competencies'},{key:'setStandards',char:'Set Standards',desc:'Developers can develop items for the item bank'},{key:'accuracy',char:'Accuracy',desc:'Measures occupational competence at exit level'},{key:'bestPractice',char:'Best Practice',desc:'Final EISA is in line with national and international best practice'}].map((row,ii)=>{
                                      const sd=report.sectionD[row.key]||{yes:false,no:false};
                                      return (
                                        <tr key={row.key} className={`border-b last:border-0 ${ii%2===0?'bg-white':'bg-gray-50/30'}`}>
                                          <td className="px-4 py-2.5 text-sm font-medium text-gray-700">{row.char}</td>
                                          <td className="px-4 py-2.5 text-xs text-gray-600">{row.desc}</td>
                                          <td className="px-3 py-2.5 text-center"><button onClick={()=>updateReportD(row.key,'yes',!sd.yes)} className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto transition-all ${sd.yes?'bg-emerald-500 border-emerald-500':'border-gray-300 hover:border-emerald-400'}`}>{sd.yes&&<CheckCircle className="h-3.5 w-3.5 text-white"/>}</button></td>
                                          <td className="px-3 py-2.5 text-center"><button onClick={()=>updateReportD(row.key,'no',!sd.no)} className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto transition-all ${sd.no?'bg-red-500 border-red-500':'border-gray-300 hover:border-red-400'}`}>{sd.no&&<X className="h-3.5 w-3.5 text-white"/>}</button></td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Evaluation Findings</Label><Textarea value={report.evaluationFindings} onChange={e=>updateReport('evaluationFindings',e.target.value)} rows={3} className="resize-none text-sm" placeholder="The QAS Addendum is well developed..."/></div>
                                <div className="space-y-1.5"><Label className="text-xs text-gray-500 uppercase font-semibold">Recommendation</Label><Textarea value={report.recommendation} onChange={e=>updateReport('recommendation',e.target.value)} rows={3} className="resize-none text-sm" placeholder="The QAS Addendum meets the minimum criteria for approval..."/></div>
                              </div>
                            </div>
                          </div>

                          {/* Section E */}
                          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                            <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200"><p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Section E — Final Recommendations</p></div>
                            <div className="p-4 space-y-4">
                              <div>
                                <Label className="text-xs text-gray-500 uppercase font-semibold mb-2 block">The QAS Addendum meets minimum requirements for approval</Label>
                                <div className="flex gap-3">{(['yes','no'] as const).map(opt=>(<label key={opt} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium ${report.meetsMinRequirements===opt?opt==='yes'?'bg-emerald-50 border-emerald-300 text-emerald-800':'bg-red-50 border-red-300 text-red-800':'border-gray-200 text-gray-600 hover:border-gray-300'}`}><input type="radio" checked={report.meetsMinRequirements===opt} onChange={()=>updateReport('meetsMinRequirements',opt)} className="sr-only"/>{opt.toUpperCase()}</label>))}</div>
                              </div>
                              <div className="overflow-x-auto rounded-xl border">
                                <table className="w-full text-sm">
                                  <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Evaluator</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Name</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Recommended</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">With Amendments</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Not Recommended</th></tr></thead>
                                  <tbody>
                                    {[{label:'First Evaluator (ASD)',nf:'firstEvaluatorName',of:'firstEvaluatorOutcome'},{label:'Second Evaluator (DD)',nf:'secondEvaluatorName',of:'secondEvaluatorOutcome'},{label:'Final Recommendation (Director)',nf:null,of:'finalRecommendation'}].map((row,ii)=>{
                                      const outcome=(report as any)[row.of];
                                      return (
                                        <tr key={row.label} className={`border-b last:border-0 ${ii%2===0?'bg-white':'bg-gray-50/30'}`}>
                                          <td className="px-4 py-2.5 text-sm font-medium text-gray-700">{row.label}</td>
                                          <td className="px-4 py-2.5">{row.nf?<Input value={(report as any)[row.nf]||''} onChange={e=>updateReport(row.nf!,e.target.value)} placeholder="Name..." className="text-xs h-7"/>:<span className="text-xs text-gray-500 italic">Diane Kemp</span>}</td>
                                          {(['approved','amendments','not_recommended'] as const).map(opt=>(
                                            <td key={opt} className="px-3 py-2.5 text-center"><button onClick={()=>updateReport(row.of,outcome===opt?'':opt)} className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto transition-all ${outcome===opt?opt==='approved'?'bg-emerald-500 border-emerald-500':opt==='amendments'?'bg-amber-500 border-amber-500':'bg-red-500 border-red-500':'border-gray-300 hover:border-gray-400'}`}>{outcome===opt&&<CheckCircle className="h-3.5 w-3.5 text-white"/>}</button></td>
                                          ))}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 pt-2">
                            <Button onClick={saveReport} variant="outline" className="gap-2"><CheckCircle className="h-4 w-4"/>Save Report</Button>
                            {workflowRole==='asd'&&sub.evaluationStatus==='pending_asd_evaluation'&&(
                              <>
                                <Button onClick={()=>handleASDSubmit('negative')} variant="destructive" className="gap-2"><ThumbsDown className="h-4 w-4"/>Negative — Return to QP</Button>
                                <Button onClick={()=>handleASDSubmit('positive')} className="bg-emerald-600 hover:bg-emerald-700 gap-2"><ThumbsUp className="h-4 w-4"/>Positive — Send to Deputy Director</Button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── DD / IAC / CEO workflow modal ── */}
      <Dialog open={isEvaluationModalOpen} onOpenChange={setIsEvaluationModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {evaluationType==='dd'&&<><CheckSquare className="h-4 w-4 text-blue-600"/>Deputy Director — Review Evaluation</>}
              {evaluationType==='iac'&&<><Users className="h-4 w-4 text-indigo-600"/>IAC — Review & Approve</>}
              {evaluationType==='ceo'&&<><Award className="h-4 w-4 text-purple-600"/>CEO — Final Approval & Outcome Letter</>}
            </DialogTitle>
            <DialogDescription>
              {evaluationType==='dd'&&'Review the ASD evaluation report and send to IAC when quality check is complete.'}
              {evaluationType==='iac'&&'Review the QASA presentation and resolution, then approve to CEO.'}
              {evaluationType==='ceo'&&'Review all documents, sign the outcome letter, and return to ASD for approval.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {evaluationType&&(()=>{
              const items=evaluationType==='dd'?ddItems:evaluationType==='iac'?iacItems:ceoItems;
              const checked=Object.values(evalChecklist).filter(Boolean).length;
              return (
                <div>
                  <div className="flex items-center justify-between mb-3"><Label className="text-sm font-semibold">Evaluation Checklist</Label><span className="text-xs text-gray-400">{checked}/{items.length} confirmed</span></div>
                  <div className="space-y-2 rounded-xl border bg-gray-50 p-3">
                    {items.map(item=>{
                      const isChecked=!!evalChecklist[item];
                      return (
                        <div key={item} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isChecked?'bg-emerald-50 border border-emerald-200':'bg-white border border-gray-200 hover:border-gray-300'}`} onClick={()=>setEvalChecklist(p=>({...p,[item]:!p[item]}))}>
                          <Checkbox id={item} checked={isChecked} onCheckedChange={v=>setEvalChecklist(p=>({...p,[item]:v===true}))}/>
                          <label htmlFor={item} className={`text-sm cursor-pointer select-none ${isChecked?'text-emerald-800 font-medium':'text-gray-700'}`}>{item}</label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {evaluationType==='iac'&&(<>
              <div className="space-y-2"><Label className="text-sm font-semibold">Upload QASA Presentation *</Label><Input type="file" accept=".pdf,.ppt,.pptx" onChange={e=>setPresentationFile(e.target.files?.[0]||null)}/>{presentationFile&&<p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3"/>{presentationFile.name}</p>}</div>
              <div className="space-y-2"><Label className="text-sm font-semibold">Upload Resolution Document *</Label><Input type="file" accept=".pdf,.doc,.docx" onChange={e=>setResolutionFile(e.target.files?.[0]||null)}/>{resolutionFile&&<p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3"/>{resolutionFile.name}</p>}</div>
            </>)}
            {evaluationType==='ceo'&&(
              <div className="space-y-2"><Label className="text-sm font-semibold">Upload Signed Outcome Letter *</Label><Input type="file" accept=".pdf,.doc,.docx" onChange={e=>setOutcomeLetter(e.target.files?.[0]||null)}/>{outcomeLetter&&<p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3"/>{outcomeLetter.name}</p>}</div>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{evaluationType==='dd'?'Review Notes':evaluationType==='iac'?'IAC Approval Notes':'CEO Approval Notes'}</Label>
              <Textarea value={evalNotes} onChange={e=>setEvalNotes(e.target.value)} placeholder={evaluationType==='dd'?'Enter review notes...':evaluationType==='iac'?'Enter committee approval notes...':'Enter final approval notes...'} rows={4} className="resize-none"/>
            </div>
            <Button onClick={evaluationType==='dd'?handleDDReview:evaluationType==='iac'?handleIACApproval:handleCEOApproval}
              className={`w-full gap-2 ${evaluationType==='dd'?'bg-blue-600 hover:bg-blue-700':evaluationType==='iac'?'bg-indigo-600 hover:bg-indigo-700':'bg-purple-600 hover:bg-purple-700'}`}>
              {evaluationType==='dd'&&<><Send className="h-4 w-4"/>Quality Check OK — Send to IAC</>}
              {evaluationType==='iac'&&<><CheckCircle className="h-4 w-4"/>IAC Approved — Send to CEO</>}
              {evaluationType==='ceo'&&<><FileSignature className="h-4 w-4"/>Approve & Sign — Return to ASD</>}
            </Button>
          </div>
          <DialogFooter className="pt-2"><Button variant="outline" onClick={()=>setIsEvaluationModalOpen(false)}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}