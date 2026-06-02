// components/modals/EvaluationDetailsModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  User,
  Briefcase,
  Award,
  MessageSquare,
  ChevronLeft,
  History,
  ClipboardList,
  Building2,
  FileCheck,
  Target,
  BookOpen,
  FileCheck2,
  Send,
  Plus,
  Trash2,
  Mail,
  ThumbsUp,
  ThumbsDown,
  Lock
} from 'lucide-react';
import type { Application } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvaluationApplication {
  id: string;
  type: 'Review' | 'New Development' | 'Realignment' | 'De-Activate' | 'Replace';
  ofoCode: string;
  qualificationTitle: string;
  specialisation: string;
  qualityPartner: string;
  criterionMet: string;
  rationale: string;
}

interface AcknowledgementLetterData {
  recipientName: string;
  recipientOrganization: string;
  recipientAddress: string;
  submissionDate: string;
  skillsProgrammes: Array<{
    id: string;
    type: string;
    title: string;
    nqfLevel: number;
    credits: number;
    curriculumCode: string;
  }>;
  documentsChecklist: Array<{
    documentName: string;
    submitted: boolean;
    completed: boolean;
  }>;
  additionalNotes: string;
  senderName: string;
  senderDesignation: string;
  letterDate: string;
}

interface OutcomeLetterData {
  recipientName: string;
  recipientOrganization: string;
  recipientAddress: string;
  letterDate: string;
  senderName: string;
  senderDesignation: string;
  qualifications: Array<{
    id: string;
    qualId: string;
    qualTitle: string;
    level: string;
    credits: string;
    qap: string;
  }>;
  programmes: Array<{
    id: string;
    type: string;
    descriptor: string;
    setaChamber: string;
    sicCode: string;
  }>;
  receivedDate: string;
  iqcDate: string;
  cluster: string;
  declineQualifications: Array<{
    id: string;
    qualType: string;
    descriptor: string;
    nqfLevel: string;
    credits: string;
    curriculumCode: string;
    shortcomings: string;
  }>;
  declineRecommendedBy: string;
  declineRecommendedByDesignation: string;
  declineRecommendedDate: string;
  declineApprovedBy: string;
  declineApprovedByDesignation: string;
  declineApprovedDate: string;
  developOutcome: 'approve' | 'decline' | null;
}

interface HistoryItem {
  action: string;
  user: string;
  date: string;
  description: string;
  expandable?: boolean;
  details?: any;
}

interface EvaluationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onEvaluationComplete: (id: string, evaluationData: any, acknowledgementLetter: AcknowledgementLetterData) => void;
  onSummaryComplete: (id: string, resolution: string, resolutionFile: string | null, recommended: boolean, approvalLetter: string | null) => void;
  onApprovalLetterUpload: (id: string, file: string) => void;
  onOutcomeLetterSent?: (id: string, outcomeData: any) => void;
}

// ─── Letter type helpers ──────────────────────────────────────────────────────

type LetterType = 'acknowledgement_deactivate_replace' | 'acknowledgement_review' | 'approval_develop' | 'decline_develop' | null;

function getLetterType(qualType: string, actionType: string): LetterType {
  const qt = (qualType || '').toUpperCase().replace(/[-\s]/g, '');
  const at = (actionType || '').toUpperCase().replace(/[-\s]/g, '');
  const validQuals = ['QUALIFICATION', 'PARTQUALIFICATION', 'SKILLSPROGRAMME'];
  if (!validQuals.includes(qt)) return null;
  if (at === 'DEACTIVATE' || at === 'REPLACE') return 'acknowledgement_deactivate_replace';
  if (at === 'REVIEW') return 'acknowledgement_review';
  if (at === 'DEVELOP') return 'approval_develop';
  return null;
}

const DISCLAIMER = 'Whilst all reasonable steps are taken to ensure the accuracy and integrity of the information contained herein, the Quality Council for Trades and Occupations (QCTO) accepts no liability or responsibility whatsoever if the information is, for whatsoever reason, incorrect and QCTO reserves the right to amend any incorrect information.';

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EvaluationDetailsModal({
  isOpen,
  onClose,
  application,
  onEvaluationComplete,
  onSummaryComplete,
  onApprovalLetterUpload,
  onOutcomeLetterSent
}: EvaluationDetailsModalProps) {
  const [expandedHistoryIndex, setExpandedHistoryIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'acknowledgement' | 'outcomeLetter' | 'documents' | 'history'>('overview');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // ── Helpers to build fresh state from an application object ──────────────

  const buildEvalApps = (app: Application | null): EvaluationApplication[] => {
    const stored = (app as any)?.evaluationSummary;
    if (stored?.evaluationApplications?.length) return stored.evaluationApplications;
    return [{ id: '1', type: 'Review' as const, ofoCode: app?.ofoCode || '', qualificationTitle: app?.occupationTitle || '', specialisation: app?.specialisationTitle || '', qualityPartner: app?.qualityPartnerName || '', criterionMet: 'Criterion 4: Linked to other National Priorities', rationale: `${app?.qualityPartnerName || 'SETA'} SSP - Priority Skills` }];
  };

  const buildAckLetter = (app: Application | null): AcknowledgementLetterData => {
    const stored = (app as any)?.acknowledgementLetter;
    if (stored) return stored;
    // Derive default type label from qualification type
    const appQt = (app?.qualificationType || '').toUpperCase().replace(/[-\s]/g, '');
    const defaultItemType =
      appQt === 'QUALIFICATION' ? 'Occupational Qualification' :
      appQt === 'PARTQUALIFICATION' ? 'Part Qualification' :
      'Skills Programme';
    return {
      recipientName: app?.applicantName || '',
      recipientOrganization: app?.qualityPartnerName || '',
      recipientAddress: '',
      submissionDate: new Date().toISOString().split('T')[0],
      skillsProgrammes: [{ id: '1', type: defaultItemType, title: app?.occupationTitle || '', nqfLevel: 3, credits: 0, curriculumCode: '' }],
      documentsChecklist: [
        { documentName: 'Skills Programme Document – must include Final Integrated Supervised Assessment (FISA) standards approved by QCTO Assessment Domain', submitted: false, completed: false },
        { documentName: 'Curriculum Document', submitted: false, completed: false },
        { documentName: 'Checklist', submitted: false, completed: false }
      ],
      additionalNotes: '', senderName: '', senderDesignation: '', letterDate: new Date().toISOString().split('T')[0]
    };
  };

  const buildOutcomeLetter = (app: Application | null): OutcomeLetterData => {
    const stored = (app as any)?.outcomeLetter;
    if (stored) return stored;
    return {
      recipientName: app?.applicantName || '',
      recipientOrganization: app?.qualityPartnerName || '',
      recipientAddress: '',
      letterDate: new Date().toISOString().split('T')[0],
      senderName: '',
      senderDesignation: '',
      qualifications: [{ id: '1', qualId: app?.ofoCode || '', qualTitle: app?.occupationTitle || '', level: '', credits: '', qap: app?.qualityPartnerName || '' }],
      programmes: [{ id: '1', type: app?.qualificationType || 'Skills Programme', descriptor: app?.occupationTitle || '', setaChamber: app?.setaChamber || '', sicCode: app?.sicCode || '' }],
      receivedDate: new Date().toISOString().split('T')[0],
      iqcDate: new Date().toISOString().split('T')[0],
      cluster: '',
      declineQualifications: [{ id: '1', qualType: app?.qualificationType || 'Skills Programme', descriptor: app?.occupationTitle || '', nqfLevel: '', credits: '', curriculumCode: '', shortcomings: '' }],
      declineRecommendedBy: '', declineRecommendedByDesignation: '', declineRecommendedDate: new Date().toISOString().split('T')[0],
      declineApprovedBy: '', declineApprovedByDesignation: '', declineApprovedDate: new Date().toISOString().split('T')[0],
      developOutcome: null
    };
  };

  const qt = (application?.qualificationType || '').toUpperCase().replace(/\s/g, '');
  const at = (application?.actionType || '').toUpperCase();

  // ── State ─────────────────────────────────────────────────────────────────

  const [evalQualificationChecked, setEvalQualificationChecked] = useState(() =>
    ['QUALIFICATION', 'PART-QUALIFICATION'].includes(qt));
  const [evalSkillsProgrammeChecked, setEvalSkillsProgrammeChecked] = useState(() =>
    qt === 'SKILLSPROGRAMME');
  const [evalNewDevelopment, setEvalNewDevelopment] = useState(() => at === 'DEVELOP');
  const [evalRealignment, setEvalRealignment] = useState(false);
  const [evalReview, setEvalReview] = useState(() => at === 'REVIEW');
  const [evalDeActivate, setEvalDeActivate] = useState(() =>
    (application?.actionType || '').toUpperCase().replace(/[-\s]/g, '-') === 'DE-ACTIVATE');
  const [evalReplace, setEvalReplace] = useState(() => at === 'REPLACE');

  const [evaluationApplications, setEvaluationApplications] = useState<EvaluationApplication[]>(() => buildEvalApps(application));

  const storedEvalInit = (application as any)?.evaluationSummary;
  const [evaluationSignature, setEvaluationSignature] = useState<string>(() => storedEvalInit?.signature || '');
  const [evaluationDate, setEvaluationDate] = useState<string>(() => storedEvalInit?.date || new Date().toISOString().split('T')[0]);
  const [evaluationNotes, setEvaluationNotes] = useState<string>(() => storedEvalInit?.notes || '');
  const [evaluationRecommendation, setEvaluationRecommendation] = useState<'approve' | 'reject' | null>(() => storedEvalInit?.recommendation || null);
  const [evaluationSubmitted, setEvaluationSubmitted] = useState<boolean>(() => !!(storedEvalInit?.evaluationApplications));

  const [acknowledgementLetter, setAcknowledgementLetter] = useState<AcknowledgementLetterData>(() => buildAckLetter(application));
  const [outcomeLetter, setOutcomeLetter] = useState<OutcomeLetterData>(() => buildOutcomeLetter(application));
  const [outcomeLetterSent, setOutcomeLetterSent] = useState<boolean>(() => !!(application as any)?.outcomeLetter?.sent);

  // ── Reset ALL state when a different application is opened ────────────────
  useEffect(() => {
    const appQt = (application?.qualificationType || '').toUpperCase().replace(/\s/g, '');
    const appAt = (application?.actionType || '').toUpperCase();
    const appEval = (application as any)?.evaluationSummary;

    setExpandedHistoryIndex(null);
    setActiveTab('overview');
    setSelectedDocument(null);

    setEvalQualificationChecked(['QUALIFICATION', 'PART-QUALIFICATION'].includes(appQt));
    setEvalSkillsProgrammeChecked(appQt === 'SKILLSPROGRAMME');
    setEvalNewDevelopment(appAt === 'DEVELOP');
    setEvalRealignment(false);
    setEvalReview(appAt === 'REVIEW');
    setEvalDeActivate((application?.actionType || '').toUpperCase().replace(/[-\s]/g, '-') === 'DE-ACTIVATE');
    setEvalReplace(appAt === 'REPLACE');

    setEvaluationApplications(buildEvalApps(application));
    setEvaluationSignature(appEval?.signature || '');
    setEvaluationDate(appEval?.date || new Date().toISOString().split('T')[0]);
    setEvaluationNotes(appEval?.notes || '');
    setEvaluationRecommendation(appEval?.recommendation || null);
    setEvaluationSubmitted(!!(appEval?.evaluationApplications));

    setAcknowledgementLetter(buildAckLetter(application));
    setOutcomeLetter(buildOutcomeLetter(application));
    setOutcomeLetterSent(!!(application as any)?.outcomeLetter?.sent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id, isOpen]);

  if (!isOpen || !application) return null;

  const isEvalSummary = application.status === 'evaluation_summary';
  const storedEval = (application as any)?.evaluationSummary;
  const storedLetter = (application as any)?.acknowledgementLetter;
  const alreadyEvaluated = !!storedEval?.evaluationApplications;

  const letterType = getLetterType(application.qualificationType || '', application.actionType || '');
  const isDevelop = (application.actionType || '').toUpperCase() === 'DEVELOP';

  const formatBoolean = (value: boolean | undefined) => value === undefined ? 'Not specified' : value ? '✓ Yes' : '✗ No';

  const historyItems: HistoryItem[] = [
    { action: 'Application Submitted', user: application.applicantName || 'System', date: application.submissionDate, description: 'Application received and logged', expandable: false },
    ...(application.documentReview ? [{ action: 'Document Review Completed', user: application.documentReview.reviewedBy, date: application.documentReview.reviewDate, description: application.documentReview.notes || 'Document review completed', expandable: false }] : []),
    ...(application.resolution ? [{ action: 'Resolution Completed', user: application.resolution.reviewedBy, date: application.resolution.reviewDate, description: application.resolution.notes || 'Resolution completed', expandable: true, details: { qualificationDesign: application.resolution.qualificationDesign, draftReport: application.resolution.draftReport, applicationLetter: application.resolution.applicationLetter, motivation: application.resolution.motivation, reference: application.resolution.reference, acrLetter: application.resolution.acrLetter, completed: application.resolution.completed, notes: application.resolution.notes, source: 'resolution' as const } }] : []),
    ...((storedEval as any)?.evaluationApplications ? [{ action: 'Evaluation Summary Report Completed', user: (storedEval as any).completedBy || 'QCTO Staff', date: (storedEval as any).completedDate ? new Date((storedEval as any).completedDate).toLocaleDateString('en-ZA') : '—', description: `Recommendation: ${(storedEval as any).recommendation === 'approve' ? '✓ Approved for Committee' : '✗ Return for Amendments'}${(storedEval as any).notes ? ` — ${(storedEval as any).notes}` : ''}`, expandable: false }] : []),
    ...(storedLetter?.senderName ? [{ action: 'Acknowledgement Letter Sent', user: `${storedLetter.senderName}${storedLetter.senderDesignation ? ` (${storedLetter.senderDesignation})` : ''}`, date: storedLetter.letterDate || '—', description: `Sent to ${storedLetter.recipientName || '—'} at ${storedLetter.recipientOrganization || '—'}.`, expandable: false }] : []),
    ...((application as any)?.outcomeLetter?.sent ? [{ action: 'Outcome Letter Sent', user: (application as any).outcomeLetter.senderName || 'QCTO Staff', date: (application as any).outcomeLetter.letterDate || '—', description: `${(application as any).outcomeLetter.letterTypeLabel || 'Outcome letter'} sent to ${(application as any).outcomeLetter.recipientOrganization || '—'}`, expandable: false }] : []),
    ...(application.evaluation ? [{ action: application.evaluation.approved ? 'Evaluation Approved' : 'Evaluation Rejected', user: application.evaluation.reviewedBy, date: application.evaluation.reviewDate, description: application.evaluation.notes || 'Evaluation completed', expandable: true, details: { qualificationDesign: application.evaluation.qualificationDesign, draftReport: application.evaluation.draftReport, applicationLetter: application.evaluation.applicationLetter, motivation: application.evaluation.motivation, reference: application.evaluation.reference, acrLetter: application.evaluation.acrLetter, approved: application.evaluation.approved, checklistCompleted: application.evaluation.checklistCompleted, score: application.evaluation.score, notes: application.evaluation.notes, aiReportGenerated: application.evaluation.aiReportGenerated, source: 'evaluation' as const } }] : []),
    ...(application.evaluationSummary && !(storedEval as any)?.evaluationApplications ? [{ action: 'Evaluation Summary Submitted', user: application.evaluationSummary.approvedBy, date: application.evaluationSummary.approvalDate, description: application.evaluationSummary.resolution || 'Evaluation summary recorded', expandable: false }] : [])
  ];

  // ── Actions ────────────────────────────────────────────────────────────────

  const addEvalApp = () => setEvaluationApplications([...evaluationApplications, { id: Date.now().toString(), type: 'Review', ofoCode: '', qualificationTitle: '', specialisation: '', qualityPartner: application?.qualityPartnerName || '', criterionMet: '', rationale: '' }]);
  const removeEvalApp = (id: string) => setEvaluationApplications(evaluationApplications.filter(a => a.id !== id));
  const updateEvalApp = (id: string, field: keyof EvaluationApplication, value: string) => setEvaluationApplications(evaluationApplications.map(a => a.id === id ? { ...a, [field]: value } : a));

  const addSP = () => setAcknowledgementLetter({ ...acknowledgementLetter, skillsProgrammes: [...acknowledgementLetter.skillsProgrammes, { id: Date.now().toString(), type: 'Skills Programme', title: '', nqfLevel: 3, credits: 0, curriculumCode: '' }] });
  const removeSP = (id: string) => setAcknowledgementLetter({ ...acknowledgementLetter, skillsProgrammes: acknowledgementLetter.skillsProgrammes.filter(sp => sp.id !== id) });
  const updateSP = (id: string, field: string, value: any) => setAcknowledgementLetter({ ...acknowledgementLetter, skillsProgrammes: acknowledgementLetter.skillsProgrammes.map(sp => sp.id === id ? { ...sp, [field]: value } : sp) });
  const updateDocCL = (index: number, field: 'submitted' | 'completed', value: boolean) => { const u = [...acknowledgementLetter.documentsChecklist]; u[index] = { ...u[index], [field]: value }; setAcknowledgementLetter({ ...acknowledgementLetter, documentsChecklist: u }); };

  const handleEvalSubmit = () => { setEvaluationSubmitted(true); setActiveTab('acknowledgement'); };
  const handleAcknowledgementComplete = () => {
    onEvaluationComplete(application.id, { evaluationApplications, notes: evaluationNotes, recommendation: evaluationRecommendation, signature: evaluationSignature, date: evaluationDate, completedBy: 'Current User', completedDate: new Date().toISOString() }, acknowledgementLetter);
    onClose();
  };

  const addQual = () => setOutcomeLetter({ ...outcomeLetter, qualifications: [...outcomeLetter.qualifications, { id: Date.now().toString(), qualId: '', qualTitle: '', level: '', credits: '', qap: '' }] });
  const removeQual = (id: string) => setOutcomeLetter({ ...outcomeLetter, qualifications: outcomeLetter.qualifications.filter(q => q.id !== id) });
  const updateQual = (id: string, field: string, value: string) => setOutcomeLetter({ ...outcomeLetter, qualifications: outcomeLetter.qualifications.map(q => q.id === id ? { ...q, [field]: value } : q) });

  const addProg = () => setOutcomeLetter({ ...outcomeLetter, programmes: [...outcomeLetter.programmes, { id: Date.now().toString(), type: 'Skills Programme', descriptor: '', setaChamber: '', sicCode: '' }] });
  const removeProg = (id: string) => setOutcomeLetter({ ...outcomeLetter, programmes: outcomeLetter.programmes.filter(p => p.id !== id) });
  const updateProg = (id: string, field: string, value: string) => setOutcomeLetter({ ...outcomeLetter, programmes: outcomeLetter.programmes.map(p => p.id === id ? { ...p, [field]: value } : p) });

  const addDeclineQual = () => setOutcomeLetter({ ...outcomeLetter, declineQualifications: [...outcomeLetter.declineQualifications, { id: Date.now().toString(), qualType: '', descriptor: '', nqfLevel: '', credits: '', curriculumCode: '', shortcomings: '' }] });
  const removeDeclineQual = (id: string) => setOutcomeLetter({ ...outcomeLetter, declineQualifications: outcomeLetter.declineQualifications.filter(q => q.id !== id) });
  const updateDeclineQual = (id: string, field: string, value: string) => setOutcomeLetter({ ...outcomeLetter, declineQualifications: outcomeLetter.declineQualifications.map(q => q.id === id ? { ...q, [field]: value } : q) });

  const handleSendOutcomeLetter = () => {
    const typeLabel = letterType === 'acknowledgement_review' ? 'Acknowledgement of Receipt (Review)' : letterType === 'acknowledgement_deactivate_replace' ? 'Acknowledgement of Receipt (De-Activate/Replace)' : outcomeLetter.developOutcome === 'approve' ? 'Approval Letter' : 'Decline Letter';
    if (onOutcomeLetterSent) {
      onOutcomeLetterSent(application.id, { ...outcomeLetter, sent: true, sentDate: new Date().toISOString(), letterTypeLabel: typeLabel });
    }
    setOutcomeLetterSent(true);
  };

  // ── Shared field component ─────────────────────────────────────────────────

  const Field = ({ label, value }: { label: string; value: string }) => (
    <div><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{value || 'Not specified'}</p></div>
  );

  // ── QCTO Letterhead ────────────────────────────────────────────────────────

  const Letterhead = () => (
    <div className="text-center border-b pb-5">
      <div className="inline-flex items-center gap-2 mb-2"><div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">QCTO</div><span className="text-sm font-semibold text-gray-700">Quality Council for Trades and Occupations</span></div>
      <div className="text-xs text-gray-500 space-y-0.5"><div>256 Glyn Street, Hatfield, Pretoria, 0083</div><div>Private Bag X278, Pretoria, 0001</div><div>+27 12 003 1800 | www.qcto.org.za</div></div>
      <div className="mt-2 text-xs text-gray-500">Enquiries: <span className="text-blue-600">qualifications@qcto.org.za</span> | Tel: 012 003 0103</div>
    </div>
  );

  const DisclaimerBox = () => (
    <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-500 leading-relaxed">{DISCLAIMER}</div>
  );

  const RecipientFields = ({ data, setData }: { data: OutcomeLetterData; setData: (d: OutcomeLetterData) => void }) => (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Recipient Details</h4>
      <input type="text" value={data.recipientName} onChange={e => setData({ ...data, recipientName: e.target.value })} placeholder="Recipient Name (e.g. Ms Sandy Ndlovu)" className="w-full border rounded-lg px-3 py-2 text-sm" />
      <input type="text" value={data.recipientOrganization} onChange={e => setData({ ...data, recipientOrganization: e.target.value })} placeholder="Organization (e.g. TETA)" className="w-full border rounded-lg px-3 py-2 text-sm" />
      <textarea value={data.recipientAddress} onChange={e => setData({ ...data, recipientAddress: e.target.value })} placeholder="Full postal address" rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" />
    </div>
  );

  const SenderFields = ({ data, setData }: { data: OutcomeLetterData; setData: (d: OutcomeLetterData) => void }) => (
    <div className="border-t pt-4">
      <p className="text-sm text-gray-700 mb-3">Yours sincerely,</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Sender Name</label><input type="text" value={data.senderName} onChange={e => setData({ ...data, senderName: e.target.value })} placeholder="e.g. Ms Sibulele Gungqisa" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label><input type="text" value={data.senderDesignation} onChange={e => setData({ ...data, senderDesignation: e.target.value })} placeholder="e.g. Senior Administrative Officer" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
        <div><label className="block text-sm font-semibold text-gray-700 mb-1">Date</label><input type="date" value={data.letterDate} onChange={e => setData({ ...data, letterDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
      </div>
      {data.senderName && <div className="mt-3 text-sm text-gray-700"><p className="font-semibold">{data.senderName}</p><p className="text-gray-500">{data.senderDesignation}</p><p className="text-gray-500">Date: {data.letterDate}</p></div>}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // ── Tab renderers ─────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-800"><Target className="w-5 h-5" />SECTION A: TYPE OF DEVELOPMENT REQUESTED</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Qualification Type" value={application.qualificationType || ''} /><Field label="Action Type" value={application.actionType || ''} /></div></div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-800"><Briefcase className="w-5 h-5" />SECTION B1: OCCUPATION DETAILS</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Occupation Title" value={application.occupationTitle || ''} /><Field label="OFO Code" value={application.ofoCode || ''} /><Field label="Specialisation Title" value={application.specialisationTitle || ''} /><Field label="SETA Chamber" value={application.setaChamber || ''} /><Field label="SIC Code" value={application.sicCode || ''} /></div></div>
      {(application.existingQualId || application.existingQualTitle) && (<div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-800"><BookOpen className="w-5 h-5" />SECTION B2: EXISTING QUALIFICATION AFFECTED</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Qualification ID" value={application.existingQualId || ''} /><Field label="Qualification Title" value={application.existingQualTitle || ''} /><Field label="NQF Level" value={application.existingQualLevel || ''} /><Field label="Credits" value={application.existingQualCredits || ''} /><div className="md:col-span-2"><Field label="Quality Partner (QP)" value={application.existingQualQP || ''} /></div></div></div>)}
      {(application.learnershipRegNo || application.learnershipTitle) && (<div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-800"><Award className="w-5 h-5" />SECTION B3: LEARNERSHIP DETAILS</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Field label="Learnership Registration Number" value={application.learnershipRegNo || ''} /><Field label="Learnership Title" value={application.learnershipTitle || ''} /><Field label="NQF Level" value={application.learnershipNqfLevel || ''} /></div></div>)}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-800"><FileCheck className="w-5 h-5" />SECTION B4: POLICY & PRIORITY ALIGNMENTS</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{[['ERRP', application.errp], ['National Development Plan', application.ndp], ['New Growth Path', application.ngp], ['Industrial Policy Action Plan', application.ipap], ['Strategic Infrastructure Projects', application.sips], ['N4-N6 Reconfiguration', application.n4n6Reconfig], ['DHET Scarce Skills List', application.scarceSkills], ['Legacy OQSF Qualifications', application.legacyOqsf], ['Other Priorities', application.otherPriority]].map(([label, val]) => (<div key={label as string} className="bg-white px-3 py-2 rounded border text-sm"><span className="font-medium">{label}:</span> {formatBoolean(val as boolean | undefined)}</div>))}</div></div>
      {application.rationale && (<div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-800"><MessageSquare className="w-5 h-5" />SECTION B5: RATIONALE</h3><div className="bg-white px-4 py-3 rounded border"><p className="text-sm whitespace-pre-wrap">{application.rationale}</p></div></div>)}
      {application.regulatoryBodies && (<div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-800"><Building2 className="w-5 h-5" />SECTION B6: REGULATORY BODIES & STAKEHOLDERS</h3><div className="bg-white px-4 py-3 rounded border"><p className="text-sm whitespace-pre-wrap">{application.regulatoryBodies}</p></div></div>)}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-800"><User className="w-5 h-5" />SECTION C: QUALITY PARTNER & APPLICANT DETAILS</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="md:col-span-2"><Field label="Quality Partner Name" value={application.qualityPartnerName || ''} /></div><Field label="Applicant Name" value={application.applicantName || ''} /><Field label="Designation" value={application.applicantDesignation || ''} /><Field label="Email Address" value={application.applicantEmail || ''} /><Field label="Date" value={application.applicationDate || ''} /><div className="md:col-span-2"><Field label="Signature" value={application.applicantSignature || ''} /></div></div></div>
    </div>
  );

  const renderChecklistTab = () => {
    const ro = isEvalSummary;
    return (
      <div className="space-y-6">
        {ro && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div><p className="font-semibold text-amber-800 text-sm">Evaluation Checklist — Read Only</p><p className="text-xs text-amber-700 mt-0.5">This application has moved to Evaluation Summary. All fields are locked.</p></div>
          </div>
        )}
        <div className={`bg-white rounded-lg border-2 border-purple-200 overflow-hidden ${ro ? 'opacity-80 pointer-events-none' : ''}`}>
          <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
            <h3 className="font-semibold text-purple-800 flex items-center gap-2"><FileCheck2 className="w-5 h-5" />EVALUATION OF APPLICATION SUMMARY REPORTING DOCUMENT</h3>
            <p className="text-sm text-gray-600 mt-1">FOR EVALUATION OF APPLICATIONS TO DEVELOP OCCUPATIONAL QUALIFICATIONS AND PART-QUALIFICATIONS AND SKILLS PROGRAMMES</p>
            <p className="text-xs text-gray-500 mt-1">TO BE COMPLETED BY THE CLUSTER QUALIFICATION DEVELOPMENT MANAGERS</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1 underline tracking-wide">SECTION A: TYPE OF APPLICATIONS REQUESTED</h4>
              <p className="text-xs text-gray-500 mb-3">Tick the applicable box</p>
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Qualification Type</p>
                <div className="flex flex-wrap gap-3">
                  {[{ label: 'QUALIFICATION', state: evalQualificationChecked, set: setEvalQualificationChecked }, { label: 'SKILLS PROGRAMME', state: evalSkillsProgrammeChecked, set: setEvalSkillsProgrammeChecked }].map(({ label, state, set }) => (<label key={label} className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${state ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}><input type="checkbox" checked={state} onChange={e => set(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" /><span className="text-sm font-medium">{label}</span></label>))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Action Type</p>
                <div className="flex flex-wrap gap-3">
                  {[{ label: 'NEW DEVELOPMENT', state: evalNewDevelopment, set: setEvalNewDevelopment }, { label: 'REALIGNMENT', state: evalRealignment, set: setEvalRealignment }, { label: 'REVIEW', state: evalReview, set: setEvalReview }, { label: 'DE-ACTIVATE', state: evalDeActivate, set: setEvalDeActivate }, { label: 'REPLACE', state: evalReplace, set: setEvalReplace }].map(({ label, state, set }) => (<label key={label} className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${state ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}><input type="checkbox" checked={state} onChange={e => set(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" /><span className="text-sm font-medium">{label}</span></label>))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-3">All applications presented herewith were evaluated against the below approved prioritisation guideline criterion.</p>
              <h4 className="font-semibold text-gray-800 mb-3 underline tracking-wide">PRIORITISATION GUIDELINE CRITERION</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">{[{ n: 1, label: 'Occupations in High Demand List (OIHDL) as published by DHET' }, { n: 2, label: 'Historical Registered Qualification (HRQ) with enrolled learners' }, { n: 3, label: 'Occupational Qualifications for listed Trades as registered by DHET' }, { n: 4, label: 'Linked to other National Priorities (e.g. National Development Plan, SSP, New Growth Plan, Industrial Policy Action Plan, ERRP)' }].map(({ n, label }) => (<div key={n} className="bg-gray-50 p-3 rounded border"><span className="font-semibold">Criterion {n}:</span> {label}</div>))}</div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 underline tracking-wide">SECTION B: APPLICATION DETAILS</h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left border font-medium">TYPE</th><th className="px-3 py-2 text-left border font-medium">OFO Code</th><th className="px-3 py-2 text-left border font-medium">Qualification Title</th><th className="px-3 py-2 text-left border font-medium">Specialisation(s)</th><th className="px-3 py-2 text-left border font-medium">Quality Partner</th><th className="px-3 py-2 text-left border font-medium">Criteria Met & Rationale</th><th className="px-3 py-2 text-center border font-medium">Actions</th></tr></thead>
                  <tbody>{evaluationApplications.map((app) => (<tr key={app.id} className="border-t hover:bg-gray-50"><td className="px-3 py-2 border"><select value={app.type} onChange={e => updateEvalApp(app.id, 'type', e.target.value)} className="w-full border rounded px-2 py-1 text-sm"><option value="Review">Review</option><option value="New Development">New Development</option><option value="Realignment">Realignment</option><option value="De-Activate">De-Activate</option><option value="Replace">Replace</option></select></td><td className="px-3 py-2 border"><input type="text" value={app.ofoCode} onChange={e => updateEvalApp(app.id, 'ofoCode', e.target.value)} placeholder="OFO Code" className="w-full border rounded px-2 py-1 text-sm" /></td><td className="px-3 py-2 border"><input type="text" value={app.qualificationTitle} onChange={e => updateEvalApp(app.id, 'qualificationTitle', e.target.value)} placeholder="Qualification Title" className="w-full border rounded px-2 py-1 text-sm" /></td><td className="px-3 py-2 border"><input type="text" value={app.specialisation} onChange={e => updateEvalApp(app.id, 'specialisation', e.target.value)} placeholder="Specialisation(s)" className="w-full border rounded px-2 py-1 text-sm" /></td><td className="px-3 py-2 border"><input type="text" value={app.qualityPartner} onChange={e => updateEvalApp(app.id, 'qualityPartner', e.target.value)} placeholder="Quality Partner" className="w-full border rounded px-2 py-1 text-sm" /></td><td className="px-3 py-2 border"><div className="space-y-1"><select value={app.criterionMet} onChange={e => updateEvalApp(app.id, 'criterionMet', e.target.value)} className="w-full border rounded px-2 py-1 text-sm"><option value="">Select Criterion</option><option value="Criterion 1: OIHDL">Criterion 1: OIHDL</option><option value="Criterion 2: HRQ with enrolled learners">Criterion 2: HRQ with enrolled learners</option><option value="Criterion 3: Listed Trades">Criterion 3: Listed Trades</option><option value="Criterion 4: National Priorities">Criterion 4: National Priorities</option></select><textarea value={app.rationale} onChange={e => updateEvalApp(app.id, 'rationale', e.target.value)} placeholder="Rationale" rows={2} className="w-full border rounded px-2 py-1 text-sm" /></div></td><td className="px-3 py-2 text-center border"><button onClick={() => removeEvalApp(app.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody>
                </table>
              </div>
              <button onClick={addEvalApp} className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"><Plus className="w-4 h-4" />Add Application Row</button>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4"><p className="text-sm text-gray-800 italic font-medium">I recommend the application(s) to be tabled for committee's approval.</p></div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Recommendation</label>
              <div className="flex flex-wrap gap-4">
                <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${evaluationRecommendation === 'approve' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'}`}><input type="radio" name="eval-recommendation" value="approve" checked={evaluationRecommendation === 'approve'} onChange={() => setEvaluationRecommendation('approve')} className="w-4 h-4" /><span className="text-green-700 font-medium">✓ Approve – Recommend for Committee Approval</span></label>
                <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${evaluationRecommendation === 'reject' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-50'}`}><input type="radio" name="eval-recommendation" value="reject" checked={evaluationRecommendation === 'reject'} onChange={() => setEvaluationRecommendation('reject')} className="w-4 h-4" /><span className="text-red-700 font-medium">✗ Reject – Return for Amendments</span></label>
              </div>
            </div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1">Evaluation Notes / Comments</label><textarea value={evaluationNotes} onChange={e => setEvaluationNotes(e.target.value)} rows={4} className="w-full border rounded-lg p-3 text-sm" placeholder="Add evaluation notes..." /></div>
            <div className="border-t pt-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-gray-700 mb-1">Signature</label><input type="text" value={evaluationSignature} onChange={e => setEvaluationSignature(e.target.value)} placeholder="Type your name as signature" className="w-full border rounded-lg px-3 py-2 text-sm" /><p className="text-xs text-gray-400 mt-1">……………………………</p></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">Date</label><input type="date" value={evaluationDate} onChange={e => setEvaluationDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div></div></div>
            {!ro && (
              <>
                <div className="flex justify-end pt-2"><button onClick={handleEvalSubmit} disabled={!evaluationRecommendation || !evaluationSignature} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${evaluationRecommendation && evaluationSignature ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}><Send className="w-4 h-4" />Proceed to Acknowledgement Letter</button></div>
                {(!evaluationRecommendation || !evaluationSignature) && <p className="text-xs text-gray-400 text-right -mt-2">Signature and Recommendation required to proceed.</p>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Acknowledgement Letter Tab ─────────────────────────────────────────────
  // The letter title, subject line, body text, table heading, column header, and
  // add-button all adapt based on the application's qualificationType.

  const renderAcknowledgementTab = () => {
    const ro = isEvalSummary;

    // ── Derive the correct terminology from qualification type ──
    const qt2 = (application?.qualificationType || '').toUpperCase().replace(/[-\s]/g, '');
    const ackTypeLabel =
      qt2 === 'QUALIFICATION' ? 'Qualification' :
      qt2 === 'PARTQUALIFICATION' ? 'Part Qualification' :
      'Skills Programme'; // default for SKILLSPROGRAMME or unknown
    const ackTypeLabelPlural = `${ackTypeLabel}s`;
    const ackTypeLabelUpper = ackTypeLabelPlural.toUpperCase();
    const ackTypeLabelLower = ackTypeLabel.toLowerCase();

    if (!evaluationSubmitted && !ro) {
      return (
        <div className="text-center py-16 text-gray-400">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Complete the Evaluation Checklist first</p>
          <button onClick={() => setActiveTab('checklist')} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Go to Evaluation Checklist</button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {ro && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <div><p className="font-semibold text-amber-800 text-sm">Acknowledgement Letter — Read Only</p><p className="text-xs text-amber-700 mt-0.5">This application has moved to Evaluation Summary. All fields are locked.</p></div>
          </div>
        )}
        <div className={`bg-white rounded-lg border-2 border-green-200 overflow-hidden ${ro ? 'opacity-80 pointer-events-none' : ''}`}>
          {/* ── Header — uses ackTypeLabel ── */}
          <div className="bg-green-50 px-6 py-4 border-b border-green-200">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              ACKNOWLEDGMENT OF RECEIPT: {ackTypeLabelUpper} RECEIVED FOR EVALUATION
            </h3>
            <p className="text-xs text-gray-500 mt-1">Complete and send the acknowledgement letter to the Quality Partner.</p>
          </div>
          <div className="p-6 space-y-6">
            <Letterhead />
            <DisclaimerBox />
            {/* Recipient */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Recipient Details</h4>
              <input type="text" value={acknowledgementLetter.recipientName} onChange={e => setAcknowledgementLetter({ ...acknowledgementLetter, recipientName: e.target.value })} placeholder="Recipient Name" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="text" value={acknowledgementLetter.recipientOrganization} onChange={e => setAcknowledgementLetter({ ...acknowledgementLetter, recipientOrganization: e.target.value })} placeholder="Organization" className="w-full border rounded-lg px-3 py-2 text-sm" />
              <textarea value={acknowledgementLetter.recipientAddress} onChange={e => setAcknowledgementLetter({ ...acknowledgementLetter, recipientAddress: e.target.value })} placeholder="Full postal address" rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            {/* Letter body preview */}
            <div className="border rounded-lg p-4 bg-gray-50 text-sm space-y-3">
              <p>Dear <strong>{acknowledgementLetter.recipientName || '[Recipient Name]'}</strong>,</p>
              {/* ── Subject line — uses ackTypeLabel ── */}
              <p className="font-semibold underline uppercase">
                ACKNOWLEDGMENT OF RECEIPT: {ackTypeLabelUpper} RECEIVED FOR EVALUATION
              </p>
              {/* ── Body text — uses ackTypeLabel ── */}
              <p>
                The Quality Council for Trades and Occupation (QCTO) acknowledges receipt of{' '}
                <strong>{acknowledgementLetter.skillsProgrammes.length}</strong> {ackTypeLabelLower}(s) received on the{' '}
                <input
                  type="date"
                  value={acknowledgementLetter.submissionDate}
                  onChange={e => setAcknowledgementLetter({ ...acknowledgementLetter, submissionDate: e.target.value })}
                  className="inline-block border rounded px-2 py-0.5 text-sm bg-white"
                />{' '}
                for evaluation, as follows:
              </p>
            </div>
            {/* ── Table section heading — uses ackTypeLabel ── */}
            <div>
              <h4 className="font-semibold text-gray-700 text-sm mb-2">{ackTypeLabelPlural}</h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 border text-left font-medium">No.</th>
                      <th className="px-3 py-2 border text-left font-medium">Type</th>
                      {/* ── Column header — uses ackTypeLabel ── */}
                      <th className="px-3 py-2 border text-left font-medium">{ackTypeLabel} Descriptor</th>
                      <th className="px-3 py-2 border text-left font-medium">NQF Level</th>
                      <th className="px-3 py-2 border text-left font-medium">Credits</th>
                      <th className="px-3 py-2 border text-left font-medium">Curriculum Code</th>
                      <th className="px-3 py-2 border text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acknowledgementLetter.skillsProgrammes.map((sp, idx) => (
                      <tr key={sp.id} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 border text-center font-medium">{idx + 1}.</td>
                        <td className="px-3 py-2 border">
                          <select value={sp.type} onChange={e => updateSP(sp.id, 'type', e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
                            <option value="Skills Programme">Skills Programme</option>
                            <option value="Occupational Qualification">Occupational Qualification</option>
                            <option value="Part Qualification">Part Qualification</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 border"><input type="text" value={sp.title} onChange={e => updateSP(sp.id, 'title', e.target.value)} placeholder="e.g. Handgun handler for private use" className="w-full border rounded px-2 py-1 text-sm" /></td>
                        <td className="px-3 py-2 border"><input type="number" value={sp.nqfLevel} min={1} max={10} onChange={e => updateSP(sp.id, 'nqfLevel', parseInt(e.target.value))} className="w-16 border rounded px-2 py-1 text-sm" /></td>
                        <td className="px-3 py-2 border"><input type="number" value={sp.credits} min={0} onChange={e => updateSP(sp.id, 'credits', parseInt(e.target.value))} className="w-20 border rounded px-2 py-1 text-sm" /></td>
                        <td className="px-3 py-2 border"><input type="text" value={sp.curriculumCode} onChange={e => updateSP(sp.id, 'curriculumCode', e.target.value)} placeholder="e.g. 900613-000-00-00" className="w-36 border rounded px-2 py-1 text-sm" /></td>
                        <td className="px-3 py-2 border text-center"><button onClick={() => removeSP(sp.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* ── Add button — uses ackTypeLabel ── */}
              <button onClick={addSP} className="mt-2 flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700">
                <Plus className="w-4 h-4" />Add {ackTypeLabel}
              </button>
            </div>
            {/* Documents checklist */}
            <div>
              <p className="text-sm mb-3">The following documents in relation to the above-mentioned {ackTypeLabelLower}(s) were received:</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left font-medium">No.</th><th className="px-3 py-2 border text-left font-medium">Document Name</th><th className="px-3 py-2 border text-center font-medium">Submitted</th><th className="px-3 py-2 border text-center font-medium">Documents Completed</th></tr></thead>
                  <tbody>
                    {acknowledgementLetter.documentsChecklist.map((doc, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2 border text-center font-medium">{idx + 1}.</td>
                        <td className="px-3 py-2 border text-sm">{doc.documentName}</td>
                        <td className="px-3 py-2 border text-center"><input type="checkbox" checked={doc.submitted} onChange={e => updateDocCL(idx, 'submitted', e.target.checked)} className="w-4 h-4 text-purple-600 rounded" /></td>
                        <td className="px-3 py-2 border"><div className="flex justify-center gap-4"><label className="flex items-center gap-1 text-xs"><input type="radio" name={`docCompleted-eval-${idx}`} checked={doc.completed === true} onChange={() => updateDocCL(idx, 'completed', true)} className="w-3 h-3" />Yes</label><label className="flex items-center gap-1 text-xs"><input type="radio" name={`docCompleted-eval-${idx}`} checked={doc.completed === false} onChange={() => updateDocCL(idx, 'completed', false)} className="w-3 h-3" />No</label></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Notice box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700 space-y-2">
              <p>Please be advised that the FISA standards require approval by the QCTO Assessment Domain. The Quality Partner is to ensure this is in place.</p>
              <p>Thereafter, all {ackTypeLabelLower}(s) received require evaluation and moderation by the QCTO and are presented to the Internal Qualifications Committee (IQC) for approval.</p>
              <p>These {ackTypeLabelLower}(s) will be subjected to the above-mentioned process and the outcome will be made available within <strong>10 working days</strong> after the IQC.</p>
              <p>For queries regarding this submission, kindly contact the Qualifications Development Domain office, Tel <strong>012 003 0103</strong>, email address: <span className="text-blue-600">qualifications@qcto.org.za</span></p>
            </div>
            {/* Additional notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Notes / Instructions (Optional)</label>
              <textarea value={acknowledgementLetter.additionalNotes} onChange={e => setAcknowledgementLetter({ ...acknowledgementLetter, additionalNotes: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Add any additional notes..." />
            </div>
            {/* Sender */}
            <div className="border-t pt-4">
              <p className="text-sm text-gray-700 mb-3">Regards,</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Sender Name</label><input type="text" value={acknowledgementLetter.senderName} onChange={e => setAcknowledgementLetter({ ...acknowledgementLetter, senderName: e.target.value })} placeholder="e.g. Ms. Carmen Hoffman" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label><input type="text" value={acknowledgementLetter.senderDesignation} onChange={e => setAcknowledgementLetter({ ...acknowledgementLetter, senderDesignation: e.target.value })} placeholder="e.g. Deputy Director: Qualifications Development" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Date</label><input type="date" value={acknowledgementLetter.letterDate} onChange={e => setAcknowledgementLetter({ ...acknowledgementLetter, letterDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
              {acknowledgementLetter.senderName && <div className="mt-3 text-sm text-gray-700"><p className="font-semibold">{acknowledgementLetter.senderName}</p><p className="text-gray-500">{acknowledgementLetter.senderDesignation}</p><p className="text-gray-500">Date: {acknowledgementLetter.letterDate}</p></div>}
            </div>
            {!ro && (
              <>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button onClick={() => setActiveTab('checklist')} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">← Back to Evaluation</button>
                  <button onClick={handleAcknowledgementComplete} disabled={!acknowledgementLetter.senderName || !acknowledgementLetter.recipientName} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${acknowledgementLetter.senderName && acknowledgementLetter.recipientName ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}><Send className="w-4 h-4" />Complete Evaluation & Send Letter</button>
                </div>
                {(!acknowledgementLetter.senderName || !acknowledgementLetter.recipientName) && <p className="text-xs text-gray-400 text-right -mt-2">Sender Name and Recipient Name are required.</p>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Outcome Letter Tab ─────────────────────────────────────────────────────

  const renderOutcomeLetterTab = () => {
    if (!letterType) {
      return <div className="text-center py-16 text-gray-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>No outcome letter is required for this qualification type and action type combination.</p></div>;
    }

    const sentBanner = outcomeLetterSent ? (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 mb-4">
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
        <div><p className="font-semibold text-green-800 text-sm">Outcome Letter Sent</p><p className="text-xs text-green-700 mt-0.5">The outcome letter has been recorded.</p></div>
      </div>
    ) : null;

    const sendBtn = !outcomeLetterSent ? (
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button onClick={handleSendOutcomeLetter} disabled={!outcomeLetter.senderName || !outcomeLetter.recipientName} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${outcomeLetter.senderName && outcomeLetter.recipientName ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}><Send className="w-4 h-4" />Send Outcome Letter</button>
      </div>
    ) : null;

    if (letterType === 'acknowledgement_deactivate_replace') {
      return (
        <div className="space-y-6">
          {sentBanner}
          <div className={`bg-white rounded-lg border-2 border-blue-200 overflow-hidden ${outcomeLetterSent ? 'opacity-75' : ''}`}>
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200"><h3 className="font-semibold text-blue-800 flex items-center gap-2"><Mail className="w-5 h-5" />ACKNOWLEDGEMENT OF RECEIPT: SKILLS PROGRAMME APPLICATION(S)</h3><p className="text-xs text-gray-500 mt-1">Acknowledgement letter for De-Activate / Replace applications</p></div>
            <div className="p-6 space-y-6">
              <Letterhead /><DisclaimerBox />
              <RecipientFields data={outcomeLetter} setData={setOutcomeLetter} />
              <div className="border rounded-lg p-4 bg-gray-50 text-sm space-y-3">
                <p>Dear <strong>{outcomeLetter.recipientName || '[Recipient Name]'}</strong></p>
                <p className="font-semibold uppercase">ACKNOWLEDGEMENT OF RECEIPT: SKILLS PROGRAMME APPLICATION(S)</p>
                <p>1. The Quality Council for Trades and Occupations (QCTO) acknowledged the receipt of the skills programme application(s) received on <input type="date" value={outcomeLetter.receivedDate} onChange={e => setOutcomeLetter({ ...outcomeLetter, receivedDate: e.target.value })} disabled={outcomeLetterSent} className="inline-block border rounded px-2 py-0.5 text-sm bg-white" />. The details of the skills programmes are as follows:</p>
              </div>
              <div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left font-medium">No.</th><th className="px-3 py-2 border text-left font-medium">Type</th><th className="px-3 py-2 border text-left font-medium">Skills Programme Descriptor(s)</th><th className="px-3 py-2 border text-left font-medium">SETA Chamber</th><th className="px-3 py-2 border text-left font-medium">SIC Code</th>{!outcomeLetterSent && <th className="px-3 py-2 border text-center font-medium">Actions</th>}</tr></thead>
                    <tbody>{outcomeLetter.programmes.map((p, idx) => (<tr key={p.id} className="border-t hover:bg-gray-50"><td className="px-3 py-2 border text-center font-medium">{idx + 1}.</td><td className="px-3 py-2 border">{outcomeLetterSent ? p.type : <select value={p.type} onChange={e => updateProg(p.id, 'type', e.target.value)} className="w-full border rounded px-2 py-1 text-sm"><option>Skills Programme</option><option>Occupational Qualification</option><option>Part Qualification</option></select>}</td><td className="px-3 py-2 border">{outcomeLetterSent ? p.descriptor : <input type="text" value={p.descriptor} onChange={e => updateProg(p.id, 'descriptor', e.target.value)} placeholder="Descriptor" className="w-full border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? p.setaChamber : <input type="text" value={p.setaChamber} onChange={e => updateProg(p.id, 'setaChamber', e.target.value)} placeholder="SETA Chamber" className="w-full border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? p.sicCode : <input type="text" value={p.sicCode} onChange={e => updateProg(p.id, 'sicCode', e.target.value)} placeholder="SIC Code" className="w-full border rounded px-2 py-1 text-sm" />}</td>{!outcomeLetterSent && <td className="px-3 py-2 border text-center"><button onClick={() => removeProg(p.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td>}</tr>))}</tbody>
                  </table>
                </div>
                {!outcomeLetterSent && <button onClick={addProg} className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"><Plus className="w-4 h-4" />Add Programme</button>}
              </div>
              <div className="bg-gray-50 border rounded-lg p-4 text-sm space-y-2">
                <p>2. All skills programme applications received on set intervals require to be evaluated and moderated by the QCTO and presented to Monthly Internal Qualifications Committee for approval.</p>
                <p>3. Please take note that your skills programme will be subjected to the abovementioned process and the outcome will be made available within 10 working days after the committee.</p>
                <p>4. For queries regarding this submission, kindly contact the Central Office: Qualifications Development, Tel 012 003 0103, email address: <span className="text-blue-600">qualifications@qcto.org.za</span>.</p>
              </div>
              <SenderFields data={outcomeLetter} setData={outcomeLetterSent ? () => {} : setOutcomeLetter} />
              {sendBtn}
            </div>
          </div>
        </div>
      );
    }

    if (letterType === 'acknowledgement_review') {
      return (
        <div className="space-y-6">
          {sentBanner}
          <div className={`bg-white rounded-lg border-2 border-indigo-200 overflow-hidden ${outcomeLetterSent ? 'opacity-75' : ''}`}>
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-200"><h3 className="font-semibold text-indigo-800 flex items-center gap-2"><FileCheck2 className="w-5 h-5" />ACKNOWLEDGEMENT OF RECEIPT: APPLICATIONS TO REVIEW REGISTERED OCCUPATIONAL QUALIFICATION(S)</h3></div>
            <div className="p-6 space-y-6">
              <Letterhead /><DisclaimerBox />
              <RecipientFields data={outcomeLetter} setData={outcomeLetterSent ? () => {} : setOutcomeLetter} />
              <div className="border rounded-lg p-4 bg-gray-50 text-sm space-y-3">
                <p>Dear <strong>{outcomeLetter.recipientName || '[Recipient Name]'}</strong></p>
                <p className="font-semibold uppercase">ACKNOWLEDGEMENT OF RECEIPT: APPLICATIONS TO REVIEW REGISTERED OCCUPATIONAL QUALIFICATION(S)</p>
                <p>Your applications requested to review the following registered occupational qualification(s) refers:</p>
              </div>
              <div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left font-medium">Qualification ID</th><th className="px-3 py-2 border text-left font-medium">Qualification Title</th><th className="px-3 py-2 border text-left font-medium">Level</th><th className="px-3 py-2 border text-left font-medium">Credits</th><th className="px-3 py-2 border text-left font-medium">QAP</th>{!outcomeLetterSent && <th className="px-3 py-2 border text-center font-medium">Actions</th>}</tr></thead>
                    <tbody>{outcomeLetter.qualifications.map((q) => (<tr key={q.id} className="border-t hover:bg-gray-50"><td className="px-3 py-2 border">{outcomeLetterSent ? q.qualId : <input type="text" value={q.qualId} onChange={e => updateQual(q.id, 'qualId', e.target.value)} placeholder="e.g. 94202" className="w-24 border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.qualTitle : <input type="text" value={q.qualTitle} onChange={e => updateQual(q.id, 'qualTitle', e.target.value)} placeholder="Qualification Title" className="w-full border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.level : <input type="text" value={q.level} onChange={e => updateQual(q.id, 'level', e.target.value)} placeholder="e.g. 3" className="w-16 border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.credits : <input type="text" value={q.credits} onChange={e => updateQual(q.id, 'credits', e.target.value)} placeholder="e.g. 120" className="w-20 border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.qap : <input type="text" value={q.qap} onChange={e => updateQual(q.id, 'qap', e.target.value)} placeholder="e.g. TETA" className="w-24 border rounded px-2 py-1 text-sm" />}</td>{!outcomeLetterSent && <td className="px-3 py-2 border text-center"><button onClick={() => removeQual(q.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td>}</tr>))}</tbody>
                  </table>
                </div>
                {!outcomeLetterSent && <button onClick={addQual} className="mt-2 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"><Plus className="w-4 h-4" />Add Qualification</button>}
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 text-sm space-y-2">
                <p>These applications were received on <input type="date" value={outcomeLetter.receivedDate} onChange={e => setOutcomeLetter({ ...outcomeLetter, receivedDate: e.target.value })} disabled={outcomeLetterSent} className="inline-block border rounded px-2 py-0.5 text-sm bg-white" />.</p>
                <p>Please be informed that your submissions are receiving attention. All applications received on set intervals require to be evaluated and approved by the QCTO Occupational Qualifications Committee. Please take note that your application will be subjected to the abovementioned process and the outcome will be made available after the committee.</p>
                <p>The review of the qualifications may only commence once the applications have received approval letter from the QCTO.</p>
                <p>Kindly contact the central office for any enquires, email: <span className="text-blue-600">qualifications@qcto.org.za</span></p>
              </div>
              <SenderFields data={outcomeLetter} setData={outcomeLetterSent ? () => {} : setOutcomeLetter} />
              {sendBtn}
            </div>
          </div>
        </div>
      );
    }

    if (letterType === 'approval_develop') {
      return (
        <div className="space-y-6">
          {sentBanner}
          {!outcomeLetterSent && (
            <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
              <h4 className="font-semibold text-gray-700 mb-3">Select Outcome for this Application</h4>
              <div className="flex flex-wrap gap-4">
                <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${outcomeLetter.developOutcome === 'approve' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                  <input type="radio" name="develop-outcome" value="approve" checked={outcomeLetter.developOutcome === 'approve'} onChange={() => setOutcomeLetter({ ...outcomeLetter, developOutcome: 'approve' })} className="w-4 h-4" />
                  <ThumbsUp className="w-4 h-4 text-green-600" /><span className="text-green-700 font-medium">Approve — Send Approval Letter</span>
                </label>
                <label className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${outcomeLetter.developOutcome === 'decline' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'}`}>
                  <input type="radio" name="develop-outcome" value="decline" checked={outcomeLetter.developOutcome === 'decline'} onChange={() => setOutcomeLetter({ ...outcomeLetter, developOutcome: 'decline' })} className="w-4 h-4" />
                  <ThumbsDown className="w-4 h-4 text-red-600" /><span className="text-red-700 font-medium">Decline — Send Decline Letter</span>
                </label>
              </div>
            </div>
          )}

          {(outcomeLetter.developOutcome === 'approve' || (outcomeLetterSent && (application as any)?.outcomeLetter?.developOutcome === 'approve')) && (
            <div className={`bg-white rounded-lg border-2 border-green-200 overflow-hidden ${outcomeLetterSent ? 'opacity-75' : ''}`}>
              <div className="bg-green-50 px-6 py-4 border-b border-green-200"><h3 className="font-semibold text-green-800 flex items-center gap-2"><CheckCircle className="w-5 h-5" />APPROVAL LETTER: QUALIFICATIONS DEVELOPMENT APPLICATIONS</h3></div>
              <div className="p-6 space-y-6">
                <Letterhead /><DisclaimerBox />
                <RecipientFields data={outcomeLetter} setData={outcomeLetterSent ? () => {} : setOutcomeLetter} />
                <div className="border rounded-lg p-4 bg-gray-50 text-sm space-y-3">
                  <p>Dear <strong>{outcomeLetter.recipientName || '[Recipient Name]'}</strong></p>
                  <p className="font-semibold uppercase">APPROVAL LETTER: QUALIFICATIONS DEVELOPMENT APPLICATIONS</p>
                  <p>This letter serves to confirm the approval of application(s) received for the development of occupational qualification(s). The QCTO Internal Qualifications Committee seating of <input type="date" value={outcomeLetter.iqcDate} onChange={e => setOutcomeLetter({ ...outcomeLetter, iqcDate: e.target.value })} disabled={outcomeLetterSent} className="inline-block border rounded px-2 py-0.5 text-sm bg-white" /> approved the application(s) outlined below:</p>
                </div>
                <div>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left font-medium">Type of Development</th><th className="px-3 py-2 border text-left font-medium">SAQA ID</th><th className="px-3 py-2 border text-left font-medium">Qualification(s) Title</th><th className="px-3 py-2 border text-left font-medium">NQF Level</th><th className="px-3 py-2 border text-left font-medium">Credits</th>{!outcomeLetterSent && <th className="px-3 py-2 border text-center font-medium">Actions</th>}</tr></thead>
                      <tbody>{outcomeLetter.qualifications.map((q) => (<tr key={q.id} className="border-t hover:bg-gray-50"><td className="px-3 py-2 border">{outcomeLetterSent ? q.qap : <input type="text" value={q.qap} onChange={e => updateQual(q.id, 'qap', e.target.value)} placeholder="e.g. Review" className="w-28 border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.qualId : <input type="text" value={q.qualId} onChange={e => updateQual(q.id, 'qualId', e.target.value)} placeholder="e.g. 94202" className="w-24 border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.qualTitle : <input type="text" value={q.qualTitle} onChange={e => updateQual(q.id, 'qualTitle', e.target.value)} placeholder="Qualification Title" className="w-full border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.level : <input type="text" value={q.level} onChange={e => updateQual(q.id, 'level', e.target.value)} placeholder="e.g. 3" className="w-16 border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.credits : <input type="text" value={q.credits} onChange={e => updateQual(q.id, 'credits', e.target.value)} placeholder="e.g. 120" className="w-20 border rounded px-2 py-1 text-sm" />}</td>{!outcomeLetterSent && <td className="px-3 py-2 border text-center"><button onClick={() => removeQual(q.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td>}</tr>))}</tbody>
                    </table>
                  </div>
                  {!outcomeLetterSent && <button onClick={addQual} className="mt-2 flex items-center gap-2 text-sm text-green-600 hover:text-green-700"><Plus className="w-4 h-4" />Add Qualification</button>}
                </div>
                <div className="bg-gray-50 border rounded-lg p-4 text-sm space-y-2">
                  <p>Your project is linked to <input type="text" value={outcomeLetter.cluster} onChange={e => setOutcomeLetter({ ...outcomeLetter, cluster: e.target.value })} disabled={outcomeLetterSent} placeholder="e.g. Engineering Cluster" className="inline-block border rounded px-2 py-0.5 text-sm bg-white w-48" />. Please expect further communication from the relevant Cluster manager assigned to these application(s) in the next 14 working days.</p>
                  <p>The above approved application(s) must be included in your qualifications development quarterly reporting to the QCTO and submitted to Central office, email address: <span className="text-blue-600">centraloffice@qcto.org.za</span>.</p>
                  <p>The QCTO wishes you well in expediting the development of these qualification(s).</p>
                </div>
                <SenderFields data={outcomeLetter} setData={outcomeLetterSent ? () => {} : setOutcomeLetter} />
                {sendBtn}
              </div>
            </div>
          )}

          {(outcomeLetter.developOutcome === 'decline' || (outcomeLetterSent && (application as any)?.outcomeLetter?.developOutcome === 'decline')) && (
            <div className={`bg-white rounded-lg border-2 border-red-200 overflow-hidden ${outcomeLetterSent ? 'opacity-75' : ''}`}>
              <div className="bg-red-50 px-6 py-4 border-b border-red-200"><h3 className="font-semibold text-red-800 flex items-center gap-2"><AlertCircle className="w-5 h-5" />SKILLS PROGRAMME IN EVALUATION: NOT MEETING CRITERIA FOR APPROVAL AND RECORDING ON THE OQSF</h3></div>
              <div className="p-6 space-y-6">
                <Letterhead /><DisclaimerBox />
                <RecipientFields data={outcomeLetter} setData={outcomeLetterSent ? () => {} : setOutcomeLetter} />
                <div className="border rounded-lg p-4 bg-gray-50 text-sm space-y-3">
                  <p>Dear <strong>{outcomeLetter.recipientName || '[Recipient Name]'}</strong></p>
                  <p className="font-semibold uppercase">SKILLS PROGRAMME IN EVALUATION: NOT MEETING CRITERIA FOR APPROVAL AND RECORDING ON THE OQSF</p>
                  <p>The skills programme mentioned below was evaluated by the Quality Council for Trades and Occupations (QCTO) and was found not to meet the criteria for approval and recording on the OQSF.</p>
                  <p>Please refer to the below table for details requiring further attention:</p>
                </div>
                <div>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left font-medium">Qualification Type</th><th className="px-3 py-2 border text-left font-medium">Qualification Descriptor</th><th className="px-3 py-2 border text-left font-medium">NQF Level</th><th className="px-3 py-2 border text-left font-medium">Credits</th><th className="px-3 py-2 border text-left font-medium">Curriculum Code</th><th className="px-3 py-2 border text-left font-medium">Evaluation Criteria Elements with Shortcomings</th>{!outcomeLetterSent && <th className="px-3 py-2 border text-center font-medium">Actions</th>}</tr></thead>
                      <tbody>{outcomeLetter.declineQualifications.map((q) => (<tr key={q.id} className="border-t hover:bg-gray-50"><td className="px-3 py-2 border">{outcomeLetterSent ? q.qualType : <input type="text" value={q.qualType} onChange={e => updateDeclineQual(q.id, 'qualType', e.target.value)} placeholder="e.g. Skills Programme" className="w-full border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.descriptor : <input type="text" value={q.descriptor} onChange={e => updateDeclineQual(q.id, 'descriptor', e.target.value)} placeholder="e.g. Future Fit Leader" className="w-full border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.nqfLevel : <input type="text" value={q.nqfLevel} onChange={e => updateDeclineQual(q.id, 'nqfLevel', e.target.value)} placeholder="e.g. 6" className="w-16 border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.credits : <input type="text" value={q.credits} onChange={e => updateDeclineQual(q.id, 'credits', e.target.value)} placeholder="e.g. 60" className="w-20 border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? q.curriculumCode : <input type="text" value={q.curriculumCode} onChange={e => updateDeclineQual(q.id, 'curriculumCode', e.target.value)} placeholder="e.g. 900245-000-00-00" className="w-36 border rounded px-2 py-1 text-sm" />}</td><td className="px-3 py-2 border">{outcomeLetterSent ? <pre className="whitespace-pre-wrap text-xs">{q.shortcomings}</pre> : <textarea value={q.shortcomings} onChange={e => updateDeclineQual(q.id, 'shortcomings', e.target.value)} placeholder="List evaluation criteria shortcomings and recommendations..." rows={4} className="w-full border rounded px-2 py-1 text-sm" />}</td>{!outcomeLetterSent && <td className="px-3 py-2 border text-center"><button onClick={() => removeDeclineQual(q.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></td>}</tr>))}</tbody>
                    </table>
                  </div>
                  {!outcomeLetterSent && <button onClick={addDeclineQual} className="mt-2 flex items-center gap-2 text-sm text-red-600 hover:text-red-700"><Plus className="w-4 h-4" />Add Qualification</button>}
                </div>
                <div className="bg-gray-50 border rounded-lg p-4 text-sm space-y-2">
                  <p>The Quality Partner is required to address the shortcomings identified and resubmit the skills programme utilising the current templates and submission requirements for evaluation by QCTO.</p>
                  <p>Ensure that changes done in the Skills programme document are carried through to Curriculum document as well. Please ensure that the Qualifications Assessment Specifications (QAS) Addendum is also developed as it is a requirement.</p>
                  <p>The resubmitted qualification must be submitted to the QCTO Central office using the email address: <span className="text-blue-600">qualifications@qcto.org.za</span>.</p>
                  <p>I trust all will be received well.</p>
                </div>
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Recommended by</label><input type="text" value={outcomeLetter.declineRecommendedBy} onChange={e => setOutcomeLetter({ ...outcomeLetter, declineRecommendedBy: e.target.value })} disabled={outcomeLetterSent} placeholder="e.g. Mr L Thovhakale" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label><input type="text" value={outcomeLetter.declineRecommendedByDesignation} onChange={e => setOutcomeLetter({ ...outcomeLetter, declineRecommendedByDesignation: e.target.value })} disabled={outcomeLetterSent} placeholder="e.g. Deputy Director: Occupational Qualifications Maintenance" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Date</label><input type="date" value={outcomeLetter.declineRecommendedDate} onChange={e => setOutcomeLetter({ ...outcomeLetter, declineRecommendedDate: e.target.value })} disabled={outcomeLetterSent} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Approved by</label><input type="text" value={outcomeLetter.declineApprovedBy} onChange={e => setOutcomeLetter({ ...outcomeLetter, declineApprovedBy: e.target.value })} disabled={outcomeLetterSent} placeholder="e.g. Ms Sifiso Mkhonza" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label><input type="text" value={outcomeLetter.declineApprovedByDesignation} onChange={e => setOutcomeLetter({ ...outcomeLetter, declineApprovedByDesignation: e.target.value })} disabled={outcomeLetterSent} placeholder="e.g. Director: Occupational Qualifications Development" className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                    <div><label className="block text-sm font-semibold text-gray-700 mb-1">Date</label><input type="date" value={outcomeLetter.declineApprovedDate} onChange={e => setOutcomeLetter({ ...outcomeLetter, declineApprovedDate: e.target.value })} disabled={outcomeLetterSent} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                  </div>
                </div>
                {sendBtn}
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderDocumentsTab = () => (
    <div className="space-y-4">
      {selectedDocument ? (
        <div>
          <button onClick={() => setSelectedDocument(null)} className="flex items-center gap-1 text-sm text-purple-600 mb-4"><ChevronLeft className="w-4 h-4" />Back to Documents</button>
          <div className="border rounded-lg p-8 text-center"><FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="font-medium">{selectedDocument}</p><p className="text-sm text-gray-500 mt-2">Document preview would appear here</p><div className="flex justify-center gap-4 mt-4"><button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Download</button><button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Print</button></div></div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-200">
            {[{ key: 'applicationLetter', label: 'Application Letter', file: application.documents?.applicationLetter }, { key: 'motivation', label: 'Motivation', file: application.documents?.motivation }, { key: 'reference', label: 'Reference', file: application.documents?.reference }, { key: 'acrLetter', label: 'ACR Letter', file: application.documents?.acrLetter }].map(doc => (
              <tr key={doc.key} className="hover:bg-gray-50"><td className="px-4 py-3"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" /><span className="text-sm font-medium">{doc.label}</span></div></td><td className="px-4 py-3">{doc.file ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Uploaded</span> : <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Missing</span>}</td><td className="px-4 py-3">{doc.file && <button onClick={() => setSelectedDocument(doc.label)} className="p-1 text-purple-600 hover:bg-purple-50 rounded"><Eye className="w-4 h-4" /></button>}</td></tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-4">
      <div className="relative">
        {historyItems.length > 0 ? historyItems.map((item, index) => {
          const isExpanded = expandedHistoryIndex === index;
          return (
            <div key={index} className="pb-6 relative">
              <div className="flex gap-4 relative">
                {index < historyItems.length - 1 && <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>}
                <div className="relative z-10"><div className="w-4 h-4 rounded-full bg-purple-600"></div></div>
                <div className="flex-1">
                  {item.expandable ? (
                    <button type="button" onClick={() => setExpandedHistoryIndex(isExpanded ? null : index)} className="w-full text-left bg-gray-50 hover:bg-purple-50 border border-transparent hover:border-purple-200 p-3 rounded-lg transition-colors">
                      <div className="flex justify-between items-start gap-4"><div><p className="font-medium text-gray-900">{item.action}</p><p className="text-sm text-gray-600">{item.description}</p></div><div className="text-right shrink-0"><p className="text-xs font-medium text-purple-600 underline">{item.user}</p><p className="text-xs text-gray-400">{item.date}</p></div></div>
                    </button>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg"><div className="flex justify-between items-start gap-4"><div><p className="font-medium text-gray-900">{item.action}</p><p className="text-sm text-gray-600">{item.description}</p></div><div className="text-right shrink-0"><p className="text-xs text-gray-500">{item.user}</p><p className="text-xs text-gray-400">{item.date}</p></div></div></div>
                  )}
                  {item.expandable && isExpanded && item.details && (
                    <div className="mt-3 border border-purple-200 bg-white rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-700 mb-3">Evaluation Checklist Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {[['Qualification Design', item.details.qualificationDesign], ['Draft Report', item.details.draftReport], ['Application Letter', item.details.applicationLetter], ['Motivation', item.details.motivation], ['Reference', item.details.reference], ['ACR Letter', item.details.acrLetter], ['Decision', item.details.approved]].map(([label, val]) => (
                          <div key={label as string} className="flex justify-between rounded bg-gray-50 px-3 py-2"><span>{label}</span><span className={val ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '—')}</span></div>
                        ))}
                        {item.details.notes && <div className="md:col-span-2 rounded bg-gray-50 px-3 py-2"><p className="text-xs text-gray-500 mb-1">Notes</p><p className="font-medium text-gray-800">{item.details.notes}</p></div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }) : <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">No history available yet.</div>}
      </div>
    </div>
  );

  const outcomeTabLabel = () => {
    if (!letterType) return 'Outcome Letter';
    if (letterType === 'acknowledgement_deactivate_replace') return 'Acknowledgement';
    if (letterType === 'acknowledgement_review') return 'Ack. for Review';
    if (isDevelop) return 'Approval / Decline';
    return 'Outcome Letter';
  };

  const tabs = [
    { key: 'overview', label: 'Details', icon: null },
    { key: 'checklist', label: 'Evaluation Checklist', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'acknowledgement', label: 'Acknowledgement Letter', icon: <Mail className="w-4 h-4" />, locked: !evaluationSubmitted && !isEvalSummary },
    ...(isEvalSummary && letterType ? [{ key: 'outcomeLetter', label: outcomeTabLabel(), icon: <FileText className="w-4 h-4" /> }] : []),
    { key: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { key: 'history', label: 'History', icon: <History className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Evaluation Details</h2>
            <p className="text-sm text-gray-500 mt-1">ID: {application.id} | Applicant: {application.applicantName}</p>
          </div>
          <div className="flex items-center gap-2">
            {evaluationSubmitted && <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1"><FileCheck2 className="w-3 h-3" />Evaluation Complete</span>}
            {outcomeLetterSent && <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium flex items-center gap-1"><Send className="w-3 h-3" />Letter Sent</span>}
            <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Status bar */}
        <div className="px-6 py-2 bg-purple-50 border-b flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">{application.status === 'evaluation' ? 'Initial Evaluation' : 'Evaluation Summary'}</span>
          <span className="text-xs text-purple-600 font-medium ml-auto">{application.qualificationType} + {application.actionType}</span>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab: any) => (
              <button key={tab.key} onClick={() => !tab.locked && setActiveTab(tab.key as any)} title={tab.locked ? 'Complete the Evaluation Checklist first' : undefined}
                className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap mr-4 ${activeTab === tab.key ? 'border-purple-600 text-purple-600' : tab.locked ? 'border-transparent text-gray-300 cursor-not-allowed' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.icon}{tab.label}
                {tab.key === 'acknowledgement' && evaluationSubmitted && !isEvalSummary && <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />}
                {tab.key === 'acknowledgement' && tab.locked && <span className="ml-1 text-xs text-gray-300">🔒</span>}
                {tab.key === 'outcomeLetter' && outcomeLetterSent && <span className="ml-1 w-2 h-2 rounded-full bg-blue-500 inline-block" />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'checklist' && renderChecklistTab()}
          {activeTab === 'acknowledgement' && renderAcknowledgementTab()}
          {activeTab === 'outcomeLetter' && renderOutcomeLetterTab()}
          {activeTab === 'documents' && renderDocumentsTab()}
          {activeTab === 'history' && renderHistoryTab()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">Close</button>
        </div>
      </div>
    </div>
  );
}