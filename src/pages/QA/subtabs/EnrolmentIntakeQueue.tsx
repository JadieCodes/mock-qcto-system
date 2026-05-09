import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  FileText,
  CheckCircle,
  Clock,
  Play,
  XCircle,
  Send,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  FolderPlus,
} from 'lucide-react';

type LearnerEnrolmentBatchStatus =
  | 'Draft'
  | 'Submitted'
  | 'Gate Evaluation Pending'
  | 'Gate Evaluation In Progress'
  | 'Gate Evaluation Completed'
  | 'Pending Indicator Champion Review'
  | 'Under Indicator Champion Review'
  | 'Approved';

type GateOutcome = 'passed' | 'failed' | null;

type LearnerRow = {
  id: string;
  nationalId: string;
  alternateId: string;
  lastName: string;
  firstName: string;
  gender: string;
  birthDate: string;
  province: string;
  popiaAgree: string;
  sorStatus: string;
  readinessType: string;
  flc: string;

  alternativeIdType: string;
  middleName: string;
  title: string;
  popiaDate: string;
  sorIssueDate: string;
  flcStatementNumber: string;
  homeLanguage: string;
  nationality: string;
  citizenStatus: string;
  socioeconomicStatus: string;
  disabilityStatus: string;
  disabilityRating: string;
  immigrantStatus: string;
  equityCode: string;
  homeAddress1: string;
  homeAddress2: string;
  homeAddress3: string;
  postalAddress1: string;
  postalAddress2: string;
  postalAddress3: string;
  homePostalCode: string;
  postalCode: string;
  phoneNumber: string;
  cellPhoneNumber: string;
  emailAddress: string;
  statssaAreaCode: string;
  expectedTrainingCompletionDate: string;
};

type GateCheckItem = {
  criteria: string;
  isMet: boolean;
  detail: string;
};

type DraftReport = {
  id: string;
  generatedAt: string;
  reportTitle: string;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    uploadedFileName?: string;
    submissionMethod: 'manual' | 'upload' | 'mixed';
  };
  validationChecks: GateCheckItem[];
  notes: string[];
};

type ChecklistAttachment = {
  id: string;
  name: string;
  uploadedAt: string;
  url: string;
};

type ReviewQuestion = {
  id: string;
  label: string;
  description: string;
  isDefault?: boolean;
  isActive?: boolean;
};

type ReviewSection = {
  id: string;
  title: string;
  description: string;
  isDefault?: boolean;
  isActive?: boolean;
  questions: ReviewQuestion[];
};

type ReviewQuestionState = {
  checked: boolean;
  comment: string;
  attachments: ChecklistAttachment[];
};

type IndicatorChampionChecklistItem = {
  criteriaId: string;
  criteriaName: string;
  sectionId: string;
  sectionTitle: string;
  isMet: boolean;
  comments: string;
  attachments: ChecklistAttachment[];
};

type IndicatorChampionReview = {
  reviewedBy: string;
  reviewedAt: string;
  checklist: IndicatorChampionChecklistItem[];
  decision: 'approved';
  comments: string;
  confirmationLetterUrl: string;
  sentAt: string;
};

type LearnerEnrolmentBatch = {
  id: string;
  enrolmentId: string;
  sdpCode: string;
  qualificationId: string;
  assessmentCentreCode: string;
  dateStamp: string;
  uploadedFileName?: string;
  learnerRows: LearnerRow[];
  status: LearnerEnrolmentBatchStatus;
  submittedBy: string;
  submittedAt: string;
  savedAt?: string;
  gateEvaluation: {
    status: GateOutcome;
    generatedAt?: string;
    checklistResults: GateCheckItem[];
    failureReasons: string[];
  } | null;
  draftReport: DraftReport | null;
  indicatorChampionReview?: IndicatorChampionReview;
};

const STORAGE_KEY = 'external_learner_enrolment_batches_v2';

const defaultReviewSections: ReviewSection[] = [
  {
    id: 'section_core_submission',
    title: 'Core Submission Review',
    description: 'Review the main learner enrolment submission and supporting generated outputs.',
    isDefault: true,
    isActive: true,
    questions: [
      {
        id: 'document_completeness',
        label: 'Document Completeness',
        description: 'Are all required learner enrolment records and generated outputs present?',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'learner_data_alignment',
        label: 'Learner Data Alignment',
        description: 'Do the learner rows reflect the same captured data shown on the external submission?',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'qualification_alignment',
        label: 'Qualification Alignment',
        description: 'Do the qualification ID and related submission fields align correctly?',
        isDefault: true,
        isActive: true,
      },
    ],
  },
  {
    id: 'section_generated_outputs',
    title: 'Generated Outputs Review',
    description: 'Review the gate evaluation and draft report outputs.',
    isDefault: true,
    isActive: true,
    questions: [
      {
        id: 'gate_evaluation_alignment',
        label: 'Gate Evaluation Alignment',
        description: 'Does the gate evaluation section display the same generated validation outcome?',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'draft_report_alignment',
        label: 'Draft Report Alignment',
        description: 'Does the draft report display the same generated summary, checks, and notes?',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'submission_readiness',
        label: 'Submission Readiness',
        description: 'Is the learner enrolment ready for internal approval processing?',
        isDefault: true,
        isActive: true,
      },
    ],
  },
];

const provinceLabelMap: Record<string, string> = {
  '1': 'Western Cape',
  '2': 'Eastern Cape',
  '3': 'Northern Cape',
  '4': 'Free State',
  '5': 'KwaZulu-Natal',
  '6': 'North West',
  '7': 'Gauteng',
  '8': 'Mpumalanga',
  '9': 'Limpopo',
  N: 'SA National',
  X: 'Outside SA',
};

const sorStatusLabelMap: Record<string, string> = {
  '01': 'Statement of Results issued',
  '02': 'Statement of Results not yet issued',
};

const readinessTypeLabelMap: Record<string, string> = {
  '1': 'Enrolled',
  '2': 'RPL for Access to EISA determined by SDP',
  '3': 'Mixed Mode to EISA',
  '4': 'SDP Training and assessment for readiness to EISA',
  '5': 'SDP e-learning training and assessment for readiness to EISA',
  '6': 'RPL for Access to EISA determined by Assessment Partner/Quality Partner',
};

const flcLabelMap: Record<string, string> = {
  '01': 'FLC certificate (competent)',
  '02': 'RPL',
  '03': 'Grade 12/NCV Level 4 pass',
  '04': 'Not yet competent',
  '05': 'FLC not completed yet',
  '06': 'Not applicable',
  '07': 'Enrolled for FLC',
  '08': 'N3 Mathematics and Business Language',
};

const genderLabelMap: Record<string, string> = {
  M: 'Male',
  F: 'Female',
};

const formatDisplayDate = (value?: string) => {
  if (!value) return '-';
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
};

const buildInitialQuestionState = (sections: ReviewSection[]) => {
  const state: Record<string, ReviewQuestionState> = {};
  sections.forEach((section) => {
    section.questions.forEach((question) => {
      state[question.id] = {
        checked: false,
        comment: '',
        attachments: [],
      };
    });
  });
  return state;
};

const EnrolmentIntakeQueue = () => {
  const { currentUser } = useApp();

  const [enrolments, setEnrolments] = useState<LearnerEnrolmentBatch[]>([]);
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolmentBatch | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const [reviewSections, setReviewSections] = useState<ReviewSection[]>(defaultReviewSections);
  const [questionState, setQuestionState] = useState<Record<string, ReviewQuestionState>>(
    buildInitialQuestionState(defaultReviewSections)
  );
  const [reviewComments, setReviewComments] = useState('');

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newQuestionInputs, setNewQuestionInputs] = useState<
    Record<string, { label: string; description: string }>
  >({});

  useEffect(() => {
    const load = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setEnrolments([]);
        return;
      }

      try {
        const parsed: LearnerEnrolmentBatch[] = JSON.parse(saved);
        setEnrolments(parsed);
      } catch {
        setEnrolments([]);
      }
    };

    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  const persistEnrolments = (updated: LearnerEnrolmentBatch[]) => {
    setEnrolments(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const pendingReviewEnrolments = useMemo(
    () =>
      enrolments.filter(
        (e) =>
          e.status === 'Pending Indicator Champion Review' ||
          e.status === 'Under Indicator Champion Review'
      ),
    [enrolments]
  );

  const restoreReviewStateFromExisting = (enrolment: LearnerEnrolmentBatch) => {
    const sections = defaultReviewSections.map((section) => ({
      ...section,
      questions: [...section.questions],
    }));

    const initialState = buildInitialQuestionState(sections);

    if (enrolment.indicatorChampionReview?.checklist?.length) {
      enrolment.indicatorChampionReview.checklist.forEach((item) => {
        const matchingSection = sections.find((section) => section.id === item.sectionId);
        const questionExists = matchingSection?.questions.some((q) => q.id === item.criteriaId);

        if (!questionExists && matchingSection) {
          matchingSection.questions.push({
            id: item.criteriaId,
            label: item.criteriaName,
            description: 'Previously saved custom review question.',
          });
        }

        initialState[item.criteriaId] = {
          checked: item.isMet,
          comment: item.comments || '',
          attachments: item.attachments || [],
        };
      });
    }

    setReviewSections(sections);
    setQuestionState(initialState);
    setReviewComments(enrolment.indicatorChampionReview?.comments || '');
    setNewQuestionInputs({});
    setNewSectionTitle('');
    setNewSectionDescription('');
  };

  const viewEnrolment = (enrolment: LearnerEnrolmentBatch) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    restoreReviewStateFromExisting(enrolment);
  };

  const updateSelectedEnrolmentInStore = (updatedEnrolment: LearnerEnrolmentBatch) => {
    const updated = enrolments.map((item) =>
      item.id === updatedEnrolment.id ? updatedEnrolment : item
    );
    persistEnrolments(updated);
    setSelectedEnrolment(updatedEnrolment);
  };

  const handleStartReview = () => {
    if (!selectedEnrolment) return;

    const updatedEnrolment: LearnerEnrolmentBatch = {
      ...selectedEnrolment,
      status: 'Under Indicator Champion Review',
    };

    updateSelectedEnrolmentInStore(updatedEnrolment);
  };

  const updateQuestionCheck = (questionId: string, checked: boolean) => {
    setQuestionState((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { checked: false, comment: '', attachments: [] }),
        checked,
      },
    }));
  };

  const updateQuestionComment = (questionId: string, comment: string) => {
    setQuestionState((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { checked: false, comment: '', attachments: [] }),
        comment,
      },
    }));
  };

  const handleQuestionAttachmentUpload = (
    questionId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const attachments: ChecklistAttachment[] = files.map((file) => ({
      id: `${questionId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file),
    }));

    setQuestionState((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { checked: false, comment: '', attachments: [] }),
        attachments: [...(prev[questionId]?.attachments || []), ...attachments],
      },
    }));
  };

  const removeAttachment = (questionId: string, attachmentId: string) => {
    setQuestionState((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { checked: false, comment: '', attachments: [] }),
        attachments: (prev[questionId]?.attachments || []).filter(
          (item) => item.id !== attachmentId
        ),
      },
    }));
  };

  const addSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection: ReviewSection = {
      id: `section_${Date.now()}`,
      title: newSectionTitle.trim(),
      description: newSectionDescription.trim(),
      questions: [],
    };

    setReviewSections((prev) => [...prev, newSection]);
    setNewSectionTitle('');
    setNewSectionDescription('');
  };

const removeSection = (sectionId: string) => {
  setReviewSections((prev) =>
    prev
      .map((section) => {
        if (section.id !== sectionId) return section;

        if (section.isDefault) {
          return {
            ...section,
            isActive: false,
            questions: section.questions.map((question) => ({
              ...question,
              isActive: false,
            })),
          };
        }

        return null;
      })
      .filter(Boolean) as ReviewSection[]
  );

  setNewQuestionInputs((prev) => {
    const updated = { ...prev };
    delete updated[sectionId];
    return updated;
  });
};

const hiddenDefaultSections = reviewSections.filter(
  (section) => section.isDefault && section.isActive === false
);

const hiddenDefaultQuestionsBySection = reviewSections
  .filter((section) => section.isActive !== false)
  .map((section) => ({
    sectionId: section.id,
    sectionTitle: section.title,
    questions: section.questions.filter(
      (question) => question.isDefault && question.isActive === false
    ),
  }))
  .filter((section) => section.questions.length > 0);

const restoreSection = (sectionId: string) => {
  setReviewSections((prev) =>
    prev.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            isActive: true,
            questions: section.questions.map((question) => ({
              ...question,
              isActive: true,
            })),
          }
        : section
    )
  );
};

const restoreQuestion = (sectionId: string, questionId: string) => {
  setReviewSections((prev) =>
    prev.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            questions: section.questions.map((question) =>
              question.id === questionId
                ? {
                    ...question,
                    isActive: true,
                  }
                : question
            ),
          }
        : section
    )
  );
};

const addQuestionToSection = (sectionId: string) => {
  const input = newQuestionInputs[sectionId];
  if (!input?.label?.trim()) return;

  const newQuestion: ReviewQuestion = {
    id: `question_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    label: input.label.trim(),
    description: input.description.trim(),
    isDefault: false,
    isActive: true,
  };

  setReviewSections((prev) =>
    prev.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            questions: [...section.questions, newQuestion],
          }
        : section
    )
  );

  setQuestionState((prev) => ({
    ...prev,
    [newQuestion.id]: {
      checked: false,
      comment: '',
      attachments: [],
    },
  }));

  setNewQuestionInputs((prev) => ({
    ...prev,
    [sectionId]: { label: '', description: '' },
  }));
};

 const removeQuestionFromSection = (sectionId: string, questionId: string) => {
  setReviewSections((prev) =>
    prev.map((section) => {
      if (section.id !== sectionId) return section;

      return {
        ...section,
        questions: section.questions
          .map((question) => {
            if (question.id !== questionId) return question;

            if (question.isDefault) {
              return {
                ...question,
                isActive: false,
              };
            }

            return null;
          })
          .filter(Boolean) as ReviewQuestion[],
      };
    })
  );

  const removedQuestion = reviewSections
    .find((section) => section.id === sectionId)
    ?.questions.find((question) => question.id === questionId);

  if (!removedQuestion?.isDefault) {
    setQuestionState((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  }
};

  const handleApprove = () => {
    if (!selectedEnrolment) return;

    const flattenedChecklist: IndicatorChampionChecklistItem[] = reviewSections.flatMap(
      (section) =>
        section.questions.map((question) => ({
          criteriaId: question.id,
          criteriaName: question.label,
          sectionId: section.id,
          sectionTitle: section.title,
          isMet: questionState[question.id]?.checked || false,
          comments: questionState[question.id]?.comment || '',
          attachments: questionState[question.id]?.attachments || [],
        }))
    );

    const confirmationLetterUrl = URL.createObjectURL(
      new Blob(
        [
          `Confirmation Letter for learner enrolment ${selectedEnrolment.enrolmentId}
SDP Code: ${selectedEnrolment.sdpCode}
Qualification ID: ${selectedEnrolment.qualificationId}
Assessment Centre Code: ${selectedEnrolment.assessmentCentreCode}
Date Stamp: ${selectedEnrolment.dateStamp}`,
        ],
        { type: 'application/pdf' }
      )
    );

    const review: IndicatorChampionReview = {
      reviewedBy: currentUser?.name || 'Current User',
      reviewedAt: new Date().toISOString(),
      checklist: flattenedChecklist,
      decision: 'approved',
      comments: reviewComments,
      confirmationLetterUrl,
      sentAt: new Date().toISOString(),
    };

    const updatedEnrolment: LearnerEnrolmentBatch = {
      ...selectedEnrolment,
      indicatorChampionReview: review,
      status: 'Approved',
    };

    updateSelectedEnrolmentInStore(updatedEnrolment);
    setIsViewModalOpen(false);
  };

  const getStatusBadge = (status: LearnerEnrolmentBatchStatus) => {
    const statusConfig: Record<
      LearnerEnrolmentBatchStatus,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      Draft: {
        color: 'bg-gray-100 text-gray-800',
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Draft',
      },
      Submitted: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Submitted',
      },
      'Gate Evaluation Pending': {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Gate Evaluation Pending',
      },
      'Gate Evaluation In Progress': {
        color: 'bg-blue-100 text-blue-800',
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Gate Evaluation In Progress',
      },
      'Gate Evaluation Completed': {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        label: 'Gate Evaluation Completed',
      },
      'Pending Indicator Champion Review': {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Pending Review',
      },
      'Under Indicator Champion Review': {
        color: 'bg-blue-100 text-blue-800',
        icon: <Clock className="h-3 w-3 mr-1" />,
        label: 'Under Review',
      },
      Approved: {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        label: 'Approved',
      },
    };

    const config = statusConfig[status] || statusConfig['Pending Indicator Champion Review'];

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  const canStartReview = () => {
    return (
      currentUser?.role === 'Indicator Champion' &&
      selectedEnrolment?.status === 'Pending Indicator Champion Review'
    );
  };

  const canApprove = () => {
    return (
      currentUser?.role === 'Indicator Champion' &&
      selectedEnrolment?.status === 'Under Indicator Champion Review'
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Enrolment Intake Queue</h3>
      <p className="text-gray-600">
        Review learner enrolments using the exact generated external submission data.
      </p>

      {pendingReviewEnrolments.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Pending Enrolment Reviews</h4>
            <p className="text-sm text-gray-500">
              Learner enrolments ready for indicator champion review
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SDP Code</TableHead>
                <TableHead>Qualification ID</TableHead>
                <TableHead>Assessment Centre Code</TableHead>
                <TableHead>Date Stamp</TableHead>
                <TableHead>Learner Rows</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingReviewEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.sdpCode || '-'}</TableCell>
                  <TableCell>{enrolment.qualificationId || '-'}</TableCell>
                  <TableCell>{enrolment.assessmentCentreCode || '-'}</TableCell>
                  <TableCell>{enrolment.dateStamp || '-'}</TableCell>
                  <TableCell>{enrolment.learnerRows.length}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No pending enrolments for review.
        </div>
      )}

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enrolment Review</DialogTitle>
          </DialogHeader>

          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Learner Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation Check</TabsTrigger>
                <TabsTrigger value="report">Draft Report</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 py-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Submission Header</h3>
                      <p className="text-sm text-gray-600">
                        This matches the generated learner enrolment details from the external side.
                      </p>
                    </div>
                    {getStatusBadge(selectedEnrolment.status)}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-500">Enrolment ID</p>
                      <p className="font-medium">{selectedEnrolment.enrolmentId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">SDP Code</p>
                      <p className="font-medium">{selectedEnrolment.sdpCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Qualification ID</p>
                      <p className="font-medium">{selectedEnrolment.qualificationId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Assessment Centre Code</p>
                      <p className="font-medium">{selectedEnrolment.assessmentCentreCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date Stamp</p>
                      <p className="font-medium">{selectedEnrolment.dateStamp}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Uploaded File</p>
                      <p className="font-medium">
                        {selectedEnrolment.uploadedFileName || 'Manual only'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Submitted By</p>
                      <p className="font-medium">{selectedEnrolment.submittedBy || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Submitted At</p>
                      <p className="font-medium">
                        {selectedEnrolment.submittedAt
                          ? new Date(selectedEnrolment.submittedAt).toLocaleString()
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Learner Rows</h3>
                    <p className="text-sm text-gray-600">
                      These rows match the generated learner data from the external learner enrolment.
                    </p>
                  </div>

                  <div className="overflow-x-auto p-5">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>National ID</TableHead>
                          <TableHead>Alternate ID</TableHead>
                          <TableHead>Last Name</TableHead>
                          <TableHead>First Name</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Birth Date</TableHead>
                          <TableHead>Province</TableHead>
                          <TableHead>POPIA Agree</TableHead>
                          <TableHead>SOR Status</TableHead>
                          <TableHead>Readiness Type</TableHead>
                          <TableHead>FLC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEnrolment.learnerRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="py-10 text-center text-gray-500">
                              No learner rows found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          selectedEnrolment.learnerRows.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.nationalId || '-'}</TableCell>
                              <TableCell>{row.alternateId || '-'}</TableCell>
                              <TableCell>{row.lastName || '-'}</TableCell>
                              <TableCell>{row.firstName || '-'}</TableCell>
                              <TableCell>{genderLabelMap[row.gender] || row.gender || '-'}</TableCell>
                              <TableCell>{formatDisplayDate(row.birthDate)}</TableCell>
                              <TableCell>{provinceLabelMap[row.province] || row.province || '-'}</TableCell>
                              <TableCell>{row.popiaAgree || '-'}</TableCell>
                              <TableCell>
                                {sorStatusLabelMap[row.sorStatus] || row.sorStatus || '-'}
                              </TableCell>
                              <TableCell>
                                {readinessTypeLabelMap[row.readinessType] ||
                                  row.readinessType ||
                                  '-'}
                              </TableCell>
                              <TableCell>{flcLabelMap[row.flc] || row.flc || '-'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gateEvaluation" className="space-y-6 py-4">
                {!selectedEnrolment.gateEvaluation && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm text-gray-600">
                      No gate evaluation has been completed for this enrolment.
                    </p>
                  </div>
                )}

                {selectedEnrolment.gateEvaluation && (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-lg ${
                        selectedEnrolment.gateEvaluation.status === 'passed'
                          ? 'bg-green-50'
                          : 'bg-red-50'
                      }`}
                    >
                      <p
                        className={`font-medium ${
                          selectedEnrolment.gateEvaluation.status === 'passed'
                            ? 'text-green-800'
                            : 'text-red-800'
                        }`}
                      >
                        {selectedEnrolment.gateEvaluation.status === 'passed'
                          ? '✓ Gate Evaluation Passed'
                          : '✗ Gate Evaluation Failed'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Generated:{' '}
                        {selectedEnrolment.gateEvaluation.generatedAt
                          ? new Date(
                              selectedEnrolment.gateEvaluation.generatedAt
                            ).toLocaleString()
                          : '-'}
                      </p>
                    </div>

                    {selectedEnrolment.gateEvaluation.checklistResults?.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <h4 className="font-medium mb-3">Gate Evaluation Checklist Results</h4>
                        <div className="space-y-3">
                          {selectedEnrolment.gateEvaluation.checklistResults.map((item, idx) => (
                            <div
                              key={idx}
                              className={`rounded-xl border p-4 ${
                                item.isMet
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-red-200 bg-red-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {item.isMet ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="font-medium">{item.criteria}</span>
                              </div>
                              <p className="text-sm text-gray-700">{item.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEnrolment.gateEvaluation.failureReasons?.length > 0 && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                        <h4 className="font-medium text-red-900 mb-3">Failure Details</h4>
                        <div className="space-y-2">
                          {selectedEnrolment.gateEvaluation.failureReasons.map((reason, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-medium text-red-900"
                            >
                              {reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="report" className="space-y-5 py-4">
                {!selectedEnrolment.draftReport && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm text-gray-600">
                      No draft report is available for this enrolment.
                    </p>
                  </div>
                )}

                {selectedEnrolment.draftReport && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
                        <div>
                          <p className="font-semibold text-green-900">
                            Draft learner enrolment report generated
                          </p>
                          <p className="text-sm text-green-800">
                            This is the same full generated report data shown on the external side.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                      <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {selectedEnrolment.draftReport.reportTitle}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Generated learner enrolment validation report.
                          </p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                          <p className="text-gray-500">Generated</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(
                              selectedEnrolment.draftReport.generatedAt
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">Total Rows</p>
                          <p className="mt-1 text-2xl font-bold">
                            {selectedEnrolment.draftReport.summary.totalRows}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">Valid Rows</p>
                          <p className="mt-1 text-2xl font-bold text-green-700">
                            {selectedEnrolment.draftReport.summary.validRows}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">Invalid Rows</p>
                          <p className="mt-1 text-2xl font-bold text-red-700">
                            {selectedEnrolment.draftReport.summary.invalidRows}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">Method</p>
                          <p className="mt-1 font-semibold capitalize">
                            {selectedEnrolment.draftReport.summary.submissionMethod}
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">Uploaded File</p>
                          <p className="mt-1 font-semibold">
                            {selectedEnrolment.draftReport.summary.uploadedFileName ||
                              'Manual only'}
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="mb-3 text-base font-semibold text-gray-900">
                          Validation Checks
                        </h4>
                        <div className="space-y-3">
                          {selectedEnrolment.draftReport.validationChecks.map((check, index) => (
                            <div
                              key={index}
                              className={`rounded-xl border p-4 ${
                                check.isMet
                                  ? 'border-green-200 bg-green-50'
                                  : 'border-red-200 bg-red-50'
                              }`}
                            >
                              <div className="mb-1 flex items-center gap-2">
                                {check.isMet ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-700" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-700" />
                                )}
                                <p className="font-semibold text-gray-900">
                                  {check.criteria}
                                </p>
                              </div>
                              <p className="text-sm text-gray-700">{check.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-3 text-base font-semibold text-gray-900">
                          Report Notes
                        </h4>
                        <div className="space-y-2">
                          {selectedEnrolment.draftReport.notes.map((note, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                            >
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="review" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Manual Review</h3>

                  {canStartReview() && (
                    <div className="space-y-4">
                      <Button onClick={handleStartReview} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Review
                      </Button>
                    </div>
                  )}

                  {canApprove() && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <FolderPlus className="h-5 w-5 text-gray-700" />
                          <h4 className="font-medium text-gray-900">Checklist Sections</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <Label>New Section Title</Label>
                            <Input
                              value={newSectionTitle}
                              onChange={(e) => setNewSectionTitle(e.target.value)}
                              placeholder="Enter section title"
                            />
                          </div>
                          <div>
                            <Label>New Section Description</Label>
                            <Input
                              value={newSectionDescription}
                              onChange={(e) => setNewSectionDescription(e.target.value)}
                              placeholder="Enter section description"
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <Button type="button" variant="outline" onClick={addSection}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Section
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
  {hiddenDefaultSections.length > 0 && (
    <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5">
      <h4 className="font-medium text-amber-900 mb-3">Restore Default Sections</h4>
      <div className="flex flex-wrap gap-3">
        {hiddenDefaultSections.map((section) => (
          <Button
            key={section.id}
            type="button"
            variant="outline"
            onClick={() => restoreSection(section.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Back {section.title}
          </Button>
        ))}
      </div>
    </div>
  )}

  {hiddenDefaultQuestionsBySection.length > 0 && (
    <div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-5">
      <h4 className="font-medium text-blue-900 mb-3">Restore Default Questions</h4>
      <div className="space-y-4">
        {hiddenDefaultQuestionsBySection.map((section) => (
          <div key={section.sectionId}>
            <p className="text-sm font-medium text-blue-900 mb-2">{section.sectionTitle}</p>
            <div className="flex flex-wrap gap-3">
              {section.questions.map((question) => (
                <Button
                  key={question.id}
                  type="button"
                  variant="outline"
                  onClick={() => restoreQuestion(section.sectionId, question.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Back {question.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>

                      <div className="space-y-5">
                        
                        {reviewSections
  .filter((section) => section.isActive !== false)
  .map((section) => (
                          <div key={section.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                            <div className="mb-4 flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-semibold text-gray-900">{section.title}</h4>
                                <p className="text-sm text-gray-500">{section.description}</p>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSection(section.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Section
                              </Button>
                            </div>

                            <div className="mb-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div>
                                  <Label>Add Question</Label>
                                  <Input
                                    value={newQuestionInputs[section.id]?.label || ''}
                                    onChange={(e) =>
                                      setNewQuestionInputs((prev) => ({
                                        ...prev,
                                        [section.id]: {
                                          label: e.target.value,
                                          description: prev[section.id]?.description || '',
                                        },
                                      }))
                                    }
                                    placeholder="Enter question label"
                                  />
                                </div>
                                <div>
                                  <Label>Question Description</Label>
                                  <Input
                                    value={newQuestionInputs[section.id]?.description || ''}
                                    onChange={(e) =>
                                      setNewQuestionInputs((prev) => ({
                                        ...prev,
                                        [section.id]: {
                                          label: prev[section.id]?.label || '',
                                          description: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="Enter question description"
                                  />
                                </div>
                              </div>

                              <div className="mt-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => addQuestionToSection(section.id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Question
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {section.questions.filter((question) => question.isActive !== false).length === 0 ? (
  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500 text-center">
    No questions in this section yet.
  </div>
) : (
  section.questions
    .filter((question) => question.isActive !== false)
    .map((question) => (
                                  <div key={question.id} className="rounded-xl border border-gray-200 p-4">
                                    <div className="mb-3 flex items-start justify-between gap-4">
                                      <div className="flex items-start gap-3">
                                        <Checkbox
                                          id={question.id}
                                          checked={questionState[question.id]?.checked || false}
                                          onCheckedChange={(checked) =>
                                            updateQuestionCheck(question.id, checked === true)
                                          }
                                        />
                                        <div>
                                          <Label
                                            htmlFor={question.id}
                                            className="font-medium cursor-pointer text-gray-900"
                                          >
                                            {question.label}
                                          </Label>
                                          <p className="text-sm text-gray-500">
                                            {question.description}
                                          </p>
                                        </div>
                                      </div>

                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          removeQuestionFromSection(section.id, question.id)
                                        }
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove
                                      </Button>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <Label>Comment for this checklist item</Label>
                                        <Textarea
                                          value={questionState[question.id]?.comment || ''}
                                          onChange={(e) =>
                                            updateQuestionComment(question.id, e.target.value)
                                          }
                                          placeholder="Add additional context for this specific checklist item..."
                                          rows={3}
                                          className="mt-1"
                                        />
                                      </div>

                                      <div>
                                        <Label className="mb-2 block">
                                          Upload Supporting Documents
                                        </Label>
                                        <div className="flex flex-wrap items-center gap-3">
                                          <Input
                                            type="file"
                                            multiple
                                            onChange={(e) =>
                                              handleQuestionAttachmentUpload(question.id, e)
                                            }
                                            className="max-w-sm"
                                          />
                                          <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <Upload className="h-4 w-4" />
                                            Attach evidence directly to this checklist item
                                          </div>
                                        </div>

                                        {(questionState[question.id]?.attachments || []).length > 0 && (
                                          <div className="mt-3 space-y-2">
                                            {(questionState[question.id]?.attachments || []).map(
                                              (attachment) => (
                                                <div
                                                  key={attachment.id}
                                                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                                                >
                                                  <a
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                                                  >
                                                    <FileText className="h-4 w-4" />
                                                    {attachment.name}
                                                  </a>
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      removeAttachment(question.id, attachment.id)
                                                    }
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label>Overall Review Comments</Label>
                        <Textarea
                          value={reviewComments}
                          onChange={(e) => setReviewComments(e.target.value)}
                          placeholder="Add overall review comments..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>

                      <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                        <Send className="h-4 w-4 mr-2" />
                        Approve & Send Confirmation Letter
                      </Button>
                    </div>
                  )}

                  {selectedEnrolment.indicatorChampionReview?.decision === 'approved' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Enrolment Approved</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Confirmation letter sent to SDP Portfolio.
                      </p>
                      <a
                        href={selectedEnrolment.indicatorChampionReview.confirmationLetterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-2 mt-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Confirmation Letter
                      </a>
                    </div>
                  )}

                  {selectedEnrolment.status === 'Pending Indicator Champion Review' && (
                    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
                        <div>
                          <p className="font-semibold text-yellow-900">Ready for internal review</p>
                          <p className="text-sm text-yellow-800">
                            The generated learner enrolment details, gate evaluation data, and draft
                            report are available for review.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnrolmentIntakeQueue;