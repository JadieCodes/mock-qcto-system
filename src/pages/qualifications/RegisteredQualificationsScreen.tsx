// RegisteredQualificationsScreen.tsx
import React, { useState } from 'react';
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
}

export default function RegisteredQualificationsScreen() {
  const [qualifications, setQualifications] = useState<RegisteredQualification[]>([
    {
      id: '1',
      qualificationCode: '97654',
      qualificationTitle: 'Advanced Diploma in Project Management',
      nqfLevel: '7',
      credits: 120,
      registrationNumber: 'SAQA-12345-2024',
      registrationDate: '2024-01-01',
      expiryDate: '2028-12-31',
      status: 'active',
      provider: 'University of Technology',
      saqaDecision: 'Approved'
    },
    {
      id: '2',
      qualificationCode: '88765',
      qualificationTitle: 'National Certificate: IT Systems Development',
      nqfLevel: '5',
      credits: 150,
      registrationNumber: 'SAQA-12346-2023',
      registrationDate: '2023-06-15',
      expiryDate: '2027-06-14',
      status: 'active',
      provider: 'Tech College SA',
      saqaDecision: 'Approved'
    },
    {
      id: '3',
      qualificationCode: '76543',
      qualificationTitle: 'Bachelor of Education in Foundation Phase',
      nqfLevel: '7',
      credits: 360,
      registrationNumber: 'SAQA-12347-2020',
      registrationDate: '2020-03-20',
      expiryDate: '2024-03-19',
      status: 'expiring',
      provider: 'University of Education',
      saqaDecision: 'Approved with Conditions'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQualification, setSelectedQualification] = useState<RegisteredQualification | null>(null);

  const handleViewQualification = (qualification: RegisteredQualification) => {
    setSelectedQualification(qualification);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQualification(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Registered Qualifications</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search qualifications..."
            className="border rounded px-3 py-2 w-64"
          />
          <select className="border rounded px-3 py-2">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Export List
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qualification Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                NQF Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registration No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registration Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiry Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {qualifications.map((qual) => (
              <tr key={qual.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {qual.qualificationCode}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">{qual.qualificationTitle}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  Level {qual.nqfLevel}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {qual.credits}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {qual.registrationNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {qual.registrationDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={qual.status === 'expiring' ? 'text-yellow-600 font-medium' : ''}>
                    {qual.expiryDate}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(qual.status)}`}>
                    {qual.status.charAt(0).toUpperCase() + qual.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {qual.provider}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewQualification(qual)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View
                  </button>
                  {qual.status === 'expiring' && (
                    <button className="text-green-600 hover:text-green-900">
                      Renew
                    </button>
                  )}
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