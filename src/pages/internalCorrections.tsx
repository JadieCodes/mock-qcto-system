import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Eye, FileText, Download, Upload, History, GitBranch } from 'lucide-react';
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
  DocumentVersion
} from '@/types';

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
  printing_error: 'Printing Error'
};

const ORIGIN_LABELS: Record<OriginType, string> = {
  intake: 'Intake',
  integration: 'Integration',
  printing: 'Printing'
};

const CORRECTION_STATUS_LABELS: Record<CorrectionStatus, { label: string; variant: string }> = {
  active: { label: '🟢 Active', variant: 'default' },
  pending_review: { label: '🟡 Pending Review', variant: 'secondary' },
  resolved: { label: '✅ Resolved', variant: 'outline' },
  rejected: { label: '🔴 Rejected', variant: 'destructive' }
};

export default function Corrections() {
  const { profileSubmissions, updateSubmission, currentRole } = useApp();
  const { toast } = useToast();
  
  // State
  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionRecord | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState({ whatWasCorrected: '', reasonForChange: '' });
  const [updatedFiles, setUpdatedFiles] = useState<{ [key in DocumentType]?: { file: string; version: number } }>({});
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'documents'>('details');
  const [filterStatus, setFilterStatus] = useState<CorrectionStatus | 'all'>('active');
  const [filterOrigin, setFilterOrigin] = useState<OriginType | 'all'>('all');

  // Load correction records from submissions
// Replace the getCorrectionRecords function in internalCorrections.tsx:
const isCorrectionExpired = (correction: CorrectionRecord) => {
  if (!correction.todoDate) return false;
  return new Date(correction.todoDate).getTime() < Date.now();
};
// Load correction records from submissions
const getCorrectionRecords = (): CorrectionRecord[] => {
  const corrections: CorrectionRecord[] = [];
  
  profileSubmissions.forEach(sub => {
    // Log to see what's coming in
    if (sub.status === 'pending_correction') {
      console.log('Found pending_correction submission:', sub.id, 'Has correctionRecord:', !!sub.assessmentData?.correctionRecord);
    }
    
    // MUST have both: status pending_correction AND correctionRecord
    if (sub.status === 'pending_correction' && sub.assessmentData?.correctionRecord) {
      corrections.push(sub.assessmentData.correctionRecord);
    }
  });
  
  console.log('Total correction records found:', corrections.length);
  
  return corrections.sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
};


const getVisibleCorrections = () => {
  const allCorrections = getCorrectionRecords();
  
  
  // Remove filters temporarily for debugging
  
 
  return allCorrections.filter(record => {
    // Filter by status
    if (filterStatus !== 'all' && record.currentStatus !== filterStatus) {
      return false;
    }
    
    // Filter by origin
    if (filterOrigin !== 'all' && record.origin !== filterOrigin) {
      return false;
    }

    // Role-based visibility
    switch (currentRole) {
      case ROLES.ASSESSMENT_UNIT:
        return record.responsibleUnit === ROLES.ASSESSMENT_UNIT;
      case ROLES.NAMB:
        return record.responsibleUnit === ROLES.NAMB && record.pathway === 'legacy';
      case ROLES.QP:
      case ROLES.SDP:
        return record.responsibleUnit === currentRole && 
               (record.pathway === 'occupational' || record.pathway === 'skills');
      case ROLES.CERT_ADMIN:
        return true;
      default:
        return false;
    }
  });
  
};

  // Get filtered corrections based on role and status
  

  // Handle viewing correction
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

  // Handle resubmit with correction notes
  const handleResubmitCorrection = () => {
    if (!selectedSubmission || !selectedCorrection) return;

    // Validate correction notes
    if (!correctionNotes.whatWasCorrected.trim() || !correctionNotes.reasonForChange.trim()) {
      toast({
        title: 'Correction Notes Required',
        description: 'Please document what was corrected and the reason for change.',
        variant: 'destructive',
      });
      return;
    }

    // Update documents with new versions
    const updatedDocuments = selectedSubmission.documents.map(doc => {
      if (updatedFiles[doc.type]) {
        // Create new version of document
        const versions = doc.versions || [{
          version: 1,
          url: doc.url || '',
          uploadedAt: doc.uploadedAt,
          uploadedBy: selectedSubmission.createdBy,
          verified: doc.verified
        }];

        return {
          ...doc,
          url: updatedFiles[doc.type]?.file || doc.url,
          uploadedAt: new Date().toISOString(),
          verified: false,
          versions: [
            ...versions,
            {
              version: versions.length + 1,
              url: updatedFiles[doc.type]?.file || '',
              uploadedAt: new Date().toISOString(),
              uploadedBy: currentRole,
              verified: false
            }
          ]
        };
      }
      return doc;
    });

    // Add correction note
    const newCorrectionNote: CorrectionNote = {
      id: `NOTE-${Date.now()}`,
      whatWasCorrected: correctionNotes.whatWasCorrected,
      reasonForChange: correctionNotes.reasonForChange,
      correctedBy: currentRole,
      correctedAt: new Date().toISOString(),
      version: selectedCorrection.version
    };

    // Update correction record
    const updatedCorrection: CorrectionRecord = {
      ...selectedCorrection,
      currentStatus: 'pending_review',
      lastUpdated: new Date().toISOString(),
      version: selectedCorrection.version,
      correctionNotes: [...(selectedCorrection.correctionNotes || []), newCorrectionNote]
    };

    // Update submission
    const updatedSubmission: Submission = {
      ...selectedSubmission,
      documents: updatedDocuments,
      status: 'submitted' as SubmissionStatus,
      assessmentData: {
        ...selectedSubmission.assessmentData,
        correctionRecord: updatedCorrection,
        resubmittedAt: new Date().toISOString(),
        resubmittedBy: currentRole,
        resubmitted: true,
        reviewCompleted: false,
        reviewDecision: undefined,
        returnReason: undefined,
        returnedBy: undefined,
        returnedAt: undefined
      }
    };

    updateSubmission(selectedSubmission.id, updatedSubmission);
    
    toast({
      title: 'Resubmitted for Review',
      description: `Correction v${updatedCorrection.version} has been sent for review.`,
    });

    setIsCorrectionModalOpen(false);
    setSelectedCorrection(null);
    setSelectedSubmission(null);
  };

  // Handle supervisor approval/rejection
  const handleSupervisorDecision = (correction: CorrectionRecord, approved: boolean) => {
    const submission = profileSubmissions.find(s => s.id === correction.submissionId);
    if (!submission) return;

    const updatedCorrection: CorrectionRecord = {
      ...correction,
      currentStatus: approved ? 'resolved' : 'rejected',
      lastUpdated: new Date().toISOString()
    };

    const updatedSubmission: Submission = {
      ...submission,
      status: approved ? 'approved' as SubmissionStatus : 'pending_correction' as SubmissionStatus,
      assessmentData: {
        ...submission.assessmentData,
        correctionRecord: updatedCorrection,
        ...(approved ? {
          reviewDecision: 'approved',
          reviewCompleted: true,
          reviewCompletedAt: new Date().toISOString(),
          reviewedBy: currentRole
        } : {
          reviewDecision: 'returned',
          returnReason: 'Correction rejected by supervisor',
          returnedBy: currentRole,
          returnedAt: new Date().toISOString()
        })
      }
    };

    updateSubmission(submission.id, updatedSubmission);
    
    toast({
      title: approved ? 'Correction Approved' : 'Correction Rejected',
      description: approved 
        ? 'Submission has been moved to Integration.'
        : 'Submission remains in Corrections.',
    });
  };

  // Get document versions
  const getDocumentVersions = (doc: any): DocumentVersion[] => {
    return doc.versions || [{
      version: 1,
      url: doc.url || '',
      uploadedAt: doc.uploadedAt,
      uploadedBy: selectedSubmission?.createdBy || 'Unknown',
      verified: doc.verified || false
    }];
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

  const corrections = getVisibleCorrections();
  const activeCorrections = corrections.filter(c => c.currentStatus === 'active');
  const pendingCorrections = corrections.filter(c => c.currentStatus === 'pending_review');
  const resolvedCorrections = corrections.filter(c => c.currentStatus === 'resolved');
  const rejectedCorrections = corrections.filter(c => c.currentStatus === 'rejected');

  // Rest of your component remains the same...
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Corrections Management</h2>
        <p className="text-muted-foreground">
          Track and manage submissions returned for corrections
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-48">
              <Label>Status Filter</Label>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
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
              <Select value={filterOrigin} onValueChange={(v) => setFilterOrigin(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Origins" />
                </SelectTrigger>
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Corrections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{activeCorrections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{pendingCorrections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedCorrections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCorrections.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Corrections Table */}
    <Card>
  <CardHeader>
    <CardTitle>Correction Requests</CardTitle>
    <CardDescription>
      {corrections.length} total correction record(s)
    </CardDescription>
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
        {corrections.map((correction) => (
          <TableRow key={correction.correctionId}>
            <TableCell className="font-medium">{correction.learnerName}</TableCell>

            <TableCell className="font-mono text-xs">
              {correction.submissionId}
            </TableCell>

            <TableCell>
              <Badge
                variant={
                  correction.errorType === 'integration_failure'
                    ? 'destructive'
                    : correction.errorType === 'missing_documentation'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {ERROR_TYPE_LABELS[correction.errorType]}
              </Badge>
            </TableCell>

            <TableCell>
              <Badge variant="outline">
                {ORIGIN_LABELS[correction.origin]}
              </Badge>
            </TableCell>

            <TableCell>
              {isCorrectionExpired(correction) ? (
                <Badge variant="destructive">Expired</Badge>
              ) : (
                <Badge
                  variant={
                    correction.currentStatus === 'active'
                      ? 'default'
                      : correction.currentStatus === 'pending_review'
                      ? 'secondary'
                      : correction.currentStatus === 'resolved'
                      ? 'outline'
                      : 'destructive'
                  }
                >
                  {CORRECTION_STATUS_LABELS[correction.currentStatus].label}
                </Badge>
              )}
            </TableCell>

            <TableCell>
              {correction.todoDate
                ? new Date(correction.todoDate).toLocaleDateString()
                : '-'}
            </TableCell>

            <TableCell>
              {new Date(correction.lastUpdated).toLocaleDateString()}
            </TableCell>

            <TableCell className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewCorrection(correction)}
              >
                <Eye className="h-4 w-4 mr-1" /> View
              </Button>
            </TableCell>
          </TableRow>
        ))}

        {corrections.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
              No correction records found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </CardContent>
</Card>

      {/* Correction Detail Modal */}
      <Dialog open={isCorrectionModalOpen} onOpenChange={setIsCorrectionModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Correction Details</DialogTitle>
            <DialogDescription>
              {selectedCorrection?.correctionId} - {selectedCorrection?.learnerName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCorrection && selectedSubmission && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
                 <TabsList className="grid w-full grid-cols-2">
  <TabsTrigger value="details">Correction Details</TabsTrigger>
  <TabsTrigger value="documents">Documents & Versions</TabsTrigger>
</TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Error Information */}
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">Error Information</h4>
                <div className="grid grid-cols-2 gap-4">
  <div>
    <p className="text-xs text-muted-foreground">Error Type</p>
    <Badge
      variant={
        selectedCorrection.errorType === 'integration_failure'
          ? 'destructive'
          : selectedCorrection.errorType === 'missing_documentation'
          ? 'secondary'
          : 'outline'
      }
    >
      {ERROR_TYPE_LABELS[selectedCorrection.errorType]}
    </Badge>
  </div>

  <div>
    <p className="text-xs text-muted-foreground">Origin</p>
    <Badge variant="outline">{ORIGIN_LABELS[selectedCorrection.origin]}</Badge>
  </div>

  <div>
    <p className="text-xs text-muted-foreground">To Do By</p>
    <p className="text-sm font-medium">
      {selectedCorrection.todoDate
        ? new Date(selectedCorrection.todoDate).toLocaleDateString()
        : '-'}
    </p>
  </div>

  <div>
    <p className="text-xs text-muted-foreground">Expiry Status</p>
    {isCorrectionExpired(selectedCorrection) ? (
      <Badge variant="destructive">Expired</Badge>
    ) : (
      <Badge variant="secondary">Still Active</Badge>
    )}
  </div>

  <div className="col-span-2">
    <p className="text-xs text-muted-foreground">Return Reason</p>
    <p className="text-sm mt-1 p-2 bg-amber-50 rounded border border-amber-200">
      {selectedCorrection.returnReason}
    </p>
  </div>
</div>
                </div>

                {/* Integration Error Log */}
                {selectedCorrection.integrationErrorLog && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-red-800">Integration Error Log</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-red-600">System</p>
                        <p className="font-medium">{selectedCorrection.integrationErrorLog.system}</p>
                      </div>
                      <div>
                        <p className="text-xs text-red-600">Error Time</p>
                        <p className="font-medium">
                          {new Date(selectedCorrection.integrationErrorLog.errorTimestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-red-600">Error Message</p>
                        <p className="text-sm mt-1">{selectedCorrection.integrationErrorLog.errorMessage}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-red-600">System Response</p>
                        <pre className="text-xs mt-1 p-2 bg-white rounded border border-red-200 overflow-auto">
                          {selectedCorrection.integrationErrorLog.errorResponse}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Correction Notes Form */}
               
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4">
                <h4 className="font-medium">Document Versions</h4>
                <div className="space-y-4">
              {selectedSubmission.documents.map((doc) => {
  const versions = getDocumentVersions(doc);
  const latestVersion = versions[versions.length - 1];

  const intakeVerification =
    selectedSubmission.assessmentData?.documentVerifications?.[doc.id];

  const needsCorrection = intakeVerification === false;
  const isApproved = intakeVerification === true;
                    
                    return (
                      <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText
  className={`h-5 w-5 ${
    needsCorrection
      ? 'text-amber-500'
      : isApproved
      ? 'text-green-500'
      : 'text-slate-500'
  }`}
/>
                            <div>
                              <p className="font-medium">{getDocumentLabel(doc.type)}</p>
                              <p className="text-xs text-muted-foreground">
                                Current Version: v{versions.length}
                              </p>
                            </div>
                          </div>
                       {needsCorrection ? (
  <Badge variant="outline" className="bg-amber-50 text-amber-700">
    <AlertCircle className="h-3 w-3 mr-1" /> Needs Correction
  </Badge>
) : isApproved ? (
  <Badge variant="outline" className="bg-green-50 text-green-700">
    <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
  </Badge>
) : (
  <Badge variant="outline" className="bg-slate-50 text-slate-700">
    Pending Review
  </Badge>
)}
                        </div>

                        {/* Version History */}
                        <div className="ml-8 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Version History:</p>
                          {versions.map((version, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-3 w-3 text-muted-foreground" />
                                <span className="font-mono text-xs">v{version.version}</span>
                                <span className="text-xs text-muted-foreground">
                                  Uploaded: {new Date(version.uploadedAt).toLocaleDateString()}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {version.uploadedBy}
                                </Badge>
                              </div>
                              {version.url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6"
                                  onClick={() => window.open(version.url, '_blank')}
                                >
                                  <Eye className="h-3 w-3 mr-1" /> View
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Upload New Version */}
                   
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

          
            </Tabs>
          )}

   <DialogFooter className="pt-4 border-t mt-4">
  <Button variant="outline" onClick={() => setIsCorrectionModalOpen(false)}>
    Close
  </Button>
</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}