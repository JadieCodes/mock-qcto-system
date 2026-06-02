import React, { useState, useEffect } from 'react';
import RegisteredQualificationsModal from './RegisteredQualificationsModal';

interface RegisteredQualification {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
  nqfLevel: string;
  credits: number;
  registrationNumber: string;
  registrationDate: string;
  expiryDate: string;
  status: 'active' | 'expiring' | 'expired';
  provider: string;
  saqaDecision: string;
  saqaId?: string;
  digitalSaqaLetter?: any;
  qpNotification?: any;
}

// Map from the stored approval-phase RegisteredQualification shape
function mapFromApprovalStore(stored: any): RegisteredQualification {
  const rawStatus = (stored.status || 'Active').toLowerCase() as 'active' | 'expiring' | 'expired';
  const approvalData = stored.approvalQualificationData || {};
  return {
    id: stored.id,
    qualificationCode: stored.qualificationCode,
    qualificationTitle: stored.qualificationTitle,
    nqfLevel: String(stored.nqfLevel),
    credits: stored.credits,
    registrationNumber: stored.registrationNumber || stored.saqaId || '—',
    registrationDate: stored.registrationDate || '—',
    expiryDate: stored.expiryDate || '—',
    status: rawStatus,
    provider: stored.provider || approvalData.submittedBy || '—',
    saqaDecision: 'Approved',
    saqaId: stored.saqaId,
    digitalSaqaLetter: approvalData.digitalSaqaLetter,
    qpNotification: approvalData.qpNotification,
  };
}

function loadFromStorage(): RegisteredQualification[] {
  try {
    const raw = localStorage.getItem('registeredQualifications');
    if (!raw) return [];
    return (JSON.parse(raw) as any[]).map(mapFromApprovalStore);
  } catch {
    return [];
  }
}

export default function RegisteredQualificationsScreen() {
  const [qualifications, setQualifications] = useState<RegisteredQualification[]>(loadFromStorage);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQualification, setSelectedQualification] = useState<RegisteredQualification | null>(null);

  // Refresh whenever registrations change
  useEffect(() => {
    const reload = () => setQualifications(loadFromStorage());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'registeredQualifications') reload();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', reload);
    window.addEventListener('qualificationRegistered', reload);
    document.addEventListener('visibilitychange', reload);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', reload);
      window.removeEventListener('qualificationRegistered', reload);
      document.removeEventListener('visibilitychange', reload);
    };
  }, []);

  const handleViewQualification = (qualification: RegisteredQualification) => {
    setSelectedQualification(qualification);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQualification(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':   return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired':  return 'bg-red-100 text-red-800';
      default:         return 'bg-gray-100 text-gray-800';
    }
  };

  const filtered = qualifications.filter(q => {
    if (statusFilter && q.status !== statusFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return q.qualificationTitle.toLowerCase().includes(s) || q.qualificationCode.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Registered Qualifications</h2>
          <p className="text-sm text-gray-500 mt-1">
            Qualifications registered on the NQF via SAQA · {qualifications.length} registered
          </p>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search qualifications..."
            className="border rounded px-3 py-2 w-64 text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            Export List
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Code', 'Qualification Title', 'NQF Level', 'Credits', 'Registration No.', 'Registration Date', 'Expiry Date', 'Status', 'Provider', 'SAQA Letter', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-10 text-center text-gray-500">
                  <p className="font-medium">No registered qualifications found</p>
                  <p className="text-sm text-gray-400 mt-1">Qualifications appear here once registered via the Qualifications Approval Phase.</p>
                </td>
              </tr>
            ) : filtered.map(qual => (
              <tr key={qual.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap font-medium text-sm">{qual.qualificationCode}</td>
                <td className="px-4 py-4">
                  <div className="text-sm">{qual.qualificationTitle}</div>
                  
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">Level {qual.nqfLevel}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{qual.credits}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-mono">{qual.registrationNumber}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{qual.registrationDate}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={qual.status === 'expiring' ? 'text-yellow-600 font-medium' : ''}>
                    {qual.expiryDate}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(qual.status)}`}>
                    {qual.status.charAt(0).toUpperCase() + qual.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">{qual.provider}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {qual.digitalSaqaLetter ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Attached
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">—</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewQualification(qual)}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RegisteredQualificationsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        qualification={selectedQualification}
      />
    </div>
  );
}