// screens/subtabs/ApplicationIntakeAllocation.tsx
import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Eye, FileText, CheckCircle, Clock, Play, XCircle, User } from 'lucide-react';
import type { ExternalApplication, ExternalApplicationEvaluation, ExternalApplicationStatus } from '@/types';

const ApplicationIntakeAllocation = () => {
  // Use externalApplications directly from AppContext
  const { externalApplications, setExternalApplications, currentUser } = useApp();
  const [selectedApplication, setSelectedApplication] = useState<ExternalApplication | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('application');
  const [allocatedTo, setAllocatedTo] = useState('');
  const [evaluationComments, setEvaluationComments] = useState('');

  // Filter applications pending director review (status is 'Submitted')
 const pendingApplications = externalApplications.filter(app => 
  app.status === 'Submitted' || app.status === 'Under Directors Review'
);

  const viewApplication = (application: ExternalApplication) => {
    setSelectedApplication(application);
    setIsViewModalOpen(true);
    setActiveTab('application');
    setAllocatedTo('');
    setEvaluationComments('');
  };

  const handleStartReview = () => {
    if (!selectedApplication) return;
    
    const updatedApplications = externalApplications.map(app => 
      app.id === selectedApplication.id
        ? { ...app, status: 'Under Directors Review' as ExternalApplicationStatus }
        : app
    );
    setExternalApplications(updatedApplications);
    setSelectedApplication({ ...selectedApplication, status: 'Under Directors Review' as ExternalApplicationStatus });
  };

  const handleAllocateAndSubmit = () => {
    if (!selectedApplication || !allocatedTo) return;
    
    const evaluation: ExternalApplicationEvaluation = {
      id: `eval-${Date.now()}`,
      applicationId: selectedApplication.id,
      reviewerRole: currentUser.role,
      reviewerName: currentUser.name,
      checklist: [],
      recommendation: 'recommend',
      comments: evaluationComments,
      allocatedTo: allocatedTo,
      submittedAt: new Date().toISOString(),
    };
    
    const existingEvaluations = selectedApplication.evaluations || [];
    
    const updatedApplications = externalApplications.map(app => 
      app.id === selectedApplication.id
        ? { 
            ...app, 
            evaluations: [...existingEvaluations, evaluation],
            allocatedTo: allocatedTo,
            status: 'Link Generation Pending' as ExternalApplicationStatus
          }
        : app
    );
    setExternalApplications(updatedApplications);
    setIsViewModalOpen(false);
  };

  const getStatusBadge = (status: ExternalApplicationStatus) => {
    const statusConfig: Record<ExternalApplicationStatus, { color: string; icon: React.ReactNode; label: string }> = {
      'Draft': { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Draft' },
      'Submitted': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Director Review' },
      'Pending Directors Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Director Review' },
      'Under Directors Review': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Director Review' },
      'Link Generation Pending': { color: 'bg-purple-100 text-purple-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Allocated - Pending Link' },
      'Link Generation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Link Generation In Progress' },
      'Application Link Sent': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Link Sent' },
      'Under DD Review': { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under DD Review' },
      'Pending Review Director': { color: 'bg-purple-100 text-purple-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Director' },
      'Under Review Director': { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Director Review' },
      'Pending CEO Approval': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending CEO' },
      'Under CEO Approval': { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under CEO Approval' },
      'Approved': { color: 'bg-green-600 text-white', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Approved' },
    };
    const config = statusConfig[status] || statusConfig['Submitted'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const canStartReview = () => {
    return currentUser.role === 'Research Director' && 
           selectedApplication?.status === 'Submitted';
  };

  const canAllocate = () => {
    return currentUser.role === 'Research Director' && 
           selectedApplication?.status === 'Under Directors Review';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Application Intake & Allocation</h3>
      <p className="text-gray-600">Manage incoming applications and allocate them to reviewers.</p>
      
      {pendingApplications.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Pending Applications</h4>
            <p className="text-sm text-gray-500">Applications ready for review and allocation</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.applicationId}</TableCell>
                  <TableCell>{app.title}</TableCell>
                  <TableCell>{app.applicantDetails.name}</TableCell>
                  <TableCell>{new Date(app.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewApplication(app)}>
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
          No pending applications. Submitted applications will appear here.
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Review & Allocation</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="application">Application Details</TabsTrigger>
                <TabsTrigger value="intake">Intake & Allocation</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Application Details */}
              <TabsContent value="application" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Application ID</Label><p className="font-medium">{selectedApplication.applicationId}</p></div>
                    <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedApplication.title}</p></div>
                    <div><Label className="text-sm text-gray-500">Applicant</Label><p className="font-medium">{selectedApplication.applicantDetails.name}</p></div>
                    <div><Label className="text-sm text-gray-500">Submitted Date</Label><p className="font-medium">{new Date(selectedApplication.submittedAt).toLocaleString()}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg"><p>{selectedApplication.description}</p></div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Research Purpose</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Problem Statement</Label><p className="mt-1">{selectedApplication.researchPurpose.problemStatement}</p></div>
                    <div><Label className="text-sm text-gray-500">Research Question</Label><p className="mt-1">{selectedApplication.researchPurpose.researchQuestion}</p></div>
                    <div><Label className="text-sm text-gray-500">Expected Outcomes</Label><p className="mt-1">{selectedApplication.researchPurpose.expectedOutcomes}</p></div>
                    <div><Label className="text-sm text-gray-500">Methodology</Label><p className="mt-1">{selectedApplication.researchPurpose.methodology}</p></div>
                  </div>
                </div>

                {selectedApplication.attachments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {selectedApplication.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a href={attachment.url} target="_blank" className="text-blue-600 hover:underline">{attachment.name}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 2: Intake & Allocation */}
              <TabsContent value="intake" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Intake & Allocation</h3>
                  
                  {canStartReview() && (
                    <div className="space-y-4">
                      <Button onClick={handleStartReview} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Review
                      </Button>
                      <p className="text-sm text-gray-500">Once started, you can review and allocate the application to a Deputy Director.</p>
                    </div>
                  )}
                  
                  {canAllocate() && (
                    <div className="space-y-4">
                      <div>
                        <Label>Allocate to Deputy Director *</Label>
                        <select 
                          className="w-full p-2 border rounded-md mt-1"
                          value={allocatedTo}
                          onChange={(e) => setAllocatedTo(e.target.value)}
                        >
                          <option value="">Select Deputy Director</option>
                          <option value="David Deputy">David Deputy</option>
                          <option value="Sarah Deputy">Sarah Deputy</option>
                          <option value="Michael Deputy">Michael Deputy</option>
                        </select>
                      </div>
                      <div>
                        <Label>Allocation Notes</Label>
                        <Textarea
                          value={evaluationComments}
                          onChange={(e) => setEvaluationComments(e.target.value)}
                          placeholder="Add notes about this allocation..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleAllocateAndSubmit} disabled={!allocatedTo} className="bg-green-600 hover:bg-green-700">
                        <User className="h-4 w-4 mr-2" />
                        Allocate & Submit
                      </Button>
                    </div>
                  )}
                  
                  {selectedApplication.status === 'Link Generation Pending' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Application Allocated</p>
                      <p className="text-sm text-gray-600">Allocated to: {selectedApplication.allocatedTo}</p>
                      <p className="text-sm text-gray-600">Status: Link Generation Pending - Deputy Director will generate the application link.</p>
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

export default ApplicationIntakeAllocation;