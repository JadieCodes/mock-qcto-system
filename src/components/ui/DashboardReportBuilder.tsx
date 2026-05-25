import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Package,
  Printer,
  AlertCircle,
  Network,
  Receipt,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SdpInvoiceEntry } from '@/contexts/AppContext';
import type { AuditEntry } from '@/context/AuditTrailContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey =
  | 'submissionOverview'
  | 'batchSummary'
  | 'printJobsSection'
  | 'correctionsSection'
  | 'integrationSection'
  | 'invoicesSection'
  | 'recentActivitySection'
  | 'sdpInvoicesSection';

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
  isTable?: boolean;
  fields: FieldDef[];
}

interface DashboardStats {
  submissions: {
    total: number; draft: number; submitted: number; approved: number;
    pendingCorrection: number; integrated: number; completed: number;
  };
  batches: {
    total: number; integrated: number; printing: number;
    qcPassed: number; qcFailed: number; packaged: number; collected: number;
  };
  printJobs: { total: number; pending: number; completed: number; };
  corrections: { active: number; pendingReview: number; resolved: number; };
  integrationQueue: { awaitingIntegration: number; integrated: number; failed: number; };
  invoices: { pending: number; sent: number; total: number; };
}

interface Props {
  stats: DashboardStats;
  sdpInvoices: SdpInvoiceEntry[];
  auditEntries: AuditEntry[];
  currentRole: string;
  onClose: () => void;
}

// ─── Section & field config ───────────────────────────────────────────────────

const SECTIONS: SectionDef[] = [
  {
    key: 'submissionOverview',
    label: 'Submission Overview',
    icon: FileText,
    fields: [
      { key: 'total', label: 'Total Submissions' },
      { key: 'submitted', label: 'Pending (Submitted)' },
      { key: 'approved', label: 'Approved' },
      { key: 'pendingCorrection', label: 'Pending Correction' },
      { key: 'integrated', label: 'Integrated' },
      { key: 'completed', label: 'Completed' },
    ],
  },
  {
    key: 'batchSummary',
    label: 'Batch Summary',
    icon: Package,
    fields: [
      { key: 'total', label: 'Total Batches' },
      { key: 'integrated', label: 'Ready for Printing' },
      { key: 'printing', label: 'Currently Printing' },
      { key: 'qcPassed', label: 'QC Passed' },
      { key: 'collected', label: 'Collected' },
    ],
  },
  {
    key: 'printJobsSection',
    label: 'Print Jobs',
    icon: Printer,
    fields: [
      { key: 'total', label: 'Total Print Jobs' },
      { key: 'pending', label: 'In Progress' },
      { key: 'completed', label: 'Completed' },
    ],
  },
  {
    key: 'correctionsSection',
    label: 'Corrections',
    icon: AlertCircle,
    fields: [
      { key: 'active', label: 'Active Corrections' },
      { key: 'pendingReview', label: 'Under Review' },
      { key: 'resolved', label: 'Resolved' },
    ],
  },
  {
    key: 'integrationSection',
    label: 'Integration Queue',
    icon: Network,
    fields: [
      { key: 'awaitingIntegration', label: 'Awaiting Integration' },
      { key: 'integrated', label: 'Successfully Integrated' },
      { key: 'failed', label: 'Failed' },
    ],
  },
  {
    key: 'invoicesSection',
    label: 'Pending Invoices',
    icon: Receipt,
    fields: [
      { key: 'pending', label: 'Pending Invoices' },
      { key: 'sent', label: 'Sent Invoices' },
      { key: 'total', label: 'Total Invoices' },
    ],
  },
  {
    key: 'recentActivitySection',
    label: 'Recent Activity',
    icon: ClipboardList,
    isTable: true,
    fields: [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'module', label: 'Module' },
      { key: 'action', label: 'Action' },
      { key: 'user', label: 'User' },
    ],
  },
  {
    key: 'sdpInvoicesSection',
    label: 'SDP Invoices',
    icon: Receipt,
    isTable: true,
    fields: [
      { key: 'sdpName', label: 'SDP Name' },
      { key: 'processType', label: 'Process Type' },
      { key: 'submissionDate', label: 'Submission Date' },
      { key: 'status', label: 'Status' },
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

export function DashboardReportBuilder({ stats, sdpInvoices, auditEntries, currentRole, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedSections, setSelectedSections] = useState<SectionSelections>(initSections);
  const [selectedFields, setSelectedFields] = useState<FieldMap>(initFields);

  const reportDate = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const activeSections = SECTIONS.filter(s => selectedSections[s.key]);

  // Flat stat value lookup, keyed by section then field
  const statValueMap: Record<string, Record<string, number>> = {
    submissionOverview: {
      total: stats.submissions.total,
      submitted: stats.submissions.submitted,
      approved: stats.submissions.approved,
      pendingCorrection: stats.submissions.pendingCorrection,
      integrated: stats.submissions.integrated,
      completed: stats.submissions.completed,
    },
    batchSummary: {
      total: stats.batches.total,
      integrated: stats.batches.integrated,
      printing: stats.batches.printing,
      qcPassed: stats.batches.qcPassed,
      collected: stats.batches.collected,
    },
    printJobsSection: {
      total: stats.printJobs.total,
      pending: stats.printJobs.pending,
      completed: stats.printJobs.completed,
    },
    correctionsSection: {
      active: stats.corrections.active,
      pendingReview: stats.corrections.pendingReview,
      resolved: stats.corrections.resolved,
    },
    integrationSection: {
      awaitingIntegration: stats.integrationQueue.awaitingIntegration,
      integrated: stats.integrationQueue.integrated,
      failed: stats.integrationQueue.failed,
    },
    invoicesSection: {
      pending: stats.invoices.pending,
      sent: stats.invoices.sent,
      total: stats.invoices.total,
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

  // ── Cell renderers ────────────────────────────────────────────────────────

  const renderAuditCell = (entry: AuditEntry, fieldKey: string) => {
    switch (fieldKey) {
      case 'timestamp': return new Date(entry.timestamp).toLocaleString();
      case 'module': return <Badge variant="secondary" className="text-xs">{entry.module}</Badge>;
      case 'action': return entry.action;
      case 'user': return entry.user;
      default: return null;
    }
  };

  const renderInvoiceCell = (inv: SdpInvoiceEntry, fieldKey: string) => {
    switch (fieldKey) {
      case 'sdpName': return inv.sdpName;
      case 'processType': return inv.processType;
      case 'submissionDate': return new Date(inv.submissionDate).toLocaleDateString();
      case 'status':
        return (
          <Badge variant={inv.status === 'Sent' ? 'outline' : 'default'} className="text-xs">
            {inv.status}
          </Badge>
        );
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

      if (section.key === 'recentActivitySection') {
        body += `<table><thead><tr>${activeFields.map(f => `<th>${f.label}</th>`).join('')}</tr></thead><tbody>`;
        if (auditEntries.length === 0) {
          body += `<tr><td colspan="${activeFields.length}" style="text-align:center;color:#888">No activity recorded</td></tr>`;
        } else {
          for (const entry of auditEntries.slice(0, 7)) {
            body += '<tr>';
            for (const f of activeFields) {
              let cell = '';
              if (f.key === 'timestamp') cell = new Date(entry.timestamp).toLocaleString();
              else if (f.key === 'module') cell = entry.module;
              else if (f.key === 'action') cell = entry.action;
              else if (f.key === 'user') cell = entry.user;
              body += `<td>${cell}</td>`;
            }
            body += '</tr>';
          }
        }
        body += '</tbody>}</table>';
      } else if (section.key === 'sdpInvoicesSection') {
        body += `<table><thead><tr>${activeFields.map(f => `<th>${f.label}</th>`).join('')}</tr></thead><tbody>`;
        if (sdpInvoices.length === 0) {
          body += `<tr><td colspan="${activeFields.length}" style="text-align:center;color:#888">No invoices</td></tr>`;
        } else {
          for (const inv of sdpInvoices.slice(0, 5)) {
            body += '<tr>';
            for (const f of activeFields) {
              let cell = '';
              if (f.key === 'sdpName') cell = inv.sdpName;
              else if (f.key === 'processType') cell = inv.processType;
              else if (f.key === 'submissionDate') cell = new Date(inv.submissionDate).toLocaleDateString();
              else if (f.key === 'status') cell = inv.status;
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
  <title>Dashboard Report - ${reportDate}</title>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px; }
    h1 { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #666; margin-bottom: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
    .section { margin-bottom: 28px; page-break-inside: avoid; }
    .section-title { font-size: 14px; font-weight: bold; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .stat-item { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; background: #f9fafb; }
    .stat-label { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
    .stat-value { font-size: 22px; font-weight: bold; color: #111827; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; }
    td { padding: 7px 10px; border: 1px solid #e5e7eb; vertical-align: middle; }
    tr:nth-child(even) td { background: #f9fafb; }
    @media print {
      body { padding: 16px; }
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <h1>Dashboard Report</h1>
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

  // ── Preview (shared by steps 3 & 4) ──────────────────────────────────────

  const renderPreview = () => {
    const hasContent = activeSections.some(
      s => s.fields.some(f => selectedFields[s.key]?.[f.key])
    );

    return (
      <div className="space-y-4">
        {/* Report header */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <p className="text-base font-bold">Dashboard Report</p>
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

          return (
            <div key={section.key} className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2.5 border-b flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{section.label}</span>
              </div>

              <div className="p-4">
                {section.key === 'recentActivitySection' ? (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        {activeFields.map(f => (
                          <th key={f.key} className="text-left pb-2 pr-4 text-muted-foreground font-medium">
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditEntries.length === 0 ? (
                        <tr>
                          <td colSpan={activeFields.length} className="py-4 text-center text-muted-foreground">
                            No activity recorded
                          </td>
                        </tr>
                      ) : (
                        auditEntries.slice(0, 7).map(entry => (
                          <tr key={entry.id} className="border-b last:border-0">
                            {activeFields.map(f => (
                              <td key={f.key} className="py-1.5 pr-4">
                                {renderAuditCell(entry, f.key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : section.key === 'sdpInvoicesSection' ? (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        {activeFields.map(f => (
                          <th key={f.key} className="text-left pb-2 pr-4 text-muted-foreground font-medium">
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sdpInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={activeFields.length} className="py-4 text-center text-muted-foreground">
                            No invoices
                          </td>
                        </tr>
                      ) : (
                        sdpInvoices.slice(0, 5).map(inv => (
                          <tr key={inv.id} className="border-b last:border-0">
                            {activeFields.map(f => (
                              <td key={f.key} className="py-1.5 pr-4">
                                {renderInvoiceCell(inv, f.key)}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {activeFields.map(f => {
                      const vals = statValueMap[section.key] ?? {};
                      return (
                        <div key={f.key} className="border rounded-md p-3 bg-muted/20">
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                          <p className="text-xl font-bold mt-0.5">{vals[f.key] ?? 0}</p>
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
              Create Dashboard Report
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