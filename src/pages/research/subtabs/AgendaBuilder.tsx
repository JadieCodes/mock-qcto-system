// screens/subtabs/AgendaBuilder.tsx
import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { Agenda } from '@/types';
import AgendaInformation from '../AgendaInformation';

type ViewMode = 'list' | 'edit';

const AgendaBuilder = () => {
  const { currentUser, agendas, setAgendas, addAgenda, updateAgenda } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAgenda, setSelectedAgenda] = useState<Agenda | null>(null);

  // Filter out approved agendas - they should only appear in ActiveAgendas
  const nonApprovedAgendas = agendas.filter(agenda => 
    agenda.status !== 'approved'
  );

  const handleCreateNew = () => {
    setSelectedAgenda(null);
    setViewMode('edit');
  };

  const handleEdit = (agenda: Agenda) => {
    setSelectedAgenda(agenda);
    setViewMode('edit');
  };

  const handleSave = (agenda: Agenda) => {
    if (selectedAgenda) {
      updateAgenda(agenda.id, agenda);
    } else {
      addAgenda(agenda);
    }
    setViewMode('list');
    setSelectedAgenda(null);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedAgenda(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this agenda?')) {
      setAgendas(prev => prev.filter(a => a.id !== id));
    }
  };

  const getStatusBadgeColor = (status: Agenda['status']) => {
    switch (status) {
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

  const getStatusDisplayName = (status: Agenda['status']) => {
    switch (status) {
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

  if (viewMode === 'edit') {
    return (
      <AgendaInformation
        agenda={selectedAgenda}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Agenda Builder</h3>
          <p className="text-gray-600 mt-1">Create and manage meeting agendas</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          Create Agenda
        </button>
      </div>

      {/* Agendas Table - Shows all agendas EXCEPT approved ones */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agenda Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {nonApprovedAgendas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No agendas found. Click "Create Agenda" to get started.
                </td>
              </tr>
            ) : (
              nonApprovedAgendas.map((agenda) => (
                <tr key={agenda.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{agenda.name}</div>
                    {agenda.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">{agenda.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(agenda.status)}`}>
                      {getStatusDisplayName(agenda.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agenda.items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agenda.createdBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agenda.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(agenda)}
                      className="text-primary hover:text-primary/80 mr-3"
                    >
                      {agenda.status === 'draft' ? 'Edit' : 'View'}
                    </button>
                    {agenda.status === 'draft' && (
                      <button
                        onClick={() => handleDelete(agenda.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgendaBuilder;