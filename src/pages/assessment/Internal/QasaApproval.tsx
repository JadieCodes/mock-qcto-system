// C:\Users\jadek\Desktop\my-cert-project\src\pages\assessment\Internal\QasaApproval.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  FileText,
  CheckCircle,
  Send,
  FileSignature,
  FilePenLine,
  ClipboardCheck,
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

type ApprovalStatus =
  | 'pending_asd_draft'
  | 'with_deputy_director_approval'
  | 'with_ceo_approval'
  | 'returned_to_asd_for_final_submission'
  | 'completed_sent_to_qp';

type WorkflowRole = 'asd' | 'dd' | 'ceo' | null;

type ExtendedQasaSubmission = Omit<QasaSubmission, 'approvalStatus'> & {
  approvalStatus?: ApprovalStatus;
  approvalLetterName?: string | null;
  ddApprovalChecklist?: Record<string, boolean> | null;
  ddApprovalNotes?: string;
  ceoApprovalChecklist?: Record<string, boolean> | null;
  ceoApprovalNotes?: string;
  finalApprovalLetterName?: string | null;
  dashboardVerified?: boolean;
  evaluationReportName?: string | null;
  outcomeLetterName?: string | null;
};

const getWorkflowRole = (appRole: string): WorkflowRole => {
  if (appRole === 'ASD') return 'asd';
  if (appRole === 'Deputy Director') return 'dd';
  if (appRole === 'CEO') return 'ceo';
  return null;
};

const normalizeApprovalStatus = (sub: any): ApprovalStatus | null => {
  const currentStatus = sub.approvalStatus;

  // Current workflow statuses
  if (
    currentStatus === 'pending_asd_draft' ||
    currentStatus === 'with_deputy_director_approval' ||
    currentStatus === 'with_ceo_approval' ||
    currentStatus === 'returned_to_asd_for_final_submission' ||
    currentStatus === 'completed_sent_to_qp'
  ) {
    return currentStatus;
  }

  // Legacy workflow statuses -> map into the new queues
  if (currentStatus === 'asd_drafted') {
    return 'with_deputy_director_approval';
  }

  if (currentStatus === 'deputy_director_approved') {
    return 'with_ceo_approval';
  }

  if (currentStatus === 'ceo_approved') {
    return 'returned_to_asd_for_final_submission';
  }

  // Records entering approval from evaluation flow
  if (
    sub.evaluationStatus === 'completed' ||
    sub.evaluationStatus === 'returned_to_asd_for_approval'
  ) {
    return 'pending_asd_draft';
  }

  return null;
};

export function QasaApproval() {
  const { currentRole } = useApp();
  const workflowRole = getWorkflowRole(currentRole);

  const [submissions, setSubmissions] = useState<ExtendedQasaSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ExtendedQasaSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalType, setApprovalType] = useState<'asd' | 'dd' | 'ceo' | null>(null);

  const [approvalChecklist, setApprovalChecklist] = useState<Record<string, boolean>>({});
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalLetter, setApprovalLetter] = useState<File | null>(null);
  const [finalApprovalLetter, setFinalApprovalLetter] = useState<File | null>(null);
  const [dashboardVerified, setDashboardVerified] = useState(false);

  const ddApprovalChecklistItems = [
    'Approval letter format is correct',
    'All information is accurate',
    'QASA evaluation outcome is correctly referenced',
    'Terms and conditions are properly stated',
    'Effective date is correct',
    'Letter is addressed to the correct recipient',
    'Signature blocks are in place',
  ];

  const ceoApprovalChecklistItems = [
    'Complete approval package reviewed',
    'Deputy Director review is complete',
    'Legal requirements are satisfied',
    'Organizational standards are met',
    'Letter is ready for final signature',
  ];

  useEffect(() => {
    loadSubmissions();

    const handleStorageChange = (e?: StorageEvent) => {
      if (!e || e.key === STORAGE_KEY) {
        loadSubmissions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadSubmissions, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
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

    const initialized: ExtendedQasaSubmission[] = allSubmissions
      .map((sub: any) => {
        const normalizedApprovalStatus = normalizeApprovalStatus(sub);

        return {
          ...sub,
          approvalStatus: normalizedApprovalStatus || undefined,
          approvalLetterName: sub.approvalLetterName || null,
          ddApprovalChecklist: sub.ddApprovalChecklist || null,
          ddApprovalNotes: sub.ddApprovalNotes || '',
          ceoApprovalChecklist: sub.ceoApprovalChecklist || null,
          ceoApprovalNotes: sub.ceoApprovalNotes || '',
          finalApprovalLetterName: sub.finalApprovalLetterName || null,
          dashboardVerified: sub.dashboardVerified || false,
          evaluationReportName: sub.evaluationReportName || null,
          outcomeLetterName: sub.outcomeLetterName || null,
        };
      })
      .filter((sub: ExtendedQasaSubmission) => Boolean(sub.approvalStatus));

    setSubmissions(initialized);
  };

  const updateSubmission = (
    updatedSubmission: ExtendedQasaSubmission,
    toastMessage = 'Action completed successfully'
  ) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allSubmissions = stored ? JSON.parse(stored) : [];

    const updatedAllSubmissions = allSubmissions.map((sub: any) =>
      sub.id === updatedSubmission.id ? updatedSubmission : sub
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAllSubmissions));
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === updatedSubmission.id ? updatedSubmission : sub))
    );
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));

    const toast = document.createElement('div');
    toast.className =
      'fixed bottom-4 right-4 z-50 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg';
    toast.textContent = toastMessage;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const resetApprovalState = () => {
    setApprovalChecklist({});
    setApprovalNotes('');
    setApprovalLetter(null);
    setFinalApprovalLetter(null);
    setDashboardVerified(false);
    setApprovalType(null);
  };

  const closeApprovalModal = () => {
    setIsApprovalModalOpen(false);
    resetApprovalState();
  };

  const getApprovalStatusBadge = (status?: ApprovalStatus) => {
    const statusConfig: Record<
      ApprovalStatus,
      { label: string; variant: 'default' | 'secondary' | 'outline' }
    > = {
      pending_asd_draft: { label: 'Pending ASD Draft', variant: 'secondary' },
      with_deputy_director_approval: { label: 'With Deputy Director', variant: 'outline' },
      with_ceo_approval: { label: 'With CEO', variant: 'outline' },
      returned_to_asd_for_final_submission: {
        label: 'Returned to ASD for Final Submission',
        variant: 'default',
      },
      completed_sent_to_qp: { label: 'Completed - Sent to QP', variant: 'default' },
    };

    if (!status) return <Badge variant="secondary">No Approval Status</Badge>;
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const openApprovalModal = (
    type: 'asd' | 'dd' | 'ceo',
    submission: ExtendedQasaSubmission
  ) => {
    setSelectedSubmission(submission);
    setApprovalType(type);

    if (type === 'dd') {
      setApprovalChecklist(submission.ddApprovalChecklist || {});
      setApprovalNotes(submission.ddApprovalNotes || '');
    } else if (type === 'ceo') {
      setApprovalChecklist(submission.ceoApprovalChecklist || {});
      setApprovalNotes(submission.ceoApprovalNotes || '');
    } else {
      setApprovalChecklist({});
      setApprovalNotes('');
    }

    setApprovalLetter(null);
    setFinalApprovalLetter(null);
    setDashboardVerified(Boolean(submission.dashboardVerified));
    setIsApprovalModalOpen(true);
  };

  const handleASDDraftAndSubmit = () => {
    if (!selectedSubmission || !approvalLetter) return;

    const updated: ExtendedQasaSubmission = {
      ...selectedSubmission,
      approvalLetterName: approvalLetter.name,
      approvalStatus: 'with_deputy_director_approval',
    };

    updateSubmission(updated, 'Approval letter drafted and submitted to Deputy Director');
    closeApprovalModal();
    setIsViewModalOpen(false);
  };

  const handleDDApprovalAndSendToCEO = () => {
    if (!selectedSubmission) return;

    const updated: ExtendedQasaSubmission = {
      ...selectedSubmission,
      ddApprovalChecklist: approvalChecklist,
      ddApprovalNotes: approvalNotes,
      approvalStatus: 'with_ceo_approval',
    };

    updateSubmission(updated, 'Approval letter reviewed and sent to CEO');
    closeApprovalModal();
    setIsViewModalOpen(false);
  };

  const handleCEOApprovalAndReturnToASD = () => {
    if (!selectedSubmission || !finalApprovalLetter) return;

    const updated: ExtendedQasaSubmission = {
      ...selectedSubmission,
      ceoApprovalChecklist: approvalChecklist,
      ceoApprovalNotes: approvalNotes,
      finalApprovalLetterName: finalApprovalLetter.name,
      approvalStatus: 'returned_to_asd_for_final_submission',
    };

    updateSubmission(updated, 'CEO approved letter and returned it to ASD');
    closeApprovalModal();
    setIsViewModalOpen(false);
  };

  const handleASDFinalSubmitToQP = () => {
    if (!selectedSubmission) return;

    const updated: ExtendedQasaSubmission = {
      ...selectedSubmission,
      dashboardVerified: dashboardVerified,
      approvalStatus: 'completed_sent_to_qp',
    };

    updateSubmission(updated, 'Approval letter submitted to Quality Partner Portfolio');
    setIsViewModalOpen(false);
  };

  const getRoleDisplayName = () => {
    switch (workflowRole) {
      case 'asd':
        return 'ASD';
      case 'dd':
        return 'Deputy Director';
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
            s.approvalStatus === 'pending_asd_draft' ||
            s.approvalStatus === 'returned_to_asd_for_final_submission'
        );
      case 'dd':
        return submissions.filter((s) => s.approvalStatus === 'with_deputy_director_approval');
      case 'ceo':
        return submissions.filter((s) => s.approvalStatus === 'with_ceo_approval');
      default:
        return [];
    }
  };

  const roleSubmissions = useMemo(getSubmissionsForRole, [submissions, workflowRole]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div>
          <p className="text-sm text-green-800">
            Logged in as: <strong>{getRoleDisplayName()}</strong> - QASA Application Approval
          </p>
          <p className="mt-1 text-xs text-green-600">
            {workflowRole === 'asd' &&
              'Draft approval letter, then receive the final approved letter back from CEO and submit to QP.'}
            {workflowRole === 'dd' &&
              'Review approval letter using the evaluation checklist and send it to CEO.'}
            {workflowRole === 'ceo' &&
              'Review and approve the approval letter, then return it to ASD.'}
            {!workflowRole &&
              'Select ASD, Deputy Director, or CEO to view this workflow.'}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900">QASA Application Approval</h2>
        <p className="mt-1 text-sm text-gray-600">
          ASD drafts the approval letter, Deputy Director reviews it, CEO approves it, then ASD submits it to the Quality Partner Portfolio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <WorkflowStep icon="📝" title="ASD Draft" text="Draft approval letter" />
        <WorkflowStep icon="👔" title="Deputy Director" text="Review letter" />
        <WorkflowStep icon="👑" title="CEO" text="Approve letter" />
        <WorkflowStep icon="📧" title="ASD Submit" text="Send to QP Portfolio" />
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          {workflowRole === 'asd' && 'QASA Applications for ASD Approval Actions'}
          {workflowRole === 'dd' && 'Applications for Deputy Director Approval Review'}
          {workflowRole === 'ceo' && 'Applications for CEO Final Approval'}
          {!workflowRole && 'No approval role selected'}
        </h3>

        {roleSubmissions.length === 0 ? (
          <div className="rounded-lg bg-gray-50 py-12 text-center">
            <FilePenLine className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="text-gray-500">No applications for approval</p>
            <p className="text-sm text-gray-400">
              Applications will appear here when they reach this role’s approval stage.
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
                  <TableHead>Approval Status</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell>{new Date(submission.submissionDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getApprovalStatusBadge(submission.approvalStatus)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setIsViewModalOpen(true);
                        }}
                      >
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
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>QASA Application - Approval Details</DialogTitle>
            <DialogDescription>
              Review the application and continue the approval workflow.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-gray-500">Qualification Title</Label>
                  <p className="font-medium">{selectedSubmission.qualificationTitle}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Qualification ID</Label>
                  <p className="font-medium">{selectedSubmission.qualificationId}</p>
                </div>
                <div>
                  <Label className="text-gray-500">NQF Level</Label>
                  <p className="font-medium">{selectedSubmission.nqfLevel}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Applicant Name</Label>
                  <p className="font-medium">{selectedSubmission.applicantName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Organisation</Label>
                  <p className="font-medium">{selectedSubmission.organisationName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Approval Status</Label>
                  <div className="mt-1">{getApprovalStatusBadge(selectedSubmission.approvalStatus)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-2 block text-base font-semibold">Evaluation Results</Label>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Evaluation Status:</span>
                    <Badge variant="default">{selectedSubmission.evaluationStatus || 'Completed'}</Badge>
                  </div>

                  {selectedSubmission.evaluationReportName && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-3 w-3" />
                      <span>Evaluation Report: {selectedSubmission.evaluationReportName}</span>
                    </div>
                  )}

                  {selectedSubmission.outcomeLetterName && (
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <FileSignature className="h-3 w-3" />
                      <span>Outcome Letter: {selectedSubmission.outcomeLetterName}</span>
                    </div>
                  )}
                </div>
              </div>

              {(selectedSubmission.approvalLetterName || selectedSubmission.finalApprovalLetterName) && (
                <div className="border-t pt-4">
                  <Label className="mb-2 block text-base font-semibold">Approval Documents</Label>
                  <div className="rounded-lg bg-gray-50 p-3">
                    {selectedSubmission.approvalLetterName && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">
                          Draft Approval Letter: {selectedSubmission.approvalLetterName}
                        </span>
                      </div>
                    )}

                    {selectedSubmission.finalApprovalLetterName && (
                      <div className="mt-2 flex items-center gap-2">
                        <FileSignature className="h-4 w-4" />
                        <span className="text-sm">
                          Signed Approval Letter: {selectedSubmission.finalApprovalLetterName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedSubmission.ddApprovalNotes && (
                <div className="border-t pt-4">
                  <Label className="mb-2 block text-base font-semibold">Deputy Director Review</Label>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm">{selectedSubmission.ddApprovalNotes}</p>
                  </div>
                </div>
              )}

              {selectedSubmission.ceoApprovalNotes && (
                <div className="border-t pt-4">
                  <Label className="mb-2 block text-base font-semibold">CEO Approval Notes</Label>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm">{selectedSubmission.ceoApprovalNotes}</p>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="mb-3 block text-base font-semibold">Available Actions</Label>
                <div className="flex flex-wrap gap-3">
                  {workflowRole === 'asd' &&
                    selectedSubmission.approvalStatus === 'pending_asd_draft' && (
                      <Button
                        onClick={() => openApprovalModal('asd', selectedSubmission)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FilePenLine className="mr-2 h-4 w-4" />
                        Draft Approval Letter
                      </Button>
                    )}

                  {workflowRole === 'dd' &&
                    selectedSubmission.approvalStatus === 'with_deputy_director_approval' && (
                      <Button
                        onClick={() => openApprovalModal('dd', selectedSubmission)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Review Approval Letter
                      </Button>
                    )}

                  {workflowRole === 'ceo' &&
                    selectedSubmission.approvalStatus === 'with_ceo_approval' && (
                      <Button
                        onClick={() => openApprovalModal('ceo', selectedSubmission)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FileSignature className="mr-2 h-4 w-4" />
                        Review & Approve Letter
                      </Button>
                    )}

                  {workflowRole === 'asd' &&
                    selectedSubmission.approvalStatus === 'returned_to_asd_for_final_submission' && (
                      <Button
                        onClick={handleASDFinalSubmitToQP}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ArrowRightCircle className="mr-2 h-4 w-4" />
                        Verify Dashboard & Submit to QP
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

      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {approvalType === 'asd' && 'ASD - Draft Approval Letter'}
              {approvalType === 'dd' && 'Deputy Director - Review Approval Letter'}
              {approvalType === 'ceo' && 'CEO - Final Approval & Sign'}
            </DialogTitle>
            <DialogDescription>
              {approvalType === 'asd' && 'Draft the approval letter and submit it to Deputy Director.'}
              {approvalType === 'dd' && 'Review the approval letter using the evaluation checklist and send it to CEO.'}
              {approvalType === 'ceo' && 'Review, approve, and sign the approval letter, then return it to ASD.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {approvalType === 'asd' && (
              <>
                <div className="space-y-2">
                  <Label>Upload Draft Approval Letter *</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setApprovalLetter(e.target.files?.[0] || null)}
                  />
                  {approvalLetter && <p className="text-sm text-green-600">✓ {approvalLetter.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Draft Notes (Optional)</Label>
                  <Textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Enter notes about the drafted approval letter..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleASDDraftAndSubmit}
                  disabled={!approvalLetter}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Draft & Submit to Deputy Director
                </Button>
              </>
            )}

            {approvalType === 'dd' && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Evaluation Checklist</Label>
                  {ddApprovalChecklistItems.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={item}
                        checked={approvalChecklist[item] || false}
                        onCheckedChange={(checked) =>
                          setApprovalChecklist((prev) => ({
                            ...prev,
                            [item]: checked === true,
                          }))
                        }
                      />
                      <Label htmlFor={item} className="text-sm font-normal">
                        {item}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Review Notes</Label>
                  <Textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Enter review notes and quality check findings..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleDDApprovalAndSendToCEO}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Quality Check OK - Send to CEO
                </Button>
              </>
            )}

            {approvalType === 'ceo' && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Final Approval Checklist</Label>
                  {ceoApprovalChecklistItems.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={item}
                        checked={approvalChecklist[item] || false}
                        onCheckedChange={(checked) =>
                          setApprovalChecklist((prev) => ({
                            ...prev,
                            [item]: checked === true,
                          }))
                        }
                      />
                      <Label htmlFor={item} className="text-sm font-normal">
                        {item}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Upload Signed Approval Letter *</Label>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFinalApprovalLetter(e.target.files?.[0] || null)}
                  />
                  {finalApprovalLetter && (
                    <p className="text-sm text-green-600">✓ {finalApprovalLetter.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>CEO Approval Notes</Label>
                  <Textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Enter final approval notes..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleCEOApprovalAndReturnToASD}
                  disabled={!finalApprovalLetter}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FileSignature className="mr-2 h-4 w-4" />
                  Approve / Sign and Return to ASD
                </Button>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeApprovalModal}>
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