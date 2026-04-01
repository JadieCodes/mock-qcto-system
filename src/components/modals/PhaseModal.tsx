// components/modals/PhaseModal.tsx
import React, { useState } from 'react';
import {
  X,
  Save,
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
  ChevronRight,
  ChevronLeft,
  Upload,
  GitBranch,
  Target,
  BookOpen,
  Briefcase,
  Award,
  Shield,
  CheckSquare,
  Plus,
  Trash2,
  Edit,
  Send,
  History,
  MessageCircle,
  Paperclip,
  Link,
  BarChart3
} from 'lucide-react';

interface PhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  phaseId: string;
  phaseLabel: string;
}

// Phase template types
type TemplateType = 'analysis' | 'design' | 'development' | 'review' | 'approval';

// Mock data for team members
const teamMembers = [
  { id: '1', name: 'Dr. Sarah Johnson', role: 'Lead Developer', avatar: 'SJ' },
  { id: '2', name: 'Prof. Michael Chen', role: 'Subject Matter Expert', avatar: 'MC' },
  { id: '3', name: 'Ms. Lisa Williams', role: 'Quality Assurer', avatar: 'LW' },
  { id: '4', name: 'Mr. John Smith', role: 'Instructional Designer', avatar: 'JS' },
  { id: '5', name: 'Dr. Emily Brown', role: 'Assessment Specialist', avatar: 'EB' },
];

export default function PhaseModal({ isOpen, onClose, phaseId, phaseLabel }: PhaseModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'comments' | 'history'>('overview');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('analysis');
  const [assignedTeam, setAssignedTeam] = useState<string[]>(['1', '3']);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [dependencies, setDependencies] = useState([
    { phase: 'Phase 1: Scoping', dependsOn: null, completed: true },
    { phase: 'Phase 2: Profile', dependsOn: 'Phase 1: Scoping', completed: false },
    { phase: 'Phase 3: Curriculum Specification', dependsOn: 'Phase 2: Profile', completed: false },
  ]);
  const [objectives, setObjectives] = useState('');
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [startDate, setStartDate] = useState('2024-04-01');
  const [endDate, setEndDate] = useState('2024-04-30');
  const [responsiblePerson, setResponsiblePerson] = useState('Dr. Sarah Johnson');
  
  // Phase-specific state
  const [scopeSummary, setScopeSummary] = useState('');
  const [findingsSummary, setFindingsSummary] = useState('');
  const [keyInsights, setKeyInsights] = useState<string[]>([]);
  const [newInsight, setNewInsight] = useState('');
  
  const [competencies, setCompetencies] = useState([
    { competency: 'Project Management', outcome: 'Apply PM principles', standard: 'PMBOK 7th' },
    { competency: 'Risk Assessment', outcome: 'Identify project risks', standard: 'ISO 31000' },
  ]);
  
  const [modules, setModules] = useState([
    { module: 'Module 1: Introduction', outcome: 'Understand basics', hours: 20, assessment: 'Quiz' },
    { module: 'Module 2: Advanced Topics', outcome: 'Apply advanced concepts', hours: 30, assessment: 'Project' },
  ]);
  
  const [knowledgeReq, setKnowledgeReq] = useState('');
  const [practiceReq, setPracticeReq] = useState('');
  const [workplaceReq, setWorkplaceReq] = useState('');
  
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
  
  const [comments, setComments] = useState([
    { user: 'Dr. Sarah Johnson', role: 'Lead Developer', date: '2024-03-20 10:30', text: 'Scope document looks good. Ready for review.' },
    { user: 'Prof. Michael Chen', role: 'SME', date: '2024-03-21 14:15', text: 'Added industry standards for Project Management.' },
  ]);
  
  const [newComment, setNewComment] = useState('');
  
  const [history, setHistory] = useState([
    { action: 'Phase started', user: 'System', date: '2024-03-15 09:00', details: 'Initial phase created' },
    { action: 'Template selected', user: 'Dr. Sarah Johnson', date: '2024-03-15 09:30', details: 'Selected Analysis template' },
    { action: 'Team assigned', user: 'Dr. Sarah Johnson', date: '2024-03-15 10:15', details: 'Added 2 team members' },
    { action: 'Scope document uploaded', user: 'Dr. Sarah Johnson', date: '2024-03-16 11:20', details: 'Uploaded scoping_v1.pdf' },
  ]);

  if (!isOpen) return null;

  // Get template based on phase
  const getTemplateForPhase = (phaseId: string): TemplateType => {
    switch(phaseId) {
      case 'phase1':
      case 'phase2':
        return 'analysis';
      case 'phase3':
      case 'phase4':
        return 'design';
      case 'phase5':
      case 'phase6':
        return 'development';
      case 'phase7':
        return 'review';
      case 'phase8':
        return 'approval';
      default:
        return 'analysis';
    }
  };

  const template = getTemplateForPhase(phaseId);

  const handleAddDeliverable = () => {
    if (newDeliverable.trim()) {
      setDeliverables([...deliverables, newDeliverable]);
      setNewDeliverable('');
    }
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
    setModules([...modules, { module: '', outcome: '', hours: 0, assessment: '' }]);
  };

  const handleAddIssue = () => {
    if (newIssue.issue.trim()) {
      setIssues([...issues, newIssue]);
      setNewIssue({ issue: '', severity: 'Medium', recommendation: '' });
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([
        ...comments,
        { 
          user: 'Current User', 
          role: 'Reviewer', 
          date: new Date().toLocaleDateString('en-CA'), 
          text: newComment 
        }
      ]);
      setNewComment('');
    }
  };

  const handleSave = () => {
    console.log('Saving phase data...');
    // Save logic here
  };

  const handleGenerateReport = () => {
    console.log('Generating phase report...');
    // Generate report logic here
  };

  const handleSubmitReport = () => {
    console.log('Submitting phase report...');
    // Submit report logic here
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-800">{phaseLabel}</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {template === 'analysis' && 'Analysis Template'}
                {template === 'design' && 'Design Template'}
                {template === 'development' && 'Development Template'}
                {template === 'review' && 'Review Template'}
                {template === 'approval' && 'Approval Template'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Start: {startDate} | End: {endDate} | Responsible: {responsiblePerson}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              Phase Details
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'comments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab - Phase 1: Development Phases Overview */}
          {activeTab === 'overview' && phaseId === 'phase1' && (
            <div className="space-y-6">
              {/* Template Selection */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Select Phase Template
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {['analysis', 'design', 'development', 'review', 'approval'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTemplate(t as TemplateType)}
                      className={`p-3 rounded-lg border text-sm capitalize ${
                        selectedTemplate === t 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <p><span className="font-medium">Analysis:</span> Scoping and early research phases</p>
                  <p><span className="font-medium">Design:</span> Profile and Curriculum Specification</p>
                  <p><span className="font-medium">Development:</span> Curriculum + Knowledge/Practice/Workplace</p>
                  <p><span className="font-medium">Review:</span> QAS verification</p>
                  <p><span className="font-medium">Approval:</span> Final Verification</p>
                </div>
              </div>

              {/* Assign Team */}
              <div className="bg-gray-50 p-4 rounded-lg relative">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Assign Responsible Team Members / SMEs
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {assignedTeam.map(id => {
                    const member = teamMembers.find(m => m.id === id);
                    return member && (
                      <span key={id} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {member.name} ({member.role})
                        <button onClick={() => toggleTeamMember(id)} className="hover:text-blue-900">×</button>
                      </span>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                  className="text-blue-600 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Team Member
                </button>
                {showTeamDropdown && (
                  <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg p-2 w-64">
                    {teamMembers.filter(m => !assignedTeam.includes(m.id)).map(member => (
                      <button
                        key={member.id}
                        onClick={() => {
                          toggleTeamMember(member.id);
                          setShowTeamDropdown(false);
                        }}
                        className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm"
                      >
                        <span className="font-medium">{member.name}</span>
                        <span className="text-xs text-gray-500 block">{member.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dependencies */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Phase Dependencies & Milestones
                </h3>
                <div className="space-y-2">
                  {dependencies.map((dep, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{dep.phase}</p>
                        <p className="text-xs text-gray-500">
                          {dep.dependsOn ? `Depends on: ${dep.dependsOn}` : 'No dependencies'}
                        </p>
                      </div>
                      {dep.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Objectives & Deliverables */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Phase Objectives
                  </h3>
                  <textarea
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    placeholder="Enter phase objectives..."
                    className="w-full border rounded-lg p-2 text-sm"
                    rows={4}
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Deliverables
                  </h3>
                  <div className="space-y-2 mb-2">
                    {deliverables.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white p-2 rounded border">
                        <CheckSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-sm flex-1">{d}</span>
                        <button className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDeliverable}
                      onChange={(e) => setNewDeliverable(e.target.value)}
                      placeholder="Add deliverable..."
                      className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleAddDeliverable}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule & Gantt Chart
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-500 text-center">Gantt Chart Preview</p>
                  <div className="h-16 bg-gray-100 mt-2 rounded flex items-center">
                    <div className="h-8 bg-blue-500 rounded-l ml-4" style={{ width: '30%' }}></div>
                    <div className="h-8 bg-green-500" style={{ width: '25%' }}></div>
                    <div className="h-8 bg-yellow-500" style={{ width: '20%' }}></div>
                    <div className="h-8 bg-purple-500 rounded-r" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  AI Suggestions
                </h3>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
                  Run AI Suggestions for Phase Structuring
                </button>
              </div>
            </div>
          )}

          {/* Overview Tab - Phase 2: Scoping */}
          {activeTab === 'overview' && phaseId === 'phase2' && (
            <div className="space-y-6">
              {/* Section 1: Objectives */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Section 1 — Objectives
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phase Objective</label>
                    <textarea
                      value={scopeSummary}
                      onChange={(e) => setScopeSummary(e.target.value)}
                      placeholder="Define the need and scope of the qualification..."
                      className="w-full border rounded-lg p-3 text-sm"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Key Questions / Goals</label>
                    <textarea
                      placeholder="What are the key questions this phase needs to answer?"
                      className="w-full border rounded-lg p-3 text-sm"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Research Inputs */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Section 2 — Research Inputs
                </h3>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Drag and drop files here or click to browse</p>
                </div>
              </div>

              {/* Section 3: Findings / Analysis */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 3 — Findings / Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Findings Summary</label>
                    <textarea
                      value={findingsSummary}
                      onChange={(e) => setFindingsSummary(e.target.value)}
                      className="w-full border rounded-lg p-3 text-sm"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Key Insights</label>
                    <div className="space-y-2 mb-2">
                      {keyInsights.map((insight, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white p-2 rounded border">
                          <span className="text-sm flex-1">• {insight}</span>
                          <button className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newInsight}
                        onChange={(e) => setNewInsight(e.target.value)}
                        placeholder="Add key insight..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                      />
                      <button
                        onClick={handleAddInsight}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: SME Collaboration */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Section 4 — SME Collaboration
                </h3>
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">Assigned Users:</p>
                  <div className="flex flex-wrap gap-2">
                    {assignedTeam.map(id => {
                      const member = teamMembers.find(m => m.id === id);
                      return member && (
                        <span key={id} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {member.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Discussion:</p>
                  <div className="space-y-3 mb-3">
                    {comments.map((comment, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-sm">{comment.user}</span>
                            <span className="text-xs text-gray-500 ml-2">{comment.role}</span>
                          </div>
                          <span className="text-xs text-gray-400">{comment.date}</span>
                        </div>
                        <p className="text-sm mt-1">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleAddComment}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 5: Deliverables */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 5 — Deliverables Checklist</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Scope defined</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Stakeholders identified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Industry need documented</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab - Phase 3 & 4: Profile / Curriculum */}
          {(phaseId === 'phase3' || phaseId === 'phase4') && activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Section 1: Competency/Outcome Mapping */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Section 1 — Competency / Outcome Mapping
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Competency</th>
                        <th className="p-2 text-left">Learning Outcome</th>
                        <th className="p-2 text-left">Industry Standard</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {competencies.map((comp, i) => (
                        <tr key={i}>
                          <td className="p-2">
                            <input
                              type="text"
                              value={comp.competency}
                              onChange={(e) => {
                                const newComps = [...competencies];
                                newComps[i].competency = e.target.value;
                                setCompetencies(newComps);
                              }}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={comp.outcome}
                              onChange={(e) => {
                                const newComps = [...competencies];
                                newComps[i].outcome = e.target.value;
                                setCompetencies(newComps);
                              }}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={comp.standard}
                              onChange={(e) => {
                                const newComps = [...competencies];
                                newComps[i].standard = e.target.value;
                                setCompetencies(newComps);
                              }}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <button className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={handleAddCompetency}
                  className="mt-2 text-blue-600 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </button>
              </div>

              {/* Section 2: Profile Definition */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 2 — Profile Definition</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Occupational Profile</label>
                    <textarea className="w-full border rounded-lg p-2 text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Learner Profile</label>
                    <textarea className="w-full border rounded-lg p-2 text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Entry Requirements</label>
                    <textarea className="w-full border rounded-lg p-2 text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Exit Level Outcomes</label>
                    <textarea className="w-full border rounded-lg p-2 text-sm" rows={2} />
                  </div>
                </div>
              </div>

              {/* Section 3: Standards Mapping */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 3 — Standards Mapping</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">NQF Level</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option>Level 1</option>
                      <option>Level 2</option>
                      <option>Level 3</option>
                      <option>Level 4</option>
                      <option>Level 5</option>
                      <option>Level 6</option>
                      <option>Level 7</option>
                      <option>Level 8</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Regulatory Standard</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option>SAQA</option>
                      <option>QCTO</option>
                      <option>CHE</option>
                      <option>UMALUSI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Industry Body</label>
                    <select className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option>MICT Seta</option>
                      <option>MerSETA</option>
                      <option>W&RSETA</option>
                      <option>Services SETA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: SME Feedback */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 4 — SME Feedback</h3>
                <div className="space-y-3">
                  {comments.slice(0, 2).map((comment, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border">
                      <p className="text-sm">{comment.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{comment.user} - {comment.date}</p>
                    </div>
                  ))}
                </div>
                <textarea
                  placeholder="Add feedback..."
                  className="w-full border rounded-lg p-2 text-sm mt-3"
                  rows={2}
                />
              </div>

              {/* Section 5: Deliverables Checklist */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 5 — Deliverables Checklist</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Profile defined</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Competencies mapped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Outcomes verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab - Phase 5 & 6: Knowledge/Practice/Workplace */}
          {(phaseId === 'phase5' || phaseId === 'phase6') && activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Section 1: Curriculum Builder */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Section 1 — Curriculum Builder
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Module</th>
                        <th className="p-2 text-left">Learning Outcome</th>
                        <th className="p-2 text-left">Hours</th>
                        <th className="p-2 text-left">Assessment Type</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((mod, i) => (
                        <tr key={i}>
                          <td className="p-2">
                            <input
                              type="text"
                              value={mod.module}
                              onChange={(e) => {
                                const newMods = [...modules];
                                newMods[i].module = e.target.value;
                                setModules(newMods);
                              }}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={mod.outcome}
                              onChange={(e) => {
                                const newMods = [...modules];
                                newMods[i].outcome = e.target.value;
                                setModules(newMods);
                              }}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={mod.hours}
                              onChange={(e) => {
                                const newMods = [...modules];
                                newMods[i].hours = parseInt(e.target.value);
                                setModules(newMods);
                              }}
                              className="w-full border rounded px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={mod.assessment}
                              onChange={(e) => {
                                const newMods = [...modules];
                                newMods[i].assessment = e.target.value;
                                setModules(newMods);
                              }}
                              className="w-full border rounded px-2 py-1"
                            >
                              <option>Quiz</option>
                              <option>Project</option>
                              <option>Exam</option>
                              <option>Portfolio</option>
                              <option>Practical</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <button className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={handleAddModule}
                  className="mt-2 text-blue-600 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Module
                </button>
              </div>

              {/* Section 2: Knowledge / Practice / Workplace */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 2 — Knowledge / Practice / Workplace</h3>
                <div className="space-y-4">
                  <details className="border rounded-lg">
                    <summary className="p-3 font-medium cursor-pointer">Knowledge Requirements</summary>
                    <div className="p-3 border-t">
                      <textarea
                        value={knowledgeReq}
                        onChange={(e) => setKnowledgeReq(e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                        rows={3}
                        placeholder="Enter knowledge requirements..."
                      />
                      <button className="mt-2 text-blue-600 text-sm flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        Attach files
                      </button>
                    </div>
                  </details>
                  <details className="border rounded-lg">
                    <summary className="p-3 font-medium cursor-pointer">Practical Requirements</summary>
                    <div className="p-3 border-t">
                      <textarea
                        value={practiceReq}
                        onChange={(e) => setPracticeReq(e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                        rows={3}
                        placeholder="Enter practical requirements..."
                      />
                      <button className="mt-2 text-blue-600 text-sm flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        Attach files
                      </button>
                    </div>
                  </details>
                  <details className="border rounded-lg">
                    <summary className="p-3 font-medium cursor-pointer">Workplace Experience</summary>
                    <div className="p-3 border-t">
                      <textarea
                        value={workplaceReq}
                        onChange={(e) => setWorkplaceReq(e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                        rows={3}
                        placeholder="Enter workplace requirements..."
                      />
                      <button className="mt-2 text-blue-600 text-sm flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        Attach files
                      </button>
                    </div>
                  </details>
                </div>
              </div>

              {/* Section 3: AI Suggestions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Section 3 — AI Suggestions
                </h3>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700">
                  Run AI Suggestion
                </button>
                <p className="text-xs text-gray-500 mt-2">Detect missing outcomes, duplicate modules, skill gaps</p>
              </div>

              {/* Section 4: Document Uploads */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 4 — Document Uploads</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Curriculum Document</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Upload</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assessment Strategy</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Upload</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Learning Materials</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Upload</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab - Phase 7: QAS Verification */}
          {phaseId === 'phase7' && activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Section 1: Document Viewer */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Section 1 — Document Viewer
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <button className="bg-white p-2 rounded border hover:bg-gray-50 text-sm">Scoping</button>
                  <button className="bg-white p-2 rounded border hover:bg-gray-50 text-sm">Profile</button>
                  <button className="bg-white p-2 rounded border hover:bg-gray-50 text-sm">Curriculum</button>
                  <button className="bg-white p-2 rounded border hover:bg-gray-50 text-sm">Knowledge/Practice</button>
                </div>
                <div className="mt-4 border rounded-lg p-4 bg-white">
                  <p className="text-center text-gray-500">Document preview would appear here</p>
                </div>
              </div>

              {/* Section 2: Compliance Checklist */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 2 — Compliance Checklist</h3>
                <div className="space-y-2">
                  {complianceChecklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleChecklistItem(i)}
                        className="rounded"
                      />
                      <span className="text-sm">{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Comments */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 3 — Comments</h3>
                <textarea
                  placeholder="Reviewer Notes..."
                  className="w-full border rounded-lg p-3 text-sm"
                  rows={4}
                />
              </div>

              {/* Section 4: Issues */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 4 — Issues</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Issue</th>
                        <th className="p-2 text-left">Severity</th>
                        <th className="p-2 text-left">Recommendation</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((issue, i) => (
                        <tr key={i}>
                          <td className="p-2">{issue.issue}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              issue.severity === 'High' ? 'bg-red-100 text-red-700' :
                              issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {issue.severity}
                            </span>
                          </td>
                          <td className="p-2">{issue.recommendation}</td>
                          <td className="p-2">
                            <button className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newIssue.issue}
                    onChange={(e) => setNewIssue({ ...newIssue, issue: e.target.value })}
                    placeholder="Issue"
                    className="border rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={newIssue.severity}
                    onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value })}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newIssue.recommendation}
                      onChange={(e) => setNewIssue({ ...newIssue, recommendation: e.target.value })}
                      placeholder="Recommendation"
                      className="flex-1 border rounded px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleAddIssue}
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab - Phase 8: Final Verification */}
          {phaseId === 'phase8' && activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Section 1: Summary Dashboard */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Section 1 — Summary Dashboard
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Scoping</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Profile</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Curriculum</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">QAS Verification</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Progress</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>

              {/* Section 2: Final Qualification Document */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Section 2 — Final Qualification Document
                </h3>
                <div className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium">qualification_final_v1.0.pdf</span>
                    </div>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Approval Decision */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 3 — Approval Decision</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="approval" className="rounded" />
                    <span className="text-sm">Approve Qualification</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="approval" className="rounded" />
                    <span className="text-sm">Reject Qualification</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="approval" className="rounded" />
                    <span className="text-sm">Request Revision</span>
                  </label>
                </div>
              </div>

              {/* Section 4: Approval Notes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Section 4 — Approval Notes</h3>
                <textarea
                  placeholder="Add approval notes or comments..."
                  className="w-full border rounded-lg p-3 text-sm"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {comments.map((comment, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.user}</span>
                          <span className="text-xs text-gray-500">{comment.role}</span>
                        </div>
                        <p className="text-sm mt-2">{comment.text}</p>
                      </div>
                      <p className="text-xs text-gray-400">{comment.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full border rounded-lg p-3 text-sm"
                  rows={3}
                />
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="relative">
                {history.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-6 relative">
                    {index < history.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    <div className="relative z-10">
                      <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.action}</p>
                          <p className="text-sm text-gray-600">{item.details}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{item.user}</p>
                          <p className="text-xs text-gray-400">{item.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleGenerateReport}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-white flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate Phase Report
            </button>
            <button
              onClick={handleSubmitReport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Phase Report
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}