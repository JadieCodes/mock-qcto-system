import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  AlertCircle
} from 'lucide-react';
import type { ApplicationStatus, SiteVisitStatus, SiteVisitReport } from '@/types';
import { mockAccreditationService } from '@/services/mockAccreditationService';
import ScheduleManager from '@/components/ui/ScheduleManager';
import SiteVisitEvaluationTool from '@/components/ui/SiteVisitEvaluationTool';

interface QPDashboardProps {
  userName?: string;
  userRole?: string;
  userId?: string;
}

export default function QPDashboard({ 
  userName = "John Smith", 
  userRole = "Quality Partner",
  userId = "qp1" 
}: QPDashboardProps) {
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationStatus | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [allocations, setAllocations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'schedule'>('applications');
  const [scheduledVisits, setScheduledVisits] = useState<any[]>([]);
  const [modalActiveTab, setModalActiveTab] = useState<'details' | 'site-visit' | 'report'>('details');
  const [siteVisitReport, setSiteVisitReport] = useState<SiteVisitReport | null>(null);
  const [showEvaluationTool, setShowEvaluationTool] = useState(false);

  useEffect(() => {
    loadApplications();
    loadAllData();
    
    // Set up an interval to refresh data every 5 seconds
    const interval = setInterval(() => {
      loadAllData();
      loadApplications();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadAllData = () => {
    // Load assignments (this is what we need for allocated applications)
    const savedAssignments = localStorage.getItem('assignments');
    if (savedAssignments) {
      setAllocations(JSON.parse(savedAssignments));
    }
    
    // Also load siteVisitAllocations as backup
    const savedSiteVisitAllocations = localStorage.getItem('siteVisitAllocations');
    if (savedSiteVisitAllocations && !savedAssignments) {
      setAllocations(JSON.parse(savedSiteVisitAllocations));
    }
    
    // Load scheduled visits
    const savedScheduledVisits = localStorage.getItem('scheduledVisits');
    if (savedScheduledVisits) {
      setScheduledVisits(JSON.parse(savedScheduledVisits));
    }
    
    // Force a refresh of applications
    loadApplications();
  };

  const loadApplications = () => {
    const apps = mockAccreditationService.getApplications();
    setApplications(apps);
  };

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Get applications allocated to this QP
  const myAllocatedApplications = applications.filter(app => {
    // Check in allocations (assignments)
    const appInAllocations = allocations.some((a: any) => 
      a.applicationId === app.id && 
      (a.allocatedTo === 'quality_partner' || a.category === 'quality_partner') && 
      (a.allocatedToName === userName || a.assignedToName === userName)
    );
    
    // Also check in scheduledVisits
    const appInScheduledVisits = scheduledVisits.some(sv => 
      sv.applicationId === app.id && 
      sv.assignedToName === userName
    );
    
    return appInAllocations || appInScheduledVisits;
  });

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'allocated': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Allocated'}
      </span>
    );
  };

  const handleStartSiteVisit = (applicationId: string) => {
    // Update the application status to in_progress
    const updatedApplications = applications.map(app => {
      if (app.id === applicationId && app.siteVisitSchedule) {
        return {
          ...app,
          siteVisitSchedule: {
            ...app.siteVisitSchedule,
            status: 'in_progress' as SiteVisitStatus,
          },
        };
      }
      return app;
    });

    // Update in mockAccreditationService
    const app = applications.find(a => a.id === applicationId);
    if (app && app.siteVisitSchedule) {
      mockAccreditationService.updateApplication(applicationId, {
        ...app,
        siteVisitSchedule: {
          ...app.siteVisitSchedule,
          status: 'in_progress' as SiteVisitStatus,
        },
      });
    }

    // Update localStorage
    localStorage.setItem('applications', JSON.stringify(updatedApplications));
    
    // Update state
    setApplications(updatedApplications);
    setModalActiveTab('site-visit');
    
    alert('Site visit started! You can now complete your review.');
  };

  const handleCompleteSiteVisit = (applicationId: string, report: SiteVisitReport) => {
    // Update the application status to completed
    const updatedApplications = applications.map(app => {
      if (app.id === applicationId && app.siteVisitSchedule) {
        return {
          ...app,
          siteVisitSchedule: {
            ...app.siteVisitSchedule,
            status: 'completed' as SiteVisitStatus,
          },
          siteVisitReport: report,
        };
      }
      return app;
    });

    // Update in mockAccreditationService
    const app = applications.find(a => a.id === applicationId);
    if (app && app.siteVisitSchedule) {
      mockAccreditationService.updateApplication(applicationId, {
        ...app,
        siteVisitSchedule: {
          ...app.siteVisitSchedule,
          status: 'completed',
        },
        siteVisitReport: report,
      });
    }

    // Update localStorage
    localStorage.setItem('applications', JSON.stringify(updatedApplications));
    
    // Update state
    setApplications(updatedApplications);
    setSelectedApplication(null);
    setShowEvaluationTool(false);
    setSiteVisitReport(report);
    
    alert('Site visit completed! Report generated.');
  };

  const filteredApplications = myAllocatedApplications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationData?.applicantInfo.organisationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationData?.qualification.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Get scheduled visits for this QP
  const myScheduledVisits = scheduledVisits.filter(sv => 
    sv.assignedToName === userName && 
    (sv.status === 'accepted' || sv.status === 'sent_to_applicant' || sv.status === 'pending_confirmation')
  );

  // Report Tab
  const renderReportTab = () => {
    if (!selectedApplication) return null;
    
    const report = selectedApplication.siteVisitReport || siteVisitReport;
    if (!report) return null;

    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Site Visit Report</h3>
          <p className="text-sm opacity-90">Application: {selectedApplication.applicationId}</p>
          <p className="text-sm opacity-90">Organisation: {selectedApplication.applicationData?.applicantInfo.organisationName}</p>
        </div>

        {/* Executive Summary */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Executive Summary</h4>
          <p className="text-gray-700">{report.summary}</p>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Outcome</p>
            <p className={`text-lg font-semibold ${
              report.outcome === 'compliant' ? 'text-green-600' :
              report.outcome === 'partially_compliant' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {report.outcome.replace('_', ' ').toUpperCase()}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Conducted By</p>
            <p className="text-lg font-semibold text-gray-800">{report.conductedBy}</p>
            <p className="text-xs text-gray-500">{report.conductedByRole === 'qp' ? 'Quality Partner' : 'Verifier'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Date Completed</p>
            <p className="text-lg font-semibold text-gray-800">
              {new Date(report.completedAt || report.conductedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Risk Profile (for QP only) */}
        {report.riskProfile && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk Profile</h4>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              report.riskProfile === 'low' ? 'bg-green-100 text-green-800' :
              report.riskProfile === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {report.riskProfile.toUpperCase()} RISK
            </div>
          </div>
        )}

        {/* Checklist Results */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Checklist</h4>
          <div className="space-y-4">
            {report.checklist.map((item) => (
              <div key={item.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {report.evidence.map((item) => (
                <a
                  key={item.id}
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  {item.type === 'photo' ? (
                    <div className="aspect-square bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-2xl">📷</span>
                    </div>
                  ) : (
                    <div className="aspect-square bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-2xl">📄</span>
                    </div>
                  )}
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

        {/* Download Report Button */}
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

  // Site Visit Tab Content
  const renderSiteVisitTab = () => {
    if (!selectedApplication) return null;
    
    // Load existing report if available
    const existingReport = siteVisitReport || selectedApplication.siteVisitReport as SiteVisitReport;
    
    if (showEvaluationTool) {
      return (
        <SiteVisitEvaluationTool
          application={selectedApplication}
          userRole="qp"
          userName={userName}
          initialReport={existingReport || undefined}
          onSave={(report) => {
            setSiteVisitReport(report);
            localStorage.setItem(`report-${selectedApplication.id}`, JSON.stringify(report));
            alert('Report saved as draft');
          }}
          onComplete={(report) => {
            setSiteVisitReport(report);
            localStorage.setItem(`report-${selectedApplication.id}`, JSON.stringify(report));
            
            // Update application status and attach report
            const updatedApplications = applications.map(app => {
              if (app.id === selectedApplication.id) {
                return {
                  ...app,
                  siteVisitSchedule: {
                    ...app.siteVisitSchedule!,
                    status: 'completed' as SiteVisitStatus,
                  },
                  siteVisitReport: report,
                };
              }
              return app;
            });
            
            // Update in mock service
            mockAccreditationService.updateApplication(selectedApplication.id, {
              ...selectedApplication,
              siteVisitSchedule: {
                ...selectedApplication.siteVisitSchedule!,
                status: 'completed',
              },
              siteVisitReport: report,
            });
            
            setApplications(updatedApplications);
            setSelectedApplication(null);
            setShowEvaluationTool(false);
            alert('Site visit completed! Report generated.');
          }}
          onCancel={() => setShowEvaluationTool(false)}
        />
      );
    }
    
    return (
      <div className="space-y-4">
        {/* Visit Details */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Site Visit Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Date & Time</p>
              <p className="text-sm font-medium">
                {selectedApplication.siteVisitSchedule ? 
                  `${new Date(selectedApplication.siteVisitSchedule.scheduledDate).toLocaleDateString()} at ${selectedApplication.siteVisitSchedule.scheduledTime}` : 
                  'Not scheduled'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Venue</p>
              <p className="text-sm font-medium">{selectedApplication.siteVisitSchedule?.venue || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Assessor</p>
              <p className="text-sm font-medium">{selectedApplication.siteVisitSchedule?.assessorName || userName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Region</p>
              <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.region}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Qualification</p>
              <p className="text-sm font-medium">{selectedApplication.applicationData?.qualification}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!existingReport ? (
            <button
              onClick={() => setShowEvaluationTool(true)}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Start Site Visit Evaluation
            </button>
          ) : (
            <button
              onClick={() => setShowEvaluationTool(true)}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Report
            </button>
          )}
        </div>

        {/* Quick Status if report exists */}
        {existingReport && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              ✓ Report completed on {new Date(existingReport.completedAt || existingReport.conductedAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              View the full report in the Report tab
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quality Partner Dashboard</h1>
              <p className="text-sm text-gray-600">Review and evaluate allocated applications</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {userName.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Applications
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Availability
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'applications' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <p className="text-sm text-gray-600">Total Allocated</p>
                <p className="text-2xl font-bold text-gray-900">{myAllocatedApplications.length}</p>
              </div>
              <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
                <p className="text-sm text-blue-600">New</p>
                <p className="text-2xl font-bold text-blue-600">
                  {myAllocatedApplications.filter(a => a.status === 'step9_completed').length}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg shadow-sm p-4 border border-yellow-200">
                <p className="text-sm text-yellow-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {myAllocatedApplications.filter(a => a.siteVisitSchedule?.status === 'in_progress').length}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
                <p className="text-sm text-green-600">Scheduled</p>
                <p className="text-2xl font-bold text-green-600">
                  {myAllocatedApplications.filter(a => a.siteVisitSchedule?.status === 'accepted').length}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    <Download className="w-4 h-4 inline mr-2" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No applications allocated to you yet.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => {
                      const allocation = allocations.find((a: any) => 
                        a.applicationId === app.id && 
                        (a.allocatedTo === 'quality_partner' || a.category === 'quality_partner')
                      );
                      
                      const visit = scheduledVisits.find(sv => 
                        sv.applicationId === app.id && 
                        sv.assignedToName === userName
                      );
                      
                      return (
                        <React.Fragment key={app.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{app.applicationId}</div>
                              <div className="text-xs text-gray-500">{app.applicationData?.applicationType}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{app.applicationData?.applicantInfo.organisationName}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">{app.applicationData?.qualification}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {app.applicationData?.applicantInfo.region}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {allocation ? new Date(allocation.allocatedAt || allocation.assignedAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {app.siteVisitSchedule?.status === 'in_progress' ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                  In Progress
                                </span>
                              ) : app.siteVisitSchedule?.status === 'accepted' ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  Scheduled
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  Allocated
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {visit ? (
                                <div>
                                  {visit.status === 'accepted' && (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                      {new Date(visit.scheduledDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  {visit.status === 'sent_to_applicant' && (
                                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                      Awaiting Acceptance
                                    </span>
                                  )}
                                  {visit.status === 'pending_confirmation' && (
                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Not scheduled</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => toggleRowExpand(app.id)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                {expandedRows.has(app.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => setSelectedApplication(app)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                          {expandedRows.has(app.id) && (
                            <tr className="bg-gray-50">
                              <td colSpan={8} className="px-6 py-4">
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Contact Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <p className="flex items-center text-gray-600">
                                        <User className="w-4 h-4 mr-2" />
                                        {app.applicationData?.applicantInfo.fullName}
                                      </p>
                                      <p className="flex items-center text-gray-600">
                                        <Mail className="w-4 h-4 mr-2" />
                                        {app.applicationData?.applicantInfo.email}
                                      </p>
                                      <p className="flex items-center text-gray-600">
                                        <Phone className="w-4 h-4 mr-2" />
                                        {app.applicationData?.applicantInfo.phone}
                                      </p>
                                    </div>
                                    
                                    <h4 className="text-sm font-semibold text-gray-900 mt-4 mb-2">Training Location</h4>
                                    <div className="space-y-2 text-sm">
                                      <p className="flex items-center text-gray-600">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        {app.applicationData?.applicantInfo.trainingLocation}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Documents</h4>
                                    <div className="space-y-2">
                                      {app.applicationData?.documents && app.applicationData.documents.length > 0 ? (
                                        app.applicationData.documents.map((doc) => (
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
                                        ))
                                      ) : (
                                        <p className="text-sm text-gray-500">No documents available</p>
                                      )}
                                    </div>

                                    {app.finalReview?.aiRecommendation && (
                                      <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Recommendation</h4>
                                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                          <p className="text-sm text-gray-700">{app.finalReview.aiRecommendation.summary}</p>
                                          <div className="mt-2 flex items-center space-x-4 text-xs">
                                            <span className="text-gray-600">Score: {app.finalReview.aiRecommendation.overallScore}%</span>
                                            <span className={`px-2 py-1 rounded ${
                                              app.finalReview.aiRecommendation.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                                              app.finalReview.aiRecommendation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-red-100 text-red-700'
                                            }`}>
                                              Risk: {app.finalReview.aiRecommendation.riskLevel}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Scheduled Visit Details */}
                                    {visit && (
                                      <div className="mt-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Scheduled Visit</h4>
                                        <div className={`p-3 rounded border ${
                                          visit.status === 'accepted' 
                                            ? 'bg-green-50 border-green-200' 
                                            : visit.status === 'sent_to_applicant'
                                            ? 'bg-yellow-50 border-yellow-200'
                                            : 'bg-purple-50 border-purple-200'
                                        }`}>
                                          <p className="text-sm text-gray-700">
                                            Date: {new Date(visit.scheduledDate).toLocaleDateString()} at {visit.scheduledTime}
                                          </p>
                                          <p className="text-sm text-gray-700 mt-1">Venue: {visit.venue}</p>
                                          {visit.status === 'accepted' && (
                                            <p className="text-xs text-green-600 mt-2">✓ Applicant has accepted this visit</p>
                                          )}
                                          {visit.status === 'sent_to_applicant' && (
                                            <p className="text-xs text-yellow-600 mt-2">⏳ Waiting for applicant to accept</p>
                                          )}
                                          {visit.status === 'pending_confirmation' && (
                                            <p className="text-xs text-purple-600 mt-2">⏳ Waiting for Assistant Director to send</p>
                                          )}
                                        </div>
                                      </div>
                                    )}
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
          </>
        ) : (
          <ScheduleManager 
            userId={userId}
            userName={userName}
            userRole="qp"
          />
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Application Details: {selectedApplication.applicationId}</h2>
                  <p className="text-xs text-gray-500 mt-1">{selectedApplication.applicationData?.applicantInfo.organisationName}</p>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-5 h-5" />
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
                {/* Show Report tab only when a report exists */}
                {(selectedApplication?.siteVisitReport || siteVisitReport) && (
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

            <div className="p-4 space-y-4">
              {modalActiveTab === 'details' ? (
                <>
                  {/* Applicant Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Applicant Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ID Number</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.idNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Organisation Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Organisation Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Organisation</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.organisationName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Company</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.companyName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Registration</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.companyRegistration || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Region</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.region}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Training Location</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.trainingLocation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Application Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Qualification</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.qualification}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicationType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Documents</h4>
                    <div className="space-y-2">
                      {selectedApplication.applicationData?.documents && selectedApplication.applicationData.documents.length > 0 ? (
                        selectedApplication.applicationData.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 text-blue-500 mr-2" />
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
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No documents available</p>
                      )}
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  {selectedApplication.finalReview?.aiRecommendation && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">AI Recommendation</h4>
                      <p className="text-sm text-gray-700">{selectedApplication.finalReview.aiRecommendation.summary}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs">
                        <span className="text-gray-600">Score: {selectedApplication.finalReview.aiRecommendation.overallScore}%</span>
                        <span className={`px-2 py-1 rounded ${
                          selectedApplication.finalReview.aiRecommendation.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                          selectedApplication.finalReview.aiRecommendation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Risk: {selectedApplication.finalReview.aiRecommendation.riskLevel}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : modalActiveTab === 'site-visit' ? (
                renderSiteVisitTab()
              ) : modalActiveTab === 'report' ? (
                renderReportTab()
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedApplication(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              
              {/* Show Start Site Visit button only for accepted visits */}
              {selectedApplication?.siteVisitSchedule?.status === 'accepted' && modalActiveTab === 'details' && (
                <button
                  onClick={() => handleStartSiteVisit(selectedApplication.id)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Start Site Visit
                </button>
              )}
              
              {/* Show Complete button when in progress */}
              {selectedApplication?.siteVisitSchedule?.status === 'in_progress' && modalActiveTab === 'site-visit' && siteVisitReport && (
                <button
                  onClick={() => handleCompleteSiteVisit(selectedApplication.id, siteVisitReport)}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  Complete Site Visit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}