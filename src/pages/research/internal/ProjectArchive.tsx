// screens/ProjectArchive.tsx
import React, { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { Agenda } from '@/types';
import AgendaInformation from '../AgendaInformation';
import ProjectManagement from '../ProjectManagement';

type ViewMode = 'list' | 'agenda' | 'project';

type SelectedProjectItem = {
  agenda: Agenda;
  itemId: string;
  itemName: string;
} | null;

type ArchivedAgendaRow = Agenda & {
  totalProjects: number;
  archivedProjects: number;
  mainStatus: 'Completed' | 'Partially Archived';
};

const ProjectArchive = () => {
  const { agendas, projects } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);
  const [selectedProjectItem, setSelectedProjectItem] = useState<SelectedProjectItem>(null);

  const archivedAgendas = useMemo<ArchivedAgendaRow[]>(() => {
    return agendas
      .filter((agenda) => agenda.status === 'approved')
      .map((agenda) => {
        const archivedItems = agenda.items.filter((item) => {
          const linkedProject = projects.find(
            (p) => p.agendaId === agenda.id && p.agendaItemId === item.id
          );
          return linkedProject?.status === 'completed';
        });

        const totalProjects = agenda.items.length;
        const archivedProjects = archivedItems.length;

        return {
          ...agenda,
          items: archivedItems,
          totalProjects,
          archivedProjects,
          mainStatus:
            archivedProjects === totalProjects
              ? ('Completed' as const)
              : ('Partially Archived' as const),
        };
      })
      .filter((agenda) => agenda.items.length > 0)
      .sort((a, b) => {
        const dateA = a.approvedAt || a.updatedAt;
        const dateB = b.approvedAt || b.updatedAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [agendas, projects]);

  const handleViewAgenda = (agenda: Agenda) => {
    setSelectedAgenda(agenda);
    setViewMode('agenda');
  };

  const handleManageArchivedProject = (
    agendaId: string,
    itemId: string,
    itemName: string
  ) => {
    const agenda = archivedAgendas.find((a) => a.id === agendaId);
    if (!agenda) return;

    setSelectedProjectItem({
      agenda,
      itemId,
      itemName,
    });
    setViewMode('project');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedAgenda(null);
    setSelectedProjectItem(null);
  };

  const getStatusBadgeColor = (status: ArchivedAgendaRow['mainStatus']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Partially Archived':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (viewMode === 'agenda' && selectedAgenda) {
    return (
      <AgendaInformation
        agenda={selectedAgenda}
        onSave={() => {}}
        onCancel={handleBackToList}
        onManageProject={handleManageArchivedProject}
      />
    );
  }

  if (viewMode === 'project' && selectedProjectItem) {
    return (
      <ProjectManagement
        agenda={selectedProjectItem.agenda}
        agendaItemId={selectedProjectItem.itemId}
        agendaItemName={selectedProjectItem.itemName}
        onBack={() => {
          setViewMode('agenda');
          setSelectedAgenda(selectedProjectItem.agenda);
          setSelectedProjectItem(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Archive</h1>
        <p className="text-gray-600 mt-1">
          Archived agendas and completed project items
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {archivedAgendas.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <span className="text-6xl">📁</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Archived Agendas
            </h3>
            <p className="text-gray-500">
              Completed project items will appear here.
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
                    Archived Projects
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
                {archivedAgendas.map((agenda) => (
                  <tr key={agenda.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {agenda.name}
                      </div>
                      {agenda.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {agenda.description}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          agenda.mainStatus
                        )}`}
                      >
                        {agenda.mainStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                      {agenda.totalProjects}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-medium">
                      {agenda.archivedProjects}
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
                        className="text-primary hover:text-primary/80"
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

export default ProjectArchive;