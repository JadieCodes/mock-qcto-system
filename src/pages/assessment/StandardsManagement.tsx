import React, { useState } from 'react';
import { 
  BookOpen,
  CalendarDays,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Download,
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Send,
  Plus,
  X,
  MessageSquare,
  Users,
  Calendar,
  ClipboardList,
  Lock,
  Unlock,
  History,
  UserCheck,
  Building2,
  Award,
  FileCheck,
  PenTool,
  ThumbsUp,
  XSquare,
  UserCog,
  Shield,
  FileEdit,
  FileSignature,
  UserPlus,
  UserMinus,
  Briefcase,
  GraduationCap,
  Settings,
  CheckSquare,
  AlertOctagon,
  ClipboardCheck  // Add this missing import
} from 'lucide-react';

// Types
type UserRole = 'ASD' | 'Deputy Director' | 'Director' | 'Team' | 'AIC' | 'Qualifications Development' | 'SDP' | 'Assistant Director';

type ScheduleStatus = 'Draft' | 'Pending Approval' | 'Published' | 'Archived';

type ValidationSchedule = {
  id: string;
  year: number;
  submissionDeadline: string;
  validationPeriod: string;
  publicationDate: string;
  notes: string;
  status: ScheduleStatus;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedDate?: string;
  locked: boolean;
  isCurrent: boolean;
};

// FISA Standard Types
type FISAStatus = 'draft' | 'under_review' | 'published' | 'archived' | 'changes_requested';

type FISAReviewer = {
  role: UserRole;
  user: string;
  reviewedAt?: string;
  decision?: 'approved' | 'rejected' | 'changes';
};

type FISADocument = {
  name: string;
  url: string;
  uploadedAt: string;
};

type FISADocuments = {
  curriculum?: FISADocument;
  assessmentSpec?: FISADocument;
  saqaDocument?: FISADocument;
  addendum?: FISADocument;
};

type FISAHistoryEntry = {
  action: string;
  date: string;
  performedBy: string;
  role: UserRole;
  comments?: string;
};

// FISA Validation Types
type FISAValidationStatus = 'submitted' | 'completeness_check' | 'in_validation' | 'changes_requested' | 'approved' | 'rejected';

type ValidationFlowEntry = {
  user?: string;
  date?: string;
  decision?: 'approved' | 'rejected' | 'changes';
};

type FISAValidationFlow = {
  sdp?: ValidationFlowEntry;
  assistantDirector?: ValidationFlowEntry;
  asd?: ValidationFlowEntry;
  deputyDirector?: ValidationFlowEntry;
};

type FISAValidation = {
  id: string;
  validationId: string;
  fisaId: string;
  qualification: string;
  saqaId: string;
  submittedBy: string;
  submittedAt: string;
  status: FISAValidationStatus;
  documents: {
    fisaDocument?: FISADocument;
    supportingDocs?: FISADocument;
  };
  assignedValidator?: string;
  assignedDate?: string;
  validationDate?: string;
  validatedBy?: string;
  feedback?: string;
  recommendedChanges?: string[];
  version: number;
  locked: boolean;
  history: FISAHistoryEntry[];
  validationFlow: FISAValidationFlow;
};

// EISA Validation Types
type EISAValidationStatus = 'submitted' | 'completeness_check' | 'in_validation' | 'changes_requested' | 'approved' | 'rejected';

type EISADocuments = {
  moderatorReport?: FISADocument;
  examinerReport?: FISADocument;
  cv?: FISADocument;
  confidentialityAgreement?: FISADocument;
  eisaInstrumentWritten?: FISADocument;
  eisaMemo?: FISADocument;
  eisaInstrumentPractical?: FISADocument;
  eisaRubric?: FISADocument;
};

type EISAValidationFlow = {
  asd?: ValidationFlowEntry;
  deputyDirector?: ValidationFlowEntry;
};

type EISALiaison = {
  contactDate: string;
  contactPerson: string;
  validationDate: string;
  logistics: string;
};

type EISAValidation = {
  id: string;
  validationId: string;
  fisaId: string;
  qualification: string;
  saqaId: string;
  assessmentDate: string;
  qualityPartner: string;
  qualityPartnerId: string;
  submittedAt: string;
  status: EISAValidationStatus;
  documents: EISADocuments;
  assignedValidator?: string;
  assignedDate?: string;
  validationDate?: string;
  validatedBy?: string;
  validationReport?: FISADocument;
  feedback?: string;
  recommendedChanges?: string[];
  version: number;
  locked: boolean;
  liaison?: EISALiaison;
  history: FISAHistoryEntry[];
  validationFlow: EISAValidationFlow;
};

type FISAEvaluation = {
  role: UserRole;
  user: string;
  decision?: 'approved' | 'rejected' | 'changes';
  comments?: string;
  evaluatedAt?: string;
  recommendedChanges?: string[];
};

type FISAStandard = {
  id: string;
  fisaNumber: string;
  qualification: string;
  saqaId: string;
  nqfLevel: number;
  credits: number;
  version: string;
  status: FISAStatus;
  createdBy: string;
  createdAt: string;
  publishedDate?: string;
  expiryDate?: string;
  documents: FISADocuments;
  moderatedDocuments?: FISADocuments;
  evaluationReport?: FISADocument;
  evaluations?: FISAEvaluation[];
  feedback?: string;
  recommendedChanges?: string[];
  locked: boolean;
  history: FISAHistoryEntry[];
  reviewers?: FISAReviewer[];
};

// Role-based workflow mapping
const fisaWorkflow: UserRole[] = ['ASD', 'Deputy Director', 'Director', 'Team', 'AIC', 'Qualifications Development'];
const fisaValidationWorkflow: UserRole[] = ['SDP', 'Assistant Director', 'ASD', 'Deputy Director'];
const eisaValidationWorkflow: UserRole[] = ['ASD', 'Deputy Director'];

// Define props interfaces for modals
interface EvaluationModalProps {
  fisa: FISAStandard;
  userRole: UserRole;
  onClose: () => void;
  onSubmit: (decision: 'approve' | 'reject' | 'changes' | null, comments: string, changes: string[]) => void;
}

interface ModerationModalProps {
  fisa: FISAStandard;
  onClose: () => void;
  onSubmit: (moderatedDocs: any) => void;
}

// Evaluation Modal Component
const EvaluationModal: React.FC<EvaluationModalProps> = ({ fisa, userRole, onClose, onSubmit }) => {
  const [decision, setDecision] = useState<'approve' | 'reject' | 'changes' | null>(null);
  const [comments, setComments] = useState('');
  const [recommendedChanges, setRecommendedChanges] = useState<string[]>([]);
  const [changeInput, setChangeInput] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">
            Evaluate FISA Standard - {fisa.fisaNumber}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-700 flex items-start">
              <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              Your role: {userRole}. Please review all documents and provide your evaluation.
            </p>
          </div>

          {/* Document List */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">Documents to Review:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(fisa.documents).map(([key, value]) => value && (
                <button
                  key={key}
                  onClick={() => window.open(value.url, '_blank')}
                  className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm">
                    {key === 'curriculum' ? 'Curriculum Document' :
                     key === 'assessmentSpec' ? 'Assessment Specification' :
                     key === 'saqaDocument' ? 'SAQA Document' :
                     key === 'addendum' ? 'Addendum' : key}
                  </span>
                </button>
              ))}
              {fisa.moderatedDocuments && Object.entries(fisa.moderatedDocuments).map(([key, value]) => value && (
                <button
                  key={`mod-${key}`}
                  onClick={() => window.open(value.url, '_blank')}
                  className="flex items-center p-2 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  <FileCheck className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm">
                    {key === 'curriculum' ? 'Moderated Curriculum' :
                     key === 'assessmentSpec' ? 'Moderated Assessment Spec' :
                     key === 'evaluationReport' ? 'Evaluation Report' : key}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Decision <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setDecision('approve')}
                  className={`py-2 rounded-lg border ${
                    decision === 'approve'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => setDecision('changes')}
                  className={`py-2 rounded-lg border ${
                    decision === 'changes'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  Request Changes
                </button>
                <button
                  onClick={() => setDecision('reject')}
                  className={`py-2 rounded-lg border ${
                    decision === 'reject'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-red-300 text-red-700 hover:bg-red-50'
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation Comments
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your evaluation comments..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {decision === 'changes' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommended Changes
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={changeInput}
                    onChange={(e) => setChangeInput(e.target.value)}
                    placeholder="Add a recommended change..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (changeInput) {
                        setRecommendedChanges([...recommendedChanges, changeInput]);
                        setChangeInput('');
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {recommendedChanges.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {recommendedChanges.map((change, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{change}</span>
                        <button
                          type="button"
                          onClick={() => setRecommendedChanges(recommendedChanges.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onSubmit(decision, comments, recommendedChanges)}
                disabled={!decision}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Submit Evaluation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Moderation Modal Component
const ModerationModal: React.FC<ModerationModalProps> = ({ fisa, onClose, onSubmit }) => {
  const [moderatedDocs, setModeratedDocs] = useState({
    curriculum: null as File | null,
    assessmentSpec: null as File | null,
    evaluationReport: null as File | null
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">
            Moderate Documents - {fisa.fisaNumber}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-yellow-700 flex items-start">
              <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              Upload moderated versions of the documents and an evaluation report.
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit(moderatedDocs);
          }} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moderated Curriculum Document
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setModeratedDocs({...moderatedDocs, curriculum: e.target.files?.[0] || null})}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moderated Assessment Specification
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setModeratedDocs({...moderatedDocs, assessmentSpec: e.target.files?.[0] || null})}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation Report
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setModeratedDocs({...moderatedDocs, evaluationReport: e.target.files?.[0] || null})}
                className="w-full p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Moderated Documents
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function StandardsManagement() {
  const [activeTab, setActiveTab] = useState<'schedules' | 'fisa' | 'fisa-validation' | 'eisa-validation'>('schedules');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('ASD');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selection states
  const [selectedSchedule, setSelectedSchedule] = useState<ValidationSchedule | null>(null);
  const [selectedFISA, setSelectedFISA] = useState<FISAStandard | null>(null);
  const [selectedFISAValidation, setSelectedFISAValidation] = useState<FISAValidation | null>(null);
  const [selectedEISAValidation, setSelectedEISAValidation] = useState<EISAValidation | null>(null);
  
  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFISAModalOpen, setIsFISAModalOpen] = useState(false);
  const [isFISAValidationModalOpen, setIsFISAValidationModalOpen] = useState(false);
  const [isEISAValidationModalOpen, setIsEISAValidationModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCompletenessModalOpen, setIsCompletenessModalOpen] = useState(false);
  const [isLiaiseModalOpen, setIsLiaiseModalOpen] = useState(false);
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{type: string; document: FISADocument} | null>(null);
  
  // Form states
  const [scheduleFormData, setScheduleFormData] = useState({
    year: new Date().getFullYear() + 1,
    submissionDeadline: '',
    validationPeriodStart: '',
    validationPeriodEnd: '',
    publicationDate: '',
    notes: ''
  });

  const [fisaFormData, setFisaFormData] = useState({
    qualification: '',
    saqaId: '',
    nqfLevel: '',
    credits: '',
    curriculum: null as File | null,
    assessmentSpec: null as File | null,
    saqaDocument: null as File | null,
    addendum: null as File | null,
    notes: ''
  });

  const [validationNotes, setValidationNotes] = useState('');
  const [recommendedChanges, setRecommendedChanges] = useState<string[]>([]);
  const [changeInput, setChangeInput] = useState('');
  const [validationDecision, setValidationDecision] = useState<'approve' | 'reject' | 'changes' | null>(null);
  const [completenessDecision, setCompletenessDecision] = useState<'complete' | 'incomplete' | null>(null);
  const [validatorAssignment, setValidatorAssignment] = useState('');
  const [liaisonFormData, setLiaisonFormData] = useState({
    contactDate: '',
    contactPerson: '',
    validationDate: '',
    logistics: ''
  });

  const itemsPerPage = 10;

  // Helper function to get current review stage
  const getCurrentReviewStage = (fisa: FISAStandard) => {
    if (!fisa.evaluations?.some(e => e.role === 'Deputy Director' && e.decision)) {
      return 'Deputy Director QC';
    }
    if (!fisa.evaluations?.some(e => e.role === 'Director' && e.decision)) {
      return 'Director Review';
    }
    if (!fisa.evaluations?.some(e => e.role === 'Team' && e.decision)) {
      return 'Team Review';
    }
    if (!fisa.evaluations?.some(e => e.role === 'AIC' && e.decision)) {
      return 'AIC Validation';
    }
    if (!fisa.evaluations?.some(e => e.role === 'Qualifications Development' && e.decision)) {
      return 'Final Check';
    }
    return 'under_review';
  };

  // Mock data - Validation Schedules
  const [validationSchedules, setValidationSchedules] = useState<ValidationSchedule[]>([
    {
      id: '1',
      year: 2025,
      submissionDeadline: '2024-09-30',
      validationPeriod: 'October - November 2024',
      publicationDate: '2024-11-30',
      notes: 'All EISA submissions for 2025 academic year must be submitted by this deadline.',
      status: 'Published',
      createdBy: 'John ASD',
      createdAt: '2023-11-15T10:30:00',
      approvedBy: 'Director Smith',
      approvedDate: '2023-11-20T14:00:00',
      locked: true,
      isCurrent: true
    },
    {
      id: '2',
      year: 2024,
      submissionDeadline: '2023-09-30',
      validationPeriod: 'October - November 2023',
      publicationDate: '2023-11-30',
      notes: 'Previous year schedule',
      status: 'Archived',
      createdBy: 'John ASD',
      createdAt: '2022-11-10T09:15:00',
      approvedBy: 'Director Smith',
      approvedDate: '2022-11-18T11:30:00',
      locked: true,
      isCurrent: false
    },
    {
      id: '3',
      year: 2026,
      submissionDeadline: '2025-09-30',
      validationPeriod: 'October - November 2025',
      publicationDate: '2025-11-30',
      notes: 'Draft schedule for 2026 academic year - under review',
      status: 'Draft',
      createdBy: 'John ASD',
      createdAt: '2024-03-01T13:20:00',
      locked: false,
      isCurrent: false
    }
  ]);

  // Mock data - FISA Standards
  const [fisaStandards, setFisaStandards] = useState<FISAStandard[]>([
    {
      id: '1',
      fisaNumber: 'FISA-ELEC-001',
      qualification: 'Electrician Level 4',
      saqaId: 'SAQA-12345',
      nqfLevel: 4,
      credits: 120,
      version: '2.1',
      status: 'published',
      createdBy: 'John ASD',
      createdAt: '2024-01-10T09:00:00',
      publishedDate: '2024-01-15',
      expiryDate: '2027-01-14',
      documents: {
        curriculum: { name: 'Curriculum-ELEC-v2.1.pdf', url: '#', uploadedAt: '2024-01-10' },
        assessmentSpec: { name: 'Assessment-Spec-ELEC-v2.1.pdf', url: '#', uploadedAt: '2024-01-10' },
        saqaDocument: { name: 'SAQA-12345.pdf', url: '#', uploadedAt: '2024-01-10' }
      },
      locked: true,
      history: [
        { action: 'Created', date: '2024-01-10T09:00:00', performedBy: 'John ASD', role: 'ASD' },
        { action: 'Published', date: '2024-01-15T14:30:00', performedBy: 'Director Smith', role: 'Director' }
      ],
      reviewers: [
        { role: 'ASD', user: 'John ASD', reviewedAt: '2024-01-12', decision: 'approved' },
        { role: 'Deputy Director', user: 'Sarah Deputy', reviewedAt: '2024-01-13', decision: 'approved' },
        { role: 'Director', user: 'Director Smith', reviewedAt: '2024-01-15', decision: 'approved' },
        { role: 'Team', user: 'Jane Team', reviewedAt: '2024-01-11', decision: 'approved' },
        { role: 'AIC', user: 'Mike AIC', reviewedAt: '2024-01-14', decision: 'approved' },
        { role: 'Qualifications Development', user: 'Peter Dev', reviewedAt: '2024-01-09', decision: 'approved' }
      ]
    },
    {
      id: '2',
      fisaNumber: 'FISA-PLUMB-001',
      qualification: 'Plumber Level 3',
      saqaId: 'SAQA-67890',
      nqfLevel: 3,
      credits: 90,
      version: '1.0',
      status: 'under_review',
      createdBy: 'Jane Team',
      createdAt: '2024-03-01T11:20:00',
      documents: {
        curriculum: { name: 'Curriculum-PLUMB-v1.0.pdf', url: '#', uploadedAt: '2024-03-01' },
        assessmentSpec: { name: 'Assessment-Spec-PLUMB-v1.0.pdf', url: '#', uploadedAt: '2024-03-01' },
        saqaDocument: { name: 'SAQA-67890.pdf', url: '#', uploadedAt: '2024-03-01' }
      },
      locked: false,
      history: [
        { action: 'Created', date: '2024-03-01T11:20:00', performedBy: 'Jane Team', role: 'Team' },
        { action: 'Submitted for Review', date: '2024-03-02T09:15:00', performedBy: 'Jane Team', role: 'Team' }
      ],
      reviewers: [
        { role: 'ASD', user: '' },
        { role: 'Deputy Director', user: '' },
        { role: 'Director', user: '' },
        { role: 'Team', user: 'Jane Team', reviewedAt: '2024-03-01', decision: 'approved' },
        { role: 'AIC', user: '' },
        { role: 'Qualifications Development', user: '' }
      ]
    },
    {
      id: '3',
      fisaNumber: 'FISA-WELD-001',
      qualification: 'Welder Level 2',
      saqaId: 'SAQA-45678',
      nqfLevel: 2,
      credits: 60,
      version: '0.9',
      status: 'changes_requested',
      createdBy: 'Peter Dev',
      createdAt: '2024-02-15T10:00:00',
      documents: {
        curriculum: { name: 'Curriculum-WELD-v0.9.pdf', url: '#', uploadedAt: '2024-02-15' },
        assessmentSpec: { name: 'Assessment-Spec-WELD-v0.9.pdf', url: '#', uploadedAt: '2024-02-15' }
      },
      feedback: 'Please add practical assessment criteria for welding techniques',
      recommendedChanges: ['Add welding technique assessment rubric', 'Include safety requirements'],
      locked: false,
      history: [
        { action: 'Created', date: '2024-02-15T10:00:00', performedBy: 'Peter Dev', role: 'Qualifications Development' },
        { action: 'ASD Review', date: '2024-02-18T14:30:00', performedBy: 'John ASD', role: 'ASD' },
        { action: 'Changes Requested', date: '2024-02-20T14:30:00', performedBy: 'John ASD', role: 'ASD', comments: 'Missing practical criteria' }
      ],
      reviewers: [
        { role: 'ASD', user: 'John ASD', reviewedAt: '2024-02-18', decision: 'changes' },
        { role: 'Qualifications Development', user: 'Peter Dev', reviewedAt: '2024-02-15', decision: 'approved' }
      ]
    }
  ]);

  // Mock data - FISA Validation
  const [fisaValidations, setFisaValidations] = useState<FISAValidation[]>([
    {
      id: '1',
      validationId: 'FISA-VAL-2024-001',
      fisaId: 'FISA-ELEC-001',
      qualification: 'Electrician Level 4',
      saqaId: 'SAQA-12345',
      submittedBy: 'ABC Training',
      submittedAt: '2024-03-15T10:30:00',
      status: 'approved',
      documents: {
        fisaDocument: { name: 'FISA-ELEC-001.pdf', url: '#', uploadedAt: '2024-03-15' }
      },
      assignedValidator: 'John ASD',
      assignedDate: '2024-03-16',
      validationDate: '2024-03-20',
      validatedBy: 'John ASD',
      version: 1,
      locked: true,
      history: [
        { action: 'Submitted', date: '2024-03-15T10:30:00', performedBy: 'ABC Training', role: 'SDP' },
        { action: 'Assigned to SDP', date: '2024-03-16T09:15:00', performedBy: 'System', role: 'SDP' },
        { action: 'SDP Review Complete', date: '2024-03-17T11:20:00', performedBy: 'Mike SDP', role: 'SDP' },
        { action: 'Assistant Director Review', date: '2024-03-18T14:30:00', performedBy: 'Sarah AD', role: 'Assistant Director' },
        { action: 'ASD Review', date: '2024-03-19T10:45:00', performedBy: 'John ASD', role: 'ASD' },
        { action: 'Deputy Director Approval', date: '2024-03-20T09:30:00', performedBy: 'Deputy Davis', role: 'Deputy Director' }
      ],
      validationFlow: {
        sdp: { user: 'Mike SDP', date: '2024-03-17', decision: 'approved' },
        assistantDirector: { user: 'Sarah AD', date: '2024-03-18', decision: 'approved' },
        asd: { user: 'John ASD', date: '2024-03-19', decision: 'approved' },
        deputyDirector: { user: 'Deputy Davis', date: '2024-03-20', decision: 'approved' }
      }
    },
    {
      id: '2',
      validationId: 'FISA-VAL-2024-002',
      fisaId: 'FISA-PLUMB-001',
      qualification: 'Plumber Level 3',
      saqaId: 'SAQA-67890',
      submittedBy: 'XYZ College',
      submittedAt: '2024-03-14T11:20:00',
      status: 'in_validation',
      documents: {
        fisaDocument: { name: 'FISA-PLUMB-001.pdf', url: '#', uploadedAt: '2024-03-14' }
      },
      assignedValidator: 'Mike SDP',
      assignedDate: '2024-03-15',
      version: 1,
      locked: false,
      history: [
        { action: 'Submitted', date: '2024-03-14T11:20:00', performedBy: 'XYZ College', role: 'SDP' },
        { action: 'Assigned to SDP', date: '2024-03-15T09:15:00', performedBy: 'System', role: 'SDP' }
      ],
      validationFlow: {
        sdp: { user: 'Mike SDP', date: '2024-03-15' }
      }
    },
    {
      id: '3',
      validationId: 'FISA-VAL-2024-003',
      fisaId: 'FISA-WELD-001',
      qualification: 'Welder Level 2',
      saqaId: 'SAQA-45678',
      submittedBy: 'Skills Academy',
      submittedAt: '2024-03-10T09:45:00',
      status: 'changes_requested',
      documents: {
        fisaDocument: { name: 'FISA-WELD-001.pdf', url: '#', uploadedAt: '2024-03-10' }
      },
      assignedValidator: 'Sarah AD',
      assignedDate: '2024-03-11',
      feedback: 'Safety protocols need to be more detailed',
      recommendedChanges: ['Add PPE requirements section', 'Include emergency procedures'],
      version: 1,
      locked: false,
      history: [
        { action: 'Submitted', date: '2024-03-10T09:45:00', performedBy: 'Skills Academy', role: 'SDP' },
        { action: 'SDP Review', date: '2024-03-11T10:30:00', performedBy: 'Mike SDP', role: 'SDP' },
        { action: 'Assistant Director Review', date: '2024-03-12T14:20:00', performedBy: 'Sarah AD', role: 'Assistant Director' },
        { action: 'Changes Requested', date: '2024-03-13T11:15:00', performedBy: 'Sarah AD', role: 'Assistant Director', comments: 'Safety protocols need updates' }
      ],
      validationFlow: {
        sdp: { user: 'Mike SDP', date: '2024-03-11', decision: 'approved' },
        assistantDirector: { user: 'Sarah AD', date: '2024-03-13', decision: 'changes' }
      }
    }
  ]);

  // Mock data - EISA Validation
  const [eisaValidations, setEisaValidations] = useState<EISAValidation[]>([
    {
      id: '1',
      validationId: 'EISA-VAL-2024-001',
      fisaId: 'FISA-ELEC-001',
      qualification: 'Electrician Level 4',
      saqaId: 'SAQA-12345',
      assessmentDate: '2024-04-15',
      qualityPartner: 'ABC Training Institute',
      qualityPartnerId: 'QP-001',
      submittedAt: '2024-03-15T10:30:00',
      status: 'approved',
      documents: {
        moderatorReport: { name: 'Moderator-Report.pdf', url: '#', uploadedAt: '2024-03-15' },
        examinerReport: { name: 'Examiner-Report.pdf', url: '#', uploadedAt: '2024-03-15' },
        cv: { name: 'CV.pdf', url: '#', uploadedAt: '2024-03-15' },
        confidentialityAgreement: { name: 'Confidentiality.pdf', url: '#', uploadedAt: '2024-03-15' },
        eisaInstrumentWritten: { name: 'EISA-Written.pdf', url: '#', uploadedAt: '2024-03-15' },
        eisaMemo: { name: 'EISA-Memo.pdf', url: '#', uploadedAt: '2024-03-15' }
      },
      assignedValidator: 'John ASD',
      assignedDate: '2024-03-16',
      validationDate: '2024-03-20',
      validatedBy: 'John ASD',
      validationReport: {
        name: 'Validation-Report-EISA-001.pdf',
        url: '#',
        uploadedAt: '2024-03-20T14:30:00'
      },
      version: 2,
      locked: true,
      history: [
        { action: 'Submitted', date: '2024-03-15T10:30:00', performedBy: 'ABC Training', role: 'ASD' },
        { action: 'Completeness Check', date: '2024-03-16T09:15:00', performedBy: 'John ASD', role: 'ASD' },
        { action: 'In Validation', date: '2024-03-17T14:20:00', performedBy: 'John ASD', role: 'ASD' },
        { action: 'ASD Review Complete', date: '2024-03-18T11:30:00', performedBy: 'John ASD', role: 'ASD' },
        { action: 'Deputy Director Approval', date: '2024-03-20T09:45:00', performedBy: 'Deputy Davis', role: 'Deputy Director' }
      ],
      validationFlow: {
        asd: { user: 'John ASD', date: '2024-03-18', decision: 'approved' },
        deputyDirector: { user: 'Deputy Davis', date: '2024-03-20', decision: 'approved' }
      }
    },
    {
      id: '2',
      validationId: 'EISA-VAL-2024-002',
      fisaId: 'FISA-PLUMB-001',
      qualification: 'Plumber Level 3',
      saqaId: 'SAQA-67890',
      assessmentDate: '2024-04-16',
      qualityPartner: 'XYZ College',
      qualityPartnerId: 'QP-002',
      submittedAt: '2024-03-14T11:20:00',
      status: 'in_validation',
      documents: {
        moderatorReport: { name: 'Moderator-Report.pdf', url: '#', uploadedAt: '2024-03-14' },
        examinerReport: { name: 'Examiner-Report.pdf', url: '#', uploadedAt: '2024-03-14' },
        cv: { name: 'CV.pdf', url: '#', uploadedAt: '2024-03-14' },
        confidentialityAgreement: { name: 'Confidentiality.pdf', url: '#', uploadedAt: '2024-03-14' },
        eisaInstrumentPractical: { name: 'EISA-Practical.pdf', url: '#', uploadedAt: '2024-03-14' },
        eisaRubric: { name: 'EISA-Rubric.pdf', url: '#', uploadedAt: '2024-03-14' }
      },
      liaison: {
        contactDate: '2024-03-16',
        contactPerson: 'John ASD',
        validationDate: '2024-03-22',
        logistics: 'Virtual meeting via Teams'
      },
      assignedValidator: 'Sarah Validator',
      assignedDate: '2024-03-15',
      version: 1,
      locked: false,
      history: [
        { action: 'Submitted', date: '2024-03-14T11:20:00', performedBy: 'XYZ College', role: 'ASD' },
        { action: 'Completeness Check Passed', date: '2024-03-15T10:30:00', performedBy: 'John ASD', role: 'ASD' },
        { action: 'Liaison Arranged', date: '2024-03-16T09:15:00', performedBy: 'John ASD', role: 'ASD' },
        { action: 'In Validation', date: '2024-03-16T14:20:00', performedBy: 'John ASD', role: 'ASD' }
      ],
      validationFlow: {
        asd: { user: 'John ASD', date: '2024-03-16' }
      }
    },
    {
      id: '3',
      validationId: 'EISA-VAL-2024-003',
      fisaId: 'FISA-WELD-001',
      qualification: 'Welder Level 2',
      saqaId: 'SAQA-45678',
      assessmentDate: '2024-04-20',
      qualityPartner: 'Skills Academy',
      qualityPartnerId: 'QP-003',
      submittedAt: '2024-03-13T09:45:00',
      status: 'changes_requested',
      documents: {
        moderatorReport: { name: 'Moderator-Report.pdf', url: '#', uploadedAt: '2024-03-13' },
        examinerReport: { name: 'Examiner-Report.pdf', url: '#', uploadedAt: '2024-03-13' },
        cv: { name: 'CV.pdf', url: '#', uploadedAt: '2024-03-13' },
        confidentialityAgreement: { name: 'Confidentiality.pdf', url: '#', uploadedAt: '2024-03-13' },
        eisaInstrumentPractical: { name: 'EISA-Practical.pdf', url: '#', uploadedAt: '2024-03-13' },
        eisaRubric: { name: 'EISA-Rubric.pdf', url: '#', uploadedAt: '2024-03-13' }
      },
      assignedValidator: 'Mike Reviewer',
      assignedDate: '2024-03-14',
      feedback: 'Task 2 needs clearer instructions and mark allocation',
      recommendedChanges: ['Update welding technique criteria', 'Add safety checklist'],
      version: 1,
      locked: false,
      history: [
        { action: 'Submitted', date: '2024-03-13T09:45:00', performedBy: 'Skills Academy', role: 'ASD' },
        { action: 'Completeness Check Passed', date: '2024-03-14T11:20:00', performedBy: 'John ASD', role: 'ASD' },
        { action: 'In Validation', date: '2024-03-15T10:30:00', performedBy: 'John ASD', role: 'ASD' },
        { action: 'Changes Requested', date: '2024-03-16T15:45:00', performedBy: 'Mike Reviewer', role: 'ASD', comments: 'Task 2 needs updating' }
      ],
      validationFlow: {
        asd: { user: 'Mike Reviewer', date: '2024-03-16', decision: 'changes' }
      }
    }
  ]);

  // Filter functions
  const filteredSchedules = validationSchedules.filter(s => 
    s.year.toString().includes(searchTerm) ||
    s.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFISA = fisaStandards.filter(f => 
    f.fisaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.qualification.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.status.includes(searchTerm.toLowerCase())
  );

  const filteredFISAValidations = fisaValidations.filter(v => 
    v.validationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.qualification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEISAValidations = eisaValidations.filter(v => 
    v.validationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.qualification.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.qualityPartner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedFISA = filteredFISA.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedFISAValidations = filteredFISAValidations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedEISAValidations = filteredEISAValidations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const scheduleStats = {
    total: validationSchedules.length,
    draft: validationSchedules.filter(s => s.status === 'Draft').length,
    pending: validationSchedules.filter(s => s.status === 'Pending Approval').length,
    published: validationSchedules.filter(s => s.status === 'Published').length,
    archived: validationSchedules.filter(s => s.status === 'Archived').length
  };

  const fisaStats = {
    total: fisaStandards.length,
    draft: fisaStandards.filter(f => f.status === 'draft').length,
    underReview: fisaStandards.filter(f => f.status === 'under_review').length,
    published: fisaStandards.filter(f => f.status === 'published').length,
    changesRequested: fisaStandards.filter(f => f.status === 'changes_requested').length
  };

  const fisaValidationStats = {
    total: fisaValidations.length,
    submitted: fisaValidations.filter(v => v.status === 'submitted').length,
    completeness: fisaValidations.filter(v => v.status === 'completeness_check').length,
    inValidation: fisaValidations.filter(v => v.status === 'in_validation').length,
    changesRequested: fisaValidations.filter(v => v.status === 'changes_requested').length,
    approved: fisaValidations.filter(v => v.status === 'approved').length
  };

  const eisaValidationStats = {
    total: eisaValidations.length,
    submitted: eisaValidations.filter(v => v.status === 'submitted').length,
    completeness: eisaValidations.filter(v => v.status === 'completeness_check').length,
    inValidation: eisaValidations.filter(v => v.status === 'in_validation').length,
    changesRequested: eisaValidations.filter(v => v.status === 'changes_requested').length,
    approved: eisaValidations.filter(v => v.status === 'approved').length
  };

  // Handle create new schedule
  const handleCreateSchedule = () => {
    const validationPeriod = `${scheduleFormData.validationPeriodStart} to ${scheduleFormData.validationPeriodEnd}`;
    
    const newSchedule: ValidationSchedule = {
      id: Date.now().toString(),
      year: scheduleFormData.year,
      submissionDeadline: scheduleFormData.submissionDeadline,
      validationPeriod: validationPeriod,
      publicationDate: scheduleFormData.publicationDate,
      notes: scheduleFormData.notes || `All EISA submissions for ${scheduleFormData.year} academic year must be submitted by this deadline.`,
      status: 'Draft',
      createdBy: 'John ASD',
      createdAt: new Date().toISOString(),
      locked: false,
      isCurrent: false
    };

    setValidationSchedules([newSchedule, ...validationSchedules]);
    setIsScheduleModalOpen(false);
    setScheduleFormData({
      year: new Date().getFullYear() + 1,
      submissionDeadline: '',
      validationPeriodStart: '',
      validationPeriodEnd: '',
      publicationDate: '',
      notes: ''
    });
  };

  // Handle publish schedule
  const handlePublishSchedule = (scheduleId: string) => {
    const updatedSchedules = validationSchedules.map(s => {
      if (s.id === scheduleId) {
        return {
          ...s,
          status: 'Published' as const,
          approvedBy: 'Director Smith',
          approvedDate: new Date().toISOString(),
          locked: true,
          isCurrent: true
        };
      } else if (s.isCurrent) {
        return {
          ...s,
          isCurrent: false
        };
      }
      return s;
    });

    setValidationSchedules(updatedSchedules);
  };

  // Handle archive schedule
  const handleArchiveSchedule = (scheduleId: string) => {
    const updatedSchedules = validationSchedules.map(s => {
      if (s.id === scheduleId) {
        return {
          ...s,
          status: 'Archived' as const,
          locked: true,
          isCurrent: false
        };
      }
      return s;
    });

    setValidationSchedules(updatedSchedules);
  };

  // Handle create new FISA standard
  const handleCreateFISA = () => {
    const newFISA: FISAStandard = {
      id: Date.now().toString(),
      fisaNumber: `FISA-${fisaFormData.qualification.substring(0, 4).toUpperCase()}-${String(fisaStandards.length + 1).padStart(3, '0')}`,
      qualification: fisaFormData.qualification,
      saqaId: fisaFormData.saqaId,
      nqfLevel: parseInt(fisaFormData.nqfLevel),
      credits: parseInt(fisaFormData.credits),
      version: '1.0',
      status: 'draft',
      createdBy: 'John ASD',
      createdAt: new Date().toISOString(),
      documents: {
        curriculum: fisaFormData.curriculum ? { name: fisaFormData.curriculum.name, url: URL.createObjectURL(fisaFormData.curriculum), uploadedAt: new Date().toISOString() } : undefined,
        assessmentSpec: fisaFormData.assessmentSpec ? { name: fisaFormData.assessmentSpec.name, url: URL.createObjectURL(fisaFormData.assessmentSpec), uploadedAt: new Date().toISOString() } : undefined,
        saqaDocument: fisaFormData.saqaDocument ? { name: fisaFormData.saqaDocument.name, url: URL.createObjectURL(fisaFormData.saqaDocument), uploadedAt: new Date().toISOString() } : undefined,
        addendum: fisaFormData.addendum ? { name: fisaFormData.addendum.name, url: URL.createObjectURL(fisaFormData.addendum), uploadedAt: new Date().toISOString() } : undefined
      },
      locked: false,
      history: [{
        action: 'Created',
        date: new Date().toISOString(),
        performedBy: 'John ASD',
        role: 'ASD',
        comments: fisaFormData.notes
      }],
      reviewers: fisaWorkflow.map(role => ({ role, user: '' }))
    };

    setFisaStandards([newFISA, ...fisaStandards]);
    setIsFISAModalOpen(false);
    setFisaFormData({
      qualification: '',
      saqaId: '',
      nqfLevel: '',
      credits: '',
      curriculum: null,
      assessmentSpec: null,
      saqaDocument: null,
      addendum: null,
      notes: ''
    });
  };

  // Handle FISA review/approval
  const handleFISAReview = (fisaId: string, decision: 'approve' | 'reject' | 'changes') => {
    const updatedFISA = fisaStandards.map(f => {
      if (f.id === fisaId) {
        const currentReviewerIndex = f.reviewers?.findIndex(r => r.role === currentUserRole) ?? -1;
        const updatedReviewers = f.reviewers?.map((r, index) => {
          if (index === currentReviewerIndex) {
            const decisionMap = {
              'approve': 'approved' as const,
              'reject': 'rejected' as const,
              'changes': 'changes' as const
            };
            return { ...r, user: 'Current User', reviewedAt: new Date().toISOString(), decision: decisionMap[decision] };
          }
          return r;
        });

        // Check if all reviewers have approved
        const allApproved = updatedReviewers?.every(r => r.decision === 'approved');
        const newStatus: FISAStatus = allApproved ? 'published' : f.status;

        return {
          ...f,
          status: newStatus,
          reviewers: updatedReviewers,
          history: [...f.history, {
            action: `${currentUserRole} ${decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Requested Changes'}`,
            date: new Date().toISOString(),
            performedBy: 'Current User',
            role: currentUserRole,
            comments: validationNotes
          }],
          publishedDate: newStatus === 'published' ? new Date().toISOString().split('T')[0] : f.publishedDate,
          locked: newStatus === 'published'
        };
      }
      return f;
    });

    setFisaStandards(updatedFISA);
    setIsValidateModalOpen(false);
    setValidationNotes('');
  };

  // Handle FISA validation flow
  const handleFISAValidation = (validationId: string, decision: 'approve' | 'reject' | 'changes') => {
    const updatedValidations = fisaValidations.map(v => {
      if (v.id === validationId) {
        const updatedFlow = { ...v.validationFlow };
        let nextStatus: FISAValidationStatus = v.status;

        const decisionMap = {
          'approve': 'approved' as const,
          'reject': 'rejected' as const,
          'changes': 'changes' as const
        };
        const mappedDecision = decisionMap[decision];

        // Determine current step and next step
        if (currentUserRole === 'SDP') {
          updatedFlow.sdp = { 
            user: 'Current User', 
            date: new Date().toISOString(), 
            decision: mappedDecision 
          };
          nextStatus = decision === 'approve' ? 'in_validation' : 'changes_requested';
        } else if (currentUserRole === 'Assistant Director') {
          updatedFlow.assistantDirector = { 
            user: 'Current User', 
            date: new Date().toISOString(), 
            decision: mappedDecision 
          };
          nextStatus = decision === 'approve' ? 'in_validation' : 'changes_requested';
        } else if (currentUserRole === 'ASD') {
          updatedFlow.asd = { 
            user: 'Current User', 
            date: new Date().toISOString(), 
            decision: mappedDecision 
          };
          nextStatus = decision === 'approve' ? 'in_validation' : 'changes_requested';
        } else if (currentUserRole === 'Deputy Director') {
          updatedFlow.deputyDirector = { 
            user: 'Current User', 
            date: new Date().toISOString(), 
            decision: mappedDecision 
          };
          nextStatus = decision === 'approve' ? 'approved' : 'rejected';
        }

        return {
          ...v,
          status: nextStatus,
          validationFlow: updatedFlow,
          feedback: decision === 'changes' ? validationNotes : v.feedback,
          recommendedChanges: decision === 'changes' ? recommendedChanges : v.recommendedChanges,
          locked: nextStatus === 'approved' || nextStatus === 'rejected',
          history: [...v.history, {
            action: `${currentUserRole} ${decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Requested Changes'}`,
            date: new Date().toISOString(),
            performedBy: 'Current User',
            role: currentUserRole,
            comments: validationNotes
          }]
        };
      }
      return v;
    });

    setFisaValidations(updatedValidations);
    setIsValidateModalOpen(false);
    setValidationNotes('');
    setRecommendedChanges([]);
  };

  // Handle EISA validation flow
  const handleEISAValidation = (validationId: string, decision: 'approve' | 'reject' | 'changes') => {
    const updatedValidations = eisaValidations.map(v => {
      if (v.id === validationId) {
        const updatedFlow = { ...v.validationFlow };
        let nextStatus: EISAValidationStatus = v.status;

        const decisionMap = {
          'approve': 'approved' as const,
          'reject': 'rejected' as const,
          'changes': 'changes' as const
        };
        const mappedDecision = decisionMap[decision];

        if (currentUserRole === 'ASD') {
          updatedFlow.asd = { 
            user: 'Current User', 
            date: new Date().toISOString(), 
            decision: mappedDecision 
          };
          nextStatus = decision === 'approve' ? 'in_validation' : 'changes_requested';
        } else if (currentUserRole === 'Deputy Director') {
          updatedFlow.deputyDirector = { 
            user: 'Current User', 
            date: new Date().toISOString(), 
            decision: mappedDecision 
          };
          nextStatus = decision === 'approve' ? 'approved' : 'rejected';
        }

        const validationReport = nextStatus === 'approved' ? {
          name: `Validation-Report-${v.validationId}.pdf`,
          url: '#',
          uploadedAt: new Date().toISOString()
        } : v.validationReport;

        return {
          ...v,
          status: nextStatus,
          validationFlow: updatedFlow,
          validationDate: nextStatus === 'approved' ? new Date().toISOString().split('T')[0] : v.validationDate,
          validatedBy: nextStatus === 'approved' ? 'Current User' : v.validatedBy,
          validationReport,
          feedback: decision === 'changes' ? validationNotes : v.feedback,
          recommendedChanges: decision === 'changes' ? recommendedChanges : v.recommendedChanges,
          locked: nextStatus === 'approved' || nextStatus === 'rejected',
          history: [...v.history, {
            action: `${currentUserRole} ${decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Requested Changes'}`,
            date: new Date().toISOString(),
            performedBy: 'Current User',
            role: currentUserRole,
            comments: validationNotes
          }]
        };
      }
      return v;
    });

    setEisaValidations(updatedValidations);
    setIsValidateModalOpen(false);
    setValidationNotes('');
    setRecommendedChanges([]);
  };

  // Handle completeness check
  const handleCompletenessSubmit = (type: 'fisa' | 'eisa', id: string) => {
    if (!completenessDecision) return;

    if (type === 'fisa') {
      const updatedValidations = fisaValidations.map(v => {
        if (v.id === id) {
          const newStatus: FISAValidationStatus = completenessDecision === 'complete' ? 'in_validation' : 'changes_requested';
          return {
            ...v,
            status: newStatus,
            assignedValidator: completenessDecision === 'complete' ? validatorAssignment : undefined,
            assignedDate: completenessDecision === 'complete' ? new Date().toISOString() : undefined,
            history: [...v.history, {
              action: completenessDecision === 'complete' ? 'Completeness Check Passed' : 'Completeness Check Failed',
              date: new Date().toISOString(),
              performedBy: 'Current User',
              role: currentUserRole,
              comments: validationNotes
            }]
          };
        }
        return v;
      });
      setFisaValidations(updatedValidations);
    } else {
      const updatedValidations = eisaValidations.map(v => {
        if (v.id === id) {
          const newStatus: EISAValidationStatus = completenessDecision === 'complete' ? 'in_validation' : 'changes_requested';
          return {
            ...v,
            status: newStatus,
            assignedValidator: completenessDecision === 'complete' ? validatorAssignment : undefined,
            assignedDate: completenessDecision === 'complete' ? new Date().toISOString() : undefined,
            history: [...v.history, {
              action: completenessDecision === 'complete' ? 'Completeness Check Passed' : 'Completeness Check Failed',
              date: new Date().toISOString(),
              performedBy: 'Current User',
              role: currentUserRole,
              comments: validationNotes
            }]
          };
        }
        return v;
      });
      setEisaValidations(updatedValidations);
    }

    setIsCompletenessModalOpen(false);
    setCompletenessDecision(null);
    setValidatorAssignment('');
    setValidationNotes('');
  };

  // Handle liaison arrangement
  const handleLiaisonSubmit = () => {
    if (!selectedEISAValidation) return;

    const updatedValidations = eisaValidations.map(v => {
      if (v.id === selectedEISAValidation.id) {
        return {
          ...v,
          liaison: {
            contactDate: liaisonFormData.contactDate,
            contactPerson: liaisonFormData.contactPerson,
            validationDate: liaisonFormData.validationDate,
            logistics: liaisonFormData.logistics
          },
          history: [...v.history, {
            action: 'Liaison Arranged',
            date: new Date().toISOString(),
            performedBy: 'Current User',
            role: currentUserRole,
            comments: liaisonFormData.logistics
          }]
        };
      }
      return v;
    });

    setEisaValidations(updatedValidations);
    setIsLiaiseModalOpen(false);
    setSelectedEISAValidation(null);
    setLiaisonFormData({
      contactDate: '',
      contactPerson: '',
      validationDate: '',
      logistics: ''
    });
  };

  // Handle evaluation submission
  const handleEvaluation = (fisaId: string, decision: 'approve' | 'reject' | 'changes' | null, comments: string, changes: string[]) => {
    const updatedFISA = fisaStandards.map(f => {
      if (f.id === fisaId) {
        const newEvaluation: FISAEvaluation = {
          role: currentUserRole,
          user: 'Current User',
          decision: decision === 'approve' ? 'approved' : 
                    decision === 'reject' ? 'rejected' : 
                    decision === 'changes' ? 'changes' : undefined,
          comments,
          recommendedChanges: changes,
          evaluatedAt: new Date().toISOString()
        };

        const existingEvaluations = f.evaluations || [];
        const filteredEvaluations = existingEvaluations.filter(e => e.role !== currentUserRole);
        const updatedEvaluations = [...filteredEvaluations, newEvaluation];

        // Check if all required roles have approved
        const requiredRoles: UserRole[] = ['Deputy Director', 'Director', 'Team', 'AIC', 'Qualifications Development'];
        const allApproved = requiredRoles.every(role => 
          updatedEvaluations.find(e => e.role === role)?.decision === 'approved'
        );

        return {
          ...f,
          evaluations: updatedEvaluations,
          status: allApproved ? 'published' : f.status,
          locked: allApproved,
          publishedDate: allApproved ? new Date().toISOString().split('T')[0] : f.publishedDate,
          history: [...f.history, {
            action: `${currentUserRole} Evaluation: ${decision}`,
            date: new Date().toISOString(),
            performedBy: 'Current User',
            role: currentUserRole,
            comments
          }]
        };
      }
      return f;
    });

    setFisaStandards(updatedFISA);
    setIsEvaluationModalOpen(false);
    setSelectedFISA(null);
  };

  // Handle moderation submission
  const handleModeration = (fisaId: string, moderatedDocs: any) => {
    const updatedFISA = fisaStandards.map(f => {
      if (f.id === fisaId) {
        const moderatedDocuments: FISADocuments = {};
        const evaluationReport: FISADocument = {
          name: moderatedDocs.evaluationReport.name,
          url: URL.createObjectURL(moderatedDocs.evaluationReport),
          uploadedAt: new Date().toISOString()
        };

        if (moderatedDocs.curriculum) {
          moderatedDocuments.curriculum = {
            name: moderatedDocs.curriculum.name,
            url: URL.createObjectURL(moderatedDocs.curriculum),
            uploadedAt: new Date().toISOString()
          };
        }
        if (moderatedDocs.assessmentSpec) {
          moderatedDocuments.assessmentSpec = {
            name: moderatedDocs.assessmentSpec.name,
            url: URL.createObjectURL(moderatedDocs.assessmentSpec),
            uploadedAt: new Date().toISOString()
          };
        }

        return {
          ...f,
          moderatedDocuments,
          evaluationReport,
          history: [...f.history, {
            action: 'Documents Moderated by Deputy Director',
            date: new Date().toISOString(),
            performedBy: 'Current User',
            role: 'Deputy Director',
            comments: 'Uploaded moderated documents and evaluation report'
          }]
        };
      }
      return f;
    });

    setFisaStandards(updatedFISA);
    setIsModerationModalOpen(false);
    setSelectedFISA(null);
  };

  // Generate FISA report
  const generateFISAReport = (fisa: FISAStandard) => {
    const reportContent = `
FISA STANDARD REPORT
Generated: ${new Date().toLocaleString()}
===========================================

FISA Number: ${fisa.fisaNumber}
Qualification: ${fisa.qualification}
SAQA ID: ${fisa.saqaId}
NQF Level: ${fisa.nqfLevel}
Credits: ${fisa.credits}
Version: ${fisa.version}
Status: ${fisa.status}
Created By: ${fisa.createdBy}
Created Date: ${new Date(fisa.createdAt).toLocaleDateString()}
Published Date: ${fisa.publishedDate || 'Not published'}
Expiry Date: ${fisa.expiryDate || 'N/A'}

DOCUMENTS:
- Curriculum Document: ${fisa.documents.curriculum ? 'Attached' : 'Missing'}
- Assessment Specification: ${fisa.documents.assessmentSpec ? 'Attached' : 'Missing'}
- SAQA Document: ${fisa.documents.saqaDocument ? 'Attached' : 'Missing'}
- Addendum: ${fisa.documents.addendum ? 'Attached' : 'Not applicable'}

REVIEW PROGRESS:
${fisa.reviewers?.map(r => `${r.role}: ${r.decision || 'Pending'} ${r.reviewedAt ? `(${new Date(r.reviewedAt).toLocaleDateString()})` : ''}`).join('\n')}

HISTORY:
${fisa.history.map(h => `${new Date(h.date).toLocaleString()} - ${h.action} by ${h.performedBy} (${h.role})${h.comments ? `\n  Comments: ${h.comments}` : ''}`).join('\n\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FISA-Report-${fisa.fisaNumber}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'in_validation':
        return 'bg-purple-100 text-purple-700';
      case 'completeness_check':
        return 'bg-blue-100 text-blue-700';
      case 'submitted':
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'changes_requested':
      case 'under_review':
        return 'bg-orange-100 text-orange-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get schedule status badge
  const getScheduleStatusBadge = (status: string) => {
    switch(status) {
      case 'Published':
        return 'bg-green-100 text-green-700';
      case 'Pending Approval':
        return 'bg-yellow-100 text-yellow-700';
      case 'Draft':
        return 'bg-blue-100 text-blue-700';
      case 'Archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get role badge
  const getRoleBadge = (role: UserRole) => {
    switch(role) {
      case 'ASD':
        return 'bg-purple-100 text-purple-700';
      case 'Deputy Director':
        return 'bg-blue-100 text-blue-700';
      case 'Director':
        return 'bg-green-100 text-green-700';
      case 'Team':
        return 'bg-yellow-100 text-yellow-700';
      case 'AIC':
        return 'bg-indigo-100 text-indigo-700';
      case 'Qualifications Development':
        return 'bg-pink-100 text-pink-700';
      case 'SDP':
        return 'bg-orange-100 text-orange-700';
      case 'Assistant Director':
        return 'bg-cyan-100 text-cyan-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Standards Management</h1>
          <p className="text-gray-600 mt-1">Manage FISA standards and validation workflows</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">Current Role:</span>
          <select
            value={currentUserRole}
            onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
            className="p-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="ASD">ASD</option>
            <option value="Deputy Director">Deputy Director</option>
            <option value="Director">Director</option>
            <option value="Team">Team</option>
            <option value="AIC">AIC</option>
            <option value="Qualifications Development">Qualifications Development</option>
            <option value="SDP">SDP</option>
            <option value="Assistant Director">Assistant Director</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('schedules');
              setCurrentPage(1);
            }}
            className={`pb-4 px-1 relative ${
              activeTab === 'schedules'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Validation Schedules
            {scheduleStats.draft > 0 && (
              <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {scheduleStats.draft}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('fisa');
              setCurrentPage(1);
            }}
            className={`pb-4 px-1 relative ${
              activeTab === 'fisa'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            FISA Standards
            {fisaStats.draft > 0 && (
              <span className="absolute -top-1 -right-2 bg-purple-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {fisaStats.draft}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('fisa-validation');
              setCurrentPage(1);
            }}
            className={`pb-4 px-1 relative ${
              activeTab === 'fisa-validation'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            FISA Validation
            {(fisaValidationStats.submitted + fisaValidationStats.completeness) > 0 && (
              <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {fisaValidationStats.submitted + fisaValidationStats.completeness}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('eisa-validation');
              setCurrentPage(1);
            }}
            className={`pb-4 px-1 relative ${
              activeTab === 'eisa-validation'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            EISA Validation
            {(eisaValidationStats.submitted + eisaValidationStats.completeness) > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {eisaValidationStats.submitted + eisaValidationStats.completeness}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content - Validation Schedules */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Validation Schedule Management</h3>
              <p className="text-sm text-gray-500 mt-1">
                Create, publish, and manage annual EISA validation schedules
              </p>
            </div>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Schedule
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-800">{scheduleStats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-800">{scheduleStats.draft}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-800">{scheduleStats.pending}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-800">{scheduleStats.published}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
              <p className="text-sm text-gray-600">Archived</p>
              <p className="text-2xl font-bold text-gray-800">{scheduleStats.archived}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">Validation Schedules</h4>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search schedules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publication Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSchedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {schedule.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {schedule.submissionDeadline}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {schedule.validationPeriod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {schedule.publicationDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {schedule.createdBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getScheduleStatusBadge(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {schedule.isCurrent ? (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                            Current
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {schedule.status === 'Draft' && !schedule.locked && (
                          <>
                            <button
                              onClick={() => handlePublishSchedule(schedule.id)}
                              className="text-green-600 hover:text-green-800 mr-3"
                            >
                              <CheckCircle className="h-4 w-4 inline mr-1" />
                              Publish
                            </button>
                          </>
                        )}
                        {schedule.status === 'Published' && (
                          <button
                            onClick={() => handleArchiveSchedule(schedule.id)}
                            className="text-gray-600 hover:text-gray-800 mr-3"
                          >
                            <Archive className="h-4 w-4 inline mr-1" />
                            Archive
                          </button>
                        )}
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content - FISA Standards */}
      {activeTab === 'fisa' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">FISA Standards Management</h3>
              <p className="text-sm text-gray-500 mt-1">
                Create and manage exam blueprints/rules for qualifications
              </p>
            </div>
            <button
              onClick={() => setIsFISAModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create FISA Standard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total FISA</p>
              <p className="text-2xl font-bold text-gray-800">{fisaStats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-bold text-gray-800">{fisaStats.draft}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <p className="text-sm text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-gray-800">{fisaStats.underReview}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-800">{fisaStats.published}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <p className="text-sm text-gray-600">Changes Requested</p>
              <p className="text-2xl font-bold text-gray-800">{fisaStats.changesRequested}</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">FISA Approval Workflow</p>
                <p className="text-sm text-blue-600 mt-1">
                  <strong>Step 1 (Quality Check):</strong> Deputy Director reviews and moderates documents → Produces moderated SP doc, Curriculum doc, and Evaluation report<br/>
                  <strong>Step 2 (Review):</strong> Director and Team review the 3 documents/report<br/>
                  <strong>Step 3 (Validation):</strong> AIC validates the documents<br/>
                  <strong>Step 4 (Final Review):</strong> Qualifications Development performs final check
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">FISA Standards</h4>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search FISA..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FISA #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SAQA ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NQF Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedFISA.map((fisa) => (
                    <tr key={fisa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {fisa.fisaNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {fisa.qualification}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fisa.saqaId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Level {fisa.nqfLevel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        v{fisa.version}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(fisa.status)}`}>
                          {fisa.status === 'under_review' ? getCurrentReviewStage(fisa) : fisa.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {/* Original Documents */}
                          {Object.entries(fisa.documents).map(([key, value]) => value && (
                            <button
                              key={key}
                              onClick={() => {
                                setSelectedFISA(fisa);
                                setSelectedDocument({ type: key, document: value });
                                setIsDocumentViewerOpen(true);
                              }}
                              className="relative group p-1 hover:bg-gray-100 rounded"
                            >
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                {key === 'curriculum' ? 'Original Curriculum' :
                                 key === 'assessmentSpec' ? 'Original Assessment Spec' :
                                 key === 'saqaDocument' ? 'Original SAQA Document' :
                                 key === 'addendum' ? 'Original Addendum' : key}
                              </div>
                            </button>
                          ))}

                          {/* Moderated Documents (if any) */}
                          {fisa.moderatedDocuments && Object.entries(fisa.moderatedDocuments).map(([key, value]) => value && (
                            <button
                              key={`mod-${key}`}
                              onClick={() => {
                                setSelectedFISA(fisa);
                                setSelectedDocument({ type: `moderated-${key}`, document: value });
                                setIsDocumentViewerOpen(true);
                              }}
                              className="relative group p-1 hover:bg-gray-100 rounded"
                            >
                              <FileCheck className="h-5 w-5 text-green-600" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                {key === 'curriculum' ? 'Moderated Curriculum' :
                                 key === 'assessmentSpec' ? 'Moderated Assessment Spec' :
                                 key === 'evaluationReport' ? 'Evaluation Report' : `Moderated ${key}`}
                              </div>
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {/* Show evaluation status for each role */}
                          {fisa.evaluations?.map((evaluation, idx) => (
                            <div key={idx} className="flex items-center text-xs">
                              <span className={`w-16 ${getRoleBadge(evaluation.role)} px-1 py-0.5 rounded mr-2`}>
                                {evaluation.role === 'Deputy Director' ? 'DD' :
                                 evaluation.role === 'Director' ? 'Dir' :
                                 evaluation.role === 'Team' ? 'Team' :
                                 evaluation.role === 'AIC' ? 'AIC' :
                                 evaluation.role === 'Qualifications Development' ? 'QD' : ''}
                              </span>
                              <span className={evaluation.decision === 'approved' ? 'text-green-600' : 
                                               evaluation.decision === 'changes' ? 'text-orange-600' : 
                                               evaluation.decision === 'rejected' ? 'text-red-600' : 'text-gray-400'}>
                                {evaluation.decision || 'Pending'}
                              </span>
                              {evaluation.comments && (
                                <span className="ml-1 text-gray-400 cursor-help" title={evaluation.comments}>ⓘ</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedFISA(fisa);
                              setIsHistoryModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View History"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedFISA(fisa);
                              setIsDocumentViewerOpen(true);
                            }}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="View All Documents"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              generateFISAReport(fisa);
                            }}
                            className="text-purple-600 hover:text-purple-800 p-1"
                            title="Generate Report"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          {/* Evaluation Button - Show for all roles when it's their turn */}
                          {fisa.status === 'under_review' && 
                           !fisa.evaluations?.some(e => e.role === currentUserRole && e.decision) && (
                            <button
                              onClick={() => {
                                setSelectedFISA(fisa);
                                setIsEvaluationModalOpen(true);
                              }}
                              className="text-yellow-600 hover:text-yellow-800 p-1"
                              title="Evaluate Documents"
                            >
                              <ClipboardCheck className="h-4 w-4" />
                            </button>
                          )}

                          {/* Deputy Director - Can also moderate documents */}
                          {currentUserRole === 'Deputy Director' && 
                           fisa.status === 'under_review' && 
                           !fisa.moderatedDocuments && (
                            <button
                              onClick={() => {
                                setSelectedFISA(fisa);
                                setIsModerationModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 p-1"
                              title="Moderate Documents"
                            >
                              <PenTool className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredFISA.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredFISA.length)} of {filteredFISA.length}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">Page {currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage === Math.ceil(filteredFISA.length / itemsPerPage)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Modal */}
          {isEvaluationModalOpen && selectedFISA && (
            <EvaluationModal
              fisa={selectedFISA}
              userRole={currentUserRole}
              onClose={() => {
                setIsEvaluationModalOpen(false);
                setSelectedFISA(null);
              }}
              onSubmit={(decision, comments, changes) => {
                handleEvaluation(selectedFISA.id, decision, comments, changes);
              }}
            />
          )}

          {/* Moderation Modal */}
          {isModerationModalOpen && selectedFISA && (
            <ModerationModal
              fisa={selectedFISA}
              onClose={() => {
                setIsModerationModalOpen(false);
                setSelectedFISA(null);
              }}
              onSubmit={(moderatedDocs) => {
                handleModeration(selectedFISA.id, moderatedDocs);
              }}
            />
          )}
        </div>
      )}

      {/* Tab Content - FISA Validation */}
      {activeTab === 'fisa-validation' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">FISA Validation</h3>
            <p className="text-sm text-gray-500 mt-1">
              Validate FISA standards against requirements (SDP → Assistant Director → ASD → Deputy Director)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800">{fisaValidationStats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-gray-800">{fisaValidationStats.submitted}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Completeness Check</p>
              <p className="text-2xl font-bold text-gray-800">{fisaValidationStats.completeness}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <p className="text-sm text-gray-600">In Validation</p>
              <p className="text-2xl font-bold text-gray-800">{fisaValidationStats.inValidation}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <p className="text-sm text-gray-600">Changes Requested</p>
              <p className="text-2xl font-bold text-gray-800">{fisaValidationStats.changesRequested}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-800">{fisaValidationStats.approved}</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">FISA Validation Workflow</p>
                <p className="text-sm text-blue-600 mt-1">
                  FISA validations must go through: SDP → Assistant Director → ASD → Deputy Director
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">FISA Validation Requests</h4>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search validations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation Flow</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedFISAValidations.map((validation) => (
                    <tr key={validation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {validation.validationId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {validation.qualification}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {validation.submittedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(validation.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {Object.entries(validation.documents).map(([key, value]) => value && (
                            <button
                              key={key}
                              onClick={() => window.open(value.url, '_blank')}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <FileText className="h-4 w-4 text-blue-600" />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(validation.status)}`}>
                          {validation.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {Object.entries(validation.validationFlow).map(([role, data]) => (
                            <div key={role} className="relative group">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                data?.decision === 'approved' ? 'bg-green-100 text-green-700' :
                                data?.decision === 'rejected' ? 'bg-red-100 text-red-700' :
                                data?.date ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                {role === 'sdp' ? 'S' :
                                 role === 'assistantDirector' ? 'AD' :
                                 role === 'asd' ? 'A' :
                                 role === 'deputyDirector' ? 'DD' :
                                 role.charAt(0).toUpperCase()}
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                {role}: {data?.decision || 'Pending'}
                                {data?.user && ` (${data.user})`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedFISAValidation(validation);
                            setIsHistoryModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          title="View History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        
                        {validation.status === 'submitted' && currentUserRole === 'SDP' && (
                          <button
                            onClick={() => {
                              setSelectedFISAValidation(validation);
                              setIsCompletenessModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            title="Completeness Check"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {validation.status === 'in_validation' && (
                          fisaValidationWorkflow.includes(currentUserRole) && (
                            <button
                              onClick={() => {
                                setSelectedFISAValidation(validation);
                                setIsValidateModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-800"
                              title="Validate"
                            >
                              <ClipboardList className="h-4 w-4" />
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredFISAValidations.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredFISAValidations.length)} of {filteredFISAValidations.length}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">Page {currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage === Math.ceil(filteredFISAValidations.length / itemsPerPage)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content - EISA Validation */}
      {activeTab === 'eisa-validation' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">EISA Validation</h3>
            <p className="text-sm text-gray-500 mt-1">
              Validate EISA instruments against FISA standards (ASD → Deputy Director)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800">{eisaValidationStats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-gray-800">{eisaValidationStats.submitted}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Completeness Check</p>
              <p className="text-2xl font-bold text-gray-800">{eisaValidationStats.completeness}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <p className="text-sm text-gray-600">In Validation</p>
              <p className="text-2xl font-bold text-gray-800">{eisaValidationStats.inValidation}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
              <p className="text-sm text-gray-600">Changes Requested</p>
              <p className="text-2xl font-bold text-gray-800">{eisaValidationStats.changesRequested}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-800">{eisaValidationStats.approved}</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">EISA Validation Workflow</p>
                <p className="text-sm text-blue-600 mt-1">
                  EISA validations must go through: ASD → Deputy Director
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-700">EISA Validation Requests</h4>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search validations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality Partner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation Flow</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEISAValidations.map((validation) => (
                    <tr key={validation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {validation.validationId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {validation.qualification}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {validation.qualityPartner}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {validation.assessmentDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(validation.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {Object.entries(validation.documents).map(([key, value]) => value && (
                            <button
                              key={key}
                              onClick={() => window.open(value.url, '_blank')}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <FileText className="h-4 w-4 text-blue-600" />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(validation.status)}`}>
                          {validation.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {Object.entries(validation.validationFlow).map(([role, data]) => (
                            <div key={role} className="relative group">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                data?.decision === 'approved' ? 'bg-green-100 text-green-700' :
                                data?.decision === 'rejected' ? 'bg-red-100 text-red-700' :
                                data?.date ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                {role === 'asd' ? 'A' : 'DD'}
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                {role}: {data?.decision || 'Pending'}
                                {data?.user && ` (${data.user})`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedEISAValidation(validation);
                            setIsHistoryModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          title="View History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        
                        {validation.status === 'submitted' && (
                          <button
                            onClick={() => {
                              setSelectedEISAValidation(validation);
                              setIsCompletenessModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            title="Completeness Check"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {validation.status === 'completeness_check' && !validation.locked && (
                          <button
                            onClick={() => {
                              setSelectedEISAValidation(validation);
                              setIsLiaiseModalOpen(true);
                            }}
                            className="text-purple-600 hover:text-purple-800 mr-3"
                            title="Arrange Liaison"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        )}
                        
                        {validation.status === 'in_validation' && (
                          eisaValidationWorkflow.includes(currentUserRole) && (
                            <button
                              onClick={() => {
                                setSelectedEISAValidation(validation);
                                setIsValidateModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-800"
                              title="Validate"
                            >
                              <ClipboardList className="h-4 w-4" />
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredEISAValidations.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEISAValidations.length)} of {filteredEISAValidations.length}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">Page {currentPage}</span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage === Math.ceil(filteredEISAValidations.length / itemsPerPage)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Create New Validation Schedule</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-700 flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Create a new validation schedule. Once published, it will be locked and guide all EISA validation activities.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateSchedule();
              }} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={scheduleFormData.year}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, year: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}</option>
                    <option value={new Date().getFullYear() + 2}>{new Date().getFullYear() + 2}</option>
                    <option value={new Date().getFullYear() + 3}>{new Date().getFullYear() + 3}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submission Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduleFormData.submissionDeadline}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, submissionDeadline: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validation Period Start <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={scheduleFormData.validationPeriodStart}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, validationPeriodStart: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validation Period End <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={scheduleFormData.validationPeriodEnd}
                      onChange={(e) => setScheduleFormData({...scheduleFormData, validationPeriodEnd: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publication Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduleFormData.publicationDate}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, publicationDate: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={scheduleFormData.notes}
                    onChange={(e) => setScheduleFormData({...scheduleFormData, notes: e.target.value})}
                    placeholder="Any additional information about this validation schedule..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Create Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create FISA Modal */}
      {isFISAModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Create FISA Standard</h3>
              <button onClick={() => setIsFISAModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-700 flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Create a new FISA standard (exam blueprint/rules). This will go through review by ASD → Deputy Director → Director → Team → AIC → Qualifications Development.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateFISA();
              }} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qualification <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fisaFormData.qualification}
                      onChange={(e) => setFisaFormData({...fisaFormData, qualification: e.target.value})}
                      placeholder="e.g., Electrician Level 4"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SAQA ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fisaFormData.saqaId}
                      onChange={(e) => setFisaFormData({...fisaFormData, saqaId: e.target.value})}
                      placeholder="e.g., SAQA-12345"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NQF Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={fisaFormData.nqfLevel}
                      onChange={(e) => setFisaFormData({...fisaFormData, nqfLevel: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Level...</option>
                      <option value="1">Level 1</option>
                      <option value="2">Level 2</option>
                      <option value="3">Level 3</option>
                      <option value="4">Level 4</option>
                      <option value="5">Level 5</option>
                      <option value="6">Level 6</option>
                      <option value="7">Level 7</option>
                      <option value="8">Level 8</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credits <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={fisaFormData.credits}
                      onChange={(e) => setFisaFormData({...fisaFormData, credits: e.target.value})}
                      placeholder="e.g., 120"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Required Documents</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Curriculum Document <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFisaFormData({...fisaFormData, curriculum: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assessment Specification <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFisaFormData({...fisaFormData, assessmentSpec: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SAQA Document <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFisaFormData({...fisaFormData, saqaDocument: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Addendum (if applicable)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFisaFormData({...fisaFormData, addendum: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={fisaFormData.notes}
                    onChange={(e) => setFisaFormData({...fisaFormData, notes: e.target.value})}
                    placeholder="Any additional information..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFISAModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Create FISA Standard
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {isDocumentViewerOpen && selectedFISA && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                Documents - {selectedFISA.fisaNumber}
              </h3>
              <button 
                onClick={() => {
                  setIsDocumentViewerOpen(false);
                  setSelectedFISA(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedFISA.documents).map(([key, value]) => value && (
                  <div key={key} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <FileText className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {key === 'curriculum' ? 'Curriculum Document' :
                             key === 'assessmentSpec' ? 'Assessment Specification' :
                             key === 'saqaDocument' ? 'SAQA Document' :
                             key === 'addendum' ? 'Addendum' : key.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Uploaded: {new Date(value.uploadedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {value.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(value.url, '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = value.url;
                            a.download = value.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Download"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {Object.values(selectedFISA.documents).filter(v => v).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No documents available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completeness Check Modal */}
      {isCompletenessModalOpen && (selectedFISAValidation || selectedEISAValidation) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                Completeness Check - {selectedFISAValidation?.validationId || selectedEISAValidation?.validationId}
              </h3>
              <button onClick={() => {
                setIsCompletenessModalOpen(false);
                setSelectedFISAValidation(null);
                setSelectedEISAValidation(null);
              }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-700 flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Review the submitted documents for completeness. Check if all required documents are present and valid.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleCompletenessSubmit(
                  selectedFISAValidation ? 'fisa' : 'eisa',
                  selectedFISAValidation?.id || selectedEISAValidation?.id || ''
                );
              }} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completeness Decision <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setCompletenessDecision('complete')}
                      className={`flex-1 py-3 rounded-lg border ${
                        completenessDecision === 'complete'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-green-300 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 inline mr-2" />
                      Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompletenessDecision('incomplete')}
                      className={`flex-1 py-3 rounded-lg border ${
                        completenessDecision === 'incomplete'
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                      }`}
                    >
                      <XCircle className="h-4 w-4 inline mr-2" />
                      Incomplete
                    </button>
                  </div>
                </div>

                {completenessDecision === 'complete' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Validator <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={validatorAssignment}
                      onChange={(e) => setValidatorAssignment(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Validator...</option>
                      <option value="John ASD">John ASD</option>
                      <option value="Sarah Validator">Sarah Validator</option>
                      <option value="Mike Reviewer">Mike Reviewer</option>
                      <option value="Deputy Davis">Deputy Davis</option>
                      <option value="Mike SDP">Mike SDP</option>
                      <option value="Sarah AD">Sarah AD</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                    placeholder={completenessDecision === 'complete' 
                      ? "Add any notes about the completeness check..."
                      : "Specify what documents are missing or need correction..."
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCompletenessModalOpen(false);
                      setSelectedFISAValidation(null);
                      setSelectedEISAValidation(null);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!completenessDecision || (completenessDecision === 'complete' && !validatorAssignment)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Decision
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Liaise Modal */}
      {isLiaiseModalOpen && selectedEISAValidation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                Arrange Validation - {selectedEISAValidation.validationId}
              </h3>
              <button onClick={() => {
                setIsLiaiseModalOpen(false);
                setSelectedEISAValidation(null);
              }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-700 flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Liaise with the Quality Partner to arrange validation date and logistics.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleLiaisonSubmit();
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={liaisonFormData.contactDate}
                      onChange={(e) => setLiaisonFormData({...liaisonFormData, contactDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={liaisonFormData.contactPerson}
                      onChange={(e) => setLiaisonFormData({...liaisonFormData, contactPerson: e.target.value})}
                      placeholder="e.g., John Smith"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Validation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={liaisonFormData.validationDate}
                    onChange={(e) => setLiaisonFormData({...liaisonFormData, validationDate: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logistics Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={liaisonFormData.logistics}
                    onChange={(e) => setLiaisonFormData({...liaisonFormData, logistics: e.target.value})}
                    placeholder="Specify meeting platform, document sharing method, timeline, etc."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLiaiseModalOpen(false);
                      setSelectedEISAValidation(null);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Confirm Arrangements
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Validate Modal */}
      {isValidateModalOpen && (selectedFISAValidation || selectedEISAValidation) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                Validate - {selectedFISAValidation?.validationId || selectedEISAValidation?.validationId}
              </h3>
              <button onClick={() => {
                setIsValidateModalOpen(false);
                setSelectedFISAValidation(null);
                setSelectedEISAValidation(null);
              }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Validation Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Qualification</p>
                    <p className="font-medium">
                      {selectedFISAValidation?.qualification || selectedEISAValidation?.qualification}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">SAQA ID</p>
                    <p className="font-medium">
                      {selectedFISAValidation?.saqaId || selectedEISAValidation?.saqaId}
                    </p>
                  </div>
                  {selectedEISAValidation && (
                    <>
                      <div>
                        <p className="text-gray-500">Quality Partner</p>
                        <p className="font-medium">{selectedEISAValidation.qualityPartner}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Assessment Date</p>
                        <p className="font-medium">{selectedEISAValidation.assessmentDate}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-gray-500">Current Role</p>
                    <p className="font-medium">{currentUserRole}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-700 flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  {selectedFISAValidation 
                    ? `Validate the FISA standard. Your role: ${currentUserRole}. Next reviewer will be determined after your decision.`
                    : `Validate the EISA instrument against FISA standards. Your role: ${currentUserRole}.`
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validation Notes
                </label>
                <textarea
                  rows={4}
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                  placeholder="Document your validation findings..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommended Changes (if any)
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={changeInput}
                    onChange={(e) => setChangeInput(e.target.value)}
                    placeholder="Add a recommended change..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (changeInput) {
                        setRecommendedChanges([...recommendedChanges, changeInput]);
                        setChangeInput('');
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {recommendedChanges.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {recommendedChanges.map((change, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{change}</span>
                        <button
                          type="button"
                          onClick={() => setRecommendedChanges(recommendedChanges.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setValidationDecision('approve')}
                    className={`py-3 rounded-lg border ${
                      validationDecision === 'approve'
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidationDecision('changes')}
                    className={`py-3 rounded-lg border ${
                      validationDecision === 'changes'
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Request Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidationDecision('reject')}
                    className={`py-3 rounded-lg border ${
                      validationDecision === 'reject'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-red-300 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <XCircle className="h-4 w-4 inline mr-2" />
                    Reject
                  </button>
                </div>
              </div>

              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-gray-600 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  {validationDecision === 'approve' && selectedFISAValidation && "Approving will move this to the next reviewer or complete the workflow."}
                  {validationDecision === 'approve' && selectedEISAValidation && "Approving will lock the instrument and generate a validation report."}
                  {validationDecision === 'changes' && "Requesting changes will notify the submitter to update and resubmit."}
                  {validationDecision === 'reject' && "Rejecting will close the validation and notify the submitter."}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsValidateModalOpen(false);
                    setSelectedFISAValidation(null);
                    setSelectedEISAValidation(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedFISAValidation) {
                      handleFISAValidation(selectedFISAValidation.id, validationDecision!);
                    } else if (selectedEISAValidation) {
                      handleEISAValidation(selectedEISAValidation.id, validationDecision!);
                    }
                  }}
                  disabled={!validationDecision}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Complete Validation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (selectedFISA || selectedFISAValidation || selectedEISAValidation) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                History - {selectedFISA?.fisaNumber || selectedFISAValidation?.validationId || selectedEISAValidation?.validationId}
              </h3>
              <button onClick={() => {
                setIsHistoryModalOpen(false);
                setSelectedFISA(null);
                setSelectedFISAValidation(null);
                setSelectedEISAValidation(null);
              }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {(selectedFISA?.history || selectedFISAValidation?.history || selectedEISAValidation?.history || []).map((entry, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{entry.action}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.date).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-600">By: {entry.performedBy}</span>
                      {'role' in entry && (
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getRoleBadge(entry.role as UserRole)}`}>
                          {entry.role}
                        </span>
                      )}
                    </div>
                    {entry.comments && (
                      <p className="text-sm text-gray-500 mt-1">{entry.comments}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon components
const Archive = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="2" y="4" width="20" height="4" rx="1" ry="1"></rect>
    <path d="M4 8v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path>
    <line x1="10" y1="12" x2="14" y2="12"></line>
  </svg>
);

const Save = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);