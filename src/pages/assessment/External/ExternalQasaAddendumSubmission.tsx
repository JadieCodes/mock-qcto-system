// C:\Users\jadek\Desktop\my-cert-project\src\pages\assessment\External\ExternalQasaAddendumSubmission.tsx

import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, X, Eye, Download, AlertCircle, Plus, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Shared storage key
const STORAGE_KEY = 'qasa_addendum_submissions';

// Update the QasaSubmission interface - change File to string for localStorage compatibility
export interface QasaSubmission {
  id: string;
  qualificationTitle: string;
  qualificationId: string;
  nqfLevel: string;
  applicantName: string;
  applicantEmail: string;
  organisationName: string;
  submissionDate: string;
  notes: string;
  gateStatus: 'passed' | 'failed';
  documents: {
    curriculum: string;
    assessmentSpecification: string;
    saqaDocument: string;
  };
  status: 'Pending Review';
  acknowledgementLetter: string | null;
  acknowledgementLetterName: string | null;
  acknowledgementStatus: 'pending' | 'uploaded' | 'submitted_to_dd' | 
                          'dd_reviewed' | 'sent_to_ceo' | 
                          'ceo_approved' | 'sent_to_quality_partner';
  ddEvaluationChecklist: { [checkItem: string]: boolean } | null;
  ddRecommendationNotes: string;
  ceoEvaluationChecklist: { [checkItem: string]: boolean } | null;
  ceoApprovalNotes: string;
  movedToEvaluation: boolean;
  // New evaluation fields
  evaluationStatus: 'pending_asd_evaluation' | 'asd_evaluated_negative' | 'asd_evaluated_positive' | 
                    'with_deputy_director' | 'deputy_director_reviewed' | 'with_iac' | 
                    'iac_approved' | 'with_ceo_final' | 'ceo_final_approved' | 'completed';
  evaluationChecklist: { [key: string]: boolean } | null;
  evaluationReportName: string | null;
  ddEvaluationReview: { [key: string]: boolean } | null;
  ddReviewNotes: string;
  iacPresentationName: string | null;
  iacResolutionName: string | null;
  iacApprovalNotes: string;
  ceoFinalChecklist: { [key: string]: boolean } | null;
  ceoFinalNotes: string;
  outcomeLetterName: string | null;
    approvalStatus: 'pending_asd_draft' | 'asd_drafted' | 'with_deputy_director_approval' | 
                   'deputy_director_approved' | 'with_ceo_approval' | 'ceo_approved' | 'completed_sent_to_qp';
  approvalLetterName: string | null;
  ddApprovalChecklist: { [key: string]: boolean } | null;
  ddApprovalNotes: string;
  ceoApprovalChecklist: { [key: string]: boolean } | null;
  
  finalApprovalLetterName: string | null;
}

export default function ExternalQasaAddendumSubmission() {
  const [submissions, setSubmissions] = useState<QasaSubmission[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGateCheckOpen, setIsGateCheckOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAckLetterModalOpen, setIsAckLetterModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<QasaSubmission | null>(null);
  const [selectedAckSubmission, setSelectedAckSubmission] = useState<QasaSubmission | null>(null);
  const [gateCheckResult, setGateCheckResult] = useState<'passed' | 'failed' | null>(null);
  const [formData, setFormData] = useState({
    qualificationTitle: '',
    qualificationId: '',
    nqfLevel: '',
    applicantName: '',
    applicantEmail: '',
    organisationName: '',
    submissionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    curriculum: null as File | null,
    assessmentSpecification: null as File | null,
    saqaDocument: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load submissions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Initialize new fields for existing submissions if they don't exist
      const initialized = parsed.map((sub: any) => ({
        ...sub,
        acknowledgementLetter: sub.acknowledgementLetter || null,
        acknowledgementLetterName: sub.acknowledgementLetterName || null,
        acknowledgementStatus: sub.acknowledgementStatus || 'pending',
        ddEvaluationChecklist: sub.ddEvaluationChecklist || null,
        ddRecommendationNotes: sub.ddRecommendationNotes || '',
        ceoEvaluationChecklist: sub.ceoEvaluationChecklist || null,
        ceoApprovalNotes: sub.ceoApprovalNotes || '',
        movedToEvaluation: sub.movedToEvaluation || false,
      }));
      setSubmissions(initialized);
    }
  }, []);

  // Save submissions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  }, [submissions]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (type: keyof typeof uploadedFiles, file: File | null) => {
    setUploadedFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleGateCheck = (result: 'passed' | 'failed') => {
    setGateCheckResult(result);
    setIsGateCheckOpen(false);
  };

  const resetForm = () => {
    setFormData({
      qualificationTitle: '',
      qualificationId: '',
      nqfLevel: '',
      applicantName: '',
      applicantEmail: '',
      organisationName: '',
      submissionDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setUploadedFiles({
      curriculum: null,
      assessmentSpecification: null,
      saqaDocument: null,
    });
    setGateCheckResult(null);
  };

 const handleSubmit = () => {
  if (!gateCheckResult) return;

  // Validate failed gate check has all documents
  if (gateCheckResult === 'failed') {
    if (!uploadedFiles.curriculum || !uploadedFiles.assessmentSpecification || !uploadedFiles.saqaDocument) {
      alert('Please upload all required documents');
      return;
    }
  }

  const newSubmission: QasaSubmission = {
    id: Date.now().toString(),
    qualificationTitle: formData.qualificationTitle,
    qualificationId: formData.qualificationId,
    nqfLevel: formData.nqfLevel,
    applicantName: formData.applicantName,
    applicantEmail: formData.applicantEmail,
    organisationName: formData.organisationName,
    submissionDate: formData.submissionDate,
    notes: formData.notes,
    gateStatus: gateCheckResult,
    documents: gateCheckResult === 'passed' 
      ? {
          curriculum: 'auto-attached',
          assessmentSpecification: 'auto-attached',
          saqaDocument: 'auto-attached',
        }
      : {
          curriculum: uploadedFiles.curriculum?.name || '',
          assessmentSpecification: uploadedFiles.assessmentSpecification?.name || '',
          saqaDocument: uploadedFiles.saqaDocument?.name || '',
        },
    status: 'Pending Review',
    acknowledgementLetter: null,
    acknowledgementLetterName: null,
    acknowledgementStatus: 'pending',
    ddEvaluationChecklist: null,
    ddRecommendationNotes: '',
    ceoEvaluationChecklist: null,
    ceoApprovalNotes: '',
    movedToEvaluation: false,
    // New evaluation fields
    evaluationStatus: 'pending_asd_evaluation',
    evaluationChecklist: null,
    evaluationReportName: null,
    ddEvaluationReview: null,
    ddReviewNotes: '',
    iacPresentationName: null,
    iacResolutionName: null,
    iacApprovalNotes: '',
    ceoFinalChecklist: null,
    ceoFinalNotes: '',
    outcomeLetterName: null,
     approvalStatus: 'pending_asd_draft',
  approvalLetterName: null,
  ddApprovalChecklist: null,
  ddApprovalNotes: '',
  ceoApprovalChecklist: null,
  
  finalApprovalLetterName: null,
  };

  setSubmissions(prev => [newSubmission, ...prev]);
  setIsFormOpen(false);
  resetForm();
};

  const isSubmitEnabled = () => {
    if (!gateCheckResult) return false;
    if (gateCheckResult === 'failed') {
      return uploadedFiles.curriculum && uploadedFiles.assessmentSpecification && uploadedFiles.saqaDocument;
    }
    return true;
  };

  const handleViewLetter = (submission: QasaSubmission) => {
    setSelectedAckSubmission(submission);
    setIsAckLetterModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                QASA Addendum Submission
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Submit your QASA addendum documents and track the submission status.
              </p>
            </div>
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Application
            </Button>
          </div>
        </div>

        {/* Submissions Table - Only shows after first submission */}
        {submissions.length > 0 && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              My Submissions
            </h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Qualification Title</TableHead>
                    <TableHead>Qualification ID</TableHead>
                    <TableHead>NQF Level</TableHead>
                    <TableHead>Applicant Name</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Gate Status</TableHead>
                    <TableHead>Acknowledgement Letter</TableHead>
                    <TableHead>View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission, idx) => (
                    <TableRow key={submission.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{submission.qualificationTitle}</TableCell>
                      <TableCell>{submission.qualificationId}</TableCell>
                      <TableCell>{submission.nqfLevel}</TableCell>
                      <TableCell>{submission.applicantName}</TableCell>
                      <TableCell>{submission.organisationName}</TableCell>
                      <TableCell>{new Date(submission.submissionDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={submission.gateStatus === 'passed' ? 'default' : 'destructive'}>
                          {submission.gateStatus === 'passed' ? 'Passed' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {submission.acknowledgementStatus !== 'sent_to_quality_partner' ? (
                          <Badge variant="secondary">Pending</Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-600">
                              Received ✓
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewLetter(submission)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Letter
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* New Application Form Modal */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New QASA Addendum Application</DialogTitle>
              <DialogDescription>
                Fill in the details below to submit a new QASA addendum application.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Qualification Title *</Label>
                  <Input
                    value={formData.qualificationTitle}
                    onChange={(e) => handleInputChange('qualificationTitle', e.target.value)}
                    placeholder="Enter qualification title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qualification ID *</Label>
                  <Input
                    value={formData.qualificationId}
                    onChange={(e) => handleInputChange('qualificationId', e.target.value)}
                    placeholder="Enter qualification ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>NQF Level *</Label>
                  <Select value={formData.nqfLevel} onValueChange={(v) => handleInputChange('nqfLevel', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select NQF Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10].map(level => (
                        <SelectItem key={level} value={`Level ${level}`}>Level {level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Applicant Name *</Label>
                  <Input
                    value={formData.applicantName}
                    onChange={(e) => handleInputChange('applicantName', e.target.value)}
                    placeholder="Enter applicant name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Applicant Email *</Label>
                  <Input
                    type="email"
                    value={formData.applicantEmail}
                    onChange={(e) => handleInputChange('applicantEmail', e.target.value)}
                    placeholder="Enter applicant email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organisation Name *</Label>
                  <Input
                    value={formData.organisationName}
                    onChange={(e) => handleInputChange('organisationName', e.target.value)}
                    placeholder="Enter organisation name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Submission Date *</Label>
                  <Input
                    type="date"
                    value={formData.submissionDate}
                    onChange={(e) => handleInputChange('submissionDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes / Comments</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes or comments..."
                  rows={3}
                />
              </div>

              {/* Gate Evaluation Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Gate Evaluation Check</Label>
                  <Button
                    variant="outline"
                    onClick={() => setIsGateCheckOpen(true)}
                    disabled={gateCheckResult !== null}
                  >
                    Run Gate Evaluation Check
                  </Button>
                </div>

                {gateCheckResult === 'passed' && (
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Gate Check Passed - Documents will be auto-attached
                    </AlertDescription>
                  </Alert>
                )}

                {gateCheckResult === 'failed' && (
                  <Alert className="border-red-500 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Gate Check Failed — Please upload required documents
                    </AlertDescription>
                  </Alert>
                )}

                {/* Auto-attached documents for passed gate check */}
                {gateCheckResult === 'passed' && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <Label className="text-sm font-medium">Documents (Auto-attached)</Label>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span>Curriculum (Auto-attached)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span>Assessment Specification (Auto-attached)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span>SAQA Document (Auto-attached)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* File uploads for failed gate check */}
                {gateCheckResult === 'failed' && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <Label className="text-sm font-medium">Required Documents Upload</Label>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Upload Curriculum *</Label>
                        <Input
                          type="file"
                          onChange={(e) => handleFileUpload('curriculum', e.target.files?.[0] || null)}
                          accept=".pdf,.doc,.docx"
                        />
                        {uploadedFiles.curriculum && (
                          <p className="text-xs text-green-600">✓ {uploadedFiles.curriculum.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Upload Assessment Specification *</Label>
                        <Input
                          type="file"
                          onChange={(e) => handleFileUpload('assessmentSpecification', e.target.files?.[0] || null)}
                          accept=".pdf,.doc,.docx"
                        />
                        {uploadedFiles.assessmentSpecification && (
                          <p className="text-xs text-green-600">✓ {uploadedFiles.assessmentSpecification.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Upload SAQA Document *</Label>
                        <Input
                          type="file"
                          onChange={(e) => handleFileUpload('saqaDocument', e.target.files?.[0] || null)}
                          accept=".pdf,.doc,.docx"
                        />
                        {uploadedFiles.saqaDocument && (
                          <p className="text-xs text-green-600">✓ {uploadedFiles.saqaDocument.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isSubmitEnabled() || isSubmitting}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Submit QASA Application & Qualification Documentation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Gate Check Simulation Modal */}
        <Dialog open={isGateCheckOpen} onOpenChange={setIsGateCheckOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gate Evaluation Check</DialogTitle>
              <DialogDescription>
                Simulate the gate evaluation check for this application.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 py-4">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleGateCheck('failed')}
              >
                Fail
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={() => handleGateCheck('passed')}
              >
                Pass
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Submission Modal */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
              <DialogDescription>
                View complete submission information
              </DialogDescription>
            </DialogHeader>
            {selectedSubmission && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-gray-500">Qualification Title</Label>
                    <p className="font-medium">{selectedSubmission.qualificationTitle}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Qualification ID</Label>
                    <p className="font-medium">{selectedSubmission.qualificationId}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">NQF Level</Label>
                    <p className="font-medium">{selectedSubmission.nqfLevel}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Applicant Name</Label>
                    <p className="font-medium">{selectedSubmission.applicantName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Applicant Email</Label>
                    <p className="font-medium">{selectedSubmission.applicantEmail}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Organisation</Label>
                    <p className="font-medium">{selectedSubmission.organisationName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Submission Date</Label>
                    <p className="font-medium">{new Date(selectedSubmission.submissionDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Gate Status</Label>
                    <Badge variant={selectedSubmission.gateStatus === 'passed' ? 'default' : 'destructive'}>
                      {selectedSubmission.gateStatus === 'passed' ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </div>
                
                {selectedSubmission.notes && (
                  <div>
                    <Label className="text-gray-500">Notes</Label>
                    <p className="text-sm">{selectedSubmission.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Label className="text-base font-semibold mb-2 block">Documents</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Curriculum: </span>
                      <span className="text-sm font-medium">{selectedSubmission.documents.curriculum}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Assessment Specification: </span>
                      <span className="text-sm font-medium">{selectedSubmission.documents.assessmentSpecification}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">SAQA Document: </span>
                      <span className="text-sm font-medium">{selectedSubmission.documents.saqaDocument}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-gray-500">Application Status</Label>
                  <Badge variant="secondary" className="mt-1">{selectedSubmission.status}</Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Acknowledgement Letter Modal */}
        <Dialog open={isAckLetterModalOpen} onOpenChange={setIsAckLetterModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Acknowledgement Letter — Approved</DialogTitle>
              <DialogDescription>
                Approved acknowledgement letter from CEO
              </DialogDescription>
            </DialogHeader>
            {selectedAckSubmission && (
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-500">Qualification Title</Label>
                  <p className="font-medium">{selectedAckSubmission.qualificationTitle}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Applicant Name</Label>
                  <p className="font-medium">{selectedAckSubmission.applicantName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Uploaded Letter</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm">{selectedAckSubmission.acknowledgementLetterName}</span>
                  </div>
                </div>
                {selectedAckSubmission.ceoApprovalNotes && (
                  <div>
                    <Label className="text-gray-500">CEO Approval Notes</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{selectedAckSubmission.ceoApprovalNotes}</p>
                  </div>
                )}
                <div>
                  <Badge variant="default" className="bg-green-600">
                    Approved by CEO ✓
                  </Badge>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsAckLetterModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}