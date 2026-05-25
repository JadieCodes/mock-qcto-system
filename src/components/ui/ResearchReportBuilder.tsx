import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BarChart3,
  FolderOpen,
  Layers,
  FileText,
  Users,
  ClipboardList,
  Flag,
  CheckCircle2,
  Download,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey =
  | 'overviewSection'
  | 'agendaPipelineSection'
  | 'projectStatusSection'
  | 'internalRequestsSection'
  | 'externalApplicationsSection'
  | 'callManagementSection'
  | 'publishingSection';

type SectionSelections = Record<SectionKey, boolean>;
type FieldSelections = Record<string, boolean>;
type FieldMap = Record<SectionKey, FieldSelections>;

interface FieldDef {
  key: string;
  label: string;
}

interface SectionDef {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  fields: FieldDef[];
}

export interface ResearchStats {
  overview: {
    totalAgendas: number;
    approvedAgendas: number;
    totalProjects: number;
    completedProjects: number;
    totalMilestones: number;
    totalTasks: number;
  };
  agendaPipeline: {
    total: number;
    draft: number;
    forumReview: number;
    ceoPending: number;
    approved: number;
    rejected: number;
  };
  projectStatus: {
    total: number;
    notStarted: number;
    inProgress: number;
    awaitingReport: number;
    underReview: number;
    completed: number;
  };
  internalRequests: {
    total: number;
    pendingReview: number;
    underReview: number;
    approved: number;
  };
  externalApplications: {
    total: number;
    submitted: number;
    underReview: number;
    allocated: number;
    approved: number;
  };
  callManagement: {
    totalCalls: number;
    draftCalls: number;
    pendingCalls: number;
    openCalls: number;
    closedCalls: number;
    totalSubmissions: number;
    approvedSubmissions: number;
  };
  publishing: {
    readyForPublishing: number;
    researchPublished: number;
    bulletinReadyForPublishing: number;
  };
}

interface Props {
  stats: ResearchStats;
  currentRole: string;
  onClose: () => void;
}

// ─── Section & field config ───────────────────────────────────────────────────

const SECTIONS: SectionDef[] = [
  {
    key: 'overviewSection',
    label: 'Research Overview',
    icon: BarChart3,
    fields: [
      { key: 'totalAgendas', label: 'Total Agendas' },
      { key: 'approvedAgendas', label: 'Approved Agendas' },
      { key: 'totalProjects', label: 'Total Projects' },
      { key: 'completedProjects', label: 'Completed Projects' },
      { key: 'totalMilestones', label: 'Total Milestones' },
      { key: 'totalTasks', label: 'Total Tasks' },
    ],
  },
  {
    key: 'agendaPipelineSection',
    label: 'Agenda Pipeline',
    icon: FolderOpen,
    fields: [
      { key: 'total', label: 'Total Agendas' },
      { key: 'draft', label: 'Draft' },
      { key: 'forumReview', label: 'Forum Review' },
      { key: 'ceoPending', label: 'CEO Approval Pending' },
      { key: 'approved', label: 'Approved' },
      { key: 'rejected', label: 'Rejected' },
    ],
  },
  {
    key: 'projectStatusSection',
    label: 'Project Status',
    icon: Layers,
    fields: [
      { key: 'total', label: 'Total Projects' },
      { key: 'notStarted', label: 'Not Started' },
      { key: 'inProgress', label: 'In Progress' },
      { key: 'awaitingReport', label: 'Awaiting Report Submission' },
      { key: 'underReview', label: 'Under Review' },
      { key: 'completed', label: 'Completed' },
    ],
  },
  {
    key: 'internalRequestsSection',
    label: 'Internal Research Requests',
    icon: FileText,
    fields: [
      { key: 'total', label: 'Total Requests (In Review)' },
      { key: 'pendingReview', label: 'Pending Review' },
      { key: 'underReview', label: 'Under Review' },
      { key: 'approved', label: 'Approved (Moved to SPA)' },
    ],
  },
  {
    key: 'externalApplicationsSection',
    label: 'External Applications',
    icon: Users,
    fields: [
      { key: 'total', label: 'Total Applications' },
      { key: 'submitted', label: 'Pending Director Review' },
      { key: 'underReview', label: 'Under Review' },
      { key: 'allocated', label: 'Allocated / Link Generated' },
      { key: 'approved', label: 'Approved' },
    ],
  },
  {
    key: 'callManagementSection',
    label: 'Call & Bulletin Management',
    icon: ClipboardList,
    fields: [
      { key: 'totalCalls', label: 'Total Calls' },
      { key: 'draftCalls', label: 'Draft' },
      { key: 'pendingCalls', label: 'Pending' },
      { key: 'openCalls', label: 'Open' },
      { key: 'closedCalls', label: 'Closed' },
      { key: 'totalSubmissions', label: 'Total Submissions' },
      { key: 'approvedSubmissions', label: 'Approved Submissions' },
    ],
  },
  {
    key: 'publishingSection',
    label: 'Publishing',
    icon: Flag,
    fields: [
      { key: 'readyForPublishing', label: 'Research Ready for Publishing' },
      { key: 'researchPublished', label: 'Research Published' },
      { key: 'bulletinReadyForPublishing', label: 'Bulletin Submissions Ready' },
    ],
  },
];

const initSections = (): SectionSelections =>
  Object.fromEntries(SECTIONS.map(s => [s.key, true])) as SectionSelections;

const initFields = (): FieldMap =>
  Object.fromEntries(
    SECTIONS.map(s => [s.key, Object.fromEntries(s.fields.map(f => [f.key, true]))])
  ) as FieldMap;

const STEP_LABELS = ['Select Sections', 'Configure Fields', 'Preview', 'Export'];

// ─── Component ────────────────────────────────────────────────────────────────

export function ResearchReportBuilder({ stats, currentRole, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSections, setSelectedSections] = useState<SectionSelections>(initSections);
  const [selectedFields, setSelectedFields] = useState<FieldMap>(initFields);

  const reportDate = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const activeSections = SECTIONS.filter(s => selectedSections[s.key]);

  // Flat stat value lookup — keyed by section then field, fully typed
  const statValueMap: Record<SectionKey, Record<string, number>> = {
    overviewSection: {
      totalAgendas: stats.overview.totalAgendas,
      approvedAgendas: stats.overview.approvedAgendas,
      totalProjects: stats.overview.totalProjects,
      completedProjects: stats.overview.completedProjects,
      totalMilestones: stats.overview.totalMilestones,
      totalTasks: stats.overview.totalTasks,
    },
    agendaPipelineSection: {
      total: stats.agendaPipeline.total,
      draft: stats.agendaPipeline.draft,
      forumReview: stats.agendaPipeline.forumReview,
      ceoPending: stats.agendaPipeline.ceoPending,
      approved: stats.agendaPipeline.approved,
      rejected: stats.agendaPipeline.rejected,
    },
    projectStatusSection: {
      total: stats.projectStatus.total,
      notStarted: stats.projectStatus.notStarted,
      inProgress: stats.projectStatus.inProgress,
      awaitingReport: stats.projectStatus.awaitingReport,
      underReview: stats.projectStatus.underReview,
      completed: stats.projectStatus.completed,
    },
    internalRequestsSection: {
      total: stats.internalRequests.total,
      pendingReview: stats.internalRequests.pendingReview,
      underReview: stats.internalRequests.underReview,
      approved: stats.internalRequests.approved,
    },
    externalApplicationsSection: {
      total: stats.externalApplications.total,
      submitted: stats.externalApplications.submitted,
      underReview: stats.externalApplications.underReview,
      allocated: stats.externalApplications.allocated,
      approved: stats.externalApplications.approved,
    },
    callManagementSection: {
      totalCalls: stats.callManagement.totalCalls,
      draftCalls: stats.callManagement.draftCalls,
      pendingCalls: stats.callManagement.pendingCalls,
      openCalls: stats.callManagement.openCalls,
      closedCalls: stats.callManagement.closedCalls,
      totalSubmissions: stats.callManagement.totalSubmissions,
      approvedSubmissions: stats.callManagement.approvedSubmissions,
    },
    publishingSection: {
      readyForPublishing: stats.publishing.readyForPublishing,
      researchPublished: stats.publishing.researchPublished,
      bulletinReadyForPublishing: stats.publishing.bulletinReadyForPublishing,
    },
  };

  // ── Section handlers ──────────────────────────────────────────────────────

  const toggleSection = (key: SectionKey) =>
    setSelectedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const selectAllSections = () => setSelectedSections(initSections());

  const clearAllSections = () =>
    setSelectedSections(Object.fromEntries(SECTIONS.map(s => [s.key, false])) as SectionSelections);

  // ── Field handlers ────────────────────────────────────────────────────────

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

  // Helper function to calculate percentage
  const calculatePercentage = (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  // ── PDF generation ────────────────────────────────────────────────────────

  const handleSaveAsPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let body = '';

    for (const section of activeSections) {
      const activeFields = section.fields.filter(f => selectedFields[section.key]?.[f.key]);
      if (activeFields.length === 0) continue;

      const vals = statValueMap[section.key] ?? {};
      body += `<div class="section"><div class="section-title">${section.label}</div>`;

      // Research Overview - keep as cards
      if (section.key === 'overviewSection') {
        body += '<div class="stat-grid">';
        for (const f of activeFields) {
          body += `<div class="stat-item"><div class="stat-label">${f.label}</div><div class="stat-value">${vals[f.key] ?? 0}</div></div>`;
        }
        body += '</div>';
      }
      // Agenda Pipeline - table with percentage
      else if (section.key === 'agendaPipelineSection') {
        const total = vals.total || 0;
        body += `<table class="report-table">
          <thead>
            <tr><th>Status</th><th>Count</th><th>Percentage of Total</th></tr>
          </thead>
          <tbody>`;
        
        const rows = [
          { key: 'draft', label: 'Draft' },
          { key: 'forumReview', label: 'Forum Review' },
          { key: 'ceoPending', label: 'CEO Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' }
        ];
        
        for (const row of rows) {
          if (activeFields.some(f => f.key === row.key)) {
            const count = vals[row.key] || 0;
            body += `<tr><td>${row.label}</td><td>${count}</td><td class="percentage">${calculatePercentage(count, total)}</td></tr>`;
          }
        }
        
        if (activeFields.some(f => f.key === 'total')) {
          body += `<tr class="total-row"><td><strong>Total</strong></td><td><strong>${total}</strong></td><td><strong>100%</strong></td></tr>`;
        }
        
        body += `</tbody></table>`;
      }
      // Project Status - table with percentage
      else if (section.key === 'projectStatusSection') {
        const total = vals.total || 0;
        body += `<table class="report-table">
          <thead>
            <tr><th>Status</th><th>Count</th><th>Percentage of Total</th></tr>
          </thead>
          <tbody>`;
        
        const rows = [
          { key: 'notStarted', label: 'Not Started' },
          { key: 'inProgress', label: 'In Progress' },
          { key: 'awaitingReport', label: 'Awaiting Report' },
          { key: 'underReview', label: 'Under Review' },
          { key: 'completed', label: 'Completed' }
        ];
        
        for (const row of rows) {
          if (activeFields.some(f => f.key === row.key)) {
            const count = vals[row.key] || 0;
            body += `<tr><td>${row.label}</td><td>${count}</td><td class="percentage">${calculatePercentage(count, total)}</td></tr>`;
          }
        }
        
        if (activeFields.some(f => f.key === 'total')) {
          body += `<tr class="total-row"><td><strong>Total</strong></td><td><strong>${total}</strong></td><td><strong>100%</strong></td></tr>`;
        }
        
        body += `</tbody></table>`;
      }
      // Internal Requests - table (no percentage)
      else if (section.key === 'internalRequestsSection') {
        body += `<table class="report-table">
          <thead>
            <tr><th>Status</th><th>Count</th></tr>
          </thead>
          <tbody>`;
        
        const rows = [
          { key: 'total', label: 'Total Requests' },
          { key: 'pendingReview', label: 'Pending Review' },
          { key: 'underReview', label: 'Under Review' },
          { key: 'approved', label: 'Approved' }
        ];
        
        for (const row of rows) {
          if (activeFields.some(f => f.key === row.key)) {
            body += `<tr><td>${row.label}</td><td>${vals[row.key] || 0}</td></tr>`;
          }
        }
        
        body += `</tbody></table>`;
      }
      // External Applications - table with percentage
      else if (section.key === 'externalApplicationsSection') {
        const total = vals.total || 0;
        body += `<table class="report-table">
          <thead>
            <tr><th>Status</th><th>Count</th><th>Percentage of Total</th></tr>
          </thead>
          <tbody>`;
        
        const rows = [
          { key: 'total', label: 'Total Applications' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'underReview', label: 'Under Review' },
          { key: 'allocated', label: 'Allocated' },
          { key: 'approved', label: 'Approved' }
        ];
        
        for (const row of rows) {
          if (activeFields.some(f => f.key === row.key)) {
            const count = vals[row.key] || 0;
            if (row.key === 'total') {
              body += `<tr><td>${row.label}</td><td>${count}</td><td class="percentage">100%</td></tr>`;
            } else {
              body += `<tr><td>${row.label}</td><td>${count}</td><td class="percentage">${calculatePercentage(count, total)}</td></tr>`;
            }
          }
        }
        
        body += `</tbody></table>`;
      }
      // Call Management - two sub-tables
      else if (section.key === 'callManagementSection') {
        const callsActive = ['totalCalls', 'draftCalls', 'pendingCalls', 'openCalls', 'closedCalls'].some(k => activeFields.some(f => f.key === k));
        const submissionsActive = ['totalSubmissions', 'approvedSubmissions'].some(k => activeFields.some(f => f.key === k));
        
        body += '<div class="call-management-container">';
        
        if (callsActive) {
          body += `<div class="call-table-wrapper">
            <h4 class="sub-table-title">Calls</h4>
            <table class="report-table">
              <thead><tr><th>Status</th><th>Count</th></tr></thead>
              <tbody>`;
          
          const callRows = [
            { key: 'totalCalls', label: 'Total Calls' },
            { key: 'draftCalls', label: 'Draft' },
            { key: 'pendingCalls', label: 'Pending' },
            { key: 'openCalls', label: 'Open' },
            { key: 'closedCalls', label: 'Closed' }
          ];
          
          for (const row of callRows) {
            if (activeFields.some(f => f.key === row.key)) {
              body += `<tr><td>${row.label}</td><td>${vals[row.key] || 0}</td></tr>`;
            }
          }
          
          body += `</tbody></table></div>`;
        }
        
        if (submissionsActive) {
          body += `<div class="submissions-table-wrapper">
            <h4 class="sub-table-title">Submissions</h4>
            <table class="report-table">
              <thead><tr><th>Metric</th><th>Count</th></tr></thead>
              <tbody>`;
          
          const submissionRows = [
            { key: 'totalSubmissions', label: 'Total Submissions' },
            { key: 'approvedSubmissions', label: 'Approved Submissions' }
          ];
          
          for (const row of submissionRows) {
            if (activeFields.some(f => f.key === row.key)) {
              body += `<tr><td>${row.label}</td><td>${vals[row.key] || 0}</td></tr>`;
            }
          }
          
          body += `</tbody></table></div>`;
        }
        
        body += '</div>';
      }
      // Publishing - table
      else if (section.key === 'publishingSection') {
        body += `<table class="report-table">
          <thead>
            <tr><th>Item</th><th>Count</th></tr>
          </thead>
          <tbody>`;
        
        const rows = [
          { key: 'readyForPublishing', label: 'Ready for Publishing' },
          { key: 'researchPublished', label: 'Research Published' },
          { key: 'bulletinReadyForPublishing', label: 'Bulletin Ready for Publishing' }
        ];
        
        for (const row of rows) {
          if (activeFields.some(f => f.key === row.key)) {
            body += `<tr><td>${row.label}</td><td>${vals[row.key] || 0}</td></tr>`;
          }
        }
        
        body += `</tbody></table>`;
      }

      body += '</div>';
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Research Report - ${reportDate}</title>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px; }
    h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #666; margin-bottom: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
    .section { margin-bottom: 28px; page-break-inside: avoid; }
    .section-title { font-size: 14px; font-weight: bold; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .stat-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; background: #f9fafb; }
    .stat-label { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
    .stat-value { font-size: 22px; font-weight: bold; color: #111827; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .report-table th { background-color: #f9fafb; padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: 600; color: #374151; }
    .report-table td { padding: 8px 12px; border: 1px solid #e5e7eb; text-align: left; }
    .report-table .percentage { color: #6b7280; }
    .report-table .total-row { background-color: #f3f4f6; font-weight: 600; }
    .call-management-container { display: flex; gap: 20px; flex-wrap: wrap; }
    .call-table-wrapper, .submissions-table-wrapper { flex: 1; min-width: 200px; }
    .sub-table-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #4b5563; }
    @media print {
      body { padding: 16px; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <h1>Research Report</h1>
  <p class="meta">Generated: ${reportDate} &nbsp;&middot;&nbsp; Role: ${currentRole}</p>
  ${body}
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 400);
  };

  // ── Step progress indicator ───────────────────────────────────────────────

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
              <span
                className={`text-xs text-center leading-tight ${
                  isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
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

  // ── Step 1: Section selection ─────────────────────────────────────────────

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
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleSection(section.key)}
              />
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium leading-tight">{section.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  // ── Step 2: Field configuration ───────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Toggle specific fields to include for each selected section.</p>
      {activeSections.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">
          No sections selected. Go back and select at least one section.
        </p>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => selectAllFields(section.key)}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => clearAllFields(section.key)}
                  >
                    Deselect All
                  </Button>
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

  // ── Preview component for rendering tables in UI ─────────────────────────

  const renderOverviewCards = (vals: Record<string, number>, activeFields: FieldDef[]) => (
    <div className="grid grid-cols-3 gap-3">
      {activeFields.map(f => (
        <div key={f.key} className="border rounded-md p-3 bg-muted/20">
          <p className="text-xs text-muted-foreground">{f.label}</p>
          <p className="text-xl font-bold mt-0.5">{vals[f.key] ?? 0}</p>
        </div>
      ))}
    </div>
  );

  const renderTable = (
    vals: Record<string, number>,
    activeFields: FieldDef[],
    rows: { key: string; label: string }[],
    showPercentage: boolean = false,
    showTotal: boolean = false
  ) => {
    const total = showTotal ? (vals.total || 0) : 0;
    
    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Count</th>
            {showPercentage && <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Percentage</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            if (activeFields.some(f => f.key === row.key)) {
              const count = vals[row.key] || 0;
              return (
                <tr key={row.key} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{row.label}</td>
                  <td className="py-2 px-3">{count}</td>
                  {showPercentage && (
                    <td className="py-2 px-3 text-gray-500">
                      {row.key === 'total' ? '100%' : calculatePercentage(count, total)}
                    </td>
                  )}
                </tr>
              );
            }
            return null;
          })}
          {showTotal && activeFields.some(f => f.key === 'total') && (
            <tr className="border-b bg-gray-100 font-medium">
              <td className="py-2 px-3 font-semibold">Total</td>
              <td className="py-2 px-3 font-semibold">{total}</td>
              {showPercentage && <td className="py-2 px-3 font-semibold">100%</td>}
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderSimpleTable = (
    vals: Record<string, number>,
    activeFields: FieldDef[],
    rows: { key: string; label: string }[]
  ) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => {
          if (activeFields.some(f => f.key === row.key)) {
            return (
              <tr key={row.key} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3">{row.label}</td>
                <td className="py-2 px-3">{vals[row.key] || 0}</td>
              </tr>
            );
          }
          return null;
        })}
      </tbody>
    </table>
  );

  const renderCallManagement = (vals: Record<string, number>, activeFields: FieldDef[]) => {
    const callsActive = ['totalCalls', 'draftCalls', 'pendingCalls', 'openCalls', 'closedCalls'].some(k => activeFields.some(f => f.key === k));
    const submissionsActive = ['totalSubmissions', 'approvedSubmissions'].some(k => activeFields.some(f => f.key === k));
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {callsActive && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gray-700">Calls</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Count</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'totalCalls', label: 'Total Calls' },
                  { key: 'draftCalls', label: 'Draft' },
                  { key: 'pendingCalls', label: 'Pending' },
                  { key: 'openCalls', label: 'Open' },
                  { key: 'closedCalls', label: 'Closed' }
                ].map(row => {
                  if (activeFields.some(f => f.key === row.key)) {
                    return (
                      <tr key={row.key} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3">{row.label}</td>
                        <td className="py-2 px-3">{vals[row.key] || 0}</td>
                      </tr>
                    );
                  }
                  return null;
                })}
              </tbody>
            </table>
          </div>
        )}
        {submissionsActive && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-gray-700">Submissions</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Metric</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Count</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'totalSubmissions', label: 'Total Submissions' },
                  { key: 'approvedSubmissions', label: 'Approved Submissions' }
                ].map(row => {
                  if (activeFields.some(f => f.key === row.key)) {
                    return (
                      <tr key={row.key} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3">{row.label}</td>
                        <td className="py-2 px-3">{vals[row.key] || 0}</td>
                      </tr>
                    );
                  }
                  return null;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ── Preview (shared by steps 3 & 4) ──────────────────────────────────────

  const renderPreview = () => {
    const hasContent = activeSections.some(
      s => s.fields.some(f => selectedFields[s.key]?.[f.key])
    );

    return (
      <div className="space-y-4">
        {/* Report header */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <p className="text-base font-bold">Research Report</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generated: {reportDate} · Role: {currentRole}
          </p>
        </div>

        {!hasContent && (
          <p className="text-center text-muted-foreground py-8 text-sm">
            No fields selected. Go back to configure fields.
          </p>
        )}

        {activeSections.map(section => {
          const activeFields = section.fields.filter(f => selectedFields[section.key]?.[f.key]);
          if (activeFields.length === 0) return null;

          const Icon = section.icon;
          const vals = statValueMap[section.key] ?? {};

          return (
            <div key={section.key} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{section.label}</span>
              </div>
              <div className="p-4">
                {/* Research Overview - keep as cards */}
                {section.key === 'overviewSection' && renderOverviewCards(vals, activeFields)}
                
                {/* Agenda Pipeline - table with percentage */}
                {section.key === 'agendaPipelineSection' && renderTable(
                  vals, activeFields,
                  [
                    { key: 'draft', label: 'Draft' },
                    { key: 'forumReview', label: 'Forum Review' },
                    { key: 'ceoPending', label: 'CEO Pending' },
                    { key: 'approved', label: 'Approved' },
                    { key: 'rejected', label: 'Rejected' }
                  ],
                  true,
                  true
                )}
                
                {/* Project Status - table with percentage */}
                {section.key === 'projectStatusSection' && renderTable(
                  vals, activeFields,
                  [
                    { key: 'notStarted', label: 'Not Started' },
                    { key: 'inProgress', label: 'In Progress' },
                    { key: 'awaitingReport', label: 'Awaiting Report' },
                    { key: 'underReview', label: 'Under Review' },
                    { key: 'completed', label: 'Completed' }
                  ],
                  true,
                  true
                )}
                
                {/* Internal Requests - simple table */}
                {section.key === 'internalRequestsSection' && renderSimpleTable(
                  vals, activeFields,
                  [
                    { key: 'total', label: 'Total Requests' },
                    { key: 'pendingReview', label: 'Pending Review' },
                    { key: 'underReview', label: 'Under Review' },
                    { key: 'approved', label: 'Approved' }
                  ]
                )}
                
                {/* External Applications - table with percentage */}
                {section.key === 'externalApplicationsSection' && renderTable(
                  vals, activeFields,
                  [
                    { key: 'total', label: 'Total Applications' },
                    { key: 'submitted', label: 'Submitted' },
                    { key: 'underReview', label: 'Under Review' },
                    { key: 'allocated', label: 'Allocated' },
                    { key: 'approved', label: 'Approved' }
                  ],
                  true,
                  false
                )}
                
                {/* Call Management - two sub-tables */}
                {section.key === 'callManagementSection' && renderCallManagement(vals, activeFields)}
                
                {/* Publishing - simple table */}
                {section.key === 'publishingSection' && renderSimpleTable(
                  vals, activeFields,
                  [
                    { key: 'readyForPublishing', label: 'Ready for Publishing' },
                    { key: 'researchPublished', label: 'Research Published' },
                    { key: 'bulletinReadyForPublishing', label: 'Bulletin Ready for Publishing' }
                  ]
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── Navigation guards ─────────────────────────────────────────────────────

  const canAdvanceStep1 = Object.values(selectedSections).some(Boolean);
  const canAdvanceStep2 = activeSections.some(s =>
    s.fields.some(f => selectedFields[s.key]?.[f.key])
  );

  const goBack = () => {
    if (step === 1) onClose();
    else setStep((step - 1) as 1 | 2 | 3 | 4);
  };

  const goNext = () => setStep((step + 1) as 2 | 3 | 4);

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] h-auto p-0 gap-0">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Research Report
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[calc(90vh-140px)]">
          {renderStepIndicator()}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {(step === 3 || step === 4) && renderPreview()}
        </div>

        <div className="p-6 pt-0 border-t mt-auto">
          <DialogFooter className="flex items-center justify-between pt-4 gap-2">
            <Button variant="outline" onClick={goBack}>
              {step === 1 ? 'Cancel' : '← Back'}
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Step {step} of 4</span>

              {step === 1 && (
                <Button onClick={goNext} disabled={!canAdvanceStep1}>
                  Next →
                </Button>
              )}

              {step === 2 && (
                <Button onClick={goNext} disabled={!canAdvanceStep2}>
                  Preview Report →
                </Button>
              )}

              {step === 3 && (
                <Button onClick={goNext}>
                  <Download className="h-4 w-4 mr-2" />
                  Proceed to Export
                </Button>
              )}

              {step === 4 && (
                <Button onClick={handleSaveAsPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Save as PDF
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}