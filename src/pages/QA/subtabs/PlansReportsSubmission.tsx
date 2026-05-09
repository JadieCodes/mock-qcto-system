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
  Upload,
  Send,
  Clock,
  CheckCircle,
  User,
  Calendar,
  Users,
  ClipboardList,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
} from 'lucide-react';

type LearnerEnrolmentBatchStatus =
  | 'Draft'
  | 'Submitted'
  | 'Gate Evaluation Pending'
  | 'Gate Evaluation In Progress'
  | 'Gate Evaluation Completed'
  | 'Pending Indicator Champion Review'
  | 'Under Indicator Champion Review'
  | 'Approved'
  | 'Allocated to QA'
  | 'Pending QP Allocation'
  | 'Allocated to QP'
  | 'Plans & Reports Pending'
  | 'Plans & Reports Submitted'
  | 'Plans Consolidated'
  | 'Site Visit Pending'
  | 'Site Visit Scheduled'
  | 'Site Visit Completed'
  | 'SDP Gate Check Pending'
  | 'SDP Gate Check Completed'
  | 'Pending QA SP Validation'
  | 'Under QA SP Validation'
  | 'QA SP Validated'
  | 'Ready for Allocation'
  | 'Pending Quarterly Allocation'
  | 'Quarterly Allocation In Progress'
  | 'Allocation Populated'
  | 'Allocated for Monitoring'
  | 'Monitoring Plan Pending'
  | 'Monitoring Plan Submitted'
  | 'SDP Evidence Pending'
  | 'SDP Evidence Submitted'
  | 'Monitoring Report Pending'
  | 'Monitoring Report Completed'
  | 'Quarterly Report Pending'
  | 'Quarterly Report Submitted'
  | 'Pending Verification'
  | 'Under Verification'
  | 'Verified'
  | 'Pending Monthly Update'
  | 'Monthly Update In Progress'
  | 'Monthly Update Submitted'
  | 'Completed';

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

type AllocationInfo = {
  allocatedTo: string;
  allocatedAt: string;
  allocationNotes: string;
};

type QPAllocationInfo = {
  allocatedToRole: 'Quality Partner';
  allocatedToValue: string;
  allocatedToLabel: string;
  allocatedAt: string;
  allocationNotes: string;
  quarterlyPeriod: string;
};

type PlansReportsSubmissionInfo = {
  documentUrl: string;
  documentName: string;
  uploadedAt: string;
  uploadedBy: string;
  submittedAt: string;
  notes: string;
  scheduledSubmissionAt?: string;
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
  allocation?: AllocationInfo;
  qpAllocation?: QPAllocationInfo;
  plansReports?: PlansReportsSubmissionInfo;
  plansReportsHistory?: PlansReportsSubmissionInfo[];
};

const STORAGE_KEY = 'external_learner_enrolment_batches_v2';

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

const safeFormatDate = (dateString?: string | null) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return '-';
  }
};

const safeFormatDateTime = (dateString?: string | null) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return '-';
  }
};

const formatDisplayDate = (value?: string) => {
  if (!value) return '-';
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
};

const PlansReportsSubmission = () => {
  

  const [enrolments, setEnrolments] = useState<LearnerEnrolmentBatch[]>([]);
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolmentBatch | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportNotes, setReportNotes] = useState('');
  const [scheduledSubmissionAt, setScheduledSubmissionAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
const ENROLMENT_SYNC_EVENT = 'external-learner-enrolments-updated';

const persistEnrolments = (updated: LearnerEnrolmentBatch[]) => {
  setEnrolments(updated);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(ENROLMENT_SYNC_EVENT));
};
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

  const handleStorage = () => load();
  const handleSync = () => load();

  window.addEventListener('storage', handleStorage);
  window.addEventListener(ENROLMENT_SYNC_EVENT, handleSync as EventListener);
  window.addEventListener('focus', load);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(ENROLMENT_SYNC_EVENT, handleSync as EventListener);
    window.removeEventListener('focus', load);
  };
}, []);

 

 const { currentUser } = useApp();

const allocatedEnrolments = useMemo(() => {
  return enrolments.filter(
    (e) =>
      e.qpAllocation?.allocatedToRole === 'Quality Partner' &&
      (e.status === 'Allocated to QP' ||
        e.status === 'Plans & Reports Submitted')
  );
}, [enrolments]);

  const viewEnrolment = (enrolment: LearnerEnrolmentBatch) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setReportFile(null);
    setReportNotes('');
    setScheduledSubmissionAt(enrolment.plansReports?.scheduledSubmissionAt || '');
  };

  const updateSelectedEnrolmentInStore = (updatedEnrolment: LearnerEnrolmentBatch) => {
    const updated = enrolments.map((item) =>
      item.id === updatedEnrolment.id ? updatedEnrolment : item
    );
    persistEnrolments(updated);
    setSelectedEnrolment(updatedEnrolment);
  };

  const handleSubmitPlansReports = () => {
    if (!selectedEnrolment || !reportFile) return;

    setIsSubmitting(true);

    const submission: PlansReportsSubmissionInfo = {
      documentUrl: URL.createObjectURL(reportFile),
      documentName: reportFile.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Current User',
      submittedAt: new Date().toISOString(),
      notes: reportNotes,
      scheduledSubmissionAt,
    };

    const updatedEnrolment: LearnerEnrolmentBatch = {
      ...selectedEnrolment,
      plansReports: submission,
      plansReportsHistory: [...(selectedEnrolment.plansReportsHistory || []), submission],
      status: 'Plans & Reports Submitted',
    };

    updateSelectedEnrolmentInStore(updatedEnrolment);
    setIsSubmitting(false);
    setIsViewModalOpen(false);
    setReportFile(null);
    setReportNotes('');
    setScheduledSubmissionAt('');
  };

  const getStatusBadge = (status: LearnerEnrolmentBatchStatus) => {
    const statusConfig: Record<
      LearnerEnrolmentBatchStatus,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      Draft: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Draft' },
      Submitted: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Submitted' },
      'Gate Evaluation Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation Pending' },
      'Gate Evaluation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation In Progress' },
      'Gate Evaluation Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Gate Completed' },
      'Pending Indicator Champion Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Review' },
      'Under Indicator Champion Review': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Review' },
      Approved: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Approved' },
      'Allocated to QA': { color: 'bg-purple-100 text-purple-800', icon: <User className="h-3 w-3 mr-1" />, label: 'Allocated to QA' },
      'Pending QP Allocation': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending QP Allocation' },
      'Allocated to QP': { color: 'bg-blue-100 text-blue-800', icon: <User className="h-3 w-3 mr-1" />, label: 'Allocated to QP' },
      'Plans & Reports Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Plans Pending' },
      'Plans & Reports Submitted': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Plans Submitted' },
      'Plans Consolidated': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Plans Consolidated' },
      'Site Visit Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Site Visit Pending' },
      'Site Visit Scheduled': { color: 'bg-blue-100 text-blue-800', icon: <Calendar className="h-3 w-3 mr-1" />, label: 'Site Visit Scheduled' },
      'Site Visit Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Site Visit Completed' },
      'SDP Gate Check Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'SDP Gate Check Pending' },
      'SDP Gate Check Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Gate Check Completed' },
      'Pending QA SP Validation': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending QA SP Validation' },
      'Under QA SP Validation': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under QA SP Validation' },
      'QA SP Validated': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'QA SP Validated' },
      'Ready for Allocation': { color: 'bg-purple-100 text-purple-800', icon: <User className="h-3 w-3 mr-1" />, label: 'Ready for Allocation' },
      'Pending Quarterly Allocation': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Quarterly Allocation' },
      'Quarterly Allocation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Allocation In Progress' },
      'Allocation Populated': { color: 'bg-blue-100 text-blue-800', icon: <Users className="h-3 w-3 mr-1" />, label: 'Allocation Populated' },
      'Allocated for Monitoring': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Allocated for Monitoring' },
      'Monitoring Plan Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Monitoring Plan Pending' },
      'Monitoring Plan Submitted': { color: 'bg-blue-100 text-blue-800', icon: <ClipboardList className="h-3 w-3 mr-1" />, label: 'Monitoring Plan Submitted' },
      'SDP Evidence Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'SDP Evidence Pending' },
      'SDP Evidence Submitted': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'SDP Evidence Submitted' },
      'Monitoring Report Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Monitoring Report Pending' },
      'Monitoring Report Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Monitoring Report Completed' },
      'Quarterly Report Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Quarterly Report Pending' },
      'Quarterly Report Submitted': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Quarterly Report Submitted' },
      'Pending Verification': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Verification' },
      'Under Verification': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Verification' },
      Verified: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Verified' },
      'Pending Monthly Update': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Monthly Update' },
      'Monthly Update In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Monthly Update In Progress' },
      'Monthly Update Submitted': { color: 'bg-blue-100 text-blue-800', icon: <Calendar className="h-3 w-3 mr-1" />, label: 'Monthly Update Submitted' },
      Completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Completed' },
    };

    const config = statusConfig[status] || statusConfig['Plans & Reports Submitted'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

 const canSubmitPlans = () => {
  return selectedEnrolment?.status === 'Allocated to QP';
};

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Plans & Reports Submission</h3>
      <p className="text-gray-600">
        Submit consolidated plans and reports based on learner enrolments allocated to you
      </p>

      {allocatedEnrolments.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Enrolments Ready for Plans Submission</h4>
            <p className="text-sm text-gray-500">
              Submit consolidated plans and reports for each allocation
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SDP Code</TableHead>
                <TableHead>Qualification ID</TableHead>
                <TableHead>Assessment Centre Code</TableHead>
                <TableHead>Quarter</TableHead>
                <TableHead>QP Allocation Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plans History</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocatedEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.sdpCode || '-'}</TableCell>
                  <TableCell>{enrolment.qualificationId || '-'}</TableCell>
                  <TableCell>{enrolment.assessmentCentreCode || '-'}</TableCell>
                  <TableCell>{enrolment.qpAllocation?.quarterlyPeriod || '-'}</TableCell>
                  <TableCell>{safeFormatDate(enrolment.qpAllocation?.allocatedAt)}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>{enrolment.plansReportsHistory?.length || 0}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {enrolment.plansReports ? 'View / Resubmit' : 'Submit Plans'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No enrolments allocated to the Quality Partner role yet. Switch the external role selector to Quality Partner to view allocated submissions.
        </div>
      )}

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Plans & Reports</DialogTitle>
          </DialogHeader>

          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation</TabsTrigger>
                <TabsTrigger value="report">Draft Report</TabsTrigger>
                <TabsTrigger value="submission">Plans Submission</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 py-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Submission Header</h3>
                      <p className="text-sm text-gray-600">
                        Full enrolment submission details allocated to this Quality Partner.
                      </p>
                    </div>
                    {getStatusBadge(selectedEnrolment.status)}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div><p className="text-xs text-gray-500">Enrolment ID</p><p className="font-medium">{selectedEnrolment.enrolmentId}</p></div>
                    <div><p className="text-xs text-gray-500">SDP Code</p><p className="font-medium">{selectedEnrolment.sdpCode}</p></div>
                    <div><p className="text-xs text-gray-500">Qualification ID</p><p className="font-medium">{selectedEnrolment.qualificationId}</p></div>
                    <div><p className="text-xs text-gray-500">Assessment Centre Code</p><p className="font-medium">{selectedEnrolment.assessmentCentreCode}</p></div>
                    <div><p className="text-xs text-gray-500">Date Stamp</p><p className="font-medium">{selectedEnrolment.dateStamp}</p></div>
                    <div><p className="text-xs text-gray-500">Quarter</p><p className="font-medium">{selectedEnrolment.qpAllocation?.quarterlyPeriod || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">QP Allocation Simulation</p><p className="font-medium">{selectedEnrolment.qpAllocation?.allocatedToLabel || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Sent To Role</p><p className="font-medium">{selectedEnrolment.qpAllocation?.allocatedToRole || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">QP Allocation Date</p><p className="font-medium">{safeFormatDateTime(selectedEnrolment.qpAllocation?.allocatedAt)}</p></div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Learner Rows</h3>
                    <p className="text-sm text-gray-600">
                      These rows reflect the same learner data captured earlier in the process.
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
              </TabsContent>

              <TabsContent value="gateEvaluation" className="space-y-6 py-4">
                {!selectedEnrolment.gateEvaluation ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm text-gray-600">No gate evaluation has been completed for this enrolment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${selectedEnrolment.gateEvaluation.status === 'passed' ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className={`font-medium ${selectedEnrolment.gateEvaluation.status === 'passed' ? 'text-green-800' : 'text-red-800'}`}>
                        {selectedEnrolment.gateEvaluation.status === 'passed' ? '✓ Gate Evaluation Passed' : '✗ Gate Evaluation Failed'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Generated: {safeFormatDateTime(selectedEnrolment.gateEvaluation.generatedAt)}
                      </p>
                    </div>

                    {selectedEnrolment.gateEvaluation.checklistResults?.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <h4 className="font-medium mb-3">Gate Evaluation Checklist Results</h4>
                        <div className="space-y-3">
                          {selectedEnrolment.gateEvaluation.checklistResults.map((item, idx) => (
                            <div
                              key={idx}
                              className={`rounded-xl border p-4 ${item.isMet ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {item.isMet ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
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
                            <div key={idx} className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-medium text-red-900">
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
                {!selectedEnrolment.draftReport ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm text-gray-600">No draft report is available for this enrolment.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
                        <div>
                          <p className="font-semibold text-green-900">Draft learner enrolment report generated</p>
                          <p className="text-sm text-green-800">Full report data carried forward for the Quality Partner.</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                      <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedEnrolment.draftReport.reportTitle}</h3>
                          <p className="text-sm text-gray-600">Generated learner enrolment validation report.</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                          <p className="text-gray-500">Generated</p>
                          <p className="font-semibold text-gray-900">{safeFormatDateTime(selectedEnrolment.draftReport.generatedAt)}</p>
                        </div>
                      </div>

                      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Total Rows</p><p className="mt-1 text-2xl font-bold">{selectedEnrolment.draftReport.summary.totalRows}</p></div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Valid Rows</p><p className="mt-1 text-2xl font-bold text-green-700">{selectedEnrolment.draftReport.summary.validRows}</p></div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Invalid Rows</p><p className="mt-1 text-2xl font-bold text-red-700">{selectedEnrolment.draftReport.summary.invalidRows}</p></div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Method</p><p className="mt-1 font-semibold capitalize">{selectedEnrolment.draftReport.summary.submissionMethod}</p></div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Uploaded File</p><p className="mt-1 font-semibold">{selectedEnrolment.draftReport.summary.uploadedFileName || 'Manual only'}</p></div>
                      </div>

                      <div className="mb-6">
                        <h4 className="mb-3 text-base font-semibold text-gray-900">Validation Checks</h4>
                        <div className="space-y-3">
                          {selectedEnrolment.draftReport.validationChecks.map((check, index) => (
                            <div
                              key={index}
                              className={`rounded-xl border p-4 ${check.isMet ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                            >
                              <div className="mb-1 flex items-center gap-2">
                                {check.isMet ? <CheckCircle2 className="h-4 w-4 text-green-700" /> : <XCircle className="h-4 w-4 text-red-700" />}
                                <p className="font-semibold text-gray-900">{check.criteria}</p>
                              </div>
                              <p className="text-sm text-gray-700">{check.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-3 text-base font-semibold text-gray-900">Report Notes</h4>
                        <div className="space-y-2">
                          {selectedEnrolment.draftReport.notes.map((note, index) => (
                            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="submission" className="space-y-6 py-4">
                <div className="space-y-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <History className="h-5 w-5 text-gray-700" />
                      <h3 className="text-lg font-semibold text-gray-900">Report History</h3>
                    </div>

                    {selectedEnrolment.plansReportsHistory?.length ? (
                      <div className="space-y-3">
                        {selectedEnrolment.plansReportsHistory.map((historyItem, index) => (
                          <div key={`${historyItem.submittedAt}-${index}`} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium text-gray-900">{historyItem.documentName}</p>
                                <p className="text-sm text-gray-600">
                                  Uploaded by {historyItem.uploadedBy} on {safeFormatDateTime(historyItem.submittedAt)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Scheduled submission: {safeFormatDateTime(historyItem.scheduledSubmissionAt)}
                                </p>
                              </div>
                              <a
                                href={historyItem.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4" />
                                View
                              </a>
                            </div>
                            {historyItem.notes && (
                              <p className="mt-3 text-sm text-gray-600">Notes: {historyItem.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                        No previous report history is available yet.
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Submit Consolidated Plans & Reports
                    </h3>

                    {canSubmitPlans() && (
                      <div className="space-y-4">
                        <div>
                          <Label>Planned Submission Date & Time *</Label>
                          <Input
                            type="datetime-local"
                            value={scheduledSubmissionAt}
                            onChange={(e) => setScheduledSubmissionAt(e.target.value)}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Use this trigger field to capture the intended submission date and time.
                          </p>
                        </div>

                        <div>
                          <Label>Upload Consolidated Plan/Report *</Label>
                          <div className="flex items-center gap-4 mt-1">
                            <Input
                              type="file"
                              onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                              accept=".pdf,.doc,.docx"
                              className="flex-1"
                            />
                            <Button variant="outline" type="button" disabled={!reportFile}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Upload consolidated plan including: Training plan, Assessment schedule, Learner support plan, and Quality assurance report.
                          </p>
                        </div>

                        <div>
                          <Label>Additional Notes</Label>
                          <Textarea
                            value={reportNotes}
                            onChange={(e) => setReportNotes(e.target.value)}
                            placeholder="Add any additional information about your submission."
                            rows={3}
                            className="mt-1"
                          />
                        </div>

                        <Button
                          onClick={handleSubmitPlansReports}
                          disabled={!reportFile || !scheduledSubmissionAt || isSubmitting}
                          className="bg-green-600 hover:bg-green-700 w-full"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit Plans & Reports
                        </Button>
                      </div>
                    )}

                    {!canSubmitPlans() && !selectedEnrolment.plansReports && (
                      <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-700" />
                          <div>
                            <p className="font-semibold text-yellow-900">Submission not available</p>
                            <p className="text-sm text-yellow-800">
                              This record must be allocated to the external Quality Partner role before plans and reports can be submitted.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedEnrolment.plansReports && (
                      <div className="bg-blue-50 p-4 rounded-lg mt-5">
                        <p className="text-blue-800 font-medium">✓ Plans & Reports Submitted</p>
                        <a
                          href={selectedEnrolment.plansReports.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-2 mt-2"
                        >
                          <FileText className="h-4 w-4" />
                          {selectedEnrolment.plansReports.documentName}
                        </a>
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted on: {safeFormatDateTime(selectedEnrolment.plansReports.submittedAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Planned submission: {safeFormatDateTime(selectedEnrolment.plansReports.scheduledSubmissionAt)}
                        </p>
                        {selectedEnrolment.plansReports.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            Notes: {selectedEnrolment.plansReports.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansReportsSubmission;