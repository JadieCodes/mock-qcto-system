// pages/QualificationDesign.tsx
import React, { useState, useEffect } from 'react';
import ApplicationModal from './qualifications/ApplicationModal';
import { getApplications, saveApplication } from '@/lib/applicationStorage';
import type { Application } from '@/types';

export default function QualificationDesign() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'evalReadOnly'>('create');

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
    if (application.status === 'returned_to_qd') {
      setModalMode('evalReadOnly');
    } else {
      setModalMode('view');
    }
    setIsModalOpen(true);
  };

  const handleSaveApplication = (applicationData: Partial<Application>) => {
    if (modalMode === 'create') {
      const newApplication: Application = {
        id: `APP-${new Date().getFullYear()}-${String(applications.length + 1).padStart(3, '0')}`,
        applicantName: applicationData.applicantName || '',
        qualification: applicationData.occupationTitle || applicationData.qualification || '',
        qualificationType: applicationData.qualificationType || '',
        actionType: applicationData.actionType || '',
        submissionDate: new Date().toISOString().split('T')[0],
        status: applicationData.status || 'draft',
        documents: applicationData.documents || {
          applicationLetter: null,
          motivation: null,
          reference: null,
          acrLetter: null,
          other: null,
        },
        report: applicationData.report,
        // Store all form fields
        occupationTitle: applicationData.occupationTitle,
        ofoCode: applicationData.ofoCode,
        specialisationTitle: applicationData.specialisationTitle,
        setaChamber: applicationData.setaChamber,
        sicCode: applicationData.sicCode,
        rationale: applicationData.rationale,
        regulatoryBodies: applicationData.regulatoryBodies,
        qualityPartnerName: applicationData.qualityPartnerName,
        applicantDesignation: applicationData.applicantDesignation,
        applicantEmail: applicationData.applicantEmail,
        applicationDate: applicationData.applicationDate,
        applicantSignature: applicationData.applicantSignature,
        existingQualId: applicationData.existingQualId,
        existingQualTitle: applicationData.existingQualTitle,
        existingQualLevel: applicationData.existingQualLevel,
        existingQualCredits: applicationData.existingQualCredits,
        existingQualQP: applicationData.existingQualQP,
        learnershipRegNo: applicationData.learnershipRegNo,
        learnershipTitle: applicationData.learnershipTitle,
        learnershipNqfLevel: applicationData.learnershipNqfLevel,
        errp: applicationData.errp,
        ndp: applicationData.ndp,
        ngp: applicationData.ngp,
        ipap: applicationData.ipap,
        sips: applicationData.sips,
        n4n6Reconfig: applicationData.n4n6Reconfig,
        scarceSkills: applicationData.scarceSkills,
        legacyOqsf: applicationData.legacyOqsf,
        otherPriority: applicationData.otherPriority,
      };

      saveApplication(newApplication);
      setApplications(getApplications());
    } else if (modalMode === 'view') {
      if (selectedApplication) {
        const updatedApp: Application = {
          ...selectedApplication,
          ...applicationData,
          qualification: applicationData.occupationTitle || applicationData.qualification || selectedApplication.qualification,
          qualificationType: applicationData.qualificationType !== undefined ? applicationData.qualificationType : selectedApplication.qualificationType,
          actionType: applicationData.actionType !== undefined ? applicationData.actionType : selectedApplication.actionType,
          occupationTitle: applicationData.occupationTitle !== undefined ? applicationData.occupationTitle : (selectedApplication as any).occupationTitle,
          ofoCode: applicationData.ofoCode !== undefined ? applicationData.ofoCode : (selectedApplication as any).ofoCode,
          specialisationTitle: applicationData.specialisationTitle !== undefined ? applicationData.specialisationTitle : (selectedApplication as any).specialisationTitle,
          setaChamber: applicationData.setaChamber !== undefined ? applicationData.setaChamber : (selectedApplication as any).setaChamber,
          sicCode: applicationData.sicCode !== undefined ? applicationData.sicCode : (selectedApplication as any).sicCode,
          rationale: applicationData.rationale !== undefined ? applicationData.rationale : (selectedApplication as any).rationale,
          regulatoryBodies: applicationData.regulatoryBodies !== undefined ? applicationData.regulatoryBodies : (selectedApplication as any).regulatoryBodies,
          qualityPartnerName: applicationData.qualityPartnerName !== undefined ? applicationData.qualityPartnerName : (selectedApplication as any).qualityPartnerName,
          documents: {
            ...selectedApplication.documents,
            ...applicationData.documents,
          },
        };
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
    const map: Record<string, { label: string; cls: string }> = {
      draft:              { label: 'Draft',              cls: 'bg-gray-100 text-gray-800' },
      submitted:          { label: 'Submitted',          cls: 'bg-blue-100 text-blue-800' },
      document_review:    { label: 'Document Review',    cls: 'bg-yellow-100 text-yellow-800' },
      resolution:         { label: 'Resolution',         cls: 'bg-purple-100 text-purple-800' },
      evaluation:         { label: 'Evaluation',         cls: 'bg-indigo-100 text-indigo-800' },
      approved:           { label: 'Approved',           cls: 'bg-green-100 text-green-800' },
      rejected:           { label: 'Rejected',           cls: 'bg-red-100 text-red-800' },
      returned_to_qd:     { label: 'Outcome Received',   cls: 'bg-teal-100 text-teal-800' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs rounded-full font-medium ${s.cls} whitespace-nowrap`}>{s.label}</span>;
  };

  const getQualificationTypeBadge = (type: string | undefined) => {
    const map: Record<string, { label: string; cls: string }> = {
      'QUALIFICATION': { label: 'Qualification', cls: 'bg-blue-100 text-blue-800' },
      'PART-QUALIFICATION': { label: 'Part-Qualification', cls: 'bg-purple-100 text-purple-800' },
      'SKILLS PROGRAMME': { label: 'Skills Programme', cls: 'bg-green-100 text-green-800' },
    };
    const s = map[type || ''] || { label: type || '—', cls: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs rounded-full font-medium ${s.cls} whitespace-nowrap`}>{s.label}</span>;
  };

  const getActionTypeBadge = (type: string | undefined) => {
    const map: Record<string, { label: string; cls: string }> = {
      'DEVELOP': { label: 'Develop', cls: 'bg-green-100 text-green-800' },
      'REVIEW': { label: 'Review', cls: 'bg-blue-100 text-blue-800' },
      'DE-ACTIVATE': { label: 'De-Activate', cls: 'bg-red-100 text-red-800' },
      'REPLACE': { label: 'Replace', cls: 'bg-yellow-100 text-yellow-800' },
    };
    const s = map[type || ''] || { label: type || '—', cls: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 text-xs rounded-full font-medium ${s.cls} whitespace-nowrap`}>{s.label}</span>;
  };

  // Helper to get the qualification title - priority: occupationTitle > qualification
  const getQualificationDisplay = (app: Application) => {
    // First check occupationTitle (from Section B1 - Occupation Details)
    if ((app as any).occupationTitle) {
      return (app as any).occupationTitle;
    }
    // Then check qualification field
    if (app.qualification) {
      return app.qualification;
    }
    return '—';
  };

  // Split into active and completed
  const activeApps = applications.filter(a => a.status !== 'returned_to_qd');
  const completedApps = applications.filter(a => a.status === 'returned_to_qd');

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Qualification Design Applications</h2>
        <button
          onClick={handleCreateApplication}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Application
        </button>
      </div>

      {/* Active Applications */}
      {activeApps.length === 0 && completedApps.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No applications yet. Click "Create Application" to get started.
        </div>
      ) : (
        <>
          {activeApps.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Active Applications</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeApps.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{app.applicantName}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800 font-medium max-w-[300px] truncate" title={getQualificationDisplay(app)}>
                            {getQualificationDisplay(app)}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getQualificationTypeBadge(app.qualificationType)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getActionTypeBadge(app.actionType)}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{app.submissionDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => handleViewApplication(app)} className="text-blue-600 hover:text-blue-900 font-medium text-sm">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Completed / Outcome Received Applications */}
          {completedApps.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Outcome Received (Review / De-Activate / Replace)</h3>
              <p className="text-sm text-gray-500 mb-3">These applications have completed evaluation. The outcome letter and evaluation documents are attached.</p>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outcome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {completedApps.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{app.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{app.applicantName}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800 font-medium max-w-[300px] truncate" title={getQualificationDisplay(app)}>
                            {getQualificationDisplay(app)}
                          </div>
                        </td>
                        <td className="px-6 py-4">{getQualificationTypeBadge(app.qualificationType)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{getActionTypeBadge(app.actionType)}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {(app as any).outcomeLetter?.sent ? (
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                              {(app as any).outcomeLetter?.letterTypeLabel || 'Letter Sent'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => handleViewApplication(app)} className="text-teal-600 hover:text-teal-900 font-medium text-sm">View Outcome</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <ApplicationModal
        key={`${selectedApplication?.id ?? 'new'}-${modalMode}`}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveApplication}
        mode={modalMode}
        application={selectedApplication}
      />
    </div>
  );
}