// pages/internal/QualificationsApprovalPhase.tsx
import React, { useState, useEffect } from 'react';
import {
  Eye, FileText, CheckCircle, Clock, Download, Calendar,
  User, ClipboardList, AlertCircle, Search,
  Award, Shield, FileSignature, FolderOpen,
  Users, Send, X, ThumbsUp, ChevronRight, ChevronDown, ChevronUp,
  RefreshCw, BookOpen, CheckSquare, Bell, UserCheck, Plus, Trash2
} from 'lucide-react';
// ─── Types ────────────────────────────────────────────────────────────────────

interface ApprovalRecommendation {
  role: 'Deputy Director' | 'Director' | 'Chief Director' | 'CEO';
  name: string;
  recommended: boolean;
  date: string;
  comments: string;
}

// One row in the digital SAQA registration letter table
interface SaqaLetterRow {
  no: number;
  qualificationTitle: string;
  nqfLevel: string;
  minCredits: string;
  saqaId: string;
}

// The completed digital SAQA letter (created in Submission Package Approval)
interface DigitalSaqaLetter {
  letterDate: string;           // Date on the letter
  committeeDate: string;        // "meeting held on..."
  recipientName: string;        // Mr VD Naidoo
  recipientTitle: string;       // Chief Executive Officer
  recipientOrganisation: string;// QCTO
  signedBy: string;             // Ms Nadia Starr
  signedByTitle: string;        // Chief Executive Officer
  rows: SaqaLetterRow[];
  createdDate: string;          // ISO timestamp
  sentToRegistration: boolean;
  sentDate?: string;
}

interface ApprovalQualification {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
  nqfLevel: number;
  credits: number;
  submittedBy: string;
  submittedDate: string;
  status: 'pending_review' | 'under_review' | 'recommended' | 'approved' | 'approved_for_registration' | 'registered';
  currentApprovalLevel: number;
  recommendations: ApprovalRecommendation[];
  resolutionDocument?: {
    fileName?: string;
    fileUrl?: string;
    resolutionNumber?: string;
    letterNumber?: string;
    issueDate?: string;
    signedBy?: string;
    notes?: string;
    uploadDate?: string;
    directorTitle?: string;
    recipientName?: string;
    recipientOrganisation?: string;
    type?: 'approval' | 'rejection';
    letterData?: any;
  };
  registrationDetails?: {
    registrationNumber: string;
    registrationDate: string;
    expiryDate: string;
    saqaId: string;
    accreditingBody: string;
    registeredBy: string;
    registrationDateComplete: string;
  };
  allDocuments: {
    qualificationDocument: string;
    curriculumSpec: string;
    assessmentGuidelines: string;
    qasReport: string;
  };
  movedToApprovalDate: string;
  saqaLetter?: {
    fileName: string;
    fileUrl: string;
    uploadDate: string;
    sentDate: string;
    sentBy: string;
    letterNumber?: string;
    recipientName?: string;
    recipientOrganisation?: string;
    notes?: string;
  };
  // Digital SAQA registration letter (created in Submission Package Approval)
  digitalSaqaLetter?: DigitalSaqaLetter;
  // Notification sent to QP
  qpNotification?: {
    sentDate: string;
    sentBy: string;
    recipientName: string;
    recipientEmail: string;
    subject: string;
    message: string;
  };
}

interface RegisteredQualification {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
  nqfLevel: number;
  credits: number;
  registrationNumber: string;
  registrationDate: string;
  expiryDate: string;
  status: 'Active' | 'Expiring' | 'Expired';
  saqaId: string;
  provider: string;
  totalEnrollments: number;
  lastUpdated: string;
  approvalQualificationData: ApprovalQualification;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const VALID_APPROVAL_STATUSES = [
  'pending_review', 'under_review', 'recommended', 'approved',
  'approved_for_registration', 'registered',
];

// ─── Tiny display helpers ─────────────────────────────────────────────────────

const RF = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
    <p className="text-sm text-gray-800 bg-white border rounded px-3 py-2 min-h-[34px]">
      {value || <span className="text-gray-400 italic">Not provided</span>}
    </p>
  </div>
);

const RTA = ({ label, value }: { label: string; value?: string }) => (
  <div>
    {label && <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>}
    <div className="text-sm text-gray-800 bg-white border rounded px-3 py-2 min-h-[50px] whitespace-pre-wrap">
      {value || <span className="text-gray-400 italic">Not provided</span>}
    </div>
  </div>
);

const SB = ({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="bg-gray-50 rounded-lg border p-4">
    <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3 flex items-center gap-2">
      {icon}{title}
    </h4>
    {children}
  </div>
);

const YNBadge = ({ value }: { value?: string }) => {
  if (!value) return <span className="text-gray-400 italic text-sm">—</span>;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${value === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {value}
    </span>
  );
};

// ─── Phase report renderer (condensed) ───────────────────────────────────────

const PhaseReportView = ({ phaseName, reportData }: { phaseName: string; reportData: any }) => {
  if (!reportData)
    return <p className="text-sm text-gray-400 italic py-4 text-center">No report data for this phase.</p>;
  const r = reportData;
  const name = phaseName.toLowerCase();
  if (name.includes('scoping')) return (
    <div className="space-y-4">
      <SB title="QCTO Approved Application Details">
        <div className="grid grid-cols-3 gap-3">
          <RF label="Occupation" value={r.scopingOccupation} />
          <RF label="OFO Code" value={r.scopingOfoCode} />
          <RF label="Specialisation" value={r.scopingSpecialisation} />
        </div>
      </SB>
      <SB title="Meeting Details" icon={<Calendar className="w-3 h-3" />}>
        <div className="grid grid-cols-3 gap-3">
          <RF label="Date" value={r.scopingMeetingDate} />
          <RF label="Venue" value={r.scopingMeetingVenue} />
          <RF label="Time" value={r.scopingMeetingTime} />
        </div>
      </SB>
    </div>
  );
  if (name.includes('profil')) return (
    <div className="space-y-4">
      <SB title="Application Details">
        <div className="grid grid-cols-3 gap-3">
          <RF label="Occupation" value={r.profilingOccupation} />
          <RF label="OFO Code" value={r.profilingOfoCode} />
          <RF label="Specialisation" value={r.profilingSpecialisation} />
        </div>
      </SB>
    </div>
  );
  return (
    <div className="space-y-3">
      {r.objectives && <SB title="Objectives"><RTA label="" value={r.objectives} /></SB>}
      {r.findings && <SB title="Findings"><RTA label="" value={r.findings} /></SB>}
      {r.additionalNotes && <SB title="Additional Notes"><RTA label="" value={r.additionalNotes} /></SB>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DIGITAL SAQA LETTER PREVIEW (read-only, mirrors the real letter layout)
// ─────────────────────────────────────────────────────────────────────────────

function SaqaLetterPreview({ letter }: { letter: DigitalSaqaLetter }) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* SAQA header bar */}
      <div className="bg-[#003087] px-6 py-3 flex items-center justify-between">
        <div className="text-white">
          <p className="text-xs font-bold tracking-widest uppercase opacity-80">South African Qualifications Authority</p>
          <p className="text-xs opacity-60">SAQA House · 1067 Arcadia Street · Hatfield, 0083</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
          <span className="text-[#003087] font-black text-lg">S</span>
        </div>
      </div>

      <div className="p-6 space-y-5 font-[Georgia,serif] text-sm text-gray-800">
        {/* Date + addressee */}
        <div className="text-right text-gray-600">{letter.letterDate}</div>
        <div className="space-y-0.5">
          <p className="font-semibold">{letter.recipientName}</p>
          <p>{letter.recipientTitle}</p>
          <p>{letter.recipientOrganisation}</p>
        </div>
        <p className="font-semibold">Dear {letter.recipientName.split(' ').slice(-1)[0]}</p>

        {/* Subject */}
        <p className="font-bold text-center underline uppercase tracking-wide text-base">
          Registration of OQSF Qualifications on the NQF by SAQA
        </p>

        {/* Body */}
        <p>
          I am pleased to inform you that SAQA's NQF Qualifications Committee, at its meeting held on{' '}
          <strong>{letter.committeeDate}</strong>, approved the registration of the following OQSF
          qualification(s) on the National Qualifications Framework in terms of Section 13 (1)(h)(ii)
          of the <em>National Qualifications Framework Act, 2008</em> (Act No. 67 of 2008):
        </p>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold w-8">No.</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold">Qualification Title</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold w-24">NQF Level</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold w-20">Min Credits</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold w-20">SAQA ID</th>
              </tr>
            </thead>
            <tbody>
              {letter.rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-400 px-3 py-2">{row.no}.</td>
                  <td className="border border-gray-400 px-3 py-2">{row.qualificationTitle}</td>
                  <td className="border border-gray-400 px-3 py-2">{row.nqfLevel}</td>
                  <td className="border border-gray-400 px-3 py-2">{row.minCredits}</td>
                  <td className="border border-gray-400 px-3 py-2">{row.saqaId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>Should you require further information, please contact me.</p>
        <p>Sincerely</p>

        {/* Signature */}
        <div className="mt-6 space-y-0.5">
          <div className="w-32 border-b border-gray-500 mb-1" />
          <p className="font-bold uppercase">{letter.signedBy}</p>
          <p className="font-bold uppercase">{letter.signedByTitle}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DIGITAL SAQA LETTER FORM (editable, inside Submission Package Modal)
// ─────────────────────────────────────────────────────────────────────────────

interface SaqaLetterFormProps {
  qualification: ApprovalQualification;
  existingLetter?: DigitalSaqaLetter;
  onSave: (letter: DigitalSaqaLetter) => void;
}

function SaqaLetterForm({ qualification, existingLetter, onSave }: SaqaLetterFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<Omit<DigitalSaqaLetter, 'createdDate' | 'sentToRegistration' | 'sentDate'>>({
    letterDate: existingLetter?.letterDate || new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }),
    committeeDate: existingLetter?.committeeDate || '',
    recipientName: existingLetter?.recipientName || 'Mr VD Naidoo',
    recipientTitle: existingLetter?.recipientTitle || 'Chief Executive Officer',
    recipientOrganisation: existingLetter?.recipientOrganisation || 'Quality Council for Trades and Occupations',
    signedBy: existingLetter?.signedBy || 'MS NADIA STARR',
    signedByTitle: existingLetter?.signedByTitle || 'CHIEF EXECUTIVE OFFICER',
    rows: existingLetter?.rows || [
      {
        no: 1,
        qualificationTitle: qualification.qualificationTitle,
        nqfLevel: `NQF Level ${String(qualification.nqfLevel).padStart(2, '0')}`,
        minCredits: `${qualification.credits}`,
        saqaId: '',
      }
    ],
  });

  const [preview, setPreview] = useState(false);

  const updateRow = (index: number, field: keyof SaqaLetterRow, value: string | number) => {
    setForm(p => ({
      ...p,
      rows: p.rows.map((r, i) => i === index ? { ...r, [field]: value } : r),
    }));
  };

  const addRow = () => {
    setForm(p => ({
      ...p,
      rows: [...p.rows, { no: p.rows.length + 1, qualificationTitle: '', nqfLevel: '', minCredits: '', saqaId: '' }],
    }));
  };

  const removeRow = (index: number) => {
    setForm(p => ({
      ...p,
      rows: p.rows.filter((_, i) => i !== index).map((r, i) => ({ ...r, no: i + 1 })),
    }));
  };

  const isValid = form.committeeDate && form.rows.every(r => r.qualificationTitle && r.nqfLevel && r.minCredits && r.saqaId);

  const handleSave = () => {
    if (!isValid) return;
    const letter: DigitalSaqaLetter = {
      ...form,
      createdDate: existingLetter?.createdDate || new Date().toISOString(),
      sentToRegistration: existingLetter?.sentToRegistration || false,
      sentDate: existingLetter?.sentDate,
    };
    onSave(letter);
  };

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-700">Letter Preview</h4>
          <button onClick={() => setPreview(false)} className="text-sm text-blue-600 hover:underline">← Back to Edit</button>
        </div>
        <SaqaLetterPreview letter={{ ...form, createdDate: '', sentToRegistration: false }} />
        <div className="flex justify-end gap-3">
          <button onClick={() => setPreview(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Edit</button>
          <button onClick={handleSave} disabled={!isValid}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4" />Confirm &amp; Save Letter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-800">Create the Digital SAQA Registration Letter</p>
          <p className="text-sm text-blue-700 mt-1">
            This letter is based on the official SAQA format (signed by the SAQA CEO confirming registration on the NQF).
            Fill in the details from the received SAQA letter. Once saved and sent to Registration, these details will
            pre-populate the Qualification Registration section.
          </p>
        </div>
      </div>

      {/* Header fields */}
      <SB title="Letter Header" icon={<FileText className="w-3 h-3" />}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Letter Date *</label>
            <input type="text" value={form.letterDate} onChange={e => setForm(p => ({ ...p, letterDate: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
              placeholder="e.g. 30 September 2024" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Committee Meeting Date *</label>
            <input type="text" value={form.committeeDate} onChange={e => setForm(p => ({ ...p, committeeDate: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
              placeholder="e.g. 22 August 2024" />
          </div>
        </div>
      </SB>

      {/* Recipient */}
      <SB title="Addressed To" icon={<User className="w-3 h-3" />}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Recipient Name</label>
            <input type="text" value={form.recipientName} onChange={e => setForm(p => ({ ...p, recipientName: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Title / Role</label>
            <input type="text" value={form.recipientTitle} onChange={e => setForm(p => ({ ...p, recipientTitle: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Organisation</label>
            <input type="text" value={form.recipientOrganisation} onChange={e => setForm(p => ({ ...p, recipientOrganisation: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white" />
          </div>
        </div>
      </SB>

      {/* Qualification rows table */}
      <SB title="Qualification(s) Registered" icon={<Award className="w-3 h-3" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-2 text-left font-semibold w-8">No.</th>
                <th className="border px-2 py-2 text-left font-semibold">Qualification Title *</th>
                <th className="border px-2 py-2 text-left font-semibold w-28">NQF Level *</th>
                <th className="border px-2 py-2 text-left font-semibold w-24">Min Credits *</th>
                <th className="border px-2 py-2 text-left font-semibold w-24">SAQA ID *</th>
                <th className="border px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {form.rows.map((row, i) => (
                <tr key={i}>
                  <td className="border px-2 py-1 text-center text-gray-500">{row.no}</td>
                  <td className="border px-1 py-1">
                    <input type="text" value={row.qualificationTitle}
                      onChange={e => updateRow(i, 'qualificationTitle', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-300 outline-none"
                      placeholder="Full qualification title" />
                  </td>
                  <td className="border px-1 py-1">
                    <input type="text" value={row.nqfLevel}
                      onChange={e => updateRow(i, 'nqfLevel', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-300 outline-none"
                      placeholder="NQF Level 04" />
                  </td>
                  <td className="border px-1 py-1">
                    <input type="text" value={row.minCredits}
                      onChange={e => updateRow(i, 'minCredits', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-300 outline-none"
                      placeholder="120" />
                  </td>
                  <td className="border px-1 py-1">
                    <input type="text" value={row.saqaId}
                      onChange={e => updateRow(i, 'saqaId', e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-300 outline-none"
                      placeholder="122680" />
                  </td>
                  <td className="border px-1 py-1 text-center">
                    {form.rows.length > 1 && (
                      <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 p-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addRow}
          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
          <Plus className="w-3 h-3" />Add another qualification row
        </button>
      </SB>

      {/* Signatory */}
      <SB title="Signed By (SAQA)" icon={<Shield className="w-3 h-3" />}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Name</label>
            <input type="text" value={form.signedBy} onChange={e => setForm(p => ({ ...p, signedBy: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Title</label>
            <input type="text" value={form.signedByTitle} onChange={e => setForm(p => ({ ...p, signedByTitle: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white" />
          </div>
        </div>
      </SB>

      <div className="flex justify-end gap-3">
        <button onClick={() => setPreview(true)} disabled={!isValid}
          className="px-5 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
          <Eye className="w-4 h-4" />Preview Letter
        </button>
        <button onClick={handleSave} disabled={!isValid}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium text-sm">
          <CheckCircle className="w-4 h-4" />Save Letter
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLUTION REVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface ResolutionReviewModalProps {
  qualification: ApprovalQualification;
  onClose: () => void;
  onRecommend: (role: string, comments: string) => void;
  onMoveToSubmission: (q: ApprovalQualification) => void;
  onSendToSaqa: (q: ApprovalQualification, letterData: any) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

function ResolutionReviewModal({ qualification, onClose, onRecommend, onMoveToSubmission, onSendToSaqa, getStatusBadge }: ResolutionReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'checklist' | 'resolution_letter' | 'approval'>('overview');
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);
  const [recommendComments, setRecommendComments] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isSaqaUploadOpen, setIsSaqaUploadOpen] = useState(false);
  const [saqaFile, setSaqaFile] = useState<File | null>(null);
  const [saqaLetterForm, setSaqaLetterForm] = useState({
    letterNumber: '', sentBy: '',
    recipientName: 'Ms. N Starr',
    recipientOrganisation: 'South African Qualifications Authority (SAQA)',
    notes: '',
  });
  const roleOrder = ['Deputy Director', 'Director', 'Chief Director', 'CEO'];

  const getInternalPhases = () => {
    try {
      const plans = JSON.parse(localStorage.getItem('internalCyclePlans') || '[]');
      const plan = plans.find((p: any) => p.qualificationCode === qualification.qualificationCode);
      return plan?.phases || [];
    } catch { return []; }
  };
  const getPhaseReports = () => {
    try {
      const reports = JSON.parse(localStorage.getItem('submittedPhaseReports') || '[]');
      return reports.filter((r: any) => r.qualificationCode === qualification.qualificationCode);
    } catch { return []; }
  };
  const getResolutionProject = () => {
    try {
      const projects = JSON.parse(localStorage.getItem('resolutionProjects') || '[]');
      return projects.find((p: any) => p.qualificationCode === qualification.qualificationCode) || null;
    } catch { return null; }
  };

  const phases = getInternalPhases();
  const phaseReports = getPhaseReports();
  const resolutionProject = getResolutionProject();
  const checklists = resolutionProject?.checklists || [];
  const requiredTotal = checklists.filter((c: any) => c.required).length;
  const completedRequired = checklists.filter((c: any) => c.required && c.completed).length;
  const resDoc = qualification.resolutionDocument;

  const getReportForPhase = (phaseName: string) => {
    const fromReports = phaseReports.find((r: any) => r.phaseName === phaseName);
    if (fromReports?.reportData) return fromReports.reportData;
    const fromPhase = phases.find((p: any) => p.name === phaseName);
    return fromPhase?.reportData || null;
  };

  const tabs = [
    { key: 'overview', label: 'Overview', Icon: Award },
    { key: 'phases', label: 'Phase Reports', Icon: FileText },
    { key: 'checklist', label: 'Checklist', Icon: ClipboardList },
    { key: 'resolution_letter', label: 'Resolution Letter', Icon: FileSignature },
    { key: 'approval', label: 'Approval Progress', Icon: ThumbsUp },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
          <div>
            <h3 className="text-lg font-semibold">{qualification.qualificationTitle}</h3>
            <p className="text-sm text-gray-500">Code: {qualification.qualificationCode} · Submitted: {qualification.submittedDate}</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(qualification.status)}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="px-6 border-b bg-white">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-4 h-4" />{label}
                {key === 'checklist' && requiredTotal > 0 && (
                  <span className={`ml-1 text-xs px-1.5 rounded-full ${completedRequired === requiredTotal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {completedRequired}/{requiredTotal}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide">Qualification Information</h4>
                  <div className="space-y-2 text-sm">
                    {[['Code', qualification.qualificationCode], ['NQF Level', `Level ${qualification.nqfLevel}`], ['Credits', `${qualification.credits}`], ['Submitted By', qualification.submittedBy], ['Submitted Date', qualification.submittedDate]].map(([l, v]) => (
                      <div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-medium">{v}</span></div>
                    ))}
                    <div className="flex justify-between items-center"><span className="text-gray-500">Status</span>{getStatusBadge(qualification.status)}</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide">Approval Progress</h4>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-3 rounded-full transition-all" style={{ width: `${(qualification.currentApprovalLevel / 4) * 100}%` }} />
                    </div>
                    <span className="text-xl font-bold text-indigo-700">{qualification.currentApprovalLevel}/4</span>
                  </div>
                  <div className="space-y-1">
                    {roleOrder.map((role, index) => {
                      const isCompleted = qualification.currentApprovalLevel > index;
                      const rec = qualification.recommendations?.find(r => r.role === role);
                      return (
                        <div key={role} className={`flex items-center gap-2 text-xs p-1.5 rounded ${isCompleted ? 'text-green-700 bg-green-50' : 'text-gray-400'}`}>
                          {isCompleted ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />}
                          <span className="flex-1">{role}</span>
                          {rec && <span>{new Date(rec.date).toLocaleDateString()}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {phases.length > 0 && (
                <div className="bg-gray-50 rounded-lg border p-4">
                  <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide flex items-center gap-2"><FileText className="w-4 h-4" />Development Phases</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {phases.map((phase: any, i: number) => (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded border text-sm ${phase.approved ? 'bg-green-50 border-green-200' : phase.reportSubmitted ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                        {phase.approved ? <CheckCircle className="w-4 h-4 text-green-500" /> : phase.reportSubmitted ? <Clock className="w-4 h-4 text-yellow-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
                        <span className="flex-1 text-xs">{phase.name}</span>
                        {phase.approved && <span className="text-xs text-green-600 font-medium">Approved</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {resDoc && (
                <div className={`p-4 rounded-lg border ${resDoc.type === 'rejection' ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileSignature className={`w-5 h-5 ${resDoc.type === 'rejection' ? 'text-red-600' : 'text-purple-600'}`} />
                    <p className="font-medium">Resolution Document Attached</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">Number: </span><span className="font-medium">{resDoc.resolutionNumber || resDoc.letterNumber || '—'}</span></div>
                    <div><span className="text-gray-500">Issue Date: </span><span className="font-medium">{resDoc.issueDate || '—'}</span></div>
                    <div><span className="text-gray-500">Signed By: </span><span className="font-medium">{resDoc.signedBy || '—'}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'phases' && (
            <div className="space-y-3">
              {phases.length === 0 && <div className="text-center py-12 text-gray-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">No phase data found</p></div>}
              {phases.map((phase: any, idx: number) => {
                const isExpanded = expandedPhase === phase.name;
                const reportData = getReportForPhase(phase.name);
                return (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <button onClick={() => setExpandedPhase(isExpanded ? null : phase.name)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        {phase.approved ? <CheckCircle className="w-5 h-5 text-green-500" /> : phase.reportSubmitted ? <Clock className="w-5 h-5 text-yellow-500" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                        <div className="text-left">
                          <p className="font-medium text-sm">{phase.name}</p>
                          <p className="text-xs text-gray-500">{phase.approved ? 'Approved' : phase.reportSubmitted ? 'Submitted' : 'Not submitted'}</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {isExpanded && (
                      <div className="p-4 border-t bg-white">
                        {reportData ? <PhaseReportView phaseName={phase.name} reportData={reportData} /> : <p className="text-sm text-gray-400 italic text-center py-4">No report data available.</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Resolution Checklist</h4>
                {requiredTotal > 0 && <span className="text-sm text-gray-500">Required: {completedRequired}/{requiredTotal}</span>}
              </div>
              {checklists.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No checklist data available</p></div>
              ) : (
                <div className="space-y-2">
                  {checklists.map((item: any) => (
                    <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${item.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="mt-0.5">{item.completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.item}{item.required && <span className="text-red-500 ml-1">*</span>}</p>
                        {item.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{item.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'resolution_letter' && (
            <div className="space-y-5">
              {!resDoc ? (
                <div className="text-center py-12 text-gray-400"><FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">No resolution document attached</p></div>
              ) : (
                <div className={`rounded-xl border-2 p-5 ${resDoc.type === 'rejection' ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${resDoc.type === 'rejection' ? 'bg-red-100' : 'bg-purple-100'}`}>
                      <FileText className={`w-6 h-6 ${resDoc.type === 'rejection' ? 'text-red-600' : 'text-purple-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{resDoc.fileName || 'Resolution Letter'}</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-xs text-gray-500 block uppercase font-semibold mb-0.5">Number</span><span className="font-medium">{resDoc.resolutionNumber || resDoc.letterNumber || '—'}</span></div>
                        <div><span className="text-xs text-gray-500 block uppercase font-semibold mb-0.5">Issue Date</span><span className="font-medium">{resDoc.issueDate || '—'}</span></div>
                        <div><span className="text-xs text-gray-500 block uppercase font-semibold mb-0.5">Signed By</span><span className="font-medium">{resDoc.signedBy || '—'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'approval' && (
            <div className="space-y-4">
              <h4 className="font-medium">Recommendation Progress</h4>
              <div className="space-y-3">
                {roleOrder.map((role, index) => {
                  const isCompleted = qualification.currentApprovalLevel > index;
                  const isCurrent = qualification.currentApprovalLevel === index;
                  const rec = qualification.recommendations?.find(r => r.role === role);
                  return (
                    <div key={role} className={`flex items-center justify-between p-4 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'}`}>{index + 1}</div>
                        <div>
                          <p className="font-medium">{role}</p>
                          {rec && <p className="text-xs text-gray-500">Recommended on {new Date(rec.date).toLocaleDateString()}</p>}
                          {rec?.comments && <p className="text-xs text-gray-400 italic mt-0.5">"{rec.comments}"</p>}
                        </div>
                      </div>
                      {isCompleted ? <CheckCircle className="w-6 h-6 text-green-500 shrink-0" /> :
                        isCurrent && qualification.status !== 'approved' && qualification.status !== 'approved_for_registration' && qualification.status !== 'registered' ? (
                          <button onClick={() => { setSelectedRole(role); setIsRecommendOpen(true); }}
                            className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Recommend</button>
                        ) : <Clock className="w-6 h-6 text-gray-300 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {qualification.currentApprovalLevel === 4 && qualification.status !== 'approved_for_registration' && qualification.status !== 'registered' && (
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide whitespace-nowrap">Next Step</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>
                  {qualification.saqaLetter ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                      <p className="font-semibold text-green-800 mb-2">Recommendation Letter Sent to SAQA</p>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div><span className="text-xs text-gray-500 uppercase font-semibold block mb-0.5">Sent By</span><span className="font-medium">{qualification.saqaLetter.sentBy}</span></div>
                        <div><span className="text-xs text-gray-500 uppercase font-semibold block mb-0.5">Sent Date</span><span className="font-medium">{new Date(qualification.saqaLetter.sentDate).toLocaleDateString()}</span></div>
                      </div>
                      <button onClick={() => onMoveToSubmission(qualification)}
                        className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium">
                        <Send className="w-4 h-4" />Proceed to Submission Package Approval
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
                      <div className="flex items-start gap-3 mb-4">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-800">SAQA Recommendation Letter Required</p>
                          <p className="text-sm text-amber-700 mt-1">Upload and send the official QCTO recommendation letter to SAQA.</p>
                        </div>
                      </div>
                      <button onClick={() => setIsSaqaUploadOpen(true)}
                        className="w-full bg-amber-600 text-white px-4 py-3 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 font-medium">
                        Upload &amp; Send SAQA Recommendation Letter
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Close</button>
        </div>
      </div>

      {/* Recommend sub-modal */}
      {isRecommendOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Recommend: {selectedRole}</h3></div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
              <textarea value={recommendComments} onChange={e => setRecommendComments(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm" rows={4} />
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setIsRecommendOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Cancel</button>
              <button onClick={() => { onRecommend(selectedRole, recommendComments); setIsRecommendOpen(false); setRecommendComments(''); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAQA Upload sub-modal */}
      {isSaqaUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Send SAQA Recommendation Letter</h3>
              <button onClick={() => { setIsSaqaUploadOpen(false); setSaqaFile(null); }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <label htmlFor="saqa-up" className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-5 cursor-pointer transition-colors ${saqaFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'}`}>
                {saqaFile ? <><CheckCircle className="w-8 h-8 text-green-500 mb-2" /><p className="text-sm font-medium text-green-700">{saqaFile.name}</p></> : <><p className="text-sm text-gray-600">Click to upload signed letter (PDF/DOC)</p></>}
                <input id="saqa-up" type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setSaqaFile(e.target.files?.[0] || null)} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Letter / Ref Number</label>
                  <input type="text" value={saqaLetterForm.letterNumber} onChange={e => setSaqaLetterForm(p => ({ ...p, letterNumber: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Sent By *</label>
                  <input type="text" value={saqaLetterForm.sentBy} onChange={e => setSaqaLetterForm(p => ({ ...p, sentBy: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => { setIsSaqaUploadOpen(false); setSaqaFile(null); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Cancel</button>
              <button disabled={!saqaFile || !saqaLetterForm.sentBy}
                onClick={() => {
                  if (!saqaFile || !saqaLetterForm.sentBy) return;
                  onSendToSaqa(qualification, { fileName: saqaFile.name, fileUrl: URL.createObjectURL(saqaFile), uploadDate: new Date().toISOString(), sentDate: new Date().toISOString(), sentBy: saqaLetterForm.sentBy, letterNumber: saqaLetterForm.letterNumber, recipientName: saqaLetterForm.recipientName, recipientOrganisation: saqaLetterForm.recipientOrganisation, notes: saqaLetterForm.notes });
                  setIsSaqaUploadOpen(false); setSaqaFile(null);
                }}
                className="px-5 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2">
                <Send className="w-4 h-4" />Send to SAQA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSION PACKAGE MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface SubmissionPackageModalProps {
  qualification: ApprovalQualification;
  onClose: () => void;
  onSaveDigitalLetter: (q: ApprovalQualification, letter: DigitalSaqaLetter) => void;
  onSendToRegistration: (q: ApprovalQualification) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

function SubmissionPackageModal({ qualification, onClose, onSaveDigitalLetter, onSendToRegistration, getStatusBadge }: SubmissionPackageModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'checklist' | 'resolution_letter' | 'approval' | 'saqa_letter'>('overview');
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [isEditingLetter, setIsEditingLetter] = useState(false);

  // localQ tracks the latest version of this qualification inside the modal.
  // On mount, merge the prop with any fresher data from localStorage so that
  // re-opening the modal after saving always restores the saved letter.
  const [localQ, setLocalQ] = useState<ApprovalQualification>(() => {
    try {
      const raw = localStorage.getItem('approvalQualifications');
      if (raw) {
        const stored = JSON.parse(raw).find((q: any) => q.id === qualification.id);
        if (stored) return stored as ApprovalQualification;
      }
    } catch {}
    return qualification;
  });

  // handleSaveAndSync: update localQ immediately so the modal re-renders with the
  // saved letter, then persist to parent/localStorage.
  // NOTE: we do NOT useEffect-sync from the qualification prop mid-session because
  // that would overwrite localQ before the async parent state update completes.
  const handleSaveAndSync = (q: ApprovalQualification, letter: DigitalSaqaLetter) => {
    const updated = { ...q, digitalSaqaLetter: letter };
    setLocalQ(updated);           // instant local update — letter shows immediately
    onSaveDigitalLetter(q, letter); // persist to localStorage + parent state
  };

  const digitalLetter = localQ.digitalSaqaLetter;

  // Checklist count for tab badge — still needed here
  const checklists = (() => { try { return JSON.parse(localStorage.getItem('resolutionProjects') || '[]').find((p: any) => p.qualificationCode === qualification.qualificationCode)?.checklists || []; } catch { return []; } })();
  const requiredTotal = checklists.filter((c: any) => c.required).length;
  const completedRequired = checklists.filter((c: any) => c.required && c.completed).length;

  const tabs = [
    { key: 'overview', label: 'Overview', Icon: Award },
    { key: 'phases', label: 'Phase Reports', Icon: FileText },
    { key: 'checklist', label: 'Checklist', Icon: ClipboardList },
    { key: 'resolution_letter', label: 'Resolution Letter', Icon: FileSignature },
    { key: 'approval', label: 'Approval Chain', Icon: ThumbsUp },
    { key: 'saqa_letter', label: 'SAQA Registration Letter', Icon: Shield },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">{qualification.qualificationTitle}</h3>
              <p className="text-sm text-gray-500">Code: {qualification.qualificationCode} · Submission Package Approval</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(qualification.status)}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="px-6 border-b bg-white">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-4 h-4" />{label}
                {key === 'checklist' && requiredTotal > 0 && (
                  <span className={`ml-1 text-xs px-1.5 rounded-full ${completedRequired === requiredTotal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{completedRequired}/{requiredTotal}</span>
                )}
                {key === 'saqa_letter' && (
                  <span className={`ml-1 w-2 h-2 rounded-full inline-block ${digitalLetter?.sentToRegistration ? 'bg-green-500' : digitalLetter ? 'bg-blue-500' : 'bg-amber-500'}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview gets SharedTabPanels base + submission-specific action cards appended */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <SharedTabPanels qualification={localQ} activeTab="overview" expandedPhase={expandedPhase} setExpandedPhase={setExpandedPhase} />

              {/* Submission-specific: SAQA registration letter action card */}
              <div className={`p-4 rounded-lg border-2 ${digitalLetter?.sentToRegistration ? 'bg-green-50 border-green-200' : digitalLetter ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className={`w-5 h-5 ${digitalLetter?.sentToRegistration ? 'text-green-600' : digitalLetter ? 'text-blue-600' : 'text-amber-600'}`} />
                    <p className="font-medium text-sm">SAQA Registration Letter</p>
                  </div>
                  {!digitalLetter && <button onClick={() => setActiveTab('saqa_letter')} className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">Create Now</button>}
                  {digitalLetter && !digitalLetter.sentToRegistration && <button onClick={() => setActiveTab('saqa_letter')} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">View / Send</button>}
                </div>
                {digitalLetter ? (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Created: </span><span className="font-medium">{new Date(digitalLetter.createdDate).toLocaleDateString()}</span>
                    {digitalLetter.sentToRegistration && <span className="ml-4 text-green-700 font-medium">✓ Sent to Registration on {digitalLetter.sentDate ? new Date(digitalLetter.sentDate).toLocaleDateString() : '—'}</span>}
                  </div>
                ) : <p className="text-xs text-amber-700 mt-1">Create the digital SAQA registration letter to unlock the Qualification Registration section.</p>}
              </div>

              {digitalLetter?.sentToRegistration && (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 flex items-center justify-between">
                  <div><p className="font-semibold text-indigo-800">Letter sent to Qualification Registration</p><p className="text-sm text-indigo-600 mt-0.5">The registration details are available in the Registration tab.</p></div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">Completed</span>
                </div>
              )}
            </div>
          )}

          {/* Shared read-only panels for other tabs */}
          {['phases', 'checklist', 'resolution_letter', 'approval'].includes(activeTab) && (
            <SharedTabPanels qualification={localQ} activeTab={activeTab} expandedPhase={expandedPhase} setExpandedPhase={setExpandedPhase} />
          )}

          {/* ── SAQA REGISTRATION LETTER (digital form) ── */}
          {activeTab === 'saqa_letter' && (
            <div className="space-y-5">
              {localQ.digitalSaqaLetter?.sentToRegistration ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800">Letter sent to Qualification Registration</p>
                      <p className="text-sm text-green-700">Sent on {localQ.digitalSaqaLetter!.sentDate ? new Date(localQ.digitalSaqaLetter!.sentDate).toLocaleDateString() : '—'}.</p>
                    </div>
                  </div>
                  <SaqaLetterPreview letter={localQ.digitalSaqaLetter!} />
                </div>
              ) : digitalLetter && !isEditingLetter ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-blue-800">Letter saved — ready to send to Registration</p>
                      <p className="text-sm text-blue-600 mt-0.5">Review the letter below, then send it to unlock the Qualification Registration section.</p>
                    </div>
                    <button onClick={() => onSendToRegistration(localQ)}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium whitespace-nowrap ml-4">
                      <Send className="w-4 h-4" />Send to Registration
                    </button>
                  </div>
                  <SaqaLetterPreview letter={digitalLetter} />
                  <div className="flex justify-end">
                    <button onClick={() => setIsEditingLetter(true)}
                      className="text-sm text-blue-600 hover:underline">Edit letter</button>
                  </div>
                </div>
              ) : (
                <SaqaLetterForm
                  qualification={localQ}
                  existingLetter={digitalLetter ?? undefined}
                  onSave={(letter) => { handleSaveAndSync(localQ, letter); setIsEditingLetter(false); }}
                />
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED READ-ONLY TAB PANELS
// Used identically in Submission Package, Registration, and Registered modals
// ─────────────────────────────────────────────────────────────────────────────

interface SharedTabPanelsProps {
  qualification: ApprovalQualification;
  activeTab: string;
  expandedPhase: string | null;
  setExpandedPhase: (v: string | null) => void;
}

function SharedTabPanels({ qualification, activeTab, expandedPhase, setExpandedPhase }: SharedTabPanelsProps) {
  const roleOrder = ['Deputy Director', 'Director', 'Chief Director', 'CEO'];

  const getInternalPhases = () => {
    try { const plans = JSON.parse(localStorage.getItem('internalCyclePlans') || '[]'); return plans.find((p: any) => p.qualificationCode === qualification.qualificationCode)?.phases || []; } catch { return []; }
  };
  const getPhaseReports = () => {
    try { return JSON.parse(localStorage.getItem('submittedPhaseReports') || '[]').filter((r: any) => r.qualificationCode === qualification.qualificationCode); } catch { return []; }
  };
  const getResolutionProject = () => {
    try { return JSON.parse(localStorage.getItem('resolutionProjects') || '[]').find((p: any) => p.qualificationCode === qualification.qualificationCode) || null; } catch { return null; }
  };

  const phases = getInternalPhases();
  const phaseReports = getPhaseReports();
  const resolutionProject = getResolutionProject();
  const checklists = resolutionProject?.checklists || [];
  const requiredTotal = checklists.filter((c: any) => c.required).length;
  const completedRequired = checklists.filter((c: any) => c.required && c.completed).length;
  const resDoc = qualification.resolutionDocument;
  const dl = qualification.digitalSaqaLetter;

  const getReportForPhase = (phaseName: string) => {
    const fromReports = phaseReports.find((r: any) => r.phaseName === phaseName);
    if (fromReports?.reportData) return fromReports.reportData;
    return phases.find((p: any) => p.name === phaseName)?.reportData || null;
  };

  if (activeTab === 'overview') return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide">Qualification Information</h4>
          <div className="space-y-2 text-sm">
            {[['Code', qualification.qualificationCode], ['NQF Level', `Level ${qualification.nqfLevel}`], ['Credits', `${qualification.credits}`], ['Submitted By', qualification.submittedBy], ['Submitted Date', qualification.submittedDate]].map(([l, v]) => (
              <div key={l} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-medium">{v}</span></div>
            ))}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide">Approval Chain</h4>
          <div className="space-y-1.5">
            {roleOrder.map((role, index) => {
              const isCompleted = qualification.currentApprovalLevel > index;
              const rec = qualification.recommendations?.find(r => r.role === role);
              return (
                <div key={role} className={`flex items-center gap-2 p-2 rounded text-xs ${isCompleted ? 'bg-green-50 text-green-700' : 'bg-white text-gray-400 border'}`}>
                  {isCompleted ? <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0" />}
                  <span className="flex-1 font-medium">{role}</span>
                  {rec && <span>{new Date(rec.date).toLocaleDateString()}</span>}
                </div>
              );
            })}
          </div>
          {qualification.currentApprovalLevel === 4 && (
            <div className="mt-2 flex items-center gap-2 bg-green-100 rounded px-3 py-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700">All 4 levels approved</span>
            </div>
          )}
        </div>
      </div>
      {qualification.saqaLetter && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1"><Send className="w-4 h-4 text-green-600" /><p className="font-medium text-green-800 text-sm">SAQA Recommendation Letter Sent</p></div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Sent By: </span><span className="font-medium">{qualification.saqaLetter.sentBy}</span></div>
            <div><span className="text-gray-500">To: </span><span className="font-medium">{qualification.saqaLetter.recipientName}</span></div>
            <div><span className="text-gray-500">Date: </span><span className="font-medium">{new Date(qualification.saqaLetter.sentDate).toLocaleDateString()}</span></div>
          </div>
        </div>
      )}
      {dl && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-blue-600" /><p className="font-medium text-blue-800 text-sm">SAQA Registration Letter {dl.sentToRegistration ? '· Sent to Registration' : '· Draft'}</p></div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Committee Date: </span><span className="font-medium">{dl.committeeDate}</span></div>
            <div><span className="text-gray-500">Signed By: </span><span className="font-medium">{dl.signedBy}</span></div>
            <div><span className="text-gray-500">Qualifications: </span><span className="font-medium">{dl.rows.length}</span></div>
          </div>
        </div>
      )}
      {resDoc && (
        <div className={`p-4 rounded-lg border ${resDoc.type === 'rejection' ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'}`}>
          <div className="flex items-center gap-2 mb-1"><FileSignature className={`w-4 h-4 ${resDoc.type === 'rejection' ? 'text-red-600' : 'text-purple-600'}`} /><p className="font-medium text-sm">Resolution Document Attached</p></div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><span className="text-gray-500">Number: </span><span className="font-medium">{resDoc.resolutionNumber || resDoc.letterNumber || '—'}</span></div>
            <div><span className="text-gray-500">Date: </span><span className="font-medium">{resDoc.issueDate || '—'}</span></div>
            <div><span className="text-gray-500">Signed By: </span><span className="font-medium">{resDoc.signedBy || '—'}</span></div>
          </div>
        </div>
      )}
      {phases.length > 0 && (
        <div className="bg-gray-50 rounded-lg border p-4">
          <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide flex items-center gap-2"><FileText className="w-4 h-4" />Development Phases</h4>
          <div className="grid grid-cols-2 gap-2">
            {phases.map((phase: any, i: number) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded border text-xs ${phase.approved ? 'bg-green-50 border-green-200' : phase.reportSubmitted ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                {phase.approved ? <CheckCircle className="w-4 h-4 text-green-500" /> : phase.reportSubmitted ? <Clock className="w-4 h-4 text-yellow-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
                <span className="flex-1">{phase.name}</span>
                {phase.approved && <span className="text-green-600 font-medium">Approved</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (activeTab === 'phases') return (
    <div className="space-y-3">
      {phases.length === 0 && <div className="text-center py-12 text-gray-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">No phase data found</p></div>}
      {phases.map((phase: any, idx: number) => {
        const isExpanded = expandedPhase === phase.name;
        const reportData = getReportForPhase(phase.name);
        return (
          <div key={idx} className="border rounded-lg overflow-hidden">
            <button onClick={() => setExpandedPhase(isExpanded ? null : phase.name)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                {phase.approved ? <CheckCircle className="w-5 h-5 text-green-500" /> : phase.reportSubmitted ? <Clock className="w-5 h-5 text-yellow-500" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                <div className="text-left"><p className="font-medium text-sm">{phase.name}</p><p className="text-xs text-gray-500">{phase.approved ? 'Approved' : phase.reportSubmitted ? 'Submitted' : 'Not submitted'}</p></div>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {isExpanded && <div className="p-4 border-t bg-white">{reportData ? <PhaseReportView phaseName={phase.name} reportData={reportData} /> : <p className="text-sm text-gray-400 italic text-center py-4">No report data.</p>}</div>}
          </div>
        );
      })}
    </div>
  );

  if (activeTab === 'checklist') return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h4 className="font-medium">Resolution Checklist</h4>{requiredTotal > 0 && <span className="text-sm text-gray-500">Required: {completedRequired}/{requiredTotal}</span>}</div>
      {checklists.length === 0 ? (
        <div className="text-center py-12 text-gray-400"><ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No checklist data available</p></div>
      ) : (
        <div className="space-y-2">
          {checklists.map((item: any) => (
            <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border ${item.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="mt-0.5">{item.completed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}</div>
              <div className="flex-1"><p className="text-sm font-medium">{item.item}{item.required && <span className="text-red-500 ml-1">*</span>}</p>{item.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{item.notes}</p>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (activeTab === 'resolution_letter') return (
    <div className="space-y-5">
      {!resDoc ? (
        <div className="text-center py-12 text-gray-400"><FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">No resolution document attached</p></div>
      ) : (
        <div className={`rounded-xl border-2 p-5 ${resDoc.type === 'rejection' ? 'bg-red-50 border-red-200' : 'bg-purple-50 border-purple-200'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${resDoc.type === 'rejection' ? 'bg-red-100' : 'bg-purple-100'}`}><FileText className={`w-6 h-6 ${resDoc.type === 'rejection' ? 'text-red-600' : 'text-purple-600'}`} /></div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2">{resDoc.fileName || 'Resolution Letter'}</h4>
              {resDoc.type && <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-3 ${resDoc.type === 'rejection' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{resDoc.type === 'rejection' ? 'Rejection Resolution' : 'Approval Resolution'}</span>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-gray-500 block uppercase font-semibold mb-0.5">Number</span><span className="font-medium">{resDoc.resolutionNumber || resDoc.letterNumber || '—'}</span></div>
                <div><span className="text-xs text-gray-500 block uppercase font-semibold mb-0.5">Issue Date</span><span className="font-medium">{resDoc.issueDate || '—'}</span></div>
                <div><span className="text-xs text-gray-500 block uppercase font-semibold mb-0.5">Signed By</span><span className="font-medium">{resDoc.signedBy || '—'}</span></div>
                {resDoc.recipientName && <div><span className="text-xs text-gray-500 block uppercase font-semibold mb-0.5">Addressed To</span><span className="font-medium">{resDoc.recipientName}</span></div>}
              </div>
            </div>
          </div>
          {resDoc.notes && <div className="mt-4 pt-4 border-t"><RTA label="Notes" value={resDoc.notes} /></div>}
        </div>
      )}
    </div>
  );

  if (activeTab === 'approval') return (
    <div className="space-y-4">
      <h4 className="font-medium">Full Approval Chain (Read-Only)</h4>
      <div className="space-y-3">
        {roleOrder.map((role, index) => {
          const isCompleted = qualification.currentApprovalLevel > index;
          const rec = qualification.recommendations?.find(r => r.role === role);
          return (
            <div key={role} className={`flex items-center justify-between p-4 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}>{index + 1}</div>
                <div>
                  <p className="font-medium">{role}</p>
                  {rec ? <><p className="text-xs text-gray-500">Recommended on {new Date(rec.date).toLocaleDateString()}</p>{rec.comments && <p className="text-xs text-gray-400 italic mt-0.5">"{rec.comments}"</p>}</> : <p className="text-xs text-gray-400 italic">Pending</p>}
                </div>
              </div>
              {isCompleted ? <CheckCircle className="w-6 h-6 text-green-500 shrink-0" /> : <Clock className="w-6 h-6 text-gray-300 shrink-0" />}
            </div>
          );
        })}
      </div>
      {qualification.saqaLetter && (
        <div className="mt-2 bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Send className="w-4 h-4 text-green-600" /><p className="font-semibold text-green-800 text-sm">SAQA Recommendation Letter</p></div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-xs text-gray-500 uppercase font-semibold block mb-0.5">Sent By</span><span className="font-medium">{qualification.saqaLetter.sentBy}</span></div>
            <div><span className="text-xs text-gray-500 uppercase font-semibold block mb-0.5">Sent To</span><span className="font-medium">{qualification.saqaLetter.recipientName}</span></div>
            <div><span className="text-xs text-gray-500 uppercase font-semibold block mb-0.5">Ref No.</span><span className="font-medium">{qualification.saqaLetter.letterNumber || '—'}</span></div>
            <div><span className="text-xs text-gray-500 uppercase font-semibold block mb-0.5">Date</span><span className="font-medium">{new Date(qualification.saqaLetter.sentDate).toLocaleDateString()}</span></div>
          </div>
        </div>
      )}
    </div>
  );

  if (activeTab === 'saqa_letter') return (
    <div className="space-y-4">
      {!dl ? (
        <div className="text-center py-12 text-gray-400"><Shield className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">No SAQA registration letter created yet</p></div>
      ) : (
        <>
          <div className={`rounded-lg p-3 flex items-center gap-2 ${dl.sentToRegistration ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
            <CheckCircle className={`w-4 h-4 shrink-0 ${dl.sentToRegistration ? 'text-green-600' : 'text-blue-600'}`} />
            <p className="text-xs font-medium">
              {dl.sentToRegistration
                ? `Letter sent to Qualification Registration on ${dl.sentDate ? new Date(dl.sentDate).toLocaleDateString() : '—'}`
                : `Letter saved on ${new Date(dl.createdDate).toLocaleDateString()} — not yet sent to Registration`}
            </p>
          </div>
          <SaqaLetterPreview letter={dl} />
        </>
      )}
    </div>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUALIFICATION REGISTRATION MODAL
// All shared tabs + Registration Details + Notify QP
// ─────────────────────────────────────────────────────────────────────────────

interface RegistrationModalProps {
  qualification: ApprovalQualification;
  onClose: () => void;
  onRegisterAndNotify: (q: ApprovalQualification, regData: any, notification: any) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

function RegistrationModal({ qualification, onClose, onRegisterAndNotify, getStatusBadge }: RegistrationModalProps) {
  const dl = qualification.digitalSaqaLetter;
  const row = dl?.rows.find(r => r.qualificationTitle.toLowerCase().includes(qualification.qualificationTitle.toLowerCase().split(':')[0])) || dl?.rows[0];

  type RegTab = 'overview' | 'phases' | 'checklist' | 'resolution_letter' | 'approval' | 'saqa_letter' | 'registration' | 'notify_qp';
  const [activeTab, setActiveTab] = useState<RegTab>('overview');
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const [regData, setRegData] = useState({
    saqaId: row?.saqaId || '',
    registrationNumber: '',
    nqfLevel: row?.nqfLevel || `Level ${qualification.nqfLevel}`,
    minCredits: row?.minCredits || `${qualification.credits}`,
    registrationDate: '',
    expiryDate: '',
    accreditingBody: 'QCTO',
  });

  const [notification, setNotification] = useState({
    recipientName: qualification.submittedBy || '',
    recipientEmail: '',
    subject: `Qualification Registration Confirmed: ${qualification.qualificationTitle}`,
    message: `Dear ${qualification.submittedBy || 'Qualification Partner'},\n\nWe are pleased to inform you that the following qualification has been successfully registered on the National Qualifications Framework (NQF) by SAQA.\n\nQualification: ${qualification.qualificationTitle}\nCode: ${qualification.qualificationCode}\nSAQA ID: ${row?.saqaId || '[See details]'}\nNQF Level: ${row?.nqfLevel || qualification.nqfLevel}\nMin Credits: ${row?.minCredits || qualification.credits}\n\nThis qualification is now active on the OQSF. Should you require any further information, please do not hesitate to contact us.\n\nKind regards,\nQCTO: Occupational Qualifications Management\nTel: 012 003 1800\nwww.qcto.org.za`,
  });

  const checklists = (() => { try { return JSON.parse(localStorage.getItem('resolutionProjects') || '[]').find((p: any) => p.qualificationCode === qualification.qualificationCode)?.checklists || []; } catch { return []; } })();
  const requiredTotal = checklists.filter((c: any) => c.required).length;
  const completedRequired = checklists.filter((c: any) => c.required && c.completed).length;

  const isRegComplete = !!(regData.saqaId && regData.registrationDate && regData.expiryDate);
  const isNotifComplete = !!(notification.recipientName && notification.recipientEmail && notification.message);

  const tabs: { key: RegTab; label: string; Icon: any; badge?: string }[] = [
    { key: 'overview', label: 'Overview', Icon: Award },
    { key: 'phases', label: 'Phase Reports', Icon: FileText },
    { key: 'checklist', label: 'Checklist', Icon: ClipboardList },
    { key: 'resolution_letter', label: 'Resolution Letter', Icon: FileSignature },
    { key: 'approval', label: 'Approval Chain', Icon: ThumbsUp },
    { key: 'saqa_letter', label: 'SAQA Reg. Letter', Icon: Shield },
    { key: 'registration', label: 'Registration Details', Icon: UserCheck, badge: isRegComplete ? 'done' : 'action' },
    { key: 'notify_qp', label: 'Notify QP', Icon: Bell, badge: isNotifComplete ? 'done' : 'action' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-teal-50 to-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-lg font-semibold">{qualification.qualificationTitle}</h3>
              <p className="text-sm text-gray-500">Code: {qualification.qualificationCode} · Qualification Registration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(qualification.status)}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b bg-white">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(({ key, label, Icon, badge }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === key ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-4 h-4" />{label}
                {key === 'checklist' && requiredTotal > 0 && (
                  <span className={`ml-1 text-xs px-1.5 rounded-full ${completedRequired === requiredTotal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{completedRequired}/{requiredTotal}</span>
                )}
                {key === 'saqa_letter' && dl && (
                  <span className={`ml-1 w-2 h-2 rounded-full inline-block ${dl.sentToRegistration ? 'bg-green-500' : 'bg-blue-500'}`} />
                )}
                {badge === 'done' && <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />}
                {badge === 'action' && !['registration', 'notify_qp'].includes(key) && <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 inline-block" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Shared read-only tabs */}
          {['overview', 'phases', 'checklist', 'resolution_letter', 'approval', 'saqa_letter'].includes(activeTab) && (
            <SharedTabPanels
              qualification={qualification}
              activeTab={activeTab}
              expandedPhase={expandedPhase}
              setExpandedPhase={setExpandedPhase}
            />
          )}

          {/* Registration Details */}
          {activeTab === 'registration' && (
            <div className="space-y-5">
              {dl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-700">Details pre-populated from the SAQA registration letter. Review and confirm before notifying the QP.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">SAQA ID *</label>
                  <input type="text" value={regData.saqaId} onChange={e => setRegData(p => ({ ...p, saqaId: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Registration Number</label>
                  <input type="text" value={regData.registrationNumber} onChange={e => setRegData(p => ({ ...p, registrationNumber: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none"
                    placeholder="e.g. QCTO-REG-2024-001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">NQF Level</label>
                  <input type="text" value={regData.nqfLevel} onChange={e => setRegData(p => ({ ...p, nqfLevel: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Min Credits</label>
                  <input type="text" value={regData.minCredits} onChange={e => setRegData(p => ({ ...p, minCredits: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Registration Date *</label>
                  <input type="date" value={regData.registrationDate} onChange={e => setRegData(p => ({ ...p, registrationDate: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Expiry Date *</label>
                  <input type="date" value={regData.expiryDate} onChange={e => setRegData(p => ({ ...p, expiryDate: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Accrediting Body</label>
                  <select value={regData.accreditingBody} onChange={e => setRegData(p => ({ ...p, accreditingBody: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none">
                    <option value="QCTO">QCTO</option><option value="CHE">CHE</option><option value="SAQA">SAQA</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setActiveTab('notify_qp')} disabled={!isRegComplete}
                  className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium">
                  Next: Notify QP <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Notify QP */}
          {activeTab === 'notify_qp' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Send Registration Confirmation to QP</p>
                  <p className="text-sm text-amber-700 mt-1">Once sent, the qualification moves to <strong>Registered Qualifications</strong> and the process is finalised.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Recipient Name *</label>
                  <input type="text" value={notification.recipientName} onChange={e => setNotification(p => ({ ...p, recipientName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none" placeholder="QP Contact Name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Recipient Email *</label>
                  <input type="email" value={notification.recipientEmail} onChange={e => setNotification(p => ({ ...p, recipientEmail: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none" placeholder="qp@organisation.co.za" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Subject</label>
                <input type="text" value={notification.subject} onChange={e => setNotification(p => ({ ...p, subject: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Message *</label>
                <textarea value={notification.message} onChange={e => setNotification(p => ({ ...p, message: e.target.value }))}
                  rows={9} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-300 outline-none resize-none font-mono text-xs" />
              </div>
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3">Registration Summary</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-400">SAQA ID:</span> <span className="font-medium">{regData.saqaId || '—'}</span></div>
                  <div><span className="text-gray-400">Reg No.:</span> <span className="font-medium">{regData.registrationNumber || '—'}</span></div>
                  <div><span className="text-gray-400">NQF Level:</span> <span className="font-medium">{regData.nqfLevel}</span></div>
                  <div><span className="text-gray-400">Min Credits:</span> <span className="font-medium">{regData.minCredits}</span></div>
                  <div><span className="text-gray-400">Reg Date:</span> <span className="font-medium">{regData.registrationDate || '—'}</span></div>
                  <div><span className="text-gray-400">Expiry:</span> <span className="font-medium">{regData.expiryDate || '—'}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Cancel</button>
          {activeTab === 'notify_qp' && (
            <button disabled={!isRegComplete || !isNotifComplete}
              onClick={() => onRegisterAndNotify(qualification, regData, notification)}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2 font-medium">
              <Send className="w-4 h-4" />Send Notification &amp; Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTERED QUALIFICATION DETAIL MODAL
// All shared tabs + Registration Record + QP Notification tabs
// ─────────────────────────────────────────────────────────────────────────────

interface RegisteredDetailModalProps {
  registered: RegisteredQualification;
  onClose: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

function RegisteredDetailModal({ registered, onClose, getStatusBadge }: RegisteredDetailModalProps) {
  const qualification = registered.approvalQualificationData;
  const qpNotif = qualification?.qpNotification;

  type RegDetailTab = 'overview' | 'phases' | 'checklist' | 'resolution_letter' | 'approval' | 'saqa_letter' | 'registration_record' | 'qp_notification';
  const [activeTab, setActiveTab] = useState<RegDetailTab>('registration_record');
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const checklists = (() => { try { return JSON.parse(localStorage.getItem('resolutionProjects') || '[]').find((p: any) => p.qualificationCode === registered.qualificationCode)?.checklists || []; } catch { return []; } })();
  const requiredTotal = checklists.filter((c: any) => c.required).length;
  const completedRequired = checklists.filter((c: any) => c.required && c.completed).length;
  const dl = qualification?.digitalSaqaLetter;

  const tabs: { key: RegDetailTab; label: string; Icon: any }[] = [
    { key: 'registration_record', label: 'Registration Record', Icon: Award },
    { key: 'qp_notification', label: 'QP Notification', Icon: Bell },
    { key: 'saqa_letter', label: 'SAQA Reg. Letter', Icon: Shield },
    { key: 'overview', label: 'Overview', Icon: FileText },
    { key: 'phases', label: 'Phase Reports', Icon: ClipboardList },
    { key: 'checklist', label: 'Checklist', Icon: CheckSquare },
    { key: 'resolution_letter', label: 'Resolution Letter', Icon: FileSignature },
    { key: 'approval', label: 'Approval Chain', Icon: ThumbsUp },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold">{registered.qualificationTitle}</h3>
              <p className="text-sm text-gray-500">Code: {registered.qualificationCode} · Registered Qualification</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />Active</span>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b bg-white">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === key ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-4 h-4" />{label}
                {key === 'checklist' && requiredTotal > 0 && (
                  <span className={`ml-1 text-xs px-1.5 rounded-full ${completedRequired === requiredTotal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{completedRequired}/{requiredTotal}</span>
                )}
                {key === 'saqa_letter' && dl && <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />}
                {key === 'qp_notification' && qpNotif && <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Registration Record */}
          {activeTab === 'registration_record' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide">Registration Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><p className="text-xs text-gray-500">SAQA ID</p><p className="font-mono font-semibold text-gray-900">{registered.saqaId}</p></div>
                    <div><p className="text-xs text-gray-500">Registration Number</p><p className="font-mono">{registered.registrationNumber || '—'}</p></div>
                    <div><p className="text-xs text-gray-500">NQF Level</p><p className="font-medium">Level {registered.nqfLevel}</p></div>
                    <div><p className="text-xs text-gray-500">Min Credits</p><p className="font-medium">{registered.credits}</p></div>
                    <div><p className="text-xs text-gray-500">Accrediting Body</p><p className="font-medium">{qualification?.registrationDetails?.accreditingBody || 'QCTO'}</p></div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide">Dates</h4>
                  <div className="space-y-2 text-sm">
                    <div><p className="text-xs text-gray-500">Registration Date</p><p className="font-medium">{registered.registrationDate}</p></div>
                    <div><p className="text-xs text-gray-500">Expiry Date</p><p className="font-medium">{registered.expiryDate}</p></div>
                    <div><p className="text-xs text-gray-500">Last Updated</p><p className="font-medium">{new Date(registered.lastUpdated).toLocaleDateString()}</p></div>
                    <div><p className="text-xs text-gray-500">Total Enrollments</p><p className="font-medium">{registered.totalEnrollments}</p></div>
                    <div><p className="text-xs text-gray-500">Provider</p><p className="font-medium">{registered.provider}</p></div>
                  </div>
                </div>
              </div>
              {/* Quick status of all phases */}
              {qualification && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Approval Levels', value: `${qualification.currentApprovalLevel}/4 complete`, ok: qualification.currentApprovalLevel === 4 },
                    { label: 'SAQA Rec. Letter', value: qualification.saqaLetter ? 'Sent' : 'Not sent', ok: !!qualification.saqaLetter },
                    { label: 'SAQA Reg. Letter', value: qualification.digitalSaqaLetter ? 'Created' : 'Not created', ok: !!qualification.digitalSaqaLetter },
                  ].map(({ label, value, ok }) => (
                    <div key={label} className={`p-3 rounded-lg border text-sm ${ok ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <div className="flex items-center gap-1.5">
                        {ok ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-gray-400" />}
                        <p className={`font-medium ${ok ? 'text-green-700' : 'text-gray-500'}`}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QP Notification */}
          {activeTab === 'qp_notification' && (
            <div className="space-y-4">
              {!qpNotif ? (
                <div className="text-center py-12 text-gray-400"><Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="font-medium">No QP notification on record</p></div>
              ) : (
                <>
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-100 rounded-lg shrink-0"><Send className="w-6 h-6 text-green-600" /></div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-800 mb-1">Notification Sent to QP</p>
                        <p className="text-xs text-green-600 mb-3">Sent on {new Date(qpNotif.sentDate).toLocaleDateString()}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-xs text-gray-500 block uppercase font-semibold mb-0.5">Recipient</span><span className="font-medium">{qpNotif.recipientName}</span></div>
                          <div><span className="text-xs text-gray-500 block uppercase font-semibold mb-0.5">Email</span><span className="font-medium">{qpNotif.recipientEmail}</span></div>
                          <div className="col-span-2"><span className="text-xs text-gray-500 block uppercase font-semibold mb-0.5">Subject</span><span className="font-medium">{qpNotif.subject}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3">Message Sent</h4>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{qpNotif.message}</pre>
                  </div>
                </>
              )}
            </div>
          )}

          {/* All shared read-only tabs — reuse the same component */}
          {qualification && ['overview', 'phases', 'checklist', 'resolution_letter', 'approval', 'saqa_letter'].includes(activeTab) && (
            <SharedTabPanels
              qualification={qualification}
              activeTab={activeTab}
              expandedPhase={expandedPhase}
              setExpandedPhase={setExpandedPhase}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

// Defined outside component so lazy useState initializers can safely reference it
const loadAndFilterApprovals = (raw: any[]): ApprovalQualification[] =>
  raw.filter((q: any) => VALID_APPROVAL_STATUSES.includes(q.status));

function loadApprovalQualifications(): ApprovalQualification[] {
  try {
    const stored = localStorage.getItem('approvalQualifications');
    return stored ? loadAndFilterApprovals(JSON.parse(stored)) : [];
  } catch { return []; }
}

function loadRegisteredQualifications(): RegisteredQualification[] {
  try {
    const stored = localStorage.getItem('registeredQualifications');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export default function QualificationsApprovalPhase() {
  const [activeTab, setActiveTab] = useState<'resolution' | 'submission' | 'registration' | 'registered'>('resolution');
  const [selectedQualification, setSelectedQualification] = useState<ApprovalQualification | null>(null);
  const [selectedRegisteredQualification, setSelectedRegisteredQualification] = useState<RegisteredQualification | null>(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isRegisteredModalOpen, setIsRegisteredModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const loadAndFilter = loadAndFilterApprovals;

  const [approvalQualifications, setApprovalQualifications] = useState<ApprovalQualification[]>(loadApprovalQualifications);
  const [registeredQualifications, setRegisteredQualifications] = useState<RegisteredQualification[]>(loadRegisteredQualifications);

  useEffect(() => {
    setApprovalQualifications(loadApprovalQualifications());
    setRegisteredQualifications(loadRegisteredQualifications());
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'approvalQualifications' && e.newValue) setApprovalQualifications(loadAndFilter(JSON.parse(e.newValue)));
      if (e.key === 'registeredQualifications' && e.newValue) setRegisteredQualifications(JSON.parse(e.newValue));
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const slimForStorage = (q: ApprovalQualification): any => ({
    id: q.id,
    qualificationCode: q.qualificationCode,
    qualificationTitle: q.qualificationTitle,
    nqfLevel: q.nqfLevel,
    credits: q.credits,
    submittedBy: q.submittedBy,
    submittedDate: q.submittedDate,
    status: q.status,
    currentApprovalLevel: q.currentApprovalLevel,
    movedToApprovalDate: q.movedToApprovalDate,
    recommendations: (q.recommendations || []).map(r => ({
      role: r.role,
      name: r.name,
      recommended: r.recommended,
      date: r.date,
      comments: (r.comments || '').slice(0, 200),
    })),
    resolutionDocument: q.resolutionDocument ? {
      resolutionNumber: q.resolutionDocument.resolutionNumber,
      letterNumber: q.resolutionDocument.letterNumber,
      issueDate: q.resolutionDocument.issueDate,
      signedBy: q.resolutionDocument.signedBy,
      type: q.resolutionDocument.type,
      recipientName: q.resolutionDocument.recipientName,
    } : undefined,
    saqaLetter: q.saqaLetter ? {
      fileName: q.saqaLetter.fileName,
      sentDate: q.saqaLetter.sentDate,
      sentBy: q.saqaLetter.sentBy,
      letterNumber: q.saqaLetter.letterNumber,
      recipientName: q.saqaLetter.recipientName,
    } : undefined,
    digitalSaqaLetter: q.digitalSaqaLetter,
    registrationDetails: q.registrationDetails,
    qpNotification: q.qpNotification ? {
      sentDate: q.qpNotification.sentDate,
      sentBy: q.qpNotification.sentBy,
      recipientName: q.qpNotification.recipientName,
      recipientEmail: q.qpNotification.recipientEmail,
      subject: q.qpNotification.subject,
      message: (q.qpNotification.message || '').slice(0, 300),
    } : undefined,
  });

  const saveApprovals = (list: ApprovalQualification[]) => {
    setApprovalQualifications(list);
    try {
      localStorage.setItem('approvalQualifications', JSON.stringify(list.map(slimForStorage)));
    } catch (e) {
      console.error('localStorage quota exceeded saving approvals:', e);
    }
  };

  const getFreshApprovals = (): ApprovalQualification[] => {
    try {
      const raw = localStorage.getItem('approvalQualifications');
      return raw ? loadAndFilter(JSON.parse(raw)) : approvalQualifications;
    } catch {
      return approvalQualifications;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      pending_review: <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />Pending Review</span>,
      under_review: <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Eye className="w-3 h-3" />Under Review</span>,
      recommended: <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"><ThumbsUp className="w-3 h-3" />Recommended</span>,
      approved: <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</span>,
      approved_for_registration: <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" />Ready for Registration</span>,
      registered: <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center gap-1"><Award className="w-3 h-3" />Registered</span>,
    };
    return badges[status] || <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
  };

  // ── Handlers ──

  const handleRecommend = (role: string, comments: string) => {
    if (!selectedQualification) return;
    const newRec: ApprovalRecommendation = { role: role as any, name: `User ${selectedQualification.currentApprovalLevel + 1}`, recommended: true, date: new Date().toISOString(), comments };
    const newLevel = selectedQualification.currentApprovalLevel + 1;
    const newStatus: ApprovalQualification['status'] = newLevel === 4 ? 'approved' : 'under_review';
    const updated: ApprovalQualification = { ...selectedQualification, recommendations: [...(selectedQualification.recommendations || []), newRec], currentApprovalLevel: newLevel, status: newStatus };
    const updatedAll = approvalQualifications.map(q => q.id === updated.id ? updated : q);
    saveApprovals(updatedAll);
    setSelectedQualification(updated);
  };

  const handleMoveToSubmission = (qualification: ApprovalQualification) => {
    const updatedAll = approvalQualifications.map(q => q.id === qualification.id ? { ...q, status: 'approved' as const } : q);
    saveApprovals(updatedAll);
    setIsResolutionModalOpen(false);
    setActiveTab('submission');
  };

  const handleSendToSaqa = (qualification: ApprovalQualification, letterData: any) => {
    const updated = { ...qualification, saqaLetter: letterData };
    const updatedAll = approvalQualifications.map(q => q.id === qualification.id ? updated : q);
    saveApprovals(updatedAll);
    setSelectedQualification(updated);
  };

  const handleSaveDigitalLetter = (qualification: ApprovalQualification, letter: DigitalSaqaLetter) => {
    const updated = { ...qualification, digitalSaqaLetter: letter };
    try {
      const raw = localStorage.getItem('approvalQualifications');
      const list: ApprovalQualification[] = raw ? JSON.parse(raw) : [];
      const exists = list.some(q => q.id === qualification.id);
      const merged = exists
        ? list.map(q => q.id === qualification.id ? { ...q, digitalSaqaLetter: letter } : q)
        : [...list, updated];
      localStorage.setItem('approvalQualifications', JSON.stringify(merged.map(slimForStorage)));
      setApprovalQualifications(loadAndFilter(merged));
    } catch (e) {
      console.error('Failed to save digital letter:', e);
    }
    setSelectedQualification(updated);
  };

  const handleSendToRegistration = (qualification: ApprovalQualification) => {
    try {
      const raw = localStorage.getItem('approvalQualifications');
      const list: ApprovalQualification[] = raw ? JSON.parse(raw) : [];
      const freshQ = list.find(q => q.id === qualification.id) || qualification;
      const letter = freshQ.digitalSaqaLetter || qualification.digitalSaqaLetter;
      if (!letter) {
        alert('Please save the SAQA registration letter first before sending to Registration.');
        return;
      }
      const updatedLetter: DigitalSaqaLetter = { ...letter, sentToRegistration: true, sentDate: new Date().toISOString() };
      const updated: ApprovalQualification = { ...freshQ, digitalSaqaLetter: updatedLetter, status: 'approved_for_registration' };
      const merged = list.map(q => q.id === qualification.id ? updated : q);
      localStorage.setItem('approvalQualifications', JSON.stringify(merged.map(slimForStorage)));
      setApprovalQualifications(loadAndFilter(merged));
      setSelectedQualification(updated);
      setIsSubmissionModalOpen(false);
      setActiveTab('registration');
    } catch (e) {
      console.error('Failed to send to registration:', e);
      alert('An error occurred. Please try again.');
    }
  };

  const handleRegisterAndNotify = (qualification: ApprovalQualification, regData: any, notification: any) => {
    const now = new Date().toISOString();

    // Build the fully updated qualification with registered status
    const updatedQual: ApprovalQualification = {
      ...qualification,
      status: 'registered',
      registrationDetails: {
        ...regData,
        registeredBy: 'Internal User',
        registrationDateComplete: now,
      },
      qpNotification: {
        sentDate: now,
        sentBy: 'Internal User',
        recipientName: notification.recipientName,
        recipientEmail: notification.recipientEmail,
        subject: notification.subject,
        message: notification.message,
      },
    };

    // Build the registration record with full details
    const newReg: RegisteredQualification = {
      id: qualification.id,
      qualificationCode: qualification.qualificationCode,
      qualificationTitle: qualification.qualificationTitle,
      nqfLevel: qualification.nqfLevel,
      credits: qualification.credits,
      registrationNumber: regData.registrationNumber || regData.saqaId,
      registrationDate: regData.registrationDate,
      expiryDate: regData.expiryDate,
      status: 'Active',
      saqaId: regData.saqaId,
      provider: qualification.submittedBy || 'Multiple Providers',
      totalEnrollments: 0,
      lastUpdated: now,
      approvalQualificationData: updatedQual,
    };

    // Read fresh lists directly from localStorage (avoids stale React state)
    const freshApprovals = getFreshApprovals();
    const freshRegistered = loadRegisteredQualifications();

    // Update approvals list with registered status
    const updatedApprovals = freshApprovals.map(q =>
      q.id === qualification.id ? updatedQual : q
    );

    // Update registered list — replace if exists, append if new
    const updatedRegistered = [
      ...freshRegistered.filter(r => r.id !== newReg.id),
      newReg,
    ];

    // ── ATOMIC WRITE: persist BOTH keys before updating React state ──
    // This ensures no re-render can see an inconsistent state where the
    // approval is still 'approved_for_registration' but registration record exists
    // (or vice versa), which caused the item to re-appear in the registration tab.

    // Write approvals first
    try {
      localStorage.setItem('approvalQualifications', JSON.stringify(updatedApprovals.map(slimForStorage)));
    } catch (e) {
      console.error('Failed to save approval qualifications:', e);
    }

    // Write registered with progressively slimmer payloads on quota error
    const saveRegistered = (list: RegisteredQualification[]) => {
      // Level 1: slim the embedded approvalQualificationData
      const slim1 = list.map(r => ({
        ...r,
        approvalQualificationData: slimForStorage(r.approvalQualificationData),
      }));
      try {
        localStorage.setItem('registeredQualifications', JSON.stringify(slim1));
        return true;
      } catch {}
      // Level 2: also strip digitalSaqaLetter rows content down to essentials
      const slim2 = slim1.map(r => ({
        ...r,
        approvalQualificationData: {
          ...r.approvalQualificationData,
          digitalSaqaLetter: r.approvalQualificationData?.digitalSaqaLetter ? {
            letterDate: r.approvalQualificationData.digitalSaqaLetter.letterDate,
            committeeDate: r.approvalQualificationData.digitalSaqaLetter.committeeDate,
            recipientName: r.approvalQualificationData.digitalSaqaLetter.recipientName,
            recipientTitle: r.approvalQualificationData.digitalSaqaLetter.recipientTitle,
            recipientOrganisation: r.approvalQualificationData.digitalSaqaLetter.recipientOrganisation,
            signedBy: r.approvalQualificationData.digitalSaqaLetter.signedBy,
            signedByTitle: r.approvalQualificationData.digitalSaqaLetter.signedByTitle,
            rows: r.approvalQualificationData.digitalSaqaLetter.rows,
            createdDate: r.approvalQualificationData.digitalSaqaLetter.createdDate,
            sentToRegistration: r.approvalQualificationData.digitalSaqaLetter.sentToRegistration,
            sentDate: r.approvalQualificationData.digitalSaqaLetter.sentDate,
          } : undefined,
        },
      }));
      try {
        localStorage.setItem('registeredQualifications', JSON.stringify(slim2));
        return true;
      } catch {}
      // Level 3: drop digitalSaqaLetter entirely, keep only registration identity fields
      const slim3 = list.map(r => ({
        id: r.id,
        qualificationCode: r.qualificationCode,
        qualificationTitle: r.qualificationTitle,
        nqfLevel: r.nqfLevel,
        credits: r.credits,
        registrationNumber: r.registrationNumber,
        registrationDate: r.registrationDate,
        expiryDate: r.expiryDate,
        status: r.status,
        saqaId: r.saqaId,
        provider: r.provider,
        totalEnrollments: r.totalEnrollments,
        lastUpdated: r.lastUpdated,
        approvalQualificationData: {
          id: r.approvalQualificationData?.id,
          qualificationCode: r.approvalQualificationData?.qualificationCode,
          qualificationTitle: r.approvalQualificationData?.qualificationTitle,
          nqfLevel: r.approvalQualificationData?.nqfLevel,
          credits: r.approvalQualificationData?.credits,
          status: r.approvalQualificationData?.status,
          currentApprovalLevel: r.approvalQualificationData?.currentApprovalLevel,
          qpNotification: r.approvalQualificationData?.qpNotification ? {
            sentDate: r.approvalQualificationData.qpNotification.sentDate,
            recipientName: r.approvalQualificationData.qpNotification.recipientName,
            recipientEmail: r.approvalQualificationData.qpNotification.recipientEmail,
            subject: r.approvalQualificationData.qpNotification.subject,
          } : undefined,
        },
      }));
      try {
        localStorage.setItem('registeredQualifications', JSON.stringify(slim3));
        return true;
      } catch (e) {
        console.error('localStorage quota exceeded even after maximum slimming:', e);
        return false;
      }
    };

    saveRegistered(updatedRegistered);

    // Now update React state in one batch — both states consistent with localStorage
    setApprovalQualifications(updatedApprovals);
    setRegisteredQualifications(updatedRegistered);

    // Update other dependent localStorage keys
    try {
      const publicQuals = localStorage.getItem('publicInputQualifications');
      if (publicQuals) {
        localStorage.setItem('publicInputQualifications', JSON.stringify(
          JSON.parse(publicQuals).map((q: any) => q.qualificationCode === qualification.qualificationCode ? { ...q, status: 'registered', registered: true } : q)
        ));
      }
    } catch (e) { console.error('Failed to update publicInputQualifications:', e); }

    try {
      const extSubs = localStorage.getItem('externalPublicSubmissions');
      if (extSubs) {
        const subs = JSON.parse(extSubs);
        const updated = subs.map((sub: any) =>
          sub.qualificationCode === qualification.qualificationCode
            ? { ...sub, status: 'addressed', response: `This qualification has been officially registered on the NQF. Registration Number: ${regData.registrationNumber || regData.saqaId}. Registration Date: ${regData.registrationDate}.`, responseDate: now }
            : sub
        );
        localStorage.setItem('externalPublicSubmissions', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Failed to update public submissions on registration:', e);
    }

    window.dispatchEvent(new CustomEvent('qualificationRegistered', {
      detail: {
        qualificationCode: qualification.qualificationCode,
        qualificationTitle: qualification.qualificationTitle,
        registrationNumber: regData.registrationNumber || regData.saqaId,
        registrationDate: regData.registrationDate,
      }
    }));

    setIsRegistrationModalOpen(false);
    setSelectedQualification(null);
    setActiveTab('registered');
    alert(`Qualification registered! Notification sent to ${notification.recipientEmail}.`);
  };

  // ── Derived lists ──
  const RESOLUTION_STATUSES = ['pending_review', 'under_review'];
  const resolutionList = approvalQualifications.filter(q => {
    if (!RESOLUTION_STATUSES.includes(q.status)) return false;
    if (searchTerm && !q.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) && !q.qualificationCode.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter && q.status !== statusFilter) return false;
    return true;
  });

  const submissionList = approvalQualifications.filter(q => q.status === 'approved');

  // FIX: exclude from registration list if status is 'registered' OR already in registeredQualifications
  const registeredIds = new Set(registeredQualifications.map(r => r.id));
  const registrationList = approvalQualifications.filter(q =>
    q.status === 'approved_for_registration' && !registeredIds.has(q.id)
  );

  // Deduplicate registeredQualifications by id before rendering
  const uniqueRegistered = registeredQualifications.filter(
    (q, idx, arr) => arr.findIndex(r => r.id === q.id) === idx
  );
  const filteredRegistered = uniqueRegistered.filter(q =>
    !searchTerm || q.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) || q.qualificationCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRecommendationStatus = (q: ApprovalQualification) => {
    const levels = ['Deputy Director', 'Director', 'Chief Director', 'CEO'];
    const lv = q.currentApprovalLevel;
    if (lv === 0) return 'Not Started';
    if (lv === 4) return 'All Levels Approved';
    return `${levels[lv - 1]} Completed`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Qualifications Approval Phase</h1>
        <p className="text-gray-500 mt-2">Manage the approval workflow for qualifications</p>
      </div>

      {/* ── Page Tabs ── */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {([
            { key: 'resolution', label: 'Resolution Review', Icon: FileSignature, count: resolutionList.length },
            { key: 'submission', label: 'Submission Package Approval', Icon: FolderOpen, count: submissionList.length },
            { key: 'registration', label: 'Qualification Registration', Icon: Shield, count: registrationList.length },
            { key: 'registered', label: 'Registered Qualifications', Icon: Award, count: uniqueRegistered.length },
          ] as const).map(({ key, label, Icon, count }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`pb-4 px-1 relative ${activeTab === key ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5" />{label}
                {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{count}</span>}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Resolution Review ── */}
      {activeTab === 'resolution' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search qualifications..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm min-w-[150px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="under_review">Under Review</option>
            </select>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>{['Qualification', 'Submitted By', 'Date', 'Recommendation Status', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resolutionList.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    <FileSignature className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No qualifications in Resolution Review</p>
                    <p className="text-sm text-gray-400 mt-1">Qualifications appear here after clicking <span className="font-semibold text-green-600">"Close Public Comments &amp; Forward to Approval"</span>.</p>
                  </td></tr>
                ) : resolutionList.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="text-sm font-medium">{q.qualificationTitle}</p><p className="text-xs text-gray-500">{q.qualificationCode}</p></td>
                    <td className="px-4 py-3 text-sm">{q.submittedBy}</td>
                    <td className="px-4 py-3 text-sm">{q.submittedDate}</td>
                    <td className="px-4 py-3 text-sm">{getRecommendationStatus(q)}</td>
                    <td className="px-4 py-3">{getStatusBadge(q.status)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedQualification(q); setIsResolutionModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Submission Package Approval ── */}
      {activeTab === 'submission' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search qualifications..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>{['Qualification', 'Submitted By', 'NQF Level', 'Credits', 'SAQA Rec. Letter', 'SAQA Reg. Letter', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {submissionList.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No qualifications in Submission Package Approval</p>
                    <p className="text-sm text-gray-400 mt-1">Qualifications move here after the CEO sends the SAQA recommendation letter.</p>
                  </td></tr>
                ) : submissionList.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="text-sm font-medium">{q.qualificationTitle}</p><p className="text-xs text-gray-500">{q.qualificationCode}</p></td>
                    <td className="px-4 py-3 text-sm">{q.submittedBy}</td>
                    <td className="px-4 py-3 text-sm">Level {q.nqfLevel}</td>
                    <td className="px-4 py-3 text-sm">{q.credits}</td>
                    <td className="px-4 py-3">
                      {q.saqaLetter ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" />Sent</span> : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending</span>}
                    </td>
                    <td className="px-4 py-3">
                      {q.digitalSaqaLetter?.sentToRegistration
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" />Sent</span>
                        : q.digitalSaqaLetter
                          ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Draft</span>
                          : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Required</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => {
                        const fresh = getFreshApprovals();
                        setSelectedQualification(fresh.find(fq => fq.id === q.id) || q);
                        setIsSubmissionModalOpen(true);
                      }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Qualification Registration ── */}
      {activeTab === 'registration' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>{['Qualification', 'SAQA ID', 'NQF Level', 'Min Credits', 'Committee Date', 'Signed By', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrationList.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No qualifications ready for registration</p>
                    <p className="text-sm text-gray-400 mt-1">Qualifications appear here after the SAQA registration letter is created and sent from Submission Package Approval.</p>
                  </td></tr>
                ) : registrationList.map(q => {
                  const dl = q.digitalSaqaLetter;
                  const row = dl?.rows[0];
                  return (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><p className="text-sm font-medium">{q.qualificationTitle}</p><p className="text-xs text-gray-500">{q.qualificationCode}</p></td>
                      <td className="px-4 py-3 font-mono text-sm">{row?.saqaId || '—'}</td>
                      <td className="px-4 py-3 text-sm">{row?.nqfLevel || `Level ${q.nqfLevel}`}</td>
                      <td className="px-4 py-3 text-sm">{row?.minCredits || q.credits}</td>
                      <td className="px-4 py-3 text-sm">{dl?.committeeDate || '—'}</td>
                      <td className="px-4 py-3 text-sm">{dl?.signedBy || '—'}</td>
                      <td className="px-4 py-3">{getStatusBadge(q.status)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelectedQualification(q); setIsRegistrationModalOpen(true); }}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />Register &amp; Notify
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Registered Qualifications ── */}
      {activeTab === 'registered' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search registered qualifications..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>{['Qualification', 'SAQA ID', 'NQF Level', 'Credits', 'Reg. Date', 'Expiry', 'QP Notified', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRegistered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No registered qualifications yet</p>
                    <p className="text-sm text-gray-400 mt-1">Qualifications appear here after sending the QP notification in Qualification Registration.</p>
                  </td></tr>
                ) : filteredRegistered.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><p className="text-sm font-medium">{q.qualificationTitle}</p><p className="text-xs text-gray-500">{q.qualificationCode}</p></td>
                    <td className="px-4 py-3 font-mono text-sm">{q.saqaId}</td>
                    <td className="px-4 py-3">Level {q.nqfLevel}</td>
                    <td className="px-4 py-3">{q.credits}</td>
                    <td className="px-4 py-3 text-sm">{q.registrationDate}</td>
                    <td className="px-4 py-3 text-sm">{q.expiryDate}</td>
                    <td className="px-4 py-3">
                      {q.approvalQualificationData?.qpNotification
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 w-fit"><Send className="w-3 h-3" />Sent</span>
                        : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">—</span>}
                    </td>
                    <td className="px-4 py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedRegisteredQualification(q); setIsRegisteredModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {isResolutionModalOpen && selectedQualification && (
        <ResolutionReviewModal
          qualification={selectedQualification}
          onClose={() => { setIsResolutionModalOpen(false); setSelectedQualification(null); }}
          onRecommend={handleRecommend}
          onMoveToSubmission={handleMoveToSubmission}
          onSendToSaqa={handleSendToSaqa}
          getStatusBadge={getStatusBadge}
        />
      )}

      {isSubmissionModalOpen && selectedQualification && (
        <SubmissionPackageModal
          qualification={selectedQualification}
          onClose={() => { setIsSubmissionModalOpen(false); setSelectedQualification(null); }}
          onSaveDigitalLetter={handleSaveDigitalLetter}
          onSendToRegistration={handleSendToRegistration}
          getStatusBadge={getStatusBadge}
        />
      )}

      {isRegistrationModalOpen && selectedQualification && (
        <RegistrationModal
          qualification={selectedQualification}
          onClose={() => { setIsRegistrationModalOpen(false); setSelectedQualification(null); }}
          onRegisterAndNotify={handleRegisterAndNotify}
          getStatusBadge={getStatusBadge}
        />
      )}

      {isRegisteredModalOpen && selectedRegisteredQualification && (
        <RegisteredDetailModal
          registered={selectedRegisteredQualification}
          onClose={() => { setIsRegisteredModalOpen(false); setSelectedRegisteredQualification(null); }}
          getStatusBadge={getStatusBadge}
        />
      )}
    </div>
  );
}