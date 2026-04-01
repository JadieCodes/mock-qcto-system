// screens/subtabs/PublishingHandover.tsx
import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Eye, FileText, CheckCircle ,XCircle} from 'lucide-react';
import type { BulletinSubmission } from '@/types';

const PublishingHandover = () => {
  const { bulletinSubmissions } = useApp();
  const [selectedSubmission, setSelectedSubmission] = useState<BulletinSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('call');

  // Filter submissions ready for publishing
  const publishingReadySubmissions = bulletinSubmissions.filter(sub => 
    sub.status === 'Approved – Final Submission'
  );

  const viewSubmission = (submission: BulletinSubmission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
    setActiveTab('call');
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved – Ready for Publishing
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Publishing / Handover</h3>
      <p className="text-gray-600">Manage final publishing and handover processes.</p>
      
      {publishingReadySubmissions.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Ready for Publishing</h4>
            <p className="text-sm text-gray-500">Fully approved submissions ready for publishing</p>
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
              {publishingReadySubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.call.callNumber}</TableCell>
                  <TableCell>{submission.call.title}</TableCell>
                  <TableCell>{submission.submissionTitle || '-'}</TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewSubmission(submission)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No submissions ready for publishing. Approved submissions will appear here.
        </div>
      )}

      {/* Publishing Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publishing / Handover</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="call">Call for Submission</TabsTrigger>
                <TabsTrigger value="submission">Submission Details</TabsTrigger>
                <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
                <TabsTrigger value="design">Design & Layout</TabsTrigger>
                <TabsTrigger value="approval">Approvals</TabsTrigger>
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
                      <Label className="text-sm text-gray-500">Final Document</Label>
                      <div className="mt-1">
                        {selectedSubmission.designDocument ? (
                          <a href={selectedSubmission.designDocument.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {selectedSubmission.designDocument.documentName}
                          </a>
                        ) : selectedSubmission.editedSubmission ? (
                          <a href={selectedSubmission.editedSubmission.editedDocument.url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {selectedSubmission.editedSubmission.editedDocument.name}
                          </a>
                        ) : (
                          <a href={selectedSubmission.submissionDocument.url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {selectedSubmission.submissionDocument.name}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab 3: Evaluations */}
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
                        <p className="text-sm mb-2">Decision: <span className={evalItem.recommendation === 'recommend' ? 'text-green-600' : 'text-red-600'}>
                          {evalItem.recommendation === 'recommend' ? '✓ Approved' : '✗ Declined'}
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
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No design document available.</div>
                )}
              </TabsContent>
              
              {/* Tab 5: Approvals */}
              <TabsContent value="approval" className="space-y-6 py-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 font-medium">✓ Fully Approved</p>
                  <p className="text-sm text-gray-600">This submission has received all required approvals and is ready for publishing.</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublishingHandover;