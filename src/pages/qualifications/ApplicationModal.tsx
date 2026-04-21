// components/qualifications/ApplicationModal.tsx
import React, { useState } from 'react';
import { X, Upload, CheckCircle } from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (applicationData: any) => void;
  mode: 'create' | 'view';
  application: any | null;
}

export default function ApplicationModal({
  isOpen,
  onClose,
  onSave,
  mode,
  application
}: ApplicationModalProps) {
  const [formData, setFormData] = useState({
    applicantName: application?.applicantName || '',
    qualification: application?.qualification || '',
    documents: application?.documents || {
      applicationLetter: null,
      motivation: null,
      reference: null,
      acrLetter: null,
      other: null
    }
  });

  const [report, setReport] = useState(application?.report || null);
  const [isVerified, setIsVerified] = useState(application?.status === 'verified');

  if (!isOpen) return null;

  const handleFileUpload = (documentType: string, file: File) => {
    setFormData({
      ...formData,
      documents: {
        ...formData.documents,
        [documentType]: file.name
      }
    });
  };

const handleVerifyAndGenerateReport = () => {
  const allDocsPresent =
    formData.documents.applicationLetter &&
    formData.documents.motivation &&
    formData.documents.reference &&
    formData.documents.acrLetter;

  const draftReport = {
    applicationId: application?.id || 'New Application',
    applicant: formData.applicantName,
    qualification: formData.qualification,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),

    documents: [
      {
        label: 'Application Letter',
        status: !!formData.documents.applicationLetter,
        file: formData.documents.applicationLetter
      },
      {
        label: 'Motivation',
        status: !!formData.documents.motivation,
        file: formData.documents.motivation
      },
      {
        label: 'Reference',
        status: !!formData.documents.reference,
        file: formData.documents.reference
      },
      {
        label: 'ACR Letter',
        status: !!formData.documents.acrLetter,
        file: formData.documents.acrLetter
      },
      {
        label: 'Other Document',
        status: !!formData.documents.other,
        optional: true,
        file: formData.documents.other
      }
    ],

    overallStatus: allDocsPresent ? 'complete' : 'incomplete',
    recommendation: allDocsPresent
      ? 'Proceed to next stage - Application meets minimum requirements.'
      : 'Hold - Please upload all required documents.'
  };

  setReport({
    verified: true,
    draftReport,
    verificationDate: new Date().toISOString().split('T')[0]
  });

  setIsVerified(true);
};

  const handleSubmit = () => {
    onSave({
      ...formData,
      report,
      status: 'submitted'
    });
  };

  const handleSave = () => {
    onSave({
      ...formData,
      report,
      status: 'draft'
    });
  };

  const uploadDocuments = [
    { id: 'applicationLetter', label: 'Application Letter', required: true },
    { id: 'motivation', label: 'Motivation', required: true },
    { id: 'reference', label: 'Reference', required: true },
    { id: 'acrLetter', label: 'ACR Letter', required: true },
    { id: 'other', label: 'Other Document', required: false }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Create New Application' : 'Application Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Application Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Applicant Name
                </label>
                <input
                  type="text"
                  value={formData.applicantName}
                  onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                  disabled={mode === 'view' && application?.status !== 'draft'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter applicant name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qualification
                </label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  disabled={mode === 'view' && application?.status !== 'draft'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter qualification"
                />
              </div>

              {/* Document Upload Section */}
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                <h3 className="font-semibold text-gray-900 mb-1">Supporting Documentation</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload all required documents for the external application submission.
                </p>

                <div className="space-y-4">
                  {uploadDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
                    >
                      <div className="min-w-[180px]">
                        <div className="text-sm font-medium text-gray-800">
                          {doc.label}
                          {doc.required ? (
                            <span className="ml-2 text-xs text-red-500">Required</span>
                          ) : (
                            <span className="ml-2 text-xs text-gray-400">Optional</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                        {formData.documents[doc.id] ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span className="break-all">{formData.documents[doc.id]}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">No file selected</div>
                        )}

                        {(mode === 'create' || application?.status === 'draft') && (
                          <label className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                            <Upload className="w-4 h-4" />
                            Choose File
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleFileUpload(doc.id, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verification and Report Section */}
            {mode === 'view' && application?.status === 'draft' && !report && (
              <div className="border-t pt-4">
                <button
                  onClick={handleVerifyAndGenerateReport}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Gate Evaluation Check & Generate Draft Report
                </button>
              </div>
            )}

            {/* Report Display */}
            {report && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Draft Report</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
  {/* Header */}
  <div className="bg-gray-50 px-6 py-4 border-b">
    <h3 className="text-lg font-semibold text-gray-900">
      Gate Evaluation Report
    </h3>
    <p className="text-sm text-gray-500">
      Generated on {report.draftReport.date} at {report.draftReport.time}
    </p>
  </div>

  {/* Body */}
  <div className="p-6 space-y-6">
    {/* Info Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-500">Application ID</p>
        <p className="font-medium">{report.draftReport.applicationId}</p>
      </div>

      <div>
        <p className="text-sm text-gray-500">Applicant</p>
        <p className="font-medium">{report.draftReport.applicant}</p>
      </div>

      <div className="md:col-span-2">
        <p className="text-sm text-gray-500">Qualification</p>
        <p className="font-medium">{report.draftReport.qualification}</p>
      </div>
    </div>

    {/* Document Table */}
    <div>
      <h4 className="font-semibold text-gray-900 mb-3">
        Document Verification
      </h4>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-2">Document</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">File</th>
            </tr>
          </thead>

          <tbody>
            {report.draftReport.documents.map((doc: any, idx: number) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">
                  {doc.label}
                  {doc.optional && (
                    <span className="ml-2 text-xs text-gray-400">
                      (Optional)
                    </span>
                  )}
                </td>

                <td className="px-4 py-2">
                  {doc.status ? (
                    <span className="text-green-600 font-medium">
                      ✓ Present
                    </span>
                  ) : doc.optional ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    <span className="text-red-600 font-medium">
                      ✗ Missing
                    </span>
                  )}
                </td>

                <td className="px-4 py-2 text-gray-600">
                  {doc.file || 'Not uploaded'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Status */}
    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
      <div>
        <p className="text-sm text-gray-500">Overall Status</p>
        <p
          className={`font-semibold ${
            report.draftReport.overallStatus === 'complete'
              ? 'text-green-600'
              : 'text-red-600'
          }`}
        >
          {report.draftReport.overallStatus === 'complete'
            ? 'Complete'
            : 'Incomplete'}
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm text-gray-500">Recommendation</p>
        <p className="font-medium text-gray-800 max-w-md">
          {report.draftReport.recommendation}
        </p>
      </div>
    </div>
  </div>
</div>
                <p className="text-sm text-gray-500 mt-2">
                  Verified on: {report.verificationDate}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          {mode === 'create' && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Application
            </button>
          )}

          {mode === 'view' && application?.status === 'draft' && !report && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Draft
            </button>
          )}

          {mode === 'view' && report && application?.status === 'draft' && (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}