import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter  } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, FileText, Download, Upload, History, GitBranch, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { 
  ProcessType, 
  SubmissionSource, 
  ReissueReason, 
  Pathway, 
  DocumentType, 
  AppRole, 
  Submission, 
  SubmissionDocument,
  CorrectionRecord,
  CorrectionNote,
  DocumentVersion,
  ErrorType,
  OriginType,
  SubmissionStatus
} from '@/types';

// Define all roles as constants
const ROLES = {
  CERT_ADMIN: 'Cert Admin' as AppRole,
  ASSESSMENT_UNIT: 'Assessment Unit' as AppRole,
  NAMB: 'NAMB' as AppRole,
  QP: 'QP' as AppRole,
  SDP: 'SDP' as AppRole,
} as const;

export default function ProfileIntake() {
  const { addProfileSubmission, currentRole, profileSubmissions, setCurrentRole, updateSubmission } = useApp();
  const { toast } = useToast();

  const [processType, setProcessType] = useState<ProcessType>('issue');
  const [formData, setFormData] = useState({ 
    candidateName: '', 
    certificateType: '' 
  });
  const [pathway, setPathway] = useState<Pathway>('occupational');
  const [reissueReason, setReissueReason] = useState<ReissueReason>('lost');
  const [originalCertificateNumber, setOriginalCertificateNumber] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<DocumentType[]>([]);
  const [hasAffidavitOrOriginal, setHasAffidavitOrOriginal] = useState<'affidavit' | 'original_certificate' | ''>('');
  const [uploadedFiles, setUploadedFiles] = useState<{ [key in DocumentType]?: string }>({});
  
  // Document viewer state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  
  // Correction viewer state
  const [returnedSubmission, setReturnedSubmission] = useState<Submission | null>(null);
  const [isReturnedModalOpen, setIsReturnedModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'documents'>('details');
  const [correctionNotes, setCorrectionNotes] = useState({ whatWasCorrected: '', reasonForChange: '' });
  const [updatedFiles, setUpdatedFiles] = useState<{ [key in DocumentType]?: { file: string; version: number } }>({});
  const [resubmitMode, setResubmitMode] = useState(false);
  
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  // Load current profile from localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem('currentProfile');
    const storedRole = localStorage.getItem('currentUserRole') as AppRole | null;
    
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        setCurrentProfile(profile);
      } catch (error) {
        console.error('Failed to parse current profile:', error);
      }
    }
    
    if (storedRole) {
      setCurrentRole(storedRole);
    }
  }, []);

  // Force role from profile after profile is loaded
  useEffect(() => {
    if (currentProfile && currentProfile.role) {
      const profileRole = currentProfile.role as AppRole;
      setCurrentRole(profileRole);
      localStorage.setItem('currentUserRole', profileRole);
    }
  }, [currentProfile]);

  const handleViewReturnedSubmission = (submission: Submission) => {
    setReturnedSubmission(submission);
    setResubmitMode(false);
    setCorrectionNotes({ whatWasCorrected: '', reasonForChange: '' });
    setUpdatedFiles({});
    setActiveTab('details');
    setIsReturnedModalOpen(true);
  };

  const handleResubmitCorrection = () => {
    if (!returnedSubmission) return;

    // Validate correction notes
    if (!correctionNotes.whatWasCorrected.trim() || !correctionNotes.reasonForChange.trim()) {
      toast({
        title: 'Correction Notes Required',
        description: 'Please document what was corrected and the reason for change.',
        variant: 'destructive',
      });
      return;
    }

    // Get existing correction record or create a new one
    const existingRecord = returnedSubmission.assessmentData?.correctionRecord;
    const currentVersion = existingRecord?.version || 0;

    // Update documents with new versions
    const updatedDocuments = returnedSubmission.documents.map(doc => {
      if (updatedFiles[doc.type]) {
        // Get existing versions or create new array
        const versions = doc.versions || [{
          version: 1,
          url: doc.url || '',
          uploadedAt: doc.uploadedAt,
          uploadedBy: returnedSubmission.createdBy,
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

    // Create correction note
    const newCorrectionNote: CorrectionNote = {
      id: `NOTE-${Date.now()}`,
      whatWasCorrected: correctionNotes.whatWasCorrected,
      reasonForChange: correctionNotes.reasonForChange,
      correctedBy: currentRole,
      correctedAt: new Date().toISOString(),
      version: currentVersion + 1
    };

    // Update correction record
    const updatedCorrectionRecord: CorrectionRecord = {
      ...(returnedSubmission.assessmentData?.correctionRecord || {
        correctionId: `COR-${Date.now()}`,
        submissionId: returnedSubmission.id,
        learnerName: returnedSubmission.candidateName,
        qualification: returnedSubmission.certificateType,
        pathway: returnedSubmission.pathway || 'occupational',
        errorType: (returnedSubmission.assessmentData?.correctionRecord?.errorType) || 'missing_documentation',
        origin: (returnedSubmission.assessmentData?.correctionRecord?.origin) || 'intake',
        responsibleUnit: returnedSubmission.createdBy as AppRole,
        currentStatus: 'pending_review',
        version: 0,
        dateCreated: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        assignedTo: returnedSubmission.createdBy as AppRole,
        returnReason: returnedSubmission.assessmentData?.returnReason || '',
        correctionNotes: []
      }),
      currentStatus: 'pending_review',
      lastUpdated: new Date().toISOString(),
      version: currentVersion + 1,
      correctionNotes: [
        ...(returnedSubmission.assessmentData?.correctionRecord?.correctionNotes || []),
        newCorrectionNote
      ]
    };

    // Update submission
    const updatedSubmission: Submission = {
      ...returnedSubmission,
      documents: updatedDocuments,
      status: 'submitted' as SubmissionStatus,
      assessmentData: {
        ...returnedSubmission.assessmentData,
        correctionRecord: updatedCorrectionRecord,
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

    updateSubmission(returnedSubmission.id, updatedSubmission);
    
    toast({
      title: 'Resubmitted for Review',
      description: `Correction v${updatedCorrectionRecord.version} has been sent for review.`,
    });

    setIsReturnedModalOpen(false);
    setReturnedSubmission(null);
  };

  // Get document versions
  const getDocumentVersions = (doc: any): DocumentVersion[] => {
    return doc.versions || [{
      version: 1,
      url: doc.url || '',
      uploadedAt: doc.uploadedAt,
      uploadedBy: returnedSubmission?.createdBy || 'Unknown',
      verified: doc.verified || false
    }];
  };

  // Check if user can create submission based on process type and pathway
  const canCreateSubmission = (): { allowed: boolean; message?: string } => {
    // ISSUE: ONLY Assessment Unit can create (Cert Admin also allowed for testing)
    if (processType === 'issue') {
      if (currentRole === ROLES.ASSESSMENT_UNIT || currentRole === ROLES.CERT_ADMIN) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        message: 'Only Assessment Unit can create new certificate submissions' 
      };
    }

    // RE-ISSUE: Different roles with different pathway restrictions
    if (processType === 'reissue') {
      // Cert Admin can do all pathways
      if (currentRole === ROLES.CERT_ADMIN) {
        return { allowed: true };
      }

      // QP can do Occupational or Skills
      if (currentRole === ROLES.QP) {
        if (pathway === 'occupational' || pathway === 'skills') {
          return { allowed: true };
        }
        return { 
          allowed: false, 
          message: 'QP can only create re-issue submissions for Occupational or Skills certificates' 
        };
      }

      // SDP can do Occupational or Skills
      if (currentRole === ROLES.SDP) {
        if (pathway === 'occupational' || pathway === 'skills') {
          return { allowed: true };
        }
        return { 
          allowed: false, 
          message: 'SDP can only create re-issue submissions for Occupational or Skills certificates' 
        };
      }

      // NAMB can only do Legacy
      if (currentRole === ROLES.NAMB) {
        if (pathway === 'legacy') {
          return { allowed: true };
        }
        return { 
          allowed: false, 
          message: 'NAMB can only create re-issue submissions for Legacy certificates' 
        };
      }

      // Assessment Unit can do Occupational or Skills for re-issue
      if (currentRole === ROLES.ASSESSMENT_UNIT) {
        if (pathway === 'occupational' || pathway === 'skills') {
          return { allowed: true };
        }
        return { 
          allowed: false, 
          message: 'Assessment Unit can only create re-issue submissions for Occupational or Skills certificates' 
        };
      }
    }

    // REPLACE: All 5 users can create replace submissions for all certification types
    if (processType === 'replace') {
      const allowedReplaceRoles = [
        ROLES.ASSESSMENT_UNIT,
        ROLES.QP,
        ROLES.NAMB,
        ROLES.SDP,
        ROLES.CERT_ADMIN
      ];

      if (allowedReplaceRoles.includes(currentRole as any)) {
        return { allowed: true };
      }
      
      return { 
        allowed: false, 
        message: 'Your role cannot create replace submissions' 
      };
    }

    return { allowed: false, message: 'Your role cannot create this type of submission' };
  };

  // Set submission source based on current user role
  const getSubmissionSource = (): SubmissionSource => {
    if (currentProfile) {
      const companyType = currentProfile.companyType;
      
      if (companyType === 'NAMB' || companyType === 'NAMB (Legacy)') {
        return 'NAMB';
      }
      if (companyType === 'QP') {
        return 'QP';
      }
      if (companyType === 'SDP') {
        return 'SDP';
      }
      if (companyType === 'Assessment Unit') {
        return 'QP';
      }
      if (companyType === 'Cert Admin') {
        return 'SDP';
      }
    }

    // Fallback to role-based mapping
    if (currentRole === 'NAMB') return 'NAMB';
    if (currentRole === 'QP') return 'QP';
    if (currentRole === 'SDP') return 'SDP';
    if (currentRole === 'Assessment Unit') return 'QP';
    if (currentRole === 'Cert Admin') return 'SDP';
    
    return 'SDP';
  };

  // Get the display name with company info
  const getSubmissionSourceDisplay = (): string => {
    const source = getSubmissionSource();
    
    if (currentProfile) {
      switch (source) {
        case 'NAMB':
          return `NAMB - ${currentProfile.companyName || 'Legacy Authority'}`;
        case 'QP':
          return `QP - ${currentProfile.companyName || 'Quality Partner'}`;
        case 'SDP':
          return `SDP - ${currentProfile.companyName || 'Skills Development Provider'}`;
        default:
          return source;
      }
    }
    
    switch (currentRole) {
      case 'NAMB':
        return 'NAMB';
      case 'QP':
        return 'QP';
      case 'SDP':
        return 'SDP';
      case 'Assessment Unit':
        return 'QP (Assessment Unit)';
      case 'Cert Admin':
        return 'SDP (Cert Admin)';
      default:
        return source;
    }
  };

  // Filter process types based on user role
  const getAvailableProcessTypes = (): ProcessType[] => {
    // Cert Admin can do everything
    if (currentRole === ROLES.CERT_ADMIN) {
      return ['issue', 'reissue', 'replace'];
    }

    // Assessment Unit can do Issue, Re-issue, and Replace
    if (currentRole === ROLES.ASSESSMENT_UNIT) {
      return ['issue', 'reissue', 'replace'];
    }

    // QP can ONLY do Re-issue and Replace - NO ISSUE
    if (currentRole === ROLES.QP) {
      return ['reissue', 'replace'];
    }

    // SDP can ONLY do Re-issue and Replace - NO ISSUE
    if (currentRole === ROLES.SDP) {
      return ['reissue', 'replace'];
    }

    // NAMB can ONLY do Re-issue and Replace - NO ISSUE
    if (currentRole === ROLES.NAMB) {
      return ['reissue', 'replace'];
    }

    return [];
  };

  // Filter available certificate types based on user role and process type
  const getAvailablePathways = (): Pathway[] => {
    // ISSUE: ONLY Assessment Unit and Cert Admin
    if (processType === 'issue') {
      if (currentRole === ROLES.ASSESSMENT_UNIT || currentRole === ROLES.CERT_ADMIN) {
        return ['occupational', 'skills', 'legacy'];
      }
      return [];
    }

    // RE-ISSUE: Role-based pathway restrictions
    if (processType === 'reissue') {
      // Cert Admin can do all
      if (currentRole === ROLES.CERT_ADMIN) {
        return ['occupational', 'skills', 'legacy'];
      }
      
      // Assessment Unit, QP, and SDP can do Occupational or Skills
      if (currentRole === ROLES.ASSESSMENT_UNIT || 
          currentRole === ROLES.QP || 
          currentRole === ROLES.SDP) {
        return ['occupational', 'skills'];
      }
      
      // NAMB can only do Legacy
      if (currentRole === ROLES.NAMB) {
        return ['legacy'];
      }
    }

    // REPLACE: All 5 roles can do all pathways
    if (processType === 'replace') {
      const allowedReplaceRoles = [
        ROLES.ASSESSMENT_UNIT,
        ROLES.QP,
        ROLES.NAMB,
        ROLES.SDP,
        ROLES.CERT_ADMIN
      ];

      if (allowedReplaceRoles.includes(currentRole as any)) {
        return ['occupational', 'skills', 'legacy'];
      }
    }

    return [];
  };

  // Update pathway when process type or role changes
  useEffect(() => {
    const availablePathways = getAvailablePathways();
    if (availablePathways.length > 0) {
      if (!availablePathways.includes(pathway)) {
        setPathway(availablePathways[0]);
        setFormData(prev => ({ ...prev, certificateType: availablePathways[0] }));
      }
    }
  }, [processType, currentRole]);

  // Document requirements based on process type, pathway, and reason
  const getDocumentRequirements = () => {
    const docs: { type: DocumentType; label: string; required: boolean }[] = [];

    if (processType === 'issue') {
      switch (pathway) {
        case 'occupational':
          docs.push(
            { type: 'recommendation_letter', label: 'Recommendation Letter', required: true },
            { type: 'approval_letter', label: 'Approval Letter', required: true },
            { type: 'file_3_4', label: 'File 3–4', required: true },
            { type: 'signed_result_approval', label: 'Signed Result Approval', required: true },
            { type: 'supporting_evidence', label: 'Supporting Evidence', required: true }
          );
          break;
        case 'skills':
          docs.push(
            { type: 'programme_approval_letter', label: 'Programme Approval Letter', required: true },
            { type: 'learner_result_approval_sheet', label: 'Learner Result Approval Sheet', required: true },
            { type: 'qualification_data_confirmation', label: 'Qualification/Programme Data Confirmation', required: true },
            { type: 'supporting_achievement_documentation', label: 'Supporting Achievement Documentation', required: false }
          );
          break;
        case 'legacy':
          docs.push(
            { type: 'signed_declaration', label: 'Signed Declaration', required: true },
            { type: 'learner_achievement_data_proof', label: 'Learner Achievement Data Proof', required: true },
            { type: 'qualification_confirmation', label: 'Qualification Confirmation', required: true },
            { type: 'bio_data_confirmation', label: 'Bio Data Confirmation', required: true },
            { type: 'historical_verification', label: 'Historical Verification Documentation', required: false }
          );
          break;
      }
    } else if (processType === 'reissue') {
      docs.push(
        { type: 'reissue_application_form', label: 'Re-Issue Application Form', required: true },
        { type: 'proof_of_payment', label: 'Proof of Payment', required: true },
        { type: 'id_copy', label: 'Supporting ID Copy', required: true }
      );

      if (pathway === 'legacy') {
        docs.push({ type: 'historical_verification', label: 'Historical Verification', required: false });
      }
    } else if (processType === 'replace') {
      docs.push(
        { type: 'replace_application_form', label: 'Replace Application Form', required: true },
        { type: 'id_copy', label: 'ID Copy', required: true }
      );

      switch (pathway) {
        case 'occupational':
          docs.push(
            { type: 'approval_letter', label: 'Approval Letter (if required by governance)', required: false }
          );
          break;
        case 'skills':
          docs.push(
            { type: 'recommendation_letter', label: 'Recommendation Letter (if required)', required: false },
            { type: 'approval_letter', label: 'Approval Letter', required: true }
          );
          break;
        case 'legacy':
          docs.push(
            { type: 'historical_verification', label: 'Historical Verification (if required)', required: false }
          );
          break;
      }
    }

    return docs;
  };

  const validateSubmission = (): boolean => {
    const permission = canCreateSubmission();
    if (!permission.allowed) {
      toast({ 
        title: 'Permission Denied', 
        description: permission.message || 'Your role cannot create this submission', 
        variant: 'destructive' 
      });
      return false;
    }

    if (!formData.candidateName) {
      toast({ title: 'Missing Field', description: 'Candidate name is required', variant: 'destructive' });
      return false;
    }

    if (!formData.certificateType) {
      toast({ title: 'Missing Field', description: 'Certificate type is required', variant: 'destructive' });
      return false;
    }

    const requirements = getDocumentRequirements();
    const missingRequired = requirements
      .filter(doc => doc.required && !selectedDocs.includes(doc.type))
      .map(doc => doc.label);

    if (missingRequired.length > 0) {
      toast({ 
        title: 'Missing Required Documents', 
        description: `Please upload: ${missingRequired.join(', ')}`, 
        variant: 'destructive' 
      });
      return false;
    }

    if ((processType === 'reissue' || processType === 'replace') && !hasAffidavitOrOriginal) {
      toast({ 
        title: 'Missing Document', 
        description: 'Affidavit OR Original Certificate is required', 
        variant: 'destructive' 
      });
      return false;
    }

    if ((processType === 'reissue' || processType === 'replace') && !originalCertificateNumber) {
      toast({ 
        title: 'Missing Field', 
        description: `Original Certificate Number is required for ${processType}`, 
        variant: 'destructive' 
      });
      return false;
    }

    return true;
  };

  const handleFileUpload = (docType: DocumentType, file: File) => {
    const fileUrl = URL.createObjectURL(file);
    setUploadedFiles((prev) => ({ ...prev, [docType]: fileUrl }));
    setSelectedDocs((prev) => prev.includes(docType) ? prev : [...prev, docType]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSubmission()) return;

    const documents = [...selectedDocs];
    if (hasAffidavitOrOriginal) {
      documents.push(hasAffidavitOrOriginal as DocumentType);
    }

    const submissionDocs = documents.map(type => ({
      id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as DocumentType,
      name: `${getDocumentLabel(type)}.pdf`,
      uploadedAt: new Date().toISOString(),
      url: uploadedFiles[type] || '',
      verified: false,
    }));

    const submissionSource = getSubmissionSource();
    const sourceDisplay = getSubmissionSourceDisplay();

    addProfileSubmission({
      candidateName: formData.candidateName,
      certificateType: formData.certificateType,
      dateSubmitted: new Date().toISOString(),
      status: 'draft',
      documents: submissionDocs,
      assessmentData: {
        submittedBy: currentProfile ? {
          name: currentProfile.fullName,
          company: currentProfile.companyName,
          companyType: currentProfile.companyType,
          role: currentRole
        } : null
      },
      createdBy: currentRole,
      processType,
      source: submissionSource,
      sourceDisplay,
      pathway,
      ...((processType === 'reissue' || processType === 'replace') && {
        originalCertificateNumber
      }),
      ...(processType === 'reissue' && { 
        reissueReason
      })
    });

    toast({ 
      title: 'Success', 
      description: `${processType === 'reissue' ? 'Re-Issue' : processType === 'replace' ? 'Replace' : 'Issue'} submission created successfully` 
    });

    // Reset form
    setFormData({ candidateName: '', certificateType: pathway });
    setOriginalCertificateNumber('');
    setSelectedDocs([]);
    setHasAffidavitOrOriginal('');
    setUploadedFiles({});
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

  const handleViewDocuments = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsDocumentModalOpen(true);
  };

  const renderDocumentViewer = () => {
    if (!selectedSubmission) return null;

    return (
      <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uploaded Documents</DialogTitle>
            <DialogDescription>
              Submission: {selectedSubmission.id} - {selectedSubmission.candidateName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Submission Details</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Candidate:</span>{' '}
                    <span className="font-medium">{selectedSubmission.candidateName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Certificate Type:</span>{' '}
                    <span className="font-medium capitalize">{selectedSubmission.pathway || selectedSubmission.certificateType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Process Type:</span>{' '}
                    <span className="font-medium capitalize">
                      {selectedSubmission.processType === 'reissue' ? 'Re-Issue' : 
                       selectedSubmission.processType === 'replace' ? 'Replace' : 'Issue'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date Submitted:</span>{' '}
                    <span className="font-medium">
                      {selectedSubmission.dateSubmitted ? new Date(selectedSubmission.dateSubmitted).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  {selectedSubmission.originalCertificateNumber && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Original Certificate #:</span>{' '}
                      <span className="font-medium">{selectedSubmission.originalCertificateNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <h4 className="font-medium text-lg mt-2">Documents ({selectedSubmission.documents.length})</h4>
              
              {selectedSubmission.documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded for this submission</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedSubmission.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{getDocumentLabel(doc.type)}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      {doc.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderReturnedSubmissionViewer = () => {
    if (!returnedSubmission) return null;

    const correctionRecord = returnedSubmission.assessmentData?.correctionRecord;
    const versions = returnedSubmission.documents.map(doc => getDocumentVersions(doc));

    return (
      <Dialog open={isReturnedModalOpen} onOpenChange={setIsReturnedModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {resubmitMode ? 'Resubmit Corrected Submission' : 'Submission Returned for Corrections'}
            </DialogTitle>
            <DialogDescription>
              {returnedSubmission.id} - {returnedSubmission.candidateName}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Correction Details</TabsTrigger>
              <TabsTrigger value="documents">Documents & Versions</TabsTrigger>
              <TabsTrigger value="history">Correction History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Error Information */}
              {correctionRecord && (
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">Error Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Error Type</p>
                      <Badge variant={
                        correctionRecord.errorType === 'integration_failure' ? 'destructive' :
                        correctionRecord.errorType === 'missing_documentation' ? 'secondary' :
                        'outline'
                      }>
                        {correctionRecord.errorType.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Origin</p>
                      <Badge variant="outline">{correctionRecord.origin}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Version</p>
                      <Badge variant="outline">v{correctionRecord.version}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant={
                        correctionRecord.currentStatus === 'active' ? 'default' :
                        correctionRecord.currentStatus === 'pending_review' ? 'secondary' :
                        correctionRecord.currentStatus === 'resolved' ? 'outline' :
                        'destructive'
                      }>
                        {correctionRecord.currentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Return Reason */}
              {returnedSubmission.assessmentData?.returnReason && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Return Reason</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        {returnedSubmission.assessmentData.returnReason}
                      </p>
                      <p className="text-xs text-amber-600 mt-2">
                        Returned by: {returnedSubmission.assessmentData.returnedBy || 'Unknown'} on{' '}
                        {returnedSubmission.assessmentData.returnedAt 
                          ? new Date(returnedSubmission.assessmentData.returnedAt).toLocaleDateString() 
                          : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Integration Error Log */}
              {correctionRecord?.integrationErrorLog && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-red-800">Integration Error Log</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-red-600">System</p>
                      <p className="font-medium">{correctionRecord.integrationErrorLog.system}</p>
                    </div>
                    <div>
                      <p className="text-xs text-red-600">Error Time</p>
                      <p className="font-medium">
                        {new Date(correctionRecord.integrationErrorLog.errorTimestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-red-600">Error Message</p>
                      <p className="text-sm mt-1">{correctionRecord.integrationErrorLog.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Correction Notes Form - Show only when resubmit mode is active */}
              {!resubmitMode && (
                <div className="flex justify-end">
                  <Button onClick={() => setResubmitMode(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Resubmit for Review
                  </Button>
                </div>
              )}

              {resubmitMode && (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium">Correction Notes</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>What was corrected? <span className="text-red-500">*</span></Label>
                      <Textarea
                        value={correctionNotes.whatWasCorrected}
                        onChange={(e) => setCorrectionNotes({...correctionNotes, whatWasCorrected: e.target.value})}
                        placeholder="Describe what changes were made..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Reason for change <span className="text-red-500">*</span></Label>
                      <Textarea
                        value={correctionNotes.reasonForChange}
                        onChange={(e) => setCorrectionNotes({...correctionNotes, reasonForChange: e.target.value})}
                        placeholder="Explain why these changes were necessary..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 mt-4">
              <h4 className="font-medium">Document Versions</h4>
              <div className="space-y-4">
                {returnedSubmission.documents.map((doc) => {
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
                            <p className="text-xs text-muted-foreground">
                              Current Version: v{versions.length}
                            </p>
                          </div>
                        </div>
                        {latestVersion.verified ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700">
                            <AlertCircle className="h-3 w-3 mr-1" /> Needs Correction
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

                      {/* Upload New Version - Only when resubmit mode is active */}
                      {resubmitMode && needsCorrection && (
                        <div className="ml-8 mt-2">
                          <Label className="text-xs">Upload corrected version</Label>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.png"
                            className="mt-1 h-8 text-sm w-full"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const fileUrl = URL.createObjectURL(file);
                                setUpdatedFiles(prev => ({
                                  ...prev,
                                  [doc.type]: {
                                    file: fileUrl,
                                    version: versions.length + 1
                                  }
                                }));
                              }
                            }}
                          />
                          {updatedFiles[doc.type] && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Ready to upload v{updatedFiles[doc.type]?.version}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              <h4 className="font-medium">Correction History</h4>
              <div className="space-y-4">
                {correctionRecord?.correctionNotes?.map((note) => (
                  <div key={note.id} className="border-l-2 border-blue-500 pl-4 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">v{note.version}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.correctedAt).toLocaleString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {note.correctedBy}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">What was corrected:</span> {note.whatWasCorrected}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {note.reasonForChange}
                      </p>
                    </div>
                  </div>
                ))}
                {(!correctionRecord?.correctionNotes || correctionRecord.correctionNotes.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No correction history available
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 border-t mt-4">
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setIsReturnedModalOpen(false)}>
                Close
              </Button>
              {resubmitMode ? (
                <Button onClick={handleResubmitCorrection}>
                  <Upload className="h-4 w-4 mr-2" />
                  Resubmit for Review (v{(correctionRecord?.version || 0) + 1})
                </Button>
              ) : (
                <Button onClick={() => setResubmitMode(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Resubmit for Review
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDocumentUploads = () => {
    const requirements = getDocumentRequirements();
    
    return (
      <div className="border-t pt-4 space-y-4">
        <h4 className="font-medium text-lg mb-2">Required Documents</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requirements.map((doc) => (
            <div
              key={doc.type}
              className="flex flex-col p-4 border rounded-lg bg-card shadow-sm space-y-2"
            >
              <Label className="font-medium">
                {doc.label}
                {doc.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.png"
                className="cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(doc.type, file);
                  }
                }}
              />
              {selectedDocs.includes(doc.type) && (
                <span className="text-sm text-green-600">✓ File selected</span>
              )}
            </div>
          ))}

          {(processType === 'reissue' || processType === 'replace') && (
            <div className="col-span-full">
              <Label className="font-medium mb-2 block">
                Affidavit OR Original Certificate <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col p-4 border rounded-lg bg-card shadow-sm space-y-2">
                  <Label>Affidavit (if lost)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    className="cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setHasAffidavitOrOriginal('affidavit');
                        handleFileUpload('affidavit' as DocumentType, e.target.files[0]);
                      }
                    }}
                  />
                  {hasAffidavitOrOriginal === 'affidavit' && (
                    <span className="text-sm text-green-600">✓ File selected</span>
                  )}
                </div>

                <div className="flex-1 flex flex-col p-4 border rounded-lg bg-card shadow-sm space-y-2">
                  <Label>Original Certificate (if correction/damaged)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    className="cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setHasAffidavitOrOriginal('original_certificate');
                        handleFileUpload('original_certificate' as DocumentType, e.target.files[0]);
                      }
                    }}
                  />
                  {hasAffidavitOrOriginal === 'original_certificate' && (
                    <span className="text-sm text-green-600">✓ File selected</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const mySubmissions = profileSubmissions.filter(sub => sub.createdBy === currentRole);
  const availableProcessTypes = getAvailableProcessTypes();
  const availablePathways = getAvailablePathways();

  // If no process types available, show permission denied message
  if (availableProcessTypes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center text-muted-foreground">
            <p>Your role ({currentRole}) does not have permission to create submissions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Profile Submission</CardTitle>
          <div className="text-sm text-muted-foreground mt-1 p-2 bg-yellow-100 rounded">
            Debug: Currently logged in as <strong>{currentRole}</strong>
            {currentProfile && (
              <span> - {currentProfile.companyName} ({currentProfile.companyType})</span>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Process Type */}
            <div className="space-y-2">
              <Label>Process Type</Label>
              <Select 
                value={processType} 
                onValueChange={v => setProcessType(v as ProcessType)}
              >
                <SelectTrigger className="bg-card w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableProcessTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'reissue' ? 'Re-Issue' : 
                       type === 'replace' ? 'Replace' : 'Issue'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Candidate Name</Label>
                <Input 
                  value={formData.candidateName} 
                  onChange={e => setFormData({ ...formData, candidateName: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Certificate Type</Label>
                {availablePathways.length > 0 ? (
                  <Select 
                    value={pathway} 
                    onValueChange={v => {
                      setPathway(v as Pathway);
                      setFormData({ ...formData, certificateType: v });
                    }}
                    required
                  >
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Select certificate type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePathways.map(p => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    value="No certificate types available" 
                    disabled 
                    className="bg-muted"
                  />
                )}
              </div>
            </div>

            {/* Submission Source - Display only, not editable */}
            <div className="space-y-2">
              <Label>Submission Source</Label>
              <Input 
                value={getSubmissionSourceDisplay()} 
                disabled 
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Automatically set from your profile: {currentProfile?.companyName || currentRole}
              </p>
            </div>

            {/* Re-Issue Specific Fields */}
            {processType === 'reissue' && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Re-Issue Reason</Label>
                    <Select value={reissueReason} onValueChange={v => setReissueReason(v as ReissueReason)}>
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lost">Lost Certificate</SelectItem>
                        <SelectItem value="damaged">Damaged Certificate</SelectItem>
                        <SelectItem value="administrative_error">Administrative Error (Name / ID / DOB)</SelectItem>
                        <SelectItem value="printing_error">Printing Error (Post-Release)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Original Certificate Number</Label>
                  <Input 
                    value={originalCertificateNumber} 
                    onChange={e => setOriginalCertificateNumber(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            )}

            {/* Replace Specific Fields */}
            {processType === 'replace' && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Original Certificate Number</Label>
                  <Input 
                    value={originalCertificateNumber} 
                    onChange={e => setOriginalCertificateNumber(e.target.value)} 
                    required 
                    placeholder="Enter original certificate number"
                  />
                </div>
              </div>
            )}

            {/* Document Uploads */}
            {availablePathways.length > 0 && renderDocumentUploads()}

            <Button type="submit">
              Create {processType === 'reissue' ? 'Re-Issue' : processType === 'replace' ? 'Replace' : 'Issue'} Submission
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Submission History Table */}
      {mySubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Candidate Name</TableHead>
                  <TableHead>Certificate Type</TableHead>
                  <TableHead>Process Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Documents</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mySubmissions.map(sub => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                    <TableCell>{sub.candidateName}</TableCell>
                    <TableCell className="capitalize">{sub.pathway || sub.certificateType}</TableCell>
                    <TableCell className="capitalize">
                      {sub.processType === 'reissue' ? 'Re-Issue' : 
                       sub.processType === 'replace' ? 'Replace' : 'Issue'}
                    </TableCell>
                    <TableCell>{sub.sourceDisplay || sub.source || '-'}</TableCell>
                    <TableCell>{sub.dateSubmitted ? new Date(sub.dateSubmitted).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            sub.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                            sub.status === 'pending_correction' ? 'bg-amber-100 text-amber-800' :
                            sub.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            sub.status === 'submitted' ? 'bg-purple-100 text-purple-800' :
                            sub.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {sub.status === 'pending_correction' ? 'Returned' : 
                           sub.status === 'approved' ? 'Approved' : 
                           sub.status === 'submitted' ? 'Under Review' :
                           sub.status.replace('_', ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDocuments(sub)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View documents</span>
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      {sub.status === 'pending_correction' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReturnedSubmission(sub)}
                          className="h-8 px-2 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View & Resubmit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Modal */}
      {renderDocumentViewer()}
      
      {/* Returned Submission Viewer Modal */}
      {renderReturnedSubmissionViewer()}
    </div>
  );
}