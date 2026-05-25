import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuditTrail } from '@/context/AuditTrailContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Eye, FileText, Download, Server, RefreshCw, Package } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { ProcessType, Submission, DocumentType, AppRole, ErrorType, OriginType, CorrectionRecord, IntegrationErrorLog, DocumentVersion } from '@/types';
import { Input } from '@/components/ui/input';

const ROLES = {
  CERT_ADMIN: 'Certification Practitioner' as AppRole,
} as const;

// Rejection options for Send Back to Intake
type RejectionCategory = 'internal' | 'external';

interface RejectionOption {
  id: string;
  label: string;
  category: RejectionCategory;
}

const SEND_BACK_OPTIONS: RejectionOption[] = [
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

export default function Integration() {
  const { profileSubmissions, updateSubmission, currentRole } = useApp();
  const { toast } = useToast();
  const { logAction } = useAuditTrail();
  
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
  const [todoDate, setTodoDate] = useState('');
  
  // Send Back to Intake modal state
  const [showSendBackToIntakeModal, setShowSendBackToIntakeModal] = useState(false);
  const [sendBackSelectedRejectionIds, setSendBackSelectedRejectionIds] = useState<string[]>([]);
  const [sendBackRejectionComments, setSendBackRejectionComments] = useState('');
  const [sendBackRejectionCategory, setSendBackRejectionCategory] = useState<RejectionCategory | 'both'>('both');

  const handleSendBackToIntake = () => {
    if (!selectedSubmission) return;

    if (sendBackSelectedRejectionIds.length === 0) {
      toast({
        title: 'Select a Reason',
        description: 'Please select at least one reason for sending back to Intake.',
        variant: 'destructive',
      });
      return;
    }

    // Build a human-readable return reason from selected options + comments
    const selectedLabels = SEND_BACK_OPTIONS
      .filter(o => sendBackSelectedRejectionIds.includes(o.id))
      .map(o => `• ${o.label}`);
    const returnReason = [
      ...selectedLabels,
      sendBackRejectionComments.trim() ? `Additional comments: ${sendBackRejectionComments.trim()}` : '',
    ].filter(Boolean).join('\n');

    // Build structured rejection details for Intake to display
    const rejectionDetails = {
      selectedReasonIds: sendBackSelectedRejectionIds,
      selectedReasons: SEND_BACK_OPTIONS
        .filter(o => sendBackSelectedRejectionIds.includes(o.id))
        .map(o => ({ id: o.id, label: o.label, category: o.category as string })),
      comments: sendBackRejectionComments.trim() || undefined,
      returnedBy: currentRole,
      returnedAt: new Date().toISOString(),
    };

    const updatedSubmission: Submission = {
      ...selectedSubmission,
      status: 'submitted', // Send back to submitted so it appears in Intake
      assessmentData: {
        ...selectedSubmission.assessmentData,

        // Clear integration workflow
        integrationStatus: 'pending',
        integrationError: undefined,
        integrationFailedAt: undefined,
        integrationCompletedAt: undefined,
        integratedBy: undefined,
        integratedSystem: undefined,
        systemChecks: undefined,

        // Reset review states
        reviewCompleted: false,
        reviewDecision: undefined,
        reviewedBy: undefined,
        reviewedAt: undefined,

        // Add send-back tracking with full details
        sentBackToIntake: true,
        sentBackToIntakeAt: new Date().toISOString(),
        sentBackToIntakeBy: currentRole,
        sentBackToIntakeReason: returnReason,
        sentBackRejectionDetails: rejectionDetails,
      }
    };

    updateSubmission(selectedSubmission.id, updatedSubmission);

    toast({
      title: 'Sent Back to Intake',
      description: 'Submission has been returned to Intake for re-review with the rejection details.',
    });
    logAction({ user: currentRole, module: 'Integrations', action: `Sent submission ${selectedSubmission.id} back to Intake`, status: 'Success', details: selectedSubmission.candidateName });

    // Reset state and close
    setShowSendBackToIntakeModal(false);
    setSendBackSelectedRejectionIds([]);
    setSendBackRejectionComments('');
    setSendBackRejectionCategory('both');
    setIsDocumentModalOpen(false);
    setSelectedSubmission(null);
  };

  const toggleSendBackOption = (id: string) => {
    setSendBackSelectedRejectionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Render Send Back to Intake rejection modal
  const renderSendBackModal = () => {
    const internalOptions = SEND_BACK_OPTIONS.filter(o => o.category === 'internal');
    const externalOptions = SEND_BACK_OPTIONS.filter(o => o.category === 'external');

    const filteredInternal = sendBackRejectionCategory === 'external' ? [] : internalOptions;
    const filteredExternal = sendBackRejectionCategory === 'internal' ? [] : externalOptions;

    return (
      <Dialog open={showSendBackToIntakeModal} onOpenChange={setShowSendBackToIntakeModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-5 w-5" />
              Send Back to Intake
            </DialogTitle>
            <DialogDescription>
              Select the reason(s) for sending this submission back to Intake. Intake will see these details when re-reviewing.
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
                    onClick={() => setSendBackRejectionCategory(cat)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      sendBackRejectionCategory === cat
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
                        checked={sendBackSelectedRejectionIds.includes(option.id)}
                        onCheckedChange={() => toggleSendBackOption(option.id)}
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
                        checked={sendBackSelectedRejectionIds.includes(option.id)}
                        onCheckedChange={() => toggleSendBackOption(option.id)}
                        className="mt-0.5"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Selected summary */}
            {sendBackSelectedRejectionIds.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-800 mb-2">Selected reasons ({sendBackSelectedRejectionIds.length}):</p>
                <ul className="space-y-1">
                  {SEND_BACK_OPTIONS.filter(o => sendBackSelectedRejectionIds.includes(o.id)).map(o => (
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
              <p className="text-xs text-muted-foreground">Add any specific details or instructions for Intake.</p>
              <Textarea
                value={sendBackRejectionComments}
                onChange={e => setSendBackRejectionComments(e.target.value)}
                placeholder="Describe specifically what needs to be corrected or re-reviewed..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowSendBackToIntakeModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSendBackToIntake}
              disabled={sendBackSelectedRejectionIds.length === 0}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Confirm Send Back to Intake
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // System check types
  interface SystemCheck {
    id: string;
    label: string;
    status: 'pending' | 'processing' | 'passed' | 'failed';
    message?: string;
  }

  const getCorrectionTodoDate = (days = 7) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };
  
  // Reset state when opening a new submission
  useEffect(() => {
    if (selectedSubmission && isDocumentModalOpen) {
      setSystemChecks([]);
      setProgress(0);
      setIntegrationStatus('idle');
      setIntegrationError('');
      setShowDoubleCapture(false);
      setTodoDate('');
      setSendBackSelectedRejectionIds([]);
      setSendBackRejectionComments('');
      setSendBackRejectionCategory('both');
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
    const shouldSucceed = integrationTestMode === 'pass';
    
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

  const [integrationTestMode, setIntegrationTestMode] = useState<'pass' | 'fail'>('pass');
  
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
      integrationErrorLog,
      todoDate: getCorrectionTodoDate(7),
      expired: false,
    };
  };

  const handleSendToCorrections = () => {
    if (!selectedSubmission) return;

    if (!todoDate) {
      toast({
        title: 'To Do Date Required',
        description: 'Please set a to do date before sending back for correction.',
        variant: 'destructive',
      });
      return;
    }

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
      integrationErrorLog,
      todoDate: new Date(todoDate).toISOString(),
      expired: false,
    };

    // Send back to corrections with integration failure reason
    const updatedSubmission: Submission = {
      ...selectedSubmission,
      status: 'pending_correction',
      assessmentData: {
        ...selectedSubmission.assessmentData,
        reviewDecision: 'returned',
        returnReason: `Integration Failure: ${integrationError || 'System verification failed'}`,
        returnedBy: currentRole,
        returnedAt: new Date().toISOString(),
        integrationStatus: 'failed',
        correctionRecord
      }
    };

    console.log('Sending to corrections from integration:', updatedSubmission.id, updatedSubmission.status, updatedSubmission.assessmentData.correctionRecord);
    
    updateSubmission(selectedSubmission.id, updatedSubmission);
    
    toast({
      title: 'Sent to Corrections',
      description: 'Submission returned for integration failure',
    });
    logAction({ user: currentRole, module: 'Integrations', action: `Sent submission ${selectedSubmission.id} to Corrections`, status: 'Failed', details: integrationError || 'System verification failed' });

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
    
    if (result.success) {
      // ALL CHECKS PASSED - Integration successful
      const pathway = selectedSubmission.pathway;
      const targetSystem = pathway === 'legacy' ? 'Apprentice' : 'CVS';
      
      // SUCCESSFUL INTEGRATION - status is 'integrated'
      const updatedSubmission: Submission = {
        ...selectedSubmission,
        status: 'integrated',
        assessmentData: {
          ...selectedSubmission.assessmentData,
          integrationStatus: 'completed',
          integrationCompletedAt: new Date().toISOString(),
          integratedBy: currentRole,
          integratedSystem: targetSystem,
          integrationAttempts: (selectedSubmission.assessmentData?.integrationAttempts || 0) + 1,
          systemChecks: systemChecks.map(check => ({
            name: check.label,
            passed: check.status === 'passed',
            error: check.message
          }))
        }
      };

      updateSubmission(selectedSubmission.id, updatedSubmission);
      
      setIntegrationStatus('success');
      toast({
        title: 'Integration Successful',
        description: `Successfully integrated into ${targetSystem}`,
      });
      logAction({ user: currentRole, module: 'Integrations', action: `Integrated submission ${selectedSubmission.id} into ${targetSystem}`, status: 'Success', details: selectedSubmission.candidateName });
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
      logAction({ user: currentRole, module: 'Integrations', action: `Integration failed for submission ${selectedSubmission.id}`, status: 'Failed', details: result.error });
    }
  };

  const handleSendToBatches = () => {
    if (!selectedSubmission) return;

    const updatedSubmission: Submission = {
      ...selectedSubmission,
      status: 'integrated',
      assessmentData: {
        ...selectedSubmission.assessmentData,
        readyForBatch: true,
        readyForBatchAt: new Date().toISOString(),
        integrationStatus: 'completed',
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
    logAction({ user: currentRole, module: 'Integrations', action: `Sent submission ${selectedSubmission.id} to Batches`, status: 'Success', details: selectedSubmission.candidateName });

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
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSubmissions.map((sub) => {
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                <div className="mt-2 space-y-2">
                  <div className="mt-2 text-sm text-muted-foreground bg-blue-50 p-2 rounded">
                    <strong>Demo Mode:</strong> Use the Force Pass / Force Fail controls.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={integrationTestMode === 'pass' ? 'default' : 'outline'}
                      onClick={() => setIntegrationTestMode('pass')}
                    >
                      Force Pass
                    </Button>
                    <Button
                      type="button"
                      variant={integrationTestMode === 'fail' ? 'destructive' : 'outline'}
                      onClick={() => setIntegrationTestMode('fail')}
                    >
                      Force Fail
                    </Button>
                  </div>
                </div>
              </div>

              {/* Send Back to Intake Section */}
              <div className="border rounded-lg p-4 bg-amber-50 border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-amber-800">Send Back to Intake</h4>
                    <p className="text-sm text-amber-700">
                      Use this if the submission must go back to Intake for re-review before integration continues.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowSendBackToIntakeModal(true)}
                    className="border-amber-300 hover:bg-amber-100"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Send Back to Intake
                  </Button>
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

                      <div className="mt-4">
                        <Label htmlFor="integration-todo-date">To Do Date</Label>
                        <Input
                          id="integration-todo-date"
                          type="date"
                          value={todoDate}
                          onChange={(e) => setTodoDate(e.target.value)}
                          className="mt-1 max-w-xs"
                        />
                      </div>

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

              {/* CVS Pre-Validation Results */}
              {selectedSubmission?.assessmentData?.preIntakeValidationStatus && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-blue-900">External CVS Pre-Validation</h4>
                    <p className="text-sm text-blue-700">
                      Validation completed before the submission was sent to Internal Intake.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        selectedSubmission.assessmentData.preIntakeValidationStatus === 'passed'
                          ? 'outline'
                          : selectedSubmission.assessmentData.preIntakeValidationStatus === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {selectedSubmission.assessmentData.preIntakeValidationStatus}
                    </Badge>

                    {selectedSubmission.assessmentData.preIntakeValidationAt && (
                      <span className="text-xs text-muted-foreground">
                        Checked: {new Date(selectedSubmission.assessmentData.preIntakeValidationAt).toLocaleString()}
                      </span>
                    )}

                    {selectedSubmission.assessmentData.preIntakeValidatedBy && (
                      <span className="text-xs text-muted-foreground">
                        By: {selectedSubmission.assessmentData.preIntakeValidatedBy}
                      </span>
                    )}
                  </div>

                  {selectedSubmission.assessmentData.preIntakeValidationError && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3">
                      <p className="text-sm font-medium text-red-800">Validation Error</p>
                      <p className="text-sm text-red-700 mt-1">
                        {selectedSubmission.assessmentData.preIntakeValidationError}
                      </p>
                    </div>
                  )}

                  {selectedSubmission.assessmentData.preIntakeValidationSummary && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">File 3 to 4 Learner Summary</p>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-md border bg-white p-3">
                          <p className="text-xs text-muted-foreground">Total Learners</p>
                          <p className="font-semibold">
                            {selectedSubmission.assessmentData.preIntakeValidationSummary.totalLearners}
                          </p>
                        </div>

                        <div className="rounded-md border bg-white p-3">
                          <p className="text-xs text-muted-foreground">Passed</p>
                          <p className="font-semibold text-green-600">
                            {selectedSubmission.assessmentData.preIntakeValidationSummary.passedLearners}
                          </p>
                        </div>

                        <div className="rounded-md border bg-white p-3">
                          <p className="text-xs text-muted-foreground">Failed</p>
                          <p className="font-semibold text-red-600">
                            {selectedSubmission.assessmentData.preIntakeValidationSummary.failedLearners}
                          </p>
                        </div>
                      </div>

                      {selectedSubmission.assessmentData.preIntakeValidationSummary.failedRows &&
                        selectedSubmission.assessmentData.preIntakeValidationSummary.failedRows.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Failed Learners / Rows</p>
                            {selectedSubmission.assessmentData.preIntakeValidationSummary.failedRows.map((row, idx) => (
                              <div
                                key={idx}
                                className="rounded-md border border-red-200 bg-red-50 p-2 text-xs"
                              >
                                <span className="font-medium">{row.learnerIdentifier}:</span> {row.reason}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  )}

                  {selectedSubmission.assessmentData.preIntakeSystemChecks &&
                    selectedSubmission.assessmentData.preIntakeSystemChecks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Validation Checks</p>
                        {selectedSubmission.assessmentData.preIntakeSystemChecks.map((check, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span>{check.passed ? '✅' : '❌'}</span>
                            <div>
                              <p>{check.name}</p>
                              {check.error && (
                                <p className="text-xs text-red-600">{check.error}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

      {/* Send Back to Intake Modal */}
      {renderSendBackModal()}
    </div>
  );
}