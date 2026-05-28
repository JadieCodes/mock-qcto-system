import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  FileText,
  Calendar,
  Award,
  History,
  ClipboardList,
  CheckCircle2,
  Download,
  UserCheck,
  AlertCircle,
  BarChart3,
  Printer,
  Eye,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LearnerEnrolment } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey =
  | 'learnerEnrolmentStats'
  | 'qpAllocationStats'
  | 'plansReportsStats'
  | 'siteVisitStats'
  | 'skillsProgrammeStats'
  | 'historicalStats'
  | 'enrolmentTableSection'
  | 'siteVisitTableSection';

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
  description?: string;
  isTable?: boolean;
  fields: FieldDef[];
}

export interface QAExternalEnrolment {
  id: string;
  enrolmentId: string;
  status: string;
  learnerDetails?: { firstName?: string; lastName?: string; };
  qualification?: { name?: string; };
  consolidatedPlans?: { sharedAt?: string; };
  qpAllocation?: { allocatedToRole?: string; quarterlyPeriod?: string; allocatedTo?: string; };
  sdpCode?: string;
}

interface Props {
  enrolments: LearnerEnrolment[];
  externalEnrolments: QAExternalEnrolment[];
  currentRole: string;
  onClose: () => void;
}

// ─── Section & field config ───────────────────────────────────────────────────

const SECTIONS: SectionDef[] = [
  {
    key: 'learnerEnrolmentStats',
    label: 'Learner Enrolment',
    icon: Users,
    description: 'Track learner enrolment status and gate evaluation progress',
    fields: [
      { key: 'total', label: 'Total Enrolments' },
      { key: 'submitted', label: 'Submitted' },
      { key: 'gateEvalPending', label: 'Gate Eval Pending / In Progress' },
      { key: 'gateEvalCompleted', label: 'Gate Eval Completed' },
      { key: 'icPending', label: 'Pending IC Review' },
      { key: 'allocatedToQA', label: 'Allocated to QA' },
    ],
  },
  {
    key: 'qpAllocationStats',
    label: 'QP Allocation Management',
    icon: UserCheck,
    description: 'Monitor QP allocation status and plans submission',
    fields: [
      { key: 'totalAllocatedQP', label: 'Total Allocated to QP' },
      { key: 'pendingQPAlloc', label: 'Pending QP Allocation' },
      { key: 'plansReportsPending', label: 'Plans & Reports Pending' },
      { key: 'plansReportsSubmitted', label: 'Plans & Reports Submitted' },
    ],
  },
  {
    key: 'plansReportsStats',
    label: 'Plans & Reports',
    icon: FileText,
    description: 'Track consolidation and sharing of plans',
    fields: [
      { key: 'plansConsolidated', label: 'Plans Consolidated' },
      { key: 'pendingConsolidation', label: 'Pending Consolidation' },
      { key: 'sharedWithQP', label: 'Shared with Quality Partner' },
    ],
  },
  {
    key: 'siteVisitStats',
    label: 'Site Visit Management',
    icon: Calendar,
    description: 'Monitor site visit scheduling and completion',
    fields: [
      { key: 'total', label: 'Total Site Visits' },
      { key: 'pending', label: 'Pending / Scheduled' },
      { key: 'completed', label: 'Completed' },
    ],
  },
  {
    key: 'skillsProgrammeStats',
    label: 'Skills Programme Management',
    icon: Award,
    description: 'Track skills programme validation and monitoring',
    fields: [
      { key: 'sdpGateCheckPending', label: 'SDP Gate Check Pending' },
      { key: 'sdpGateCheckCompleted', label: 'SDP Gate Check Completed' },
      { key: 'qaSPPending', label: 'Pending QA SP Validation' },
      { key: 'qaSPValidated', label: 'QA SP Validated' },
      { key: 'underMonitoring', label: 'Under Monitoring' },
      { key: 'monitoringCompleted', label: 'Monitoring Completed' },
    ],
  },
  {
    key: 'historicalStats',
    label: 'Historical & Completion',
    icon: History,
    description: 'Track historical qualifications and completion status',
    fields: [
      { key: 'verified', label: 'Verified' },
      { key: 'monthlyUpdatesSubmitted', label: 'Monthly Updates Submitted' },
      { key: 'completed', label: 'Completed' },
    ],
  },
  {
    key: 'enrolmentTableSection',
    label: 'Enrolment Records',
    icon: ClipboardList,
    description: 'Detailed list of all enrolment records',
    isTable: true,
    fields: [
      { key: 'enrolmentId', label: 'Enrolment ID' },
      { key: 'learnerName', label: 'Learner Name' },
      { key: 'qualification', label: 'Qualification' },
      { key: 'status', label: 'Status' },
      { key: 'submittedAt', label: 'Submitted Date' },
    ],
  },
  {
    key: 'siteVisitTableSection',
    label: 'Site Visit Records',
    icon: AlertCircle,
    description: 'Detailed list of site visit records',
    isTable: true,
    fields: [
      { key: 'enrolmentId', label: 'Enrolment ID' },
      { key: 'learnerName', label: 'Learner Name' },
      { key: 'qualification', label: 'Qualification' },
      { key: 'allocatedTo', label: 'QP Allocated To' },
      { key: 'siteVisitStatus', label: 'Site Visit Status' },
      { key: 'scheduledDate', label: 'Scheduled Date' },
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

export function QADashboardReportBuilder({
  enrolments,
  externalEnrolments,
  currentRole,
  onClose,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSections, setSelectedSections] = useState<SectionSelections>(initSections);
  const [selectedFields, setSelectedFields] = useState<FieldMap>(initFields);

  const reportDate = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const activeSections = SECTIONS.filter(s => selectedSections[s.key]);

  // ── Computed stats from real data ─────────────────────────────────────────

  const statValueMap: Record<string, Record<string, number>> = useMemo(() => {
    const hasStatus = (status: string) => enrolments.filter(e => e.status === status).length;
    const hasStatuses = (...statuses: string[]) => enrolments.filter(e => statuses.includes(e.status)).length;
    const extHasStatus = (status: string) => externalEnrolments.filter(e => e.status === status).length;

    return {
      learnerEnrolmentStats: {
        total: enrolments.length + externalEnrolments.length,
        submitted: hasStatus('Submitted') + extHasStatus('Submitted'),
        gateEvalPending: hasStatuses('Gate Evaluation Pending', 'Gate Evaluation In Progress'),
        gateEvalCompleted: hasStatus('Gate Evaluation Completed'),
        icPending: hasStatuses('Pending Indicator Champion Review', 'Under Indicator Champion Review'),
        allocatedToQA: hasStatus('Allocated to QA'),
      },
      qpAllocationStats: {
        totalAllocatedQP: hasStatuses(
          'Allocated to QP', 'Plans & Reports Pending', 'Plans & Reports Submitted',
          'Plans Consolidated', 'Site Visit Pending', 'Site Visit Scheduled', 'Site Visit Completed'
        ),
        pendingQPAlloc: hasStatus('Pending QP Allocation'),
        plansReportsPending: hasStatus('Plans & Reports Pending'),
        plansReportsSubmitted: hasStatus('Plans & Reports Submitted'),
      },
      plansReportsStats: {
        plansConsolidated: hasStatus('Plans Consolidated'),
        pendingConsolidation: hasStatus('Plans & Reports Submitted'),
        sharedWithQP: enrolments.filter(e => e.consolidatedPlans?.sharedAt).length +
          externalEnrolments.filter(e => e.consolidatedPlans?.sharedAt).length,
      },
      siteVisitStats: {
        total: hasStatuses('Site Visit Pending', 'Site Visit Scheduled', 'Site Visit Completed') +
          externalEnrolments.filter(e => e.status === 'Site Visit Pending' || e.consolidatedPlans?.sharedAt).length,
        pending: hasStatuses('Site Visit Pending', 'Site Visit Scheduled') +
          externalEnrolments.filter(e => e.status === 'Site Visit Pending').length,
        completed: hasStatus('Site Visit Completed'),
      },
      skillsProgrammeStats: {
        sdpGateCheckPending: hasStatus('SDP Gate Check Pending'),
        sdpGateCheckCompleted: hasStatus('SDP Gate Check Completed'),
        qaSPPending: hasStatuses('Pending QA SP Validation', 'Under QA SP Validation'),
        qaSPValidated: hasStatus('QA SP Validated'),
        underMonitoring: hasStatuses(
          'Allocated for Monitoring', 'Monitoring Plan Pending', 'Monitoring Plan Submitted',
          'SDP Evidence Pending', 'SDP Evidence Submitted', 'Monitoring Report Pending'
        ),
        monitoringCompleted: hasStatus('Monitoring Report Completed'),
      },
      historicalStats: {
        verified: hasStatus('Verified'),
        monthlyUpdatesSubmitted: hasStatus('Monthly Update Submitted'),
        completed: hasStatus('Completed'),
      },
    };
  }, [enrolments, externalEnrolments]);

  // Site visit enrolments for the table section
  const siteVisitEnrolments = useMemo(() =>
    enrolments.filter(e =>
      ['Plans Consolidated', 'Site Visit Pending', 'Site Visit Scheduled', 'Site Visit Completed'].includes(e.status)
    ),
    [enrolments]
  );

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

  // ── Cell renderers ────────────────────────────────────────────────────────

  const renderEnrolmentCell = (enrolment: LearnerEnrolment, fieldKey: string) => {
    switch (fieldKey) {
      case 'enrolmentId': return enrolment.enrolmentId;
      case 'learnerName':
        return `${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`;
      case 'qualification': return enrolment.qualification.name;
      case 'status':
        return <Badge variant="secondary" className="text-xs">{enrolment.status}</Badge>;
      case 'submittedAt':
        return new Date(enrolment.submittedAt).toLocaleDateString();
      default: return null;
    }
  };

  const renderSiteVisitCell = (enrolment: LearnerEnrolment, fieldKey: string) => {
    switch (fieldKey) {
      case 'enrolmentId': return enrolment.enrolmentId;
      case 'learnerName':
        return `${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`;
      case 'qualification': return enrolment.qualification.name;
      case 'allocatedTo': return enrolment.qpAllocation?.allocatedTo ?? '—';
      case 'siteVisitStatus': return enrolment.siteVisit?.status ?? '—';
      case 'scheduledDate':
        return enrolment.siteVisit?.scheduledDate
          ? new Date(enrolment.siteVisit.scheduledDate).toLocaleDateString()
          : '—';
      default: return null;
    }
  };

  // ── PDF generation ────────────────────────────────────────────────────────

  const handleSaveAsPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let body = '';

    for (const section of activeSections) {
      const activeFields = section.fields.filter(f => selectedFields[section.key]?.[f.key]);
      if (activeFields.length === 0) continue;

      body += `<div class="section"><div class="section-title">${section.label}</div>`;

      if (section.key === 'enrolmentTableSection') {
        body += `<table><thead><tr>${activeFields.map(f => `<th>${f.label}</th>`).join('')}</tr></thead><tbody>`;
        if (enrolments.length === 0) {
          body += `<tr><td colspan="${activeFields.length}" style="text-align:center;color:#888">No enrolment records</td></tr>`;
        } else {
          for (const e of enrolments.slice(0, 10)) {
            body += '<tr>';
            for (const f of activeFields) {
              let cell = '';
              if (f.key === 'enrolmentId') cell = e.enrolmentId;
              else if (f.key === 'learnerName') cell = `${e.learnerDetails.firstName} ${e.learnerDetails.lastName}`;
              else if (f.key === 'qualification') cell = e.qualification.name;
              else if (f.key === 'status') cell = e.status;
              else if (f.key === 'submittedAt') cell = new Date(e.submittedAt).toLocaleDateString();
              body += `<td>${cell}</td>`;
            }
            body += '</tr>';
          }
        }
        body += '</tbody>}</tr>';

      } else if (section.key === 'siteVisitTableSection') {
        body += `<table><thead><tr>${activeFields.map(f => `<th>${f.label}</th>`).join('')}</tr></thead><tbody>`;
        if (siteVisitEnrolments.length === 0) {
          body += `<tr><td colspan="${activeFields.length}" style="text-align:center;color:#888">No site visit records</td></tr>`;
        } else {
          for (const e of siteVisitEnrolments.slice(0, 10)) {
            body += '<tr>';
            for (const f of activeFields) {
              let cell = '';
              if (f.key === 'enrolmentId') cell = e.enrolmentId;
              else if (f.key === 'learnerName') cell = `${e.learnerDetails.firstName} ${e.learnerDetails.lastName}`;
              else if (f.key === 'qualification') cell = e.qualification.name;
              else if (f.key === 'allocatedTo') cell = e.qpAllocation?.allocatedTo ?? '—';
              else if (f.key === 'siteVisitStatus') cell = e.siteVisit?.status ?? '—';
              else if (f.key === 'scheduledDate') cell = e.siteVisit?.scheduledDate
                ? new Date(e.siteVisit.scheduledDate).toLocaleDateString() : '—';
              body += `<td>${cell}</td>`;
            }
            body += '</tr>';
          }
        }
        body += '</tbody>}</table>';

      } else {
        const vals = statValueMap[section.key] ?? {};
        body += '<div class="stat-grid">';
        for (const f of activeFields) {
          body += `<div class="stat-item"><div class="stat-label">${f.label}</div><div class="stat-value">${vals[f.key] ?? 0}</div></div>`;
        }
        body += '</div>';
      }

      body += '</div>';
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>QA Dashboard Report - ${reportDate}</title>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px; }
    h1 { font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #1e293b; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
    .section { margin-bottom: 32px; page-break-inside: avoid; }
    .section-title { font-size: 16px; font-weight: 600; color: #1e293b; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 16px; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
    .stat-item { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; background: #f8fafc; transition: all 0.2s; }
    .stat-label { font-size: 11px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500; }
    .stat-value { font-size: 28px; font-weight: bold; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; border: 1px solid #e2e8f0; font-weight: 600; color: #334155; }
    td { padding: 8px 12px; border: 1px solid #e2e8f0; vertical-align: middle; }
    tr:nth-child(even) td { background: #f8fafc; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1.5cm; size: A4; }
      .stat-item { break-inside: avoid; }
      .section { break-inside: avoid-page; }
    }
  </style>
</head>
<body>
  <h1>📊 QA Dashboard Report</h1>
  <p class="meta">Generated: ${reportDate} &nbsp;&middot;&nbsp; Role: ${currentRole} &nbsp;&middot;&nbsp; Total Enrolments: ${enrolments.length + externalEnrolments.length}</p>
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
    <div className="mb-6">
      <div className="flex items-start justify-between mb-4">
        {STEP_LABELS.map((label, idx) => {
          const n = idx + 1;
          const isActive = step === n;
          const isDone = step > n;
          return (
            <div key={n} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  isDone
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                    : 'bg-gray-50 border-gray-300 text-gray-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              <span
                className={`text-xs text-center font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  // ── Step 1: Section selection ─────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Choose which sections to include in the report.</p>
          <p className="text-xs text-gray-400 mt-0.5">Selected sections will appear in the final report.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAllSections} className="text-xs">
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAllSections} className="text-xs">
            Clear All
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          const isChecked = selectedSections[section.key];
          return (
            <label
              key={section.key}
              className={`flex items-start gap-3 border rounded-lg p-4 cursor-pointer transition-all ${
                isChecked 
                  ? 'border-blue-300 bg-blue-50/50 shadow-sm' 
                  : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleSection(section.key)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isChecked ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${isChecked ? 'text-blue-700' : 'text-gray-800'}`}>
                    {section.label}
                  </span>
                  {section.isTable && (
                    <Badge variant="secondary" className="text-xs bg-gray-100">Table</Badge>
                  )}
                </div>
                {section.description && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">{section.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );

  // ── Step 2: Field configuration ───────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-500">Toggle specific fields to include for each selected section.</p>
        <p className="text-xs text-gray-400 mt-0.5">Only selected fields will appear in the report preview.</p>
      </div>
      {activeSections.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <Settings className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No sections selected.</p>
          <p className="text-xs text-gray-400 mt-1">Go back and select at least one section.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeSections.map(section => {
            const Icon = section.icon;
            const selectedCount = Object.values(selectedFields[section.key] || {}).filter(Boolean).length;
            const totalCount = section.fields.length;
            return (
              <div key={section.key} className="border rounded-lg overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800">{section.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {selectedCount}/{totalCount} fields
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-gray-600 hover:text-blue-600"
                      onClick={() => selectAllFields(section.key)}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-gray-600 hover:text-red-600"
                      onClick={() => clearAllFields(section.key)}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-x-6 gap-y-3 p-4 bg-white">
                  {section.fields.map(field => (
                    <label key={field.key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 -m-1 p-1 rounded transition-colors">
                      <Checkbox
                        checked={selectedFields[section.key]?.[field.key] ?? false}
                        onCheckedChange={() => toggleField(section.key, field.key)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Preview (shared by steps 3 & 4) ──────────────────────────────────────

  const renderPreview = () => {
    const hasContent = activeSections.some(
      s => s.fields.some(f => selectedFields[s.key]?.[f.key])
    );

    return (
      <div className="space-y-5">
        {/* Report header */}
        <div className="border rounded-lg p-5 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                QA Dashboard Report
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Generated: {reportDate} · Role: {currentRole}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="bg-white">
                {activeSections.filter(s => s.fields.some(f => selectedFields[s.key]?.[f.key])).length} sections
              </Badge>
            </div>
          </div>
        </div>

        {!hasContent && (
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <Eye className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No fields selected for preview.</p>
            <p className="text-xs text-gray-400 mt-1">Go back to configure fields for your selected sections.</p>
          </div>
        )}

        {activeSections.map(section => {
          const activeFields = section.fields.filter(f => selectedFields[section.key]?.[f.key]);
          if (activeFields.length === 0) return null;

          const Icon = section.icon;
          const vals = statValueMap[section.key] ?? {};

          return (
            <div key={section.key} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-2.5 border-b flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-800">{section.label}</span>
                <Badge variant="secondary" className="text-xs bg-gray-200">
                  {activeFields.length} field{activeFields.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="p-4 bg-white">
                {section.isTable ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          {activeFields.map(f => (
                            <th key={f.key} className="text-left py-2 px-3 text-gray-600 font-medium">
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.key === 'enrolmentTableSection' && (
                          enrolments.length === 0 ? (
                            <tr><td colSpan={activeFields.length} className="py-6 text-center text-gray-400">No enrolment records</td></tr>
                          ) : (
                            enrolments.slice(0, 5).map(e => (
                              <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                {activeFields.map(f => (
                                  <td key={f.key} className="py-2 px-3">
                                    {renderEnrolmentCell(e, f.key)}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )
                        )}
                        {section.key === 'siteVisitTableSection' && (
                          siteVisitEnrolments.length === 0 ? (
                            <tr><td colSpan={activeFields.length} className="py-6 text-center text-gray-400">No site visit records</td></tr>
                          ) : (
                            siteVisitEnrolments.slice(0, 5).map(e => (
                              <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                {activeFields.map(f => (
                                  <td key={f.key} className="py-2 px-3">
                                    {renderSiteVisitCell(e, f.key)}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                    {((section.key === 'enrolmentTableSection' && enrolments.length > 5) ||
                      (section.key === 'siteVisitTableSection' && siteVisitEnrolments.length > 5)) && (
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        Showing 5 of {section.key === 'enrolmentTableSection' ? enrolments.length : siteVisitEnrolments.length} records
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {activeFields.map(f => (
                      <div key={f.key} className="border rounded-md p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <p className="text-xs text-gray-500 truncate">{f.label}</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                          {vals[f.key] ?? 0}
                        </p>
                      </div>
                    ))}
                  </div>
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
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[90vh] h-auto p-0 gap-0 rounded-xl">
        <div className="p-6 pb-0 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-blue-600" />
              Create QA Dashboard Report
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Build custom reports with selected sections and fields. Export as PDF for sharing.
            </p>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 max-h-[calc(90vh-180px)]">
          {renderStepIndicator()}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {(step === 3 || step === 4) && renderPreview()}
        </div>

        <div className="p-6 pt-0 border-t bg-gray-50 rounded-b-xl">
          <DialogFooter className="flex items-center justify-between gap-2">
            <Button variant="outline" onClick={goBack} className="hover:bg-gray-100">
              {step === 1 ? (
                <>
                  <span>Cancel</span>
                </>
              ) : (
                <>
                  <span>← Back</span>
                </>
              )}
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">
                Step {step} of 4
              </span>

              {step === 1 && (
                <Button onClick={goNext} disabled={!canAdvanceStep1} className="bg-blue-600 hover:bg-blue-700">
                  Next →
                </Button>
              )}

              {step === 2 && (
                <Button onClick={goNext} disabled={!canAdvanceStep2} className="bg-blue-600 hover:bg-blue-700">
                  Preview Report →
                </Button>
              )}

              {step === 3 && (
                <Button onClick={goNext} className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Proceed to Export
                </Button>
              )}

              {step === 4 && (
                <Button onClick={handleSaveAsPdf} className="bg-green-600 hover:bg-green-700">
                  <Printer className="h-4 w-4 mr-2" />
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