import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  module: string;
  action: string;
  status: 'Success' | 'Failed' | 'Pending';
  details?: string;
}

interface AuditTrailContextType {
  entries: AuditEntry[];
  logAction: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
}

const AuditTrailContext = createContext<AuditTrailContextType | undefined>(undefined);

const AUDIT_STORAGE_KEY = 'audit_trail_entries';

export const AuditTrailProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<AuditEntry[]>(() => {
    const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored) as AuditEntry[]; } catch { return []; }
    }
    return [];
  });

  const logAction = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    setEntries(prev => {
      const newEntry: AuditEntry = {
        ...entry,
        id: `AUD-${String(prev.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString(),
      };
      const updated = [newEntry, ...prev];
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuditTrailContext.Provider value={{ entries, logAction }}>
      {children}
    </AuditTrailContext.Provider>
  );
};

export const useAuditTrail = () => {
  const ctx = useContext(AuditTrailContext);
  if (!ctx) throw new Error('useAuditTrail must be used within an AuditTrailProvider');
  return ctx;
};
