import React, { useState, useEffect } from 'react';
import { FileCheck, FileText, Clock, Plus, Send, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

const STORAGE_KEY = 'fisa_validation_submissions';

interface FisaValidationSubmission {
  id: string;
  fisaCode: string;
  fisaTitle: string;
  instrumentName: string;
  description: string;
  submissionDate: string;
  status: 'pending' | 'allocated' | 'in_progress' | 'completed';
  allocatedAsd?: string;
  validationDate?: string;
}

export default function ExternalValidationOfFisa() {
  const [submissions, setSubmissions] = useState<FisaValidationSubmission[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    fisaCode: '',
    fisaTitle: '',
    instrumentName: '',
    description: '',
  });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FisaValidationSubmission | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    loadSubmissions();

    // Listen for storage changes (when internal page updates status)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadSubmissions();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadSubmissions, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const loadSubmissions = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSubmissions(JSON.parse(stored));
    }
  };

  const saveSubmissions = (updatedSubmissions: FisaValidationSubmission[]) => {
    setSubmissions(updatedSubmissions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSubmissions));
    // Dispatch event so other tabs/windows can sync
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const newSubmission: FisaValidationSubmission = {
      id: Date.now().toString(),
      fisaCode: formData.fisaCode,
      fisaTitle: formData.fisaTitle,
      instrumentName: formData.instrumentName,
      description: formData.description,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'pending',
    };

    saveSubmissions([newSubmission, ...submissions]);
    setIsFormOpen(false);
    setFormData({ fisaCode: '', fisaTitle: '', instrumentName: '', description: '' });
    
    // Show success message
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': 
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Allocation</Badge>;
      case 'allocated': 
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Allocated to ASD</Badge>;
      case 'in_progress': 
        return <Badge variant="default" className="bg-purple-600">In Progress</Badge>;
      case 'completed': 
        return <Badge variant="default" className="bg-green-600">Completed ✓</Badge>;
      default: 
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'in_progress') return <AlertCircle className="h-4 w-4 text-purple-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-white shadow-lg animate-in slide-in-from-right-5">
          <CheckCircle2 className="h-5 w-5" />
          <span>FISA validation notification submitted successfully!</span>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Validation of FISA</h1>
            <p className="mt-2 text-sm text-gray-600">
              Notify the assessment Standards Domain of upcoming FISA validations. Your request will be reviewed and allocated to an ASD.
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2 bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4" />
            Notify New FISA Validation
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard 
          title="Submitted Validations" 
          value={String(submissions.length)} 
          icon={<FileCheck className="h-5 w-5" />} 
          description="Total notifications sent"
        />
        <InfoCard 
          title="Pending Review" 
          value={String(submissions.filter(s => s.status === 'pending').length)} 
          icon={<Clock className="h-5 w-5" />} 
          description="Awaiting allocation"
        />
        <InfoCard 
          title="Completed" 
          value={String(submissions.filter(s => s.status === 'completed').length)} 
          icon={<FileText className="h-5 w-5" />} 
          description="Successfully validated"
        />
      </div>

      {submissions.length > 0 ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Validation Notifications</h2>
            <p className="text-xs text-gray-500">Status updates are real-time</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>FISA Code</TableHead>
                  <TableHead>FISA Title</TableHead>
                  <TableHead>Instrument Name</TableHead>
                  <TableHead>Submission Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validation Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission, idx) => (
                  <TableRow key={submission.id} className="hover:bg-gray-50">
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{submission.fisaCode}</TableCell>
                    <TableCell>{submission.fisaTitle}</TableCell>
                    <TableCell>{submission.instrumentName}</TableCell>
                    <TableCell>{submission.submissionDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(submission.status)}
                        {getStatusBadge(submission.status)}
                      </div>
                    </TableCell>
                    <TableCell>{submission.validationDate || '-'}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setSelectedSubmission(submission); setIsViewModalOpen(true); }}
                        className="hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Validation Notifications Yet</h3>
          <p className="text-sm text-gray-500 mb-4">Click the "Notify New FISA Validation" button to submit your first validation request.</p>
          <Button onClick={() => setIsFormOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Notification
          </Button>
        </div>
      )}

      {/* New Validation Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Notify FISA Validation</DialogTitle>
            <DialogDescription>
              Submit a new FISA validation request to the assessment standards domain. 
              An Assistant Director will review and allocate an ASD to your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>FISA Code *</Label>
              <Input 
                value={formData.fisaCode} 
                onChange={(e) => handleInputChange('fisaCode', e.target.value)} 
                placeholder="e.g., FISA-001" 
                className="focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <Label>FISA Title *</Label>
              <Input 
                value={formData.fisaTitle} 
                onChange={(e) => handleInputChange('fisaTitle', e.target.value)} 
                placeholder="Enter FISA title" 
                className="focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <Label>Instrument Name *</Label>
              <Input 
                value={formData.instrumentName} 
                onChange={(e) => handleInputChange('instrumentName', e.target.value)} 
                placeholder="Enter instrument name" 
                className="focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <Label>Description / Notes</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => handleInputChange('description', e.target.value)} 
                placeholder="Additional details about the validation (e.g., specific requirements, deadlines, etc.)" 
                rows={3}
                className="focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.fisaCode || !formData.fisaTitle || !formData.instrumentName}
              className="bg-red-600 hover:bg-red-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Validation Details</DialogTitle>
            <DialogDescription>Detailed information about your FISA validation request</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="border-b pb-2">
                  <Label className="text-gray-500 text-xs uppercase tracking-wide">FISA Code</Label>
                  <p className="font-medium text-gray-900">{selectedSubmission.fisaCode}</p>
                </div>
                <div className="border-b pb-2">
                  <Label className="text-gray-500 text-xs uppercase tracking-wide">FISA Title</Label>
                  <p className="font-medium text-gray-900">{selectedSubmission.fisaTitle}</p>
                </div>
                <div className="border-b pb-2">
                  <Label className="text-gray-500 text-xs uppercase tracking-wide">Instrument Name</Label>
                  <p className="font-medium text-gray-900">{selectedSubmission.instrumentName}</p>
                </div>
                <div className="border-b pb-2">
                  <Label className="text-gray-500 text-xs uppercase tracking-wide">Description</Label>
                  <p className="text-sm text-gray-700">{selectedSubmission.description || 'No additional notes'}</p>
                </div>
                <div className="border-b pb-2">
                  <Label className="text-gray-500 text-xs uppercase tracking-wide">Submission Date</Label>
                  <p className="font-medium text-gray-900">{selectedSubmission.submissionDate}</p>
                </div>
                {selectedSubmission.validationDate && (
                  <div className="border-b pb-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Validation Date</Label>
                    <p className="font-medium text-gray-900">{selectedSubmission.validationDate}</p>
                  </div>
                )}
                {selectedSubmission.allocatedAsd && (
                  <div className="border-b pb-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Allocated ASD</Label>
                    <p className="font-medium text-gray-900">{selectedSubmission.allocatedAsd}</p>
                  </div>
                )}
                <div className="pt-2">
                  <Label className="text-gray-500 text-xs uppercase tracking-wide">Current Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
        </div>
        <div className="rounded-full bg-red-50 p-3 text-red-600">{icon}</div>
      </div>
    </div>
  );
}