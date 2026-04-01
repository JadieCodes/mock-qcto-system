// PublicSubmissionsScreen.tsx
import React, { useState } from 'react';
import PublicSubmissionsModal from './PublicSubmissionsModal';

interface PublicSubmission {
  id: string;
  referenceNumber: string;
  qualificationTitle: string;
  submitterName: string;
  submissionDate: string;
  type: 'comment' | 'objection' | 'support';
  status: 'pending' | 'reviewed' | 'addressed';
  documents: {
    submissionLetter: string | null;
    supportingDocs: string | null;
  };
}

export default function PublicSubmissionsScreen() {
  const [submissions, setSubmissions] = useState<PublicSubmission[]>([
    {
      id: '1',
      referenceNumber: 'PUB-2024-001',
      qualificationTitle: 'Advanced Diploma in Project Management',
      submitterName: 'John Smith',
      submissionDate: '2024-01-15',
      type: 'comment',
      status: 'pending',
      documents: {
        submissionLetter: 'submission_letter.pdf',
        supportingDocs: 'supporting_docs.pdf'
      }
    },
    {
      id: '2',
      referenceNumber: 'PUB-2024-002',
      qualificationTitle: 'Certificate in Data Science',
      submitterName: 'Jane Doe',
      submissionDate: '2024-01-16',
      type: 'objection',
      status: 'reviewed',
      documents: {
        submissionLetter: 'objection_letter.pdf',
        supportingDocs: null
      }
    },
    {
      id: '3',
      referenceNumber: 'PUB-2024-003',
      qualificationTitle: 'National Diploma: Electrical Engineering',
      submitterName: 'Tech Industry Association',
      submissionDate: '2024-01-17',
      type: 'support',
      status: 'addressed',
      documents: {
        submissionLetter: 'support_letter.pdf',
        supportingDocs: 'industry_report.pdf'
      }
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<PublicSubmission | null>(null);

  const handleViewSubmission = (submission: PublicSubmission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubmission(null);
  };

  const getTypeBadgeColor = (type: string) => {
    switch(type) {
      case 'comment': return 'bg-blue-100 text-blue-800';
      case 'objection': return 'bg-red-100 text-red-800';
      case 'support': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'addressed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Public Submissions</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search submissions..."
            className="border rounded px-3 py-2 w-64"
          />
          <select className="border rounded px-3 py-2">
            <option value="">All Types</option>
            <option value="comment">Comments</option>
            <option value="objection">Objections</option>
            <option value="support">Support</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ref Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qualification Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
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
            {submissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {submission.referenceNumber}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">{submission.qualificationTitle}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {submission.submitterName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {submission.submissionDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadgeColor(submission.type)}`}>
                    {submission.type.charAt(0).toUpperCase() + submission.type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(submission.status)}`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-1">
                    {submission.documents.submissionLetter && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">SL</span>
                    )}
                    {submission.documents.supportingDocs && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">SD</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewSubmission(submission)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View
                  </button>
                  <button className="text-green-600 hover:text-green-900">
                    Respond
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PublicSubmissionsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        submission={selectedSubmission}
      />
    </div>
  );
}