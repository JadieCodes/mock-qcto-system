import React, { useState } from 'react';
import { 
  Shield, ClipboardCheck, Calendar, MapPin, FileText, 
  CheckCircle, XCircle, AlertCircle, Clock, Eye, Download,
  Upload, Plus, Search, Filter, Users, Building, Phone,
  Mail, UserCheck, Briefcase, Award, TrendingUp, ChevronRight,
  ChevronDown, Calendar as CalendarIcon, CheckSquare, XSquare,
  HelpCircle, ThumbsUp, ThumbsDown, MessageSquare, FileCheck,
  FileX, PenTool, BookOpen, Target, Activity, ZoomIn
} from 'lucide-react';

// Type Definitions
interface ModerationChecklist {
  id: number;
  criterion: string;
  status: 'pending' | 'passed' | 'failed' | 'na';
  comments: string;
  evidence?: string;
}

interface SiteVisit {
  id: number;
  siteName: string;
  location: string;
  date: string;
  time: string;
  purpose: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  assignedTeam: TeamMember[];
  documents: Document[];
  checklist: VisitChecklist[];
  findings: Finding[];
  report?: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
}

interface VisitChecklist {
  id: number;
  item: string;
  category: string;
  status: 'pending' | 'completed' | 'na';
  notes: string;
  verifiedBy?: string;
  verifiedDate?: string;
}

interface Finding {
  id: number;
  type: 'compliance' | 'non-compliance' | 'observation' | 'recommendation';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: string;
  correctiveAction?: string;
  deadline?: string;
  status: 'open' | 'in-progress' | 'closed';
}

interface Document {
  id: number;
  name: string;
  type: string;
  uploadedBy: string;
  uploadDate: string;
  size: string;
  url: string;
}

interface ModerationRecord {
  id: number;
  assessmentId: string;
  candidateName: string;
  assessor: string;
  moderator: string;
  date: string;
  status: 'pending' | 'in-progress' | 'completed' | 'flagged';
  marks: {
    original: number;
    moderated: number;
    difference: number;
  };
  checklist: ModerationChecklist[];
  comments: string;
  documents: Document[];
}

interface PostEISAMonitoring {
  id: number;
  siteId: number;
  siteName: string;
  visitDate: string;
  monitor: string;
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  verification: VerificationItem[];
  finalReport?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalDate?: string;
}

interface VerificationItem {
  id: number;
  criterion: string;
  result: 'pass' | 'fail' | 'pending';
  evidence: string;
  verifiedBy: string;
  verifiedDate: string;
}

export default function QualityAssurance() {
  const [activeSubTab, setActiveSubTab] = useState<string>('moderation');
  const [showNewSiteVisit, setShowNewSiteVisit] = useState<boolean>(false);
  const [showNewFinding, setShowNewFinding] = useState<boolean>(false);
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);
  const [selectedModeration, setSelectedModeration] = useState<ModerationRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [notification, setNotification] = useState<{show: boolean; type: string; message: string}>({
    show: false,
    type: '',
    message: ''
  });

  // Mock Data - Site Visits
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([
    {
      id: 1,
      siteName: 'Johannesburg Assessment Centre',
      location: '123 Main Street, Johannesburg',
      date: '2024-03-15',
      time: '09:00',
      purpose: 'Routine Moderation Visit',
      status: 'planned',
      assignedTeam: [
        { id: 1, name: 'John Smith', role: 'Quality Partner', department: 'SETA', email: 'john@seta.gov.za', phone: '011 123 4567' },
        { id: 2, name: 'Sarah Johnson', role: 'Assistant Director', department: 'Quality Assurance', email: 'sarah@eisa.gov.za', phone: '011 234 5678' }
      ],
      documents: [],
      checklist: [
        { id: 1, item: 'Assessment tools verified', category: 'Documentation', status: 'pending', notes: '' },
        { id: 2, item: 'Assessor credentials checked', category: 'Personnel', status: 'pending', notes: '' },
        { id: 3, item: 'Facility compliance', category: 'Infrastructure', status: 'pending', notes: '' }
      ],
      findings: []
    },
    {
      id: 2,
      siteName: 'Cape Town Training Centre',
      location: '456 Beach Road, Cape Town',
      date: '2024-03-20',
      time: '10:30',
      purpose: 'Follow-up Visit',
      status: 'planned',
      assignedTeam: [
        { id: 3, name: 'Mike Peters', role: 'Deputy Director', department: 'Quality Assurance', email: 'mike@eisa.gov.za', phone: '021 345 6789' }
      ],
      documents: [],
      checklist: [],
      findings: []
    }
  ]);

  // Mock Data - Moderation Records
  const [moderationRecords, setModerationRecords] = useState<ModerationRecord[]>([
    {
      id: 1,
      assessmentId: 'ASS-2024-001',
      candidateName: 'John Doe',
      assessor: 'Jane Smith',
      moderator: 'Peter Jones',
      date: '2024-03-10',
      status: 'completed',
      marks: {
        original: 78,
        moderated: 82,
        difference: 4
      },
      checklist: [
        { id: 1, criterion: 'Assessment aligned with unit standards', status: 'passed', comments: 'Meets requirements', evidence: 'doc1.pdf' },
        { id: 2, criterion: 'Evidence quality', status: 'passed', comments: 'Sufficient evidence provided', evidence: 'doc2.pdf' },
        { id: 3, criterion: 'Assessor feedback', status: 'passed', comments: 'Constructive feedback given', evidence: '' }
      ],
      comments: 'Good quality assessment, minor adjustments recommended',
      documents: []
    },
    {
      id: 2,
      assessmentId: 'ASS-2024-002',
      candidateName: 'Mary Johnson',
      assessor: 'Robert Brown',
      moderator: 'Sarah Williams',
      date: '2024-03-12',
      status: 'flagged',
      marks: {
        original: 65,
        moderated: 58,
        difference: -7
      },
      checklist: [
        { id: 1, criterion: 'Assessment aligned with unit standards', status: 'failed', comments: 'Not aligned with current standards', evidence: '' },
        { id: 2, criterion: 'Evidence quality', status: 'failed', comments: 'Insufficient evidence', evidence: '' }
      ],
      comments: 'Requires reassessment',
      documents: []
    }
  ]);

  // Mock Data - Post-EISA Monitoring
  const [postEISAMonitoring, setPostEISAMonitoring] = useState<PostEISAMonitoring[]>([
    {
      id: 1,
      siteId: 1,
      siteName: 'Johannesburg Assessment Centre',
      visitDate: '2024-03-15',
      monitor: 'John Smith',
      status: 'in-progress',
      verification: [
        { id: 1, criterion: 'All assessments moderated', result: 'pending', evidence: '', verifiedBy: '', verifiedDate: '' },
        { id: 2, criterion: 'Findings addressed', result: 'pending', evidence: '', verifiedBy: '', verifiedDate: '' },
        { id: 3, criterion: 'Reports completed', result: 'pending', evidence: '', verifiedBy: '', verifiedDate: '' }
      ],
      approvalStatus: 'pending'
    }
  ]);

  // Show notification
  const showNotification = (type: string, message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, section: string, id: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const newDoc: Document = {
        id: Date.now(),
        name: file.name,
        type: file.type,
        uploadedBy: 'Current User',
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${(file.size / 1024).toFixed(2)} KB`,
        url: URL.createObjectURL(file)
      };

      if (section === 'siteVisit') {
        setSiteVisits(prev => prev.map(visit => 
          visit.id === id 
            ? { ...visit, documents: [...visit.documents, newDoc] }
            : visit
        ));
      } else if (section === 'moderation') {
        setModerationRecords(prev => prev.map(record => 
          record.id === id 
            ? { ...record, documents: [...record.documents, newDoc] }
            : record
        ));
      }

      showNotification('success', 'File uploaded successfully');
    }
  };

  // Add new site visit
  const addSiteVisit = (visitData: Partial<SiteVisit>) => {
    const newVisit: SiteVisit = {
      id: siteVisits.length + 1,
      siteName: visitData.siteName || '',
      location: visitData.location || '',
      date: visitData.date || '',
      time: visitData.time || '',
      purpose: visitData.purpose || '',
      status: 'planned',
      assignedTeam: [],
      documents: [],
      checklist: [],
      findings: []
    };
    setSiteVisits([...siteVisits, newVisit]);
    setShowNewSiteVisit(false);
    showNotification('success', 'Site visit planned successfully');
  };

  // Add finding to site visit
  const addFinding = (visitId: number, findingData: Partial<Finding>) => {
    const newFinding: Finding = {
      id: Date.now(),
      type: findingData.type || 'observation',
      description: findingData.description || '',
      severity: findingData.severity || 'medium',
      status: 'open',
      evidence: findingData.evidence
    };

    setSiteVisits(prev => prev.map(visit => 
      visit.id === visitId 
        ? { ...visit, findings: [...visit.findings, newFinding] }
        : visit
    ));
    setShowNewFinding(false);
    showNotification('success', 'Finding added successfully');
  };

  // Update moderation status
  const updateModerationStatus = (id: number, status: string) => {
    setModerationRecords(prev => prev.map(record => 
      record.id === id ? { ...record, status: status as any } : record
    ));
    showNotification('success', `Moderation ${status}`);
  };

  // Update checklist item
  const updateChecklistItem = (visitId: number, itemId: number, status: string, notes: string) => {
    setSiteVisits(prev => prev.map(visit => 
      visit.id === visitId 
        ? {
            ...visit,
            checklist: visit.checklist.map(item => 
              item.id === itemId 
                ? { ...item, status: status as any, notes, verifiedBy: 'Current User', verifiedDate: new Date().toISOString().split('T')[0] }
                : item
            )
          }
        : visit
    ));
    showNotification('success', 'Checklist updated');
  };

  // Update verification item
  const updateVerification = (monitoringId: number, itemId: number, result: string, evidence: string) => {
    setPostEISAMonitoring(prev => prev.map(mon => 
      mon.id === monitoringId 
        ? {
            ...mon,
            verification: mon.verification.map(item => 
              item.id === itemId 
                ? { ...item, result: result as any, evidence, verifiedBy: 'Current User', verifiedDate: new Date().toISOString().split('T')[0] }
                : item
            )
          }
        : mon
    ));
    showNotification('success', 'Verification updated');
  };

  // Approve post-EISA monitoring
  const approveMonitoring = (id: number) => {
    setPostEISAMonitoring(prev => prev.map(mon => 
      mon.id === id 
        ? { ...mon, approvalStatus: 'approved', approvedBy: 'Director', approvalDate: new Date().toISOString().split('T')[0] }
        : mon
    ));
    showNotification('success', 'Post-EISA monitoring approved');
  };

  // Render Moderation Section
  const renderModeration = () => (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <ClipboardCheck className="mr-2 text-blue-600" size={24} />
          Moderation Management
        </h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Search assessments..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border rounded-lg px-3 py-2"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold">{moderationRecords.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ClipboardCheck className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {moderationRecords.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {moderationRecords.filter(r => r.status === 'completed').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-red-600">
                {moderationRecords.filter(r => r.status === 'flagged').length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Moderation Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Moderator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {moderationRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{record.assessmentId}</td>
                <td className="px-6 py-4">{record.candidateName}</td>
                <td className="px-6 py-4">{record.assessor}</td>
                <td className="px-6 py-4">{record.moderator}</td>
                <td className="px-6 py-4">{record.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">{record.marks.original}</span>
                    <ChevronRight size={16} className="text-gray-400" />
                    <span className={`font-bold ${
                      record.marks.difference > 0 ? 'text-green-600' : 
                      record.marks.difference < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {record.marks.moderated}
                    </span>
                    <span className={`text-xs ${
                      record.marks.difference > 0 ? 'text-green-600' : 
                      record.marks.difference < 0 ? 'text-red-600' : 'text-gray-400'
                    }`}>
                      ({record.marks.difference > 0 ? '+' : ''}{record.marks.difference})
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${
                    record.status === 'completed' ? 'bg-green-100 text-green-800' :
                    record.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    record.status === 'flagged' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status === 'in-progress' && <Activity size={12} className="mr-1" />}
                    {record.status === 'completed' && <CheckCircle size={12} className="mr-1" />}
                    {record.status === 'flagged' && <AlertCircle size={12} className="mr-1" />}
                    {record.status === 'pending' && <Clock size={12} className="mr-1" />}
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedModeration(record)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <Eye size={18} />
                  </button>
                  <button className="text-green-600 hover:text-green-800">
                    <Download size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Moderation Checklist Modal */}
      {selectedModeration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Moderation Details - {selectedModeration.assessmentId}</h3>
              <button onClick={() => setSelectedModeration(null)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Candidate Info */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Candidate</p>
                  <p className="font-medium">{selectedModeration.candidateName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assessor</p>
                  <p className="font-medium">{selectedModeration.assessor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Moderator</p>
                  <p className="font-medium">{selectedModeration.moderator}</p>
                </div>
              </div>

              {/* Marks */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-4">Marks Comparison</h4>
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Original Mark</p>
                    <p className="text-3xl font-bold text-gray-700">{selectedModeration.marks.original}</p>
                  </div>
                  <ChevronRight size={32} className="text-gray-400" />
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Moderated Mark</p>
                    <p className="text-3xl font-bold text-blue-600">{selectedModeration.marks.moderated}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Difference</p>
                    <p className={`text-xl font-bold ${
                      selectedModeration.marks.difference > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedModeration.marks.difference > 0 ? '+' : ''}{selectedModeration.marks.difference}
                    </p>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h4 className="font-medium mb-4">Moderation Checklist</h4>
                <div className="space-y-3">
                  {selectedModeration.checklist.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            {item.status === 'passed' && <CheckCircle size={16} className="text-green-600 mr-2" />}
                            {item.status === 'failed' && <XCircle size={16} className="text-red-600 mr-2" />}
                            {item.status === 'pending' && <Clock size={16} className="text-yellow-600 mr-2" />}
                            <span className="font-medium">{item.criterion}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{item.comments}</p>
                          {item.evidence && (
                            <button className="mt-2 text-blue-600 text-sm flex items-center">
                              <FileText size={14} className="mr-1" />
                              View Evidence
                            </button>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'passed' ? 'bg-green-100 text-green-800' :
                          item.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <h4 className="font-medium mb-2">Moderator Comments</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p>{selectedModeration.comments}</p>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="font-medium mb-4">Documents</h4>
                <div className="border rounded-lg p-4">
                  <input
                    type="file"
                    id="moderationDoc"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'moderation', selectedModeration.id)}
                  />
                  <label
                    htmlFor="moderationDoc"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-700 inline-flex items-center"
                  >
                    <Upload size={16} className="mr-2" />
                    Upload Document
                  </label>
                  
                  {/* Document list would go here */}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => updateModerationStatus(selectedModeration.id, 'approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <ThumbsUp size={18} className="inline mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => updateModerationStatus(selectedModeration.id, 'flagged')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <ThumbsDown size={18} className="inline mr-2" />
                  Flag Issues
                </button>
                <button
                  onClick={() => setSelectedModeration(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Site Visit Planning
  const renderSiteVisitPlanning = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center">
          <Calendar className="mr-2 text-green-600" size={24} />
          Site Visit Planning
        </h2>
        <button
          onClick={() => setShowNewSiteVisit(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Plan New Visit
        </button>
      </div>

      {/* Team Members Quick View */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-3 flex items-center">
          <Users size={18} className="mr-2 text-gray-600" />
          Quality Assurance Team
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
            <div className="bg-blue-100 p-2 rounded-full">
              <UserCheck className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="font-medium">Quality Partner</p>
              <p className="text-sm text-gray-600">SETA Representative</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
            <div className="bg-purple-100 p-2 rounded-full">
              <Users className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="font-medium">Assistant Director</p>
              <p className="text-sm text-gray-600">Quality Assurance</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
            <div className="bg-orange-100 p-2 rounded-full">
              <Briefcase className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="font-medium">Deputy Director</p>
              <p className="text-sm text-gray-600">Operations</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
            <div className="bg-red-100 p-2 rounded-full">
              <Award className="text-red-600" size={20} />
            </div>
            <div>
              <p className="font-medium">Domain Director</p>
              <p className="text-sm text-gray-600">Technical Oversight</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Visits */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="font-medium">Scheduled Site Visits</h3>
        </div>
        <div className="divide-y">
          {siteVisits.map((visit) => (
            <div key={visit.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-medium">{visit.siteName}</h4>
                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                      visit.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                      visit.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                      visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {visit.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin size={14} className="mr-1" />
                      {visit.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar size={14} className="mr-1" />
                      {visit.date} at {visit.time}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users size={14} className="mr-1" />
                      {visit.assignedTeam.length} team members
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Purpose: {visit.purpose}</p>
                </div>
                <button
                  onClick={() => setSelectedVisit(visit)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ZoomIn size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Site Visit Modal */}
      {showNewSiteVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Plan New Site Visit</h3>
              <button onClick={() => setShowNewSiteVisit(false)} className="text-gray-500 hover:text-gray-700">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addSiteVisit({
                siteName: formData.get('siteName') as string,
                location: formData.get('location') as string,
                date: formData.get('date') as string,
                time: formData.get('time') as string,
                purpose: formData.get('purpose') as string
              });
            }}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                  <input
                    type="text"
                    name="siteName"
                    required
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Enter site name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    required
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Enter full address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      name="time"
                      required
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                  <textarea
                    name="purpose"
                    required
                    rows={3}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Describe the purpose of this site visit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign Team Members</label>
                  <select className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500" multiple size={3}>
                    <option value="1">John Smith - Quality Partner (SETA)</option>
                    <option value="2">Sarah Johnson - Assistant Director</option>
                    <option value="3">Mike Peters - Deputy Director</option>
                    <option value="4">Lisa Brown - Domain Director</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl to select multiple</p>
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewSiteVisit(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Visit Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Render Site Visit Execution
  const renderSiteVisitExecution = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center">
        <Building className="mr-2 text-orange-600" size={24} />
        Site Visit Execution
      </h2>

      {/* Active Visits */}
      <div className="grid grid-cols-2 gap-6">
        {siteVisits.filter(v => v.status === 'planned' || v.status === 'in-progress').map((visit) => (
          <div key={visit.id} className="bg-white rounded-lg shadow">
            <div className="p-4 border-b bg-orange-50">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{visit.siteName}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  visit.status === 'planned' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {visit.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{visit.date} at {visit.time}</p>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Team */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Visit Team</h4>
                <div className="space-y-2">
                  {visit.assignedTeam.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <span>{member.name}</span>
                      <span className="text-gray-500">{member.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Visit Checklist</h4>
                <div className="space-y-2">
                  {visit.checklist.map((item) => (
                    <div key={item.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={item.status === 'completed'}
                        onChange={(e) => updateChecklistItem(
                          visit.id, 
                          item.id, 
                          e.target.checked ? 'completed' : 'pending',
                          item.notes
                        )}
                      />
                      <div className="flex-1">
                        <p className="text-sm">{item.item}</p>
                        {item.status === 'completed' && (
                          <p className="text-xs text-gray-500">
                            Verified by {item.verifiedBy} on {item.verifiedDate}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Finding Button */}
              <button
                onClick={() => {
                  setSelectedVisit(visit);
                  setShowNewFinding(true);
                }}
                className="w-full border-2 border-dashed border-orange-200 rounded-lg p-3 text-orange-600 hover:bg-orange-50"
              >
                <Plus size={20} className="inline mr-2" />
                Add Finding
              </button>

              {/* Upload Report */}
              <div>
                <input
                  type="file"
                  id={`report-${visit.id}`}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'siteVisit', visit.id)}
                />
                <label
                  htmlFor={`report-${visit.id}`}
                  className="block w-full text-center border rounded-lg p-2 text-sm cursor-pointer hover:bg-gray-50"
                >
                  <Upload size={16} className="inline mr-2" />
                  Upload Visit Report
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Finding Modal */}
      {showNewFinding && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">Add Finding - {selectedVisit.siteName}</h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addFinding(selectedVisit.id, {
                type: formData.get('type') as any,
                description: formData.get('description') as string,
                severity: formData.get('severity') as any,
                evidence: formData.get('evidence') as string
              });
            }}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Finding Type</label>
                  <select name="type" required className="w-full border rounded-lg p-2">
                    <option value="compliance">Compliance</option>
                    <option value="non-compliance">Non-Compliance</option>
                    <option value="observation">Observation</option>
                    <option value="recommendation">Recommendation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select name="severity" required className="w-full border rounded-lg p-2">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full border rounded-lg p-2"
                    placeholder="Describe the finding"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Evidence (Optional)</label>
                  <input
                    type="file"
                    name="evidence"
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>
              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFinding(false);
                    setSelectedVisit(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Add Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Render Post-EISA Monitoring
  const renderPostEISAMonitoring = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center">
        <TrendingUp className="mr-2 text-purple-600" size={24} />
        Post-EISA Monitoring
      </h2>

      {/* Monitoring Records */}
      <div className="space-y-4">
        {postEISAMonitoring.map((monitoring) => (
          <div key={monitoring.id} className="bg-white rounded-lg shadow">
            <div className="p-4 border-b bg-purple-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{monitoring.siteName}</h3>
                  <p className="text-sm text-gray-600">Visit Date: {monitoring.visitDate}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    monitoring.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    monitoring.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {monitoring.approvalStatus}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    monitoring.status === 'completed' ? 'bg-green-100 text-green-800' :
                    monitoring.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {monitoring.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-medium mb-4">Verification Checklist</h4>
              <div className="space-y-3">
                {monitoring.verification.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.criterion}</p>
                        {item.result !== 'pending' && (
                          <p className="text-sm text-gray-600 mt-1">
                            Verified by {item.verifiedBy} on {item.verifiedDate}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={item.result}
                          onChange={(e) => updateVerification(monitoring.id, item.id, e.target.value, item.evidence)}
                          className="border rounded-lg px-2 py-1 text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                        </select>
                        <input
                          type="file"
                          id={`evidence-${item.id}`}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              updateVerification(monitoring.id, item.id, item.result, file.name);
                            }
                          }}
                        />
                        <label
                          htmlFor={`evidence-${item.id}`}
                          className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          <Upload size={16} />
                        </label>
                      </div>
                    </div>
                    {item.evidence && (
                      <div className="mt-2 flex items-center text-sm text-gray-600">
                        <FileText size={14} className="mr-1" />
                        {item.evidence}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Final Report Upload */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Final Monitoring Report</h4>
                    <p className="text-sm text-gray-600">Upload the completed monitoring report</p>
                  </div>
                  <input
                    type="file"
                    id="finalReport"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        showNotification('success', 'Report uploaded successfully');
                      }
                    }}
                  />
                  <label
                    htmlFor="finalReport"
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-purple-700"
                  >
                    <Upload size={16} className="inline mr-2" />
                    Upload Report
                  </label>
                </div>
              </div>

              {/* Approval Actions */}
              {monitoring.approvalStatus === 'pending' && (
                <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                  <button
                    onClick={() => approveMonitoring(monitoring.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <ThumbsUp size={18} className="inline mr-2" />
                    Approve
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <ThumbsDown size={18} className="inline mr-2" />
                    Reject
                  </button>
                </div>
              )}

              {monitoring.approvalStatus === 'approved' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="bg-green-50 p-4 rounded-lg flex items-center">
                    <CheckCircle className="text-green-600 mr-3" size={24} />
                    <div>
                      <p className="font-medium text-green-800">Approved by {monitoring.approvedBy}</p>
                      <p className="text-sm text-green-600">on {monitoring.approvalDate}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Shield className="mr-3 text-blue-600" size={32} />
          Quality Assurance
        </h1>
        <p className="text-gray-600 mt-2">Post-assessment quality checks and verification</p>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`mb-4 p-4 rounded-lg flex items-center ${
          notification.type === 'success' ? 'bg-green-100 text-green-700' :
          notification.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {notification.type === 'success' && <CheckCircle size={20} className="mr-2" />}
          {notification.type === 'error' && <XCircle size={20} className="mr-2" />}
          {notification.type === 'info' && <AlertCircle size={20} className="mr-2" />}
          {notification.message}
        </div>
      )}

      {/* Sub-section Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveSubTab('moderation')}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                activeSubTab === 'moderation'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardCheck size={18} className="mr-2" />
              🔍 Moderation
            </button>
            <button
              onClick={() => setActiveSubTab('siteVisitPlanning')}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                activeSubTab === 'siteVisitPlanning'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar size={18} className="mr-2" />
              📋 Site Visit Planning
            </button>
            <button
              onClick={() => setActiveSubTab('siteVisitExecution')}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                activeSubTab === 'siteVisitExecution'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building size={18} className="mr-2" />
              🏢 Site Visit Execution
            </button>
            <button
              onClick={() => setActiveSubTab('postEISAMonitoring')}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                activeSubTab === 'postEISAMonitoring'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp size={18} className="mr-2" />
              📊 Post-EISA Monitoring
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeSubTab === 'moderation' && renderModeration()}
          {activeSubTab === 'siteVisitPlanning' && renderSiteVisitPlanning()}
          {activeSubTab === 'siteVisitExecution' && renderSiteVisitExecution()}
          {activeSubTab === 'postEISAMonitoring' && renderPostEISAMonitoring()}
        </div>
      </div>

      {/* Role Information Panel */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-3 flex items-center">
          <Users size={18} className="mr-2 text-gray-600" />
          Current Section Roles & Responsibilities
        </h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="border-l-4 border-blue-500 pl-3">
            <p className="font-medium">🔍 Moderation</p>
            <p className="text-gray-600">Assistant Director, Deputy Director, Domain Director</p>
          </div>
          <div className="border-l-4 border-green-500 pl-3">
            <p className="font-medium">📋 Site Visit Planning</p>
            <p className="text-gray-600">Quality Partner (SETA), Assistant Director, Deputy Director, Domain Director</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-3">
            <p className="font-medium">🏢 Site Visit Execution</p>
            <p className="text-gray-600">Sub Domain Admin, Deputy & Assistant Director</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-3">
            <p className="font-medium">📊 Post-EISA Monitoring</p>
            <p className="text-gray-600">Quality Partner (SETA), Assistant Director, Deputy Director, Director</p>
          </div>
        </div>
      </div>
    </div>
  );
}