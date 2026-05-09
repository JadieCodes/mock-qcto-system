// pages/internal/ResolutionPhase.tsx - Fixed TypeScript errors
import React, { useState, useEffect,useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Download,
  Upload,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Award,
  BookOpen,
  Users,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  FileCheck,
  FileSignature,
  ClipboardList,
  Shield,
  Send,
  Save,
  Trash2,
  Edit,
  Plus,
  Printer,
  RefreshCw,
  X
} from 'lucide-react';

// Types
interface ResolutionChecklist {
  id: string;
  item: string;
  required: boolean;
  completed: boolean;
  completedBy?: string;
  completedDate?: string;
  notes?: string;
}

interface ApprovalLetter {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedDate: string;
  type: 'approval' | 'rejection';
  letterNumber: string;
  issueDate: string;
  signedBy: string;
}

interface ResolutionProject {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
  submitterName: string;
  submissionDate: string;
  status: 'pending_review' | 'in_review' | 'approved' | 'rejected' | 'resolution_created';
  progress: number;
  checklists: ResolutionChecklist[];
  approvalLetter?: ApprovalLetter;
  resolutionDocument?: {
    fileName: string;
    fileUrl: string;
    uploadedDate: string;
    resolutionNumber: string;
  };
  allPhasesCompleted: boolean;
  finalVerificationApproved: boolean;
}

// Sample data for resolutions
const getSampleResolutions = (): ResolutionProject[] => {
  return [
    {
      id: '1',
      qualificationCode: 'ND-IT-2024',
      qualificationTitle: 'National Diploma: Information Technology',
      submitterName: 'Dr. Sarah Johnson',
      submissionDate: '2024-03-15',
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
    },
    {
      id: '2',
      qualificationCode: 'BE-ELEC-2024',
      qualificationTitle: 'Bachelor of Engineering: Electrical',
      submitterName: 'Prof. Michael Chen',
      submissionDate: '2024-03-14',
      status: 'in_review',
      progress: 45,
      allPhasesCompleted: true,
      finalVerificationApproved: true,
      checklists: [
        { id: 'c1', item: 'All phase reports submitted and approved', required: true, completed: true },
        { id: 'c2', item: 'Final verification report reviewed', required: true, completed: true },
        { id: 'c3', item: 'Quality assurance standards met', required: true, completed: true },
        { id: 'c4', item: 'Industry stakeholder consultation completed', required: true, completed: false },
        { id: 'c5', item: 'Alignment with NQF level descriptors verified', required: true, completed: false },
        { id: 'c6', item: 'Credit value justification provided', required: true, completed: false },
        { id: 'c7', item: 'Articulation routes identified', required: false, completed: false },
        { id: 'c8', item: 'Assessment strategy approved', required: true, completed: false }
      ]
    }
  ];
};

// Helper to safely update status with type checking
const updateStatus = (status: ResolutionProject['status']): ResolutionProject['status'] => {
  return status;
};

export default function ResolutionPhase() {
  const [resolutions, setResolutions] = useState<ResolutionProject[]>([]);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLetterUploadOpen, setIsLetterUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'approval' | 'rejection'>('approval');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [letterData, setLetterData] = useState({
    letterNumber: '',
    issueDate: '',
    signedBy: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  // pages/internal/ResolutionPhase.tsx - Update the useEffect sections

// First, create a function to load resolutions
const loadResolutions = useCallback(() => {
  const storedResolutions = localStorage.getItem('resolutionProjects');
  console.log('Loading resolutions from localStorage:', storedResolutions);
  
  if (storedResolutions) {
    const parsed = JSON.parse(storedResolutions);
    const validated = parsed.map((r: any) => ({
      ...r,
      status: r.status as ResolutionProject['status']
    }));
    setResolutions(validated);
    console.log('Resolutions set to:', validated);
  } else {
    console.log('No resolutions found, using sample data');
    setResolutions(getSampleResolutions());
    localStorage.setItem('resolutionProjects', JSON.stringify(getSampleResolutions()));
  }
}, []);

// Load on mount
useEffect(() => {
  loadResolutions();
}, [loadResolutions]);

// Listen for storage events
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'resolutionProjects') {
      console.log('Storage event: resolutionProjects changed', e.newValue);
      if (e.newValue) {
        const parsed = JSON.parse(e.newValue);
        const validated = parsed.map((r: any) => ({
          ...r,
          status: r.status as ResolutionProject['status']
        }));
        setResolutions(validated);
      } else {
        loadResolutions();
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [loadResolutions]);

// Also listen for custom events for same-tab updates
useEffect(() => {
  const handleCustomEvent = () => {
    console.log('Custom refresh event received');
    loadResolutions();
  };
  
  window.addEventListener('refreshWorkspace', handleCustomEvent);
  return () => window.removeEventListener('refreshWorkspace', handleCustomEvent);
}, [loadResolutions]);
  // Add this useEffect to ResolutionPhase.tsx
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'resolutionProjects' && e.newValue) {
      const parsed = JSON.parse(e.newValue);
      const validated = parsed.map((r: any) => ({
        ...r,
        status: r.status as ResolutionProject['status']
      }));
      setResolutions(validated);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);

  useEffect(() => {
    // Load resolutions from localStorage or use sample
    const storedResolutions = localStorage.getItem('resolutionProjects');
    if (storedResolutions) {
      const parsed = JSON.parse(storedResolutions);
      // Ensure status values are correct type
      const validated = parsed.map((r: any) => ({
        ...r,
        status: r.status as ResolutionProject['status']
      }));
      setResolutions(validated);
    } else {
      setResolutions(getSampleResolutions());
      localStorage.setItem('resolutionProjects', JSON.stringify(getSampleResolutions()));
    }
  }, []);

  const getStatusBadge = (status: ResolutionProject['status']) => {
    switch(status) {
      case 'pending_review':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Review</span>;
      case 'in_review':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Eye className="w-3 h-3" /> In Review</span>;
      case 'approved':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'rejected':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      case 'resolution_created':
        return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"><FileSignature className="w-3 h-3" /> Resolution Created</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const handleViewResolution = (resolution: ResolutionProject) => {
    setSelectedResolution(resolution);
    setIsModalOpen(true);
  };

  const handleUpdateChecklist = (checklistId: string, completed: boolean) => {
    if (!selectedResolution) return;
    
    const updatedChecklists = selectedResolution.checklists.map(item =>
      item.id === checklistId ? { ...item, completed, completedDate: completed ? new Date().toISOString() : undefined } : item
    );
    
    const completedCount = updatedChecklists.filter(item => item.completed).length;
    const requiredCount = updatedChecklists.filter(item => item.required).length;
    const progress = (completedCount / requiredCount) * 100;
    
    const newStatus: ResolutionProject['status'] = progress === 100 ? 'resolution_created' : 'in_review';
    
    const updatedResolution: ResolutionProject = {
      ...selectedResolution,
      checklists: updatedChecklists,
      progress,
      status: newStatus
    };
    
    setSelectedResolution(updatedResolution);
    
    // Update in resolutions array
    const updatedResolutions = resolutions.map(r =>
      r.id === selectedResolution.id ? updatedResolution : r
    );
    setResolutions(updatedResolutions);
    localStorage.setItem('resolutionProjects', JSON.stringify(updatedResolutions));
  };

// In ResolutionPhase.tsx - Update the handleUploadLetter function
const handleUploadLetter = () => {
  if (!selectedResolution || !selectedFile) return;
  
  const newLetter: ApprovalLetter = {
    id: Date.now().toString(),
    fileName: selectedFile.name,
    fileUrl: URL.createObjectURL(selectedFile),
    uploadedBy: 'Internal User',
    uploadedDate: new Date().toISOString(),
    type: uploadType,
    letterNumber: letterData.letterNumber,
    issueDate: letterData.issueDate,
    signedBy: letterData.signedBy
  };
  
  const newStatus: ResolutionProject['status'] = uploadType === 'approval' ? 'approved' : 'rejected';
  
  const updatedResolution: ResolutionProject = {
    ...selectedResolution,
    approvalLetter: newLetter,
    status: newStatus
  };
  
  setSelectedResolution(updatedResolution);
  
  // Update in resolutions array
  const updatedResolutions = resolutions.map(r =>
    r.id === selectedResolution.id ? updatedResolution : r
  );
  setResolutions(updatedResolutions);
  localStorage.setItem('resolutionProjects', JSON.stringify(updatedResolutions));
  
  // ========== AUTO-MOVE TO PUBLIC INPUT IF APPROVED ==========
  if (uploadType === 'approval') {
    // Move to Public Input Dashboard
    const publicSubmissions = localStorage.getItem('publicInputQualifications') || '[]';
    let submissions = JSON.parse(publicSubmissions);
    
    // Check if already exists
    const exists = submissions.some((s: any) => s.qualificationCode === selectedResolution.qualificationCode);
    
    if (!exists) {
      // Create new public input qualification
      const newPublicQualification = {
        id: selectedResolution.id,
        qualificationCode: selectedResolution.qualificationCode,
        qualificationTitle: selectedResolution.qualificationTitle,
        qualificationLevel: 6, // You may want to store this in the resolution data
        credits: 120, // You may want to store this in the resolution data
        submittedBy: selectedResolution.submitterName,
        submittedDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        allPhasesCompleted: true,
        comments: [],
        resolutionDocument: {
          fileName: selectedFile.name,
          fileUrl: URL.createObjectURL(selectedFile),
          uploadDate: new Date().toISOString(),
          resolutionNumber: letterData.letterNumber,
          issueDate: letterData.issueDate,
          signedBy: letterData.signedBy,
          notes: letterData.notes
        }
      };
      
      submissions.push(newPublicQualification);
      localStorage.setItem('publicInputQualifications', JSON.stringify(submissions));
      
      // Also add to approval qualifications
      const approvalQualifications = localStorage.getItem('approvalQualifications') || '[]';
      let approvals = JSON.parse(approvalQualifications);
      
      approvals.push({
        id: selectedResolution.id,
        qualificationCode: selectedResolution.qualificationCode,
        qualificationTitle: selectedResolution.qualificationTitle,
        nqfLevel: 6,
        credits: 120,
        submittedBy: selectedResolution.submitterName,
        submittedDate: new Date().toISOString().split('T')[0],
        status: 'pending_review',
        currentApprovalLevel: 0,
        movedToApprovalDate: new Date().toISOString(),
        recommendations: [],
        resolutionDocument: {
          fileName: selectedFile.name,
          fileUrl: URL.createObjectURL(selectedFile),
          resolutionNumber: letterData.letterNumber,
          issueDate: letterData.issueDate,
          signedBy: letterData.signedBy,
          notes: letterData.notes,
          uploadDate: new Date().toISOString()
        },
        allDocuments: {
          qualificationDocument: '',
          curriculumSpec: '',
          assessmentGuidelines: '',
          qasReport: ''
        }
      });
      
      localStorage.setItem('approvalQualifications', JSON.stringify(approvals));
      
      // Dispatch events to refresh other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'publicInputQualifications',
        newValue: JSON.stringify(submissions)
      }));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'approvalQualifications',
        newValue: JSON.stringify(approvals)
      }));
      window.dispatchEvent(new CustomEvent('refreshWorkspace'));
      
      alert(`Qualification "${selectedResolution.qualificationTitle}" has been moved to Public Input Dashboard and Qualifications Approval Phase!`);
    } else {
      alert(`Qualification "${selectedResolution.qualificationTitle}" already exists in Public Input Dashboard.`);
    }
  }
  // ========== END AUTO-MOVE ==========
  
  // Close modal and reset
  setIsLetterUploadOpen(false);
  setSelectedFile(null);
  setLetterData({ letterNumber: '', issueDate: '', signedBy: '', notes: '' });
  
  // Close the resolution detail modal
  setIsModalOpen(false);
};

  const handleMoveToPublicInput = () => {
    if (!selectedResolution) return;
    
    // Get existing public submissions
    const publicSubmissions = localStorage.getItem('publicSubmissions') || '[]';
    const submissions = JSON.parse(publicSubmissions);
    
    // Add this qualification to public submissions
    submissions.push({
      id: selectedResolution.id,
      qualificationCode: selectedResolution.qualificationCode,
      qualificationTitle: selectedResolution.qualificationTitle,
      submitterName: selectedResolution.submitterName,
      submissionDate: new Date().toISOString(),
      status: 'pending',
      resolutionData: selectedResolution,
      movedAt: new Date().toISOString()
    });
    
    localStorage.setItem('publicSubmissions', JSON.stringify(submissions));
    
    // Update resolution status
    const updatedResolution: ResolutionProject = {
      ...selectedResolution,
      status: 'approved'
    };
    
    const updatedResolutions = resolutions.map(r =>
      r.id === selectedResolution.id ? updatedResolution : r
    );
    setResolutions(updatedResolutions);
    localStorage.setItem('resolutionProjects', JSON.stringify(updatedResolutions));
    
    // Close modal
    setIsModalOpen(false);
    alert('Qualification moved to Public Input Dashboard successfully!');
  };

  const filteredResolutions = resolutions.filter(res => {
    if (searchTerm && !res.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !res.qualificationCode.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter && res.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Resolution Phase</h1>
        <p className="text-gray-500 mt-2">Manage qualification approvals and create resolutions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{resolutions.length}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileSignature className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {resolutions.filter(r => r.status === 'pending_review').length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Review</p>
              <p className="text-2xl font-bold text-blue-600">
                {resolutions.filter(r => r.status === 'in_review').length}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {resolutions.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolution Created</p>
              <p className="text-2xl font-bold text-purple-600">
                {resolutions.filter(r => r.status === 'resolution_created').length}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileCheck className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by qualification..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="border rounded-lg px-3 py-2 text-sm min-w-[150px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending_review">Pending Review</option>
          <option value="in_review">In Review</option>
          <option value="resolution_created">Resolution Created</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Resolutions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitter</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submission Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResolutions.map((resolution) => (
                <tr key={resolution.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{resolution.qualificationTitle}</p>
                      <p className="text-xs text-gray-500">{resolution.qualificationCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{resolution.submitterName}</td>
                  <td className="px-4 py-3 text-sm">{resolution.submissionDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${getProgressColor(resolution.progress)} h-2 rounded-full`}
                          style={{ width: `${resolution.progress}%` }}
                        />
                      </div>
                      <span className="text-xs">{Math.round(resolution.progress)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(resolution.status)}</td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => handleViewResolution(resolution)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Detail Modal */}
      {isModalOpen && selectedResolution && (
        <ResolutionDetailModal
          resolution={selectedResolution}
          onClose={() => setIsModalOpen(false)}
          onUpdateChecklist={handleUpdateChecklist}
          onUploadLetter={() => setIsLetterUploadOpen(true)}
          onMoveToPublicInput={handleMoveToPublicInput}
          setUploadType={setUploadType}
          getStatusBadge={getStatusBadge}
        />
      )}

      {/* Letter Upload Modal */}
      {isLetterUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
              <h3 className="text-lg font-semibold">
                Upload {uploadType === 'approval' ? 'Approval' : 'Rejection'} Letter
              </h3>
              <button onClick={() => setIsLetterUploadOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Letter Number *</label>
                <input
                  type="text"
                  value={letterData.letterNumber}
                  onChange={(e) => setLetterData({ ...letterData, letterNumber: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., LTR-2024-001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                <input
                  type="date"
                  value={letterData.issueDate}
                  onChange={(e) => setLetterData({ ...letterData, issueDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signed By *</label>
                <input
                  type="text"
                  value={letterData.signedBy}
                  onChange={(e) => setLetterData({ ...letterData, signedBy: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Dr. Sarah Johnson, Registrar"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document *</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="letter-upload"
                    accept=".pdf,.doc,.docx"
                  />
                  <label htmlFor="letter-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload letter</p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX (max 10MB)</p>
                  </label>
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-2">Selected: {selectedFile.name}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={letterData.notes}
                  onChange={(e) => setLetterData({ ...letterData, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Any additional notes about this resolution..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setIsLetterUploadOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">
                Cancel
              </button>
              <button 
                onClick={handleUploadLetter}
                disabled={!selectedFile || !letterData.letterNumber || !letterData.issueDate || !letterData.signedBy}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Letter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Resolution Detail Modal Component
interface ResolutionDetailModalProps {
  resolution: ResolutionProject;
  onClose: () => void;
  onUpdateChecklist: (id: string, completed: boolean) => void;
  onUploadLetter: () => void;
  onMoveToPublicInput: () => void;
  setUploadType: (type: 'approval' | 'rejection') => void;
  getStatusBadge: (status: ResolutionProject['status']) => React.ReactNode;
}

function ResolutionDetailModal({ 
  resolution, 
  onClose, 
  onUpdateChecklist, 
  onUploadLetter, 
  onMoveToPublicInput,
  setUploadType,
  getStatusBadge
}: ResolutionDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'documents'>('overview');

  const requiredTotal = resolution.checklists.filter(c => c.required).length;
  const completedRequired = resolution.checklists.filter(c => c.required && c.completed).length;
  const canCreateResolution = completedRequired === requiredTotal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
          <div>
            <h3 className="text-lg font-semibold">{resolution.qualificationTitle}</h3>
            <p className="text-sm text-gray-500">Code: {resolution.qualificationCode}</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(resolution.status)}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
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
                activeTab === 'overview' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'checklist' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              Resolution Checklist
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'documents' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              Documents
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Qualification Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Qualification Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Qualification Code</p>
                    <p className="font-medium">{resolution.qualificationCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submitter</p>
                    <p className="font-medium">{resolution.submitterName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submission Date</p>
                    <p className="font-medium">{resolution.submissionDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">All Phases Completed</p>
                    <p className="font-medium text-green-600">{resolution.allPhasesCompleted ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Resolution Progress</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-600 h-3 rounded-full transition-all"
                        style={{ width: `${resolution.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xl font-bold">{Math.round(resolution.progress)}%</span>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p>Required checklist items: {completedRequired}/{requiredTotal} completed</p>
                </div>
              </div>

              {/* Status Message */}
              {canCreateResolution && resolution.status !== 'approved' && resolution.status !== 'rejected' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-medium">All checklist items completed!</p>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    You can now create a resolution by uploading an approval or rejection letter.
                  </p>
                </div>
              )}

              {resolution.approvalLetter && (
                <div className={`p-4 rounded-lg border ${resolution.approvalLetter.type === 'approval' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2">
                    {resolution.approvalLetter.type === 'approval' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <p className="font-medium">
                      {resolution.approvalLetter.type === 'approval' ? 'Approval Letter Uploaded' : 'Rejection Letter Uploaded'}
                    </p>
                  </div>
                  <p className="text-sm mt-1">Letter Number: {resolution.approvalLetter.letterNumber}</p>
                  <p className="text-sm">Issue Date: {resolution.approvalLetter.issueDate}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Resolution Checklist</h4>
                <div className="text-sm text-gray-500">
                  Required: {completedRequired}/{requiredTotal} completed
                </div>
              </div>
              
              <div className="space-y-3">
                {resolution.checklists.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => onUpdateChecklist(item.id, e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-purple-600 rounded"
                      disabled={resolution.status === 'approved' || resolution.status === 'rejected'}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.item}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      {item.completedDate && (
                        <p className="text-xs text-gray-400 mt-1">Completed: {new Date(item.completedDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    {item.completed && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </div>
                ))}
              </div>

              {canCreateResolution && resolution.status !== 'approved' && resolution.status !== 'rejected' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setUploadType('approval');
                      onUploadLetter();
                    }}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Create Approval Resolution
                  </button>
                  <button
                    onClick={() => {
                      setUploadType('rejection');
                      onUploadLetter();
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Create Rejection Resolution
                  </button>
                </div>
              )}

              {resolution.status === 'approved' && (
                <div className="mt-6">
                  <button
                    onClick={onMoveToPublicInput}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Move to Public Input Dashboard
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    This qualification will appear in the Public Submissions section for public feedback
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h4 className="font-medium">Related Documents</h4>
              
              {resolution.approvalLetter ? (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="font-medium">{resolution.approvalLetter.fileName}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded: {new Date(resolution.approvalLetter.uploadedDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">Letter #: {resolution.approvalLetter.letterNumber}</p>
                      </div>
                    </div>
                    <a 
                      href={resolution.approvalLetter.fileUrl} 
                      download
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No documents uploaded yet</p>
                  <p className="text-xs text-gray-400">Resolution letter will appear here once created</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}