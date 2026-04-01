// lib/applicationStorage.ts
import type { Application } from '@/types'; // Import from local index instead of @/types

const STORAGE_KEY = 'qualification_applications';

export const getApplications = (): Application[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveApplication = (application: Application): void => {
  const applications = getApplications();
  const index = applications.findIndex(a => a.id === application.id);
  
  if (index >= 0) {
    applications[index] = application;
  } else {
    applications.push(application);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
};

export const updateApplication = (id: string, updates: Partial<Application>): Application | null => {
  const applications = getApplications();
  const index = applications.findIndex(a => a.id === id);
  
  if (index >= 0) {
    applications[index] = { ...applications[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    return applications[index];
  }
  
  return null;
};

export const getApplicationById = (id: string): Application | null => {
  const applications = getApplications();
  return applications.find(a => a.id === id) || null;
};