import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuditTrail } from '@/context/AuditTrailContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Eye, FileText, AlertCircle, AlertTriangle, XCircle, CheckCircle2, GitBranch } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type {
  ProcessType,
  SubmissionSource,
  ReissueReason,
  Pathway,
  DocumentType,
  Submission,
  SubmissionStatus,
  AppRole,
  ErrorType,
  OriginType,
  CorrectionRecord,
  CorrectionNote,
  DocumentVersion,
} from '@/types';

// ─── Role constants ───────────────────────────────────────────────────────────
const ROLES = {
  CERT_ADMIN: 'Certification Practitioner' as AppRole,
  ASSESSMENT_UNIT: 'Assessment Unit' as AppRole,
  NAMB: 'NAMB' as AppRole,
  QP: 'QP' as AppRole,
  SDP: 'SDP' as AppRole,
} as const;

// ─── Rejection options ────────────────────────────────────────────────────────

type RejectionCategory = 'internal' | 'external';

interface RejectionOption {
  id: string;
  label: string;
  category: RejectionCategory;
}

const REJECTION_OPTIONS: RejectionOption[] = [
  // Internal reasons
  { id: 'missing_doc', label: 'Missing required document(s)', category: 'internal' },
  { id: 'unverified_doc', label: 'Document(s) could not be verified', category: 'internal' },
  { id: 'checklist_incomplete', label: 'Review checklist not fully completed', category: 'internal' },
  { id: 'duplicate_submission', label: 'Duplicate submission detected', category: 'internal' },
  { id: 'incorrect_process_type', label: 'Incorrect process type selected', category: 'internal' },
  { id: 'pathway_mismatch', label: 'Pathway does not match documentation', category: 'internal' },
  // External reasons
  { id: 'id_mismatch', label: 'Learner ID number mismatch', category: 'external' },
  { id: 'name_mismatch', label: 'Learner name does not match records', category: 'external' },
  { id: 'qualification_invalid', label: 'Qualification code is invalid or unrecognised', category: 'external' },
  { id: 'approval_code_expired', label: 'Approval code is expired or invalid', category: 'external' },
  { id: 'issuing_body_not_registered', label: 'Issuing body is not registered in CVS', category: 'external' },
  { id: 'payment_invalid', label: 'Proof of payment is invalid or insufficient', category: 'external' },
  { id: 'affidavit_invalid', label: 'Affidavit is incomplete or not commissioner-signed', category: 'external' },
  { id: 'bio_data_mismatch', label: 'Bio data in File 3–4 does not match CVS records', category: 'external' },
  { id: 'signature_missing', label: 'Required signature(s) missing on document', category: 'external' },
  { id: 'other_external', label: 'Other external reason (specify in comments)', category: 'external' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCorrectionTodoDate = (days = 7) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Intake() {
  const { profileSubmissions, updateSubmission, currentRole, setCurrentRole } = useApp();
  const { toast } = useToast();
  const { logAction } = useAuditTrail();

  // Document viewer / review state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [reviewChecks, setReviewChecks] = useState<Record<string, boolean>>({});
  const [documentVerifications, setDocumentVerifications] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'review' | 'history'>('details');

  // Decision state
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'return' | ''>('');
  const [todoDate, setTodoDate] = useState('');
  const [viewedDocuments, setViewedDocuments] = useState<Record<string, boolean>>({});

  // ── Rejection popup state ─────────────────────────────────────────────────
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [selectedRejectionIds, setSelectedRejectionIds] = useState<string[]>([]);
  const [rejectionComments, setRejectionComments] = useState('');
  const [rejectionCategory, setRejectionCategory] = useState<RejectionCategory | 'both'>('both');

  // ── Visible submissions ───────────────────────────────────────────────────

  const getVisibleSubmissions = () => {
    return profileSubmissions.filter(sub => {
      if (sub.status !== 'draft' && sub.status !== 'submitted') return false;
      if (currentRole === ROLES.CERT_ADMIN) return true;
      return false;
    });
  };

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (selectedSubmission) {
      const docVerifications: Record<string, boolean> = {};
      selectedSubmission.documents.forEach(doc => {
        docVerifications[doc.id] = doc.verified || false;
      });
      setDocumentVerifications(docVerifications);
      setViewedDocuments({});
      const savedChecks = selectedSubmission.assessmentData?.reviewChecks || {};
      setReviewChecks(savedChecks);
      setReviewDecision('');
      setTodoDate('');
      setActiveTab('details');
      // Reset rejection state
      setSelectedRejectionIds([]);
      setRejectionComments('');
      setRejectionCategory('both');
    }
  }, [selectedSubmission]);

  // ── Computed review state ─────────────────────────────────────────────────

  const getReviewState = () => {
    if (!selectedSubmission) return { allDocsVerified: false, allChecksPassed: false, totalChecks: 0, completedChecks: 0, totalDocs: 0, verifiedDocs: 0 };

    const reviewChecksList = getReviewChecksForSubmission(selectedSubmission);
    const totalChecks = reviewChecksList.length;
    const completedChecks = reviewChecksList.filter(c => reviewChecks[c.id]).length;
    const allChecksPassed = totalChecks > 0 && completedChecks === totalChecks;

    const totalDocs = selectedSubmission.documents.length;
    const verifiedDocs = Object.values(documentVerifications).filter(Boolean).length;
    const allDocsVerified = totalDocs > 0 && verifiedDocs === totalDocs;

    return { allDocsVerified, allChecksPassed, totalChecks, completedChecks, totalDocs, verifiedDocs };
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleViewDocuments = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsDocumentModalOpen(true);
  };

  const handleDocumentVerification = (docId: string, verified: boolean) => {
    setDocumentVerifications(prev => ({ ...prev, [docId]: verified }));
  };

  const handleReviewCheck = (checkId: string, checked: boolean) => {
    setReviewChecks(prev => ({ ...prev, [checkId]: checked }));
  };

  const toggleRejectionOption = (id: string) => {
    setSelectedRejectionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  /**
   * Called when the reviewer clicks "Submit Decision".
   * For approve: processes directly.
   * For return: opens the rejection popup modal first.
   */
  const handleSubmitDecisionClick = () => {
    if (!selectedSubmission) return;
    const { allDocsVerified, allChecksPassed } = getReviewState();

    if (reviewDecision === 'approved') {
      if (!allChecksPassed || !allDocsVerified) {
        toast({
          title: 'Cannot Approve',
          description: 'All checklist items must be confirmed and all documents verified before approval.',
          variant: 'destructive',
        });
        return;
      }
      handleApprove();
    } else if (reviewDecision === 'return') {
      // Open rejection popup
      setIsRejectionModalOpen(true);
    }
  };

  const handleApprove = () => {
    if (!selectedSubmission) return;
    const updatedSubmission: Submission = {
      ...selectedSubmission,
      documents: selectedSubmission.documents.map(doc => ({
        ...doc,
        verified: documentVerifications[doc.id] || false,
      })),
      assessmentData: {
        ...selectedSubmission.assessmentData,
        reviewChecks,
        reviewCompleted: true,
        reviewCompletedAt: new Date().toISOString(),
        reviewDecision: 'approved',
        reviewedBy: currentRole,
        reviewedAt: new Date().toISOString(),
        documentVerifications,
        integrationStatus: 'pending',
        integrationSystem: selectedSubmission.pathway === 'legacy' ? 'Apprentice' : 'CVS',
        integrationAttempts: 0,
      },
      status: 'approved',
    };
    updateSubmission(selectedSubmission.id, updatedSubmission);
    toast({ title: 'Submission Approved', description: 'Submission has been approved and is ready for integration.' });
    logAction({ user: currentRole, module: 'Intake', action: `Approved submission ${selectedSubmission.id}`, status: 'Success', details: selectedSubmission.candidateName });
    setIsDocumentModalOpen(false);
    setSelectedSubmission(null);
  };

  /**
   * Called when the reviewer confirms the rejection in the popup modal.
   */
  const handleConfirmRejection = () => {
    if (!selectedSubmission) return;

    if (selectedRejectionIds.length === 0) {
      toast({ title: 'Select a Reason', description: 'Please select at least one rejection reason.', variant: 'destructive' });
      return;
    }
    if (!todoDate) {
      toast({ title: 'To Do Date Required', description: 'Please set a correction deadline date.', variant: 'destructive' });
      return;
    }

    // Build a human-readable return reason from selected options + comments
    const selectedLabels = REJECTION_OPTIONS
      .filter(o => selectedRejectionIds.includes(o.id))
      .map(o => `• ${o.label}`);
    const returnReason = [
      ...selectedLabels,
      rejectionComments.trim() ? `Additional comments: ${rejectionComments.trim()}` : '',
    ].filter(Boolean).join('\n');

    // Determine error type from selected rejection options
    let errorType: ErrorType = 'missing_documentation';
    if (selectedRejectionIds.some(id => ['id_mismatch', 'name_mismatch', 'bio_data_mismatch'].includes(id))) {
      errorType = 'incorrect_learner_details';
    } else if (selectedRejectionIds.some(id => ['qualification_invalid'].includes(id))) {
      errorType = 'qualification_mismatch';
    } else if (selectedRejectionIds.some(id => ['missing_doc', 'unverified_doc'].includes(id))) {
      errorType = 'missing_documentation';
    }

    const correctionRecord: CorrectionRecord = {
      correctionId: `COR-${Date.now()}`,
      submissionId: selectedSubmission.id,
      learnerName: selectedSubmission.candidateName,
      qualification: selectedSubmission.certificateType,
      pathway: selectedSubmission.pathway || 'occupational',
      errorType,
      origin: 'intake',
      responsibleUnit: selectedSubmission.createdBy as AppRole,
      currentStatus: 'active',
      version: 1,
      dateCreated: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      assignedTo: selectedSubmission.createdBy as AppRole,
      returnReason,
      correctionNotes: [],
      todoDate: new Date(todoDate).toISOString(),
      expired: false,
    };

    const updatedDocuments = selectedSubmission.documents.map(doc => ({
      ...doc,
      verified: documentVerifications[doc.id] || false,
      versions: [{
        version: 1,
        url: doc.url || '',
        uploadedAt: doc.uploadedAt,
        uploadedBy: selectedSubmission.createdBy,
        verified: documentVerifications[doc.id] || false,
      }],
    }));

    // Structured rejection details — saved separately so Corrections can display them properly
    const rejectionDetails = {
      selectedReasonIds: selectedRejectionIds,
      selectedReasons: REJECTION_OPTIONS
        .filter(o => selectedRejectionIds.includes(o.id))
        .map(o => ({ id: o.id, label: o.label, category: o.category as string })),
      comments: rejectionComments.trim() || undefined,
      returnedBy: currentRole,
      returnedAt: new Date().toISOString(),
    };

    const updatedSubmission: Submission = {
      ...selectedSubmission,
      documents: updatedDocuments,
      assessmentData: {
        ...selectedSubmission.assessmentData,
        reviewChecks,
        reviewCompleted: false,
        reviewDecision: 'returned',
        returnReason,
        returnedBy: currentRole,
        returnedAt: new Date().toISOString(),
        documentVerifications,
        correctionRecord,
        rejectionDetails,
      },
      status: 'pending_correction',
    };

    updateSubmission(selectedSubmission.id, updatedSubmission);
    toast({ title: 'Submission Returned', description: 'Submission has been returned to the creator for corrections.' });
    logAction({ user: currentRole, module: 'Intake', action: `Returned submission ${selectedSubmission.id} for corrections`, status: 'Success', details: `${selectedRejectionIds.length} reason(s) selected` });
    setIsRejectionModalOpen(false);
    setIsDocumentModalOpen(false);
    setSelectedSubmission(null);
  };

  // ── Label helpers ─────────────────────────────────────────────────────────

  const getDocumentLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      application_form: 'Application Form',
      approval_letter: 'Approval Letter',
      affidavit: 'Affidavit',
      original_certificate: 'Original Certificate',
      proof_of_payment: 'Proof of Payment',
      recommendation_letter: 'Recommendation Letter',
      id_copy: 'ID Copy',
      file_3_4: 'File 3–4',
      programme_approval_letter: 'Programme Approval Letter',
      learner_result_approval_sheet: 'Learner Result Approval Sheet',
      qualification_data_confirmation: 'Qualification/Programme Data Confirmation',
      supporting_achievement_documentation: 'Supporting Achievement Documentation',
      signed_declaration: 'Signed Declaration',
      learner_achievement_data_proof: 'Learner Achievement Data Proof',
      qualification_confirmation: 'Qualification Confirmation',
      bio_data_confirmation: 'Bio Data Confirmation',
      historical_verification: 'Historical Verification',
      reissue_application_form: 'Re-Issue Application Form',
      replace_application_form: 'Replace Application Form',
      namb_documentation: 'NAMB Documentation',
      other: 'Other Document',
    };
    return labels[type] || type;
  };

  const getCVSCheckReviewLabel = (checkName: string): string => {
    const map: Record<string, string> = {
      'Connecting to CVS...': 'CVS system connection was successful',
      'Checking learner bio data in File 3 to 4...': 'Learner bio data in File 3 to 4 is correct and matches records',
      'Checking qualification code against CVS rules...': 'Qualification code in File 3 to 4 is valid and matches CVS rules',
      'Verifying recommender authority in CVS...': 'Recommender is an authorised and registered body',
      'Matching learner details against CVS records...': 'Learner details on the document match CVS records',
      'Validating approval code against CVS...': 'Approval code is present, valid, and not expired',
      'Verifying issuing body registration...': 'Issuing body is registered and authorised in CVS',
      'Validating ID number format...': 'ID number format is correct and valid',
      'Matching identity against CVS learner records...': 'Learner identity on ID matches submission details',
      'Checking form completeness...': 'Form is fully completed with no missing required fields',
      'Verifying required signatures present...': 'All required signatures are present on the form',
      'Validating payment reference number...': 'Payment reference number is valid and traceable',
      'Verifying payment amount matches fee schedule...': 'Payment amount matches the required fee schedule',
      'Validating programme code in CVS...': 'Programme code is valid and registered in CVS',
      'Checking programme approval status...': 'Programme has active approval status in CVS',
      'Verifying learner result data against CVS...': 'Learner result data matches CVS records',
      'Checking assessor registration...': 'Assessor is registered and accredited',
      'Checking affidavit format and commissioner signature...': 'Affidavit is correctly formatted and signed by a commissioner',
      'Matching affidavit learner details against CVS...': 'Learner details on affidavit match CVS records',
      'Validating original certificate number in CVS...': 'Original certificate number exists and is valid in CVS',
      'Checking certificate status and validity...': 'Certificate is active and has not been voided or expired',
      'Checking document is registered in CVS...': 'Document is registered in CVS',
      'Verifying document data matches CVS records...': 'Document data matches CVS records',
    };
    return map[checkName] ?? checkName;
  };

  const getReviewChecksForSubmission = (submission: Submission) => {
    const items: {
      id: string;
      label: string;
      docType: string;
      docLabel: string;
      cvsPassed?: boolean;
      cvsError?: string;
    }[] = [];

    submission.documents.forEach(doc => {
      const cvsResult = submission.assessmentData?.documentValidations?.[doc.type];
      if ((cvsResult?.checks?.length ?? 0) > 0) {
        cvsResult!.checks.forEach((check: { name: string; passed: boolean; error?: string }, idx: number) => {
          items.push({
            id: `cvs_${doc.type}_${idx}`,
            label: getCVSCheckReviewLabel(check.name),
            docType: doc.type,
            docLabel: getDocumentLabel(doc.type),
            cvsPassed: check.passed,
            cvsError: check.error,
          });
        });
      } else {
        items.push({
          id: `doc_${doc.type}`,
          label: `${getDocumentLabel(doc.type)} checked`,
          docType: doc.type,
          docLabel: getDocumentLabel(doc.type),
        });
      }
    });
    return items;
  };

  const getGroupedReviewChecks = (submission: Submission) => {
    const checks = getReviewChecksForSubmission(submission);
    const groups: Record<string, { docLabel: string; docType: string; items: typeof checks }> = {};
    checks.forEach(item => {
      if (!groups[item.docType]) {
        groups[item.docType] = { docLabel: item.docLabel, docType: item.docType, items: [] };
      }
      groups[item.docType].items.push(item);
    });
    return groups;
  };

  // ── CVS pre-validation results panel ─────────────────────────────────────

  const renderCVSValidationResults = (submission: Submission) => {
    if (submission.assessmentData?.documentValidations) {
      const entries = Object.entries(submission.assessmentData.documentValidations) as [string, any][];
      const allPassed = entries.every(([, v]) => v.status === 'passed');
      const passedCount = entries.filter(([, v]) => v.status === 'passed').length;
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900">External CVS Pre-Validation</h4>
              <p className="text-sm text-blue-700">Validation completed before submission was sent to Internal Intake.</p>
            </div>
            <Badge variant={allPassed ? 'outline' : 'destructive'} className={allPassed ? 'text-green-700 border-green-300' : ''}>
              {passedCount}/{entries.length} passed
            </Badge>
          </div>
          <div className="space-y-3">
            {entries.map(([docType, result]) => (
              <div key={docType} className={`rounded-lg border p-3 text-sm ${result.status === 'passed' ? 'bg-green-50 border-green-200' : result.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span>{result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏳'}</span>
                  <span className="font-medium">{getDocumentLabel(docType as DocumentType)}</span>
                  <Badge variant={result.status === 'passed' ? 'outline' : result.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">{result.status}</Badge>
                </div>
                {result.error && (
                  <div className="rounded border border-red-200 bg-red-50 p-2 mb-2">
                    <p className="text-xs font-medium text-red-800">Validation Error</p>
                    <p className="text-xs text-red-700 mt-0.5">{result.error}</p>
                  </div>
                )}
                {result.checks && result.checks.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {result.checks.map((check: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <span>{check.passed ? '✅' : '❌'}</span>
                        <div>
                          <p>{check.name}</p>
                          {check.error && <p className="text-red-600">{check.error}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {result.summary && result.summary.totalLearners > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Learner Summary</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded border bg-white p-2"><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold text-sm">{result.summary.totalLearners}</p></div>
                      <div className="rounded border bg-white p-2"><p className="text-xs text-muted-foreground">Passed</p><p className="font-semibold text-sm text-green-600">{result.summary.passedLearners}</p></div>
                      <div className="rounded border bg-white p-2"><p className="text-xs text-muted-foreground">Failed</p><p className="font-semibold text-sm text-red-600">{result.summary.failedLearners}</p></div>
                    </div>
                    {result.summary.failedRows && result.summary.failedRows.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        <p className="text-xs font-medium text-muted-foreground">Failed Rows</p>
                        {result.summary.failedRows.map((row: any, idx: number) => (
                          <div key={idx} className="rounded border border-red-200 bg-red-50 p-1.5 text-xs">
                            <span className="font-medium">{row.learnerIdentifier}:</span> {row.reason}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!submission.assessmentData?.preIntakeValidationStatus) return null;
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
        <div>
          <h4 className="font-medium text-blue-900">External CVS Pre-Validation</h4>
          <p className="text-sm text-blue-700">Validation completed before the submission was sent to Internal Intake.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={submission.assessmentData.preIntakeValidationStatus === 'passed' ? 'outline' : submission.assessmentData.preIntakeValidationStatus === 'failed' ? 'destructive' : 'secondary'}>
            {submission.assessmentData.preIntakeValidationStatus}
          </Badge>
          {submission.assessmentData.preIntakeValidationAt && (
            <span className="text-xs text-muted-foreground">Checked: {new Date(submission.assessmentData.preIntakeValidationAt).toLocaleString()}</span>
          )}
          {submission.assessmentData.preIntakeValidatedBy && (
            <span className="text-xs text-muted-foreground">By: {submission.assessmentData.preIntakeValidatedBy}</span>
          )}
        </div>
        {submission.assessmentData.preIntakeValidationError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">Validation Error</p>
            <p className="text-sm text-red-700 mt-1">{submission.assessmentData.preIntakeValidationError}</p>
          </div>
        )}
        {submission.assessmentData.preIntakeValidationSummary && (
          <div className="space-y-3">
            <p className="text-sm font-medium">File 3 to 4 Learner Summary</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border bg-white p-3"><p className="text-xs text-muted-foreground">Total Learners</p><p className="font-semibold">{submission.assessmentData.preIntakeValidationSummary.totalLearners}</p></div>
              <div className="rounded-md border bg-white p-3"><p className="text-xs text-muted-foreground">Passed</p><p className="font-semibold text-green-600">{submission.assessmentData.preIntakeValidationSummary.passedLearners}</p></div>
              <div className="rounded-md border bg-white p-3"><p className="text-xs text-muted-foreground">Failed</p><p className="font-semibold text-red-600">{submission.assessmentData.preIntakeValidationSummary.failedLearners}</p></div>
            </div>
            {(submission.assessmentData.preIntakeValidationSummary.failedRows?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Failed Learners / Rows</p>
                {submission.assessmentData.preIntakeValidationSummary.failedRows?.map((row: any, idx: number) => (
                  <div key={idx} className="rounded-md border border-red-200 bg-red-50 p-2 text-xs">
                    <span className="font-medium">{row.learnerIdentifier}:</span> {row.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {(submission.assessmentData.preIntakeSystemChecks?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Validation Checks</p>
            {submission.assessmentData.preIntakeSystemChecks?.map((check: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span>{check.passed ? '✅' : '❌'}</span>
                <div><p>{check.name}</p>{check.error && <p className="text-xs text-red-600">{check.error}</p>}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Rejection popup modal ─────────────────────────────────────────────────

  const renderRejectionModal = () => {
    const internalOptions = REJECTION_OPTIONS.filter(o => o.category === 'internal');
    const externalOptions = REJECTION_OPTIONS.filter(o => o.category === 'external');

    const filteredInternal = rejectionCategory === 'external' ? [] : internalOptions;
    const filteredExternal = rejectionCategory === 'internal' ? [] : externalOptions;

    return (
      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Return for Corrections
            </DialogTitle>
            <DialogDescription>
              Select the reason(s) for returning this submission. The submitter will receive these details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">

            {/* Category filter */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Rejection Category</Label>
              <p className="text-xs text-muted-foreground">Filter reasons by whether the issue is internal (process/admin) or external (submitter's documents/data).</p>
              <div className="flex gap-2 mt-1">
                {(['both', 'internal', 'external'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setRejectionCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      rejectionCategory === cat
                        ? cat === 'internal' ? 'bg-blue-600 text-white border-blue-600'
                          : cat === 'external' ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {cat === 'both' ? 'All Reasons' : cat === 'internal' ? '🔒 Internal' : '📤 External'}
                  </button>
                ))}
              </div>
            </div>

            {/* Internal reasons */}
            {filteredInternal.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">Internal Reasons</span>
                  <span className="text-xs text-muted-foreground">(process / admin issues)</span>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 divide-y divide-blue-100">
                  {filteredInternal.map(option => (
                    <label key={option.id} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-blue-100 transition-colors">
                      <Checkbox
                        checked={selectedRejectionIds.includes(option.id)}
                        onCheckedChange={() => toggleRejectionOption(option.id)}
                        className="mt-0.5"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* External reasons */}
            {filteredExternal.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-orange-700">External Reasons</span>
                  <span className="text-xs text-muted-foreground">(submitter's documents / data)</span>
                </div>
                <div className="rounded-lg border border-orange-100 bg-orange-50 divide-y divide-orange-100">
                  {filteredExternal.map(option => (
                    <label key={option.id} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-orange-100 transition-colors">
                      <Checkbox
                        checked={selectedRejectionIds.includes(option.id)}
                        onCheckedChange={() => toggleRejectionOption(option.id)}
                        className="mt-0.5"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Selected summary */}
            {selectedRejectionIds.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-800 mb-2">Selected reasons ({selectedRejectionIds.length}):</p>
                <ul className="space-y-1">
                  {REJECTION_OPTIONS.filter(o => selectedRejectionIds.includes(o.id)).map(o => (
                    <li key={o.id} className="text-xs text-amber-900 flex items-center gap-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${o.category === 'internal' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                      {o.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Comments */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Additional Comments</Label>
              <p className="text-xs text-muted-foreground">Add any specific details or instructions for the submitter.</p>
              <Textarea
                value={rejectionComments}
                onChange={e => setRejectionComments(e.target.value)}
                placeholder="Describe specifically what needs to be corrected or resubmitted..."
                rows={4}
                className="mt-1"
              />
            </div>

            {/* To Do Date */}
            <div className="space-y-1.5">
              <Label htmlFor="rejection-todo-date" className="text-sm font-medium">
                Correction Deadline <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">Date by which the submitter must resubmit corrections.</p>
              <input
                id="rejection-todo-date"
                type="date"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={todoDate}
                onChange={e => setTodoDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsRejectionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRejection}
              disabled={selectedRejectionIds.length === 0 || !todoDate}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Confirm Return for Corrections
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // ── Render Return from Integration Details ─────────────────────────────────
  
  const renderReturnFromIntegrationDetails = (submission: Submission) => {
    const rejectionDetails = (submission.assessmentData as any)?.sentBackRejectionDetails || 
                            (submission.assessmentData as any)?.rejectionDetails;
    
    if (!rejectionDetails) {
      // Fallback to simple reason display
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Returned from Integration</p>
              <p className="text-sm text-amber-700 mt-1">
                This submission was sent back from Integration with the following reason:
              </p>
              <p className="text-sm text-amber-800 mt-2 p-2 bg-amber-100 rounded whitespace-pre-wrap">
                {submission.assessmentData?.sentBackToIntakeReason || 'No reason provided'}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-amber-700">
                <span>Sent back by: <strong>{submission.assessmentData?.sentBackToIntakeBy || 'Unknown'}</strong></span>
                <span>on: <strong>{submission.assessmentData?.sentBackToIntakeAt ? new Date(submission.assessmentData.sentBackToIntakeAt).toLocaleString() : '-'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const internalReasons = rejectionDetails.selectedReasons?.filter((r: any) => r.category === 'internal') || [];
    const externalReasons = rejectionDetails.selectedReasons?.filter((r: any) => r.category === 'external') || [];

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
        <div className="bg-amber-100 px-4 py-3 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-700" />
            <h4 className="font-semibold text-amber-800">Returned from Integration</h4>
          </div>
          <p className="text-sm text-amber-700 mt-1">
            This submission was sent back from Integration. The following details explain why:
          </p>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Return metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-amber-700 bg-amber-100/50 p-2 rounded">
            <span>Returned by: <strong>{rejectionDetails.returnedBy || submission.assessmentData?.sentBackToIntakeBy || 'Unknown'}</strong></span>
            <span>on: <strong>{rejectionDetails.returnedAt ? new Date(rejectionDetails.returnedAt).toLocaleString() : 
                         submission.assessmentData?.sentBackToIntakeAt ? new Date(submission.assessmentData.sentBackToIntakeAt).toLocaleString() : '-'}</strong></span>
          </div>

          {/* Internal Reasons */}
          {internalReasons.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">🔒 Internal Reasons</span>
                <Badge variant="secondary" className="text-xs">{internalReasons.length}</Badge>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 divide-y divide-blue-100">
                {internalReasons.map((reason: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    {reason.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Reasons */}
          {externalReasons.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-orange-700">📤 External Reasons</span>
                <Badge variant="secondary" className="text-xs">{externalReasons.length}</Badge>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 divide-y divide-orange-100">
                {externalReasons.map((reason: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    {reason.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {rejectionDetails.comments && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">💬 Additional Comments</p>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm text-gray-700">{rejectionDetails.comments}</p>
              </div>
            </div>
          )}

          {/* Fallback: Show raw reason if no structured data */}
          {internalReasons.length === 0 && externalReasons.length === 0 && rejectionDetails.rawReason && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">📝 Return Reason</p>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{rejectionDetails.rawReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Main review dialog ────────────────────────────────────────────────────

  const renderDocumentViewer = () => {
    if (!selectedSubmission) return null;

    const { allDocsVerified, allChecksPassed, totalChecks, completedChecks, totalDocs, verifiedDocs } = getReviewState();
    const isReviewComplete = allChecksPassed && allDocsVerified;

    // ── Submit button gate logic ──────────────────────────────────────────
    // Can only click Submit when:
    // 1. All docs are verified
    // 2. A decision is chosen
    // Approve is only selectable when all checklist items are done
    const canSubmit = allDocsVerified && reviewDecision !== '';

    // Approve radio is disabled unless all checklist items are ticked
    const canApprove = allChecksPassed && allDocsVerified;

    // Tooltip-style hint for the submit button
    const getSubmitHint = (): string | null => {
      if (!allDocsVerified) return `Verify all documents first (${verifiedDocs}/${totalDocs} done)`;
      if (!reviewDecision) return 'Select a review decision above';
      return null;
    };

    // Check if submission was sent back from Integration
    const wasSentBackFromIntegration = selectedSubmission.assessmentData?.sentBackToIntake === true;

    return (
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Review</DialogTitle>
            <DialogDescription>{selectedSubmission.id} — {selectedSubmission.candidateName}</DialogDescription>
          </DialogHeader>

          {/* Show detailed return from Integration banner */}
          {wasSentBackFromIntegration && renderReturnFromIntegrationDetails(selectedSubmission)}

          {(() => {
            const hasCorrectionHistory = !!(selectedSubmission.assessmentData?.correctionRecord);
            return (
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'details' | 'review' | 'history')} className="mt-4">
            <TabsList className={`grid w-full ${hasCorrectionHistory ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="details">
                Documents
                {!allDocsVerified && (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    {verifiedDocs}/{totalDocs}
                  </span>
                )}
                {allDocsVerified && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="review">
                Review Checklist
                {!allChecksPassed && (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    {completedChecks}/{totalChecks}
                  </span>
                )}
                {allChecksPassed && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">✓</span>
                )}
              </TabsTrigger>
              {hasCorrectionHistory && (
                <TabsTrigger value="history">
                  Correction History
                  <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                    v{selectedSubmission.assessmentData?.correctionRecord?.version ?? 1}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* ── Documents tab ── */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Process Type</p>
                    <p className="font-medium capitalize">
                      {selectedSubmission.processType === 'reissue' ? 'Re-Issue' : selectedSubmission.processType === 'replace' ? 'Replace' : 'Issue'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Certificate Type</p>
                    <p className="font-medium capitalize">{selectedSubmission.pathway || selectedSubmission.certificateType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date Submitted</p>
                    <p className="font-medium">{new Date(selectedSubmission.dateSubmitted).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Source</p>
                    <p className="font-medium">{selectedSubmission.source || '-'}</p>
                  </div>
                  {selectedSubmission.originalCertificateNumber && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Original Certificate #</p>
                      <p className="font-medium font-mono text-sm">{selectedSubmission.originalCertificateNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {renderCVSValidationResults(selectedSubmission)}

              <h4 className="font-medium text-lg">Documents ({selectedSubmission.documents.length})</h4>
              {selectedSubmission.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{getDocumentLabel(doc.type)}</p>
                      <p className="text-xs text-muted-foreground">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      {selectedSubmission.assessmentData?.documentValidations?.[doc.type] && (
                        <Badge
                          variant={selectedSubmission.assessmentData.documentValidations[doc.type].status === 'passed' ? 'outline' : selectedSubmission.assessmentData.documentValidations[doc.type].status === 'failed' ? 'destructive' : 'secondary'}
                          className="text-xs mt-1"
                        >
                          CVS: {selectedSubmission.assessmentData.documentValidations[doc.type].status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {doc.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          window.open(doc.url, '_blank');
                          setViewedDocuments(prev => ({ ...prev, [doc.id]: true }));
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    )}
                    <div className="flex items-center space-x-2 border-l pl-4">
                      <Checkbox
                        id={`verify-${doc.id}`}
                        checked={documentVerifications[doc.id] || false}
                        disabled={!viewedDocuments[doc.id]}
                        onCheckedChange={checked => {
                          if (!viewedDocuments[doc.id]) {
                            toast({ title: 'View Required', description: 'You must view the document before verifying it.', variant: 'destructive' });
                            return;
                          }
                          handleDocumentVerification(doc.id, checked as boolean);
                        }}
                      />
                      <div className="flex flex-col">
                        <Label htmlFor={`verify-${doc.id}`} className="text-sm">Verified</Label>
                        {!viewedDocuments[doc.id] && <span className="text-xs text-amber-600">View document first</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* ── Review Checklist tab ── */}
            <TabsContent value="review" className="space-y-4 mt-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-medium">Review Checklist</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manually re-confirm each CVS validation check. All must be ticked to approve.
                  </p>
                </div>
                <Badge variant={isReviewComplete ? 'default' : 'secondary'}>
                  {completedChecks}/{totalChecks} Complete
                </Badge>
              </div>

              <div className="space-y-4">
                {Object.entries(getGroupedReviewChecks(selectedSubmission)).map(([docType, group]) => {
                  const groupChecks = group.items;
                  const groupTotal = groupChecks.length;
                  const groupDone = groupChecks.filter(c => reviewChecks[c.id]).length;
                  const groupComplete = groupTotal > 0 && groupDone === groupTotal;
                  const cvsDocResult = selectedSubmission.assessmentData?.documentValidations?.[docType];
                  return (
                    <div key={docType} className="border rounded-lg overflow-hidden">
                      <div className={`flex items-center justify-between px-4 py-3 ${groupComplete ? 'bg-green-50 border-b border-green-200' : 'bg-muted border-b'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{group.docLabel}</span>
                          {cvsDocResult && (
                            <Badge variant={cvsDocResult.status === 'passed' ? 'outline' : cvsDocResult.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">
                              CVS: {cvsDocResult.status}
                            </Badge>
                          )}
                        </div>
                        <Badge variant={groupComplete ? 'default' : 'secondary'} className="text-xs">
                          {groupDone}/{groupTotal}
                        </Badge>
                      </div>
                      <div className="divide-y bg-card">
                        {groupChecks.map(check => (
                          <div key={check.id} className="flex items-start gap-3 px-4 py-3">
                            <Checkbox
                              id={`check-${check.id}`}
                              checked={reviewChecks[check.id] || false}
                              onCheckedChange={checked => handleReviewCheck(check.id, checked as boolean)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <Label htmlFor={`check-${check.id}`} className="text-sm font-medium cursor-pointer leading-snug">
                                {check.label}
                              </Label>
                              {check.cvsPassed !== undefined && (
                                <p className={`text-xs mt-0.5 ${check.cvsPassed ? 'text-green-600' : 'text-red-600'}`}>
                                  CVS result: {check.cvsPassed ? '✅ Passed' : '❌ Failed'}
                                  {!check.cvsPassed && check.cvsError ? ` — ${check.cvsError}` : ''}
                                </p>
                              )}
                            </div>
                            {reviewChecks[check.id] && (
                              <span className="text-green-600 text-xs font-medium shrink-0 mt-0.5">✓ Confirmed</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* ── Correction History tab — only when correctionRecord exists ── */}
            {!!(selectedSubmission.assessmentData?.correctionRecord) && (
              <TabsContent value="history" className="space-y-4 mt-4">
                {(() => {
                  const cr = selectedSubmission.assessmentData!.correctionRecord!;
                  const rd = (selectedSubmission.assessmentData as any)?.rejectionDetails as {
                    selectedReasonIds: string[];
                    selectedReasons: Array<{ id: string; label: string; category: string }>;
                    comments?: string;
                    returnedBy: string;
                    returnedAt: string;
                  } | undefined;

                  const internalReasons = rd?.selectedReasons.filter(r => r.category === 'internal') ?? [];
                  const externalReasons = rd?.selectedReasons.filter(r => r.category === 'external') ?? [];
                  const hasStructured = rd && rd.selectedReasons.length > 0;

                  // Parse fallback bullet string
                  const parseFallback = (raw: string) => {
                    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
                    const reasons: string[] = [];
                    let comments: string | null = null;
                    lines.forEach(line => {
                      if (line.startsWith('Additional comments:')) {
                        comments = line.replace('Additional comments:', '').trim();
                      } else {
                        reasons.push(line.replace(/^[•\-]\s*/, '').trim());
                      }
                    });
                    return { reasons, comments };
                  };
                  const fallback = parseFallback(cr.returnReason || '');

                  return (
                    <div className="space-y-5">

                      {/* ── Return reasons ── */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">What Was Returned & Why</h4>

                        {/* Header */}
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-amber-800">Returned for Corrections</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-amber-700">
                              {selectedSubmission.assessmentData?.returnedBy && (
                                <span>By <strong>{selectedSubmission.assessmentData.returnedBy}</strong></span>
                              )}
                              {selectedSubmission.assessmentData?.returnedAt && (
                                <span>on <strong>{new Date(selectedSubmission.assessmentData.returnedAt).toLocaleDateString()}</strong></span>
                              )}
                              {cr.todoDate && (
                                <span>Deadline: <strong>{new Date(cr.todoDate).toLocaleDateString()}</strong></span>
                              )}
                            </div>
                          </div>
                          <Badge variant={cr.errorType === 'integration_failure' ? 'destructive' : cr.errorType === 'missing_documentation' ? 'secondary' : 'outline'} className="shrink-0 text-xs">
                            {cr.errorType?.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        {hasStructured ? (
                          <div className="space-y-3">
                            {internalReasons.length > 0 && (
                              <div className="rounded-lg border border-blue-200 overflow-hidden">
                                <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">🔒 Internal Reasons</span>
                                  <Badge variant="secondary" className="text-xs ml-auto">{internalReasons.length}</Badge>
                                </div>
                                <ul className="divide-y divide-blue-100">
                                  {internalReasons.map(r => (
                                    <li key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm bg-white">
                                      <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                      {r.label}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {externalReasons.length > 0 && (
                              <div className="rounded-lg border border-orange-200 overflow-hidden">
                                <div className="px-4 py-2.5 bg-orange-50 border-b border-orange-200 flex items-center gap-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-orange-700">📤 External Reasons</span>
                                  <Badge variant="secondary" className="text-xs ml-auto">{externalReasons.length}</Badge>
                                </div>
                                <ul className="divide-y divide-orange-100">
                                  {externalReasons.map(r => (
                                    <li key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm bg-white">
                                      <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                                      {r.label}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {rd?.comments && (
                              <div className="rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">💬 Reviewer Comments</span>
                                </div>
                                <div className="px-4 py-3 bg-white"><p className="text-sm">{rd.comments}</p></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {fallback.reasons.length > 0 && (
                              <div className="rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Rejection Reasons</span>
                                  <Badge variant="secondary" className="text-xs ml-auto">{fallback.reasons.length}</Badge>
                                </div>
                                <ul className="divide-y divide-gray-100">
                                  {fallback.reasons.map((r, i) => (
                                    <li key={i} className="flex items-center gap-3 px-4 py-3 text-sm bg-white">
                                      <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />{r}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {fallback.comments && (
                              <div className="rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">💬 Reviewer Comments</span>
                                </div>
                                <div className="px-4 py-3 bg-white"><p className="text-sm">{fallback.comments}</p></div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ── External correction notes (what they said they fixed) ── */}
                      {(cr.correctionNotes?.length ?? 0) > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm">External Corrections Submitted</h4>
                          <div className="space-y-2">
                            {cr.correctionNotes!.map(note => (
                              <div key={note.id} className="rounded-lg border p-4 space-y-2 bg-card">
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">v{note.version} — {note.correctedBy}</Badge>
                                  <span className="text-xs text-muted-foreground">{new Date(note.correctedAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">What was corrected</p>
                                  <p className="text-sm mt-0.5">{note.whatWasCorrected}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Reason for change</p>
                                  <p className="text-sm mt-0.5">{note.reasonForChange}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Document version history ── */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Document Versions</h4>
                        <div className="space-y-3">
                          {selectedSubmission.documents.map(doc => {
                            const versions: Array<{ version: number; url: string; uploadedAt: string; uploadedBy: string; verified: boolean }> =
                              doc.versions || [{ version: 1, url: doc.url || '', uploadedAt: doc.uploadedAt, uploadedBy: selectedSubmission.createdBy, verified: doc.verified }];
                            const hasMultipleVersions = versions.length > 1;
                            const intakeVerification = selectedSubmission.assessmentData?.documentVerifications?.[doc.id];
                            const wasReturned = intakeVerification === false;
                            const isVerified = intakeVerification === true;

                            return (
                              <div key={doc.id} className={`rounded-lg border overflow-hidden ${wasReturned ? 'border-amber-200' : isVerified ? 'border-green-200' : 'border-gray-200'}`}>
                                {/* Doc header */}
                                <div className={`flex items-center justify-between px-4 py-3 ${wasReturned ? 'bg-amber-50' : isVerified ? 'bg-green-50' : 'bg-muted'}`}>
                                  <div className="flex items-center gap-2">
                                    <FileText className={`h-4 w-4 ${wasReturned ? 'text-amber-500' : isVerified ? 'text-green-500' : 'text-muted-foreground'}`} />
                                    <span className="text-sm font-medium">{getDocumentLabel(doc.type)}</span>
                                    {hasMultipleVersions && (
                                      <Badge variant="secondary" className="text-xs">{versions.length} versions</Badge>
                                    )}
                                  </div>
                                  {wasReturned ? (
                                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                      <AlertCircle className="h-3 w-3 mr-1" />Needed Correction
                                    </Badge>
                                  ) : isVerified ? (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />Verified
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">No Change</Badge>
                                  )}
                                </div>

                                {/* Version list */}
                                <div className="divide-y bg-white">
                                  {versions.map((v, idx) => {
                                    const isOriginal = idx === 0;
                                    const isLatest = idx === versions.length - 1;
                                    const isReplacement = idx > 0;
                                    return (
                                      <div key={idx} className={`flex items-center justify-between px-4 py-3 ${isReplacement ? 'bg-blue-50/40' : ''}`}>
                                        <div className="flex items-center gap-3">
                                          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-mono text-xs font-medium">v{v.version}</span>
                                              {isOriginal && <Badge variant="outline" className="text-xs h-4 px-1">Original</Badge>}
                                              {isReplacement && <Badge variant="secondary" className="text-xs h-4 px-1 bg-blue-100 text-blue-700">Corrected</Badge>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-xs text-muted-foreground">
                                                {new Date(v.uploadedAt).toLocaleDateString()} by {v.uploadedBy}
                                              </span>
                                              {v.verified && <span className="text-xs text-green-600 font-medium">✓ verified</span>}
                                            </div>
                                          </div>
                                        </div>
                                        {v.url && (
                                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => window.open(v.url, '_blank')}>
                                            <Eye className="h-3 w-3 mr-1" /> View
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </TabsContent>
            )}
          </Tabs>
          );
          })()}

          {/* ── Decision section ── */}
          <div className="border-t pt-4 mt-4 space-y-4">
            <h4 className="font-medium">Review Decision</h4>

            {/* Prerequisites status bar */}
            <div className="rounded-lg border bg-muted p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Before you can submit:</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span>{allDocsVerified ? '✅' : '⬜'}</span>
                  <span className={allDocsVerified ? 'text-green-700' : 'text-muted-foreground'}>
                    All documents verified ({verifiedDocs}/{totalDocs})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{reviewDecision !== '' ? '✅' : '⬜'}</span>
                  <span className={reviewDecision !== '' ? 'text-green-700' : 'text-muted-foreground'}>
                    Review decision selected
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{allChecksPassed ? '✅' : '⬜'}</span>
                  <span className={allChecksPassed ? 'text-green-700' : 'text-amber-700'}>
                    All checklist items confirmed ({completedChecks}/{totalChecks}) — required to Approve
                  </span>
                </div>
              </div>
            </div>

            <RadioGroup
              value={reviewDecision}
              onValueChange={v => setReviewDecision(v as 'approved' | 'return')}
            >
              {/* Approve option — disabled unless all checks done and all docs verified */}
              <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                canApprove ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'
              }`}>
                <RadioGroupItem
                  value="approved"
                  id="approved"
                  disabled={!canApprove}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="approved" className={`font-medium ${canApprove ? 'text-green-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}>
                    Approve — Send to Integration
                  </Label>
                  {!canApprove && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Available only when all documents are verified and all checklist items are confirmed.
                    </p>
                  )}
                </div>
              </div>

              {/* Return option — always selectable once docs are verified */}
              <div className={`flex items-start gap-3 p-3 rounded-lg border mt-2 transition-colors ${
                allDocsVerified ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50 opacity-60'
              }`}>
                <RadioGroupItem
                  value="return"
                  id="return"
                  disabled={!allDocsVerified}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="return" className={`font-medium ${allDocsVerified ? 'text-amber-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}>
                    Return for Corrections
                  </Label>
                  {reviewDecision === 'return' && (
                    <p className="text-xs text-amber-700 mt-1">
                      Clicking "Submit Decision" will open the rejection details form.
                    </p>
                  )}
                  {!allDocsVerified && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Verify all documents first before returning.
                    </p>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* ── Footer buttons ── */}
          <div className="flex items-center justify-between pt-4 border-t mt-2">
            <div>
              {getSubmitHint() && (
                <p className="text-xs text-amber-700 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {getSubmitHint()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDocumentModalOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmitDecisionClick}
                disabled={!canSubmit}
                variant={reviewDecision === 'return' ? 'destructive' : 'default'}
              >
                {reviewDecision === 'return' ? 'Submit Decision →' : 'Submit Decision'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────

  const visibleSubmissions = getVisibleSubmissions();

  const getProcessLabel = (type: ProcessType) => {
    switch (type) {
      case 'issue': return 'Issue';
      case 'reissue': return 'Re-Issue';
      case 'replace': return 'Replace';
    }
  };

  const getProcessBadgeVariant = (type: ProcessType): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'issue': return 'default';
      case 'reissue': return 'secondary';
      case 'replace': return 'outline';
    }
  };

  if (visibleSubmissions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Intake</h2>
          <p className="text-muted-foreground">Review and process submissions</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No submissions to review</p>
              <p className="text-sm">All submissions have been processed.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Intake</h2>
        <p className="text-muted-foreground">Review and process submissions</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Submissions Waiting for Review</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Pathway</TableHead>
                <TableHead>CVS Validation</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-center">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSubmissions.map(sub => {
                const docValidations = sub.assessmentData?.documentValidations;
                let cvsStatus: 'all_passed' | 'some_failed' | 'not_run' = 'not_run';
                if (docValidations) {
                  const entries = Object.values(docValidations) as any[];
                  const anyFailed = entries.some(v => v.status === 'failed');
                  const allPassed = entries.length > 0 && entries.every(v => v.status === 'passed');
                  cvsStatus = allPassed ? 'all_passed' : anyFailed ? 'some_failed' : 'not_run';
                }
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                    <TableCell>
                      <Badge variant={getProcessBadgeVariant(sub.processType)}>{getProcessLabel(sub.processType)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{sub.candidateName}</TableCell>
                    <TableCell>{sub.certificateType}</TableCell>
                    <TableCell className="capitalize">{sub.pathway || '-'}</TableCell>
                    <TableCell>
                      {cvsStatus === 'all_passed' && <Badge variant="outline" className="text-green-700 border-green-300 text-xs">All Passed</Badge>}
                      {cvsStatus === 'some_failed' && <Badge variant="destructive" className="text-xs">Issues Found</Badge>}
                      {cvsStatus === 'not_run' && <Badge variant="secondary" className="text-xs">Not Run</Badge>}
                    </TableCell>
                    <TableCell>{new Date(sub.dateSubmitted).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" onClick={() => handleViewDocuments(sub)}>
                        <Eye className="h-4 w-4 mr-1" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {renderDocumentViewer()}
      {renderRejectionModal()}
    </div>
  );
}

// ─── Local Label component ────────────────────────────────────────────────────
function Label({ htmlFor, children, className }: { htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium leading-none ${className}`}>
      {children}
    </label>
  );
}