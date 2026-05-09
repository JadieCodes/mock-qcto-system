// components/modals/DevelopmentProjectModal.tsx - Fixed approval workflow
import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  User,
  Calendar,
  Users,
  MessageSquare,
  Edit,
  Upload,
  GitBranch,
  Award,
  TrendingUp,
  Paperclip,
  Tag,
  ChevronRight,
  ChevronLeft,
  Printer,
  Share2,
  Plus,
  Send,
  RefreshCw,
  Target,
  BookOpen,
  Shield,
  CheckSquare as CheckSquareIcon
} from 'lucide-react';

interface Phase {
  name: string;
  startDate: string;
  endDate: string;
  responsibleRole: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedDate?: string;
  approved?: boolean;
  notes?: string;
  reportSubmitted?: boolean;
  reportData?: any;
}

interface DocumentType {
  id: string;
  name: string;
  file: string;
  size: number;
  uploadedBy: string;
  uploadedDate: string;
  version: string;
  status: string;
  section?: string;
  type?: string;
}

interface DevelopmentProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any | null;
  mode: 'development' | 'resolution';
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function DevelopmentProjectModal({ 
  isOpen, 
  onClose, 
  project,
  mode 
}: DevelopmentProjectModalProps) {
  const phases: Phase[] = project?.phases || [];
  const [activePhaseTab, setActivePhaseTab] = useState<string>(phases[0]?.name || 'overview');
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'phaseDetails' | 'documents'>('overview');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isReportReviewOpen, setIsReportReviewOpen] = useState(false);
  const [selectedReportPhase, setSelectedReportPhase] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!isOpen || !project) return null;

  const currentPhaseData = phases.find(p => p.name === activePhaseTab);
  const currentPhaseIndex = phases.findIndex(p => p.name === activePhaseTab);

  // Get report data for the phase
  const getReportData = (phaseName: string) => {
    const submittedReports = localStorage.getItem('submittedPhaseReports');
    if (submittedReports) {
      const reports = JSON.parse(submittedReports);
      const report = reports.find((r: any) => 
        r.qualificationCode === project.id && r.phaseName === phaseName
      );
      return report;
    }
    return null;
  };

  // Refresh project data from localStorage
  const refreshProjectData = () => {
    const internalPlans = localStorage.getItem('internalCyclePlans');
    if (internalPlans) {
      const plans = JSON.parse(internalPlans);
      const updatedProject = plans.find((p: any) => p.qualificationCode === project.id);
      if (updatedProject) {
        // Update the phases array with fresh data
        const updatedPhases = updatedProject.phases;
        // Update the project phases
        project.phases = updatedPhases;
        setRefreshKey(prev => prev + 1);
      }
    }
  };

  const reportData = currentPhaseData ? getReportData(currentPhaseData.name) : null;
  const fullReport = reportData?.reportData || currentPhaseData?.reportData;

  // Get actual uploaded documents from localStorage for the current phase
  const getPhaseDocuments = (phaseName: string): DocumentType[] => {
    const storedFiles = localStorage.getItem(`phaseFiles_${project.id}_${phaseName}`);
    if (storedFiles) {
      const files = JSON.parse(storedFiles);
      return files.map((file: any, index: number) => ({
        id: file.id || String(index),
        name: file.name,
        file: file.data,
        size: file.size,
        uploadedBy: 'External Team',
        uploadedDate: file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown',
        version: 'v1.0',
        status: 'pending',
        section: file.section,
        type: file.type
      }));
    }
    return [];
  };

  const documents = getPhaseDocuments(activePhaseTab);

  // Handle Phase Approval
 // Handle Phase Approval - Updated to move to Resolution Phase when Final Verification is approved
// In DevelopmentProjectModal.tsx - Fix the handleApprovePhase function
// In DevelopmentProjectModal.tsx - Fix the resolution creation
 const handleApprovePhase = () => {
    if (!selectedReportPhase) return;
    
    setIsApproving(true);
    
    const phaseToApprove = phases.find(p => p.name === selectedReportPhase);
    if (!phaseToApprove) {
      setIsApproving(false);
      return;
    }
    
    // Update phase status to approved
    const updatedPhases = phases.map(p => 
      p.name === selectedReportPhase 
        ? { ...p, approved: true, status: 'completed' as const, approvedDate: new Date().toISOString(), approvalNotes, reportSubmitted: true }
        : p
    );
    
    // Update cyclePlans
    const cyclePlans = localStorage.getItem('cyclePlans');
    if (cyclePlans) {
      const plans = JSON.parse(cyclePlans);
      const updatedPlans = plans.map((plan: any) => {
        if (plan.qualificationCode === project.id) {
          return { ...plan, phases: updatedPhases };
        }
        return plan;
      });
      localStorage.setItem('cyclePlans', JSON.stringify(updatedPlans));
    }
    
    // Update internalCyclePlans
    const internalPlans = localStorage.getItem('internalCyclePlans');
    if (internalPlans) {
      const internal = JSON.parse(internalPlans);
      const updatedInternal = internal.map((plan: any) => {
        if (plan.qualificationCode === project.id) {
          return { ...plan, phases: updatedPhases };
        }
        return plan;
      });
      localStorage.setItem('internalCyclePlans', JSON.stringify(updatedInternal));
    }
    
    // Update submitted phase reports
    const submittedReports = localStorage.getItem('submittedPhaseReports');
    if (submittedReports) {
      const reports = JSON.parse(submittedReports);
      const updatedReports = reports.map((report: any) => {
        if (report.qualificationCode === project.id && report.phaseName === selectedReportPhase) {
          return { ...report, status: 'approved', approvalNotes, approvedAt: new Date().toISOString() };
        }
        return report;
      });
      localStorage.setItem('submittedPhaseReports', JSON.stringify(updatedReports));
    }
    
    // Move to Resolution Phase if Final Verification
    if (selectedReportPhase === 'Final Verification') {
      const allPhasesCompleted = updatedPhases.every(p => p.status === 'completed' || p.approved === true);
      
      if (allPhasesCompleted) {
        const existingResolutions = localStorage.getItem('resolutionProjects');
        let resolutions = existingResolutions ? JSON.parse(existingResolutions) : [];
        
        // Remove existing entry for this qualification
        resolutions = resolutions.filter((r: any) => r.qualificationCode !== project.id);
        
        const newResolution = {
          id: project.id,
          qualificationCode: project.id,
          qualificationTitle: project.qualificationTitle || project.title,
          submitterName: project.projectLead || 'External Team',
          submissionDate: new Date().toISOString().split('T')[0],
          status: 'pending_review',
          progress: 0,
          allPhasesCompleted: true,
          finalVerificationApproved: true,
          checklists: [
            { id: 'c1', item: 'All phase reports submitted and approved', required: true, completed: true },
            { id: 'c2', item: 'Final verification report reviewed', required: true, completed: true },
            { id: 'c3', item: 'Quality assurance standards met', required: true, completed: false },
            { id: 'c4', item: 'Industry stakeholder consultation completed', required: true, completed: false },
            { id: 'c5', item: 'Alignment with NQF level descriptors verified', required: true, completed: false },
            { id: 'c6', item: 'Credit value justification provided', required: true, completed: false },
            { id: 'c7', item: 'Articulation routes identified', required: false, completed: false },
            { id: 'c8', item: 'Assessment strategy approved', required: true, completed: false }
          ]
        };
        
        resolutions.push(newResolution);
        localStorage.setItem('resolutionProjects', JSON.stringify(resolutions));
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'resolutionProjects',
          newValue: JSON.stringify(resolutions)
        }));
        
        window.dispatchEvent(new CustomEvent('refreshWorkspace'));
      }
    }
    
    // Dispatch storage events
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cyclePlans',
      newValue: localStorage.getItem('cyclePlans')
    }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'internalCyclePlans',
      newValue: localStorage.getItem('internalCyclePlans')
    }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'submittedPhaseReports',
      newValue: localStorage.getItem('submittedPhaseReports')
    }));
    
    setIsApproving(false);
    setIsReportReviewOpen(false);
    setSelectedReportPhase(null);
    setApprovalNotes('');
    
    // Update local phases
    project.phases = updatedPhases;
    setRefreshKey(prev => prev + 1);
    
    // Close the modal after approval
    onClose();
  };

  // Helper function to render the full report content based on phase type
  const renderFullReportContent = (phase: Phase, report: any) => {
    const phaseName = phase.name;
    
    switch(phaseName) {
      case 'Scoping':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Section 1 — Objectives</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Phase Objective</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{report?.scopeSummary || report?.objectives || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Key Questions / Goals</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{report?.keyGoals || report?.findings || 'Not specified'}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2"><Paperclip className="w-4 h-4" /> Section 2 — Research Inputs</h3>
              <div className="space-y-2">
                {report?.uploadedFiles?.filter((f: any) => f.section === 'researchInputs').map((file: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                ))}
                {(!report?.uploadedFiles || report.uploadedFiles.filter((f: any) => f.section === 'researchInputs').length === 0) && (
                  <p className="text-sm text-gray-500">No research documents uploaded</p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 3 — Findings / Analysis</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Findings Summary</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{report?.findingsSummary || report?.findings || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Key Insights</p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {report?.keyInsights?.map((insight: string, i: number) => (
                      <li key={i}>{insight}</li>
                    )) || <li>No insights recorded</li>}
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Section 4 — SME Collaboration</h3>
              <div>
                <p className="text-xs text-gray-500">Assigned Users</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {report?.assignedTeam?.map((id: string, i: number) => (
                    <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">Team Member {id}</span>
                  ))}
                  {(!report?.assignedTeam || report.assignedTeam.length === 0) && (
                    <p className="text-sm text-gray-500">No team members assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'Profile':
      case 'Curriculum Specification':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Section 1 — Competency / Outcome Mapping</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr><th className="p-2 text-left">Competency</th><th className="p-2 text-left">Learning Outcome</th><th className="p-2 text-left">Industry Standard</th></tr>
                  </thead>
                  <tbody>
                    {report?.competencies?.map((comp: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{comp.competency || '-'}</td>
                        <td className="p-2">{comp.outcome || '-'}</td>
                        <td className="p-2">{comp.standard || '-'}</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 2 — Profile Definition</h3>
              <div className="space-y-4">
                <div><p className="text-xs text-gray-500">Occupational Profile</p><p className="text-sm mt-1">{report?.occupationalProfile || 'Not specified'}</p></div>
                <div><p className="text-xs text-gray-500">Learner Profile</p><p className="text-sm mt-1">{report?.learnerProfile || 'Not specified'}</p></div>
                <div><p className="text-xs text-gray-500">Entry Requirements</p><p className="text-sm mt-1">{report?.entryRequirements || 'Not specified'}</p></div>
                <div><p className="text-xs text-gray-500">Exit Level Outcomes</p><p className="text-sm mt-1">{report?.exitLevelOutcomes || 'Not specified'}</p></div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 3 — Standards Mapping</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-xs text-gray-500">NQF Level</p><p className="text-sm mt-1">{report?.nqfLevel || 'Not selected'}</p></div>
                <div><p className="text-xs text-gray-500">Regulatory Standard</p><p className="text-sm mt-1">{report?.regulatoryStandard || 'Not selected'}</p></div>
                <div><p className="text-xs text-gray-500">Industry Body</p><p className="text-sm mt-1">{report?.industryBody || 'Not selected'}</p></div>
              </div>
            </div>
          </div>
        );

      case 'Knowledge & Practice':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Section 1 — Curriculum Builder</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr><th className="p-2">Module</th><th className="p-2">Learning Outcome</th><th className="p-2">Hours</th><th className="p-2">Assessment Type</th></tr>
                  </thead>
                  <tbody>
                    {report?.modules?.map((mod: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{mod.module || '-'}</td>
                        <td className="p-2">{mod.outcome || '-'}</td>
                        <td className="p-2">{mod.hours || '-'}</td>
                        <td className="p-2">{mod.assessment || '-'}</td>
                       </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 2 — Knowledge / Practice / Workplace</h3>
              <div className="space-y-4">
                <details className="border rounded-lg"><summary className="p-3 font-medium cursor-pointer">Knowledge Requirements</summary><div className="p-3 border-t"><p className="text-sm">{report?.knowledgeReq || 'No knowledge requirements specified'}</p></div></details>
                <details className="border rounded-lg"><summary className="p-3 font-medium cursor-pointer">Practical Requirements</summary><div className="p-3 border-t"><p className="text-sm">{report?.practiceReq || 'No practical requirements specified'}</p></div></details>
                <details className="border rounded-lg"><summary className="p-3 font-medium cursor-pointer">Workplace Experience</summary><div className="p-3 border-t"><p className="text-sm">{report?.workplaceReq || 'No workplace requirements specified'}</p></div></details>
              </div>
            </div>
          </div>
        );

      case 'Qualification Document':
        return (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Qualification Document Compilation</h3>
            <div className="space-y-4">
              <div><p className="text-xs text-gray-500">Document Summary</p><p className="text-sm mt-1">{report?.documentSummary || report?.objectives || 'Not specified'}</p></div>
              <div className="border rounded-lg p-4 bg-white text-center">
                {report?.uploadedFiles?.some((f: any) => f.section === 'qualificationDocument') ? (
                  <div className="space-y-2"><CheckCircle className="w-8 h-8 text-green-500 mx-auto" /><p className="text-sm text-green-600">Qualification document uploaded</p></div>
                ) : (<p className="text-sm text-gray-500">No document uploaded</p>)}
              </div>
            </div>
          </div>
        );

      case 'Final Verification':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg"><h3 className="font-medium mb-3 flex items-center gap-2"><Award className="w-4 h-4" /> Section 1 — Summary Dashboard</h3>
              <div className="grid grid-cols-2 gap-4">{['Scoping', 'Profile', 'Curriculum', 'Knowledge & Practice'].map((item) => (<div key={item} className="bg-white p-3 rounded-lg border"><div className="flex items-center justify-between"><span className="text-sm">{item}</span><CheckCircle className="w-5 h-5 text-green-500" /></div></div>))}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg"><h3 className="font-medium mb-3">Section 2 — Compliance Checklist</h3>
              <div className="space-y-2">{report?.complianceChecklist?.map((item: any, i: number) => (<div key={i} className="flex items-center gap-2"><CheckCircle className={`w-4 h-4 ${item.checked ? 'text-green-500' : 'text-gray-300'}`} /><span className="text-sm">{item.item}</span></div>))}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg"><h3 className="font-medium mb-3">Section 3 — Issues</h3>
              <div className="space-y-2">{report?.issues?.map((issue: any, i: number) => (<div key={i} className="bg-white p-3 rounded-lg border"><div className="flex justify-between"><p className="font-medium">{issue.issue}</p><span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">{issue.severity}</span></div><p className="text-sm text-gray-600 mt-1">{issue.recommendation}</p></div>))}</div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Report Summary</h3>
            <div className="space-y-4">
              <div><p className="text-xs text-gray-500">Phase Objectives</p><p className="text-sm mt-1">{fullReport?.objectives || 'Not specified'}</p></div>
              <div><p className="text-xs text-gray-500">Findings / Outcomes</p><p className="text-sm mt-1">{fullReport?.findings || 'Not specified'}</p></div>
              <div><p className="text-xs text-gray-500">Deliverables</p><ul className="list-disc list-inside text-sm mt-1">{fullReport?.deliverables?.map((d: string, i: number) => <li key={i}>{d}</li>) || <li>No deliverables specified</li>}</ul></div>
            </div>
          </div>
        );
    }
  };

  // Render document entries from actual uploaded files
  const renderDocumentEntries = () => {
    if (documents.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No documents uploaded for this phase</p>
          <p className="text-xs text-gray-400 mt-1">Documents will appear here once the external team uploads them</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{doc.name}</h4>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {formatFileSize(doc.size)}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {doc.uploadedBy}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {doc.uploadedDate}</span>
                  </div>
                  {doc.section && <span className="text-xs text-gray-400 mt-1 block">Section: {doc.section}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (doc.file) {
                      const link = document.createElement('a');
                      link.href = doc.file;
                      link.download = doc.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Preview">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Submitted Phase Report section
  const renderSubmittedReportSection = () => {
    if (!currentPhaseData) return null;
    if (!currentPhaseData?.reportSubmitted && !fullReport) return null;
    
    return (
      <div className="bg-white border rounded-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-white px-4 py-3 border-b">
          <h3 className="font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Submitted Phase Report
            {currentPhaseData?.reportSubmitted && !currentPhaseData?.approved && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending Review</span>
            )}
            {currentPhaseData?.approved && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Approved</span>
            )}
          </h3>
        </div>
        <div className="p-4">
          {renderFullReportContent(currentPhaseData, fullReport)}
        </div>
        {/* Add Approve button directly in the report section if not approved */}
        {currentPhaseData?.reportSubmitted && !currentPhaseData?.approved && (
          <div className="px-4 py-3 border-t bg-gray-50 flex justify-end">
            <button 
              onClick={() => {
                setSelectedReportPhase(currentPhaseData.name);
                setIsReportReviewOpen(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Review & Approve Phase
            </button>
          </div>
        )}
      </div>
    );
  };

  // Get status badge for phase
  const getStatusBadge = (status: string, reportSubmitted?: boolean, approved?: boolean) => {
    if (approved) {
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
    }
    if (reportSubmitted) {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Review</span>;
    }
    switch(status) {
      case 'completed':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'in-progress':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-800">
                {mode === 'development' ? 'Development Project' : 'Resolution Project'}
              </h2>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">ID: {project.id}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{project.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Info Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600"><Calendar className="w-4 h-4" /><span>Start Date: {project.startDate || 'Not set'}</span></div>
          <div className="flex items-center gap-1 text-gray-600"><Calendar className="w-4 h-4" /><span>Target Date: {project.targetDate || 'Not set'}</span></div>
          <div className="flex items-center gap-1 text-gray-600"><User className="w-4 h-4" /><span>Project Lead: {project.projectLead || 'Unassigned'}</span></div>
          <div className="flex items-center gap-1 text-gray-600"><Users className="w-4 h-4" /><span>Team: {project.teamSize || 0} members</span></div>
        </div>

        {/* Main Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-6">
            <button onClick={() => setActiveMainTab('overview')} className={`py-3 font-medium text-sm border-b-2 transition-colors ${activeMainTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Overview</button>
            <button onClick={() => setActiveMainTab('phaseDetails')} className={`py-3 font-medium text-sm border-b-2 transition-colors ${activeMainTab === 'phaseDetails' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Phase Details</button>
            <button onClick={() => setActiveMainTab('documents')} className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeMainTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><FileText className="w-4 h-4" />Documents</button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6" key={refreshKey}>
          {activeMainTab === 'overview' && (
            <div className="space-y-6">
              {/* Improved Progress Overview with circular design */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-4">Project Progress</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none"/>
                      <circle cx="48" cy="48" r="42" stroke="white" strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - (project.progress || 0) / 100)}`} className="transition-all duration-500"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{Math.round(project.progress || 0)}%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-xs opacity-80">Completed Phases</p>
                        <p className="text-xl font-bold">{phases.filter(p => p.status === 'completed').length}/{phases.length}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-xs opacity-80">Approved Phases</p>
                        <p className="text-xl font-bold">{phases.filter(p => p.approved).length}/{phases.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Last updated: {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border rounded-lg p-4"><h3 className="font-medium mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />Project Description</h3><p className="text-sm text-gray-600">{project.description || 'No description provided'}</p></div>
                <div className="border rounded-lg p-4"><h3 className="font-medium mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" />Team Members</h3><div className="space-y-2"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">SJ</div><div><p className="text-sm font-medium">Dr. Sarah Johnson</p><p className="text-xs text-gray-500">Lead Developer</p></div></div><div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-medium">MC</div><div><p className="text-sm font-medium">Prof. Michael Chen</p><p className="text-xs text-gray-500">Subject Matter Expert</p></div></div></div></div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2"><Flag className="w-4 h-4 text-blue-600" />Key Milestones</h3>
                <div className="space-y-3">
                  {phases.map((phase, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${phase.status === 'completed' ? 'bg-green-500' : phase.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      <span className="text-sm flex-1">{phase.name}</span>
                      <span className="text-xs text-gray-500">{phase.startDate} - {phase.endDate}</span>
                      {getStatusBadge(phase.status, phase.reportSubmitted, phase.approved)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeMainTab === 'phaseDetails' && (
            <div className="space-y-6">
              <div className="border-b"><div className="flex gap-1 overflow-x-auto pb-2">
                <button onClick={() => setActivePhaseTab('overview')} className={`px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${activePhaseTab === 'overview' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>All Phases Overview</button>
                {phases.map((phase) => (<button key={phase.name} onClick={() => setActivePhaseTab(phase.name)} className={`px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${activePhaseTab === phase.name ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>{phase.name}{phase.reportSubmitted && !phase.approved && <Clock className="w-3 h-3 text-yellow-500" />}{phase.approved && <CheckCircle className="w-3 h-3 text-green-500" />}</button>))}
              </div></div>

              {activePhaseTab === 'overview' ? (
                <div className="space-y-4"><h3 className="font-medium text-lg">All Phases Progress</h3><div className="space-y-3">{phases.map((phase, idx) => (<div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow"><div className="flex justify-between items-start mb-3"><div><h4 className="font-medium">{phase.name}</h4><p className="text-xs text-gray-500">{phase.startDate} - {phase.endDate} | Responsible: {phase.responsibleRole}</p></div>{getStatusBadge(phase.status, phase.reportSubmitted, phase.approved)}</div>{phase.notes && <p className="text-sm text-gray-600 mt-2">{phase.notes}</p>}{phase.reportSubmitted && !phase.approved && (<button onClick={() => { setSelectedReportPhase(phase.name); setIsReportReviewOpen(true); }} className="mt-3 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700"><CheckCircle className="w-3 h-3" /> Review & Approve</button>)}</div>))}</div></div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border"><div className="flex justify-between items-start"><div><h3 className="text-lg font-semibold">{currentPhaseData?.name}</h3><div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600"><span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {currentPhaseData?.startDate} - {currentPhaseData?.endDate}</span><span className="flex items-center gap-1"><User className="w-4 h-4" /> Responsible: {currentPhaseData?.responsibleRole}</span></div></div>{getStatusBadge(currentPhaseData?.status || 'pending', currentPhaseData?.reportSubmitted, currentPhaseData?.approved)}</div></div>

                  <div className="bg-gray-50 rounded-lg p-4"><h3 className="font-medium mb-3">Phase Progress</h3><div className="space-y-3"><div className="flex items-center gap-3"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentPhaseData?.status !== 'pending' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div><div className="flex-1"><p className="text-sm font-medium">Phase Initiated</p><p className="text-xs text-gray-500">Phase has been started</p></div>{currentPhaseData?.status !== 'pending' && <CheckCircle className="w-4 h-4 text-green-500" />}</div><div className="flex items-center gap-3"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentPhaseData?.reportSubmitted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div><div className="flex-1"><p className="text-sm font-medium">Report Submitted</p><p className="text-xs text-gray-500">Phase report has been submitted for review</p></div>{currentPhaseData?.reportSubmitted && <CheckCircle className="w-4 h-4 text-green-500" />}</div><div className="flex items-center gap-3"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentPhaseData?.approved ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>3</div><div className="flex-1"><p className="text-sm font-medium">Phase Approved</p><p className="text-xs text-gray-500">Phase has been approved by the reviewer</p></div>{currentPhaseData?.approved && <CheckCircle className="w-4 h-4 text-green-500" />}</div></div></div>

                  {renderSubmittedReportSection()}

                  {currentPhaseData?.notes && (<div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200"><h3 className="font-medium mb-2 flex items-center gap-2 text-yellow-800"><MessageSquare className="w-4 h-4" />Phase Notes</h3><p className="text-sm text-yellow-700">{currentPhaseData.notes}</p></div>)}
                </div>
              )}
            </div>
          )}

          {activeMainTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center"><h3 className="font-medium text-lg">Phase Documents</h3></div>
              <div className="flex gap-2 overflow-x-auto pb-2 border-b">{phases.map((phase) => (<button key={phase.name} onClick={() => setActivePhaseTab(phase.name)} className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${activePhaseTab === phase.name ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>{phase.name}</button>))}</div>
              <div><h4 className="font-medium mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />{activePhaseTab} Documents</h4>{renderDocumentEntries()}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end items-center">
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white transition-colors">Close</button>
          </div>
        </div>
      </div>

      {/* Report Review Modal with Approve Phase Button */}
      {isReportReviewOpen && selectedReportPhase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
              <div><h3 className="text-lg font-semibold">Review Phase Report: {selectedReportPhase}</h3><p className="text-sm text-gray-500 mt-1">{project.title}</p></div>
              <button onClick={() => { setIsReportReviewOpen(false); setSelectedReportPhase(null); setApprovalNotes(''); }} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {renderFullReportContent(phases.find(p => p.name === selectedReportPhase) as Phase, getReportData(selectedReportPhase)?.reportData)}
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="flex-1 mr-4">
                <textarea 
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add approval notes or comments (these will be visible to the external team)..."
                  className="w-full border rounded-lg p-2 text-sm"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setIsReportReviewOpen(false); setSelectedReportPhase(null); setApprovalNotes(''); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Close</button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Request Changes</button>
                <button onClick={handleApprovePhase} disabled={isApproving} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" /> 
                  {isApproving ? 'Approving...' : 'Approve Phase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Flag icon component
const Flag = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
);