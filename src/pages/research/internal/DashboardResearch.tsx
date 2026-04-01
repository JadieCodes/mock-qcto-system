// screens/DashboardResearch.tsx
import React, { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  FolderOpen,
  Flag,
  BarChart3,
} from 'lucide-react';

type ProjectWithMeta = {
  id: string;
  agendaId: string;
  agendaItemId: string;
  name: string;
  status: string;
  actualStartDate?: string | Date;
  actualEndDate?: string | Date;
  actualCost?: number;
  milestones: any[];
  plannedStart?: string;
  plannedEnd?: string;
  agendaName?: string;
  agendaItemType?: 'internal' | 'external';
  plannedCostFromAgenda?: number;
};

type GanttMode = 'time' | 'cost';

const LEFT_COLUMN_WIDTH = 360;
const TIMELINE_WIDTH_TIME = 2100;
const TIMELINE_WIDTH_COST = 1800;

const STATUS_COLORS: Record<string, string> = {
  not_started: '#9CA3AF',
  in_progress: '#F59E0B',
  awaiting_report_submission: '#F97316',
  under_review: '#3B82F6',
  completed: '#10B981',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  not_started: '#9CA3AF',
  in_progress: '#F59E0B',
  completed: '#10B981',
};

const DashboardResearch = () => {
  const { agendas, projects } = useApp();
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [ganttMode, setGanttMode] = useState<GanttMode>('time');

  const currentTimelineWidth =
    ganttMode === 'cost' ? TIMELINE_WIDTH_COST : TIMELINE_WIDTH_TIME;

  const approvedAgendas = useMemo(
    () => agendas.filter((agenda) => agenda.status === 'approved'),
    [agendas]
  );

  const parseDate = (value?: string | Date | null) => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (value?: string | Date | null) => {
    const d = parseDate(value);
    if (!d) return '-';
    return d.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const daysBetween = (start?: string | Date | null, end?: string | Date | null) => {
    const s = parseDate(start);
    const e = parseDate(end);
    if (!s || !e) return 0;
    return Math.max(
      0,
      Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
    );
  };

  const dashboardData = useMemo(() => {
    const uniqueProjects = projects.filter(
      (project, index, arr) =>
        index ===
        arr.findIndex(
          (p) =>
            p.agendaId === project.agendaId &&
            p.agendaItemId === project.agendaItemId
        )
    );

    const projectWithAgendaMeta: ProjectWithMeta[] = uniqueProjects.map((project: any) => {
      const agenda = agendas.find((a) => a.id === project.agendaId);
      const agendaItem = agenda?.items.find((item: any) => item.id === project.agendaItemId);

      return {
        ...project,
        agendaName: agenda?.name || 'Unknown Agenda',
        agendaItemType: agendaItem?.type || 'internal',
        plannedStart: agendaItem?.plannedTime?.start || '',
        plannedEnd: agendaItem?.plannedTime?.end || '',
        plannedCostFromAgenda: agendaItem?.plannedCost || 0,
        milestones: project.milestones || [],
      };
    });

    const agendaBlocks = approvedAgendas.map((agenda) => {
      const linkedProjects = projectWithAgendaMeta.filter((p) => p.agendaId === agenda.id);
      return {
        ...agenda,
        linkedProjects,
      };
    });

    const allDates: Date[] = [];

    agendaBlocks.forEach((agenda) => {
      agenda.linkedProjects.forEach((project) => {
        [
          parseDate(project.plannedStart),
          parseDate(project.plannedEnd),
          parseDate(project.actualStartDate),
          parseDate(project.actualEndDate),
        ]
          .filter(Boolean)
          .forEach((d) => allDates.push(d as Date));

        project.milestones.forEach((milestone: any) => {
          [
            parseDate(milestone.plannedTime?.start),
            parseDate(milestone.plannedTime?.end),
            parseDate(milestone.actualTime?.start),
            parseDate(milestone.actualTime?.end),
          ]
            .filter(Boolean)
            .forEach((d) => allDates.push(d as Date));
        });
      });
    });

    const minDate = allDates.length
      ? new Date(Math.min(...allDates.map((d) => d.getTime())))
      : new Date();

    const maxDate = allDates.length
      ? new Date(Math.max(...allDates.map((d) => d.getTime())))
      : new Date();

    const paddedMin = new Date(minDate);
    paddedMin.setDate(paddedMin.getDate() - 7);

    const paddedMax = new Date(maxDate);
    paddedMax.setDate(paddedMax.getDate() + 7);

    const totalDays = Math.max(
      1,
      Math.ceil((paddedMax.getTime() - paddedMin.getTime()) / (1000 * 60 * 60 * 24))
    );

    const projectStatusCounts = {
      not_started: 0,
      in_progress: 0,
      awaiting_report_submission: 0,
      under_review: 0,
      completed: 0,
    };

    projectWithAgendaMeta.forEach((project) => {
      if (project.status in projectStatusCounts) {
        projectStatusCounts[project.status as keyof typeof projectStatusCounts] += 1;
      }
    });

    const projectStatusOverview = [
      {
        name: 'Projects',
        'Not Started': projectStatusCounts.not_started,
        'In Progress': projectStatusCounts.in_progress,
        'Awaiting Report': projectStatusCounts.awaiting_report_submission,
        'Under Review': projectStatusCounts.under_review,
        Completed: projectStatusCounts.completed,
      },
    ];

    const plannedVsActualTimeline = projectWithAgendaMeta.map((project) => {
      const plannedDuration = daysBetween(project.plannedStart, project.plannedEnd);
      const actualDuration = daysBetween(project.actualStartDate, project.actualEndDate);

      return {
        name: project.name,
        plannedDuration,
        actualDuration,
      };
    });

    const delayAnalysis = projectWithAgendaMeta.map((project) => {
      const plannedDuration = daysBetween(project.plannedStart, project.plannedEnd);
      const actualDuration = daysBetween(project.actualStartDate, project.actualEndDate);
      const delayDays = Math.max(0, actualDuration - plannedDuration);

      return {
        name: project.name,
        delayDays,
        status: delayDays > 0 ? 'Delayed' : 'On Time',
      };
    });

    const taskStatusCounts = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
    };

    projectWithAgendaMeta.forEach((project) => {
      project.milestones.forEach((milestone: any) => {
        (milestone.tasks || []).forEach((task: any) => {
          if (task.status in taskStatusCounts) {
            taskStatusCounts[task.status as keyof typeof taskStatusCounts] += 1;
          }
        });
      });
    });

    const taskStatusBreakdown = [
      { name: 'Not Started', value: taskStatusCounts.not_started },
      { name: 'In Progress', value: taskStatusCounts.in_progress },
      { name: 'Completed', value: taskStatusCounts.completed },
    ];

    const milestoneCompletionRate = projectWithAgendaMeta.map((project) => {
      const totalMilestones = project.milestones.length;
      const completedMilestones = project.milestones.filter(
        (m: any) => m.status === 'completed'
      ).length;

      return {
        name: project.name,
        completedMilestones,
        remainingMilestones: Math.max(0, totalMilestones - completedMilestones),
      };
    });

    const plannedVsActualCost = projectWithAgendaMeta.map((project) => {
      const plannedCost =
        project.milestones?.reduce(
          (sum: number, milestone: any) => sum + (milestone.plannedCost || 0),
          0
        ) || project.plannedCostFromAgenda || 0;

      const actualCost = project.actualCost || 0;

      return {
        name: project.name,
        plannedCost,
        actualCost,
      };
    });

    const maxProjectPlannedCost = Math.max(
      1,
      ...projectWithAgendaMeta.map((project) => {
        const projectPlannedCost =
          project.milestones?.reduce(
            (sum: number, milestone: any) => sum + (milestone.plannedCost || 0),
            0
          ) || project.plannedCostFromAgenda || 0;
        return projectPlannedCost;
      })
    );

    const maxMilestonePlannedCost = Math.max(
      1,
      ...projectWithAgendaMeta.flatMap((project) =>
        project.milestones.map((milestone: any) => milestone.plannedCost || 0)
      )
    );

    const summary = {
      totalAgendas: approvedAgendas.length,
      totalProjects: projectWithAgendaMeta.length,
      totalMilestones: projectWithAgendaMeta.reduce(
        (sum, project) => sum + project.milestones.length,
        0
      ),
      totalTasks: projectWithAgendaMeta.reduce(
        (sum, project) =>
          sum +
          project.milestones.reduce(
            (mSum: number, milestone: any) => mSum + (milestone.tasks?.length || 0),
            0
          ),
        0
      ),
    };

    return {
      summary,
      agendaBlocks,
      minDate: paddedMin,
      maxDate: paddedMax,
      totalDays,
      projectStatusOverview,
      plannedVsActualTimeline,
      delayAnalysis,
      taskStatusBreakdown,
      milestoneCompletionRate,
      plannedVsActualCost,
      maxProjectPlannedCost,
      maxMilestonePlannedCost,
    };
  }, [agendas, approvedAgendas, projects]);

  const dateToPercent = (value?: string | Date | null) => {
    const d = parseDate(value);
    if (!d) return 0;
    const diff = d.getTime() - dashboardData.minDate.getTime();
    return Math.max(
      0,
      Math.min(100, (diff / (1000 * 60 * 60 * 24 * dashboardData.totalDays)) * 100)
    );
  };

  const durationToPercent = (start?: string | Date | null, end?: string | Date | null) => {
    const s = parseDate(start);
    const e = parseDate(end);
    if (!s || !e) return 0;
    const diff = e.getTime() - s.getTime();
    const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    return Math.max(0.8, (days / dashboardData.totalDays) * 100);
  };

  const monthHeaders = useMemo(() => {
    const months: { label: string; left: number; width: number }[] = [];
    const cursor = new Date(
      dashboardData.minDate.getFullYear(),
      dashboardData.minDate.getMonth(),
      1
    );

    while (cursor <= dashboardData.maxDate) {
      const monthStart = new Date(cursor);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);

      const left = dateToPercent(monthStart);
      const right = dateToPercent(monthEnd);
      const width = Math.max(4, right - left);

      months.push({
        label: monthStart.toLocaleDateString('en-ZA', {
          month: 'short',
          year: 'numeric',
        }),
        left,
        width,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  }, [dashboardData.minDate, dashboardData.maxDate]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_report_submission':
        return 'bg-orange-100 text-orange-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'awaiting_report_submission':
        return 'Awaiting Report';
      case 'under_review':
        return 'Under Review';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Not Started';
    }
  };

  const renderTimelineBar = (
    plannedStart?: string,
    plannedEnd?: string,
    actualStart?: string | Date,
    actualEnd?: string | Date
  ) => {
    const plannedLeft = dateToPercent(plannedStart);
    const plannedWidth = durationToPercent(plannedStart, plannedEnd);

    const actualLeft = dateToPercent(actualStart);
    const actualWidth =
      actualStart && actualEnd
        ? durationToPercent(actualStart, actualEnd)
        : actualStart
          ? 1.2
          : 0;

    const isDelayed =
      plannedEnd && actualEnd
        ? new Date(actualEnd).getTime() > new Date(plannedEnd).getTime()
        : false;

    return (
      <div className="relative h-14 w-full rounded-xl bg-gray-50 border border-gray-200 overflow-hidden">
        {monthHeaders.map((month, idx) => (
          <div
            key={idx}
            className="absolute top-0 bottom-0 border-r border-gray-200"
            style={{ left: `${month.left}%` }}
          />
        ))}

        {plannedStart && plannedEnd && (
          <div
            className="absolute top-3 h-3 rounded-full bg-slate-300"
            style={{
              left: `${plannedLeft}%`,
              width: `${plannedWidth * 0.86}%`,
            }}
            title={`Planned: ${formatDate(plannedStart)} - ${formatDate(plannedEnd)}`}
          />
        )}

        {actualStart && (
          <div
            className={`absolute top-8 h-3 rounded-full ${
              isDelayed ? 'bg-red-500' : 'bg-blue-600'
            }`}
            style={{
              left: `${actualLeft}%`,
              width: `${actualWidth * 0.86}%`,
            }}
            title={`Actual: ${formatDate(actualStart)} - ${formatDate(actualEnd)}`}
          />
        )}
      </div>
    );
  };

  const renderCostBar = (
    plannedCost: number,
    actualCost: number,
    maxCost: number
  ) => {
    const safeMax = Math.max(1, maxCost);
    const plannedWidth = Math.max(1, (plannedCost / safeMax) * 82);
    const actualWidth = Math.max(0, (actualCost / safeMax) * 82);
    const overBudget = actualCost > plannedCost;

    return (
      <div className="relative h-14 w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-2">
        <div className="w-full space-y-2">
          <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-3 rounded-full bg-slate-400"
              style={{ width: `${plannedWidth}%` }}
              title={`Planned Cost: ZAR ${plannedCost.toLocaleString()}`}
            />
          </div>

          <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-3 rounded-full ${
                overBudget ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${actualWidth}%` }}
              title={`Actual Cost: ZAR ${actualCost.toLocaleString()}`}
            />
          </div>
        </div>
      </div>
    );
  };

  const SummaryCard = ({ title, value }: { title: string; value: string | number }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );

  const ChartCard = ({
    title,
    children,
    height = 320,
  }: {
    title: string;
    children: React.ReactNode;
    height?: number;
  }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Research Dashboard</h1>
        </div>
        <p className="text-gray-600 mt-1">
          Agenda, project, milestone, task and cost performance overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Approved Agendas" value={dashboardData.summary.totalAgendas} />
        <SummaryCard title="Projects" value={dashboardData.summary.totalProjects} />
        <SummaryCard title="Milestones" value={dashboardData.summary.totalMilestones} />
        <SummaryCard title="Tasks" value={dashboardData.summary.totalTasks} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Agenda Gantt Overview
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Switch between timeline and cost view for projects and milestones
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <select
                value={ganttMode}
                onChange={(e) => setGanttMode(e.target.value as GanttMode)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="time">Time Spent</option>
                <option value="cost">Cost Spent</option>
              </select>

              {ganttMode === 'time' ? (
                <div className="flex flex-wrap items-center gap-5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-slate-300" />
                    <span className="text-gray-600">Planned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-blue-600" />
                    <span className="text-gray-600">Actual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-red-500" />
                    <span className="text-gray-600">Delayed Actual</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-slate-400" />
                    <span className="text-gray-600">Planned Cost</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-blue-600" />
                    <span className="text-gray-600">Actual Cost</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full bg-red-500" />
                    <span className="text-gray-600">Over Budget</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className="p-6 space-y-8"
            style={{ minWidth: LEFT_COLUMN_WIDTH + currentTimelineWidth + 80 }}
          >
            {ganttMode === 'time' && (
              <div
                className="grid gap-6 sticky top-0 z-10 bg-white pb-4"
                style={{
                  gridTemplateColumns: `${LEFT_COLUMN_WIDTH}px minmax(1400px, 1fr)`,
                }}
              >
                <div className="flex items-end">
                  <div className="text-sm font-semibold text-gray-700">
                    Agenda / Project / Milestone
                  </div>
                </div>

                <div className="relative h-12 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden">
                  {monthHeaders.map((month, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-r border-gray-200"
                      style={{
                        left: `${month.left}%`,
                        width: `${month.width}%`,
                      }}
                    >
                      <span className="absolute top-3 left-2 text-xs font-medium text-gray-500 whitespace-nowrap">
                        {month.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ganttMode === 'cost' && (
              <div
                className="grid gap-6 sticky top-0 z-10 bg-white pb-4"
                style={{
                  gridTemplateColumns: `${LEFT_COLUMN_WIDTH}px minmax(1400px, 1fr)`,
                }}
              >
                <div className="flex items-end">
                  <div className="text-sm font-semibold text-gray-700">
                    Agenda / Project / Milestone
                  </div>
                </div>

                <div className="h-12 rounded-xl bg-gray-50 border border-gray-200 px-4 flex items-center justify-between text-sm text-gray-600 font-medium">
                  <span>Cost comparison scale</span>
                  <span>
                    Max planned project cost: ZAR{' '}
                    {dashboardData.maxProjectPlannedCost.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {dashboardData.agendaBlocks.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No approved agendas yet</h3>
                <p className="text-gray-500 mt-1">
                  Gantt data will appear here once agendas and projects exist.
                </p>
              </div>
            ) : (
              dashboardData.agendaBlocks.map((agenda) => (
                <div
                  key={agenda.id}
                  className="border border-gray-200 rounded-2xl overflow-hidden"
                >
                  <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 break-words">
                          {agenda.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {agenda.linkedProjects.length} project(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {agenda.linkedProjects.length === 0 ? (
                      <div className="text-sm text-gray-500 px-2 py-4">
                        No linked projects found for this agenda.
                      </div>
                    ) : (
                      agenda.linkedProjects.map((project) => {
                        const isExpanded = !!expandedProjects[project.id];

                        const projectPlannedCost =
                          project.milestones?.reduce(
                            (sum: number, milestone: any) => sum + (milestone.plannedCost || 0),
                            0
                          ) || project.plannedCostFromAgenda || 0;

                        const projectActualCost = project.actualCost || 0;

                        return (
                          <div
                            key={project.id}
                            className="border border-gray-200 rounded-2xl overflow-hidden bg-white"
                          >
                            <button
                              type="button"
                              onClick={() => toggleProject(project.id)}
                              className="block w-full min-w-0 px-4 py-4 hover:bg-gray-50 transition-colors overflow-visible"
                            >
                              <div
                                className="grid gap-6 items-start min-w-0"
                                style={{
                                  gridTemplateColumns: `${LEFT_COLUMN_WIDTH}px minmax(1400px, 1fr)`,
                                }}
                              >
                                <div className="text-left min-w-0">
                                  <div className="flex items-start gap-2">
                                    <div className="pt-1 shrink-0">
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                      )}
                                    </div>

                                    <div className="min-w-0 w-full">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-gray-900 break-words">
                                          {project.name}
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(
                                            project.status
                                          )}`}
                                        >
                                          {getStatusLabel(project.status)}
                                        </span>
                                      </div>

                                      <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-500">
                                        {ganttMode === 'time' ? (
                                          <>
                                            <span className="break-words">
                                              Planned: {formatDate(project.plannedStart)} →{' '}
                                              {formatDate(project.plannedEnd)}
                                            </span>
                                            <span className="break-words">
                                              Actual: {formatDate(project.actualStartDate)} →{' '}
                                              {formatDate(project.actualEndDate)}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="break-words">
                                              Planned Cost: ZAR {projectPlannedCost.toLocaleString()}
                                            </span>
                                            <span className="break-words">
                                              Actual Cost: ZAR {projectActualCost.toLocaleString()}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2 min-w-0 w-full overflow-visible pr-8">
                                  {ganttMode === 'time' ? (
                                    <>
                                      {renderTimelineBar(
                                        project.plannedStart,
                                        project.plannedEnd,
                                        project.actualStartDate,
                                        project.actualEndDate
                                      )}

                                      <div className="grid grid-cols-[1fr_auto] gap-6 text-xs text-gray-500 px-1 min-w-0 w-full">
                                        <div className="break-words min-w-0">
                                          Planned: {formatDate(project.plannedStart)} →{' '}
                                          {formatDate(project.plannedEnd)}
                                        </div>
                                        <div className="whitespace-nowrap text-right pl-6">
                                          Actual: {formatDate(project.actualStartDate)} →{' '}
                                          {formatDate(project.actualEndDate)}
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {renderCostBar(
                                        projectPlannedCost,
                                        projectActualCost,
                                        dashboardData.maxProjectPlannedCost
                                      )}

                                      <div className="grid grid-cols-[1fr_auto] gap-6 text-xs text-gray-500 px-1 min-w-0 w-full">
                                        <div className="break-words min-w-0">
                                          Planned Cost: ZAR {projectPlannedCost.toLocaleString()}
                                        </div>
                                        <div className="whitespace-nowrap text-right pl-6">
                                          Actual Cost: ZAR {projectActualCost.toLocaleString()}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
                                {project.milestones?.length === 0 ? (
                                  <div className="text-sm text-gray-500 pl-8 py-2">
                                    No milestones added yet.
                                  </div>
                                ) : (
                                  project.milestones.map((milestone: any) => {
                                    const milestonePlannedCost = milestone.plannedCost || 0;
                                    const milestoneActualCost = milestone.actualCost || 0;

                                    return (
                                      <div
                                        key={milestone.id}
                                        className="bg-white border border-gray-200 rounded-2xl px-4 py-3"
                                      >
                                        <div
                                          className="grid gap-6 items-start min-w-0"
                                          style={{
                                            gridTemplateColumns: `${LEFT_COLUMN_WIDTH}px minmax(1400px, 1fr)`,
                                          }}
                                        >
                                          <div className="text-left min-w-0">
                                            <div className="flex items-start gap-2">
                                              <Flag className="h-4 w-4 text-purple-500 shrink-0 mt-1" />
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="font-medium text-gray-900 break-words">
                                                    {milestone.name}
                                                  </span>
                                                  <span
                                                    className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(
                                                      milestone.status
                                                    )}`}
                                                  >
                                                    {getStatusLabel(milestone.status)}
                                                  </span>
                                                </div>

                                                <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-500">
                                                  {ganttMode === 'time' ? (
                                                    <>
                                                      <span className="break-words">
                                                        Planned: {formatDate(milestone.plannedTime?.start)} →{' '}
                                                        {formatDate(milestone.plannedTime?.end)}
                                                      </span>
                                                      <span className="break-words">
                                                        Actual: {formatDate(milestone.actualTime?.start)} →{' '}
                                                        {formatDate(milestone.actualTime?.end)}
                                                      </span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <span className="break-words">
                                                        Planned Cost: ZAR {milestonePlannedCost.toLocaleString()}
                                                      </span>
                                                      <span className="break-words">
                                                        Actual Cost: ZAR {milestoneActualCost.toLocaleString()}
                                                      </span>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="space-y-2 min-w-0 w-full overflow-visible pr-8">
                                            {ganttMode === 'time' ? (
                                              <>
                                                {renderTimelineBar(
                                                  milestone.plannedTime?.start,
                                                  milestone.plannedTime?.end,
                                                  milestone.actualTime?.start,
                                                  milestone.actualTime?.end
                                                )}

                                                <div className="grid grid-cols-[1fr_auto] gap-6 text-xs text-gray-500 px-1 min-w-0 w-full">
                                                  <div className="break-words min-w-0">
                                                    Planned: {formatDate(milestone.plannedTime?.start)} →{' '}
                                                    {formatDate(milestone.plannedTime?.end)}
                                                  </div>
                                                  <div className="whitespace-nowrap text-right pl-6">
                                                    Actual: {formatDate(milestone.actualTime?.start)} →{' '}
                                                    {formatDate(milestone.actualTime?.end)}
                                                  </div>
                                                </div>
                                              </>
                                            ) : (
                                              <>
                                                {renderCostBar(
                                                  milestonePlannedCost,
                                                  milestoneActualCost,
                                                  dashboardData.maxMilestonePlannedCost
                                                )}

                                                <div className="grid grid-cols-[1fr_auto] gap-6 text-xs text-gray-500 px-1 min-w-0 w-full">
                                                  <div className="break-words min-w-0">
                                                    Planned Cost: ZAR {milestonePlannedCost.toLocaleString()}
                                                  </div>
                                                  <div className="whitespace-nowrap text-right pl-6">
                                                    Actual Cost: ZAR {milestoneActualCost.toLocaleString()}
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ChartCard title="Project Status Overview">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dashboardData.projectStatusOverview}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Not Started" stackId="a" fill={STATUS_COLORS.not_started} />
            <Bar dataKey="In Progress" stackId="a" fill={STATUS_COLORS.in_progress} />
            <Bar
              dataKey="Awaiting Report"
              stackId="a"
              fill={STATUS_COLORS.awaiting_report_submission}
            />
            <Bar dataKey="Under Review" stackId="a" fill={STATUS_COLORS.under_review} />
            <Bar dataKey="Completed" stackId="a" fill={STATUS_COLORS.completed} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Planned vs Actual Timeline (Per Project)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.plannedVsActualTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={90} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="plannedDuration" fill="#3B82F6" name="Planned Duration (days)" />
              <Bar dataKey="actualDuration" fill="#10B981" name="Actual Duration (days)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Project Delay Analysis">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.delayAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={90} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="delayDays" name="Delay Days">
                {dashboardData.delayAnalysis.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                    fill={entry.delayDays > 0 ? '#EF4444' : '#10B981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Task Status Breakdown">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboardData.taskStatusBreakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={110}
                label
              >
                {dashboardData.taskStatusBreakdown.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.name === 'Not Started'
                        ? TASK_STATUS_COLORS.not_started
                        : entry.name === 'In Progress'
                          ? TASK_STATUS_COLORS.in_progress
                          : TASK_STATUS_COLORS.completed
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Milestone Completion Rate">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.milestoneCompletionRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={90} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completedMilestones" stackId="a" fill="#10B981" name="Completed" />
              <Bar dataKey="remainingMilestones" stackId="a" fill="#D1D5DB" name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Planned vs Actual Cost (Per Project)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dashboardData.plannedVsActualCost}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={90} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="plannedCost" fill="#3B82F6" name="Planned Cost" />
            <Bar dataKey="actualCost" fill="#10B981" name="Actual Cost" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

export default DashboardResearch;