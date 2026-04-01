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
  localStorage.setItem('accreditationApplications', JSON.stringify(applications));
};

// Initialize
loadFromStorage();

export const mockAccreditationService = {
  // Get all applications
  getApplications: (): ApplicationStatus[] => {
    return [...applications];
  },

  // Get application by ID
  getApplicationById: (id: string): ApplicationStatus | undefined => {
    return applications.find(app => app.id === id);
  },

  // Create new application
  createApplication: (applicationData: ApplicationForm): ApplicationStatus => {
    const newApplication: ApplicationStatus = {
      id: Date.now().toString(),
      applicationId: `APP-${Date.now()}`,
      status: 'step1_initial_submitted',
      submittedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      paymentStatus: 'pending',
      applicationData: {
        ...applicationData,
        documents: []
      },
    };
    
    applications = [...applications, newApplication];
    saveToStorage();
    return newApplication;
  },

  // Update application
// In mockAccreditationService.ts
// In mockAccreditationService.ts
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
  
  // Also update in localStorage under a different key for cross-component access
  const allApps = JSON.parse(localStorage.getItem('applications') || '[]');
  const updatedAllApps = allApps.map((a: any) => a.id === id ? updatedApplication : a);
  localStorage.setItem('applications', JSON.stringify(updatedAllApps));
  
  return updatedApplication;
},

  // Add documents to application
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

  // Add proof of payment
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

  // Update application status
  updateStatus: (id: string, status: ApplicationStatus['status']): ApplicationStatus | null => {
    return mockAccreditationService.updateApplication(id, { status });
  }
};

