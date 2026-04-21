import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Eye,
  Mail,
  Download,
  AlertCircle,
  XCircle,
  CheckCircle,
  Clock,
  Building2,
  User,
  Phone,
  MapPin,
  ClipboardCheck,
} from 'lucide-react';
import type { ApplicationStatus } from '@/types';
import { mockAccreditationService } from '@/services/mockAccreditationService';

interface OutcomeLettersPageProps {
  userName?: string;
  userRole?: string;
}

type ApprovalStage =
  | 'pending_assistant_director_review'
  | 'pending_deputy_director_review'
  | 'pending_domains_officer_review'
  | 'pending_iac_approval'
  | 'pending_outcome_letter_generation'
  | 'pending_domains_officer_outcome_review'
  | 'pending_chief_director_approval'
  | 'approved'
  | 'declined';

interface OutcomeLetterWorkflow {
  status: ApprovalStage;
  resolution?: 'approved' | 'declined';
  updatedAt?: string;
  updatedBy?: string;
  assistantDirectorReviewedAt?: string;
  deputyDirectorReviewedAt?: string;
  domainsOfficerReviewedAt?: string;
  iacReviewedAt?: string;
  outcomeLetterGeneratedAt?: string;
  chiefDirectorReviewedAt?: string;
  communicatedAt?: string;
  comments?: string[];
}

interface OutcomeLetterData {
  id: string;
  generatedAt: string;
  generatedBy: string;
  resolution: 'approved' | 'declined';
  letterTitle: string;
  letterBody: string;
}

type ModalTab = 'details' | 'site-visit-report' | 'outcome-letter';

const STAGE_LABELS: Record<ApprovalStage, string> = {
  pending_assistant_director_review: 'Pending Assistant Director Review',
  pending_deputy_director_review: 'Pending Deputy Director Recommendation',
  pending_domains_officer_review: 'Pending Domains Officer Recommendation',
  pending_iac_approval: 'Pending IAC Approval',
  pending_outcome_letter_generation: 'Pending Outcome Letter Generation',
  pending_domains_officer_outcome_review: 'Pending Domains Officer Outcome Review',
  pending_chief_director_approval: 'Pending Chief Director Approval',
  approved: 'Approved',
  declined: 'Declined',
};

const STAGE_BADGES: Record<ApprovalStage, string> = {
  pending_assistant_director_review: 'bg-blue-100 text-blue-800 border border-blue-200',
  pending_deputy_director_review: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  pending_domains_officer_review: 'bg-purple-100 text-purple-800 border border-purple-200',
  pending_iac_approval: 'bg-orange-100 text-orange-800 border border-orange-200',
  pending_outcome_letter_generation: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  pending_domains_officer_outcome_review: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
  pending_chief_director_approval: 'bg-pink-100 text-pink-800 border border-pink-200',
  approved: 'bg-green-100 text-green-800 border border-green-200',
  declined: 'bg-red-100 text-red-800 border border-red-200',
};

export default function OutcomeLettersPage({
  userName = 'Assistant Director',
  userRole = 'Assistant Director',
}: OutcomeLettersPageProps) {
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStage | 'all'>('all');
  const [commentInput, setCommentInput] = useState('');
  const [showLetterEditor, setShowLetterEditor] = useState(false);
  const [draftLetterTitle, setDraftLetterTitle] = useState('');
  const [draftLetterBody, setDraftLetterBody] = useState('');
  const [modalTab, setModalTab] = useState<ModalTab>('details');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    const apps = mockAccreditationService.getApplications();
    setApplications(apps);
  };

  const getWorkflow = (app: ApplicationStatus): OutcomeLetterWorkflow | undefined => {
    return (app as any).outcomeLetterWorkflow;
  };

  const getOutcomeLetter = (app: ApplicationStatus): OutcomeLetterData | undefined => {
    return (app as any).generatedOutcomeLetter;
  };

  const completedVisitApps = useMemo(() => {
    return applications.filter(
      (app) => app.siteVisitSchedule?.status === 'completed' && app.siteVisitReport
    );
  }, [applications]);

  const normalizedApplications = useMemo(() => {
    return completedVisitApps.map((app) => {
      const workflow = getWorkflow(app);
      if (workflow) return app;

      return {
        ...app,
        outcomeLetterWorkflow: {
          status: 'pending_assistant_director_review',
          updatedAt: app.siteVisitReport?.completedAt || new Date().toISOString(),
          updatedBy: app.siteVisitReport?.conductedBy || 'System',
          comments: [],
        } satisfies OutcomeLetterWorkflow,
      } as ApplicationStatus;
    });
  }, [completedVisitApps]);

  const filteredApplications = useMemo(() => {
    return normalizedApplications.filter((app) => {
      const workflow =
        (app as any).outcomeLetterWorkflow as OutcomeLetterWorkflow | undefined;

      const matchesSearch =
        searchTerm === '' ||
        app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicationData?.applicantInfo.organisationName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        app.applicationData?.qualification.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || workflow?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [normalizedApplications, searchTerm, statusFilter]);

  const groupedApplications = useMemo(() => {
    const groups: Record<ApprovalStage, ApplicationStatus[]> = {
      pending_assistant_director_review: [],
      pending_deputy_director_review: [],
      pending_domains_officer_review: [],
      pending_iac_approval: [],
      pending_outcome_letter_generation: [],
      pending_domains_officer_outcome_review: [],
      pending_chief_director_approval: [],
      approved: [],
      declined: [],
    };

    filteredApplications.forEach((app) => {
      const status =
        ((app as any).outcomeLetterWorkflow?.status ||
          'pending_assistant_director_review') as ApprovalStage;
      groups[status].push(app);
    });

    return groups;
  }, [filteredApplications]);

  const updateApplicationWorkflow = (
    applicationId: string,
    updater: (app: ApplicationStatus) => ApplicationStatus
  ) => {
    const sourceList = normalizedApplications.length > 0 ? normalizedApplications : applications;
    const target = sourceList.find((a) => a.id === applicationId);
    if (!target) return;

    const updated = updater(target);
    mockAccreditationService.updateApplication(applicationId, updated);

    setApplications((prev) => prev.map((app) => (app.id === applicationId ? updated : app)));

    if (selectedApplication?.id === applicationId) {
      setSelectedApplication(updated);
    }
  };

  const addWorkflowComment = (app: ApplicationStatus, text: string): string[] => {
    const workflow = (getWorkflow(app) || {
      status: 'pending_assistant_director_review',
      comments: [],
    }) as OutcomeLetterWorkflow;

    const nextComments = [...(workflow.comments || [])];
    if (text.trim()) {
      nextComments.push(
        `${new Date().toLocaleString()} - ${userName} (${userRole}): ${text.trim()}`
      );
    }
    return nextComments;
  };

  const handleStartWorkflow = (app: ApplicationStatus) => {
    updateApplicationWorkflow(app.id, (current) => ({
      ...current,
      outcomeLetterWorkflow: {
        status: 'pending_assistant_director_review',
        updatedAt: new Date().toISOString(),
        updatedBy: userName,
        comments: addWorkflowComment(
          current,
          'Sent completed site visit report into outcome workflow.'
        ),
      },
    } as any));
  };

  const handleAssistantDirectorReview = (app: ApplicationStatus) => {
    updateApplicationWorkflow(app.id, (current) => {
      const existing = getWorkflow(current);
      return {
        ...current,
        outcomeLetterWorkflow: {
          ...(existing || {}),
          status: 'pending_deputy_director_review',
          assistantDirectorReviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: userName,
          comments: addWorkflowComment(
            current,
            commentInput || 'Assistant Director reviewed and forwarded for recommendation.'
          ),
        },
      } as any;
    });
    setCommentInput('');
  };

  const handleDeputyDirectorRecommend = (app: ApplicationStatus) => {
    updateApplicationWorkflow(app.id, (current) => {
      const existing = getWorkflow(current);
      return {
        ...current,
        outcomeLetterWorkflow: {
          ...(existing || {}),
          status: 'pending_domains_officer_review',
          deputyDirectorReviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: userName,
          comments: addWorkflowComment(
            current,
            commentInput || 'Deputy Director recommended the site visit report.'
          ),
        },
      } as any;
    });
    setCommentInput('');
  };

  const handleDomainsOfficerRecommendReport = (app: ApplicationStatus) => {
    updateApplicationWorkflow(app.id, (current) => {
      const existing = getWorkflow(current);
      return {
        ...current,
        outcomeLetterWorkflow: {
          ...(existing || {}),
          status: 'pending_iac_approval',
          domainsOfficerReviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: userName,
          comments: addWorkflowComment(
            current,
            commentInput || 'Domains Officer recommended the site visit report for IAC approval.'
          ),
        },
      } as any;
    });
    setCommentInput('');
  };

  const handleIacResolution = (app: ApplicationStatus, resolution: 'approved' | 'declined') => {
    updateApplicationWorkflow(app.id, (current) => {
      const existing = getWorkflow(current);
      return {
        ...current,
        outcomeLetterWorkflow: {
          ...(existing || {}),
          status:
            resolution === 'approved'
              ? 'pending_outcome_letter_generation'
              : 'declined',
          resolution,
          iacReviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: userName,
          comments: addWorkflowComment(
            current,
            commentInput ||
              `IAC ${resolution === 'approved' ? 'approved' : 'declined'} the site visit report.`
          ),
        },
      } as any;
    });
    setCommentInput('');
  };

  const openLetterEditor = (app: ApplicationStatus) => {
    const resolution =
      ((getWorkflow(app)?.resolution as 'approved' | 'declined' | undefined) ||
        'approved');

    const org = app.applicationData?.applicantInfo.organisationName || 'Applicant';
    const qualification = app.applicationData?.qualification || 'Qualification';

    setSelectedApplication(app);
    setDraftLetterTitle(`Outcome Letter - ${app.applicationId}`);
    setDraftLetterBody(
      resolution === 'approved'
        ? `Dear ${org},

We are pleased to inform you that, following the completed site visit and internal approval workflow, your accreditation outcome for ${qualification} has been approved.

Please review the official outcome and comply with any conditions communicated by the Accreditation Domain.

Regards,
${userName}
${userRole}`
        : `Dear ${org},

Following the completed site visit and internal approval workflow, the outcome for ${qualification} has not been approved at this stage.

Please review the feedback and any conditions or gaps identified in the evaluation report.

Regards,
${userName}
${userRole}`
    );
    setShowLetterEditor(true);
  };

  const handleGenerateOutcomeLetter = () => {
    if (!selectedApplication) return;

    const workflow = getWorkflow(selectedApplication);
    const resolution =
      (workflow?.resolution as 'approved' | 'declined' | undefined) || 'approved';

    updateApplicationWorkflow(selectedApplication.id, (current) => {
      const existing = getWorkflow(current);
      return {
        ...current,
        generatedOutcomeLetter: {
          id: `outcome-${Date.now()}`,
          generatedAt: new Date().toISOString(),
          generatedBy: userName,
          resolution,
          letterTitle: draftLetterTitle,
          letterBody: draftLetterBody,
        },
        outcomeLetterWorkflow: {
          ...(existing || {}),
          status: 'pending_domains_officer_outcome_review',
          outcomeLetterGeneratedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: userName,
          comments: addWorkflowComment(
            current,
            'Outcome letter generated and sent for Domains Officer review.'
          ),
        },
      } as any;
    });

    setShowLetterEditor(false);
    setDraftLetterTitle('');
    setDraftLetterBody('');
  };

  const handleDomainsOfficerOutcomeRecommend = (app: ApplicationStatus) => {
    updateApplicationWorkflow(app.id, (current) => {
      const existing = getWorkflow(current);
      return {
        ...current,
        outcomeLetterWorkflow: {
          ...(existing || {}),
          status: 'pending_chief_director_approval',
          domainsOfficerReviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: userName,
          comments: addWorkflowComment(
            current,
            commentInput || 'Domains Officer recommended the outcome letter for approval.'
          ),
        },
      } as any;
    });
    setCommentInput('');
  };

  const handleChiefDirectorFinal = (
    app: ApplicationStatus,
    resolution: 'approved' | 'declined'
  ) => {
    updateApplicationWorkflow(app.id, (current) => {
      const existing = getWorkflow(current);
      return {
        ...current,
        outcomeLetterWorkflow: {
          ...(existing || {}),
          status: resolution === 'approved' ? 'approved' : 'declined',
          resolution,
          chiefDirectorReviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: userName,
          comments: addWorkflowComment(
            current,
            commentInput ||
              `Chief Director ${resolution === 'approved' ? 'approved' : 'declined'} the outcome letter.`
          ),
        },
      } as any;
    });
    setCommentInput('');
  };

  const handleCommunicateOutcome = (app: ApplicationStatus) => {
    updateApplicationWorkflow(app.id, (current) => {
      const existing = getWorkflow(current);
      return {
        ...current,
        outcomeLetterWorkflow: {
          ...(existing || {}),
          communicatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: userName,
          comments: addWorkflowComment(
            current,
            'Outcome communicated to Applicant and Quality Partner portfolios.'
          ),
        },
      } as any;
    });
  };

  const openApplicationModal = (app: ApplicationStatus) => {
    setSelectedApplication(app);
    setModalTab('details');
    setCommentInput('');
  };

  const closeApplicationModal = () => {
    setSelectedApplication(null);
    setModalTab('details');
    setCommentInput('');
  };

  const renderStageActions = (app: ApplicationStatus) => {
    const workflow = getWorkflow(app);
    const status = workflow?.status || 'pending_assistant_director_review';

    return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Review Notes
          </label>
          <textarea
            rows={3}
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Add notes / review comments..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {status === 'pending_assistant_director_review' && (
            <button
              onClick={() => handleAssistantDirectorReview(app)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Review & Forward
            </button>
          )}

          {status === 'pending_deputy_director_review' && (
            <button
              onClick={() => handleDeputyDirectorRecommend(app)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              Recommend
            </button>
          )}

          {status === 'pending_domains_officer_review' && (
            <button
              onClick={() => handleDomainsOfficerRecommendReport(app)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
            >
              Recommend for IAC
            </button>
          )}

          {status === 'pending_iac_approval' && (
            <>
              <button
                onClick={() => handleIacResolution(app, 'approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Approve Report
              </button>
              <button
                onClick={() => handleIacResolution(app, 'declined')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Decline Report
              </button>
            </>
          )}

          {status === 'pending_outcome_letter_generation' && (
            <button
              onClick={() => openLetterEditor(app)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
            >
              Generate Outcome Letter
            </button>
          )}

          {status === 'pending_domains_officer_outcome_review' && (
            <button
              onClick={() => handleDomainsOfficerOutcomeRecommend(app)}
              className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 text-sm"
            >
              Recommend Outcome Letter
            </button>
          )}

          {status === 'pending_chief_director_approval' && (
            <>
              <button
                onClick={() => handleChiefDirectorFinal(app, 'approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Approve Outcome Letter
              </button>
              <button
                onClick={() => handleChiefDirectorFinal(app, 'declined')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Decline Outcome Letter
              </button>
            </>
          )}

          {status === 'approved' && !workflow?.communicatedAt && (
            <button
              onClick={() => handleCommunicateOutcome(app)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 text-sm flex items-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Communicate Outcome
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderDetailsTab = () => {
    if (!selectedApplication) return null;

    const workflow = getWorkflow(selectedApplication);
    const report = selectedApplication.siteVisitReport as any;

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Application Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Application ID</p>
              <p className="text-sm font-semibold text-gray-800">{selectedApplication.applicationId}</p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Current Workflow Status</p>
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STAGE_BADGES[workflow?.status || 'pending_assistant_director_review']}`}>
                {STAGE_LABELS[workflow?.status || 'pending_assistant_director_review']}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Organisation</p>
              <p className="text-sm font-semibold text-gray-800">
                {selectedApplication.applicationData?.applicantInfo.organisationName}
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Qualification</p>
              <p className="text-sm font-semibold text-gray-800">
                {selectedApplication.applicationData?.qualification}
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Applicant Name</p>
              <p className="text-sm font-semibold text-gray-800">
                {selectedApplication.applicationData?.applicantInfo.fullName}
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Phone</p>
              <p className="text-sm font-semibold text-gray-800">
                {selectedApplication.applicationData?.applicantInfo.phone}
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 md:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Training Location</p>
              <p className="text-sm font-semibold text-gray-800">
                {selectedApplication.applicationData?.applicantInfo.trainingLocation}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Approval Timeline</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              Assistant Director: {workflow?.assistantDirectorReviewedAt ? new Date(workflow.assistantDirectorReviewedAt).toLocaleString() : 'Pending'}
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              Deputy Director: {workflow?.deputyDirectorReviewedAt ? new Date(workflow.deputyDirectorReviewedAt).toLocaleString() : 'Pending'}
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              Domains Officer: {workflow?.domainsOfficerReviewedAt ? new Date(workflow.domainsOfficerReviewedAt).toLocaleString() : 'Pending'}
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              IAC: {workflow?.iacReviewedAt ? new Date(workflow.iacReviewedAt).toLocaleString() : 'Pending'}
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              Outcome Letter Generated: {workflow?.outcomeLetterGeneratedAt ? new Date(workflow.outcomeLetterGeneratedAt).toLocaleString() : 'Pending'}
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              Chief Director: {workflow?.chiefDirectorReviewedAt ? new Date(workflow.chiefDirectorReviewedAt).toLocaleString() : 'Pending'}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Workflow Notes</h4>
          {workflow?.comments && workflow.comments.length > 0 ? (
            <div className="space-y-2">
              {workflow.comments.map((comment, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 text-sm text-gray-700">
                  {comment}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No workflow notes yet.</p>
          )}
        </div>

        {report?.visitExecution && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Visit Execution Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Conducted By</p>
                <p className="text-sm font-semibold text-gray-800">
                  {report.visitExecution.conductorName || report.conductedBy || 'N/A'}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Location</p>
                <p className="text-sm font-semibold text-gray-800">
                  {report.visitExecution.location || 'No location recorded'}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="text-sm font-semibold text-gray-800">
                  {report.visitExecution.durationMinutes
                    ? `${report.visitExecution.durationMinutes} minute(s)`
                    : 'Not recorded'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

 const renderSiteVisitReportTab = () => {
  if (!selectedApplication) return null;

  const report = selectedApplication.siteVisitReport as any;
  const visitExecution = report?.visitExecution || {};
  const headerFields = report?.headerFields || {};
  const reportSections = report?.sections || [];

  if (!report) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No site visit report available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-2">Site Visit Report</h3>
        <p className="text-sm opacity-90">Conducted by: {report.conductedBy}</p>
        <p className="text-sm opacity-90">
          Date: {new Date(report.completedAt || report.conductedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Key Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Outcome</p>
          <p
            className={`text-lg font-semibold ${
              report.outcome === 'compliant'
                ? 'text-green-600'
                : report.outcome === 'partially_compliant'
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {String(report.outcome || '').replace('_', ' ').toUpperCase()}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Conducted By</p>
          <p className="text-lg font-semibold text-gray-800">{report.conductedBy}</p>
          <p className="text-xs text-gray-500">
            {report.conductedByRole === 'qp'
              ? 'Quality Partner'
              : report.conductedByRole === 'verifier'
              ? 'Verifier'
              : report.conductedByRole}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Date Completed</p>
          <p className="text-lg font-semibold text-gray-800">
            {new Date(report.completedAt || report.conductedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Site Visit Conductor Information */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Site Visit Conductor Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Conductor Name</p>
            <p className="text-sm font-semibold text-gray-800">
              {visitExecution.conductorName || report.conductedBy}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Conductor Role</p>
            <p className="text-sm font-semibold text-gray-800">
              {visitExecution.conductorRole === 'qp'
                ? 'Quality Partner'
                : visitExecution.conductorRole === 'verifier'
                ? 'Verifier'
                : report.conductedByRole === 'qp'
                ? 'Quality Partner'
                : report.conductedByRole === 'verifier'
                ? 'Verifier'
                : report.conductedByRole}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Current Location</p>
            <p className="text-sm font-semibold text-gray-800">
              {visitExecution.location || 'No location recorded'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">On-Site Verification</p>
            <p
              className={`text-sm font-semibold ${
                visitExecution.onSiteVerified ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {visitExecution.onSiteVerified ? 'Verified On-Site' : 'Not Verified'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Started At</p>
            <p className="text-sm font-semibold text-gray-800">
              {visitExecution.visitStartedAt
                ? new Date(visitExecution.visitStartedAt).toLocaleString()
                : 'Not recorded'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Ended At</p>
            <p className="text-sm font-semibold text-gray-800">
              {visitExecution.visitCompletedAt
                ? new Date(visitExecution.visitCompletedAt).toLocaleString()
                : 'Not recorded'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Duration</p>
            <p className="text-sm font-semibold text-gray-800">
              {visitExecution.durationMinutes
                ? `${visitExecution.durationMinutes} minute(s)`
                : 'Not recorded'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Verified At</p>
            <p className="text-sm font-semibold text-gray-800">
              {visitExecution.onSiteVerifiedAt
                ? new Date(visitExecution.onSiteVerifiedAt).toLocaleString()
                : 'Not recorded'}
            </p>
          </div>
        </div>

        {visitExecution.onSiteVerifiedAt && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              On-site presence was verified at{' '}
              {new Date(visitExecution.onSiteVerifiedAt).toLocaleString()}.
            </p>
          </div>
        )}
      </div>

      {/* QCTO Evaluation Summary */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Evaluation Summary
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Legal Name of SDP</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.legalName ||
                selectedApplication.applicationData?.applicantInfo.organisationName ||
                'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Physical Address</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.physicalAddress ||
                selectedApplication.applicationData?.applicantInfo.trainingLocation ||
                'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Contact Person</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.contactPerson ||
                selectedApplication.applicationData?.applicantInfo.fullName ||
                'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Contact Number</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.contactNumber ||
                selectedApplication.applicationData?.applicantInfo.phone ||
                'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Contact Email</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.contactEmail ||
                selectedApplication.applicationData?.applicantInfo.email ||
                'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Site Visit Date</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.siteVisitDate
                ? new Date(headerFields.siteVisitDate).toLocaleDateString()
                : new Date(report.conductedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Qualification Title</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.qualificationTitle ||
                report.qualification ||
                selectedApplication.applicationData?.qualification ||
                'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">NQF Level</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.nqfLevel || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Credits</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.credits || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">SAQA ID</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.saqaId || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Curriculum Code</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.curriculumCode || 'N/A'}
            </p>
          </div>

          {'deliveryMode' in report && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Delivery Mode</p>
              <p className="text-sm font-semibold text-gray-800">
                {report.deliveryMode === 'face_to_face'
                  ? 'Face-to-Face'
                  : report.deliveryMode === 'hybrid_blended'
                  ? 'Hybrid / Blended'
                  : report.deliveryMode === 'mobile_unit'
                  ? 'Mobile Unit'
                  : 'N/A'}
              </p>
            </div>
          )}

          {report.riskProfile && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Risk Profile</p>
              <p
                className={`text-sm font-semibold ${
                  report.riskProfile === 'low'
                    ? 'text-green-600'
                    : report.riskProfile === 'medium'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {report.riskProfile.toUpperCase()}
              </p>
            </div>
          )}

          {report.recommendation && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Recommendation</p>
              <p
                className={`text-sm font-semibold ${
                  report.recommendation === 'recommended'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {report.recommendation === 'recommended'
                  ? 'Recommended'
                  : 'Not Recommended'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Executive Summary</h4>
        <p className="text-gray-700 whitespace-pre-wrap">{report.summary}</p>
      </div>

      {/* Recommendations */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h4>
        <p className="text-gray-700 whitespace-pre-wrap">{report.recommendations}</p>
      </div>

      {/* Additional Comments */}
      {report.additionalComments && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">
            Additional Comments
          </h4>
          <p className="text-gray-700 whitespace-pre-wrap">{report.additionalComments}</p>
        </div>
      )}

      {/* Grouped Sections */}
      {Array.isArray(reportSections) && reportSections.length > 0 ? (
        <div className="space-y-4">
          {reportSections.map((section: any) => (
            <div key={section.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">{section.title}</h4>

              <div className="space-y-4">
                {section.items?.map((item: any) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                            {item.id}
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            {item.criteria}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          item.response === 'yes'
                            ? 'bg-green-100 text-green-800'
                            : item.response === 'no'
                            ? 'bg-red-100 text-red-800'
                            : item.response === 'na'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.response ? item.response.toUpperCase() : 'NOT ANSWERED'}
                      </span>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Remarks</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {item.comments || 'No remarks provided'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Checklist</h4>
          <div className="space-y-4">
            {report.checklist?.map((item: any) => (
              <div
                key={item.id}
                className="border-b border-gray-200 last:border-0 pb-4 last:pb-0"
              >
                <div className="flex items-start space-x-3">
                  {item.isMet ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.criteria}</p>
                    {item.comments && (
                      <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded whitespace-pre-wrap">
                        {item.comments}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Gallery */}
      {report.evidence && report.evidence.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Evidence Collected ({report.evidence.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {report.evidence.map((item: any) => (
              <a
                key={item.id}
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                {item.type === 'photo' ? (
                  <div className="aspect-square bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-2xl">📷</span>
                  </div>
                ) : (
                  <div className="aspect-square bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-2xl">📄</span>
                  </div>
                )}
                <p className="text-xs font-medium text-gray-700 truncate">{item.fileName}</p>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

  const renderOutcomeLetterTab = () => {
    if (!selectedApplication) return null;

    const letter = getOutcomeLetter(selectedApplication);

    if (!letter) {
      return (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No outcome letter generated yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Letter Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Title</p>
              <p className="text-sm font-semibold text-gray-800">{letter.letterTitle}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Generated By</p>
              <p className="text-sm font-semibold text-gray-800">{letter.generatedBy}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Generated At</p>
              <p className="text-sm font-semibold text-gray-800">
                {new Date(letter.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Letter Body</h4>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{letter.letterBody}</p>
          </div>
        </div>
      </div>
    );
  };

  const stageOrder: ApprovalStage[] = [
    'pending_assistant_director_review',
    'pending_deputy_director_review',
    'pending_domains_officer_review',
    'pending_iac_approval',
    'pending_outcome_letter_generation',
    'pending_domains_officer_outcome_review',
    'pending_chief_director_approval',
    'approved',
    'declined',
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Outcome Letters</h1>
              <p className="text-sm text-gray-600">
                Manage site visit report approvals and generate final outcome letters
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-600">Completed Site Visits</p>
            <p className="text-2xl font-bold text-blue-800">{completedVisitApps.length}</p>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-600">Pending Approvals</p>
            <p className="text-2xl font-bold text-yellow-800">
              {
                filteredApplications.filter((a) => {
                  const s = getWorkflow(a)?.status;
                  return s && !['approved', 'declined'].includes(s);
                }).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-600">Approved</p>
            <p className="text-2xl font-bold text-green-800">
              {filteredApplications.filter((a) => getWorkflow(a)?.status === 'approved').length}
            </p>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-600">Declined</p>
            <p className="text-2xl font-bold text-red-800">
              {filteredApplications.filter((a) => getWorkflow(a)?.status === 'declined').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApprovalStage | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Workflow Statuses</option>
              {stageOrder.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {completedVisitApps.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            No completed site visits are ready for outcome processing yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {stageOrder.map((stage) => {
            const apps = groupedApplications[stage] || [];
            if (apps.length === 0) return null;

            return (
              <section key={stage} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">{STAGE_LABELS[stage]}</h2>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${STAGE_BADGES[stage]}`}
                  >
                    {apps.length}
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Application
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organisation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qualification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Region
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Site Visit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Workflow Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {apps.map((app) => {
                        const workflow =
                          getWorkflow(app) ||
                          ({
                            status: 'pending_assistant_director_review',
                          } as OutcomeLetterWorkflow);

                        return (
                          <tr key={app.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {app.applicationId}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {app.applicationData?.applicantInfo.organisationName}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {app.applicationData?.qualification}
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {app.applicationData?.applicantInfo.region}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {app.siteVisitSchedule?.visitCompletedAt
                                ? new Date(
                                    app.siteVisitSchedule.visitCompletedAt
                                  ).toLocaleDateString()
                                : 'Completed'}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${STAGE_BADGES[workflow.status]}`}
                              >
                                {STAGE_LABELS[workflow.status]}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => openApplicationModal(app)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Outcome Workflow: {selectedApplication.applicationId}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedApplication.applicationData?.applicantInfo.organisationName}
                  </p>
                </div>

                <button
                  onClick={closeApplicationModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-4 mt-4 border-b border-gray-200">
                <button
                  onClick={() => setModalTab('details')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    modalTab === 'details'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setModalTab('site-visit-report')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    modalTab === 'site-visit-report'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  Site Visit Report
                </button>
                <button
                  onClick={() => setModalTab('outcome-letter')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    modalTab === 'outcome-letter'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  Outcome Letter
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {modalTab === 'details' && renderDetailsTab()}
              {modalTab === 'site-visit-report' && renderSiteVisitReportTab()}
              {modalTab === 'outcome-letter' && renderOutcomeLetterTab()}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-3">
                  Review Actions
                </h4>
                {renderStageActions(selectedApplication)}
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeApplicationModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showLetterEditor && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Generate Outcome Letter</h3>
              <p className="text-sm text-gray-500 mt-1">{selectedApplication.applicationId}</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Letter Title
                </label>
                <input
                  value={draftLetterTitle}
                  onChange={(e) => setDraftLetterTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Letter Body
                </label>
                <textarea
                  rows={14}
                  value={draftLetterBody}
                  onChange={(e) => setDraftLetterBody(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowLetterEditor(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateOutcomeLetter}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Generate Letter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}