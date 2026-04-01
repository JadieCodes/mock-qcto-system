import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { Agenda, ProjectMilestone } from '@/types';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Play,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  FolderOpen,
  Paperclip,
  Save,
  Upload,
  Building2,
  Pencil,
  Trash2,
} from 'lucide-react';

interface ProjectManagementProps {
  agenda: Agenda;
  agendaItemId: string;
  agendaItemName: string;
  onBack: () => void;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({
  agenda,
  agendaItemId,
  agendaItemName,
  onBack,
}) => {
  const {
    projects,
    addProject,
    updateProject,
    addMilestone,
    updateMilestone,
    addTask,
    updateTask,
    startTask,
    completeTask,
    submitProjectReport,
    approveProjectReport,
    rejectProjectReport,
    currentUser,
    currentRole,
    deleteMilestone,
    deleteTask,
  } = useApp();

  const agendaItem =
    agenda.items.find((item) => item.id === agendaItemId) || null;

  const isExternalProject = agendaItem?.type === 'external';

  const project =
    projects.find(
      (p) => p.agendaId === agenda.id && p.agendaItemId === agendaItemId
    ) || null;

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState<{ milestoneId: string } | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const projectCreatedRef = useRef(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  const [editingTask, setEditingTask] = useState<{ milestoneId: string; task: any } | null>(null);

  const [newMilestone, setNewMilestone] = useState({
    name: '',
    type: 'Report' as 'Report' | 'Invoice' | 'Tranche',
    description: '',
    plannedStart: '',
    plannedEnd: '',
    plannedCost: 0,
  });

  const [editMilestoneForm, setEditMilestoneForm] = useState({
    name: '',
    type: 'Report' as 'Report' | 'Invoice' | 'Tranche',
    description: '',
    plannedStart: '',
    plannedEnd: '',
    plannedCost: 0,
  });

  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    responsiblePerson: '',
    responsiblePersonName: '',
    plannedStart: '',
    plannedEnd: '',
    plannedCost: 0,
  });

  const [editTaskForm, setEditTaskForm] = useState({
    name: '',
    description: '',
    responsiblePerson: '',
    responsiblePersonName: '',
    plannedStart: '',
    plannedEnd: '',
    plannedCost: 0,
  });

  const [taskProgressForm, setTaskProgressForm] = useState<
    Record<
      string,
      {
        fileName: string;
        fileType: string;
        fileSize: string;
        fileData: string;
        outcome: string;
        actualCost: string;
      }
    >
  >({});

  const [finalReportForm, setFinalReportForm] = useState({
    fileName: '',
    fileType: '',
    fileSize: '',
    fileData: '',
    reviewComments: '',
  });

  const [externalProjectForm, setExternalProjectForm] = useState({
    companyName: '',
    torFileName: '',
    torFileType: '',
    torFileSize: '',
    torFileData: '',
    slaFileName: '',
    slaFileType: '',
    slaFileSize: '',
    slaFileData: '',
  });

  useEffect(() => {
    const existingProject = projects.find(
      (p) => p.agendaId === agenda.id && p.agendaItemId === agendaItemId
    );

    if (!existingProject && !projectCreatedRef.current) {
      projectCreatedRef.current = true;
      addProject({
        agendaId: agenda.id,
        agendaItemId,
        name: agendaItemName,
        description: `Project based on agenda item: ${agendaItemName}`,
        milestones: [],
        status: 'not_started',
        createdBy: 'Research Director',
        isExternal: isExternalProject,
        companyName: '',
      });
    }
  }, [projects, agenda.id, agendaItemId, agendaItemName, addProject, isExternalProject]);

  useEffect(() => {
    if (!project) return;

    setExternalProjectForm({
      companyName: project.companyName || '',
      torFileName: project.torDocument?.fileName || '',
      torFileType: project.torDocument?.fileType || '',
      torFileSize:
        project.torDocument?.fileSize !== undefined
          ? String(project.torDocument.fileSize)
          : '',
      torFileData: project.torDocument?.fileData || '',
      slaFileName: project.slaDocument?.fileName || '',
      slaFileType: project.slaDocument?.fileType || '',
      slaFileSize:
        project.slaDocument?.fileSize !== undefined
          ? String(project.slaDocument.fileSize)
          : '',
      slaFileData: project.slaDocument?.fileData || '',
    });
  }, [project]);

  const handleExternalFileUpload = (
    file: File,
    type: 'tor' | 'sla'
  ) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;

      if (type === 'tor') {
        setExternalProjectForm((prev) => ({
          ...prev,
          torFileName: file.name,
          torFileType: file.type,
          torFileSize: String(file.size),
          torFileData: base64,
        }));
      } else {
        setExternalProjectForm((prev) => ({
          ...prev,
          slaFileName: file.name,
          slaFileType: file.type,
          slaFileSize: String(file.size),
          slaFileData: base64,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveExternalProjectInfo = () => {
    if (!project) return;

    updateProject(project.id, {
      isExternal: true,
      companyName: externalProjectForm.companyName.trim(),
      torDocument: externalProjectForm.torFileData
        ? {
            fileName: externalProjectForm.torFileName,
            fileType: externalProjectForm.torFileType,
            fileSize: Number(externalProjectForm.torFileSize),
            fileData: externalProjectForm.torFileData,
            uploadedAt: new Date(),
            uploadedBy: currentUser.name,
          }
        : project.torDocument,
      slaDocument: externalProjectForm.slaFileData
        ? {
            fileName: externalProjectForm.slaFileName,
            fileType: externalProjectForm.slaFileType,
            fileSize: Number(externalProjectForm.slaFileSize),
            fileData: externalProjectForm.slaFileData,
            uploadedAt: new Date(),
            uploadedBy: currentUser.name,
          }
        : project.slaDocument,
    });
  };

  const handleAddMilestone = () => {
    if (!project) return;

    addMilestone(project.id, {
      name: newMilestone.name,
      type: newMilestone.type,
      description: newMilestone.description,
      plannedTime: {
        start: newMilestone.plannedStart,
        end: newMilestone.plannedEnd,
      },
      plannedCost: newMilestone.plannedCost,
    });

    setNewMilestone({
      name: '',
      type: 'Report',
      description: '',
      plannedStart: '',
      plannedEnd: '',
      plannedCost: 0,
    });
    setShowMilestoneForm(false);
  };

  const handleUpdateMilestone = () => {
    if (!project || !editingMilestone) return;

    updateMilestone(project.id, editingMilestone.id, {
      name: editMilestoneForm.name,
      type: editMilestoneForm.type,
      description: editMilestoneForm.description,
      plannedTime: {
        start: editMilestoneForm.plannedStart,
        end: editMilestoneForm.plannedEnd,
      },
      plannedCost: editMilestoneForm.plannedCost,
    });

    setEditingMilestone(null);
  };

  const handleAddTask = (milestoneId: string) => {
    if (!project) return;

    addTask(project.id, milestoneId, {
      name: newTask.name,
      description: newTask.description,
      responsiblePerson: newTask.responsiblePerson,
      responsiblePersonName: newTask.responsiblePersonName,
      plannedTime: {
        start: newTask.plannedStart,
        end: newTask.plannedEnd,
      },
      plannedCost: newTask.plannedCost,
    });

    setNewTask({
      name: '',
      description: '',
      responsiblePerson: '',
      responsiblePersonName: '',
      plannedStart: '',
      plannedEnd: '',
      plannedCost: 0,
    });
    setShowTaskForm(null);
  };

  const handleUpdateTask = () => {
    if (!project || !editingTask) return;

    updateTask(project.id, editingTask.milestoneId, editingTask.task.id, {
      name: editTaskForm.name,
      description: editTaskForm.description,
      responsiblePerson: editTaskForm.responsiblePerson,
      responsiblePersonName: editTaskForm.responsiblePersonName,
      plannedTime: {
        start: editTaskForm.plannedStart,
        end: editTaskForm.plannedEnd,
      },
      plannedCost: editTaskForm.plannedCost,
    });

    setEditingTask(null);
  };

  const getTaskFormState = (taskId: string, task?: any) => {
    return taskProgressForm[taskId] || {
      fileName: task?.evidence?.fileName || '',
      fileType: task?.evidence?.fileType || '',
      fileSize: task?.evidence?.fileSize?.toString() || '',
      fileData: task?.evidence?.fileData || '',
      outcome: task?.outcome || '',
      actualCost:
        task?.actualCost !== undefined && task?.actualCost !== null
          ? String(task.actualCost)
          : '',
    };
  };

  const updateTaskFormState = (
    taskId: string,
    field: 'fileName' | 'fileType' | 'fileSize' | 'fileData' | 'outcome' | 'actualCost',
    value: string
  ) => {
    setTaskProgressForm((prev) => ({
      ...prev,
      [taskId]: {
        ...getTaskFormState(taskId),
        ...prev[taskId],
        [field]: value,
      },
    }));
  };

  const handleSaveTaskProgress = (milestoneId: string, task: any) => {
    if (!project) return;

    const form = getTaskFormState(task.id, task);

    updateTask(project.id, milestoneId, task.id, {
      evidence: form.fileData
        ? {
            fileName: form.fileName,
            fileType: form.fileType,
            fileSize: Number(form.fileSize),
            fileData: form.fileData,
          }
        : undefined,
      outcome: form.outcome.trim(),
      actualCost:
        form.actualCost.trim() !== '' ? Number(form.actualCost) : undefined,
    });
  };

  const handleCompleteTask = (milestoneId: string, task: any) => {
    if (!project) return;

    const form = getTaskFormState(task.id, task);

    updateTask(project.id, milestoneId, task.id, {
      evidence: form.fileData
        ? {
            fileName: form.fileName,
            fileType: form.fileType,
            fileSize: Number(form.fileSize),
            fileData: form.fileData,
          }
        : undefined,
      outcome: form.outcome.trim(),
      actualCost:
        form.actualCost.trim() !== '' ? Number(form.actualCost) : undefined,
    });

    completeTask(
      project.id,
      milestoneId,
      task.id,
      form.actualCost.trim() !== '' ? Number(form.actualCost) : undefined
    );
  };

  const handleSubmitFinalReport = () => {
    if (!project) return;
    if (!finalReportForm.fileData) {
      alert('Please upload the final project report');
      return;
    }

    submitProjectReport(
      project.id,
      {
        fileName: finalReportForm.fileName,
        fileType: finalReportForm.fileType,
        fileSize: Number(finalReportForm.fileSize),
        fileData: finalReportForm.fileData,
      },
      currentUser.name
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
      case 'under_review':
      case 'awaiting_report_submission':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'awaiting_report_submission':
        return 'Awaiting Report Submission';
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

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">{agendaItemName}</h1>
            </div>
            <p className="text-gray-600 mt-1">Project from agenda: {agenda.name}</p>
          </div>
        </div>

        {project && (
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
            {getStatusLabel(project.status)}
          </span>
        )}
      </div>

      {project && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Actual Start</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {project.actualStartDate
                ? new Date(project.actualStartDate).toLocaleDateString()
                : '-'}
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Actual End</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {project.actualEndDate
                ? new Date(project.actualEndDate).toLocaleDateString()
                : '-'}
            </p>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Actual Cost</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {project.actualCost !== undefined && project.actualCost !== null
                ? `ZAR ${project.actualCost.toLocaleString()}`
                : '-'}
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Milestones</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {project.milestones.length} (
              {project.milestones.filter((m) => m.status === 'completed').length} completed)
            </p>
          </div>
        </div>
      )}

      {/* Rest of your existing JSX for finalReport, finalReview, etc. */}
      {project?.finalReport && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Final Project Report</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Paperclip className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <a
                  href={project.finalReport.fileData}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline truncate block"
                >
                  {project.finalReport.fileName}
                </a>
                <p className="text-xs text-gray-500">
                  Uploaded by {project.finalReport.uploadedBy}
                </p>
              </div>
            </div>
            <a
              href={project.finalReport.fileData}
              download={project.finalReport.fileName}
              className="text-sm text-blue-600 hover:underline shrink-0"
            >
              Download
            </a>
          </div>
        </div>
      )}

      {project?.finalReview && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Final Review</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Reviewed by:</span> {project.finalReview.reviewedBy}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Role:</span> {project.finalReview.reviewRole}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Decision:</span>{' '}
              {project.finalReview.decision === 'approve' ? 'Approved' : 'Rejected'}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Reviewed at:</span>{' '}
              {new Date(project.finalReview.reviewedAt).toLocaleDateString()}
            </p>
            {project.finalReview.comments && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Comments:</span> {project.finalReview.comments}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Keep your existing report submission and review sections */}
      {project?.status === 'awaiting_report_submission' && currentRole === 'Research Deputy Director' && (
        <div className="bg-white rounded-lg border border-orange-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {project.finalReview?.decision === 'reject' 
              ? 'Resubmit Updated Final Project Report' 
              : 'Submit Final Project Report'}
          </h3>
          {project.finalReview?.decision === 'reject' && project.finalReview.comments && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 mb-1">Rejection Feedback:</p>
              <p className="text-sm text-red-700">{project.finalReview.comments}</p>
              <p className="text-xs text-red-600 mt-2">
                Please review the feedback above, make necessary updates, and resubmit your report.
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Final Report Document {project.finalReview?.decision === 'reject' && <span className="text-red-500">* (Updated version required)</span>}
            </label>
            {finalReportForm.fileData ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <a href={finalReportForm.fileData} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate block">
                      {finalReportForm.fileName}
                    </a>
                    <p className="text-xs text-gray-500">
                      {(Number(finalReportForm.fileSize) / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <label className="text-sm text-primary hover:underline cursor-pointer shrink-0">
                  Change file
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = reader.result as string;
                      setFinalReportForm((prev) => ({
                        ...prev,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: String(file.size),
                        fileData: base64,
                      }));
                    };
                    reader.readAsDataURL(file);
                  }} />
                </label>
              </div>
            ) : (
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = reader.result as string;
                  setFinalReportForm((prev) => ({
                    ...prev,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: String(file.size),
                    fileData: base64,
                  }));
                };
                reader.readAsDataURL(file);
              }} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            )}
          </div>
          <div className="flex justify-end">
            <button onClick={handleSubmitFinalReport} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {project.finalReview?.decision === 'reject' ? 'Resubmit Updated Report' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}

      {project?.status === 'under_review' && currentRole === 'Research Chief Director' && (
        <div className="bg-white rounded-lg border border-blue-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Chief Director Project Review</h3>
          {project.finalReport && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{project.finalReport.fileName}</p>
                  <p className="text-sm text-gray-500">
                    Uploaded by {project.finalReport.uploadedBy} on{' '}
                    {new Date(project.finalReport.uploadedAt).toLocaleDateString()}
                  </p>
                  {project.finalReview?.decision === 'reject' && (
                    <p className="text-xs text-red-600 mt-1">Previous version was rejected. This is a resubmission.</p>
                  )}
                </div>
                <a href={project.finalReport.fileData} download={project.finalReport.fileName} className="text-blue-600 hover:underline">Download Report</a>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Comments {project.finalReview?.decision === 'reject' && <span className="text-red-500">* (Required for rejection)</span>}
            </label>
            <textarea
              value={finalReportForm.reviewComments}
              onChange={(e) => setFinalReportForm((prev) => ({ ...prev, reviewComments: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter your review comments and feedback for the project team..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => {
              if (!finalReportForm.reviewComments.trim()) {
                alert('Please provide comments explaining why the report is being rejected.');
                return;
              }
              rejectProjectReport(project.id, currentUser.name, currentRole, finalReportForm.reviewComments);
              setFinalReportForm((prev) => ({ ...prev, reviewComments: '' }));
            }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Reject Report</button>
            <button onClick={() => {
              approveProjectReport(project.id, currentUser.name, currentRole, finalReportForm.reviewComments);
              setFinalReportForm((prev) => ({ ...prev, reviewComments: '' }));
            }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Approve Project</button>
          </div>
        </div>
      )}

      {project?.finalReview?.decision === 'reject' && project?.status === 'awaiting_report_submission' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Report Rejected</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>The report was rejected by {project.finalReview.reviewedBy} on{' '}
                {new Date(project.finalReview.reviewedAt).toLocaleDateString()}.</p>
                {project.finalReview.comments && (
                  <p className="mt-1 font-medium">Reason: {project.finalReview.comments}</p>
                )}
                <p className="mt-2">Please upload an updated report addressing the feedback above.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milestones Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Milestones</h2>
          {project?.status !== 'completed' &&
            project?.status !== 'under_review' &&
            project?.status !== 'awaiting_report_submission' && (
              <button
                onClick={() => setShowMilestoneForm(true)}
                className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Milestone
              </button>
            )}
        </div>

        {project?.milestones.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No milestones added yet. Click "Add Milestone" to get started.</p>
        ) : (
          <div className="space-y-6">
            {project?.milestones.map((milestone) => (
              <div key={milestone.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-white p-5 border-b border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        {getStatusIcon(milestone.status)}
                        <h3 className="text-lg font-semibold text-gray-900 break-words">{milestone.name}</h3>
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{milestone.type}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(milestone.status)}`}>
                        {milestone.status === 'completed' ? 'Completed' : milestone.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                      </span>
                      {milestone.status === 'not_started' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditMilestoneForm({
                                name: milestone.name,
                                type: milestone.type,
                                description: milestone.description || '',
                                plannedStart: formatDateForInput(milestone.plannedTime.start),
                                plannedEnd: formatDateForInput(milestone.plannedTime.end),
                                plannedCost: milestone.plannedCost,
                              });
                              setEditingMilestone(milestone);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Edit Milestone"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete milestone "${milestone.name}"? This action cannot be undone.`)) {
                                deleteMilestone(project.id, milestone.id);
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete Milestone"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-900 leading-relaxed">{milestone.description || 'No description provided'}</p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Planned Start Date</p>
                      <p className="text-sm font-semibold text-gray-900">{new Date(milestone.plannedTime.start).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Planned End Date</p>
                      <p className="text-sm font-semibold text-gray-900">{new Date(milestone.plannedTime.end).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Planned Cost</p>
                      <p className="text-sm font-semibold text-gray-900">ZAR {milestone.plannedCost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Tasks Section */}
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-700">Tasks</h4>
                    {project.status !== 'completed' &&
                      project.status !== 'under_review' &&
                      project.status !== 'awaiting_report_submission' && (
                        <button
                          onClick={() => setShowTaskForm({ milestoneId: milestone.id })}
                          className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add Task
                        </button>
                      )}
                  </div>

                  {milestone.tasks.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm">No tasks added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {milestone.tasks.map((task) => {
                        const isExpanded = expandedTaskId === task.id;
                        const form = getTaskFormState(task.id, task);

                        return (
                          <div key={task.id} className="border border-gray-100 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedTaskId((prev) => (prev === task.id ? null : task.id))}
                              className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {task.status === 'completed' ? (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : task.status === 'in_progress' ? (
                                      <Play className="h-4 w-4 text-yellow-500" />
                                    ) : (
                                      <Clock className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className="font-medium">{task.name}</span>
                                  </div>
                                  <div className="mt-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</h4>
                                    <p className="text-sm text-gray-600">{task.description}</p>
                                  </div>
                                  <div className="mt-3 grid grid-cols-3 gap-3">
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Planned Start</p>
                                      <p className="text-sm font-medium text-gray-700">
                                        {task.plannedTime?.start ? new Date(task.plannedTime.start).toLocaleDateString() : '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Planned End</p>
                                      <p className="text-sm font-medium text-gray-700">
                                        {task.plannedTime?.end ? new Date(task.plannedTime.end).toLocaleDateString() : '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 mb-0.5">Planned Cost</p>
                                      <p className="text-sm font-medium text-gray-700">
                                        {task.plannedCost !== undefined && task.plannedCost !== null ? `ZAR ${task.plannedCost.toLocaleString()}` : '-'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(task.status)}`}>
                                      {task.status === 'completed' ? 'Completed' : task.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                    </span>
                                    {task.status === 'not_started' && (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditTaskForm({
                                              name: task.name,
                                              description: task.description,
                                              responsiblePerson: task.responsiblePerson,
                                              responsiblePersonName: task.responsiblePersonName,
                                              plannedStart: formatDateForInput(task.plannedTime?.start || ''),
                                              plannedEnd: formatDateForInput(task.plannedTime?.end || ''),
                                              plannedCost: task.plannedCost,
                                            });
                                            setEditingTask({ milestoneId: milestone.id, task });
                                          }}
                                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                          title="Edit Task"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Are you sure you want to delete task "${task.name}"? This action cannot be undone.`)) {
                                              deleteTask(project.id, milestone.id, task.id);
                                            }
                                          }}
                                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                                          title="Delete Task"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                  <button className="pt-1">
                                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                                  </button>
                                </div>
                              </div>
                              <div className="mt-3 flex justify-end border-t border-gray-100 pt-2">
                                <p className="text-xs text-gray-500">Responsible: {task.responsiblePersonName || '-'}</p>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                                {/* Keep your existing expanded task content */}
                                {task.status === 'not_started' &&
                                  project.status !== 'completed' &&
                                  project.status !== 'under_review' &&
                                  project.status !== 'awaiting_report_submission' && (
                                    <div className="flex justify-end">
                                      <button onClick={() => startTask(project.id, milestone.id, task.id)} className="px-3 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Start Task</button>
                                    </div>
                                  )}
                                {(task.status === 'in_progress' || task.status === 'completed') && (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Document</label>
                                      {(form.fileData || task.evidence?.fileData) ? (
                                        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <Paperclip className="h-4 w-4 text-blue-500 shrink-0" />
                                            <div className="min-w-0">
                                              <a href={form.fileData || task.evidence?.fileData} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate block">
                                                {form.fileName || task.evidence?.fileName || 'Uploaded document'}
                                              </a>
                                              <p className="text-xs text-gray-500">
                                                {form.fileSize ? `${(Number(form.fileSize) / 1024).toFixed(1)} KB` : task.evidence?.fileSize ? `${(task.evidence.fileSize / 1024).toFixed(1)} KB` : ''}
                                              </p>
                                            </div>
                                          </div>
                                          {task.status !== 'completed' && (
                                            <label className="text-sm text-primary hover:underline cursor-pointer shrink-0">
                                              Change file
                                              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" className="hidden" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = () => {
                                                  const base64 = reader.result as string;
                                                  updateTaskFormState(task.id, 'fileName', file.name);
                                                  updateTaskFormState(task.id, 'fileType', file.type);
                                                  updateTaskFormState(task.id, 'fileSize', String(file.size));
                                                  updateTaskFormState(task.id, 'fileData', base64);
                                                };
                                                reader.readAsDataURL(file);
                                              }} />
                                            </label>
                                          )}
                                        </div>
                                      ) : (
                                        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" disabled={task.status === 'completed'} onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            const base64 = reader.result as string;
                                            updateTaskFormState(task.id, 'fileName', file.name);
                                            updateTaskFormState(task.id, 'fileType', file.type);
                                            updateTaskFormState(task.id, 'fileSize', String(file.size));
                                            updateTaskFormState(task.id, 'fileData', base64);
                                          };
                                          reader.readAsDataURL(file);
                                        }} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100" />
                                      )}
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                                      <textarea value={form.outcome} onChange={(e) => updateTaskFormState(task.id, 'outcome', e.target.value)} disabled={task.status === 'completed'} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100" />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost (ZAR)</label>
                                      <input type="number" value={form.actualCost} onChange={(e) => updateTaskFormState(task.id, 'actualCost', e.target.value)} disabled={task.status === 'completed'} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100" />
                                    </div>
                                    {task.status === 'in_progress' && (
                                      <div className="flex justify-end gap-3">
                                        <button onClick={() => handleSaveTaskProgress(milestone.id, task)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                          <Save className="h-4 w-4" /> Save Progress
                                        </button>
                                        <button onClick={() => handleCompleteTask(milestone.id, task)} className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">Complete Task</button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Milestone Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Milestone</h3>
            <div className="space-y-4">
              <input type="text" value={editMilestoneForm.name} onChange={(e) => setEditMilestoneForm({ ...editMilestoneForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Milestone name" />
              <select value={editMilestoneForm.type} onChange={(e) => setEditMilestoneForm({ ...editMilestoneForm, type: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="Report">Report</option>
                <option value="Invoice">Invoice</option>
                <option value="Tranche">Tranche</option>
              </select>
              <textarea value={editMilestoneForm.description} onChange={(e) => setEditMilestoneForm({ ...editMilestoneForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Description" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Start Date</label>
              <input type="date" value={editMilestoneForm.plannedStart} onChange={(e) => setEditMilestoneForm({ ...editMilestoneForm, plannedStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned End Date</label>
              <input type="date" value={editMilestoneForm.plannedEnd} onChange={(e) => setEditMilestoneForm({ ...editMilestoneForm, plannedEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Cost</label>
              <input type="number" value={editMilestoneForm.plannedCost} onChange={(e) => setEditMilestoneForm({ ...editMilestoneForm, plannedCost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Planned Cost" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingMilestone(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
              <button onClick={handleUpdateMilestone} className="px-4 py-2 bg-primary text-white rounded-lg">Update Milestone</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Task</h3>
            <div className="space-y-4">
              <input type="text" value={editTaskForm.name} onChange={(e) => setEditTaskForm({ ...editTaskForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Task name" />
              <textarea value={editTaskForm.description} onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Description" />
              <select value={editTaskForm.responsiblePerson} onChange={(e) => setEditTaskForm({ ...editTaskForm, responsiblePerson: e.target.value, responsiblePersonName: e.target.options[e.target.selectedIndex].text })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select Responsible Person</option>
                <option value="user1">John Smith</option>
                <option value="user2">Sarah Johnson</option>
                <option value="user3">Michael Brown</option>
              </select>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Start Date</label>
              <input type="date" value={editTaskForm.plannedStart} onChange={(e) => setEditTaskForm({ ...editTaskForm, plannedStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned End Date</label>
              <input type="date" value={editTaskForm.plannedEnd} onChange={(e) => setEditTaskForm({ ...editTaskForm, plannedEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Cost</label>
              <input type="number" value={editTaskForm.plannedCost} onChange={(e) => setEditTaskForm({ ...editTaskForm, plannedCost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Planned cost" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingTask(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
              <button onClick={handleUpdateTask} className="px-4 py-2 bg-primary text-white rounded-lg">Update Task</button>
            </div>
          </div>
        </div>
      )}

      {/* External Project Information */}
      {project && isExternalProject && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">External Project Information</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input type="text" value={externalProjectForm.companyName} onChange={(e) => setExternalProjectForm((prev) => ({ ...prev, companyName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Enter company name" disabled={project.status === 'completed'} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">TOR Document</label>
              {externalProjectForm.torFileData ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <a href={externalProjectForm.torFileData} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate block">{externalProjectForm.torFileName}</a>
                      <p className="text-xs text-gray-500">{externalProjectForm.torFileSize ? `${(Number(externalProjectForm.torFileSize) / 1024).toFixed(1)} KB` : ''}</p>
                    </div>
                  </div>
                  {project.status !== 'completed' && (
                    <label className="text-sm text-primary hover:underline cursor-pointer shrink-0">
                      Change file
                      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleExternalFileUpload(file, 'tor'); }} />
                    </label>
                  )}
                </div>
              ) : (
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" disabled={project.status === 'completed'} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleExternalFileUpload(file, 'tor'); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100" />
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">SLA Document</label>
              {externalProjectForm.slaFileData ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <a href={externalProjectForm.slaFileData} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate block">{externalProjectForm.slaFileName}</a>
                      <p className="text-xs text-gray-500">{externalProjectForm.slaFileSize ? `${(Number(externalProjectForm.slaFileSize) / 1024).toFixed(1)} KB` : ''}</p>
                    </div>
                  </div>
                  {project.status !== 'completed' && (
                    <label className="text-sm text-primary hover:underline cursor-pointer shrink-0">
                      Change file
                      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleExternalFileUpload(file, 'sla'); }} />
                    </label>
                  )}
                </div>
              ) : (
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" disabled={project.status === 'completed'} onChange={(e) => { const file = e.target.files?.[0]; if (file) handleExternalFileUpload(file, 'sla'); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100" />
              )}
            </div>
          </div>
          {project.status !== 'completed' && (
            <div className="flex justify-end">
              <button onClick={handleSaveExternalProjectInfo} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                <Save className="h-4 w-4" /> Save External Project Info
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Milestone Modal */}
      {showMilestoneForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Milestone</h3>
            <div className="space-y-4">
              <input type="text" value={newMilestone.name} onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Milestone name" />
              <select value={newMilestone.type} onChange={(e) => setNewMilestone({ ...newMilestone, type: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="Report">Report</option>
                <option value="Invoice">Invoice</option>
                <option value="Tranche">Tranche</option>
              </select>
              <textarea value={newMilestone.description} onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Description" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Start Date</label>
              <input type="date" value={newMilestone.plannedStart} onChange={(e) => setNewMilestone({ ...newMilestone, plannedStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned End Date</label>
              <input type="date" value={newMilestone.plannedEnd} onChange={(e) => setNewMilestone({ ...newMilestone, plannedEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Cost</label>
              <input type="number" value={newMilestone.plannedCost} onChange={(e) => setNewMilestone({ ...newMilestone, plannedCost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Planned Cost" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowMilestoneForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
              <button onClick={handleAddMilestone} className="px-4 py-2 bg-primary text-white rounded-lg">Add Milestone</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Task</h3>
            <div className="space-y-4">
              <input type="text" value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Task name" />
              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Description" />
              <select value={newTask.responsiblePerson} onChange={(e) => setNewTask({ ...newTask, responsiblePerson: e.target.value, responsiblePersonName: e.target.options[e.target.selectedIndex].text })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select Responsible Person</option>
                <option value="user1">John Smith</option>
                <option value="user2">Sarah Johnson</option>
                <option value="user3">Michael Brown</option>
              </select>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Start Date</label>
              <input type="date" value={newTask.plannedStart} onChange={(e) => setNewTask({ ...newTask, plannedStart: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned End Date</label>
              <input type="date" value={newTask.plannedEnd} onChange={(e) => setNewTask({ ...newTask, plannedEnd: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Cost</label>
              <input type="number" value={newTask.plannedCost} onChange={(e) => setNewTask({ ...newTask, plannedCost: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Planned cost" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTaskForm(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
              <button onClick={() => handleAddTask(showTaskForm.milestoneId)} className="px-4 py-2 bg-primary text-white rounded-lg">Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;