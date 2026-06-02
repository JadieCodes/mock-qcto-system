// pages/internal/ResolutionPhase.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertCircle, CheckCircle, Clock, Eye, FileText, Download, Upload,
  XCircle, Search, Calendar,  Users, MessageSquare, Award,
  FileCheck, FileSignature, Shield, Send, RefreshCw, X, ChevronDown,
  ChevronUp, Printer, BookOpen, Target, CheckSquare, ClipboardList,
  Building, Phone, Mail
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ResolutionChecklist {
  id: string;
  item: string;
  required: boolean;
  completed: boolean;
  completedBy?: string;
  completedDate?: string;
  notes?: string;
}

interface ResolutionProject {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
  submitterName: string;
  submissionDate: string;
  status: 'pending_review' | 'in_review' | 'approved' | 'rejected' | 'resolution_created';
  progress: number;
  checklists: ResolutionChecklist[];
  approvalLetter?: any;
  allPhasesCompleted: boolean;
  finalVerificationApproved: boolean;
}

// ── Read-only display helpers ──────────────────────────────────────────────────

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
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${value === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{value}</span>;
};

// ── Phase report renderers (read-only, same fields as DevelopmentProjectModal) ─

const PhaseReportView = ({ phaseName, reportData }: { phaseName: string; reportData: any }) => {
  if (!reportData) return <p className="text-sm text-gray-400 italic py-4 text-center">No report data for this phase.</p>;
  const r = reportData;
  const name = phaseName.toLowerCase();

  if (name.includes('scoping')) return (
    <div className="space-y-4">
      <SB title="QCTO Approved Application Details">
        <div className="grid grid-cols-3 gap-3"><RF label="Occupation" value={r.scopingOccupation} /><RF label="OFO Code" value={r.scopingOfoCode} /><RF label="Specialisation" value={r.scopingSpecialisation} /></div>
      </SB>
      <SB title="Meeting Details" icon={<Calendar className="w-3 h-3"/>}>
        <div className="grid grid-cols-3 gap-3"><RF label="Date" value={r.scopingMeetingDate} /><RF label="Venue" value={r.scopingMeetingVenue} /><RF label="Time" value={r.scopingMeetingTime} /></div>
      </SB>
      <SB title="Stakeholders Consulted" icon={<Users className="w-3 h-3"/>}>
        {r.scopingStakeholders?.length ? (
          <div className="overflow-x-auto"><table className="min-w-full text-xs border"><thead className="bg-gray-100"><tr><th className="border px-2 py-1 text-left">Classification</th><th className="border px-2 py-1 text-center">Invited</th><th className="border px-2 py-1 text-center">Attended</th></tr></thead><tbody>{r.scopingStakeholders.map((row: any, i: number) => (<tr key={i} className={row.isTotal ? 'bg-gray-200 font-semibold' : ''}><td className="border px-2 py-1">{row.classification}</td><td className="border px-2 py-1 text-center">{row.invited||'0'}</td><td className="border px-2 py-1 text-center">{row.attended||'0'}</td></tr>))}</tbody></table></div>
        ) : <p className="text-sm text-gray-400 italic">No data</p>}
      </SB>
      <SB title="Process & Declarations">
        <div className="space-y-2 text-sm">
          <div className="flex gap-2 items-center"><span className="text-gray-500 w-48">Development process discussed:</span><YNBadge value={r.scopingProcessDiscussed}/></div>
          <div className="flex gap-2 items-center"><span className="text-gray-500 w-48">Rationale confirmed:</span><YNBadge value={r.scopingRationaleConfirmed}/></div>
          <div className="flex gap-2 items-center"><span className="text-gray-500 w-48">WG members nominated:</span><YNBadge value={r.scopingWGNominated}/></div>
          <div className="flex gap-2 items-center"><span className="text-gray-500 w-48">Schedule outlined:</span><YNBadge value={r.scopingScheduleOutlined}/></div>
        </div>
      </SB>
      <SB title="QP Declaration" icon={<Shield className="w-3 h-3"/>}>
        <div className="grid grid-cols-2 gap-3"><RF label="Declarant" value={r.scopingDeclarantName}/><RF label="Place" value={r.scopingDeclarationPlace}/></div>
        <div className="grid grid-cols-3 gap-3 mt-2"><RF label="Day" value={r.scopingDeclarationDay}/><RF label="Month" value={r.scopingDeclarationMonth}/><RF label="Year" value={r.scopingDeclarationYear}/></div>
      </SB>
    </div>
  );

  if (name.includes('profil')) return (
    <div className="space-y-4">
      <SB title="Application Details">
        <div className="grid grid-cols-3 gap-3"><RF label="Occupation" value={r.profilingOccupation}/><RF label="OFO Code" value={r.profilingOfoCode}/><RF label="Specialisation" value={r.profilingSpecialisation}/></div>
      </SB>
      <SB title="Meeting Details" icon={<Calendar className="w-3 h-3"/>}>
        <div className="grid grid-cols-3 gap-3"><RF label="Date" value={r.meetingDate}/><RF label="Venue" value={r.meetingVenue}/><RF label="Time" value={r.meetingTime}/></div>
      </SB>
      <SB title="WG Member Participation" icon={<Users className="w-3 h-3"/>}>
        {r.wgMembers?.filter((m:any)=>m.nameAndSurname).length ? (
          <div className="overflow-x-auto"><table className="min-w-full text-xs border"><thead className="bg-gray-100"><tr><th className="border px-2 py-1">Name</th><th className="border px-2 py-1">Classification</th><th className="border px-2 py-1 text-center">Invited</th><th className="border px-2 py-1 text-center">Attended</th></tr></thead><tbody>{r.wgMembers.filter((m:any)=>m.nameAndSurname).map((m:any,i:number)=>(<tr key={i}><td className="border px-2 py-1">{m.nameAndSurname}</td><td className="border px-2 py-1 text-xs">{m.classification}</td><td className="border px-2 py-1 text-center"><YNBadge value={m.invited}/></td><td className="border px-2 py-1 text-center"><YNBadge value={m.attended}/></td></tr>))}</tbody></table></div>
        ) : <p className="text-sm text-gray-400 italic">No WG data</p>}
      </SB>
      <SB title="Verification & Distribution">
        <div className="space-y-2 text-sm">
          <div className="flex gap-2 items-center"><span className="text-gray-500 w-48">Profile sent for verification:</span><YNBadge value={r.verificationSentConfirm}/></div>
          <div className="flex gap-2 items-center"><span className="text-gray-500 w-48">Final profile sent:</span><YNBadge value={r.finalProfileSentConfirm}/></div>
        </div>
        {r.consultationMethods && <div className="mt-2"><RTA label="Consultation Methods" value={r.consultationMethods}/></div>}
      </SB>
      <SB title="QP Declaration" icon={<Shield className="w-3 h-3"/>}>
        <div className="grid grid-cols-2 gap-3"><RF label="Declarant" value={r.declarantName}/><RF label="Place" value={r.declarationPlace}/></div>
      </SB>
    </div>
  );

  if (name.includes('curriculum')) return (
    <div className="space-y-4">
      <SB title="Application Details">
        <div className="grid grid-cols-3 gap-3"><RF label="Occupation" value={r.curriculumOccupation}/><RF label="OFO Code" value={r.curriculumOfoCode}/><RF label="Specialisation" value={r.curriculumSpecialisation}/></div>
      </SB>
      <SB title="Meeting Details" icon={<Calendar className="w-3 h-3"/>}>
        <div className="grid grid-cols-3 gap-3"><RF label="Date" value={r.curriculumMeetingDate}/><RF label="Venue" value={r.curriculumMeetingVenue}/><RF label="Time" value={r.curriculumMeetingTime}/></div>
      </SB>
      <SB title="WG Participation" icon={<Users className="w-3 h-3"/>}>
        {r.curriculumWgMembers?.filter((m:any)=>m.nameAndSurname).length ? (
          <div className="overflow-x-auto"><table className="min-w-full text-xs border"><thead className="bg-gray-100"><tr><th className="border px-2 py-1">Name</th><th className="border px-2 py-1">Classification</th><th className="border px-2 py-1">Component</th><th className="border px-2 py-1 text-center">Invited</th><th className="border px-2 py-1 text-center">Attended</th></tr></thead><tbody>{r.curriculumWgMembers.filter((m:any)=>m.nameAndSurname).map((m:any,i:number)=>(<tr key={i}><td className="border px-2 py-1">{m.nameAndSurname}</td><td className="border px-2 py-1 text-xs">{m.classification}</td><td className="border px-2 py-1">{m.component}</td><td className="border px-2 py-1 text-center"><YNBadge value={m.invited}/></td><td className="border px-2 py-1 text-center"><YNBadge value={m.attended}/></td></tr>))}</tbody></table></div>
        ) : <p className="text-sm text-gray-400 italic">No WG data</p>}
      </SB>
      {r.curriculumComments && <SB title="Comments"><RTA label="" value={r.curriculumComments}/></SB>}
      <SB title="QP Declaration" icon={<Shield className="w-3 h-3"/>}>
        <div className="grid grid-cols-2 gap-3"><RF label="Declarant" value={r.curriculumDeclarantName}/><RF label="Place" value={r.curriculumDeclarationPlace}/></div>
      </SB>
    </div>
  );

  if (name.includes('assessment spec')) return (
    <div className="space-y-4">
      <SB title="Qualification Details">
        <div className="grid grid-cols-3 gap-3"><RF label="Curriculum Code" value={r.qasCurriculumCode}/><RF label="Organisation" value={r.qasOrganisationName}/><RF label="Partner Type" value={r.qasQualityPartnerType}/></div>
      </SB>
      <SB title="Assessment Strategy" icon={<BookOpen className="w-3 h-3"/>}>
        <RTA label="Internal Formative Assessment" value={r.qasFormativeAssessment}/>
        <div className="mt-3"><RTA label="Internal Summative Assessment" value={r.qasSummativeAssessment}/></div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <RF label="Format" value={r.qasFormatAssessment}/>
          <RF label="Total Marks" value={r.qasTotalMarks}/>
          <RF label="Open/Closed Book" value={r.qasOpenClosedBook}/>
        </div>
      </SB>
      <SB title="SME Criteria">
        <RTA label="EISA Developers" value={r.qasSmeDevelopers}/>
        <div className="mt-3"><RTA label="EISA Markers/Assessors" value={r.qasSmeMarkers}/></div>
        <div className="mt-3"><RTA label="EISA Moderators" value={r.qasSmeModerators}/></div>
      </SB>
      <SB title="QP Declaration" icon={<Shield className="w-3 h-3"/>}>
        <div className="grid grid-cols-2 gap-3"><RF label="Declarant" value={r.qasDeclarantName}/><RF label="Place" value={r.qasDeclarationPlace}/></div>
      </SB>
    </div>
  );

  if (name.includes('qas addendum')) return (
    <div className="space-y-4">
      <SB title="AQP Details">
        <div className="grid grid-cols-2 gap-3"><RF label="AQP Name" value={r.qasAddendumAqpName}/><RF label="Contact Name" value={r.qasAddendumContactName}/></div>
        <div className="grid grid-cols-2 gap-3 mt-2"><RF label="Date Received" value={r.qasAddendumDateReceived}/><RF label="Date Evaluated" value={r.qasAddendumDateEvaluated}/></div>
      </SB>
      <SB title="Qualification Details">
        <div className="grid grid-cols-3 gap-3"><RF label="Qualification Title" value={r.qasAddendumQualTitle}/><RF label="SAQA ID" value={r.qasAddendumSaqaId}/><RF label="NQF Level" value={r.qasAddendumNqfLevel}/></div>
        <div className="grid grid-cols-3 gap-3 mt-2"><RF label="Credits" value={r.qasAddendumCredits}/><RF label="Reg Start" value={r.qasAddendumRegStartDate}/><RF label="Reg End" value={r.qasAddendumRegEndDate}/></div>
      </SB>
      <SB title="Evaluation Summary">
        <div className="grid grid-cols-2 gap-3">
          <RF label="Format" value={r.qasAddendumFormat}/>
          <RF label="Open/Closed" value={r.qasAddendumOpenClosed}/>
          <RF label="Marking Days" value={r.qasAddendumMarkingDays}/>
          <RF label="Moderation %" value={r.qasAddendumModerationPercent}/>
        </div>
        {r.qasAddendumFindings && <div className="mt-3"><RTA label="Findings" value={r.qasAddendumFindings}/></div>}
        {r.qasAddendumRecommendation && <div className="mt-3"><RTA label="Recommendation" value={r.qasAddendumRecommendation}/></div>}
      </SB>
      <SB title="Final Recommendation">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${r.qasAddendumFinalRecommendation === 'approved' ? 'bg-green-100 text-green-700' : r.qasAddendumFinalRecommendation === 'notApproved' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
          {r.qasAddendumFinalRecommendation === 'approved' ? '✓ Approved' : r.qasAddendumFinalRecommendation === 'notApproved' ? '✗ Not Approved' : 'Pending'}
        </span>
      </SB>
    </div>
  );

  if (name.includes('qualification document') || name.includes('stage 1')) return (
    <div className="space-y-4">
      <SB title="Qualification Document">
        <div className="grid grid-cols-2 gap-3"><RF label="Version" value={r.qualificationDocVersion}/><RF label="Completion Date" value={r.qualificationDocCompletionDate}/></div>
        <div className="mt-3"><RTA label="Summary" value={r.qualificationDocSummary}/></div>
      </SB>
      <SB title="Document Sections" icon={<CheckSquare className="w-3 h-3"/>}>
        {r.qualificationDocSections?.length ? (
          <div className="grid grid-cols-2 gap-2">
            {r.qualificationDocSections.map((s:any,i:number)=>(
              <div key={i} className={`flex items-center gap-2 p-2 rounded border text-xs ${s.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                {s.completed ? <CheckCircle className="w-3 h-3 text-green-500"/> : <div className="w-3 h-3 rounded-full border border-gray-300"/>}
                {s.name}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 italic">No sections data</p>}
      </SB>
      <SB title="Stage 1 SME Declaration">
        <div className="grid grid-cols-3 gap-3"><RF label="SME Name" value={r.stage1SmeName}/><RF label="Role" value={r.stage1SmeRole}/><RF label="Date" value={r.stage1SmeDate}/></div>
        <div className="mt-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${r.stage1SmeDeclaration ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {r.stage1SmeDeclaration ? '✓ SME Declaration Signed' : 'SME Declaration Not Signed'}
          </span>
        </div>
      </SB>
    </div>
  );

  if (name.includes('final verification')) return (
    <div className="space-y-4">
      <SB title="Application Details">
        <div className="grid grid-cols-3 gap-3"><RF label="Occupation" value={r.finalVerificationOccupation}/><RF label="OFO Code" value={r.finalVerificationOfoCode}/><RF label="Specialisation" value={r.finalVerificationSpecialisation}/></div>
      </SB>
      <SB title="Meeting Details" icon={<Calendar className="w-3 h-3"/>}>
        <div className="grid grid-cols-3 gap-3"><RF label="Date" value={r.finalVerificationMeetingDate}/><RF label="Venue" value={r.finalVerificationMeetingVenue}/><RF label="Time" value={r.finalVerificationMeetingTime}/></div>
      </SB>
      <SB title="Stakeholders Consulted" icon={<Users className="w-3 h-3"/>}>
        {r.finalVerificationStakeholders?.length ? (
          <div className="overflow-x-auto"><table className="min-w-full text-xs border"><thead className="bg-gray-100"><tr><th className="border px-2 py-1 text-left">Classification</th><th className="border px-2 py-1 text-center">Invited</th><th className="border px-2 py-1 text-center">Attended</th></tr></thead><tbody>{r.finalVerificationStakeholders.map((row:any,i:number)=>(<tr key={i} className={row.isTotal?'bg-gray-200 font-semibold':''}><td className="border px-2 py-1 text-xs">{row.classification}</td><td className="border px-2 py-1 text-center">{row.invited||'0'}</td><td className="border px-2 py-1 text-center">{row.attended||'0'}</td></tr>))}</tbody></table></div>
        ) : <p className="text-sm text-gray-400 italic">No data</p>}
      </SB>
      <SB title="SME Details" icon={<User className="w-3 h-3"/>}>
        {r.finalVerificationSMERows?.filter((s:any)=>s.name).length ? (
          <div className="overflow-x-auto"><table className="min-w-full text-xs border"><thead className="bg-gray-100"><tr>{['Name','Surname','Email','Cell','Phone'].map(h=><th key={h} className="border px-2 py-1 text-left">{h}</th>)}</tr></thead><tbody>{r.finalVerificationSMERows.filter((s:any)=>s.name).map((s:any,i:number)=>(<tr key={i}><td className="border px-2 py-1">{s.name}</td><td className="border px-2 py-1">{s.surname}</td><td className="border px-2 py-1">{s.email}</td><td className="border px-2 py-1">{s.cell}</td><td className="border px-2 py-1">{s.phone}</td></tr>))}</tbody></table></div>
        ) : <p className="text-sm text-gray-400 italic">No SME data</p>}
      </SB>
      {r.finalVerificationComments && <SB title="Comments"><RTA label="" value={r.finalVerificationComments}/></SB>}
      <SB title="QP Declaration" icon={<Shield className="w-3 h-3"/>}>
        <div className="grid grid-cols-2 gap-3"><RF label="Declarant" value={r.finalVerificationDeclarantName}/><RF label="Place" value={r.finalVerificationDeclarationPlace}/></div>
        <div className="grid grid-cols-2 gap-3 mt-2"><RF label="Witness 1" value={r.finalVerificationWitness1}/><RF label="Witness 2" value={r.finalVerificationWitness2}/></div>
      </SB>
    </div>
  );

  if (name.includes('stage 2')) return (
    <div className="space-y-4">
      <SB title="Development Phase Completion">
        {r.stage2Phases?.length ? (
          <div className="space-y-2">
            {r.stage2Phases.map((p:any,i:number)=>(
              <div key={i} className={`flex items-center gap-3 p-2 rounded border ${p.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                {p.completed ? <CheckCircle className="w-4 h-4 text-green-500"/> : <Clock className="w-4 h-4 text-gray-400"/>}
                <span className="text-sm flex-1">{p.name}</span>
                {p.approvedDate && <span className="text-xs text-gray-400">{p.approvedDate}</span>}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 italic">No phase data</p>}
      </SB>
      <SB title="Quality Checklist" icon={<CheckSquare className="w-3 h-3"/>}>
        {r.qualityCriteria?.length ? (
          <div className="space-y-1">
            {r.qualityCriteria.map((c:any,i:number)=>(
              <div key={i} className="flex items-center gap-2 text-sm">
                {c.checked ? <CheckCircle className="w-4 h-4 text-green-500"/> : <div className="w-4 h-4 rounded-full border border-gray-300"/>}
                <span>{c.item}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400 italic">No checklist data</p>}
      </SB>
      <SB title="QP Declaration">
        <div className="grid grid-cols-3 gap-3"><RF label="QP Name" value={r.stage2QpName}/><RF label="Role" value={r.stage2QpRole}/><RF label="Date" value={r.stage2QpDate}/></div>
        {r.stage2SubmissionNotes && <div className="mt-3"><RTA label="Submission Notes" value={r.stage2SubmissionNotes}/></div>}
      </SB>
    </div>
  );

  return (
    <div className="space-y-3">
      {r.objectives && <SB title="Objectives"><RTA label="" value={r.objectives}/></SB>}
      {r.findings && <SB title="Findings"><RTA label="" value={r.findings}/></SB>}
      {r.additionalNotes && <SB title="Additional Notes"><RTA label="" value={r.additionalNotes}/></SB>}
    </div>
  );
};

// ── Resolution Letter Form ─────────────────────────────────────────────────────

interface LetterFormData {
  letterNumber: string;
  issueDate: string;
  recipientName: string;
  recipientOrganisation: string;
  recipientAddress: string;
  qualificationTypes: string;
  saqaIds: string;
  qualificationTitles: string;
  nqfLevels: string;
  credits: string;
  committeeDate: string;
  directorName: string;
  directorTitle: string;
  additionalNotes: string;
  declineReasons: string;
  resubmissionRequirements: string;
}

const defaultLetterData = (): LetterFormData => ({
  letterNumber: '', issueDate: new Date().toISOString().split('T')[0],
  recipientName: '', recipientOrganisation: '', recipientAddress: '',
  qualificationTypes: 'Review', saqaIds: '', qualificationTitles: '',
  nqfLevels: '', credits: '',
  committeeDate: '', directorName: '', directorTitle: 'Senior Administrative Assistant: Central Office: OQM & OQA',
  additionalNotes: '', declineReasons: '', resubmissionRequirements: ''
});

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ResolutionPhase() {
  const [resolutions, setResolutions] = useState<ResolutionProject[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadResolutions = useCallback(() => {
    const stored = localStorage.getItem('resolutionProjects');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setResolutions(parsed.map((r: any) => ({ ...r, status: r.status as ResolutionProject['status'] })));
      } catch { setResolutions([]); }
    } else {
      setResolutions([]);
    }
  }, []);

  useEffect(() => { loadResolutions(); }, [loadResolutions]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'resolutionProjects') {
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setResolutions(parsed.map((r: any) => ({ ...r, status: r.status as ResolutionProject['status'] })));
          } catch { loadResolutions(); }
        } else loadResolutions();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loadResolutions]);

  useEffect(() => {
    window.addEventListener('refreshWorkspace', loadResolutions);
    return () => window.removeEventListener('refreshWorkspace', loadResolutions);
  }, [loadResolutions]);

  const getStatusBadge = (status: ResolutionProject['status']) => {
    switch (status) {
      case 'pending_review': return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3"/> Pending Review</span>;
      case 'in_review':      return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Eye className="w-3 h-3"/> In Review</span>;
      case 'approved':       return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Approved</span>;
      case 'rejected':       return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3"/> Rejected</span>;
      case 'resolution_created': return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"><FileSignature className="w-3 h-3"/> Resolution Created</span>;
      default: return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const handleUpdateChecklist = (checklistId: string, completed: boolean) => {
    if (!selectedResolution) return;
    const updatedChecklists = selectedResolution.checklists.map(item =>
      item.id === checklistId ? { ...item, completed, completedDate: completed ? new Date().toISOString() : undefined } : item
    );
    const completedCount = updatedChecklists.filter(c => c.completed).length;
    const requiredCount = updatedChecklists.filter(c => c.required).length;
    const progress = (completedCount / requiredCount) * 100;
    const newStatus: ResolutionProject['status'] = progress === 100 ? 'resolution_created' : 'in_review';
    const updated: ResolutionProject = { ...selectedResolution, checklists: updatedChecklists, progress, status: newStatus };
    setSelectedResolution(updated);
    const updatedAll = resolutions.map(r => r.id === selectedResolution.id ? updated : r);
    setResolutions(updatedAll);
    localStorage.setItem('resolutionProjects', JSON.stringify(updatedAll));
  };

  const handleSaveResolution = (updatedResolution: ResolutionProject) => {
    setSelectedResolution(updatedResolution);
    const updatedAll = resolutions.map(r => r.id === updatedResolution.id ? updatedResolution : r);
    setResolutions(updatedAll);
    localStorage.setItem('resolutionProjects', JSON.stringify(updatedAll));
  };

  const filteredResolutions = resolutions.filter(res => {
    if (searchTerm && !res.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) && !res.qualificationCode.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter && res.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Resolution Phase</h1>
        <p className="text-gray-500 mt-1">Review completed qualifications and issue QCTO resolution letters</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: resolutions.length, color: 'purple', Icon: FileSignature },
          { label: 'Pending Review', value: resolutions.filter(r=>r.status==='pending_review').length, color: 'yellow', Icon: Clock },
          { label: 'In Review', value: resolutions.filter(r=>r.status==='in_review').length, color: 'blue', Icon: Eye },
          { label: 'Approved', value: resolutions.filter(r=>r.status==='approved').length, color: 'green', Icon: CheckCircle },
          { label: 'Rejected', value: resolutions.filter(r=>r.status==='rejected').length, color: 'red', Icon: XCircle },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">{label}</p><p className={`text-2xl font-bold text-${color}-600`}>{value}</p></div>
              <div className={`p-2 bg-${color}-100 rounded-lg`}><Icon className={`w-5 h-5 text-${color}-600`}/></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
          <input type="text" placeholder="Search qualifications..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
        </div>
        <select className="border rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending_review">Pending Review</option>
          <option value="in_review">In Review</option>
          <option value="resolution_created">Resolution Created</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={loadResolutions} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
          <RefreshCw className="w-4 h-4"/> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredResolutions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileSignature className="w-12 h-12 mx-auto mb-3 opacity-30"/>
            <p className="font-medium">No resolutions yet</p>
            <p className="text-sm mt-1">Qualifications appear here once all development phases are approved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Qualification','Submitter','Submission Date','Checklist Progress','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredResolutions.map(resolution => {
                  const completed = resolution.checklists.filter(c => c.required && c.completed).length;
                  const total = resolution.checklists.filter(c => c.required).length;
                  return (
                    <tr key={resolution.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{resolution.qualificationTitle}</p>
                        <p className="text-xs text-gray-500">{resolution.qualificationCode}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{resolution.submitterName}</td>
                      <td className="px-4 py-3 text-sm">{resolution.submissionDate}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${completed===total ? 'bg-green-500' : 'bg-purple-500'}`} style={{width:`${(completed/total)*100}%`}}/>
                          </div>
                          <span className="text-xs text-gray-600">{completed}/{total}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(resolution.status)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelectedResolution(resolution); setIsModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                          <Eye className="w-4 h-4"/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedResolution && (
        <ResolutionDetailModal
          resolution={selectedResolution}
          onClose={() => { setIsModalOpen(false); setSelectedResolution(null); }}
          onUpdateChecklist={handleUpdateChecklist}
          onSave={handleSaveResolution}
          getStatusBadge={getStatusBadge}
        />
      )}
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────────

interface DetailModalProps {
  resolution: ResolutionProject;
  onClose: () => void;
  onUpdateChecklist: (id: string, completed: boolean) => void;
  onSave: (r: ResolutionProject) => void;
  getStatusBadge: (s: ResolutionProject['status']) => React.ReactNode;
}

function ResolutionDetailModal({ resolution, onClose, onUpdateChecklist, onSave, getStatusBadge }: DetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'checklist' | 'resolution'>('overview');
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [letterType, setLetterType] = useState<'approval' | 'rejection'>('approval');
  const [letterData, setLetterData] = useState<LetterFormData>(defaultLetterData());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showLetterForm, setShowLetterForm] = useState(false);
  const [issuingLetter, setIssuingLetter] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const requiredTotal = resolution.checklists.filter(c => c.required).length;
  const completedRequired = resolution.checklists.filter(c => c.required && c.completed).length;
  const canIssueResolution = completedRequired === requiredTotal;

  // Load phase reports from localStorage
  const getPhaseReports = () => {
    const reports = JSON.parse(localStorage.getItem('submittedPhaseReports') || '[]');
    return reports.filter((r: any) => r.qualificationCode === resolution.qualificationCode);
  };

  const getInternalPhases = () => {
    const plans = JSON.parse(localStorage.getItem('internalCyclePlans') || '[]');
    const plan = plans.find((p: any) => p.qualificationCode === resolution.qualificationCode);
    return plan?.phases || [];
  };

  const phases = getInternalPhases();
  const phaseReports = getPhaseReports();

  const getReportForPhase = (phaseName: string) => {
    const fromReports = phaseReports.find((r: any) => r.phaseName === phaseName);
    if (fromReports?.reportData) return fromReports.reportData;
    const fromPhase = phases.find((p: any) => p.name === phaseName);
    return fromPhase?.reportData || null;
  };

// In ResolutionPhase.tsx, update the handleIssueResolution function:

const handleIssueResolution = () => {
  if (!letterData.directorName) { alert('Please fill in the Director/Signatory name.'); return; }
  setIssuingLetter(true);

  const newStatus: ResolutionProject['status'] = letterType === 'approval' ? 'approved' : 'rejected';
  const updatedResolution: ResolutionProject = {
    ...resolution,
    status: newStatus,
    approvalLetter: {
      id: Date.now().toString(),
      type: letterType,
      letterNumber: letterData.letterNumber,
      issueDate: letterData.issueDate,
      signedBy: letterData.directorName,
      directorTitle: letterData.directorTitle,
      recipientName: letterData.recipientName,
      recipientOrganisation: letterData.recipientOrganisation,
      letterData,
      uploadedDate: new Date().toISOString(),
      fileName: selectedFile?.name || 'Resolution Letter',
    }
  };

  onSave(updatedResolution);

  if (letterType === 'approval') {
    // Get existing public submissions
    const publicSubmissions = JSON.parse(localStorage.getItem('externalPublicSubmissions') || '[]');
    
    // Update each submission with the resolution letter info
    const updatedSubmissions = publicSubmissions.map((sub: any) => {
      if (sub.qualificationCode === resolution.qualificationCode) {
        return {
          ...sub,
          resolutionLetter: {
            letterNumber: letterData.letterNumber,
            issueDate: letterData.issueDate,
            signedBy: letterData.directorName,
            letterType: 'approval',
            recipientName: letterData.recipientName,
            recipientOrganisation: letterData.recipientOrganisation,
            additionalNotes: letterData.additionalNotes,
            status: 'approved'
          },
          status: 'addressed'
        };
      }
      return sub;
    });
    
    localStorage.setItem('externalPublicSubmissions', JSON.stringify(updatedSubmissions));
    
    // Also store in registeredQualifications
    const registered = JSON.parse(localStorage.getItem('registeredQualifications') || '[]');
    const alreadyRegistered = registered.some((r: any) => r.qualificationCode === resolution.qualificationCode);
    if (!alreadyRegistered) {
      registered.push({
        qualificationCode: resolution.qualificationCode,
        qualificationTitle: resolution.qualificationTitle,
        approvalDate: new Date().toISOString(),
        letterNumber: letterData.letterNumber,
        signedBy: letterData.directorName
      });
      localStorage.setItem('registeredQualifications', JSON.stringify(registered));
    }

    // Move to public input qualifications (for the dashboard)
    const publicInputQualifications = JSON.parse(localStorage.getItem('publicInputQualifications') || '[]');
    const exists = publicInputQualifications.some((s: any) => s.qualificationCode === resolution.qualificationCode);
    if (!exists) {
      publicInputQualifications.push({
        id: resolution.id,
        qualificationCode: resolution.qualificationCode,
        qualificationTitle: resolution.qualificationTitle,
        qualificationLevel: 6,
        credits: 120,
        submittedBy: resolution.submitterName,
        submittedDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        allPhasesCompleted: true,
        comments: [],
        resolutionDocument: { 
          letterNumber: letterData.letterNumber, 
          issueDate: letterData.issueDate, 
          signedBy: letterData.directorName, 
          uploadDate: new Date().toISOString() 
        }
      });
      localStorage.setItem('publicInputQualifications', JSON.stringify(publicInputQualifications));
    }

    // Move to approval qualifications - DECLARE approvals OUTSIDE the if block
    const approvals = JSON.parse(localStorage.getItem('approvalQualifications') || '[]');
    const approvalExists = approvals.some((a: any) => a.qualificationCode === resolution.qualificationCode);
    if (!approvalExists) {
      approvals.push({
        id: resolution.id,
        qualificationCode: resolution.qualificationCode,
        qualificationTitle: resolution.qualificationTitle,
        nqfLevel: 6, credits: 120,
        submittedBy: resolution.submitterName,
        submittedDate: new Date().toISOString().split('T')[0],
        status: 'pending_review', currentApprovalLevel: 0,
        movedToApprovalDate: new Date().toISOString(),
        recommendations: [],
        resolutionDocument: { 
          letterNumber: letterData.letterNumber, 
          issueDate: letterData.issueDate, 
          signedBy: letterData.directorName, 
          uploadDate: new Date().toISOString() 
        },
        allDocuments: { qualificationDocument: '', curriculumSpec: '', assessmentGuidelines: '', qasReport: '' }
      });
      localStorage.setItem('approvalQualifications', JSON.stringify(approvals));
    }

    // Dispatch events
    window.dispatchEvent(new StorageEvent('storage', { key: 'externalPublicSubmissions', newValue: JSON.stringify(updatedSubmissions) }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'publicInputQualifications', newValue: JSON.stringify(publicInputQualifications) }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'approvalQualifications', newValue: JSON.stringify(approvals) }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'registeredQualifications', newValue: JSON.stringify(registered) }));
    window.dispatchEvent(new CustomEvent('refreshWorkspace'));
    window.dispatchEvent(new CustomEvent('qualificationRegistered'));
  }

  setIssuingLetter(false);
  setShowLetterForm(false);
  alert(`${letterType === 'approval' ? 'Approval' : 'Rejection'} resolution issued successfully${letterType === 'approval' ? ' and moved to Public Input Dashboard.' : '.'}`);
};
  const lf = (field: keyof LetterFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setLetterData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
          <div>
            <h3 className="text-lg font-semibold">{resolution.qualificationTitle}</h3>
            <p className="text-sm text-gray-500">Code: {resolution.qualificationCode} · Submitted: {resolution.submissionDate}</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(resolution.status)}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5"/></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b bg-white">
          <div className="flex gap-1">
            {([
              { key: 'overview', label: 'Overview', Icon: Award },
              { key: 'phases', label: 'Phase Reports', Icon: FileText },
              { key: 'checklist', label: 'Checklist', Icon: ClipboardList },
              { key: 'resolution', label: 'Issue Resolution', Icon: FileSignature },
            ] as const).map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Icon className="w-4 h-4"/>{label}
                {key === 'checklist' && <span className={`ml-1 text-xs px-1.5 rounded-full ${completedRequired === requiredTotal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{completedRequired}/{requiredTotal}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide">Qualification Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Code</span><span className="font-medium">{resolution.qualificationCode}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Submitter</span><span className="font-medium">{resolution.submitterName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Submission Date</span><span className="font-medium">{resolution.submissionDate}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">All Phases Completed</span><span className={`font-medium ${resolution.allPhasesCompleted ? 'text-green-600' : 'text-red-600'}`}>{resolution.allPhasesCompleted ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Final Verification</span><span className={`font-medium ${resolution.finalVerificationApproved ? 'text-green-600' : 'text-gray-600'}`}>{resolution.finalVerificationApproved ? 'Approved' : 'Pending'}</span></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide">Resolution Progress</h4>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-3 rounded-full transition-all" style={{width:`${resolution.progress}%`}}/>
                    </div>
                    <span className="text-xl font-bold text-purple-700">{Math.round(resolution.progress)}%</span>
                  </div>
                  <p className="text-sm text-gray-600">Required checklist items: {completedRequired}/{requiredTotal} completed</p>
                  {canIssueResolution && resolution.status !== 'approved' && resolution.status !== 'rejected' && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-medium"><CheckCircle className="w-4 h-4"/>All items complete — ready to issue resolution</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Phase summary */}
              <div className="bg-gray-50 rounded-lg border p-4">
                <h4 className="font-medium mb-3 text-sm uppercase text-gray-600 tracking-wide flex items-center gap-2"><FileText className="w-4 h-4"/>Development Phases Summary</h4>
                <div className="grid grid-cols-2 gap-2">
                  {phases.map((phase: any, i: number) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded border text-sm ${phase.approved ? 'bg-green-50 border-green-200' : phase.reportSubmitted ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}`}>
                      {phase.approved ? <CheckCircle className="w-4 h-4 text-green-500"/> : phase.reportSubmitted ? <Clock className="w-4 h-4 text-yellow-500"/> : <div className="w-4 h-4 rounded-full border border-gray-300"/>}
                      <span className="flex-1 text-xs">{phase.name}</span>
                      {phase.approved && <span className="text-xs text-green-600 font-medium">Approved</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Existing resolution letter info */}
              {resolution.approvalLetter && (
                <div className={`p-4 rounded-lg border ${resolution.approvalLetter.type === 'approval' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {resolution.approvalLetter.type === 'approval' ? <CheckCircle className="w-5 h-5 text-green-600"/> : <XCircle className="w-5 h-5 text-red-600"/>}
                    <p className="font-medium">{resolution.approvalLetter.type === 'approval' ? 'Approval Resolution Issued' : 'Rejection Resolution Issued'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><span className="text-gray-500">Letter Number:</span> <span className="font-medium">{resolution.approvalLetter.letterNumber}</span></div>
                    <div><span className="text-gray-500">Issue Date:</span> <span className="font-medium">{resolution.approvalLetter.issueDate}</span></div>
                    <div><span className="text-gray-500">Signed By:</span> <span className="font-medium">{resolution.approvalLetter.signedBy}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PHASE REPORTS ── */}
          {activeTab === 'phases' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">All submitted phase reports for this qualification. Expand each phase to view full report data.</p>
              {phases.length === 0 && <p className="text-center text-gray-400 py-8">No phase data found.</p>}
              {phases.map((phase: any, idx: number) => {
                const isExpanded = expandedPhase === phase.name;
                const reportData = getReportForPhase(phase.name);
                return (
                  <div key={idx} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedPhase(isExpanded ? null : phase.name)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {phase.approved ? <CheckCircle className="w-5 h-5 text-green-500"/> : phase.reportSubmitted ? <Clock className="w-5 h-5 text-yellow-500"/> : <div className="w-5 h-5 rounded-full border-2 border-gray-300"/>}
                        <div className="text-left">
                          <p className="font-medium text-sm">{phase.name}</p>
                          <p className="text-xs text-gray-500">
                            {phase.approved ? 'Approved' : phase.reportSubmitted ? 'Report submitted — pending approval' : 'Not yet submitted'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {phase.approved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Approved</span>}
                        {phase.reportSubmitted && !phase.approved && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending Review</span>}
                        {!phase.reportSubmitted && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Not Submitted</span>}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-4 border-t bg-white">
                        {reportData ? (
                          <PhaseReportView phaseName={phase.name} reportData={reportData}/>
                        ) : (
                          <div className="text-center py-6 text-gray-400">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40"/>
                            <p className="text-sm">No report data available for this phase.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── CHECKLIST ── */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Resolution Checklist</h4>
                <span className="text-sm text-gray-500">Required: {completedRequired}/{requiredTotal} completed</span>
              </div>
              <div className="space-y-2">
                {resolution.checklists.map(item => (
                  <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${item.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={e => onUpdateChecklist(item.id, e.target.checked)}
                      disabled={resolution.status === 'approved' || resolution.status === 'rejected'}
                      className="mt-0.5 w-4 h-4 text-purple-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.item}{item.required && <span className="text-red-500 ml-1">*</span>}</p>
                      {item.completedDate && <p className="text-xs text-gray-400 mt-0.5">Completed: {new Date(item.completedDate).toLocaleDateString()}</p>}
                    </div>
                    {item.completed && <CheckCircle className="w-5 h-5 text-green-500 shrink-0"/>}
                  </div>
                ))}
              </div>

              {canIssueResolution && resolution.status !== 'approved' && resolution.status !== 'rejected' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2"><CheckCircle className="w-5 h-5"/>All required checklist items completed!</div>
                  <p className="text-sm text-green-600">Go to the "Issue Resolution" tab to generate the official QCTO resolution letter.</p>
                </div>
              )}
            </div>
          )}

          {/* ── ISSUE RESOLUTION ── */}
          {activeTab === 'resolution' && (
            <div className="space-y-5">
              {resolution.status === 'approved' || resolution.status === 'rejected' ? (
                <div className={`p-5 rounded-lg border-2 ${resolution.approvalLetter?.type === 'approval' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {resolution.approvalLetter?.type === 'approval' ? <CheckCircle className="w-8 h-8 text-green-600"/> : <XCircle className="w-8 h-8 text-red-600"/>}
                    <div>
                      <h4 className="text-lg font-semibold">{resolution.approvalLetter?.type === 'approval' ? 'Approval Resolution Issued' : 'Rejection Resolution Issued'}</h4>
                      <p className="text-sm text-gray-600">Resolution letter has been generated and issued.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500 block text-xs uppercase font-semibold mb-1">Letter Number</span><span className="font-medium">{resolution.approvalLetter?.letterNumber || '—'}</span></div>
                    <div><span className="text-gray-500 block text-xs uppercase font-semibold mb-1">Issue Date</span><span className="font-medium">{resolution.approvalLetter?.issueDate || '—'}</span></div>
                    <div><span className="text-gray-500 block text-xs uppercase font-semibold mb-1">Signed By</span><span className="font-medium">{resolution.approvalLetter?.signedBy || '—'}</span></div>
                  </div>
                </div>
              ) : !canIssueResolution ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-700 font-medium"><AlertCircle className="w-5 h-5"/>Checklist not complete</div>
                  <p className="text-sm text-amber-600 mt-1">Complete all required checklist items before issuing a resolution. ({completedRequired}/{requiredTotal} done)</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Letter Type Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Resolution Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => { setLetterType('approval'); setShowLetterForm(true); }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${letterType === 'approval' && showLetterForm ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'}`}
                      >
                        <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-6 h-6 text-green-600"/><span className="font-semibold text-green-700">Approval Resolution</span></div>
                        <p className="text-xs text-gray-500">Confirm approval of qualification development applications. Qualification moves to Public Input Dashboard.</p>
                      </button>
                      <button
                        onClick={() => { setLetterType('rejection'); setShowLetterForm(true); }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${letterType === 'rejection' && showLetterForm ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-50'}`}
                      >
                        <div className="flex items-center gap-3 mb-2"><XCircle className="w-6 h-6 text-red-600"/><span className="font-semibold text-red-700">Rejection Resolution</span></div>
                        <p className="text-xs text-gray-500">Qualification does not meet criteria. List shortcomings for remediation and return to Quality Partner.</p>
                      </button>
                    </div>
                  </div>

                  {/* Letter Form */}
                  {showLetterForm && (
                    <div className={`border-2 rounded-xl p-5 space-y-5 ${letterType === 'approval' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                      <div className="flex items-center gap-2 pb-3 border-b">
                        <FileSignature className={`w-5 h-5 ${letterType === 'approval' ? 'text-green-600' : 'text-red-600'}`}/>
                        <h4 className="font-semibold">{letterType === 'approval' ? 'Approval Letter Details' : 'Rejection/Decline Letter Details'}</h4>
                        <span className="text-xs text-gray-500 ml-auto italic">Modelled on QCTO official letter format</span>
                      </div>

                      {/* Letter reference */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Letter Number</label>
                          <input type="text" value={letterData.letterNumber} onChange={lf('letterNumber')} placeholder="e.g. QCTO/2026/001" className="w-full border rounded-lg px-3 py-2 text-sm"/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Issue Date *</label>
                          <input type="date" value={letterData.issueDate} onChange={lf('issueDate')} className="w-full border rounded-lg px-3 py-2 text-sm"/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Committee Meeting Date</label>
                          <input type="date" value={letterData.committeeDate} onChange={lf('committeeDate')} className="w-full border rounded-lg px-3 py-2 text-sm"/>
                        </div>
                      </div>

                      {/* Recipient */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Recipient Name</label>
                          <input type="text" value={letterData.recipientName} onChange={lf('recipientName')} placeholder="Ms/Mr Name Surname" className="w-full border rounded-lg px-3 py-2 text-sm"/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Organisation</label>
                          <input type="text" value={letterData.recipientOrganisation} onChange={lf('recipientOrganisation')} placeholder="e.g. TETA" className="w-full border rounded-lg px-3 py-2 text-sm"/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Address</label>
                          <input type="text" value={letterData.recipientAddress} onChange={lf('recipientAddress')} placeholder="Street address" className="w-full border rounded-lg px-3 py-2 text-sm"/>
                        </div>
                      </div>

                      {/* Qualification table data */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Qualification Title(s)</label>
                          <textarea value={letterData.qualificationTitles || resolution.qualificationTitle} onChange={lf('qualificationTitles')} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="One per line if multiple"/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">SAQA ID(s)</label>
                            <input type="text" value={letterData.saqaIds} onChange={lf('saqaIds')} placeholder="e.g. 94202" className="w-full border rounded-lg px-3 py-2 text-sm"/>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">NQF Level(s)</label>
                            <input type="text" value={letterData.nqfLevels} onChange={lf('nqfLevels')} placeholder="e.g. 3" className="w-full border rounded-lg px-3 py-2 text-sm"/>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Credits</label>
                            <input type="text" value={letterData.credits} onChange={lf('credits')} placeholder="e.g. 120" className="w-full border rounded-lg px-3 py-2 text-sm"/>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Type of Development</label>
                            <input type="text" value={letterData.qualificationTypes} onChange={lf('qualificationTypes')} placeholder="e.g. Review / New" className="w-full border rounded-lg px-3 py-2 text-sm"/>
                          </div>
                        </div>
                      </div>

                      {/* Rejection-specific fields */}
                      {letterType === 'rejection' && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Shortcomings / Decline Reasons *</label>
                            <textarea value={letterData.declineReasons} onChange={lf('declineReasons')} rows={5} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="List each criterion element with the problem and recommendation...&#10;&#10;1. Rationale Problem&#10;The needs and benefits are not clear.&#10;Recommendation: The needs and benefits must be clear.&#10;&#10;2. Purpose&#10;..."/>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Resubmission Requirements</label>
                            <textarea value={letterData.resubmissionRequirements} onChange={lf('resubmissionRequirements')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="The Quality Partner is required to address the shortcomings identified and resubmit the qualification utilising the current templates and submission requirements for evaluation by QCTO."/>
                          </div>
                        </>
                      )}

                      {/* Approval-specific additional notes */}
                      {letterType === 'approval' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Additional Notes / Cluster Assignment</label>
                          <textarea value={letterData.additionalNotes} onChange={lf('additionalNotes')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Your project is linked to [Cluster Name]. Please expect further communication from the relevant Cluster manager assigned to these application(s) in the next 14 working days..."/>
                        </div>
                      )}

                      {/* Signatory */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Signed By (Name) *</label>
                          <input type="text" value={letterData.directorName} onChange={lf('directorName')} placeholder="Ms/Mr Name Surname" className="w-full border rounded-lg px-3 py-2 text-sm"/>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Title / Designation</label>
                          <input type="text" value={letterData.directorTitle} onChange={lf('directorTitle')} className="w-full border rounded-lg px-3 py-2 text-sm"/>
                        </div>
                      </div>

                      {/* Optional file upload */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Attach Signed Letter (Optional)</label>
                        <input type="file" ref={fileRef} onChange={e => setSelectedFile(e.target.files?.[0]||null)} accept=".pdf,.doc,.docx" className="hidden"/>
                        <div className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-gray-50" onClick={() => fileRef.current?.click()}>
                          <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1"/>
                          <p className="text-xs text-gray-500">{selectedFile ? selectedFile.name : 'Click to attach signed PDF/DOC'}</p>
                        </div>
                      </div>

                      {/* Issue Button */}
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowLetterForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Cancel</button>
                        <button
                          onClick={handleIssueResolution}
                          disabled={issuingLetter || !letterData.directorName}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 ${letterType === 'approval' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        >
                          {letterType === 'approval' ? <CheckCircle className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                          {issuingLetter ? 'Issuing...' : `Issue ${letterType === 'approval' ? 'Approval' : 'Rejection'} Resolution`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Close</button>
        </div>
      </div>
    </div>
  );
}

// Re-export the User icon used in phase reports
const User = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);