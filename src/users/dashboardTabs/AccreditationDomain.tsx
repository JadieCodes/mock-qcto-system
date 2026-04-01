import React, { useState, useEffect } from 'react';
import ApplicationRegistration from '@/pages/accreditation/applicationRegistration';
import ApplicationDashboard from '@/pages/accreditation/applicationDashboard';
import DocumentUpload from '@/pages/accreditation/documentUpload';
import { mockAccreditationService } from '@/services/mockAccreditationService';
import type { ApplicationStatus, ApplicationForm, AccreditationDocument } from '@/types';

export default function AccreditationDomain() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'upload'>('dashboard');
  const [currentApplicationId, setCurrentApplicationId] = useState<string>('');
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [currentDocuments, setCurrentDocuments] = useState<AccreditationDocument[]>([]);

  // Load applications from service on mount
  useEffect(() => {
    setApplications(mockAccreditationService.getApplications());
  }, []);

  const handleStartApplication = () => {
    setCurrentView('form');
  };

  const handleApplicationSaved = (applicationData: ApplicationForm) => {
    // Step 1: Initial form submission (no documents)
    const newApplication = mockAccreditationService.createApplication(applicationData);
    setApplications(mockAccreditationService.getApplications());
    
    setCurrentView('dashboard');
    alert('Application form submitted successfully! It will now be reviewed by the accreditation team.');
  };

  const handleDocumentsUploaded = (files: File[], type: string) => {
    // Step 4: Documents uploaded after initial approval
    const newDocuments: AccreditationDocument[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      type: type as any,
      name: file.name,
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      verified: false,
    }));
    
    setCurrentDocuments(prev => [...prev, ...newDocuments]);
  };

  const handleSubmitDocuments = () => {
    // Step 4 completion: Submit documents for final review
    mockAccreditationService.addDocuments(currentApplicationId, currentDocuments);
    mockAccreditationService.updateStatus(currentApplicationId, 'step4_documents_uploaded');
    
    setApplications(mockAccreditationService.getApplications());
    setCurrentView('dashboard');
    alert('Documents submitted successfully! They will now be evaluated by our AI system and the accreditation team.');
  };

  const handleViewApplication = (id: string) => {
    if (id === 'new') {
      handleStartApplication();
    } else {
      const app = mockAccreditationService.getApplicationById(id);
      if (app) {
        // If status is step3_initial_approved, show document upload
        if (app.status === 'step3_initial_approved') {
          setCurrentApplicationId(id);
          setCurrentDocuments(app.applicationData?.documents || []);
          setCurrentView('upload');
        } else {
          // Just view details
          console.log('View application:', id);
        }
      }
    }
  };

  const handleUploadDocument = (id: string) => {
    const app = mockAccreditationService.getApplicationById(id);
    if (app && app.status === 'step7_payment_pending') {
      setCurrentApplicationId(id);
      setCurrentDocuments(app.proofOfPayment || []);
      setCurrentView('upload');
    } else if (app && app.status === 'step3_initial_approved') {
      setCurrentApplicationId(id);
      setCurrentDocuments(app.applicationData?.documents || []);
      setCurrentView('upload');
    }
  };

  const handleViewOutcomeLetter = (id: string) => {
    const app = mockAccreditationService.getApplicationById(id);
    if (app?.outcomeLetter) {
      window.open(app.outcomeLetter.letterUrl, '_blank');
    }
  };

  const handleViewSiteVisit = (id: string) => {
    console.log('View site visit for:', id);
  };

const handlePaymentUpload = (files: File[]) => {
  // Step 8: Upload proof of payment
  const newDocuments: AccreditationDocument[] = files.map((file, index) => ({
    id: `${Date.now()}-${index}`,
    type: 'proof_of_payment',
    name: file.name,
    fileUrl: URL.createObjectURL(file),
    uploadedAt: new Date().toISOString(),
    fileSize: file.size,
    verified: false,
  }));
  
  // Get the current application to preserve existing proof of payment
  const currentApp = mockAccreditationService.getApplicationById(currentApplicationId);
  const existingProofs = currentApp?.proofOfPayment || [];
  
  mockAccreditationService.updateApplication(currentApplicationId, {
    proofOfPayment: [...existingProofs, ...newDocuments],
    status: 'step8_payment_uploaded', // This should update to payment uploaded status
    paymentStatus: 'paid',
    lastUpdated: new Date().toISOString(),
  });
  
  setApplications(mockAccreditationService.getApplications());
  setCurrentView('dashboard');
  alert('Proof of payment uploaded successfully! It will now be verified.');
};

return (
  <div className="p-4">
    {currentView === 'dashboard' && (
      <ApplicationDashboard
        applications={applications}
        onViewApplication={handleViewApplication}
        onUploadDocument={handleUploadDocument}
        onViewOutcomeLetter={handleViewOutcomeLetter}
        onViewSiteVisit={handleViewSiteVisit}
      />
    )}

    {currentView === 'form' && (
      <ApplicationRegistration onSave={handleApplicationSaved} />
    )}

    {currentView === 'upload' && (
      <DocumentUpload
        applicationId={currentApplicationId}
        documents={currentDocuments}
        onUpload={handleDocumentsUploaded}
        onPaymentUpload={handlePaymentUpload} // Make sure this is passed
        onNext={handleSubmitDocuments}
        onBack={() => setCurrentView('dashboard')}
        isPaymentUpload={applications.find(a => a.id === currentApplicationId)?.status === 'step7_payment_pending'}
      />
    )}
  </div>
);
}


// Mock data for demonstration - UPDATED to use new status types
const mockApplications: ApplicationStatus[] = [
  {
    id: '1',
    applicationId: 'APP-2024001',
    status: 'step2_under_initial_review', // Changed from 'under_review'
    submittedDate: '2024-01-15T10:00:00Z',
    lastUpdated: '2024-01-20T14:30:00Z',
    paymentStatus: 'pending',
   siteVisitSchedule: {
  scheduledDate: '2024-02-01',
  scheduledTime: '10:00',
  venue: '123 Training St, Johannesburg',
  status: 'pending_acceptance', // Valid status from SiteVisitStatus
},
    applicationData: {
      applicantInfo: {
        fullName: 'John Doe',
        idNumber: '8001015000088',
        email: 'john@example.com',
        phone: '0821234567',
        companyName: 'ABC Training Pty Ltd',
        organisationName: 'ABC Training Centre',
        trainingLocation: '123 Training St, Johannesburg',
        region: 'Gauteng',
        companyRegistration: '2020/123456/07',
      },
      qualification: 'Occupational Certificate: Electrician',
      applicationType: 'OC',
    },
  },
  {
    id: '2',
    applicationId: 'APP-2024002',
    status: 'step6_final_approved', // Changed from 'approved'
    submittedDate: '2024-01-10T09:00:00Z',
    lastUpdated: '2024-01-25T11:00:00Z',
    paymentStatus: 'verified',
    outcomeLetter: {
      letterUrl: '/letters/APP-2024002.pdf',
      issuedDate: '2024-01-25',
      outcome: 'approved',
      validUntil: '2026-01-25',
    },
    applicationData: {
      applicantInfo: {
        fullName: 'Jane Smith',
        idNumber: '8202026000123',
        email: 'jane@example.com',
        phone: '0839876543',
        companyName: 'XYZ Skills Development',
        organisationName: 'XYZ Training Institute',
        trainingLocation: '456 Business Park, Cape Town',
        region: 'Western Cape',
        companyRegistration: '2019/987654/07',
      },
      qualification: 'Skills Programme: Project Management',
      applicationType: 'SP',
    },
  },
];