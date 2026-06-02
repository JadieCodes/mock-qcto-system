import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Layers,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Download,
  MessageSquare,
  TrendingUp,
  ClipboardList,
  Users,
  Award,
  FileSignature,
  Clock,
  Eye,
  ThumbsUp,
  Shield
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getApplications } from '@/lib/applicationStorage';
import type { Application } from '@/types';

// ─── Types based on actual system data ────────────────────────────────────────

type SectionKey =
  | 'submissionOverview'
  | 'phaseProgress'
  | 'publicInputSummary'
  | 'approvalStatus'
  | 'applicationsList'
  | 'evaluationsList'
  | 'resolutionList'
  | 'approvalChain';

type SectionSelections = Record<SectionKey, boolean>;
type FieldSelections = Record<string, boolean>;

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  isTable?: boolean;
  fields: { key: string; label: string }[];
}

// Real data structures from your system
interface ApplicationItem {
  id: string;
  applicantName: string;
  qualification: string;
  qualificationType: string;
  actionType: string;
  status: string;
  submissionDate: string;
  submittedBy?: string;
}

interface EvaluationItem {
  id: string;
  applicantName: string;
  qualification: string;
  status: 'evaluation' | 'evaluation_summary';
  submissionDate: string;
  recommendation?: string;
}

interface ResolutionItem {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
  submitterName: string;
  submissionDate: string;
  status: 'pending_review' | 'in_review' | 'approved' | 'rejected' | 'resolution_created';
  progress: number;
}

interface ApprovalChainItem {
  role: string;
  status: 'pending' | 'completed';
  completedDate?: string;
  completedBy?: string;
}

interface ReportStats {
  totalApplications: number;
  pendingReview: number;
  inEvaluation: number;
  inResolution: number;
  approvedQualifications: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCorrections: number;
  avgApprovalTime: string;
}

interface PhaseProgressItem {
  phase: string;
  count: number;
  status: 'pending' | 'in-progress' | 'completed';
}

interface PublicInputItem {
  qualificationCode: string;
  qualificationTitle: string;
  commentsReceived: number;
  commentsResolved: number;
  status: string;
}

interface ReportData {
  stats: ReportStats;
  phaseProgress: PhaseProgressItem[];
  publicInputItems: PublicInputItem[];
  applicationsList: ApplicationItem[];
  evaluationsList: EvaluationItem[];
  resolutionList: ResolutionItem[];
  approvalChain: ApprovalChainItem[];
}

interface Props {
  onClose: () => void;
  onSave: (report: {
    name: string;
    description: string;
    sections: SectionKey[];
    filters: {
      timeRange: 'today' | 'week' | 'month' | 'all';
      status: string;
    };
    reportData: ReportData;
  }) => void;
}

// ─── Section Configuration ───────────────────────────────────────────────────

const SECTIONS: SectionDef[] = [
  {
    key: 'submissionOverview',
    label: 'Submission Overview',
    icon: FileText,
    fields: [
      { key: 'totalApplications', label: 'Total Applications' },
      { key: 'pendingReview', label: 'Pending Document Review' },
      { key: 'inEvaluation', label: 'In Evaluation' },
      { key: 'inResolution', label: 'In Resolution' },
      { key: 'approvedCount', label: 'Approved' },
      { key: 'rejectedCount', label: 'Rejected' },
    ],
  },
  {
    key: 'phaseProgress',
    label: 'Phase Progress',
    icon: TrendingUp,
    isTable: true,
    fields: [
      { key: 'phase', label: 'Phase' },
      { key: 'count', label: 'Applications' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'publicInputSummary',
    label: 'Public Input Summary',
    icon: MessageSquare,
    isTable: true,
    fields: [
      { key: 'qualificationCode', label: 'Qualification Code' },
      { key: 'qualificationTitle', label: 'Qualification Title' },
      { key: 'commentsReceived', label: 'Comments Received' },
      { key: 'commentsResolved', label: 'Resolved' },
      { key: 'status', label: 'Status' },
    ],
  },
  {
    key: 'applicationsList',
    label: 'Applications',
    icon: ClipboardList,
    isTable: true,
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'applicantName', label: 'Applicant' },
      { key: 'qualification', label: 'Qualification' },
      { key: 'status', label: 'Status' },
      { key: 'submissionDate', label: 'Submission Date' },
    ],
  },
  {
    key: 'evaluationsList',
    label: 'Evaluations',
    icon: Eye,
    isTable: true,
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'applicantName', label: 'Applicant' },
      { key: 'qualification', label: 'Qualification' },
      { key: 'status', label: 'Evaluation Stage' },
      { key: 'recommendation', label: 'Recommendation' },
    ],
  },
  {
    key: 'resolutionList',
    label: 'Resolution Queue',
    icon: FileSignature,
    isTable: true,
    fields: [
      { key: 'qualificationCode', label: 'Code' },
      { key: 'qualificationTitle', label: 'Qualification' },
      { key: 'submitterName', label: 'Submitter' },
      { key: 'status', label: 'Status' },
      { key: 'progress', label: 'Progress' },
    ],
  },
  {
    key: 'approvalChain',
    label: 'Approval Chain Status',
    icon: Shield,
    isTable: true,
    fields: [
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
      { key: 'completedDate', label: 'Completed Date' },
    ],
  },
];

const initSections = (): SectionSelections =>
  Object.fromEntries(SECTIONS.map(s => [s.key, true])) as SectionSelections;

const initFields = (): Record<SectionKey, Record<string, boolean>> =>
  Object.fromEntries(
    SECTIONS.map(s => [s.key, Object.fromEntries(s.fields.map(f => [f.key, true]))])
  ) as Record<SectionKey, Record<string, boolean>>;

const STEP_LABELS = ['Select Sections', 'Configure Fields', 'Report Details', 'Preview'];

// ─── Component ────────────────────────────────────────────────────────────────

export function QualificationReportBuilder({ onClose, onSave }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSections, setSelectedSections] = useState<SectionSelections>(initSections);
  const [selectedFields, setSelectedFields] = useState(initFields);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Real data from localStorage
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [resolutions, setResolutions] = useState<ResolutionItem[]>([]);
  const [publicInputQualifications, setPublicInputQualifications] = useState<any[]>([]);
  const [approvalQualifications, setApprovalQualifications] = useState<any[]>([]);

  const reportDate = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Load real data from localStorage
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      
      // Load applications
      const storedApps = getApplications();
      setApplications(storedApps.map((app: Application) => ({
        id: app.id,
        applicantName: app.applicantName || 'Unknown',
        qualification: app.qualification || 'N/A',
        qualificationType: app.qualificationType || 'N/A',
        actionType: app.actionType || 'N/A',
        status: app.status,
        submissionDate: app.submissionDate,
        submittedBy: app.qualityPartnerName,
      })));
      
      // Load evaluations (applications in evaluation or evaluation_summary)
      const evaluationApps = storedApps.filter((app: Application) => 
        app.status === 'evaluation' || app.status === 'evaluation_summary'
      );
      setEvaluations(evaluationApps.map((app: Application) => ({
        id: app.id,
        applicantName: app.applicantName || 'Unknown',
        qualification: app.qualification || 'N/A',
        status: app.status as 'evaluation' | 'evaluation_summary',
        submissionDate: app.submissionDate,
        recommendation: (app as any).evaluationSummary?.recommendation,
      })));
      
      // Load resolutions
      const storedResolutions = localStorage.getItem('resolutionProjects');
      if (storedResolutions) {
        setResolutions(JSON.parse(storedResolutions));
      }
      
      // Load public input qualifications
      const storedPublic = localStorage.getItem('publicInputQualifications');
      if (storedPublic) {
        setPublicInputQualifications(JSON.parse(storedPublic));
      }
      
      // Load approval qualifications
      const storedApproval = localStorage.getItem('approvalQualifications');
      if (storedApproval) {
        setApprovalQualifications(JSON.parse(storedApproval));
      }
      
      setIsLoading(false);
    };
    
    loadData();
    
    // Listen for storage changes
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filter data based on time range and status
  const filterByTimeRange = (dateStr: string): boolean => {
    if (timeRange === 'all') return true;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (timeRange === 'today') return diffDays === 0;
    if (timeRange === 'week') return diffDays <= 7;
    if (timeRange === 'month') return diffDays <= 30;
    return true;
  };

  const activeSections = SECTIONS.filter(s => selectedSections[s.key]);

  // Calculate stats based on actual data
  const getStats = (): ReportStats => {
    const filteredApps = applications.filter(app => filterByTimeRange(app.submissionDate));
    
    return {
      totalApplications: filteredApps.length,
      pendingReview: filteredApps.filter(app => app.status === 'submitted').length,
      inEvaluation: filteredApps.filter(app => app.status === 'evaluation').length,
      inResolution: resolutions.filter(r => r.status === 'pending_review' || r.status === 'in_review').length,
      approvedQualifications: approvalQualifications.filter(q => q.status === 'approved' || q.status === 'registered').length,
      approvedCount: filteredApps.filter(app => app.status === 'approved').length,
      rejectedCount: filteredApps.filter(app => app.status === 'rejected').length,
      pendingCorrections: filteredApps.filter(app => app.status === 'pending_correction').length,
      avgApprovalTime: '~30 days',
    };
  };

  const stats = getStats();

  // Phase progress based on application statuses
  const getPhaseProgress = (): PhaseProgressItem[] => {
    const phases = [
      { name: 'Application Submitted', statuses: ['submitted'] },
      { name: 'Document Review', statuses: ['document_review'] },
      { name: 'Resolution', statuses: ['resolution'] },
      { name: 'Initial Evaluation', statuses: ['evaluation'] },
      { name: 'Evaluation Summary', statuses: ['evaluation_summary'] },
      { name: 'Approval', statuses: ['approved', 'approved_for_registration', 'registered'] },
    ];
    
    return phases.map(phase => ({
      phase: phase.name,
      count: applications.filter(app => phase.statuses.includes(app.status)).length,
      status: 'in-progress' as const,
    }));
  };

  // Public input items from actual public input qualifications
  const getPublicInputItems = (): PublicInputItem[] => {
    return publicInputQualifications.map(qual => ({
      qualificationCode: qual.qualificationCode,
      qualificationTitle: qual.qualificationTitle,
      commentsReceived: qual.comments?.length || 0,
      commentsResolved: qual.comments?.filter((c: any) => c.status === 'resolved' || c.status === 'forwarded').length || 0,
      status: qual.status,
    }));
  };

  // Approval chain status from actual approval qualifications
  const getApprovalChain = (): ApprovalChainItem[] => {
    const roles = ['Deputy Director', 'Director', 'Chief Director', 'CEO'];
    // Get the highest approval level across all qualifications
    const maxLevel = Math.max(
      ...approvalQualifications.map(q => q.currentApprovalLevel || 0),
      0
    );
    
    return roles.map((role, index) => ({
      role,
      status: index < maxLevel ? 'completed' : 'pending',
      completedDate: index < maxLevel ? new Date().toLocaleDateString() : undefined,
      completedBy: index < maxLevel ? 'System User' : undefined,
    }));
  };

  // ── Section handlers ──────────────────────────────────────────────────────

  const toggleSection = (key: SectionKey) =>
    setSelectedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const selectAllSections = () => setSelectedSections(initSections());
  const clearAllSections = () =>
    setSelectedSections(Object.fromEntries(SECTIONS.map(s => [s.key, false])) as SectionSelections);

  const toggleField = (sectionKey: SectionKey, fieldKey: string) =>
    setSelectedFields(prev => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [fieldKey]: !prev[sectionKey][fieldKey] },
    }));

  const selectAllFields = (sectionKey: SectionKey) => {
    const section = SECTIONS.find(s => s.key === sectionKey);
    if (!section) return;
    setSelectedFields(prev => ({
      ...prev,
      [sectionKey]: Object.fromEntries(section.fields.map(f => [f.key, true])),
    }));
  };

  const clearAllFields = (sectionKey: SectionKey) => {
    const section = SECTIONS.find(s => s.key === sectionKey);
    if (!section) return;
    setSelectedFields(prev => ({
      ...prev,
      [sectionKey]: Object.fromEntries(section.fields.map(f => [f.key, false])),
    }));
  };

  // ── Save handler ────────────────────────────────────────────────────────

  const handleSave = () => {
    const currentStats = getStats();
    const currentPhaseProgress = getPhaseProgress();
    const currentPublicInputItems = getPublicInputItems();
    const currentApprovalChain = getApprovalChain();
    
    // Filter applications by status if needed
    const filteredApps = statusFilter !== 'all' 
      ? applications.filter(app => app.status === statusFilter)
      : applications;
    
    const filteredEvaluations = statusFilter !== 'all'
      ? evaluations.filter(evaluationItem => evaluationItem.status === statusFilter)
      : evaluations;
    
    const filteredResolutions = statusFilter !== 'all'
      ? resolutions.filter(res => res.status === statusFilter)
      : resolutions;

    onSave({
      name: reportName || `Qualification Report ${new Date().toLocaleDateString()}`,
      description: reportDescription,
      sections: activeSections.map(s => s.key),
      filters: { 
        timeRange, 
        status: statusFilter
      },
      reportData: {
        stats: currentStats,
        phaseProgress: currentPhaseProgress,
        publicInputItems: currentPublicInputItems,
        applicationsList: filteredApps,
        evaluationsList: filteredEvaluations,
        resolutionList: filteredResolutions,
        approvalChain: currentApprovalChain,
      },
    });
    onClose();
  };

  const handleSaveAsPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let body = '';
    const currentStats = getStats();
    const currentPhaseProgress = getPhaseProgress();
    const currentPublicInputItems = getPublicInputItems();
    const currentApprovalChain = getApprovalChain();

    for (const section of activeSections) {
      const activeFields = section.fields.filter(f => selectedFields[section.key]?.[f.key]);
      if (activeFields.length === 0) continue;

      body += '<div class="section"><div class="section-title">' + section.label + '</div>';

      if (section.key === 'phaseProgress') {
        body += '<table><thead><tr>';
        for (const f of activeFields) {
          body += '<th>' + f.label + '</th>';
        }
        body += '</tr></thead><tbody>';
        for (const row of currentPhaseProgress) {
          body += '<tr>';
          for (const f of activeFields) {
            let cell = '';
            if (f.key === 'phase') cell = row.phase;
            else if (f.key === 'count') cell = row.count.toString();
            else if (f.key === 'status') cell = row.status;
            body += '<td style="padding:8px;border:1px solid #e5e7eb;">' + cell + '</td>';
          }
          body += '</tr>';
        }
        body += '</tbody></table>';
      } else if (section.key === 'publicInputSummary') {
        body += '<table><thead><tr>';
        for (const f of activeFields) {
          body += '<th>' + f.label + '</th>';
        }
        body += '</tr></thead><tbody>';
        for (const row of currentPublicInputItems) {
          body += '<tr>';
          for (const f of activeFields) {
            let cell = '';
            if (f.key === 'qualificationCode') cell = row.qualificationCode;
            else if (f.key === 'qualificationTitle') cell = row.qualificationTitle;
            else if (f.key === 'commentsReceived') cell = row.commentsReceived.toString();
            else if (f.key === 'commentsResolved') cell = row.commentsResolved.toString();
            else if (f.key === 'status') cell = row.status;
            body += '<td style="padding:8px;border:1px solid #e5e7eb;">' + cell + '</td>';
          }
          body += '</tr>';
        }
        body += '</tbody></table>';
      } else if (section.key === 'applicationsList') {
        const data = statusFilter !== 'all' ? applications.filter(a => a.status === statusFilter) : applications;
        body += '<table><thead><tr>';
        for (const f of activeFields) {
          body += '<th>' + f.label + '</th>';
        }
        body += '</tr></thead><tbody>';
        for (const row of data.slice(0, 20)) {
          body += '<tr>';
          for (const f of activeFields) {
            let cell = '';
            if (f.key === 'id') cell = row.id;
            else if (f.key === 'applicantName') cell = row.applicantName;
            else if (f.key === 'qualification') cell = row.qualification;
            else if (f.key === 'status') cell = row.status;
            else if (f.key === 'submissionDate') cell = row.submissionDate;
            body += '<td style="padding:8px;border:1px solid #e5e7eb;">' + cell + '</td>';
          }
          body += '</tr>';
        }
        body += '</tbody></table>';
      } else if (section.key === 'evaluationsList') {
        body += '<table><thead><tr>';
        for (const f of activeFields) {
          body += '<th>' + f.label + '</th>';
        }
        body += '</tr></thead><tbody>';
        for (const row of evaluations) {
          body += '<tr>';
          for (const f of activeFields) {
            let cell = '';
            if (f.key === 'id') cell = row.id;
            else if (f.key === 'applicantName') cell = row.applicantName;
            else if (f.key === 'qualification') cell = row.qualification;
            else if (f.key === 'status') cell = row.status;
            else if (f.key === 'recommendation') cell = row.recommendation || 'Pending';
            body += '<td style="padding:8px;border:1px solid #e5e7eb;">' + cell + '</td>';
          }
          body += '</tr>';
        }
        body += '</tbody></table>';
      } else if (section.key === 'resolutionList') {
        body += '<table><thead><tr>';
        for (const f of activeFields) {
          body += '<th>' + f.label + '</th>';
        }
        body += '</tr></thead><tbody>';
        for (const row of resolutions) {
          body += '<tr>';
          for (const f of activeFields) {
            let cell = '';
            if (f.key === 'qualificationCode') cell = row.qualificationCode;
            else if (f.key === 'qualificationTitle') cell = row.qualificationTitle;
            else if (f.key === 'submitterName') cell = row.submitterName;
            else if (f.key === 'status') cell = row.status;
            else if (f.key === 'progress') cell = row.progress + '%';
            body += '<td style="padding:8px;border:1px solid #e5e7eb;">' + cell + '</td>';
          }
          body += '</tr>';
        }
        body += '</tbody></table>';
      } else if (section.key === 'approvalChain') {
        body += '<table><thead><tr>';
        for (const f of activeFields) {
          body += '<th>' + f.label + '</th>';
        }
        body += '</tr></thead><tbody>';
        for (const row of currentApprovalChain) {
          body += '<tr>';
          for (const f of activeFields) {
            let cell = '';
            if (f.key === 'role') cell = row.role;
            else if (f.key === 'status') cell = row.status;
            else if (f.key === 'completedDate') cell = row.completedDate || '—';
            body += '<td style="padding:8px;border:1px solid #e5e7eb;">' + cell + '</td>';
          }
          body += '</tr>';
        }
        body += '</tbody></table>';
      } else {
        // Stats cards
        body += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">';
        for (const f of activeFields) {
          let value = '';
          if (f.key === 'totalApplications') value = currentStats.totalApplications.toString();
          else if (f.key === 'pendingReview') value = currentStats.pendingReview.toString();
          else if (f.key === 'inEvaluation') value = currentStats.inEvaluation.toString();
          else if (f.key === 'inResolution') value = currentStats.inResolution.toString();
          else if (f.key === 'approvedCount') value = currentStats.approvedCount.toString();
          else if (f.key === 'rejectedCount') value = currentStats.rejectedCount.toString();
          body += '<div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;">' +
            '<div style="font-size:11px;color:#6b7280;">' + f.label + '</div>' +
            '<div style="font-size:22px;font-weight:bold;">' + value + '</div>' +
            '</div>';
        }
        body += '</div>';
      }

      body += '</div>';
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${reportName || 'Qualification Report'} - ${reportDate}</title>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px; }
    h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #666; margin-bottom: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
    .section { margin-bottom: 28px; page-break-inside: avoid; }
    .section-title { font-size: 14px; font-weight: bold; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; border: 1px solid #e5e7eb; font-weight: 600; }
    td { padding: 7px 10px; border: 1px solid #e5e7eb; }
    @media print {
      body { padding: 16px; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <h1>${reportName || 'Qualifications Development Report'}</h1>
  <p class="meta">Generated: ${reportDate} &nbsp;&middot;&nbsp; Filters: Time: ${timeRange} | Status: ${statusFilter}</p>
  ${body}
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  };

  // ── Step indicator ────────────────────────────────────────────────────────

  const renderStepIndicator = () => (
    <div className="mb-5">
      <div className="flex items-start justify-between mb-3">
        {STEP_LABELS.map((label, idx) => {
          const n = idx + 1;
          const isActive = step === n;
          const isDone = step > n;
          return (
            <div key={n} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isDone
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isActive
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              <span className={`text-xs text-center leading-tight ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  // ── Step 1: Section Selection ─────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Choose which sections to include in the report.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAllSections}>Select All</Button>
          <Button variant="outline" size="sm" onClick={clearAllSections}>Clear All</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          const isChecked = selectedSections[section.key];
          return (
            <label
              key={section.key}
              className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                isChecked ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <Checkbox checked={isChecked} onCheckedChange={() => toggleSection(section.key)} />
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium leading-tight">{section.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  // ── Step 2: Field Configuration ───────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Toggle specific fields to include for each selected section.</p>
      {activeSections.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No sections selected. Go back and select at least one section.</p>
      ) : (
        activeSections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.key} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{section.label}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => selectAllFields(section.key)}>Select All</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => clearAllFields(section.key)}>Deselect All</Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4">
                {section.fields.map(field => (
                  <label key={field.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedFields[section.key]?.[field.key] ?? false}
                      onCheckedChange={() => toggleField(section.key, field.key)}
                    />
                    <span className="text-sm">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ── Step 3: Report Details ────────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reportName">Report Name *</Label>
        <Input
          id="reportName"
          placeholder="e.g., Q1 2025 Qualifications Status Report"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reportDescription">Description (Optional)</Label>
        <Textarea
          id="reportDescription"
          placeholder="Brief description of what this report covers..."
          value={reportDescription}
          onChange={(e) => setReportDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Time Range</Label>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status Filter</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="document_review">Document Review</SelectItem>
              <SelectItem value="evaluation">Evaluation</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // ── Step 4: Preview ───────────────────────────────────────────────────────

  const renderPreview = () => {
    const hasContent = activeSections.some(s => s.fields.some(f => selectedFields[s.key]?.[f.key]));
    const currentStats = getStats();
    const currentPhaseProgress = getPhaseProgress();
    const currentPublicInputItems = getPublicInputItems();
    const currentApprovalChain = getApprovalChain();
    const filteredApps = statusFilter !== 'all' 
      ? applications.filter(app => app.status === statusFilter)
      : applications;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p>Loading system data...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-muted/30">
          <p className="text-base font-bold">{reportName || 'Untitled Report'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Generated: {reportDate} · Time Range: {timeRange} · Status: {statusFilter}</p>
          {reportDescription && <p className="text-sm mt-2">{reportDescription}</p>}
        </div>

        {!hasContent && <p className="text-center text-muted-foreground py-8 text-sm">No fields selected. Go back to configure fields.</p>}

        {activeSections.map(section => {
          const activeFields = section.fields.filter(f => selectedFields[section.key]?.[f.key]);
          if (activeFields.length === 0) return null;

          const Icon = section.icon;

          return (
            <div key={section.key} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{section.label}</span>
                {section.key === 'applicationsList' && (
                  <Badge variant="outline" className="ml-2 text-xs">{filteredApps.length} records</Badge>
                )}
                {section.key === 'evaluationsList' && (
                  <Badge variant="outline" className="ml-2 text-xs">{evaluations.length} records</Badge>
                )}
                {section.key === 'resolutionList' && (
                  <Badge variant="outline" className="ml-2 text-xs">{resolutions.length} records</Badge>
                )}
              </div>
              <div className="p-4">
                {section.key === 'phaseProgress' ? (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b">{activeFields.map(f => <th key={f.key} className="text-left pb-2 pr-4 font-medium">{f.label}</th>)}</tr></thead>
                    <tbody>
                      {currentPhaseProgress.map(row => (
                        <tr key={row.phase} className="border-b last:border-0">
                          {activeFields.map(f => {
                            let cell = '';
                            if (f.key === 'phase') cell = row.phase;
                            else if (f.key === 'count') cell = row.count.toString();
                            else if (f.key === 'status') cell = row.status;
                            return <td key={f.key} className="py-1.5 pr-4">{cell}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : section.key === 'publicInputSummary' ? (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b">{activeFields.map(f => <th key={f.key} className="text-left pb-2 pr-4 font-medium">{f.label}</th>)}</tr></thead>
                    <tbody>
                      {currentPublicInputItems.map(row => (
                        <tr key={row.qualificationCode} className="border-b last:border-0">
                          {activeFields.map(f => {
                            let cell = '';
                            if (f.key === 'qualificationCode') cell = row.qualificationCode;
                            else if (f.key === 'qualificationTitle') cell = row.qualificationTitle;
                            else if (f.key === 'commentsReceived') cell = row.commentsReceived.toString();
                            else if (f.key === 'commentsResolved') cell = row.commentsResolved.toString();
                            else if (f.key === 'status') cell = row.status;
                            return <td key={f.key} className="py-1.5 pr-4">{cell}</td>;
                          })}
                        </tr>
                      ))}
                      {currentPublicInputItems.length === 0 && (
                        <tr><td colSpan={activeFields.length} className="py-4 text-center text-muted-foreground">No public input data</td></tr>
                      )}
                    </tbody>
                  </table>
                ) : section.key === 'applicationsList' ? (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b">{activeFields.map(f => <th key={f.key} className="text-left pb-2 pr-4 font-medium">{f.label}</th>)}</tr></thead>
                    <tbody>
                      {filteredApps.slice(0, 15).map(row => (
                        <tr key={row.id} className="border-b last:border-0">
                          {activeFields.map(f => {
                            let cell = '';
                            if (f.key === 'id') cell = row.id;
                            else if (f.key === 'applicantName') cell = row.applicantName;
                            else if (f.key === 'qualification') cell = row.qualification.length > 40 ? row.qualification.slice(0, 40) + '…' : row.qualification;
                            else if (f.key === 'status') cell = row.status;
                            else if (f.key === 'submissionDate') cell = row.submissionDate;
                            return <td key={f.key} className="py-1.5 pr-4">{cell}</td>;
                          })}
                        </tr>
                      ))}
                      {filteredApps.length === 0 && (
                        <tr><td colSpan={activeFields.length} className="py-4 text-center text-muted-foreground">No applications found</td></tr>
                      )}
                      {filteredApps.length > 15 && (
                        <tr><td colSpan={activeFields.length} className="py-2 text-center text-muted-foreground text-xs">+ {filteredApps.length - 15} more records</td></tr>
                      )}
                    </tbody>
                  </table>
                ) : section.key === 'evaluationsList' ? (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b">{activeFields.map(f => <th key={f.key} className="text-left pb-2 pr-4 font-medium">{f.label}</th>)}</tr></thead>
                    <tbody>
                      {evaluations.map(row => (
                        <tr key={row.id} className="border-b last:border-0">
                          {activeFields.map(f => {
                            let cell = '';
                            if (f.key === 'id') cell = row.id;
                            else if (f.key === 'applicantName') cell = row.applicantName;
                            else if (f.key === 'qualification') cell = row.qualification.length > 40 ? row.qualification.slice(0, 40) + '…' : row.qualification;
                            else if (f.key === 'status') cell = row.status === 'evaluation' ? 'Initial Evaluation' : 'Evaluation Summary';
                            else if (f.key === 'recommendation') cell = row.recommendation || 'Pending';
                            return <td key={f.key} className="py-1.5 pr-4">{cell}</td>;
                          })}
                        </tr>
                      ))}
                      {evaluations.length === 0 && (
                        <tr><td colSpan={activeFields.length} className="py-4 text-center text-muted-foreground">No evaluations in progress</td></tr>
                      )}
                    </tbody>
                  </table>
                ) : section.key === 'resolutionList' ? (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b">{activeFields.map(f => <th key={f.key} className="text-left pb-2 pr-4 font-medium">{f.label}</th>)}</tr></thead>
                    <tbody>
                      {resolutions.map(row => (
                        <tr key={row.id} className="border-b last:border-0">
                          {activeFields.map(f => {
                            let cell = '';
                            if (f.key === 'qualificationCode') cell = row.qualificationCode;
                            else if (f.key === 'qualificationTitle') cell = row.qualificationTitle.length > 40 ? row.qualificationTitle.slice(0, 40) + '…' : row.qualificationTitle;
                            else if (f.key === 'submitterName') cell = row.submitterName;
                            else if (f.key === 'status') cell = row.status.replace('_', ' ');
                            else if (f.key === 'progress') cell = row.progress + '%';
                            return <td key={f.key} className="py-1.5 pr-4">{cell}</td>;
                          })}
                        </tr>
                      ))}
                      {resolutions.length === 0 && (
                        <tr><td colSpan={activeFields.length} className="py-4 text-center text-muted-foreground">No resolutions pending</td></tr>
                      )}
                    </tbody>
                  </table>
                ) : section.key === 'approvalChain' ? (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b">{activeFields.map(f => <th key={f.key} className="text-left pb-2 pr-4 font-medium">{f.label}</th>)}</tr></thead>
                    <tbody>
                      {currentApprovalChain.map(row => (
                        <tr key={row.role} className="border-b last:border-0">
                          {activeFields.map(f => {
                            let cell = '';
                            if (f.key === 'role') cell = row.role;
                            else if (f.key === 'status') cell = row.status === 'completed' ? '✓ Completed' : '○ Pending';
                            else if (f.key === 'completedDate') cell = row.completedDate || '—';
                            return <td key={f.key} className="py-1.5 pr-4">{cell}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {activeFields.map(f => {
                      let value = '';
                      if (f.key === 'totalApplications') value = currentStats.totalApplications.toString();
                      else if (f.key === 'pendingReview') value = currentStats.pendingReview.toString();
                      else if (f.key === 'inEvaluation') value = currentStats.inEvaluation.toString();
                      else if (f.key === 'inResolution') value = currentStats.inResolution.toString();
                      else if (f.key === 'approvedCount') value = currentStats.approvedCount.toString();
                      else if (f.key === 'rejectedCount') value = currentStats.rejectedCount.toString();
                      else if (f.key === 'approvedQualifications') value = currentStats.approvedQualifications.toString();
                      else if (f.key === 'pendingCorrections') value = currentStats.pendingCorrections.toString();
                      else if (f.key === 'avgApprovalTime') value = currentStats.avgApprovalTime;
                      return (
                        <div key={f.key} className="border rounded-md p-3 bg-muted/20">
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                          <p className="text-xl font-bold mt-0.5">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  const canAdvanceStep1 = Object.values(selectedSections).some(Boolean);
  const canAdvanceStep2 = activeSections.some(s => s.fields.some(f => selectedFields[s.key]?.[f.key]));

  const goBack = () => {
    if (step === 1) onClose();
    else setStep((step - 1) as 1 | 2 | 3 | 4);
  };

  const goNext = () => setStep((step + 1) as 2 | 3 | 4);

  // ── Main Render ───────────────────────────────────────────────────────────

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] h-auto p-0 gap-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Qualification Report
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Generate reports based on actual system data from Applications, Evaluations, Public Input, and Approval workflows
            </p>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[calc(90vh-140px)]">
          {renderStepIndicator()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {(step === 4) && renderPreview()}
        </div>

        <div className="p-6 pt-0 border-t mt-auto">
          <DialogFooter className="flex items-center justify-between pt-4 gap-2">
            <Button variant="outline" onClick={goBack}>{step === 1 ? 'Cancel' : '← Back'}</Button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Step {step} of 4</span>
              {step < 3 && <Button onClick={goNext} disabled={step === 1 ? !canAdvanceStep1 : !canAdvanceStep2}>Next →</Button>}
              {step === 3 && <Button onClick={goNext} disabled={!reportName}>Preview Report →</Button>}
              {step === 4 && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveAsPdf}><Download className="h-4 w-4 mr-2" />Export PDF</Button>
                  <Button onClick={handleSave}>Save Report</Button>
                </div>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}