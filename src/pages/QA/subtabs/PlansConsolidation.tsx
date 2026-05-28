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
import { Eye, FileText, Upload, Send, Clock, CheckCircle, User, Share2, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

// Key that external side uses
const EXTERNAL_STORAGE_KEY = 'external_learner_enrolment_batches_v2';
const ENROLMENT_SYNC_EVENT = 'external-learner-enrolments-updated';

// Types for gate evaluation and draft report
interface GateCheckItem {
  criteria: string;
  isMet: boolean;
  detail: string;
}

interface GateEvaluation {
  status: 'passed' | 'failed' | null;
  generatedAt?: string;
  checklistResults: GateCheckItem[];
  failureReasons: string[];
}

interface DraftReportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  uploadedFileName?: string;
  submissionMethod: 'manual' | 'upload' | 'mixed';
}

interface DraftReport {
  id: string;
  generatedAt: string;
  reportTitle: string;
  summary: DraftReportSummary;
  validationChecks: GateCheckItem[];
  notes: string[];
}

// Learner Row type
interface LearnerRow {
  id: string;
  nationalId: string;
  alternateId: string;
  lastName: string;
  firstName: string;
  gender: string;
  birthDate: string;
  province: string;
  popiaAgree: string;
  sorStatus: string;
  readinessType: string;
  flc: string;
}

// Extended type for external enrolments
interface ExternalLearnerEnrolment {
  id: string;
  enrolmentId: string;
  learnerDetails?: {
    firstName?: string;
    lastName?: string;
    idNumber?: string;
    email?: string;
    phone?: string;
    name?: string;
  };
  qualification?: {
    name?: string;
    code?: string;
  };
  qualificationId?: string;
  status: string;
  qpAllocation?: {
    quarterlyPeriod?: string;
    allocatedAt?: string;
    allocatedTo?: string;
  };
  plansReports?: {
    documentUrl: string;
    documentName: string;
    uploadedAt: string;
    uploadedBy: string;
    submittedAt: string;
    notes?: string;
  };
  consolidatedPlans?: {
    documentUrl: string;
    documentName: string;
    uploadedAt: string;
    uploadedBy: string;
    sharedAt?: string;
    sharedWith?: string[];
    notes?: string;
  };
  quarter?: string;
  sdpCode?: string;
  assessmentCentreCode?: string;
  dateStamp?: string;
  submittedBy?: string;
  submittedAt?: string;
  gateEvaluation?: GateEvaluation | null;
  draftReport?: DraftReport | null;
  learnerRows?: LearnerRow[];
  uploadedFileName?: string;
}

// Union type for combined enrolments
type AnyEnrolment = LearnerEnrolment | ExternalLearnerEnrolment;

// Helper to check if enrolment has gate evaluation
const hasGateEvaluation = (enrolment: AnyEnrolment): enrolment is AnyEnrolment & { gateEvaluation: GateEvaluation } => {
  return 'gateEvaluation' in enrolment && enrolment.gateEvaluation !== null && enrolment.gateEvaluation !== undefined;
};

// Helper to check if enrolment has draft report
const hasDraftReport = (enrolment: AnyEnrolment): enrolment is AnyEnrolment & { draftReport: DraftReport } => {
  return 'draftReport' in enrolment && enrolment.draftReport !== null && enrolment.draftReport !== undefined;
};

// Label maps for display
const provinceLabelMap: Record<string, string> = {
  '1': 'Western Cape',
  '2': 'Eastern Cape',
  '3': 'Northern Cape',
  '4': 'Free State',
  '5': 'KwaZulu-Natal',
  '6': 'North West',
  '7': 'Gauteng',
  '8': 'Mpumalanga',
  '9': 'Limpopo',
  N: 'SA National',
  X: 'Outside SA',
};

const sorStatusLabelMap: Record<string, string> = {
  '01': 'Statement of Results issued',
  '02': 'Statement of Results not yet issued',
};

const readinessTypeLabelMap: Record<string, string> = {
  '1': 'Enrolled',
  '2': 'RPL for Access to EISA determined by SDP',
  '3': 'Mixed Mode to EISA',
  '4': 'SDP Training and assessment for readiness to EISA',
  '5': 'SDP e-learning training and assessment for readiness to EISA',
  '6': 'RPL for Access to EISA determined by Assessment Partner/Quality Partner',
};

const flcLabelMap: Record<string, string> = {
  '01': 'FLC certificate (competent)',
  '02': 'RPL',
  '03': 'Grade 12/NCV Level 4 pass',
  '04': 'Not yet competent',
  '05': 'FLC not completed yet',
  '06': 'Not applicable',
  '07': 'Enrolled for FLC',
  '08': 'N3 Mathematics and Business Language',
};

const genderLabelMap: Record<string, string> = {
  M: 'Male',
  F: 'Female',
};

const formatDisplayDate = (value?: string) => {
  if (!value) return '-';
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
};

const PlansConsolidation = () => {
  const { currentUser, enrolments: contextEnrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<AnyEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [consolidatedFile, setConsolidatedFile] = useState<File | null>(null);
  const [consolidationNotes, setConsolidationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareWith, setShareWith] = useState<string[]>([]);
  const [externalEnrolments, setExternalEnrolments] = useState<ExternalLearnerEnrolment[]>([]);

  // Listen for external submissions
  useEffect(() => {
    const loadExternalEnrolments = () => {
      const saved = localStorage.getItem(EXTERNAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setExternalEnrolments(parsed);
          console.log('Loaded external enrolments:', parsed);
          
          // Sync external submissions to context enrolments
          parsed.forEach((externalEnrolment: ExternalLearnerEnrolment) => {
            if (externalEnrolment.plansReports && externalEnrolment.status === 'Plans & Reports Submitted') {
              const contextEnrolment = contextEnrolments.find(e => e.id === externalEnrolment.id);
              if (contextEnrolment && !contextEnrolment.plansReports) {
                console.log('Syncing external submission to context:', externalEnrolment.id);
                updateEnrolment(externalEnrolment.id, {
                  plansReports: externalEnrolment.plansReports,
                  status: 'Plans & Reports Submitted' as LearnerEnrolmentStatus
                });
              }
            }
          });
        } catch (e) {
          console.error('Error loading external enrolments', e);
        }
      }
    };

    loadExternalEnrolments();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === EXTERNAL_STORAGE_KEY) {
        console.log('External storage changed, reloading...');
        loadExternalEnrolments();
      }
    };

    const handleSyncEvent = () => {
      console.log('Sync event received, reloading...');
      loadExternalEnrolments();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(ENROLMENT_SYNC_EVENT, handleSyncEvent);
    const interval = setInterval(loadExternalEnrolments, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(ENROLMENT_SYNC_EVENT, handleSyncEvent);
      clearInterval(interval);
    };
  }, [contextEnrolments, updateEnrolment]);

  // Filter enrolments with submitted plans and reports from context
  const submittedEnrolments = contextEnrolments.filter(e => 
    e.status === 'Plans & Reports Submitted' && e.plansReports
  );

  const externalSubmittedEnrolments = externalEnrolments.filter((e: ExternalLearnerEnrolment) => 
    e.status === 'Plans & Reports Submitted' && e.plansReports &&
    !contextEnrolments.some(ce => ce.id === e.id && ce.plansReports)
  );

  useEffect(() => {
    console.log('Submitted enrolments from context:', submittedEnrolments);
    console.log('Submitted enrolments from external:', externalSubmittedEnrolments);
  }, [submittedEnrolments, externalSubmittedEnrolments]);

  const viewEnrolment = (enrolment: AnyEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setConsolidatedFile(null);
    setConsolidationNotes('');
    setShareWith([]);
  };

  // Helper function to sync to external storage
  const syncToExternalStorage = (enrolmentId: string, updates: any) => {
    const saved = localStorage.getItem(EXTERNAL_STORAGE_KEY);
    if (saved) {
      try {
        const externalList = JSON.parse(saved);
        const updatedList = externalList.map((item: ExternalLearnerEnrolment) => {
          if (item.id === enrolmentId) {
            return { ...item, ...updates };
          }
          return item;
        });
        localStorage.setItem(EXTERNAL_STORAGE_KEY, JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent(ENROLMENT_SYNC_EVENT));
        console.log('Synced to external storage successfully');
      } catch (e) {
        console.error('Error syncing to external storage:', e);
      }
    }
  };

  const handleConsolidate = () => {
    if (!selectedEnrolment || !consolidatedFile) return;
    
    setIsSubmitting(true);
    
    const consolidatedPlansData = {
      documentUrl: URL.createObjectURL(consolidatedFile),
      documentName: consolidatedFile.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
      notes: consolidationNotes,
    };
    
    // Update context enrolment (internal side)
    updateEnrolment(selectedEnrolment.id, {
      consolidatedPlans: consolidatedPlansData,
      status: 'Plans Consolidated' as LearnerEnrolmentStatus
    });
    
    // Also sync to external storage
    syncToExternalStorage(selectedEnrolment.id, {
      consolidatedPlans: consolidatedPlansData,
      status: 'Plans Consolidated'
    });
    
    // Update local selected enrolment by creating a new object with the updated properties
    const updatedEnrolment = {
      ...selectedEnrolment,
      consolidatedPlans: consolidatedPlansData,
      status: 'Plans Consolidated'
    } as AnyEnrolment;
    
    setSelectedEnrolment(updatedEnrolment);
    
    // After consolidation, switch to share tab
    setActiveTab('share');
    setIsSubmitting(false);
    setConsolidatedFile(null);
    setConsolidationNotes('');
  };

  const handleShare = () => {
    if (!selectedEnrolment || !selectedEnrolment.consolidatedPlans) return;
    
    setIsSubmitting(true);
    
    const updatedConsolidatedPlans = {
      ...selectedEnrolment.consolidatedPlans,
      sharedAt: new Date().toISOString(),
      sharedWith: shareWith,
    };
    
    // Update context enrolment (internal side)
    updateEnrolment(selectedEnrolment.id, {
      consolidatedPlans: updatedConsolidatedPlans,
      status: 'Site Visit Pending' as LearnerEnrolmentStatus
    });
    
    // Also sync to external storage
    syncToExternalStorage(selectedEnrolment.id, {
      consolidatedPlans: updatedConsolidatedPlans,
      status: 'Site Visit Pending'
    });
    
    alert(`Consolidated plans shared with: ${shareWith.join(', ')}\n\nDeputy Director & Director have been notified.\n\nThe enrolment has been moved to Site Visit Management.`);
    
    setIsSubmitting(false);
    setIsViewModalOpen(false);
    setShareWith([]);
  };

  const getLearnerName = (enrolment: AnyEnrolment): string => {
    const details = enrolment.learnerDetails;
    if (details) {
      if ('firstName' in details && details.firstName && 'lastName' in details && details.lastName) {
        return `${details.firstName} ${details.lastName}`;
      }
      if ('name' in details && details.name) {
        return details.name;
      }
    }
    return '-';
  };

  const getQualificationName = (enrolment: AnyEnrolment): string => {
    if ('qualification' in enrolment && enrolment.qualification) {
      return enrolment.qualification.name || '-';
    }
    if ('qualificationId' in enrolment && enrolment.qualificationId) {
      return enrolment.qualificationId;
    }
    return '-';
  };

  const getQuarter = (enrolment: AnyEnrolment): string => {
    if (enrolment.qpAllocation?.quarterlyPeriod) {
      return enrolment.qpAllocation.quarterlyPeriod;
    }
    if ('quarter' in enrolment && enrolment.quarter) {
      return enrolment.quarter;
    }
    return '-';
  };

  const hasConsolidatedPlans = (enrolment: AnyEnrolment): boolean => {
    return 'consolidatedPlans' in enrolment && !!enrolment.consolidatedPlans;
  };

  const getConsolidatedPlans = (enrolment: AnyEnrolment) => {
    return 'consolidatedPlans' in enrolment ? enrolment.consolidatedPlans : undefined;
  };

  const isShared = (enrolment: AnyEnrolment): boolean => {
    return hasConsolidatedPlans(enrolment) && !!getConsolidatedPlans(enrolment)?.sharedAt;
  };

  const getStatusBadge = (status: LearnerEnrolmentStatus | string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      Draft: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Draft' },
      Submitted: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Submitted' },
      'Gate Evaluation Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation Pending' },
      'Gate Evaluation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation In Progress' },
      'Gate Evaluation Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Gate Completed' },
      'Pending Indicator Champion Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Review' },
      'Under Indicator Champion Review': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Review' },
      Approved: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Approved' },
      'Allocated to QA': { color: 'bg-purple-100 text-purple-800', icon: <User className="h-3 w-3 mr-1" />, label: 'Allocated to QA' },
      'Pending QP Allocation': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending QP Allocation' },
      'Allocated to QP': { color: 'bg-blue-100 text-blue-800', icon: <User className="h-3 w-3 mr-1" />, label: 'Allocated to QP' },
      'Plans & Reports Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Plans Pending' },
      'Plans & Reports Submitted': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Plans Submitted' },
      'Plans Consolidated': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Plans Consolidated' },
      'Site Visit Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Site Visit Pending' },
      'Site Visit Scheduled': { color: 'bg-blue-100 text-blue-800', icon: <Calendar className="h-3 w-3 mr-1" />, label: 'Site Visit Scheduled' },
      'Site Visit Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Site Visit Completed' },
    };

    const config = statusConfig[status] ?? {
      color: 'bg-gray-100 text-gray-800',
      icon: <Clock className="h-3 w-3 mr-1" />,
      label: status,
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const safeFormatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString();
    } catch (e) {
      return '-';
    }
  };

  const safeFormatDateTime = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString();
    } catch (e) {
      return '-';
    }
  };

  const canConsolidate = () => {
    return currentUser.role === 'QA Managers' && 
           selectedEnrolment?.status === 'Plans & Reports Submitted';
  };

  const canShare = () => {
    return currentUser.role === 'QA Managers' && 
           selectedEnrolment?.status === 'Plans Consolidated' &&
           hasConsolidatedPlans(selectedEnrolment) &&
           !isShared(selectedEnrolment);
  };

  const allSubmittedEnrolments = [...submittedEnrolments, ...externalSubmittedEnrolments];

  // Get learner rows safely
  const getLearnerRows = (enrolment: AnyEnrolment): LearnerRow[] => {
    if ('learnerRows' in enrolment && enrolment.learnerRows) {
      return enrolment.learnerRows;
    }
    return [];
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Plans Consolidation</h3>
      <p className="text-gray-600">Consolidate plans based on allocations and share with Deputy Director & Director</p>
      
      <div className="text-xs text-green-600 mb-2">🔄 Auto-syncing with external submissions...</div>
      
      {allSubmittedEnrolments.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Submitted Plans & Reports</h4>
            <p className="text-sm text-gray-500">Consolidate plans and share with Deputy Director & Director (by the 10th of each month)</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Quarter</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSubmittedEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{getLearnerName(enrolment)}</TableCell>
                  <TableCell>{getQualificationName(enrolment)}</TableCell>
                  <TableCell>{getQuarter(enrolment)}</TableCell>
                  <TableCell>{safeFormatDate(enrolment.plansReports?.submittedAt)}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Consolidate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No plans and reports submitted yet. Waiting for Quality Partners to submit.
          <div className="text-xs text-gray-400 mt-2">Listening for external submissions...</div>
        </div>
      )}

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consolidate & Share Plans</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation</TabsTrigger>
                <TabsTrigger value="draftReport">Draft Report</TabsTrigger>
                <TabsTrigger value="consolidation">Consolidation</TabsTrigger>
                <TabsTrigger value="share">Share</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Enrolment Details */}
              <TabsContent value="details" className="space-y-6 py-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Submission Header</h3>
                      <p className="text-sm text-gray-600">Full enrolment submission details allocated to this Quality Partner.</p>
                    </div>
                    {getStatusBadge(selectedEnrolment.status)}
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div><p className="text-xs text-gray-500">Enrolment ID</p><p className="font-medium">{selectedEnrolment.enrolmentId}</p></div>
                    <div><p className="text-xs text-gray-500">SDP Code</p><p className="font-medium">{'sdpCode' in selectedEnrolment ? selectedEnrolment.sdpCode || '-' : '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Qualification ID</p><p className="font-medium">{getQualificationName(selectedEnrolment)}</p></div>
                    <div><p className="text-xs text-gray-500">Assessment Centre Code</p><p className="font-medium">{'assessmentCentreCode' in selectedEnrolment ? selectedEnrolment.assessmentCentreCode || '-' : '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Date Stamp</p><p className="font-medium">{'dateStamp' in selectedEnrolment ? selectedEnrolment.dateStamp || '-' : '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Quarter</p><p className="font-medium">{getQuarter(selectedEnrolment)}</p></div>
                    <div><p className="text-xs text-gray-500">Uploaded File</p><p className="font-medium">{'uploadedFileName' in selectedEnrolment ? selectedEnrolment.uploadedFileName || 'Manual only' : '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Submitted By</p><p className="font-medium">{'submittedBy' in selectedEnrolment ? selectedEnrolment.submittedBy || '-' : '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Submitted At</p><p className="font-medium">{safeFormatDateTime(selectedEnrolment.plansReports?.submittedAt)}</p></div>
                    <div><p className="text-xs text-gray-500">QP Allocation</p><p className="font-medium">{selectedEnrolment.qpAllocation?.allocatedTo || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">QP Allocation Date</p><p className="font-medium">{safeFormatDateTime(selectedEnrolment.qpAllocation?.allocatedAt)}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Learner Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Name</Label><p className="font-medium">{getLearnerName(selectedEnrolment)}</p></div>
                    <div><Label className="text-sm text-gray-500">ID Number</Label><p className="font-medium">{selectedEnrolment.learnerDetails?.idNumber || '-'}</p></div>
                    <div><Label className="text-sm text-gray-500">Email</Label><p className="font-medium">{selectedEnrolment.learnerDetails?.email || '-'}</p></div>
                    <div><Label className="text-sm text-gray-500">Phone</Label><p className="font-medium">{selectedEnrolment.learnerDetails?.phone || '-'}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Qualification Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Qualification Name</Label><p className="font-medium">{getQualificationName(selectedEnrolment)}</p></div>
                    <div><Label className="text-sm text-gray-500">Code</Label><p className="font-medium">{selectedEnrolment.qualification?.code || '-'}</p></div>
                  </div>
                </div>

                {/* Learner Rows Table */}
                <div className="rounded-2xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-5 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Learner Rows</h3>
                    <p className="text-sm text-gray-600">These rows reflect the same learner data captured earlier in the process.</p>
                  </div>

                  <div className="overflow-x-auto p-5">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>National ID</TableHead>
                          <TableHead>Alternate ID</TableHead>
                          <TableHead>Last Name</TableHead>
                          <TableHead>First Name</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Birth Date</TableHead>
                          <TableHead>Province</TableHead>
                          <TableHead>POPIA Agree</TableHead>
                          <TableHead>SOR Status</TableHead>
                          <TableHead>Readiness Type</TableHead>
                          <TableHead>FLC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getLearnerRows(selectedEnrolment).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={11} className="py-10 text-center text-gray-500">
                              No learner rows found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          getLearnerRows(selectedEnrolment).map((row: LearnerRow) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.nationalId || '-'}</TableCell>
                              <TableCell>{row.alternateId || '-'}</TableCell>
                              <TableCell>{row.lastName || '-'}</TableCell>
                              <TableCell>{row.firstName || '-'}</TableCell>
                              <TableCell>{genderLabelMap[row.gender] || row.gender || '-'}</TableCell>
                              <TableCell>{formatDisplayDate(row.birthDate)}</TableCell>
                              <TableCell>{provinceLabelMap[row.province] || row.province || '-'}</TableCell>
                              <TableCell>{row.popiaAgree || '-'}</TableCell>
                              <TableCell>{sorStatusLabelMap[row.sorStatus] || row.sorStatus || '-'}</TableCell>
                              <TableCell>{readinessTypeLabelMap[row.readinessType] || row.readinessType || '-'}</TableCell>
                              <TableCell>{flcLabelMap[row.flc] || row.flc || '-'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab 2: Gate Evaluation */}
              <TabsContent value="gateEvaluation" className="space-y-6 py-4">
                {!hasGateEvaluation(selectedEnrolment) ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm text-gray-600">No gate evaluation has been completed for this enrolment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${selectedEnrolment.gateEvaluation.status === 'passed' ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className={`font-medium ${selectedEnrolment.gateEvaluation.status === 'passed' ? 'text-green-800' : 'text-red-800'}`}>
                        {selectedEnrolment.gateEvaluation.status === 'passed' ? '✓ Gate Evaluation Passed' : '✗ Gate Evaluation Failed'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Generated: {safeFormatDateTime(selectedEnrolment.gateEvaluation.generatedAt)}</p>
                    </div>

                    {selectedEnrolment.gateEvaluation.checklistResults && selectedEnrolment.gateEvaluation.checklistResults.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <h4 className="font-medium mb-3">Gate Evaluation Checklist Results</h4>
                        <div className="space-y-3">
                          {selectedEnrolment.gateEvaluation.checklistResults.map((item: GateCheckItem, idx: number) => (
                            <div key={idx} className={`rounded-xl border p-4 ${item.isMet ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                {item.isMet ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                                <span className="font-medium">{item.criteria}</span>
                              </div>
                              <p className="text-sm text-gray-700">{item.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEnrolment.gateEvaluation.failureReasons && selectedEnrolment.gateEvaluation.failureReasons.length > 0 && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                        <h4 className="font-medium text-red-900 mb-3">Failure Details</h4>
                        <div className="space-y-2">
                          {selectedEnrolment.gateEvaluation.failureReasons.map((reason: string, idx: number) => (
                            <div key={idx} className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-medium text-red-900">{reason}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 3: Draft Report */}
              <TabsContent value="draftReport" className="space-y-5 py-4">
                {!hasDraftReport(selectedEnrolment) ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm text-gray-600">No draft report is available for this enrolment.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
                        <div>
                          <p className="font-semibold text-green-900">Draft learner enrolment report generated</p>
                          <p className="text-sm text-green-800">Full report data carried forward from the external submission.</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                      <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedEnrolment.draftReport.reportTitle}</h3>
                          <p className="text-sm text-gray-600">Generated learner enrolment validation report.</p>
                        </div>
                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                          <p className="text-gray-500">Generated</p>
                          <p className="font-semibold text-gray-900">{safeFormatDateTime(selectedEnrolment.draftReport.generatedAt)}</p>
                        </div>
                      </div>

                      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Total Rows</p><p className="mt-1 text-2xl font-bold">{selectedEnrolment.draftReport.summary.totalRows}</p></div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Valid Rows</p><p className="mt-1 text-2xl font-bold text-green-700">{selectedEnrolment.draftReport.summary.validRows}</p></div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Invalid Rows</p><p className="mt-1 text-2xl font-bold text-red-700">{selectedEnrolment.draftReport.summary.invalidRows}</p></div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Method</p><p className="mt-1 font-semibold capitalize">{selectedEnrolment.draftReport.summary.submissionMethod}</p></div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Uploaded File</p><p className="mt-1 font-semibold">{selectedEnrolment.draftReport.summary.uploadedFileName || 'Manual only'}</p></div>
                      </div>

                      <div className="mb-6">
                        <h4 className="mb-3 text-base font-semibold text-gray-900">Validation Checks</h4>
                        <div className="space-y-3">
                          {selectedEnrolment.draftReport.validationChecks.map((check: GateCheckItem, index: number) => (
                            <div key={index} className={`rounded-xl border p-4 ${check.isMet ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                              <div className="mb-1 flex items-center gap-2">
                                {check.isMet ? <CheckCircle2 className="h-4 w-4 text-green-700" /> : <XCircle className="h-4 w-4 text-red-700" />}
                                <p className="font-semibold text-gray-900">{check.criteria}</p>
                              </div>
                              <p className="text-sm text-gray-700">{check.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-3 text-base font-semibold text-gray-900">Report Notes</h4>
                        <div className="space-y-2">
                          {selectedEnrolment.draftReport.notes.map((note: string, index: number) => (
                            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{note}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 4: Consolidation */}
              <TabsContent value="consolidation" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Consolidate Plans</h3>
                  
                  {canConsolidate() && !hasConsolidatedPlans(selectedEnrolment) && (
                    <div className="space-y-4">
                      <div>
                        <Label>Upload Consolidated Plan *</Label>
                        <div className="flex items-center gap-4 mt-1">
                          <Input
                            type="file"
                            onChange={(e) => setConsolidatedFile(e.target.files?.[0] || null)}
                            accept=".pdf,.doc,.docx"
                            className="flex-1"
                          />
                          <Button variant="outline" type="button" disabled={!consolidatedFile}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Consolidate all QP submissions into a comprehensive plan</p>
                      </div>
                      
                      <div>
                        <Label>Consolidation Notes</Label>
                        <Textarea
                          value={consolidationNotes}
                          onChange={(e) => setConsolidationNotes(e.target.value)}
                          placeholder="Add notes about the consolidation..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleConsolidate}
                        disabled={!consolidatedFile || isSubmitting}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Consolidate & Prepare for Sharing
                      </Button>
                    </div>
                  )}
                  
                  {hasConsolidatedPlans(selectedEnrolment) && !isShared(selectedEnrolment) && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-purple-800 font-medium">✓ Plans Consolidated</p>
                      <a href={getConsolidatedPlans(selectedEnrolment)?.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                        <FileText className="h-4 w-4" />
                        {getConsolidatedPlans(selectedEnrolment)?.documentName}
                      </a>
                      <p className="text-xs text-gray-500 mt-2">Consolidated by: {getConsolidatedPlans(selectedEnrolment)?.uploadedBy || '-'}</p>
                      <p className="text-xs text-gray-500">Consolidated on: {safeFormatDate(getConsolidatedPlans(selectedEnrolment)?.uploadedAt)}</p>
                      {getConsolidatedPlans(selectedEnrolment)?.notes && (
                        <p className="text-sm text-gray-600 mt-2">Notes: {getConsolidatedPlans(selectedEnrolment)?.notes}</p>
                      )}
                      <Button 
                        onClick={() => setActiveTab('share')}
                        className="mt-3 bg-blue-600 hover:bg-blue-700"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Go to Share Tab
                      </Button>
                    </div>
                  )}

                  {isShared(selectedEnrolment) && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Plans Already Shared</p>
                      <p className="text-sm text-gray-600 mt-2">This enrolment has been moved to Site Visit Management.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Tab 5: Share */}
              <TabsContent value="share" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Share with Stakeholders</h3>
                  
                  {canShare() && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">✓ Plans have been consolidated. Now share with stakeholders to proceed to Site Visit.</p>
                      </div>
                      
                      <div>
                        <Label>Share With *</Label>
                        <div className="space-y-2 mt-1">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="David Deputy"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setShareWith([...shareWith, e.target.value]);
                                } else {
                                  setShareWith(shareWith.filter(s => s !== e.target.value));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span>David Deputy (Deputy Director)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Diana Director"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setShareWith([...shareWith, e.target.value]);
                                } else {
                                  setShareWith(shareWith.filter(s => s !== e.target.value));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span>Diana Director (Director)</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value="Charles Chief"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setShareWith([...shareWith, e.target.value]);
                                } else {
                                  setShareWith(shareWith.filter(s => s !== e.target.value));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span>Charles Chief (Chief Director) - Optional</span>
                          </label>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleShare}
                        disabled={shareWith.length === 0 || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Consolidated Plans & Move to Site Visit
                      </Button>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                        <p className="text-yellow-800 font-medium">Important:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                          <li>Must be shared by the 10th of every month</li>
                          <li>Deputy Director & Director must be copied</li>
                          <li>Once shared, the enrolment will move to Site Visit Management</li>
                          <li>Domain Expert will be notified automatically</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {!canShare() && hasConsolidatedPlans(selectedEnrolment) && isShared(selectedEnrolment) && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Plans Already Shared</p>
                      <p className="text-sm text-gray-600">Shared with: {getConsolidatedPlans(selectedEnrolment)?.sharedWith?.join(', ')}</p>
                      <p className="text-xs text-gray-500 mt-2">Shared on: {safeFormatDate(getConsolidatedPlans(selectedEnrolment)?.sharedAt)}</p>
                      <p className="text-sm text-blue-600 mt-2">This enrolment has been moved to Site Visit Management.</p>
                    </div>
                  )}
                  
                  {!hasConsolidatedPlans(selectedEnrolment) && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-yellow-800 font-medium">⚠ Consolidation Required</p>
                      <p className="text-sm text-yellow-700">Please upload and consolidate plans first before sharing.</p>
                      <Button 
                        onClick={() => setActiveTab('consolidation')}
                        variant="outline"
                        className="mt-2"
                      >
                        Go to Consolidation Tab
                      </Button>
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

export default PlansConsolidation;