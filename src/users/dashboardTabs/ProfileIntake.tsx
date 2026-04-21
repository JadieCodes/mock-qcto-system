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
import { CerExternalRoleSelector } from '@/components/CerExternalRoleSelector';
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
  CERT_ADMIN: 'Certification Practitioner' as AppRole,
  ASSESSMENT_UNIT: 'Assessment Unit' as AppRole,
  NAMB: 'NAMB' as AppRole,
  QP: 'QP' as AppRole,
  SDP: 'SDP' as AppRole,
} as const;

interface PreIntakeCheck {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'passed' | 'failed';
  message?: string;
}

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

const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [preIntakeValidationStatus, setPreIntakeValidationStatus] = useState<'idle' | 'processing' | 'passed' | 'failed'>('idle');
const [preIntakeValidationError, setPreIntakeValidationError] = useState('');
const [preIntakeChecks, setPreIntakeChecks] = useState<PreIntakeCheck[]>([]);
const [preIntakeProgress, setPreIntakeProgress] = useState(0);
const [preIntakeTestMode, setPreIntakeTestMode] = useState<'pass' | 'fail'>('pass');
const [preIntakeValidationSummary, setPreIntakeValidationSummary] = useState<{
  totalLearners: number;
  passedLearners: number;
  failedLearners: number;
  failedRows?: Array<{ learnerIdentifier: string; reason: string }>;
} | null>(null);
 
useEffect(() => {
  resetPreIntakeValidation();
}, [processType, pathway]);
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
  const storedRole = localStorage.getItem('currentUserRole') as AppRole | null;

  if (storedRole) {
    setCurrentRole(storedRole);
    return;
  }

  if (currentProfile?.role) {
    const profileRole = currentProfile.role as AppRole;
    setCurrentRole(profileRole);
    localStorage.setItem('currentUserRole', profileRole);
  }
}, [currentProfile, setCurrentRole]);





  // Get document versions


  // Check if user can create submission based on process type and pathway
  const canCreateSubmission = (): { allowed: boolean; message?: string } => {
    // ISSUE: ONLY Assessment Unit can create (Cert Admin also allowed for testing)
 if (processType === 'issue') {
  // Assessment Unit -> Occupational + Skills
  if (currentRole === ROLES.ASSESSMENT_UNIT) {
    if (pathway === 'occupational' || pathway === 'skills') {
      return { allowed: true };
    }
    return {
      allowed: false,
      message: 'Assessment Unit can only create Issue submissions for Occupational or Skills certificates'
    };
  }

  // NAMB -> Legacy
  if (currentRole === ROLES.NAMB) {
    if (pathway === 'legacy') {
      return { allowed: true };
    }
    return {
      allowed: false,
      message: 'NAMB can only create Issue submissions for Legacy certificates'
    };
  }

  // Optional admin/testing access
  if (currentRole === ROLES.CERT_ADMIN) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: 'Your role cannot create this Issue submission'
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
      if (companyType === 'Certification Practitioner') {
        return 'SDP';
      }
    }

    // Fallback to role-based mapping
    if (currentRole === 'NAMB') return 'NAMB';
    if (currentRole === 'QP') return 'QP';
    if (currentRole === 'SDP') return 'SDP';
    if (currentRole === 'Assessment Unit') return 'QP';
    if (currentRole === 'Certification Practitioner') return 'SDP';
    
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
      case 'Certification Practitioner':
        return 'SDP (Certification Practitioner)';
      default:
        return source;
    }
  };

  // Filter process types based on user role
const getAvailableProcessTypes = (): ProcessType[] => {
  if (currentRole === ROLES.CERT_ADMIN) {
    return ['issue', 'reissue', 'replace'];
  }

  if (currentRole === ROLES.ASSESSMENT_UNIT) {
    return ['issue', 'reissue', 'replace'];
  }

  if (currentRole === ROLES.QP) {
    return ['reissue', 'replace'];
  }

  if (currentRole === ROLES.SDP) {
    return ['reissue', 'replace'];
  }

  if (currentRole === ROLES.NAMB) {
    return ['issue', 'reissue', 'replace'];
  }

  return [];
};

  // Filter available certificate types based on user role and process type
const getAvailablePathways = (): Pathway[] => {
  if (processType === 'issue') {
    if (currentRole === ROLES.ASSESSMENT_UNIT) {
      return ['occupational', 'skills'];
    }

    if (currentRole === ROLES.NAMB) {
      return ['legacy'];
    }

    if (currentRole === ROLES.CERT_ADMIN) {
      return ['occupational', 'skills', 'legacy'];
    }

    return [];
  }

  if (processType === 'reissue') {
    if (currentRole === ROLES.CERT_ADMIN) {
      return ['occupational', 'skills', 'legacy'];
    }

    if (
      currentRole === ROLES.ASSESSMENT_UNIT ||
      currentRole === ROLES.QP ||
      currentRole === ROLES.SDP
    ) {
      return ['occupational', 'skills'];
    }

    if (currentRole === ROLES.NAMB) {
      return ['legacy'];
    }
  }

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
          { type: 'file_3_4', label: 'File 3 to 4', required: true }
        );
        break;

      case 'skills':
        docs.push(
          { type: 'recommendation_letter', label: 'Recommendation Letter', required: true },
          { type: 'approval_letter', label: 'Approval Letter', required: true },
          { type: 'file_3_4', label: 'File 3 to 4', required: true }
        );
        break;

      case 'legacy':
        docs.push(
          { type: 'recommendation_letter', label: 'Recommendation Letter', required: true },
          { type: 'approval_letter', label: 'Approval Letter', required: true },
          { type: 'file_3_4', label: 'File 3 to 4', required: true }
        );
        break;
    }
  } else if (processType === 'reissue') {
    docs.push(
      { type: 'application_form', label: 'Application Form', required: true },
      { type: 'proof_of_payment', label: 'Proof of Payment', required: true },
      { type: 'id_copy', label: 'ID Copy', required: true }
    );

    // Historical Verification removed
    // Affidavit / Original Certificate handled separately in the upload section
  } else if (processType === 'replace') {
    docs.push(
      { type: 'id_copy', label: 'ID Copy', required: true }
    );

    switch (pathway) {
      case 'occupational':
        docs.push(
          { type: 'application_form', label: 'Application Form', required: true },
          { type: 'approval_letter', label: 'Approval Letter', required: true }
        );
        break;

      case 'skills':
        docs.push(
          { type: 'recommendation_letter', label: 'Recommendation Letter', required: true },
          { type: 'approval_letter', label: 'Approval Letter', required: true },
          { type: 'replace_application_form', label: 'Replace Application Form', required: true }
        );
        break;

      case 'legacy':
        docs.push(
          { type: 'recommendation_letter', label: 'Recommendation Letter', required: true },
          { type: 'approval_letter', label: 'Approval Letter', required: true },
          { type: 'replace_application_form', label: 'Replace Application Form', required: true }
        );
        break;
    }
  }

  return docs;
};

const needsExternalFile34Validation = () => {
  return processType === 'issue' && selectedDocs.includes('file_3_4');
};

const initializePreIntakeChecks = () => {
  const checks: PreIntakeCheck[] = [
    {
      id: 'connection',
      label: 'Connecting to CVS...',
      status: 'pending',
    },
    {
      id: 'bio_data',
      label: 'Checking learner bio data in File 3 to 4...',
      status: 'pending',
    },
    {
      id: 'qualification',
      label: 'Checking qualification code against CVS rules...',
      status: 'pending',
    },
  ];

  setPreIntakeChecks(checks);
  return checks;
};

const runPreIntakeValidation = async () => {
  const checks = initializePreIntakeChecks();
  const updatedChecks = [...checks];
  const shouldPass = preIntakeTestMode === 'pass';

  setPreIntakeValidationStatus('processing');
  setPreIntakeValidationError('');
  setPreIntakeProgress(0);
  setPreIntakeValidationSummary(null);

  // Demo learner counts for File 3 to 4
  const totalLearners = 25;

  // Check 1
  updatedChecks[0].status = 'processing';
  setPreIntakeChecks([...updatedChecks]);
  await new Promise((resolve) => setTimeout(resolve, 700));
  setPreIntakeProgress(30);

  if (!shouldPass) {
    updatedChecks[0].status = 'failed';
    updatedChecks[0].message = 'CVS connection timed out';
    setPreIntakeChecks([...updatedChecks]);
    setPreIntakeValidationStatus('failed');
    setPreIntakeValidationError('Could not connect to CVS. Please retry or correct the file before submitting.');
    setPreIntakeValidationSummary({
      totalLearners,
      passedLearners: 0,
      failedLearners: totalLearners,
      failedRows: [
        { learnerIdentifier: 'ALL_ROWS', reason: 'CVS connection failed before learner validation could complete' }
      ]
    });
    return false;
  }

  updatedChecks[0].status = 'passed';
  setPreIntakeChecks([...updatedChecks]);

  // Check 2
  updatedChecks[1].status = 'processing';
  setPreIntakeChecks([...updatedChecks]);
  await new Promise((resolve) => setTimeout(resolve, 900));
  setPreIntakeProgress(65);

  if (!shouldPass) {
    updatedChecks[1].status = 'failed';
    updatedChecks[1].message = 'Learner ID / bio data mismatch in File 3 to 4';
    setPreIntakeChecks([...updatedChecks]);
    setPreIntakeValidationStatus('failed');
    setPreIntakeValidationError('Bio data mismatch found in File 3 to 4. Please correct learner details before submitting.');

    setPreIntakeValidationSummary({
      totalLearners,
      passedLearners: 18,
      failedLearners: 7,
      failedRows: [
        { learnerIdentifier: 'ROW 3', reason: 'ID number mismatch' },
        { learnerIdentifier: 'ROW 7', reason: 'Date of birth mismatch' },
        { learnerIdentifier: 'ROW 11', reason: 'Missing surname' },
        { learnerIdentifier: 'ROW 14', reason: 'Invalid learner number' },
        { learnerIdentifier: 'ROW 18', reason: 'ID number mismatch' },
        { learnerIdentifier: 'ROW 20', reason: 'Missing initials' },
        { learnerIdentifier: 'ROW 24', reason: 'Bio data incomplete' },
      ]
    });

    return false;
  }

  updatedChecks[1].status = 'passed';
  setPreIntakeChecks([...updatedChecks]);

  // Check 3
  updatedChecks[2].status = 'processing';
  setPreIntakeChecks([...updatedChecks]);
  await new Promise((resolve) => setTimeout(resolve, 900));
  setPreIntakeProgress(100);

  if (!shouldPass) {
    updatedChecks[2].status = 'failed';
    updatedChecks[2].message = 'Qualification code in File 3 to 4 does not match CVS validation rules';
    setPreIntakeChecks([...updatedChecks]);
    setPreIntakeValidationStatus('failed');
    setPreIntakeValidationError('Qualification code validation failed for File 3 to 4.');

    setPreIntakeValidationSummary({
      totalLearners,
      passedLearners: 20,
      failedLearners: 5,
      failedRows: [
        { learnerIdentifier: 'ROW 2', reason: 'Qualification code invalid' },
        { learnerIdentifier: 'ROW 8', reason: 'Qualification code missing' },
        { learnerIdentifier: 'ROW 10', reason: 'Qualification mismatch' },
        { learnerIdentifier: 'ROW 17', reason: 'Qualification mismatch' },
        { learnerIdentifier: 'ROW 23', reason: 'Invalid programme mapping' },
      ]
    });

    return false;
  }

  updatedChecks[2].status = 'passed';
  setPreIntakeChecks([...updatedChecks]);
  setPreIntakeValidationStatus('passed');

  setPreIntakeValidationSummary({
    totalLearners,
    passedLearners: totalLearners,
    failedLearners: 0,
    failedRows: []
  });

  return true;
};

const getPreIntakeValidationStats = () => {
  const totalChecks = preIntakeChecks.length;
  const passedChecks = preIntakeChecks.filter((c) => c.status === 'passed').length;
  const failedChecks = preIntakeChecks.filter((c) => c.status === 'failed').length;

  return {
    totalChecks,
    passedChecks,
    failedChecks,
  };
};


const resetPreIntakeValidation = () => {
  setPreIntakeValidationStatus('idle');
  setPreIntakeValidationError('');
  setPreIntakeChecks([]);
  setPreIntakeProgress(0);
  setPreIntakeValidationSummary(null);
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
    if (needsExternalFile34Validation()) {
  if (preIntakeValidationStatus !== 'passed') {
    toast({
      title: 'Validation Required',
      description: 'File 3 to 4 must pass CVS validation before submission to Intake.',
      variant: 'destructive',
    });
    return false;
  }
}
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
  } : null,

  preIntakeValidationSummary: needsExternalFile34Validation()
  ? preIntakeValidationSummary || undefined
  : undefined,
  preIntakeValidationStatus: needsExternalFile34Validation()
    ? (preIntakeValidationStatus === 'passed' ? 'passed' : 'failed')
    : 'not_started',
  preIntakeValidationAt: needsExternalFile34Validation()
    ? new Date().toISOString()
    : undefined,
  preIntakeValidatedBy: needsExternalFile34Validation()
    ? currentRole
    : undefined,
  preIntakeValidationError: preIntakeValidationStatus === 'failed'
    ? preIntakeValidationError
    : undefined,
  preIntakeSystemChecks: needsExternalFile34Validation()
    ? preIntakeChecks.map((check) => ({
        name: check.label,
        passed: check.status === 'passed',
        error: check.message
      }))
    : undefined,
  preIntakeValidationStats: needsExternalFile34Validation()
    ? getPreIntakeValidationStats()
    : undefined,
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
    file_3_4: 'File 3 to 4',

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

const handleViewSubmission = (submission: Submission) => {
  setSelectedSubmission(submission);
  setActiveTab('details');
  setIsDocumentModalOpen(true);
};

  const preValidationPassedCount = profileSubmissions.filter(
  (sub) => sub.assessmentData?.preIntakeValidationStatus === 'passed'
).length;

const preValidationFailedCount = profileSubmissions.filter(
  (sub) => sub.assessmentData?.preIntakeValidationStatus === 'failed'
).length;

const preValidationCheckedCount = profileSubmissions.filter(
  (sub) =>
    sub.assessmentData?.preIntakeValidationStatus === 'passed' ||
    sub.assessmentData?.preIntakeValidationStatus === 'failed'
).length;

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
              {selectedSubmission?.assessmentData?.preIntakeValidationStatus && (
  <div className="bg-muted p-3 rounded-lg">
    <p className="text-sm font-medium">CVS Pre-Validation</p>
    <div className="mt-2 flex items-center gap-2">
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
          {new Date(selectedSubmission.assessmentData.preIntakeValidationAt).toLocaleString()}
        </span>
      )}
    </div>

    {selectedSubmission.assessmentData.preIntakeValidationError && (
      <p className="text-sm text-red-600 mt-2">
        {selectedSubmission.assessmentData.preIntakeValidationError}
      </p>
    )}
  </div>
)}
{selectedSubmission?.assessmentData?.preIntakeValidationSummary && (
  <div className="bg-muted p-3 rounded-lg">
    <p className="text-sm font-medium">File 3 to 4 Learner Summary</p>

    <div className="grid grid-cols-3 gap-3 mt-2 text-sm">
      <div>
        <p className="text-muted-foreground text-xs">Total Learners</p>
        <p className="font-medium">
          {selectedSubmission.assessmentData.preIntakeValidationSummary.totalLearners}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Passed</p>
        <p className="font-medium text-green-600">
          {selectedSubmission.assessmentData.preIntakeValidationSummary.passedLearners}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Failed</p>
        <p className="font-medium text-red-600">
          {selectedSubmission.assessmentData.preIntakeValidationSummary.failedLearners}
        </p>
      </div>
    </div>
  </div>
)}

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
          {selectedSubmission.assessmentData?.returnReason && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
      <div>
        <h4 className="font-medium text-amber-800">Return Information</h4>
        <p className="text-sm text-amber-700 mt-1">
          {selectedSubmission.assessmentData.returnReason}
        </p>

        <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
          <div>
            <p className="text-xs text-amber-700">Returned By</p>
            <p className="font-medium text-amber-900">
              {selectedSubmission.assessmentData.returnedBy || '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-amber-700">Returned On</p>
            <p className="font-medium text-amber-900">
              {selectedSubmission.assessmentData.returnedAt
                ? new Date(selectedSubmission.assessmentData.returnedAt).toLocaleDateString()
                : '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-amber-700">To Do By</p>
            <p className="font-medium text-amber-900">
              {selectedSubmission.assessmentData.correctionRecord?.todoDate
                ? new Date(selectedSubmission.assessmentData.correctionRecord.todoDate).toLocaleDateString()
                : '-'}
            </p>
          </div>

          <div>
            <p className="text-xs text-amber-700">Error Type</p>
            <p className="font-medium text-amber-900 capitalize">
              {selectedSubmission.assessmentData.correctionRecord?.errorType?.replace(/_/g, ' ') || '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
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
        {needsExternalFile34Validation() && (
  <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 space-y-4">
    <div>
      <h4 className="font-medium text-blue-900">CVS Pre-Validation for File 3 to 4</h4>
      <p className="text-sm text-blue-700">
        This validation must pass before the submission can go to Internal Intake.
      </p>
    </div>

    <div className="flex gap-2">
    <Button
  type="button"
  variant={preIntakeTestMode === 'pass' ? 'default' : 'outline'}
  onClick={() => setPreIntakeTestMode('pass')}
>
  Force Pass
</Button>
<Button
  type="button"
  variant={preIntakeTestMode === 'fail' ? 'destructive' : 'outline'}
  onClick={() => setPreIntakeTestMode('fail')}
>
  Force Fail
</Button>
    </div>

    {preIntakeValidationStatus === 'processing' && (
      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${preIntakeProgress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{preIntakeProgress}% complete</p>
      </div>
    )}

    {preIntakeChecks.length > 0 && (
      <div className="space-y-2">
        {preIntakeChecks.map((check) => (
          <div key={check.id} className="flex items-start gap-2 text-sm">
            <span>
              {check.status === 'passed' && '✅'}
              {check.status === 'failed' && '❌'}
              {check.status === 'processing' && '⏳'}
              {check.status === 'pending' && '•'}
            </span>
            <div>
              <p>{check.label}</p>
              {check.message && (
                <p className="text-xs text-red-600">{check.message}</p>
              )}
            </div>
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
        <p className="text-sm font-medium text-green-800">Validation Passed</p>
        <p className="text-sm text-green-700 mt-1">
          File 3 to 4 passed CVS pre-validation and can now be submitted to Intake.
        </p>
        <p className="text-xs text-green-700 mt-2">
          Passed: {getPreIntakeValidationStats().passedChecks} / {getPreIntakeValidationStats().totalChecks}
        </p>
      </div>
    )}
{preIntakeValidationSummary && (
  <div className="rounded-lg border bg-white p-3 space-y-2">
    <p className="text-sm font-medium">File 3 to 4 Learner Validation Summary</p>

    <div className="grid grid-cols-3 gap-3 text-sm">
      <div className="rounded border p-2">
        <p className="text-muted-foreground text-xs">Total Learners</p>
        <p className="font-semibold">{preIntakeValidationSummary.totalLearners}</p>
      </div>
      <div className="rounded border p-2">
        <p className="text-muted-foreground text-xs">Passed</p>
        <p className="font-semibold text-green-600">{preIntakeValidationSummary.passedLearners}</p>
      </div>
      <div className="rounded border p-2">
        <p className="text-muted-foreground text-xs">Failed</p>
        <p className="font-semibold text-red-600">{preIntakeValidationSummary.failedLearners}</p>
      </div>
    </div>

    {preIntakeValidationSummary.failedRows && preIntakeValidationSummary.failedRows.length > 0 && (
      <div className="pt-2">
        <p className="text-xs font-medium text-muted-foreground mb-2">Failed Learners / Rows</p>
        <div className="space-y-1">
          {preIntakeValidationSummary.failedRows.map((row, idx) => (
            <div key={idx} className="text-xs rounded border border-red-200 bg-red-50 p-2">
              <span className="font-medium">{row.learnerIdentifier}:</span> {row.reason}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}
    <div className="flex gap-2">
   <Button type="button" onClick={runPreIntakeValidation}>
  Run CVS Validation
</Button>

<Button type="button" variant="outline" onClick={resetPreIntakeValidation}>
  Reset Validation
</Button>
    </div>
  </div>
)}
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
  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
    <div>
      <CardTitle>Create Profile Submission</CardTitle>
      <div className="text-sm text-muted-foreground mt-1 p-2 bg-yellow-100 rounded">
        Debug: Currently logged in as <strong>{currentRole}</strong>
        {currentProfile && (
          <span> - {currentProfile.companyName} ({currentProfile.companyType})</span>
        )}
      </div>
    </div>

    <CerExternalRoleSelector />
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
{/* Pre-Validation Stats */}
<div className="grid gap-4 md:grid-cols-3">
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Pre-Check Passed</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-green-600">{preValidationPassedCount}</div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Pre-Check Failed</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-red-600">{preValidationFailedCount}</div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">Total Checked</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-blue-600">{preValidationCheckedCount}</div>
    </CardContent>
  </Card>
</div>
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
    variant="outline"
    size="sm"
    onClick={() => handleViewSubmission(sub)}
    className="h-8 px-2 text-xs"
  >
    <Eye className="h-3 w-3 mr-1" />
    View
  </Button>
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
      
    
    </div>
  );
}