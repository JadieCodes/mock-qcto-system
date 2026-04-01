import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Eye, FileText, Clock, Play, CheckCircle, XCircle, Upload } from 'lucide-react';
import type { ExternalApplication, ExternalApplicationEvaluation, ExternalApplicationStatus } from '@/types';

const ApplicationReviewWorkspace = () => {
  // Use externalApplications directly from AppContext
  const { externalApplications, setExternalApplications, currentUser } = useApp();
  const [selectedApplication, setSelectedApplication] = useState<ExternalApplication | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('application');
  
  // Link generation state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkExpiry, setLinkExpiry] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  
  // Evaluation state
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [evaluationComments, setEvaluationComments] = useState('');
  const [directorChecklistState, setDirectorChecklistState] = useState<Record<string, boolean>>({});
  const [directorEvaluationComments, setDirectorEvaluationComments] = useState('');
  const [ceoChecklistState, setCeoChecklistState] = useState<Record<string, boolean>>({});
  const [ceoEvaluationComments, setCeoEvaluationComments] = useState('');

  const evaluationChecklist = [
    { id: 'completeness', label: 'Application Completeness', description: 'Is the application complete with all required information?' },
    { id: 'clarity', label: 'Clarity of Research', description: 'Is the research clearly defined and explained?' },
    { id: 'feasibility', label: 'Feasibility', description: 'Is the research feasible within the proposed timeline?' },
    { id: 'impact', label: 'Potential Impact', description: 'Does the research have significant potential impact?' },
    { id: 'methodology', label: 'Methodology', description: 'Is the methodology appropriate and well-defined?' },
  ];

  // Filter applications based on status
  const linkGenerationApps = externalApplications.filter(app => 
    app.status === 'Link Generation Pending' || app.status === 'Link Generation In Progress'
  );
  
  const ddReviewApps = externalApplications.filter(app => 
    app.status === 'Application Link Sent' || app.status === 'Under DD Review'
  );
  
  const directorReviewApps = externalApplications.filter(app => 
    app.status === 'Pending Review Director' || app.status === 'Under Review Director'
  );
  
  const ceoApprovalApps = externalApplications.filter(app => 
    app.status === 'Pending CEO Approval' || app.status === 'Under CEO Approval'
  );

  const viewApplication = (application: ExternalApplication) => {
    setSelectedApplication(application);
    setIsViewModalOpen(true);
    setActiveTab('application');
    setChecklistState({});
    setEvaluationComments('');
    setDirectorChecklistState({});
    setDirectorEvaluationComments('');
    setCeoChecklistState({});
    setCeoEvaluationComments('');
  };

const getStatusBadge = (status: ExternalApplicationStatus) => {
  const statusConfig: Record<ExternalApplicationStatus, { color: string; icon: React.ReactNode; label: string }> = {
    'Draft': { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Draft' },
    'Submitted': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Submitted' },
    'Pending Directors Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Director Review' },
    'Under Directors Review': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Director Review' },
    'Link Generation Pending': { color: 'bg-purple-100 text-purple-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Link Generation Pending' },
    'Link Generation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Link Generation In Progress' },
    'Application Link Sent': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Link Sent' },
    'Under DD Review': { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under DD Review' },
    'Pending Review Director': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Director Review' },
    'Under Review Director': { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Director Review' },
    'Pending CEO Approval': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending CEO Approval' },
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

  // Link Generation Actions
  const handleStartLinkGeneration = () => {
    if (!selectedApplication) return;
    
    const updatedApplications = externalApplications.map(app => 
      app.id === selectedApplication.id
        ? { ...app, status: 'Link Generation In Progress' as ExternalApplicationStatus }
        : app
    );
    setExternalApplications(updatedApplications);
    setSelectedApplication({ ...selectedApplication, status: 'Link Generation In Progress' as ExternalApplicationStatus });
  };

  const handleGenerateLink = () => {
    if (!selectedApplication || !linkUrl) return;
    
    setIsGeneratingLink(true);
    
    const updatedApplications = externalApplications.map(app => 
      app.id === selectedApplication.id
        ? { 
            ...app, 
            linkGenerated: {
              url: linkUrl,
              generatedAt: new Date().toISOString(),
              expiresAt: linkExpiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            status: 'Application Link Sent' as ExternalApplicationStatus
          }
        : app
    );
    setExternalApplications(updatedApplications);
    setIsViewModalOpen(false);
    setIsGeneratingLink(false);
  };

  // DD Review Actions
  const handleStartDDReview = () => {
    if (!selectedApplication) return;
    
    const updatedApplications = externalApplications.map(app => 
      app.id === selectedApplication.id
        ? { ...app, status: 'Under DD Review' as ExternalApplicationStatus }
        : app
    );
    setExternalApplications(updatedApplications);
    setSelectedApplication({ ...selectedApplication, status: 'Under DD Review' as ExternalApplicationStatus });
  };

  const handleDDRecommendation = (recommendation: 'recommend' | 'not_recommend') => {
    if (!selectedApplication) return;
    
    const evaluation: ExternalApplicationEvaluation = {
      id: `eval-${Date.now()}`,
      applicationId: selectedApplication.id,
      reviewerRole: currentUser.role,
      reviewerName: currentUser.name,
      checklist: evaluationChecklist.map(item => ({
        criteriaId: item.id,
        criteriaName: item.label,
        isMet: checklistState[item.id] || false,
        comments: evaluationComments,
      })),
      recommendation: recommendation,
      comments: evaluationComments,
      submittedAt: new Date().toISOString(),
    };
    
    const existingEvaluations = selectedApplication.evaluations || [];
    
    const updatedApplications = externalApplications.map(app => 
      app.id === selectedApplication.id
        ? { 
            ...app, 
            evaluations: [...existingEvaluations, evaluation],
            status: 'Pending Review Director' as ExternalApplicationStatus
          }
        : app
    );
    setExternalApplications(updatedApplications);
    setIsViewModalOpen(false);
  };

  // Director Review Actions
  const handleStartDirectorReview = () => {
    if (!selectedApplication) return;
    
    const updatedApplications = externalApplications.map(app => 
      app.id === selectedApplication.id
        ? { ...app, status: 'Under Review Director' as ExternalApplicationStatus }
        : app
    );
    setExternalApplications(updatedApplications);
    setSelectedApplication({ ...selectedApplication, status: 'Under Review Director' as ExternalApplicationStatus });
  };

  const handleDirectorRecommendation = (recommendation: 'recommend' | 'not_recommend') => {
    if (!selectedApplication) return;
    
    const evaluation: ExternalApplicationEvaluation = {
      id: `eval-${Date.now()}`,
      applicationId: selectedApplication.id,
      reviewerRole: currentUser.role,
      reviewerName: currentUser.name,
      checklist: evaluationChecklist.map(item => ({
        criteriaId: item.id,
        criteriaName: item.label,
        isMet: directorChecklistState[item.id] || false,
        comments: directorEvaluationComments,
      })),
      recommendation: recommendation,
      comments: directorEvaluationComments,
      submittedAt: new Date().toISOString(),
    };
    
    const existingEvaluations = selectedApplication.evaluations || [];
    
    const updatedApplications = externalApplications.map(app => 
      app.id === selectedApplication.id
        ? { 
            ...app, 
            evaluations: [...existingEvaluations, evaluation],
            status: 'Pending CEO Approval' as ExternalApplicationStatus
          }
        : app
    );
    setExternalApplications(updatedApplications);
    setIsViewModalOpen(false);
  };

  // CEO Approval Actions
  const handleStartCEOApproval = () => {
    if (!selectedApplication) return;
    
    const updatedApplications = externalApplications.map(app => 
      app.id === selectedApplication.id
        ? { ...app, status: 'Under CEO Approval' as ExternalApplicationStatus }
        : app
    );
    setExternalApplications(updatedApplications);
    setSelectedApplication({ ...selectedApplication, status: 'Under CEO Approval' as ExternalApplicationStatus });
  };

  const handleCEOApproval = (decision: 'approve' | 'decline') => {
    if (!selectedApplication) return;
    
    const evaluation: ExternalApplicationEvaluation = {
      id: `eval-${Date.now()}`,
      applicationId: selectedApplication.id,
      reviewerRole: currentUser.role,
      reviewerName: currentUser.name,
      checklist: evaluationChecklist.map(item => ({
        criteriaId: item.id,
        criteriaName: item.label,
        isMet: ceoChecklistState[item.id] || false,
        comments: ceoEvaluationComments,
      })),
      recommendation: decision === 'approve' ? 'approve' : 'decline',
      comments: ceoEvaluationComments,
      submittedAt: new Date().toISOString(),
    };
    
    const existingEvaluations = selectedApplication.evaluations || [];
    
    const updatedApplications = externalApplications.map(app => 
      app.id === selectedApplication.id
        ? { 
            ...app, 
            evaluations: [...existingEvaluations, evaluation],
            status: decision === 'approve' ? 'Approved' as ExternalApplicationStatus : 'Pending CEO Approval' as ExternalApplicationStatus
          }
        : app
    );
    setExternalApplications(updatedApplications);
    setIsViewModalOpen(false);
  };

  // Check permissions
  const canStartLinkGeneration = () => {
    return currentUser.role === 'Research Deputy Director' && 
           selectedApplication?.status === 'Link Generation Pending';
  };

  const canGenerateLink = () => {
    return currentUser.role === 'Research Deputy Director' && 
           selectedApplication?.status === 'Link Generation In Progress';
  };

  const canStartDDReview = () => {
    return currentUser.role === 'Research Deputy Director' && 
           selectedApplication?.status === 'Application Link Sent' &&
           selectedApplication?.completedForm;
  };

  const canEvaluateDD = () => {
    return currentUser.role === 'Research Deputy Director' && 
           selectedApplication?.status === 'Under DD Review';
  };

  const canStartDirectorReview = () => {
    return currentUser.role === 'Research Director' && 
           selectedApplication?.status === 'Pending Review Director';
  };

  const canEvaluateDirector = () => {
    return currentUser.role === 'Research Director' && 
           selectedApplication?.status === 'Under Review Director';
  };

  const canStartCEOApproval = () => {
    return currentUser.role === 'Research Chief Executive Officer' && 
           selectedApplication?.status === 'Pending CEO Approval';
  };

  const canEvaluateCEO = () => {
    return currentUser.role === 'Research Chief Executive Officer' && 
           selectedApplication?.status === 'Under CEO Approval';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Application Review Workspace</h3>
      <p className="text-gray-600">Review and evaluate external research applications.</p>
      
      {/* Link Generation Section */}
      {linkGenerationApps.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Link Generation</h4>
            <p className="text-sm text-gray-500">Generate application form links for applicants</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkGenerationApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.applicationId}</TableCell>
                  <TableCell>{app.title}</TableCell>
                  <TableCell>{app.applicantDetails.name}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewApplication(app)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Deputy Director Review Section */}
      {ddReviewApps.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Deputy Director Review</h4>
            <p className="text-sm text-gray-500">Review applications with completed forms</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ddReviewApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.applicationId}</TableCell>
                  <TableCell>{app.title}</TableCell>
                  <TableCell>{app.applicantDetails.name}</TableCell>
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
      )}

      {/* Director Review Section */}
      {directorReviewApps.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Director Review</h4>
            <p className="text-sm text-gray-500">Applications ready for director review</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directorReviewApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.applicationId}</TableCell>
                  <TableCell>{app.title}</TableCell>
                  <TableCell>{app.applicantDetails.name}</TableCell>
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
      )}

      {/* CEO Approval Section */}
      {ceoApprovalApps.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">CEO Approval</h4>
            <p className="text-sm text-gray-500">Applications awaiting final approval</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ceoApprovalApps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.applicationId}</TableCell>
                  <TableCell>{app.title}</TableCell>
                  <TableCell>{app.applicantDetails.name}</TableCell>
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
      )}

      {/* Review Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Review Workspace</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="flex w-full flex-wrap gap-1">
                <TabsTrigger value="application">Application Details</TabsTrigger>
                <TabsTrigger value="link">Link Generation</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
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
              
              {/* Tab 2: Link Generation */}
              <TabsContent value="link" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Link Generation</h3>
                  
                  {selectedApplication.linkGenerated && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800 font-medium">✓ Link Generated</p>
                      <a href={selectedApplication.linkGenerated.url} target="_blank" className="text-blue-600 hover:underline block mt-2">
                        {selectedApplication.linkGenerated.url}
                      </a>
                      <p className="text-xs text-gray-500 mt-2">
                        Generated: {new Date(selectedApplication.linkGenerated.generatedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(selectedApplication.linkGenerated.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {canStartLinkGeneration() && (
                    <div className="space-y-4">
                      <Button onClick={handleStartLinkGeneration} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Link Generation
                      </Button>
                    </div>
                  )}
                  
                  {canGenerateLink() && (
                    <div className="space-y-4">
                      <div>
                        <Label>Application Form Link *</Label>
                        <Input
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="Enter the application form URL"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Expiry Date (Optional)</Label>
                        <Input
                          type="datetime-local"
                          value={linkExpiry}
                          onChange={(e) => setLinkExpiry(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleGenerateLink} disabled={!linkUrl} className="bg-green-600 hover:bg-green-700">
                        <Upload className="h-4 w-4 mr-2" />
                        Generate & Send Link
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Tab 3: Review */}
              <TabsContent value="review" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Review & Evaluation</h3>
                  
                  {/* DD Review Section */}
                  {canStartDDReview() && (
                    <div className="space-y-4">
                      <Button onClick={handleStartDDReview} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start DD Review
                      </Button>
                    </div>
                  )}
                  
                  {canEvaluateDD() && (
                    <div className="space-y-4">
                      <h4 className="font-medium">DD Evaluation Checklist</h4>
                      <div className="space-y-3">
                        {evaluationChecklist.map((item) => (
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
                          placeholder="Add your evaluation comments..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => handleDDRecommendation('not_recommend')} className="border-red-300 text-red-600 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-2" />
                          Not Recommend
                        </Button>
                        <Button onClick={() => handleDDRecommendation('recommend')} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Recommend
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Director Review Section */}
                  {canStartDirectorReview() && (
                    <div className="space-y-4 border-t pt-4">
                      <Button onClick={handleStartDirectorReview} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Director Review
                      </Button>
                    </div>
                  )}
                  
                  {canEvaluateDirector() && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Director Evaluation Checklist</h4>
                      <div className="space-y-3">
                        {evaluationChecklist.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={item.id}
                              checked={directorChecklistState[item.id] || false}
                              onCheckedChange={(checked) => setDirectorChecklistState(prev => ({ ...prev, [item.id]: checked === true }))}
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
                          value={directorEvaluationComments}
                          onChange={(e) => setDirectorEvaluationComments(e.target.value)}
                          placeholder="Add your evaluation comments..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => handleDirectorRecommendation('not_recommend')} className="border-red-300 text-red-600 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-2" />
                          Not Recommend
                        </Button>
                        <Button onClick={() => handleDirectorRecommendation('recommend')} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Recommend
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
                    </div>
                  )}
                  
                  {canEvaluateCEO() && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">CEO Approval Checklist</h4>
                      <div className="space-y-3">
                        {evaluationChecklist.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={item.id}
                              checked={ceoChecklistState[item.id] || false}
                              onCheckedChange={(checked) => setCeoChecklistState(prev => ({ ...prev, [item.id]: checked === true }))}
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
                          value={ceoEvaluationComments}
                          onChange={(e) => setCeoEvaluationComments(e.target.value)}
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
                  
                  {selectedApplication.status === 'Approved' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Application Approved</p>
                      <p className="text-sm text-gray-600">This application has been approved and is ready for implementation.</p>
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

export default ApplicationReviewWorkspace;