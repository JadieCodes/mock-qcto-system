// screens/ExternalLearnerEnrolment.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus,
  Eye,
  Upload,
  FileText,
  Play,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Save,
  Send,
} from 'lucide-react';

type LearnerEnrolmentBatchStatus =
  | 'Draft'
  | 'Submitted'
  | 'Gate Evaluation Pending'
  | 'Gate Evaluation In Progress'
  | 'Gate Evaluation Completed'
  | 'Pending Indicator Champion Review';

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
};

const STORAGE_KEY = 'external_learner_enrolment_batches_v2';

const initialLearnerForm: LearnerRow = {
  id: '',
  nationalId: '',
  alternateId: '',
  lastName: '',
  firstName: '',
  gender: 'M',
  birthDate: '',
  province: '7',
  popiaAgree: 'Yes',
  sorStatus: '02',
  readinessType: '1',
  flc: '01',

  alternativeIdType: '533',
  middleName: '',
  title: 'Mr',
  popiaDate: '',
  sorIssueDate: '',
  flcStatementNumber: '',
  homeLanguage: 'Eng',
  nationality: 'SA',
  citizenStatus: 'SA',
  socioeconomicStatus: '06',
  disabilityStatus: 'N',
  disabilityRating: '',
  immigrantStatus: '03',
  equityCode: 'BA',
  homeAddress1: '',
  homeAddress2: '',
  homeAddress3: '',
  postalAddress1: '',
  postalAddress2: '',
  postalAddress3: '',
  homePostalCode: '',
  postalCode: '',
  phoneNumber: '',
  cellPhoneNumber: '',
  emailAddress: '',
  statssaAreaCode: '',
  expectedTrainingCompletionDate: '',
};

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

const createEnrolmentId = () =>
  `ENR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const createBatchId = () =>
  `BATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const ExternalLearnerEnrolment = () => {
  const { currentUser } = useApp();

  const [enrolments, setEnrolments] = useState<LearnerEnrolmentBatch[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolmentBatch | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showRowsTable, setShowRowsTable] = useState(true);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const [batchForm, setBatchForm] = useState({
    sdpCode: '',
    qualificationId: '',
    assessmentCentreCode: '',
    dateStamp: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
  });

  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const [learnerRows, setLearnerRows] = useState<LearnerRow[]>([]);
  const [learnerForm, setLearnerForm] = useState<LearnerRow>({
    ...initialLearnerForm,
    popiaDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
  });

  const [recordStatus, setRecordStatus] = useState<LearnerEnrolmentBatchStatus>('Draft');
  const [gateSimulationChoice, setGateSimulationChoice] = useState<'passed' | 'failed'>('passed');
  const [gateEvaluation, setGateEvaluation] = useState<LearnerEnrolmentBatch['gateEvaluation']>(null);
  const [draftReport, setDraftReport] = useState<DraftReport | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEnrolments(JSON.parse(saved));
      } catch {
        setEnrolments([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enrolments));
  }, [enrolments]);

  const submissionMethod = useMemo<'manual' | 'upload' | 'mixed'>(() => {
    if (uploadedDocument && learnerRows.length > 0) {
      const hasUploadRows = learnerRows.some((row) => row.id.startsWith('SIM-'));
      const hasManualRows = learnerRows.some((row) => row.id.startsWith('MAN-'));
      if (hasUploadRows && hasManualRows) return 'mixed';
      if (hasUploadRows) return 'upload';
      return 'manual';
    }
    if (uploadedDocument) return 'upload';
    return 'manual';
  }, [uploadedDocument, learnerRows]);

  const resetForm = () => {
    setEditingId(null);
    setBatchForm({
      sdpCode: '',
      qualificationId: '',
      assessmentCentreCode: '',
      dateStamp: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    });
    setUploadedDocument(null);
    setLearnerRows([]);
    setLearnerForm({
      ...initialLearnerForm,
      popiaDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    });
    setRecordStatus('Draft');
    setGateSimulationChoice('passed');
    setGateEvaluation(null);
    setDraftReport(null);
    setActiveTab('details');
    setShowRowsTable(true);
    setIsManualEntryOpen(false);
  };

  const handleBatchInputChange = (name: keyof typeof batchForm, value: string) => {
    setBatchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLearnerInputChange = (name: keyof LearnerRow, value: string) => {
    setLearnerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDisplayDate = (value?: string) => {
    if (!value) return '-';
    if (/^\d{8}$/.test(value)) {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }
    return value;
  };

  const createMockLearner = (index: number): LearnerRow => {
    const suffix = index + 1;
    const month = `${(suffix % 9) + 1}`.padStart(2, '0');
    const day = `${(suffix % 27) + 1}`.padStart(2, '0');

    return {
      id: `SIM-${Date.now()}-${suffix}`,
      nationalId: `99010${suffix}${month}${day}080${suffix}`.slice(0, 13),
      alternateId: '',
      lastName: `Learner ${suffix}`,
      firstName: `Demo ${suffix}`,
      gender: suffix % 2 === 0 ? 'F' : 'M',
      birthDate: `199${suffix}${month}${day}`.slice(0, 8),
      province: suffix % 2 === 0 ? '7' : '5',
      popiaAgree: 'Yes',
      sorStatus: suffix % 2 === 0 ? '01' : '02',
      readinessType: `${((suffix - 1) % 6) + 1}`,
      flc: suffix % 2 === 0 ? '02' : '01',

      alternativeIdType: '533',
      middleName: '',
      title: suffix % 2 === 0 ? 'Ms' : 'Mr',
      popiaDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      sorIssueDate: suffix % 2 === 0 ? `202501${day}` : '',
      flcStatementNumber: suffix % 2 === 0 ? `RPL202501${day}` : `FLC-SOR-${100 + suffix}`,
      homeLanguage: 'Eng',
      nationality: 'SA',
      citizenStatus: 'SA',
      socioeconomicStatus: '06',
      disabilityStatus: 'N',
      disabilityRating: '',
      immigrantStatus: '03',
      equityCode: suffix % 2 === 0 ? 'BC' : 'BA',
      homeAddress1: `${100 + suffix} Main Street`,
      homeAddress2: 'Johannesburg',
      homeAddress3: '',
      postalAddress1: `${100 + suffix} Main Street`,
      postalAddress2: 'Johannesburg',
      postalAddress3: '',
      homePostalCode: `200${suffix}`,
      postalCode: `200${suffix}`,
      phoneNumber: `01155510${suffix}`,
      cellPhoneNumber: `08255510${suffix}`,
      emailAddress: `learner${suffix}@example.com`,
      statssaAreaCode: `799000${suffix}`,
      expectedTrainingCompletionDate: `202512${day}`,
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedDocument(file);

    const simulatedRows = [createMockLearner(0), createMockLearner(1), createMockLearner(2)];
    setLearnerRows((prev) => {
      const manualRows = prev.filter((row) => row.id.startsWith('MAN-'));
      return [...manualRows, ...simulatedRows];
    });

    if (recordStatus === 'Draft') {
      setRecordStatus('Draft');
    }

    setNotification({
      type: 'info',
      title: 'Document uploaded',
      message: 'Learner rows were simulated from the uploaded document/template.',
    });
  };

  const handleAddManualLearner = () => {
    const requiredValues = [
      learnerForm.lastName,
      learnerForm.firstName,
      learnerForm.gender,
      learnerForm.birthDate,
      learnerForm.province,
      learnerForm.popiaAgree,
      learnerForm.sorStatus,
      learnerForm.readinessType,
      learnerForm.flc,
    ];

    if (!requiredValues.every((value) => String(value).trim() !== '')) {
      setNotification({
        type: 'error',
        title: 'Missing learner data',
        message: 'Please complete the key learner fields before adding the learner row.',
      });
      return;
    }

    const newRow: LearnerRow = {
      ...learnerForm,
      id: `MAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    setLearnerRows((prev) => [...prev, newRow]);
    setLearnerForm({
      ...initialLearnerForm,
      popiaDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    });
    setIsManualEntryOpen(false);

    setNotification({
      type: 'success',
      title: 'Learner row added',
      message: 'The learner row was added successfully.',
    });
  };

  const buildDraftReport = (): DraftReport => {
    return {
      id: `REPORT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      reportTitle: 'Draft Learner Enrolment Report',
      summary: {
        totalRows: learnerRows.length,
        validRows: learnerRows.length,
        invalidRows: 0,
        uploadedFileName: uploadedDocument?.name,
        submissionMethod,
      },
      validationChecks: [
        {
          criteria: 'Fixed columns and correct column order',
          isMet: true,
          detail: 'The learner enrolment batch follows the required fixed structure and column order.',
        },
        {
          criteria: 'Exact codes validation',
          isMet: true,
          detail: 'Province, SOR status, readiness type, FLC and other coded fields passed validation.',
        },
        {
          criteria: 'Exact text and date format validation',
          isMet: true,
          detail: 'Critical text and YYYYMMDD date fields passed the validation simulation.',
        },
        {
          criteria: 'Required learner data presence',
          isMet: true,
          detail: 'Required learner identity and readiness fields were present in the batch.',
        },
      ],
      notes: [
        'This is a simulated draft learner enrolment report.',
        'Learner rows from uploaded files are currently simulated for demo purposes.',
        'The batch is ready for QA submission only after the gate evaluation and report are complete.',
      ],
    };
  };

  const canSubmitCore = () => {
    return (
      batchForm.sdpCode.trim() &&
      batchForm.qualificationId.trim() &&
      batchForm.assessmentCentreCode.trim() &&
      batchForm.dateStamp.trim() &&
      learnerRows.length > 0
    );
  };

  const handleSaveDraft = () => {
    if (!batchForm.sdpCode && !batchForm.qualificationId && !batchForm.assessmentCentreCode && learnerRows.length === 0) {
      setNotification({
        type: 'error',
        title: 'Nothing to save',
        message: 'Please capture some enrolment information before saving as draft.',
      });
      return;
    }

    const savedAt = new Date().toISOString();

    if (editingId) {
      setEnrolments((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                sdpCode: batchForm.sdpCode,
                qualificationId: batchForm.qualificationId,
                assessmentCentreCode: batchForm.assessmentCentreCode,
                dateStamp: batchForm.dateStamp,
                uploadedFileName: uploadedDocument?.name,
                learnerRows,
                savedAt,
                status:
                  item.status === 'Pending Indicator Champion Review'
                    ? 'Pending Indicator Champion Review'
                    : 'Draft',
                gateEvaluation,
                draftReport,
              }
            : item
        )
      );
    } else {
      const newDraft: LearnerEnrolmentBatch = {
        id: createBatchId(),
        enrolmentId: createEnrolmentId(),
        sdpCode: batchForm.sdpCode,
        qualificationId: batchForm.qualificationId,
        assessmentCentreCode: batchForm.assessmentCentreCode,
        dateStamp: batchForm.dateStamp,
        uploadedFileName: uploadedDocument?.name,
        learnerRows,
        status: 'Draft',
        submittedBy: currentUser?.name || 'Current User',
        submittedAt: '',
        savedAt,
        gateEvaluation,
        draftReport,
      };
      setEnrolments((prev) => [newDraft, ...prev]);
      setEditingId(newDraft.id);
    }

    setRecordStatus('Draft');
    setNotification({
      type: 'success',
      title: 'Draft saved',
      message: 'The learner enrolment draft was saved. You can continue later.',
    });
  };

  const handleSubmit = () => {
    if (!canSubmitCore()) {
      setNotification({
        type: 'error',
        title: 'Missing submission details',
        message:
          'Please complete SDP Code, Qualification ID, Assessment Centre Code, Date Stamp, and add learner rows before submitting.',
      });
      return;
    }

    const submittedAt = new Date().toISOString();

    if (editingId) {
      setEnrolments((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                sdpCode: batchForm.sdpCode,
                qualificationId: batchForm.qualificationId,
                assessmentCentreCode: batchForm.assessmentCentreCode,
                dateStamp: batchForm.dateStamp,
                uploadedFileName: uploadedDocument?.name,
                learnerRows,
                submittedAt,
                status:
                  item.status === 'Pending Indicator Champion Review'
                    ? 'Pending Indicator Champion Review'
                    : 'Submitted',
              }
            : item
        )
      );
    } else {
      const newSubmission: LearnerEnrolmentBatch = {
        id: createBatchId(),
        enrolmentId: createEnrolmentId(),
        sdpCode: batchForm.sdpCode,
        qualificationId: batchForm.qualificationId,
        assessmentCentreCode: batchForm.assessmentCentreCode,
        dateStamp: batchForm.dateStamp,
        uploadedFileName: uploadedDocument?.name,
        learnerRows,
        status: 'Submitted',
        submittedBy: currentUser?.name || 'Current User',
        submittedAt,
        gateEvaluation: null,
        draftReport: null,
      };
      setEnrolments((prev) => [newSubmission, ...prev]);
      setEditingId(newSubmission.id);
    }

    setRecordStatus('Submitted');
    setActiveTab('gateEvaluation');
    setNotification({
      type: 'success',
      title: 'Enrolment submitted',
      message: 'The data was submitted. You can now run the gate evaluation and generate the report.',
    });
  };

  const handleRunGateEvaluation = () => {
    if (!editingId && !canSubmitCore()) {
      setNotification({
        type: 'error',
        title: 'Submit first',
        message: 'Please save or submit the enrolment details before running gate evaluation.',
      });
      return;
    }

    setRecordStatus('Gate Evaluation In Progress');

    const generatedAt = new Date().toISOString();

    if (gateSimulationChoice === 'failed') {
      const failedResults: GateCheckItem[] = [
        {
          criteria: 'Fixed columns/order',
          isMet: false,
          detail: 'The submission failed the fixed columns and ordering validation simulation.',
        },
        {
          criteria: 'Exact codes',
          isMet: false,
          detail: 'The submission failed the coded field validation simulation.',
        },
        {
          criteria: 'Exact text/date formats',
          isMet: false,
          detail: 'The submission failed the text/date formatting validation simulation.',
        },
      ];

      const failedGate = {
        status: 'failed' as GateOutcome,
        generatedAt,
        checklistResults: failedResults,
        failureReasons: ['fixed columns/order', 'exact codes', 'exact text/date formats'],
      };

      setGateEvaluation(failedGate);
      setDraftReport(null);
      setRecordStatus('Gate Evaluation Completed');

      if (editingId) {
        setEnrolments((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  gateEvaluation: failedGate,
                  draftReport: null,
                  status: 'Gate Evaluation Completed',
                }
              : item
          )
        );
      }

      setNotification({
        type: 'error',
        title: 'Gate evaluation failed',
        message:
          'Validation failed due to fixed columns/order, exact codes, and exact text/date formats.',
      });

      return;
    }

    const report = buildDraftReport();
    const passedChecks = report.validationChecks.map((item) => ({
      criteria: item.criteria,
      isMet: item.isMet,
      detail: item.detail,
    }));

    const passedGate = {
      status: 'passed' as GateOutcome,
      generatedAt,
      checklistResults: passedChecks,
      failureReasons: [],
    };

    setGateEvaluation(passedGate);
    setDraftReport(report);
    setRecordStatus('Gate Evaluation Completed');

    if (editingId) {
      setEnrolments((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                gateEvaluation: passedGate,
                draftReport: report,
                status: 'Gate Evaluation Completed',
              }
            : item
        )
      );
    }

    setNotification({
      type: 'success',
      title: 'Gate evaluation completed',
      message: 'Gate evaluation passed and the draft learner enrolment report was generated.',
    });
  };

  const handleSubmitToQA = () => {
    if (!editingId) {
      setNotification({
        type: 'error',
        title: 'Save or submit first',
        message: 'Please save or submit the enrolment before sending it to QA.',
      });
      return;
    }

    const canGoToQA =
      gateEvaluation?.status === 'passed' &&
      !!draftReport;

    if (!canGoToQA) {
      setNotification({
        type: 'error',
        title: 'QA submission blocked',
        message: 'You cannot submit to QA unless the gate evaluation is completed and the report exists.',
      });
      return;
    }

    setEnrolments((prev) =>
      prev.map((item) =>
        item.id === editingId
          ? {
              ...item,
              status: 'Pending Indicator Champion Review',
              gateEvaluation,
              draftReport,
            }
          : item
      )
    );

    setRecordStatus('Pending Indicator Champion Review');

    setNotification({
      type: 'success',
      title: 'Submitted to QA',
      message: 'The learner enrolment was submitted to QA and remains available in this table.',
    });

    setIsFormOpen(false);
    resetForm();
  };

  const openForEdit = (enrolment: LearnerEnrolmentBatch) => {
    setEditingId(enrolment.id);
    setBatchForm({
      sdpCode: enrolment.sdpCode,
      qualificationId: enrolment.qualificationId,
      assessmentCentreCode: enrolment.assessmentCentreCode,
      dateStamp: enrolment.dateStamp,
    });
    setUploadedDocument(
      enrolment.uploadedFileName
        ? ({ name: enrolment.uploadedFileName } as File)
        : null
    );
    setLearnerRows(enrolment.learnerRows || []);
    setRecordStatus(enrolment.status);
    setGateEvaluation(enrolment.gateEvaluation);
    setDraftReport(enrolment.draftReport);
    setIsFormOpen(true);
    setActiveTab('details');
  };

  const viewEnrolment = (enrolment: LearnerEnrolmentBatch) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
  };

  const getStatusBadge = (status: LearnerEnrolmentBatchStatus) => {
    const statusConfig: Record<LearnerEnrolmentBatchStatus, { color: string; label: string }> = {
      Draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      Submitted: { color: 'bg-yellow-100 text-yellow-800', label: 'Submitted' },
      'Gate Evaluation Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Gate Evaluation Pending' },
      'Gate Evaluation In Progress': { color: 'bg-blue-100 text-blue-800', label: 'Gate Evaluation In Progress' },
      'Gate Evaluation Completed': { color: 'bg-green-100 text-green-800', label: 'Gate Evaluation Completed' },
      'Pending Indicator Champion Review': { color: 'bg-purple-100 text-purple-800', label: 'Pending QA Review' },
    };

    const config = statusConfig[status] || statusConfig.Draft;

    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`rounded-xl border p-4 ${
            notification.type === 'error'
              ? 'border-red-200 bg-red-50'
              : notification.type === 'success'
              ? 'border-green-200 bg-green-50'
              : 'border-blue-200 bg-blue-50'
          }`}
        >
          <div className="flex items-start gap-3">
            {notification.type === 'error' ? (
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            ) : notification.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
            ) : (
              <FileText className="mt-0.5 h-5 w-5 text-blue-600" />
            )}
            <div>
              <p className="font-semibold text-gray-900">{notification.title}</p>
              <p className="text-sm text-gray-700">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Learner Enrolment</h2>
          <p className="text-gray-600 mt-1">Submit learner enrolment applications</p>
        </div>

        <Dialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Learner Enrolment
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-7xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Continue Learner Enrolment' : 'Create Learner Enrolment'}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Learner Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation Check</TabsTrigger>
                <TabsTrigger value="report">Draft Report</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 py-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Top Section</h3>
                      <p className="text-sm text-gray-600">
                        Capture the submission details, upload the document, or add learners manually.
                      </p>
                    </div>
                    {getStatusBadge(recordStatus)}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <Label>SDP Code *</Label>
                      <Input
                        value={batchForm.sdpCode}
                        onChange={(e) => handleBatchInputChange('sdpCode', e.target.value)}
                        placeholder="Enter SDP Code"
                      />
                    </div>
                    <div>
                      <Label>Qualification ID *</Label>
                      <Input
                        value={batchForm.qualificationId}
                        onChange={(e) => handleBatchInputChange('qualificationId', e.target.value)}
                        placeholder="Enter Qualification ID"
                      />
                    </div>
                    <div>
                      <Label>Assessment Centre Code *</Label>
                      <Input
                        value={batchForm.assessmentCentreCode}
                        onChange={(e) => handleBatchInputChange('assessmentCentreCode', e.target.value)}
                        placeholder="Enter Assessment Centre Code"
                      />
                    </div>
                    <div>
                      <Label>Date Stamp *</Label>
                      <Input
                        value={batchForm.dateStamp}
                        onChange={(e) =>
                          handleBatchInputChange(
                            'dateStamp',
                            e.target.value.replace(/[^0-9]/g, '').slice(0, 8)
                          )
                        }
                        placeholder="YYYYMMDD"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-end gap-3">
                    <div className="min-w-[260px]">
                      <Label className="mb-2 block">Upload Excel / Document</Label>
                      <Input
                        type="file"
                        accept=".xlsx,.xls,.csv,.pdf"
                        onChange={handleFileUpload}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => setIsManualEntryOpen((prev) => !prev)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Learner Manually
                    </Button>
                  </div>

                  {uploadedDocument && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span className="font-medium">Uploaded document:</span>
                        <span>{uploadedDocument.name}</span>
                      </div>
                      <p className="mt-1 text-blue-800">
                        Learner rows are being simulated from the uploaded document.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{learnerRows.length} learner row(s) currently added</span>
                    </div>
                  </div>
                </div>

                {isManualEntryOpen && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Manual Learner Entry</h3>
                      <p className="text-sm text-gray-600">
                        Capture the learner fields and add them into the learner row batch.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="mb-3 text-base font-semibold text-gray-900">Learner Identity</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <Label>National ID</Label>
                            <Input
                              value={learnerForm.nationalId}
                              onChange={(e) => handleLearnerInputChange('nationalId', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Alternate ID</Label>
                            <Input
                              value={learnerForm.alternateId}
                              onChange={(e) => handleLearnerInputChange('alternateId', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Last Name</Label>
                            <Input
                              value={learnerForm.lastName}
                              onChange={(e) => handleLearnerInputChange('lastName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>First Name</Label>
                            <Input
                              value={learnerForm.firstName}
                              onChange={(e) => handleLearnerInputChange('firstName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Gender</Label>
                            <select
                              value={learnerForm.gender}
                              onChange={(e) => handleLearnerInputChange('gender', e.target.value)}
                              className="w-full rounded-md border p-2"
                            >
                              <option value="M">Male</option>
                              <option value="F">Female</option>
                            </select>
                          </div>
                          <div>
                            <Label>Birth Date</Label>
                            <Input
                              value={learnerForm.birthDate}
                              onChange={(e) =>
                                handleLearnerInputChange(
                                  'birthDate',
                                  e.target.value.replace(/[^0-9]/g, '').slice(0, 8)
                                )
                              }
                              placeholder="YYYYMMDD"
                            />
                          </div>
                          <div>
                            <Label>Province</Label>
                            <select
                              value={learnerForm.province}
                              onChange={(e) => handleLearnerInputChange('province', e.target.value)}
                              className="w-full rounded-md border p-2"
                            >
                              <option value="1">Western Cape</option>
                              <option value="2">Eastern Cape</option>
                              <option value="3">Northern Cape</option>
                              <option value="4">Free State</option>
                              <option value="5">KwaZulu-Natal</option>
                              <option value="6">North West</option>
                              <option value="7">Gauteng</option>
                              <option value="8">Mpumalanga</option>
                              <option value="9">Limpopo</option>
                              <option value="N">SA National</option>
                              <option value="X">Outside SA</option>
                            </select>
                          </div>
                          <div>
                            <Label>POPIA Agree</Label>
                            <select
                              value={learnerForm.popiaAgree}
                              onChange={(e) => handleLearnerInputChange('popiaAgree', e.target.value)}
                              className="w-full rounded-md border p-2"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                          <div>
                            <Label>SOR Status</Label>
                            <select
                              value={learnerForm.sorStatus}
                              onChange={(e) => handleLearnerInputChange('sorStatus', e.target.value)}
                              className="w-full rounded-md border p-2"
                            >
                              <option value="01">01 - Statement of Results issued</option>
                              <option value="02">02 - Statement of Results not yet issued</option>
                            </select>
                          </div>
                          <div>
                            <Label>Readiness Type</Label>
                            <select
                              value={learnerForm.readinessType}
                              onChange={(e) => handleLearnerInputChange('readinessType', e.target.value)}
                              className="w-full rounded-md border p-2"
                            >
                              <option value="1">1 - Enrolled</option>
                              <option value="2">2 - RPL for Access to EISA determined by SDP</option>
                              <option value="3">3 - Mixed Mode to EISA</option>
                              <option value="4">4 - SDP Training and assessment for readiness to EISA</option>
                              <option value="5">5 - SDP e-learning training and assessment for readiness to EISA</option>
                              <option value="6">6 - RPL by Assessment Partner / Quality Partner</option>
                            </select>
                          </div>
                          <div>
                            <Label>FLC</Label>
                            <select
                              value={learnerForm.flc}
                              onChange={(e) => handleLearnerInputChange('flc', e.target.value)}
                              className="w-full rounded-md border p-2"
                            >
                              <option value="01">01 - FLC certificate (competent)</option>
                              <option value="02">02 - RPL</option>
                              <option value="03">03 - Grade 12/NCV Level 4 pass</option>
                              <option value="04">04 - Not yet competent</option>
                              <option value="05">05 - FLC not completed yet</option>
                              <option value="06">06 - Not applicable</option>
                              <option value="07">07 - Enrolled for FLC</option>
                              <option value="08">08 - N3 Mathematics and Business Language</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 border-t pt-4">
                        <Button variant="outline" onClick={() => setIsManualEntryOpen(false)}>
                          Close Manual Form
                        </Button>
                        <Button onClick={handleAddManualLearner}>Add Learner Row</Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowRowsTable((prev) => !prev)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Learner Rows</h3>
                      <p className="text-sm text-gray-600">
                        Toggle the learner row table.
                      </p>
                    </div>
                    {showRowsTable ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>

                  {showRowsTable && (
                    <div className="border-t border-gray-200 p-5">
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
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
                            {learnerRows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={11} className="text-center text-gray-500 py-8">
                                  No learner rows yet. Upload a document or add learners manually.
                                </TableCell>
                              </TableRow>
                            ) : (
                              learnerRows.map((row) => (
                                <TableRow key={row.id}>
                                  <TableCell>{row.nationalId || '-'}</TableCell>
                                  <TableCell>{row.alternateId || '-'}</TableCell>
                                  <TableCell>{row.lastName || '-'}</TableCell>
                                  <TableCell>{row.firstName || '-'}</TableCell>
                                  <TableCell>{genderLabelMap[row.gender] || row.gender || '-'}</TableCell>
                                  <TableCell>{formatDisplayDate(row.birthDate)}</TableCell>
                                  <TableCell>{provinceLabelMap[row.province] || row.province || '-'}</TableCell>
                                  <TableCell>{row.popiaAgree || '-'}</TableCell>
                                  <TableCell>{sorStatusLabelMap[row.sorStatus] || row.sorStatus || '-'}</TableCell>
                                  <TableCell>{readinessTypeLabelMap[row.readinessType] || row.readinessType || '-'}</TableCell>
                                  <TableCell>{flcLabelMap[row.flc] || row.flc || '-'}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4 border-t pt-4">
                  <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="secondary" onClick={handleSaveDraft} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save as Draft
                  </Button>
                  <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                    Submit
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="gateEvaluation" className="space-y-6 py-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Gate Evaluation Check</h3>
                    <p className="text-sm text-gray-600">
                      Run the gate evaluation after the enrolment data has been submitted.
                    </p>
                  </div>

                  <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs text-gray-500">Current Status</p>
                        <p className="font-medium">{recordStatus}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Learner Rows</p>
                        <p className="font-medium">{learnerRows.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Uploaded Document</p>
                        <p className="font-medium">{uploadedDocument?.name || 'None'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Submission Method</p>
                        <p className="font-medium capitalize">{submissionMethod}</p>
                      </div>
                    </div>
                  </div>

                  {recordStatus === 'Draft' && (
                    <div className="mb-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-5 w-5 text-yellow-700" />
                        <div>
                          <p className="font-semibold text-yellow-900">Submit required</p>
                          <p className="text-sm text-yellow-800">
                            You must submit the enrolment details before gate evaluation can be completed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-5">
                    <Label className="mb-3 block">Simulation Outcome</Label>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant={gateSimulationChoice === 'passed' ? 'default' : 'outline'}
                        onClick={() => setGateSimulationChoice('passed')}
                        className="flex items-center gap-2"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Achieve Gate Evaluation
                      </Button>
                      <Button
                        type="button"
                        variant={gateSimulationChoice === 'failed' ? 'default' : 'outline'}
                        onClick={() => setGateSimulationChoice('failed')}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Fail Gate Evaluation
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleRunGateEvaluation} className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Run Gate Evaluation
                    </Button>
                  </div>

                  {gateEvaluation?.status === 'failed' && (
                    <div className="mt-5 space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5">
                      <div className="flex items-start gap-3">
                        <XCircle className="mt-0.5 h-5 w-5 text-red-700" />
                        <div>
                          <p className="font-semibold text-red-900">Gate evaluation failed</p>
                          <p className="text-sm text-red-800">
                            Validation failed for the following checks:
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {gateEvaluation.failureReasons.map((reason, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-medium text-red-900"
                          >
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gateEvaluation?.status === 'passed' && (
                    <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
                        <div>
                          <p className="font-semibold text-green-900">Gate evaluation completed</p>
                          <p className="text-sm text-green-800">
                            Validation passed and the draft learner enrolment report was generated.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="report" className="space-y-5 py-4">
                {!draftReport && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm text-gray-600">
                      No report generated yet. Submit the enrolment and complete the gate evaluation first.
                    </p>
                  </div>
                )}

                {draftReport && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
                        <div>
                          <p className="font-semibold text-green-900">Draft report generated</p>
                          <p className="text-sm text-green-800">
                            The gate evaluation passed and the report was created successfully.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                      <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{draftReport.reportTitle}</h3>
                          <p className="text-sm text-gray-600">
                            Validation summary for the simulated learner enrolment submission.
                          </p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                          <p className="text-gray-500">Generated</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(draftReport.generatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">Total Rows</p>
                          <p className="mt-1 text-2xl font-bold">{draftReport.summary.totalRows}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">Valid Rows</p>
                          <p className="mt-1 text-2xl font-bold text-green-700">{draftReport.summary.validRows}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">Invalid Rows</p>
                          <p className="mt-1 text-2xl font-bold text-red-700">{draftReport.summary.invalidRows}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">Method</p>
                          <p className="mt-1 font-semibold capitalize">{draftReport.summary.submissionMethod}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">Uploaded File</p>
                          <p className="mt-1 font-semibold">{draftReport.summary.uploadedFileName || 'Manual only'}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="mb-3 text-base font-semibold text-gray-900">Validation Checks</h4>
                        <div className="space-y-3">
                          {draftReport.validationChecks.map((check, index) => (
                            <div
                              key={index}
                              className={`rounded-xl border p-4 ${
                                check.isMet ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                              }`}
                            >
                              <div className="mb-1 flex items-center gap-2">
                                {check.isMet ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-700" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-700" />
                                )}
                                <p className="font-semibold text-gray-900">{check.criteria}</p>
                              </div>
                              <p className="text-sm text-gray-700">{check.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="mb-3 text-base font-semibold text-gray-900">Report Notes</h4>
                        <div className="space-y-2">
                          {draftReport.notes.map((note, index) => (
                            <div
                              key={index}
                              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
                            >
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 border-t pt-4">
                        <Button variant="secondary" onClick={handleSaveDraft} className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          Save as Draft
                        </Button>
                        <Button onClick={handleSubmitToQA} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Submit to QA
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SDP Code</TableHead>
              <TableHead>Qualification ID</TableHead>
              <TableHead>Assessment Centre Code</TableHead>
              <TableHead>Date Stamp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrolments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No enrolments yet. Click "Create Learner Enrolment" to create one.
                </TableCell>
              </TableRow>
            ) : (
              enrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell>{enrolment.sdpCode || '-'}</TableCell>
                  <TableCell>{enrolment.qualificationId || '-'}</TableCell>
                  <TableCell>{enrolment.assessmentCentreCode || '-'}</TableCell>
                  <TableCell>{enrolment.dateStamp || '-'}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    {enrolment.status !== 'Pending Indicator Champion Review' && (
                      <Button variant="ghost" size="sm" onClick={() => openForEdit(enrolment)}>
                        Continue
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Learner Enrolment Details</DialogTitle>
          </DialogHeader>

          {selectedEnrolment && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Learner Enrolment Details</TabsTrigger>
                <TabsTrigger value="gate">Gate Evaluation Check</TabsTrigger>
                <TabsTrigger value="report">Draft Report</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 py-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Submission Header</h3>
                      <p className="text-sm text-gray-600">Saved submission details.</p>
                    </div>
                    {getStatusBadge(selectedEnrolment.status)}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                      <p className="font-medium">{selectedEnrolment.uploadedFileName || 'Manual only'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Submitted By</p>
                      <p className="font-medium">{selectedEnrolment.submittedBy || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Submitted At</p>
                      <p className="font-medium">
                        {selectedEnrolment.submittedAt ? new Date(selectedEnrolment.submittedAt).toLocaleString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Learner Rows</p>
                      <p className="font-medium">{selectedEnrolment.learnerRows.length}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Learner Rows</h3>
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
                        {selectedEnrolment.learnerRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>{row.nationalId || '-'}</TableCell>
                            <TableCell>{row.alternateId || '-'}</TableCell>
                            <TableCell>{row.lastName || '-'}</TableCell>
                            <TableCell>{row.firstName || '-'}</TableCell>
                            <TableCell>{genderLabelMap[row.gender] || row.gender || '-'}</TableCell>
                            <TableCell>{formatDisplayDate(row.birthDate)}</TableCell>
                            <TableCell>{provinceLabelMap[row.province] || row.province || '-'}</TableCell>
                            <TableCell>{row.popiaAgree || '-'}</TableCell>
                            <TableCell>{sorStatusLabelMap[row.sorStatus] || row.sorStatus || '-'}</TableCell>
                            <TableCell>{readinessTypeLabelMap[row.readinessType] || row.readinessType || '-'}</TableCell>
                            <TableCell>{flcLabelMap[row.flc] || row.flc || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gate" className="space-y-6 py-4">
                {!selectedEnrolment.gateEvaluation && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm text-gray-600">No gate evaluation has been completed for this enrolment yet.</p>
                  </div>
                )}

                {selectedEnrolment.gateEvaluation?.status === 'passed' && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
                      <div>
                        <p className="font-semibold text-green-900">Gate evaluation completed</p>
                        <p className="text-sm text-green-800">This learner enrolment passed the validation simulation.</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedEnrolment.gateEvaluation?.status === 'failed' && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                      <div className="flex items-start gap-3">
                        <XCircle className="mt-0.5 h-5 w-5 text-red-700" />
                        <div>
                          <p className="font-semibold text-red-900">Gate evaluation failed</p>
                          <p className="text-sm text-red-800">This learner enrolment failed the validation simulation.</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                      <h4 className="mb-3 text-base font-semibold text-gray-900">Failure Details</h4>
                      <div className="space-y-2">
                        {selectedEnrolment.gateEvaluation.failureReasons.map((reason, index) => (
                          <div
                            key={index}
                            className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
                          >
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="report" className="space-y-6 py-4">
                {!selectedEnrolment.draftReport && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm text-gray-600">No draft report is available for this enrolment.</p>
                  </div>
                )}

                {selectedEnrolment.draftReport && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedEnrolment.draftReport.reportTitle}</h3>
                        <p className="text-sm text-gray-600">Generated learner enrolment validation report.</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                        <p className="text-gray-500">Generated</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedEnrolment.draftReport.generatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
    <p className="text-xs text-gray-500">Total Rows</p>
    <p className="mt-1 text-2xl font-bold">{selectedEnrolment.draftReport.summary.totalRows}</p>
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
      {selectedEnrolment.draftReport.summary.uploadedFileName || 'Manual only'}
    </p>
  </div>
</div>

                    <div className="space-y-3">
                      {selectedEnrolment.draftReport.validationChecks.map((check, index) => (
                        <div
                          key={index}
                          className={`rounded-xl border p-4 ${
                            check.isMet ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            {check.isMet ? (
                              <CheckCircle2 className="h-4 w-4 text-green-700" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-700" />
                            )}
                            <p className="font-semibold text-gray-900">{check.criteria}</p>
                          </div>
                          <p className="text-sm text-gray-700">{check.detail}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
  <h4 className="mb-3 text-base font-semibold text-gray-900">Report Notes</h4>
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
                  
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExternalLearnerEnrolment;