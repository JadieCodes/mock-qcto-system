// lib/indexedDB.ts

const DB_NAME = 'QualificationDB';
const DB_VERSION = 1;
const STORES = {
  PHASE_FILES: 'phaseFiles',
  PHASE_REPORTS: 'phaseReports',
  CYCLE_PLANS: 'cyclePlans',
  INTERNAL_CYCLE_PLANS: 'internalCyclePlans',
  SUBMITTED_REPORTS: 'submittedReports',
};

interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64
  uploadedAt: string;
  phaseName: string;
  qualificationCode: string;
  section: string;
}

// Open database connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PHASE_FILES)) {
        db.createObjectStore(STORES.PHASE_FILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PHASE_REPORTS)) {
        db.createObjectStore(STORES.PHASE_REPORTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.CYCLE_PLANS)) {
        db.createObjectStore(STORES.CYCLE_PLANS, { keyPath: 'qualificationCode' });
      }
      if (!db.objectStoreNames.contains(STORES.INTERNAL_CYCLE_PLANS)) {
        db.createObjectStore(STORES.INTERNAL_CYCLE_PLANS, { keyPath: 'qualificationCode' });
      }
      if (!db.objectStoreNames.contains(STORES.SUBMITTED_REPORTS)) {
        db.createObjectStore(STORES.SUBMITTED_REPORTS, { keyPath: 'id' });
      }
    };
  });
};

// Generic get all items from store
export const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
    
    transaction.oncomplete = () => db.close();
  });
};

// Generic put item into store
export const putToStore = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    transaction.oncomplete = () => db.close();
  });
};

// Generic delete from store
export const deleteFromStore = async (storeName: string, key: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    transaction.oncomplete = () => db.close();
  });
};

// Clear entire store
export const clearStore = async (storeName: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    transaction.oncomplete = () => db.close();
  });
};

// Phase Files specific functions
export const savePhaseFile = async (file: StoredFile): Promise<void> => {
  await putToStore(STORES.PHASE_FILES, file);
};

export const getPhaseFiles = async (qualificationCode: string, phaseName: string): Promise<StoredFile[]> => {
  const allFiles = await getAllFromStore<StoredFile>(STORES.PHASE_FILES);
  return allFiles.filter(f => f.qualificationCode === qualificationCode && f.phaseName === phaseName);
};

export const deletePhaseFile = async (fileId: string): Promise<void> => {
  await deleteFromStore(STORES.PHASE_FILES, fileId);
};

export const deleteAllPhaseFiles = async (qualificationCode: string, phaseName: string): Promise<void> => {
  const files = await getPhaseFiles(qualificationCode, phaseName);
  for (const file of files) {
    await deletePhaseFile(file.id);
  }
};

// Cycle Plans functions
export const saveCyclePlans = async (plans: any[]): Promise<void> => {
  // Store each plan individually
  for (const plan of plans) {
    await putToStore(STORES.CYCLE_PLANS, plan);
  }
};

export const getCyclePlans = async (): Promise<any[]> => {
  return await getAllFromStore<any>(STORES.CYCLE_PLANS);
};

export const getCyclePlanByCode = async (qualificationCode: string): Promise<any | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORES.CYCLE_PLANS, 'readonly');
    const store = transaction.objectStore(STORES.CYCLE_PLANS);
    const request = store.get(qualificationCode);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
    
    transaction.oncomplete = () => db.close();
  });
};

// Submitted Reports functions
export const saveSubmittedReport = async (report: any): Promise<void> => {
  await putToStore(STORES.SUBMITTED_REPORTS, { ...report, id: `${report.qualificationCode}_${report.phaseName}` });
};

export const getSubmittedReports = async (): Promise<any[]> => {
  return await getAllFromStore<any>(STORES.SUBMITTED_REPORTS);
};

export const getSubmittedReport = async (qualificationCode: string, phaseName: string): Promise<any | null> => {
  const reports = await getSubmittedReports();
  return reports.find(r => r.qualificationCode === qualificationCode && r.phaseName === phaseName) || null;
};

export const deleteSubmittedReport = async (qualificationCode: string, phaseName: string): Promise<void> => {
  await deleteFromStore(STORES.SUBMITTED_REPORTS, `${qualificationCode}_${phaseName}`);
};

// Migration: Copy localStorage data to IndexedDB
export const migrateFromLocalStorage = async (): Promise<void> => {
  // Migrate cyclePlans
  const cyclePlansRaw = localStorage.getItem('cyclePlans');
  if (cyclePlansRaw) {
    const plans = JSON.parse(cyclePlansRaw);
    for (const plan of plans) {
      await putToStore(STORES.CYCLE_PLANS, plan);
    }
  }
  
  // Migrate internalCyclePlans
  const internalRaw = localStorage.getItem('internalCyclePlans');
  if (internalRaw) {
    const plans = JSON.parse(internalRaw);
    for (const plan of plans) {
      await putToStore(STORES.INTERNAL_CYCLE_PLANS, plan);
    }
  }
  
  // Migrate submittedPhaseReports
  const reportsRaw = localStorage.getItem('submittedPhaseReports');
  if (reportsRaw) {
    const reports = JSON.parse(reportsRaw);
    for (const report of reports) {
      await putToStore(STORES.SUBMITTED_REPORTS, { ...report, id: `${report.qualificationCode}_${report.phaseName}` });
    }
  }
  
  // Migrate phase files
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('phaseFiles_')) {
      const files = JSON.parse(localStorage.getItem(key) || '[]');
      for (const file of files) {
        await savePhaseFile(file);
      }
    }
  }
  
  console.log('Migration complete!');
};
