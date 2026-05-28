import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  FileText,
  Users,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Award,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { QADashboardReportBuilder } from './QADashboardReportBuilder';
import type { QAExternalEnrolment } from './QADashboardReportBuilder';

// ─── Mock Chart Data ──────────────────────────────────────────────────────────

const enrolmentActivityData = [
  { month: 'Jan', submitted: 28, validated: 20, allocated: 15 },
  { month: 'Feb', submitted: 35, validated: 28, allocated: 22 },
  { month: 'Mar', submitted: 42, validated: 38, allocated: 30 },
  { month: 'Apr', submitted: 31, validated: 25, allocated: 19 },
  { month: 'May', submitted: 39, validated: 32, allocated: 27 },
  { month: 'Jun', submitted: 45, validated: 40, allocated: 35 },
];

const statusDistributionData = [
  { name: 'In Progress', value: 45, color: '#3B82F6' },
  { name: 'Site Visit Pending', value: 18, color: '#F59E0B' },
  { name: 'Monitoring', value: 32, color: '#8B5CF6' },
  { name: 'Completed', value: 23, color: '#10B981' },
  { name: 'Pending Allocation', value: 12, color: '#EF4444' },
];

const siteVisitTrendData = [
  { month: 'Jan', scheduled: 5, completed: 4 },
  { month: 'Feb', scheduled: 7, completed: 6 },
  { month: 'Mar', scheduled: 9, completed: 7 },
  { month: 'Apr', scheduled: 6, completed: 5 },
  { month: 'May', scheduled: 8, completed: 8 },
  { month: 'Jun', scheduled: 10, completed: 7 },
];

const plansConsolidationData = [
  { month: 'Jan', submitted: 12, consolidated: 10 },
  { month: 'Feb', submitted: 15, consolidated: 13 },
  { month: 'Mar', submitted: 18, consolidated: 16 },
  { month: 'Apr', submitted: 11, consolidated: 9 },
  { month: 'May', submitted: 14, consolidated: 12 },
  { month: 'Jun', submitted: 20, consolidated: 17 },
];

const recentActivity = [
  { date: '2026-05-27', domain: 'Curriculum Implementation', item: 'Site Visit Completed – ENR-2026-0142', status: 'Completed', priority: 'High' },
  { date: '2026-05-27', domain: 'Learner Enrolment', item: 'New Enrolment Submitted – ENR-2026-0156', status: 'Submitted', priority: 'Medium' },
  { date: '2026-05-26', domain: 'Skills Programmes', item: 'Monitoring Report Uploaded – SP-2026-0089', status: 'Under Review', priority: 'High' },
  { date: '2026-05-26', domain: 'Curriculum Implementation', item: 'Plans Consolidated – ENR-2026-0137', status: 'Plans Consolidated', priority: 'Medium' },
  { date: '2026-05-25', domain: 'Learner Enrolment', item: 'QP Allocation Completed – ENR-2026-0131', status: 'Allocated to QP', priority: 'Low' },
  { date: '2026-05-25', domain: 'Skills Programmes', item: 'Validation Approved – SP-2026-0082', status: 'QA SP Validated', priority: 'Medium' },
  { date: '2026-05-24', domain: 'Curriculum Implementation', item: 'Site Visit Scheduled – ENR-2026-0129', status: 'Site Visit Pending', priority: 'High' },
  { date: '2026-05-24', domain: 'Learner Enrolment', item: 'Gate Evaluation Completed – ENR-2026-0125', status: 'Gate Evaluation Completed', priority: 'Low' },
  { date: '2026-05-23', domain: 'Skills Programmes', item: 'SDP Evidence Received – SP-2026-0078', status: 'SDP Evidence Submitted', priority: 'Medium' },
  { date: '2026-05-22', domain: 'Historical Qualifications', item: 'Legacy Record Updated – HQ-2026-0034', status: 'Completed', priority: 'Low' },
];

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  colorClass: string;
  icon: React.ReactNode;
}

function SummaryCard({ title, value, subtitle, colorClass, icon }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${colorClass} flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Status / Priority Badges ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const green = ['Completed', 'QA SP Validated', 'Allocated to QP', 'Plans Consolidated', 'Gate Evaluation Completed'];
  const yellow = ['Under Review', 'SDP Evidence Submitted', 'Site Visit Pending'];
  if (green.includes(status))
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{status}</span>;
  if (yellow.includes(status))
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{status}</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'High')
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{priority}</span>;
  if (priority === 'Medium')
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">{priority}</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{priority}</span>;
}

// ─── Main Component ────────────────────────────────────────────────────────────

const QADashboard: React.FC = () => {
  const { enrolments, currentUser } = useApp();
  const [externalEnrolments, setExternalEnrolments] = useState<QAExternalEnrolment[]>([]);
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('external_learner_enrolment_batches_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setExternalEnrolments(parsed as QAExternalEnrolment[]);
      }
    } catch {
      // ignore malformed localStorage
    }
  }, []);

  const stats = useMemo(() => {
    const hasStatus = (status: string) => enrolments.filter(e => e.status === status).length;
    const hasStatuses = (...statuses: string[]) => enrolments.filter(e => statuses.includes(e.status)).length;
    const extTotal = externalEnrolments.length;

    const activeEnrolments = enrolments.length + extTotal;
    const pendingQPAlloc = hasStatuses('Allocated to QA', 'Pending QP Allocation');
    const siteVisitPending = hasStatuses('Site Visit Pending', 'Plans Consolidated');
    const siteVisitCompleted = hasStatus('Site Visit Completed');
    const pendingConsolidation = hasStatuses('Pending Plans Consolidation', 'Plans Pending');
    const qaSPValidationPending = hasStatuses('QA SP Pending', 'Pending QA SP Validation');

    return {
      activeEnrolments,
      pendingQPAlloc,
      siteVisitPending,
      siteVisitCompleted,
      pendingConsolidation,
      qaSPValidationPending,
    };
  }, [enrolments, externalEnrolments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QA Dashboard</h2>
          <p className="text-gray-600 mt-1">Overview of Quality Assurance domain activity</p>
        </div>
        <Button onClick={() => setShowReportBuilder(true)} className="bg-red-600 hover:bg-red-700 text-white">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Active Enrolments"
          value={stats.activeEnrolments}
          subtitle="Across all QA streams"
          colorClass="bg-blue-100"
          icon={<Users className="h-5 w-5 text-blue-600" />}
        />
        <SummaryCard
          title="Pending QP Allocations"
          value={stats.pendingQPAlloc}
          subtitle="Awaiting assignment"
          colorClass="bg-yellow-100"
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
        />
        <SummaryCard
          title="Site Visits Pending"
          value={stats.siteVisitPending}
          subtitle="Scheduled or awaiting"
          colorClass="bg-purple-100"
          icon={<Calendar className="h-5 w-5 text-purple-600" />}
        />
        <SummaryCard
          title="Completed Site Visits"
          value={stats.siteVisitCompleted}
          subtitle="Year to date"
          colorClass="bg-green-100"
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        />
        <SummaryCard
          title="Monitoring Reports Pending"
          value={12}
          subtitle="Due within 30 days"
          colorClass="bg-orange-100"
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
        />
        <SummaryCard
          title="Plans Consolidation Pending"
          value={stats.pendingConsolidation}
          subtitle="Awaiting QP review"
          colorClass="bg-indigo-100"
          icon={<ClipboardList className="h-5 w-5 text-indigo-600" />}
        />
        <SummaryCard
          title="QA SP Validation Pending"
          value={stats.qaSPValidationPending}
          subtitle="Skills programme intake"
          colorClass="bg-teal-100"
          icon={<Award className="h-5 w-5 text-teal-600" />}
        />
        <SummaryCard
          title="Training Compliance"
          value="78%"
          subtitle="Monitoring avg this quarter"
          colorClass="bg-emerald-100"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Enrolment Activity (2026)</h3>
          <p className="text-xs text-gray-500 mb-4">Monthly submissions, validations, and allocations</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={enrolmentActivityData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="submitted" name="Submitted" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="validated" name="Validated" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="allocated" name="Allocated" fill="#10B981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Enrolment Status Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">Current pipeline breakdown by status</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {statusDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'Enrolments']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Site Visit Trends (2026)</h3>
          <p className="text-xs text-gray-500 mb-4">Scheduled vs. completed visits per month</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={siteVisitTrendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="scheduled" name="Scheduled" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Plans Consolidation Rate (2026)</h3>
          <p className="text-xs text-gray-500 mb-4">Submitted plans vs. consolidated plans per month</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={plansConsolidationData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="submitted" name="Plans Submitted" fill="#6366F1" radius={[2, 2, 0, 0]} />
              <Bar dataKey="consolidated" name="Consolidated" fill="#06B6D4" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500">Latest events across all QA subdomains</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActivity.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="text-sm text-gray-600 whitespace-nowrap">{item.date}</TableCell>
                <TableCell className="text-sm font-medium text-gray-700 whitespace-nowrap">{item.domain}</TableCell>
                <TableCell className="text-sm text-gray-700">{item.item}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
                <TableCell><PriorityBadge priority={item.priority} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Report Builder */}
      {showReportBuilder && (
        <QADashboardReportBuilder
          enrolments={enrolments}
          externalEnrolments={externalEnrolments}
          currentRole={currentUser?.role ?? ''}
          onClose={() => setShowReportBuilder(false)}
        />
      )}
    </div>
  );
};

export default QADashboard;
