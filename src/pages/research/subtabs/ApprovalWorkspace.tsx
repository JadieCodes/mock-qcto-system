// screens/subtabs/ApprovalWorkspace.tsx
import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, FileText, CheckCircle, Clock, Play, XCircle } from 'lucide-react';
import type { BulletinSubmission, BulletinEvaluation } from '@/types';

const ApprovalWorkspace = () => {
  const { bulletinSubmissions, setBulletinSubmissions, currentUser } = useApp();
  const [selectedSubmission, setSelectedSubmission] = useState<BulletinSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('call');
  
  // Approval evaluation state
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [evaluationComments, setEvaluationComments] = useState('');

  const approvalChecklist = [
    { id: 'design_quality', label: 'Design Quality', description: 'Is the design professional and visually appealing?' },
    { id: 'layout_accuracy', label: 'Layout Accuracy', description: 'Does the layout follow the required format?' },
    { id: 'content_accuracy', label: 'Content Accuracy', description: 'Is all content accurate and error-free?' },
    { id: 'brand_compliance', label: 'Brand Compliance', description: 'Does the design comply with brand guidelines?' },
    { id: 'readability', label: 'Readability', description: 'Is the content easy to read and understand?' },
  ];

  // Filter submissions ready for approval
  const pendingApprovalSubmissions = bulletinSubmissions.filter(sub => 
    sub.status === 'Internal Approval Pending' || 
    sub.status === 'Under Internal Approval' ||
    sub.status === 'Pending CEO Approval' ||
    sub.status === 'Under CEO Approval'
  );

  const viewSubmission = (submission: BulletinSubmission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
    setActiveTab('call');
    setChecklistState({});
    setEvaluationComments('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      'Internal Approval Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Internal Approval' },
      'Under Internal Approval': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Internal Approval' },
      'Pending CEO Approval': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending CEO Approval' },
      'Under CEO Approval': { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under CEO Approval' },
      'Approved – Final Submission': { color: 'bg-green-600 text-white', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Approved' },
    };
    const config = statusConfig[status] || statusConfig['Internal Approval Pending'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Director Actions
  const handleStartDirectorApproval = () => {
    if (!selectedSubmission) return;
    
    console.log('Start Director Approval clicked. Current status:', selectedSubmission.status);
    
    if (selectedSubmission.status === 'Internal Approval Pending') {
      const updatedSubmissions = bulletinSubmissions.map(sub => 
        sub.id === selectedSubmission.id
          ? { ...sub, status: 'Under Internal Approval' as any }
          : sub
      );
      setBulletinSubmissions(updatedSubmissions);
      // Also update the selected submission
      setSelectedSubmission({ ...selectedSubmission, status: 'Under Internal Approval' as any });
      console.log('Status updated to Under Internal Approval');
    } else {
      console.log('Cannot start review. Current status is not Internal Approval Pending');
    }
  };

  const handleDirectorApproval = (decision: 'approve' | 'decline') => {
    if (!selectedSubmission) return;
    
    const evaluation: BulletinEvaluation = {
      id: `eval-${Date.now()}`,
      submissionId: selectedSubmission.id,
      reviewerRole: currentUser.role,
      reviewerName: currentUser.name,
      checklist: approvalChecklist.map(item => ({
        criteriaId: item.id,
        criteriaName: item.label,
        isMet: checklistState[item.id] || false,
        comments: evaluationComments,
      })),
      recommendation: decision === 'approve' ? 'recommend' : 'not_recommend',
      submittedAt: new Date().toISOString(),
    };
    
    const existingEvaluations = selectedSubmission.evaluations || [];
    
    const updatedSubmissions = bulletinSubmissions.map(sub => 
      sub.id === selectedSubmission.id
        ? { 
            ...sub, 
            evaluations: [...existingEvaluations, evaluation],
            status: decision === 'approve' ? 'Pending CEO Approval' as any : 'Internal Approval Pending' as any
          }
        : sub
    );
    setBulletinSubmissions(updatedSubmissions);
    setIsViewModalOpen(false);
  };

  // CEO Actions
  const handleStartCEOApproval = () => {
    if (!selectedSubmission) return;
    
    console.log('Start CEO Approval clicked. Current status:', selectedSubmission.status);
    
    if (selectedSubmission.status === 'Pending CEO Approval') {
      const updatedSubmissions = bulletinSubmissions.map(sub => 
        sub.id === selectedSubmission.id
          ? { ...sub, status: 'Under CEO Approval' as any }
          : sub
      );
      setBulletinSubmissions(updatedSubmissions);
      setSelectedSubmission({ ...selectedSubmission, status: 'Under CEO Approval' as any });
      console.log('Status updated to Under CEO Approval');
    } else {
      console.log('Cannot start CEO approval. Current status is not Pending CEO Approval');
    }
  };

  const handleCEOApproval = (decision: 'approve' | 'decline') => {
    if (!selectedSubmission) return;
    
    const evaluation: BulletinEvaluation = {
      id: `eval-${Date.now()}`,
      submissionId: selectedSubmission.id,
      reviewerRole: currentUser.role,
      reviewerName: currentUser.name,
      checklist: approvalChecklist.map(item => ({
        criteriaId: item.id,
        criteriaName: item.label,
        isMet: checklistState[item.id] || false,
        comments: evaluationComments,
      })),
      recommendation: decision === 'approve' ? 'recommend' : 'not_recommend',
      submittedAt: new Date().toISOString(),
    };
    
    const existingEvaluations = selectedSubmission.evaluations || [];
    
    const updatedSubmissions = bulletinSubmissions.map(sub => 
      sub.id === selectedSubmission.id
        ? { 
            ...sub, 
            evaluations: [...existingEvaluations, evaluation],
            status: decision === 'approve' ? 'Approved – Final Submission' as any : 'Pending CEO Approval' as any
          }
        : sub
    );
    setBulletinSubmissions(updatedSubmissions);
    setIsViewModalOpen(false);
  };

  const canStartDirectorApproval = () => {
    const canStart = currentUser.role === 'Research Director' && 
           selectedSubmission?.status === 'Internal Approval Pending';
    console.log('canStartDirectorApproval:', canStart, 'Role:', currentUser.role, 'Status:', selectedSubmission?.status);
    return canStart;
  };

  const canEvaluateDirector = () => {
    return currentUser.role === 'Research Director' && 
           selectedSubmission?.status === 'Under Internal Approval';
  };

  const canStartCEOApproval = () => {
    return currentUser.role === 'Research Chief Executive Officer' && 
           selectedSubmission?.status === 'Pending CEO Approval';
  };

  const canEvaluateCEO = () => {
    return currentUser.role === 'Research Chief Executive Officer' && 
           selectedSubmission?.status === 'Under CEO Approval';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Approval Workspace</h3>
      <p className="text-gray-600">Manage approvals and quality checks.</p>
      
      {pendingApprovalSubmissions.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Pending Approval</h4>
            <p className="text-sm text-gray-500">Submissions awaiting approval</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call Number</TableHead>
                <TableHead>Call Title</TableHead>
                <TableHead>Submission Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApprovalSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.call.callNumber}</TableCell>
                  <TableCell>{submission.call.title}</TableCell>
                  <TableCell>{submission.submissionTitle || '-'}</TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewSubmission(submission)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No submissions pending approval. Designed layouts will appear here.
        </div>
      )}

      {/* Approval Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approval Workspace</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="flex w-full flex-wrap gap-1">
                <TabsTrigger value="call">Call for Submission</TabsTrigger>
                <TabsTrigger value="submission">Submission Details</TabsTrigger>
                <TabsTrigger value="design">Design & Layout</TabsTrigger>
                <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
                <TabsTrigger value="approval">Approval Workspace</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Call Details */}
              <TabsContent value="call" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Call Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Call Number</Label><p className="font-medium">{selectedSubmission.call.callNumber}</p></div>
                    <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedSubmission.call.title}</p></div>
                    <div><Label className="text-sm text-gray-500">Target Audience</Label><p className="font-medium">{selectedSubmission.call.targetAudience}</p></div>
                    <div><Label className="text-sm text-gray-500">Deadline</Label><p className="font-medium">{new Date(selectedSubmission.call.submissionDeadline).toLocaleString()}</p></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg"><p>{selectedSubmission.call.description}</p></div>
                </div>
                {selectedSubmission.call.attachments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {selectedSubmission.call.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a href={attachment.url} target="_blank" className="text-blue-600 hover:underline">{attachment.name}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 2: Submission Details */}
              <TabsContent value="submission" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Submission Details</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Submission Title</Label><p className="mt-1">{selectedSubmission.submissionTitle}</p></div>
                    <div><Label className="text-sm text-gray-500">Description</Label><p className="mt-1">{selectedSubmission.submissionDescription}</p></div>
                    <div>
                      <Label className="text-sm text-gray-500">Submission Document</Label>
                      <div className="mt-1">
                        <a href={selectedSubmission.submissionDocument.url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {selectedSubmission.submissionDocument.name}
                        </a>
                      </div>
                    </div>
                    {selectedSubmission.editedSubmission && (
                      <div className="mt-4">
                        <Label className="text-sm text-gray-500">Edited Version</Label>
                        <a href={selectedSubmission.editedSubmission.editedDocument.url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                          <FileText className="h-4 w-4" />
                          {selectedSubmission.editedSubmission.editedDocument.name}
                        </a>
                      </div>
                    )}
                    {selectedSubmission.designDocument && (
                      <div className="mt-4">
                        <Label className="text-sm text-gray-500">Designed Layout</Label>
                        <a href={selectedSubmission.designDocument.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                          <FileText className="h-4 w-4" />
                          {selectedSubmission.designDocument.documentName}
                        </a>
                        {selectedSubmission.designDocument.designNotes && (
                          <p className="text-sm text-gray-500 mt-1">Design Notes: {selectedSubmission.designDocument.designNotes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab 3: Design & Layout */}
              <TabsContent value="design" className="space-y-6 py-4">
                {selectedSubmission.designDocument ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Design & Layout</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <a href={selectedSubmission.designDocument.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedSubmission.designDocument.documentName}
                      </a>
                      {selectedSubmission.designDocument.designNotes && (
                        <p className="text-sm text-gray-600 mt-2">Design Notes: {selectedSubmission.designDocument.designNotes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Uploaded by: {selectedSubmission.designDocument.uploadedBy} on {new Date(selectedSubmission.designDocument.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No design document available for this submission.
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 4: Evaluations */}
              <TabsContent value="evaluations" className="space-y-6 py-4">
                {selectedSubmission.evaluations && selectedSubmission.evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {selectedSubmission.evaluations.map((evalItem) => (
                      <div key={evalItem.id} className={`p-4 rounded-lg ${
                        evalItem.reviewerRole === 'Research Deputy Director' ? 'bg-green-50' : 
                        evalItem.reviewerRole === 'Research Director' ? 'bg-blue-50' : 'bg-purple-50'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{evalItem.reviewerRole} Evaluation</span>
                          <span className="text-xs text-gray-500">{new Date(evalItem.submittedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm mb-2">Recommendation: <span className={evalItem.recommendation === 'recommend' ? 'text-green-600' : 'text-red-600'}>
                          {evalItem.recommendation === 'recommend' ? '✓ Approve' : '✗ Decline'}
                        </span></p>
                        <div className="space-y-1">
                          {evalItem.checklist.map((item) => (
                            <div key={item.criteriaId} className="flex items-center gap-2 text-sm">
                              {item.isMet ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                              <span>{item.criteriaName}</span>
                            </div>
                          ))}
                        </div>
                        {evalItem.comments && <p className="text-sm text-gray-600 mt-2">Comments: {evalItem.comments}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No evaluations available.</div>
                )}
              </TabsContent>
              
              {/* Tab 5: Approval Workspace */}
              <TabsContent value="approval" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Approval Workspace</h3>
                  
                  {/* Director Approval Section */}
                  {canStartDirectorApproval() && (
                    <div className="space-y-4">
                      <Button onClick={handleStartDirectorApproval} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Internal Approval
                      </Button>
                      <p className="text-sm text-gray-500">Once started, the status will change to "Under Internal Approval". You can close the modal and come back later.</p>
                    </div>
                  )}
                  
                  {selectedSubmission.status === 'Under Internal Approval' && !selectedSubmission.evaluations?.some(e => e.reviewerRole === 'Research Director') && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800 font-medium">Review in Progress</p>
                      <p className="text-sm text-gray-600">Please complete the evaluation checklist below.</p>
                    </div>
                  )}
                  
                  {canEvaluateDirector() && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Director Approval Checklist</h4>
                      <div className="space-y-3">
                        {approvalChecklist.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={item.id}
                              checked={checklistState[item.id] || false}
                              onCheckedChange={(checked) => setChecklistState(prev => ({ ...prev, [item.id]: checked === true }))}
                            />
                            <div className="flex-1">
                              <Label htmlFor={item.id} className="font-medium cursor-pointer">{item.label}</Label>
                              <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>Comments</Label>
                        <Textarea
                          value={evaluationComments}
                          onChange={(e) => setEvaluationComments(e.target.value)}
                          placeholder="Add your approval comments..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => handleDirectorApproval('decline')} className="border-red-300 text-red-600 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                        <Button onClick={() => handleDirectorApproval('approve')} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* CEO Approval Section */}
                  {canStartCEOApproval() && (
                    <div className="space-y-4 border-t pt-4">
                      <Button onClick={handleStartCEOApproval} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start CEO Approval
                      </Button>
                      <p className="text-sm text-gray-500">Once started, the status will change to "Under CEO Approval". You can close the modal and come back later.</p>
                    </div>
                  )}
                  
                  {selectedSubmission.status === 'Under CEO Approval' && !selectedSubmission.evaluations?.some(e => e.reviewerRole === 'Research Chief Executive Officer') && (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-orange-800 font-medium">CEO Review in Progress</p>
                      <p className="text-sm text-gray-600">Please complete the evaluation checklist below.</p>
                    </div>
                  )}
                  
                  {canEvaluateCEO() && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">CEO Approval Checklist</h4>
                      <div className="space-y-3">
                        {approvalChecklist.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={item.id}
                              checked={checklistState[item.id] || false}
                              onCheckedChange={(checked) => setChecklistState(prev => ({ ...prev, [item.id]: checked === true }))}
                            />
                            <div className="flex-1">
                              <Label htmlFor={item.id} className="font-medium cursor-pointer">{item.label}</Label>
                              <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>Comments</Label>
                        <Textarea
                          value={evaluationComments}
                          onChange={(e) => setEvaluationComments(e.target.value)}
                          placeholder="Add your final approval comments..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => handleCEOApproval('decline')} className="border-red-300 text-red-600 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                        <Button onClick={() => handleCEOApproval('approve')} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {selectedSubmission.status === 'Approved – Final Submission' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Submission Fully Approved</p>
                      <p className="text-sm text-gray-600">This submission has been approved and is ready for publishing.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalWorkspace;