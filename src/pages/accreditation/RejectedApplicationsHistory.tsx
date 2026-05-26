import React, { useState, useEffect } from 'react';
import {
  Search, XCircle, ChevronDown, ChevronUp, FileText, Download,
  Eye, CheckCircle, History, Zap, User, Mail, Phone, MapPin,
} from 'lucide-react';
import type { ApplicationStatus } from '@/types';
import { mockAccreditationService } from '@/services/mockAccreditationService';

type RejectionFilter = 'all' | 'initial' | 'final';
type ModalTab = 'details' | 'ai-report' | 'history';

export default function RejectedApplicationsHistory() {
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionFilter, setRejectionFilter] = useState<RejectionFilter>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedApplication, setSelectedApplication] = useState<ApplicationStatus | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<ModalTab>('details');

  useEffect(() => {
    const load = () => {
      const all = mockAccreditationService.getApplications();
      setApplications(all.filter(a =>
        a.status === 'step3_initial_rejected' || a.status === 'step6_final_rejected'
      ));
    };
    load();
    window.addEventListener('accreditation-data-changed', load);
    return () => window.removeEventListener('accreditation-data-changed', load);
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleOpenModal = (app: ApplicationStatus) => {
    setSelectedApplication(app);
    setModalActiveTab('details');
  };

  const handleCloseModal = () => {
    setSelectedApplication(null);
    setModalActiveTab('details');
  };

  const handlePrintLetter = (app: ApplicationStatus) => {
    const isInitial = app.status === 'step3_initial_rejected';

    const rejDate = isInitial
      ? (app.rejectionDate ? new Date(app.rejectionDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A')
      : (app.finalRejectionDate ? new Date(app.finalRejectionDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A');

    const reason = isInitial ? (app.rejectionReason || 'N/A') : (app.finalRejectionReason || 'N/A');
    const title = isInitial ? 'Application Rejection Notice' : 'Final Evaluation Rejection Notice';

    const bodyItems = isInitial
      ? (app.missingDocuments || []).map(d => `<li>${d}</li>`).join('')
      : (app.finalRejectionCriteria || []).map(c => `<li>${c}</li>`).join('');
    const bodyLabel = isInitial ? 'Missing / Required Documents' : 'Unmet Evaluation Criteria';

    const deadlineBlock = isInitial && app.resubmissionDeadline
      ? `<div class="deadline"><div class="label">Resubmission Deadline</div><div class="value" style="margin-top:6px;font-weight:bold;">${new Date(app.resubmissionDeadline).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div>`
      : '';

    const footerText = isInitial
      ? 'Please address all noted deficiencies and resubmit within the specified timeframe.'
      : 'This is an official communication from the QCTO Accreditation Division. Resubmission is not available for final evaluation rejections.';

    const html = `<!DOCTYPE html><html><head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
        .header { border-bottom: 2px solid #dc2626; padding-bottom: 16px; margin-bottom: 24px; }
        .title { font-size: 22px; font-weight: bold; color: #dc2626; }
        .subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }
        .section { margin: 16px 0; }
        .label { font-weight: bold; font-size: 13px; color: #374151; }
        .value { margin-top: 4px; font-size: 14px; }
        ul { margin: 8px 0 0 0; padding-left: 20px; }
        li { margin-bottom: 4px; font-size: 14px; }
        .deadline { background: #fef2f2; border: 1px solid #fca5a5; padding: 12px; border-radius: 6px; margin: 16px 0; }
        .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #6b7280; font-style: italic; }
        @media print { body { margin: 20px; } }
      </style>
    </head><body>
      <div class="header">
        <div class="title">${title}</div>
        <div class="subtitle">QCTO Accreditation Division</div>
      </div>
      <div class="section"><div class="label">Applicant</div><div class="value">${app.applicationData?.applicantInfo.fullName || 'N/A'}</div></div>
      <div class="section"><div class="label">Organisation</div><div class="value">${app.applicationData?.applicantInfo.organisationName || 'N/A'}</div></div>
      <div class="section"><div class="label">Application Reference</div><div class="value">${app.applicationId}</div></div>
      <div class="section"><div class="label">Date of Rejection</div><div class="value">${rejDate}</div></div>
      <div class="section"><div class="label">Rejection Reason</div><div class="value">${reason}</div></div>
      ${bodyItems ? `<div class="section"><div class="label">${bodyLabel}</div><ul>${bodyItems}</ul></div>` : ''}
      ${deadlineBlock}
      <div class="footer">${footerText}</div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
  };

  const filtered = applications.filter(app => {
    const matchesSearch = searchTerm === '' ||
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.applicationData?.applicantInfo.organisationName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.applicationData?.applicantInfo.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      rejectionFilter === 'all' ||
      (rejectionFilter === 'initial' && app.status === 'step3_initial_rejected') ||
      (rejectionFilter === 'final' && app.status === 'step6_final_rejected');

    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rejected Applications</h1>
                <p className="text-sm text-gray-600">History of all initial and final evaluation rejections</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <p className="text-sm text-gray-600">Total Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow-sm p-4 border border-red-200">
              <p className="text-sm text-red-600">Initial Rejections</p>
              <p className="text-2xl font-bold text-red-700">
                {applications.filter(a => a.status === 'step3_initial_rejected').length}
              </p>
            </div>
            <div className="bg-rose-50 rounded-lg shadow-sm p-4 border border-rose-200">
              <p className="text-sm text-rose-600">Final Rejections</p>
              <p className="text-2xl font-bold text-rose-700">
                {applications.filter(a => a.status === 'step6_final_rejected').length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by application ID, organisation, or applicant name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={rejectionFilter}
                  onChange={e => setRejectionFilter(e.target.value as RejectionFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Rejections</option>
                  <option value="initial">Initial Rejections Only</option>
                  <option value="final">Final Rejections Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation / Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejection Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <XCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No rejected applications found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchTerm || rejectionFilter !== 'all' ? 'Try adjusting your filters.' : 'Rejected applications will appear here.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(app => {
                    const isInitial = app.status === 'step3_initial_rejected';
                    const rejDate = isInitial ? app.rejectionDate : app.finalRejectionDate;
                    const reason = isInitial ? app.rejectionReason : app.finalRejectionReason;
                    const isExpanded = expandedRows.has(app.id);

                    return (
                      <React.Fragment key={app.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{app.applicationId}</p>
                            <p className="text-xs text-gray-500">{app.applicationData?.applicationType}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{app.applicationData?.applicantInfo.organisationName}</p>
                            <p className="text-xs text-gray-500">{app.applicationData?.applicantInfo.fullName}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.submittedDate ? new Date(app.submittedDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isInitial ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Initial Review</span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-800">Final Evaluation</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rejDate ? new Date(rejDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-sm text-gray-600 truncate">{reason || '—'}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleRow(app.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Expand details"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleOpenModal(app)}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                title="View full details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePrintLetter(app)}
                                className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                title="Print rejection letter"
                              >
                                <FileText className="w-4 h-4" />
                                Letter
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-red-50">
                            <td colSpan={7} className="px-6 py-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Full Rejection Reason</p>
                                    <p className="text-sm text-gray-800 bg-white rounded border border-red-200 p-3">
                                      {reason || '—'}
                                    </p>
                                  </div>

                                  {isInitial && app.missingDocuments && app.missingDocuments.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Missing Documents</p>
                                      <ul className="space-y-1">
                                        {app.missingDocuments.map(d => (
                                          <li key={d} className="text-sm text-gray-700 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                            {d}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {!isInitial && app.finalRejectionCriteria && app.finalRejectionCriteria.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Unmet Criteria</p>
                                      <ul className="space-y-1">
                                        {app.finalRejectionCriteria.map(c => (
                                          <li key={c} className="text-sm text-gray-700 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                            {c}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Applicant Details</p>
                                    <div className="bg-white rounded border border-red-200 p-3 space-y-1">
                                      <p className="text-sm"><span className="text-gray-500">Name:</span> <span className="font-medium">{app.applicationData?.applicantInfo.fullName}</span></p>
                                      <p className="text-sm"><span className="text-gray-500">Email:</span> <span className="font-medium">{app.applicationData?.applicantInfo.email}</span></p>
                                      <p className="text-sm"><span className="text-gray-500">Region:</span> <span className="font-medium">{app.applicationData?.applicantInfo.region}</span></p>
                                      <p className="text-sm"><span className="text-gray-500">Qualification:</span> <span className="font-medium">{app.applicationData?.qualification}</span></p>
                                    </div>
                                  </div>

                                  {isInitial && app.resubmissionDeadline && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Resubmission Deadline</p>
                                      <p className="text-sm font-medium text-red-700">
                                        {new Date(app.resubmissionDeadline).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}
                                      </p>
                                      {(app.resubmissionCount ?? 0) > 0 && (
                                        <p className="text-xs text-amber-700 mt-1">Resubmitted {app.resubmissionCount} time(s)</p>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleOpenModal(app)}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
                                    >
                                      <Eye className="w-4 h-4" />
                                      View Full Details
                                    </button>
                                    <button
                                      onClick={() => handlePrintLetter(app)}
                                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 text-sm"
                                    >
                                      <Download className="w-4 h-4" />
                                      Print Letter
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Application Details: {selectedApplication.applicationId}</h2>
                  <div className="mt-1">
                    {selectedApplication.status === 'step3_initial_rejected' ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" />
                        Initial Rejected
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" />
                        Final Rejected
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex space-x-4 mt-4 border-b border-gray-200">
                <button
                  onClick={() => setModalActiveTab('details')}
                  className={`pb-2 px-1 ${modalActiveTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  Details
                </button>
                {(selectedApplication.status === 'step6_final_rejected' || selectedApplication.finalReview?.aiRecommendation) && (
                  <button
                    onClick={() => setModalActiveTab('ai-report')}
                    className={`pb-2 px-1 ${modalActiveTab === 'ai-report' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  >
                    AI Report
                  </button>
                )}
                {selectedApplication.evaluationHistory && selectedApplication.evaluationHistory.length > 0 && (
                  <button
                    onClick={() => setModalActiveTab('history')}
                    className={`pb-2 px-1 ${modalActiveTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  >
                    <History className="w-4 h-4 inline mr-1" />
                    History
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Details Tab */}
              {modalActiveTab === 'details' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Applicant Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ID Number</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.idNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {selectedApplication.applicationData?.applicantInfo.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {selectedApplication.applicationData?.applicantInfo.phone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Organisation Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Organisation Name</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.organisationName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Company Name</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Company Registration</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.companyRegistration || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Region</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {selectedApplication.applicationData?.applicantInfo.region}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Training Location</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.trainingLocation}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Qualification</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.qualification}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Application Type</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicationType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
                    {selectedApplication.applicationData?.documents && selectedApplication.applicationData.documents.length > 0 ? (
                      <>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Application Documents</h4>
                        <div className="space-y-2 mb-4">
                          {selectedApplication.applicationData.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                <span className="text-sm text-gray-600">{doc.name}</span>
                              </div>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                View
                              </a>
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const applicationForm = selectedApplication.applicationData?.documents?.find(
                            (doc) => doc.type === 'application_form'
                          ) as any;
                          if (!applicationForm) return null;
                          return (
                            <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <h4 className="text-sm font-semibold text-gray-800 mb-3">Application Form Validation</h4>
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">{applicationForm.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Uploaded: {new Date(applicationForm.uploadedAt).toLocaleString()}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  applicationForm.validationStatus === 'passed' ? 'bg-green-100 text-green-700'
                                  : applicationForm.validationStatus === 'failed' ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {applicationForm.validationStatus || 'Not validated'}
                                </span>
                              </div>
                              {applicationForm.validationChecks?.length > 0 ? (
                                <div className="space-y-2">
                                  {applicationForm.validationChecks.map((check: any) => (
                                    <div key={check.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                      <div>
                                        <p className="text-sm text-gray-700">{check.label}</p>
                                        {check.message && <p className="text-xs text-gray-500 mt-1">{check.message}</p>}
                                      </div>
                                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        check.status === 'passed' ? 'bg-green-100 text-green-700'
                                        : check.status === 'failed' ? 'bg-red-100 text-red-700'
                                        : check.status === 'processing' ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {check.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No validation details available.</p>
                              )}
                              {applicationForm.validationError && (
                                <p className="mt-3 text-sm text-red-600">{applicationForm.validationError}</p>
                              )}
                            </div>
                          );
                        })()}
                        {selectedApplication.applicantRequiredUploads && selectedApplication.applicantRequiredUploads.length > 0 && (
                          <>
                            <h4 className="text-sm font-medium text-gray-700 mb-2 mt-4">Applicant Uploaded Required Documents</h4>
                            <div className="space-y-2">
                              {selectedApplication.applicantRequiredUploads.map((item) =>
                                item.document ? (
                                  <div key={item.requirementId} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                                    <div>
                                      <p className="text-sm font-medium text-gray-700">{item.label}</p>
                                      <p className="text-xs text-gray-500">{item.document.name}</p>
                                    </div>
                                    <a
                                      href={item.document.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                      View
                                    </a>
                                  </div>
                                ) : null
                              )}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">No documents uploaded yet</p>
                    )}
                  </div>

                  {/* Acknowledgement Letter */}
                  {selectedApplication.acknowledgementLetter && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Acknowledgement Letter</h3>
                      <a
                        href={selectedApplication.acknowledgementLetter.letterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        View Acknowledgement Letter
                      </a>
                    </div>
                  )}

                  {/* Initial Rejection Details */}
                  {selectedApplication.rejectionDate && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h3 className="text-lg font-semibold text-red-800 mb-4">Initial Review Rejection Details</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600">Rejected On</p>
                          <p className="font-medium">{new Date(selectedApplication.rejectionDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Rejection Reason</p>
                          <p className="font-medium">{selectedApplication.rejectionReason || '—'}</p>
                        </div>
                        {selectedApplication.missingDocuments && selectedApplication.missingDocuments.length > 0 && (
                          <div>
                            <p className="text-gray-600 mb-1">Missing Documents</p>
                            <ul className="list-disc list-inside space-y-1">
                              {selectedApplication.missingDocuments.map(doc => (
                                <li key={doc} className="text-gray-700">{doc}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedApplication.resubmissionDeadline && (
                          <div>
                            <p className="text-gray-600">Resubmission Deadline</p>
                            <p className="font-medium">{new Date(selectedApplication.resubmissionDeadline).toLocaleDateString()}</p>
                          </div>
                        )}
                        {(selectedApplication.resubmissionCount ?? 0) > 0 && (
                          <p className="text-xs text-amber-700">Resubmitted {selectedApplication.resubmissionCount} time(s)</p>
                        )}
                        <button
                          onClick={() => handlePrintLetter(selectedApplication)}
                          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          View / Print Rejection Letter
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Final Rejection Details */}
                  {selectedApplication.finalRejectionDate && (
                    <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
                      <h3 className="text-lg font-semibold text-rose-800 mb-4">Final Evaluation Rejection Details</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-600">Rejected On</p>
                          <p className="font-medium">{new Date(selectedApplication.finalRejectionDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Rejection Reason</p>
                          <p className="font-medium">{selectedApplication.finalRejectionReason || '—'}</p>
                        </div>
                        {selectedApplication.finalRejectionCriteria && selectedApplication.finalRejectionCriteria.length > 0 && (
                          <div>
                            <p className="text-gray-600 mb-1">Unmet Evaluation Criteria</p>
                            <ul className="list-disc list-inside space-y-1">
                              {selectedApplication.finalRejectionCriteria.map(c => (
                                <li key={c} className="text-gray-700">{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <button
                          onClick={() => handlePrintLetter(selectedApplication)}
                          className="mt-2 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 text-sm flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          View / Print Final Rejection Letter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Report Tab */}
              {modalActiveTab === 'ai-report' && (
                <div className="space-y-6">
                  {!selectedApplication.finalReview?.aiRecommendation ? (
                    <div className="bg-yellow-50 p-8 rounded-lg text-center">
                      <p className="text-sm text-yellow-700">No AI report was generated for this application.</p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Zap className="w-6 h-6 text-blue-600 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-800">AI Draft Evaluation Report</h3>
                        </div>
                        <span className="text-sm text-gray-500">
                          Generated: {new Date(selectedApplication.finalReview.aiRecommendation.generatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-white p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-700">{selectedApplication.finalReview.aiRecommendation.summary}</p>
                      </div>
                      <h4 className="font-medium text-gray-800 mb-3">Requested Document Evaluation</h4>
                      <div className="space-y-3">
                        {selectedApplication.finalReview.aiRecommendation.documentFindings.map((finding, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                <span className="text-sm font-medium">{finding.fileName}</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${
                                finding.status === 'valid' ? 'bg-green-100 text-green-700'
                                : finding.status === 'missing' ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {finding.status === 'valid' ? 'Uploaded'
                                  : finding.status === 'missing' ? 'Missing'
                                  : finding.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            {finding.issues && finding.issues.length > 0 && (
                              <div className="mt-2">
                                {finding.issues.map((issue, i) => (
                                  <p key={i} className="text-xs text-red-600">{issue}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700">
                          This draft AI evaluation report forms part of the application record.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {modalActiveTab === 'history' && selectedApplication.evaluationHistory && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">Evaluation History</h3>
                  {selectedApplication.evaluationHistory.map((entry, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            entry.stage === 'initial' ? 'bg-blue-100 text-blue-800'
                            : entry.stage === 'final' ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                          }`}>
                            {entry.stage === 'initial' ? 'Initial Review'
                              : entry.stage === 'final' ? 'Final Review'
                              : 'AI Evaluation'}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            Reviewed by: {entry.reviewedBy} on {new Date(entry.reviewedAt).toLocaleString()}
                          </p>
                        </div>
                        {entry.stage !== 'ai-evaluation' && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            entry.decision === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {entry.decision === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                        {entry.stage === 'ai-evaluation' && entry.aiRecommendation && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            entry.aiRecommendation.riskLevel === 'low' ? 'bg-green-100 text-green-800'
                            : entry.aiRecommendation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                            Risk: {entry.aiRecommendation.riskLevel}
                          </span>
                        )}
                      </div>

                      {entry.stage !== 'ai-evaluation' && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Checklist Results:</h4>
                          <div className="space-y-2">
                            {entry.checklist.map((item) => (
                              <div key={item.criteriaId} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{item.criteriaName}</span>
                                {item.isMet ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {entry.stage === 'ai-evaluation' && entry.aiRecommendation && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">AI Draft Evaluation:</h4>
                          <div className="bg-white p-3 rounded border border-gray-200">
                            <p className="text-sm text-gray-700 mb-3">{entry.aiRecommendation.summary}</p>
                            <div className="space-y-2">
                              {entry.aiRecommendation.documentFindings.map((finding, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">{finding.fileName}</span>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    finding.status === 'valid' ? 'bg-green-100 text-green-700'
                                    : finding.status === 'missing' ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {finding.status === 'valid' ? 'Uploaded'
                                      : finding.status === 'missing' ? 'Missing'
                                      : finding.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {entry.comments && (
                        <div className="mt-3 p-2 bg-white rounded">
                          <p className="text-sm text-gray-600">{entry.comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handlePrintLetter(selectedApplication)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download / Print Rejection Letter
                </button>
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
