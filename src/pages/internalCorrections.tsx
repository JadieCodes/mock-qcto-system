import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuditTrail } from '@/context/AuditTrailContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Eye, FileText, GitBranch } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type {
  ProcessType,
  Submission,
  DocumentType,
  AppRole,
  SubmissionStatus,
  CorrectionStatus,
  ErrorType,
  OriginType,
  CorrectionRecord,
  CorrectionNote,
  IntegrationErrorLog,
  DocumentVersion,
} from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = {
  CERT_ADMIN: 'Certification Practitioner' as AppRole,
  ASSESSMENT_UNIT: 'Assessment Unit' as AppRole,
  NAMB: 'NAMB' as AppRole,
  QP: 'QP' as AppRole,
  SDP: 'SDP' as AppRole,
} as const;

const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  missing_documentation: 'Missing Documentation',
  incorrect_learner_details: 'Incorrect Learner Details',
  qualification_mismatch: 'Qualification Mismatch',
  integration_failure: 'Integration Failure',
  printing_error: 'Printing Error',
};

const ORIGIN_LABELS: Record<OriginType, string> = {
  intake: 'Intake',
  integration: 'Integration',
  printing: 'Printing',
};

const CORRECTION_STATUS_LABELS: Record<CorrectionStatus, { label: string; variant: string }> = {
  active: { label: '🟢 Active', variant: 'default' },
  pending_review: { label: '🟡 Pending Review', variant: 'secondary' },
  resolved: { label: '✅ Resolved', variant: 'outline' },
  rejected: { label: '🔴 Rejected', variant: 'destructive' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Corrections() {
  const { profileSubmissions, updateSubmission, currentRole } = useApp();
  const { toast } = useToast();
  const { logAction } = useAuditTrail();

  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionRecord | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState({ whatWasCorrected: '', reasonForChange: '' });
  const [updatedFiles, setUpdatedFiles] = useState<{ [key in DocumentType]?: { file: string; version: number } }>({});
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  const [filterStatus, setFilterStatus] = useState<CorrectionStatus | 'all'>('active');
  const [filterOrigin, setFilterOrigin] = useState<OriginType | 'all'>('all');

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isCorrectionExpired = (correction: CorrectionRecord) => {
    if (!correction.todoDate) return false;
    return new Date(correction.todoDate).getTime() < Date.now();
  };

  const getCorrectionRecords = (): CorrectionRecord[] => {
    const corrections: CorrectionRecord[] = [];
    profileSubmissions.forEach(sub => {
      if (sub.status === 'pending_correction' && sub.assessmentData?.correctionRecord) {
        corrections.push(sub.assessmentData.correctionRecord);
      }
    });
    return corrections.sort((a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  };

  const getVisibleCorrections = () => {
    return getCorrectionRecords().filter(record => {
      if (filterStatus !== 'all' && record.currentStatus !== filterStatus) return false;
      if (filterOrigin !== 'all' && record.origin !== filterOrigin) return false;
      switch (currentRole) {
        case ROLES.ASSESSMENT_UNIT: return record.responsibleUnit === ROLES.ASSESSMENT_UNIT;
        case ROLES.NAMB: return record.responsibleUnit === ROLES.NAMB && record.pathway === 'legacy';
        case ROLES.QP:
        case ROLES.SDP: return record.responsibleUnit === currentRole && (record.pathway === 'occupational' || record.pathway === 'skills');
        case ROLES.CERT_ADMIN: return true;
        default: return false;
      }
    });
  };

  const getDocumentLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      application_form: 'Application Form', approval_letter: 'Approval Letter', affidavit: 'Affidavit',
      original_certificate: 'Original Certificate', proof_of_payment: 'Proof of Payment',
      recommendation_letter: 'Recommendation Letter', id_copy: 'ID Copy', file_3_4: 'File 3–4',
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

  const getDocumentVersions = (doc: any): DocumentVersion[] => {
    return doc.versions || [{
      version: 1, url: doc.url || '', uploadedAt: doc.uploadedAt,
      uploadedBy: selectedSubmission?.createdBy || 'Unknown', verified: doc.verified || false,
    }];
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleViewCorrection = (correction: CorrectionRecord) => {
    const submission = profileSubmissions.find(s => s.id === correction.submissionId);
    if (submission) {
      setSelectedCorrection(correction);
      setSelectedSubmission(submission);
      setCorrectionNotes({ whatWasCorrected: '', reasonForChange: '' });
      setUpdatedFiles({});
      setActiveTab('details');
      setIsCorrectionModalOpen(true);
    }
  };

  const handleResubmitCorrection = () => {
    if (!selectedSubmission || !selectedCorrection) return;
    if (!correctionNotes.whatWasCorrected.trim() || !correctionNotes.reasonForChange.trim()) {
      toast({ title: 'Correction Notes Required', description: 'Please document what was corrected and the reason for change.', variant: 'destructive' });
      return;
    }

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
      correctedAt: new Date().toISOString(), version: selectedCorrection.version,
    };

    const updatedCorrection: CorrectionRecord = {
      ...selectedCorrection, currentStatus: 'pending_review', lastUpdated: new Date().toISOString(),
      version: selectedCorrection.version, correctionNotes: [...(selectedCorrection.correctionNotes || []), newCorrectionNote],
    };

    const updatedSubmission: Submission = {
      ...selectedSubmission, documents: updatedDocuments, status: 'submitted' as SubmissionStatus,
      assessmentData: {
        ...selectedSubmission.assessmentData, correctionRecord: updatedCorrection,
        resubmittedAt: new Date().toISOString(), resubmittedBy: currentRole, resubmitted: true,
        reviewCompleted: false, reviewDecision: undefined, returnReason: undefined, returnedBy: undefined, returnedAt: undefined,
      },
    };

    updateSubmission(selectedSubmission.id, updatedSubmission);
    toast({ title: 'Resubmitted for Review', description: `Correction v${updatedCorrection.version} has been sent for review.` });
    logAction({ user: currentRole, module: 'Corrections', action: `Resubmitted correction for submission ${selectedSubmission.id}`, status: 'Pending', details: correctionNotes.whatWasCorrected });
    setIsCorrectionModalOpen(false);
    setSelectedCorrection(null);
    setSelectedSubmission(null);
  };

  const handleSupervisorDecision = (correction: CorrectionRecord, approved: boolean) => {
    const submission = profileSubmissions.find(s => s.id === correction.submissionId);
    if (!submission) return;
    const updatedCorrection: CorrectionRecord = { ...correction, currentStatus: approved ? 'resolved' : 'rejected', lastUpdated: new Date().toISOString() };
    const updatedSubmission: Submission = {
      ...submission, status: approved ? 'approved' as SubmissionStatus : 'pending_correction' as SubmissionStatus,
      assessmentData: {
        ...submission.assessmentData, correctionRecord: updatedCorrection,
        ...(approved ? { reviewDecision: 'approved', reviewCompleted: true, reviewCompletedAt: new Date().toISOString(), reviewedBy: currentRole }
          : { reviewDecision: 'returned', returnReason: 'Correction rejected by supervisor', returnedBy: currentRole, returnedAt: new Date().toISOString() }),
      },
    };
    updateSubmission(submission.id, updatedSubmission);
    toast({ title: approved ? 'Correction Approved' : 'Correction Rejected', description: approved ? 'Submission has been moved to Integration.' : 'Submission remains in Corrections.' });
    logAction({ user: currentRole, module: 'Corrections', action: `${approved ? 'Approved' : 'Rejected'} correction for submission ${correction.submissionId}`, status: approved ? 'Success' : 'Failed', details: correction.correctionId });
  };

  // ── Rejection details panel ───────────────────────────────────────────────

  /**
   * Renders the structured rejection details that were captured in the Intake
   * rejection popup — shows internal vs external reasons, comments, and deadline.
   */
  const renderRejectionDetails = (submission: Submission, correction: CorrectionRecord) => {
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

    // Parse the raw returnReason bullet string into clean lines for the fallback display
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

    const fallback = parseFallbackLines(correction.returnReason || '');

    return (
      <div className="space-y-3">
        {/* Header bar — returned by / on / deadline */}
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
              {correction.todoDate && (
                <span className={`font-medium ${isCorrectionExpired(correction) ? 'text-red-700' : 'text-amber-800'}`}>
                  Deadline: <strong>{new Date(correction.todoDate).toLocaleDateString()}</strong>
                  {isCorrectionExpired(correction) && ' ⚠️ Expired'}
                </span>
              )}
            </div>
          </div>
          <Badge
            variant={correction.errorType === 'integration_failure' ? 'destructive' : correction.errorType === 'missing_documentation' ? 'secondary' : 'outline'}
            className="shrink-0 text-xs"
          >
            {ERROR_TYPE_LABELS[correction.errorType]}
          </Badge>
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
                  <span className="text-xs text-orange-500">submitter documents / data</span>
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
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">💬 Additional Comments</span>
                </div>
                <div className="px-4 py-3 bg-white">
                  <p className="text-sm text-gray-800">{rd.comments}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // ── Fallback display (older submissions — parse the bullet string) ──
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

  // ── Data ──────────────────────────────────────────────────────────────────

  const corrections = getVisibleCorrections();
  const activeCorrections = corrections.filter(c => c.currentStatus === 'active');
  const pendingCorrections = corrections.filter(c => c.currentStatus === 'pending_review');
  const resolvedCorrections = corrections.filter(c => c.currentStatus === 'resolved');
  const rejectedCorrections = corrections.filter(c => c.currentStatus === 'rejected');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Corrections Management</h2>
        <p className="text-muted-foreground">Track and manage submissions returned for corrections</p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-48">
              <Label>Status Filter</Label>
              <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
                <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">🟢 Active</SelectItem>
                  <SelectItem value="pending_review">🟡 Pending Review</SelectItem>
                  <SelectItem value="resolved">✅ Resolved</SelectItem>
                  <SelectItem value="rejected">🔴 Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>Origin Filter</Label>
              <Select value={filterOrigin} onValueChange={v => setFilterOrigin(v as any)}>
                <SelectTrigger><SelectValue placeholder="All Origins" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Origins</SelectItem>
                  <SelectItem value="intake">Intake</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="printing">Printing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Corrections</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{activeCorrections.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pending Review</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{pendingCorrections.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Resolved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{resolvedCorrections.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Rejected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{rejectedCorrections.length}</div></CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Correction Requests</CardTitle>
          <CardDescription>{corrections.length} total correction record(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner Name</TableHead>
                <TableHead>Submission ID</TableHead>
                <TableHead>Error Type</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>To Do By</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corrections.map(correction => (
                <TableRow key={correction.correctionId}>
                  <TableCell className="font-medium">{correction.learnerName}</TableCell>
                  <TableCell className="font-mono text-xs">{correction.submissionId}</TableCell>
                  <TableCell>
                    <Badge variant={correction.errorType === 'integration_failure' ? 'destructive' : correction.errorType === 'missing_documentation' ? 'secondary' : 'outline'}>
                      {ERROR_TYPE_LABELS[correction.errorType]}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline">{ORIGIN_LABELS[correction.origin]}</Badge></TableCell>
                  <TableCell>
                    {isCorrectionExpired(correction) ? <Badge variant="destructive">Expired</Badge> : (
                      <Badge variant={correction.currentStatus === 'active' ? 'default' : correction.currentStatus === 'pending_review' ? 'secondary' : correction.currentStatus === 'resolved' ? 'outline' : 'destructive'}>
                        {CORRECTION_STATUS_LABELS[correction.currentStatus].label}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{correction.todoDate ? new Date(correction.todoDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{new Date(correction.lastUpdated).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => handleViewCorrection(correction)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {corrections.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No correction records found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isCorrectionModalOpen} onOpenChange={setIsCorrectionModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Correction Details</DialogTitle>
            <DialogDescription>{selectedCorrection?.correctionId} — {selectedCorrection?.learnerName}</DialogDescription>
          </DialogHeader>

          {selectedCorrection && selectedSubmission && (
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Correction Details</TabsTrigger>
                <TabsTrigger value="documents">Documents &amp; Versions</TabsTrigger>
              </TabsList>

              {/* ── Details tab ── */}
              <TabsContent value="details" className="space-y-5 mt-4">

                {/* Structured rejection details panel */}
                {renderRejectionDetails(selectedSubmission, selectedCorrection)}

                {/* Error metadata */}
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-sm">Correction Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Origin</p>
                      <Badge variant="outline">{ORIGIN_LABELS[selectedCorrection.origin]}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Correction ID</p>
                      <p className="font-mono text-xs mt-1">{selectedCorrection.correctionId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date Created</p>
                      <p className="font-medium">{new Date(selectedCorrection.dateCreated).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{new Date(selectedCorrection.lastUpdated).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned To</p>
                      <p className="font-medium">{selectedCorrection.assignedTo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pathway</p>
                      <p className="font-medium capitalize">{selectedCorrection.pathway}</p>
                    </div>
                  </div>
                </div>

                {/* Integration Error Log */}
                {selectedCorrection.integrationErrorLog && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-red-800">Integration Error Log</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-xs text-red-600">System</p><p className="font-medium">{selectedCorrection.integrationErrorLog.system}</p></div>
                      <div><p className="text-xs text-red-600">Error Time</p><p className="font-medium">{new Date(selectedCorrection.integrationErrorLog.errorTimestamp).toLocaleString()}</p></div>
                      <div className="col-span-2"><p className="text-xs text-red-600">Error Message</p><p className="text-sm mt-1">{selectedCorrection.integrationErrorLog.errorMessage}</p></div>
                      <div className="col-span-2">
                        <p className="text-xs text-red-600">System Response</p>
                        <pre className="text-xs mt-1 p-2 bg-white rounded border border-red-200 overflow-auto">{selectedCorrection.integrationErrorLog.errorResponse}</pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Correction Notes History */}
                {(selectedCorrection.correctionNotes?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Correction History</h4>
                    <div className="space-y-2">
                      {selectedCorrection.correctionNotes!.map((note, idx) => (
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

                {/* Resubmit form — only for active corrections assigned to current role */}
                {selectedCorrection.currentStatus === 'active' && selectedCorrection.assignedTo === currentRole && (
                  <div className="border rounded-lg p-4 space-y-4 bg-blue-50 border-blue-200">
                    <h4 className="font-medium text-blue-900">Submit Correction</h4>
                    <p className="text-sm text-blue-700">Document what you corrected before resubmitting.</p>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="what-corrected" className="text-sm font-medium">What was corrected? <span className="text-red-500">*</span></Label>
                        <Textarea
                          id="what-corrected"
                          value={correctionNotes.whatWasCorrected}
                          onChange={e => setCorrectionNotes(prev => ({ ...prev, whatWasCorrected: e.target.value }))}
                          placeholder="Describe the specific changes made..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="reason-change" className="text-sm font-medium">Reason for change <span className="text-red-500">*</span></Label>
                        <Textarea
                          id="reason-change"
                          value={correctionNotes.reasonForChange}
                          onChange={e => setCorrectionNotes(prev => ({ ...prev, reasonForChange: e.target.value }))}
                          placeholder="Explain why this correction was needed..."
                          rows={2}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleResubmitCorrection}
                      disabled={!correctionNotes.whatWasCorrected.trim() || !correctionNotes.reasonForChange.trim()}
                    >
                      Resubmit for Review
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* ── Documents tab ── */}
              <TabsContent value="documents" className="space-y-4 mt-4">
                <h4 className="font-medium">Document Versions</h4>
                <div className="space-y-4">
                  {selectedSubmission.documents.map(doc => {
                    const versions = getDocumentVersions(doc);
                    const intakeVerification = selectedSubmission.assessmentData?.documentVerifications?.[doc.id];
                    const needsCorrection = intakeVerification === false;
                    const isApproved = intakeVerification === true;

                    return (
                      <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className={`h-5 w-5 ${needsCorrection ? 'text-amber-500' : isApproved ? 'text-green-500' : 'text-slate-500'}`} />
                            <div>
                              <p className="font-medium">{getDocumentLabel(doc.type)}</p>
                              <p className="text-xs text-muted-foreground">Current Version: v{versions.length}</p>
                            </div>
                          </div>
                          {needsCorrection ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700"><AlertCircle className="h-3 w-3 mr-1" />Needs Correction</Badge>
                          ) : isApproved ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700">Pending Review</Badge>
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
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsCorrectionModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}