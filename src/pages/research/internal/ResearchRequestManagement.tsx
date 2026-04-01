// screens/ResearchRequestManagement.tsx
import React, { useState, useEffect } from 'react';
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
import { Eye, FileText, Upload, CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import type { ResearchInternalStatus, ResearchAgenda, ResearchEvaluation, EvaluationChecklist, ResearchReviewOutcome,ResearchRequest  } from '@/types';

// Extended ResearchRequest interface with workflow data


const STORAGE_KEY = 'research_requests';

// Evaluation checklist items
const evaluationChecklist = [
  { id: 'clarity', label: 'Clarity of Research Objectives', description: 'Are the research objectives clearly defined?' },
  { id: 'methodology', label: 'Methodology Appropriateness', description: 'Is the proposed methodology appropriate?' },
  { id: 'feasibility', label: 'Feasibility', description: 'Is the research feasible within the proposed timeline?' },
  { id: 'impact', label: 'Potential Impact', description: 'Does the research have significant potential impact?' },
  { id: 'alignment', label: 'Strategic Alignment', description: 'Does this align with organizational strategy?' },
  { id: 'budget', label: 'Budget Justification', description: 'Is the budget well-justified?' },
  { id: 'resources', label: 'Resource Availability', description: 'Are the required resources available?' },
  { id: 'compliance', label: 'Compliance', description: 'Does this comply with relevant regulations?' },
];

const ResearchRequestManagement = () => {
 
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ResearchRequest | null>(null);
  const [activeTab, setActiveTab] = useState('request');
  
  // Agenda state
  const [agendaFile, setAgendaFile] = useState<File | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmittingAgenda, setIsSubmittingAgenda] = useState(false);
  
  // Evaluation state
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [evaluationComments, setEvaluationComments] = useState('');

const { currentUser, requests, setRequests, approvedRequests, setApprovedRequests } = useApp();

  // Add this useEffect after the load useEffect in ResearchRequestManagement.tsx

// Update handleEvaluationSubmit to move approved requests
const handleEvaluationSubmit = (action: 'recommend' | 'not_recommend' | 'approve' | 'decline') => {
  if (!selectedRequest) return;
  
  const evaluation: ResearchEvaluation = {
    id: `eval-${Date.now()}`,
    requestId: selectedRequest.id,
    reviewerRole: currentUser.role,
    reviewerName: currentUser.name,
    checklist: evaluationChecklist.map(item => ({
      criteriaId: item.id,
      criteriaName: item.label,
      isMet: checklistState[item.id] || false,
      comments: evaluationComments,
    })),
    recommendation: action,
    submittedAt: new Date().toISOString(),
  };
  
  const existingEvaluations = selectedRequest.evaluations || [];
  let newInternalStatus: ResearchInternalStatus = selectedRequest.internalStatus || 'Pending Agenda Development';
  let newReviewOutcome: ResearchReviewOutcome = (selectedRequest.reviewOutcome as ResearchReviewOutcome) || '';
  
  // Determine next status based on current user role and action
  if (currentUser.role === 'Research Director') {
    if (action === 'recommend') {
      newReviewOutcome = 'Recommended by Director';
      newInternalStatus = 'Pending Chief Director Review';
    }
  } else if (currentUser.role === 'Research Chief Director') {
    if (action === 'recommend') {
      newReviewOutcome = 'Recommended by Chief Director';
      newInternalStatus = 'Pending CFO Review';
    }
  } else if (currentUser.role === 'Research Chief Financial Officer') {
    if (action === 'recommend') {
      newReviewOutcome = 'Recommended by CFO';
      newInternalStatus = 'Pending CEO Approval';
    }
  } else if (currentUser.role === 'Research Chief Executive Officer') {
    if (action === 'approve') {
      newReviewOutcome = 'Approved';
      
      // Create the approved request with all data
      const approvedRequest: ResearchRequest = {
        ...selectedRequest,
        reviewOutcome: 'Approved' as ResearchReviewOutcome,
        evaluations: [...existingEvaluations, evaluation],
      };
      
      // Add to approved requests
      setApprovedRequests(prev => [...prev, approvedRequest]);
      
      // Remove from current requests
      const updatedRequests = requests.filter(req => req.id !== selectedRequest.id);
      setRequests(updatedRequests);
      
      // Close modal and reset
      setIsViewModalOpen(false);
      setSelectedRequest(null);
      setChecklistState({});
      setEvaluationComments('');
      return;
    } else if (action === 'decline') {
      newInternalStatus = 'Under CEO Approval';
    }
  }
  
  // For non-approval cases, update the request normally
  const updatedRequests = requests.map(req => 
    req.id === selectedRequest.id 
      ? { 
          ...req, 
          evaluations: [...existingEvaluations, evaluation],
          internalStatus: newInternalStatus,
          reviewOutcome: newReviewOutcome
        }
      : req
  );
  
  setRequests(updatedRequests);
  setSelectedRequest({ 
    ...selectedRequest, 
    evaluations: [...existingEvaluations, evaluation],
    internalStatus: newInternalStatus,
    reviewOutcome: newReviewOutcome
  });
  setChecklistState({});
  setEvaluationComments('');
};
 const submittedRequests = requests.filter(req => req.status === 'Submitted' && req.reviewOutcome !== 'Approved');

  // Listen for storage changes
// Listen for storage changes


  const viewRequest = (request: ResearchRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
    setActiveTab('request');
    // Reset evaluation state
    setChecklistState({});
    setEvaluationComments('');
  };


const getInternalStatusBadge = (status?: ResearchInternalStatus) => {
  const statusConfig: Record<ResearchInternalStatus, { color: string; icon: React.ReactNode; label: string }> = {
    
    // Deputy Director Flow
    'Pending Agenda Development': { 
      color: 'bg-gray-100 text-gray-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending Agenda' 
    },
    'Agenda In Progress': { 
      color: 'bg-blue-100 text-blue-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Agenda In Progress' 
    },
    'Agenda Submitted': { 
      color: 'bg-purple-100 text-purple-800', 
      icon: <CheckCircle className="h-3 w-3 mr-1" />, 
      label: 'Agenda Submitted' 
    },

    // Pending Review States
    'Pending Director Review': { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending Director Review' 
    },
    'Pending Chief Director Review': { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending Chief Director Review' 
    },
    'Pending CFO Review': { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending CFO Review' 
    },
    'Pending CEO Approval': { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending CEO Approval' 
    },

    // Active Review States
    'Under Director Review': { 
      color: 'bg-orange-100 text-orange-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Under Director Review' 
    },
    'Under Chief Director Review': { 
      color: 'bg-orange-100 text-orange-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Under Chief Dir Review' 
    },
    'Under CFO Review': { 
      color: 'bg-orange-100 text-orange-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Under CFO Review' 
    },
    'Under CEO Approval': { 
      color: 'bg-orange-100 text-orange-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Under CEO Approval' 
    },

    // TOR & SLA Statuses
    'Pending TOR Development': { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending TOR' 
    },
    'TOR In Progress': { 
      color: 'bg-blue-100 text-blue-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'TOR In Progress' 
    },
    'Ready for SLA Preparation': { 
      color: 'bg-purple-100 text-purple-800', 
      icon: <CheckCircle className="h-3 w-3 mr-1" />, 
      label: 'Ready for SLA' 
    },
    'SLA In Preparation': { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'SLA In Preparation' 
    },
    'SLA Completed': { 
      color: 'bg-green-100 text-green-800', 
      icon: <CheckCircle className="h-3 w-3 mr-1" />, 
      label: 'SLA Completed' 
    },

    // Legal Review Statuses
    'Pending Legal Review': { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending Legal Review' 
    },
    'Under Legal Review': { 
      color: 'bg-blue-100 text-blue-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Under Legal Review' 
    },

    // CEO Approval Statuses
    'Pending CEO Approval (SLA)': { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending CEO Approval' 
    },
    'Under CEO Approval (SLA)': { 
      color: 'bg-orange-100 text-orange-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Under CEO Approval' 
    },

    // Research Workspace Statuses
    'Pending Research': { 
      color: 'bg-gray-100 text-gray-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending Research' 
    },
    'Research In Progress': { 
      color: 'bg-blue-100 text-blue-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Research In Progress' 
    },
    'Pending Review': { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending Review' 
    },
    'Under Review': { 
      color: 'bg-orange-100 text-orange-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Under Review' 
    },
    'Report Recommended': { 
      color: 'bg-green-100 text-green-800', 
      icon: <CheckCircle className="h-3 w-3 mr-1" />, 
      label: 'Report Recommended' 
    },

    // Submission & Approval Statuses
    'Submission In Progress': { 
      color: 'bg-blue-100 text-blue-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Submission In Progress' 
    },
    'Pending Approval Review': { 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Pending Approval Review' 
    },
    'Under Approval Review': { 
      color: 'bg-orange-100 text-orange-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Under Approval Review' 
    },
    'Recommended for Approval': { 
      color: 'bg-green-100 text-green-800', 
      icon: <CheckCircle className="h-3 w-3 mr-1" />, 
      label: 'Recommended for Approval' 
    },
    'Under Final Approval': { 
      color: 'bg-orange-100 text-orange-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Under Final Approval' 
    },

    // Publishing Statuses
    'Ready for Publishing': { 
      color: 'bg-purple-100 text-purple-800', 
      icon: <Clock className="h-3 w-3 mr-1" />, 
      label: 'Ready for Publishing' 
    },
    'Published': { 
      color: 'bg-green-600 text-white', 
      icon: <CheckCircle className="h-3 w-3 mr-1" />, 
      label: 'Published' 
    },

    // Final Approved Status
    'Approved': { 
      color: 'bg-green-600 text-white', 
      icon: <CheckCircle className="h-3 w-3 mr-1" />, 
      label: 'Approved' 
    },
  };

  const config = status 
    ? statusConfig[status] 
    : statusConfig['Pending Agenda Development'];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const getReviewOutcomeBadge = (outcome?: ResearchReviewOutcome) => {
  if (!outcome) return <span className="text-gray-400 text-xs">-</span>;
  
  const outcomeConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    'Recommended by Director': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    'Recommended by Chief Director': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    'Recommended by CFO': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    'Approved': { color: 'bg-green-600 text-white', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
  };
  
  const config = outcomeConfig[outcome];
  if (!config) return <span className="text-gray-400 text-xs">-</span>;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {outcome }
    </span>
  );
};

  const handleAgendaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'agenda' | 'submission') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'agenda') {
        setAgendaFile(e.target.files[0]);
      } else {
        setSubmissionFile(e.target.files[0]);
      }
    }
  };

  const handleStartAgenda = () => {
    if (!selectedRequest) return;
    
 const updatedRequests = requests.map(req =>
  req.id === selectedRequest.id
    ? { ...req, internalStatus: 'Agenda In Progress' as ResearchInternalStatus }
    : req
);
    
    setRequests(updatedRequests);
    setSelectedRequest({ 
  ...selectedRequest, 
  internalStatus: 'Agenda In Progress' as ResearchInternalStatus 
});
  };

  const handleSubmitAgenda = () => {
    if (!selectedRequest) return;
    
    setIsSubmittingAgenda(true);
    
    const agenda: ResearchAgenda = {
      id: `agenda-${Date.now()}`,
      requestId: selectedRequest.id,
      agendaDocument: agendaFile ? {
        name: agendaFile.name,
        url: URL.createObjectURL(agendaFile),
        uploadedAt: new Date().toISOString(),
      } : undefined,
      submissionDocument: submissionFile ? {
        name: submissionFile.name,
        url: URL.createObjectURL(submissionFile),
        uploadedAt: new Date().toISOString(),
      } : undefined,
      createdAt: selectedRequest.agenda?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedBy: currentUser.name,
      submittedAt: new Date().toISOString(),
    };
    
    const updatedRequests = requests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            agenda,
            internalStatus: 'Pending Director Review' as ResearchInternalStatus
          }
        : req
    );
    
    setRequests(updatedRequests);
    setSelectedRequest({ ...selectedRequest, agenda, internalStatus: 'Pending Director Review' });
    setAgendaFile(null);
    setSubmissionFile(null);
    setIsSubmittingAgenda(false);
  };

  const handleStartReview = () => {
    if (!selectedRequest) return;
    
    let newStatus: ResearchInternalStatus = selectedRequest.internalStatus || 'Pending Agenda Development';
    
   if (currentUser.role === 'Research Director') {
  newStatus = 'Under Director Review';
} 
else if (currentUser.role === 'Research Chief Director') {
  newStatus = 'Under Chief Director Review';
} 
else if (currentUser.role === 'Research Chief Financial Officer') {
  newStatus = 'Under CFO Review';
} 
else if (currentUser.role === 'Research Chief Executive Officer') {
  newStatus = 'Under CEO Approval';
}
    
    const updatedRequests = requests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, internalStatus: newStatus }
        : req
    );
    
    setRequests(updatedRequests);
    setSelectedRequest({ ...selectedRequest, internalStatus: newStatus });
  };


  const canStartAgenda = () => {
    const internalStatus = selectedRequest?.internalStatus;
    return currentUser.role === 'Research Deputy Director' && 
           (!internalStatus || internalStatus === 'Pending Agenda Development');
  };

  const canEditAgenda = () => {
    const internalStatus = selectedRequest?.internalStatus;
    return currentUser.role === 'Research Deputy Director' && 
           internalStatus === 'Agenda In Progress';
  };

const canStartReview = () => {
  const internalStatus = selectedRequest?.internalStatus;
if (currentUser.role === 'Research Director' && internalStatus === 'Pending Director Review') return true;

if (currentUser.role === 'Research Chief Director' && internalStatus === 'Pending Chief Director Review') return true;

if (currentUser.role === 'Research Chief Financial Officer' && internalStatus === 'Pending CFO Review') return true;

if (currentUser.role === 'Research Chief Executive Officer' && internalStatus === 'Pending CEO Approval') return true;
  return false;
};

 const canEvaluate = () => {
  const internalStatus = selectedRequest?.internalStatus;
  if (currentUser.role === 'Research Director' && internalStatus === 'Under Director Review') return true;
  if (currentUser.role === 'Research Chief Director' && internalStatus === 'Under Chief Director Review') return true;
  if (currentUser.role === 'Research Chief Financial Officer' && internalStatus === 'Under CFO Review') return true;
  if (currentUser.role === 'Research Chief Executive Officer' && internalStatus === 'Under CEO Approval') return true;
  return false;
};
  const getEvaluationButtons = () => {
    if (currentUser.role === 'Research Director') {
      return (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleEvaluationSubmit('not_recommend')} className="border-red-300 text-red-600 hover:bg-red-50">
            <XCircle className="h-4 w-4 mr-2" />
            Not Recommend
          </Button>
          <Button onClick={() => handleEvaluationSubmit('recommend')} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Recommend
          </Button>
        </div>
      );
    }
    
    if (currentUser.role === 'Research Chief Director') {
      return (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleEvaluationSubmit('not_recommend')} className="border-red-300 text-red-600 hover:bg-red-50">
            <XCircle className="h-4 w-4 mr-2" />
            Not Recommend
          </Button>
          <Button onClick={() => handleEvaluationSubmit('recommend')} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Recommend
          </Button>
        </div>
      );
    }
    
    if (currentUser.role === 'Research Chief Financial Officer') {
      return (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleEvaluationSubmit('not_recommend')} className="border-red-300 text-red-600 hover:bg-red-50">
            <XCircle className="h-4 w-4 mr-2" />
            Not Recommend
          </Button>
          <Button onClick={() => handleEvaluationSubmit('recommend')} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Recommend
          </Button>
        </div>
      );
    }
    
    if (currentUser.role === 'Research Chief Executive Officer') {
      return (
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleEvaluationSubmit('decline')} className="border-red-300 text-red-600 hover:bg-red-50">
            <XCircle className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button onClick={() => handleEvaluationSubmit('approve')} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      );
    }
    
    return null;
  };

  // Filter only submitted requests for management view
 

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Research Request Management</h2>
        <p className="text-gray-600 mt-1">View and manage submitted research requests</p>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead>Internal Status</TableHead>
              <TableHead>Review Outcome</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Business Unit</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submittedRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  No submitted research requests yet.
                </TableCell>
              </TableRow>
            ) : (
              submittedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestId}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{new Date(request.dateSubmitted).toLocaleDateString()}</TableCell>
                  <TableCell>{getInternalStatusBadge(request.internalStatus)}</TableCell>
                 <TableCell>{getReviewOutcomeBadge(request.reviewOutcome as ResearchReviewOutcome)}</TableCell>
                  <TableCell>{request.requesterDetails.name}</TableCell>
                  <TableCell>{request.requesterDetails.businessUnit}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewRequest(request)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Request Modal with Tabs */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Research Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="request">Research Request</TabsTrigger>
                <TabsTrigger value="agenda">Agenda & Submission</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Research Request Details */}
              <TabsContent value="request" className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">A. Basic Request Info</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm text-gray-500">Request ID</Label>
                      <p className="font-medium">{selectedRequest.requestId}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Title</Label>
                      <p className="font-medium">{selectedRequest.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Date Submitted</Label>
                      <p className="font-medium">{new Date(selectedRequest.dateSubmitted).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Internal Status</Label>
                      <div>{getInternalStatusBadge(selectedRequest.internalStatus)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Review Outcome</Label>
                     <div>{getReviewOutcomeBadge(selectedRequest.reviewOutcome as ResearchReviewOutcome)}</div>
                    </div>
                  </div>
                </div>

                {/* Requester Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">B. Requester Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm text-gray-500">Name</Label>
                      <p className="font-medium">{selectedRequest.requesterDetails.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Role</Label>
                      <p className="font-medium">{selectedRequest.requesterDetails.role}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Business Unit</Label>
                      <p className="font-medium">{selectedRequest.requesterDetails.businessUnit}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Email</Label>
                      <p className="font-medium">{selectedRequest.requesterDetails.email}</p>
                    </div>
                  </div>
                </div>

                {/* Research Purpose */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">C. Research Purpose / Motivation</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm text-gray-500">Problem Statement</Label>
                      <p className="mt-1">{selectedRequest.researchPurpose.problemStatement}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Reason for Research</Label>
                      <p className="mt-1">{selectedRequest.researchPurpose.reasonForResearch}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Trigger</Label>
                      <p className="mt-1">{selectedRequest.researchPurpose.trigger}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Expected Impact</Label>
                      <p className="mt-1">{selectedRequest.researchPurpose.expectedImpact}</p>
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                {selectedRequest.attachments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">J. Attachments</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {selectedRequest.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {attachment.name}
                          </a>
                          <span className="text-xs text-gray-500">
                            Uploaded: {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 2: Agenda & Submission */}
              <TabsContent value="agenda" className="space-y-6 py-4">
                {/* Deputy Director Section - Agenda Development */}
                <div className="space-y-4 border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Research Agenda & Submission</h3>
                  
                  {selectedRequest.agenda ? (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-500">Agenda Document</Label>
                          {selectedRequest.agenda.agendaDocument ? (
                            <a 
                              href={selectedRequest.agenda.agendaDocument.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-2 mt-1"
                            >
                              <FileText className="h-4 w-4" />
                              {selectedRequest.agenda.agendaDocument.name}
                            </a>
                          ) : (
                            <p className="text-gray-500 mt-1">No agenda document uploaded</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Submission Document</Label>
                          {selectedRequest.agenda.submissionDocument ? (
                            <a 
                              href={selectedRequest.agenda.submissionDocument.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-2 mt-1"
                            >
                              <FileText className="h-4 w-4" />
                              {selectedRequest.agenda.submissionDocument.name}
                            </a>
                          ) : (
                            <p className="text-gray-500 mt-1">No submission document uploaded</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Submitted By</Label>
                        <p className="mt-1">{selectedRequest.agenda.submittedBy || 'Unknown'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Submitted At</Label>
                        <p className="mt-1">{selectedRequest.agenda.submittedAt ? new Date(selectedRequest.agenda.submittedAt).toLocaleString() : 'Not submitted'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No agenda has been created yet.</p>
                  )}
                  
                  {/* Deputy Director: Start Button */}
                  {canStartAgenda() && (
                    <div className="space-y-4 border-t pt-4">
                      <Button onClick={handleStartAgenda} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Agenda Development
                      </Button>
                    </div>
                  )}
                  
                  {/* Deputy Director: Upload Agenda & Submission */}
                  {canEditAgenda() && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Develop Research Agenda & Submission</h4>
                      <div className="space-y-3">
                        <div>
                          <Label>Agenda Document</Label>
                          <Input
                            type="file"
                            onChange={(e) => handleAgendaUpload(e, 'agenda')}
                            className="mt-1"
                            accept=".pdf,.doc,.docx"
                          />
                        </div>
                        <div>
                          <Label>Submission Document</Label>
                          <Input
                            type="file"
                            onChange={(e) => handleAgendaUpload(e, 'submission')}
                            className="mt-1"
                            accept=".pdf,.doc,.docx"
                          />
                        </div>
                        <Button 
                          onClick={handleSubmitAgenda}
                          disabled={!agendaFile || !submissionFile || isSubmittingAgenda}
                          className="mt-2"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Agenda
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Review Section - For Director, Chief Director, CFO, CEO */}
                {(canStartReview() || canEvaluate()) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Review & Evaluation</h3>
                    
                    {/* Start Review Button */}
                    {canStartReview() && (
                      <div className="space-y-4">
                        <Button onClick={handleStartReview} className="bg-blue-600 hover:bg-blue-700">
                          <Play className="h-4 w-4 mr-2" />
                          Start {currentUser.role === 'Research Chief Executive Officer' ? 'Approval' : 'Review'}
                        </Button>
                      </div>
                    )}
                    
                    {/* Evaluation Form */}
                    {canEvaluate() && (
                      <>
                        {/* Display existing evaluations */}
                        {selectedRequest.evaluations && selectedRequest.evaluations.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-700">Previous Evaluations</h4>
                            {selectedRequest.evaluations.map((evalItem, idx) => (
                              <div key={evalItem.id} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">{evalItem.reviewerRole}</span>
                                  <span className="text-sm text-gray-500">{new Date(evalItem.submittedAt).toLocaleString()}</span>
                                </div>
                                <p className="text-sm mb-2">Recommendation: <span className="font-semibold">{evalItem.recommendation}</span></p>
                                <div className="space-y-1">
                                  {evalItem.checklist.map((item) => (
                                    <div key={item.criteriaId} className="flex items-center gap-2 text-sm">
                                      {item.isMet ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                      )}
                                      <span>{item.criteriaName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* New Evaluation Form */}
                        <div className="space-y-4 border-t pt-4">
                          <h4 className="font-medium">Your Evaluation</h4>
                          <div className="space-y-3">
                            {evaluationChecklist.map((item) => (
                              <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                                <Checkbox
                                  id={item.id}
                                  checked={checklistState[item.id] || false}
                                  onCheckedChange={(checked) => 
                                    setChecklistState(prev => ({ ...prev, [item.id]: checked === true }))
                                  }
                                />
                                <div className="flex-1">
                                  <Label htmlFor={item.id} className="font-medium cursor-pointer">
                                    {item.label}
                                  </Label>
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
                              placeholder="Add your comments or feedback here..."
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                          
                          <div className="flex justify-end gap-3 pt-2">
                            {getEvaluationButtons()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Display when no action is available */}
               {!canStartAgenda() && 
 !canEditAgenda() && 
 !canStartReview() && 
 !canEvaluate() && 
 selectedRequest.reviewOutcome !== 'Approved' && (
  <div className="text-center py-8 text-gray-500">
    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
    <p>
      This request is currently with {
        selectedRequest.internalStatus
          ?.replace('Under ', '')
          .replace('Agenda', 'Deputy Director') || 'another department'
      }.
    </p>
    <p className="text-sm">
      You will be notified when action is required from you.
    </p>
  </div>
)}

{/* Approved state */}
{selectedRequest.reviewOutcome === 'Approved' && (
  <div className="text-center py-8 text-green-600">
    <CheckCircle className="h-12 w-12 mx-auto mb-3" />
    <p className="text-lg font-semibold">Research Request Approved!</p>
    <p className="text-sm">
      This request has been fully approved and is ready for implementation.
    </p>
  </div>
)}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResearchRequestManagement;