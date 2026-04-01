// screens/subtabs/ActiveAgendas.tsx
import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { Agenda } from '@/types';
import AgendaInformation from '../AgendaInformation';
import ProjectManagement from '../ProjectManagement';

type ViewMode = 'list' | 'agenda' | 'project';

type SelectedItem = {
  agenda: Agenda;
  itemId: string;
  itemName: string;
} | null;

type AgendaTableRow = Agenda & {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  awaitingReportProjects: number;
  underReviewProjects: number;
  inProgressProjects: number;
  notStartedProjects: number;
  mainStatus: Agenda['status'];
};

const ActiveAgendas = () => {
  const { agendas, projects, updateAgenda } = useApp();

  const [activeAgendas, setActiveAgendas] = useState<AgendaTableRow[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const [selectedProjectItem, setSelectedProjectItem] = useState<SelectedItem>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    loadActiveAgendas();
  }, [agendas, projects]);

  const loadActiveAgendas = () => {
    const approved = agendas.filter((agenda) => agenda.status === 'approved');

    const filtered: AgendaTableRow[] = approved
      .map((agenda) => {
        const agendaProjects = projects.filter((p) => p.agendaId === agenda.id);

        const activeItems = agenda.items.filter((item) => {
          const linkedProject = projects.find(
            (p) => p.agendaId === agenda.id && p.agendaItemId === item.id
          );

          if (!linkedProject) return true;
          return linkedProject.status !== 'completed';
        });

        const totalProjects = agenda.items.length;

        const completedProjects = agendaProjects.filter(
          (p) => p.status === 'completed'
        ).length;

        const awaitingReportProjects = agendaProjects.filter(
          (p) => p.status === 'awaiting_report_submission'
        ).length;

        const underReviewProjects = agendaProjects.filter(
          (p) => p.status === 'under_review'
        ).length;

        const inProgressProjects = agendaProjects.filter(
          (p) => p.status === 'in_progress'
        ).length;

        const notStartedProjects =
          totalProjects -
          completedProjects -
          awaitingReportProjects -
          underReviewProjects -
          inProgressProjects;

        const activeProjects = totalProjects - completedProjects;

        return {
          ...agenda,
          items: activeItems,
          totalProjects,
          activeProjects,
          completedProjects,
          awaitingReportProjects,
          underReviewProjects,
          inProgressProjects,
          notStartedProjects: Math.max(0, notStartedProjects),
          mainStatus: agenda.status,
        };
      })
      .filter((agenda) => agenda.items.length > 0)
      .sort((a, b) => {
        const dateA = a.approvedAt || a.updatedAt;
        const dateB = b.approvedAt || b.updatedAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

    setActiveAgendas(filtered);
  };

  const handleViewAgenda = (agenda: Agenda) => {
    setSelectedAgenda(agenda);
    setViewMode('agenda');
  };

  const handleManageProject = (agendaId: string, itemId: string, itemName: string) => {
    const agenda = activeAgendas.find((a) => a.id === agendaId);
    if (agenda) {
      setSelectedProjectItem({ agenda, itemId, itemName });
      setViewMode('project');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedAgenda(null);
    setSelectedProjectItem(null);
  };

  const handleSaveAgenda = (updatedAgenda: Agenda) => {
    updateAgenda(updatedAgenda.id, updatedAgenda);
    setViewMode('list');
    setSelectedAgenda(null);
  };

  const getMainStatusBadgeColor = (status: Agenda['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'forum_review':
        return 'bg-blue-100 text-blue-800';
      case 'chief_director_review':
        return 'bg-purple-100 text-purple-800';
      case 'ceo_approval_pending':
        return 'bg-orange-100 text-orange-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgendaStatusLabel = (status: Agenda['status']) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'draft':
        return 'Draft';
      case 'forum_review':
        return 'Forum Review';
      case 'chief_director_review':
        return 'Chief Director Review';
      case 'ceo_approval_pending':
        return 'CEO Approval Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  if (viewMode === 'agenda' && selectedAgenda) {
    return (
      <AgendaInformation
        agenda={selectedAgenda}
        onSave={handleSaveAgenda}
        onCancel={handleBackToList}
        onManageProject={handleManageProject}
      />
    );
  }

  if (viewMode === 'project' && selectedProjectItem) {
    return (
      <ProjectManagement
        agenda={selectedProjectItem.agenda}
        agendaItemId={selectedProjectItem.itemId}
        agendaItemName={selectedProjectItem.itemName}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Active Agendas</h3>
        <p className="text-gray-600 mt-1">
          View approved agendas and monitor active project progress
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {activeAgendas.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <span className="text-6xl">✅</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Agendas</h3>
            <p className="text-gray-500">
              Approved agendas with active project items will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agenda Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Main Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Awaiting Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Under Review
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Not Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {activeAgendas.map((agenda) => (
                  <tr key={agenda.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{agenda.name}</div>
                      {agenda.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {agenda.description}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMainStatusBadgeColor(
                          agenda.mainStatus
                        )}`}
                      >
                        {getAgendaStatusLabel(agenda.mainStatus)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {agenda.totalProjects}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {agenda.activeProjects}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-medium">
                      {agenda.completedProjects}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-700 font-medium">
                      {agenda.awaitingReportProjects}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-medium">
                      {agenda.underReviewProjects}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-700 font-medium">
                      {agenda.inProgressProjects}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {agenda.notStartedProjects}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agenda.createdBy}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agenda.approvedAt
                        ? new Date(agenda.approvedAt).toLocaleDateString()
                        : '-'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewAgenda(agenda)}
                        className="text-primary hover:text-primary/80 mr-3"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveAgendas;