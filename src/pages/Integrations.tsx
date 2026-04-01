import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Eye, FileText, Download, Server, RefreshCw, Package } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ProcessType, Submission, DocumentType, AppRole, ErrorType,           // Add this
  OriginType,          // Add this
  CorrectionRecord,    // Add this
  IntegrationErrorLog, // Add this
  DocumentVersion  } from '@/types';
import { Input } from '@/components/ui/input';

const ROLES = {
  CERT_ADMIN: 'Cert Admin' as AppRole,
} as const;

// System check types
interface SystemCheck {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'passed' | 'failed';
  message?: string;
}

export default function Integration() {
  const { profileSubmissions, updateSubmission, currentRole } = useApp();
  const { toast } = useToast();
  
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [integrationError, setIntegrationError] = useState('');
  const [progress, setProgress] = useState(0);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([]);
  const [doubleCaptureData, setDoubleCaptureData] = useState({
    candidateName: '',
    certificateNumber: '',
    qualificationCode: ''
  });
  const [showDoubleCapture, setShowDoubleCapture] = useState(false);

  // Reset state when opening a new submission
  useEffect(() => {
    if (selectedSubmission && isDocumentModalOpen) {
      setSystemChecks([]);
      setProgress(0);
      setIntegrationStatus('idle');
      setIntegrationError('');
      setShowDoubleCapture(false);
    }
  }, [selectedSubmission, isDocumentModalOpen]);

  // ONLY CRT Admin can access this page
  if (currentRole !== ROLES.CERT_ADMIN) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Access Restricted</p>
            <p className="text-sm">Only CRT Admin can perform system integrations.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get submissions approved and waiting for integration
  const getPendingIntegrationSubmissions = () => {
    return profileSubmissions.filter(sub => {
      // Must be approved and waiting for integration
      if (sub.status !== 'approved') {
        return false;
      }

      // Only show pending or failed integrations
      return !sub.assessmentData?.integrationStatus || 
             sub.assessmentData.integrationStatus === 'pending' || 
             sub.assessmentData.integrationStatus === 'failed';
    });
  };

  const handleViewDocuments = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIntegrationStatus('idle');
    setIntegrationError('');
    setProgress(0);
    setShowDoubleCapture(false);
    setSystemChecks([]);
    setIsDocumentModalOpen(true);
  };

  // Initialize system checks based on pathway
  const initializeSystemChecks = (submission: Submission) => {
    const isLegacy = submission.pathway === 'legacy';
    const targetSystem = isLegacy ? 'Apprentice' : 'CVS';
    
    const checks: SystemCheck[] = [
      {
        id: 'connection',
        label: `Connecting to ${targetSystem}...`,
        status: 'pending'
      },
      {
        id: 'bio_data',
        label: 'Verifying bio data matches achievement data...',
        status: 'pending'
      },
      {
        id: 'qualification',
        label: 'Verifying qualification matches approval...',
        status: 'pending'
      }
    ];

    // Add re-issue specific checks
    if (submission.processType === 'reissue') {
      checks.push({
        id: 'certificate_exists',
        label: 'Verifying original certificate exists in system...',
        status: 'pending'
      });
    }

    // Add replace specific checks
    if (submission.processType === 'replace') {
      checks.push({
        id: 'void_check',
        label: 'Checking if original certificate can be voided...',
        status: 'pending'
      });
    }

    setSystemChecks(checks);
    return checks;
  };

  const runSystemChecks = async (submission: Submission, checks: SystemCheck[]) => {
    const isLegacy = submission.pathway === 'legacy';
    const targetSystem = isLegacy ? 'Apprentice' : 'CVS';
    
    // FOR PRESENTATION PURPOSES - Use submission ID to determine success/failure
    // Even IDs will succeed, odd IDs will fail
    const shouldSucceed = parseInt(submission.id.split('-').pop() || '0') % 2 === 0;
    
    // Make a copy of checks to work with
    const updatedChecks = [...checks];
    
    // Check 1: Connection
    if (updatedChecks[0]) {
      updatedChecks[0].status = 'processing';
      setSystemChecks([...updatedChecks]);
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(25);
      
      if (!shouldSucceed) {
        updatedChecks[0].status = 'failed';
        updatedChecks[0].message = `Could not connect to ${targetSystem} - Connection timeout`;
        setSystemChecks([...updatedChecks]);
        setProgress(25);
        return { 
          success: false, 
          error: `Failed to connect to ${targetSystem}. The system is currently unavailable.` 
        };
      }
      updatedChecks[0].status = 'passed';
      setSystemChecks([...updatedChecks]);
      setProgress(35);
    }

    // Check 2: Bio data matches
    if (updatedChecks[1]) {
      updatedChecks[1].status = 'processing';
      setSystemChecks([...updatedChecks]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(55);
      
      if (!shouldSucceed) {
        updatedChecks[1].status = 'failed';
        updatedChecks[1].message = 'Bio data does not match achievement data - ID number mismatch';
        setSystemChecks([...updatedChecks]);
        setProgress(55);
        return { 
          success: false, 
          error: 'Bio data mismatch: Learner ID in application does not match achievement record.' 
        };
      }
      updatedChecks[1].status = 'passed';
      setSystemChecks([...updatedChecks]);
      setProgress(70);
    }

    // Check 3: Qualification matches approval
    if (updatedChecks[2]) {
      updatedChecks[2].status = 'processing';
      setSystemChecks([...updatedChecks]);
      await new Promise(resolve => setTimeout(resolve, 900));
      setProgress(85);
      
      if (!shouldSucceed) {
        updatedChecks[2].status = 'failed';
        updatedChecks[2].message = 'Qualification code does not match approval record';
        setSystemChecks([...updatedChecks]);
        setProgress(85);
        return { 
          success: false, 
          error: 'Qualification mismatch: The qualification code submitted does not match the approved qualification.' 
        };
      }
      updatedChecks[2].status = 'passed';
      setSystemChecks([...updatedChecks]);
    }

    // Additional checks for re-issue
    if (submission.processType === 'reissue' && updatedChecks[3]) {
      updatedChecks[3].status = 'processing';
      setSystemChecks([...updatedChecks]);
      await new Promise(resolve => setTimeout(resolve, 700));
      setProgress(90);
      
      if (!shouldSucceed) {
        updatedChecks[3].status = 'failed';
        updatedChecks[3].message = 'Original certificate number not found in system';
        setSystemChecks([...updatedChecks]);
        setProgress(90);
        return { 
          success: false, 
          error: 'Original certificate not found: The certificate number provided does not exist in our records.' 
        };
      }
      updatedChecks[3].status = 'passed';
      setSystemChecks([...updatedChecks]);
    }

    // Additional checks for replace
    if (submission.processType === 'replace' && updatedChecks[3]) {
      updatedChecks[3].status = 'processing';
      setSystemChecks([...updatedChecks]);
      await new Promise(resolve => setTimeout(resolve, 700));
      setProgress(90);
      
      if (!shouldSucceed) {
        updatedChecks[3].status = 'failed';
        updatedChecks[3].message = 'Original certificate cannot be voided - already replaced';
        setSystemChecks([...updatedChecks]);
        setProgress(90);
        return { 
          success: false, 
          error: 'Cannot void original certificate: This certificate has already been replaced once.' 
        };
      }
      updatedChecks[3].status = 'passed';
      setSystemChecks([...updatedChecks]);
    }

    setProgress(100);
    return { success: true };
  };
const createCorrectionRecord = (
  submission: Submission,
  errorType: ErrorType,
  origin: OriginType,
  returnReason: string,
  integrationErrorLog?: IntegrationErrorLog
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
    correctionNotes: existingRecord?.correctionNotes || [],
    integrationErrorLog
  };
};

// In Integrations.tsx, replace the entire handleSendToCorrections function:

const handleSendToCorrections = () => {
  if (!selectedSubmission) return;

  // Create integration error log
  const integrationErrorLog: IntegrationErrorLog = {
    errorMessage: integrationError || 'System verification failed',
    errorResponse: integrationError || 'Integration failed during system checks',
    errorTimestamp: new Date().toISOString(),
    system: selectedSubmission.pathway === 'legacy' ? 'Apprentice' : 'CVS',
    revalidationStatus: 'failed'
  };

  // Create correction record
  const correctionRecord: CorrectionRecord = {
    correctionId: `COR-${Date.now()}`,
    submissionId: selectedSubmission.id,
    learnerName: selectedSubmission.candidateName,
    qualification: selectedSubmission.certificateType,
    pathway: selectedSubmission.pathway || 'occupational',
    errorType: 'integration_failure',
    origin: 'integration',
    responsibleUnit: selectedSubmission.createdBy as AppRole,
    currentStatus: 'active',
    version: 1,
    dateCreated: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    assignedTo: selectedSubmission.createdBy as AppRole,
    returnReason: `Integration Failure: ${integrationError || 'System verification failed'}`,
    correctionNotes: [],
    integrationErrorLog
  };

  // Send back to corrections with integration failure reason
  const updatedSubmission: Submission = {
    ...selectedSubmission,
    status: 'pending_correction', // CRITICAL: Must be pending_correction!
    assessmentData: {
      ...selectedSubmission.assessmentData,
      reviewDecision: 'returned',
      returnReason: `Integration Failure: ${integrationError || 'System verification failed'}`,
      returnedBy: currentRole,
      returnedAt: new Date().toISOString(),
      integrationStatus: 'failed',
      correctionRecord // CRITICAL: This must be set!
    }
  };

  console.log('Sending to corrections from integration:', updatedSubmission.id, updatedSubmission.status, updatedSubmission.assessmentData.correctionRecord);
  
  updateSubmission(selectedSubmission.id, updatedSubmission);
  
  toast({
    title: 'Sent to Corrections',
    description: 'Submission returned for integration failure',
  });

  setIsDocumentModalOpen(false);
  setSelectedSubmission(null);
};
  const handleIntegrate = async () => {
    if (!selectedSubmission) return;

    setIntegrationStatus('processing');
    setProgress(0);
    
    // Initialize system checks and get the checks array
    const checks = initializeSystemChecks(selectedSubmission);
    
    // Small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Run the system checks
    const result = await runSystemChecks(selectedSubmission, checks);
    
 // In the success state section, make sure you're not setting status to 'integrated' twice
// Just keep it as is - it's already setting status to 'integrated'
if (result.success) {
  // ALL CHECKS PASSED - Integration successful
  const pathway = selectedSubmission.pathway;
  const processType = selectedSubmission.processType;
  const targetSystem = pathway === 'legacy' ? 'Apprentice' : 'CVS';
  
  // SUCCESSFUL INTEGRATION - status is 'integrated'
  const updatedSubmission: Submission = {
    ...selectedSubmission,
    status: 'integrated', // This is correct - Batches will show it
    assessmentData: {
      ...selectedSubmission.assessmentData,
      integrationStatus: 'completed',
      integrationCompletedAt: new Date().toISOString(),
      integratedBy: currentRole,
      integratedSystem: targetSystem,
      // ... rest of the code
    }
  };

  updateSubmission(selectedSubmission.id, updatedSubmission);
  
  setIntegrationStatus('success');
  // Don't close modal here - let user click "Send to Batches"
} else {
      // SYSTEM CHECKS FAILED
      setIntegrationStatus('failed');
      setIntegrationError(result.error || 'System verification failed');
      
      // Update submission with failure
      const updatedSubmission: Submission = {
        ...selectedSubmission,
        assessmentData: {
          ...selectedSubmission.assessmentData,
          integrationStatus: 'failed',
          integrationFailedAt: new Date().toISOString(),
          integrationError: result.error,
          integrationAttempts: (selectedSubmission.assessmentData?.integrationAttempts || 0) + 1,
          systemChecks: systemChecks.map(check => ({
            name: check.label,
            passed: check.status === 'passed',
            error: check.message
          }))
        }
      };

      updateSubmission(selectedSubmission.id, updatedSubmission);
      
      toast({
        title: 'Integration Failed',
        description: result.error || 'System verification failed',
        variant: 'destructive',
      });
    }
  };

 

 const handleSendToBatches = () => {
  if (!selectedSubmission) return;

  // Send to batches section - status should be 'integrated', NOT 'in_batch'
  const updatedSubmission: Submission = {
    ...selectedSubmission,
    status: 'integrated', // Changed from 'in_batch' to 'integrated'
    assessmentData: {
      ...selectedSubmission.assessmentData,
      readyForBatch: true,
      readyForBatchAt: new Date().toISOString(),
      integrationStatus: 'completed', // Make sure this is set
      integratedBy: currentRole,
      integratedSystem: selectedSubmission.pathway === 'legacy' ? 'Apprentice' : 'CVS',
      integrationCompletedAt: selectedSubmission.assessmentData?.integrationCompletedAt || new Date().toISOString()
    }
  };

  console.log('Sending to batches section:', updatedSubmission.id, 'status:', updatedSubmission.status);
  
  updateSubmission(selectedSubmission.id, updatedSubmission);
  
  toast({
    title: 'Sent to Batches',
    description: 'Submission is now ready for batch creation',
  });

  setIsDocumentModalOpen(false);
  setSelectedSubmission(null);
};

  const handleStartDoubleCapture = () => {
    setShowDoubleCapture(true);
  };

  const handleVerifyDoubleCapture = () => {
    if (!selectedSubmission) return;

    // Verify the double-captured data matches
    const matches = 
      doubleCaptureData.candidateName === selectedSubmission.candidateName &&
      doubleCaptureData.certificateNumber === selectedSubmission.originalCertificateNumber;

    if (!matches) {
      toast({
        title: 'Verification Failed',
        description: 'Double-capture data does not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Verification Successful',
      description: 'Data verified. Starting system integration...',
    });

    setShowDoubleCapture(false);
    // Proceed with integration
    handleIntegrate();
  };

  const generateReissueNumber = (submission: Submission): string => {
    // Count previous re-issues for this certificate
    const previousReissues = profileSubmissions.filter(
      s => s.originalCertificateNumber === submission.originalCertificateNumber && 
           s.processType === 'reissue' &&
           s.status === 'integrated'
    ).length;
    
    return `R${previousReissues + 1}`;
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

  const pendingSubmissions = getPendingIntegrationSubmissions();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integration</h2>
        <p className="text-muted-foreground">
          CRT Admin: System verification and integration into CVS or Apprentice
        </p>
        <div className="mt-2 text-sm text-muted-foreground bg-blue-50 p-2 rounded">
          <strong>Demo Mode:</strong> Even submission IDs will succeed, odd IDs will fail
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending System Integration</CardTitle>
          <CardDescription>
            {pendingSubmissions.length} submission(s) waiting for system verification
          </CardDescription>
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
                <TableHead>Target System</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSubmissions.map((sub) => {
                const shouldSucceed = parseInt(sub.id.split('-').pop() || '0') % 2 === 0;
                return (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                    <TableCell>
                      <Badge variant={sub.processType === 'reissue' ? 'secondary' : sub.processType === 'replace' ? 'outline' : 'default'}>
                        {sub.processType === 'reissue' ? 'Re-Issue' : 
                         sub.processType === 'replace' ? 'Replace' : 'Issue'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{sub.candidateName}</TableCell>
                    <TableCell>{sub.certificateType}</TableCell>
                    <TableCell className="capitalize">{sub.pathway || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {sub.pathway === 'legacy' ? 'Apprentice' : 'CVS'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.assessmentData?.reviewedAt ? 
                        new Date(sub.assessmentData.reviewedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {sub.assessmentData?.integrationStatus === 'failed' ? (
                        <Badge variant="destructive">Failed</Badge>
                      ) : (
                        <Badge variant={shouldSucceed ? "secondary" : "destructive"} className={shouldSucceed ? "" : "bg-orange-100 text-orange-800"}>
                          {shouldSucceed ? 'Ready' : 'Will Fail'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        size="sm" 
                        onClick={() => handleViewDocuments(sub)}
                        variant={sub.assessmentData?.integrationStatus === 'failed' ? 'destructive' : 'default'}
                      >
                        {sub.assessmentData?.integrationStatus === 'failed' ? (
                          <>Retry Verification</>
                        ) : (
                          <>Verify & Integrate</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {pendingSubmissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No submissions waiting for integration
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Integration Modal */}
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>System Verification & Integration</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.id} - {selectedSubmission?.candidateName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6 mt-4">
              {/* System Info */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Target System</p>
                    <p className="font-medium">
                      {selectedSubmission.pathway === 'legacy' ? 'Apprentice' : 'CVS'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Process Type</p>
                    <p className="font-medium capitalize">
                      {selectedSubmission.processType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pathway</p>
                    <p className="font-medium capitalize">{selectedSubmission.pathway}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Attempts</p>
                    <p className="font-medium">{selectedSubmission.assessmentData?.integrationAttempts || 0}</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                  Demo: This submission will {parseInt(selectedSubmission.id.split('-').pop() || '0') % 2 === 0 ? '✅ SUCCEED' : '❌ FAIL'}
                </div>
              </div>

              {/* Re-Issue Double Capture */}
              {selectedSubmission.processType === 'reissue' && selectedSubmission.reissueReason === 'administrative_error' && integrationStatus === 'idle' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-3">Double Capture Required</h4>
                  {!showDoubleCapture ? (
                    <Button onClick={handleStartDoubleCapture} variant="outline">
                      Start Double Capture Verification
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label>Re-enter Candidate Name</Label>
                        <Input
                          value={doubleCaptureData.candidateName}
                          onChange={(e) => setDoubleCaptureData({...doubleCaptureData, candidateName: e.target.value})}
                          placeholder="Type candidate name again"
                        />
                      </div>
                      <div>
                        <Label>Re-enter Certificate Number</Label>
                        <Input
                          value={doubleCaptureData.certificateNumber}
                          onChange={(e) => setDoubleCaptureData({...doubleCaptureData, certificateNumber: e.target.value})}
                          placeholder="Type certificate number again"
                        />
                      </div>
                      <Button onClick={handleVerifyDoubleCapture}>
                        Verify and Continue
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              {integrationStatus === 'processing' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">System Verification Progress</span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full h-2" />
                </div>
              )}

              {/* System Checks */}
              {systemChecks.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">System Checks</h4>
                  {systemChecks.map((check) => (
                    <div key={check.id} className="flex items-start gap-3">
                      {check.status === 'pending' && (
                        <div className="h-5 w-5 rounded-full bg-gray-200 flex-shrink-0 mt-0.5" />
                      )}
                      {check.status === 'processing' && (
                        <RefreshCw className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0 mt-0.5" />
                      )}
                      {check.status === 'passed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      )}
                      {check.status === 'failed' && (
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm ${
                          check.status === 'failed' ? 'text-red-700' : 
                          check.status === 'passed' ? 'text-green-700' : 
                          'text-gray-700'
                        }`}>
                          {check.label}
                        </p>
                        {check.message && (
                          <p className="text-xs text-red-600 mt-1">{check.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Success State - Ready for Batches */}
              {integrationStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">All System Checks Passed</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Successfully verified and integrated into {selectedSubmission.pathway === 'legacy' ? 'Apprentice' : 'CVS'}
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <Button onClick={handleSendToBatches} className="bg-green-600 hover:bg-green-700">
                      <Package className="h-4 w-4 mr-2" />
                      Send to Batches
                    </Button>
                    <Button variant="outline" onClick={() => setIsDocumentModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              )}

              {/* Failure State - Send to Corrections */}
              {integrationStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800">Integration Failed</h4>
                      <p className="text-sm text-red-700 mt-1">{integrationError}</p>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleIntegrate} variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry Verification
                        </Button>
                        <Button onClick={handleSendToCorrections} variant="destructive" size="sm">
                          Send to Corrections
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Preview */}
              <div>
                <h4 className="font-medium text-lg mb-3">Documents</h4>
                <div className="space-y-2">
                  {selectedSubmission.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{getDocumentLabel(doc.type)}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.verified ? '✓ Verified' : 'Not verified'}
                          </p>
                        </div>
                      </div>
                      {doc.url && (
                        <Button variant="ghost" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Initial State - Start Integration Button */}
          {integrationStatus === 'idle' && !showDoubleCapture && (
            <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
              <Button variant="outline" onClick={() => setIsDocumentModalOpen(false)}>
                Close
              </Button>
              <Button onClick={handleIntegrate}>
                <Server className="h-4 w-4 mr-2" />
                Start System Verification
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}