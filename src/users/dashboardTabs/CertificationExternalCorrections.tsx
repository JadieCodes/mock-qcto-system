import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  FileText,
  Upload,
  GitBranch,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import type {
  Submission,
  SubmissionStatus,
  CorrectionRecord,
  CorrectionNote,
  DocumentType,
  DocumentVersion,
} from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ERROR_TYPE_LABELS: Record<string, string> = {
  missing_documentation: 'Missing Documentation',
  incorrect_learner_details: 'Incorrect Learner Details',
  qualification_mismatch: 'Qualification Mismatch',
  integration_failure: 'Integration Failure',
  printing_error: 'Printing Error',
};

export default function CertificationExternalCorrections() {
  const { profileSubmissions, currentRole, updateSubmission } = useApp();
  const { toast } = useToast();

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  const [preIntakeValidationStatus, setPreIntakeValidationStatus] = useState<'idle' | 'processing' | 'passed' | 'failed'>('idle');
  const [preIntakeValidationError, setPreIntakeValidationError] = useState('');
  const [preIntakeChecks, setPreIntakeChecks] = useState<
    Array<{ id: string; label: string; status: 'pending' | 'processing' | 'passed' | 'failed'; message?: string }>
  >([]);
  const [preIntakeProgress, setPreIntakeProgress] = useState(0);
  const [preIntakeTestMode, setPreIntakeTestMode] = useState<'pass' | 'fail'>('pass');
  const [preIntakeValidationSummary, setPreIntakeValidationSummary] = useState<{
    totalLearners: number;
    passedLearners: number;
    failedLearners: number;
    failedRows?: Array<{ learnerIdentifier: string; reason: string }>;
  } | null>(null);
  const [correctionNotes, setCorrectionNotes] = useState({
    whatWasCorrected: '',
    reasonForChange: '',
  });
  const [updatedFiles, setUpdatedFiles] = useState<{
    [key in DocumentType]?: { file: string; version: number };
  }>({});
  const [resubmitMode, setResubmitMode] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────

  const isCorrectionExpired = (submission: Submission) => {
    const todoDate = submission.assessmentData?.correctionRecord?.todoDate;
    if (!todoDate) return false;
    return new Date(todoDate).getTime() < Date.now();
  };

  const correctionSubmissions = profileSubmissions
    .filter(
      sub =>
        sub.status === 'pending_correction' &&
        sub.assessmentData?.correctionRecord &&
        sub.assessmentData.correctionRecord.responsibleUnit === currentRole
    )
    .sort(
      (a, b) =>
        new Date(b.assessmentData?.returnedAt || b.dateSubmitted).getTime() -
        new Date(a.assessmentData?.returnedAt || a.dateSubmitted).getTime()
    );

  const handleViewCorrection = (submission: Submission) => {
    if (isCorrectionExpired(submission)) {
      toast({
        title: 'Correction Expired',
        description: 'This correction deadline has passed. Please submit a brand new submission.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedSubmission(submission);
    setActiveTab('details');
    setCorrectionNotes({ whatWasCorrected: '', reasonForChange: '' });
    setUpdatedFiles({});
    setResubmitMode(false);
    resetPreIntakeValidation();
    setPreIntakeTestMode('pass');
    setIsCorrectionModalOpen(true);
  };

  const getDocumentVersions = (doc: any): DocumentVersion[] => {
    return doc.versions || [{
      version: 1,
      url: doc.url || '',
      uploadedAt: doc.uploadedAt,
      uploadedBy: selectedSubmission?.createdBy || 'Unknown',
      verified: doc.verified || false,
    }];
  };

  const getDocumentLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      application_form: 'Application Form', approval_letter: 'Approval Letter', affidavit: 'Affidavit',
      original_certificate: 'Original Certificate', proof_of_payment: 'Proof of Payment',
      recommendation_letter: 'Recommendation Letter', id_copy: 'ID Copy', file_3_4: 'File 3 to 4',
      programme_approval_letter: 'Programme Approval Letter', learner_result_approval_sheet: 'Learner Result Approval Sheet',
      qualification_data_confirmation: 'Qualification/Programme Data Confirmation',
      supporting_achievement_documentation: 'Supporting Achievement Documentation',
      signed_declaration: 'Signed Declaration', learner_achievement_data_proof: 'Learner Achievement Data Proof',
      qualification_confirmation: 'Qualification Confirmation', bio_data_confirmation: 'Bio Data Confirmation',
      historical_verification: 'Historical Verification', reissue_application_form: 'Re-Issue Application Form',
      replace_application_form: 'Replace Application Form', namb_documentation: 'NAMB Documentation', other: 'Other Document',
    };
    return labels[type] || type;
  };

  const needsFile34Revalidation = () => {
    if (!selectedSubmission) return false;
    const file34Doc = selectedSubmission.documents.find(doc => doc.type === 'file_3_4');
    if (!file34Doc) return false;
    const intakeVerification = selectedSubmission.assessmentData?.documentVerifications?.[file34Doc.id];
    return intakeVerification === false && !!updatedFiles['file_3_4'];
  };

  // ── CVS validation ────────────────────────────────────────────────────────

  const initializePreIntakeChecks = () => {
    const checks: Array<{
      id: string;
      label: string;
      status: 'pending' | 'processing' | 'passed' | 'failed';
      message?: string;
    }> = [
      { id: 'connection', label: 'Connecting to CVS...', status: 'pending' },
      { id: 'bio_data', label: 'Checking learner bio data in File 3 to 4...', status: 'pending' },
      { id: 'qualification', label: 'Checking qualification code against CVS rules...', status: 'pending' },
    ];
    setPreIntakeChecks(checks);
    return checks;
  };

  const resetPreIntakeValidation = () => {
    setPreIntakeValidationStatus('idle');
    setPreIntakeValidationError('');
    setPreIntakeChecks([]);
    setPreIntakeProgress(0);
    setPreIntakeValidationSummary(null);
  };

  const runPreIntakeValidation = async () => {
    const checks = initializePreIntakeChecks();
    const updatedChecks = [...checks];
    const shouldPass = preIntakeTestMode === 'pass';
    setPreIntakeValidationStatus('processing');
    setPreIntakeValidationError('');
    setPreIntakeProgress(0);
    setPreIntakeValidationSummary(null);
    const totalLearners = 25;

    updatedChecks[0].status = 'processing';
    setPreIntakeChecks([...updatedChecks]);
    await new Promise(r => setTimeout(r, 700));
    setPreIntakeProgress(30);
    if (!shouldPass) {
      updatedChecks[0].status = 'failed';
      updatedChecks[0].message = 'CVS connection timed out';
      setPreIntakeChecks([...updatedChecks]);
      setPreIntakeValidationStatus('failed');
      setPreIntakeValidationError('Could not connect to CVS. Please retry or correct the file before resubmitting.');
      setPreIntakeValidationSummary({ totalLearners, passedLearners: 0, failedLearners: totalLearners, failedRows: [{ learnerIdentifier: 'ALL_ROWS', reason: 'CVS connection failed' }] });
      return false;
    }
    updatedChecks[0].status = 'passed';
    setPreIntakeChecks([...updatedChecks]);

    updatedChecks[1].status = 'processing';
    setPreIntakeChecks([...updatedChecks]);
    await new Promise(r => setTimeout(r, 900));
    setPreIntakeProgress(65);
    if (!shouldPass) {
      updatedChecks[1].status = 'failed';
      updatedChecks[1].message = 'Learner ID / bio data mismatch in File 3 to 4';
      setPreIntakeChecks([...updatedChecks]);
      setPreIntakeValidationStatus('failed');
      setPreIntakeValidationError('Bio data mismatch found. Please correct learner details before resubmitting.');
      setPreIntakeValidationSummary({ totalLearners, passedLearners: 18, failedLearners: 7, failedRows: [{ learnerIdentifier: 'ROW 3', reason: 'ID number mismatch' }, { learnerIdentifier: 'ROW 7', reason: 'Date of birth mismatch' }] });
      return false;
    }
    updatedChecks[1].status = 'passed';
    setPreIntakeChecks([...updatedChecks]);

    updatedChecks[2].status = 'processing';
    setPreIntakeChecks([...updatedChecks]);
    await new Promise(r => setTimeout(r, 900));
    setPreIntakeProgress(100);
    if (!shouldPass) {
      updatedChecks[2].status = 'failed';
      updatedChecks[2].message = 'Qualification code does not match CVS validation rules';
      setPreIntakeChecks([...updatedChecks]);
      setPreIntakeValidationStatus('failed');
      setPreIntakeValidationError('Qualification code validation failed for File 3 to 4.');
      setPreIntakeValidationSummary({ totalLearners, passedLearners: 20, failedLearners: 5, failedRows: [{ learnerIdentifier: 'ROW 2', reason: 'Qualification code invalid' }] });
      return false;
    }
    updatedChecks[2].status = 'passed';
    setPreIntakeChecks([...updatedChecks]);
    setPreIntakeValidationStatus('passed');
    setPreIntakeValidationSummary({ totalLearners, passedLearners: totalLearners, failedLearners: 0, failedRows: [] });
    return true;
  };

  const getPreIntakeValidationStats = () => ({
    totalChecks: preIntakeChecks.length,
    passedChecks: preIntakeChecks.filter(c => c.status === 'passed').length,
    failedChecks: preIntakeChecks.filter(c => c.status === 'failed').length,
  });

  // ── Structured rejection details panel ───────────────────────────────────

  /**
   * Renders the structured rejection details that were captured in the Intake
   * rejection popup — shows internal vs external reasons, comments, and deadline.
   * Identical to the internal Corrections display.
   */
  const renderRejectionDetails = (submission: Submission) => {
    const correctionRecord = submission.assessmentData?.correctionRecord;
    if (!correctionRecord) return null;

    const rd = (submission.assessmentData as any)?.rejectionDetails as {
      selectedReasonIds: string[];
      selectedReasons: Array<{ id: string; label: string; category: string }>;
      comments?: string;
      returnedBy: string;
      returnedAt: string;
    } | undefined;

    const internalReasons = rd?.selectedReasons.filter(r => r.category === 'internal') ?? [];
    const externalReasons = rd?.selectedReasons.filter(r => r.category === 'external') ?? [];
    const hasStructured = rd && rd.selectedReasons.length > 0;

    // Parse bullet string for older submissions without rejectionDetails
    const parseFallbackLines = (raw: string): { reasons: string[]; comments: string | null } => {
      const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
      const reasonLines: string[] = [];
      let comments: string | null = null;
      lines.forEach(line => {
        if (line.startsWith('Additional comments:')) {
          comments = line.replace('Additional comments:', '').trim();
        } else {
          reasonLines.push(line.replace(/^[•\-]\s*/, '').trim());
        }
      });
      return { reasons: reasonLines, comments };
    };

    const fallback = parseFallbackLines(correctionRecord.returnReason || '');

    return (
      <div className="space-y-3">
        {/* Header — returned by / on / deadline */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800">Returned for Corrections</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-amber-700">
              {submission.assessmentData?.returnedBy && (
                <span>Returned by <strong>{submission.assessmentData.returnedBy}</strong></span>
              )}
              {submission.assessmentData?.returnedAt && (
                <span>on <strong>{new Date(submission.assessmentData.returnedAt).toLocaleDateString()}</strong></span>
              )}
              {correctionRecord.todoDate && (
                <span className={`font-medium ${isCorrectionExpired(submission) ? 'text-red-700' : 'text-amber-800'}`}>
                  Deadline: <strong>{new Date(correctionRecord.todoDate).toLocaleDateString()}</strong>
                  {isCorrectionExpired(submission) && ' ⚠️ Expired'}
                </span>
              )}
            </div>
          </div>
          {correctionRecord.errorType && (
            <Badge
              variant={correctionRecord.errorType === 'integration_failure' ? 'destructive' : correctionRecord.errorType === 'missing_documentation' ? 'secondary' : 'outline'}
              className="shrink-0 text-xs"
            >
              {ERROR_TYPE_LABELS[correctionRecord.errorType] ?? correctionRecord.errorType.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        {hasStructured ? (
          // ── Structured display (new submissions with rejectionDetails) ──
          <div className="space-y-3">
            {internalReasons.length > 0 && (
              <div className="rounded-lg border border-blue-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">🔒 Internal Reasons</span>
                  <span className="text-xs text-blue-500">process / admin issues</span>
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
                  <span className="text-xs text-orange-500">your documents / data</span>
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
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">💬 Additional Comments from Reviewer</span>
                </div>
                <div className="px-4 py-3 bg-white">
                  <p className="text-sm text-gray-800">{rd.comments}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // ── Fallback: parse the older bullet-string format ──
          <div className="space-y-3">
            {fallback.reasons.length > 0 && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">Rejection Reasons</span>
                  <Badge variant="secondary" className="text-xs ml-auto">{fallback.reasons.length}</Badge>
                </div>
                <ul className="divide-y divide-gray-100">
                  {fallback.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-center gap-3 px-4 py-3 text-sm bg-white">
                      <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {fallback.comments && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">💬 Additional Comments</span>
                </div>
                <div className="px-4 py-3 bg-white">
                  <p className="text-sm text-gray-800">{fallback.comments}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Resubmit handler ──────────────────────────────────────────────────────

  const handleResubmitCorrection = () => {
    if (!selectedSubmission) return;
    if (isCorrectionExpired(selectedSubmission)) {
      toast({ title: 'Correction Expired', description: 'Deadline missed. Please create a new submission.', variant: 'destructive' });
      return;
    }
    const correctionRecord = selectedSubmission.assessmentData?.correctionRecord;
    if (!correctionRecord) {
      toast({ title: 'Correction Record Missing', description: 'This submission has no correction record attached.', variant: 'destructive' });
      return;
    }
    if (!correctionNotes.whatWasCorrected.trim() || !correctionNotes.reasonForChange.trim()) {
      toast({ title: 'Correction Notes Required', description: 'Please document what was corrected and the reason for change.', variant: 'destructive' });
      return;
    }
    if (needsFile34Revalidation() && preIntakeValidationStatus !== 'passed') {
      toast({ title: 'CVS Validation Required', description: 'Corrected File 3 to 4 must pass CVS validation before resubmitting.', variant: 'destructive' });
      return;
    }

    const currentVersion = correctionRecord.version || 0;

    const updatedDocuments = selectedSubmission.documents.map(doc => {
      if (updatedFiles[doc.type]) {
        const versions = doc.versions || [{ version: 1, url: doc.url || '', uploadedAt: doc.uploadedAt, uploadedBy: selectedSubmission.createdBy, verified: doc.verified }];
        return {
          ...doc, url: updatedFiles[doc.type]?.file || doc.url, uploadedAt: new Date().toISOString(), verified: false,
          versions: [...versions, { version: versions.length + 1, url: updatedFiles[doc.type]?.file || '', uploadedAt: new Date().toISOString(), uploadedBy: currentRole, verified: false }],
        };
      }
      return doc;
    });

    const newCorrectionNote: CorrectionNote = {
      id: `NOTE-${Date.now()}`, whatWasCorrected: correctionNotes.whatWasCorrected,
      reasonForChange: correctionNotes.reasonForChange, correctedBy: currentRole,
      correctedAt: new Date().toISOString(), version: currentVersion + 1,
    };

    const updatedCorrectionRecord: CorrectionRecord = {
      ...correctionRecord, currentStatus: 'pending_review', lastUpdated: new Date().toISOString(),
      version: currentVersion + 1, correctionNotes: [...(correctionRecord.correctionNotes || []), newCorrectionNote],
    };

    const updatedSubmission: Submission = {
      ...selectedSubmission, documents: updatedDocuments, status: 'submitted' as SubmissionStatus,
      assessmentData: {
        ...selectedSubmission.assessmentData, correctionRecord: updatedCorrectionRecord,
        resubmittedAt: new Date().toISOString(), resubmittedBy: currentRole, resubmitted: true,
        reviewCompleted: false, reviewDecision: undefined, returnReason: undefined, returnedBy: undefined, returnedAt: undefined,
        preIntakeValidationSummary: needsFile34Revalidation() ? preIntakeValidationSummary || undefined : selectedSubmission.assessmentData?.preIntakeValidationSummary,
        preIntakeValidationStatus: needsFile34Revalidation() ? (preIntakeValidationStatus === 'passed' ? 'passed' : 'failed') : selectedSubmission.assessmentData?.preIntakeValidationStatus,
        preIntakeValidationAt: needsFile34Revalidation() ? new Date().toISOString() : selectedSubmission.assessmentData?.preIntakeValidationAt,
        preIntakeValidatedBy: needsFile34Revalidation() ? currentRole : selectedSubmission.assessmentData?.preIntakeValidatedBy,
        preIntakeValidationError: needsFile34Revalidation() ? (preIntakeValidationStatus === 'failed' ? preIntakeValidationError : undefined) : selectedSubmission.assessmentData?.preIntakeValidationError,
        preIntakeSystemChecks: needsFile34Revalidation() ? preIntakeChecks.map(c => ({ name: c.label, passed: c.status === 'passed', error: c.message })) : selectedSubmission.assessmentData?.preIntakeSystemChecks,
        preIntakeValidationStats: needsFile34Revalidation() ? getPreIntakeValidationStats() : selectedSubmission.assessmentData?.preIntakeValidationStats,
      },
    };

    updateSubmission(selectedSubmission.id, updatedSubmission);
    toast({ title: 'Resubmitted for Review', description: `Correction v${updatedCorrectionRecord.version} has been sent for review.` });
    setIsCorrectionModalOpen(false);
    setSelectedSubmission(null);
    setResubmitMode(false);
    setCorrectionNotes({ whatWasCorrected: '', reasonForChange: '' });
    setUpdatedFiles({});
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Corrections</h2>
        <p className="text-muted-foreground">View returned submissions, make corrections, and resubmit for review</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Returned Submissions</CardTitle>
          <CardDescription>{correctionSubmissions.length} submission(s) returned for correction</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Certificate Type</TableHead>
                <TableHead>Process Type</TableHead>
                <TableHead>Returned On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>To Do By</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {correctionSubmissions.map(sub => (
                <TableRow key={sub.id}>
                  <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                  <TableCell className="font-medium">{sub.candidateName}</TableCell>
                  <TableCell className="capitalize">{sub.pathway || sub.certificateType}</TableCell>
                  <TableCell className="capitalize">
                    {sub.processType === 'reissue' ? 'Re-Issue' : sub.processType === 'replace' ? 'Replace' : 'Issue'}
                  </TableCell>
                  <TableCell>{sub.assessmentData?.returnedAt ? new Date(sub.assessmentData.returnedAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    {isCorrectionExpired(sub) ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700">Returned</Badge>
                    )}
                  </TableCell>
                  <TableCell>{sub.assessmentData?.correctionRecord?.todoDate ? new Date(sub.assessmentData.correctionRecord.todoDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => handleViewCorrection(sub)}>
                      <Eye className="h-4 w-4 mr-1" /> View &amp; Correct
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {correctionSubmissions.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No returned submissions found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Correction Modal */}
      <Dialog open={isCorrectionModalOpen} onOpenChange={setIsCorrectionModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{resubmitMode ? 'Resubmit Corrected Submission' : 'Submission Returned for Corrections'}</DialogTitle>
            <DialogDescription>{selectedSubmission?.id} — {selectedSubmission?.candidateName}</DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'details' | 'documents')} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Correction Details</TabsTrigger>
                <TabsTrigger value="documents">Documents &amp; Versions</TabsTrigger>
              </TabsList>

              {/* ── Details tab ── */}
              <TabsContent value="details" className="space-y-5 mt-4">

                {/* ── Correction timeline header ── */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Correction Timeline</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      The full back-and-forth between Intake and your submissions.
                    </p>
                  </div>
                  {selectedSubmission.assessmentData?.correctionRecord && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        v{selectedSubmission.assessmentData.correctionRecord.version}
                      </Badge>
                      <Badge
                        variant={selectedSubmission.assessmentData.correctionRecord.currentStatus === 'active' ? 'default' : 'secondary'}
                        className="text-xs capitalize"
                      >
                        {selectedSubmission.assessmentData.correctionRecord.currentStatus.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* ── Timeline: Intake return reason (always first) ── */}
                <div className="relative pl-6 space-y-1 before:absolute before:left-2 before:top-3 before:bottom-0 before:w-px before:bg-border">
                  {/* Dot */}
                  <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
                    <span className="text-white text-xs leading-none">!</span>
                  </div>

                  <div className="rounded-lg border border-amber-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">📋 Returned by Intake</span>
                      <div className="ml-auto flex items-center gap-2 text-xs text-amber-700">
                        {selectedSubmission.assessmentData?.returnedBy && (
                          <span>by <strong>{selectedSubmission.assessmentData.returnedBy}</strong></span>
                        )}
                        {selectedSubmission.assessmentData?.returnedAt && (
                          <span>{new Date(selectedSubmission.assessmentData.returnedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Rejection reasons inline */}
                    <div className="p-4 space-y-3 bg-white">
                      {(() => {
                        const rd = (selectedSubmission.assessmentData as any)?.rejectionDetails as {
                          selectedReasons: Array<{ id: string; label: string; category: string }>;
                          comments?: string;
                        } | undefined;
                        const cr = selectedSubmission.assessmentData?.correctionRecord;

                        const internalReasons = rd?.selectedReasons.filter(r => r.category === 'internal') ?? [];
                        const externalReasons = rd?.selectedReasons.filter(r => r.category === 'external') ?? [];
                        const hasStructured = rd && rd.selectedReasons.length > 0;

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
                        const fallback = parseFallback(cr?.returnReason || '');

                        if (hasStructured) {
                          return (
                            <div className="space-y-3">
                              {internalReasons.length > 0 && (
                                <div className="rounded-lg border border-blue-200 overflow-hidden">
                                  <div className="px-3 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                                    <span className="text-xs font-semibold text-blue-700">🔒 Internal Reasons</span>
                                    <Badge variant="secondary" className="text-xs ml-auto">{internalReasons.length}</Badge>
                                  </div>
                                  <ul className="divide-y divide-blue-100">
                                    {internalReasons.map(r => (
                                      <li key={r.id} className="flex items-center gap-3 px-3 py-2.5 text-sm bg-white">
                                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />{r.label}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {externalReasons.length > 0 && (
                                <div className="rounded-lg border border-orange-200 overflow-hidden">
                                  <div className="px-3 py-2 bg-orange-50 border-b border-orange-200 flex items-center gap-2">
                                    <span className="text-xs font-semibold text-orange-700">📤 Issues with Your Submission</span>
                                    <Badge variant="secondary" className="text-xs ml-auto">{externalReasons.length}</Badge>
                                  </div>
                                  <ul className="divide-y divide-orange-100">
                                    {externalReasons.map(r => (
                                      <li key={r.id} className="flex items-center gap-3 px-3 py-2.5 text-sm bg-white">
                                        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />{r.label}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {rd?.comments && (
                                <div className="rounded-lg border border-gray-200 overflow-hidden">
                                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                    <span className="text-xs font-semibold text-gray-600">💬 Reviewer Comments</span>
                                  </div>
                                  <div className="px-3 py-2.5 bg-white">
                                    <p className="text-sm">{rd.comments}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            {fallback.reasons.length > 0 && (
                              <div className="rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-600">Rejection Reasons</span>
                                  <Badge variant="secondary" className="text-xs ml-auto">{fallback.reasons.length}</Badge>
                                </div>
                                <ul className="divide-y divide-gray-100">
                                  {fallback.reasons.map((r, i) => (
                                    <li key={i} className="flex items-center gap-3 px-3 py-2.5 text-sm bg-white">
                                      <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />{r}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {fallback.comments && (
                              <div className="rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                  <span className="text-xs font-semibold text-gray-600">💬 Comments</span>
                                </div>
                                <div className="px-3 py-2.5 bg-white"><p className="text-sm">{fallback.comments}</p></div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Deadline */}
                      {selectedSubmission.assessmentData?.correctionRecord?.todoDate && (
                        <div className={`flex items-center gap-2 text-xs rounded-md px-3 py-2 ${isCorrectionExpired(selectedSubmission) ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          Correction deadline: <strong>{new Date(selectedSubmission.assessmentData.correctionRecord.todoDate).toLocaleDateString()}</strong>
                          {isCorrectionExpired(selectedSubmission) && ' — ⚠️ Expired'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Timeline: each external correction round ── */}
                {(selectedSubmission.assessmentData?.correctionRecord?.correctionNotes?.length ?? 0) > 0 && (
                  <div className="space-y-4">
                    {selectedSubmission.assessmentData!.correctionRecord!.correctionNotes!.map((note, idx) => (
                      <div key={note.id} className="relative pl-6 before:absolute before:left-2 before:top-3 before:bottom-0 before:w-px before:bg-border">
                        {/* Dot */}
                        <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center">
                          <span className="text-white text-xs leading-none font-medium">{idx + 1}</span>
                        </div>

                        <div className="rounded-lg border border-blue-200 overflow-hidden">
                          {/* Header */}
                          <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                              ✏️ Your Correction — v{note.version}
                            </span>
                            <div className="ml-auto flex items-center gap-2 text-xs text-blue-700">
                              <span>by <strong>{note.correctedBy}</strong></span>
                              <span>{new Date(note.correctedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Note body */}
                          <div className="p-4 space-y-3 bg-white">
                            <div className="rounded-md border border-gray-200 overflow-hidden">
                              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">What was corrected</span>
                              </div>
                              <div className="px-3 py-2.5">
                                <p className="text-sm">{note.whatWasCorrected}</p>
                              </div>
                            </div>
                            <div className="rounded-md border border-gray-200 overflow-hidden">
                              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reason for change</span>
                              </div>
                              <div className="px-3 py-2.5">
                                <p className="text-sm">{note.reasonForChange}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Integration error log ── */}
                {selectedSubmission.assessmentData?.correctionRecord?.integrationErrorLog && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-red-500 border-2 border-background" />
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-medium text-red-800 text-sm">⚠️ Integration Error</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-xs text-red-600">System</p><p className="font-medium">{selectedSubmission.assessmentData.correctionRecord.integrationErrorLog.system}</p></div>
                        <div><p className="text-xs text-red-600">Error Time</p><p className="font-medium">{new Date(selectedSubmission.assessmentData.correctionRecord.integrationErrorLog.errorTimestamp).toLocaleString()}</p></div>
                        <div className="col-span-2"><p className="text-xs text-red-600">Message</p><p className="text-sm mt-1">{selectedSubmission.assessmentData.correctionRecord.integrationErrorLog.errorMessage}</p></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── New correction form ── */}
                {!resubmitMode && (
                  <div className="flex justify-end pt-2">
                    <Button onClick={() => setResubmitMode(true)}>
                      <Upload className="h-4 w-4 mr-2" /> Start Correction
                    </Button>
                  </div>
                )}

                {resubmitMode && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                      <span className="text-white text-xs">+</span>
                    </div>
                    <div className="border rounded-lg overflow-hidden border-green-200">
                      <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                        <span className="text-xs font-semibold uppercase tracking-wide text-green-800">
                          ✏️ Your Correction — v{(selectedSubmission.assessmentData?.correctionRecord?.version ?? 0) + 1}
                        </span>
                        <p className="text-xs text-green-700 mt-0.5">Document your changes before resubmitting.</p>
                      </div>
                      <div className="p-4 space-y-3 bg-white">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">What was corrected? <span className="text-red-500">*</span></Label>
                          <Textarea
                            value={correctionNotes.whatWasCorrected}
                            onChange={e => setCorrectionNotes({ ...correctionNotes, whatWasCorrected: e.target.value })}
                            placeholder="Describe what changes were made..."
                            rows={2}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium">Reason for change <span className="text-red-500">*</span></Label>
                          <Textarea
                            value={correctionNotes.reasonForChange}
                            onChange={e => setCorrectionNotes({ ...correctionNotes, reasonForChange: e.target.value })}
                            placeholder="Explain why these changes were necessary..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── Documents tab ── */}
              <TabsContent value="documents" className="space-y-4 mt-4">
                <h4 className="font-medium">Document Versions</h4>
                <div className="space-y-4">
                  {selectedSubmission.documents.map(doc => {
                    const versions = getDocumentVersions(doc);
                    const latestVersion = versions[versions.length - 1];
                    const needsCorrection = !latestVersion.verified;

                    return (
                      <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className={`h-5 w-5 ${needsCorrection ? 'text-amber-500' : 'text-green-500'}`} />
                            <div>
                              <p className="font-medium">{getDocumentLabel(doc.type)}</p>
                              <p className="text-xs text-muted-foreground">Current Version: v{versions.length}</p>
                            </div>
                          </div>
                          {latestVersion.verified ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700"><AlertCircle className="h-3 w-3 mr-1" />Needs Correction</Badge>
                          )}
                        </div>

                        <div className="ml-8 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Version History:</p>
                          {versions.map((version, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-3 w-3 text-muted-foreground" />
                                <span className="font-mono text-xs">v{version.version}</span>
                                <span className="text-xs text-muted-foreground">Uploaded: {new Date(version.uploadedAt).toLocaleDateString()}</span>
                                <Badge variant="outline" className="text-xs">{version.uploadedBy}</Badge>
                              </div>
                              {version.url && (
                                <Button variant="ghost" size="sm" className="h-6" onClick={() => window.open(version.url, '_blank')}>
                                  <Eye className="h-3 w-3 mr-1" /> View
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* CVS re-validation for corrected File 3 to 4 */}
                        {doc.type === 'file_3_4' && needsFile34Revalidation() && (
                          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 space-y-4">
                            <div>
                              <h4 className="font-medium text-blue-900">Re-run CVS Validation for corrected File 3 to 4</h4>
                              <p className="text-sm text-blue-700">File 3 to 4 was marked as needing correction and has been re-uploaded. It must pass CVS validation again before resubmission.</p>
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" variant={preIntakeTestMode === 'pass' ? 'default' : 'outline'} onClick={() => setPreIntakeTestMode('pass')}>Force Pass</Button>
                              <Button type="button" variant={preIntakeTestMode === 'fail' ? 'destructive' : 'outline'} onClick={() => setPreIntakeTestMode('fail')}>Force Fail</Button>
                            </div>
                            {preIntakeValidationStatus === 'processing' && (
                              <div className="space-y-1">
                                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${preIntakeProgress}%` }} /></div>
                                <p className="text-xs text-muted-foreground">{preIntakeProgress}% complete</p>
                              </div>
                            )}
                            {preIntakeChecks.length > 0 && (
                              <div className="space-y-2">
                                {preIntakeChecks.map(check => (
                                  <div key={check.id} className="flex items-start gap-2 text-sm">
                                    <span>{check.status === 'passed' ? '✅' : check.status === 'failed' ? '❌' : check.status === 'processing' ? '⏳' : '•'}</span>
                                    <div><p>{check.label}</p>{check.message && <p className="text-xs text-red-600">{check.message}</p>}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {preIntakeValidationStatus === 'failed' && (
                              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                <p className="text-sm font-medium text-red-800">Validation Failed</p>
                                <p className="text-sm text-red-700 mt-1">{preIntakeValidationError}</p>
                              </div>
                            )}
                            {preIntakeValidationStatus === 'passed' && (
                              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                <p className="text-sm font-medium text-green-800">✓ CVS Validation Passed</p>
                              </div>
                            )}
                            {preIntakeValidationSummary && (
                              <div className="rounded-lg border bg-white p-3 space-y-2">
                                <p className="text-sm font-medium">Learner Validation Summary</p>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                  <div className="rounded border p-2"><p className="text-muted-foreground text-xs">Total Learners</p><p className="font-semibold">{preIntakeValidationSummary.totalLearners}</p></div>
                                  <div className="rounded border p-2"><p className="text-muted-foreground text-xs">Passed</p><p className="font-semibold text-green-600">{preIntakeValidationSummary.passedLearners}</p></div>
                                  <div className="rounded border p-2"><p className="text-muted-foreground text-xs">Failed</p><p className="font-semibold text-red-600">{preIntakeValidationSummary.failedLearners}</p></div>
                                </div>
                                {(preIntakeValidationSummary.failedRows?.length ?? 0) > 0 && (
                                  <div className="pt-1 space-y-1 max-h-32 overflow-y-auto">
                                    {preIntakeValidationSummary.failedRows!.map((row, idx) => (
                                      <div key={idx} className="text-xs rounded border border-red-200 bg-red-50 p-2">
                                        <span className="font-medium">{row.learnerIdentifier}:</span> {row.reason}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button type="button" onClick={runPreIntakeValidation}>Run CVS Validation</Button>
                              <Button type="button" variant="outline" onClick={resetPreIntakeValidation}>Reset</Button>
                            </div>
                          </div>
                        )}

                        {/* Upload corrected file */}
                        {resubmitMode && needsCorrection && (
                          <div className="ml-8 mt-2">
                            <Label className="text-xs">Upload corrected version</Label>
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.png"
                              className="mt-1 h-8 text-sm w-full"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const fileUrl = URL.createObjectURL(file);
                                  setUpdatedFiles(prev => ({ ...prev, [doc.type]: { file: fileUrl, version: versions.length + 1 } }));
                                }
                              }}
                            />
                            {updatedFiles[doc.type] && (
                              <p className="text-xs text-green-600 mt-1">✓ Ready to upload v{updatedFiles[doc.type]?.version}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="pt-4 border-t mt-4">
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => { setIsCorrectionModalOpen(false); setResubmitMode(false); }}>Close</Button>
              {resubmitMode && selectedSubmission?.assessmentData?.correctionRecord && (
                <Button
                  onClick={handleResubmitCorrection}
                  disabled={!correctionNotes.whatWasCorrected.trim() || !correctionNotes.reasonForChange.trim()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Resubmit for Review (v{(selectedSubmission.assessmentData.correctionRecord.version || 0) + 1})
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}