import React, { useState, useEffect } from 'react';
import { 
  Users, FileText, Briefcase, UserCheck, ClipboardCheck, 
  CheckCircle, ArrowRight, Save, Send, Search, Download,
  Upload, X, Eye, Trash2, Plus, Clock, AlertCircle,
  CheckCircle2, XCircle, Loader
} from 'lucide-react';

// Type Definitions
interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  registrationType: string;
  idNumber: string;
  dateOfBirth: string;
  address: string;
}

interface Document {
  id: number;
  name: string;
  file: File | null;
  type: string;
  uploadDate: string;
}

interface RegistrationData {
  personalInfo: PersonalInfo;
  documents: Document[];
  verificationStatus: Record<string, boolean>;
}

interface SkillsTest {
  trade: string;
  score: string;
  testDate: string;
  testFile: File | null;
  fileName: string;
  status: string;
}

interface TechnicalInterview {
  date: string;
  interviewer: string;
  notes: string;
  result: string;
  competencies: string[];
}

interface Certification {
  id: number;
  file: File | null;
  name: string;
  type: string;
  uploadDate: string;
}

interface Approval {
  documentsVerified: boolean;
  skillsTestPassed: boolean;
  certificationsValid: boolean;
  status: string;
}

interface TradesData {
  skillsTest: SkillsTest;
  technicalInterview: TechnicalInterview;
  certifications: Certification[];
  approval: Approval;
  certificateNumber?: string;
  certificateExpiry?: string;
}

interface Competencies {
  communication: boolean;
  teamwork: boolean;
  problemSolving: boolean;
  leadership: boolean;
}

interface GeneralAssessment {
  type: string;
  score: string;
  date: string;
  file: File | null;
  fileName: string;
  status: string;
}

interface BehavioralInterview {
  date: string;
  interviewer: string;
  notes: string;
  result: string;
  competencies: Competencies;
}

interface BackgroundCheck {
  employmentHistory: File | null;
  criminalRecord: File | null;
  employmentFileName: string;
  criminalFileName: string;
  status: string;
  result: string;
}

interface NonTradesApproval {
  assessmentCompleted: boolean;
  interviewPassed: boolean;
  backgroundCleared: boolean;
  status: string;
}

interface NonTradesData {
  generalAssessment: GeneralAssessment;
  behavioralInterview: BehavioralInterview;
  backgroundCheck: BackgroundCheck;
  approval: NonTradesApproval;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  type: string;
  status: string;
  step: string;
  registrationDate: string;
}

interface Notification {
  show: boolean;
  type: string;
  message: string;
}

export default function CandidateRegistration() {
  const [activeTab, setActiveTab] = useState<string>('registration');
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification>({ show: false, type: '', message: '' });
  
  // Registration State
  const [registrationStep, setRegistrationStep] = useState<number>(1);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      registrationType: '',
      idNumber: '',
      dateOfBirth: '',
      address: ''
    },
    documents: [],
    verificationStatus: {}
  });

  // Trades Assessment State
  const [tradesData, setTradesData] = useState<TradesData>({
    skillsTest: {
      trade: '',
      score: '',
      testDate: '',
      testFile: null,
      fileName: '',
      status: 'pending'
    },
    technicalInterview: {
      date: '',
      interviewer: '',
      notes: '',
      result: 'pending',
      competencies: []
    },
    certifications: [],
    approval: {
      documentsVerified: false,
      skillsTestPassed: false,
      certificationsValid: false,
      status: 'pending'
    }
  });

  // Non-Trades Assessment State
  const [nonTradesData, setNonTradesData] = useState<NonTradesData>({
    generalAssessment: {
      type: '',
      score: '',
      date: '',
      file: null,
      fileName: '',
      status: 'pending'
    },
    behavioralInterview: {
      date: '',
      interviewer: '',
      notes: '',
      result: 'pending',
      competencies: {
        communication: false,
        teamwork: false,
        problemSolving: false,
        leadership: false
      }
    },
    backgroundCheck: {
      employmentHistory: null,
      criminalRecord: null,
      employmentFileName: '',
      criminalFileName: '',
      status: 'pending',
      result: ''
    },
    approval: {
      assessmentCompleted: false,
      interviewPassed: false,
      backgroundCleared: false,
      status: 'pending'
    }
  });

  // Candidates List State
  const [candidates, setCandidates] = useState<Candidate[]>([
    { 
      id: 1, 
      name: 'John Doe', 
      type: 'Trades', 
      status: 'In Progress', 
      step: 'Document Verification',
      email: 'john@example.com',
      registrationDate: '2024-01-15'
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      type: 'Non-Trades', 
      status: 'Completed', 
      step: 'Final Review',
      email: 'jane@example.com',
      registrationDate: '2024-01-10'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState<boolean>(false);

  // Function to reset all forms for new registration
  const startNewRegistration = () => {
    setActiveTab('registration');
    setRegistrationStep(1);
    setRegistrationData({
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        registrationType: '',
        idNumber: '',
        dateOfBirth: '',
        address: ''
      },
      documents: [],
      verificationStatus: {}
    });
    setTradesData({
      skillsTest: {
        trade: '',
        score: '',
        testDate: '',
        testFile: null,
        fileName: '',
        status: 'pending'
      },
      technicalInterview: {
        date: '',
        interviewer: '',
        notes: '',
        result: 'pending',
        competencies: []
      },
      certifications: [],
      approval: {
        documentsVerified: false,
        skillsTestPassed: false,
        certificationsValid: false,
        status: 'pending'
      }
    });
    setNonTradesData({
      generalAssessment: {
        type: '',
        score: '',
        date: '',
        file: null,
        fileName: '',
        status: 'pending'
      },
      behavioralInterview: {
        date: '',
        interviewer: '',
        notes: '',
        result: 'pending',
        competencies: {
          communication: false,
          teamwork: false,
          problemSolving: false,
          leadership: false
        }
      },
      backgroundCheck: {
        employmentHistory: null,
        criminalRecord: null,
        employmentFileName: '',
        criminalFileName: '',
        status: 'pending',
        result: ''
      },
      approval: {
        assessmentCompleted: false,
        interviewPassed: false,
        backgroundCleared: false,
        status: 'pending'
      }
    });
    showNotification('success', 'Started new registration form');
    
    // Scroll to top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // File upload handlers with proper types
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: string, section: string) => {
    const file = event.target.files?.[0];
    if (file) {
      if (section === 'trades') {
        setTradesData((prev: TradesData) => ({
          ...prev,
          skillsTest: {
            ...prev.skillsTest,
            testFile: file,
            fileName: file.name,
            status: 'uploaded'
          }
        }));
      } else if (section === 'certification') {
        const newCert: Certification = {
          id: Date.now(),
          file: file,
          name: file.name,
          type: 'certification',
          uploadDate: new Date().toISOString()
        };
        setTradesData((prev: TradesData) => ({
          ...prev,
          certifications: [...prev.certifications, newCert]
        }));
      } else if (section === 'generalAssessment') {
        setNonTradesData((prev: NonTradesData) => ({
          ...prev,
          generalAssessment: {
            ...prev.generalAssessment,
            file: file,
            fileName: file.name,
            status: 'uploaded'
          }
        }));
      } else if (section === 'employmentHistory') {
        setNonTradesData((prev: NonTradesData) => ({
          ...prev,
          backgroundCheck: {
            ...prev.backgroundCheck,
            employmentHistory: file,
            employmentFileName: file.name
          }
        }));
      } else if (section === 'criminalRecord') {
        setNonTradesData((prev: NonTradesData) => ({
          ...prev,
          backgroundCheck: {
            ...prev.backgroundCheck,
            criminalRecord: file,
            criminalFileName: file.name
          }
        }));
      }
      
      showNotification('success', 'File uploaded successfully!');
    }
  };

  // Document upload for registration
  const handleRegistrationDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const newDoc: Document = {
        id: Date.now(),
        name: file.name,
        file: file,
        type: event.target.id,
        uploadDate: new Date().toISOString()
      };
      
      setRegistrationData((prev: RegistrationData) => ({
        ...prev,
        documents: [...prev.documents, newDoc]
      }));
      showNotification('success', 'Document uploaded successfully!');
    }
  };

  // Remove document
  const removeDocument = (docId: number, section: string, subSection: string | null = null) => {
    if (section === 'registration') {
      setRegistrationData((prev: RegistrationData) => ({
        ...prev,
        documents: prev.documents.filter((doc: Document) => doc.id !== docId)
      }));
    } else if (section === 'trades' && subSection === 'certification') {
      setTradesData((prev: TradesData) => ({
        ...prev,
        certifications: prev.certifications.filter((cert: Certification) => cert.id !== docId)
      }));
    }
    showNotification('info', 'Document removed');
  };

  // Notification handler
  const showNotification = (type: string, message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
  };

  // Save progress
  const saveProgress = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showNotification('success', 'Progress saved successfully!');
    }, 1000);
  };

  // Submit registration
  const submitRegistration = () => {
    setLoading(true);
    
    // Validate required fields
    if (!registrationData.personalInfo.fullName || !registrationData.personalInfo.email) {
      showNotification('error', 'Please fill in all required fields');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      const newCandidate: Candidate = {
        id: candidates.length + 1,
        name: registrationData.personalInfo.fullName,
        email: registrationData.personalInfo.email,
        type: registrationData.personalInfo.registrationType || 'Not Specified',
        status: 'Submitted',
        step: 'Pending Review',
        registrationDate: new Date().toISOString().split('T')[0]
      };
      
      setCandidates((prev: Candidate[]) => [...prev, newCandidate]);
      showNotification('success', 'Registration submitted successfully!');
      setLoading(false);
      
      // Reset form after successful submission
      startNewRegistration();
    }, 1500);
  };

  // Filter candidates
  const filteredCandidates: Candidate[] = candidates.filter((candidate: Candidate) =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // View candidate details
  const viewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(true);
  };

  const tabs: { id: string; label: string; icon: React.ElementType }[] = [
    { id: 'registration', label: 'EISA Registration', icon: FileText },
    { id: 'trades', label: 'EISA Trades', icon: Briefcase },
    { id: 'nontrades', label: 'EISA Non Trades', icon: Users },
  ];

  const renderRegistrationProcess = () => {
    return (
      <div className="space-y-6">
        {/* Notification */}
        {notification.show && (
          <div className={`p-4 rounded-lg flex items-center ${
            notification.type === 'success' ? 'bg-green-100 text-green-700' :
            notification.type === 'error' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {notification.type === 'success' && <CheckCircle2 size={20} className="mr-2" />}
            {notification.type === 'error' && <XCircle size={20} className="mr-2" />}
            {notification.type === 'info' && <AlertCircle size={20} className="mr-2" />}
            {notification.message}
          </div>
        )}

        {/* Process Steps Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: 'Application' },
            { num: 2, label: 'Verification' },
            { num: 3, label: 'Trades' },
            { num: 4, label: 'Non-Trades' },
            { num: 5, label: 'Review' },
            { num: 6, label: 'Complete' }
          ].map((step) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  registrationStep >= step.num 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {registrationStep > step.num ? <CheckCircle2 size={20} /> : step.num}
                </div>
                <span className="text-xs mt-1 text-gray-600">{step.label}</span>
              </div>
              {step.num < 6 && <ArrowRight className="text-gray-400" size={20} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Initial Application */}
        {registrationStep === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Initial Application</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                  value={registrationData.personalInfo.fullName}
                  onChange={(e) => setRegistrationData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email"
                  value={registrationData.personalInfo.email}
                  onChange={(e) => setRegistrationData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, email: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input 
                  type="tel" 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                  value={registrationData.personalInfo.phone}
                  onChange={(e) => setRegistrationData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, phone: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Registration Type</label>
                <select 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={registrationData.personalInfo.registrationType}
                  onChange={(e) => setRegistrationData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, registrationType: e.target.value }
                  }))}
                >
                  <option value="">Select type</option>
                  <option value="Trades">Trades</option>
                  <option value="Non-Trades">Non-Trades</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter ID number"
                  value={registrationData.personalInfo.idNumber}
                  onChange={(e) => setRegistrationData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, idNumber: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={registrationData.personalInfo.dateOfBirth}
                  onChange={(e) => setRegistrationData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
                  }))}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter address"
                  value={registrationData.personalInfo.address}
                  onChange={(e) => setRegistrationData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, address: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Document Verification */}
        {registrationStep === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Document Verification</h3>
            <div className="space-y-4">
              {/* ID Document Upload */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">ID Document</h4>
                    <p className="text-sm text-gray-600">Upload government-issued ID (PDF, JPG, PNG)</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="idDocument"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleRegistrationDocumentUpload}
                    />
                    <label
                      htmlFor="idDocument"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-700 inline-flex items-center"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload
                    </label>
                  </div>
                </div>
                {/* Display uploaded ID documents */}
                {registrationData.documents.filter((doc: Document) => doc.type === 'idDocument').map((doc: Document) => (
                  <div key={doc.id} className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{doc.name}</span>
                    <button onClick={() => removeDocument(doc.id, 'registration', null)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Qualifications Upload */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Qualifications</h4>
                    <p className="text-sm text-gray-600">Upload certificates and qualifications</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="qualifications"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleRegistrationDocumentUpload}
                    />
                    <label
                      htmlFor="qualifications"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-700 inline-flex items-center"
                    >
                      <Upload size={16} className="mr-2" />
                      Upload
                    </label>
                  </div>
                </div>
                {/* Display uploaded qualification documents */}
                {registrationData.documents.filter((doc: Document) => doc.type === 'qualifications').map((doc: Document) => (
                  <div key={doc.id} className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{doc.name}</span>
                    <button onClick={() => removeDocument(doc.id, 'registration', null)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Steps 3-6 would be implemented similarly... */}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button 
            onClick={() => setRegistrationStep(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={registrationStep === 1}
          >
            Previous
          </button>
          <div className="space-x-2">
            <button 
              onClick={saveProgress}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 inline-flex items-center"
              disabled={loading}
            >
              {loading ? <Loader size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
              Save Progress
            </button>
            <button 
              onClick={() => {
                if (registrationStep === 6) {
                  submitRegistration();
                } else {
                  setRegistrationStep(prev => Math.min(6, prev + 1));
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center disabled:opacity-50"
              disabled={loading}
            >
              {loading ? <Loader size={18} className="animate-spin mr-2" /> : null}
              {registrationStep === 6 ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTradesProcess = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold mb-4">EISA Trades Assessment</h3>
        
        {/* Trade Skills Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium mb-4 flex items-center">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-2">1</span>
            Trade Skills Test
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Trade</label>
                <select 
                  className="w-full border rounded-lg p-2"
                  value={tradesData.skillsTest.trade}
                  onChange={(e) => setTradesData(prev => ({
                    ...prev,
                    skillsTest: { ...prev.skillsTest, trade: e.target.value }
                  }))}
                >
                  <option value="">Select trade</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Welder">Welder</option>
                  <option value="Mechanic">Mechanic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Date</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2"
                  value={tradesData.skillsTest.testDate}
                  onChange={(e) => setTradesData(prev => ({
                    ...prev,
                    skillsTest: { ...prev.skillsTest, testDate: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Score</label>
                <input 
                  type="number" 
                  className="w-full border rounded-lg p-2" 
                  placeholder="Enter test score"
                  value={tradesData.skillsTest.score}
                  onChange={(e) => setTradesData(prev => ({
                    ...prev,
                    skillsTest: { ...prev.skillsTest, score: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test File</label>
                <input
                  type="file"
                  id="skillsTest"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'skills', 'trades')}
                />
                <label
                  htmlFor="skillsTest"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-700 inline-flex items-center"
                >
                  <Upload size={16} className="mr-2" />
                  Upload Results
                </label>
                {tradesData.skillsTest.fileName && (
                  <span className="ml-2 text-sm text-gray-600">{tradesData.skillsTest.fileName}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Interview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium mb-4 flex items-center">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-2">2</span>
            Technical Interview
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interview Date</label>
              <input 
                type="date" 
                className="w-full border rounded-lg p-2"
                value={tradesData.technicalInterview.date}
                onChange={(e) => setTradesData(prev => ({
                  ...prev,
                  technicalInterview: { ...prev.technicalInterview, date: e.target.value }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer</label>
              <input 
                type="text" 
                className="w-full border rounded-lg p-2" 
                placeholder="Enter interviewer name"
                value={tradesData.technicalInterview.interviewer}
                onChange={(e) => setTradesData(prev => ({
                  ...prev,
                  technicalInterview: { ...prev.technicalInterview, interviewer: e.target.value }
                }))}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Interview Notes</label>
              <textarea 
                className="w-full border rounded-lg p-2" 
                rows={3}
                placeholder="Enter interview notes"
                value={tradesData.technicalInterview.notes}
                onChange={(e) => setTradesData(prev => ({
                  ...prev,
                  technicalInterview: { ...prev.technicalInterview, notes: e.target.value }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
              <select 
                className="w-full border rounded-lg p-2"
                value={tradesData.technicalInterview.result}
                onChange={(e) => setTradesData(prev => ({
                  ...prev,
                  technicalInterview: { ...prev.technicalInterview, result: e.target.value }
                }))}
              >
                <option value="pending">Pending</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trade Certification */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium mb-4 flex items-center">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-2">3</span>
            Trade Certification
          </h4>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-medium">Upload Trade Certificate</h5>
                  <p className="text-sm text-gray-600">Upload valid trade certificate (PDF only)</p>
                </div>
                <input
                  type="file"
                  id="certification"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, 'cert', 'certification')}
                />
                <label
                  htmlFor="certification"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-700 inline-flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  Add Certificate
                </label>
              </div>
              
              {/* Display uploaded certificates */}
              {tradesData.certifications.map((cert: Certification) => (
                <div key={cert.id} className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex items-center">
                    <FileText size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm">{cert.name}</span>
                  </div>
                  <button 
                    onClick={() => removeDocument(cert.id, 'trades', 'certification')} 
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Number</label>
              <input 
                type="text" 
                className="w-full border rounded-lg p-2" 
                placeholder="Enter certificate number"
                onChange={(e) => setTradesData(prev => ({
                  ...prev,
                  certificateNumber: e.target.value
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
              <input 
                type="date" 
                className="w-full border rounded-lg p-2"
                onChange={(e) => setTradesData(prev => ({
                  ...prev,
                  certificateExpiry: e.target.value
                }))}
              />
            </div>
          </div>
        </div>

        {/* Trade Final Approval */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium mb-4 flex items-center">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-2">4</span>
            Trade Final Approval
          </h4>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-green-600"
                checked={tradesData.approval.documentsVerified}
                onChange={(e) => setTradesData(prev => ({
                  ...prev,
                  approval: { ...prev.approval, documentsVerified: e.target.checked }
                }))}
              />
              <span>Verify all documents are complete</span>
            </div>
            <div className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-green-600"
                checked={tradesData.approval.skillsTestPassed}
                onChange={(e) => setTradesData(prev => ({
                  ...prev,
                  approval: { ...prev.approval, skillsTestPassed: e.target.checked }
                }))}
              />
              <span>Confirm trade skills test passed</span>
            </div>
            <div className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-green-600"
                checked={tradesData.approval.certificationsValid}
                onChange={(e) => setTradesData(prev => ({
                  ...prev,
                  approval: { ...prev.approval, certificationsValid: e.target.checked }
                }))}
              />
              <span>Verify certifications are valid</span>
            </div>
            <button 
              className={`w-full px-4 py-2 rounded-lg flex items-center justify-center ${
                tradesData.approval.documentsVerified && tradesData.approval.skillsTestPassed && tradesData.approval.certificationsValid
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!tradesData.approval.documentsVerified || !tradesData.approval.skillsTestPassed || !tradesData.approval.certificationsValid}
              onClick={() => {
                setTradesData(prev => ({
                  ...prev,
                  approval: { ...prev.approval, status: 'approved' }
                }));
                showNotification('success', 'Trade candidate approved successfully!');
              }}
            >
              <CheckCircle size={18} className="mr-2" />
              Approve Trade Candidate
            </button>
          </div>
        </div>

        {/* Save Button for Trades */}
        <div className="flex justify-end">
          <button 
            onClick={saveProgress}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
            disabled={loading}
          >
            {loading ? <Loader size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
            Save Trades Assessment
          </button>
        </div>
      </div>
    );
  };

  const renderNonTradesProcess = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold mb-4">EISA Non Trades Assessment</h3>
        
        {/* General Assessment */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium mb-4 flex items-center">
            <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm mr-2">1</span>
            General Assessment
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type</label>
              <select 
                className="w-full border rounded-lg p-2"
                value={nonTradesData.generalAssessment.type}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  generalAssessment: { ...prev.generalAssessment, type: e.target.value }
                }))}
              >
                <option value="">Select type</option>
                <option value="aptitude">Aptitude Test</option>
                <option value="personality">Personality Test</option>
                <option value="skills">Skills Assessment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Date</label>
              <input 
                type="date" 
                className="w-full border rounded-lg p-2"
                value={nonTradesData.generalAssessment.date}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  generalAssessment: { ...prev.generalAssessment, date: e.target.value }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Score</label>
              <input 
                type="number" 
                className="w-full border rounded-lg p-2" 
                placeholder="Enter assessment score"
                value={nonTradesData.generalAssessment.score}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  generalAssessment: { ...prev.generalAssessment, score: e.target.value }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment File</label>
              <input
                type="file"
                id="generalAssessment"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'assessment', 'generalAssessment')}
              />
              <label
                htmlFor="generalAssessment"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-700 inline-flex items-center"
              >
                <Upload size={16} className="mr-2" />
                Upload File
              </label>
              {nonTradesData.generalAssessment.fileName && (
                <span className="ml-2 text-sm text-gray-600">{nonTradesData.generalAssessment.fileName}</span>
              )}
            </div>
          </div>
        </div>

        {/* Behavioral Interview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium mb-4 flex items-center">
            <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm mr-2">2</span>
            Behavioral Interview
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interview Date</label>
              <input 
                type="date" 
                className="w-full border rounded-lg p-2"
                value={nonTradesData.behavioralInterview.date}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  behavioralInterview: { ...prev.behavioralInterview, date: e.target.value }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer</label>
              <input 
                type="text" 
                className="w-full border rounded-lg p-2" 
                placeholder="Enter interviewer name"
                value={nonTradesData.behavioralInterview.interviewer}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  behavioralInterview: { ...prev.behavioralInterview, interviewer: e.target.value }
                }))}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Competencies Assessed</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(nonTradesData.behavioralInterview.competencies).map(([key, value]) => (
                  <div key={key} className="flex items-center p-2 border rounded">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={value}
                      onChange={(e) => setNonTradesData(prev => ({
                        ...prev,
                        behavioralInterview: {
                          ...prev.behavioralInterview,
                          competencies: { ...prev.behavioralInterview.competencies, [key]: e.target.checked }
                        }
                      }))}
                    />
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Interview Notes</label>
              <textarea 
                className="w-full border rounded-lg p-2" 
                rows={3}
                placeholder="Enter interview notes"
                value={nonTradesData.behavioralInterview.notes}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  behavioralInterview: { ...prev.behavioralInterview, notes: e.target.value }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
              <select 
                className="w-full border rounded-lg p-2"
                value={nonTradesData.behavioralInterview.result}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  behavioralInterview: { ...prev.behavioralInterview, result: e.target.value }
                }))}
              >
                <option value="pending">Pending</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </div>
          </div>
        </div>

        {/* Background Check */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium mb-4 flex items-center">
            <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm mr-2">3</span>
            Background Check
          </h4>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-medium">Employment History</h5>
                  <p className="text-sm text-gray-600">Upload employment verification documents</p>
                </div>
                <input
                  type="file"
                  id="employmentHistory"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'employment', 'employmentHistory')}
                />
                <label
                  htmlFor="employmentHistory"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-700 inline-flex items-center"
                >
                  <Upload size={16} className="mr-2" />
                  Upload
                </label>
              </div>
              {nonTradesData.backgroundCheck.employmentFileName && (
                <div className="mt-2 flex items-center bg-gray-50 p-2 rounded">
                  <FileText size={16} className="text-gray-500 mr-2" />
                  <span className="text-sm">{nonTradesData.backgroundCheck.employmentFileName}</span>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-medium">Criminal Record Check</h5>
                  <p className="text-sm text-gray-600">Upload background check results</p>
                </div>
                <input
                  type="file"
                  id="criminalRecord"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'criminal', 'criminalRecord')}
                />
                <label
                  htmlFor="criminalRecord"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-blue-700 inline-flex items-center"
                >
                  <Upload size={16} className="mr-2" />
                  Upload
                </label>
              </div>
              {nonTradesData.backgroundCheck.criminalFileName && (
                <div className="mt-2 flex items-center bg-gray-50 p-2 rounded">
                  <FileText size={16} className="text-gray-500 mr-2" />
                  <span className="text-sm">{nonTradesData.backgroundCheck.criminalFileName}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Check Status</label>
              <select 
                className="w-full border rounded-lg p-2"
                value={nonTradesData.backgroundCheck.result}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  backgroundCheck: { ...prev.backgroundCheck, result: e.target.value }
                }))}
              >
                <option value="">Select status</option>
                <option value="clear">Clear</option>
                <option value="pending">Pending</option>
                <option value="review">Further Review Required</option>
              </select>
            </div>
          </div>
        </div>

        {/* Non-Trades Final Approval */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium mb-4 flex items-center">
            <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm mr-2">4</span>
            Non-Trades Final Approval
          </h4>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-purple-600"
                checked={nonTradesData.approval.assessmentCompleted}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  approval: { ...prev.approval, assessmentCompleted: e.target.checked }
                }))}
              />
              <span>General assessment completed</span>
            </div>
            <div className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-purple-600"
                checked={nonTradesData.approval.interviewPassed}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  approval: { ...prev.approval, interviewPassed: e.target.checked }
                }))}
              />
              <span>Behavioral interview passed</span>
            </div>
            <div className="flex items-center space-x-4 p-2 hover:bg-gray-50 rounded">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-purple-600"
                checked={nonTradesData.approval.backgroundCleared}
                onChange={(e) => setNonTradesData(prev => ({
                  ...prev,
                  approval: { ...prev.approval, backgroundCleared: e.target.checked }
                }))}
              />
              <span>Background check cleared</span>
            </div>
            <button 
              className={`w-full px-4 py-2 rounded-lg flex items-center justify-center ${
                nonTradesData.approval.assessmentCompleted && nonTradesData.approval.interviewPassed && nonTradesData.approval.backgroundCleared
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!nonTradesData.approval.assessmentCompleted || !nonTradesData.approval.interviewPassed || !nonTradesData.approval.backgroundCleared}
              onClick={() => {
                setNonTradesData(prev => ({
                  ...prev,
                  approval: { ...prev.approval, status: 'approved' }
                }));
                showNotification('success', 'Non-trade candidate approved successfully!');
              }}
            >
              <CheckCircle size={18} className="mr-2" />
              Approve Non-Trade Candidate
            </button>
          </div>
        </div>

        {/* Save Button for Non-Trades */}
        <div className="flex justify-end">
          <button 
            onClick={saveProgress}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center"
            disabled={loading}
          >
            {loading ? <Loader size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
            Save Non-Trades Assessment
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">EISA Registration System</h1>
        <p className="text-gray-600 mt-2">Complete registration process for trades and non-trades candidates</p>
      </div>

      {/* Candidate Search/List */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Active Registrations</h2>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search candidates..." 
                  className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
                onClick={startNewRegistration}
              >
                <Plus size={20} className="mr-2" />
                New Registration
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Step</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCandidates.map((candidate: Candidate) => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{candidate.name}</td>
                  <td className="px-6 py-4">{candidate.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      candidate.type === 'Trades' ? 'bg-green-100 text-green-800' : 
                      candidate.type === 'Non-Trades' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {candidate.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${
                      candidate.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                      candidate.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                      candidate.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {candidate.status === 'In Progress' && <Clock size={12} className="mr-1" />}
                      {candidate.status === 'Completed' && <CheckCircle2 size={12} className="mr-1" />}
                      {candidate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{candidate.step}</td>
                  <td className="px-6 py-4">{candidate.registrationDate}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => viewCandidate(candidate)}
                      className="text-blue-600 hover:text-blue-800 mr-3 flex items-center"
                    >
                      <Eye size={16} className="mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Process Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'registration' && renderRegistrationProcess()}
          {activeTab === 'trades' && renderTradesProcess()}
          {activeTab === 'nontrades' && renderNonTradesProcess()}
        </div>
      </div>

      {/* Candidate Details Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Candidate Details</h3>
              <button 
                onClick={() => setShowCandidateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{selectedCandidate.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedCandidate.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration Type</p>
                  <p className="font-medium">{selectedCandidate.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{selectedCandidate.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Step</p>
                  <p className="font-medium">{selectedCandidate.step}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration Date</p>
                  <p className="font-medium">{selectedCandidate.registrationDate}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-2">
              <button 
                onClick={() => setShowCandidateModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => {
                  setShowCandidateModal(false);
                  setActiveTab(selectedCandidate.type === 'Trades' ? 'trades' : 'nontrades');
                }}
              >
                Continue Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}