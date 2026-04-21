import type { ApplicationStatus, ApplicationForm } from '@/types';

// Mock database
let applications: ApplicationStatus[] = [];

// Load from localStorage on import
const loadFromStorage = () => {
  const saved = localStorage.getItem('accreditationApplications');
  if (saved) {
    try {
      applications = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load applications', e);
      applications = [];
    }
  }
};

// Save to localStorage
const saveToStorage = () => {
  try {
    localStorage.setItem('accreditationApplications', JSON.stringify(applications));
    localStorage.setItem('applications', JSON.stringify(applications));
  } catch (e) {
    console.error('Failed to save applications', e);
    alert('Failed to save the uploaded document. The file may be too large for browser storage.');
  }
};

// Initialize
loadFromStorage();

export const mockAccreditationService = {
  getApplications: (): ApplicationStatus[] => {
    return [...applications];
  },

  getApplicationById: (id: string): ApplicationStatus | undefined => {
    return applications.find(app => app.id === id);
  },

  createApplication: (applicationData: ApplicationForm): ApplicationStatus => {
    console.log('Creating application with documents:', applicationData.documents);

    const newApplication: ApplicationStatus = {
      id: applicationData.id || Date.now().toString(),
      applicationId: applicationData.applicationId || `APP-${Date.now()}`,
      status: 'step1_initial_submitted',
      submittedDate: applicationData.submittedAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      paymentStatus: 'pending',
      applicationData: {
        ...applicationData,
        documents: applicationData.documents || []
      },
    };

    applications = [...applications, newApplication];
    saveToStorage();
    return newApplication;
  },

  updateApplication: (id: string, updates: Partial<ApplicationStatus>): ApplicationStatus | null => {
    const index = applications.findIndex(app => app.id === id);
    if (index === -1) return null;

    const updatedApplication = {
      ...applications[index],
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    applications = [
      ...applications.slice(0, index),
      updatedApplication,
      ...applications.slice(index + 1)
    ];

    saveToStorage();
    return updatedApplication;
  },

  addDocuments: (id: string, documents: any[]) => {
    const app = applications.find(a => a.id === id);
    if (!app) return null;

    const currentDocs = app.applicationData?.documents || [];
    const updatedDocs = [...currentDocs, ...documents];

    return mockAccreditationService.updateApplication(id, {
      applicationData: {
        ...app.applicationData!,
        documents: updatedDocs
      }
    });
  },

  addProofOfPayment: (id: string, documents: any[]) => {
    const app = applications.find(a => a.id === id);
    if (!app) return null;

    const currentProofs = app.proofOfPayment || [];
    const updatedProofs = [...currentProofs, ...documents];

    return mockAccreditationService.updateApplication(id, {
      proofOfPayment: updatedProofs,
      status: 'step8_payment_uploaded'
    });
  },

  updateStatus: (id: string, status: ApplicationStatus['status']): ApplicationStatus | null => {
    return mockAccreditationService.updateApplication(id, { status });
  }
};