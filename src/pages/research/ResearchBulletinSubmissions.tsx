// screens/ResearchBulletinSubmissions.tsx
import React, { useState } from 'react';
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
import { Eye, FileText, Upload, CheckCircle, Clock, Play } from 'lucide-react';
import type { BulletinCall, BulletinSubmission } from '@/types';

const ResearchBulletinSubmissions = () => {
  const { bulletinCalls, setBulletinCalls, bulletinSubmissions, setBulletinSubmissions, currentUser } = useApp();
  const [selectedCall, setSelectedCall] = useState<BulletinCall | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('call');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isAccepted, setIsAccepted] = useState(false);

  // Filter calls that are pending or open and target the current user's role
  // AND the user hasn't already submitted to this call
  const availableCalls = bulletinCalls.filter(call => 
    (call.status === 'Call Pending' || call.status === 'Call Open') && 
    call.targetApplicantRole === currentUser.role &&
    // Exclude calls that the user has already submitted to
    !bulletinSubmissions.some(sub => sub.callId === call.id && sub.applicantId === currentUser.name && sub.status === 'Submitted')
  );

  // Get user's submitted submissions (only those that are fully submitted)
  const userSubmissions = bulletinSubmissions.filter(sub => 
    sub.applicantId === currentUser.name && sub.status === 'Submitted'
  );

 const viewCall = (call: BulletinCall) => {
  // Check if user has already submitted to this call
  const existingSubmission = bulletinSubmissions.find(
    sub => sub.callId === call.id && sub.applicantId === currentUser.name
  );
  
  const isSubmitted = existingSubmission?.status === 'Submitted';
  const isAcceptedCall = existingSubmission && !isSubmitted;
  
  setIsAccepted(!!isAcceptedCall);
  setSelectedCall(call);
  setIsViewModalOpen(true);
  setActiveTab('call');
  
  // If there's an existing submission, populate the form with its data
  if (existingSubmission && existingSubmission.status === 'Submitted') {
    setSubmissionTitle(existingSubmission.submissionTitle);
    setSubmissionDescription(existingSubmission.submissionDescription);
    setSubmissionNotes(existingSubmission.additionalNotes || '');
    setSubmissionFile(null); // Can't pre-populate file input
  } else {
    setSubmissionFile(null);
    setSubmissionTitle('');
    setSubmissionDescription('');
    setSubmissionNotes('');
  }
};

  const handleAcceptCall = () => {
    if (!selectedCall) return;
    
    // Update the call status to 'Call Open' (only if it's not already open)
    if (selectedCall.status !== 'Call Open') {
      setBulletinCalls(prev => 
        prev.map(call => 
          call.id === selectedCall.id ? { ...call, status: 'Call Open' } : call
        )
      );
    }
    
    // Create a submission record to track that this user is working on this call
    const newSubmission: BulletinSubmission = {
      id: Date.now().toString(),
      callId: selectedCall.id,
      call: { ...selectedCall, status: 'Call Open' },
      applicantId: currentUser.name,
      applicantName: currentUser.name,
      applicantRole: currentUser.role,
      submissionTitle: '',
      submissionDescription: '',
      submissionDocument: { id: '', name: '', url: '', uploadedAt: '' },
      status: 'Call Open' as const,
      submittedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
    };
    
    setBulletinSubmissions(prev => [...prev, newSubmission]);
    setIsAccepted(true);
    
    // Update the selected call reference
    setSelectedCall({ ...selectedCall, status: 'Call Open' });
  };

  const handleSubmitSubmission = () => {
    if (!selectedCall || !submissionFile || !submissionTitle) return;
    
    // Update the submission record with the submitted data
    const updatedSubmissions = bulletinSubmissions.map(sub => 
      sub.callId === selectedCall.id && sub.applicantId === currentUser.name && sub.status !== 'Submitted'
        ? {
            ...sub,
            submissionTitle: submissionTitle,
            submissionDescription: submissionDescription,
            submissionDocument: {
              id: Math.random().toString(),
              name: submissionFile.name,
              url: URL.createObjectURL(submissionFile),
              uploadedAt: new Date().toISOString(),
            },
            additionalNotes: submissionNotes,
            status: 'Submitted' as const,
            submittedAt: new Date().toISOString(),
          }
        : sub
    );
    setBulletinSubmissions(updatedSubmissions);
    
    // Optionally, you can also update the call status if needed
    // setBulletinCalls(prev => 
    //   prev.map(call => 
    //     call.id === selectedCall.id ? { ...call, status: 'Closed' } : call
    //   )
    // );
    
    setIsViewModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      'Call Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Call' },
      'Call Open': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Call Open' },
      'Submitted': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Submitted' },
    };
    const config = statusConfig[status] || statusConfig['Call Pending'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Research Bulletin Submissions</h2>
        <p className="text-gray-600 mt-1">View and respond to calls for submissions</p>
      </div>

      {/* Available Calls Table - Shows calls that are open and user hasn't submitted to yet */}
      {availableCalls.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-medium text-gray-900">Available Calls for Submissions</h3>
            <p className="text-sm text-gray-500">Calls that are available for you to respond to</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="font-medium">{call.callNumber}</TableCell>
                  <TableCell>{call.title}</TableCell>
                  <TableCell>{new Date(call.submissionDeadline).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewCall(call)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* My Submissions Table - Shows fully submitted submissions */}
      {userSubmissions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-medium text-gray-900">My Submissions</h3>
            <p className="text-sm text-gray-500">Track your submitted applications</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call Number</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Submission Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.call.callNumber}</TableCell>
                  <TableCell>{submission.call.title}</TableCell>
                  <TableCell>{submission.submissionTitle || '-'}</TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewCall(submission.call)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Show message if no calls available */}
      {availableCalls.length === 0 && userSubmissions.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          No calls available at this time.
        </div>
      )}

      {/* View Call Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call for Submission Details</DialogTitle>
          </DialogHeader>
          
          {selectedCall && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="call">Call for Submission</TabsTrigger>
                <TabsTrigger value="submission">Compile Submission</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Call Details */}
              <TabsContent value="call" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Call Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Call Number</Label><p className="font-medium">{selectedCall.callNumber}</p></div>
                    <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedCall.title}</p></div>
                    <div><Label className="text-sm text-gray-500">Deadline</Label><p className="font-medium">{new Date(selectedCall.submissionDeadline).toLocaleString()}</p></div>
                    <div><Label className="text-sm text-gray-500">Target Audience</Label><p className="font-medium">{selectedCall.targetAudience}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg"><p>{selectedCall.description}</p></div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Objectives & Scope</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Objectives</Label><p className="mt-1">{selectedCall.objectives}</p></div>
                    <div><Label className="text-sm text-gray-500">Scope</Label><p className="mt-1">{selectedCall.scope}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Criteria</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Eligibility</Label><p className="mt-1">{selectedCall.eligibilityCriteria}</p></div>
                    <div><Label className="text-sm text-gray-500">Evaluation</Label><p className="mt-1">{selectedCall.evaluationCriteria}</p></div>
                  </div>
                </div>

                {selectedCall.attachments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {selectedCall.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a href={attachment.url} target="_blank" className="text-blue-600 hover:underline">{attachment.name}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Only show Accept button if not accepted yet and call is still Pending */}
                {!isAccepted && selectedCall.status === 'Call Pending' && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleAcceptCall} className="bg-green-600 hover:bg-green-700">
                      <Play className="h-4 w-4 mr-2" />
                      Accept Call & Start Submission
                    </Button>
                  </div>
                )}
                
                {/* Show message if already accepted */}
                {isAccepted && selectedCall.status === 'Call Open' && (
                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <p className="text-blue-800 font-medium">✓ Call Accepted</p>
                    <p className="text-sm text-gray-600">Please go to the "Compile Submission" tab to complete your submission.</p>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 2: Compile Submission */}
           {/* Tab 2: Compile Submission */}
<TabsContent value="submission" className="space-y-6 py-4">
  {(() => {
    // Check if this submission has already been submitted
    const existingSubmission = bulletinSubmissions.find(
      sub => sub.callId === selectedCall.id && sub.applicantId === currentUser.name
    );
    const isSubmitted = existingSubmission?.status === 'Submitted';
    
    if (isSubmitted) {
      // Show the submitted information
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Submitted Submission</h3>
          
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <p className="text-green-800 font-medium mb-2">✓ Submission Completed</p>
            <p className="text-sm text-gray-600">Your submission has been successfully submitted.</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Submission Title</Label>
            <p className="mt-1 p-3 bg-gray-50 rounded-lg">{existingSubmission.submissionTitle}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Submission Description</Label>
            <p className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">{existingSubmission.submissionDescription}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Submitted Document</Label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
              <a href={existingSubmission.submissionDocument.url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {existingSubmission.submissionDocument.name}
              </a>
            </div>
          </div>
          
          {existingSubmission.additionalNotes && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Additional Notes</Label>
              <p className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">{existingSubmission.additionalNotes}</p>
            </div>
          )}
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Submitted Date</Label>
            <p className="mt-1 p-3 bg-gray-50 rounded-lg">{new Date(existingSubmission.submittedAt).toLocaleString()}</p>
          </div>
        </div>
      );
    } else if (isAccepted) {
      // Show the submission form
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Compile Submission</h3>
          
          <div>
            <Label>Submission Title *</Label>
            <Input
              value={submissionTitle}
              onChange={(e) => setSubmissionTitle(e.target.value)}
              placeholder="Enter a title for your submission"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Submission Description</Label>
            <Textarea
              value={submissionDescription}
              onChange={(e) => setSubmissionDescription(e.target.value)}
              placeholder="Describe your submission..."
              rows={4}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Upload Submission Document *</Label>
            <Input
              type="file"
              onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
              className="mt-1"
              accept=".pdf,.doc,.docx"
            />
          </div>
          
          <div>
            <Label>Additional Notes</Label>
            <Textarea
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              placeholder="Any additional notes or comments..."
              rows={3}
              className="mt-1"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitSubmission}
              disabled={!submissionTitle || !submissionFile}
              className="bg-green-600 hover:bg-green-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Submit Submission
            </Button>
          </div>
        </div>
      );
    } else {
      // Show message to accept first
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Please accept the call first to start your submission.</p>
          <Button onClick={() => setActiveTab('call')} className="mt-4">
            Go to Call Details
          </Button>
        </div>
      );
    }
  })()}
</TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResearchBulletinSubmissions;