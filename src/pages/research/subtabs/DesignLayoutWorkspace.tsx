// screens/subtabs/DesignLayoutWorkspace.tsx
import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Eye, FileText, Upload, CheckCircle, Clock, Play, XCircle } from 'lucide-react';
import type { BulletinSubmission } from '@/types';

const DesignLayoutWorkspace = () => {
  const { bulletinSubmissions, setBulletinSubmissions, currentUser } = useApp();
  const [selectedSubmission, setSelectedSubmission] = useState<BulletinSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('call');
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designNotes, setDesignNotes] = useState('');
  const [isSubmittingDesign, setIsSubmittingDesign] = useState(false);

  // Filter submissions ready for design layout (Accepted with Inserted into Bulletin OR Layout In Progress)
  const designReadySubmissions = bulletinSubmissions.filter(sub => 
    (sub.status === 'Accepted' && sub.reviewStatus === 'Inserted into Bulletin') || 
    sub.status === 'Layout In Progress'
  );

  const viewSubmission = (submission: BulletinSubmission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
    setActiveTab('call');
    setDesignFile(null);
    setDesignNotes('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      'Accepted': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Accepted' },
      'Layout In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Layout In Progress' },
      'Internal Approval Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Approval' },
    };
    const config = statusConfig[status] || statusConfig['Accepted'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const handleStartDesign = () => {
    if (!selectedSubmission) return;
    
    const updatedSubmissions = bulletinSubmissions.map(sub => 
      sub.id === selectedSubmission.id
        ? { ...sub, status: 'Layout In Progress' as any }
        : sub
    );
    setBulletinSubmissions(updatedSubmissions);
    setSelectedSubmission({ ...selectedSubmission, status: 'Layout In Progress' as any });
  };

  const handleSubmitDesign = () => {
    if (!selectedSubmission || !designFile) return;
    
    setIsSubmittingDesign(true);
    
    // Create design document record
    const designDocument = {
      id: `design-${Date.now()}`,
      documentUrl: URL.createObjectURL(designFile),
      documentName: designFile.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
      designNotes: designNotes,
    };
    
    const updatedSubmissions = bulletinSubmissions.map(sub => 
      sub.id === selectedSubmission.id
        ? { 
            ...sub, 
            designDocument,
            status: 'Internal Approval Pending' as any,
            reviewStatus: undefined // Remove the Inserted into Bulletin status
          }
        : sub
    );
    setBulletinSubmissions(updatedSubmissions);
    setIsViewModalOpen(false);
    setIsSubmittingDesign(false);
  };

  const canStartDesign = () => {
    return currentUser.role === 'Research Graphic Designer' && 
           selectedSubmission?.status === 'Accepted' &&
           selectedSubmission?.reviewStatus === 'Inserted into Bulletin';
  };

  const canSubmitDesign = () => {
    return currentUser.role === 'Research Graphic Designer' && 
           selectedSubmission?.status === 'Layout In Progress';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Design & Layout Workspace</h3>
      <p className="text-gray-600">Manage bulletin design and layout configurations.</p>
      
      {designReadySubmissions.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Design & Layout Workspace</h4>
            <p className="text-sm text-gray-500">Submissions ready for layout design or currently being designed</p>
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
              {designReadySubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.call.callNumber}</TableCell>
                  <TableCell>{submission.call.title}</TableCell>
                  <TableCell>{submission.submissionTitle || '-'}</TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewSubmission(submission)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {submission.status === 'Layout In Progress' ? 'Continue Layout' : 'Manage Layout'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No submissions ready for design layout. Accepted submissions will appear here.
        </div>
      )}

      {/* Design Layout Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Design & Layout Workspace</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="call">Call for Submission</TabsTrigger>
                <TabsTrigger value="submission">Submission Details</TabsTrigger>
                <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
                <TabsTrigger value="design">Design & Layout</TabsTrigger>
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
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab 3: Evaluations */}
              <TabsContent value="evaluations" className="space-y-6 py-4">
                {selectedSubmission.evaluations && selectedSubmission.evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {selectedSubmission.evaluations.map((evalItem) => (
                      <div key={evalItem.id} className={`p-4 rounded-lg ${evalItem.reviewerRole === 'Research Deputy Director' ? 'bg-green-50' : 'bg-blue-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{evalItem.reviewerRole} Evaluation</span>
                          <span className="text-xs text-gray-500">{new Date(evalItem.submittedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm mb-2">Recommendation: <span className={evalItem.recommendation === 'recommend' ? 'text-green-600' : 'text-red-600'}>
                          {evalItem.recommendation === 'recommend' ? '✓ Recommend' : '✗ Not Recommend'}
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
              
              {/* Tab 4: Design & Layout */}
              <TabsContent value="design" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Design & Layout</h3>
                  
                  {!selectedSubmission.designDocument && canStartDesign() && (
                    <div className="space-y-4">
                      <Button onClick={handleStartDesign} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Layout Design
                      </Button>
                    </div>
                  )}
                  
                  {canSubmitDesign() && (
                    <div className="space-y-4">
                      <div>
                        <Label>Upload Designed Layout</Label>
                        <Input
                          type="file"
                          onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
                          className="mt-1"
                          accept=".pdf,.doc,.docx,.indd,.ai"
                        />
                      </div>
                      <div>
                        <Label>Design Notes</Label>
                        <Textarea
                          value={designNotes}
                          onChange={(e) => setDesignNotes(e.target.value)}
                          placeholder="Add notes about the design and layout..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleSubmitDesign} disabled={!designFile} className="bg-green-600 hover:bg-green-700">
                        <Upload className="h-4 w-4 mr-2" />
                        Submit for Internal Approval
                      </Button>
                    </div>
                  )}
                  
                  {selectedSubmission.status === 'Internal Approval Pending' && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-yellow-800 font-medium">✓ Design Submitted</p>
                      <p className="text-sm text-gray-600">Awaiting internal approval from Director and CEO.</p>
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

export default DesignLayoutWorkspace;