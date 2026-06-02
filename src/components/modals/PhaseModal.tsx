// components/modals/PhaseModal.tsx
import React, { useState, useRef,useEffect } from 'react';
import {
  X, FileText, CheckCircle, AlertCircle, Download, Calendar, User, Send, Save,
  CheckSquare, Trash2, Plus, Upload, Clock, Target, Users, Paperclip,
  Award, Shield, History, Image, File, FileArchive, UserCheck, BookOpen, ListChecks, Grid3x3
} from 'lucide-react';
import { 
  savePhaseFile, 
  getPhaseFiles, 
  deletePhaseFile,
  saveSubmittedReport,
  getCyclePlanByCode,
  saveCyclePlans
} from '@/lib/indexedDB';

interface Phase {
  name: string;
  startDate: string;
  endDate: string;
  responsibleRole: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedDate?: string;
  approved?: boolean;
  reportSubmitted?: boolean;
  reportData?: any;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string;
  uploadedAt: string;
  phaseName: string;
  section: string;
}

interface PhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  phase: Phase;
  phaseData: {
    objectives: string;
    findings: string;
    deliverables: string[];
    documents: { name: string; url: string }[];
  };
  qualificationCode: string;
  qualificationTitle: string;
  isLocked: boolean;
  isLastPhase: boolean;
}

// ── Reusable YES/NO + comment block (used in Scoping sections 5,7,8,9,10) ──
const ScopingConfirmation = ({
  label, value, onChange, comment, onCommentChange, disabled, radioName
}: {
  label: string;
  value: 'YES' | 'NO' | '';
  onChange: (v: 'YES' | 'NO') => void;
  comment: string;
  onCommentChange: (v: string) => void;
  disabled: boolean;
  radioName: string;
}) => (
  <div className="bg-gray-50 p-4 rounded-lg border">
    <p className="text-sm font-medium text-gray-700 mb-3">{label}:</p>
    <div className="flex gap-4 mb-3">
      {(['YES', 'NO'] as const).map(opt => (
        <label key={opt} className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${value === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <input type="radio" name={radioName} value={opt} checked={value === opt} onChange={() => onChange(opt)} disabled={disabled} className="w-4 h-4" />
          <span className="font-medium">{opt}</span>
        </label>
      ))}
    </div>
    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Comments</label>
    <textarea value={comment} onChange={e => onCommentChange(e.target.value)} disabled={disabled} className="w-full border rounded-lg p-3 text-sm" rows={2} placeholder="…" />
  </div>
);

const WG_CLASSIFICATIONS = [
  'WORKPLACE PRACTITIONER',
  'PROFESSIONAL BODY / NON-STATUTORY BODY',
  'REGULATORY / STATUTORY BODY',
  'EMPLOYER ASSOCIATION',
  'EMPLOYEE ASSOCIATION / TRADE UNION',
  'EDUCATION AND TRAINING PROVIDER (PUBLIC)',
  'EDUCATION AND TRAINING PROVIDER (PRIVATE)',
  'ASSESSMENT SPECIALIST (EXAMINER / MODERATOR WITH EXPERIENCE)',
  'CURRICULUM DEVELOPMENT SPECIALIST',
  'TEACHING AND LEARNING SPECIALIST',
  'COUNCIL ON HIGHER EDUCATION / UMALUSI REPRESENTATIVE',
  'HIGHER EDUCATION INSTITUTION / BASIC EDUCATION REPRESENTATIVE',
  'OTHER',
];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (fileType.includes('pdf')) return <FileText className="w-4 h-4" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return <FileArchive className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

export default function PhaseModal({
  isOpen, onClose, onSave, phase, phaseData, qualificationCode, qualificationTitle, isLocked, isLastPhase
}: PhaseModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [localPhaseData, setLocalPhaseData] = useState(phaseData);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState('');

  // ── File upload refs ──────────────────────────────────────────────────────
  const attachmentsRef        = useRef<HTMLInputElement>(null);
  const qualificationDocRef   = useRef<HTMLInputElement>(null);
  const attendanceRegisterRef = useRef<HTMLInputElement>(null);
  // Scoping-specific refs
  const scopingAttendanceRef  = useRef<HTMLInputElement>(null);
  const scopingWGListRef      = useRef<HTMLInputElement>(null);
  const scopingScheduleRef    = useRef<HTMLInputElement>(null);
  // Curriculum Specifications refs
  const curriculumTemplateRef = useRef<HTMLInputElement>(null);
  const curriculumWGMinsRef   = useRef<HTMLInputElement>(null);
  const curriculumNLRDAttachRef = useRef<HTMLInputElement>(null);

  const isReadOnly     = phase.reportSubmitted === true || phase.approved === true || isLocked;
  const isInputDisabled = isReadOnly || isLocked;

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    const stored = localStorage.getItem(`phaseFiles_${qualificationCode}_${phase.name}`);
    return stored ? JSON.parse(stored) : [];
  });

  // ── Scoping state (OQD-RT-01) ─────────────────────────────────────────────
  const [scopingOccupation, setScopingOccupation]           = useState('');
  const [scopingOfoCode, setScopingOfoCode]                 = useState('');
  const [scopingSpecialisation, setScopingSpecialisation]   = useState('');
  const [scopingMeetingDate, setScopingMeetingDate]         = useState('');
  const [scopingMeetingVenue, setScopingMeetingVenue]       = useState('');
  const [scopingMeetingTime, setScopingMeetingTime]         = useState('');
  const [scopingQualRows, setScopingQualRows] = useState([
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }
  ]);
  const [scopingPartQualRows, setScopingPartQualRows] = useState([
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
  ]);
  const [scopingSkillsProgRows, setScopingSkillsProgRows] = useState([
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
  ]);
  const [scopingStakeholders, setScopingStakeholders] = useState([
    { classification: 'WORKPLACE PRACTITIONER',                                               invited: '', attended: '', isTotal: false },
    { classification: 'PROFESSIONAL BODY / NON-STATUTORY BODY',                               invited: '', attended: '', isTotal: false },
    { classification: 'REGULATORY / STATUTORY BODY',                                          invited: '', attended: '', isTotal: false },
    { classification: 'EMPLOYER ASSOCIATION',                                                  invited: '', attended: '', isTotal: false },
    { classification: 'EMPLOYEE ASSOCIATION / TRADE UNION',                                   invited: '', attended: '', isTotal: false },
    { classification: 'EDUCATION AND TRAINING PROVIDER (PUBLIC)',                              invited: '', attended: '', isTotal: false },
    { classification: 'EDUCATION AND TRAINING PROVIDER (PRIVATE)',                            invited: '', attended: '', isTotal: false },
    { classification: 'ASSESSMENT SPECIALIST (EXAMINER / MODERATOR WITH EXPERIENCE)',         invited: '', attended: '', isTotal: false },
    { classification: 'CURRICULUM DEVELOPMENT SPECIALIST',                                    invited: '', attended: '', isTotal: false },
    { classification: 'TEACHING AND LEARNING SPECIALIST',                                     invited: '', attended: '', isTotal: false },
    { classification: 'COUNCIL ON HIGHER EDUCATION / UMALUSI REPRESENTATIVE',                 invited: '', attended: '', isTotal: false },
    { classification: 'HIGHER EDUCATION INSTITUTION / BASIC EDUCATION INSTITUTION REPRESENTATIVE', invited: '', attended: '', isTotal: false },
    { classification: 'OTHER',                                                                 invited: '', attended: '', isTotal: false },
    { classification: 'TOTAL',                                                                 invited: '', attended: '', isTotal: true  },
  ]);
  const [scopingProcessDiscussed, setScopingProcessDiscussed]             = useState<'YES' | 'NO' | ''>('');
  const [scopingProcessComment, setScopingProcessComment]                 = useState('');
  const [scopingSMERows, setScopingSMERows] = useState([
    { name: '', surname: '', email: '', cell: '', phone: '' }
  ]);
  const [scopingSMEComments, setScopingSMEComments]                       = useState('');
  const [scopingRationaleConfirmed, setScopingRationaleConfirmed]         = useState<'YES' | 'NO' | ''>('');
  const [scopingRationaleComment, setScopingRationaleComment]             = useState('');
  const [scopingStakeholdersIdentified, setScopingStakeholdersIdentified] = useState<'YES' | 'NO' | ''>('');
  const [scopingStakeholdersComment, setScopingStakeholdersComment]       = useState('');
  const [scopingWGNominated, setScopingWGNominated]                       = useState<'YES' | 'NO' | ''>('');
  const [scopingWGComment, setScopingWGComment]                           = useState('');
  const [scopingScheduleOutlined, setScopingScheduleOutlined]             = useState<'YES' | 'NO' | ''>('');
  const [scopingScheduleComment, setScopingScheduleComment]               = useState('');
  const [scopingDeclarantName, setScopingDeclarantName]                   = useState('');
  const [scopingDeclarationDay, setScopingDeclarationDay]                 = useState('');
  const [scopingDeclarationMonth, setScopingDeclarationMonth]             = useState('');
  const [scopingDeclarationYear, setScopingDeclarationYear]               = useState('');
  const [scopingDeclarationPlace, setScopingDeclarationPlace]             = useState('');
  const [scopingWitness1, setScopingWitness1]                             = useState('');
  const [scopingWitness2, setScopingWitness2]                             = useState('');

  // ── Profiling state (OQD-RT-02) ───────────────────────────────────────────
  const [profilingOccupation, setProfilingOccupation]         = useState('');
  const [profilingOfoCode, setProfilingOfoCode]               = useState('');
  const [profilingSpecialisation, setProfilingSpecialisation] = useState('');
  const [meetingDate, setMeetingDate]   = useState('');
  const [meetingVenue, setMeetingVenue] = useState('');
  const [meetingTime, setMeetingTime]   = useState('');
  const [qualRows, setQualRows] = useState([
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }
  ]);
  const [partQualRows, setPartQualRows] = useState([
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
  ]);
  const [skillsProgRows, setSkillsProgRows] = useState([
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
  ]);
  const [wgMembers, setWgMembers] = useState(
    WG_CLASSIFICATIONS.map((cls, idx) => ({
      id: idx + 1, nameAndSurname: '', classification: cls, invited: '', attended: ''
    }))
  );
  const [wgComments, setWgComments]                                       = useState('');
  const [verificationSentConfirm, setVerificationSentConfirm]             = useState<'YES' | 'NO' | ''>('');
  const [verificationSentYear, setVerificationSentYear]                   = useState('');
  const [verificationSentMonth, setVerificationSentMonth]                 = useState('');
  const [verificationSentDay, setVerificationSentDay]                     = useState('');
  const [consultationMethods, setConsultationMethods]                     = useState('');
  const [finalProfileSentConfirm, setFinalProfileSentConfirm]             = useState<'YES' | 'NO' | ''>('');
  const [finalProfileSentYear, setFinalProfileSentYear]                   = useState('');
  const [finalProfileSentMonth, setFinalProfileSentMonth]                 = useState('');
  const [finalProfileSentDay, setFinalProfileSentDay]                     = useState('');
  const [finalProfileMethods, setFinalProfileMethods]                     = useState('');
  const [declarantName, setDeclarantName]                                 = useState('');
  const [declarationDay, setDeclarationDay]                               = useState('');
  const [declarationMonth, setDeclarationMonth]                           = useState('');
  const [declarationYear, setDeclarationYear]                             = useState('');
  const [declarationPlace, setDeclarationPlace]                           = useState('');
  const [witness1Name, setWitness1Name]                                   = useState('');
  const [witness2Name, setWitness2Name]                                   = useState('');

  // ── Curriculum Specifications state (Curriculum Document Report) ──────────
  // Section 1: QCTO approved application details
  const [curriculumOccupation, setCurriculumOccupation] = useState('');
  const [curriculumOfoCode, setCurriculumOfoCode] = useState('');
  const [curriculumSpecialisation, setCurriculumSpecialisation] = useState('');

  // Section 2: Curriculum Specifications Development Meeting details
  const [curriculumMeetingDate, setCurriculumMeetingDate] = useState('');
  const [curriculumMeetingVenue, setCurriculumMeetingVenue] = useState('');
  const [curriculumMeetingTime, setCurriculumMeetingTime] = useState('');

  // Section 3: Details of qualification in development
  const [curriculumQualRows, setCurriculumQualRows] = useState([
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }
  ]);

  // Section 4: Details of part qualification in development
  const [curriculumPartQualRows, setCurriculumPartQualRows] = useState([
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
  ]);

  // Section 5: Details of skills programme in development
  const [curriculumSkillsProgRows, setCurriculumSkillsProgRows] = useState([
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
    { qualType: '', qualTitle: '', nqfLevel: '', credits: '' },
  ]);

  // Section 6: Working Group (WG) Members participation
  const [curriculumWgMembers, setCurriculumWgMembers] = useState(
    WG_CLASSIFICATIONS.map((cls, idx) => ({
      id: idx + 1,
      nameAndSurname: '',
      classification: cls,
      component: '', // KM (Knowledge/Theory), PM (Practical Skills), WM (Work Experience)
      invited: '',
      attended: ''
    }))
  );

  // Section 7: Comments
  const [curriculumComments, setCurriculumComments] = useState('');

  // Section 8: QP Declaration
  const [curriculumDeclarantName, setCurriculumDeclarantName] = useState('');
  const [curriculumDeclarationDay, setCurriculumDeclarationDay] = useState('');
  const [curriculumDeclarationMonth, setCurriculumDeclarationMonth] = useState('');
  const [curriculumDeclarationYear, setCurriculumDeclarationYear] = useState('');
  const [curriculumDeclarationPlace, setCurriculumDeclarationPlace] = useState('');
  const [curriculumWitness1, setCurriculumWitness1] = useState('');
  const [curriculumWitness2, setCurriculumWitness2] = useState('');
  // ── Assessment Specifications (QAS) state ───────────────────────────────────
const [qasQualRows, setQasQualRows] = useState([{ type: '', title: '', nqfLevel: '', credits: '' }]);
const [qasCurriculumCode, setQasCurriculumCode] = useState('');
const [qasOrganisationName, setQasOrganisationName] = useState('');
const [qasWebsiteAddress, setQasWebsiteAddress] = useState('');
const [qasTelephoneNumber, setQasTelephoneNumber] = useState('');
const [qasQualityPartnerType, setQasQualityPartnerType] = useState('');
const [qasFormativeAssessment, setQasFormativeAssessment] = useState('');
const [qasSummativeAssessment, setQasSummativeAssessment] = useState('');
const [qasEisaPlanning, setQasEisaPlanning] = useState('');
const [qasFormatAssessment, setQasFormatAssessment] = useState('');
const [qasCognitiveKnowledge, setQasCognitiveKnowledge] = useState('');
const [qasCognitiveApplication, setQasCognitiveApplication] = useState('');
const [qasCognitiveCriticalThinking, setQasCognitiveCriticalThinking] = useState('');
const [qasDurationWritten, setQasDurationWritten] = useState('');
const [qasDurationPractical, setQasDurationPractical] = useState('');
const [qasDurationOther, setQasDurationOther] = useState('');
const [qasTotalMarks, setQasTotalMarks] = useState('');
const [qasReqWritten, setQasReqWritten] = useState('');
const [qasReqPractical, setQasReqPractical] = useState('');
const [qasReqOther, setQasReqOther] = useState('');
const [qasFinalResultCalc, setQasFinalResultCalc] = useState('');
const [qasAssessmentCentreReqs, setQasAssessmentCentreReqs] = useState('');
const [qasCandidateRequirements, setQasCandidateRequirements] = useState('');
const [qasOpenClosedBook, setQasOpenClosedBook] = useState('');
const [qasSpecialNeeds, setQasSpecialNeeds] = useState('');
const [qasExitLevelOutcomes, setQasExitLevelOutcomes] = useState([{ outcome: '', weighting: '', criticalAspects: '' }]);
const [qasAssessmentDates, setQasAssessmentDates] = useState('');
const [qasEligibilityReqs, setQasEligibilityReqs] = useState('');
const [qasSmeDevelopers, setQasSmeDevelopers] = useState('');
const [qasSmeMarkers, setQasSmeMarkers] = useState('');
const [qasSmeModerators, setQasSmeModerators] = useState('');
const [qasDeclarantName, setQasDeclarantName] = useState('');
const [qasDeclarationDay, setQasDeclarationDay] = useState('');
const [qasDeclarationMonth, setQasDeclarationMonth] = useState('');
const [qasDeclarationYear, setQasDeclarationYear] = useState('');
const [qasDeclarationPlace, setQasDeclarationPlace] = useState('');
const [qasWitness1, setQasWitness1] = useState('');
const [qasWitness2, setQasWitness2] = useState('');
// ── Final Verification state ────────────────────────────────────────────────
const [finalVerificationOccupation, setFinalVerificationOccupation] = useState('');
const [finalVerificationOfoCode, setFinalVerificationOfoCode] = useState('');
const [finalVerificationSpecialisation, setFinalVerificationSpecialisation] = useState('');
const [finalVerificationMeetingDate, setFinalVerificationMeetingDate] = useState('');
const [finalVerificationMeetingVenue, setFinalVerificationMeetingVenue] = useState('');
const [finalVerificationMeetingTime, setFinalVerificationMeetingTime] = useState('');
const [finalVerificationQualRows, setFinalVerificationQualRows] = useState([{ qualType: '', qualTitle: '', nqfLevel: '', credits: '' }]);
const [finalVerificationPartQualRows, setFinalVerificationPartQualRows] = useState([{ qualType: '', qualTitle: '', nqfLevel: '', credits: '' }]);
const [finalVerificationSkillsProgRows, setFinalVerificationSkillsProgRows] = useState([{ qualType: '', qualTitle: '', nqfLevel: '', credits: '' }]);
const [finalVerificationStakeholders, setFinalVerificationStakeholders] = useState([
  { classification: 'WORKPLACE PRACTITIONER', invited: '', attended: '', isTotal: false },
  { classification: 'PROFESSIONAL BODY / NON-STATUTORY BODY', invited: '', attended: '', isTotal: false },
  { classification: 'REGULATORY / STATUTORY BODY', invited: '', attended: '', isTotal: false },
  { classification: 'EMPLOYER ASSOCIATION', invited: '', attended: '', isTotal: false },
  { classification: 'EMPLOYEE ASSOCIATION / LABOUR UNION', invited: '', attended: '', isTotal: false },
  { classification: 'EDUCATION AND TRAINING PROVIDER (PUBLIC)', invited: '', attended: '', isTotal: false },
  { classification: 'EDUCATION AND TRAINING PROVIDER (PRIVATE)', invited: '', attended: '', isTotal: false },
  { classification: 'ASSESSMENT SPECIALIST (EXAMINER / MODERATOR WITH EXPERIENCE)', invited: '', attended: '', isTotal: false },
  { classification: 'CURRICULUM DEVELOPMENT SPECIALIST', invited: '', attended: '', isTotal: false },
  { classification: 'TEACHING AND LEARNING SPECIALIST', invited: '', attended: '', isTotal: false },
  { classification: 'COUNCIL ON HIGHER EDUCATION REPRESENTATIVE', invited: '', attended: '', isTotal: false },
  { classification: 'HIGHER EDUCATION INSTITUTION REPRESENTATIVE', invited: '', attended: '', isTotal: false },
  { classification: 'OTHER', invited: '', attended: '', isTotal: false },
  { classification: 'TOTAL', invited: '', attended: '', isTotal: true },
]);
const [finalVerificationSMERows, setFinalVerificationSMERows] = useState([{ name: '', surname: '', email: '', cell: '', phone: '' }]);
const [finalVerificationComments, setFinalVerificationComments] = useState('');
const [finalVerificationDeclarantName, setFinalVerificationDeclarantName] = useState('');
const [finalVerificationDeclarationDay, setFinalVerificationDeclarationDay] = useState('');
const [finalVerificationDeclarationMonth, setFinalVerificationDeclarationMonth] = useState('');
const [finalVerificationDeclarationYear, setFinalVerificationDeclarationYear] = useState('');
const [finalVerificationDeclarationPlace, setFinalVerificationDeclarationPlace] = useState('');
const [finalVerificationWitness1, setFinalVerificationWitness1] = useState('');
const [finalVerificationWitness2, setFinalVerificationWitness2] = useState('');

// ── Final Verification refs ─────────────────────────────────────────────────
const finalVerificationAttendanceRef = useRef<HTMLInputElement>(null);
// ── Assessment Specifications refs ──────────────────────────────────────────
const qasLogoRef = useRef<HTMLInputElement>(null);
const qasDocumentRef = useRef<HTMLInputElement>(null);

// ── Qualification Document + Stage 1 Evaluation state ──────────────────────
const [qualificationDocSummary, setQualificationDocSummary] = useState('');
const [qualificationDocVersion, setQualificationDocVersion] = useState('');
const [qualificationDocCompletionDate, setQualificationDocCompletionDate] = useState('');
const [qualificationDocReviewerNotes, setQualificationDocReviewerNotes] = useState('');

// Document sections tracker
const [qualificationDocSections, setQualificationDocSections] = useState([
  { name: 'Qualification Overview & Purpose', completed: false },
  { name: 'Occupational Profile & Rationale', completed: false },
  { name: 'Entry Requirements', completed: false },
  { name: 'Curriculum Structure & Modules', completed: false },
  { name: 'Knowledge Modules', completed: false },
  { name: 'Practical Skill Modules', completed: false },
  { name: 'Work Experience Modules', completed: false },
  { name: 'Articulation Options', completed: false },
  { name: 'Assessment Guidelines', completed: false },
  { name: 'Glossary of Terms', completed: false },
]);
// ── QAS Addendum Evaluation state ─────────────────────────────────────────
const [qasAddendumCommitteeApproval, setQasAddendumCommitteeApproval] = useState<'yes' | 'no' | ''>('');
const [qasAddendumApprovalDate, setQasAddendumApprovalDate] = useState('');
const [qasAddendumAqpName, setQasAddendumAqpName] = useState('');
const [qasAddendumContactName, setQasAddendumContactName] = useState('');
const [qasAddendumContactEmail, setQasAddendumContactEmail] = useState('');
const [qasAddendumPhysicalAddress, setQasAddendumPhysicalAddress] = useState('');
const [qasAddendumDateReceived, setQasAddendumDateReceived] = useState('');
const [qasAddendumDateEvaluated, setQasAddendumDateEvaluated] = useState('');
const [qasAddendumEvaluatorName, setQasAddendumEvaluatorName] = useState('');
const [qasAddendumQualTitle, setQasAddendumQualTitle] = useState('');
const [qasAddendumSaqaId, setQasAddendumSaqaId] = useState('');
const [qasAddendumDateRegistered, setQasAddendumDateRegistered] = useState('');
const [qasAddendumNqfLevel, setQasAddendumNqfLevel] = useState('');
const [qasAddendumCredits, setQasAddendumCredits] = useState('');
const [qasAddendumRegStartDate, setQasAddendumRegStartDate] = useState('');
const [qasAddendumRegEndDate, setQasAddendumRegEndDate] = useState('');
const [qasAddendumComponents, setQasAddendumComponents] = useState([{ name: '', totalMarks: '', passMark: '' }]);
const [qasAddendumFinalCalc, setQasAddendumFinalCalc] = useState('');
const [qasAddendumFinalPass, setQasAddendumFinalPass] = useState('');
const [qasAddendumDuration, setQasAddendumDuration] = useState('');
const [qasAddendumFormat, setQasAddendumFormat] = useState('');
const [qasAddendumLayout, setQasAddendumLayout] = useState('');
const [qasAddendumOpenClosed, setQasAddendumOpenClosed] = useState('');
const [qasAddendumAssessmentPoints, setQasAddendumAssessmentPoints] = useState('');
const [qasAddendumSupplementary, setQasAddendumSupplementary] = useState('');
const [qasAddendumModerationPercent, setQasAddendumModerationPercent] = useState('');
const [qasAddendumMarkingDays, setQasAddendumMarkingDays] = useState('');
const [qasAddendumModerationDays, setQasAddendumModerationDays] = useState('');
const [qasAddendumFindings, setQasAddendumFindings] = useState('');
const [qasAddendumRecommendation, setQasAddendumRecommendation] = useState('');
const [qasAddendumFinalRecommendation, setQasAddendumFinalRecommendation] = useState<'approved' | 'notApproved' | ''>('');
const [qasAddendumFirstEvaluatorName, setQasAddendumFirstEvaluatorName] = useState('');
const [qasAddendumFirstRec, setQasAddendumFirstRec] = useState<'approved' | 'amendments' | 'notRecommended' | ''>('');
const [qasAddendumAssistantDirector, setQasAddendumAssistantDirector] = useState('');
const [qasAddendumAssistantDirectorDate, setQasAddendumAssistantDirectorDate] = useState('');
const [qasAddendumSecondEvaluatorName, setQasAddendumSecondEvaluatorName] = useState('');
const [qasAddendumSecondRec, setQasAddendumSecondRec] = useState<'approved' | 'amendments' | 'notRecommended' | ''>('');
const [qasAddendumDeputyDirector, setQasAddendumDeputyDirector] = useState('');
const [qasAddendumDeputyDirectorDate, setQasAddendumDeputyDirectorDate] = useState('');
const [qasAddendumFinalRec, setQasAddendumFinalRec] = useState<'approved' | 'amendments' | 'notRecommended' | ''>('');
const [qasAddendumDirectorName, setQasAddendumDirectorName] = useState('');
const [qasAddendumDirectorDate, setQasAddendumDirectorDate] = useState('');
const [qasAddendumCommitteeFinal, setQasAddendumCommitteeFinal] = useState<'yes' | 'no' | ''>('');
const [qasAddendumCommitteeFinalDate, setQasAddendumCommitteeFinalDate] = useState('');

// Verification items
const [qasAddendumVerificationItems, setQasAddendumVerificationItems] = useState([
  { label: 'Is the Correct Qualification Title (as per SAQA)', value: '', comment: '' },
  { label: 'Is the Correct NQF Level', value: '', comment: '' },
  { label: 'NQF Level of EISA', value: '', comment: '' },
  { label: 'Are the Correct total Credits identified', value: '', comment: '' },
  { label: 'Number of Components', value: '', comment: '' },
]);

// Core evaluation checklist items
const [qasAddendumEvaluation, setQasAddendumEvaluation] = useState([
  { item: '1.1 External Assessment Specification Model Evaluation', subItem: 'Is the Type of Model defined and described', status: '', comment: '' },
  { item: '1.1 External Assessment Specification Model Evaluation', subItem: 'Has the AQP clearly stated where copies will be made?', status: '', comment: '' },
  { item: '1.1 External Assessment Specification Model Evaluation', subItem: 'Has the AQP explained the distribution process of the EISA?', status: '', comment: '' },
  { item: '1.1 External Assessment Specification Model Evaluation', subItem: 'Has AQP provided a timeline for EISA distribution to Assessment Centres?', status: '', comment: '' },
  { item: '1.1 External Assessment Specification Model Evaluation', subItem: 'Does the AQP have acceptable security precautions?', status: '', comment: '' },
  { item: '1.2 Qualification Outcomes', subItem: 'The Exit Level Outcomes listed are the same as in the SAQA qualification document', status: '', comment: '' },
  { item: '1.2 Qualification Outcomes', subItem: 'ELOs relate to Occupational Profile (Section 2 of Curriculum)', status: '', comment: '' },
  { item: '1.2 Qualification Outcomes', subItem: 'ELOs relate to Integrated Assessment Focus Areas', status: '', comment: '' },
  { item: '1.2 Qualification Outcomes', subItem: 'The weighting per ELO are the same as listed in the curriculum', status: '', comment: '' },
  { item: '1.2 Qualification Outcomes', subItem: 'Key Assessment Focus Areas are bulleted concisely as job specifications', status: '', comment: '' },
  { item: '1.3 Distribution of Cognitive application Evaluation', subItem: 'The correct level of the qualification has been indicated', status: '', comment: '' },
  { item: '1.3 Distribution of Cognitive application Evaluation', subItem: 'Spread of percentages suits the type of model and NQF Level', status: '', comment: '' },
  { item: '1.3 Distribution of Cognitive application Evaluation', subItem: 'All percentages add up to 100%', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: 'ELOs assessed separately or integrated appropriately', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: 'Key Assessment Focus Areas correspond to ELOs', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: 'Evidence required is suitable to assess occupational competencies', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: 'Evidence matches task/question numbers', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: 'Variety of types of tasks/questions included', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: 'Marks per item have been indicated', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: 'Reasonable time allocations have been indicated', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: 'Module codes have been indicated for each question', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: 'Final EISA is set within the range of the curriculum', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: '75%-100% of modules have been listed in the grid', status: '', comment: '' },
  { item: '1.4 Assessment Grid (Blueprint) Process Evaluation', subItem: 'Cognitive order allocated as per marks allocations', status: '', comment: '' },
  { item: '1.5 Mark Evaluation', subItem: 'If marks, is the total column completed', status: '', comment: '' },
  { item: '1.5 Mark Evaluation', subItem: 'Marks have been subtotalled', status: '', comment: '' },
  { item: '1.5 Mark Evaluation', subItem: 'Grand total of marks has been indicated', status: '', comment: '' },
  { item: '1.5 Mark Evaluation', subItem: 'Marks are same as stipulated under 1.4', status: '', comment: '' },
  { item: '1.5 Mark Evaluation', subItem: 'Time has been subtotalled (in minutes/days)', status: '', comment: '' },
]);

// Characteristics evaluation
const [qasAddendumCharacteristics, setQasAddendumCharacteristics] = useState([
  { characteristic: 'Relevance', description: 'Assessment instruments will be able to be developed to assess occupational competencies', status: '', comment: '' },
  { characteristic: 'Set Standards', description: 'Developers would be able to develop a large number of items for the item bank according to standards set', status: '', comment: '' },
  { characteristic: 'Accuracy', description: 'The QAS Addendum measures occupational competence required at the exit level', status: '', comment: '' },
  { characteristic: 'Best Practice', description: 'The final EISA is in line with national and international best practice assessment methodology', status: '', comment: '' },
]);

// Supporting documents
const [qasAddendumSupportingDocs, setQasAddendumSupportingDocs] = useState([
  { id: 'saqa_doc', name: 'SAQA Qualification Document', uploaded: false },
  { id: 'curriculum_doc', name: 'Curriculum Document (especially Section 2)', uploaded: false },
  { id: 'external_qas', name: 'External Qualification Assessment Specifications', uploaded: false },
  { id: 'qas_addendum', name: 'QAS Addendum', uploaded: false },
]);
// Stage 1 Self-Evaluation (SME Checklist)
const stage1TotalCriteria = 18; // Total number of checklist items

const [stage1Evaluation, setStage1Evaluation] = useState<Record<string, { status: 'pass' | 'fail' | 'pending'; comment: string }>>({});
const [stage1SmeDeclaration, setStage1SmeDeclaration] = useState(false);
const [stage1SmeName, setStage1SmeName] = useState('');
const [stage1SmeDate, setStage1SmeDate] = useState('');
const [stage1SmeRole, setStage1SmeRole] = useState('');

// Calculate pass/fail counts
const stage1PassCount = Object.values(stage1Evaluation).filter(v => v.status === 'pass').length;
const stage1FailCount = Object.values(stage1Evaluation).filter(v => v.status === 'fail').length;
const stage1PendingCount = stage1TotalCriteria - stage1PassCount - stage1FailCount;

// Evaluation categories with criteria
const stage1Categories = [
  {
    name: 'A. Curriculum Alignment',
    criteria: [
      'Qualification aligns with the approved Occupational Profile',
      'Exit Level Outcomes match the approved curriculum specifications',
      'NQF Level descriptors are correctly applied'
    ]
  },
  {
    name: 'B. Content Completeness',
    criteria: [
      'All knowledge modules are fully described with learning outcomes',
      'All practical skill modules are fully described with assessment criteria',
      'Work experience requirements are clearly defined',
      'Credit allocation is correct and justified'
    ]
  },
  {
    name: 'C. Assessment Strategy',
    criteria: [
      'Formative assessment methods are clearly described',
      'Summative assessment approach is defined',
      'EISA requirements are properly documented',
      'Moderation processes are outlined'
    ]
  },
  {
    name: 'D. Quality & Compliance',
    criteria: [
      'Language is clear, concise, and appropriate for the target audience',
      'Document follows QCTO prescribed format and template',
      'All mandatory sections are completed (no placeholders remain)',
      'References to relevant policies and legislation are accurate'
    ]
  },
  {
    name: 'E. Supporting Documentation',
    criteria: [
      'Articulation pathways are identified',
      'RPL policy is referenced',
      'Glossary of terms is complete',
      'Appendices (if any) are attached and referenced correctly'
    ]
  }
];
// ── Stage 2 Evaluation + Submission to QCTO state ──────────────────────────
const [stage2Phases, setStage2Phases] = useState([
  { name: 'Scoping', description: 'Initial scoping meeting and report', completed: false, approvedDate: '' },
  { name: 'Profiling', description: 'Occupational profile development', completed: false, approvedDate: '' },
  { name: 'Develop Curriculum Specifications', description: 'Curriculum document finalised', completed: false, approvedDate: '' },
  { name: 'Develop Assessment Specifications', description: 'QAS document finalised', completed: false, approvedDate: '' },
  { name: 'Develop QAS Addendum', description: 'Addendum (if applicable)', completed: false, approvedDate: '' },
  { name: 'Develop Qualification Document', description: 'Qualification document + Stage 1', completed: false, approvedDate: '' },
]);

const stage2TotalPhases = stage2Phases.length;
const stage2CompletedPhases = stage2Phases.filter(p => p.completed).length;

// Quality Checklist Criteria
const [qualityCriteria, setQualityCriteria] = useState([
  { item: 'All development phases are complete and approved', notes: 'Check each phase status above', checked: false },
  { item: 'Qualification aligns with NQF level descriptors', notes: 'Verify NQF level is appropriate', checked: false },
  { item: 'Credit allocation is correct and justifiable', notes: 'Total credits should be 120+ for full qualification', checked: false },
  { item: 'Assessment strategy is clearly defined', notes: 'Both formative and summative assessments described', checked: false },
  { item: 'Articulation pathways are documented', notes: 'Higher education and occupational pathways', checked: false },
  { item: 'RPL policy is referenced', notes: 'Recognition of Prior Learning provisions', checked: false },
  { item: 'Language and formatting meet QCTO standards', notes: 'Professional, clear, and consistent', checked: false },
  { item: 'All mandatory sections are complete', notes: 'No placeholder text or TBD items', checked: false },
]);

// Submission Documents Checklist
// Submission Documents Checklist - Simplified (no fileRef)
const [submissionDocuments, setSubmissionDocuments] = useState([
  { id: 'qual_doc', name: 'Qualification Document (Final)', requiredFormat: '.docx or .pdf', uploaded: false, fileName: '' },
  { id: 'qas_doc', name: 'Qualification Assessment Specifications (QAS)', requiredFormat: '.docx or .pdf', uploaded: false, fileName: '' },
  { id: 'curriculum_doc', name: 'Curriculum Document', requiredFormat: '.docx or .pdf', uploaded: false, fileName: '' },
  { id: 'profile_report', name: 'Occupational Profile Report', requiredFormat: '.docx or .pdf', uploaded: false, fileName: '' },
  { id: 'scoping_report', name: 'Scoping Report', requiredFormat: '.docx or .pdf', uploaded: false, fileName: '' },
  { id: 'profiling_report', name: 'Profiling Report', requiredFormat: '.docx or .pdf', uploaded: false, fileName: '' },
  { id: 'stage1_checklist', name: 'Stage 1 Self-Evaluation Checklist', requiredFormat: '.docx or .pdf', uploaded: false, fileName: '' },
  { id: 'attendance_registers', name: 'Meeting Attendance Registers (All Phases)', requiredFormat: '.pdf (combined)', uploaded: false, fileName: '' },
]);

// QP Declaration
const [stage2QpDeclaration, setStage2QpDeclaration] = useState(false);
const [stage2QpName, setStage2QpName] = useState('');
const [stage2QpRole, setStage2QpRole] = useState('');
const [stage2QpDate, setStage2QpDate] = useState('');

// Submission Details
const [stage2QctoReference, setStage2QctoReference] = useState('');
const [stage2SubmissionMethod, setStage2SubmissionMethod] = useState('');
const [stage2SubmissionNotes, setStage2SubmissionNotes] = useState('');
const [stage2QctoAcknowledged, setStage2QctoAcknowledged] = useState(false);
  // ── Other phase states ────────────────────────────────────────────────────
  const [competencies, setCompetencies] = useState([
    { competency: 'Project Management', outcome: 'Apply PM principles', standard: 'PMBOK 7th' },
    { competency: 'Risk Assessment',    outcome: 'Identify project risks', standard: 'ISO 31000' },
  ]);
  const [complianceChecklist, setComplianceChecklist] = useState([
    { item: 'Curriculum aligned to outcomes', checked: false },
    { item: 'NQF standards followed',         checked: false },
    { item: 'Workplace requirements defined',  checked: false },
    { item: 'Assessment strategy included',    checked: false },
  ]);
  const [issues, setIssues] = useState([
    { issue: 'Missing assessment criteria', severity: 'High', recommendation: 'Add criteria for Module 3' },
  ]);
  const [newIssue, setNewIssue] = useState({ issue: '', severity: 'Medium', recommendation: '' });
  const [history] = useState([
    { action: 'Phase started', user: 'System',            date: '2024-03-15 09:00', details: 'Initial phase created' },
    { action: 'Team assigned', user: 'Dr. Sarah Johnson', date: '2024-03-15 10:15', details: 'Added team members' },
  ]);
  useEffect(() => {
  const loadFiles = async () => {
    const files = await getPhaseFiles(qualificationCode, phase.name);
    setUploadedFiles(files);
  };
  if (isOpen) {
    loadFiles();
  }
}, [isOpen, qualificationCode, phase.name]);

  if (!isOpen) return null;
  

  // ── File helpers ──────────────────────────────────────────────────────────

 const handleFileUpload = async (file: File, section: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const newFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string,
        uploadedAt: new Date().toISOString(),
        phaseName: phase.name,
        qualificationCode: qualificationCode,
        section: section
      };
      
      await savePhaseFile(newFile);
      
      // Update local state
      const updated = [...uploadedFiles, newFile];
      setUploadedFiles(updated);
      
      resolve('success');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

 const handleDeleteFile = async (fileId: string) => {
  await deletePhaseFile(fileId);
  const updated = uploadedFiles.filter(f => f.id !== fileId);
  setUploadedFiles(updated);
};



  const handleDownloadFile = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFileList = (section: string) => {
    const sectionFiles = uploadedFiles.filter(f => f.section === section);
    if (sectionFiles.length === 0) return <p className="text-sm text-gray-500 mt-1">No files uploaded</p>;
    return (
      <div className="space-y-2 mt-2">
        {sectionFiles.map(file => (
          <div key={file.id} className="flex items-center justify-between bg-white p-2 rounded border">
            <div className="flex items-center gap-2">
              {getFileIcon(file.type)}
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDownloadFile(file)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Download">
                <Download className="w-4 h-4" />
              </button>
              {!isLocked && !phase.reportSubmitted && (
                <button onClick={() => handleDeleteFile(file.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  

  // ── Save & submit ─────────────────────────────────────────────────────────

  const collectAllData = () => ({
    ...localPhaseData,
    // Scoping
    scopingOccupation, scopingOfoCode, scopingSpecialisation,
    scopingMeetingDate, scopingMeetingVenue, scopingMeetingTime,
    scopingQualRows, scopingPartQualRows, scopingSkillsProgRows,
    scopingStakeholders,
    scopingProcessDiscussed, scopingProcessComment,
    scopingSMERows, scopingSMEComments,
    scopingRationaleConfirmed, scopingRationaleComment,
    scopingStakeholdersIdentified, scopingStakeholdersComment,
    scopingWGNominated, scopingWGComment,
    scopingScheduleOutlined, scopingScheduleComment,
    scopingDeclarantName, scopingDeclarationDay, scopingDeclarationMonth,
    scopingDeclarationYear, scopingDeclarationPlace,
    scopingWitness1, scopingWitness2,
    // Profiling
    profilingOccupation, profilingOfoCode, profilingSpecialisation,
    meetingDate, meetingVenue, meetingTime,
    qualRows, partQualRows, skillsProgRows,
    wgMembers, wgComments,
    verificationSentConfirm, verificationSentYear, verificationSentMonth, verificationSentDay,
    consultationMethods,
    finalProfileSentConfirm, finalProfileSentYear, finalProfileSentMonth, finalProfileSentDay,
    finalProfileMethods,
    declarantName, declarationDay, declarationMonth, declarationYear, declarationPlace,
    witness1Name, witness2Name,
    // Curriculum Specifications
    curriculumOccupation, curriculumOfoCode, curriculumSpecialisation,
    curriculumMeetingDate, curriculumMeetingVenue, curriculumMeetingTime,
    curriculumQualRows, curriculumPartQualRows, curriculumSkillsProgRows,
    curriculumWgMembers, curriculumComments,
    curriculumDeclarantName, curriculumDeclarationDay, curriculumDeclarationMonth,
    curriculumDeclarationYear, curriculumDeclarationPlace,
    curriculumWitness1, curriculumWitness2,
    // Other
    competencies, complianceChecklist, issues, additionalNotes,
    uploadedFiles: uploadedFiles.map(f => ({ id: f.id, name: f.name, section: f.section, size: f.size, type: f.type })),
    phaseName: phase.name, qualificationCode, qualificationTitle,
    // Assessment Specifications
qasQualRows, qasCurriculumCode, qasOrganisationName, qasWebsiteAddress, qasTelephoneNumber,
qasQualityPartnerType, qasFormativeAssessment, qasSummativeAssessment, qasEisaPlanning,
qasFormatAssessment, qasCognitiveKnowledge, qasCognitiveApplication, qasCognitiveCriticalThinking,
qasDurationWritten, qasDurationPractical, qasDurationOther, qasTotalMarks,
qasReqWritten, qasReqPractical, qasReqOther, qasFinalResultCalc, qasAssessmentCentreReqs,
qasCandidateRequirements, qasOpenClosedBook, qasSpecialNeeds, qasExitLevelOutcomes,
qasAssessmentDates, qasEligibilityReqs, qasSmeDevelopers, qasSmeMarkers, qasSmeModerators,
qasDeclarantName, qasDeclarationDay, qasDeclarationMonth, qasDeclarationYear, qasDeclarationPlace,
qasWitness1, qasWitness2,
finalVerificationOccupation, finalVerificationOfoCode, finalVerificationSpecialisation,
finalVerificationMeetingDate, finalVerificationMeetingVenue, finalVerificationMeetingTime,
finalVerificationQualRows, finalVerificationPartQualRows, finalVerificationSkillsProgRows,
finalVerificationStakeholders, finalVerificationSMERows, finalVerificationComments,
finalVerificationDeclarantName, finalVerificationDeclarationDay, finalVerificationDeclarationMonth,
finalVerificationDeclarationYear, finalVerificationDeclarationPlace,
finalVerificationWitness1, finalVerificationWitness2,
// Qualification Document + Stage 1 Evaluation
qualificationDocSummary, qualificationDocVersion, qualificationDocCompletionDate,
qualificationDocSections, stage1Evaluation, stage1SmeDeclaration, stage1SmeName,
stage1SmeDate, stage1SmeRole, qualificationDocReviewerNotes,
// Stage 2 Evaluation + Submission
stage2Phases, qualityCriteria, submissionDocuments,
stage2QpDeclaration, stage2QpName, stage2QpRole, stage2QpDate,
stage2QctoReference, stage2SubmissionMethod, stage2SubmissionNotes, stage2QctoAcknowledged,
qasAddendumCommitteeApproval, qasAddendumApprovalDate, qasAddendumAqpName,
qasAddendumContactName, qasAddendumContactEmail, qasAddendumPhysicalAddress,
qasAddendumDateReceived, qasAddendumDateEvaluated, qasAddendumEvaluatorName,
qasAddendumQualTitle, qasAddendumSaqaId, qasAddendumDateRegistered, qasAddendumNqfLevel,
qasAddendumCredits, qasAddendumRegStartDate, qasAddendumRegEndDate,
qasAddendumVerificationItems, qasAddendumComponents, qasAddendumFinalCalc,
qasAddendumFinalPass, qasAddendumDuration, qasAddendumFormat, qasAddendumLayout,
qasAddendumOpenClosed, qasAddendumAssessmentPoints, qasAddendumSupplementary,
qasAddendumModerationPercent, qasAddendumMarkingDays, qasAddendumModerationDays,
qasAddendumEvaluation, qasAddendumCharacteristics, qasAddendumFindings,
qasAddendumRecommendation, qasAddendumFinalRecommendation, qasAddendumFirstEvaluatorName,
qasAddendumFirstRec, qasAddendumAssistantDirector, qasAddendumAssistantDirectorDate,
qasAddendumSecondEvaluatorName, qasAddendumSecondRec, qasAddendumDeputyDirector,
qasAddendumDeputyDirectorDate, qasAddendumFinalRec, qasAddendumDirectorName,
qasAddendumDirectorDate, qasAddendumCommitteeFinal, qasAddendumCommitteeFinalDate,
qasAddendumSupportingDocs,
  });

  const handleSaveDraft = () => { onSave(collectAllData()); onClose(); };

 // ─────────────────────────────────────────────────────────────────────────────
// PATCH FOR PhaseModal.tsx  — replace only the handleSubmitReport function
// (everything else in PhaseModal stays the same)
// ─────────────────────────────────────────────────────────────────────────────

const handleSubmitReport = async () => {
  setIsSubmitting(true);
  const allData = { ...collectAllData(), submittedAt: new Date().toISOString() };
  
  // Remove raw file data (files stored separately in IndexedDB)
  const { uploadedFiles: _, ...cleanData } = allData;
  
  // 1. Save to IndexedDB (full data)
  await saveSubmittedReport({
    qualificationCode,
    qualificationTitle,
    phaseName: phase.name,
    reportData: cleanData,
    submittedAt: new Date().toISOString(),
    status: 'pending_review'
  });
  
  // 2. Update cyclePlans in localStorage - only metadata, no report data
  const cyclePlansRaw = localStorage.getItem('cyclePlans');
  let updatedCyclePlans = [];
  if (cyclePlansRaw) {
    const plans = JSON.parse(cyclePlansRaw);
    updatedCyclePlans = plans.map((plan: any) => {
      if (plan.qualificationCode !== qualificationCode) return plan;
      return {
        ...plan,
        phases: plan.phases.map((p: Phase) =>
          p.name === phase.name
            ? { 
                ...p, 
                status: 'completed' as const, 
                reportSubmitted: true, 
                completedDate: new Date().toISOString(),
                reportData: undefined
              }
            : p
        )
      };
    });
    localStorage.setItem('cyclePlans', JSON.stringify(updatedCyclePlans));
  }
  
  // 3. Update internalCyclePlans - same, only metadata
  const internalRaw = localStorage.getItem('internalCyclePlans');
  let internalPlans = internalRaw ? JSON.parse(internalRaw) : [];
  
  const existsInInternal = internalPlans.some(
    (p: any) => p.qualificationCode === qualificationCode
  );
  
  if (!existsInInternal && updatedCyclePlans.length > 0) {
    const srcPlan = updatedCyclePlans.find(
      (p: any) => p.qualificationCode === qualificationCode
    );
    if (srcPlan) internalPlans.push(srcPlan);
  } else {
    internalPlans = internalPlans.map((plan: any) => {
      if (plan.qualificationCode !== qualificationCode) return plan;
      return {
        ...plan,
        phases: plan.phases.map((p: Phase) =>
          p.name === phase.name
            ? { 
                ...p, 
                status: 'completed' as const, 
                reportSubmitted: true, 
                completedDate: new Date().toISOString(),
                reportData: undefined
              }
            : p
        )
      };
    });
  }
  localStorage.setItem('internalCyclePlans', JSON.stringify(internalPlans));
  
  // 4. Build the report entry with smart trimming to stay under localStorage limits
  const newReport = {
    qualificationCode,
    qualificationTitle,
    phaseName: phase.name,
    reportData: cleanData,
    submittedAt: new Date().toISOString(),
    status: 'pending_review'
  };

  const reports = JSON.parse(localStorage.getItem('submittedPhaseReports') || '[]');
  const filteredReports = reports.filter((r: any) =>
    !(r.qualificationCode === qualificationCode && r.phaseName === phase.name)
  );
  filteredReports.push(newReport);

  // Smart trim: preserve all field values but strip only the heaviest array internals
  const trimReport = (r: any) => {
    const rd = r.reportData || {};
    const {
      qasAddendumEvaluation,
      qasAddendumCharacteristics,
      qasAddendumVerificationItems,
      qasAddendumComponents,
      qasAddendumSupportingDocs,
      wgMembers,
      curriculumWgMembers,
      scopingStakeholders,
      finalVerificationStakeholders,
      stage2Phases,
      qualityCriteria,
      submissionDocuments,
      ...essential
    } = rd;

    return {
      ...r,
      reportData: {
        ...essential,
        // Keep arrays but trim each item to only the fields the modal renders
        qasAddendumEvaluation: (qasAddendumEvaluation || []).map((i: any) => ({
          item: i.item,
          subItem: i.subItem,
          status: i.status,
          comment: i.comment
        })),
        qasAddendumCharacteristics: (qasAddendumCharacteristics || []).map((i: any) => ({
          characteristic: i.characteristic,
          description: i.description,
          status: i.status,
          comment: i.comment
        })),
        qasAddendumVerificationItems: (qasAddendumVerificationItems || []).map((i: any) => ({
          label: i.label,
          value: i.value,
          comment: i.comment
        })),
        qasAddendumComponents: (qasAddendumComponents || []).map((i: any) => ({
          name: i.name,
          totalMarks: i.totalMarks,
          passMark: i.passMark
        })),
        qasAddendumSupportingDocs: (qasAddendumSupportingDocs || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          uploaded: i.uploaded
        })),
        wgMembers: (wgMembers || []).map((m: any) => ({
          id: m.id,
          nameAndSurname: m.nameAndSurname,
          classification: m.classification,
          invited: m.invited,
          attended: m.attended
        })),
        curriculumWgMembers: (curriculumWgMembers || []).map((m: any) => ({
          id: m.id,
          nameAndSurname: m.nameAndSurname,
          classification: m.classification,
          component: m.component,
          invited: m.invited,
          attended: m.attended
        })),
        scopingStakeholders: (scopingStakeholders || []).map((s: any) => ({
          classification: s.classification,
          invited: s.invited,
          attended: s.attended,
          isTotal: s.isTotal
        })),
        finalVerificationStakeholders: (finalVerificationStakeholders || []).map((s: any) => ({
          classification: s.classification,
          invited: s.invited,
          attended: s.attended,
          isTotal: s.isTotal
        })),
        stage2Phases: (stage2Phases || []).map((p: any) => ({
          name: p.name,
          description: p.description,
          completed: p.completed,
          approvedDate: p.approvedDate
        })),
        qualityCriteria: (qualityCriteria || []).map((c: any) => ({
          item: c.item,
          notes: c.notes,
          checked: c.checked
        })),
        submissionDocuments: (submissionDocuments || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          requiredFormat: d.requiredFormat,
          uploaded: d.uploaded,
          fileName: d.fileName
        })),
      }
    };
  };

  const reportsSize = new Blob([JSON.stringify(filteredReports)]).size;
  const reportsToStore = reportsSize > 4 * 1024 * 1024
    ? filteredReports.map(trimReport)
    : filteredReports;

  localStorage.setItem('submittedPhaseReports', JSON.stringify(reportsToStore));
  
  // 5. Call the onSave callback to update parent
  onSave({
    ...collectAllData(),
    submittedAt: new Date().toISOString()
  });
  
  // 6. Dispatch events
  window.dispatchEvent(new StorageEvent('storage', { key: 'cyclePlans', newValue: localStorage.getItem('cyclePlans') }));
  window.dispatchEvent(new StorageEvent('storage', { key: 'internalCyclePlans', newValue: localStorage.getItem('internalCyclePlans') }));
  window.dispatchEvent(new StorageEvent('storage', { key: 'submittedPhaseReports', newValue: localStorage.getItem('submittedPhaseReports') }));
  window.dispatchEvent(new CustomEvent('refreshWorkspace'));
  
  setIsSubmitting(false);
  onClose();
  // REMOVE this line: setTimeout(() => window.location.reload(), 500);
};
  // ── Shared helpers ────────────────────────────────────────────────────────

  const handleAddDeliverable = () => {
    if (newDeliverable.trim()) {
      setLocalPhaseData({ ...localPhaseData, deliverables: [...localPhaseData.deliverables, newDeliverable.trim()] });
      setNewDeliverable('');
    }
  };
  const handleRemoveDeliverable = (index: number) =>
    setLocalPhaseData({ ...localPhaseData, deliverables: localPhaseData.deliverables.filter((_, i) => i !== index) });

  const toggleChecklistItem = (index: number) => {
    const n = [...complianceChecklist];
    n[index].checked = !n[index].checked;
    setComplianceChecklist(n);
  };

  // ── Shared inline qual-table row ──────────────────────────────────────────
  const QualRow = ({ row, onChange, disabled }: { row: any; onChange: (f: string, v: string) => void; disabled: boolean }) => (
    <tr>
      <td className="border px-3 py-2"><input type="text" value={row.qualType}  onChange={e => onChange('qualType',  e.target.value)} disabled={disabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Type" /></td>
      <td className="border px-3 py-2"><input type="text" value={row.qualTitle} onChange={e => onChange('qualTitle', e.target.value)} disabled={disabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Title" /></td>
      <td className="border px-3 py-2"><input type="text" value={row.nqfLevel}  onChange={e => onChange('nqfLevel',  e.target.value)} disabled={disabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 5" /></td>
      <td className="border px-3 py-2"><input type="text" value={row.credits}   onChange={e => onChange('credits',   e.target.value)} disabled={disabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 120" /></td>
    </tr>
  );

  // ── Curriculum WG Row component ───────────────────────────────────────────
  const CurriculumWGRow = ({ member, idx, onChange, disabled }: { member: any; idx: number; onChange: (idx: number, field: string, value: string) => void; disabled: boolean }) => (
    <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
      <td className="border px-3 py-2 text-center text-xs text-gray-500">{idx + 1}.</td>
      <td className="border px-3 py-2">
        <input type="text" value={member.nameAndSurname} onChange={e => onChange(idx, 'nameAndSurname', e.target.value)} disabled={disabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Name and Surname" />
      </td>
      <td className="border px-3 py-2 text-xs font-medium text-gray-600">{member.classification}</td>
      <td className="border px-3 py-2">
        <select value={member.component} onChange={e => onChange(idx, 'component', e.target.value)} disabled={disabled} className="w-full border rounded px-2 py-1 text-sm">
          <option value="">Select Component</option>
          <option value="KM">KM: Knowledge/Theory</option>
          <option value="PM">PM: Practical Skills</option>
          <option value="WM">WM: Work Experience</option>
        </select>
      </td>
      <td className="border px-3 py-2">
        <select value={member.invited} onChange={e => onChange(idx, 'invited', e.target.value)} disabled={disabled} className="w-full border rounded px-2 py-1 text-sm text-center">
          <option value="">—</option><option value="YES">YES</option><option value="NO">NO</option>
        </select>
      </td>
      <td className="border px-3 py-2">
        <select value={member.attended} onChange={e => onChange(idx, 'attended', e.target.value)} disabled={disabled} className="w-full border rounded px-2 py-1 text-sm text-center">
          <option value="">—</option><option value="YES">YES</option><option value="NO">NO</option>
        </select>
      </td>
    </tr>
  );

  // ── Phase-specific content ────────────────────────────────────────────────

  const renderPhaseDetails = () => {
    switch (phase.name) {

      // ─── SCOPING — QCTO Template OQD-RT-01 ────────────────────────────────
      case 'Scoping':
        return (
          <div className="space-y-6">
            {/* NB notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <strong>NB:</strong> This Scoping Report is to be compiled by the QP and is submitted to the QCTO within 10 working days after the Scoping Meeting.
            </div>

            {/* Section 1 — QCTO approved application details */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">QCTO Approved Application Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Occupation</label><input type="text" value={scopingOccupation} onChange={e => setScopingOccupation(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">OFO Code</label><input type="text" value={scopingOfoCode} onChange={e => setScopingOfoCode(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Specialisation</label><input type="text" value={scopingSpecialisation} onChange={e => setScopingSpecialisation(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 2 — Scoping Meeting details */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Scoping Meeting Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date</label><input type="date" value={scopingMeetingDate} onChange={e => setScopingMeetingDate(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Venue</label><input type="text" value={scopingMeetingVenue} onChange={e => setScopingMeetingVenue(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Time</label><input type="time" value={scopingMeetingTime} onChange={e => setScopingMeetingTime(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 3 — Preliminary qualification tables */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Preliminary Details of Qualification(s) Intended for Development</h3>

              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Full Qualification</p>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100"><tr><th className="border px-3 py-2 text-left">Qualification Type</th><th className="border px-3 py-2 text-left">Qualification Title</th><th className="border px-3 py-2 text-left">NQF Level</th><th className="border px-3 py-2 text-left">Credits</th></tr></thead>
                  <tbody>{scopingQualRows.map((row, i) => (<QualRow key={i} row={row} disabled={isInputDisabled} onChange={(f, v) => { const r = [...scopingQualRows]; r[i] = { ...r[i], [f]: v }; setScopingQualRows(r); }} />))}</tbody>
                </table>
                {!isInputDisabled && <button onClick={() => setScopingQualRows([...scopingQualRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1"><Plus className="w-3 h-3" />Add row</button>}
              </div>

              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Part-Qualification</p>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100"><tr><th className="border px-3 py-2 text-left">Qualification Type</th><th className="border px-3 py-2 text-left">Qualification Title</th><th className="border px-3 py-2 text-left">NQF Level</th><th className="border px-3 py-2 text-left">Credits</th></tr></thead>
                  <tbody>{scopingPartQualRows.map((row, i) => (<QualRow key={i} row={row} disabled={isInputDisabled} onChange={(f, v) => { const r = [...scopingPartQualRows]; r[i] = { ...r[i], [f]: v }; setScopingPartQualRows(r); }} />))}</tbody>
                </table>
                {!isInputDisabled && <button onClick={() => setScopingPartQualRows([...scopingPartQualRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1"><Plus className="w-3 h-3" />Add row</button>}
              </div>

              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Skills Programme</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100"><tr><th className="border px-3 py-2 text-left">Qualification Type</th><th className="border px-3 py-2 text-left">Qualification Title</th><th className="border px-3 py-2 text-left">NQF Level</th><th className="border px-3 py-2 text-left">Credits</th></tr></thead>
                  <tbody>{scopingSkillsProgRows.map((row, i) => (<QualRow key={i} row={row} disabled={isInputDisabled} onChange={(f, v) => { const r = [...scopingSkillsProgRows]; r[i] = { ...r[i], [f]: v }; setScopingSkillsProgRows(r); }} />))}</tbody>
                </table>
                {!isInputDisabled && <button onClick={() => setScopingSkillsProgRows([...scopingSkillsProgRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1"><Plus className="w-3 h-3" />Add row</button>}
              </div>
            </div>

            {/* Section 4 — Stakeholder analysis (COUNTS, not names) */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4" />Analysis of Stakeholders Consulted for the Scoping Meeting
              </h3>
              <p className="text-xs text-gray-500 mb-1 italic">NB: Constituency representation of 50%+ is required for QCTO meeting threshold requirements to be satisfied.</p>
              <p className="text-xs text-gray-500 mb-3 italic">NB: Attach Scoping Meeting Attendance Register in the QCTO prescribed format.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-3 py-2 text-left w-8">No.</th>
                      <th className="border px-3 py-2 text-left">Classification</th>
                      <th className="border px-3 py-2 text-center w-40">No. Invited to Meeting</th>
                      <th className="border px-3 py-2 text-center w-40">No. Attended Meeting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopingStakeholders.map((row, idx) => (
                      <tr key={idx} className={`${row.isTotal ? 'bg-gray-200 font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="border px-3 py-2 text-center text-xs text-gray-500">{row.isTotal ? '' : `${idx + 1}.`}</td>
                        <td className="border px-3 py-2 text-xs font-medium text-gray-700">{row.classification}</td>
                        <td className="border px-3 py-2">
                          <input type="number" min={0} value={row.invited}
                            onChange={e => { const s = [...scopingStakeholders]; s[idx] = { ...s[idx], invited: e.target.value }; setScopingStakeholders(s); }}
                            disabled={isInputDisabled || row.isTotal}
                            className={`w-full border rounded px-2 py-1 text-sm text-center ${row.isTotal ? 'bg-gray-300 font-bold cursor-not-allowed' : ''}`}
                            placeholder="0" />
                         </td>
                        <td className="border px-3 py-2">
                          <input type="number" min={0} value={row.attended}
                            onChange={e => { const s = [...scopingStakeholders]; s[idx] = { ...s[idx], attended: e.target.value }; setScopingStakeholders(s); }}
                            disabled={isInputDisabled || row.isTotal}
                            className={`w-full border rounded px-2 py-1 text-sm text-center ${row.isTotal ? 'bg-gray-300 font-bold cursor-not-allowed' : ''}`}
                            placeholder="0" />
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-1">Attach Attendance Register</p>
                <input type="file" ref={scopingAttendanceRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'scopingAttendance'); }} className="hidden" />
                {!isInputDisabled && <button onClick={() => scopingAttendanceRef.current?.click()} className="flex items-center gap-1 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50"><Upload className="w-3.5 h-3.5" />Upload Register</button>}
                {renderFileList('scopingAttendance')}
              </div>
            </div>

            {/* Section 5 — Development process discussed */}
            <ScopingConfirmation
              label="Confirmation that occupational Qualification/Part-Qualification/Skills Programme development process and requirements (including roles and responsibilities) were discussed during scoping meeting"
              value={scopingProcessDiscussed} onChange={setScopingProcessDiscussed}
              comment={scopingProcessComment} onCommentChange={setScopingProcessComment}
              disabled={isInputDisabled} radioName="scoping-process"
            />

            {/* Section 6 — Subject Matter Expert details */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">Details of Subject Matter Expert (SME)</h3>
              <p className="text-xs text-gray-500 mb-3">Details of Subject Matter Expert who will facilitate the development of Qualification/Part-Qualifications/Skills Programme:</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-3 py-2 text-left">Name</th>
                      <th className="border px-3 py-2 text-left">Surname</th>
                      <th className="border px-3 py-2 text-left">Email Address</th>
                      <th className="border px-3 py-2 text-left">Cell Number</th>
                      <th className="border px-3 py-2 text-left">Telephone Number</th>
                      {!isInputDisabled && <th className="border px-3 py-2 text-center">Remove</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {scopingSMERows.map((row, i) => (
                      <tr key={i}>
                        <td className="border px-3 py-2"><input type="text"  value={row.name}    onChange={e => { const r = [...scopingSMERows]; r[i] = { ...r[i], name:    e.target.value }; setScopingSMERows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" /></td>
                        <td className="border px-3 py-2"><input type="text"  value={row.surname} onChange={e => { const r = [...scopingSMERows]; r[i] = { ...r[i], surname: e.target.value }; setScopingSMERows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" /></td>
                        <td className="border px-3 py-2"><input type="email" value={row.email}   onChange={e => { const r = [...scopingSMERows]; r[i] = { ...r[i], email:   e.target.value }; setScopingSMERows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" /></td>
                        <td className="border px-3 py-2"><input type="text"  value={row.cell}    onChange={e => { const r = [...scopingSMERows]; r[i] = { ...r[i], cell:    e.target.value }; setScopingSMERows(r); }} disabled={isInputDisabled} className="w-28 border rounded px-2 py-1 text-sm" /></td>
                        <td className="border px-3 py-2"><input type="text"  value={row.phone}   onChange={e => { const r = [...scopingSMERows]; r[i] = { ...r[i], phone:   e.target.value }; setScopingSMERows(r); }} disabled={isInputDisabled} className="w-28 border rounded px-2 py-1 text-sm" /></td>
                        {!isInputDisabled && <td className="border px-3 py-2 text-center"><button onClick={() => setScopingSMERows(scopingSMERows.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isInputDisabled && <button onClick={() => setScopingSMERows([...scopingSMERows, { name: '', surname: '', email: '', cell: '', phone: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1"><Plus className="w-3 h-3" />Add SME</button>}
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Comments</label>
                <textarea value={scopingSMEComments} onChange={e => setScopingSMEComments(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-3 text-sm" rows={2} placeholder="…" />
              </div>
            </div>

            {/* Section 7 — Rationale confirmed */}
            <ScopingConfirmation
              label="Confirmation that the rationale of the Qualification/Part-Qualifications/Skills Programme was discussed and confirmed by stakeholders during the scoping meeting"
              value={scopingRationaleConfirmed} onChange={setScopingRationaleConfirmed}
              comment={scopingRationaleComment} onCommentChange={setScopingRationaleComment}
              disabled={isInputDisabled} radioName="scoping-rationale"
            />

            {/* Section 8 — Additional stakeholders identified */}
            <ScopingConfirmation
              label="Confirmation that identification of additional stakeholders that are to be consulted in the process of Qualification/Part-Qualifications/Skills Programme development was done"
              value={scopingStakeholdersIdentified} onChange={setScopingStakeholdersIdentified}
              comment={scopingStakeholdersComment} onCommentChange={setScopingStakeholdersComment}
              disabled={isInputDisabled} radioName="scoping-stakeholders"
            />

            {/* Section 9 — WG Members nominated */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm font-medium text-gray-700 mb-3">Confirmation that Working Group Members (WG) who will participate in the Qualification/Part-Qualifications/Skills Programme development process were duly nominated:</p>
              <div className="flex gap-4 mb-3">
                {(['YES', 'NO'] as const).map(opt => (
                  <label key={opt} className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${scopingWGNominated === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <input type="radio" name="scoping-wg" value={opt} checked={scopingWGNominated === opt} onChange={() => setScopingWGNominated(opt)} disabled={isInputDisabled} className="w-4 h-4" />
                    <span className="font-medium">{opt}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 italic mb-3">NB: Attach a list of Working Group Members using QCTO prescribed format.</p>
              <div className="mb-3">
                <input type="file" ref={scopingWGListRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'scopingWGList'); }} className="hidden" />
                {!isInputDisabled && <button onClick={() => scopingWGListRef.current?.click()} className="flex items-center gap-1 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50"><Upload className="w-3.5 h-3.5" />Upload WG Members List</button>}
                {renderFileList('scopingWGList')}
              </div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Comments</label>
              <textarea value={scopingWGComment} onChange={e => setScopingWGComment(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-3 text-sm" rows={2} placeholder="…" />
            </div>

            {/* Section 10 — Development schedule outlined */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <p className="text-sm font-medium text-gray-700 mb-3">Confirmation that Qualification/Part-Qualifications/Skills Programme development process schedule was outlined and discussed at scoping meeting:</p>
              <div className="flex gap-4 mb-3">
                {(['YES', 'NO'] as const).map(opt => (
                  <label key={opt} className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${scopingScheduleOutlined === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <input type="radio" name="scoping-schedule" value={opt} checked={scopingScheduleOutlined === opt} onChange={() => setScopingScheduleOutlined(opt)} disabled={isInputDisabled} className="w-4 h-4" />
                    <span className="font-medium">{opt}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 italic mb-3">NB: Attach Qualification/Part Qualification/Skills Programme Development Schedule in the QCTO prescribed format.</p>
              <div className="mb-3">
                <input type="file" ref={scopingScheduleRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'scopingSchedule'); }} className="hidden" />
                {!isInputDisabled && <button onClick={() => scopingScheduleRef.current?.click()} className="flex items-center gap-1 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50"><Upload className="w-3.5 h-3.5" />Upload Development Schedule</button>}
                {renderFileList('scopingSchedule')}
              </div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Comments</label>
              <textarea value={scopingScheduleComment} onChange={e => setScopingScheduleComment(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-3 text-sm" rows={2} placeholder="…" />
            </div>

            {/* Section 11 — QP Declaration */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2"><Shield className="w-4 h-4" />Quality Partner Declaration</h3>
              <p className="text-sm text-gray-600 mb-4 italic">I, [declarant name], declare that the information provided above is an accurate reflection of the proceedings of the scoping meeting as detailed in this report.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Name and Surname of QP Representative</label><input type="text" value={scopingDeclarantName} onChange={e => setScopingDeclarantName(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full name" /></div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div><label className="block text-xs text-gray-500 mb-1">Signed on day</label><input type="text" value={scopingDeclarationDay}   onChange={e => setScopingDeclarationDay(e.target.value)}   disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="DD" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Month</label>          <input type="text" value={scopingDeclarationMonth} onChange={e => setScopingDeclarationMonth(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Month" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Year</label>           <input type="text" value={scopingDeclarationYear}  onChange={e => setScopingDeclarationYear(e.target.value)}  disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="YYYY" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">At (place)</label>     <input type="text" value={scopingDeclarationPlace} onChange={e => setScopingDeclarationPlace(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Place" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Witness 1 Name</label><input type="text" value={scopingWitness1} onChange={e => setScopingWitness1(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Witness 1 Name and Surname" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Witness 2 Name</label><input type="text" value={scopingWitness2} onChange={e => setScopingWitness2(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Witness 2 Name and Surname" /></div>
              </div>
              <p className="text-xs text-gray-400 mt-4 italic">Document No: OQD-RT-01 | Version: 1.2 | ©Copyright: QCTO</p>
            </div>
          </div>
        );

      // ─── PROFILING — QCTO Template OQD-RT-02 ──────────────────────────────
      case 'Profiling':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <strong>NB:</strong> This Profile report is to be compiled by the QP and is submitted to the QCTO within 10 working days after the Profiling Meeting.
            </div>

            {/* Section 1 */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">QCTO Approved Application Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Occupation</label><input type="text" value={profilingOccupation} onChange={e => setProfilingOccupation(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">OFO Code</label><input type="text" value={profilingOfoCode} onChange={e => setProfilingOfoCode(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Specialisation</label><input type="text" value={profilingSpecialisation} onChange={e => setProfilingSpecialisation(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Profile Meeting Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date</label><input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Venue</label><input type="text" value={meetingVenue} onChange={e => setMeetingVenue(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Time</label><input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Details of Qualification(s) Intended for Development</h3>

              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Full Qualification</p>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100"><tr><th className="border px-3 py-2 text-left">Qualification Type</th><th className="border px-3 py-2 text-left">Qualification Title</th><th className="border px-3 py-2 text-left">NQF Level</th><th className="border px-3 py-2 text-left">Credits</th></tr></thead>
                  <tbody>{qualRows.map((row, i) => (<QualRow key={i} row={row} disabled={isInputDisabled} onChange={(f, v) => { const r = [...qualRows]; r[i] = { ...r[i], [f]: v }; setQualRows(r); }} />))}</tbody>
                </table>
                {!isInputDisabled && <button onClick={() => setQualRows([...qualRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1"><Plus className="w-3 h-3" />Add row</button>}
              </div>

              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Part-Qualification</p>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100"><tr><th className="border px-3 py-2 text-left">Qualification Type</th><th className="border px-3 py-2 text-left">Qualification Title</th><th className="border px-3 py-2 text-left">NQF Level</th><th className="border px-3 py-2 text-left">Credits</th></tr></thead>
                  <tbody>{partQualRows.map((row, i) => (<QualRow key={i} row={row} disabled={isInputDisabled} onChange={(f, v) => { const r = [...partQualRows]; r[i] = { ...r[i], [f]: v }; setPartQualRows(r); }} />))}</tbody>
                </table>
                {!isInputDisabled && <button onClick={() => setPartQualRows([...partQualRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1"><Plus className="w-3 h-3" />Add row</button>}
              </div>

              <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">Skills Programme</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100"><tr><th className="border px-3 py-2 text-left">Qualification Type</th><th className="border px-3 py-2 text-left">Qualification Title</th><th className="border px-3 py-2 text-left">NQF Level</th><th className="border px-3 py-2 text-left">Credits</th></tr></thead>
                  <tbody>{skillsProgRows.map((row, i) => (<QualRow key={i} row={row} disabled={isInputDisabled} onChange={(f, v) => { const r = [...skillsProgRows]; r[i] = { ...r[i], [f]: v }; setSkillsProgRows(r); }} />))}</tbody>
                </table>
                {!isInputDisabled && <button onClick={() => setSkillsProgRows([...skillsProgRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1"><Plus className="w-3 h-3" />Add row</button>}
              </div>
            </div>

            {/* Section 4 — Working Group member participation (individual names) */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide flex items-center gap-2"><UserCheck className="w-4 h-4" />Working Group (WG) Member Participation in Profile Development</h3>
              <p className="text-xs text-gray-500 mb-3 italic">NB: Attach Profile Meeting Attendance Register in the QCTO prescribed format.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-3 py-2 text-left w-8">No.</th>
                      <th className="border px-3 py-2 text-left">Name and Surname</th>
                      <th className="border px-3 py-2 text-left">Classification</th>
                      <th className="border px-3 py-2 text-center">Invited (YES/NO)</th>
                      <th className="border px-3 py-2 text-center">Attended (YES/NO)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wgMembers.map((member, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border px-3 py-2 text-center text-xs text-gray-500">{idx + 1}.</td>
                        <td className="border px-3 py-2"><input type="text" value={member.nameAndSurname} onChange={e => { const m = [...wgMembers]; m[idx] = { ...m[idx], nameAndSurname: e.target.value }; setWgMembers(m); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Name and Surname" /></td>
                        <td className="border px-3 py-2 text-xs font-medium text-gray-600">{member.classification}</td>
                        <td className="border px-3 py-2">
                          <select value={member.invited} onChange={e => { const m = [...wgMembers]; m[idx] = { ...m[idx], invited: e.target.value }; setWgMembers(m); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm text-center">
                            <option value="">—</option><option value="YES">YES</option><option value="NO">NO</option>
                          </select>
                         </td>
                        <td className="border px-3 py-2">
                          <select value={member.attended} onChange={e => { const m = [...wgMembers]; m[idx] = { ...m[idx], attended: e.target.value }; setWgMembers(m); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm text-center">
                            <option value="">—</option><option value="YES">YES</option><option value="NO">NO</option>
                          </select>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-1">Attach Attendance Register</p>
                <input type="file" ref={attendanceRegisterRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'attendanceRegister'); }} className="hidden" />
                {!isInputDisabled && <button onClick={() => attendanceRegisterRef.current?.click()} className="flex items-center gap-1 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50"><Upload className="w-3.5 h-3.5" />Upload Register</button>}
                {renderFileList('attendanceRegister')}
              </div>
              <div className="mt-4"><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Comments</label><textarea value={wgComments} onChange={e => setWgComments(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="…" /></div>
            </div>

            {/* Section 5 — Stakeholder verification */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Stakeholder Verification of Profile</h3>
              <p className="text-sm font-medium text-gray-700 mb-2">Confirmation that Profile was sent out for verification to broader stakeholders:</p>
              <div className="flex gap-4 mb-4">
                {(['YES', 'NO'] as const).map(opt => (
                  <label key={opt} className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${verificationSentConfirm === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <input type="radio" name="verif-sent" value={opt} checked={verificationSentConfirm === opt} onChange={() => setVerificationSentConfirm(opt)} disabled={isInputDisabled} className="w-4 h-4" /><span className="font-medium">{opt}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm font-medium text-gray-700 mb-2">Date when Profile was sent out for verification:</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div><label className="block text-xs text-gray-500 mb-1">Year</label><input type="text" value={verificationSentYear}  onChange={e => setVerificationSentYear(e.target.value)}  disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="YYYY" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Month</label><input type="text" value={verificationSentMonth} onChange={e => setVerificationSentMonth(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="MM" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Day</label><input type="text" value={verificationSentDay}   onChange={e => setVerificationSentDay(e.target.value)}   disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="DD" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Consultation Methods Used to Verify Profile</label><textarea value={consultationMethods} onChange={e => setConsultationMethods(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="e.g. Profile emailed to stakeholders with clear timeframe for comments; Profile placed on the website with clear timeframe window for comments; etc." /></div>
            </div>

            {/* Section 6 — Final Profile distribution */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">Final Profile Distribution</h3>
              <p className="text-sm font-medium text-gray-700 mb-2">Confirmation that Final Profile was sent out to broader stakeholders:</p>
              <div className="flex gap-4 mb-4">
                {(['YES', 'NO'] as const).map(opt => (
                  <label key={opt} className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${finalProfileSentConfirm === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <input type="radio" name="final-profile-sent" value={opt} checked={finalProfileSentConfirm === opt} onChange={() => setFinalProfileSentConfirm(opt)} disabled={isInputDisabled} className="w-4 h-4" /><span className="font-medium">{opt}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm font-medium text-gray-700 mb-2">Date when Final Profile was sent out:</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div><label className="block text-xs text-gray-500 mb-1">Year</label><input type="text" value={finalProfileSentYear}  onChange={e => setFinalProfileSentYear(e.target.value)}  disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="YYYY" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Month</label><input type="text" value={finalProfileSentMonth} onChange={e => setFinalProfileSentMonth(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="MM" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Day</label><input type="text" value={finalProfileSentDay}   onChange={e => setFinalProfileSentDay(e.target.value)}   disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="DD" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Method(s) Used to Send / Share Final Profile</label><textarea value={finalProfileMethods} onChange={e => setFinalProfileMethods(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="e.g. Final Profile emailed to stakeholders; Final Profile placed on the website; etc." /></div>
            </div>

            {/* Section 7 — QP Declaration */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2"><Shield className="w-4 h-4" />Quality Partner Declaration</h3>
              <p className="text-sm text-gray-600 mb-4 italic">I, [declarant name], declare that the information provided above is an accurate reflection of the proceedings of the profiling meeting as detailed in this report.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Name and Surname of QP Representative</label><input type="text" value={declarantName} onChange={e => setDeclarantName(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full name" /></div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div><label className="block text-xs text-gray-500 mb-1">Signed on day</label><input type="text" value={declarationDay}   onChange={e => setDeclarationDay(e.target.value)}   disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="DD" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Month</label>          <input type="text" value={declarationMonth} onChange={e => setDeclarationMonth(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Month" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Year</label>           <input type="text" value={declarationYear}  onChange={e => setDeclarationYear(e.target.value)}  disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="YYYY" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">At (place)</label>     <input type="text" value={declarationPlace} onChange={e => setDeclarationPlace(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Place" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Witness 1 Name</label><input type="text" value={witness1Name} onChange={e => setWitness1Name(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Witness 1 Name and Surname" /></div>
                <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Witness 2 Name</label><input type="text" value={witness2Name} onChange={e => setWitness2Name(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Witness 2 Name and Surname" /></div>
              </div>
              <p className="text-xs text-gray-400 mt-4 italic">Document No: OQD-RT-02 | Version: 1.2 | ©Copyright: QCTO</p>
            </div>
          </div>
        );

      // ─── DEVELOP CURRICULUM SPECIFICATIONS — QCTO Curriculum Document Report Template ──
      case 'Develop Curriculum Specifications':
        return (
          <div className="space-y-6">
            {/* NB notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <strong>NB:</strong> This Curriculum Report is to be compiled by the QP. This report requires the utilisation of a QCTO Curriculum Document Template and is submitted to the QCTO within 10 working days after the Curriculum Document is finalised.
            </div>

            {/* Section 1 — QCTO approved application details */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4" /> QCTO Approved Application Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Occupation</label>
                  <input type="text" value={curriculumOccupation} onChange={e => setCurriculumOccupation(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Software Developer" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">OFO Code</label>
                  <input type="text" value={curriculumOfoCode} onChange={e => setCurriculumOfoCode(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 123456" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Specialisation</label>
                  <input type="text" value={curriculumSpecialisation} onChange={e => setCurriculumSpecialisation(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="If applicable" />
                </div>
              </div>
            </div>

            {/* Section 2 — Curriculum Specifications Development Meeting details */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Curriculum Specifications Development Meeting Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date</label>
                  <input type="date" value={curriculumMeetingDate} onChange={e => setCurriculumMeetingDate(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Venue</label>
                  <input type="text" value={curriculumMeetingVenue} onChange={e => setCurriculumMeetingVenue(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Meeting location" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Time</label>
                  <input type="time" value={curriculumMeetingTime} onChange={e => setCurriculumMeetingTime(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            {/* Section 3 — Details of qualification in development */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <Award className="w-4 h-4" /> Details of Qualification in Development
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-3 py-2 text-left w-12">No.</th>
                      <th className="border px-3 py-2 text-left">Qualification Type</th>
                      <th className="border px-3 py-2 text-left">Qualification Title</th>
                      <th className="border px-3 py-2 text-left">NQF Level</th>
                      <th className="border px-3 py-2 text-left">Credits</th>
                      {!isInputDisabled && <th className="border px-3 py-2 text-center w-12">Remove</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {curriculumQualRows.map((row, i) => (
                      <tr key={i}>
                        <td className="border px-3 py-2 text-center text-xs text-gray-500">{i + 1}.</td>
                        <td className="border px-3 py-2"><input type="text" value={row.qualType} onChange={e => { const r = [...curriculumQualRows]; r[i] = { ...r[i], qualType: e.target.value }; setCurriculumQualRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. Occupational Certificate" /></td>
                        <td className="border px-3 py-2"><input type="text" value={row.qualTitle} onChange={e => { const r = [...curriculumQualRows]; r[i] = { ...r[i], qualTitle: e.target.value }; setCurriculumQualRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Title of qualification" /></td>
                        <td className="border px-3 py-2"><input type="text" value={row.nqfLevel} onChange={e => { const r = [...curriculumQualRows]; r[i] = { ...r[i], nqfLevel: e.target.value }; setCurriculumQualRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 5" /></td>
                        <td className="border px-3 py-2"><input type="text" value={row.credits} onChange={e => { const r = [...curriculumQualRows]; r[i] = { ...r[i], credits: e.target.value }; setCurriculumQualRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 120" /></td>
                        {!isInputDisabled && (
                          <td className="border px-3 py-2 text-center">
                            <button onClick={() => setCurriculumQualRows(curriculumQualRows.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isInputDisabled && (
                <button onClick={() => setCurriculumQualRows([...curriculumQualRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Qualification Row
                </button>
              )}
            </div>

            {/* Section 4 — Details of part qualification in development */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <ListChecks className="w-4 h-4" /> Details of Part Qualification in Development
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-3 py-2 text-left w-12">No.</th>
                      <th className="border px-3 py-2 text-left">Qualification Type</th>
                      <th className="border px-3 py-2 text-left">Qualification Title</th>
                      <th className="border px-3 py-2 text-left">NQF Level</th>
                      <th className="border px-3 py-2 text-left">Credits</th>
                      {!isInputDisabled && <th className="border px-3 py-2 text-center w-12">Remove</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {curriculumPartQualRows.map((row, i) => (
                      <tr key={i}>
                        <td className="border px-3 py-2 text-center text-xs text-gray-500">{i + 1}.</td>
                        <td className="border px-3 py-2"><input type="text" value={row.qualType} onChange={e => { const r = [...curriculumPartQualRows]; r[i] = { ...r[i], qualType: e.target.value }; setCurriculumPartQualRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. Part-Qualification" /></td>
                        <td className="border px-3 py-2"><input type="text" value={row.qualTitle} onChange={e => { const r = [...curriculumPartQualRows]; r[i] = { ...r[i], qualTitle: e.target.value }; setCurriculumPartQualRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Title of part-qualification" /></td>
                        <td className="border px-3 py-2"><input type="text" value={row.nqfLevel} onChange={e => { const r = [...curriculumPartQualRows]; r[i] = { ...r[i], nqfLevel: e.target.value }; setCurriculumPartQualRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 4" /></td>
                        <td className="border px-3 py-2"><input type="text" value={row.credits} onChange={e => { const r = [...curriculumPartQualRows]; r[i] = { ...r[i], credits: e.target.value }; setCurriculumPartQualRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 60" /></td>
                        {!isInputDisabled && (
                          <td className="border px-3 py-2 text-center">
                            <button onClick={() => setCurriculumPartQualRows(curriculumPartQualRows.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isInputDisabled && (
                <button onClick={() => setCurriculumPartQualRows([...curriculumPartQualRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Part-Qualification Row
                </button>
              )}
            </div>

            {/* Section 5 — Details of skills programme in development */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <Target className="w-4 h-4" /> Details of Skills Programme in Development
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-3 py-2 text-left w-12">No.</th>
                      <th className="border px-3 py-2 text-left">Qualification Type</th>
                      <th className="border px-3 py-2 text-left">Qualification Title</th>
                      <th className="border px-3 py-2 text-left">NQF Level</th>
                      <th className="border px-3 py-2 text-left">Credits</th>
                      {!isInputDisabled && <th className="border px-3 py-2 text-center w-12">Remove</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {curriculumSkillsProgRows.map((row, i) => (
                      <tr key={i}>
                        <td className="border px-3 py-2 text-center text-xs text-gray-500">{i + 1}.</td>
                        <td className="border px-3 py-2"><input type="text" value={row.qualType} onChange={e => { const r = [...curriculumSkillsProgRows]; r[i] = { ...r[i], qualType: e.target.value }; setCurriculumSkillsProgRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. Skills Programme" /></td>
                        <td className="border px-3 py-2"><input type="text" value={row.qualTitle} onChange={e => { const r = [...curriculumSkillsProgRows]; r[i] = { ...r[i], qualTitle: e.target.value }; setCurriculumSkillsProgRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Title of skills programme" /></td>
                        <td className="border px-3 py-2"><input type="text" value={row.nqfLevel} onChange={e => { const r = [...curriculumSkillsProgRows]; r[i] = { ...r[i], nqfLevel: e.target.value }; setCurriculumSkillsProgRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 3" /></td>
                        <td className="border px-3 py-2"><input type="text" value={row.credits} onChange={e => { const r = [...curriculumSkillsProgRows]; r[i] = { ...r[i], credits: e.target.value }; setCurriculumSkillsProgRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 30" /></td>
                        {!isInputDisabled && (
                          <td className="border px-3 py-2 text-center">
                            <button onClick={() => setCurriculumSkillsProgRows(curriculumSkillsProgRows.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isInputDisabled && (
                <button onClick={() => setCurriculumSkillsProgRows([...curriculumSkillsProgRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Skills Programme Row
                </button>
              )}
            </div>

            {/* Section 6 — Working Group (WG) Members participation */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4" /> Working Group (WG) Members Participation in Curriculum Specifications Development
              </h3>
              <p className="text-xs text-gray-500 mb-3 italic">NB: Attach Curriculum Meeting Attendance Register in the QCTO prescribed format.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-3 py-2 text-left w-8">No.</th>
                      <th className="border px-3 py-2 text-left">Working Group (WG) Member Details (Name and Surname)</th>
                      <th className="border px-3 py-2 text-left">Classification</th>
                      <th className="border px-3 py-2 text-left">Component: KM/PM/WM</th>
                      <th className="border px-3 py-2 text-center w-28">WG Member Invited to Meeting</th>
                      <th className="border px-3 py-2 text-center w-28">WG Member Attended the Meeting</th>
                      {!isInputDisabled && <th className="border px-3 py-2 text-center w-12">Remove</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {curriculumWgMembers.map((member, idx) => (
                      <CurriculumWGRow
                        key={idx}
                        member={member}
                        idx={idx}
                        onChange={(i, field, value) => {
                          const updated = [...curriculumWgMembers];
                          updated[i] = { ...updated[i], [field]: value };
                          setCurriculumWgMembers(updated);
                        }}
                        disabled={isInputDisabled}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-1">Attach Curriculum Meeting Attendance Register (QCTO prescribed format)</p>
                <input type="file" ref={curriculumWGMinsRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'curriculumAttendance'); }} className="hidden" />
                {!isInputDisabled && (
                  <button onClick={() => curriculumWGMinsRef.current?.click()} className="flex items-center gap-1 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50">
                    <Upload className="w-3.5 h-3.5" /> Upload Attendance Register
                  </button>
                )}
                {renderFileList('curriculumAttendance')}
              </div>
            </div>

            {/* Section 7 — Comments */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> Comments
              </h3>
              <textarea
                value={curriculumComments}
                onChange={e => setCurriculumComments(e.target.value)}
                disabled={isInputDisabled}
                className="w-full border rounded-lg p-3 text-sm"
                rows={4}
                placeholder="Any additional comments, notes, or observations regarding the curriculum specifications development process..."
              />
            </div>

            {/* Section 8 — QP Declaration */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                <Shield className="w-4 h-4" /> Quality Partner Declaration
              </h3>
              <p className="text-sm text-gray-600 mb-4 italic">
                I, ...(Name and Surname - Quality Partner Representative), declare that the information provided above is an accurate reflection of the proceedings of the scoping meeting as detailed in this report.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Name and Surname of QP Representative</label>
                  <input
                    type="text"
                    value={curriculumDeclarantName}
                    onChange={e => setCurriculumDeclarantName(e.target.value)}
                    disabled={isInputDisabled}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Full name and surname"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Signed on day</label>
                  <input type="text" value={curriculumDeclarationDay} onChange={e => setCurriculumDeclarationDay(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="DD" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Month</label>
                  <input type="text" value={curriculumDeclarationMonth} onChange={e => setCurriculumDeclarationMonth(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Month" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year</label>
                  <input type="text" value={curriculumDeclarationYear} onChange={e => setCurriculumDeclarationYear(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="YYYY" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">At (place)</label>
                  <input type="text" value={curriculumDeclarationPlace} onChange={e => setCurriculumDeclarationPlace(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="City/Town" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Witness 1 Name</label>
                  <input type="text" value={curriculumWitness1} onChange={e => setCurriculumWitness1(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Witness 1 Name and Surname" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Witness 2 Name</label>
                  <input type="text" value={curriculumWitness2} onChange={e => setCurriculumWitness2(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Witness 2 Name and Surname" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500 italic">NB: Attach Curriculum Document Template (QCTO prescribed format)</p>
                <input type="file" ref={curriculumTemplateRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'curriculumTemplate'); }} className="hidden" />
                {!isInputDisabled && (
                  <button onClick={() => curriculumTemplateRef.current?.click()} className="mt-2 flex items-center gap-1 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50">
                    <Upload className="w-3.5 h-3.5" /> Upload Curriculum Document Template
                  </button>
                )}
                {renderFileList('curriculumTemplate')}
              </div>
              <p className="text-xs text-gray-400 mt-4 italic">Document No: OQD-RT-03 | Version: 1.0 | ©Copyright: QCTO</p>
            </div>
          </div>
        );

      // ─── DEVELOP ASSESSMENT SPECIFICATIONS ─────────────────────────────────
 // ─── DEVELOP ASSESSMENT SPECIFICATIONS — QCTO QAS Document Template ─────────
case 'Develop Assessment Specifications':
  return (
    <div className="space-y-6">
      {/* NB notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>NB:</strong> This Assessment Specifications Report is to be compiled by the QP and submitted to the QCTO within 10 working days after the Assessment Specifications are finalised.
      </div>

      {/* Header Table - Qualification Details & Partner Details */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            {/* Row 1: Qualification/Part-Qualification header */}
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left" colSpan={5}>QUALIFICATION/PART-QUALIFICATION</th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">TYPE (NOMENCLATURE)</th>
                <th className="border p-2 text-left">TITLE (DESCRIPTOR)</th>
                <th className="border p-2 text-left">NQF LEVEL</th>
                <th className="border p-2 text-left">CREDITS</th>
                <th className="border p-2 text-center w-10">{!isInputDisabled && 'Remove'}</th>
              </tr>
            </thead>
            <tbody>
              {qasQualRows.map((row, idx) => (
                <tr key={`qual-${idx}`}>
                  <td className="border p-2"><input type="text" value={row.type} onChange={e => { const r = [...qasQualRows]; r[idx] = { ...r[idx], type: e.target.value }; setQasQualRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. Occupational Certificate" /></td>
                  <td className="border p-2"><input type="text" value={row.title} onChange={e => { const r = [...qasQualRows]; r[idx] = { ...r[idx], title: e.target.value }; setQasQualRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Qualification title" /></td>
                  <td className="border p-2"><input type="text" value={row.nqfLevel} onChange={e => { const r = [...qasQualRows]; r[idx] = { ...r[idx], nqfLevel: e.target.value }; setQasQualRows(r); }} disabled={isInputDisabled} className="w-20 border rounded px-2 py-1 text-sm" placeholder="e.g. 5" /></td>
                  <td className="border p-2"><input type="text" value={row.credits} onChange={e => { const r = [...qasQualRows]; r[idx] = { ...r[idx], credits: e.target.value }; setQasQualRows(r); }} disabled={isInputDisabled} className="w-20 border rounded px-2 py-1 text-sm" placeholder="e.g. 120" /></td>
                  <td className="border p-2 text-center">{!isInputDisabled && <button onClick={() => setQasQualRows(qasQualRows.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isInputDisabled && (
            <button onClick={() => setQasQualRows([...qasQualRows, { type: '', title: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Qualification Row
            </button>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Curriculum Code</label>
          <input type="text" value={qasCurriculumCode} onChange={e => setQasCurriculumCode(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 123456-ABC" />
        </div>

        {/* Partner Details Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left" colSpan={5}>PARTNER DETAILS</th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">ORGANISATION NAME</th>
                <th className="border p-2 text-left">WEBSITE ADDRESS</th>
                <th className="border p-2 text-left">TELEPHONE NUMBER</th>
                <th className="border p-2 text-left">LOGO</th>
                <th className="border p-2 text-left w-40">QUALITY PARTNER TYPE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2"><input type="text" value={qasOrganisationName} onChange={e => setQasOrganisationName(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Organisation name" /></td>
                <td className="border p-2"><input type="text" value={qasWebsiteAddress} onChange={e => setQasWebsiteAddress(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="www.example.com" /></td>
                <td className="border p-2"><input type="text" value={qasTelephoneNumber} onChange={e => setQasTelephoneNumber(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="+27 12 345 6789" /></td>
                <td className="border p-2 text-center">
                  <input type="file" ref={qasLogoRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'qasLogo'); }} className="hidden" />
                  {!isInputDisabled && <button onClick={() => qasLogoRef.current?.click()} className="text-blue-600 text-sm">Upload Logo</button>}
                  {renderFileList('qasLogo')}
                </td>
                <td className="border p-2"><input type="text" value={qasQualityPartnerType} onChange={e => setQasQualityPartnerType(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Development/Assessment" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 1: ASSESSMENT STRATEGY */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-bold text-gray-800 mb-4 text-md uppercase tracking-wide">SECTION 1: ASSESSMENT STRATEGY</h3>
        
        {/* 1.1 Internal Assessment */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase">1.1 Internal Assessment</h4>
          <p className="text-xs text-gray-500 mb-3 italic">The curriculum document must be used for the assessment of learners in preparation for the EISA (External Integrated Summative Assessment).</p>
          <div className="bg-white p-3 rounded border text-sm text-gray-600 mb-3">
            <p>Internal Assessment is the responsibility of an accredited Skills Development Provider (SDP) and is conducted during the delivery of learning/training. The accredited Skills Development Provider (SDP) is responsible for internal assessment. To execute this responsibility, the SDP is required to:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>plan and develop</li>
              <li>conduct, administer and manage</li>
              <li>evaluate and analyse the results and outcomes</li>
              <li>moderate</li>
              <li>record and report</li>
            </ul>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">(i) Internal Formative Assessment:</label>
              <textarea value={qasFormativeAssessment} onChange={e => setQasFormativeAssessment(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder="Describe the formative assessment methods and procedures..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">(ii) Internal Summative Assessment:</label>
              <textarea value={qasSummativeAssessment} onChange={e => setQasSummativeAssessment(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder="Describe the summative assessment methods and procedures..." />
            </div>
          </div>
        </div>

        {/* 1.2 External Integrated Summative Assessment (EISA) */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase">1.2 External Integrated Summative Assessment (EISA)</h4>
          
          {/* 1.2.1 Planning and Conduct */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-600 mb-2 text-xs uppercase">1.2.1 Planning and Conduct and Quality Assurance of EISA</h5>
            <div className="bg-white p-3 rounded border text-sm text-gray-600 mb-3">
              <p>EISA is:</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>planned and developed by the Quality Partner according to occupational assessment standards determined by industry</li>
                <li>conducted, administered and managed (evaluation, analysis of results and outcomes, moderation, recording and reporting) by a QCTO accredited Assessment Centre</li>
                <li>quality assured by the QCTO</li>
              </ul>
            </div>
            <textarea value={qasEisaPlanning} onChange={e => setQasEisaPlanning(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder="Additional notes on EISA planning and conduct..." />
          </div>

          {/* 1.2.2 Structure/model of EISA */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-600 mb-2 text-xs uppercase">1.2.2 Structure/model of EISA</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="bg-gray-100"><td className="border p-2 font-semibold w-40">FORMAT OF ASSESSMENT:</td><td className="border p-2"><input type="text" value={qasFormatAssessment} onChange={e => setQasFormatAssessment(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Written/Practical/Other" /></td></tr>
                  <tr><td className="border p-2 font-semibold">COGNITIVE ABILITY:</td><td className="border p-2"><div className="flex gap-4"><label className="flex items-center gap-1"><input type="text" value={qasCognitiveKnowledge} onChange={e => setQasCognitiveKnowledge(e.target.value)} disabled={isInputDisabled} className="w-20 border rounded px-2 py-1 text-sm" placeholder="%" /> Knowledge</label><label className="flex items-center gap-1"><input type="text" value={qasCognitiveApplication} onChange={e => setQasCognitiveApplication(e.target.value)} disabled={isInputDisabled} className="w-20 border rounded px-2 py-1 text-sm" placeholder="%" /> Application</label><label className="flex items-center gap-1"><input type="text" value={qasCognitiveCriticalThinking} onChange={e => setQasCognitiveCriticalThinking(e.target.value)} disabled={isInputDisabled} className="w-20 border rounded px-2 py-1 text-sm" placeholder="%" /> Critical Thinking</label></div></td></tr>
                  <tr className="bg-gray-50"><td className="border p-2 font-semibold">DURATION OF COMPONENT(S):</td><td className="border p-2"><div className="space-y-2"><div><span className="inline-block w-20">Written:</span><input type="text" value={qasDurationWritten} onChange={e => setQasDurationWritten(e.target.value)} disabled={isInputDisabled} className="w-32 border rounded px-2 py-1 text-sm" placeholder="Hours" /></div><div><span className="inline-block w-20">Practical:</span><input type="text" value={qasDurationPractical} onChange={e => setQasDurationPractical(e.target.value)} disabled={isInputDisabled} className="w-32 border rounded px-2 py-1 text-sm" placeholder="Hours" /></div><div><span className="inline-block w-20">Other:</span><input type="text" value={qasDurationOther} onChange={e => setQasDurationOther(e.target.value)} disabled={isInputDisabled} className="w-32 border rounded px-2 py-1 text-sm" placeholder="Hours" /></div><div className="mt-2"><span className="inline-block w-20">Total Marks:</span><input type="text" value={qasTotalMarks} onChange={e => setQasTotalMarks(e.target.value)} disabled={isInputDisabled} className="w-32 border rounded px-2 py-1 text-sm" placeholder="Marks" /></div></div></td></tr>
                  <tr><td className="border p-2 font-semibold">TOTAL MARK OR COMPETENCY REQUIREMENT FOR EACH COMPONENT:</td><td className="border p-2"><div><span className="inline-block w-20">Written:</span><input type="text" value={qasReqWritten} onChange={e => setQasReqWritten(e.target.value)} disabled={isInputDisabled} className="w-32 border rounded px-2 py-1 text-sm" placeholder="e.g. 50%" /></div><div className="mt-1"><span className="inline-block w-20">Practical:</span><input type="text" value={qasReqPractical} onChange={e => setQasReqPractical(e.target.value)} disabled={isInputDisabled} className="w-32 border rounded px-2 py-1 text-sm" placeholder="e.g. 60%" /></div><div className="mt-1"><span className="inline-block w-20">Other:</span><input type="text" value={qasReqOther} onChange={e => setQasReqOther(e.target.value)} disabled={isInputDisabled} className="w-32 border rounded px-2 py-1 text-sm" placeholder="e.g. Competent" /></div></td></tr>
                  <tr className="bg-gray-50"><td className="border p-2 font-semibold">CALCULATION OF FINAL RESULTS:</td><td className="border p-2"><textarea value={qasFinalResultCalc} onChange={e => setQasFinalResultCalc(e.target.value)} disabled={isInputDisabled} className="w-full border rounded p-2 text-sm" rows={2} placeholder="Describe how final results are calculated to declare competence..." /></td></tr>
                  <tr><td className="border p-2 font-semibold">REQUIREMENTS FOR AN ACCREDITED ASSESSMENT CENTRE:</td><td className="border p-2"><textarea value={qasAssessmentCentreReqs} onChange={e => setQasAssessmentCentreReqs(e.target.value)} disabled={isInputDisabled} className="w-full border rounded p-2 text-sm" rows={2} placeholder="List requirements for accredited assessment centres..." /></td></tr>
                  <tr className="bg-gray-50"><td className="border p-2 font-semibold">REQUIREMENTS FOR CANDIDATES TO BRING ALONG:</td><td className="border p-2"><textarea value={qasCandidateRequirements} onChange={e => setQasCandidateRequirements(e.target.value)} disabled={isInputDisabled} className="w-full border rounded p-2 text-sm" rows={2} placeholder="List what candidates must bring to the assessment..." /></td></tr>
                  <tr><td className="border p-2 font-semibold">OPEN OR CLOSED BOOK ASSESSMENT:</td><td className="border p-2"><select value={qasOpenClosedBook} onChange={e => setQasOpenClosedBook(e.target.value)} disabled={isInputDisabled} className="border rounded px-3 py-1 text-sm"><option value="">Select</option><option value="Open Book">Open Book</option><option value="Closed Book">Closed Book</option><option value="Combination">Combination</option></select></td></tr>
                  <tr className="bg-gray-50"><td className="border p-2 font-semibold">ACCESS TO EISA FOR CANDIDATES WITH SPECIAL NEEDS:</td><td className="border p-2"><textarea value={qasSpecialNeeds} onChange={e => setQasSpecialNeeds(e.target.value)} disabled={isInputDisabled} className="w-full border rounded p-2 text-sm" rows={2} placeholder="Describe accommodations for candidates with special needs..." /></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 1.2.3 Competencies to be assessed */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-600 mb-2 text-xs uppercase">1.2.3 Competencies to be assessed in the EISA:</h5>
            <p className="text-xs text-gray-500 mb-2 italic">The assessment standards for the EISA are based on the Occupational Profile, the purpose of the qualification profile, the purpose of the qualification, the Exit Level outcomes, and is aligned to the SAQA NQF Level descriptors appropriate for the level of the qualification.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr><th className="border p-2 text-left w-1/3">EXIT LEVEL OUTCOMES</th><th className="border p-2 text-center w-24">WEIGHTING</th><th className="border p-2 text-left">CRITICAL ASPECTS TO BE EXTERNALLY ASSESSED - CORE FOCUS</th></tr>
                </thead>
                <tbody>
                  {qasExitLevelOutcomes.map((elo, idx) => (
                    <tr key={`elo-${idx}`}>
                      <td className="border p-2"><textarea value={elo.outcome} onChange={e => { const r = [...qasExitLevelOutcomes]; r[idx] = { ...r[idx], outcome: e.target.value }; setQasExitLevelOutcomes(r); }} disabled={isInputDisabled} className="w-full border rounded p-1 text-sm" rows={2} placeholder="Exit Level Outcome description" /></td>
                      <td className="border p-2"><input type="text" value={elo.weighting} onChange={e => { const r = [...qasExitLevelOutcomes]; r[idx] = { ...r[idx], weighting: e.target.value }; setQasExitLevelOutcomes(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm text-center" placeholder="%" /></td>
                      <td className="border p-2"><textarea value={elo.criticalAspects} onChange={e => { const r = [...qasExitLevelOutcomes]; r[idx] = { ...r[idx], criticalAspects: e.target.value }; setQasExitLevelOutcomes(r); }} disabled={isInputDisabled} className="w-full border rounded p-1 text-sm" rows={2} placeholder="Critical aspects to be assessed..." /></td>
                      <td className="border p-2 text-center w-10">{!isInputDisabled && <button onClick={() => setQasExitLevelOutcomes(qasExitLevelOutcomes.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!isInputDisabled && (
                <button onClick={() => setQasExitLevelOutcomes([...qasExitLevelOutcomes, { outcome: '', weighting: '', criticalAspects: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Exit Level Outcome
                </button>
              )}
            </div>
          </div>

          {/* 1.2.4 Planned assessment dates and candidate support */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-600 mb-2 text-xs uppercase">1.2.4 Planned assessment dates and candidate support</h5>
            <textarea value={qasAssessmentDates} onChange={e => setQasAssessmentDates(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder="Describe annual assessment dates, exemplar availability, and candidate support mechanisms..." />
          </div>

          {/* 1.2.5 Eligibility Requirements */}
          <div className="mb-4">
            <h5 className="font-medium text-gray-600 mb-2 text-xs uppercase">1.2.5 Eligibility Requirements for the External Integrated Summative Assessment (EISA)</h5>
            <textarea value={qasEligibilityReqs} onChange={e => setQasEligibilityReqs(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder="List eligibility requirements for EISA..." />
          </div>
        </div>
      </div>

      {/* SECTION 2: CRITERIA FOR SUBJECT MATTER EXPERTS (SME) */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-bold text-gray-800 mb-4 text-md uppercase tracking-wide">SECTION 2: CRITERIA FOR SUBJECT MATTER EXPERTS (SME)</h3>
        <p className="text-sm text-gray-600 mb-3">SME may be assigned as developers, markers/assessors and moderators. The criteria for SME are determined by industry, and contained in the QCTO Curriculum Document after each module.</p>
        <p className="text-sm text-gray-600 mb-3">The criteria for assessors/markers and moderators for the development/moderation of the EISA assessment instruments:</p>
        <ul className="list-disc ml-5 text-sm text-gray-600 mb-4 space-y-1">
          <li>Minimum three years' experience in industry for developers, markers or assessors; evidence thereof required.</li>
          <li>Minimum of five years' experience in industry for moderators; evidence thereof required.</li>
          <li>Occupational learning and development experience in related fields, evidence of active current practice, trained in assessment practice and recognised by the sector for experience and credibility.</li>
          <li>Active professional membership with professional designation is recommended.</li>
        </ul>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">(a) Requirements for the EISA Developers:</label>
            <textarea value={qasSmeDevelopers} onChange={e => setQasSmeDevelopers(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder="List specific requirements for EISA developers..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">(b) Requirements for the EISA Markers/Assessors:</label>
            <textarea value={qasSmeMarkers} onChange={e => setQasSmeMarkers(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder="List specific requirements for EISA markers/assessors..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">(c) Requirements for EISA Moderators (Pre and Post):</label>
            <textarea value={qasSmeModerators} onChange={e => setQasSmeModerators(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder="List specific requirements for EISA moderators..." />
          </div>
        </div>
      </div>

      {/* QP Declaration */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <Shield className="w-4 h-4" /> Quality Partner Declaration
        </h3>
        <p className="text-sm text-gray-600 mb-4 italic">I, [declarant name], declare that the information provided above is an accurate reflection of the Assessment Specifications developed for this qualification.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Name and Surname of QP Representative</label><input type="text" value={qasDeclarantName} onChange={e => setQasDeclarantName(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Full name" /></div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div><label className="block text-xs text-gray-500 mb-1">Signed on day</label><input type="text" value={qasDeclarationDay} onChange={e => setQasDeclarationDay(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="DD" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Month</label><input type="text" value={qasDeclarationMonth} onChange={e => setQasDeclarationMonth(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Month" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Year</label><input type="text" value={qasDeclarationYear} onChange={e => setQasDeclarationYear(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="YYYY" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">At (place)</label><input type="text" value={qasDeclarationPlace} onChange={e => setQasDeclarationPlace(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Place" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Witness 1 Name</label><input type="text" value={qasWitness1} onChange={e => setQasWitness1(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Witness 1 Name and Surname" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Witness 2 Name</label><input type="text" value={qasWitness2} onChange={e => setQasWitness2(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Witness 2 Name and Surname" /></div>
        </div>
        <div className="mt-3">
          <p className="text-xs text-gray-500 italic">NB: Attach completed QAS Document (QCTO prescribed format)</p>
          <input type="file" ref={qasDocumentRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'qasDocument'); }} className="hidden" />
          {!isInputDisabled && (
            <button onClick={() => qasDocumentRef.current?.click()} className="mt-2 flex items-center gap-1 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50">
              <Upload className="w-3.5 h-3.5" /> Upload QAS Document
            </button>
          )}
          {renderFileList('qasDocument')}
        </div>
        <p className="text-xs text-gray-400 mt-4 italic">Document No: QAS-01 | Version: 1.2 | ©Copyright: QCTO</p>
      </div>
    </div>
  );

      // ─── DEVELOP QAS ADDENDUM ──────────────────────────────────────────────
    // ─── DEVELOP QAS ADDENDUM — QCTO QAS Addendum Evaluation Template ───────────
case 'Develop QAS Addendum':
  // Calculate evaluation progress
  const totalEvaluationItems = qasAddendumEvaluation.length;
  const approvedItems = qasAddendumEvaluation.filter(item => item.status === 'yes').length;
  const rejectedItems = qasAddendumEvaluation.filter(item => item.status === 'no').length;
  const pendingItems = totalEvaluationItems - approvedItems - rejectedItems;
  const isFullyApproved = rejectedItems === 0 && approvedItems === totalEvaluationItems && totalEvaluationItems > 0;

  return (
    <div className="space-y-6">
      {/* NB notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>NB:</strong> This QAS Addendum Evaluation Report is to be compiled by the QCTO OQA Assessment Evaluation team. This form evaluates QAS Addenda submitted by Assessment Quality Partners (AQPs) and indicates whether the QAS Addendum has met the minimum requirements for approval.
      </div>

      {/* Assessment Committee Approval */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <Shield className="w-4 h-4" /> ASSESSMENT COMMITTEE APPROVAL
        </h3>
        <div className="flex gap-8 items-center">
          <label className="flex items-center gap-2">
            <input 
              type="radio" 
              name="committeeApproval" 
              value="yes" 
              checked={qasAddendumCommitteeApproval === 'yes'}
              onChange={() => setQasAddendumCommitteeApproval('yes')}
              disabled={isInputDisabled}
              className="w-4 h-4"
            />
            <span className="font-medium">Yes: X</span>
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="radio" 
              name="committeeApproval" 
              value="no" 
              checked={qasAddendumCommitteeApproval === 'no'}
              onChange={() => setQasAddendumCommitteeApproval('no')}
              disabled={isInputDisabled}
              className="w-4 h-4"
            />
            <span className="font-medium">No</span>
          </label>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date</label>
            <input 
              type="date" 
              value={qasAddendumApprovalDate} 
              onChange={e => setQasAddendumApprovalDate(e.target.value)} 
              disabled={isInputDisabled}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* SECTION A: ASSESSMENT QUALITY PARTNER (AQP) DETAILS */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">SECTION A: ASSESSMENT QUALITY PARTNER (AQP) DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">AQP Name</label><input type="text" value={qasAddendumAqpName} onChange={e => setQasAddendumAqpName(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Contact Name</label><input type="text" value={qasAddendumContactName} onChange={e => setQasAddendumContactName(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Contact Email</label><input type="email" value={qasAddendumContactEmail} onChange={e => setQasAddendumContactEmail(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Physical Address</label><input type="text" value={qasAddendumPhysicalAddress} onChange={e => setQasAddendumPhysicalAddress(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date Received</label><input type="date" value={qasAddendumDateReceived} onChange={e => setQasAddendumDateReceived(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date Evaluated</label><input type="date" value={qasAddendumDateEvaluated} onChange={e => setQasAddendumDateEvaluated(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Evaluator's Name</label><input type="text" value={qasAddendumEvaluatorName} onChange={e => setQasAddendumEvaluatorName(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
        </div>
      </div>

      {/* SECTION B: ASSESSMENT SPECIFICATION REQUIREMENTS */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">SECTION B: ASSESSMENT SPECIFICATION REQUIREMENTS</h3>
        
        {/* Qualification Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Qualification Title</label><input type="text" value={qasAddendumQualTitle} onChange={e => setQasAddendumQualTitle(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">SAQA ID</label><input type="text" value={qasAddendumSaqaId} onChange={e => setQasAddendumSaqaId(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date Registered</label><input type="date" value={qasAddendumDateRegistered} onChange={e => setQasAddendumDateRegistered(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">NQF Level</label><input type="text" value={qasAddendumNqfLevel} onChange={e => setQasAddendumNqfLevel(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Credits</label><input type="text" value={qasAddendumCredits} onChange={e => setQasAddendumCredits(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Registration Start Date</label><input type="date" value={qasAddendumRegStartDate} onChange={e => setQasAddendumRegStartDate(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Registration End Date</label><input type="date" value={qasAddendumRegEndDate} onChange={e => setQasAddendumRegEndDate(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
        </div>

        {/* Verification Items */}
        <div className="space-y-3 mt-4">
          {qasAddendumVerificationItems.map((item, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border">
              <p className="text-sm font-medium text-gray-800 mb-2">{item.label}</p>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name={`verify_${idx}`} value="yes" checked={item.value === 'yes'} onChange={() => { const updated = [...qasAddendumVerificationItems]; updated[idx].value = 'yes'; setQasAddendumVerificationItems(updated); }} disabled={isInputDisabled} className="w-4 h-4" />
                  <span className="text-sm">Yes/Correct</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name={`verify_${idx}`} value="no" checked={item.value === 'no'} onChange={() => { const updated = [...qasAddendumVerificationItems]; updated[idx].value = 'no'; setQasAddendumVerificationItems(updated); }} disabled={isInputDisabled} className="w-4 h-4" />
                  <span className="text-sm">No/Incorrect</span>
                </label>
              </div>
              <textarea placeholder="Findings / Comments" value={item.comment} onChange={e => { const updated = [...qasAddendumVerificationItems]; updated[idx].comment = e.target.value; setQasAddendumVerificationItems(updated); }} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={2} />
            </div>
          ))}
        </div>

        {/* Final Achievements Table */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Final achievements for each component:</label>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr><th className="border p-2">Component</th><th className="border p-2">Name of Components</th><th className="border p-2">Total Marks/Competency</th><th className="border p-2">Pass Mark/Competency Required</th></tr>
              </thead>
              <tbody>
                {qasAddendumComponents.map((comp, idx) => (
                  <tr key={idx}>
                    <td className="border p-2 text-center">Component {idx + 1}</td>
                    <td className="border p-2"><input type="text" value={comp.name} onChange={e => { const updated = [...qasAddendumComponents]; updated[idx].name = e.target.value; setQasAddendumComponents(updated); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1" placeholder="Component name" /></td>
                    <td className="border p-2"><input type="text" value={comp.totalMarks} onChange={e => { const updated = [...qasAddendumComponents]; updated[idx].totalMarks = e.target.value; setQasAddendumComponents(updated); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-center" placeholder="Marks" /></td>
                    <td className="border p-2"><input type="text" value={comp.passMark} onChange={e => { const updated = [...qasAddendumComponents]; updated[idx].passMark = e.target.value; setQasAddendumComponents(updated); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-center" placeholder="Pass %" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isInputDisabled && <button onClick={() => setQasAddendumComponents([...qasAddendumComponents, { name: '', totalMarks: '', passMark: '' }])} className="mt-2 text-blue-600 text-sm">+ Add Component</button>}
        </div>

        {/* Additional Requirements */}
        <div className="space-y-3 mt-4">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Calculation of final achievement:</label><textarea value={qasAddendumFinalCalc} onChange={e => setQasAddendumFinalCalc(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="e.g. Candidate must achieve 50% in each component and 60% overall" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Final achievement (pass mark/competency result):</label><input type="text" value={qasAddendumFinalPass} onChange={e => setQasAddendumFinalPass(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. 60% overall" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Duration of each component (hours/days):</label><textarea value={qasAddendumDuration} onChange={e => setQasAddendumDuration(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="e.g. Written: 3 hours, Practical: 2 days" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Is there a Format (written, practical, presentation, etc.):</label><textarea value={qasAddendumFormat} onChange={e => setQasAddendumFormat(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={2} /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Is there a Layout of question types:</label><textarea value={qasAddendumLayout} onChange={e => setQasAddendumLayout(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="e.g. Multiple Choice, True/False, Essay, Practical tasks" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Is it Open or Closed Book:</label><select value={qasAddendumOpenClosed} onChange={e => setQasAddendumOpenClosed(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm"><option value="">Select</option><option value="Open Book">Open Book</option><option value="Closed Book">Closed Book</option><option value="Combination">Combination</option></select></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Are Assessment Points indicated:</label><textarea value={qasAddendumAssessmentPoints} onChange={e => setQasAddendumAssessmentPoints(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="e.g. 2 assessment opportunities per year" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Are there Supplementary Assessments:</label><select value={qasAddendumSupplementary} onChange={e => setQasAddendumSupplementary(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm"><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">% to be moderated (not less than 10%):</label><input type="text" value={qasAddendumModerationPercent} onChange={e => setQasAddendumModerationPercent(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. 15%" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Number of marking days indicated (not less than 21 days):</label><input type="text" value={qasAddendumMarkingDays} onChange={e => setQasAddendumMarkingDays(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. 25 days" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Number of Moderation days indicated (not less than 21 days):</label><input type="text" value={qasAddendumModerationDays} onChange={e => setQasAddendumModerationDays(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. 21 days" /></div>
        </div>
      </div>

      {/* SECTION C: CORE QUALIFICATION ASSESSMENT (blueprint) EVALUATION */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">SECTION C: CORE QUALIFICATION ASSESSMENT (blueprint) EVALUATION</h3>
        <p className="text-xs text-gray-500 mb-3 italic">Mark with √ under Yes or No, whichever is applicable</p>
        
        <div className="space-y-3">
          {qasAddendumEvaluation.map((item, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-medium text-gray-800">{item.item}</p>
                  {item.subItem && <p className="text-xs text-gray-500 ml-2 mt-1">- {item.subItem}</p>}
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1">
                    <input type="radio" name={`eval_${idx}`} value="yes" checked={item.status === 'yes'} onChange={() => { const updated = [...qasAddendumEvaluation]; updated[idx].status = 'yes'; setQasAddendumEvaluation(updated); }} disabled={isInputDisabled} className="w-4 h-4" />
                    <span className={`text-sm px-2 py-0.5 rounded ${item.status === 'yes' ? 'bg-green-100 text-green-700' : ''}`}>Yes</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name={`eval_${idx}`} value="no" checked={item.status === 'no'} onChange={() => { const updated = [...qasAddendumEvaluation]; updated[idx].status = 'no'; setQasAddendumEvaluation(updated); }} disabled={isInputDisabled} className="w-4 h-4" />
                    <span className={`text-sm px-2 py-0.5 rounded ${item.status === 'no' ? 'bg-red-100 text-red-700' : ''}`}>No</span>
                  </label>
                </div>
                <div className="flex-1 min-w-[250px]">
                  <input type="text" value={item.comment} onChange={e => { const updated = [...qasAddendumEvaluation]; updated[idx].comment = e.target.value; setQasAddendumEvaluation(updated); }} disabled={isInputDisabled} className="w-full border rounded-lg p-1 text-sm" placeholder="Comments / Findings" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION D: OVERALL GENERAL EVALUATION */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">SECTION D: OVERALL GENERAL EVALUATION</h3>
        <p className="text-xs text-gray-500 mb-3 italic">Characteristics of effective QAS Addendum</p>
        
        <div className="space-y-3">
          {qasAddendumCharacteristics.map((char, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{char.characteristic}</p>
                  <p className="text-xs text-gray-500">{char.description}</p>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1">
                    <input type="radio" name={`char_${idx}`} value="yes" checked={char.status === 'yes'} onChange={() => { const updated = [...qasAddendumCharacteristics]; updated[idx].status = 'yes'; setQasAddendumCharacteristics(updated); }} disabled={isInputDisabled} className="w-4 h-4" />
                    <span className="text-sm">Yes</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name={`char_${idx}`} value="no" checked={char.status === 'no'} onChange={() => { const updated = [...qasAddendumCharacteristics]; updated[idx].status = 'no'; setQasAddendumCharacteristics(updated); }} disabled={isInputDisabled} className="w-4 h-4" />
                    <span className="text-sm">No</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Evaluation Findings */}
        <div className="mt-4 p-3 bg-white rounded-lg border">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Evaluation Findings</label>
          <textarea value={qasAddendumFindings} onChange={e => setQasAddendumFindings(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder="The QAS Addendum is well developed..." />
          <label className="block text-xs font-semibold text-gray-600 mt-3 mb-1 uppercase">Recommendation</label>
          <textarea value={qasAddendumRecommendation} onChange={e => setQasAddendumRecommendation(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg p-2 text-sm" rows={2} placeholder="The QAS Addendum meets the minimum criteria for approval." />
        </div>
      </div>

      {/* SECTION E: FINAL RECOMMENDATIONS */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide">SECTION E: FINAL RECOMMENDATIONS</h3>
        
        <div className="flex gap-8 mb-6">
          <label className="flex items-center gap-2">
            <input type="radio" name="finalRecommendation" value="approved" checked={qasAddendumFinalRecommendation === 'approved'} onChange={() => setQasAddendumFinalRecommendation('approved')} disabled={isInputDisabled} className="w-4 h-4" />
            <span className="font-medium">The QAS Addendum evaluated meets minimum requirements for approval</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="finalRecommendation" value="notApproved" checked={qasAddendumFinalRecommendation === 'notApproved'} onChange={() => setQasAddendumFinalRecommendation('notApproved')} disabled={isInputDisabled} className="w-4 h-4" />
            <span className="font-medium">The QAS Addendum evaluated does NOT meet minimum requirements for approval</span>
          </label>
        </div>

        {/* Evaluator Sign-off */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-sm font-semibold">FIRST EVALUATOR</p>
            <div className="mt-2 space-y-2">
              <input type="text" value={qasAddendumFirstEvaluatorName} onChange={e => setQasAddendumFirstEvaluatorName(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Name" />
              <div className="flex gap-2 mt-2">
                <label className="flex items-center gap-1"><input type="radio" name="firstRec" value="approved" checked={qasAddendumFirstRec === 'approved'} onChange={() => setQasAddendumFirstRec('approved')} disabled={isInputDisabled} /> Recommended for Approval</label>
                <label className="flex items-center gap-1"><input type="radio" name="firstRec" value="amendments" checked={qasAddendumFirstRec === 'amendments'} onChange={() => setQasAddendumFirstRec('amendments')} disabled={isInputDisabled} /> Recommended with Amendments</label>
                <label className="flex items-center gap-1"><input type="radio" name="firstRec" value="notRecommended" checked={qasAddendumFirstRec === 'notRecommended'} onChange={() => setQasAddendumFirstRec('notRecommended')} disabled={isInputDisabled} /> Not Recommended</label>
              </div>
              <input type="text" value={qasAddendumAssistantDirector} onChange={e => setQasAddendumAssistantDirector(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm mt-2" placeholder="Assistant Director Name" />
              <input type="date" value={qasAddendumAssistantDirectorDate} onChange={e => setQasAddendumAssistantDirectorDate(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Date" />
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg border">
            <p className="text-sm font-semibold">SECOND EVALUATOR</p>
            <div className="mt-2 space-y-2">
              <input type="text" value={qasAddendumSecondEvaluatorName} onChange={e => setQasAddendumSecondEvaluatorName(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Name" />
              <div className="flex gap-2 mt-2">
                <label className="flex items-center gap-1"><input type="radio" name="secondRec" value="approved" checked={qasAddendumSecondRec === 'approved'} onChange={() => setQasAddendumSecondRec('approved')} disabled={isInputDisabled} /> Recommended for Approval</label>
                <label className="flex items-center gap-1"><input type="radio" name="secondRec" value="amendments" checked={qasAddendumSecondRec === 'amendments'} onChange={() => setQasAddendumSecondRec('amendments')} disabled={isInputDisabled} /> Recommended with Amendments</label>
                <label className="flex items-center gap-1"><input type="radio" name="secondRec" value="notRecommended" checked={qasAddendumSecondRec === 'notRecommended'} onChange={() => setQasAddendumSecondRec('notRecommended')} disabled={isInputDisabled} /> Not Recommended</label>
              </div>
              <input type="text" value={qasAddendumDeputyDirector} onChange={e => setQasAddendumDeputyDirector(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm mt-2" placeholder="Deputy Director Name" />
              <input type="date" value={qasAddendumDeputyDirectorDate} onChange={e => setQasAddendumDeputyDirectorDate(e.target.value)} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Date" />
            </div>
          </div>
        </div>

        {/* Final Approval */}
        <div className="mt-6 p-4 bg-white rounded-lg border">
          <p className="text-sm font-semibold">FINAL RECOMMENDATION</p>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-1"><input type="radio" name="finalRec" value="approved" checked={qasAddendumFinalRec === 'approved'} onChange={() => setQasAddendumFinalRec('approved')} disabled={isInputDisabled} /> Approved</label>
            <label className="flex items-center gap-1"><input type="radio" name="finalRec" value="amendments" checked={qasAddendumFinalRec === 'amendments'} onChange={() => setQasAddendumFinalRec('amendments')} disabled={isInputDisabled} /> Approved with Amendments</label>
            <label className="flex items-center gap-1"><input type="radio" name="finalRec" value="notRecommended" checked={qasAddendumFinalRec === 'notRecommended'} onChange={() => setQasAddendumFinalRec('notRecommended')} disabled={isInputDisabled} /> Not Recommended</label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <input type="text" value={qasAddendumDirectorName} onChange={e => setQasAddendumDirectorName(e.target.value)} disabled={isInputDisabled} className="border rounded px-2 py-1 text-sm" placeholder="Director: Assessments Name" />
            <input type="date" value={qasAddendumDirectorDate} onChange={e => setQasAddendumDirectorDate(e.target.value)} disabled={isInputDisabled} className="border rounded px-2 py-1 text-sm" placeholder="Date" />
          </div>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-sm font-medium">Approved by the QCTO Assessment Committee for the setting of assessment standards:</span>
            <label className="flex items-center gap-1"><input type="radio" name="committeeFinal" value="yes" checked={qasAddendumCommitteeFinal === 'yes'} onChange={() => setQasAddendumCommitteeFinal('yes')} disabled={isInputDisabled} /> YES</label>
            <label className="flex items-center gap-1"><input type="radio" name="committeeFinal" value="no" checked={qasAddendumCommitteeFinal === 'no'} onChange={() => setQasAddendumCommitteeFinal('no')} disabled={isInputDisabled} /> NO</label>
            <input type="date" value={qasAddendumCommitteeFinalDate} onChange={e => setQasAddendumCommitteeFinalDate(e.target.value)} disabled={isInputDisabled} className="border rounded px-2 py-1 text-sm" placeholder="Date" />
          </div>
        </div>
      </div>

      {/* File Upload for Supporting Documents */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> Supporting Documents Checklist
        </h3>
        <p className="text-xs text-gray-500 mb-3 italic">The QAS Addendum Evaluator must submit all relevant documentation below together with this completed report.</p>
        
        <div className="space-y-2">
          {qasAddendumSupportingDocs.map((doc, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
              <span className="text-sm">{doc.name}</span>
              <div className="flex items-center gap-2">
                {doc.uploaded ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <input type="file" id={`qas_doc_${idx}`} onChange={(e) => { if (e.target.files?.[0]) { handleFileUpload(e.target.files[0], `qasAddendum_${doc.id}`); const updated = [...qasAddendumSupportingDocs]; updated[idx].uploaded = true; setQasAddendumSupportingDocs(updated); } }} className="hidden" />
                )}
                {!doc.uploaded && !isInputDisabled && (
                  <button onClick={() => document.getElementById(`qas_doc_${idx}`)?.click()} className="text-blue-600 text-sm hover:underline">Upload</button>
                )}
                {doc.uploaded && <span className="text-xs text-green-600">✓ Uploaded</span>}
              </div>
            </div>
          ))}
        </div>
        {renderFileList('qasAddendumDocs')}
      </div>

      {/* Document Footer */}
      <div className="bg-gray-50 p-3 rounded-lg text-center text-xs text-gray-400">
        <p>Document No: QAS-ADD-01 | Version: 1.2 | ©Copyright: QCTO</p>
      </div>
    </div>
  );

      // ─── DEVELOP QUALIFICATION DOCUMENT + STAGE 1 EVALUATION ──────────────
    // ─── DEVELOP QUALIFICATION DOCUMENT + STAGE 1 EVALUATION ─────────────────────
case 'Develop Qualification Document + Stage 1 Evaluation':
  return (
    <div className="space-y-6">
      {/* NB notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>NB:</strong> This phase involves the SME Facilitator writing the main qualification document, followed by a Stage 1 self-evaluation using the prescribed checklist. The completed qualification document and evaluation checklist must be submitted to the QP for review.
      </div>

      {/* Section 1 — Qualification Document Compilation */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <FileText className="w-4 h-4" /> SECTION 1: QUALIFICATION DOCUMENT COMPILATION
        </h3>
        <p className="text-xs text-gray-500 mb-3 italic">The SME Facilitator is responsible for drafting the complete qualification document based on the approved curriculum and assessment specifications.</p>
        
        {/* Qualification Document Summary */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Document Summary / Executive Overview</label>
          <textarea 
            value={qualificationDocSummary} 
            onChange={e => setQualificationDocSummary(e.target.value)} 
            disabled={isInputDisabled} 
            className="w-full border rounded-lg p-3 text-sm" 
            rows={4} 
            placeholder="Provide a high-level summary of the qualification document including: purpose of the qualification, target audience, key outcomes, and overall structure..." 
          />
        </div>

        {/* Document Sections Tracker */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Qualification Document Sections Completed</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {qualificationDocSections.map((section, idx) => (
              <label key={idx} className="flex items-center gap-2 p-2 bg-white rounded border">
                <input 
                  type="checkbox" 
                  checked={section.completed} 
                  onChange={() => {
                    const updated = [...qualificationDocSections];
                    updated[idx].completed = !updated[idx].completed;
                    setQualificationDocSections(updated);
                  }}
                  disabled={isInputDisabled}
                  className="rounded"
                />
                <span className="text-sm">{section.name}</span>
                {section.completed && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
              </label>
            ))}
          </div>
          {!isInputDisabled && (
            <button 
              onClick={() => {
                const allCompleted = qualificationDocSections.every(s => s.completed);
                if (!allCompleted) {
                  const updated = qualificationDocSections.map(s => ({ ...s, completed: true }));
                  setQualificationDocSections(updated);
                }
              }} 
              className="mt-2 text-blue-600 text-sm"
            >
              Mark All Complete
            </button>
          )}
        </div>

        {/* Version Control */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Document Version</label>
            <input 
              type="text" 
              value={qualificationDocVersion} 
              onChange={e => setQualificationDocVersion(e.target.value)} 
              disabled={isInputDisabled} 
              className="w-full border rounded-lg px-3 py-2 text-sm" 
              placeholder="e.g. v1.0, v1.1, v2.0" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date of Completion</label>
            <input 
              type="date" 
              value={qualificationDocCompletionDate} 
              onChange={e => setQualificationDocCompletionDate(e.target.value)} 
              disabled={isInputDisabled} 
              className="w-full border rounded-lg px-3 py-2 text-sm" 
            />
          </div>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed rounded-lg p-4 text-center">
          <input type="file" ref={qualificationDocRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'qualificationDocument'); }} className="hidden" />
          <button onClick={() => qualificationDocRef.current?.click()} disabled={isInputDisabled} className="flex flex-col items-center mx-auto">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Upload Qualification Document (Word/PDF)</p>
            <p className="text-xs text-gray-400 mt-1">Accepted formats: .docx, .pdf (Max 10MB)</p>
          </button>
        </div>
        {renderFileList('qualificationDocument')}
      </div>

      {/* Section 2 — Stage 1 Self-Evaluation (SME Checklist) */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <CheckSquare className="w-4 h-4" /> SECTION 2: STAGE 1 SELF-EVALUATION (SME CHECKLIST)
        </h3>
        <p className="text-xs text-gray-500 mb-3 italic">The SME must complete this self-evaluation checklist to verify their own work before submitting to the QP for Stage 2 evaluation.</p>

        {/* Evaluation Criteria Categories */}
        {stage1Categories.map((category, catIdx) => (
          <div key={catIdx} className="mb-6 border-b pb-4 last:border-b-0">
            <h4 className="font-medium text-gray-700 mb-3 text-sm uppercase tracking-wide">{category.name}</h4>
            <div className="space-y-3">
              {category.criteria.map((criterion, critIdx) => {
                const criterionKey = `${catIdx}-${critIdx}`;
                const status = stage1Evaluation[criterionKey]?.status || 'pending';
                const comment = stage1Evaluation[criterionKey]?.comment || '';
                
                return (
                  <div key={critIdx} className="bg-white p-3 rounded-lg border">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{criterion}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setStage1Evaluation(prev => ({
                              ...prev,
                              [criterionKey]: { status: status === 'pass' ? 'pending' : 'pass', comment }
                            }));
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            status === 'pass' 
                              ? 'bg-green-100 text-green-700 border border-green-300' 
                              : 'bg-gray-100 text-gray-500 hover:bg-green-50'
                          }`}
                          disabled={isInputDisabled}
                        >
                          ✓ Pass
                        </button>
                        <button
                          onClick={() => {
                            setStage1Evaluation(prev => ({
                              ...prev,
                              [criterionKey]: { status: status === 'fail' ? 'pending' : 'fail', comment }
                            }));
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            status === 'fail' 
                              ? 'bg-red-100 text-red-700 border border-red-300' 
                              : 'bg-gray-100 text-gray-500 hover:bg-red-50'
                          }`}
                          disabled={isInputDisabled}
                        >
                          ✗ Fail
                        </button>
                      </div>
                    </div>
                    {status !== 'pending' && (
                      <div className="mt-2">
                        <textarea
                          value={comment}
                          onChange={e => {
                            setStage1Evaluation(prev => ({
                              ...prev,
                              [criterionKey]: { status, comment: e.target.value }
                            }));
                          }}
                          disabled={isInputDisabled}
                          className="w-full border rounded-lg p-2 text-sm mt-1"
                          rows={2}
                          placeholder={status === 'fail' ? "Explain why this criterion was not met and what needs to be fixed..." : "Optional: Add supporting notes or evidence..."}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Overall Self-Evaluation Summary */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-gray-700 mb-3 text-sm uppercase tracking-wide">Overall Self-Evaluation Summary</h4>
          
          {/* Pass/Fail Count */}
          <div className="flex gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Pass: <strong>{stage1PassCount}</strong> / {stage1TotalCriteria}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Fail: <strong>{stage1FailCount}</strong> / {stage1TotalCriteria}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm">Pending: <strong>{stage1PendingCount}</strong> / {stage1TotalCriteria}</span>
            </div>
          </div>

          {/* Overall Status Badge */}
          <div className={`p-3 rounded-lg mb-4 ${
            stage1FailCount === 0 && stage1PassCount === stage1TotalCriteria 
              ? 'bg-green-50 border border-green-200' 
              : stage1FailCount > 0 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center gap-2">
              {stage1FailCount === 0 && stage1PassCount === stage1TotalCriteria ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">All criteria met. Document ready for Stage 2 Evaluation (QP Review).</span>
                </>
              ) : stage1FailCount > 0 ? (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">{stage1FailCount} criteria failed. Document requires revision before submission.</span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Not all criteria have been evaluated. Complete the self-evaluation before submitting.</span>
                </>
              )}
            </div>
          </div>

          {/* SME Declaration */}
          <div className="mt-4">
            <label className="flex items-start gap-3 p-3 bg-white rounded-lg border">
              <input 
                type="checkbox" 
                checked={stage1SmeDeclaration} 
                onChange={e => setStage1SmeDeclaration(e.target.checked)}
                disabled={isInputDisabled || stage1FailCount > 0 || stage1PassCount !== stage1TotalCriteria}
                className="mt-0.5 rounded"
              />
              <span className="text-sm text-gray-700">
                I, the undersigned SME Facilitator, hereby declare that I have completed the qualification document in accordance with the approved curriculum and assessment specifications. I have self-evaluated my work using the checklist above and confirm that all criteria have been met to the best of my knowledge.
              </span>
            </label>
          </div>

          {/* SME Signature */}
          {stage1SmeDeclaration && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">SME Name</label>
                <input 
                  type="text" 
                  value={stage1SmeName} 
                  onChange={e => setStage1SmeName(e.target.value)} 
                  disabled={isInputDisabled} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Full name and surname" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date</label>
                <input 
                  type="date" 
                  value={stage1SmeDate} 
                  onChange={e => setStage1SmeDate(e.target.value)} 
                  disabled={isInputDisabled} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Role / Title</label>
                <input 
                  type="text" 
                  value={stage1SmeRole} 
                  onChange={e => setStage1SmeRole(e.target.value)} 
                  disabled={isInputDisabled} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g. Lead SME, Curriculum Developer" 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 3 — Reviewer Notes (for QP) */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <Users className="w-4 h-4" /> Section 3: Notes for QP Reviewer (Stage 2)
        </h3>
        <textarea 
          value={qualificationDocReviewerNotes} 
          onChange={e => setQualificationDocReviewerNotes(e.target.value)} 
          disabled={isInputDisabled} 
          className="w-full border rounded-lg p-3 text-sm" 
          rows={4} 
          placeholder="Any specific areas the QP should focus on during Stage 2 review? e.g., challenging sections, assumptions made, areas requiring SME input, etc." 
        />
      </div>

      {/* Document Info Footer */}
      <div className="bg-gray-50 p-3 rounded-lg text-center text-xs text-gray-400">
        <p>Document No: QD-STG1 | Version: 1.0 | ©Copyright: QCTO</p>
        <p className="mt-1">Next Step: Submit to QP for Stage 2 Evaluation (External Review)</p>
      </div>
    </div>
  );

      // ─── FINAL VERIFICATION & STAGE 2 ─────────────────────────────────────
      // ─── FINAL VERIFICATION — QCTO Final Verification Report Template ───────────
case 'Final Verification':
  return (
    <div className="space-y-6">
      {/* NB notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>NB:</strong> This final verification report is to be compiled by the QP and is submitted to the QCTO within 10 working days after the Final Verification Meeting.
      </div>

      {/* Section 1 — QCTO approved application details */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <FileText className="w-4 h-4" /> QCTO Approved Application Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Occupation</label>
            <input type="text" value={finalVerificationOccupation} onChange={e => setFinalVerificationOccupation(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Software Developer" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">OFO Code</label>
            <input type="text" value={finalVerificationOfoCode} onChange={e => setFinalVerificationOfoCode(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 123456" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Specialisation</label>
            <input type="text" value={finalVerificationSpecialisation} onChange={e => setFinalVerificationSpecialisation(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="If applicable" />
          </div>
        </div>
      </div>

      {/* Section 2 — Final Verification Meeting details */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Final Verification Meeting Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date</label>
            <input type="date" value={finalVerificationMeetingDate} onChange={e => setFinalVerificationMeetingDate(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Venue</label>
            <input type="text" value={finalVerificationMeetingVenue} onChange={e => setFinalVerificationMeetingVenue(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Meeting location" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Time</label>
            <input type="time" value={finalVerificationMeetingTime} onChange={e => setFinalVerificationMeetingTime(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {/* Section 3 — Details of Qualification for Final Verification */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <Award className="w-4 h-4" /> Details of Qualification for which Final Verification is conducted
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left w-12">No.</th>
                <th className="border px-3 py-2 text-left">Qualification Type</th>
                <th className="border px-3 py-2 text-left">Qualification Title</th>
                <th className="border px-3 py-2 text-left">NQF Level</th>
                <th className="border px-3 py-2 text-left">Credits</th>
                {!isInputDisabled && <th className="border px-3 py-2 text-center w-12">Remove</th>}
              </tr>
            </thead>
            <tbody>
              {finalVerificationQualRows.map((row, i) => (
                <tr key={i}>
                  <td className="border px-3 py-2 text-center text-xs text-gray-500">{i + 1}.</td>
                  <td className="border px-3 py-2"><input type="text" value={row.qualType} onChange={e => { const r = [...finalVerificationQualRows]; r[i] = { ...r[i], qualType: e.target.value }; setFinalVerificationQualRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. Occupational Certificate" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.qualTitle} onChange={e => { const r = [...finalVerificationQualRows]; r[i] = { ...r[i], qualTitle: e.target.value }; setFinalVerificationQualRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Title of qualification" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.nqfLevel} onChange={e => { const r = [...finalVerificationQualRows]; r[i] = { ...r[i], nqfLevel: e.target.value }; setFinalVerificationQualRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 5" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.credits} onChange={e => { const r = [...finalVerificationQualRows]; r[i] = { ...r[i], credits: e.target.value }; setFinalVerificationQualRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 120" /></td>
                  {!isInputDisabled && (
                    <td className="border px-3 py-2 text-center">
                      <button onClick={() => setFinalVerificationQualRows(finalVerificationQualRows.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    
                  )}
                  
                </tr>
                
              ))}
              
            </tbody>
          </table>
          {!isInputDisabled && (
            <button onClick={() => setFinalVerificationQualRows([...finalVerificationQualRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Qualification Row
            </button>
          )}
        </div>
      </div>

      {/* Section 4 — Details of Part-Qualification for Final Verification */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <ListChecks className="w-4 h-4" /> Details of Part-Qualification for which Final Verification is conducted
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left w-12">No.</th>
                <th className="border px-3 py-2 text-left">Qualification Type</th>
                <th className="border px-3 py-2 text-left">Qualification Title</th>
                <th className="border px-3 py-2 text-left">NQF Level</th>
                <th className="border px-3 py-2 text-left">Credits</th>
                {!isInputDisabled && <th className="border px-3 py-2 text-center w-12">Remove</th>}
              </tr>
            </thead>
            <tbody>
              {finalVerificationPartQualRows.map((row, i) => (
                <tr key={i}>
                  <td className="border px-3 py-2 text-center text-xs text-gray-500">{i + 1}.</td>
                  <td className="border px-3 py-2"><input type="text" value={row.qualType} onChange={e => { const r = [...finalVerificationPartQualRows]; r[i] = { ...r[i], qualType: e.target.value }; setFinalVerificationPartQualRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. Part-Qualification" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.qualTitle} onChange={e => { const r = [...finalVerificationPartQualRows]; r[i] = { ...r[i], qualTitle: e.target.value }; setFinalVerificationPartQualRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Title of part-qualification" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.nqfLevel} onChange={e => { const r = [...finalVerificationPartQualRows]; r[i] = { ...r[i], nqfLevel: e.target.value }; setFinalVerificationPartQualRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 4" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.credits} onChange={e => { const r = [...finalVerificationPartQualRows]; r[i] = { ...r[i], credits: e.target.value }; setFinalVerificationPartQualRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 60" /></td>
                  {!isInputDisabled && (
                    <td className="border px-3 py-2 text-center">
                      <button onClick={() => setFinalVerificationPartQualRows(finalVerificationPartQualRows.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!isInputDisabled && (
            <button onClick={() => setFinalVerificationPartQualRows([...finalVerificationPartQualRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Part-Qualification Row
            </button>
          )}
        </div>
      </div>

      {/* Section 5 — Details of Skills Programme for Final Verification */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <Target className="w-4 h-4" /> Details of Skills Programme for which Final Verification is conducted
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left w-12">No.</th>
                <th className="border px-3 py-2 text-left">Qualification Type</th>
                <th className="border px-3 py-2 text-left">Qualification Title</th>
                <th className="border px-3 py-2 text-left">NQF Level</th>
                <th className="border px-3 py-2 text-left">Credits</th>
                {!isInputDisabled && <th className="border px-3 py-2 text-center w-12">Remove</th>}
              </tr>
            </thead>
            <tbody>
              {finalVerificationSkillsProgRows.map((row, i) => (
                <tr key={i}>
                  <td className="border px-3 py-2 text-center text-xs text-gray-500">{i + 1}.</td>
                  <td className="border px-3 py-2"><input type="text" value={row.qualType} onChange={e => { const r = [...finalVerificationSkillsProgRows]; r[i] = { ...r[i], qualType: e.target.value }; setFinalVerificationSkillsProgRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. Skills Programme" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.qualTitle} onChange={e => { const r = [...finalVerificationSkillsProgRows]; r[i] = { ...r[i], qualTitle: e.target.value }; setFinalVerificationSkillsProgRows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Title of skills programme" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.nqfLevel} onChange={e => { const r = [...finalVerificationSkillsProgRows]; r[i] = { ...r[i], nqfLevel: e.target.value }; setFinalVerificationSkillsProgRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 3" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.credits} onChange={e => { const r = [...finalVerificationSkillsProgRows]; r[i] = { ...r[i], credits: e.target.value }; setFinalVerificationSkillsProgRows(r); }} disabled={isInputDisabled} className="w-24 border rounded px-2 py-1 text-sm" placeholder="e.g. 30" /></td>
                  {!isInputDisabled && (
                    <td className="border px-3 py-2 text-center">
                      <button onClick={() => setFinalVerificationSkillsProgRows(finalVerificationSkillsProgRows.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!isInputDisabled && (
            <button onClick={() => setFinalVerificationSkillsProgRows([...finalVerificationSkillsProgRows, { qualType: '', qualTitle: '', nqfLevel: '', credits: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Skills Programme Row
            </button>
          )}
        </div>
      </div>

      {/* Section 6 — Analysis of stakeholders consulted for Final Verification */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
          <Users className="w-4 h-4" /> Analysis of Stakeholders Consulted for Final Verification
        </h3>
        <p className="text-xs text-gray-500 mb-3 italic">NB: Attach Final Verification Meeting Attendance Register in the QCTO prescribed format.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left w-8">No.</th>
                <th className="border px-3 py-2 text-left">Classification</th>
                <th className="border px-3 py-2 text-center w-48">Number of Participants Who Were Invited to the Meeting</th>
                <th className="border px-3 py-2 text-center w-48">Number of Participants Who Attended the Meeting</th>
              </tr>
            </thead>
            <tbody>
              {finalVerificationStakeholders.map((row, idx) => (
                <tr key={idx} className={`${row.isTotal ? 'bg-gray-200 font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="border px-3 py-2 text-center text-xs text-gray-500">{row.isTotal ? '' : `${idx + 1}.`}</td>
                  <td className="border px-3 py-2 text-xs font-medium text-gray-700">{row.classification}</td>
                  <td className="border px-3 py-2">
                    <input type="number" min={0} value={row.invited}
                      onChange={e => { const s = [...finalVerificationStakeholders]; s[idx] = { ...s[idx], invited: e.target.value }; setFinalVerificationStakeholders(s); }}
                      disabled={isInputDisabled || row.isTotal}
                      className={`w-full border rounded px-2 py-1 text-sm text-center ${row.isTotal ? 'bg-gray-300 font-bold cursor-not-allowed' : ''}`}
                      placeholder="0" />
                   </td>
                  <td className="border px-3 py-2">
                    <input type="number" min={0} value={row.attended}
                      onChange={e => { const s = [...finalVerificationStakeholders]; s[idx] = { ...s[idx], attended: e.target.value }; setFinalVerificationStakeholders(s); }}
                      disabled={isInputDisabled || row.isTotal}
                      className={`w-full border rounded px-2 py-1 text-sm text-center ${row.isTotal ? 'bg-gray-300 font-bold cursor-not-allowed' : ''}`}
                      placeholder="0" />
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-600 mb-1">Attach Final Verification Meeting Attendance Register</p>
          <input type="file" ref={finalVerificationAttendanceRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'finalVerificationAttendance'); }} className="hidden" />
          {!isInputDisabled && <button onClick={() => finalVerificationAttendanceRef.current?.click()} className="flex items-center gap-1 text-sm text-blue-600 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-50"><Upload className="w-3.5 h-3.5" />Upload Attendance Register</button>}
          {renderFileList('finalVerificationAttendance')}
        </div>
      </div>

      {/* Section 7 — Details of Subject Matter Expert */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wide">Details of Subject Matter Expert (SME)</h3>
        <p className="text-xs text-gray-500 mb-3">Details of Subject Matter Expert who facilitated the development of Qualification/Part-Qualifications/Skills Programme:</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Name</th>
                <th className="border px-3 py-2 text-left">Surname</th>
                <th className="border px-3 py-2 text-left">Email Address</th>
                <th className="border px-3 py-2 text-left">Cell Number</th>
                <th className="border px-3 py-2 text-left">Telephone Number</th>
                {!isInputDisabled && <th className="border px-3 py-2 text-center">Remove</th>}
              </tr>
            </thead>
            <tbody>
              {finalVerificationSMERows.map((row, i) => (
                <tr key={i}>
                  <td className="border px-3 py-2"><input type="text" value={row.name} onChange={e => { const r = [...finalVerificationSMERows]; r[i] = { ...r[i], name: e.target.value }; setFinalVerificationSMERows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Name" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.surname} onChange={e => { const r = [...finalVerificationSMERows]; r[i] = { ...r[i], surname: e.target.value }; setFinalVerificationSMERows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="Surname" /></td>
                  <td className="border px-3 py-2"><input type="email" value={row.email} onChange={e => { const r = [...finalVerificationSMERows]; r[i] = { ...r[i], email: e.target.value }; setFinalVerificationSMERows(r); }} disabled={isInputDisabled} className="w-full border rounded px-2 py-1 text-sm" placeholder="email@example.com" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.cell} onChange={e => { const r = [...finalVerificationSMERows]; r[i] = { ...r[i], cell: e.target.value }; setFinalVerificationSMERows(r); }} disabled={isInputDisabled} className="w-28 border rounded px-2 py-1 text-sm" placeholder="+27 XX XXX XXXX" /></td>
                  <td className="border px-3 py-2"><input type="text" value={row.phone} onChange={e => { const r = [...finalVerificationSMERows]; r[i] = { ...r[i], phone: e.target.value }; setFinalVerificationSMERows(r); }} disabled={isInputDisabled} className="w-28 border rounded px-2 py-1 text-sm" placeholder="+27 12 345 6789" /></td>
                  {!isInputDisabled && <td className="border px-3 py-2 text-center"><button onClick={() => setFinalVerificationSMERows(finalVerificationSMERows.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isInputDisabled && <button onClick={() => setFinalVerificationSMERows([...finalVerificationSMERows, { name: '', surname: '', email: '', cell: '', phone: '' }])} className="mt-2 text-blue-600 text-sm flex items-center gap-1"><Plus className="w-3 h-3" />Add SME</button>}
      </div>

      {/* Section 8 — Comments */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <Paperclip className="w-4 h-4" /> Comments
        </h3>
        <textarea
          value={finalVerificationComments}
          onChange={e => setFinalVerificationComments(e.target.value)}
          disabled={isInputDisabled}
          className="w-full border rounded-lg p-3 text-sm"
          rows={4}
          placeholder="Any additional comments, notes, or observations regarding the final verification process..."
        />
      </div>

      {/* Section 9 — QP Declaration */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <Shield className="w-4 h-4" /> Quality Partner Declaration
        </h3>
        <p className="text-sm text-gray-600 mb-4 italic">
          I, ...(Name and Surname - Quality Partner Representative), declare that the information provided above is an accurate reflection of the proceedings of the final verification meeting as detailed in this report.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Name and Surname of QP Representative</label>
            <input
              type="text"
              value={finalVerificationDeclarantName}
              onChange={e => setFinalVerificationDeclarantName(e.target.value)}
              disabled={isInputDisabled}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Full name and surname"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Signed on day</label>
            <input type="text" value={finalVerificationDeclarationDay} onChange={e => setFinalVerificationDeclarationDay(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="DD" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Month</label>
            <input type="text" value={finalVerificationDeclarationMonth} onChange={e => setFinalVerificationDeclarationMonth(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Month" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Year</label>
            <input type="text" value={finalVerificationDeclarationYear} onChange={e => setFinalVerificationDeclarationYear(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="YYYY" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">At (place)</label>
            <input type="text" value={finalVerificationDeclarationPlace} onChange={e => setFinalVerificationDeclarationPlace(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="City/Town" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Witness 1 Name</label>
            <input type="text" value={finalVerificationWitness1} onChange={e => setFinalVerificationWitness1(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Witness 1 Name and Surname" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Witness 2 Name</label>
            <input type="text" value={finalVerificationWitness2} onChange={e => setFinalVerificationWitness2(e.target.value)} disabled={isInputDisabled} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Witness 2 Name and Surname" />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4 italic">Document No: FVR-01 | Version: 1.0 | ©Copyright: QCTO</p>
      </div>
    </div>
  );
  // ─── DEVELOP QUALIFICATION DOCUMENT + STAGE 1 EVALUATION ─────────────────────

  // ─── STAGE 2 EVALUATION (BY QP) + SUBMISSION TO QCTO ────────────────────────
case 'Stage 2 Evaluation (by QP) + Submission to QCTO':
  // Calculate overall readiness percentage
  const calculateReadiness = () => {
    let total = 0;
    let completed = 0;
    
    // Quality criteria
    total += qualityCriteria.length;
    completed += qualityCriteria.filter(c => c.checked).length;
    
    // Documents checklist
    total += submissionDocuments.length;
    completed += submissionDocuments.filter(d => d.uploaded).length;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };
  
  const readinessPercentage = calculateReadiness();
  const isReadyForSubmission = readinessPercentage === 100;

  return (
    <div className="space-y-6">
      {/* NB notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>NB:</strong> This is the final stage before qualification submission. The QP must conduct a thorough quality check of all deliverables and ensure the complete package is ready for QCTO submission.
      </div>

      {/* Progress Dashboard */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-600" /> Submission Readiness Dashboard
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{readinessPercentage}%</p>
            <p className="text-xs text-gray-500">Overall Readiness</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{qualityCriteria.filter(c => c.checked).length}/{qualityCriteria.length}</p>
            <p className="text-xs text-gray-500">Quality Criteria Met</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{submissionDocuments.filter(d => d.uploaded).length}/{submissionDocuments.length}</p>
            <p className="text-xs text-gray-500">Documents Ready</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{stage2CompletedPhases}/{stage2TotalPhases}</p>
            <p className="text-xs text-gray-500">Phases Completed</p>
          </div>
        </div>
        
        {/* Readiness Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${readinessPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'}`} 
            style={{ width: `${readinessPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {isReadyForSubmission 
            ? '✓ All criteria met. Package ready for QCTO submission.' 
            : `${100 - readinessPercentage}% remaining. Complete all checks before submission.`}
        </p>
      </div>

      {/* Section 1 — Phase Completion Status */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" /> Section 1: Development Phase Completion Status
        </h3>
        <p className="text-xs text-gray-500 mb-3 italic">Confirm that all previous phases have been completed and approved.</p>
        <div className="space-y-2">
          {stage2Phases.map((phase, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                {phase.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium">{phase.name}</p>
                  <p className="text-xs text-gray-500">{phase.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {phase.completed && phase.approvedDate && (
                  <span className="text-xs text-gray-400">Approved: {phase.approvedDate}</span>
                )}
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={phase.completed}
                    onChange={(e) => {
                      const updated = [...stage2Phases];
                      updated[idx].completed = e.target.checked;
                      if (e.target.checked && !updated[idx].approvedDate) {
                        updated[idx].approvedDate = new Date().toISOString().split('T')[0];
                      }
                      setStage2Phases(updated);
                    }}
                    disabled={isInputDisabled}
                    className="rounded"
                  />
                  <span className="text-xs">Completed</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 — QP Quality Checklist */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <CheckSquare className="w-4 h-4" /> Section 2: QP Quality Checklist (Final Review)
        </h3>
        <p className="text-xs text-gray-500 mb-3 italic">The QP must verify each item before final submission.</p>
        
        {qualityCriteria.map((criterion, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border mb-2">
            <input 
              type="checkbox" 
              checked={criterion.checked}
              onChange={(e) => {
                const updated = [...qualityCriteria];
                updated[idx].checked = e.target.checked;
                setQualityCriteria(updated);
              }}
              disabled={isInputDisabled}
              className="mt-0.5 rounded"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{criterion.item}</p>
              {criterion.notes && (
                <p className="text-xs text-gray-500 mt-0.5">{criterion.notes}</p>
              )}
            </div>
            {criterion.checked && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
        ))}
      </div>

      {/* Section 3 — Document Checklist for QCTO Submission */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <FileText className="w-4 h-4" /> Section 3: Document Checklist for QCTO Submission
        </h3>
        <p className="text-xs text-gray-500 mb-3 italic">All required documents must be uploaded and verified before submission.</p>
        
        {submissionDocuments.map((doc, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border mb-2">
            <input 
              type="checkbox" 
              checked={doc.uploaded}
              onChange={(e) => {
                const updated = [...submissionDocuments];
                updated[idx].uploaded = e.target.checked;
                setSubmissionDocuments(updated);
              }}
              disabled={isInputDisabled}
              className="mt-0.5 rounded"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{doc.name}</p>
              <p className="text-xs text-gray-500">{doc.requiredFormat}</p>
            </div>
          <div className="flex items-center gap-2">
  {doc.uploaded ? (
    <CheckCircle className="w-4 h-4 text-green-500" />
  ) : (
    <input 
      type="file" 
      id={`doc_upload_${idx}`}
      onChange={(e) => {
        if (e.target.files?.[0]) {
          handleFileUpload(e.target.files[0], `submission_${doc.id}`);
          const updated = [...submissionDocuments];
          updated[idx].uploaded = true;
          updated[idx].fileName = e.target.files[0].name;
          setSubmissionDocuments(updated);
        }
      }}
      className="hidden"
      disabled={isInputDisabled}
    />
  )}
  {!doc.uploaded && !isInputDisabled && (
    <button 
      onClick={() => {
        const fileInput = document.getElementById(`doc_upload_${idx}`);
        if (fileInput) fileInput.click();
      }}
      className="text-blue-600 text-sm hover:underline"
    >
      Upload
    </button>
  )}
  {doc.uploaded && doc.fileName && (
    <span className="text-xs text-green-600 truncate max-w-[150px]">{doc.fileName}</span>
  )}
</div>
          </div>
        ))}
        
        {/* Render uploaded files for submission documents */}
        {renderFileList('submissionDocuments')}
      </div>

      {/* Section 4 — QP Declaration & Sign-off */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <Shield className="w-4 h-4" /> Section 4: QP Declaration & Final Sign-off
        </h3>
        
        <div className="space-y-4">
          {/* Declaration Text */}
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-700 italic">
              "I, the undersigned Quality Partner representative, hereby declare that:
            </p>
            <ul className="list-disc ml-6 mt-2 text-sm text-gray-600 space-y-1">
              <li>All development phases have been completed and approved</li>
              <li>The qualification meets all QCTO quality requirements and standards</li>
              <li>All required documentation has been reviewed and is accurate</li>
              <li>The complete submission package is ready for QCTO evaluation</li>
            </ul>
          </div>
          
          {/* Declaration Checkbox */}
          <label className="flex items-start gap-3 p-3 bg-white rounded-lg border">
            <input 
              type="checkbox" 
              checked={stage2QpDeclaration}
              onChange={e => setStage2QpDeclaration(e.target.checked)}
              disabled={isInputDisabled || !isReadyForSubmission}
              className="mt-0.5 rounded"
            />
            <span className="text-sm text-gray-700">
              I confirm that I have reviewed all deliverables and the complete package is ready for submission to the QCTO.
            </span>
          </label>
          
          {/* QP Signature Fields */}
          {stage2QpDeclaration && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">QP Name</label>
                <input 
                  type="text" 
                  value={stage2QpName} 
                  onChange={e => setStage2QpName(e.target.value)} 
                  disabled={isInputDisabled} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Full name and surname" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Role / Title</label>
                <input 
                  type="text" 
                  value={stage2QpRole} 
                  onChange={e => setStage2QpRole(e.target.value)} 
                  disabled={isInputDisabled} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="e.g. Quality Assurance Manager" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date of Sign-off</label>
                <input 
                  type="date" 
                  value={stage2QpDate} 
                  onChange={e => setStage2QpDate(e.target.value)} 
                  disabled={isInputDisabled} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 5 — Submission Details */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <Send className="w-4 h-4" /> Section 5: Submission Details to QCTO
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">QCTO Reference Number (if known)</label>
            <input 
              type="text" 
              value={stage2QctoReference} 
              onChange={e => setStage2QctoReference(e.target.value)} 
              disabled={isInputDisabled} 
              className="w-full border rounded-lg px-3 py-2 text-sm" 
              placeholder="e.g. QCTO-2024-XXXX" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Submission Method</label>
            <select 
              value={stage2SubmissionMethod} 
              onChange={e => setStage2SubmissionMethod(e.target.value)} 
              disabled={isInputDisabled}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select submission method</option>
              <option value="QCTO Portal">QCTO Online Portal</option>
              <option value="Email">Email</option>
              <option value="Physical Copy">Physical Copy</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Submission Notes / Comments</label>
          <textarea 
            value={stage2SubmissionNotes} 
            onChange={e => setStage2SubmissionNotes(e.target.value)} 
            disabled={isInputDisabled} 
            className="w-full border rounded-lg p-3 text-sm" 
            rows={3} 
            placeholder="Any additional notes for QCTO regarding this submission..." 
          />
        </div>
        
        {/* QCTO Acknowledgement (optional) */}
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={stage2QctoAcknowledged} 
              onChange={e => setStage2QctoAcknowledged(e.target.checked)} 
              disabled={isInputDisabled}
              className="rounded"
            />
            <span className="text-sm text-gray-600">I acknowledge that the QCTO may contact me for additional information or clarification regarding this submission.</span>
          </label>
        </div>
      </div>

      {/* Submission Final Status */}
      {(stage2QpDeclaration && isReadyForSubmission) && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">Ready for QCTO Submission</p>
              <p className="text-xs text-green-700 mt-1">
                All quality checks have been completed and all required documents are ready. 
                The complete submission package can now be sent to QCTO for final evaluation and qualification registration.
              </p>
              <div className="mt-3 p-2 bg-white rounded border border-green-200">
                <p className="text-xs font-mono text-gray-600">
                  Submission Package Summary:<br />
                  • {qualityCriteria.filter(c => c.checked).length}/{qualityCriteria.length} Quality Criteria Met<br />
                  • {submissionDocuments.filter(d => d.uploaded).length}/{submissionDocuments.length} Documents Ready<br />
                  • {stage2CompletedPhases}/{stage2TotalPhases} Development Phases Completed<br />
                  • QP Sign-off: {stage2QpName || 'Pending'} on {stage2QpDate || 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Footer */}
      <div className="bg-gray-50 p-3 rounded-lg text-center text-xs text-gray-400">
        <p>Document No: QP-STG2-SUB | Version: 1.0 | ©Copyright: QCTO</p>
        <p className="mt-1">Final Step: Submit to QCTO for Qualification Registration</p>
      </div>
    </div>
  );

      default:
        return (
          <div className="text-center py-10 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Phase content for <strong>{phase.name}</strong> will be configured here.</p>
          </div>
        );
    }
  };

  // ── Modal shell ───────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{phase.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{qualificationTitle} | {qualificationCode}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Phase Info Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Start: {phase.startDate || 'Not set'}</div>
          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> End: {phase.endDate || 'Not set'}</div>
          <div className="flex items-center gap-1"><User className="w-4 h-4" /> Responsible: {phase.responsibleRole}</div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('details')} className={`py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Phase Details & Report</button>
            <button onClick={() => setActiveTab('history')} className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}><History className="w-4 h-4" /> History</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {renderPhaseDetails()}

              {/* Report Summary */}
              <div className="border-t pt-6 mt-6">
                <h3 className="font-medium mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Report Summary</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phase Objectives Summary <span className="text-red-500">*</span></label>
                    <textarea value={localPhaseData.objectives} onChange={e => setLocalPhaseData({ ...localPhaseData, objectives: e.target.value })} disabled={isInputDisabled} className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="Summarize the objectives for this phase..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Findings / Outcomes Summary <span className="text-red-500">*</span></label>
                    <textarea value={localPhaseData.findings} onChange={e => setLocalPhaseData({ ...localPhaseData, findings: e.target.value })} disabled={isInputDisabled} className="w-full border rounded-lg p-3 text-sm" rows={4} placeholder="Summarize the findings and outcomes of this phase..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deliverables List</label>
                    <div className="space-y-2">
                      {localPhaseData.deliverables.map((d, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                          <CheckSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-sm flex-1">{d}</span>
                          {!isInputDisabled && <button onClick={() => handleRemoveDeliverable(idx)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>}
                        </div>
                      ))}
                      {!isInputDisabled && (
                        <div className="flex gap-2">
                          <input type="text" value={newDeliverable} onChange={e => setNewDeliverable(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddDeliverable()} placeholder="Add deliverable..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                          <button onClick={handleAddDeliverable} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"><Plus className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input type="file" ref={attachmentsRef} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'reportAttachments'); }} className="hidden" multiple />
                      <button onClick={() => attachmentsRef.current?.click()} disabled={isInputDisabled} className="flex flex-col items-center mx-auto"><Upload className="w-8 h-8 text-gray-400 mb-2" /><p className="text-sm text-gray-500">Click to upload supporting documents</p></button>
                    </div>
                    {renderFileList('reportAttachments')}
                  </div>
                  {!phase.reportSubmitted && !phase.approved && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes for Reviewer</label>
                      <textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="Add any additional notes for the internal reviewer..." />
                    </div>
                  )}
                </div>
              </div>

              {/* Status messages */}
              {phase.reportSubmitted && !phase.approved && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"><div className="flex items-start gap-3"><Clock className="w-5 h-5 text-yellow-600 shrink-0" /><div><p className="text-sm font-medium text-yellow-800">Pending Internal Review</p><p className="text-xs text-yellow-700">Your phase report has been submitted and is awaiting approval.</p></div></div></div>
              )}
              {phase.approved && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200"><div className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-600 shrink-0" /><div><p className="text-sm font-medium text-green-800">Phase Approved</p><p className="text-xs text-green-700">{!isLastPhase && "You can now proceed to the next phase."}</p></div></div></div>
              )}
              {isLocked && !phase.reportSubmitted && !phase.approved && (
                <div className="bg-gray-100 p-4 rounded-lg border"><div className="flex items-start gap-3"><AlertCircle className="w-5 h-5 text-gray-500 shrink-0" /><div><p className="text-sm font-medium text-gray-700">Phase Locked</p><p className="text-xs text-gray-600">This phase is locked until the previous phase is approved.</p></div></div></div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="flex gap-4 pb-6 relative">
                  {index < history.length - 1 && <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>}
                  <div className="relative z-10"><div className="w-4 h-4 rounded-full bg-blue-600"></div></div>
                  <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div><p className="font-medium">{item.action}</p><p className="text-sm text-gray-600">{item.details}</p></div>
                      <div className="text-right"><p className="text-xs text-gray-500">{item.user}</p><p className="text-xs text-gray-400">{item.date}</p></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">Close</button>
          {!phase.reportSubmitted && !phase.approved && !isLocked && (
            <>
              <button onClick={handleSaveDraft} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-white">
                <Save className="w-4 h-4" /> Save Draft
              </button>
              <button onClick={handleSubmitReport} disabled={isSubmitting} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                <Send className="w-4 h-4" /> {isSubmitting ? 'Submitting...' : 'Submit Phase Report'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}