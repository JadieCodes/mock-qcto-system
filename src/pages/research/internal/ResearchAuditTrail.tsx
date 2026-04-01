import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { AuditEntry } from '@/contexts/AppContext';
import { Eye, ChevronLeft, ChevronRight, Search, X, FileText, Download } from 'lucide-react';

interface AuditModalProps {
  entry: AuditEntry;
  onClose: () => void;
}

const AuditDetailsModal: React.FC<AuditModalProps> = ({ entry, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Audit Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Timestamp</p>
              <p className="font-medium text-gray-900">
                {new Date(entry.timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Actor</p>
              <p className="font-medium text-gray-900">{entry.actor}</p>
              <p className="text-sm text-gray-500">{entry.actorRole}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Object</p>
            <p className="font-medium text-gray-900">
              {entry.objectType.charAt(0).toUpperCase() + entry.objectType.slice(1)}: {entry.objectName}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Action</p>
            <p className="font-medium text-gray-900">
              <span className={`px-2 py-1 text-xs rounded-full ${
                entry.action === 'approved' ? 'bg-green-100 text-green-800' :
                entry.action === 'rejected' ? 'bg-red-100 text-red-800' :
                entry.action === 'submitted' ? 'bg-blue-100 text-blue-800' :
                entry.action === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {entry.action.toUpperCase()}
              </span>
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Summary</p>
            <p className="text-gray-900">{entry.summary}</p>
          </div>

          {entry.description && (
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-gray-900">{entry.description}</p>
            </div>
          )}

          {entry.metadata && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Additional Information</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {entry.metadata.previousStatus && (
                  <p className="text-sm">
                    <span className="font-medium">Previous Status:</span>{' '}
                    {entry.metadata.previousStatus}
                  </p>
                )}
                {entry.metadata.newStatus && (
                  <p className="text-sm">
                    <span className="font-medium">New Status:</span>{' '}
                    {entry.metadata.newStatus}
                  </p>
                )}
                {entry.metadata.comments && (
                  <p className="text-sm">
                    <span className="font-medium">Comments:</span>{' '}
                    {entry.metadata.comments}
                  </p>
                )}
                {entry.metadata.agendaName && (
                  <p className="text-sm">
                    <span className="font-medium">Agenda:</span>{' '}
                    {entry.metadata.agendaName}
                  </p>
                )}
                {entry.metadata.projectName && (
                  <p className="text-sm">
                    <span className="font-medium">Project:</span>{' '}
                    {entry.metadata.projectName}
                  </p>
                )}
                {entry.metadata.milestoneName && (
                  <p className="text-sm">
                    <span className="font-medium">Milestone:</span>{' '}
                    {entry.metadata.milestoneName}
                  </p>
                )}
                {entry.metadata.taskName && (
                  <p className="text-sm">
                    <span className="font-medium">Task:</span>{' '}
                    {entry.metadata.taskName}
                  </p>
                )}
                {entry.metadata.actualCost !== undefined && (
                  <p className="text-sm">
                    <span className="font-medium">Actual Cost:</span>{' '}
                    ZAR {entry.metadata.actualCost.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface PDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AuditEntry[];
  searchTerm: string;
  actionFilter: string;
  objectTypeFilter: string;
}

const PDFPreviewModal: React.FC<PDFModalProps> = ({
  isOpen,
  onClose,
  data,
  searchTerm,
  actionFilter,
  objectTypeFilter,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'started':
        return 'bg-yellow-100 text-yellow-800';
      case 'created':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

 const handleSaveAsPDF = () => {
  if (!contentRef.current) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const formatAction = (action: string) => action.replace('_', ' ').toUpperCase();
  const formatObjectType = (type: string) =>
    type.charAt(0).toUpperCase() + type.slice(1);

  const getBadgeClass = (action: string) => {
    switch (action) {
      case 'approved':
        return 'badge badge-approved';
      case 'rejected':
        return 'badge badge-rejected';
      case 'submitted':
        return 'badge badge-submitted';
      case 'completed':
        return 'badge badge-completed';
      case 'started':
        return 'badge badge-started';
      case 'created':
        return 'badge badge-created';
      case 'updated':
        return 'badge badge-updated';
      case 'uploaded':
        return 'badge badge-uploaded';
      default:
        return 'badge badge-default';
    }
  };

  const rowsHTML =
    data.length === 0
      ? `
        <tr>
          <td colspan="5" class="empty-state">No audit records found</td>
        </tr>
      `
      : data
          .map(
            (entry, index) => `
              <tr>
                <td class="col-datetime">
                  <div class="primary">${new Date(entry.timestamp).toLocaleDateString()}</div>
                  <div class="secondary">${new Date(entry.timestamp).toLocaleTimeString()}</div>
                </td>
                <td class="col-object">
                  <div class="primary">${entry.objectName}</div>
                  <div class="secondary">${formatObjectType(entry.objectType)}</div>
                </td>
                <td class="col-actor">
                  <div class="primary">${entry.actor}</div>
                  <div class="secondary">${entry.actorRole}</div>
                </td>
                <td class="col-action">
                  <span class="${getBadgeClass(entry.action)}">
                    ${formatAction(entry.action)}
                  </span>
                </td>
                <td class="col-summary">
                  <div class="summary-title">${entry.summary}</div>
                  ${
                    entry.description
                      ? `<div class="summary-description">${entry.description}</div>`
                      : ''
                  }
                  ${
                    entry.metadata
                      ? `
                        <div class="meta-block">
                          ${entry.metadata.previousStatus ? `<div><strong>Previous:</strong> ${entry.metadata.previousStatus}</div>` : ''}
                          ${entry.metadata.newStatus ? `<div><strong>New:</strong> ${entry.metadata.newStatus}</div>` : ''}
                          ${entry.metadata.comments ? `<div><strong>Comments:</strong> ${entry.metadata.comments}</div>` : ''}
                          ${entry.metadata.agendaName ? `<div><strong>Agenda:</strong> ${entry.metadata.agendaName}</div>` : ''}
                          ${entry.metadata.projectName ? `<div><strong>Project:</strong> ${entry.metadata.projectName}</div>` : ''}
                          ${entry.metadata.milestoneName ? `<div><strong>Milestone:</strong> ${entry.metadata.milestoneName}</div>` : ''}
                          ${entry.metadata.taskName ? `<div><strong>Task:</strong> ${entry.metadata.taskName}</div>` : ''}
                          ${
                            entry.metadata.actualCost !== undefined
                              ? `<div><strong>Actual Cost:</strong> ZAR ${entry.metadata.actualCost.toLocaleString()}</div>`
                              : ''
                          }
                        </div>
                      `
                      : ''
                  }
                </td>
              </tr>
            `
          )
          .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Research Audit Trail Report</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 18mm 14mm 16mm 14mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            font-size: 11px;
            line-height: 1.4;
          }

          .report-shell {
            width: 100%;
          }

          .report-header {
            border-bottom: 2px solid #d1d5db;
            padding-bottom: 14px;
            margin-bottom: 18px;
            position: relative;
          }

          .report-meta-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 8px;
          }

          .report-title-block {
            text-align: center;
          }

          .report-kicker {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 4px;
          }

          .report-title {
            font-size: 28px;
            line-height: 1.15;
            font-weight: 800;
            color: #111827;
            margin: 0;
          }

          .report-subtitle {
            margin-top: 6px;
            font-size: 12px;
            color: #6b7280;
          }

          .filters-panel {
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 16px;
          }

          .filters-title {
            font-size: 11px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
          }

          .filters-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px 18px;
          }

          .filter-item {
            min-width: 0;
          }

          .filter-label {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 2px;
          }

          .filter-value {
            font-size: 11px;
            color: #111827;
            font-weight: 600;
            word-break: break-word;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 18px;
          }

          .stat-card {
            border: 1px solid #e5e7eb;
            background: #ffffff;
            border-radius: 10px;
            padding: 14px 10px;
            text-align: center;
          }

          .stat-label {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 8px;
          }

          .stat-value {
            font-size: 24px;
            line-height: 1;
            font-weight: 800;
            color: #111827;
          }

          .table-wrap {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          thead {
            display: table-header-group;
          }

          tr {
            page-break-inside: avoid;
          }

          thead th {
            background: #f3f4f6;
            color: #374151;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            text-align: left;
            padding: 12px 10px;
            border-bottom: 1px solid #d1d5db;
          }

          tbody td {
            vertical-align: top;
            padding: 12px 10px;
            border-bottom: 1px solid #e5e7eb;
          }

          tbody tr:nth-child(even) {
            background: #fcfcfd;
          }

          tbody tr:last-child td {
            border-bottom: none;
          }

          .col-datetime { width: 15%; }
          .col-object { width: 16%; }
          .col-actor { width: 16%; }
          .col-action { width: 12%; }
          .col-summary { width: 41%; }

          .primary {
            font-size: 11px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 2px;
            word-break: break-word;
          }

          .secondary {
            font-size: 10px;
            color: #6b7280;
            word-break: break-word;
          }

          .summary-title {
            font-size: 11px;
            color: #111827;
            font-weight: 600;
            margin-bottom: 4px;
            word-break: break-word;
          }

          .summary-description {
            font-size: 10px;
            color: #4b5563;
            margin-bottom: 6px;
            word-break: break-word;
          }

          .meta-block {
            margin-top: 6px;
            padding: 8px 10px;
            border-radius: 8px;
            background: #f9fafb;
            border: 1px solid #f0f1f3;
            font-size: 10px;
            color: #4b5563;
          }

          .meta-block div + div {
            margin-top: 2px;
          }

          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.03em;
            white-space: nowrap;
          }

          .badge-approved,
          .badge-completed {
            background: #dcfce7;
            color: #166534;
          }

          .badge-rejected {
            background: #fee2e2;
            color: #991b1b;
          }

          .badge-submitted {
            background: #dbeafe;
            color: #1d4ed8;
          }

          .badge-started {
            background: #fef3c7;
            color: #92400e;
          }

          .badge-created {
            background: #ede9fe;
            color: #6d28d9;
          }

          .badge-updated {
            background: #e0f2fe;
            color: #0369a1;
          }

          .badge-default {
            background: #f3f4f6;
            color: #374151;
          }

          .empty-state {
            text-align: center;
            padding: 28px 10px;
            color: #6b7280;
            font-size: 12px;
          }

          .report-footer {
            margin-top: 14px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #6b7280;
          }

          .footer-note {
            max-width: 70%;
          }

          .page-counter::after {
            content: counter(page);
          }

          @media print {
            body {
              padding: 0;
            }

            .table-wrap {
              overflow: visible;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-shell">
          <div class="report-header">
            <div class="report-meta-top">
              <div>${new Date().toLocaleString()}</div>
              <div>Research Audit Trail Export</div>
            </div>

            <div class="report-title-block">
              <div class="report-kicker">Research Audit Trail Report</div>
              <h1 class="report-title">Research Audit Trail Report</h1>
              <div class="report-subtitle">Generated on ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <div class="filters-panel">
            <div class="filters-title">Applied Filters</div>
            <div class="filters-grid">
              <div class="filter-item">
                <div class="filter-label">Search</div>
                <div class="filter-value">${searchTerm || 'None'}</div>
              </div>
              <div class="filter-item">
                <div class="filter-label">Action</div>
                <div class="filter-value">${actionFilter || 'All'}</div>
              </div>
              <div class="filter-item">
                <div class="filter-label">Object Type</div>
                <div class="filter-value">${objectTypeFilter || 'All'}</div>
              </div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Activities</div>
              <div class="stat-value">${data.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Approvals</div>
              <div class="stat-value">${data.filter((e) => e.action === 'approved').length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Rejections</div>
              <div class="stat-value">${data.filter((e) => e.action === 'rejected').length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Submissions</div>
              <div class="stat-value">${data.filter((e) => e.action === 'submitted').length}</div>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th class="col-datetime">Date & Time</th>
                  <th class="col-object">Object</th>
                  <th class="col-actor">Actor</th>
                  <th class="col-action">Action</th>
                  <th class="col-summary">Summary</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHTML}
              </tbody>
            </table>
          </div>

          <div class="report-footer">
            <div class="footer-note">
              Research Audit Trail Report — all activities are recorded and cannot be deleted.
            </div>
            <div>Page <span class="page-counter"></span></div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
    };
  };
};
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">PDF Preview</h3>
            <p className="text-sm text-gray-500 mt-1">Preview the audit trail report before saving</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div ref={contentRef} className="bg-white rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Object</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No audit records found
                      </td>
                    </tr>
                  ) : (
                    data.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{entry.objectName}</p>
                            <p className="text-xs text-gray-500 capitalize">{entry.objectType}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{entry.actor}</p>
                            <p className="text-xs text-gray-500">{entry.actorRole}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeClass(entry.action)}`}>
                            {entry.action.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700 max-w-md">{entry.summary}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAsPDF}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

const ResearchAuditTrail = () => {
  const { auditEntries } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [objectTypeFilter, setObjectTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const itemsPerPage = 10;

  const actionTypes = ['created', 'updated', 'submitted', 'approved', 'rejected', 'started', 'completed', 'uploaded'];
  const objectTypes = ['agenda', 'project', 'milestone', 'task', 'report'];

  const filteredEntries = useMemo(() => {
    return auditEntries.filter((entry: AuditEntry) => {
      const matchesSearch = searchTerm === '' || 
        entry.objectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === '' || entry.action === actionFilter;
      const matchesObjectType = objectTypeFilter === '' || entry.objectType === objectTypeFilter;
      
      return matchesSearch && matchesAction && matchesObjectType;
    });
  }, [auditEntries, searchTerm, actionFilter, objectTypeFilter]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'started':
        return 'bg-yellow-100 text-yellow-800';
      case 'created':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getObjectTypeIcon = (type: string) => {
    switch (type) {
      case 'agenda':
        return '📋';
      case 'project':
        return '📁';
      case 'milestone':
        return '🎯';
      case 'task':
        return '✅';
      case 'report':
        return '📄';
      default:
        return '📌';
    }
  };

  const stats = useMemo(() => {
    return {
      total: auditEntries.length,
      approvals: auditEntries.filter((e: AuditEntry) => e.action === 'approved').length,
      rejections: auditEntries.filter((e: AuditEntry) => e.action === 'rejected').length,
      submissions: auditEntries.filter((e: AuditEntry) => e.action === 'submitted').length,
    };
  }, [auditEntries]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Research Audit Trail</h1>
          <p className="text-gray-600 mt-1">
            Track and monitor all research activities, approvals, and changes
          </p>
        </div>
        <button
          onClick={() => setShowPDFModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Export as PDF
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Activities</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Approvals</p>
          <p className="text-2xl font-bold text-green-600">{stats.approvals}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Rejections</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejections}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Submissions</p>
          <p className="text-2xl font-bold text-blue-600">{stats.submissions}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by object name, actor, or summary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Actions</option>
            {actionTypes.map(action => (
              <option key={action} value={action}>
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={objectTypeFilter}
            onChange={(e) => setObjectTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Object Types</option>
            {objectTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          {(searchTerm || actionFilter || objectTypeFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setActionFilter('');
                setObjectTypeFilter('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Object
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📊</span>
                      <p className="text-gray-500">No audit records found</p>
                      <p className="text-sm text-gray-400">
                        {searchTerm || actionFilter || objectTypeFilter
                          ? 'Try adjusting your filters'
                          : 'Audit trail will appear here as research activities occur'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry: AuditEntry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getObjectTypeIcon(entry.objectType)}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {entry.objectName}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {entry.objectType}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.actor}</p>
                        <p className="text-xs text-gray-500">{entry.actorRole}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(entry.action)}`}>
                        {entry.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 truncate max-w-md">
                        {entry.summary}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredEntries.length)} of{' '}
              {filteredEntries.length} records
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedEntry && (
        <AuditDetailsModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      <PDFPreviewModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        data={filteredEntries}
        searchTerm={searchTerm}
        actionFilter={actionFilter}
        objectTypeFilter={objectTypeFilter}
      />
    </div>
  );
};

export default ResearchAuditTrail;