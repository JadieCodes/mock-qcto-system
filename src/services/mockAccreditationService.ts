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

// Save to localStorage with file size filtering
const saveToStorage = () => {
  try {
    // Create a copy of applications for storage, but remove large file data if needed
    const applicationsForStorage = applications.map(app => {
      // Create a clean copy without storing large file data if it's causing issues
      const cleanApp = { ...app };
      
      // Option 1: Remove file data from documents to save space
      if (cleanApp.applicationData?.documents) {
        cleanApp.applicationData.documents = cleanApp.applicationData.documents.map(doc => ({
          ...doc,
          // Remove fileData if it exists and is too large
          fileData: undefined,
          fileUrl: doc.fileUrl, // Keep the URL if it exists
          // Keep other properties that exist in your type
        }));
      }
      
      // Similarly clean proofOfPayment
      if (cleanApp.proofOfPayment) {
        cleanApp.proofOfPayment = cleanApp.proofOfPayment.map(doc => ({
          ...doc,
          fileData: undefined
        }));
      }
      
      // Clean applicantRequiredUploads
      if (cleanApp.applicantRequiredUploads) {
        cleanApp.applicantRequiredUploads = cleanApp.applicantRequiredUploads.map(item => ({
          ...item,
          document: item.document ? {
            ...item.document,
            fileData: undefined
          } : undefined
        }));
      }
      
      return cleanApp;
    });
    
    localStorage.setItem('accreditationApplications', JSON.stringify(applicationsForStorage));
    localStorage.setItem('applications', JSON.stringify(applicationsForStorage));
  } catch (e) {
    console.error('Failed to save applications', e);
    // Only show alert for non-file-size errors during initial evaluation
    if (e instanceof Error && !e.message.includes('quota') && !e.message.includes('size')) {
      console.warn('Storage save failed:', e.message);
    }
    // Don't alert the user during normal operations
  }
};

// Initialize
loadFromStorage();

// Helper function to dispatch data change event
const notifyDataChange = () => {
  // Dispatch a custom event that any component can listen to
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('accreditation-data-changed', {
      detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }
};

// Helper function to update application (used internally)
const updateApplicationInternal = (id: string, updates: Partial<ApplicationStatus>): ApplicationStatus | null => {
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

  // Silent save - don't trigger alerts
  try {
    saveToStorage();
  } catch (e) {
    console.error('Save failed in updateApplicationInternal:', e);
  }
  notifyDataChange();
  return updatedApplication;
};

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
      evaluationHistory: [],
      requiredApplicantDocuments: [],
      applicantRequiredUploads: [],
    };

    applications = [...applications, newApplication];
    saveToStorage();
    notifyDataChange();
    return newApplication;
  },

  updateApplication: (id: string, updates: Partial<ApplicationStatus>): ApplicationStatus | null => {
    return updateApplicationInternal(id, updates);
  },

  addDocuments: (id: string, documents: any[]) => {
    const app = applications.find(a => a.id === id);
    if (!app) return null;

    const currentDocs = app.applicationData?.documents || [];
    const updatedDocs = [...currentDocs, ...documents];

    return updateApplicationInternal(id, {
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

    return updateApplicationInternal(id, {
      proofOfPayment: updatedProofs,
      status: 'step8_payment_uploaded'
    });
  },

  updateStatus: (id: string, status: ApplicationStatus['status']): ApplicationStatus | null => {
    return updateApplicationInternal(id, { status });
  }
};