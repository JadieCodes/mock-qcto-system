export type AppRole = 
  | 'Assessment Unit' 
  | 'Certification Practitioner' 
  | 'Supervisor' 
  | 'Printer' 
  | 'Finance'
  | 'QP'        // Quality Partner
  | 'SDP'       // Skills Development Provider
  | 'NAMB'
    // Research Domain Roles
    
  | 'Research Deputy Director'
  | 'Research Director'
  | 'Research Chief Director'
  | 'Research Chief Financial Officer'
  | 'Research Chief Executive Officer'
  | 'Research Legal Director'
  | 'Research Service Provider'
  | 'Research Graphic Designer'
  |'Forum' 
   // External Research Roles
   
  | 'Requester'
  | 'Applicant'
  | 'External Applicant'
   // QA External Roles
  | 'SDP'
  | 'Quality Partner'
  | 'Quality Partner (SETA)'
  // QA Internal Roles
  | 'Indicator Champion'
  | 'QA Managers'
  | 'QA SP Team';

export type SubmissionStatus = 
  | 'draft'           // Initial submission
  | 'submitted'       // Resubmitted after corrections
  | 'approved'        // Approved by intake, waiting for integration
  | 'pending_correction' // Returned from intake OR integration failure
  | 'integrated'      // Successfully integrated, ready for batching
  | 'in_batch'        // Added to batch
  | 'completed';      // Fully processed

export type IntegrationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type BatchStatus = 'registered' | 'integrating' | 'integrated' | 'printing' | 'qc_passed' | 'qc_failed' | 'packaged' | 'collected';

export type IntegrationSystem = 'CVS' | 'Apprentice';

export type JobStatus = 'pending' | 'bio_importing' | 'bio_completed' | 'achievement_importing' | 'completed' | 'failed';

// Process Types: CERT-01 (Issue), CERT-02 (Re-Issue), CERT-03 (Replace)
export type ProcessType = 'issue' | 'reissue' | 'replace';

// Updated ReissueReason to include all options
export type ReissueReason = 'lost' | 'damaged' | 'administrative_error' | 'printing_error';

// Replace reasons (CRT-03 specific)
export type ReplaceReason = 'lost_before_issue' | 'administrative_error';

export type SubmissionSource = 'SDP' | 'QP' | 'Learner' | 'NAMB';

export type Pathway = 'occupational' | 'skills' | 'legacy';

// Certificate type for pathway-specific document requirements
export type CertificateCategory = 'occupational' | 'skills' | 'legacy';

export type MilestoneType = 'Report' | 'Invoice' | 'Tranche';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';
export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed';
export type ProjectStatus =
  | 'not_started'
  | 'in_progress'
  | 'awaiting_report_submission'
  | 'under_review'
  | 'completed';

// Comprehensive DocumentType including all required documents for all processes
export type DocumentType = 
  // Core documents
  | 'application_form' 
  | 'approval_letter' 
  | 'affidavit' 
  | 'original_certificate' 
  | 'proof_of_payment'
  | 'recommendation_letter'
  | 'id_copy'
  
  // Issue - Occupational specific
  | 'file_3_4'
  
  
  // Issue - Skills specific
  | 'programme_approval_letter'
  | 'learner_result_approval_sheet'
  | 'qualification_data_confirmation'
  | 'supporting_achievement_documentation'
  
  // Issue - Legacy specific
  | 'signed_declaration'
  | 'learner_achievement_data_proof'
  | 'qualification_confirmation'
  | 'bio_data_confirmation'
  | 'historical_verification'
  
  // Re-Issue specific
  | 'reissue_application_form'
  
  // Replace specific
  | 'replace_application_form'
  
  // Other/legacy
  | 'namb_documentation'
  | 'other';

// Correction Types
export type CorrectionStatus = 'active' | 'resolved' | 'rejected' | 'pending_review';
export type ErrorType = 'missing_documentation' | 'incorrect_learner_details' | 'qualification_mismatch' | 'integration_failure' | 'printing_error';
export type OriginType = 'intake' | 'integration' | 'printing';

// Document Version Interface
export interface DocumentVersion {
  version: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  verified: boolean;
}


// Correction Note Interface
export interface CorrectionNote {
  id: string;
  whatWasCorrected: string;
  reasonForChange: string;
  correctedBy: AppRole;
  correctedAt: string;
  version: number;
}

// Integration Error Log Interface
export interface IntegrationErrorLog {
  errorMessage: string;
  errorResponse: string;
  errorTimestamp: string;
  system: 'CVS' | 'Apprentice';
  revalidationDate?: string;
  revalidationStatus?: 'passed' | 'failed';
}

// Correction Record Interface
export interface CorrectionRecord {
  correctionId: string;
  submissionId: string;
  learnerName: string;
  qualification: string;
  pathway: string;
  errorType: ErrorType;
  origin: OriginType;
  responsibleUnit: AppRole;
  currentStatus: CorrectionStatus;
  version: number;
  dateCreated: string;
  lastUpdated: string;
  assignedTo: AppRole;
  returnReason: string;
  correctionNotes?: CorrectionNote[];
  integrationErrorLog?: IntegrationErrorLog;

  // ✅ NEW (deadline system)
  todoDate?: string;      // deadline to correct
  expired?: boolean;      // system marked expired
  expiredAt?: string;     // when expired
}

// Submission Document Interface
export interface SubmissionDocument {
  id: string;
  type: DocumentType;
  name: string;
  uploadedAt: string;
  url?: string;
  verified: boolean;
  versions?: DocumentVersion[];
}

// SINGLE Submission Interface - MERGED both versions
export interface Submission {
  id: string;
  candidateName: string;
  certificateType: string;
  dateSubmitted: string;
  status: SubmissionStatus;
  documents: SubmissionDocument[];
  assessmentData: {
    submittedBy?: any;
    reviewChecks?: Record<string, boolean>;
    reviewCompleted?: boolean;
    reviewCompletedAt?: string;
    reviewDecision?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    documentVerifications?: Record<string, boolean>;
    returnReason?: string;
    returnedBy?: string;
    returnedAt?: string;
    resubmittedAt?: string;
    resubmittedBy?: string;
    resubmitted?: boolean;
    // Integration fields
    integrationStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    integrationSystem?: 'CVS' | 'Apprentice';
    integrationAttempts?: number;
    integrationCompletedAt?: string;
    integratedBy?: string;
    integratedSystem?: string;
    integrationError?: string;
    integrationFailedAt?: string;
    systemChecks?: Array<{ name: string; passed: boolean; error?: string }>;
    // External pre-intake CVS validation
preIntakeValidationStatus?: 'not_started' | 'processing' | 'passed' | 'failed';
preIntakeValidationAt?: string;
preIntakeValidatedBy?: string;
preIntakeValidationError?: string;
preIntakeSystemChecks?: Array<{ name: string; passed: boolean; error?: string }>;
preIntakeValidationStats?: {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
};
preIntakeValidationSummary?: {
  totalLearners: number;
  passedLearners: number;
  failedLearners: number;
  failedRows?: Array<{
    learnerIdentifier: string;
    reason: string;
  }>;
};
    // Re-issue fields
    reissueNumber?: string;
    previousCertificateNumber?: string;
    // Replace fields
    originalCertificateVoided?: boolean;
    voidedAt?: string;
    // Correction record
    correctionRecord?: CorrectionRecord;
    sourceDisplay?: string;
    // Batch fields - ADD THIS
    readyForBatch?: boolean;
    readyForBatchAt?: string;
    sentBackToIntake?: boolean;
sentBackToIntakeAt?: string;
sentBackToIntakeBy?: string;
sentBackToIntakeReason?: string;
  };
  createdBy: string;
  processType: ProcessType;
  source?: SubmissionSource;
  sourceDisplay?: string;
  pathway?: Pathway;
  // Re-Issue specific fields (CERT-02)
  reissueReason?: ReissueReason;
  originalCertificateNumber?: string;
  // Replace specific fields (CERT-03)
  replaceReason?: ReplaceReason;
  certificateCategory?: CertificateCategory;
  // Internal correction fields (used by both CERT-02 and CERT-03)
  correctionData?: {
    originalData: Record<string, any>;
    correctedData: Record<string, any>;
    correctedBy?: string;
    correctedAt?: string;
    verifiedBy?: string;
    verifiedAt?: string;
    supervisorApproved?: boolean;
    supervisorApprovedBy?: string;
    supervisorApprovedAt?: string;
  };
}

export interface BatchRegistrationForm {
  batchId: string;
  pathway: Pathway;
  type: ProcessType;
  quantity: number;
  createdBy: string;
  dateCreated: string;
  certificateNumbers: string[];
  status: 'draft' | 'registered' | 'processing' | 'completed';
}

export interface PaperAllocationRecord {
  batchId: string;
  paperStartNumber: number;
  paperEndNumber: number;
  quantity: number;
  allocatedBy: string;
  date: string;
  remainingStock: number;
}

export interface InventoryControlRecord {
  batchId: string;
  beforeAllocation: number;
  allocated: number;
  wasted: number;
  returned: number;
  destroyed: number;
  afterAllocation: number;
  updatedAt: string;
  updatedBy: string;
}

// Update the Batch interface
export interface Batch {
  batchUuid: string;
  batchName: string;
  totalCertificates: number;
  status: BatchStatus;
  submissions: string[];
  createdAt: string;
  createdBy: string;
  
  // Extended batch fields for all process types
  processType: ProcessType;
  isReissue?: boolean;
  isReplace?: boolean;
  pathway?: Pathway;
  targetSystem?: IntegrationSystem;
  
  // System generated documents
  registrationForm?: BatchRegistrationForm;
  paperAllocation?: PaperAllocationRecord;
  inventoryControl?: InventoryControlRecord;
}

export interface IntegrationJob {
  id: string;
  batchId: string;
  system: IntegrationSystem;
  status: JobStatus;
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface PrintJob {
  id: string;
  batchId: string;
  paperStockAllocated: number;
  qcStatus?: 'passed' | 'failed';
  qcNotes?: string;
  storageLocation?: string;
  collectedBy?: string;
  collectionSignature?: string;
  collectedAt?: string;
  createdAt: string;
}
// Accreditation-specific types
export type ApplicationType = 'OC' | 'SP' | 'AC' | 'N4-N6' | 'Non-accredited venue approval' | 'Temporary training approval';

// Region type
export type Region = 'Gauteng' | 'Western Cape' | 'KwaZulu-Natal' | 'Eastern Cape' | 'Free State' | 'Mpumalanga' | 'Limpopo' | 'North West' | 'Northern Cape';


export type AccreditationStep = 
  | 'step1_initial_submitted'      // Step 1: Initial form submitted
  | 'step2_under_initial_review'    // Step 2: Under initial review
  | 'step3_initial_approved'        // Step 3: Initial approval (ready for documents)
  | 'step3_initial_rejected'        // Step 3: Initial rejection
  | 'step4_documents_uploaded'      // Step 4: Documents uploaded by applicant
  | 'step5_under_final_review'      // Step 5: Under final review with AI report
  | 'step6_final_approved'           // Step 6: Final approval (ready for payment)
  | 'step6_final_rejected'           // Step 6: Final rejection
  | 'step7_payment_pending'          // Step 7: Payment pending
  | 'step8_payment_uploaded'         // Step 8: Proof of payment uploaded
  | 'step9_completed'                 // Step 9: Completed
  | 'step10_site_visit_scheduled';    


  // Evaluation Checklist Interface
export interface EvaluationChecklist {
  criteriaId: string;
  criteriaName: string;
  isMet: boolean;
  comments?: string;
}


// AI Recommendation Interface
export interface AIRecommendation {
  recommendationId: string;
  generatedAt: string;
  overallScore: number; // 0-100
  summary: string;
  documentFindings: Array<{
    documentType: AccreditationDocumentType;
    fileName: string;
    status: 'valid' | 'invalid' | 'missing' | 'needs_review';
    confidence: number;
    issues?: string[];
  }>;
  recommendedAction: 'approve' | 'reject' | 'needs_review';
  riskLevel: 'low' | 'medium' | 'high';
}

// Payment Notification Document
export interface PaymentNotification {
  id: string;
  generatedAt: string;
  amount: number;
  dueDate: string;
  paymentReference: string;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    reference: string;
  };
}

export interface AcknowledgementLetter {
  id: string;
  generatedAt: string;
  letterUrl: string;
  content: string;
}
// Document types for accreditation
export type AccreditationDocumentType = 
  | 'application_form'
  | 'company_registration'
  | 'qms_documents'
  | 'training_material'
  | 'staff_details'
  | 'venue_details'
  | 'proof_of_payment'
  | 'site_visit_report'
  | 'outcome_letter';
  

// Document interface
export interface AccreditationDocument {
  id: string;
  type: AccreditationDocumentType;
  name: string;
  fileUrl: string;
  uploadedAt: string;
  fileSize?: number;
  verified?: boolean;

  validationStatus?: 'passed' | 'failed';
  validationError?: string;
  validationChecks?: Array<{
    id: string;
    label: string;
    status: 'pending' | 'processing' | 'passed' | 'failed';
    message?: string;
  }>;
  reviewDecision?: 'pending' | 'approved' | 'rejected';
}

// Enhanced Applicant Info
export interface ApplicantInfo {
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
  companyName: string;
  companyRegistration?: string;
  organisationName: string; // Added
  trainingLocation: string; // Added
  region: Region; // Added
}

// Enhanced Application Form
export interface ApplicationForm {
  id?: string; // For existing applications
  applicantInfo: ApplicantInfo;
  qualification: string;
  applicationType: ApplicationType;
  applicationId?: string;
  submittedAt?: string;
  documents?: AccreditationDocument[];
}

// Enhanced Application Status
// Update ApplicationStatus interface




// Outcome Letter
export interface OutcomeLetter {
  letterUrl: string;
  issuedDate: string;
  outcome: 'approved' | 'rejected' | 'conditional';
  validUntil?: string;
  conditions?: string[];
}

// Evaluation History Entry
// Update the stage type in EvaluationHistoryEntry
export interface EvaluationHistoryEntry {
  stage: 'initial' | 'final' | 'ai-evaluation';
  reviewedBy: string;
  reviewedAt: string;
  checklist: EvaluationChecklist[];
  decision: 'approved' | 'rejected' | 'pending';
  comments?: string;
  aiRecommendation?: AIRecommendation;
}

export interface InitialAccreditationCheck {
  qualificationTitle: boolean;
  saqaId: boolean;
  curriculumCode: boolean;
  nqfLevel: boolean;
  credits: boolean;
}

export interface RequiredUploadItem {
  id: string;
  label: string;
  uploaded?: boolean;
  uploadedDocumentId?: string;
}

export interface ApplicantRequiredDocumentUpload {
  requirementId: string;
  label: string;
  document?: AccreditationDocument;
  uploadedAt?: string;
}

// Add to ApplicationStatus interface if not already there
export interface ApplicationStatus {
  id: string;
  applicationId: string;
  status: AccreditationStep;
  submittedDate?: string;
  lastUpdated: string;
  siteVisitSchedule?: SiteVisitSchedule;
  outcomeLetter?: OutcomeLetter;
  acknowledgementLetter?: AcknowledgementLetter;
  paymentNotification?: PaymentNotification;
  paymentStatus: 'pending' | 'paid' | 'verified';
  paymentAmount?: number;
  paymentDate?: string;
  paymentAllocatedToApplicationId?: string;
paymentReferenceUsed?: string;
paymentVerifiedForCorrectApplication?: boolean;
paymentVerificationNotes?: string;
  proofOfPayment?: AccreditationDocument[];
  applicationData?: ApplicationForm;
  evaluationHistory?: EvaluationHistoryEntry[];

  initialQualificationChecks?: InitialAccreditationCheck;
  requiredApplicantDocuments?: RequiredUploadItem[];
  applicantRequiredUploads?: ApplicantRequiredDocumentUpload[];

  initialReview?: {
    reviewedBy?: string;
    reviewedAt?: string;
    checklist?: EvaluationChecklist[];
    decision?: 'approved' | 'rejected';
    comments?: string;
  };

  finalReview?: {
    reviewedBy?: string;
    reviewedAt?: string;
    checklist?: EvaluationChecklist[];
    aiRecommendation?: AIRecommendation;
    decision?: 'approved' | 'rejected';
    comments?: string;
  };
  financeVerificationRequested?: boolean;
financeVerificationRequestedAt?: string;
financeVerificationRequestedBy?: string;
financeVerificationStatus?: 'not_requested' | 'requested' | 'confirmed';
desktopEvaluationUploaded?: boolean;
desktopEvaluationUploadedAt?: string;
desktopEvaluationUploadedBy?: string;

siteVisitAssigned?: boolean;
siteVisitAssignedAt?: string;
siteVisitAssignedBy?: string;

  scheduleSent?: boolean;
  scheduleStatus?: SiteVisitStatus;
  siteVisitReport?: SiteVisitReport;
}
export type SiteVisitStatus =
 'pending_confirmation'
| 'sent_to_applicant'
| 'pending_acceptance'
| 'applicant_confirmed'
| 'pending_qcto_confirmation'
| 'booking_confirmed'
| 'reschedule_requested'
| 'in_progress'
| 'completed'
| 'cancelled'  

export interface SiteVisitSchedule {
  scheduledDate: string;
  scheduledTime: string;
  venue: string;
  assessorName?: string;
  assessorEmail?: string;
  status: SiteVisitStatus;
  notes?: string;
  isOnSiteVerified?: boolean;
onSiteVerifiedAt?: string;
currentLocation?: string;
visitStartedAt?: string;
visitCompletedAt?: string;
durationMinutes?: number;

  applicantConfirmed?: boolean;
  applicantConfirmedAt?: string;

  qctoConfirmed?: boolean;
  qctoConfirmedAt?: string;
  qctoConfirmedBy?: string;

  bookingConfirmed?: boolean;
  bookingConfirmedAt?: string;

  rescheduleRequested?: boolean;
  rescheduleRequestedAt?: string;
  rescheduleRequestedBy?: 'applicant';
  rescheduleReason?: string;
}

   // Add these to your existing types file

export interface SiteVisitEvidence {
  id: string;
  type: 'photo' | 'document';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  description?: string;
}

export interface SiteVisitChecklistItem {
  id: string;
  criteria: string;
  isMet: boolean;
  comments?: string;
  evidenceIds?: string[];
}

export interface SiteVisitReport {
  id: string;
  applicationId: string;
  conductedBy: string;
  conductedByRole: 'qp' | 'verifier';
  conductedAt: string;
  completedAt?: string;
  checklist: SiteVisitChecklistItem[];
  evidence: SiteVisitEvidence[];
  summary: string;
  recommendations: string;
  riskProfile?: 'low' | 'medium' | 'high';
  qualification?: string;
  region?: string;
  outcome: 'compliant' | 'partially_compliant' | 'non_compliant';
}

// Update ApplicationStatus interface
export interface ApplicationStatus {
  id: string;
  applicationId: string;
  status: AccreditationStep;
  submittedDate?: string;
  lastUpdated: string;
  siteVisitSchedule?: SiteVisitSchedule;
  outcomeLetter?: OutcomeLetter;
  acknowledgementLetter?: AcknowledgementLetter;
  paymentNotification?: PaymentNotification;
  paymentStatus: 'pending' | 'paid' | 'verified';
  paymentAmount?: number;
  paymentDate?: string;
  proofOfPayment?: AccreditationDocument[];
  applicationData?: ApplicationForm;
  evaluationHistory?: EvaluationHistoryEntry[];
  initialReview?: {
    reviewedBy?: string;
    reviewedAt?: string;
    checklist?: EvaluationChecklist[];
    decision?: 'approved' | 'rejected';
    comments?: string;
  };
  finalReview?: {
    reviewedBy?: string;
    reviewedAt?: string;
    checklist?: EvaluationChecklist[];
    aiRecommendation?: AIRecommendation;
    decision?: 'approved' | 'rejected';
    comments?: string;
  };
  scheduleSent?: boolean;
  scheduleStatus?: SiteVisitStatus;
  siteVisitReport?: SiteVisitReport; // Add this line
}

export interface DraftReportDocumentItem {
  label: string;
  status: boolean;
  file: string | null;
  optional?: boolean;
}

export interface DraftReportData {
  applicationId: string;
  applicant: string;
  qualification: string;
  date: string;
  time: string;
  documents: DraftReportDocumentItem[];
  overallStatus: 'complete' | 'incomplete';
  recommendation: string;
}
// types/application.types.ts

// Add this export at the end of your lib/index.tsx file
// Add this export at the end of your lib/index.ts file
export interface Application {
  id: string;
  applicantName: string;
  qualification: string;
  submissionDate: string;
  status:
  | 'draft'
  | 'submitted'
  | 'document_review'
  | 'resolution'
  | 'evaluation'
  | 'evaluation_summary'
  | 'development_workspace'
  | 'approved'
  | 'rejected';
  documents: {
    applicationLetter: string | null;
    motivation: string | null;
    reference: string | null;
    acrLetter: string | null;
    other: string |null
  };
  report?: {
    verified: boolean;
    draftReport: string | DraftReportData;
    verificationDate: string;
  };
  documentReview?: {
    allDocumentsPresent: boolean;
    reviewedBy: string;
    reviewDate: string;
    notes: string;
  };
  resolution?: {
    qualificationDesign: boolean;
    draftReport: boolean;
    applicationLetter: boolean;
    motivation: boolean;
    reference: boolean;
    acrLetter: boolean;
    completed: boolean;
    reviewedBy: string;
    reviewDate: string;
    notes: string;
  };
 evaluation?: {
    qualificationDesign: boolean;
    draftReport: boolean;
    applicationLetter: boolean;
    motivation: boolean;
    reference: boolean;
    acrLetter: boolean;
    aiReport: string | null;
    aiReportGenerated: boolean;
    score?: number;
    reviewedBy: string;
    reviewDate: string;
    notes: string;
    approved: boolean;
    checklistCompleted: boolean;
  };
  finalApproval?: {
    approved: boolean;
    approvalLetter: string | null;
    rejectionLetter: string | null;
    approvedBy: string;
    approvalDate: string;
    notes: string;
    sentToQualityPartner: boolean;
  };
   
   evaluationSummary?: {
    resolution: string;
    resolutionUploaded: string | null;
    recommended: boolean;
    submitted: boolean;
    approvalLetter: string | null;
    approvalDate: string;
    approvedBy: string;
  };
}



// Add to your existing Application interface in lib/index.ts

//research internal : 

// Add these to your types/index.ts
// Add these to your types/index.ts

// Research Internal Status Types
// Add to ResearchInternalStatus
export type ResearchInternalStatus = 
  | 'Pending Agenda Development'
  | 'Agenda In Progress'
  | 'Agenda Submitted'
  | 'Pending Director Review'
  | 'Under Director Review'
  | 'Pending Chief Director Review'
  | 'Under Chief Director Review'
  | 'Pending CFO Review'
  | 'Under CFO Review'
  | 'Pending CEO Approval'
  | 'Under CEO Approval'
  // TOR & SLA Statuses
  | 'Pending TOR Development'
  | 'TOR In Progress'
  | 'Ready for SLA Preparation'
  | 'SLA In Preparation'
  | 'SLA Completed'
  // Legal & CEO Review Statuses
  | 'Pending Legal Review'
  | 'Under Legal Review'
  | 'Pending CEO Approval (SLA)'
  | 'Under CEO Approval (SLA)'
  // Research Workspace Statuses
  | 'Pending Research'
  | 'Research In Progress'
  | 'Pending Review'
  | 'Under Review'
  | 'Report Recommended'
  // Submission & Approval Statuses
  | 'Submission In Progress'
  | 'Pending Approval Review'
  | 'Under Approval Review'
  | 'Recommended for Approval'
  | 'Under Final Approval'
  // Publishing Statuses
  | 'Approved'
  | 'Ready for Publishing'
  | 'Published';
  

// Research Review Outcome Types
export type ResearchReviewOutcome = 
  | 'Recommended by Director'
  | 'Recommended by Chief Director'
  | 'Recommended by CFO'
  | 'Approved'
  | 'Recommended by Legal'
  | 'Report Recommended'
  | 'Submission Recommended'
  | 'Final Approved'
  | '';

export type AppointmentInternalStatus = 
  | 'Recommended by Legal'
  | 'Approved – SLA Signed'
  | '';

export interface ResearchAgenda {
  id: string;
  requestId: string;
  agendaDocument?: {
    name: string;
    url: string;
    uploadedAt: string;
  };
  submissionDocument?: {
    name: string;
    url: string;
    uploadedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  submittedBy?: string;
  submittedAt?: string;
}

export interface ResearchEvaluation {
  id: string;
  requestId: string;
  reviewerRole: string;
  reviewerName: string;
  checklist: EvaluationChecklist[];
  recommendation: 'recommend' | 'not_recommend' | 'approve' | 'decline';
  comments?: string;
  submittedAt: string;
}

// Add to your existing interfaces or create a new one for Research Requests
export interface ResearchRequest {
  id: string;
  title: string;
  requestId: string;
  dateSubmitted: string;
  status: 'Draft' | 'Submitted';
  internalStatus?: ResearchInternalStatus;
  reviewOutcome?: ResearchReviewOutcome;
  requesterDetails: {
    name: string;
    role: string;
    businessUnit: string;
    email: string;
  };
  researchPurpose: {
    problemStatement: string;
    reasonForResearch: string;
    trigger: string;
    expectedImpact: string;
  };
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  agenda?: ResearchAgenda;
  evaluations?: ResearchEvaluation[];
    torDocument?: TORDocument;
  slaDocument?: SLADocument;
   legalDocument?: LegalDocument;
  ceoDocument?: CEODocument;
  appointmentStatus?: AppointmentInternalStatus;
   researchReport?: ResearchReport;
  publishingDoc?: PublishingDocument;
  researchEvaluations?: ResearchEvaluation[];
  submissionEvaluations?: ResearchEvaluation[];
  finalEvaluations?: ResearchEvaluation[];
   submissionDoc?: ResearchSubmissionDocument; 
  
}

// Add to types/index.ts
export interface TORDocument {
  id: string;
  requestId: string;
  documentUrl: string;
  documentName: string;
  uploadedAt: string;
  uploadedBy: string;
  workshopConducted: boolean;
  workshopDate?: string;
  workshopNotes?: string;
}

export interface SLADocument {
  id: string;
  requestId: string;
  documentUrl: string;
  documentName: string;
  uploadedAt: string;
  uploadedBy: string;
  signedBy?: string;
  signedAt?: string;
}

// Add LegalDocument interface
export interface LegalDocument {
  id: string;
  requestId: string;
  documentUrl: string;
  documentName: string;
  uploadedAt: string;
  uploadedBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  recommendation?: 'recommend' | 'not_recommend';
  comments?: string;
}

export interface CEODocument {
  id: string;
  requestId: string;
  documentUrl: string;
  documentName: string;
  uploadedAt: string;
  uploadedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  decision?: 'approve' | 'decline';
  comments?: string;
}

// Add new interfaces for Research Workspace
export interface ResearchReport {
  id: string;
  requestId: string;
  documentUrl: string;
  documentName: string;
  uploadedAt: string;
  uploadedBy: string;
  reportNotes?: string;
}

export interface ResearchSubmissionDocument {
  id: string;
  requestId: string;
  documentUrl: string;
  documentName: string;
  uploadedAt: string;
  uploadedBy: string;
  submissionNotes?: string;
}

export interface PublishingDocument {
  id: string;
  requestId: string;
  internalUrl: string;
  externalUrl: string;
  documentName: string;
  publishedAt: string;
  publishedBy: string;
}

// Bulletin Call Status Types
export type BulletinCallStatus = 
  | 'Call Draft'
  | 'Call Pending'
  | 'Call Open'
  | 'Call Closed';

// Bulletin Submission Status Types
export type BulletinSubmissionStatus = 
  | 'Pending Call'
  | 'Call Open'
  | 'Submitted'
  | 'Pending Review'
  | 'Under Review'
  | 'Reviewed'
  | 'Pending Director Review'
  | 'Under Director Review'
  | 'Editing Pending'
  | 'Editing In Progress'
  | 'Accepted'
  | 'Inserted into Bulletin'
    // New Design & Layout Statuses
  | 'Layout In Progress'
  | 'Internal Approval Pending'
  | 'Under Internal Approval'
  | 'Pending CEO Approval'
  | 'Under CEO Approval'
  | 'Approved – Final Submission';

export interface BulletinCall {
  id: string;
  title: string;
  callNumber: string;
  description: string;
  objectives: string;
  scope: string;
  targetAudience: string;
  submissionDeadline: string;
  eligibilityCriteria: string;
  evaluationCriteria: string;
  expectedOutcomes: string;
  budget: string;
  contactPerson: string;
  contactEmail: string;
  attachments: BulletinAttachment[];
  status: BulletinCallStatus;
  createdBy: string;
  createdAt: string;
  targetApplicantRole: AppRole;
}

export interface BulletinSubmission {
  id: string;
  callId: string;
  call: BulletinCall;
  applicantId: string;
  applicantName: string;
  applicantRole: AppRole;
  submissionTitle: string;
  submissionDescription: string;
  submissionDocument: {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  };
  additionalNotes?: string;
  status: BulletinSubmissionStatus;
  reviewStatus?: string; // New column for review status
  submittedAt: string;
  acceptedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComments?: string;
  evaluations?: BulletinEvaluation[];
  editedSubmission?: EditedSubmission;
    designDocument?: {  // Add this
    id: string;
    documentUrl: string;
    documentName: string;
    uploadedAt: string;
    uploadedBy: string;
    designNotes?: string;
  };
}

export interface BulletinAttachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}




// Add new interface for review evaluations
export interface BulletinEvaluation {
  id: string;
  submissionId: string;
  reviewerRole: AppRole;
  reviewerName: string;
  checklist: EvaluationChecklist[];
  recommendation: 'recommend' | 'not_recommend';
  comments?: string;
  submittedAt: string;
}

// Add new interface for edited submission
export interface EditedSubmission {
  id: string;
  submissionId: string;
  editedDocument: {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  };
  editNotes?: string;
  editedBy: string;
  editedAt: string;
  approvedForBulletin: boolean;
}

// Add these new types for External Research Applications

// External Application Status Types
export type ExternalApplicationStatus = 
  | 'Draft'
  | 'Submitted'
  | 'Pending Directors Review'
  | 'Under Directors Review'
  | 'Link Generation Pending'
  | 'Link Generation In Progress'
  | 'Application Link Sent'
  | 'Under DD Review'
  | 'Pending Review Director'
  | 'Under Review Director'
  | 'Pending CEO Approval'
  | 'Under CEO Approval'
  | 'Approved';



// Update the ExternalApplication interface to include additionalNotes
export interface ExternalApplication {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  applicantDetails: {
    name: string;
    email: string;
    role: AppRole;
    businessUnit: string;
  };
  researchPurpose: {
    problemStatement: string;
    researchQuestion: string;
    expectedOutcomes: string;
    methodology: string;
  };
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  status: ExternalApplicationStatus;
  allocatedTo?: string;
  linkGenerated?: {
    url: string;
    generatedAt: string;
    expiresAt: string;
  };
  completedForm?: {
    documentUrl: string;
    uploadedAt: string;
  };
  additionalNotes?: string;  // Add this line
  evaluations?: ExternalApplicationEvaluation[];
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalApplicationEvaluation {
  id: string;
  applicationId: string;
  reviewerRole: AppRole;
  reviewerName: string;
  checklist: EvaluationChecklist[];
  recommendation: 'recommend' | 'not_recommend' | 'approve' | 'decline';
  comments?: string;
  allocatedTo?: string;
  submittedAt: string;
}

// Learner Enrolment Status Types
export type LearnerEnrolmentStatus = 
  | 'Draft'
  | 'Submitted'
  | 'Gate Evaluation Pending'
  | 'Gate Evaluation In Progress'
  | 'Gate Evaluation Completed'
  | 'Pending Indicator Champion Review'
  | 'Under Indicator Champion Review'
  | 'Approved'
  | 'Allocated to QA'
  | 'Pending QP Allocation'
  | 'Allocated to QP'
  | 'Plans & Reports Pending'
  | 'Plans & Reports Submitted'
  | 'Plans Consolidated'
  | 'Site Visit Pending'
  | 'Site Visit Scheduled'
  | 'Site Visit Completed'
   | 'SDP Gate Check Pending'
  | 'SDP Gate Check Completed'
  | 'Pending QA SP Validation'
  | 'Under QA SP Validation'
  | 'QA SP Validated'
  | 'Ready for Allocation'
    | 'Pending Quarterly Allocation'
  | 'Quarterly Allocation In Progress'
  | 'Allocation Populated'
  | 'Allocated for Monitoring'
    | 'Allocated for Monitoring'
  | 'Monitoring Plan Pending'
  | 'Monitoring Plan Submitted'
  | 'SDP Evidence Pending'
  | 'SDP Evidence Submitted'
  | 'Monitoring Report Pending'
  | 'Monitoring Report Completed'
   | 'Quarterly Report Pending'
  | 'Quarterly Report Submitted'
  | 'Pending Verification'
  | 'Under Verification'
  | 'Verified'
  | 'Pending Monthly Update'
  | 'Monthly Update In Progress'
  | 'Monthly Update Submitted'
  | 'Completed';

// Update LearnerEnrolment interface
export interface LearnerEnrolment {
  id: string;
  enrolmentId: string;
  learnerDetails: {
    firstName: string;
    lastName: string;
    idNumber: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  };
  qualification: {
    name: string;
    code: string;
    nqfLevel: string;
    credits: number;
  };
  enrolmentDetails: {
    startDate: string;
    endDate: string;
    learningProgramme: string;
    deliveryMode: string;
  };
  supportingDocuments: Array<{
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  gateEvaluation?: {
    status: 'passed' | 'failed' | 'pending';
    reportUrl?: string;
    generatedAt?: string;
    checklistResults?: Array<{
      criteria: string;
      isMet: boolean;
      comments?: string;
    }>;
  };
  indicatorChampionReview?: {
    reviewedBy?: string;
    reviewedAt?: string;
    checklist: Array<{
      criteriaId: string;
      criteriaName: string;
      isMet: boolean;
      comments?: string;
    }>;
    decision: 'approved' | 'rejected';
    comments?: string;
    confirmationLetterUrl?: string;
    sentAt?: string;
  };
  allocation?: {
    allocatedTo?: string;
    allocatedAt?: string;
    allocationNotes?: string;
  };
  status: LearnerEnrolmentStatus;
  submittedBy: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
    qpAllocation?: {
    allocatedTo?: string;
    allocatedAt?: string;
    allocationNotes?: string;
    quarterlyPeriod?: string; // e.g., "Q1 2024"
  };
  
  // Plans & Reports
  plansReports?: {
    documentUrl?: string;
    documentName?: string;
    uploadedAt?: string;
    uploadedBy?: string;
    submittedAt?: string;
    notes?: string;
  };
  
  // Consolidated Plans
  consolidatedPlans?: {
    documentUrl?: string;
    documentName?: string;
    uploadedAt?: string;
    uploadedBy?: string;
    sharedAt?: string;
    sharedWith?: string[];
    notes?: string;
  };
  
  // Site Visit
   siteVisit?: {
    scheduledDate?: string;
    scheduledTime?: string;
    venue?: string;
    status?: 'pending' | 'scheduled' | 'completed';
    reportUrl?: string;
    notes?: string;
    completedAt?: string;
    report?: LearnerSiteVisitReport; // Use the new interface
  };
     quarterlyAllocation?: {
    quarter: string;
    allocatedBy?: string;
    allocatedAt?: string;
    populatedBy?: string;
    populatedAt?: string;
    confirmedBy?: string;
    confirmedAt?: string;
    populatedData?: string;  // Add this field
    status: 'pending' | 'populated' | 'confirmed';
    notes?: string;
  };
    // Monitoring fields
  monitoringPlan?: {
    documentUrl?: string;
    documentName?: string;
    uploadedAt?: string;
    uploadedBy?: string;
    notes?: string;
  };
  
  sdpEvidence?: {
    documentUrl?: string;
    documentName?: string;
    uploadedAt?: string;
    uploadedBy?: string;
    notes?: string;
  };
  
  monitoringReport?: {
    documentUrl?: string;
    documentName?: string;
    uploadedAt?: string;
    uploadedBy?: string;
    evaluationChecklist?: MonitoringEvaluationItem[];
    summary?: string;
    recommendations?: string;
    overallRating?: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement';
    submittedAt?: string;
    notes?: string;
  };
    // Historical Qualifications fields
  quarterlyReport?: {
    documentUrl?: string;
    documentName?: string;
    uploadedAt?: string;
    uploadedBy?: string;
    quarter?: string;
    year?: string;
    notes?: string;
  };
  
  verifiedAllocation?: {
    documentUrl?: string;
    documentName?: string;
    verifiedAt?: string;
    verifiedBy?: string;
    allocatedPercentage?: number;
    notes?: string;
  };
  
  monthlyUpdate?: {
    documentUrl?: string;
    documentName?: string;
    uploadedAt?: string;
    uploadedBy?: string;
    month?: string;
    year?: string;
    updateNotes?: string;
  };
}

export interface LearnerEnrolmentEvaluation {
  id: string;
  enrolmentId: string;
  reviewerRole: AppRole;
  reviewerName: string;
  checklist: EvaluationChecklist[];
  decision: 'approve' | 'reject';
  comments?: string;
  submittedAt: string;
}


export interface LearnerSiteVisitReport {
  id: string;
  conductedBy: string;
  conductedAt: string;
  checklist: Array<{
    id: string;
    criteria: string;
    description: string;
    isMet: boolean;
    comments: string;
    evidenceIds: string[];
  }>;
  evidence: Array<{
    id: string;
    type: 'photo' | 'document';
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    description: string;
  }>;
  summary: string;
  recommendations: string;
  overallCompliance: 'compliant' | 'partially_compliant' | 'non_compliant';
  riskLevel: 'low' | 'medium' | 'high';
  nextSteps: string;
}

// Monitoring Evaluation Item Interface
export interface MonitoringEvaluationItem {
  id: string;
  criteria: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comments: string;
}

// types/agenda.types.ts
// types/agenda.types.ts
export interface AgendaItem {
  id: string;
  name: string;
  type: 'internal' | 'external';
  plannedTime: { start: string; end: string };
  actualTime?: { start: string; end: string };
  plannedCost: number;
  actualCost?: number;
  additionalItems?: string[];
}

export interface AgendaReview {
  reviewedBy: string;
  reviewedAt: Date;
  reviewRole: string;
  comments?: string;
  minutesDocument?: {
    name: string;
    url: string;
    uploadedAt: Date;
  };
  decision?: 'approve' | 'reject';
}

export interface Agenda {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'forum_review' | 'chief_director_review' | 'ceo_approval_pending' | 'approved' | 'rejected';
  items: AgendaItem[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByRole: string;
  submittedAt?: Date;
  submittedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
    rejectionStage?: 'forum_review' | 'chief_director_review' | 'ceo_approval'; // Add this line
  forumReview?: AgendaReview;
  chiefDirectorReview?: AgendaReview;
  ceoApproval?: AgendaReview;
}

export interface ProjectTask {
  id: string;
  name: string;
  description: string;
  responsiblePerson: string;
  responsiblePersonName: string;
 evidence?: {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string; // base64
};
  outcome?: string;
  plannedTime: { start: string; end: string };
  plannedCost: number;
  actualTime?: { start?: string; end?: string }; // Made properties optional
  actualCost?: number;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  type: MilestoneType;
  description: string;
  outcome?: string;
  plannedTime: { start: string; end: string };
  plannedCost: number;
  actualTime?: { start?: string; end?: string }; // Made properties optional
  actualCost?: number;
  tasks: ProjectTask[];
  status: MilestoneStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  agendaId: string;
  agendaItemId: string;
  name: string;
  description: string;
  milestones: ProjectMilestone[];
  status: ProjectStatus;
  actualStartDate?: Date;
  actualEndDate?: Date;
  actualCost?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  
  // External project information
  isExternal?: boolean;
  companyName?: string;
  torDocument?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string;
    uploadedAt: Date;
    uploadedBy: string;
  };
  slaDocument?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string;
    uploadedAt: Date;
    uploadedBy: string;
  };

  finalReport?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string;
    uploadedAt: Date;
    uploadedBy: string;
  };

  reportSubmittedAt?: Date;
  reportSubmittedBy?: string;

  finalReview?: {
    reviewedBy: string;
    reviewedAt: Date;
    reviewRole: string;
    comments?: string;
    decision: 'approve' | 'reject';
  };
}

// types/audit.types.ts
export interface AuditEntry {
  id: string;
  timestamp: Date;
  objectType: 'agenda' | 'project' | 'milestone' | 'task' | 'report';
  objectId: string;
  objectName: string;
  actor: string;
  actorRole: string;
  action: 'created' | 'updated' | 'submitted' | 'approved' | 'rejected' | 'started' | 'completed' | 'uploaded';
  summary: string;
  description?: string;
  details?: any;
  metadata?: {
    agendaId?: string;
    agendaName?: string;
    projectId?: string;
    projectName?: string;
    milestoneId?: string;
    milestoneName?: string;
    taskId?: string;
    taskName?: string;
    previousStatus?: string;
    newStatus?: string;
    comments?: string;
  };
}