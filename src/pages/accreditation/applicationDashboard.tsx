import React, { useState } from 'react';
import { Eye, XCircle, FileText, CheckCircle, Clock, DollarSign, Download, Calendar, MapPin, User } from 'lucide-react';
import type { ApplicationStatus, SiteVisitStatus, SiteVisitReport } from '@/types';
import { mockAccreditationService } from '@/services/mockAccreditationService';

interface ApplicationDashboardProps {
  applications: ApplicationStatus[];
  onViewApplication: (id: string) => void;
  onUploadDocument: (id: string) => void;
  onViewOutcomeLetter: (id: string) => void;
  onViewSiteVisit: (id: string) => void;
  onRefreshApplications: () => void;
}

const getDeadlineInfo = (resubmissionDeadline: string) => {
  const deadline = new Date(resubmissionDeadline);
  const now = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;
  const formattedDeadline = deadline.toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
  return { daysRemaining, isExpired, formattedDeadline };
};

export default function ApplicationDashboard({
  applications,
  onViewApplication,
  onUploadDocument,
  onViewOutcomeLetter,
  onViewSiteVisit,
  onRefreshApplications
}: ApplicationDashboardProps) {
  const [selectedApplication, setSelectedApplication] = useState<ApplicationStatus | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'details' | 'documents' | 'site-visit' | 'report'>('details');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [resubmitDocUploads, setResubmitDocUploads] = useState<Record<string, boolean>>({});
  const [showRejectionLetterModal, setShowRejectionLetterModal] = useState(false);
  const [showResubmitConfirm, setShowResubmitConfirm] = useState(false);
  const [showFinalRejectionLetterModal, setShowFinalRejectionLetterModal] = useState(false);
  
  const getStatusBadge = (status: ApplicationStatus['status']) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'step1_initial_submitted': { color: 'bg-blue-100 text-blue-800', label: 'Submitted' },
      'step2_under_initial_review': { color: 'bg-yellow-100 text-yellow-800', label: 'Under Review' },
      'step3_initial_approved': { color: 'bg-green-100 text-green-800', label: 'Initial Approved' },
      'step3_initial_rejected': { color: 'bg-red-100 text-red-800', label: 'Initial Rejected' },
      'step4_documents_uploaded': { color: 'bg-purple-100 text-purple-800', label: 'Documents Uploaded' },
      'step5_under_final_review': { color: 'bg-orange-100 text-orange-800', label: 'Final Review' },
      'step6_final_approved': { color: 'bg-green-100 text-green-800', label: 'Approved' },
      'step6_final_rejected': { color: 'bg-rose-100 text-rose-800', label: 'Final Rejected' },
      'step7_payment_pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Payment Pending' },
      'step8_payment_uploaded': { color: 'bg-blue-100 text-blue-800', label: 'Payment Uploaded' },
      'step9_completed': { color: 'bg-green-100 text-green-800', label: 'Completed' },
      'step10_site_visit_scheduled': { color: 'bg-purple-100 text-purple-800', label: 'Site Visit Scheduled' },
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

const handleAcceptSchedule = () => {
  if (!selectedApplication || !selectedApplication.siteVisitSchedule) return;

  const updatedApp: ApplicationStatus = {
    ...selectedApplication,
    siteVisitSchedule: {
      ...selectedApplication.siteVisitSchedule,
      applicantConfirmed: true,
      applicantConfirmedAt: new Date().toISOString(),
      qctoConfirmed: false,
      bookingConfirmed: false,
      status: 'applicant_confirmed' as SiteVisitStatus,
    },
    scheduleStatus: 'applicant_confirmed' as SiteVisitStatus,
  };

  mockAccreditationService.updateApplication(selectedApplication.id, updatedApp);

  const updatedVisits = JSON.parse(localStorage.getItem('scheduledVisits') || '[]').map((sv: any) =>
    sv.applicationId === selectedApplication.id
      ? { ...sv, status: 'applicant_confirmed' }
      : sv
  );
  localStorage.setItem('scheduledVisits', JSON.stringify(updatedVisits));

  setSelectedApplication(updatedApp);
  onRefreshApplications();

  alert('You have confirmed the proposed date. QCTO must still confirm the booking before the site visit can proceed.');
};

 const handleRescheduleRequest = () => {
  if (!selectedApplication || !selectedApplication.siteVisitSchedule) return;

  const updatedApp: ApplicationStatus = {
    ...selectedApplication,
    siteVisitSchedule: {
      ...selectedApplication.siteVisitSchedule,
      status: 'reschedule_requested' as SiteVisitStatus,
      rescheduleRequested: true,
      rescheduleRequestedAt: new Date().toISOString(),
      rescheduleRequestedBy: 'applicant',
      rescheduleReason: rescheduleReason || 'Applicant requested a new date',
    },
    scheduleStatus: 'reschedule_requested' as SiteVisitStatus,
  };

  mockAccreditationService.updateApplication(selectedApplication.id, updatedApp);

  const updatedVisits = JSON.parse(localStorage.getItem('scheduledVisits') || '[]').map((sv: any) =>
    sv.applicationId === selectedApplication.id
      ? { ...sv, status: 'reschedule_requested' }
      : sv
  );
  localStorage.setItem('scheduledVisits', JSON.stringify(updatedVisits));

  setSelectedApplication(updatedApp);
  onRefreshApplications();

  alert('Reschedule request sent to QCTO. A new date must be confirmed by QCTO.');
};

  const getPaymentStatusBadge = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'verified': 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  
    const getRequiredUploadsProgress = (app: ApplicationStatus | null) => {
  if (!app?.requiredApplicantDocuments?.length) {
    return {
      total: 0,
      uploaded: 0,
      allUploaded: false
    };
  }

  const total = app.requiredApplicantDocuments.length;
  const uploaded = app.requiredApplicantDocuments.filter((req) =>
    app.applicantRequiredUploads?.some(
      (item) => item.requirementId === req.id && item.document
    )
  ).length;

  return {
    total,
    uploaded,
    allUploaded: total > 0 && uploaded === total
  };
};

const handleSubmitRequiredDocuments = () => {
  if (!selectedApplication) return;

  const uploadedRequiredDocs =
    selectedApplication.applicantRequiredUploads
      ?.filter((item) => item.document)
      .map((item) => {
        // Create a clean version of the document without large file data
        const doc = item.document!;
        const cleanDoc: any = {
          id: doc.id,
          type: doc.type,
          name: doc.name,
          fileUrl: doc.fileUrl,
          uploadedAt: doc.uploadedAt,
          fileSize: doc.fileSize,
          verified: doc.verified || false,
        };
        // Remove fileData if it exists to prevent storage issues
        if ('fileData' in doc) {
          delete (doc as any).fileData;
        }
        return cleanDoc;
      }) || [];

  const existingDocs = selectedApplication.applicationData?.documents || [];

  // Ensure all documents have required properties
  const allDocs = [...existingDocs, ...uploadedRequiredDocs].map(doc => ({
    id: doc.id || `doc-${Date.now()}-${Math.random()}`,
    type: doc.type || 'other',
    name: doc.name || 'Uploaded Document',
    fileUrl: doc.fileUrl || '',
    uploadedAt: doc.uploadedAt || new Date().toISOString(),
    fileSize: doc.fileSize || 0,
    verified: doc.verified || false,
  }));

  const updatedApp = mockAccreditationService.updateApplication(selectedApplication.id, {
    status: 'step4_documents_uploaded',
    applicationData: {
      ...selectedApplication.applicationData!,
      documents: allDocs
    },
    lastUpdated: new Date().toISOString()
  });

  onRefreshApplications();

  // Close the modal
  setSelectedApplication(null);
  
  // Show success message
  alert('Documents submitted successfully. The application has been sent back for internal review.');
};

const handleResubmit = () => {
  if (!selectedApplication) return;
  mockAccreditationService.updateApplication(selectedApplication.id, {
    status: 'step1_initial_submitted',
    resubmittedAt: new Date().toISOString(),
    resubmissionCount: (selectedApplication.resubmissionCount || 0) + 1,
    missingDocuments: [],
  });
  onRefreshApplications();
  setSelectedApplication(null);
  setResubmitDocUploads({});
  setShowResubmitConfirm(false);
};

const handlePrintFinalRejectionLetterSdp = (app: ApplicationStatus) => {
  const rejDate = app.finalRejectionDate
    ? new Date(app.finalRejectionDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';
  const criteriaList = (app.finalRejectionCriteria || []).map(c => `<li>${c}</li>`).join('');

  const html = `<!DOCTYPE html><html><head>
    <title>Final Evaluation Rejection Notice</title>
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
      .notice { background: #fef2f2; border: 1px solid #fca5a5; padding: 12px; border-radius: 6px; margin: 16px 0; }
      .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; font-size: 13px; color: #6b7280; font-style: italic; }
      @media print { body { margin: 20px; } }
    </style>
  </head><body>
    <div class="header">
      <div class="title">Final Evaluation Rejection Notice</div>
      <div class="subtitle">QCTO Accreditation Division</div>
    </div>
    <div class="section"><div class="label">Applicant</div><div class="value">${app.applicationData?.applicantInfo.fullName || 'N/A'}</div></div>
    <div class="section"><div class="label">Organisation</div><div class="value">${app.applicationData?.applicantInfo.organisationName || 'N/A'}</div></div>
    <div class="section"><div class="label">Application Reference</div><div class="value">${app.applicationId}</div></div>
    <div class="section"><div class="label">Date of Rejection</div><div class="value">${rejDate}</div></div>
    <div class="section"><div class="label">Rejection Reason</div><div class="value">${app.finalRejectionReason || 'N/A'}</div></div>
    ${criteriaList ? `<div class="section"><div class="label">Unmet Evaluation Criteria</div><ul>${criteriaList}</ul></div>` : ''}
    <div class="notice"><p style="margin:0;font-size:14px;">This application has been assessed and does not meet the required criteria for final accreditation. For further information, please contact the accreditation office.</p></div>
    <div class="footer">This is an official communication from the QCTO Accreditation Division. Resubmission is not available for final evaluation rejections.</div>
  </body></html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  }
};

const handlePrintRejectionLetterSdp = (app: ApplicationStatus) => {
  const deadline = app.resubmissionDeadline
    ? new Date(app.resubmissionDeadline).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';
  const rejDate = app.rejectionDate
    ? new Date(app.rejectionDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'N/A';
  const missingList = (app.missingDocuments || []).map(d => `<li>${d}</li>`).join('');

  const html = `<!DOCTYPE html><html><head>
    <title>Application Rejection Notice</title>
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
      <div class="title">Application Rejection Notice</div>
      <div class="subtitle">QCTO Accreditation Division</div>
    </div>
    <div class="section"><div class="label">Applicant</div><div class="value">${app.applicationData?.applicantInfo.fullName || 'N/A'}</div></div>
    <div class="section"><div class="label">Organisation</div><div class="value">${app.applicationData?.applicantInfo.organisationName || 'N/A'}</div></div>
    <div class="section"><div class="label">Application Reference</div><div class="value">${app.applicationId}</div></div>
    <div class="section"><div class="label">Date of Rejection</div><div class="value">${rejDate}</div></div>
    <div class="section"><div class="label">Rejection Reason</div><div class="value">${app.rejectionReason || 'N/A'}</div></div>
    ${missingList ? `<div class="section"><div class="label">Missing / Required Documents</div><ul>${missingList}</ul></div>` : ''}
    <div class="deadline"><div class="label">Resubmission Deadline</div><div class="value" style="margin-top:6px;font-weight:bold;">${deadline}</div></div>
    <div class="footer">Please address all noted deficiencies and resubmit within the specified timeframe.</div>
  </body></html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  }
};

const uploadProgress = selectedApplication
  ? getRequiredUploadsProgress(selectedApplication)
  : { total: 0, uploaded: 0, allUploaded: false };

const handleViewDetails = (app: ApplicationStatus) => {
  const latestApp = mockAccreditationService.getApplicationById(app.id) || app;

  console.log('VIEWED APPLICATION:', latestApp);
  console.log('VIEWED DOCUMENTS:', latestApp.applicationData?.documents);
  console.log('VIEWED REQUIRED UPLOADS:', latestApp.applicantRequiredUploads);

  setSelectedApplication(latestApp);
  setModalActiveTab('details');
};


  // Report Tab Component
  const renderReportTab = () => {
    if (!selectedApplication) return null;
    
    const report = selectedApplication.siteVisitReport;
    if (!report) return null;


    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Site Visit Report</h3>
          <p className="text-sm opacity-90">Application: {selectedApplication.applicationId}</p>
          <p className="text-sm opacity-90">Organisation: {selectedApplication.applicationData?.applicantInfo.organisationName}</p>
        </div>

        {/* Visit Summary Card */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Visit Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Visit Date</p>
              <p className="text-sm font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                {new Date(report.conductedAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Conducted By</p>
              <p className="text-sm font-medium flex items-center">
                <User className="w-4 h-4 mr-1 text-gray-400" />
                {report.conductedBy}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-sm font-medium">{report.conductedByRole === 'qp' ? 'Quality Partner' : 'Verifier'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Outcome</p>
              <p className={`text-sm font-medium ${
                report.outcome === 'compliant' ? 'text-green-600' :
                report.outcome === 'partially_compliant' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {report.outcome.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Executive Summary</h4>
          <p className="text-gray-700">{report.summary}</p>
        </div>

        {/* Checklist Results */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Checklist</h4>
          <div className="space-y-4">
            {report.checklist.map((item, index) => (
              <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start space-x-3">
                  {item.isMet ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.criteria}</p>
                    {item.comments && (
                      <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                        {item.comments}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Gallery */}
        {report.evidence && report.evidence.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Evidence Collected ({report.evidence.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {report.evidence.map((item) => (
                <a
                  key={item.id}
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="aspect-square bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-700 truncate">{item.fileName}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h4>
          <p className="text-gray-700 whitespace-pre-wrap">{report.recommendations}</p>
        </div>

        {/* Download Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              const reportData = JSON.stringify(report, null, 2);
              const blob = new Blob([reportData], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `site-visit-report-${selectedApplication.applicationId}.json`;
              a.click();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">My Applications</h2>
            <p className="text-gray-600">Track and manage your accreditation applications</p>
          </div>
          <button
            onClick={() => onViewApplication('new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            New Application
          </button>
        </div>

        {/* Applications Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qualification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Site Visit
</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No applications found. Click "New Application" to start your accreditation process.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {app.applicationId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.applicationData?.applicantInfo.organisationName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.applicationData?.qualification}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {app.submittedDate ? new Date(app.submittedDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(app.paymentStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
  {app.siteVisitSchedule ? (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-800">
        {new Date(app.siteVisitSchedule.scheduledDate).toLocaleDateString()}
      </p>

      {app.siteVisitSchedule.status === 'pending_acceptance' && (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          Awaiting your confirmation
        </span>
      )}

      {app.siteVisitSchedule.status === 'applicant_confirmed' && (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          Awaiting internal confirmation
        </span>
      )}

      {app.siteVisitSchedule.status === 'booking_confirmed' && (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Booking confirmed
        </span>
      )}

      {app.siteVisitSchedule.status === 'in_progress' && (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
          In progress
        </span>
      )}

      {app.siteVisitSchedule.status === 'completed' && (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          Completed
        </span>
      )}

      {app.siteVisitSchedule.status === 'reschedule_requested' && (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Reschedule requested
        </span>
      )}
    </div>
  ) : (
    <span className="text-sm text-gray-400">Not scheduled</span>
  )}
</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(app)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View
                      </button>
                      
                     
                      
                      {/* Show Upload Payment button only when payment pending */}
                     
                      {/* Show View Outcome Letter when available */}
                      {app.outcomeLetter && (
                        <button
                          onClick={() => onViewOutcomeLetter(app.id)}
                          className="text-purple-600 hover:text-purple-900 ml-3"
                        >
                          View Letter
                        </button>
                      )}
                      
                      {/* Show Payment Notification when available */}
                   
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Applications</p>
            <p className="text-2xl font-bold text-blue-800">{applications.length}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 font-medium">Under Review</p>
            <p className="text-2xl font-bold text-yellow-800">
              {applications.filter(a => ['step2_under_initial_review', 'step5_under_final_review'].includes(a.status)).length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Approved</p>
            <p className="text-2xl font-bold text-green-800">
              {applications.filter(a => ['step3_initial_approved', 'step6_final_approved', 'step9_completed', 'step10_site_visit_scheduled'].includes(a.status)).length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 font-medium">Payment Pending</p>
            <p className="text-2xl font-bold text-yellow-800">
              {applications.filter(a => a.status === 'step7_payment_pending').length}
            </p>
          </div>
        </div>
      </div>

      {/* Final Rejection Letter Modal (SDP) */}
      {showFinalRejectionLetterModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Final Evaluation Rejection Notice</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedApplication.applicationId}</p>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Applicant</p>
                  <p className="font-medium">{selectedApplication.applicationData?.applicantInfo.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rejection Reason</p>
                  <p className="text-gray-700">{selectedApplication.finalRejectionReason || '—'}</p>
                </div>
                {selectedApplication.finalRejectionCriteria && selectedApplication.finalRejectionCriteria.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Unmet Evaluation Criteria</p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedApplication.finalRejectionCriteria.map(c => (
                        <li key={c} className="text-gray-700 text-xs">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 italic">
                This application has not met the required criteria for accreditation. Resubmission is not available at this stage.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowFinalRejectionLetterModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintFinalRejectionLetterSdp(selectedApplication)}
                className="px-6 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download / Print Letter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {/* Rejection Letter Modal (SDP) */}
      {showRejectionLetterModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Application Rejection Notice</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedApplication.applicationId}</p>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Applicant</p>
                  <p className="font-medium">{selectedApplication.applicationData?.applicantInfo.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rejection Reason</p>
                  <p className="text-gray-700">{selectedApplication.rejectionReason || '—'}</p>
                </div>
                {selectedApplication.missingDocuments && selectedApplication.missingDocuments.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Missing Documents</p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedApplication.missingDocuments.map(doc => (
                        <li key={doc} className="text-gray-700 text-xs">{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedApplication.resubmissionDeadline && (
                  <div>
                    <p className="text-xs text-gray-500">Resubmission Deadline</p>
                    <p className="font-medium text-red-700">
                      {getDeadlineInfo(selectedApplication.resubmissionDeadline).formattedDeadline}
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 italic">
                Please address all noted deficiencies and resubmit within the specified timeframe.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectionLetterModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintRejectionLetterSdp(selectedApplication)}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download / Print Letter
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Application Details: {selectedApplication.applicationId}</h2>
                  <div className="mt-2">{getStatusBadge(selectedApplication.status)}</div>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex space-x-4 mt-3 border-b border-gray-200">
                <button
                  onClick={() => setModalActiveTab('details')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    modalActiveTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setModalActiveTab('site-visit')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    modalActiveTab === 'site-visit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  Site Visit
                </button>
                {selectedApplication.status === 'step3_initial_approved' && (
  <button
    onClick={() => setModalActiveTab('documents')}
    className={`pb-2 px-1 text-sm font-medium ${
      modalActiveTab === 'documents'
        ? 'text-blue-600 border-b-2 border-blue-600'
        : 'text-gray-500'
    }`}
  >
    Documents
  </button>
)}
                {selectedApplication.siteVisitReport && (
                  <button
                    onClick={() => setModalActiveTab('report')}
                    className={`pb-2 px-1 text-sm font-medium ${
                      modalActiveTab === 'report' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                    }`}
                  >
                    Report
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {modalActiveTab === 'details' && (
                <>
                  {/* Rejection Notice */}
                  {selectedApplication.status === 'step3_initial_rejected' && (
                    <div className="bg-red-50 border border-red-300 rounded-lg p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-red-800">Your application has been rejected</h3>
                          {selectedApplication.rejectionDate && (
                            <p className="text-xs text-red-600 mt-0.5">
                              Rejected on {new Date(selectedApplication.rejectionDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setShowRejectionLetterModal(true)}
                          className="px-3 py-1.5 text-xs border border-red-300 text-red-700 rounded-md hover:bg-red-100 whitespace-nowrap"
                        >
                          View Rejection Letter
                        </button>
                      </div>

                      {selectedApplication.rejectionReason && (
                        <div>
                          <p className="text-xs font-semibold text-red-700 mb-1">Reason</p>
                          <p className="text-sm text-red-800 bg-white rounded border border-red-200 p-3">{selectedApplication.rejectionReason}</p>
                        </div>
                      )}

                      {selectedApplication.missingDocuments && selectedApplication.missingDocuments.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-red-700 mb-2">Missing / Required Documents</p>
                          <ul className="space-y-1">
                            {selectedApplication.missingDocuments.map(doc => (
                              <li key={doc} className="text-sm text-red-800 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedApplication.resubmissionDeadline && (() => {
                        const { daysRemaining, isExpired, formattedDeadline } = getDeadlineInfo(selectedApplication.resubmissionDeadline);
                        return (
                          <div className={`rounded-lg p-3 border ${isExpired ? 'bg-red-100 border-red-400' : 'bg-amber-50 border-amber-300'}`}>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Resubmission Deadline: {formattedDeadline}</p>
                            {isExpired ? (
                              <p className="text-sm font-medium text-red-700">Resubmission deadline has passed</p>
                            ) : (
                              <p className={`text-sm font-medium ${daysRemaining <= 7 ? 'text-red-700' : 'text-amber-700'}`}>
                                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining to resubmit
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      {selectedApplication.missingDocuments && selectedApplication.missingDocuments.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-red-200">
                          <p className="text-xs font-semibold text-red-700">Upload Corrected Documents</p>
                          {selectedApplication.missingDocuments.map(docLabel => (
                            <div key={docLabel} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                              <div>
                                <p className="text-sm font-medium text-gray-700">{docLabel} <span className="text-red-500">*</span></p>
                                <p className="text-xs text-gray-500">{resubmitDocUploads[docLabel] ? 'Uploaded' : 'Pending upload'}</p>
                              </div>
                              {resubmitDocUploads[docLabel] ? (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" /> Uploaded
                                </span>
                              ) : (
                                <label className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                                  Upload
                                  <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    className="hidden"
                                    onChange={e => {
                                      if (e.target.files?.[0]) {
                                        setResubmitDocUploads(prev => ({ ...prev, [docLabel]: true }));
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {(() => {
                        const missingDocs = selectedApplication.missingDocuments || [];
                        const allUploaded = missingDocs.length === 0 || missingDocs.every(d => resubmitDocUploads[d]);
                        const isExpired = selectedApplication.resubmissionDeadline
                          ? getDeadlineInfo(selectedApplication.resubmissionDeadline).isExpired
                          : false;

                        return (
                          <div className="pt-2">
                            {!showResubmitConfirm ? (
                              <button
                                onClick={() => setShowResubmitConfirm(true)}
                                disabled={!allUploaded || isExpired}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              >
                                Resubmit Application
                              </button>
                            ) : (
                              <div className="bg-white border border-blue-300 rounded-lg p-4 space-y-3">
                                <p className="text-sm font-medium text-gray-800">Are you sure you want to resubmit your application?</p>
                                <p className="text-xs text-gray-500">Your application will be sent back for initial review.</p>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => setShowResubmitConfirm(false)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleResubmit}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                  >
                                    Yes, Resubmit
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Final Rejection Notice */}
                  {selectedApplication.status === 'step6_final_rejected' && (
                    <div className="bg-rose-50 border border-rose-300 rounded-lg p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-rose-800">Your application was not successful at the Final Evaluation stage</h3>
                          {selectedApplication.finalRejectionDate && (
                            <p className="text-xs text-rose-600 mt-0.5">
                              Rejected on {new Date(selectedApplication.finalRejectionDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setShowFinalRejectionLetterModal(true)}
                          className="px-3 py-1.5 text-xs border border-rose-300 text-rose-700 rounded-md hover:bg-rose-100 whitespace-nowrap"
                        >
                          View Rejection Letter
                        </button>
                      </div>

                      {selectedApplication.finalRejectionReason && (
                        <div>
                          <p className="text-xs font-semibold text-rose-700 mb-1">Reason</p>
                          <p className="text-sm text-rose-800 bg-white rounded border border-rose-200 p-3">{selectedApplication.finalRejectionReason}</p>
                        </div>
                      )}

                      {selectedApplication.finalRejectionCriteria && selectedApplication.finalRejectionCriteria.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-rose-700 mb-2">Unmet Evaluation Criteria</p>
                          <ul className="space-y-1">
                            {selectedApplication.finalRejectionCriteria.map(c => (
                              <li key={c} className="text-sm text-rose-800 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="bg-rose-100 border border-rose-200 rounded-lg p-3">
                        <p className="text-sm text-rose-800">
                          For further information or to discuss this outcome, please contact the accreditation office.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Applicant Information */}
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
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Organisation Information */}
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
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.region}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Training Location</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.trainingLocation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Application Details */}
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

                  {/* Uploaded Documents */}
          {/* Application Form */}
{selectedApplication.applicationData?.documents && (
  (() => {
    const applicationForm = selectedApplication.applicationData.documents.find(
      (doc) => doc.type === 'application_form'
    ) as any;

    if (!applicationForm) return null;

    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Application Form
        </h3>

        <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {applicationForm.name}
              </p>
              <p className="text-xs text-gray-500">
                Uploaded: {new Date(applicationForm.uploadedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <a
            href={applicationForm.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            Open Form
          </a>
        </div>

        {/* Validation Information */}
        <div className="mt-4 bg-white rounded border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">
              Upload Validation
            </h4>

            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                applicationForm.validationStatus === 'passed'
                  ? 'bg-green-100 text-green-700'
                  : applicationForm.validationStatus === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {applicationForm.validationStatus || 'Not validated'}
            </span>
          </div>

          {applicationForm.validationChecks?.length > 0 ? (
            <div className="space-y-2">
              {applicationForm.validationChecks.map((check: any) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-2 rounded border border-gray-200"
                >
                  <div>
                    <p className="text-sm text-gray-700">{check.label}</p>
                    {check.message && (
                      <p className="text-xs text-gray-500 mt-1">{check.message}</p>
                    )}
                  </div>

                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      check.status === 'passed'
                        ? 'bg-green-100 text-green-700'
                        : check.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : check.status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
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
      </div>
    );
  })()
)}

{/* Other Uploaded Documents */}
{selectedApplication.applicationData?.documents && (
  <div className="bg-gray-50 p-4 rounded-lg">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">
      Supporting Documents
    </h3>

    <div className="space-y-2">
      {selectedApplication.applicationData.documents
        .filter(doc => doc.type !== 'application_form')
        .map((doc) => (
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
  </div>
)}

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

                  {/* Payment Notification */}
       {selectedApplication.paymentNotification && (
  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Required</h3>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <p className="text-sm text-gray-600">Amount Due</p>
        <p className="text-xl font-bold text-gray-900">
          R{selectedApplication.paymentNotification.amount}
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-600">Due Date</p>
        <p className="text-xl font-bold text-gray-900">
          {new Date(selectedApplication.paymentNotification.dueDate).toLocaleDateString()}
        </p>
      </div>
    </div>

    <div className="bg-white p-3 rounded border border-gray-200 mb-3">
      <p className="text-sm font-medium text-gray-700 mb-2">Bank Details</p>
      <p className="text-xs text-gray-600">
        Bank: {selectedApplication.paymentNotification.bankDetails.bankName}
      </p>
      <p className="text-xs text-gray-600">
        Account: {selectedApplication.paymentNotification.bankDetails.accountNumber}
      </p>
      <p className="text-xs text-gray-600">
        Branch Code: {selectedApplication.paymentNotification.bankDetails.branchCode}
      </p>
    </div>

    <div className="bg-white p-3 rounded border border-gray-200 mb-3">
      <p className="text-xs text-gray-600">Application ID</p>
      <p className="text-sm font-medium text-gray-800">
        {selectedApplication.applicationId}
      </p>

      <p className="text-xs text-gray-600 mt-2">Payment Reference</p>
      <p className="text-sm font-medium text-blue-600">
        {selectedApplication.paymentNotification.paymentReference}
      </p>

      <p className="text-xs text-gray-600 mt-2">Payment will be allocated to</p>
      <p className="text-sm font-medium text-gray-800">
        {selectedApplication.paymentAllocatedToApplicationId || selectedApplication.applicationId}
      </p>
    </div>

    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
      <p className="text-xs text-red-700">
        Please upload proof of payment for this application only.
        Do not use payment made for another application.
      </p>
    </div>

    {selectedApplication.status === 'step7_payment_pending' && (
      <button
        onClick={() => {
          onUploadDocument(selectedApplication.id);
          setSelectedApplication(null);
        }}
        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
      >
        Upload Proof of Payment
      </button>
    )}
  </div>
)}
    

        

                  {/* Proof of Payment */}
                  {selectedApplication.proofOfPayment && selectedApplication.proofOfPayment.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Proof of Payment</h3>
                      {selectedApplication.proofOfPayment.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 mb-2 last:mb-0">
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
                      {selectedApplication.paymentStatus === 'paid' && (
                        <p className="text-xs text-green-600 mt-2">Payment uploaded, awaiting verification</p>
                      )}
                      {selectedApplication.paymentStatus === 'verified' && (
                        <p className="text-xs text-blue-600 mt-2">Payment verified</p>
                      )}
                    </div>
                  )}

                  {/* Outcome Letter */}
                  {selectedApplication.outcomeLetter && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Outcome Letter</h3>
                      <a
                        href={selectedApplication.outcomeLetter.letterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        View Outcome Letter
                      </a>
                    </div>
                  )}
                </>
              )}

        {modalActiveTab === 'site-visit' && (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Site Visit Schedule</h3>
          <p className="text-sm text-gray-500">
            Review your booking details and confirm availability
          </p>
        </div>

        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
          selectedApplication.siteVisitSchedule?.status === 'pending_acceptance'
            ? 'bg-yellow-100 text-yellow-800'
            : selectedApplication.siteVisitSchedule?.status === 'applicant_confirmed'
            ? 'bg-blue-100 text-blue-800'
            : selectedApplication.siteVisitSchedule?.status === 'booking_confirmed'
            ? 'bg-green-100 text-green-800'
            : selectedApplication.siteVisitSchedule?.status === 'in_progress'
            ? 'bg-orange-100 text-orange-800'
            : selectedApplication.siteVisitSchedule?.status === 'completed'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {selectedApplication.siteVisitSchedule?.status === 'pending_acceptance' && 'Awaiting your confirmation'}
          {selectedApplication.siteVisitSchedule?.status === 'applicant_confirmed' && 'Awaiting internal/QCTO confirmation'}
          {selectedApplication.siteVisitSchedule?.status === 'booking_confirmed' && 'Booking confirmed'}
          {selectedApplication.siteVisitSchedule?.status === 'in_progress' && 'Site visit in progress'}
          {selectedApplication.siteVisitSchedule?.status === 'completed' && 'Completed'}
          {selectedApplication.siteVisitSchedule?.status === 'reschedule_requested' && 'Reschedule requested'}
          {selectedApplication.siteVisitSchedule?.status === 'sent_to_applicant' && 'Schedule sent'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Date</p>
          <p className="text-sm font-semibold text-gray-800">
            {selectedApplication.siteVisitSchedule
              ? new Date(selectedApplication.siteVisitSchedule.scheduledDate).toLocaleDateString()
              : 'Not scheduled'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Time</p>
          <p className="text-sm font-semibold text-gray-800">
            {selectedApplication.siteVisitSchedule?.scheduledTime || 'Not scheduled'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 md:col-span-2">
          <p className="text-xs text-gray-500 mb-1">Venue</p>
          <p className="text-sm font-semibold text-gray-800">
            {selectedApplication.siteVisitSchedule?.venue || 'Not specified'}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 md:col-span-2">
          <p className="text-xs text-gray-500 mb-1">Assessor</p>
          <p className="text-sm font-semibold text-gray-800">
            {selectedApplication.siteVisitSchedule?.assessorName || 'To be assigned'}
          </p>
        </div>
      </div>
    </div>

    {(() => {
      const status =
        selectedApplication.scheduleStatus || selectedApplication.siteVisitSchedule?.status;

      if (status === 'pending_acceptance') {
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">Action Required</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please confirm whether you are available for this proposed site visit date.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAcceptSchedule}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Accept Schedule
              </button>

              <button
                onClick={handleRescheduleRequest}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Request Reschedule
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Reason for requesting a new date
              </label>
              <textarea
                rows={3}
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Add the reason if you need a different date..."
              />
            </div>
          </div>
        );
      }

      if (status === 'applicant_confirmed') {
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-blue-800">
              You have confirmed the proposed site visit date.
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Waiting for internal/QCTO to confirm the booking.
            </p>
          </div>
        );
      }

      if (status === 'booking_confirmed') {
        return (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-green-800">
              Booking confirmed by both Applicant and QCTO.
            </p>
            <p className="text-sm text-green-700 mt-1">
              The QP / Verifier can now proceed with the site visit.
            </p>
          </div>
        );
      }

      if (status === 'reschedule_requested') {
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-orange-800">New date requested.</p>
            <p className="text-sm text-orange-700 mt-1">
              Waiting for QCTO to confirm a replacement date.
            </p>
          </div>
        );
      }

      if (status === 'in_progress') {
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-yellow-800">Site visit in progress.</p>
            <p className="text-sm text-yellow-700 mt-1">
              The assessor is currently conducting the visit.
            </p>
          </div>
        );
      }

      if (status === 'completed') {
        return (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-800">Site visit completed.</p>
            <p className="text-sm text-gray-600 mt-1">
              You can view the outcome in the Report tab.
            </p>
          </div>
        );
      }

      if (status === 'sent_to_applicant') {
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-blue-800">Schedule sent to you.</p>
            <p className="text-sm text-blue-700 mt-1">
              Please review and confirm the proposed booking.
            </p>
          </div>
        );
      }

      return null;
    })()}
  </div>
)}
              
              {modalActiveTab === 'documents' && (

                
  <div className="space-y-6">
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Documents Required for Upload
      </h3>

      {selectedApplication.requiredApplicantDocuments &&
      selectedApplication.requiredApplicantDocuments.length > 0 ? (
        <div className="space-y-3">
          {selectedApplication.requiredApplicantDocuments.map((req) => {
            const uploadedMatch = selectedApplication.applicantRequiredUploads?.find(
              item => item.requirementId === req.id
            );

            return (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{req.label}</p>
                  <p className="text-xs text-gray-500">
                    {uploadedMatch ? 'Uploaded' : 'Pending upload'}
                  </p>
                </div>

                {uploadedMatch?.document ? (
                  <a
                    href={uploadedMatch.document.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Upload
                  </a>
                ) : (
                  <label className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                    Upload
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                   onChange={(e) => {
  const file = e.target.files?.[0];
  if (!file || !selectedApplication) return;

  const fileUrl = URL.createObjectURL(file);

  const uploadedDoc = {
    id: `DOC-${Date.now()}`,
    type: 'other' as any,
    name: file.name,
    fileUrl,
    uploadedAt: new Date().toISOString(),
    fileSize: file.size,
    verified: false,
  };

  const existingUploads = selectedApplication.applicantRequiredUploads || [];

  const updatedUploads = [
    ...existingUploads.filter(item => item.requirementId !== req.id),
    {
      requirementId: req.id,
      label: req.label,
      document: uploadedDoc,
      uploadedAt: new Date().toISOString(),
    }
  ];

  mockAccreditationService.updateApplication(selectedApplication.id, {
    applicantRequiredUploads: updatedUploads
  });

  const refreshed = mockAccreditationService.getApplicationById(selectedApplication.id);
  if (refreshed) {
    setSelectedApplication(refreshed);
  }
}}
                    />
                  </label>
                )}
                
              </div>
              
              
            );
          })}
          
        </div>
        
         ) : (
        <p className="text-sm text-gray-500">
          No required documents have been sent yet.
        </p>
      )}
    </div>

    {/* ✅ ADD HERE */}
    {selectedApplication.requiredApplicantDocuments &&
      selectedApplication.requiredApplicantDocuments.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-800">
                Submission Progress
              </h4>
              <p className="text-xs text-gray-600">
                {uploadProgress.uploaded} of {uploadProgress.total} required documents uploaded
              </p>
            </div>

            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                uploadProgress.allUploaded
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {uploadProgress.allUploaded ? 'Ready to Submit' : 'Pending Uploads'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmitRequiredDocuments}
            disabled={!uploadProgress.allUploaded}
            className={`px-4 py-2 rounded-md text-white ${
              uploadProgress.allUploaded
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Submit Documents to Internal Review
          </button>
        </div>
      )}
  </div>
)}


              {modalActiveTab === 'report' && renderReportTab()}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedApplication(null)}
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