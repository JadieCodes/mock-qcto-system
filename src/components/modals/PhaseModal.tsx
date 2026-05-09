// components/modals/PhaseModal.tsx
import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  Calendar,
  User,
  Send,
  Save,
  CheckSquare,
  Trash2,
  Plus,
  Upload,
  Clock,
  Target,
  BookOpen,
  Users,
  Paperclip,
  Link,
  Briefcase,
  Award,
  Shield,
  GitBranch,
  History,
  MessageSquare,
  Image,
  File,
  FileArchive
} from 'lucide-react';

interface Phase {
  name: string;
  startDate: string;
  endDate: string;
  responsibleRole: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedDate?: string;
  approved?: boolean;
  reportSubmitted?: boolean;
  reportData?: any;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64
  uploadedAt: string;
  phaseName: string;
  section: string;
}

interface PhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  phase: Phase;
  phaseData: {
    objectives: string;
    findings: string;
    deliverables: string[];
    documents: { name: string; url: string }[];
  };
  qualificationCode: string;
  qualificationTitle: string;
  isLocked: boolean;
  isLastPhase: boolean;
}

// Team members data
const teamMembers = [
  { id: '1', name: 'Dr. Sarah Johnson', role: 'Lead Developer', avatar: 'SJ' },
  { id: '2', name: 'Prof. Michael Chen', role: 'Subject Matter Expert', avatar: 'MC' },
  { id: '3', name: 'Ms. Lisa Williams', role: 'Quality Assurer', avatar: 'LW' },
  { id: '4', name: 'Mr. John Smith', role: 'Instructional Designer', avatar: 'JS' },
  { id: '5', name: 'Dr. Emily Brown', role: 'Assessment Specialist', avatar: 'EB' },
];

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file icon
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (fileType.includes('pdf')) return <FileText className="w-4 h-4" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return <FileArchive className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

export default function PhaseModal({
  isOpen,
  onClose,
  onSave,
  phase,
  phaseData,
  qualificationCode,
  qualificationTitle,
  isLocked,
  isLastPhase
}: PhaseModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [localPhaseData, setLocalPhaseData] = useState(phaseData);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState('');
  
  // Upload refs for different sections
  const researchInputsRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<HTMLInputElement>(null);
  const curriculumDocRef = useRef<HTMLInputElement>(null);
  const assessmentStrategyRef = useRef<HTMLInputElement>(null);
  const learningMaterialsRef = useRef<HTMLInputElement>(null);
  const qualificationDocRef = useRef<HTMLInputElement>(null);
  const isReadOnly = phase.reportSubmitted === true || phase.approved === true || isLocked;

   const isInputDisabled = isReadOnly || isLocked;
  
  // Stored files state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    const stored = localStorage.getItem(`phaseFiles_${qualificationCode}_${phase.name}`);
    return stored ? JSON.parse(stored) : [];
  });
  
  // Phase-specific state from old code
  const [assignedTeam, setAssignedTeam] = useState<string[]>(['1', '3']);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  
  // Scoping phase state
  const [scopeSummary, setScopeSummary] = useState('');
  const [findingsSummary, setFindingsSummary] = useState('');
  const [keyInsights, setKeyInsights] = useState<string[]>([]);
  const [newInsight, setNewInsight] = useState('');
  
  // Profile/Curriculum phase state
  const [competencies, setCompetencies] = useState([
    { competency: 'Project Management', outcome: 'Apply PM principles', standard: 'PMBOK 7th' },
    { competency: 'Risk Assessment', outcome: 'Identify project risks', standard: 'ISO 31000' },
  ]);
  
  // Knowledge & Practice phase state
  const [modules, setModules] = useState([
    { module: 'Module 1: Introduction', outcome: 'Understand basics', hours: 20, assessment: 'Quiz' },
    { module: 'Module 2: Advanced Topics', outcome: 'Apply advanced concepts', hours: 30, assessment: 'Project' },
  ]);
  const [knowledgeReq, setKnowledgeReq] = useState('');
  const [practiceReq, setPracticeReq] = useState('');
  const [workplaceReq, setWorkplaceReq] = useState('');
  
  // Final Verification phase state
  const [complianceChecklist, setComplianceChecklist] = useState([
    { item: 'Curriculum aligned to outcomes', checked: false },
    { item: 'NQF standards followed', checked: false },
    { item: 'Workplace requirements defined', checked: false },
    { item: 'Assessment strategy included', checked: false },
  ]);
  const [issues, setIssues] = useState([
    { issue: 'Missing assessment criteria', severity: 'High', recommendation: 'Add criteria for Module 3' },
  ]);
  const [newIssue, setNewIssue] = useState({ issue: '', severity: 'Medium', recommendation: '' });
  
  // History data
  const [history, setHistory] = useState([
    { action: 'Phase started', user: 'System', date: '2024-03-15 09:00', details: 'Initial phase created' },
    { action: 'Team assigned', user: 'Dr. Sarah Johnson', date: '2024-03-15 10:15', details: 'Added team members' },
  ]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File, section: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newFile: UploadedFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result as string,
          uploadedAt: new Date().toISOString(),
          phaseName: phase.name,
          section: section
        };
        
        const updatedFiles = [...uploadedFiles, newFile];
        setUploadedFiles(updatedFiles);
        localStorage.setItem(`phaseFiles_${qualificationCode}_${phase.name}`, JSON.stringify(updatedFiles));
        resolve('success');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    localStorage.setItem(`phaseFiles_${qualificationCode}_${phase.name}`, JSON.stringify(updatedFiles));
  };

  const handleDownloadFile = (file: UploadedFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFileList = (section: string) => {
    const sectionFiles = uploadedFiles.filter(f => f.section === section);
    if (sectionFiles.length === 0) {
      return <p className="text-sm text-gray-500">No files uploaded</p>;
    }
    return (
      <div className="space-y-2 mt-2">
        {sectionFiles.map(file => (
          <div key={file.id} className="flex items-center justify-between bg-white p-2 rounded border">
            <div className="flex items-center gap-2">
              {getFileIcon(file.type)}
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleDownloadFile(file)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              {!isLocked && !phase.reportSubmitted && (
                <button 
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleAddDeliverable = () => {
    if (newDeliverable.trim()) {
      setLocalPhaseData({
        ...localPhaseData,
        deliverables: [...localPhaseData.deliverables, newDeliverable.trim()]
      });
      setNewDeliverable('');
    }
  };

  const handleRemoveDeliverable = (index: number) => {
    setLocalPhaseData({
      ...localPhaseData,
      deliverables: localPhaseData.deliverables.filter((_, i) => i !== index)
    });
  };

  const handleAddInsight = () => {
    if (newInsight.trim()) {
      setKeyInsights([...keyInsights, newInsight]);
      setNewInsight('');
    }
  };

  const handleAddCompetency = () => {
    setCompetencies([...competencies, { competency: '', outcome: '', standard: '' }]);
  };

  const handleAddModule = () => {
    setModules([...modules, { module: '', outcome: '', hours: 0, assessment: 'Quiz' }]);
  };

  const handleAddIssue = () => {
    if (newIssue.issue.trim()) {
      setIssues([...issues, newIssue]);
      setNewIssue({ issue: '', severity: 'Medium', recommendation: '' });
    }
  };

  const toggleTeamMember = (memberId: string) => {
    if (assignedTeam.includes(memberId)) {
      setAssignedTeam(assignedTeam.filter(id => id !== memberId));
    } else {
      setAssignedTeam([...assignedTeam, memberId]);
    }
  };

  const toggleChecklistItem = (index: number) => {
    const newChecklist = [...complianceChecklist];
    newChecklist[index].checked = !newChecklist[index].checked;
    setComplianceChecklist(newChecklist);
  };

  const handleSaveDraft = () => {
    const allData = {
      ...localPhaseData,
      scopeSummary,
      findingsSummary,
      keyInsights,
      competencies,
      modules,
      knowledgeReq,
      practiceReq,
      workplaceReq,
      complianceChecklist,
      issues,
      assignedTeam,
      uploadedFiles: uploadedFiles.map(f => ({ id: f.id, name: f.name, section: f.section }))
    };
    onSave(allData);
    onClose();
  };

// In PhaseModal.tsx - REPLACE the existing handleSubmitReport with this:

const handleSubmitReport = () => {
  setIsSubmitting(true);
  
  const allData = {
    ...localPhaseData,
    scopeSummary,
    findingsSummary,
    keyInsights,
    competencies,
    modules,
    knowledgeReq,
    practiceReq,
    workplaceReq,
    complianceChecklist,
    issues,
    assignedTeam,
    additionalNotes,
    uploadedFiles: uploadedFiles.map(f => ({ id: f.id, name: f.name, section: f.section, size: f.size, type: f.type })),
    phaseName: phase.name,
    qualificationCode,
    qualificationTitle,
    submittedAt: new Date().toISOString()
  };
  
  // Save to submittedPhaseReports
  const submittedReports = localStorage.getItem('submittedPhaseReports') || '[]';
  const reports = JSON.parse(submittedReports);
  
  reports.push({
    qualificationCode,
    qualificationTitle,
    phaseName: phase.name,
    reportData: allData,
    submittedAt: new Date().toISOString(),
    status: 'pending_review'
  });
  
  localStorage.setItem('submittedPhaseReports', JSON.stringify(reports));
  
  // ========== IMPORTANT: Update cycle plan status ==========
  // Change phase status to 'completed' (will be shown as "Pending Review")
  const cyclePlans = localStorage.getItem('cyclePlans');
  if (cyclePlans) {
    const plans = JSON.parse(cyclePlans);
    const updatedPlans = plans.map((plan: any) => {
      if (plan.qualificationCode === qualificationCode) {
        const updatedPhases = plan.phases.map((p: Phase) => 
          p.name === phase.name ? { 
            ...p, 
            status: 'completed', 
            reportSubmitted: true,
            reportData: allData,
            completedDate: new Date().toISOString()
          } : p
        );
        return { ...plan, phases: updatedPhases };
      }
      return plan;
    });
    localStorage.setItem('cyclePlans', JSON.stringify(updatedPlans));
    
    // Also update internalCyclePlans
    const internalPlans = localStorage.getItem('internalCyclePlans');
    if (internalPlans) {
      const internal = JSON.parse(internalPlans);
      const updatedInternal = internal.map((plan: any) => {
        if (plan.qualificationCode === qualificationCode) {
          const updatedPhases = plan.phases.map((p: Phase) => 
            p.name === phase.name ? { 
              ...p, 
              status: 'completed', 
              reportSubmitted: true,
              reportData: allData,
              completedDate: new Date().toISOString()
            } : p
          );
          return { ...plan, phases: updatedPhases };
        }
        return plan;
      });
      localStorage.setItem('internalCyclePlans', JSON.stringify(updatedInternal));
    }
    
    // Dispatch storage events to notify other tabs/components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cyclePlans',
      newValue: JSON.stringify(updatedPlans)
    }));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'internalCyclePlans',
      newValue: localStorage.getItem('internalCyclePlans')
    }));
  }
  // ========== End of cycle plan update ==========
  
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'submittedPhaseReports',
    newValue: JSON.stringify(reports)
  }));
  
  // Call onSave to update parent component
  onSave(allData);
  
  setIsSubmitting(false);
  onClose();
  
  // Reload the page to ensure all components reflect the updated status
  // This will disable the Submit button and show the correct status badge
  setTimeout(() => {
    window.location.reload();
  }, 500);
};

  

  // Render phase-specific content with file upload support
  const renderPhaseDetails = () => {
    switch(phase.name) {
      case 'Scoping':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Section 1 — Objectives</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phase Objective</label>
                  <textarea value={scopeSummary} onChange={(e) => setScopeSummary(e.target.value)} disabled={isLocked || phase.reportSubmitted} placeholder="Define the need and scope of the qualification..." className="w-full border rounded-lg p-3 text-sm" rows={4} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Key Questions / Goals</label>
                  <textarea disabled={isLocked || phase.reportSubmitted} placeholder="What are the key questions this phase needs to answer?" className="w-full border rounded-lg p-3 text-sm" rows={3} />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2"><Paperclip className="w-4 h-4" /> Section 2 — Research Inputs</h3>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input type="file" ref={researchInputsRef} onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'researchInputs');
                }} className="hidden" multiple />
                <button onClick={() => researchInputsRef.current?.click()} disabled={isLocked || phase.reportSubmitted} className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload research documents</p>
                </button>
              </div>
              {renderFileList('researchInputs')}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 3 — Findings / Analysis</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Findings Summary</label>
                  <textarea value={findingsSummary} onChange={(e) => setFindingsSummary(e.target.value)} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded-lg p-3 text-sm" rows={4} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Key Insights</label>
                  <div className="space-y-2 mb-2">
                    {keyInsights.map((insight, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white p-2 rounded border">
                        <span className="text-sm flex-1">• {insight}</span>
                        {!isLocked && !phase.reportSubmitted && (<button onClick={() => setKeyInsights(keyInsights.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 className="w-3 h-3" /></button>)}
                      </div>
                    ))}
                  </div>
                  {!isLocked && !phase.reportSubmitted && (
                    <div className="flex gap-2">
                      <input type="text" value={newInsight} onChange={(e) => setNewInsight(e.target.value)} placeholder="Add key insight..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                      <button onClick={handleAddInsight} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">Add</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Section 4 — SME Collaboration</h3>
              <div className="mb-3">
                <p className="text-sm font-medium mb-2">Assigned Users:</p>
                <div className="flex flex-wrap gap-2">
                  {assignedTeam.map(id => {
                    const member = teamMembers.find(m => m.id === id);
                    return member && <span key={id} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{member.name}</span>;
                  })}
                </div>
                {!isLocked && !phase.reportSubmitted && (
                  <div className="relative mt-2">
                    <button onClick={() => setShowTeamDropdown(!showTeamDropdown)} className="text-blue-600 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Team Member</button>
                    {showTeamDropdown && (
                      <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg p-2 w-64">
                        {teamMembers.filter(m => !assignedTeam.includes(m.id)).map(member => (
                          <button key={member.id} onClick={() => { toggleTeamMember(member.id); setShowTeamDropdown(false); }} className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-xs text-gray-500 block">{member.role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 5 — Deliverables Checklist</h3>
              <div className="space-y-2">
                {['Scope defined', 'Stakeholders identified', 'Industry need documented'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" disabled={isLocked || phase.reportSubmitted} />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
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
                  <thead className="bg-gray-100"><tr><th className="p-2 text-left">Competency</th><th className="p-2 text-left">Learning Outcome</th><th className="p-2 text-left">Industry Standard</th><th className="p-2"></th></tr></thead>
                  <tbody>
                    {competencies.map((comp, i) => (
                      <tr key={i}>
                        <td className="p-2"><input type="text" value={comp.competency} onChange={(e) => { const newComps = [...competencies]; newComps[i].competency = e.target.value; setCompetencies(newComps); }} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded px-2 py-1" /></td>
                        <td className="p-2"><input type="text" value={comp.outcome} onChange={(e) => { const newComps = [...competencies]; newComps[i].outcome = e.target.value; setCompetencies(newComps); }} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded px-2 py-1" /></td>
                        <td className="p-2"><input type="text" value={comp.standard} onChange={(e) => { const newComps = [...competencies]; newComps[i].standard = e.target.value; setCompetencies(newComps); }} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded px-2 py-1" /></td>
                        <td className="p-2">{!isLocked && !phase.reportSubmitted && <button onClick={() => setCompetencies(competencies.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isLocked && !phase.reportSubmitted && <button onClick={handleAddCompetency} className="mt-2 text-blue-600 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Row</button>}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 2 — Profile Definition</h3>
              <div className="space-y-4">
                {['Occupational Profile', 'Learner Profile', 'Entry Requirements', 'Exit Level Outcomes'].map((field) => (
                  <div key={field}><label className="block text-xs text-gray-500 mb-1">{field}</label><textarea disabled={isLocked || phase.reportSubmitted} className="w-full border rounded-lg p-2 text-sm" rows={2} /></div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 3 — Standards Mapping</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">NQF Level</label><select disabled={isLocked || phase.reportSubmitted} className="w-full border rounded-lg px-3 py-2 text-sm"><option>Level 5</option><option>Level 6</option><option>Level 7</option><option>Level 8</option></select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Regulatory Standard</label><select disabled={isLocked || phase.reportSubmitted} className="w-full border rounded-lg px-3 py-2 text-sm"><option>SAQA</option><option>QCTO</option><option>CHE</option></select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Industry Body</label><select disabled={isLocked || phase.reportSubmitted} className="w-full border rounded-lg px-3 py-2 text-sm"><option>MICT Seta</option><option>MerSETA</option><option>Services SETA</option></select></div>
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
                  <thead className="bg-gray-100"><tr><th className="p-2">Module</th><th className="p-2">Learning Outcome</th><th className="p-2">Hours</th><th className="p-2">Assessment Type</th><th></th></tr></thead>
                  <tbody>
                    {modules.map((mod, i) => (
                      <tr key={i}>
                        <td className="p-2"><input type="text" value={mod.module} onChange={(e) => { const newMods = [...modules]; newMods[i].module = e.target.value; setModules(newMods); }} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded px-2 py-1" /></td>
                        <td className="p-2"><input type="text" value={mod.outcome} onChange={(e) => { const newMods = [...modules]; newMods[i].outcome = e.target.value; setModules(newMods); }} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded px-2 py-1" /></td>
                        <td className="p-2"><input type="number" value={mod.hours} onChange={(e) => { const newMods = [...modules]; newMods[i].hours = parseInt(e.target.value); setModules(newMods); }} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded px-2 py-1" /></td>
                        <td className="p-2"><select value={mod.assessment} onChange={(e) => { const newMods = [...modules]; newMods[i].assessment = e.target.value; setModules(newMods); }} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded px-2 py-1"><option>Quiz</option><option>Project</option><option>Exam</option><option>Portfolio</option></select></td>
                        <td className="p-2">{!isLocked && !phase.reportSubmitted && <button onClick={() => setModules(modules.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isLocked && !phase.reportSubmitted && <button onClick={handleAddModule} className="mt-2 text-blue-600 text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Add Module</button>}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 2 — Knowledge / Practice / Workplace</h3>
              <div className="space-y-4">
                {[
                  { title: 'Knowledge Requirements', value: knowledgeReq, setter: setKnowledgeReq },
                  { title: 'Practical Requirements', value: practiceReq, setter: setPracticeReq },
                  { title: 'Workplace Experience', value: workplaceReq, setter: setWorkplaceReq }
                ].map((section) => (
                  <details key={section.title} className="border rounded-lg">
                    <summary className="p-3 font-medium cursor-pointer">{section.title}</summary>
                    <div className="p-3 border-t">
                      <textarea value={section.value} onChange={(e) => section.setter(e.target.value)} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded-lg p-2 text-sm" rows={3} placeholder={`Enter ${section.title.toLowerCase()}...`} />
                      <div className="mt-3">
                        <input type="file" ref={curriculumDocRef} onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload(e.target.files[0], section.title);
                        }} className="hidden" />
                        <button onClick={() => curriculumDocRef.current?.click()} disabled={isLocked || phase.reportSubmitted} className="text-blue-600 text-sm flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attach files</button>
                        {renderFileList(section.title)}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 3 — Document Uploads</h3>
              <div className="space-y-3">
                {[
                  { title: 'Curriculum Document', ref: curriculumDocRef },
                  { title: 'Assessment Strategy', ref: assessmentStrategyRef },
                  { title: 'Learning Materials', ref: learningMaterialsRef }
                ].map((doc) => (
                  <div key={doc.title} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{doc.title}</span>
                      <input type="file" ref={doc.ref} onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0], doc.title);
                      }} className="hidden" />
                      <button onClick={() => doc.ref.current?.click()} disabled={isLocked || phase.reportSubmitted} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Upload</button>
                    </div>
                    {renderFileList(doc.title)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Qualification Document':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Qualification Document Compilation</h3>
              <div className="space-y-4">
                <div><label className="block text-xs text-gray-500 mb-1">Document Summary</label><textarea disabled={isLocked || phase.reportSubmitted} className="w-full border rounded-lg p-3 text-sm" rows={4} placeholder="Summarize the qualification document contents..." /></div>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input type="file" ref={qualificationDocRef} onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'qualificationDocument');
                  }} className="hidden" />
                  <button onClick={() => qualificationDocRef.current?.click()} disabled={isLocked || phase.reportSubmitted} className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Upload final qualification document</p>
                  </button>
                  {renderFileList('qualificationDocument')}
                </div>
              </div>
            </div>
          </div>
        );

      case 'Final Verification':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center gap-2"><Award className="w-4 h-4" /> Section 1 — Summary Dashboard</h3>
              <div className="grid grid-cols-2 gap-4">
                {['Scoping', 'Profile', 'Curriculum', 'Knowledge & Practice'].map((item) => (
                  <div key={item} className="bg-white p-3 rounded-lg border"><div className="flex items-center justify-between"><span className="text-sm">{item}</span><CheckCircle className="w-5 h-5 text-green-500" /></div></div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 2 — Compliance Checklist</h3>
              <div className="space-y-2">
                {complianceChecklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2"><input type="checkbox" checked={item.checked} onChange={() => toggleChecklistItem(i)} disabled={isLocked || phase.reportSubmitted} className="rounded" /><span className="text-sm">{item.item}</span></div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 3 — Issues</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100"><tr><th className="p-2">Issue</th><th className="p-2">Severity</th><th className="p-2">Recommendation</th><th></th></tr></thead>
                  <tbody>
                    {issues.map((issue, i) => (
                      <tr key={i}>
                        <td className="p-2">{issue.issue}</td>
                        <td className="p-2"><span className={`px-2 py-1 rounded-full text-xs ${issue.severity === 'High' ? 'bg-red-100 text-red-700' : issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{issue.severity}</span></td>
                        <td className="p-2">{issue.recommendation}</td>
                        <td className="p-2">{!isLocked && !phase.reportSubmitted && <button onClick={() => setIssues(issues.filter((_, idx) => idx !== i))} className="text-red-500"><Trash2 className="w-4 h-4" /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isLocked && !phase.reportSubmitted && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <input type="text" value={newIssue.issue} onChange={(e) => setNewIssue({ ...newIssue, issue: e.target.value })} placeholder="Issue" className="border rounded px-3 py-2 text-sm" />
                  <select value={newIssue.severity} onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value })} className="border rounded px-3 py-2 text-sm"><option>Low</option><option>Medium</option><option>High</option></select>
                  <div className="flex gap-2"><input type="text" value={newIssue.recommendation} onChange={(e) => setNewIssue({ ...newIssue, recommendation: e.target.value })} placeholder="Recommendation" className="flex-1 border rounded px-3 py-2 text-sm" /><button onClick={handleAddIssue} className="bg-blue-600 text-white px-3 py-2 rounded text-sm">Add</button></div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">Section 4 — Approval Decision</h3>
              <div className="space-y-2">
                {['Approve Qualification', 'Reject Qualification', 'Request Revision'].map((option) => (
                  <label key={option} className="flex items-center gap-2"><input type="radio" name="approval" className="rounded" disabled={isLocked || phase.reportSubmitted} /><span className="text-sm">{option}</span></label>
                ))}
              </div>
              <div className="mt-4"><label className="block text-xs text-gray-500 mb-1">Approval Notes</label><textarea disabled={isLocked || phase.reportSubmitted} className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="Add approval notes..." /></div>
            </div>
          </div>
        );

      default:
        return <div className="text-gray-500">Select a phase to view details</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{phase.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{qualificationTitle} | {qualificationCode}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Phase Info Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Start: {phase.startDate || 'Not set'}</div>
          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> End: {phase.endDate || 'Not set'}</div>
          <div className="flex items-center gap-1"><User className="w-4 h-4" /> Responsible: {phase.responsibleRole}</div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('details')} className={`py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Phase Details & Report</button>
            <button onClick={() => setActiveTab('history')} className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}><History className="w-4 h-4" /> History</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {renderPhaseDetails()}

              {/* Report Summary Section */}
              <div className="border-t pt-6 mt-6">
                <h3 className="font-medium mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> Report Summary</h3>
                <div className="space-y-5">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Phase Objectives Summary <span className="text-red-500">*</span></label><textarea value={localPhaseData.objectives} onChange={(e) => setLocalPhaseData({ ...localPhaseData, objectives: e.target.value })} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="Summarize the objectives for this phase..." /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Findings / Outcomes Summary <span className="text-red-500">*</span></label><textarea value={localPhaseData.findings} onChange={(e) => setLocalPhaseData({ ...localPhaseData, findings: e.target.value })} disabled={isLocked || phase.reportSubmitted} className="w-full border rounded-lg p-3 text-sm" rows={4} placeholder="Summarize the findings and outcomes of this phase..." /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Deliverables List</label><div className="space-y-2">{localPhaseData.deliverables.map((d, idx) => (<div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded border"><CheckSquare className="w-4 h-4 text-gray-400" /><span className="text-sm flex-1">{d}</span>{!isLocked && !phase.reportSubmitted && <button onClick={() => handleRemoveDeliverable(idx)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>}</div>))}{!isLocked && !phase.reportSubmitted && (<div className="flex gap-2"><input type="text" value={newDeliverable} onChange={(e) => setNewDeliverable(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddDeliverable()} placeholder="Add deliverable..." className="flex-1 border rounded-lg px-3 py-2 text-sm" /><button onClick={handleAddDeliverable} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"><Plus className="w-4 h-4" /></button></div>)}</div></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <input type="file" ref={attachmentsRef} onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'reportAttachments');
                      }} className="hidden" multiple />
                      <button onClick={() => attachmentsRef.current?.click()} disabled={isLocked || phase.reportSubmitted} className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click to upload supporting documents</p>
                      </button>
                    </div>
                    {renderFileList('reportAttachments')}
                  </div>
                  {!phase.reportSubmitted && !phase.approved && (<div><label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes for Reviewer</label><textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} className="w-full border rounded-lg p-3 text-sm" rows={3} placeholder="Add any additional notes for the internal reviewer..." /></div>)}
                </div>
              </div>

              {/* Status Messages */}
              {phase.reportSubmitted && !phase.approved && (<div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"><div className="flex items-start gap-3"><Clock className="w-5 h-5 text-yellow-600" /><div><p className="text-sm font-medium text-yellow-800">Pending Internal Review</p><p className="text-xs text-yellow-700">Your phase report has been submitted and is awaiting approval.</p></div></div></div>)}
              {phase.approved && (<div className="bg-green-50 p-4 rounded-lg border border-green-200"><div className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><div><p className="text-sm font-medium text-green-800">Phase Approved</p><p className="text-xs text-green-700">{!isLastPhase && "You can now proceed to the next phase."}</p></div></div></div>)}
              {isLocked && !phase.reportSubmitted && !phase.approved && (<div className="bg-gray-100 p-4 rounded-lg border"><div className="flex items-start gap-3"><AlertCircle className="w-5 h-5 text-gray-500" /><div><p className="text-sm font-medium text-gray-700">Phase Locked</p><p className="text-xs text-gray-600">This phase is locked until the previous phase is approved.</p></div></div></div>)}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="flex gap-4 pb-6 relative">
                  {index < history.length - 1 && <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>}
                  <div className="relative z-10"><div className="w-4 h-4 rounded-full bg-blue-600"></div></div>
                  <div className="flex-1 bg-gray-50 p-3 rounded-lg"><div className="flex justify-between items-start"><div><p className="font-medium">{item.action}</p><p className="text-sm text-gray-600">{item.details}</p></div><div className="text-right"><p className="text-xs text-gray-500">{item.user}</p><p className="text-xs text-gray-400">{item.date}</p></div></div></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">Close</button>
          {!phase.reportSubmitted && !phase.approved && !isLocked && (
    <>
      <button onClick={handleSaveDraft} className="..."><Save className="w-4 h-4" /> Save Draft</button>
      <button onClick={handleSubmitReport} disabled={isSubmitting} className="..."><Send className="w-4 h-4" /> {isSubmitting ? 'Submitting...' : 'Submit Phase Report'}</button>
    </>
  )}
        </div>
      </div>
    </div>
  );
}