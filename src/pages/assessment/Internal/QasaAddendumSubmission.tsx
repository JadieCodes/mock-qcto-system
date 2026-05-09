// C:\Users\jadek\Desktop\my-cert-project\src\pages\assessment\Internal\QasaAddendumSubmission.tsx

import React, { useState, useEffect } from 'react';
import { Eye, FileText, CheckCircle, FileCheck, Upload, Paperclip, Send, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { QasaSubmission } from '../External/ExternalQasaAddendumSubmission';

const STORAGE_KEY = 'qasa_addendum_submissions';

// Map AppRole to workflow role
const getWorkflowRole = (appRole: string): 'asd' | 'dd' | 'ceo' | null => {
  if (appRole === 'ASD') return 'asd';
  if (appRole === 'Deputy Director') return 'dd';
  if (appRole === 'CEO') return 'ceo';
  return null;
};

// Role-based action visibility
const canUploadLetter = (workflowRole: string | null, status: string) => {
  return workflowRole === 'asd' && status === 'pending';
};

const canEvaluateAsDD = (workflowRole: string | null, status: string) => {
  return workflowRole === 'dd' && status === 'submitted_to_dd';
};

const canEvaluateAsCEO = (workflowRole: string | null, status: string) => {
  return workflowRole === 'ceo' && status === 'sent_to_ceo';
};

export function QasaAddendumSubmission() {
  const { currentRole } = useApp();
  const workflowRole = getWorkflowRole(currentRole);
  
  const [submissions, setSubmissions] = useState<QasaSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<QasaSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'upload' | 'dd_evaluate' | 'ceo_evaluate' | null>(null);
  const [uploadedLetter, setUploadedLetter] = useState<File | null>(null);
  const [ddChecklist, setDdChecklist] = useState<{ [key: string]: boolean }>({});
  const [ddNotes, setDdNotes] = useState('');
  const [ceoChecklist, setCeoChecklist] = useState<{ [key: string]: boolean }>({});
  const [ceoNotes, setCeoNotes] = useState('');

  const checklistItems = [
    'Document is complete and legible',
    'Qualification title matches submission',
    'NQF Level is correctly stated',
    'Applicant details are accurate',
    'Supporting documents are attached',
    'Letter format meets requirements',
    'Submission is within the required timeframe'
  ];

  useEffect(() => {
    loadSubmissions();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadSubmissions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadSubmissions, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadSubmissions = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
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
      // New evaluation fields
      evaluationStatus: sub.evaluationStatus || 'pending_asd_evaluation',
      evaluationChecklist: sub.evaluationChecklist || null,
      evaluationReportName: sub.evaluationReportName || null,
      ddEvaluationReview: sub.ddEvaluationReview || null,
      ddReviewNotes: sub.ddReviewNotes || '',
      iacPresentationName: sub.iacPresentationName || null,
      iacResolutionName: sub.iacResolutionName || null,
      iacApprovalNotes: sub.iacApprovalNotes || '',
      ceoFinalChecklist: sub.ceoFinalChecklist || null,
      ceoFinalNotes: sub.ceoFinalNotes || '',
      outcomeLetterName: sub.outcomeLetterName || null,
    }));
    setSubmissions(initialized);
  }
};

  const updateSubmission = (updatedSubmission: QasaSubmission) => {
    const updatedSubmissions = submissions.map(sub => 
      sub.id === updatedSubmission.id ? updatedSubmission : sub
    );
    setSubmissions(updatedSubmissions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = getToastMessage(updatedSubmission.acknowledgementStatus);
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getToastMessage = (status: string): string => {
    switch(status) {
      case 'submitted_to_dd': return 'Acknowledgement Letter submitted to Deputy Director';
      case 'dd_reviewed': return 'Evaluation saved. You can now send to CEO';
      case 'sent_to_ceo': return 'Letter sent to CEO for approval';
      case 'ceo_approved': return 'Evaluation saved. You can now approve';
      case 'sent_to_quality_partner': return 'Letter approved and sent to Quality Partner';
      default: return 'Action completed successfully';
    }
  };

  const getDocumentIcon = (docStatus: string) => {
    if (docStatus === 'auto-attached') {
      return <CheckCircle className="h-3 w-3 text-green-600" />;
    }
    return <FileCheck className="h-3 w-3 text-blue-600" />;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'pending': { label: 'Pending Upload', variant: 'secondary' },
      'submitted_to_dd': { label: 'With Deputy Director', variant: 'outline' },
      'dd_reviewed': { label: 'DD Evaluated', variant: 'default' },
      'sent_to_ceo': { label: 'With CEO', variant: 'outline' },
      'ceo_approved': { label: 'CEO Approved', variant: 'default' },
      'sent_to_quality_partner': { label: 'Completed', variant: 'default' },
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleUploadLetter = () => {
    if (!selectedSubmission || !uploadedLetter) return;
    const updated = {
      ...selectedSubmission,
      acknowledgementLetterName: uploadedLetter.name,
      acknowledgementStatus: 'submitted_to_dd' as const,
    };
    updateSubmission(updated);
    setIsActionModalOpen(false);
    setUploadedLetter(null);
    setIsViewModalOpen(false);
  };

  const handleDDEvaluation = () => {
    if (!selectedSubmission) return;
    const updated = {
      ...selectedSubmission,
      ddEvaluationChecklist: ddChecklist,
      ddRecommendationNotes: ddNotes,
      acknowledgementStatus: 'dd_reviewed' as const,
    };
    updateSubmission(updated);
    setIsActionModalOpen(false);
    setIsViewModalOpen(false);
  };

  const handleSendToCEO = () => {
    if (!selectedSubmission) return;
    const updated = {
      ...selectedSubmission,
      acknowledgementStatus: 'sent_to_ceo' as const,
    };
    updateSubmission(updated);
    setIsViewModalOpen(false);
  };

  const handleCEOEvaluation = () => {
    if (!selectedSubmission) return;
    const updated = {
      ...selectedSubmission,
      ceoEvaluationChecklist: ceoChecklist,
      ceoApprovalNotes: ceoNotes,
      acknowledgementStatus: 'ceo_approved' as const,
    };
    updateSubmission(updated);
    setIsActionModalOpen(false);
    setIsViewModalOpen(false);
  };

 // In the handleApproveAndSend function in QasaAddendumSubmission.tsx, update it to:

const handleApproveAndSend = () => {
  if (!selectedSubmission) return;
  const updated = {
    ...selectedSubmission,
    acknowledgementStatus: 'sent_to_quality_partner' as const,
    movedToEvaluation: true,
    evaluationStatus: 'pending_asd_evaluation' as const, // Add this line
  };
  updateSubmission(updated);
  setIsViewModalOpen(false);
};

  const openActionModal = (type: 'upload' | 'dd_evaluate' | 'ceo_evaluate', submission: QasaSubmission) => {
    setSelectedSubmission(submission);
    setActionType(type);
    
    if (type === 'dd_evaluate') {
      if (submission.ddEvaluationChecklist) {
        setDdChecklist(submission.ddEvaluationChecklist);
      } else {
        const initialChecklist: { [key: string]: boolean } = {};
        checklistItems.forEach(item => { initialChecklist[item] = false; });
        setDdChecklist(initialChecklist);
      }
      setDdNotes(submission.ddRecommendationNotes || '');
    } else if (type === 'ceo_evaluate') {
      if (submission.ceoEvaluationChecklist) {
        setCeoChecklist(submission.ceoEvaluationChecklist);
      } else {
        const initialChecklist: { [key: string]: boolean } = {};
        checklistItems.forEach(item => { initialChecklist[item] = false; });
        setCeoChecklist(initialChecklist);
      }
      setCeoNotes(submission.ceoApprovalNotes || '');
    }
    
    setIsActionModalOpen(true);
  };

  // Get role display name
  const getRoleDisplayName = () => {
    switch(workflowRole) {
      case 'asd': return 'ASD';
      case 'dd': return 'Deputy Director';
      case 'ceo': return 'CEO';
      default: return currentRole || 'Unknown';
    }
  };

  // Get role description
  const getRoleDescription = () => {
    switch(workflowRole) {
      case 'asd': return 'You can upload acknowledgement letters and start QASA Application Evaluation';
      case 'dd': return 'You can review, evaluate, and send acknowledgement letters to CEO';
      case 'ceo': return 'You can review, evaluate, and approve acknowledgement letters';
      default: return 'Select a role from the dropdown to begin';
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Indicator - Shows current role from selector */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800">
              Logged in as: <strong>{getRoleDisplayName()}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">{getRoleDescription()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-600">Use the role selector in the header to switch roles</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">QASA Addendum Submission</h2>
        <p className="mt-1 text-sm text-gray-600">Manage QASA addendum submissions and review workflow</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Submissions</p>
          <p className="text-2xl font-bold">{submissions.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Pending Upload</p>
          <p className="text-2xl font-bold">{submissions.filter(s => s.acknowledgementStatus === 'pending').length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Under Review</p>
          <p className="text-2xl font-bold">{submissions.filter(s => s.acknowledgementStatus === 'submitted_to_dd' || s.acknowledgementStatus === 'sent_to_ceo').length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold">{submissions.filter(s => s.acknowledgementStatus === 'sent_to_quality_partner').length}</p>
        </div>
      </div>

      {/* All Submissions Table */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Submissions</h3>
        
        {submissions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No submissions yet</p>
            <p className="text-sm text-gray-400">Quality Partners will submit applications here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Qualification Title</TableHead>
                  <TableHead>Qualification ID</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Gate Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission, idx) => (
                  <TableRow key={submission.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{submission.qualificationTitle}</TableCell>
                    <TableCell>{submission.qualificationId}</TableCell>
                    <TableCell>{submission.applicantName}</TableCell>
                    <TableCell>{submission.organisationName}</TableCell>
                    <TableCell>{new Date(submission.submissionDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={submission.gateStatus === 'passed' ? 'default' : 'destructive'}>
                        {submission.gateStatus === 'passed' ? 'Passed' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(submission.acknowledgementStatus)}</TableCell>
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
        )}
      </div>

      {/* View Details Modal with Actions */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>Complete submission information and available actions</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              {/* Submission Details */}
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
                <div>
                  <Label className="text-gray-500">Workflow Status</Label>
                  {getStatusBadge(selectedSubmission.acknowledgementStatus)}
                </div>
                {selectedSubmission.acknowledgementLetterName && (
                  <div>
                    <Label className="text-gray-500">Acknowledgement Letter</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Paperclip className="h-3 w-3" />
                      <span className="text-sm">{selectedSubmission.acknowledgementLetterName}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedSubmission.notes && (
                <div>
                  <Label className="text-gray-500">Notes / Comments</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg mt-1">{selectedSubmission.notes}</p>
                </div>
              )}

              {/* Documents */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-2 block">Attached Documents</Label>
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Curriculum</span>
                    </div>
                    <span className="text-sm">{selectedSubmission.documents.curriculum}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Assessment Specification</span>
                    </div>
                    <span className="text-sm">{selectedSubmission.documents.assessmentSpecification}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">SAQA Document</span>
                    </div>
                    <span className="text-sm">{selectedSubmission.documents.saqaDocument}</span>
                  </div>
                </div>
              </div>

              {/* DD Recommendation (if available) */}
              {selectedSubmission.ddRecommendationNotes && (
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold mb-2 block">Deputy Director Recommendation</Label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedSubmission.ddRecommendationNotes}</p>
                  </div>
                </div>
              )}

              {/* CEO Approval Notes (if available) */}
              {selectedSubmission.ceoApprovalNotes && (
                <div className="border-t pt-4">
                  <Label className="text-base font-semibold mb-2 block">CEO Approval Notes</Label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedSubmission.ceoApprovalNotes}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons based on Role and Status */}
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">Available Actions</Label>
                <div className="flex flex-wrap gap-3">
                  {canUploadLetter(workflowRole, selectedSubmission.acknowledgementStatus) && (
                    <Button onClick={() => openActionModal('upload', selectedSubmission)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Process Acknowledgement Letter
                    </Button>
                  )}
                  
                  {canEvaluateAsDD(workflowRole, selectedSubmission.acknowledgementStatus) && (
                    <>
                      <Button onClick={() => openActionModal('dd_evaluate', selectedSubmission)}>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Review & Recommend Letter
                      </Button>
                    </>
                  )}
                  
                  {workflowRole === 'dd' && selectedSubmission.acknowledgementStatus === 'dd_reviewed' && (
                    <Button onClick={handleSendToCEO}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Letter to CEO
                    </Button>
                  )}
                  
                  {canEvaluateAsCEO(workflowRole, selectedSubmission.acknowledgementStatus) && (
                    <>
                      <Button onClick={() => openActionModal('ceo_evaluate', selectedSubmission)}>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Review & Approve Letter
                      </Button>
                    </>
                  )}
                  
                  {workflowRole === 'ceo' && selectedSubmission.acknowledgementStatus === 'ceo_approved' && (
                    <Button onClick={handleApproveAndSend} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Send to Quality Partner
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Modal (Upload/Evaluate) */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'upload' && 'Process Acknowledgement Letter'}
              {actionType === 'dd_evaluate' && 'Deputy Director — Evaluation Checklist'}
              {actionType === 'ceo_evaluate' && 'CEO — Evaluation Checklist'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'upload' && 'Upload the acknowledgement letter for this submission'}
              {actionType === 'dd_evaluate' && 'Review and evaluate the acknowledgement letter before sending to CEO'}
              {actionType === 'ceo_evaluate' && 'Review and approve the acknowledgement letter before sending to Quality Partner'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === 'upload' && (
              <div className="space-y-2">
                <Label>Upload Acknowledgement Letter *</Label>
                <Input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => setUploadedLetter(e.target.files?.[0] || null)}
                />
                {uploadedLetter && (
                  <p className="text-sm text-green-600">✓ {uploadedLetter.name}</p>
                )}
              </div>
            )}

            {(actionType === 'dd_evaluate' || actionType === 'ceo_evaluate') && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Evaluation Checklist</Label>
                  {checklistItems.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={item}
                        checked={actionType === 'dd_evaluate' ? ddChecklist[item] : ceoChecklist[item]}
                        onCheckedChange={(checked) => {
                          if (actionType === 'dd_evaluate') {
                            setDdChecklist(prev => ({ ...prev, [item]: checked === true }));
                          } else {
                            setCeoChecklist(prev => ({ ...prev, [item]: checked === true }));
                          }
                        }}
                      />
                      <Label htmlFor={item} className="text-sm font-normal">{item}</Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label>{actionType === 'dd_evaluate' ? 'Recommendation Notes' : 'Approval Notes'}</Label>
                  <Textarea
                    value={actionType === 'dd_evaluate' ? ddNotes : ceoNotes}
                    onChange={(e) => {
                      if (actionType === 'dd_evaluate') setDdNotes(e.target.value);
                      else setCeoNotes(e.target.value);
                    }}
                    placeholder={actionType === 'dd_evaluate' ? 'Enter your recommendation notes...' : 'Enter your approval notes...'}
                    rows={4}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (actionType === 'upload') handleUploadLetter();
              else if (actionType === 'dd_evaluate') handleDDEvaluation();
              else if (actionType === 'ceo_evaluate') handleCEOEvaluation();
            }} disabled={actionType === 'upload' && !uploadedLetter}>
              {actionType === 'upload' && 'Submit to Deputy Director'}
              {actionType === 'dd_evaluate' && 'Save Evaluation & Send to CEO'}
              {actionType === 'ceo_evaluate' && 'Save Evaluation & Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}