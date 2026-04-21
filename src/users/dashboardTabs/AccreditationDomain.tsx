import React, { useState, useEffect } from 'react';
import { AccreditationExternalLayout } from '@/components/AccreditationExternalLayout';
import ApplicationRegistration from '@/pages/accreditation/applicationRegistration';
import ApplicationDashboard from '@/pages/accreditation/applicationDashboard';
import DocumentUpload from '@/pages/accreditation/documentUpload';
import QPDashboard from '@/pages/accreditation/QPDashboard';
import VerifierDashboard from '@/pages/accreditation/VerifierDashboard';
import { mockAccreditationService } from '@/services/mockAccreditationService';
import type { ApplicationStatus, ApplicationForm, AccreditationDocument } from '@/types';

type AccreditationRole = 'applicant' | 'qp' | 'verifier';

export default function AccreditationDomain() {
  const [activeTab, setActiveTab] = useState('applications');
  const [currentRole, setCurrentRole] = useState<AccreditationRole>('applicant');
  const [currentUserName, setCurrentUserName] = useState('John Applicant');

  const [currentView, setCurrentView] = useState<'dashboard' | 'form' | 'upload'>('dashboard');
  const [currentApplicationId, setCurrentApplicationId] = useState<string>('');
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [currentDocuments, setCurrentDocuments] = useState<AccreditationDocument[]>([]);

  useEffect(() => {
    setApplications(mockAccreditationService.getApplications());
  }, []);

  const refreshApplications = () => {
    setApplications(mockAccreditationService.getApplications());
  };

  const handleRoleChange = (role: AccreditationRole) => {
    setCurrentRole(role);

    if (role === 'applicant') setCurrentUserName('John Applicant');
    if (role === 'qp') setCurrentUserName('John Smith');
    if (role === 'verifier') setCurrentUserName('David Brown');

    setActiveTab('applications');
    setCurrentView('dashboard');
  };

  const handleStartApplication = () => {
    setCurrentView('form');
    setActiveTab('newApplication');
  };

  const handleApplicationSaved = (applicationData: ApplicationForm) => {
    mockAccreditationService.createApplication(applicationData);
    refreshApplications();
    setCurrentView('dashboard');
    setActiveTab('applications');
    alert('Application form submitted successfully! It will now be reviewed by the accreditation team.');
  };

  const handleDocumentsUploaded = (files: File[], type: string) => {
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
    mockAccreditationService.addDocuments(currentApplicationId, currentDocuments);
    mockAccreditationService.updateStatus(currentApplicationId, 'step4_documents_uploaded');

    refreshApplications();
    setCurrentView('dashboard');
    setActiveTab('applications');
    alert('Documents submitted successfully! They will now be evaluated by our AI system and the accreditation team.');
  };

  const handleViewApplication = (id: string) => {
    if (id === 'new') {
      handleStartApplication();
      return;
    }

    const app = mockAccreditationService.getApplicationById(id);
    if (!app) return;

    if (app.status === 'step3_initial_approved') {
      setCurrentApplicationId(id);
      setCurrentDocuments(app.applicationData?.documents || []);
      setCurrentView('upload');
      setActiveTab('documentUpload');
    } else {
      setCurrentView('dashboard');
      setActiveTab('applications');
    }
  };

  const handleUploadDocument = (id: string) => {
    const app = mockAccreditationService.getApplicationById(id);

    if (app && app.status === 'step7_payment_pending') {
      setCurrentApplicationId(id);
      setCurrentDocuments(app.proofOfPayment || []);
      setCurrentView('upload');
      setActiveTab('documentUpload');
    } else if (app && app.status === 'step3_initial_approved') {
      setCurrentApplicationId(id);
      setCurrentDocuments(app.applicationData?.documents || []);
      setCurrentView('upload');
      setActiveTab('documentUpload');
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
    const newDocuments: AccreditationDocument[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      type: 'proof_of_payment',
      name: file.name,
      fileUrl: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      verified: false,
    }));

    const currentApp = mockAccreditationService.getApplicationById(currentApplicationId);
    const existingProofs = currentApp?.proofOfPayment || [];

  mockAccreditationService.updateApplication(currentApplicationId, {
  proofOfPayment: [...existingProofs, ...newDocuments],
  status: 'step8_payment_uploaded',
  paymentStatus: 'paid',
  paymentDate: new Date().toISOString(),
  paymentAllocatedToApplicationId: currentApplicationId,
  paymentReferenceUsed: currentApp?.paymentNotification?.paymentReference || currentApp?.applicationId,
  paymentVerifiedForCorrectApplication: false,
  paymentVerificationNotes: '',
  lastUpdated: new Date().toISOString(),
});

    refreshApplications();
    setCurrentView('dashboard');
    setActiveTab('applications');
    alert('Proof of payment uploaded successfully! It will now be verified.');
  };

 const renderApplicantContent = () => {
 if (currentView === 'form') {
  return (
    <ApplicationRegistration
      onSave={handleApplicationSaved}
      onCancel={() => {
        setCurrentView('dashboard');
        setActiveTab('applications');
      }}
    />
  );
}

  if (currentView === 'upload') {
    return (
      <DocumentUpload
        applicationId={currentApplicationId}
        documents={currentDocuments}
        onUpload={handleDocumentsUploaded}
        onPaymentUpload={handlePaymentUpload}
        onNext={handleSubmitDocuments}
        onBack={() => {
          setCurrentView('dashboard');
          setActiveTab('applications');
        }}
        isPaymentUpload={
          applications.find(a => a.id === currentApplicationId)?.status === 'step7_payment_pending'
        }
      />
    );
  }

  return (
    <ApplicationDashboard
      applications={applications}
  onViewApplication={handleViewApplication}
  onUploadDocument={handleUploadDocument}
  onViewOutcomeLetter={handleViewOutcomeLetter}
  onViewSiteVisit={handleViewSiteVisit}
  onRefreshApplications={refreshApplications}
    />
  );
};
  const renderContent = () => {
    if (currentRole === 'qp') {
      return (
        <QPDashboard
          userName={currentUserName}
          userRole="Quality Partner"
          userId="qp1"
        />
      );
    }

    if (currentRole === 'verifier') {
      return (
        <VerifierDashboard
          userName={currentUserName}
          userRole="Verifier"
          userId="ver1"
        />
      );
    }

    return renderApplicantContent();
  };

  return (
    <AccreditationExternalLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentRole={currentRole}
      currentUserName={currentUserName}
      onRoleChange={handleRoleChange}
    >
      {renderContent()}
    </AccreditationExternalLayout>
  );
}