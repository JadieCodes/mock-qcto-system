import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  SubmissionStatus,
} from '@/types';

// ─── Role constants ───────────────────────────────────────────────────────────
const ROLES = {
  CERT_ADMIN: 'Certification Practitioner' as AppRole,
  ASSESSMENT_UNIT: 'Assessment Unit' as AppRole,
  NAMB: 'NAMB' as AppRole,
  QP: 'QP' as AppRole,
  SDP: 'SDP' as AppRole,
  LEARNER: 'Learner' as AppRole,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single step inside a document's CVS validation run */
interface CVSCheck {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'passed' | 'failed';
  message?: string;
}

/** Validation state + result for one document */
interface DocumentValidationState {
  status: 'idle' | 'processing' | 'passed' | 'failed';
  checks: CVSCheck[];
  progress: number;
  error: string;
  summary: {
    totalLearners: number;
    passedLearners: number;
    failedLearners: number;
    failedRows?: Array<{ learnerIdentifier: string; reason: string }>;
  } | null;
}

// ─── Per-document CVS check definitions ──────────────────────────────────────

/**
 * Returns the list of CVS checks that should run for a given document type.
 * Each check object starts with status 'pending'; the runner updates them live.
 */
const getChecksForDocumentType = (docType: DocumentType): Omit<CVSCheck, 'status'>[] => {
  switch (docType) {
    case 'file_3_4':
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'bio_data', label: 'Checking learner bio data in File 3 to 4...' },
        { id: 'qualification', label: 'Checking qualification code against CVS rules...' },
      ];
    case 'recommendation_letter':
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'recommender_authority', label: 'Verifying recommender authority in CVS...' },
        { id: 'learner_match', label: 'Matching learner details against CVS records...' },
      ];
    case 'approval_letter':
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'approval_code', label: 'Validating approval code against CVS...' },
        { id: 'issuing_body', label: 'Verifying issuing body registration...' },
      ];
    case 'id_copy':
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'id_format', label: 'Validating ID number format...' },
        { id: 'identity_match', label: 'Matching identity against CVS learner records...' },
      ];
    case 'application_form':
    case 'reissue_application_form':
    case 'replace_application_form':
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'form_completeness', label: 'Checking form completeness...' },
        { id: 'signature', label: 'Verifying required signatures present...' },
      ];
    case 'proof_of_payment':
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'payment_ref', label: 'Validating payment reference number...' },
        { id: 'amount', label: 'Verifying payment amount matches fee schedule...' },
      ];
    case 'programme_approval_letter':
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'programme_code', label: 'Validating programme code in CVS...' },
        { id: 'approval_status', label: 'Checking programme approval status...' },
      ];
    case 'learner_result_approval_sheet':
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'result_data', label: 'Verifying learner result data against CVS...' },
        { id: 'assessor_reg', label: 'Checking assessor registration...' },
      ];
    case 'affidavit':
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'affidavit_format', label: 'Checking affidavit format and commissioner signature...' },
        { id: 'learner_match', label: 'Matching affidavit learner details against CVS...' },
      ];
    case 'original_certificate':
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'cert_number', label: 'Validating original certificate number in CVS...' },
        { id: 'cert_status', label: 'Checking certificate status and validity...' },
      ];
    default:
      return [
        { id: 'connection', label: 'Connecting to CVS...' },
        { id: 'doc_registered', label: 'Checking document is registered in CVS...' },
        { id: 'data_match', label: 'Verifying document data matches CVS records...' },
      ];
  }
};

/** Returns demo failed-row data for documents that contain learner lists */
const getDemoFailedRows = (docType: DocumentType, shouldPass: boolean) => {
  if (shouldPass) return [];
  if (docType === 'file_3_4' || docType === 'learner_result_approval_sheet') {
    return [
      { learnerIdentifier: 'ROW 3', reason: 'ID number mismatch' },
      { learnerIdentifier: 'ROW 7', reason: 'Date of birth mismatch' },
      { learnerIdentifier: 'ROW 11', reason: 'Missing surname' },
    ];
  }
  return [];
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileIntake() {
  const { addProfileSubmission, currentRole, profileSubmissions, setCurrentRole, updateSubmission, addSdpInvoice } = useApp();
  const { toast } = useToast();

  const [processType, setProcessType] = useState<ProcessType>('issue');
  const [formData, setFormData] = useState({ candidateName: '', certificateType: '' });
  const [pathway, setPathway] = useState<Pathway>('occupational');
  const [reissueReason, setReissueReason] = useState<ReissueReason>('lost');
  const [originalCertificateNumber, setOriginalCertificateNumber] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<DocumentType[]>([]);
  const [hasAffidavitOrOriginal, setHasAffidavitOrOriginal] = useState<'affidavit' | 'original_certificate' | ''>('');
  const [uploadedFiles, setUploadedFiles] = useState<{ [key in DocumentType]?: string }>({});

  // Document viewer state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');

  const [currentProfile, setCurrentProfile] = useState<any>(null);

  // ── Per-document CVS validation state ──
  // Key = DocumentType, value = validation state for that document
  const [documentValidations, setDocumentValidations] = useState<Record<string, DocumentValidationState>>({});
  // Shared test-mode toggle (pass / fail) — applies to all validations
  const [cvsTestMode, setCvsTestMode] = useState<'pass' | 'fail'>('pass');

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    resetAllValidations();
  }, [processType, pathway]);

  useEffect(() => {
    const storedProfile = localStorage.getItem('currentProfile');
    const storedRole = localStorage.getItem('currentUserRole') as AppRole | null;
    if (storedProfile) {
      try { setCurrentProfile(JSON.parse(storedProfile)); } catch {}
    }
    if (storedRole) setCurrentRole(storedRole);
  }, []);

  useEffect(() => {
    const storedRole = localStorage.getItem('currentUserRole') as AppRole | null;
    if (storedRole) { setCurrentRole(storedRole); return; }
    if (currentProfile?.role) {
      const profileRole = currentProfile.role as AppRole;
      setCurrentRole(profileRole);
      localStorage.setItem('currentUserRole', profileRole);
    }
  }, [currentProfile, setCurrentRole]);

  useEffect(() => {
    const availablePathways = getAvailablePathways();
    if (availablePathways.length > 0 && !availablePathways.includes(pathway)) {
      setPathway(availablePathways[0]);
      setFormData(prev => ({ ...prev, certificateType: availablePathways[0] }));
    }
  }, [processType, currentRole]);

  // ── Validation helpers ────────────────────────────────────────────────────

  const resetAllValidations = () => {
    setDocumentValidations({});
  };

  const resetValidationForDoc = (docType: DocumentType) => {
    setDocumentValidations(prev => {
      const next = { ...prev };
      delete next[docType];
      return next;
    });
  };

  const getDocValidation = (docType: DocumentType): DocumentValidationState => {
    return documentValidations[docType] ?? {
      status: 'idle',
      checks: [],
      progress: 0,
      error: '',
      summary: null,
    };
  };

  /**
   * Runs CVS validation for a single document type.
   * Updates `documentValidations[docType]` step-by-step for a live UI.
   */
  const runCVSValidationForDoc = async (docType: DocumentType): Promise<boolean> => {
    const shouldPass = cvsTestMode === 'pass';
    const checkDefs = getChecksForDocumentType(docType);
    const checks: CVSCheck[] = checkDefs.map(c => ({ ...c, status: 'pending' }));
    const totalLearners = (docType === 'file_3_4' || docType === 'learner_result_approval_sheet') ? 25 : 0;

    // Helper: push updated state
    const push = (overrides: Partial<DocumentValidationState>) =>
      setDocumentValidations(prev => ({
        ...prev,
        [docType]: { ...getDocValidation(docType), ...overrides },
      }));

    push({ status: 'processing', checks: [...checks], progress: 0, error: '', summary: null });

    const stepProgress = Math.floor(100 / checks.length);

    for (let i = 0; i < checks.length; i++) {
      checks[i].status = 'processing';
      push({ checks: [...checks] });
      await new Promise(r => setTimeout(r, 700 + Math.random() * 400));

      const progressNow = Math.min(100, stepProgress * (i + 1));

      // Fail on the last step when in fail mode, first step for connection failures
      const failHere = !shouldPass && (i === 0 || i === checks.length - 1);

      if (failHere) {
        checks[i].status = 'failed';
        checks[i].message = getFailureMessage(docType, checks[i].id);
        push({
          checks: [...checks],
          progress: progressNow,
          status: 'failed',
          error: getDocumentValidationError(docType, checks[i].id),
          summary: totalLearners > 0 ? {
            totalLearners,
            passedLearners: i === 0 ? 0 : Math.floor(totalLearners * 0.72),
            failedLearners: i === 0 ? totalLearners : Math.ceil(totalLearners * 0.28),
            failedRows: getDemoFailedRows(docType, false),
          } : null,
        });
        return false;
      }

      checks[i].status = 'passed';
      push({ checks: [...checks], progress: progressNow });
    }

    // All passed
    push({
      status: 'passed',
      checks: [...checks],
      progress: 100,
      error: '',
      summary: totalLearners > 0 ? {
        totalLearners,
        passedLearners: totalLearners,
        failedLearners: 0,
        failedRows: [],
      } : null,
    });
    return true;
  };

  const getFailureMessage = (docType: DocumentType, checkId: string): string => {
    const messages: Record<string, Record<string, string>> = {
      file_3_4: {
        connection: 'CVS connection timed out',
        bio_data: 'Learner ID / bio data mismatch in File 3 to 4',
        qualification: 'Qualification code does not match CVS validation rules',
      },
      recommendation_letter: {
        recommender_authority: 'Recommender is not registered as an authorised body in CVS',
        learner_match: 'Learner details on recommendation letter do not match CVS records',
      },
      approval_letter: {
        approval_code: 'Approval code is invalid or expired in CVS',
        issuing_body: 'Issuing body is not registered in CVS',
      },
      id_copy: {
        id_format: 'ID number format is invalid',
        identity_match: 'Identity details do not match CVS learner records',
      },
      proof_of_payment: {
        payment_ref: 'Payment reference not found in CVS',
        amount: 'Payment amount does not match the required fee',
      },
    };
    return (
      messages[docType]?.[checkId] ||
      messages['default']?.[checkId] ||
      `CVS check failed: ${checkId.replace(/_/g, ' ')}`
    );
  };

  const getDocumentValidationError = (docType: DocumentType, failedCheckId: string): string => {
    if (failedCheckId === 'connection') return 'Could not connect to CVS. Please retry or check your network.';
    return `CVS validation failed for ${getDocumentLabel(docType)}. Please correct the document before submitting.`;
  };

  /** All required documents have passed their CVS validation */
  const allDocumentsPassed = (): boolean => {
    const requirements = getDocumentRequirements();
    return requirements.every(req => getDocValidation(req.type).status === 'passed');
  };

  /** Returns which required docs still need validation */
  const getUnvalidatedDocs = (): DocumentType[] => {
    const requirements = getDocumentRequirements();
    return requirements
      .filter(req => selectedDocs.includes(req.type))
      .filter(req => getDocValidation(req.type).status !== 'passed')
      .map(req => req.type);
  };

  // ── Permission / role helpers (unchanged from original) ───────────────────

  const canCreateSubmission = (): { allowed: boolean; message?: string } => {
    if (processType === 'issue') {
      if (currentRole === ROLES.ASSESSMENT_UNIT) {
        if (pathway === 'occupational' || pathway === 'skills') return { allowed: true };
        return { allowed: false, message: 'Assessment Unit can only create Issue submissions for Occupational or Skills certificates' };
      }
      if (currentRole === ROLES.NAMB) {
        if (pathway === 'legacy') return { allowed: true };
        return { allowed: false, message: 'NAMB can only create Issue submissions for Legacy certificates' };
      }
      if (currentRole === ROLES.LEARNER) {
        if (pathway === 'occupational' || pathway === 'skills') return { allowed: true };
        return { allowed: false, message: 'Learner can only create Issue submissions for Occupational or Skills certificates' };
      }
      if (currentRole === ROLES.CERT_ADMIN) return { allowed: true };
      return { allowed: false, message: 'Your role cannot create this Issue submission' };
    }
    if (processType === 'reissue') {
      if (currentRole === ROLES.CERT_ADMIN) return { allowed: true };
      if (currentRole === ROLES.QP || currentRole === ROLES.SDP || currentRole === ROLES.ASSESSMENT_UNIT || currentRole === ROLES.LEARNER) {
        if (pathway === 'occupational' || pathway === 'skills') return { allowed: true };
        return { allowed: false, message: `${currentRole} can only create re-issue submissions for Occupational or Skills certificates` };
      }
      if (currentRole === ROLES.NAMB) {
        if (pathway === 'legacy') return { allowed: true };
        return { allowed: false, message: 'NAMB can only create re-issue submissions for Legacy certificates' };
      }
    }
    if (processType === 'replace') {
      const allowed = [ROLES.ASSESSMENT_UNIT, ROLES.QP, ROLES.NAMB, ROLES.SDP, ROLES.CERT_ADMIN, ROLES.LEARNER];
      if (allowed.includes(currentRole as any)) return { allowed: true };
      return { allowed: false, message: 'Your role cannot create replace submissions' };
    }
    return { allowed: false, message: 'Your role cannot create this type of submission' };
  };

  const getSubmissionSource = (): SubmissionSource => {
    if (currentProfile) {
      const t = currentProfile.companyType;
      if (t === 'NAMB' || t === 'NAMB (Legacy)') return 'NAMB';
      if (t === 'QP') return 'QP';
      if (t === 'SDP') return 'SDP';
      if (t === 'Assessment Unit') return 'QP';
      if (t === 'Certification Practitioner') return 'SDP';
    }
    if (currentRole === 'NAMB') return 'NAMB';
    if (currentRole === 'QP') return 'QP';
    if (currentRole === 'SDP') return 'SDP';
    if (currentRole === 'Assessment Unit') return 'QP';
    if (currentRole === 'Certification Practitioner') return 'SDP';
    return 'SDP';
  };

  const getSubmissionSourceDisplay = (): string => {
    const source = getSubmissionSource();
    if (currentProfile) {
      switch (source) {
        case 'NAMB': return `NAMB - ${currentProfile.companyName || 'Legacy Authority'}`;
        case 'QP': return `QP - ${currentProfile.companyName || 'Quality Partner'}`;
        case 'SDP': return `SDP - ${currentProfile.companyName || 'Skills Development Provider'}`;
      }
    }
    switch (currentRole) {
      case 'NAMB': return 'NAMB';
      case 'QP': return 'QP';
      case 'SDP': return 'SDP';
      case 'Assessment Unit': return 'QP (Assessment Unit)';
      case 'Certification Practitioner': return 'SDP (Certification Practitioner)';
    }
    return source;
  };

  const getAvailableProcessTypes = (): ProcessType[] => {
    if (currentRole === ROLES.CERT_ADMIN || currentRole === ROLES.ASSESSMENT_UNIT || currentRole === ROLES.NAMB || currentRole === ROLES.LEARNER) return ['issue', 'reissue', 'replace'];
    if (currentRole === ROLES.QP || currentRole === ROLES.SDP) return ['reissue', 'replace'];
    return [];
  };

  const getAvailablePathways = (): Pathway[] => {
    if (processType === 'issue') {
      if (currentRole === ROLES.ASSESSMENT_UNIT || currentRole === ROLES.LEARNER) return ['occupational', 'skills'];
      if (currentRole === ROLES.NAMB) return ['legacy'];
      if (currentRole === ROLES.CERT_ADMIN) return ['occupational', 'skills', 'legacy'];
      return [];
    }
    if (processType === 'reissue') {
      if (currentRole === ROLES.CERT_ADMIN) return ['occupational', 'skills', 'legacy'];
      if ([ROLES.ASSESSMENT_UNIT, ROLES.QP, ROLES.SDP, ROLES.LEARNER].includes(currentRole as any)) return ['occupational', 'skills'];
      if (currentRole === ROLES.NAMB) return ['legacy'];
    }
    if (processType === 'replace') {
      const allowed = [ROLES.ASSESSMENT_UNIT, ROLES.QP, ROLES.NAMB, ROLES.SDP, ROLES.CERT_ADMIN, ROLES.LEARNER];
      if (allowed.includes(currentRole as any)) return ['occupational', 'skills', 'legacy'];
    }
    return [];
  };

  const getDocumentRequirements = () => {
    const docs: { type: DocumentType; label: string; required: boolean }[] = [];
    if (processType === 'issue') {
      docs.push(
        { type: 'recommendation_letter', label: 'Recommendation Letter', required: true },
        { type: 'approval_letter', label: 'Approval Letter', required: true },
        { type: 'file_3_4', label: 'File 3 to 4', required: true },
      );
    } else if (processType === 'reissue') {
      docs.push(
        { type: 'application_form', label: 'Application Form', required: true },
        { type: 'proof_of_payment', label: 'Proof of Payment', required: true },
        { type: 'id_copy', label: 'ID Copy', required: true },
      );
    } else if (processType === 'replace') {
      docs.push({ type: 'id_copy', label: 'ID Copy', required: true });
      switch (pathway) {
        case 'occupational':
          docs.push(
            { type: 'application_form', label: 'Application Form', required: true },
            { type: 'approval_letter', label: 'Approval Letter', required: true },
          );
          break;
        case 'skills':
        case 'legacy':
          docs.push(
            { type: 'recommendation_letter', label: 'Recommendation Letter', required: true },
            { type: 'approval_letter', label: 'Approval Letter', required: true },
            { type: 'replace_application_form', label: 'Replace Application Form', required: true },
          );
          break;
      }
    }
    return docs;
  };

  // ── Form validation ───────────────────────────────────────────────────────

  const validateSubmission = (): boolean => {
    const permission = canCreateSubmission();
    if (!permission.allowed) {
      toast({ title: 'Permission Denied', description: permission.message, variant: 'destructive' });
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
    const missingRequired = requirements.filter(d => d.required && !selectedDocs.includes(d.type)).map(d => d.label);
    if (missingRequired.length > 0) {
      toast({ title: 'Missing Required Documents', description: `Please upload: ${missingRequired.join(', ')}`, variant: 'destructive' });
      return false;
    }
    if ((processType === 'reissue' || processType === 'replace') && !hasAffidavitOrOriginal) {
      toast({ title: 'Missing Document', description: 'Affidavit OR Original Certificate is required', variant: 'destructive' });
      return false;
    }
    if ((processType === 'reissue' || processType === 'replace') && !originalCertificateNumber) {
      toast({ title: 'Missing Field', description: `Original Certificate Number is required for ${processType}`, variant: 'destructive' });
      return false;
    }
    // CVS validation gate — all uploaded required documents must have passed
    if (!allDocumentsPassed()) {
      const unvalidated = getUnvalidatedDocs();
      toast({
        title: 'CVS Validation Required',
        description: `The following documents must pass CVS validation before submission: ${unvalidated.map(t => getDocumentLabel(t)).join(', ')}`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFileUpload = (docType: DocumentType, file: File) => {
    const fileUrl = URL.createObjectURL(file);
    setUploadedFiles(prev => ({ ...prev, [docType]: fileUrl }));
    setSelectedDocs(prev => prev.includes(docType) ? prev : [...prev, docType]);
    // Reset validation for this doc so user has to re-run after uploading a new file
    resetValidationForDoc(docType);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSubmission()) return;

    const documents = [...selectedDocs];
    if (hasAffidavitOrOriginal) documents.push(hasAffidavitOrOriginal as DocumentType);

    const submissionDocs = documents.map(type => ({
      id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as DocumentType,
      name: `${getDocumentLabel(type)}.pdf`,
      uploadedAt: new Date().toISOString(),
      url: uploadedFiles[type] || '',
      verified: false,
    }));

    // Build a serialisable snapshot of all per-doc validation results
    const documentValidationResults: Record<string, {
      status: 'idle' | 'processing' | 'passed' | 'failed';
      checks: { name: string; passed: boolean; error?: string }[];
      error?: string;
      summary?: DocumentValidationState['summary'];
    }> = {};

    getDocumentRequirements().forEach(req => {
      const v = getDocValidation(req.type);
      documentValidationResults[req.type] = {
        status: v.status,
        checks: v.checks.map(c => ({ name: c.label, passed: c.status === 'passed', error: c.message })),
        error: v.error || undefined,
        summary: v.summary || undefined,
      };
    });

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
          role: currentRole,
        } : null,
        // ── NEW: store all per-document validation results ──
        documentValidations: documentValidationResults,
        // Keep legacy fields populated for backwards compat with Intake viewer
        preIntakeValidationStatus: 'passed',
        preIntakeValidationAt: new Date().toISOString(),
        preIntakeValidatedBy: currentRole,
      },
      createdBy: currentRole,
      processType,
      source: getSubmissionSource(),
      sourceDisplay: getSubmissionSourceDisplay(),
      pathway,
      ...((processType === 'reissue' || processType === 'replace') && { originalCertificateNumber }),
      ...(processType === 'reissue' && { reissueReason }),
    });

    toast({
      title: 'Success',
      description: `${processType === 'reissue' ? 'Re-Issue' : processType === 'replace' ? 'Replace' : 'Issue'} submission created successfully`,
    });

    if (currentRole === ROLES.SDP && (processType === 'reissue' || processType === 'replace')) {
      addSdpInvoice({
        sdpName: currentProfile?.companyName || 'SDP',
        processType: processType === 'reissue' ? 'Re-issue' : 'Replace',
        submissionDate: new Date().toISOString(),
        status: 'Pending',
        candidateName: formData.candidateName,
        certificateType: pathway,
      });
    }

    // Reset form
    setFormData({ candidateName: '', certificateType: pathway });
    setOriginalCertificateNumber('');
    setSelectedDocs([]);
    setHasAffidavitOrOriginal('');
    setUploadedFiles({});
    resetAllValidations();
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

  // ── Document viewer modal (unchanged logic) ───────────────────────────────

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setActiveTab('details');
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
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Submission Details</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div><span className="text-muted-foreground">Candidate:</span> <span className="font-medium">{selectedSubmission.candidateName}</span></div>
                <div><span className="text-muted-foreground">Certificate Type:</span> <span className="font-medium capitalize">{selectedSubmission.pathway || selectedSubmission.certificateType}</span></div>
                <div><span className="text-muted-foreground">Process Type:</span> <span className="font-medium capitalize">{selectedSubmission.processType === 'reissue' ? 'Re-Issue' : selectedSubmission.processType === 'replace' ? 'Replace' : 'Issue'}</span></div>
                <div><span className="text-muted-foreground">Date Submitted:</span> <span className="font-medium">{selectedSubmission.dateSubmitted ? new Date(selectedSubmission.dateSubmitted).toLocaleDateString() : '-'}</span></div>
                {selectedSubmission.originalCertificateNumber && (
                  <div className="col-span-2"><span className="text-muted-foreground">Original Certificate #:</span> <span className="font-medium">{selectedSubmission.originalCertificateNumber}</span></div>
                )}
              </div>
            </div>

            {/* Per-document CVS validation results */}
            {selectedSubmission.assessmentData?.documentValidations && (
              <div className="space-y-3">
                <p className="text-sm font-medium">CVS Pre-Validation Results</p>
                {Object.entries(selectedSubmission.assessmentData.documentValidations).map(([docType, result]: [string, any]) => (
                  <div key={docType} className={`rounded-lg border p-3 text-sm ${result.status === 'passed' ? 'bg-green-50 border-green-200' : result.status === 'failed' ? 'bg-red-50 border-red-200' : 'bg-muted'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏳'}</span>
                      <span className="font-medium">{getDocumentLabel(docType as DocumentType)}</span>
                      <Badge variant={result.status === 'passed' ? 'outline' : result.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">{result.status}</Badge>
                    </div>
                    {result.error && <p className="text-xs text-red-700 mt-1">{result.error}</p>}
                    {result.summary && result.summary.totalLearners > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div><p className="text-xs text-muted-foreground">Total</p><p className="font-medium">{result.summary.totalLearners}</p></div>
                        <div><p className="text-xs text-muted-foreground">Passed</p><p className="font-medium text-green-600">{result.summary.passedLearners}</p></div>
                        <div><p className="text-xs text-muted-foreground">Failed</p><p className="font-medium text-red-600">{result.summary.failedLearners}</p></div>
                      </div>
                    )}
                  </div>
                ))}
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
                {selectedSubmission.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{getDocumentLabel(doc.type)}</p>
                        <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}</p>
                      </div>
                    </div>
                    {doc.url && (
                      <Button variant="ghost" size="sm" className="h-8" onClick={() => window.open(doc.url, '_blank')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedSubmission.assessmentData?.returnReason && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">Return Information</h4>
                  <p className="text-sm text-amber-700 mt-1">{selectedSubmission.assessmentData.returnReason}</p>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div><p className="text-xs text-amber-700">Returned By</p><p className="font-medium text-amber-900">{selectedSubmission.assessmentData.returnedBy || '-'}</p></div>
                    <div><p className="text-xs text-amber-700">Returned On</p><p className="font-medium text-amber-900">{selectedSubmission.assessmentData.returnedAt ? new Date(selectedSubmission.assessmentData.returnedAt).toLocaleDateString() : '-'}</p></div>
                    <div><p className="text-xs text-amber-700">To Do By</p><p className="font-medium text-amber-900">{selectedSubmission.assessmentData.correctionRecord?.todoDate ? new Date(selectedSubmission.assessmentData.correctionRecord.todoDate).toLocaleDateString() : '-'}</p></div>
                    <div><p className="text-xs text-amber-700">Error Type</p><p className="font-medium text-amber-900 capitalize">{selectedSubmission.assessmentData.correctionRecord?.errorType?.replace(/_/g, ' ') || '-'}</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  // ── CVS Validation UI (per document) ─────────────────────────────────────

  /**
   * Renders the CVS validation block for a single document.
   * Only shows after the file has been uploaded.
   */
  const renderDocumentValidationBlock = (docType: DocumentType) => {
    const isUploaded = selectedDocs.includes(docType);
    if (!isUploaded) return null;

    const v = getDocValidation(docType);
    const label = getDocumentLabel(docType);

    return (
      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-blue-900">CVS Validation — {label}</p>
          {v.status === 'passed' && <Badge variant="outline" className="text-green-700 border-green-300">Passed</Badge>}
          {v.status === 'failed' && <Badge variant="destructive">Failed</Badge>}
          {v.status === 'processing' && <Badge variant="secondary">Running...</Badge>}
        </div>

        {/* Progress bar */}
        {v.status === 'processing' && (
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${v.progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{v.progress}% complete</p>
          </div>
        )}

        {/* Check list */}
        {v.checks.length > 0 && (
          <div className="space-y-1.5">
            {v.checks.map(check => (
              <div key={check.id} className="flex items-start gap-2 text-xs">
                <span>
                  {check.status === 'passed' && '✅'}
                  {check.status === 'failed' && '❌'}
                  {check.status === 'processing' && '⏳'}
                  {check.status === 'pending' && '•'}
                </span>
                <div>
                  <p>{check.label}</p>
                  {check.message && <p className="text-red-600">{check.message}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary for docs with learner lists */}
        {v.summary && v.summary.totalLearners > 0 && (
          <div className="rounded border bg-white p-2 space-y-2">
            <p className="text-xs font-medium">Learner Validation Summary</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded border p-1.5"><p className="text-muted-foreground">Total</p><p className="font-semibold">{v.summary.totalLearners}</p></div>
              <div className="rounded border p-1.5"><p className="text-muted-foreground">Passed</p><p className="font-semibold text-green-600">{v.summary.passedLearners}</p></div>
              <div className="rounded border p-1.5"><p className="text-muted-foreground">Failed</p><p className="font-semibold text-red-600">{v.summary.failedLearners}</p></div>
            </div>
            {v.summary.failedRows && v.summary.failedRows.length > 0 && (
              <div className="max-h-28 overflow-y-auto space-y-1">
                {v.summary.failedRows.map((row, i) => (
                  <div key={i} className="text-xs rounded border border-red-200 bg-red-50 p-1.5">
                    <span className="font-medium">{row.learnerIdentifier}:</span> {row.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {v.status === 'failed' && v.error && (
          <div className="rounded border border-red-200 bg-red-50 p-2">
            <p className="text-xs font-medium text-red-800">Validation Failed</p>
            <p className="text-xs text-red-700 mt-0.5">{v.error}</p>
          </div>
        )}

        {/* Success message */}
        {v.status === 'passed' && (
          <div className="rounded border border-green-200 bg-green-50 p-2">
            <p className="text-xs font-medium text-green-800">✓ CVS Validation Passed</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={v.status === 'processing'}
            onClick={() => runCVSValidationForDoc(docType)}
          >
            {v.status === 'processing' ? 'Validating...' : v.status === 'passed' ? 'Re-validate' : 'Run CVS Validation'}
          </Button>
          {v.status !== 'idle' && (
            <Button type="button" size="sm" variant="outline" onClick={() => resetValidationForDoc(docType)}>
              Reset
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ── Document upload section ───────────────────────────────────────────────

  const renderDocumentUploads = () => {
    const requirements = getDocumentRequirements();

    // Overall validation progress banner
    const uploadedRequired = requirements.filter(r => selectedDocs.includes(r.type));
    const passedCount = uploadedRequired.filter(r => getDocValidation(r.type).status === 'passed').length;
    const totalUploaded = uploadedRequired.length;
    const allPassed = totalUploaded > 0 && passedCount === totalUploaded;

    return (
      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-lg">Required Documents</h4>
          {/* Global test mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">CVS test mode:</span>
            <Button type="button" size="sm" variant={cvsTestMode === 'pass' ? 'default' : 'outline'} onClick={() => setCvsTestMode('pass')} className="h-7 text-xs">Force Pass</Button>
            <Button type="button" size="sm" variant={cvsTestMode === 'fail' ? 'destructive' : 'outline'} onClick={() => setCvsTestMode('fail')} className="h-7 text-xs">Force Fail</Button>
          </div>
        </div>

        {/* Overall CVS progress banner */}
        {totalUploaded > 0 && (
          <div className={`rounded-lg p-3 text-sm border ${allPassed ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
            {allPassed
              ? `✅ All ${totalUploaded} document(s) passed CVS validation — ready to submit.`
              : `⚠️ ${passedCount} of ${totalUploaded} uploaded document(s) have passed CVS validation. All must pass before submission.`}
          </div>
        )}

        <div className="space-y-4">
          {requirements.map(doc => (
            <div key={doc.type} className="flex flex-col p-4 border rounded-lg bg-card shadow-sm space-y-2">
              <Label className="font-medium">
                {doc.label}
                {doc.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.png"
                className="cursor-pointer"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(doc.type, file);
                }}
              />
              {selectedDocs.includes(doc.type) && (
                <span className="text-sm text-green-600">✓ File selected</span>
              )}
              {/* ── Per-document CVS validation block ── */}
              {renderDocumentValidationBlock(doc.type)}
            </div>
          ))}

          {/* Affidavit / Original certificate (reissue & replace) */}
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
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setHasAffidavitOrOriginal('affidavit');
                        handleFileUpload('affidavit' as DocumentType, e.target.files[0]);
                      }
                    }}
                  />
                  {hasAffidavitOrOriginal === 'affidavit' && <span className="text-sm text-green-600">✓ File selected</span>}
                  {/* CVS validation for affidavit */}
                  {hasAffidavitOrOriginal === 'affidavit' && renderDocumentValidationBlock('affidavit' as DocumentType)}
                </div>
                <div className="flex-1 flex flex-col p-4 border rounded-lg bg-card shadow-sm space-y-2">
                  <Label>Original Certificate (if correction/damaged)</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    className="cursor-pointer"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setHasAffidavitOrOriginal('original_certificate');
                        handleFileUpload('original_certificate' as DocumentType, e.target.files[0]);
                      }
                    }}
                  />
                  {hasAffidavitOrOriginal === 'original_certificate' && <span className="text-sm text-green-600">✓ File selected</span>}
                  {/* CVS validation for original certificate */}
                  {hasAffidavitOrOriginal === 'original_certificate' && renderDocumentValidationBlock('original_certificate' as DocumentType)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Stats (for submissions table header) ──────────────────────────────────

  const preValidationPassedCount = profileSubmissions.filter(s => s.assessmentData?.preIntakeValidationStatus === 'passed').length;
  const preValidationFailedCount = profileSubmissions.filter(s => s.assessmentData?.preIntakeValidationStatus === 'failed').length;
  const preValidationCheckedCount = profileSubmissions.filter(s =>
    s.assessmentData?.preIntakeValidationStatus === 'passed' || s.assessmentData?.preIntakeValidationStatus === 'failed',
  ).length;

  const mySubmissions = profileSubmissions.filter(sub => sub.createdBy === currentRole);
  const availableProcessTypes = getAvailableProcessTypes();
  const availablePathways = getAvailablePathways();

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Create Profile Submission</CardTitle>
              <div className="text-sm text-muted-foreground mt-1 p-2 bg-yellow-100 rounded">
                Debug: Currently logged in as <strong>{currentRole}</strong>
                {currentProfile && <span> - {currentProfile.companyName} ({currentProfile.companyType})</span>}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Process Type */}
            <div className="space-y-2">
              <Label>Process Type</Label>
              <Select value={processType} onValueChange={v => setProcessType(v as ProcessType)}>
                <SelectTrigger className="bg-card w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableProcessTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'reissue' ? 'Re-Issue' : type === 'replace' ? 'Replace' : 'Issue'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SDP Name</Label>
                <Input value={formData.candidateName} onChange={e => setFormData({ ...formData, candidateName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Certificate Type</Label>
                {availablePathways.length > 0 ? (
                  <Select value={pathway} onValueChange={v => { setPathway(v as Pathway); setFormData({ ...formData, certificateType: v }); }} required>
                    <SelectTrigger className="bg-card"><SelectValue placeholder="Select certificate type" /></SelectTrigger>
                    <SelectContent>
                      {availablePathways.map(p => (
                        <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value="No certificate types available" disabled className="bg-muted" />
                )}
              </div>
            </div>

            {/* Submission Source */}
            <div className="space-y-2">
              <Label>Submission Source</Label>
              <Input value={getSubmissionSourceDisplay()} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                Automatically set from your profile: {currentProfile?.companyName || currentRole}
              </p>
            </div>

            {/* Re-Issue fields */}
            {processType === 'reissue' && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Re-Issue Reason</Label>
                    <Select value={reissueReason} onValueChange={v => setReissueReason(v as ReissueReason)}>
                      <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
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
                  <Input value={originalCertificateNumber} onChange={e => setOriginalCertificateNumber(e.target.value)} required />
                </div>
              </div>
            )}

            {/* Replace fields */}
            {processType === 'replace' && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Original Certificate Number</Label>
                  <Input value={originalCertificateNumber} onChange={e => setOriginalCertificateNumber(e.target.value)} required placeholder="Enter original certificate number" />
                </div>
              </div>
            )}

            {/* Document uploads + per-doc CVS validation */}
            {availablePathways.length > 0 && renderDocumentUploads()}

            <Button type="submit">
              Create {processType === 'reissue' ? 'Re-Issue' : processType === 'replace' ? 'Replace' : 'Issue'} Submission
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pre-Check Passed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{preValidationPassedCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pre-Check Failed</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{preValidationFailedCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Checked</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{preValidationCheckedCount}</div></CardContent>
        </Card>
      </div>

      {/* My Submissions table */}
      {mySubmissions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>My Submissions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>SDP Name </TableHead>
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
                      {sub.processType === 'reissue' ? 'Re-Issue' : sub.processType === 'replace' ? 'Replace' : 'Issue'}
                    </TableCell>
                    <TableCell>{sub.sourceDisplay || sub.source || '-'}</TableCell>
                    <TableCell>{sub.dateSubmitted ? new Date(sub.dateSubmitted).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        sub.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        sub.status === 'pending_correction' ? 'bg-amber-100 text-amber-800' :
                        sub.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        sub.status === 'submitted' ? 'bg-purple-100 text-purple-800' :
                        sub.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sub.status === 'pending_correction' ? 'Returned' :
                         sub.status === 'approved' ? 'Approved' :
                         sub.status === 'submitted' ? 'Under Review' :
                         sub.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => handleViewSubmission(sub)} className="h-8 px-2 text-xs">
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {renderDocumentViewer()}
    </div>
  );
}