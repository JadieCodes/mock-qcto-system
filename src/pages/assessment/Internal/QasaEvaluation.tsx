// C:\Users\jadek\Desktop\my-cert-project\src\pages\assessment\Internal\QasaEvaluation.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  FileText,
  CheckCircle,
  ClipboardList,
  Send,
  ThumbsUp,
  ThumbsDown,
  Users,
  Award,
  FileSignature,
  CheckSquare,
  X,
  ArrowRightCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { QasaSubmission } from '../External/ExternalQasaAddendumSubmission';

const STORAGE_KEY = 'qasa_addendum_submissions';

type EvaluationStatus =
  | 'pending_asd_evaluation'
  | 'returned_to_qp_negative'
  | 'with_deputy_director'
  | 'with_iac'
  | 'with_ceo_final'
  | 'returned_to_asd_for_approval'
  | 'completed';

type WorkflowRole = 'asd' | 'dd' | 'iac' | 'ceo' | null;

type ExtendedQasaSubmission = Omit<QasaSubmission, 'evaluationStatus'> & {
  evaluationStatus: EvaluationStatus;
  asdEvaluationChecklist?: Record<string, boolean> | null;
  asdEvaluationNotes?: string;
  asdEvaluationOutcome?: 'positive' | 'negative' | null;
  evaluationReportName?: string | null;
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

const getWorkflowRole = (appRole: string): WorkflowRole => {
  if (appRole === 'ASD') return 'asd';
  if (appRole === 'Deputy Director') return 'dd';
  if (appRole === 'Internal Assessment Committee') return 'iac';
  if (appRole === 'CEO') return 'ceo';
  return null;
};

const normalizeEvaluationStatus = (sub: any): EvaluationStatus => {
  if (sub.evaluationStatus) {
    return sub.evaluationStatus as EvaluationStatus;
  }

  if (sub.movedToEvaluation === true || sub.acknowledgementStatus === 'sent_to_quality_partner') {
    return 'pending_asd_evaluation';
  }

  return 'pending_asd_evaluation';
};

export function QasaEvaluation() {
  const { currentRole } = useApp();
  const workflowRole = getWorkflowRole(currentRole);

  const [submissions, setSubmissions] = useState<ExtendedQasaSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ExtendedQasaSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluationType, setEvaluationType] = useState<'asd' | 'dd' | 'iac' | 'ceo' | null>(null);

  const [evaluationChecklist, setEvaluationChecklist] = useState<Record<string, boolean>>({});
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [evaluationReport, setEvaluationReport] = useState<File | null>(null);
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [outcomeLetter, setOutcomeLetter] = useState<File | null>(null);

  const qasaChecklistItems = [
    'Application form is complete and signed',
    'Qualification documents are valid and current',
    'Curriculum meets required standards',
    'Assessment specification is appropriate',
    'SAQA documentation is complete',
    'Quality assurance measures are in place',
    'Resources and capacity are adequate',
    'Previous compliance history reviewed',
  ];

  const ddChecklistItems = [
    'ASD evaluation report is thorough',
    'All checklist items were properly assessed',
    'Recommendations are appropriate',
    'Supporting evidence is sufficient',
    'Risk assessment is accurate',
  ];

  const iacChecklistItems = [
    'QASA presentation is complete and clear',
    'All documentation has been reviewed',
    'Quality standards are met',
    'Compliance requirements satisfied',
    'Resolution is properly documented',
  ];

  const ceoFinalChecklistItems = [
    'Complete evaluation package reviewed',
    'All approvals are in place',
    'Outcome letter is ready for signature',
    'Legal and compliance requirements met',
  ];

  useEffect(() => {
    loadSubmissions();

    const handleStorage = (e?: StorageEvent) => {
      if (!e || e.key === STORAGE_KEY) {
        loadSubmissions();
      }
    };

    window.addEventListener('storage', handleStorage);
    const interval = setInterval(loadSubmissions, 1000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const loadSubmissions = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setSubmissions([]);
      return;
    }

    const allSubmissions = JSON.parse(stored);

    const initialized: ExtendedQasaSubmission[] = allSubmissions.map((sub: any) => ({
      ...sub,
      evaluationStatus: normalizeEvaluationStatus(sub),
      asdEvaluationChecklist: sub.asdEvaluationChecklist || sub.evaluationChecklist || null,
      asdEvaluationNotes: sub.asdEvaluationNotes || '',
      asdEvaluationOutcome: sub.asdEvaluationOutcome || null,
      evaluationReportName: sub.evaluationReportName || null,
      ddEvaluationChecklist: sub.ddEvaluationChecklist || sub.ddEvaluationReview || null,
      ddReviewNotes: sub.ddReviewNotes || '',
      iacChecklist: sub.iacChecklist || null,
      iacPresentationName: sub.iacPresentationName || null,
      iacResolutionName: sub.iacResolutionName || null,
      iacApprovalNotes: sub.iacApprovalNotes || '',
      ceoFinalChecklist: sub.ceoFinalChecklist || null,
      ceoFinalNotes: sub.ceoFinalNotes || '',
      outcomeLetterName: sub.outcomeLetterName || null,
      movedToEvaluation: sub.movedToEvaluation || false,
      acknowledgementStatus: sub.acknowledgementStatus || 'pending',
    }));

    setSubmissions(initialized);
  };

  const updateSubmission = (updatedSubmission: ExtendedQasaSubmission) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allSubmissions = stored ? JSON.parse(stored) : [];

    const updatedSubmissions = allSubmissions.map((sub: any) =>
      sub.id === updatedSubmission.id ? updatedSubmission : sub
    );

    setSubmissions(updatedSubmissions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));

    const toast = document.createElement('div');
    toast.className =
      'fixed bottom-4 right-4 z-50 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg';
    toast.textContent = 'Workflow updated successfully';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  };

  const resetEvaluationState = () => {
    setEvaluationChecklist({});
    setEvaluationNotes('');
    setEvaluationReport(null);
    setPresentationFile(null);
    setResolutionFile(null);
    setOutcomeLetter(null);
    setEvaluationType(null);
  };

  const closeEvaluationModal = () => {
    setIsEvaluationModalOpen(false);
    resetEvaluationState();
  };

  const getEvaluationStatusBadge = (status: EvaluationStatus) => {
    const statusConfig: Record<
      EvaluationStatus,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      pending_asd_evaluation: { label: 'Pending ASD Evaluation', variant: 'secondary' },
      returned_to_qp_negative: { label: 'Returned to QP - Negative', variant: 'destructive' },
      with_deputy_director: { label: 'With Deputy Director', variant: 'outline' },
      with_iac: { label: 'With Internal Assessment Committee', variant: 'outline' },
      with_ceo_final: { label: 'With CEO Final Approval', variant: 'outline' },
      returned_to_asd_for_approval: {
        label: 'Returned to ASD for Approval Process',
        variant: 'default',
      },
      completed: { label: 'Moved to QASA Application Approval', variant: 'default' },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getRoleDisplayName = () => {
    switch (workflowRole) {
      case 'asd':
        return 'ASD';
      case 'dd':
        return 'Deputy Director';
      case 'iac':
        return 'Internal Assessment Committee';
      case 'ceo':
        return 'CEO';
      default:
        return currentRole || 'Unknown';
    }
  };

  const getSubmissionsForRole = () => {
    if (!workflowRole) return [];

    switch (workflowRole) {
      case 'asd':
        return submissions.filter(
          (s) =>
            s.evaluationStatus === 'pending_asd_evaluation' ||
            s.evaluationStatus === 'returned_to_qp_negative' ||
            s.evaluationStatus === 'returned_to_asd_for_approval'
        );
      case 'dd':
        return submissions.filter((s) => s.evaluationStatus === 'with_deputy_director');
      case 'iac':
        return submissions.filter((s) => s.evaluationStatus === 'with_iac');
      case 'ceo':
        return submissions.filter((s) => s.evaluationStatus === 'with_ceo_final');
      default:
        return [];
    }
  };

  const roleSubmissions = useMemo(getSubmissionsForRole, [submissions, workflowRole]);

  const openViewModal = (submission: ExtendedQasaSubmission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
  };

  const openEvaluationModal = (
    type: 'asd' | 'dd' | 'iac' | 'ceo',
    submission: ExtendedQasaSubmission
  ) => {
    setSelectedSubmission(submission);
    setEvaluationType(type);

    if (type === 'asd') {
      setEvaluationChecklist(submission.asdEvaluationChecklist || {});
      setEvaluationNotes(submission.asdEvaluationNotes || '');
    } else if (type === 'dd') {
      setEvaluationChecklist(submission.ddEvaluationChecklist || {});
      setEvaluationNotes(submission.ddReviewNotes || '');
    } else if (type === 'iac') {
      setEvaluationChecklist(submission.iacChecklist || {});
      setEvaluationNotes(submission.iacApprovalNotes || '');
    } else if (type === 'ceo') {
      setEvaluationChecklist(submission.ceoFinalChecklist || {});
      setEvaluationNotes(submission.ceoFinalNotes || '');
    }

    setEvaluationReport(null);
    setPresentationFile(null);
    setResolutionFile(null);
    setOutcomeLetter(null);
    setIsEvaluationModalOpen(true);
  };

  const handleASDEvaluation = (outcome: 'positive' | 'negative') => {
    if (!selectedSubmission) return;

    const updated: ExtendedQasaSubmission = {
      ...selectedSubmission,
      asdEvaluationChecklist: evaluationChecklist,
      asdEvaluationNotes: evaluationNotes,
      asdEvaluationOutcome: outcome,
      evaluationReportName: evaluationReport?.name || selectedSubmission.evaluationReportName || null,
      evaluationStatus: outcome === 'positive' ? 'with_deputy_director' : 'returned_to_qp_negative',
    };

    updateSubmission(updated);
    closeEvaluationModal();
    setIsViewModalOpen(false);
  };

  const handleDDReviewAndSendToIAC = () => {
    if (!selectedSubmission) return;

    const updated: ExtendedQasaSubmission = {
      ...selectedSubmission,
      ddEvaluationChecklist: evaluationChecklist,
      ddReviewNotes: evaluationNotes,
      evaluationStatus: 'with_iac',
    };

    updateSubmission(updated);
    closeEvaluationModal();
    setIsViewModalOpen(false);
  };

  const handleIACApprovalAndSendToCEO = () => {
    if (!selectedSubmission) return;

    const updated: ExtendedQasaSubmission = {
      ...selectedSubmission,
      iacChecklist: evaluationChecklist,
      iacPresentationName: presentationFile?.name || selectedSubmission.iacPresentationName || null,
      iacResolutionName: resolutionFile?.name || selectedSubmission.iacResolutionName || null,
      iacApprovalNotes: evaluationNotes,
      evaluationStatus: 'with_ceo_final',
    };

    updateSubmission(updated);
    closeEvaluationModal();
    setIsViewModalOpen(false);
  };

  const handleCEOFinalApproval = () => {
    if (!selectedSubmission) return;

    const updated: ExtendedQasaSubmission = {
      ...selectedSubmission,
      ceoFinalChecklist: evaluationChecklist,
      ceoFinalNotes: evaluationNotes,
      outcomeLetterName: outcomeLetter?.name || selectedSubmission.outcomeLetterName || null,
      evaluationStatus: 'returned_to_asd_for_approval',
      approvalStatus: 'pending_asd_draft' as const,
    };

    updateSubmission(updated);
    closeEvaluationModal();
    setIsViewModalOpen(false);
  };

  const handleMoveToApprovalProcess = () => {
    if (!selectedSubmission) return;

    const updated: ExtendedQasaSubmission = {
      ...selectedSubmission,
      evaluationStatus: 'completed',
      approvalStatus: selectedSubmission.approvalStatus || ('pending_asd_draft' as const),
    };

    updateSubmission(updated);
    setIsViewModalOpen(false);
  };

  const roleDescription = {
    asd: 'Conduct evaluation using the evaluation tool on the application and supporting documentation.',
    dd: 'Review the ASD evaluation report and evaluation checklist before sending to IAC.',
    iac: 'Review the QASA presentation, supporting information, and loaded resolution for approval.',
    ceo: 'Receive all documents and information, then approve and sign the outcome letter.',
  } as const;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <div>
          <p className="text-sm text-purple-800">
            Logged in as: <strong>{getRoleDisplayName()}</strong> - QASA Application Evaluation
          </p>
          <p className="mt-1 text-xs text-purple-600">
            {workflowRole
              ? roleDescription[workflowRole]
              : 'Select a supported workflow role to continue.'}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900">QASA Application Evaluation</h2>
        <p className="mt-1 text-sm text-gray-600">
          ASD evaluation, Deputy Director review, IAC approval, CEO signature, and return to ASD for approval workflow.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <WorkflowStep icon="📋" title="ASD Evaluation" text="Initial assessment" />
        <WorkflowStep icon="👔" title="Deputy Director" text="Review & quality check" />
        <WorkflowStep icon="👥" title="IAC" text="Committee approval" />
        <WorkflowStep icon="👑" title="CEO" text="Final sign-off" />
        <WorkflowStep icon="✅" title="ASD Return" text="Move to approval process" />
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {workflowRole === 'asd' && 'QASA Applications for ASD'}
          {workflowRole === 'dd' && 'Applications for Deputy Director Review'}
          {workflowRole === 'iac' && 'Applications for Internal Assessment Committee'}
          {workflowRole === 'ceo' && 'Applications for CEO Final Approval'}
          {!workflowRole && 'No workflow role selected'}
        </h3>

        {roleSubmissions.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-12 text-center">
            <ClipboardList className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-gray-500">No applications available for this workflow stage</p>
            <p className="text-sm text-gray-400">
              Change roles to view items in the relevant stage queue.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Qualification Title</TableHead>
                  <TableHead>Qualification ID</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[90px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleSubmissions.map((submission, idx) => (
                  <TableRow key={submission.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="max-w-xs truncate font-medium">
                      {submission.qualificationTitle}
                    </TableCell>
                    <TableCell>{submission.qualificationId}</TableCell>
                    <TableCell>{submission.applicantName}</TableCell>
                    <TableCell>{submission.organisationName}</TableCell>
                    <TableCell>
                      {new Date(submission.submissionDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getEvaluationStatusBadge(submission.evaluationStatus)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openViewModal(submission)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>QASA Application - Evaluation Details</DialogTitle>
            <DialogDescription>
              Review the submission details and continue the workflow.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <InfoField label="Qualification Title" value={selectedSubmission.qualificationTitle} />
                <InfoField label="Qualification ID" value={selectedSubmission.qualificationId} />
                <InfoField label="NQF Level" value={selectedSubmission.nqfLevel} />
                <InfoField label="Applicant Name" value={selectedSubmission.applicantName} />
                <InfoField label="Organisation" value={selectedSubmission.organisationName} />
                <div>
                  <Label className="text-gray-500">Current Status</Label>
                  <div className="mt-1">
                    {getEvaluationStatusBadge(selectedSubmission.evaluationStatus)}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-2 block text-base font-semibold">Submitted Documents</Label>
                <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                  <DocumentRow label="Curriculum" value={selectedSubmission.documents.curriculum} />
                  <DocumentRow
                    label="Assessment Specification"
                    value={selectedSubmission.documents.assessmentSpecification}
                  />
                  <DocumentRow label="SAQA Document" value={selectedSubmission.documents.saqaDocument} />
                  {selectedSubmission.acknowledgementLetterName && (
                    <DocumentRow
                      label="Acknowledgement Letter"
                      value={selectedSubmission.acknowledgementLetterName}
                    />
                  )}
                </div>
              </div>

              {selectedSubmission.asdEvaluationChecklist &&
                Object.keys(selectedSubmission.asdEvaluationChecklist).length > 0 && (
                  <ReviewBlock
                    title="ASD Evaluation"
                    checklist={selectedSubmission.asdEvaluationChecklist}
                    notes={selectedSubmission.asdEvaluationNotes || ''}
                    extraFileLabel="Evaluation Report"
                    extraFileValue={selectedSubmission.evaluationReportName || null}
                  />
                )}

              {selectedSubmission.ddEvaluationChecklist &&
                Object.keys(selectedSubmission.ddEvaluationChecklist).length > 0 && (
                  <ReviewBlock
                    title="Deputy Director Review"
                    checklist={selectedSubmission.ddEvaluationChecklist}
                    notes={selectedSubmission.ddReviewNotes || ''}
                  />
                )}

              {selectedSubmission.iacChecklist &&
                Object.keys(selectedSubmission.iacChecklist).length > 0 && (
                  <ReviewBlock
                    title="Internal Assessment Committee"
                    checklist={selectedSubmission.iacChecklist}
                    notes={selectedSubmission.iacApprovalNotes || ''}
                    extraFileLabel="Presentation"
                    extraFileValue={selectedSubmission.iacPresentationName || null}
                    secondExtraFileLabel="Resolution"
                    secondExtraFileValue={selectedSubmission.iacResolutionName || null}
                  />
                )}

              {selectedSubmission.ceoFinalChecklist &&
                Object.keys(selectedSubmission.ceoFinalChecklist).length > 0 && (
                  <ReviewBlock
                    title="CEO Final Approval"
                    checklist={selectedSubmission.ceoFinalChecklist}
                    notes={selectedSubmission.ceoFinalNotes || ''}
                    extraFileLabel="Outcome Letter"
                    extraFileValue={selectedSubmission.outcomeLetterName || null}
                  />
                )}

              <div className="border-t pt-4">
                <Label className="mb-3 block text-base font-semibold">Available Actions</Label>
                <div className="flex flex-wrap gap-3">
                  {workflowRole === 'asd' &&
                    selectedSubmission.evaluationStatus === 'pending_asd_evaluation' && (
                      <Button
                        onClick={() => openEvaluationModal('asd', selectedSubmission)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Conduct Evaluation
                      </Button>
                    )}

                  {workflowRole === 'asd' &&
                    selectedSubmission.evaluationStatus === 'returned_to_qp_negative' && (
                      <Button variant="destructive" disabled>
                        <ThumbsDown className="mr-2 h-4 w-4" />
                        Negative Outcome Sent Back to QP
                      </Button>
                    )}

                  {workflowRole === 'dd' &&
                    selectedSubmission.evaluationStatus === 'with_deputy_director' && (
                      <Button
                        onClick={() => openEvaluationModal('dd', selectedSubmission)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Review & Send to IAC
                      </Button>
                    )}

                  {workflowRole === 'iac' &&
                    selectedSubmission.evaluationStatus === 'with_iac' && (
                      <Button
                        onClick={() => openEvaluationModal('iac', selectedSubmission)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Review & Approve to CEO
                      </Button>
                    )}

                  {workflowRole === 'ceo' &&
                    selectedSubmission.evaluationStatus === 'with_ceo_final' && (
                      <Button
                        onClick={() => openEvaluationModal('ceo', selectedSubmission)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Award className="mr-2 h-4 w-4" />
                        Final Review & Sign Outcome Letter
                      </Button>
                    )}

                  {workflowRole === 'asd' &&
                    selectedSubmission.evaluationStatus === 'returned_to_asd_for_approval' && (
                      <Button
                        onClick={handleMoveToApprovalProcess}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ArrowRightCircle className="mr-2 h-4 w-4" />
                        Send to QASA Application Approval
                      </Button>
                    )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEvaluationModalOpen} onOpenChange={setIsEvaluationModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {evaluationType === 'asd' && 'ASD - Conduct QASA Evaluation'}
              {evaluationType === 'dd' && 'Deputy Director - Review Evaluation Report'}
              {evaluationType === 'iac' && 'Internal Assessment Committee - Review & Approve'}
              {evaluationType === 'ceo' && 'CEO - Final Approval & Outcome Letter'}
            </DialogTitle>
            <DialogDescription>
              {evaluationType === 'asd' &&
                'Conduct evaluation using the QAS Evaluation Tool and QASA Addendum Checklist.'}
              {evaluationType === 'dd' &&
                'Review the ASD evaluation report using the evaluation checklist and send to IAC when quality check is OK.'}
              {evaluationType === 'iac' &&
                'Receive QASA presentation and loaded resolution, then approve to CEO.'}
              {evaluationType === 'ceo' &&
                'Review all documents and sign the outcome letter, then return to ASD for the application approval process.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {evaluationType === 'asd' && (
              <>
                <ChecklistSection
                  title="QASA Addendum Checklist"
                  items={qasaChecklistItems}
                  evaluationChecklist={evaluationChecklist}
                  setEvaluationChecklist={setEvaluationChecklist}
                />

                <UploadField
                  label="Evaluation Report *"
                  accept=".pdf,.doc,.docx"
                  file={evaluationReport}
                  setFile={setEvaluationReport}
                />

                <NotesField
                  label="Evaluation Notes"
                  value={evaluationNotes}
                  onChange={setEvaluationNotes}
                  placeholder="Enter ASD evaluation findings and recommendations..."
                />

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => handleASDEvaluation('negative')} variant="destructive">
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Negative - Return to QP
                  </Button>
                  <Button
                    onClick={() => handleASDEvaluation('positive')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Positive - Send to Deputy Director
                  </Button>
                </div>
              </>
            )}

            {evaluationType === 'dd' && (
              <>
                <ChecklistSection
                  title="Evaluation Checklist"
                  items={ddChecklistItems}
                  evaluationChecklist={evaluationChecklist}
                  setEvaluationChecklist={setEvaluationChecklist}
                />

                <NotesField
                  label="Deputy Director Review Notes"
                  value={evaluationNotes}
                  onChange={setEvaluationNotes}
                  placeholder="Enter review notes and quality check findings..."
                />

                <Button
                  onClick={handleDDReviewAndSendToIAC}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Quality Check OK - Send to Internal Assessment Committee
                </Button>
              </>
            )}

            {evaluationType === 'iac' && (
              <>
                <ChecklistSection
                  title="IAC Approval Checklist"
                  items={iacChecklistItems}
                  evaluationChecklist={evaluationChecklist}
                  setEvaluationChecklist={setEvaluationChecklist}
                />

                <UploadField
                  label="Upload QASA Presentation *"
                  accept=".pdf,.ppt,.pptx"
                  file={presentationFile}
                  setFile={setPresentationFile}
                />

                <UploadField
                  label="Upload Resolution Document *"
                  accept=".pdf,.doc,.docx"
                  file={resolutionFile}
                  setFile={setResolutionFile}
                />

                <NotesField
                  label="IAC Approval Notes"
                  value={evaluationNotes}
                  onChange={setEvaluationNotes}
                  placeholder="Enter committee approval notes..."
                />

                <Button
                  onClick={handleIACApprovalAndSendToCEO}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  IAC Approved - Send to CEO
                </Button>
              </>
            )}

            {evaluationType === 'ceo' && (
              <>
                <ChecklistSection
                  title="CEO Final Checklist"
                  items={ceoFinalChecklistItems}
                  evaluationChecklist={evaluationChecklist}
                  setEvaluationChecklist={setEvaluationChecklist}
                />

                <UploadField
                  label="Upload Signed Outcome Letter *"
                  accept=".pdf,.doc,.docx"
                  file={outcomeLetter}
                  setFile={setOutcomeLetter}
                />

                <NotesField
                  label="CEO Approval Notes"
                  value={evaluationNotes}
                  onChange={setEvaluationNotes}
                  placeholder="Enter final approval notes..."
                />

                <Button
                  onClick={handleCEOFinalApproval}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileSignature className="mr-2 h-4 w-4" />
                  Approve / Sign Outcome Letter and Return to ASD
                </Button>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEvaluationModal}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkflowStep({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-3 text-center shadow-sm">
      <div className="mb-1 text-2xl">{icon}</div>
      <p className="text-xs font-medium">{title}</p>
      <p className="text-xs text-gray-500">{text}</p>
    </div>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined | null;
}) {
  return (
    <div>
      <Label className="text-gray-500">{label}</Label>
      <p className="font-medium">{value || '-'}</p>
    </div>
  );
}

function DocumentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}:</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function ReviewBlock({
  title,
  checklist,
  notes,
  extraFileLabel,
  extraFileValue,
  secondExtraFileLabel,
  secondExtraFileValue,
}: {
  title: string;
  checklist: Record<string, boolean>;
  notes: string;
  extraFileLabel?: string;
  extraFileValue?: string | null;
  secondExtraFileLabel?: string;
  secondExtraFileValue?: string | null;
}) {
  return (
    <div className="border-t pt-4">
      <Label className="mb-2 block text-base font-semibold">{title}</Label>
      <div className="rounded-lg bg-gray-50 p-3">
        {Object.entries(checklist).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 py-1 text-sm">
            {value ? (
              <CheckCircle className="h-3 w-3 text-green-600" />
            ) : (
              <X className="h-3 w-3 text-red-600" />
            )}
            <span>{key}</span>
          </div>
        ))}

        {notes && <p className="mt-3 border-t pt-3 text-sm">{notes}</p>}

        {extraFileLabel && extraFileValue && (
          <div className="mt-3 flex items-center gap-2 border-t pt-3 text-sm">
            <FileText className="h-4 w-4" />
            <span>
              {extraFileLabel}: {extraFileValue}
            </span>
          </div>
        )}

        {secondExtraFileLabel && secondExtraFileValue && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span>
              {secondExtraFileLabel}: {secondExtraFileValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ChecklistSection({
  title,
  items,
  evaluationChecklist,
  setEvaluationChecklist,
}: {
  title: string;
  items: string[];
  evaluationChecklist: Record<string, boolean>;
  setEvaluationChecklist: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">{title}</Label>
      {items.map((item) => (
        <div key={item} className="flex items-center space-x-2">
          <Checkbox
            id={item}
            checked={evaluationChecklist[item] || false}
            onCheckedChange={(checked) =>
              setEvaluationChecklist((prev) => ({ ...prev, [item]: checked === true }))
            }
          />
          <Label htmlFor={item} className="text-sm font-normal">
            {item}
          </Label>
        </div>
      ))}
    </div>
  );
}

function UploadField({
  label,
  accept,
  file,
  setFile,
}: {
  label: string;
  accept: string;
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="file"
        accept={accept}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      {file && <p className="text-sm text-green-600">✓ {file.name}</p>}
    </div>
  );
}

function NotesField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
      />
    </div>
  );
}