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
  Users,
  AlertCircle,
  Shield
} from 'lucide-react';
import type { ApplicationStatus } from '@/types';
import { mockAccreditationService } from '@/services/mockAccreditationService';
import ScheduleManager from '@/components/ui/ScheduleManager';

interface VerifierDashboardProps {
  userName?: string;
  userRole?: string;
  userId?: string;
}

export default function VerifierDashboard({ 
  userName = "David Brown", 
  userRole = "Verifier",
  userId = "ver1" 
}: VerifierDashboardProps) {
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationStatus | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [allocations, setAllocations] = useState<any[]>([]);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'applications' | 'schedule'>('applications');
  const [scheduledVisits, setScheduledVisits] = useState<any[]>([]);
  const [modalActiveTab, setModalActiveTab] = useState<'details' | 'site-visit'>('details');

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
const handleStartSiteVisit = (applicationId: string) => {
  // Update the application status to in_progress
  const updatedApplications = applications.map(app => {
    if (app.id === applicationId) {
      return {
        ...app,
        siteVisitSchedule: {
          ...app.siteVisitSchedule!,
          status: 'in_progress' as const,
        },
        visitStatus: 'in_progress',
      };
    }
    return app;
  });

  // Update in mockAccreditationService
  const app = applications.find(a => a.id === applicationId);
  if (app) {
    mockAccreditationService.updateApplication(applicationId, {
      ...app,
      siteVisitSchedule: {
        ...app.siteVisitSchedule!,
        status: 'in_progress',
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

const handleCompleteSiteVisit = (applicationId: string) => {
  // Update the application status to completed
  const updatedApplications = applications.map(app => {
    if (app.id === applicationId) {
      return {
        ...app,
        siteVisitSchedule: {
          ...app.siteVisitSchedule!,
          status: 'completed' as const,
        },
        visitStatus: 'completed',
      };
    }
    return app;
  });

  // Update in mockAccreditationService
  const app = applications.find(a => a.id === applicationId);
  if (app) {
    mockAccreditationService.updateApplication(applicationId, {
      ...app,
      siteVisitSchedule: {
        ...app.siteVisitSchedule!,
        status: 'completed',
      },
    });
  }

  // Update localStorage
  localStorage.setItem('applications', JSON.stringify(updatedApplications));
  
  // Update state
  setApplications(updatedApplications);
  setSelectedApplication(null);
  
  alert('Site visit completed!');
};
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

  // Get applications allocated to this Verifier
  // Get applications allocated to this QP/Verifier
const myAllocatedApplications = applications.filter(app => {
  // Check in allocations (assignments)
  const appInAllocations = allocations.some(a => 
    a.applicationId === app.id && 
    a.allocatedTo === (userRole === 'Quality Partner' ? 'quality_partner' : 'verifier') && 
    a.allocatedToName === userName
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
      'verifying': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Allocated'}
      </span>
    );
  };

  const handleVerify = (applicationId: string, decision: 'verified' | 'rejected') => {
    // Update allocation status
    const updatedAllocations = allocations.map(a => {
      if (a.applicationId === applicationId && a.allocatedTo === 'verifier') {
        return {
          ...a,
          status: decision === 'verified' ? 'completed' : 'rejected',
        };
      }
      return a;
    });
    
    setAllocations(updatedAllocations);
    localStorage.setItem('siteVisitAllocations', JSON.stringify(updatedAllocations));
    
    alert(`Application ${decision === 'verified' ? 'verified' : 'rejected'} successfully!`);
    setSelectedApplication(null);
    setVerificationNotes('');
  };

  const filteredApplications = myAllocatedApplications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationData?.applicantInfo.organisationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationData?.qualification.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Get scheduled visits for this Verifier
  const myScheduledVisits = scheduledVisits.filter(sv => 
    sv.assignedToName === userName && 
    (sv.status === 'accepted' || sv.status === 'sent_to_applicant' || sv.status === 'pending_confirmation')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verifier Dashboard</h1>
              <p className="text-sm text-gray-600">Verify allocated applications and documentation</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
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
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Applications
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-purple-600 text-purple-600'
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
                <p className="text-sm text-blue-600">Pending</p>
                <p className="text-2xl font-bold text-blue-600">
                  {myAllocatedApplications.filter(a => a.status === 'step9_completed').length}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg shadow-sm p-4 border border-yellow-200">
                <p className="text-sm text-yellow-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {myScheduledVisits.filter(v => v.status === 'sent_to_applicant').length}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
                <p className="text-sm text-green-600">Scheduled</p>
                <p className="text-2xl font-bold text-green-600">
                  {myScheduledVisits.filter(v => v.status === 'accepted').length}
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
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
                      const allocation = allocations.find(a => 
                        a.applicationId === app.id && 
                        a.allocatedTo === 'verifier'
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
                              {allocation ? new Date(allocation.allocatedAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(allocation?.status || 'allocated')}
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
                                className="text-purple-600 hover:text-purple-900 mr-3"
                              >
                                {expandedRows.has(app.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => setSelectedApplication(app)}
                                className="text-purple-600 hover:text-purple-900"
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
                                              <FileText className="w-4 h-4 text-purple-500 mr-2" />
                                              <span className="text-sm text-gray-600">{doc.name}</span>
                                            </div>
                                            <a
                                              href={doc.fileUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-purple-600 hover:text-purple-800 text-sm"
                                            >
                                              View
                                            </a>
                                          </div>
                                        ))
                                      ) : (
                                        <p className="text-sm text-gray-500">No documents available</p>
                                      )}
                                    </div>

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
            userRole="verifier"
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
            </div>

            <div className="p-4 space-y-4">
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
                          <FileText className="w-4 h-4 text-purple-500 mr-2" />
                          <span className="text-sm text-gray-600">{doc.name}</span>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-800 text-sm"
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

              {/* Verification Notes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Verification Notes</h4>
                <textarea
                  rows={4}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add verification notes, findings, or comments..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Action Buttons */}
            {/* Action Buttons */}
<div className="flex justify-end space-x-3 pt-4">
  <button
    onClick={() => setSelectedApplication(null)}
    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
  >
    Close
  </button>
  
  {/* Show Start Site Visit button only for accepted visits */}
  {selectedApplication?.siteVisitSchedule?.status === 'accepted' && (
    <button
      onClick={() => handleStartSiteVisit(selectedApplication.id)}
      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
    >
      Start Site Visit
    </button>
  )}
  
  {/* Show Complete button when in progress */}
  {selectedApplication?.siteVisitSchedule?.status === 'in_progress' && (
    <button
      onClick={() => handleCompleteSiteVisit(selectedApplication.id)}
      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
    >
      Complete Site Visit
    </button>
  )}
</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}