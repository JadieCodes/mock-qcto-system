import React, { createContext, useContext, useState, type ReactNode, useEffect,useRef } from 'react';
import type { AppRole, Submission, Batch, IntegrationJob, PrintJob, JobStatus } from '@/types';
import type { ResearchRequest, BulletinCall, BulletinSubmission, ExternalApplication, LearnerEnrolment, LearnerEnrolmentStatus,Agenda,Project, ProjectMilestone, ProjectTask, MilestoneType, TaskStatus, MilestoneStatus, ProjectStatus, } from '@/types';


export interface AuditEntry {
  id: string;
  timestamp: Date;
  objectType: 'agenda' | 'project' | 'milestone' | 'task' | 'report';
  objectId: string;
  objectName: string;
  actor: string;
  actorRole: string;
  action: 'created' | 'updated' | 'submitted' | 'approved' | 'rejected' | 'started' | 'completed' | 'uploaded';
  summary: string;
  description?: string;
  details?: any;
  metadata?: {
    agendaId?: string;
    agendaName?: string;
    projectId?: string;
    projectName?: string;
    milestoneId?: string;
    milestoneName?: string;
    taskId?: string;
    taskName?: string;
    previousStatus?: string;
    newStatus?: string;
    comments?: string;
    actualCost?: number; // Add this line
  };
}
// Add User interface
interface User {
  name: string;
  email: string;
  role: AppRole;
  businessUnit: string;
}


interface AppContextType {

   auditEntries: AuditEntry[]; // This must be included
  addAuditEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
    deleteMilestone: (projectId: string, milestoneId: string) => boolean;
  deleteTask: (projectId: string, milestoneId: string, taskId: string) => boolean;

  submitProjectReport: (
  projectId: string,
  report: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string;
  },
  submittedBy: string
) => void;

approveProjectReport: (
  projectId: string,
  reviewedBy: string,
  reviewRole: string,
  comments?: string
) => void;

rejectProjectReport: (
  projectId: string,
  reviewedBy: string,
  reviewRole: string,
  comments?: string
) => void;


    // Projects
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addMilestone: (projectId: string, milestone: Omit<ProjectMilestone, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'status' | 'actualTime' | 'actualCost'>) => void;
  updateMilestone: (projectId: string, milestoneId: string, updates: Partial<ProjectMilestone>) => void;
  addTask: (projectId: string, milestoneId: string, task: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'actualTime'>) => void;
  updateTask: (projectId: string, milestoneId: string, taskId: string, updates: Partial<ProjectTask>) => void;
  startTask: (projectId: string, milestoneId: string, taskId: string) => void;
  completeTask: (projectId: string, milestoneId: string, taskId: string, actualCost?: number) => void;

    agendas: Agenda[];
  setAgendas: React.Dispatch<React.SetStateAction<Agenda[]>>;
  addAgenda: (agenda: Omit<Agenda, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAgenda: (id: string, updates: Partial<Agenda>) => void;

  enrolments: LearnerEnrolment[];
  setEnrolments: React.Dispatch<React.SetStateAction<LearnerEnrolment[]>>;
  addEnrolment: (enrolment: Omit<LearnerEnrolment, 'id' | 'enrolmentId' | 'createdAt' | 'updatedAt'>) => void;
  updateEnrolment: (id: string, updates: Partial<LearnerEnrolment>) => void;

  externalApplications: ExternalApplication[];
  setExternalApplications: React.Dispatch<React.SetStateAction<ExternalApplication[]>>;

  updateCallStatus: (callId: string, status: BulletinCall['status']) => void;

  bulletinCalls: BulletinCall[];
  setBulletinCalls: React.Dispatch<React.SetStateAction<BulletinCall[]>>;
  bulletinSubmissions: BulletinSubmission[];
  setBulletinSubmissions: React.Dispatch<React.SetStateAction<BulletinSubmission[]>>;

  researchApprovedRequests: ResearchRequest[];
  setResearchApprovedRequests: React.Dispatch<React.SetStateAction<ResearchRequest[]>>;

  approvedRequests: ResearchRequest[];
  setApprovedRequests: React.Dispatch<React.SetStateAction<ResearchRequest[]>>;

  requests: ResearchRequest[];
  setRequests: React.Dispatch<React.SetStateAction<ResearchRequest[]>>;

  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;

  // Add currentUser based on role
  currentUser: User;
  setCurrentUser: (user: User) => void;

  // Add currentProfile
  currentProfile: any;
  setCurrentProfile: (profile: any) => void;

  submissions: Submission[];
  addSubmission: (submission: Omit<Submission, 'id'>) => void;
  updateSubmission: (submissionId: string, updates: Partial<Submission>) => void;

  // New profile submissions
  profileSubmissions: Submission[];
  addProfileSubmission: (submission: Omit<Submission, 'id'>) => void;
  acceptProfileSubmission: (id: string) => void;
  clearExpiredCorrections: (submissions: Submission[]) => Submission[];

  batches: Batch[];
  addBatch: (batch: Omit<Batch, 'batchUuid'>) => void;
  updateBatchStatus: (batchId: string, status: Batch['status']) => void;

  integrationJobs: IntegrationJob[];
  addIntegrationJob: (job: Omit<IntegrationJob, 'id'>) => void;
  updateJobStatus: (jobId: string, status: JobStatus, progress: number) => void;

  printJobs: PrintJob[];
  addPrintJob: (job: Omit<PrintJob, 'id'>) => void;
  updatePrintJob: (jobId: string, updates: Partial<PrintJob>) => void;
}



// Mock user data based on roles
const getUserDataByRole = (role: AppRole): User => {
  const userMap: Record<AppRole, User> = {
    // Existing roles
    'Assessment Unit': { name: 'Alex Assessment', email: 'alex.assessment@qcto.gov.za', role: 'Assessment Unit', businessUnit: 'Assessment' },
    'Certification Practitioner': { name: 'Chris Certificate', email: 'chris.cert@qcto.gov.za', role: 'Certification Practitioner', businessUnit: 'Certification' },
    'Supervisor': { name: 'Sam Supervisor', email: 'sam.supervisor@qcto.gov.za', role: 'Supervisor', businessUnit: 'Certification' },
    'Printer': { name: 'Peter Printer', email: 'peter.printer@qcto.gov.za', role: 'Printer', businessUnit: 'Printing' },
    'Finance': { name: 'Fiona Finance', email: 'fiona.finance@qcto.gov.za', role: 'Finance', businessUnit: 'Finance' },
    'QP': { name: 'Quinton Quality', email: 'quinton.qp@qcto.gov.za', role: 'QP', businessUnit: 'Quality Assurance' },
    'SDP': { name: 'Sarah SDP', email: 'sarah.sdp@qcto.gov.za', role: 'SDP', businessUnit: 'Skills Development' },
    'NAMB': { name: 'Nathan NAMB', email: 'nathan.namb@qcto.gov.za', role: 'NAMB', businessUnit: 'NAMB' },

    // Research Domain Roles
    'Research Deputy Director': { name: 'David Deputy', email: 'david.deputy@research.qcto.gov.za', role: 'Research Deputy Director', businessUnit: 'Research' },
    'Research Director': { name: 'Diana Director', email: 'diana.director@research.qcto.gov.za', role: 'Research Director', businessUnit: 'Research' },
    'Research Chief Director': { name: 'Charles Chief', email: 'charles.chief@research.qcto.gov.za', role: 'Research Chief Director', businessUnit: 'Research' },
    'Research Chief Financial Officer': { name: 'Catherine CFO', email: 'catherine.cfo@research.qcto.gov.za', role: 'Research Chief Financial Officer', businessUnit: 'Research Finance' },
    'Research Chief Executive Officer': { name: 'Edward CEO', email: 'edward.ceo@research.qcto.gov.za', role: 'Research Chief Executive Officer', businessUnit: 'Research Executive' },
    'Research Legal Director': { name: 'Laura Legal', email: 'laura.legal@research.qcto.gov.za', role: 'Research Legal Director', businessUnit: 'Research Legal' },
    'Research Service Provider': { name: 'Robert Service', email: 'robert.service@provider.com', role: 'Research Service Provider', businessUnit: 'External Services' },
    'Research Graphic Designer': { name: 'Grace Design', email: 'grace.design@creative.com', role: 'Research Graphic Designer', businessUnit: 'Creative Services' },
    'Forum': { name: 'Forum', email: 'Forum.Forum@Forum.com', role: 'Forum', businessUnit: 'Research' },

    // External Research Roles
    'Requester': { name: 'Rachel Requester', email: 'rachel.requester@external.com', role: 'Requester', businessUnit: 'Research' },
    'Applicant': { name: 'Adam Applicant', email: 'adam.applicant@external.com', role: 'Applicant', businessUnit: 'External' },
    'External Applicant': { name: 'Eve External', email: 'eve.external@external.com', role: 'External Applicant', businessUnit: 'External' },

    // QA External Roles
    'Quality Partner': { name: 'Quentin Quality', email: 'quentin.quality@qcto.gov.za', role: 'Quality Partner', businessUnit: 'Quality Assurance' },
    'Quality Partner (SETA)': { name: 'Sipho SETA', email: 'sipho.seta@seta.org.za', role: 'Quality Partner (SETA)', businessUnit: 'SETA Quality Assurance' },

    // QA Internal Roles
    'Indicator Champion': { name: 'Indira Champion', email: 'indira.champion@qcto.gov.za', role: 'Indicator Champion', businessUnit: 'Quality Assurance' },
    'QA Managers': { name: 'Michael Manager', email: 'michael.manager@qcto.gov.za', role: 'QA Managers', businessUnit: 'Quality Assurance Management' },
    'QA SP Team': { name: 'Sarah SP Team', email: 'sarah.spteam@qcto.gov.za', role: 'QA SP Team', businessUnit: 'Skills Development QA' },
  };

  return userMap[role] || { name: 'Unknown User', email: 'unknown@qcto.gov.za', role, businessUnit: 'Unknown' };
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const deleteMilestone = (projectId: string, milestoneId: string) => {
  const project = projects.find(p => p.id === projectId);
  const milestone = project?.milestones.find(m => m.id === milestoneId);

  // Check if milestone can be deleted (only if not started and no tasks in progress/completed)
  if (milestone && milestone.status !== 'not_started') {
    alert('Cannot delete milestone that is already in progress or completed.');
    return false;
  }

  // Check if any tasks are not in 'not_started' status
  if (milestone && milestone.tasks.some(t => t.status !== 'not_started')) {
    alert('Cannot delete milestone that has tasks which are already in progress or completed.');
    return false;
  }

  setProjects(prev =>
    prev.map(project => {
      if (project.id !== projectId) return project;

      const updatedMilestones = project.milestones.filter(m => m.id !== milestoneId);

      // Add audit entry
      if (project && milestone) {
        addAuditEntry({
          objectType: 'milestone',
          objectId: milestoneId,
          objectName: milestone.name,
          actor: currentUser.name,
          actorRole: currentRole,
          action: 'updated',
          summary: `${currentUser.name} deleted milestone "${milestone.name}" from project: ${project.name}`,
          description: `Milestone "${milestone.name}" was deleted`,
          metadata: {
            projectId: project.id,
            projectName: project.name,
            milestoneId: milestone.id,
            milestoneName: milestone.name,
          },
        });
      }

      return calculateProjectStatus({
        ...project,
        milestones: updatedMilestones,
        updatedAt: new Date(),
      });
    })
  );
  return true;
};

const deleteTask = (projectId: string, milestoneId: string, taskId: string) => {
  const project = projects.find(p => p.id === projectId);
  const milestone = project?.milestones.find(m => m.id === milestoneId);
  const task = milestone?.tasks.find(t => t.id === taskId);

  // Check if task can be deleted (only if not started)
  if (task && task.status !== 'not_started') {
    alert('Cannot delete task that is already in progress or completed.');
    return false;
  }

  setProjects(prev =>
    prev.map(project => {
      if (project.id !== projectId) return project;

      const updatedMilestones = project.milestones.map(m => {
        if (m.id !== milestoneId) return m;

        const updatedTasks = m.tasks.filter(t => t.id !== taskId);

        // Add audit entry
        if (project && milestone && task) {
          addAuditEntry({
            objectType: 'task',
            objectId: taskId,
            objectName: task.name,
            actor: currentUser.name,
            actorRole: currentRole,
            action: 'updated',
            summary: `${currentUser.name} deleted task "${task.name}" from milestone "${milestone.name}"`,
            description: `Task "${task.name}" was deleted`,
            metadata: {
              projectId: project.id,
              projectName: project.name,
              milestoneId: milestone.id,
              milestoneName: milestone.name,
              taskId: task.id,
              taskName: task.name,
            },
          });
        }

        return calculateMilestoneStatus({
          ...m,
          tasks: updatedTasks,
          updatedAt: new Date(),
        });
      });

      return calculateProjectStatus({
        ...project,
        milestones: updatedMilestones,
        updatedAt: new Date(),
      });
    })
  );
  return true;
};



  const lastAuditEntryRef = useRef<{ timestamp: number; objectId: string; action: string; actor: string } | null>(null);

    // =========================
  // AUDIT TRAIL STATE
  // =========================
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>(() => {
    const stored = localStorage.getItem('research_audit_trail');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
      } catch (e) {
        console.error('Error loading audit trail', e);
      }
    }
    return [];
  });

  // Save audit entries to localStorage
  useEffect(() => {
    localStorage.setItem('research_audit_trail', JSON.stringify(auditEntries));
  }, [auditEntries]);

 const addAuditEntry = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
  // Check for duplicate in last 2 seconds (prevents rapid duplicates)
  const now = Date.now();
  const lastEntry = lastAuditEntryRef.current;
  
  if (lastEntry) {
    const timeDiff = now - lastEntry.timestamp;
    const isDuplicate = 
      timeDiff < 2000 && // Within 2 seconds
      lastEntry.objectId === entry.objectId &&
      lastEntry.action === entry.action &&
      lastEntry.actor === entry.actor;
    
    if (isDuplicate) {
      console.log('Duplicate audit entry prevented:', entry.summary);
      return; // Prevent duplicate
    }
  }
  
  // Update the ref with current entry
  lastAuditEntryRef.current = {
    timestamp: now,
    objectId: entry.objectId,
    action: entry.action,
    actor: entry.actor,
  };
  
  const newEntry: AuditEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
  };
  setAuditEntries(prev => [newEntry, ...prev]);
};

  // Add to AppProvider component
// =========================
// PROJECTS STATE + HELPERS
// =========================

  const submitProjectReport = (
    projectId: string,
    report: {
      fileName: string;
      fileType: string;
      fileSize: number;
      fileData: string;
    },
    submittedBy: string
  ) => {
    const project = projects.find(p => p.id === projectId);
    
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              finalReport: {
                ...report,
                uploadedAt: new Date(),
                uploadedBy: submittedBy,
              },
              reportSubmittedAt: new Date(),
              reportSubmittedBy: submittedBy,
              status: 'under_review',
              updatedAt: new Date(),
            }
          : project
      )
    );

    // Add audit entry
    if (project) {
      addAuditEntry({
        objectType: 'report',
        objectId: projectId,
        objectName: project.name,
        actor: currentUser.name,
        actorRole: currentRole,
        action: 'submitted',
        summary: `${currentUser.name} submitted final report for project: ${project.name}`,
        description: report.fileName,
        metadata: {
          projectId: project.id,
          projectName: project.name,
          newStatus: 'under_review',
        },
      });
    }
  };

  const approveProjectReport = (
    projectId: string,
    reviewedBy: string,
    reviewRole: string,
    comments?: string
  ) => {
    const project = projects.find(p => p.id === projectId);
    
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              status: 'completed',
              finalReview: {
                reviewedBy,
                reviewedAt: new Date(),
                reviewRole,
                comments,
                decision: 'approve',
              },
              updatedAt: new Date(),
            }
          : project
      )
    );

    // Add audit entry
    if (project) {
      addAuditEntry({
        objectType: 'report',
        objectId: projectId,
        objectName: project.name,
        actor: currentUser.name,
        actorRole: currentRole,
        action: 'approved',
        summary: `${currentUser.name} approved final report for project: ${project.name}`,
        description: comments || 'No additional comments',
        metadata: {
          projectId: project.id,
          projectName: project.name,
          previousStatus: project.status,
          newStatus: 'completed',
          comments: comments,
        },
      });
    }
  };

  const rejectProjectReport = (
    projectId: string,
    reviewedBy: string,
    reviewRole: string,
    comments?: string
  ) => {
    const project = projects.find(p => p.id === projectId);
    
    setProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? {
              ...project,
              status: 'awaiting_report_submission',
              finalReview: {
                reviewedBy,
                reviewedAt: new Date(),
                reviewRole,
                comments,
                decision: 'reject',
              },
              updatedAt: new Date(),
            }
          : project
      )
    );

    // Add audit entry
    if (project) {
      addAuditEntry({
        objectType: 'report',
        objectId: projectId,
        objectName: project.name,
        actor: currentUser.name,
        actorRole: currentRole,
        action: 'rejected',
        summary: `${currentUser.name} rejected final report for project: ${project.name}`,
        description: comments || 'No reason provided',
        metadata: {
          projectId: project.id,
          projectName: project.name,
          previousStatus: project.status,
          newStatus: 'awaiting_report_submission',
          comments: comments,
        },
      });
    }
  };

const [projects, setProjects] = useState<Project[]>(() => {
  const stored = localStorage.getItem('research_projects');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        actualStartDate: project.actualStartDate ? new Date(project.actualStartDate) : undefined,
        actualEndDate: project.actualEndDate ? new Date(project.actualEndDate) : undefined,
        milestones: (project.milestones || []).map((milestone: any) => ({
          ...milestone,
          createdAt: new Date(milestone.createdAt),
          updatedAt: new Date(milestone.updatedAt),
          tasks: (milestone.tasks || []).map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
          })),
        })),
      }));
    } catch (e) {
      console.error('Error loading projects', e);
    }
  }
  return [];
});

useEffect(() => {
  localStorage.setItem('research_projects', JSON.stringify(projects));
}, [projects]);

const calculateMilestoneStatus = (milestone: ProjectMilestone): ProjectMilestone => {
  const tasks = milestone.tasks || [];

  if (tasks.length === 0) {
    return {
      ...milestone,
      status: 'not_started',
      actualTime: undefined,
      actualCost: undefined,
    };
  }

  const allCompleted = tasks.every(t => t.status === 'completed');
  const anyInProgress = tasks.some(t => t.status === 'in_progress');
  const anyStarted = tasks.some(
    t => t.status === 'in_progress' || t.status === 'completed'
  );

  let newStatus: MilestoneStatus = 'not_started';
  let actualStartDate: string | undefined;
  let actualEndDate: string | undefined;
  let actualCost = 0;

  const startDates = tasks
    .filter(t => t.actualTime?.start)
    .map(t => t.actualTime!.start!)
    .sort();

  const endDates = tasks
    .filter(t => t.actualTime?.end)
    .map(t => t.actualTime!.end!)
    .sort();

  actualCost = tasks.reduce((sum, t) => sum + (t.actualCost || 0), 0);

  if (allCompleted) {
    newStatus = 'completed';
    if (startDates.length) actualStartDate = startDates[0];
    if (endDates.length) actualEndDate = endDates[endDates.length - 1];
  } else if (anyInProgress || anyStarted) {
    newStatus = 'in_progress';
    if (startDates.length) actualStartDate = startDates[0];
  }

  return {
    ...milestone,
    status: newStatus,
    actualTime:
      actualStartDate || actualEndDate
        ? {
            start: actualStartDate,
            end: actualEndDate,
          }
        : undefined,
    actualCost,
    updatedAt: new Date(),
  };
};

const calculateProjectStatus = (project: Project): Project => {
  const milestones = project.milestones || [];

  if (milestones.length === 0) {
    return {
      ...project,
      status: 'not_started',
      actualStartDate: undefined,
      actualEndDate: undefined,
      actualCost: undefined,
    };
  }

  const allCompleted = milestones.every((m) => m.status === 'completed');
  const anyInProgress = milestones.some((m) => m.status === 'in_progress');
  const anyStarted = milestones.some(
    (m) => m.status === 'in_progress' || m.status === 'completed'
  );

  let newStatus: ProjectStatus = project.status;

  const startDates = milestones
    .filter((m) => m.actualTime?.start)
    .map((m) => m.actualTime!.start!)
    .sort();

  const endDates = milestones
    .filter((m) => m.actualTime?.end)
    .map((m) => m.actualTime!.end!)
    .sort();

  const actualCost = milestones.reduce((sum, m) => sum + (m.actualCost || 0), 0);

  let actualStartDate: Date | undefined;
  let actualEndDate: Date | undefined;

  if (startDates.length) {
    actualStartDate = new Date(startDates[0]);
  }

  // only set actual end date once every milestone is completed
  if (allCompleted && endDates.length) {
    actualEndDate = new Date(endDates[endDates.length - 1]);
  } else {
    actualEndDate = undefined;
  }

  if (allCompleted) {
    if (project.status !== 'under_review' && project.status !== 'completed') {
      newStatus = 'awaiting_report_submission';
    }
  } else if (anyInProgress || anyStarted) {
    newStatus = 'in_progress';
  } else {
    newStatus = 'not_started';
  }

  return {
    ...project,
    status: newStatus,
    actualStartDate,
    actualEndDate,
    actualCost,
    updatedAt: new Date(),
  };
};
const addProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
  setProjects((prev) => {
    const existingProject = prev.find(
      (p) =>
        p.agendaId === project.agendaId &&
        p.agendaItemId === project.agendaItemId
    );

    if (existingProject) {
      return prev; // Project already exists, don't add again
    }

    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}`,
      milestones: project.milestones ?? [],
      status: project.status ?? 'not_started',
      actualStartDate: undefined,
      actualEndDate: undefined,
      actualCost: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add audit entry only when project is actually created
    addAuditEntry({
      objectType: 'project',
      objectId: newProject.id,
      objectName: newProject.name,
      actor: currentUser.name,
      actorRole: currentRole,
      action: 'created',
      summary: `${currentUser.name} created project: ${newProject.name}`,
      description: `Project created from agenda item`,
      metadata: {
        projectId: newProject.id,
        projectName: newProject.name,
        agendaId: project.agendaId,
      },
    });

    return [newProject, ...prev];
  });
};

  const updateProject = (id: string, updates: Partial<Project>) => {
    const project = projects.find(p => p.id === id);
    
    setProjects(prev =>
      prev.map(project =>
        project.id === id
          ? calculateProjectStatus({
              ...project,
              ...updates,
              updatedAt: new Date(),
            })
          : project
      )
    );

    // Add audit entry for significant updates
    if (project && updates.companyName && updates.companyName !== project.companyName) {
      addAuditEntry({
        objectType: 'project',
        objectId: id,
        objectName: project.name,
        actor: currentUser.name,
        actorRole: currentRole,
        action: 'updated',
        summary: `${currentUser.name} updated project information for: ${project.name}`,
        description: `Company name updated from "${project.companyName}" to "${updates.companyName}"`,
        metadata: {
          projectId: project.id,
          projectName: project.name,
        },
      });
    }
  };

 const addMilestone = (
  projectId: string,
  milestone: Omit<
    ProjectMilestone,
    'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'status' | 'actualTime' | 'actualCost'
  >
) => {
  const project = projects.find(p => p.id === projectId);
  
  // Check if milestone already exists to prevent duplicates
  const existingMilestone = project?.milestones.find(
    m => m.name === milestone.name && 
         m.plannedTime.start === milestone.plannedTime.start &&
         m.plannedTime.end === milestone.plannedTime.end
  );
  
  if (existingMilestone) {
    console.log('Milestone already exists, skipping duplicate creation');
    return;
  }
  
  const newMilestone: ProjectMilestone = {
    ...milestone,
    id: `milestone-${Date.now()}`,
    tasks: [],
    status: 'not_started',
    actualTime: undefined,
    actualCost: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  setProjects(prev =>
    prev.map(project => {
      if (project.id !== projectId) return project;

      const updatedProject = {
        ...project,
        milestones: [...project.milestones, newMilestone],
        updatedAt: new Date(),
      };

      return calculateProjectStatus(updatedProject);
    })
  );

  // Add audit entry only once
  if (project) {
    addAuditEntry({
      objectType: 'milestone',
      objectId: newMilestone.id,
      objectName: newMilestone.name,
      actor: currentUser.name,
      actorRole: currentRole,
      action: 'created',
      summary: `${currentUser.name} added milestone "${newMilestone.name}" to project: ${project.name}`,
      description: milestone.description || 'No description',
      metadata: {
        projectId: project.id,
        projectName: project.name,
        milestoneId: newMilestone.id,
        milestoneName: newMilestone.name,
      },
    });
  }
};

const updateMilestone = (
  projectId: string,
  milestoneId: string,
  updates: Partial<ProjectMilestone>
) => {
  const project = projects.find(p => p.id === projectId);
  const milestone = project?.milestones.find(m => m.id === milestoneId);

  // Check if milestone can be edited (only if not started)
  if (milestone && milestone.status !== 'not_started' && (updates.name || updates.description || updates.plannedTime || updates.plannedCost)) {
    alert('Cannot edit milestone that is already in progress or completed.');
    return;
  }

  setProjects(prev =>
    prev.map(project => {
      if (project.id !== projectId) return project;

      const updatedMilestones = project.milestones.map(m =>
        m.id === milestoneId
          ? calculateMilestoneStatus({
              ...m,
              ...updates,
              updatedAt: new Date(),
            })
          : m
      );

      // Add audit entry for edits
      if (project && milestone && (updates.name || updates.description || updates.plannedTime || updates.plannedCost)) {
        let changeDescription = '';
        if (updates.name && updates.name !== milestone.name) {
          changeDescription = `Name changed from "${milestone.name}" to "${updates.name}"`;
        } else if (updates.description && updates.description !== milestone.description) {
          changeDescription = 'Description updated';
        } else if (updates.plannedTime) {
          changeDescription = `Planned dates updated to ${updates.plannedTime.start} - ${updates.plannedTime.end}`;
        } else if (updates.plannedCost !== undefined) {
          changeDescription = `Planned cost updated from ZAR ${milestone.plannedCost.toLocaleString()} to ZAR ${updates.plannedCost.toLocaleString()}`;
        }

        addAuditEntry({
          objectType: 'milestone',
          objectId: milestoneId,
          objectName: milestone.name,
          actor: currentUser.name,
          actorRole: currentRole,
          action: 'updated',
          summary: `${currentUser.name} edited milestone "${milestone.name}"`,
          description: changeDescription,
          metadata: {
            projectId: project.id,
            projectName: project.name,
            milestoneId: milestone.id,
            milestoneName: updates.name || milestone.name,
            previousStatus: milestone.status,
            newStatus: milestone.status,
          },
        });
      }

      return calculateProjectStatus({
        ...project,
        milestones: updatedMilestones,
        updatedAt: new Date(),
      });
    })
  );
};
const addTask = (
    projectId: string,
    milestoneId: string,
    task: Omit<ProjectTask, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'actualTime'>
  ) => {
    const project = projects.find(p => p.id === projectId);
    const milestone = project?.milestones.find(m => m.id === milestoneId);
    
    const newTask: ProjectTask = {
      ...task,
      id: `task-${Date.now()}`,
      status: 'not_started',
      actualTime: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setProjects(prev =>
      prev.map(project => {
        if (project.id !== projectId) return project;

        const updatedMilestones = project.milestones.map(m => {
          if (m.id !== milestoneId) return m;

          const updatedMilestone = {
            ...m,
            tasks: [...m.tasks, newTask],
            updatedAt: new Date(),
          };

          return calculateMilestoneStatus(updatedMilestone);
        });

        return calculateProjectStatus({
          ...project,
          milestones: updatedMilestones,
          updatedAt: new Date(),
        });
      })
    );

    // Add audit entry
    if (project && milestone) {
      addAuditEntry({
        objectType: 'task',
        objectId: newTask.id,
        objectName: newTask.name,
        actor: currentUser.name,
        actorRole: currentRole,
        action: 'created',
        summary: `${currentUser.name} added task "${newTask.name}" to milestone "${milestone.name}"`,
        description: task.description || 'No description',
        metadata: {
          projectId: project.id,
          projectName: project.name,
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          taskId: newTask.id,
          taskName: newTask.name,
        },
      });
    }
  };

const updateTask = (
  projectId: string,
  milestoneId: string,
  taskId: string,
  updates: Partial<ProjectTask>
) => {
  const project = projects.find(p => p.id === projectId);
  const milestone = project?.milestones.find(m => m.id === milestoneId);
  const task = milestone?.tasks.find(t => t.id === taskId);

  // Check if task can be edited (only if not started for name/description/planned dates/cost)
  if (task && task.status !== 'not_started' && (updates.name || updates.description || updates.plannedTime || updates.plannedCost)) {
    alert('Cannot edit task details that is already in progress or completed.');
    return;
  }

  setProjects(prev =>
    prev.map(project => {
      if (project.id !== projectId) return project;

      const updatedMilestones = project.milestones.map(m => {
        if (m.id !== milestoneId) return m;

        const updatedTasks = m.tasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                ...updates,
                updatedAt: new Date(),
              }
            : t
        );

        // Add audit entry for edits
        if (project && milestone && task && (updates.name || updates.description || updates.plannedTime || updates.plannedCost)) {
          let changeDescription = '';
          if (updates.name && updates.name !== task.name) {
            changeDescription = `Name changed from "${task.name}" to "${updates.name}"`;
          } else if (updates.description && updates.description !== task.description) {
            changeDescription = 'Description updated';
          } else if (updates.plannedTime) {
            changeDescription = `Planned dates updated to ${updates.plannedTime.start} - ${updates.plannedTime.end}`;
          } else if (updates.plannedCost !== undefined && updates.plannedCost !== task.plannedCost) {
            changeDescription = `Planned cost updated from ZAR ${task.plannedCost.toLocaleString()} to ZAR ${updates.plannedCost.toLocaleString()}`;
          }

          addAuditEntry({
            objectType: 'task',
            objectId: taskId,
            objectName: task.name,
            actor: currentUser.name,
            actorRole: currentRole,
            action: 'updated',
            summary: `${currentUser.name} edited task "${task.name}"`,
            description: changeDescription,
            metadata: {
              projectId: project.id,
              projectName: project.name,
              milestoneId: milestone.id,
              milestoneName: milestone.name,
              taskId: task.id,
              taskName: updates.name || task.name,
            },
          });
        }

        // Add audit entry for evidence uploads or outcome updates
        if (project && milestone && task && (updates.evidence || updates.outcome)) {
          addAuditEntry({
            objectType: 'task',
            objectId: taskId,
            objectName: task.name,
            actor: currentUser.name,
            actorRole: currentRole,
            action: 'updated',
            summary: `${currentUser.name} updated task "${task.name}"`,
            description: updates.evidence ? `Uploaded evidence: ${updates.evidence.fileName}` : 'Updated task outcome',
            metadata: {
              projectId: project.id,
              projectName: project.name,
              milestoneId: milestone.id,
              milestoneName: milestone.name,
              taskId: task.id,
              taskName: task.name,
            },
          });
        }

        return calculateMilestoneStatus({
          ...m,
          tasks: updatedTasks,
          updatedAt: new Date(),
        });
      });

      return calculateProjectStatus({
        ...project,
        milestones: updatedMilestones,
        updatedAt: new Date(),
      });
    })
  );
};

  const startTask = (projectId: string, milestoneId: string, taskId: string) => {
    const project = projects.find(p => p.id === projectId);
    const milestone = project?.milestones.find(m => m.id === milestoneId);
    const task = milestone?.tasks.find(t => t.id === taskId);
    
    const now = new Date().toISOString().split('T')[0];

    setProjects(prev =>
      prev.map(project => {
        if (project.id !== projectId) return project;

        const updatedMilestones = project.milestones.map(m => {
          if (m.id !== milestoneId) return m;

          const updatedTasks = m.tasks.map(t =>
            t.id === taskId && t.status === 'not_started'
              ? {
                  ...t,
                  status: 'in_progress' as TaskStatus,
                  actualTime: {
                    ...t.actualTime,
                    start: now,
                  },
                  updatedAt: new Date(),
                }
              : t
          );

          return calculateMilestoneStatus({
            ...m,
            tasks: updatedTasks,
            updatedAt: new Date(),
          });
        });

        return calculateProjectStatus({
          ...project,
          milestones: updatedMilestones,
          updatedAt: new Date(),
        });
      })
    );

    // Add audit entry
    if (project && milestone && task) {
      addAuditEntry({
        objectType: 'task',
        objectId: taskId,
        objectName: task.name,
        actor: currentUser.name,
        actorRole: currentRole,
        action: 'started',
        summary: `${currentUser.name} started task "${task.name}"`,
        metadata: {
          projectId: project.id,
          projectName: project.name,
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          taskId: task.id,
          taskName: task.name,
          previousStatus: 'not_started',
          newStatus: 'in_progress',
        },
      });
    }
  };

  const completeTask = (
    projectId: string,
    milestoneId: string,
    taskId: string,
    actualCost?: number
  ) => {
    const project = projects.find(p => p.id === projectId);
    const milestone = project?.milestones.find(m => m.id === milestoneId);
    const task = milestone?.tasks.find(t => t.id === taskId);
    
    const now = new Date().toISOString().split('T')[0];

    setProjects(prev =>
      prev.map(project => {
        if (project.id !== projectId) return project;

        const updatedMilestones = project.milestones.map(m => {
          if (m.id !== milestoneId) return m;

          const updatedTasks = m.tasks.map(t =>
            t.id === taskId && (t.status === 'in_progress' || t.status === 'not_started')
              ? {
                  ...t,
                  status: 'completed' as TaskStatus,
                  actualTime: {
                    ...t.actualTime,
                    start: t.actualTime?.start || now,
                    end: now,
                  },
                  actualCost: actualCost ?? t.actualCost ?? 0,
                  updatedAt: new Date(),
                }
              : t
          );

          return calculateMilestoneStatus({
            ...m,
            tasks: updatedTasks,
            updatedAt: new Date(),
          });
        });

        return calculateProjectStatus({
          ...project,
          milestones: updatedMilestones,
          updatedAt: new Date(),
        });
      })
    );

    // Add audit entry
    if (project && milestone && task) {
      addAuditEntry({
        objectType: 'task',
        objectId: taskId,
        objectName: task.name,
        actor: currentUser.name,
        actorRole: currentRole,
        action: 'completed',
        summary: `${currentUser.name} completed task "${task.name}"`,
        description: actualCost ? `Actual cost: ZAR ${actualCost.toLocaleString()}` : undefined,
        metadata: {
          projectId: project.id,
          projectName: project.name,
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          taskId: task.id,
          taskName: task.name,
          previousStatus: task.status,
          newStatus: 'completed',
          actualCost: actualCost,
        },
      });
    }
  };

    // Add agendas state
  const [agendas, setAgendas] = useState<Agenda[]>(() => {
    const stored = localStorage.getItem('research_agendas');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
          submittedAt: a.submittedAt ? new Date(a.submittedAt) : undefined,
          approvedAt: a.approvedAt ? new Date(a.approvedAt) : undefined,
          forumReview: a.forumReview ? {
            ...a.forumReview,
            reviewedAt: new Date(a.forumReview.reviewedAt),
            minutesDocument: a.forumReview.minutesDocument ? {
              ...a.forumReview.minutesDocument,
              uploadedAt: new Date(a.forumReview.minutesDocument.uploadedAt)
            } : undefined
          } : undefined,
          chiefDirectorReview: a.chiefDirectorReview ? {
            ...a.chiefDirectorReview,
            reviewedAt: new Date(a.chiefDirectorReview.reviewedAt)
          } : undefined,
          ceoApproval: a.ceoApproval ? {
            ...a.ceoApproval,
            reviewedAt: new Date(a.ceoApproval.reviewedAt)
          } : undefined
        }));
      } catch (e) {
        console.error('Error loading agendas', e);
      }
    }
    return [];
  });

  // Save agendas to localStorage
  useEffect(() => {
    localStorage.setItem('research_agendas', JSON.stringify(agendas));
  }, [agendas]);

  // Add agenda functions
 const addAgenda = (agenda: Omit<Agenda, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAgenda: Agenda = {
      ...agenda,
      id: `agenda-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAgendas(prev => [newAgenda, ...prev]);
    
    // Add audit entry
    addAuditEntry({
      objectType: 'agenda',
      objectId: newAgenda.id,
      objectName: newAgenda.name,
      actor: currentUser.name,
      actorRole: currentRole,
      action: 'created',
      summary: `${currentUser.name} created agenda: ${newAgenda.name}`,
      description: agenda.description || 'No description',
      metadata: {
        agendaId: newAgenda.id,
        agendaName: newAgenda.name,
        newStatus: agenda.status,
      },
    });
  };

 const updateAgenda = (id: string, updates: Partial<Agenda>) => {
  const agenda = agendas.find(a => a.id === id);
  
  setAgendas(prev => prev.map(agenda => 
    agenda.id === id 
      ? { ...agenda, ...updates, updatedAt: new Date() }
      : agenda
  ));

  // Add audit entry based on what actually happened
  if (agenda && updates.status && agenda.status !== updates.status) {
    // Determine the correct action based on the status change
    let action: 'submitted' | 'approved' | 'rejected' | 'updated' = 'updated';
    
    if (updates.status === 'forum_review' && agenda.status === 'draft') {
      action = 'submitted';
    } else if (updates.status === 'chief_director_review' && agenda.status === 'forum_review') {
      action = 'approved';
    } else if (updates.status === 'ceo_approval_pending' && agenda.status === 'chief_director_review') {
      action = 'approved';
    } else if (updates.status === 'approved') {
      action = 'approved';
    } else if (updates.status === 'rejected') {
      action = 'rejected';
    }
    
    addAuditEntry({
      objectType: 'agenda',
      objectId: id,
      objectName: agenda.name,
      actor: currentUser.name,
      actorRole: currentRole,
      action: action,
      summary: `${currentUser.name} ${action} agenda: ${agenda.name}`,
      description: updates.rejectionReason || `Status changed from ${agenda.status} to ${updates.status}`,
      metadata: {
        agendaId: agenda.id,
        agendaName: agenda.name,
        previousStatus: agenda.status,
        newStatus: updates.status,
        comments: updates.rejectionReason,
      },
    });
  } else if (agenda && (updates.name !== agenda.name || updates.description !== agenda.description)) {
    // Only log updates for name/description changes, not for approvals/rejections
    addAuditEntry({
      objectType: 'agenda',
      objectId: id,
      objectName: agenda.name,
      actor: currentUser.name,
      actorRole: currentRole,
      action: 'updated',
      summary: `${currentUser.name} updated agenda: ${agenda.name}`,
      description: updates.name ? `Name changed from "${agenda.name}" to "${updates.name}"` : 'Description updated',
      metadata: {
        agendaId: agenda.id,
        agendaName: agenda.name,
      },
    });
  }
};

  const [enrolments, setEnrolments] = useState<LearnerEnrolment[]>(() => {
  const stored = localStorage.getItem('learner_enrolments');
  let enrolmentsData: LearnerEnrolment[] = [];

  if (stored) {
    try {
      enrolmentsData = JSON.parse(stored);

      // DATA MIGRATION: Check for any enrolments with old status values
      let needsUpdate = false;
      const migratedData = enrolmentsData.map(enrolment => {
        // Use type assertion to check the raw string value from localStorage
        const rawStatus = enrolment.status as string;
        
        // Check if the status is the old 'Allocated' value
        if (rawStatus === 'Allocated') {
          console.log(`[Migration] Converting enrolment ${enrolment.enrolmentId} status from 'Allocated' to 'Allocated to QA'`);
          needsUpdate = true;
          return { ...enrolment, status: 'Allocated to QA' as LearnerEnrolmentStatus };
        }
        
        // Also check for any other old status values if needed
        if (rawStatus === 'Allocated to QP' && enrolment.status !== 'Allocated to QP') {
          console.log(`[Migration] Ensuring enrolment ${enrolment.enrolmentId} has correct status`);
          needsUpdate = true;
          return { ...enrolment, status: 'Allocated to QP' as LearnerEnrolmentStatus };
        }
        
        return enrolment;
      });

      // Save migrated data back to localStorage if changes were made
      if (needsUpdate) {
        console.log('[Migration] Saving migrated enrolments to localStorage');
        localStorage.setItem('learner_enrolments', JSON.stringify(migratedData));
        return migratedData;
      }

      return enrolmentsData;
    } catch (e) {
      console.error('Error loading enrolments', e);
    }
  }
  return [];
});

  // Log current enrolments for debugging
  useEffect(() => {
    console.log('Current enrolments in AppContext:', enrolments.map(e => ({
      id: e.id,
      enrolmentId: e.enrolmentId,
      status: e.status,
      allocatedTo: e.allocation?.allocatedTo
    })));
  }, [enrolments]);

  // Save enrolments to localStorage
  useEffect(() => {
    localStorage.setItem('learner_enrolments', JSON.stringify(enrolments));
  }, [enrolments]);

  // Helper functions for enrolments
  const addEnrolment = (enrolment: Omit<LearnerEnrolment, 'id' | 'enrolmentId' | 'createdAt' | 'updatedAt'>) => {
    const newEnrolment: LearnerEnrolment = {
      ...enrolment,
      id: Date.now().toString(),
      enrolmentId: `ENR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log('Adding new enrolment:', newEnrolment);
    setEnrolments(prev => [newEnrolment, ...prev]);
  };

  const updateEnrolment = (id: string, updates: Partial<LearnerEnrolment>) => {
    console.log('updateEnrolment called for id:', id);
    console.log('Updates:', updates);

    setEnrolments(prev => {
      const updated = prev.map(e => {
        if (e.id === id) {
          const newEnrolment = { ...e, ...updates, updatedAt: new Date().toISOString() };
          console.log('Updated enrolment:', newEnrolment);
          return newEnrolment;
        }
        return e;
      });
      return updated;
    });
  };

  const updateCallStatus = (callId: string, status: BulletinCall['status']) => {
    setBulletinCalls(prev =>
      prev.map(call =>
        call.id === callId ? { ...call, status } : call
      )
    );
  };

  const [externalApplications, setExternalApplications] = useState<ExternalApplication[]>(() => {
    const stored = localStorage.getItem('external_applications');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error loading external applications', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('external_applications', JSON.stringify(externalApplications));
  }, [externalApplications]);

  const [bulletinCalls, setBulletinCalls] = useState<BulletinCall[]>(() => {
    const stored = localStorage.getItem('bulletin_calls');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error loading bulletin calls', e);
      }
    }
    return [];
  });

  const [bulletinSubmissions, setBulletinSubmissions] = useState<BulletinSubmission[]>(() => {
    const stored = localStorage.getItem('bulletin_submissions');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error loading bulletin submissions', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('bulletin_calls', JSON.stringify(bulletinCalls));
  }, [bulletinCalls]);

  useEffect(() => {
    localStorage.setItem('bulletin_submissions', JSON.stringify(bulletinSubmissions));
  }, [bulletinSubmissions]);

  const [researchApprovedRequests, setResearchApprovedRequests] = useState<ResearchRequest[]>(() => {
    const stored = localStorage.getItem('research_approved_requests');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error loading research approved requests', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('research_approved_requests', JSON.stringify(researchApprovedRequests));
  }, [researchApprovedRequests]);

  const [approvedRequests, setApprovedRequests] = useState<ResearchRequest[]>(() => {
    const stored = localStorage.getItem('approved_research_requests');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Error loading approved requests', e);
      }
    }
    return [];
  });

  // Save approved requests to localStorage
  useEffect(() => {
    localStorage.setItem('approved_research_requests', JSON.stringify(approvedRequests));
  }, [approvedRequests]);

  // Initialize with Cert Admin as default
 const [currentRole, setCurrentRole] = useState<AppRole>(() => {
  const storedRole = localStorage.getItem('currentUserRole') as AppRole | null;
  return storedRole || 'Certification Practitioner';
});
  const [requests, setRequests] = useState<ResearchRequest[]>([]);

  // Add currentUser state based on role
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
      }
    }
    return getUserDataByRole(currentRole);
  });

  // Add currentProfile state
  const [currentProfile, setCurrentProfile] = useState<any>(() => {
    const storedProfile = localStorage.getItem('currentProfile');
    if (storedProfile) {
      try {
        return JSON.parse(storedProfile);
      } catch (error) {
        console.error('Failed to parse stored profile:', error);
      }
    }
    return null;
  });

  const [submissions, setSubmissions] = useState<Submission[]>([]);

 const clearExpiredCorrections = (submissions: Submission[]) => {
  return submissions.filter((sub) => {
    const todoDate = sub.assessmentData?.correctionRecord?.todoDate;

    if (!todoDate) return true;

    const isExpired = new Date(todoDate).getTime() < Date.now();

    if (isExpired) {
      console.log('Removing expired correction submission:', sub.id);
      return false;
    }

    return true;
  });
};

const PROFILE_SUBMISSIONS_KEY = 'certification_profile_submissions';

const [profileSubmissions, setProfileSubmissions] = useState<Submission[]>(() => {

  const stored = localStorage.getItem(PROFILE_SUBMISSIONS_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return clearExpiredCorrections(parsed);
    } catch (e) {
      console.error('Error loading profile submissions', e);
    }
  }
  return [];
});

 useEffect(() => {
  const cleaned = clearExpiredCorrections(profileSubmissions);

  if (cleaned.length !== profileSubmissions.length) {
    setProfileSubmissions(cleaned);
  }
}, [profileSubmissions]);

useEffect(() => {
  localStorage.setItem(PROFILE_SUBMISSIONS_KEY, JSON.stringify(profileSubmissions));
}, [profileSubmissions]);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [integrationJobs, setIntegrationJobs] = useState<IntegrationJob[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);

  const STORAGE_KEY = 'research_requests';

 

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // OPTIONAL: add workflow defaults (recommended)
        const withWorkflow = parsed.map((req: any) => ({
          ...req,
          internalStatus: req.internalStatus || 'Pending Agenda Development',
          reviewOutcome: req.reviewOutcome || '',
          agenda: req.agenda || undefined,
          evaluations: req.evaluations || [],
        }));

        setRequests(withWorkflow);
      } catch (e) {
        console.error('Error loading research requests', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  // Update currentUser when role changes
  useEffect(() => {
    const newUser = getUserDataByRole(currentRole);
    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  }, [currentRole]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUserRole' && e.newValue) {
        setCurrentRole(e.newValue as AppRole);
      }
      if (e.key === 'currentUser' && e.newValue) {
        try {
          setCurrentUser(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Failed to parse user from storage:', error);
        }
      }
      if (e.key === 'currentProfile' && e.newValue) {
        try {
          setCurrentProfile(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Failed to parse profile from storage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (currentProfile) {
      localStorage.setItem('currentProfile', JSON.stringify(currentProfile));
    }
  }, [currentProfile]);

  useEffect(() => {
    if (currentRole) {
      localStorage.setItem('currentUserRole', currentRole);
    }
  }, [currentRole]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const addSubmission = (submission: Omit<Submission, 'id'>) => {
    const newSubmission: Submission = {
      ...submission,
      id: `SUB-${Date.now()}`,
    };
    setSubmissions(prev => [...prev, newSubmission]);
  };

  const updateSubmission = (submissionId: string, updates: Partial<Submission>) => {
    console.log('Updating submission:', submissionId, updates);

    setProfileSubmissions(prev => {
      const updated = prev.map(sub =>
        sub.id === submissionId ? { ...sub, ...updates } : sub
      );
      console.log('Updated profileSubmissions:', updated);
      return updated;
    });

    // Also update regular submissions if needed
    setSubmissions(prev =>
      prev.map(sub =>
        sub.id === submissionId ? { ...sub, ...updates } : sub
      )
    );
  };

  // --- PROFILE SUBMISSIONS ---
 const addProfileSubmission = (submission: Omit<Submission, 'id'>) => {
  const newSubmission: Submission = {
    ...submission,
    id: `PROFILE-${Date.now()}`,
  };

  console.log('Saved submission in context:', newSubmission);

  setProfileSubmissions((prev) => [...prev, newSubmission]);
};
  const acceptProfileSubmission = (id: string): void => {
    setProfileSubmissions(prev =>
      prev.map(sub =>
        sub.id === id
          ? { ...sub, status: 'in_batch' }
          : sub
      )
    );
  };
  // --- END PROFILE SUBMISSIONS ---

  const addBatch = (batch: Omit<Batch, 'batchUuid'>) => {
    const newBatch: Batch = {
      ...batch,
      batchUuid: `BATCH-${Date.now()}`,
    };
    setBatches(prev => [...prev, newBatch]);

    setSubmissions(prev =>
      prev.map(sub =>
        batch.submissions.includes(sub.id) ? { ...sub, status: 'in_batch' } : sub
      )
    );
  };

  const updateBatchStatus = (batchId: string, status: Batch['status']) => {
    setBatches(prev =>
      prev.map(batch =>
        batch.batchUuid === batchId ? { ...batch, status } : batch
      )
    );
  };

  const addIntegrationJob = (job: Omit<IntegrationJob, 'id'>) => {
    const newJob: IntegrationJob = {
      ...job,
      id: `JOB-${Date.now()}`,
    };
    setIntegrationJobs(prev => [...prev, newJob]);
  };

  const updateJobStatus = (jobId: string, status: IntegrationJob['status'], progress: number) => {
    setIntegrationJobs(prev =>
      prev.map(job =>
        job.id === jobId
          ? { ...job, status, progress, completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : job.completedAt }
          : job
      )
    );
  };

  const addPrintJob = (job: Omit<PrintJob, 'id'>) => {
    const newJob: PrintJob = {
      ...job,
      id: `PRINT-${Date.now()}`,
    };
    setPrintJobs(prev => [...prev, newJob]);
  };

  const updatePrintJob = (jobId: string, updates: Partial<PrintJob>) => {
    setPrintJobs(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      )
    );
  };


  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUser,
        setCurrentUser,
        currentProfile,
        setCurrentProfile,
        submissions,
        addSubmission,
        updateSubmission,
        profileSubmissions,
        addProfileSubmission,
        acceptProfileSubmission,
        batches,
        addBatch,
        updateBatchStatus,
        integrationJobs,
        addIntegrationJob,
        updateJobStatus,
        printJobs,
        addPrintJob,
        updatePrintJob,
        requests,
        setRequests,
        approvedRequests,
        setApprovedRequests,
        researchApprovedRequests, setResearchApprovedRequests,
        setBulletinCalls,
        setBulletinSubmissions,
        bulletinCalls,
        bulletinSubmissions,
        updateCallStatus,
        externalApplications,
        setExternalApplications,
        enrolments,
        setEnrolments,
        addEnrolment,
        updateEnrolment,
         agendas,
        setAgendas,
        addAgenda,
        updateAgenda,
         projects,
  setProjects,
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
 auditEntries,
        addAuditEntry,
         deleteMilestone,
  deleteTask,
  clearExpiredCorrections
  
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};