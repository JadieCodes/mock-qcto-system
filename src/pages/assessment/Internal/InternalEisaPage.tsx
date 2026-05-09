import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  ClipboardList,
  Users,
  FileText,
  Eye,
  CheckCircle2,
  FolderOpen,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react';

type EisaTab = 'trades' | 'nonTrades';
type InternalRole = 'Assistant Director';

type RegistrationStage =
  | 'sdp_submission'
  | 'assessment_domain_split'
  | 'assistant_director_validation'
  | 'trades_registered'
  | 'non_trades_prepared'
  | 'completed';

interface EisaInternalRecord {
  id: string;
  stream: 'trades' | 'nonTrades';
  eisaRegNo: string;
  title: string;
  eisaDate: string;
  sourceFrom: string;
  eisaRegDocument: boolean;
  leisaFile: boolean;
  sorAndQaReports: boolean;
  currentStage: RegistrationStage;
  validationStatus: 'pending' | 'validated';
  registrationNumber?: string;
  file4Prepared: boolean;
  sdpListPrepared: boolean;
  submittedToQaAndQp: boolean;
  submittedToQpTwoMonthsPrior: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'eisa_registration_records';

export default function InternalEisaPage() {
  const [activeTab, setActiveTab] = useState<EisaTab>('trades');
  const [records, setRecords] = useState<EisaInternalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<EisaInternalRecord | null>(null);
  const { currentRole } = useApp();

  const activeInternalRole: InternalRole = 'Assistant Director';

  useEffect(() => {
    loadRecords();

    const handleStorage = (e?: StorageEvent) => {
      if (!e || e.key === STORAGE_KEY) loadRecords();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const loadRecords = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setRecords([]);
      return;
    }

    const parsed = JSON.parse(stored) as EisaInternalRecord[];
    setRecords(parsed);
  };

  const saveRecords = (updated: EisaInternalRecord[]) => {
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  const visibleRecords = useMemo(() => {
    return records.filter((record) => record.stream === activeTab);
  }, [records, activeTab]);

  const cards = useMemo(() => {
    const registrations = visibleRecords.length;
    const candidates = visibleRecords.length;
    const files = visibleRecords.filter(
      (record) => record.eisaRegDocument && record.leisaFile && record.sorAndQaReports
    ).length;

    return [
      {
        title: 'Registrations',
        value: String(registrations),
        icon: <ClipboardList className="h-5 w-5" />,
      },
      {
        title: 'Candidates',
        value: String(candidates),
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: 'Supporting Files',
        value: String(files),
        icon: <FileText className="h-5 w-5" />,
      },
    ];
  }, [visibleRecords]);

  const handleTradesValidation = (recordId: string) => {
    const updated = records.map((record) =>
      record.id === recordId
        ? {
            ...record,
            validationStatus: 'validated' as const,
            registrationNumber: `REG-${record.eisaRegNo}`,
            currentStage: 'trades_registered' as RegistrationStage,
          }
        : record
    );
    saveRecords(updated);
  };

  const handleNonTradesValidation = (recordId: string) => {
    const updated = records.map((record) =>
      record.id === recordId
        ? {
            ...record,
            validationStatus: 'validated' as const,
            file4Prepared: true,
            sdpListPrepared: true,
            submittedToQaAndQp: true,
            submittedToQpTwoMonthsPrior: true,
            currentStage: 'non_trades_prepared' as RegistrationStage,
          }
        : record
    );
    saveRecords(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">EISA</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage EISA registration streams for trades and non-trades.
        </p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('trades')}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === 'trades'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              EISA Trades
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nonTrades')}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === 'nonTrades'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              EISA Non Trades
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'trades' ? 'EISA Trades' : 'EISA Non Trades'}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {activeTab === 'trades'
                    ? 'Assistant Director receives EISA Reg, LEISA File, and SOR & QA Reports, validates documentation, and creates registration number.'
                    : "Assistant Director receives EISA Reg, LEISA File, and SOR & QA Reports, validates documentation, prepares file 4, and submits the SDP list to QA and QP's."}
                </p>
              </div>

              <div className="inline-flex w-fit items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Current role
                </span>
                <span className="ml-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">
                  {currentRole || activeInternalRole}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {cards.map((card) => (
                <InfoCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                />
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                <h4 className="text-sm font-semibold text-gray-900">EISA Registration Workspace</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Registration
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Documents
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Validation
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Outcome
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-500">
                          No EISA records available.
                        </td>
                      </tr>
                    ) : (
                      visibleRecords.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70"
                        >
                          <td className="px-5 py-4 align-top">
                            <div className="font-semibold text-gray-900">{record.eisaRegNo}</div>
                            <div className="mt-1 text-sm text-gray-600">{record.title}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              EISA Date: {record.eisaDate}
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <MiniDocBadge ok={record.eisaRegDocument} label="EISA Reg" />
                              <MiniDocBadge ok={record.leisaFile} label="LEISA File" />
                              <MiniDocBadge ok={record.sorAndQaReports} label="SOR & QA Reports" />
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <StatusBadge
                              status={record.validationStatus === 'validated' ? 'approved' : 'pending'}
                              approvedLabel="Validated"
                              pendingLabel="Pending"
                            />
                          </td>

                          <td className="px-5 py-4 align-top">
                            <StageBadge stage={record.currentStage} />
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              <ActionButton
                                variant="secondary"
                                icon={<Eye className="h-4 w-4" />}
                                onClick={() => setSelectedRecord(record)}
                              >
                                View
                              </ActionButton>

                              {activeTab === 'trades' &&
                                record.currentStage === 'assistant_director_validation' && (
                                  <ActionButton
                                    icon={<CheckCircle2 className="h-4 w-4" />}
                                    onClick={() => handleTradesValidation(record.id)}
                                  >
                                    Validation OK
                                  </ActionButton>
                                )}

                              {activeTab === 'nonTrades' &&
                                record.currentStage === 'assistant_director_validation' && (
                                  <ActionButton
                                    icon={<FolderOpen className="h-4 w-4" />}
                                    onClick={() => handleNonTradesValidation(record.id)}
                                  >
                                    Prepare File 4
                                  </ActionButton>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedRecord && (
              <InternalEisaDetailsModal
                record={selectedRecord}
                onClose={() => setSelectedRecord(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InternalEisaDetailsModal({
  record,
  onClose,
}: {
  record: EisaInternalRecord;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {record.eisaRegNo} - {record.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">Internal EISA registration details</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <DetailStat
              title="Stage"
              value={getStageLabel(record.currentStage)}
              icon={<ClipboardList className="h-5 w-5" />}
            />
            <DetailStat
              title="Validation"
              value={record.validationStatus === 'validated' ? 'Validated' : 'Pending'}
              icon={<ShieldCheck className="h-5 w-5" />}
            />
            <DetailStat
              title="EISA Date"
              value={record.eisaDate}
              icon={<CalendarClock className="h-5 w-5" />}
            />
            <DetailStat
              title="Registration No"
              value={record.registrationNumber || '-'}
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h4 className="text-sm font-semibold text-gray-900">Required Documents</h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <ChecklistBadge label="EISA Reg" checked={record.eisaRegDocument} />
              <ChecklistBadge label="LEISA File" checked={record.leisaFile} />
              <ChecklistBadge label="SOR & QA Reports" checked={record.sorAndQaReports} />
            </div>
          </div>

          {record.stream === 'nonTrades' && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="text-sm font-semibold text-gray-900">Non-Trade Outputs</h4>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ChecklistBadge label="File 4 Prepared" checked={record.file4Prepared} />
                <ChecklistBadge label="SDP List Prepared" checked={record.sdpListPrepared} />
                <ChecklistBadge
                  label="Submitted to QA and QP"
                  checked={record.submittedToQaAndQp}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StageBadge({ stage }: { stage: RegistrationStage }) {
  const styles =
    stage === 'completed'
      ? 'bg-green-50 text-green-700 ring-green-600/20'
      : stage === 'trades_registered' || stage === 'non_trades_prepared'
      ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
      : 'bg-amber-50 text-amber-700 ring-amber-600/20';

  return (
    <span
      className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      {getStageLabel(stage)}
    </span>
  );
}

function getStageLabel(stage: RegistrationStage) {
  switch (stage) {
    case 'sdp_submission':
      return 'SDP Submission';
    case 'assessment_domain_split':
      return 'Assessment Domain Split';
    case 'assistant_director_validation':
      return 'Assistant Director Validation';
    case 'trades_registered':
      return 'Registration No Created';
    case 'non_trades_prepared':
      return 'File 4 & Lists Prepared';
    case 'completed':
      return 'Completed';
    default:
      return stage;
  }
}

function StatusBadge({
  status,
  approvedLabel = 'Approved',
  pendingLabel = 'Pending',
}: {
  status: 'pending' | 'in_progress' | 'approved';
  approvedLabel?: string;
  pendingLabel?: string;
}) {
  if (status === 'approved') {
    return (
      <span className="inline-flex h-8 items-center rounded-full bg-green-50 px-3 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
        {approvedLabel}
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span className="inline-flex h-8 items-center rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
        In Progress
      </span>
    );
  }

  return (
    <span className="inline-flex h-8 items-center rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">
      {pendingLabel}
    </span>
  );
}

function ActionButton({
  children,
  icon,
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const styles =
    variant === 'secondary'
      ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      : 'bg-red-600 text-white hover:bg-red-700';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${styles}`}
    >
      {icon}
      {children}
    </button>
  );
}

function MiniDocBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ${
        ok ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {label}
    </span>
  );
}

function ChecklistBadge({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 text-sm font-medium ${
        checked
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-gray-200 bg-white text-gray-600'
      }`}
    >
      {label}
    </div>
  );
}

function DetailStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-gray-100 p-3 text-gray-600">{icon}</div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-full bg-white p-3 text-gray-600">{icon}</div>
      </div>
    </div>
  );
}