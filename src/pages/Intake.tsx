import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Eye, FileText, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { ProcessType, SubmissionSource, ReissueReason, Pathway, DocumentType, Submission, SubmissionStatus, AppRole,  ErrorType,           // Add this
  OriginType,          // Add this
  CorrectionRecord,    // Add this
  CorrectionNote,      // Add this
  DocumentVersion  } from '@/types';

// Define all roles as constants
const ROLES = {
  CERT_ADMIN: 'Cert Admin' as AppRole,
  ASSESSMENT_UNIT: 'Assessment Unit' as AppRole,
  NAMB: 'NAMB' as AppRole,
  QP: 'QP' as AppRole,
  SDP: 'SDP' as AppRole,
} as const;

// Review checklists by process type
const ISSUE_REVIEW_CHECKS = [
  { id: 'signed', label: 'Letters are signed' },
  { id: 'dates_correct', label: 'Dates are correct' },
  { id: 'qualification_code', label: 'Qualification code is correct' },
  { id: 'name_matches', label: 'Learner name matches ID' },
  { id: 'file_3_4_complete', label: 'File 3–4 is complete' },
];

const REISSUE_REVIEW_CHECKS = [
  { id: 'payment_verified', label: 'Payment verified' },
  { id: 'affidavit_verified', label: 'Affidavit signed and verified' },
  { id: 'original_certificate_received', label: 'Original certificate received (if required)' },
  { id: 'certificate_exists', label: 'Certificate number exists in system' },
  { id: 'record_in_system', label: 'Learner record already in CVS/Apprentice' },
  { id: 'duplicate_check', label: 'Not a duplicate re-issue attempt' },
  { id: 'reason_valid', label: 'Reason valid' },
];

const REPLACE_REVIEW_CHECKS = [
  { id: 'certificate_exists', label: 'Certificate Exists' },
  { id: 'learner_identity_matches', label: 'Learner Identity Matches' },
  { id: 'supporting_document_verified', label: 'Supporting Document Verified' },
  { id: 'replacement_reason_valid', label: 'Replacement Reason Valid' },
  { id: 'no_duplicate', label: 'No Duplicate Active Certificate' },
];

export default function Intake() {
  const { profileSubmissions, updateSubmission, currentRole } = useApp();
  const { toast } = useToast();
  
  // Document viewer state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  
  // Review state
  const [reviewChecks, setReviewChecks] = useState<Record<string, boolean>>({});
  const [documentVerifications, setDocumentVerifications] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'review'>('details');
  
  // Decision state
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'return' | ''>('');
  const [returnReason, setReturnReason] = useState('');

  // Filter submissions that need review (draft or submitted status)
  const getVisibleSubmissions = () => {
    return profileSubmissions.filter(sub => {
      // ONLY show submissions that need review (draft or submitted)
      // NEVER show completed or pending_correction
      if (sub.status !== 'draft' && sub.status !== 'submitted') {
        return false;
      }

      // CERT ADMIN: Can only see Re-Issue and Replace submissions
      if (currentRole === ROLES.CERT_ADMIN) {
        return sub.processType === 'reissue' || sub.processType === 'replace';
      }

      // ASSESSMENT UNIT: Can only see Issue submissions
      if (currentRole === ROLES.ASSESSMENT_UNIT) {
        return sub.processType === 'issue';
      }

      // NAMB: Can only see Re-issue and Replace for Legacy
      if (currentRole === ROLES.NAMB) {
        return (sub.processType === 'reissue' || sub.processType === 'replace') && 
               sub.pathway === 'legacy';
      }

      // QP: Can only see Re-issue and Replace for Occupational/Skills
      if (currentRole === ROLES.QP) {
        return (sub.processType === 'reissue' || sub.processType === 'replace') && 
               (sub.pathway === 'occupational' || sub.pathway === 'skills');
      }

      // SDP: Can only see Re-issue and Replace for Occupational/Skills
      if (currentRole === ROLES.SDP) {
        return (sub.processType === 'reissue' || sub.processType === 'replace') && 
               (sub.pathway === 'occupational' || sub.pathway === 'skills');
      }

      return false;
    });
  };

  const getReviewChecksForSubmission = (submission: Submission) => {
    switch (submission.processType) {
      case 'issue': return ISSUE_REVIEW_CHECKS;
      case 'reissue': return REISSUE_REVIEW_CHECKS;
      case 'replace': return REPLACE_REVIEW_CHECKS;
      default: return [];
    }
  };

 const createCorrectionRecord = (
  submission: Submission,
  errorType: ErrorType,
  origin: OriginType,
  returnReason: string
): CorrectionRecord => {
  const existingRecord = submission.assessmentData?.correctionRecord;
  const currentVersion = existingRecord?.version || 0;
  
  return {
    correctionId: `COR-${Date.now()}`,
    submissionId: submission.id,
    learnerName: submission.candidateName,
    qualification: submission.certificateType,
    pathway: submission.pathway || 'occupational',
    errorType,
    origin,
    responsibleUnit: submission.createdBy as AppRole,
    currentStatus: 'active',
    version: currentVersion + 1,
    dateCreated: existingRecord?.dateCreated || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    assignedTo: submission.createdBy as AppRole,
    returnReason,
    correctionNotes: existingRecord?.correctionNotes || []
  };
};

  useEffect(() => {
    if (selectedSubmission) {
      const docVerifications: Record<string, boolean> = {};
      selectedSubmission.documents.forEach(doc => {
        docVerifications[doc.id] = doc.verified || false;
      });
      setDocumentVerifications(docVerifications);
      const savedChecks = selectedSubmission.assessmentData?.reviewChecks || {};
      setReviewChecks(savedChecks);
      setReviewDecision('');
      setReturnReason('');
      setActiveTab('details');
    }
  }, [selectedSubmission]);

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

  const handleReviewDecision = () => {
    if (!selectedSubmission) return;

    const totalChecks = getReviewChecksForSubmission(selectedSubmission).length;
    const completedChecks = Object.values(reviewChecks).filter(Boolean).length;
    const allChecksPassed = totalChecks > 0 && completedChecks === totalChecks;

    const totalDocs = selectedSubmission.documents.length;
    const verifiedDocs = Object.values(documentVerifications).filter(Boolean).length;
    const allDocsVerified = totalDocs > 0 && verifiedDocs === totalDocs;

    if (!reviewDecision) {
      toast({
        title: 'Decision Required',
        description: 'Please select Approve or Return for Corrections',
        variant: 'destructive',
      });
      return;
    }

 if (reviewDecision === 'approved') {
  if (!allChecksPassed || !allDocsVerified) {
    toast({
      title: 'Cannot Approve',
      description: 'All checks must be completed and all documents verified before approval',
      variant: 'destructive',
    });
    return;
  }

  // APPROVED - Send to Integration queue (NOT completed yet)
  const updatedSubmission: Submission = {
    ...selectedSubmission,
    documents: selectedSubmission.documents.map(doc => ({
      ...doc,
      verified: documentVerifications[doc.id] || false
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
      // Add integration tracking
      integrationStatus: 'pending', // pending, processing, completed, failed
      integrationSystem: selectedSubmission.pathway === 'legacy' ? 'Apprentice' : 'CVS',
      integrationAttempts: 0
    },
    status: 'approved' // New status: approved (waiting for integration)
  };

  updateSubmission(selectedSubmission.id, updatedSubmission);
  
  toast({
    title: 'Submission Approved',
    description: 'Submission has been approved and is ready for integration',
  });

  setIsDocumentModalOpen(false);
  setSelectedSubmission(null);
}
  else if (reviewDecision === 'return') {
  if (!returnReason.trim()) {
    toast({
      title: 'Return Reason Required',
      description: 'Please provide a reason for returning the submission',
      variant: 'destructive',
    });
    return;
  }

  // Determine error type based on what's missing
  let errorType: ErrorType = 'missing_documentation';
  const missingDocs = selectedSubmission.documents.filter(d => !documentVerifications[d.id]).length;
  const incorrectDetails = reviewChecks.name_matches === false;
  const qualMismatch = reviewChecks.qualification_code === false;
  
  if (incorrectDetails) {
    errorType = 'incorrect_learner_details';
  } else if (qualMismatch) {
    errorType = 'qualification_mismatch';
  } else if (missingDocs > 0) {
    errorType = 'missing_documentation';
  }

  // Create correction record
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
    correctionNotes: []
  };

  // Update documents with verification status
  const updatedDocuments = selectedSubmission.documents.map(doc => ({
    ...doc,
    verified: documentVerifications[doc.id] || false,
    versions: [{
      version: 1,
      url: doc.url || '',
      uploadedAt: doc.uploadedAt,
      uploadedBy: selectedSubmission.createdBy,
      verified: doc.verified || false
    }]
  }));

  // RETURN FOR CORRECTIONS
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
      correctionRecord // CRITICAL: This must be set!
    },
    status: 'pending_correction' // CRITICAL: This must be set!
  };

  console.log('Returning submission to corrections:', updatedSubmission.id, updatedSubmission.status, updatedSubmission.assessmentData.correctionRecord);
  
  updateSubmission(selectedSubmission.id, updatedSubmission);
  
  toast({
    title: 'Submission Returned',
    description: 'Submission has been returned to the creator for corrections',
  });

  setIsDocumentModalOpen(false);
  setSelectedSubmission(null);
}
  };

  

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
      signed_result_approval: 'Signed Result Approval',
      supporting_evidence: 'Supporting Evidence',
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

  const renderDocumentViewer = () => {
    if (!selectedSubmission) return null;

    const reviewChecksList = getReviewChecksForSubmission(selectedSubmission);
    const totalChecks = reviewChecksList.length;
    const completedChecks = Object.values(reviewChecks).filter(Boolean).length;
    const allChecksPassed = totalChecks > 0 && completedChecks === totalChecks;
    const totalDocs = selectedSubmission.documents.length;
    const verifiedDocs = Object.values(documentVerifications).filter(Boolean).length;
    const allDocsVerified = totalDocs > 0 && verifiedDocs === totalDocs;
    const isReviewComplete = allChecksPassed && allDocsVerified;

    return (
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Review</DialogTitle>
            <DialogDescription>
              {selectedSubmission.id} - {selectedSubmission.candidateName}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'details' | 'review')} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Documents</TabsTrigger>
              <TabsTrigger value="review">Review Checklist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Process Type</p>
                    <p className="font-medium capitalize">
                      {selectedSubmission.processType === 'reissue' ? 'Re-Issue' : 
                       selectedSubmission.processType === 'replace' ? 'Replace' : 'Issue'}
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

              <h4 className="font-medium text-lg">Documents ({selectedSubmission.documents.length})</h4>
              
              {selectedSubmission.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{getDocumentLabel(doc.type)}</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {doc.url && (
                      <Button variant="outline" size="sm" className="h-8" onClick={() => window.open(doc.url, '_blank')}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    )}
                    <div className="flex items-center space-x-2 border-l pl-4">
                      <Checkbox
                        id={`verify-${doc.id}`}
                        checked={documentVerifications[doc.id] || false}
                        onCheckedChange={(checked) => handleDocumentVerification(doc.id, checked as boolean)}
                      />
                      <Label htmlFor={`verify-${doc.id}`} className="text-sm">Verified</Label>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="review" className="space-y-4 mt-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Review Checklist</h4>
                  <Badge variant={isReviewComplete ? "default" : "secondary"}>
                    {completedChecks}/{totalChecks} Complete
                  </Badge>
                </div>
                <div className="space-y-3">
                  {reviewChecksList.map((check) => (
                    <div key={check.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`check-${check.id}`}
                        checked={reviewChecks[check.id] || false}
                        onCheckedChange={(checked) => handleReviewCheck(check.id, checked as boolean)}
                      />
                      <Label htmlFor={`check-${check.id}`} className="text-sm">{check.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-medium mb-4">Review Decision</h4>
            <RadioGroup value={reviewDecision} onValueChange={(v) => setReviewDecision(v as 'approved' | 'return')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="approved" id="approved" />
                <Label htmlFor="approved" className="text-green-600">Approve - Send to Integration</Label>
              </div>
              <div className="flex items-start space-x-2 mt-2">
                <RadioGroupItem value="return" id="return" />
                <div className="flex-1">
                  <Label htmlFor="return" className="text-amber-600">Return for Corrections</Label>
                  {reviewDecision === 'return' && (
                    <Textarea
                      className="mt-2"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      placeholder="Explain what needs to be corrected..."
                      rows={3}
                    />
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsDocumentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReviewDecision}>Submit Decision</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const visibleSubmissions = getVisibleSubmissions();
  
  const getProcessLabel = (type: ProcessType) => {
    switch (type) {
      case 'issue': return 'Issue';
      case 'reissue': return 'Re-Issue';
      case 'replace': return 'Replace';
    }
  };

  const getProcessBadgeVariant = (type: ProcessType): "default" | "secondary" | "outline" => {
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
        <CardHeader>
          <CardTitle>Submissions Waiting for Review</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead>Pathway</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-center">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSubmissions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                  <TableCell>
                    <Badge variant={getProcessBadgeVariant(sub.processType)}>
                      {getProcessLabel(sub.processType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{sub.candidateName}</TableCell>
                  <TableCell>{sub.certificateType}</TableCell>
                  <TableCell className="capitalize">{sub.pathway || '-'}</TableCell>
                  <TableCell>{new Date(sub.dateSubmitted).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" onClick={() => handleViewDocuments(sub)}>
                      <Eye className="h-4 w-4 mr-1" /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {renderDocumentViewer()}
    </div>
  );
}

function Label({ htmlFor, children, className }: { htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium leading-none ${className}`}>
      {children}
    </label>
  );
}