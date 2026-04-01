// pages/QualificationDesign.tsx
import React, { useState, useEffect } from 'react';
import ApplicationModal from './qualifications/ApplicationModal';
import { getApplications, saveApplication } from '@/lib/applicationStorage';
import type { Application } from '@/types';

export default function QualificationDesign() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'view'>('create');

  // Load applications from localStorage on mount
  useEffect(() => {
    setApplications(getApplications());
  }, []);

  const handleCreateApplication = () => {
    setSelectedApplication(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleSaveApplication = (applicationData: Partial<Application>) => {
    if (modalMode === 'create') {
      const newApplication: Application = {
        id: `APP-${new Date().getFullYear()}-${String(applications.length + 1).padStart(3, '0')}`,
        applicantName: applicationData.applicantName || '',
        qualification: applicationData.qualification || '',
        submissionDate: new Date().toISOString().split('T')[0],
        status: applicationData.status || 'draft',
        documents: applicationData.documents || {
          applicationLetter: null,
          motivation: null,
          reference: null,
          acrLetter: null
        },
        report: applicationData.report
      };
      
      saveApplication(newApplication);
      setApplications(getApplications());
    } else {
      // Update existing application
      if (selectedApplication) {
        const updatedApp = { ...selectedApplication, ...applicationData };
        saveApplication(updatedApp);
        setApplications(getApplications());
      }
    }
    setIsModalOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Draft</span>;
      case 'submitted':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Submitted</span>;
      case 'document_review':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Document Review</span>;
      case 'resolution':
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Resolution</span>;
      case 'evaluation':
        return <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">Evaluation</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Qualification Design Applications</h2>
        <button
          onClick={handleCreateApplication}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Application
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No applications yet. Click "Create Application" to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qualification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submission Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{app.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{app.applicantName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{app.qualification}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{app.submissionDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {app.documents.applicationLetter && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">AL</span>}
                      {app.documents.motivation && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">M</span>}
                      {app.documents.reference && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">R</span>}
                      {app.documents.acrLetter && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">ACR</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewApplication(app)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveApplication}
        mode={modalMode}
        application={selectedApplication}
      />
    </div>
  );
}