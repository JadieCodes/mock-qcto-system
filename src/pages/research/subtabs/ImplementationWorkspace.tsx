// screens/subtabs/ImplementationWorkspace.tsx
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
import { Eye, FileText, CheckCircle, XCircle } from 'lucide-react';
import type { ExternalApplication } from '@/types';

const ImplementationWorkspace = () => {
  // Use externalApplications directly from AppContext
  const { externalApplications, currentUser } = useApp();
  const [selectedApplication, setSelectedApplication] = useState<ExternalApplication | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('application');

  // Filter approved applications
  const approvedApplications = externalApplications.filter(app => 
    app.status === 'Approved'
  );

  const viewApplication = (application: ExternalApplication) => {
    setSelectedApplication(application);
    setIsViewModalOpen(true);
    setActiveTab('application');
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved - Ready for Implementation
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Implementation Workspace</h3>
      <p className="text-gray-600">Manage implementation of approved research applications.</p>
      
      {approvedApplications.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Approved Applications</h4>
            <p className="text-sm text-gray-500">Applications ready for implementation</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Approved Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.applicationId}</TableCell>
                  <TableCell>{app.title}</TableCell>
                  <TableCell>{app.applicantDetails.name}</TableCell>
                  <TableCell>{new Date(app.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewApplication(app)}>
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
          No approved applications. Approved applications will appear here for implementation.
        </div>
      )}

      {/* View Application Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approved Application Details</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="application">Application Details</TabsTrigger>
                <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
                <TabsTrigger value="implementation">Implementation</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Application Details */}
              <TabsContent value="application" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Application ID</Label><p className="font-medium">{selectedApplication.applicationId}</p></div>
                    <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedApplication.title}</p></div>
                    <div><Label className="text-sm text-gray-500">Applicant</Label><p className="font-medium">{selectedApplication.applicantDetails.name}</p></div>
                    <div><Label className="text-sm text-gray-500">Approved Date</Label><p className="font-medium">{new Date(selectedApplication.updatedAt).toLocaleString()}</p></div>
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

                {selectedApplication.completedForm && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Completed Application Form</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <a href={selectedApplication.completedForm.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        View Submitted Form
                      </a>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 2: Evaluations */}
              <TabsContent value="evaluations" className="space-y-6 py-4">
                {selectedApplication.evaluations && selectedApplication.evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {selectedApplication.evaluations.map((evalItem) => (
                      <div key={evalItem.id} className={`p-4 rounded-lg ${
                        evalItem.reviewerRole === 'Research Deputy Director' ? 'bg-green-50' : 
                        evalItem.reviewerRole === 'Research Director' ? 'bg-blue-50' : 'bg-purple-50'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{evalItem.reviewerRole} Evaluation</span>
                          <span className="text-xs text-gray-500">{new Date(evalItem.submittedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm mb-2">Decision: <span className={evalItem.recommendation === 'recommend' || evalItem.recommendation === 'approve' ? 'text-green-600' : 'text-red-600'}>
                          {evalItem.recommendation === 'recommend' ? '✓ Recommend' : 
                           evalItem.recommendation === 'approve' ? '✓ Approve' : '✗ Decline'}
                        </span></p>
                        {evalItem.allocatedTo && (
                          <p className="text-sm text-gray-600">Allocated to: {evalItem.allocatedTo}</p>
                        )}
                        <div className="space-y-1 mt-2">
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
              
              {/* Tab 3: Implementation */}
              <TabsContent value="implementation" className="space-y-6 py-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 font-medium">✓ Application Approved for Implementation</p>
                  <p className="text-sm text-gray-600 mt-2">This application has been fully approved and is ready for implementation.</p>
                  <p className="text-sm text-gray-600 mt-2">The Deputy Director can now proceed with implementing the research project.</p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Next Steps</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Review the complete application and evaluation details</li>
                    <li>Develop a detailed implementation plan</li>
                    <li>Allocate resources and budget as approved</li>
                    <li>Schedule regular progress reviews</li>
                    <li>Prepare regular status reports for stakeholders</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImplementationWorkspace;