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
import { Eye, FileText, Upload, Send, Clock, CheckCircle, User, Share2,Calendar } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

const PlansConsolidation = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [consolidatedFile, setConsolidatedFile] = useState<File | null>(null);
  const [consolidationNotes, setConsolidationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareWith, setShareWith] = useState<string[]>([]);

  // Filter enrolments with submitted plans and reports
  const submittedEnrolments = enrolments.filter(e => 
    e.status === 'Plans & Reports Submitted'
  );

  useEffect(() => {
    console.log('Submitted enrolments:', submittedEnrolments);
  }, [submittedEnrolments]);

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setConsolidatedFile(null);
    setConsolidationNotes('');
    setShareWith([]);
  };

  const handleConsolidateAndShare = () => {
    if (!selectedEnrolment || !consolidatedFile) return;
    
    setIsSubmitting(true);
    
    updateEnrolment(selectedEnrolment.id, {
      consolidatedPlans: {
        documentUrl: URL.createObjectURL(consolidatedFile),
        documentName: consolidatedFile.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.name,
        sharedAt: new Date().toISOString(),
        sharedWith: shareWith,
        notes: consolidationNotes,
      },
      status: 'Plans Consolidated' as LearnerEnrolmentStatus
    });
    
    setIsSubmitting(false);
    setIsViewModalOpen(false);
    setConsolidatedFile(null);
    setConsolidationNotes('');
    setShareWith([]);
  };

  const handleShare = () => {
    if (!selectedEnrolment || !selectedEnrolment.consolidatedPlans) return;
    
    // Simulate sharing - in production, this would send emails/notifications
    alert(`Consolidated plans shared with: ${shareWith.join(', ')}\n\nDeputy Director & Director have been notified.`);
    
    setIsViewModalOpen(false);
  };

const getStatusBadge = (status: LearnerEnrolmentStatus) => {
  const statusConfig: Record<LearnerEnrolmentStatus, { color: string; icon: React.ReactNode; label: string }> = {
    'Draft': { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Draft' },
    'Submitted': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Submitted' },
    'Gate Evaluation Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation Pending' },
    'Gate Evaluation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation In Progress' },
    'Gate Evaluation Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Gate Completed' },
    'Pending Indicator Champion Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Review' },
    'Under Indicator Champion Review': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Review' },
    'Approved': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Approved' },
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
  const config = statusConfig[status] || statusConfig['Plans & Reports Submitted'];
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
    // Check if date is valid
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  } catch (e) {
    return '-';
  }
};

// Also add safeFormatDateOnly if you need just the date without time
const safeFormatDateOnly = (dateString: string | undefined | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString();
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
           selectedEnrolment.consolidatedPlans;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Plans Consolidation</h3>
      <p className="text-gray-600">Consolidate plans based on allocations and share with Deputy Director & Director</p>
      
      {submittedEnrolments.length > 0 ? (
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
              {submittedEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{enrolment.qpAllocation?.quarterlyPeriod || '-'}</TableCell>
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
        </div>
      )}

      {/* Consolidation Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consolidate & Share Plans</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Enrolment Details</TabsTrigger>
                <TabsTrigger value="submittedPlans">Submitted Plans</TabsTrigger>
                <TabsTrigger value="consolidation">Consolidation</TabsTrigger>
                <TabsTrigger value="share">Share</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Enrolment Details */}
              <TabsContent value="details" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Learner Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Name</Label><p className="font-medium">{`${selectedEnrolment.learnerDetails.firstName} ${selectedEnrolment.learnerDetails.lastName}`}</p></div>
                    <div><Label className="text-sm text-gray-500">ID Number</Label><p className="font-medium">{selectedEnrolment.learnerDetails.idNumber}</p></div>
                    <div><Label className="text-sm text-gray-500">Email</Label><p className="font-medium">{selectedEnrolment.learnerDetails.email}</p></div>
                    <div><Label className="text-sm text-gray-500">Phone</Label><p className="font-medium">{selectedEnrolment.learnerDetails.phone}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Qualification Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Qualification Name</Label><p className="font-medium">{selectedEnrolment.qualification.name}</p></div>
                    <div><Label className="text-sm text-gray-500">Code</Label><p className="font-medium">{selectedEnrolment.qualification.code}</p></div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab 2: Submitted Plans */}
              <TabsContent value="submittedPlans" className="space-y-6 py-4">
                {selectedEnrolment.plansReports && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800 font-medium">✓ Plans & Reports Submitted by QP</p>
                      <a href={selectedEnrolment.plansReports.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                        <FileText className="h-4 w-4" />
                        {selectedEnrolment.plansReports.documentName}
                      </a>
                      <p className="text-xs text-gray-500 mt-2">Submitted by: {selectedEnrolment.plansReports.uploadedBy}</p>
                     <p className="text-xs text-gray-500">Submitted on: {safeFormatDate(selectedEnrolment.plansReports?.submittedAt)}</p>
                      {selectedEnrolment.plansReports.notes && (
                        <p className="text-sm text-gray-600 mt-2">Notes: {selectedEnrolment.plansReports.notes}</p>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 3: Consolidation */}
              <TabsContent value="consolidation" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Consolidate Plans</h3>
                  
                  {canConsolidate() && (
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
                        onClick={handleConsolidateAndShare}
                        disabled={!consolidatedFile || isSubmitting}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Consolidate & Prepare for Sharing
                      </Button>
                    </div>
                  )}
                  
                 {selectedEnrolment.consolidatedPlans && (
  <div className="bg-purple-50 p-4 rounded-lg">
    <p className="text-purple-800 font-medium">✓ Plans Consolidated</p>
    <a href={selectedEnrolment.consolidatedPlans.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
      <FileText className="h-4 w-4" />
      {selectedEnrolment.consolidatedPlans.documentName}
    </a>
    <p className="text-xs text-gray-500 mt-2">Consolidated by: {selectedEnrolment.consolidatedPlans.uploadedBy || '-'}</p>
    <p className="text-xs text-gray-500">Consolidated on: {safeFormatDate(selectedEnrolment.consolidatedPlans.uploadedAt)}</p>
  </div>
)}
                </div>
              </TabsContent>
              
              {/* Tab 4: Share */}
              <TabsContent value="share" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Share with Stakeholders</h3>
                  
                  {canShare() && (
                    <div className="space-y-4">
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
                        disabled={shareWith.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Consolidated Plans
                      </Button>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                        <p className="text-yellow-800 font-medium">Important:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                          <li>Must be shared by the 10th of every month</li>
                          <li>Deputy Director & Director must be copied</li>
                          <li>Domain Expert will be notified automatically</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {selectedEnrolment.consolidatedPlans?.sharedAt && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Plans Shared</p>
                      <p className="text-sm text-gray-600">Shared with: {selectedEnrolment.consolidatedPlans.sharedWith?.join(', ')}</p>
                      <p className="text-xs text-gray-500 mt-2">Shared on: {new Date(selectedEnrolment.consolidatedPlans.sharedAt).toLocaleString()}</p>
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