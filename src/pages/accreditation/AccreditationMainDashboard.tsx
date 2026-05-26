import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Building2,
  Calendar,
  DollarSign,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  PieChart,
  Eye,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shield,
  Mail,
  Phone,
  MapPin,
  User,
  History
} from 'lucide-react';
import type { ApplicationStatus } from '@/types';
import { mockAccreditationService } from '@/services/mockAccreditationService';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts';

interface AccreditationMainDashboardProps {
  userName?: string;
  userRole?: string;
}

interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  completedApplications: number;
  rejectedApplications: number;
  initialSubmitted: number;
  underReview: number;
  initialApproved: number;
  documentsUploaded: number;
  finalApproved: number;
  paymentPending: number;
  paymentVerified: number;
  siteVisitScheduled: number;
  siteVisitCompleted: number;
  outcomeLettersGenerated: number;
  outcomeLettersApproved: number;
}

interface MonthlyData {
  month: string;
  submitted: number;
  approved: number;
  rejected: number;
}

interface StageData {
  name: string;
  value: number;
  color: string;
}

interface RegionData {
  region: string;
  count: number;
  color: string;
}

interface TimelineEvent {
  id: string;
  applicationId: string;
  organisation: string;
  eventType: 'submitted' | 'approved' | 'rejected' | 'payment' | 'visit';
  date: string;
  description: string;
}

interface DesktopEvaluationStats {
  completed: number;
  pending: number;
  total: number;
  completionRate: number;
}

interface SiteVisitStats {
  scheduled: number;
  completed: number;
  pendingConfirmation: number;
  inProgress: number;
}

interface OutcomeLetterStats {
  generated: number;
  approved: number;
  declined: number;
  pendingReview: number;
  communicated: number;
}

interface RejectionStats {
  initialRejections: number;
  finalRejections: number;
  totalRejections: number;
  resubmittedCount: number;
}

// Define the chart data type for recharts
interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: string | number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function AccreditationMainDashboard({
  userName = "Admin User",
  userRole = "Accreditation Manager"
}: AccreditationMainDashboardProps) {
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const apps = mockAccreditationService.getApplications();
    setApplications(apps);
    setLoading(false);
    setLastUpdated(new Date());
  };

  // Calculate comprehensive statistics
  const stats = useMemo<DashboardStats>(() => {
    const total = applications.length;
    const active = applications.filter(a => a.status !== 'step9_completed' && a.status !== 'step6_final_rejected').length;
    const completed = applications.filter(a => a.status === 'step9_completed').length;
    const rejected = applications.filter(a => a.status === 'step3_initial_rejected' || a.status === 'step6_final_rejected').length;

    return {
      totalApplications: total,
      activeApplications: active,
      completedApplications: completed,
      rejectedApplications: rejected,
      initialSubmitted: applications.filter(a => a.status === 'step1_initial_submitted').length,
      underReview: applications.filter(a => ['step2_under_initial_review', 'step5_under_final_review'].includes(a.status)).length,
      initialApproved: applications.filter(a => a.status === 'step3_initial_approved').length,
      documentsUploaded: applications.filter(a => a.status === 'step4_documents_uploaded').length,
      finalApproved: applications.filter(a => a.status === 'step6_final_approved').length,
      paymentPending: applications.filter(a => a.status === 'step7_payment_pending').length,
      paymentVerified: applications.filter(a => a.paymentStatus === 'verified').length,
      siteVisitScheduled: applications.filter(a => a.siteVisitSchedule?.status === 'booking_confirmed').length,
      siteVisitCompleted: applications.filter(a => a.siteVisitSchedule?.status === 'completed' || a.siteVisitReport).length,
      outcomeLettersGenerated: applications.filter(a => (a as any).generatedOutcomeLetter).length,
      outcomeLettersApproved: applications.filter(a => (a as any).outcomeLetterWorkflow?.status === 'approved').length,
    };
  }, [applications]);

  // Monthly submission data
  const monthlyData = useMemo<MonthlyData[]>(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthApps = applications.filter(app => {
        const submittedDate = app.submittedDate ? new Date(app.submittedDate) : null;
        return submittedDate && submittedDate.getMonth() === index && submittedDate.getFullYear() === currentYear;
      });
      
      const approved = monthApps.filter(app => 
        app.status === 'step9_completed' || app.status === 'step6_final_approved'
      ).length;
      
      const rejected = monthApps.filter(app => 
        app.status === 'step3_initial_rejected' || app.status === 'step6_final_rejected'
      ).length;
      
      return {
        month,
        submitted: monthApps.length,
        approved,
        rejected,
      };
    });
  }, [applications]);

  // Application status distribution for pie chart - convert to ChartDataItem format
  const statusDistributionForChart = useMemo<ChartDataItem[]>(() => {
    const data = [
      { name: 'Initial Submitted', value: stats.initialSubmitted, color: COLORS[0] },
      { name: 'Under Review', value: stats.underReview, color: COLORS[2] },
      { name: 'Initial Approved', value: stats.initialApproved, color: COLORS[1] },
      { name: 'Documents Uploaded', value: stats.documentsUploaded, color: COLORS[6] },
      { name: 'Final Approved', value: stats.finalApproved, color: COLORS[1] },
      { name: 'Payment Pending', value: stats.paymentPending, color: COLORS[4] },
      { name: 'Site Visit', value: stats.siteVisitScheduled, color: COLORS[5] },
      { name: 'Completed', value: stats.completedApplications, color: COLORS[7] },
      { name: 'Rejected', value: stats.rejectedApplications, color: COLORS[3] },
    ].filter(d => d.value > 0);
    
    return data.map(item => ({ name: item.name, value: item.value }));
  }, [stats]);

  // Store colors separately for the pie chart cells
  const statusColors = useMemo<string[]>(() => {
    const data = [
      { value: stats.initialSubmitted, color: COLORS[0] },
      { value: stats.underReview, color: COLORS[2] },
      { value: stats.initialApproved, color: COLORS[1] },
      { value: stats.documentsUploaded, color: COLORS[6] },
      { value: stats.finalApproved, color: COLORS[1] },
      { value: stats.paymentPending, color: COLORS[4] },
      { value: stats.siteVisitScheduled, color: COLORS[5] },
      { value: stats.completedApplications, color: COLORS[7] },
      { value: stats.rejectedApplications, color: COLORS[3] },
    ].filter(d => d.value > 0);
    
    return data.map(d => d.color);
  }, [stats]);

  // Regional distribution for chart
  const regionDataForChart = useMemo<ChartDataItem[]>(() => {
    const regions = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape'];
    
    return regions
      .map(region => ({
        name: region,
        count: applications.filter(a => a.applicationData?.applicantInfo.region === region).length,
      }))
      .filter(r => r.count > 0)
      .map(item => ({ name: item.name, value: item.count }));
  }, [applications]);

  // Region colors for bar chart
  const regionColors = useMemo<string[]>(() => {
    const regionColorsList = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#6366F1'];
    return regionDataForChart.map((_, index) => regionColorsList[index % regionColorsList.length]);
  }, [regionDataForChart]);

  // Desktop evaluation statistics
  const desktopEvalStats = useMemo<DesktopEvaluationStats>(() => {
    const completedApps = applications.filter(app => {
      const storageKey = `desktopEvaluation_${app.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const evalData = JSON.parse(saved);
          return evalData.isComplete === true;
        } catch {
          return false;
        }
      }
      return false;
    });
    
    const totalSiteVisitApps = applications.filter(app => 
      app.status === 'step9_completed' || app.siteVisitSchedule
    ).length;
    
    return {
      completed: completedApps.length,
      pending: totalSiteVisitApps - completedApps.length,
      total: totalSiteVisitApps,
      completionRate: totalSiteVisitApps > 0 ? (completedApps.length / totalSiteVisitApps) * 100 : 0,
    };
  }, [applications]);

  // Site visit statistics
  const siteVisitStats = useMemo<SiteVisitStats>(() => {
    const scheduled = applications.filter(app => app.siteVisitSchedule?.status === 'booking_confirmed').length;
    const completed = applications.filter(app => app.siteVisitSchedule?.status === 'completed' || app.siteVisitReport).length;
    const pendingConfirmation = applications.filter(app => 
      app.siteVisitSchedule && ['pending_acceptance', 'applicant_confirmed', 'pending_qcto_confirmation'].includes(app.siteVisitSchedule.status)
    ).length;
    const inProgress = applications.filter(app => app.siteVisitSchedule?.status === 'in_progress').length;
    
    return { scheduled, completed, pendingConfirmation, inProgress };
  }, [applications]);

  // Outcome letter statistics
  const outcomeLetterStats = useMemo<OutcomeLetterStats>(() => {
    const generated = applications.filter(app => (app as any).generatedOutcomeLetter).length;
    const approved = applications.filter(app => (app as any).outcomeLetterWorkflow?.status === 'approved').length;
    const declined = applications.filter(app => (app as any).outcomeLetterWorkflow?.status === 'declined').length;
    const pendingReview = applications.filter(app => {
      const status = (app as any).outcomeLetterWorkflow?.status;
      return status && !['approved', 'declined'].includes(status);
    }).length;
    const communicated = applications.filter(app => (app as any).outcomeLetterWorkflow?.communicatedAt).length;
    
    return { generated, approved, declined, pendingReview, communicated };
  }, [applications]);

  // Rejection statistics
  const rejectionStats = useMemo<RejectionStats>(() => {
    const initialRejections = applications.filter(a => a.status === 'step3_initial_rejected').length;
    const finalRejections = applications.filter(a => a.status === 'step6_final_rejected').length;
    const resubmittedCount = applications.filter(a => (a.resubmissionCount ?? 0) > 0).length;
    
    return {
      initialRejections,
      finalRejections,
      totalRejections: initialRejections + finalRejections,
      resubmittedCount,
    };
  }, [applications]);

  // Recent activity timeline
  const recentActivity = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];
    
    applications.forEach(app => {
      if (app.submittedDate) {
        events.push({
          id: `${app.id}-submitted`,
          applicationId: app.applicationId,
          organisation: app.applicationData?.applicantInfo.organisationName || 'N/A',
          eventType: 'submitted',
          date: app.submittedDate,
          description: 'Application submitted',
        });
      }
      
      if ((app as any).outcomeLetterWorkflow?.approvedAt) {
        events.push({
          id: `${app.id}-outcome`,
          applicationId: app.applicationId,
          organisation: app.applicationData?.applicantInfo.organisationName || 'N/A',
          eventType: 'approved',
          date: (app as any).outcomeLetterWorkflow.approvedAt,
          description: 'Outcome letter approved',
        });
      }
      
      if (app.siteVisitSchedule?.visitCompletedAt) {
        events.push({
          id: `${app.id}-visit`,
          applicationId: app.applicationId,
          organisation: app.applicationData?.applicantInfo.organisationName || 'N/A',
          eventType: 'visit',
          date: app.siteVisitSchedule.visitCompletedAt,
          description: 'Site visit completed',
        });
      }
    });
    
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [applications]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getEventIcon = (type: TimelineEvent['eventType']) => {
    switch (type) {
      case 'submitted': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-yellow-500" />;
      case 'visit': return <Calendar className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      color: string;
      payload: any;
    }>;
    label?: string;
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          {payload.map((p, idx) => (
            <p key={idx} className="text-sm" style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Accreditation Dashboard</h1>
                  <p className="text-sm text-gray-500">
                    Comprehensive overview of all accreditation activities
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {userName.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Last updated and refresh */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-green-600">↑ {stats.activeApplications}</span>
                  <span className="text-xs text-gray-400">active</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalApplications > 0 
                    ? Math.round((stats.completedApplications / stats.totalApplications) * 100) 
                    : 0}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-green-600">{stats.completedApplications} completed</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.underReview}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-yellow-600">{stats.initialSubmitted} pending initial</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejection Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalApplications > 0 
                    ? Math.round((stats.rejectedApplications / stats.totalApplications) * 100) 
                    : 0}%
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-red-600">{stats.rejectedApplications} rejected</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Second row of stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-600 font-medium">Payment Verified</p>
            <p className="text-xl font-bold text-blue-700">{stats.paymentVerified}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100">
            <p className="text-xs text-purple-600 font-medium">Site Visits</p>
            <p className="text-xl font-bold text-purple-700">{stats.siteVisitScheduled}</p>
            <p className="text-xs text-gray-500">{siteVisitStats.completed} completed</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-600 font-medium">Outcome Letters</p>
            <p className="text-xl font-bold text-green-700">{outcomeLetterStats.generated}</p>
            <p className="text-xs text-gray-500">{outcomeLetterStats.approved} approved</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-4 border border-orange-100">
            <p className="text-xs text-orange-600 font-medium">Desktop Eval</p>
            <p className="text-xl font-bold text-orange-700">{desktopEvalStats.completed}</p>
            <p className="text-xs text-gray-500">{Math.round(desktopEvalStats.completionRate)}% complete</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border border-indigo-100">
            <p className="text-xs text-indigo-600 font-medium">Initial Rejections</p>
            <p className="text-xl font-bold text-indigo-700">{rejectionStats.initialRejections}</p>
          </div>
          <div className="bg-gradient-to-br from-rose-50 to-white rounded-xl p-4 border border-rose-100">
            <p className="text-xs text-rose-600 font-medium">Final Rejections</p>
            <p className="text-xl font-bold text-rose-700">{rejectionStats.finalRejections}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Trends Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Monthly Application Trends</h3>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1"
              >
                <option value="week">Last 7 days</option>
                <option value="month">This Year</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last 12 months</option>
              </select>
            </div>
            <div className="p-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="submitted" fill="#3B82F6" name="Submitted" barSize={30} />
                  <Bar dataKey="approved" fill="#10B981" name="Approved" barSize={30} />
                  <Line type="monotone" dataKey="rejected" stroke="#EF4444" name="Rejected" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Application Status Distribution</h3>
            </div>
            <div className="p-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={statusDistributionForChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => {
                      const percentage = percent ? (percent * 100).toFixed(0) : '0';
                      return `${name}: ${percentage}%`;
                    }}
                    labelLine={false}
                  >
                    {statusDistributionForChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Regional Distribution and Progress Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Regional Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Applications by Region</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionDataForChart} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]}>
                    {regionDataForChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={regionColors[index % regionColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Workflow Progress</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Desktop Evaluation Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Desktop Evaluation</span>
                  <span className="font-medium">{Math.round(desktopEvalStats.completionRate)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${desktopEvalStats.completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{desktopEvalStats.completed} of {desktopEvalStats.total} completed</p>
              </div>

              {/* Site Visit Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Site Visits</span>
                  <span className="font-medium">
                    {siteVisitStats.scheduled > 0 ? Math.round((siteVisitStats.completed / siteVisitStats.scheduled) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${siteVisitStats.scheduled > 0 ? (siteVisitStats.completed / siteVisitStats.scheduled) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{siteVisitStats.completed} of {siteVisitStats.scheduled} completed</p>
              </div>

              {/* Outcome Letter Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Outcome Letters</span>
                  <span className="font-medium">
                    {outcomeLetterStats.generated > 0 ? Math.round((outcomeLetterStats.approved / outcomeLetterStats.generated) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${outcomeLetterStats.generated > 0 ? (outcomeLetterStats.approved / outcomeLetterStats.generated) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{outcomeLetterStats.approved} of {outcomeLetterStats.generated} approved</p>
              </div>

              {/* Payment Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Payment Collection</span>
                  <span className="font-medium">
                    {stats.paymentPending + stats.paymentVerified > 0 
                      ? Math.round((stats.paymentVerified / (stats.paymentPending + stats.paymentVerified)) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stats.paymentPending + stats.paymentVerified > 0 ? (stats.paymentVerified / (stats.paymentPending + stats.paymentVerified)) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{stats.paymentVerified} verified, {stats.paymentPending} pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity Timeline */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                Recent Activity
              </h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((event) => (
                  <div key={event.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getEventIcon(event.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {event.applicationId}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{event.organisation}</p>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="space-y-4">
            {/* Rejection Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Rejection Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Initial Rejections</span>
                  <span className="font-semibold text-red-600">{rejectionStats.initialRejections}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Final Rejections</span>
                  <span className="font-semibold text-rose-600">{rejectionStats.finalRejections}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Resubmitted</span>
                  <span className="font-semibold text-blue-600">{rejectionStats.resubmittedCount}</span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Payment Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Verified</span>
                  <span className="font-semibold text-green-600">{stats.paymentVerified}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Verification</span>
                  <span className="font-semibold text-yellow-600">{stats.paymentPending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Rate</span>
                  <span className="font-semibold">
                    {stats.paymentPending + stats.paymentVerified > 0 
                      ? Math.round((stats.paymentVerified / (stats.paymentPending + stats.paymentVerified)) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Site Visit Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                Site Visit Summary
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Scheduled</span>
                  <span className="font-semibold text-purple-600">{siteVisitStats.scheduled}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="font-semibold text-yellow-600">{siteVisitStats.inProgress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-semibold text-green-600">{siteVisitStats.completed}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          <p>Accreditation Dashboard | Data refreshes automatically every 30 seconds | Last full sync: {lastUpdated.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}