import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  Filter,
  Zap,
  History,
  Upload,
  Users,
  Shield,
  DollarSign,
  CheckSquare,
  Square,
  Briefcase
} from 'lucide-react';
import type { ApplicationStatus, AIRecommendation, EvaluationHistoryEntry } from '@/types';
import { mockAccreditationService } from '@/services/mockAccreditationService';

interface SiteVisitManagementProps {
  userName?: string;
  userRole?: string;
}

// Assignment interface - for when Deputy Director assigns to specific people
interface Assignment {
  id: string;
  applicationId: string;
  category: 'quality_partner' | 'verifier';  // This is the correct field name
  assignedToName: string;  // This is the correct field name
  assignedToId: string;    // This is the correct field name
  assignedAt: string;
  assignedBy: string;
  status: 'pending' | 'accepted' | 'completed';
}

// For backward compatibility with siteVisitAllocations
interface SiteVisitAllocation {
  id: string;
  applicationId: string;
  allocatedTo: 'quality_partner' | 'verifier';
  allocatedToName: string;
  allocatedToId: string;
  allocatedAt: string;
  allocatedBy: string;
  status: 'pending' | 'accepted' | 'completed';
}
// Update ScheduledVisit interface
interface ScheduledVisit {
  id: string;
  applicationId: string;
  assignedToId: string;
  assignedToName: string;
  assignedToRole: 'qp' | 'verifier';
  scheduledDate: string;
  scheduledTime: string;
  venue: string;
  status: 'pending_confirmation' | 'sent_to_applicant' | 'accepted' | 'completed' | 'cancelled';
  createdAt: string;
  createdBy: string;
  notified?: boolean;
}
// Desktop Report interface
interface DesktopReport {
  id: string;
  applicationId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
}

// Category Allocation interface - only category, no specific assignee
interface CategoryAllocation {
  id: string;
  applicationId: string;
  category: 'quality_partner' | 'verifier';
  categorizedAt: string;
  categorizedBy: string;
}

// Assignment interface - for when Deputy Director assigns to specific people
interface Assignment {
  id: string;
  applicationId: string;
  category: 'quality_partner' | 'verifier';
  assignedToName: string;
  assignedToId: string;
  assignedAt: string;
  assignedBy: string;
  status: 'pending' | 'accepted' | 'completed';
}

// Availability Slot interface
interface AvailabilitySlot {
  id: string;
  userId: string;
  userName: string;
  userRole: 'qp' | 'verifier';
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'unavailable';
  notes?: string;
}

export default function SiteVisitManagement({ 
  userName = "Deputy Director", 
  userRole = "Deputy Director" 
}: SiteVisitManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<'preparation' | 'scheduling' | 'visit'>('preparation');
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationStatus | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  
  // Modal state
  const [modalActiveTab, setModalActiveTab] = useState<'details' | 'ai-report' | 'history' | 'preparation'>('details');
  
  // Desktop Report state (per application)
  const [desktopReports, setDesktopReports] = useState<DesktopReport[]>([]);
  const [reportNotes, setReportNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Category Allocation state (Assistant Director - only categorizes)
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [categoryType, setCategoryType] = useState<'quality_partner' | 'verifier'>('quality_partner');
  const [categoryAllocations, setCategoryAllocations] = useState<CategoryAllocation[]>([]);

  // Assignment state (Deputy Director - assigns to specific people)
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedVisitApp, setSelectedVisitApp] = useState<ApplicationStatus | null>(null);
const [showVisitModal, setShowVisitModal] = useState(false);

  // Availability slots
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);

  // Scheduling tab state - for per-application assignment selections
  const [assignmentSelections, setAssignmentSelections] = useState<Record<string, {
    assigneeId: string;
    date: string;
    time: string;
  }>>({});

  const [scheduledVisits, setScheduledVisits] = useState<ScheduledVisit[]>([]);
const [showSendScheduleModal, setShowSendScheduleModal] = useState(false);
const [selectedScheduledVisit, setSelectedScheduledVisit] = useState<ScheduledVisit | null>(null);

const [visitModalTab, setVisitModalTab] = useState<'details' | 'ai-report' | 'history' | 'report'>('details');

  // Mock data for allocation (in real app, this would come from an API)
  const qualityPartners = [
    { id: 'qp1', name: 'John Smith', role: 'Senior Quality Partner' },
    { id: 'qp2', name: 'Sarah Johnson', role: 'Quality Partner' },
    { id: 'qp3', name: 'Mike Williams', role: 'Quality Partner' },
    { id: 'qp4', name: 'Emily Brown', role: 'Junior Quality Partner' },
  ];

  const verifiers = [
    { id: 'ver1', name: 'David Brown', role: 'Senior Verifier' },
    { id: 'ver2', name: 'Lisa Anderson', role: 'Verifier' },
    { id: 'ver3', name: 'Robert Taylor', role: 'Verifier' },
    { id: 'ver4', name: 'Jennifer White', role: 'Junior Verifier' },
  ];
useEffect(() => {
  // This will re-run the filters whenever applications change
  // No need to do anything else as the filtered variables will recompute
}, [applications, categoryAllocations, assignments, scheduledVisits]);
  useEffect(() => {
    loadApplications();
    loadAllData();
  }, []);
// Add this function to mark slots as booked
const markSlotsAsBooked = (assignedToName: string, assignedToRole: 'qp' | 'verifier', date: string, time: string) => {
  // Parse the time range if it's in format "start-end"
  const timeParts = time.split('-');
  const startTime = timeParts[0];
  
  // Load current availability slots
  const allKey = 'all_availability_slots';
  const allSaved = localStorage.getItem(allKey);
  let allSlots: AvailabilitySlot[] = allSaved ? JSON.parse(allSaved) : [];
  
  // Update the specific slot to booked
  const updatedSlots = allSlots.map(slot => {
    if (slot.userName === assignedToName && 
        slot.userRole === assignedToRole && 
        slot.date === date && 
        slot.startTime === startTime) {
      return { ...slot, status: 'booked' as const };
    }
    return slot;
  });
  
  // Save back to localStorage
  localStorage.setItem(allKey, JSON.stringify(updatedSlots));
  
  // Also update the individual user's availability
  const userKey = `availability_${assignedToRole}_${assignedToName === 'John Smith' ? 'qp1' : 
                   assignedToName === 'Sarah Johnson' ? 'qp2' : 
                   assignedToName === 'Mike Williams' ? 'qp3' : 
                   assignedToName === 'Emily Brown' ? 'qp4' : 
                   assignedToName === 'David Brown' ? 'ver1' : 
                   assignedToName === 'Lisa Anderson' ? 'ver2' : 
                   assignedToName === 'Robert Taylor' ? 'ver3' : 'ver4'}`;
  
  const userSlots = JSON.parse(localStorage.getItem(userKey) || '[]');
  const updatedUserSlots = userSlots.map((slot: any) => {
    if (slot.date === date && slot.startTime === startTime) {
      return { ...slot, status: 'booked' };
    }
    return slot;
  });
  localStorage.setItem(userKey, JSON.stringify(updatedUserSlots));
  
  // Update state
  setAvailabilitySlots(updatedSlots);
};
  const loadAllData = () => {
    // Load saved data from localStorage (for demo)
    const savedReports = localStorage.getItem('desktopReports');
    if (savedReports) {
      setDesktopReports(JSON.parse(savedReports));
    }
    
    const savedCategories = localStorage.getItem('categoryAllocations');
    if (savedCategories) {
      setCategoryAllocations(JSON.parse(savedCategories));
    }

    const savedAssignments = localStorage.getItem('assignments');
    if (savedAssignments) {
      setAssignments(JSON.parse(savedAssignments));
    }

    // Load availability slots
    const allAvailability = localStorage.getItem('all_availability_slots');
    if (allAvailability) {
      setAvailabilitySlots(JSON.parse(allAvailability));
    }
     const savedScheduledVisits = localStorage.getItem('scheduledVisits');
  if (savedScheduledVisits) {
    setScheduledVisits(JSON.parse(savedScheduledVisits));
  }
  };

  const loadApplications = () => {
    const apps = mockAccreditationService.getApplications();
    setApplications(apps);
  };

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'step9_completed': 'bg-green-100 text-green-800',
      'step8_payment_uploaded': 'bg-blue-100 text-blue-800',
      'step7_payment_pending': 'bg-yellow-100 text-yellow-800',
    };
    
    const statusLabels: Record<string, string> = {
      'step9_completed': 'Ready for Site Visit',
      'step8_payment_uploaded': 'Payment Uploaded',
      'step7_payment_pending': 'Payment Pending',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

const updateVisitApplications = () => {
  // This will be called when an applicant accepts a schedule
  // The visitApplications filter already checks for 'completed' and 'in_progress'
  // We just need to make sure applications with 'accepted' status are shown in the visit tab
  
  // Refresh applications to get latest data
  loadApplications();
};

const handleSendSchedule = (scheduledVisit: ScheduledVisit) => {
  // Update the application in mockAccreditationService
  const app = applications.find(a => a.id === scheduledVisit.applicationId);
  if (!app) return;

  const updatedApp = {
    ...app,
    siteVisitSchedule: {
      scheduledDate: scheduledVisit.scheduledDate,
      scheduledTime: scheduledVisit.scheduledTime,
      venue: scheduledVisit.venue,
      assessorName: scheduledVisit.assignedToName,
      status: 'pending_acceptance' as const,
    },
    scheduleSent: true,
    scheduleStatus: 'pending_acceptance' as const,
  };

  // Update in mock service
  mockAccreditationService.updateApplication(scheduledVisit.applicationId, updatedApp);

  // Update scheduled visit status
  const updatedScheduledVisits = scheduledVisits.map(sv => 
    sv.id === scheduledVisit.id 
      ? { ...sv, status: 'sent_to_applicant' as const, notified: true }
      : sv
  );

  // Update assignments
  const updatedAssignments = assignments.map(a => 
    a.applicationId === scheduledVisit.applicationId
      ? { ...a, status: 'pending' as const }
      : a
  );

  setApplications(prev => prev.map(a => a.id === scheduledVisit.applicationId ? updatedApp : a));
  setScheduledVisits(updatedScheduledVisits);
  setAssignments(updatedAssignments);
  
  localStorage.setItem('scheduledVisits', JSON.stringify(updatedScheduledVisits));
  localStorage.setItem('assignments', JSON.stringify(updatedAssignments));
  
  alert('Schedule sent to applicant successfully! They will need to accept it.');
  setShowSendScheduleModal(false);
  setSelectedScheduledVisit(null);
};



  // Handle file drag and drop for desktop report
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!selectedApplication) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const newReport: DesktopReport = {
        id: `report-${Date.now()}`,
        applicationId: selectedApplication.id,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        uploadedBy: userName,
        notes: reportNotes,
      };
      
      const updatedReports = [...desktopReports, newReport];
      setDesktopReports(updatedReports);
      localStorage.setItem('desktopReports', JSON.stringify(updatedReports));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedApplication) return;
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const newReport: DesktopReport = {
        id: `report-${Date.now()}`,
        applicationId: selectedApplication.id,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        uploadedBy: userName,
        notes: reportNotes,
      };
      
      const updatedReports = [...desktopReports, newReport];
      setDesktopReports(updatedReports);
      localStorage.setItem('desktopReports', JSON.stringify(updatedReports));
    }
  };

  const handleSaveReport = () => {
    alert('Desktop report saved successfully!');
    setModalActiveTab('preparation');
  };

  // Category Allocation functions (Assistant Director - only categorizes)
  const toggleApplicationSelection = (applicationId: string) => {
    const newSelected = new Set(selectedApplications);
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    setSelectedApplications(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedApplications.size === filteredPreparationApps.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredPreparationApps.map(app => app.id)));
    }
  };

  const handleCategorize = () => {
    if (selectedApplications.size === 0) return;
    
    const newCategories: CategoryAllocation[] = [];
    
    selectedApplications.forEach(appId => {
      // Check if already categorized
      const existing = categoryAllocations.find(c => c.applicationId === appId);
      if (!existing) {
        newCategories.push({
          id: `cat-${Date.now()}-${appId}`,
          applicationId: appId,
          category: categoryType,
          categorizedAt: new Date().toISOString(),
          categorizedBy: userName,
        });
      }
    });
    
    const updatedCategories = [...categoryAllocations, ...newCategories];
    setCategoryAllocations(updatedCategories);
    localStorage.setItem('categoryAllocations', JSON.stringify(updatedCategories));
    
    setShowCategoryModal(false);
    setSelectedApplications(new Set());
    
    alert(`${newCategories.length} application(s) categorized as ${categoryType === 'quality_partner' ? 'Quality Partner' : 'Verifier'} successfully!`);
  };

  // Assignment functions (Deputy Director - assigns to specific people)
  const handleAssigneeChange = (appId: string, assigneeId: string) => {
    setAssignmentSelections(prev => ({
      ...prev,
      [appId]: { ...prev[appId], assigneeId }
    }));
  };

  const handleDateChange = (appId: string, date: string) => {
    setAssignmentSelections(prev => ({
      ...prev,
      [appId]: { ...prev[appId], date }
    }));
  };

  const handleTimeChange = (appId: string, time: string) => {
    setAssignmentSelections(prev => ({
      ...prev,
      [appId]: { ...prev[appId], time }
    }));
  };

const handleAssign = (app: ApplicationStatus, category: 'quality_partner' | 'verifier') => {
  const selection = assignmentSelections[app.id];
  if (!selection?.assigneeId || !selection?.date || !selection?.time) return;

  const assignee = category === 'quality_partner' 
    ? qualityPartners.find(qp => qp.id === selection.assigneeId)
    : verifiers.find(v => v.id === selection.assigneeId);

  if (!assignee) return;

  const assignmentId = `assign-${Date.now()}-${app.id}`;

  // Create assignment record with correct Assignment interface fields
  const newAssignment: Assignment = {
    id: assignmentId,
    applicationId: app.id,
    category: category,  // Use 'category' not 'allocatedTo'
    assignedToName: assignee.name,  // Use 'assignedToName' not 'allocatedToName'
    assignedToId: assignee.id,      // Use 'assignedToId' not 'allocatedToId'
    assignedAt: new Date().toISOString(),
    assignedBy: userName,
    status: 'pending',
  };

  // Create site visit allocation for backward compatibility
  const newSiteVisitAllocation: SiteVisitAllocation = {
    id: assignmentId,
    applicationId: app.id,
    allocatedTo: category,
    allocatedToName: assignee.name,
    allocatedToId: assignee.id,
    allocatedAt: new Date().toISOString(),
    allocatedBy: userName,
    status: 'pending',
  };

  // Create scheduled visit with proper typing
  const newScheduledVisit: ScheduledVisit = {
    id: `sched-${Date.now()}-${app.id}`,
    applicationId: app.id,
    assignedToId: assignee.id,
    assignedToName: assignee.name,
    assignedToRole: category === 'quality_partner' ? 'qp' : 'verifier',
    scheduledDate: selection.date,
    scheduledTime: selection.time,
    venue: app.applicationData?.applicantInfo.trainingLocation || '',
    status: 'pending_confirmation',
    createdAt: new Date().toISOString(),
    createdBy: userName,
    notified: false,
  };

  // Update assignments state (using Assignment type)
  const updatedAssignments = [...assignments, newAssignment];
  setAssignments(updatedAssignments);
  localStorage.setItem('assignments', JSON.stringify(updatedAssignments));

  // Update scheduled visits
  const updatedScheduledVisits = [...scheduledVisits, newScheduledVisit];
  setScheduledVisits(updatedScheduledVisits);
  localStorage.setItem('scheduledVisits', JSON.stringify(updatedScheduledVisits));

  // Update siteVisitAllocations for backward compatibility (using SiteVisitAllocation type)
  const siteVisitAllocations = JSON.parse(localStorage.getItem('siteVisitAllocations') || '[]');
  const updatedSiteVisitAllocations = [...siteVisitAllocations, newSiteVisitAllocation];
  localStorage.setItem('siteVisitAllocations', JSON.stringify(updatedSiteVisitAllocations));

  // Mark the slot as booked
  markSlotsAsBooked(assignee.name, category === 'quality_partner' ? 'qp' : 'verifier', selection.date, selection.time);

  // Clear the assignment form
  const newSelections = { ...assignmentSelections };
  delete newSelections[app.id];
  setAssignmentSelections(newSelections);

  alert(`Application scheduled with ${assignee.name} and is pending confirmation.`);
};

  // Get desktop reports for an application
  const getDesktopReportsForApplication = (applicationId: string) => {
    return desktopReports.filter(r => r.applicationId === applicationId);
  };

  // Filter applications for Preparation tab (payment verified and ready for site visit)
  const preparationApplications = applications.filter(app => 
    app.status === 'step9_completed' && app.paymentStatus === 'verified'
  );

  // Get categorized applications (excluding those already assigned)
const pendingScheduledVisits = scheduledVisits.filter(sv => 
  sv.status === 'pending_confirmation' && !sv.notified
);

const confirmedScheduledVisits = scheduledVisits.filter(sv => 
  sv.status === 'accepted' // Keep this as is - these are for the confirmed section
);



  const filteredPreparationApps = preparationApplications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationData?.applicantInfo.organisationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationData?.qualification.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = regionFilter === 'all' || app.applicationData?.applicantInfo.region === regionFilter;
    
    return matchesSearch && matchesRegion;
  });

  // Applications for Visit tab (site visit completed or in progress)
 

// Get categorized applications - EXCLUDE those with accepted status
const categorizedQpApplications = applications.filter(app => {
  const category = categoryAllocations.find(c => c.applicationId === app.id && c.category === 'quality_partner');
  // Only include if categorized AND not accepted
  return category && app.siteVisitSchedule?.status !== 'accepted';
});

const categorizedVerifierApplications = applications.filter(app => {
  const category = categoryAllocations.find(c => c.applicationId === app.id && c.category === 'verifier');
  // Only include if categorized AND not accepted
  return category && app.siteVisitSchedule?.status !== 'accepted';
});

// Get assigned applications - EXCLUDE those with accepted status
const assignedQpApplications = applications.filter(app => {
  const isAssigned = assignments.some(a => a.applicationId === app.id && a.category === 'quality_partner');
  // Only include if assigned AND not accepted
  return isAssigned && app.siteVisitSchedule?.status !== 'accepted';
});

const assignedVerifierApplications = applications.filter(app => {
  const isAssigned = assignments.some(a => a.applicationId === app.id && a.category === 'verifier');
  // Only include if assigned AND not accepted
  return isAssigned && app.siteVisitSchedule?.status !== 'accepted';
});

// Applications for Visit tab - include accepted, in_progress, and completed
const visitApplications = applications.filter(app => 
  app.siteVisitSchedule && 
  (app.siteVisitSchedule.status === 'accepted' || 
   app.siteVisitSchedule.status === 'in_progress' || 
   app.siteVisitSchedule.status === 'completed')
);
  // Compute categorized data for scheduling
  const qpCategorizedWithDetails = categorizedQpApplications.map(app => {
    const category = categoryAllocations.find(c => c.applicationId === app.id);
    const reports = getDesktopReportsForApplication(app.id);
    const qpAvailability = availabilitySlots.filter(s => 
      s.userRole === 'qp' && s.status === 'available'
    );
    
    return {
      ...app,
      category,
      desktopReports: reports,
      availableQps: qpAvailability
    };
  });

  const verifierCategorizedWithDetails = categorizedVerifierApplications.map(app => {
    const category = categoryAllocations.find(c => c.applicationId === app.id);
    const reports = getDesktopReportsForApplication(app.id);
    const verifierAvailability = availabilitySlots.filter(s => 
      s.userRole === 'verifier' && s.status === 'available'
    );
    
    return {
      ...app,
      category,
      desktopReports: reports,
      availableVerifiers: verifierAvailability
    };
  });

  const assignedQpWithDetails = assignedQpApplications.map(app => {
    const assignment = assignments.find(a => a.applicationId === app.id);
    const reports = getDesktopReportsForApplication(app.id);
    
    return {
      ...app,
      assignment,
      desktopReports: reports
    };
  });

  const assignedVerifierWithDetails = assignedVerifierApplications.map(app => {
    const assignment = assignments.find(a => a.applicationId === app.id);
    const reports = getDesktopReportsForApplication(app.id);
    
    return {
      ...app,
      assignment,
      desktopReports: reports
    };
  });

  const regions = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape'];

  // Modal render functions (keep existing ones)
  const renderDetailsTab = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Applicant Information</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Full Name</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.applicantInfo.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ID Number</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.applicantInfo.idNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.applicantInfo.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.applicantInfo.phone}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Organisation Information</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Organisation</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.applicantInfo.organisationName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Company</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.applicantInfo.companyName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Registration</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.applicantInfo.companyRegistration || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Region</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.applicantInfo.region}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Training Location</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.applicantInfo.trainingLocation}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Application Details</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Qualification</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.qualification}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Type</p>
            <p className="text-sm font-medium">{selectedApplication?.applicationData?.applicationType}</p>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <DollarSign className="w-4 h-4 mr-1 text-green-600" />
          Payment Information
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Payment Status</p>
            <p className="text-sm font-medium">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                selectedApplication?.paymentStatus === 'verified' ? 'bg-green-100 text-green-800' :
                selectedApplication?.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {selectedApplication?.paymentStatus}
              </span>
            </p>
          </div>
          {selectedApplication?.paymentDate && (
            <div>
              <p className="text-xs text-gray-500">Payment Date</p>
              <p className="text-sm font-medium">{new Date(selectedApplication.paymentDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Payment Notification */}
        {selectedApplication?.paymentNotification && (
          <div className="bg-white p-3 rounded border border-gray-200 mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Payment Notification</p>
            <p className="text-xs text-gray-600">Amount: R{selectedApplication.paymentNotification.amount}</p>
            <p className="text-xs text-gray-600">Due Date: {new Date(selectedApplication.paymentNotification.dueDate).toLocaleDateString()}</p>
            <p className="text-xs text-gray-600">Reference: {selectedApplication.paymentNotification.paymentReference}</p>
          </div>
        )}

        {/* Proof of Payment */}
        {selectedApplication?.proofOfPayment && selectedApplication.proofOfPayment.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Proof of Payment</p>
            {selectedApplication.proofOfPayment.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 mb-2">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">{doc.name}</span>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploaded Documents */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Application Documents</h4>
        <div className="space-y-2">
          {selectedApplication?.applicationData?.documents && selectedApplication.applicationData.documents.length > 0 ? (
            selectedApplication.applicationData.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">{doc.name}</span>
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View
                </a>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No documents uploaded</p>
          )}
        </div>
      </div>

      {/* Desktop Report for this application */}
      {desktopReports.filter(r => r.applicationId === selectedApplication?.id).length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Desktop Report</h4>
          {desktopReports
            .filter(r => r.applicationId === selectedApplication?.id)
            .map(report => (
              <div key={report.id} className="bg-white p-2 rounded border border-blue-200 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">{report.fileName}</span>
                  </div>
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </a>
                </div>
                {report.notes && (
                  <p className="text-xs text-gray-600 mt-1">{report.notes}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Uploaded by {report.uploadedBy} on {new Date(report.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Acknowledgement Letter */}
      {selectedApplication?.acknowledgementLetter && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Acknowledgement Letter</h4>
          <a
            href={selectedApplication.acknowledgementLetter.letterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Acknowledgement Letter
          </a>
        </div>
      )}

      {/* Outcome Letter */}
      {selectedApplication?.outcomeLetter && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Outcome Letter</h4>
          <a
            href={selectedApplication.outcomeLetter.letterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FileText className="w-4 h-4 mr-2" />
            View Outcome Letter
          </a>
        </div>
      )}
    </div>
  );

  const renderAIReportTab = () => {
    const aiReport = selectedApplication?.finalReview?.aiRecommendation;
    
    return (
      <div className="space-y-4">
        {!aiReport ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <Zap className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No AI report available</p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="text-sm font-semibold text-gray-800">AI Recommendation</h4>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(aiReport.generatedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-white p-2 rounded">
                <p className="text-xs text-gray-500">Score</p>
                <p className="text-lg font-bold text-blue-600">{aiReport.overallScore}%</p>
              </div>
              <div className="bg-white p-2 rounded">
                <p className="text-xs text-gray-500">Risk</p>
                <p className={`text-lg font-bold ${
                  aiReport.riskLevel === 'low' ? 'text-green-600' :
                  aiReport.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {aiReport.riskLevel}
                </p>
              </div>
              <div className="bg-white p-2 rounded">
                <p className="text-xs text-gray-500">Action</p>
                <p className={`text-lg font-bold ${
                  aiReport.recommendedAction === 'approve' ? 'text-green-600' :
                  aiReport.recommendedAction === 'reject' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {aiReport.recommendedAction}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{aiReport.summary}</p>

            <h5 className="text-xs font-medium text-gray-700 mb-2">Document Findings</h5>
            <div className="space-y-2">
              {aiReport.documentFindings.map((finding, idx) => (
                <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">{finding.fileName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      finding.status === 'valid' ? 'bg-green-100 text-green-700' :
                      finding.status === 'invalid' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {finding.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Confidence: {finding.confidence}%</p>
                  {finding.issues && finding.issues.length > 0 && (
                    <ul className="mt-1 text-xs text-red-600 list-disc list-inside">
                      {finding.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHistoryTab = () => (
    <div className="space-y-4">
      {!selectedApplication?.evaluationHistory || selectedApplication.evaluationHistory.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No history available</p>
        </div>
      ) : (
        selectedApplication.evaluationHistory.map((entry, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  entry.stage === 'initial' ? 'bg-blue-100 text-blue-800' : 
                  entry.stage === 'final' ? 'bg-purple-100 text-purple-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {entry.stage === 'initial' ? 'Initial Review' : 
                   entry.stage === 'final' ? 'Final Review' : 'AI Evaluation'}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {entry.reviewedBy} • {new Date(entry.reviewedAt).toLocaleString()}
                </p>
              </div>
              {entry.stage !== 'ai-evaluation' && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  entry.decision === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {entry.decision}
                </span>
              )}
            </div>
            
            {/* Checklist Results */}
            {entry.checklist && entry.checklist.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-700 mb-2">Checklist Results:</h5>
                <div className="space-y-2">
                  {entry.checklist.map((item) => (
                    <div key={item.criteriaId} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                      <span className="text-xs text-gray-600">{item.criteriaName}</span>
                      {item.isMet ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            {entry.comments && (
              <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                <p className="text-xs text-gray-600">{entry.comments}</p>
              </div>
            )}

            {/* AI Recommendation in History (for final reviews) */}
            {entry.aiRecommendation && (
              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs font-medium text-blue-700 mb-1">AI Recommendation:</p>
                <p className="text-xs text-gray-600">{entry.aiRecommendation.summary}</p>
                <div className="mt-1 flex space-x-3 text-xs">
                  <span className="text-gray-500">Score: {entry.aiRecommendation.overallScore}%</span>
                  <span className={`px-2 py-0.5 rounded ${
                    entry.aiRecommendation.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                    entry.aiRecommendation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    Risk: {entry.aiRecommendation.riskLevel}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderPreparationTab = () => {
    // Get categories for current application
    const appCategory = categoryAllocations.find(c => c.applicationId === selectedApplication?.id);
    const isAssigned = assignments.some(a => a.applicationId === selectedApplication?.id);
    
    // Get desktop report for current application
    const appDesktopReports = desktopReports.filter(r => r.applicationId === selectedApplication?.id);

    return (
      <div className="space-y-6">
        {/* Desktop Report Upload */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Desktop Report</h4>
          
          {appDesktopReports.length === 0 ? (
            <>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center mb-3 ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  Drag and drop your desktop report, or{' '}
                  <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                    browse
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500">PDF, DOC up to 10MB</p>
              </div>

              <textarea
                rows={3}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Add notes about the desktop review..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          ) : (
            appDesktopReports.map(report => (
              <div key={report.id} className="bg-white p-3 rounded border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-green-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium">{report.fileName}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded {new Date(report.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={report.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </a>
                </div>
                {report.notes && (
                  <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                    {report.notes}
                  </p>
                )}
              </div>
            ))
          )}

          {appDesktopReports.length === 0 && (
            <button
              onClick={handleSaveReport}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Save Report
            </button>
          )}
        </div>

        {/* Category Information */}
        {appCategory && !isAssigned && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Category</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {appCategory.category === 'quality_partner' ? (
                  <Shield className="w-5 h-5 text-blue-600 mr-2" />
                ) : (
                  <Users className="w-5 h-5 text-purple-600 mr-2" />
                )}
                <span className="text-sm font-medium">
                  Categorized as: {appCategory.category === 'quality_partner' ? 'Quality Partner' : 'Verifier'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Categorized on {new Date(appCategory.categorizedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {isAssigned && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Assignment Status</h4>
            <p className="text-sm text-gray-600">
              This application has been assigned and scheduled in the Scheduling tab.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setSelectedApplication(null);
              setModalActiveTab('details');
              setReportNotes('');
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          {!appCategory && !isAssigned && (
            <button
              onClick={() => {
                setActiveSubTab('scheduling');
                setSelectedApplication(null);
                setModalActiveTab('details');
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Ready for Scheduling
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPreparationTabList = () => (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Applications Ready for Site Visit</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setCategoryType('quality_partner');
              setShowCategoryModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Shield className="w-4 h-4 mr-2" />
            Categorize as Quality Partner
          </button>
          <button
            onClick={() => {
              setCategoryType('verifier');
              setShowCategoryModal(true);
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
          >
            <Users className="w-4 h-4 mr-2" />
            Categorize as Verifier
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end items-center space-x-4">
            <span className="text-sm text-gray-600">
              {filteredPreparationApps.length} applications ready
            </span>
            {selectedApplications.size > 0 && (
              <span className="text-sm font-medium text-blue-600">
                {selectedApplications.size} selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Applications List with Selection Checkboxes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <button
                  onClick={toggleSelectAll}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {selectedApplications.size === filteredPreparationApps.length ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desktop Report</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPreparationApps.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  No applications ready for site visit preparation.
                </td>
              </tr>
            ) : (
              filteredPreparationApps.map((app) => {
                const hasDesktopReport = desktopReports.filter(r => r.applicationId === app.id).length > 0;
                const category = categoryAllocations.find(c => c.applicationId === app.id);
                const isAssigned = assignments.some(a => a.applicationId === app.id);
                
                return (
                  <React.Fragment key={app.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!category && !isAssigned ? (
                          <button
                            onClick={() => toggleApplicationSelection(app.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {selectedApplications.has(app.id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-300">
                            <Square className="w-5 h-5" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app.applicationId}</div>
                        <div className="text-xs text-gray-500">{app.applicationData?.applicationType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{app.applicationData?.applicantInfo.organisationName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{app.applicationData?.qualification}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.applicationData?.applicantInfo.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isAssigned ? (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            Assigned
                          </span>
                        ) : category ? (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            category.category === 'quality_partner' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {category.category === 'quality_partner' ? 'QP' : 'Verifier'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Not categorized</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasDesktopReport ? (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            ✓ Uploaded
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleRowExpand(app.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          {expandedRows.has(app.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApplication(app);
                            setModalActiveTab('details');
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(app.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Contact Information</h4>
                              <div className="space-y-2 text-sm">
                                <p className="flex items-center text-gray-600">
                                  <User className="w-4 h-4 mr-2" />
                                  {app.applicationData?.applicantInfo.fullName}
                                </p>
                                <p className="flex items-center text-gray-600">
                                  <Mail className="w-4 h-4 mr-2" />
                                  {app.applicationData?.applicantInfo.email}
                                </p>
                                <p className="flex items-center text-gray-600">
                                  <Phone className="w-4 h-4 mr-2" />
                                  {app.applicationData?.applicantInfo.phone}
                                </p>
                              </div>
                              
                              <h4 className="text-sm font-semibold text-gray-900 mt-4 mb-2">Training Location</h4>
                              <div className="space-y-2 text-sm">
                                <p className="flex items-center text-gray-600">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  {app.applicationData?.applicantInfo.trainingLocation}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Documents</h4>
                              <div className="space-y-2">
                                {app.applicationData?.documents && app.applicationData.documents.length > 0 ? (
                                  app.applicationData.documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                      <div className="flex items-center">
                                        <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                        <span className="text-sm text-gray-600">{doc.name}</span>
                                      </div>
                                      <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                      >
                                        View
                                      </a>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-500">No documents available</p>
                                )}
                              </div>

                              {app.finalReview?.aiRecommendation && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Recommendation</h4>
                                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                    <p className="text-sm text-gray-700">{app.finalReview.aiRecommendation.summary}</p>
                                    <div className="mt-2 flex items-center space-x-4 text-xs">
                                      <span className="text-gray-600">Score: {app.finalReview.aiRecommendation.overallScore}%</span>
                                      <span className={`px-2 py-1 rounded ${
                                        app.finalReview.aiRecommendation.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                                        app.finalReview.aiRecommendation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        Risk: {app.finalReview.aiRecommendation.riskLevel}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Desktop Report Details */}
                              {desktopReports.filter(r => r.applicationId === app.id).length > 0 && (
                                <div className="mt-4">
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Desktop Report</h4>
                                  {desktopReports
                                    .filter(r => r.applicationId === app.id)
                                    .map(report => (
                                      <div key={report.id} className="bg-green-50 p-2 rounded border border-green-200">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium">{report.fileName}</span>
                                          <a
                                            href={report.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-xs"
                                          >
                                            View
                                          </a>
                                        </div>
                                        {report.notes && (
                                          <p className="text-xs text-gray-600 mt-1">{report.notes}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                          Uploaded by {report.uploadedBy}
                                        </p>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Category Modal - No user selection, just category */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Categorize as {categoryType === 'quality_partner' ? 'Quality Partner' : 'Verifier'}
              </h3>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                {selectedApplications.size} application(s) selected
              </p>
              
              <p className="text-sm text-gray-700 mb-4">
                These applications will be moved to the Scheduling tab as{" "}
                <span className="font-semibold">
                  {categoryType === 'quality_partner' ? 'Quality Partner' : 'Verifier'}
                </span>{" "}
                category for assignment.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCategorize}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Categorize {selectedApplications.size} Application(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

const renderSchedulingTab = () => {
  // Use the detailed versions that include desktop reports and availability
  const qpAppsWithDetails = qpCategorizedWithDetails;
  const verifierAppsWithDetails = verifierCategorizedWithDetails;
  
  // Filter applications that have been assigned but not yet confirmed
  const assignedButNotConfirmed = applications.filter(app => {
    const hasScheduledVisit = scheduledVisits.some(sv => 
      sv.applicationId === app.id && sv.status === 'pending_confirmation'
    );
    return hasScheduledVisit;
  });

  return (
    <div className="space-y-8">
      {/* Quality Partners Queue */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Quality Partner Queue
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {qpAppsWithDetails.length} application(s) awaiting QP assignment
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {qpAppsWithDetails.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No applications in QP queue</p>
            </div>
          ) : (
            <div className="space-y-4">
              {qpAppsWithDetails.map(app => {
                const availableQps = qualityPartners.map(qp => ({
                  ...qp,
                  slots: availabilitySlots.filter(s => 
                    s.userName === qp.name && 
                    s.userRole === 'qp' && 
                    s.status === 'available'
                  )
                })).filter(qp => qp.slots.length > 0);

                // Check if this app already has a scheduled visit
                const existingSchedule = scheduledVisits.find(sv => sv.applicationId === app.id);

                return (
                  <div key={app.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Application Header */}
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">{app.applicationId}</h4>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              QP
                            </span>
                            {existingSchedule && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                existingSchedule.status === 'accepted' 
                                  ? 'bg-green-100 text-green-800'
                                  : existingSchedule.status === 'sent_to_applicant'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : existingSchedule.status === 'pending_confirmation'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {existingSchedule.status === 'accepted' ? 'Accepted' :
                                 existingSchedule.status === 'sent_to_applicant' ? 'Sent' :
                                 existingSchedule.status === 'pending_confirmation' ? 'Pending' : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{app.applicationData?.applicantInfo.organisationName}</p>
                          <p className="text-sm text-gray-600 mt-1">{app.applicationData?.qualification}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            {app.applicationData?.applicantInfo.trainingLocation}
                          </div>
                          
                          {/* Show existing schedule if any */}
                          {existingSchedule && (
                            <div className="mt-2 text-xs text-gray-600">
                              <span className="font-medium">Scheduled:</span> {existingSchedule.scheduledDate} at {existingSchedule.scheduledTime} with {existingSchedule.assignedToName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop Reports - using the pre-computed desktopReports from qpCategorizedWithDetails */}
                      {app.desktopReports && app.desktopReports.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">Desktop Reports:</p>
                          <div className="space-y-2">
                            {app.desktopReports.map((report: DesktopReport) => (
                              <div key={report.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 text-blue-500 mr-2" />
                                  <span className="text-sm text-gray-600">{report.fileName}</span>
                                </div>
                                <a
                                  href={report.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  View
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assignment Form - Only show if no schedule exists or schedule is pending */}
                    {(!existingSchedule || existingSchedule.status === 'pending_confirmation') && (
                      <div className="p-4 bg-white">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Assign to Quality Partner</h5>
                        
                        {availableQps.length === 0 ? (
                          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
                            No Quality Partners with available schedules at the moment.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* QP Selection */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Select Quality Partner
                              </label>
                              <select
                                value={assignmentSelections[app.id]?.assigneeId || ''}
                                onChange={(e) => handleAssigneeChange(app.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!!existingSchedule}
                              >
                                <option value="">Choose a Quality Partner...</option>
                                {availableQps.map(qp => (
                                  <option key={qp.id} value={qp.id}>
                                    {qp.name} ({qp.slots.length} available slots)
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Show available slots for selected QP */}
                            {assignmentSelections[app.id]?.assigneeId && (
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs font-medium text-blue-700 mb-2">Available Slots:</p>
                                <div className="flex flex-wrap gap-2">
                                  {availableQps
                                    .find(qp => qp.id === assignmentSelections[app.id].assigneeId)
                                    ?.slots.map(slot => (
                                      <button
                                        key={slot.id}
                                        onClick={() => {
                                          handleDateChange(app.id, slot.date);
                                          handleTimeChange(app.id, `${slot.startTime}-${slot.endTime}`);
                                        }}
                                        disabled={!!existingSchedule}
                                        className={`px-3 py-1 text-xs rounded-full ${
                                          assignmentSelections[app.id]?.date === slot.date && 
                                          assignmentSelections[app.id]?.time === `${slot.startTime}-${slot.endTime}`
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                                        } ${existingSchedule ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        {new Date(slot.date).toLocaleDateString()} {slot.startTime}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Date/Time inputs as fallback */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  value={assignmentSelections[app.id]?.date || ''}
                                  onChange={(e) => handleDateChange(app.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  min={new Date().toISOString().split('T')[0]}
                                  disabled={!!existingSchedule}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Time
                                </label>
                                <input
                                  type="time"
                                  value={assignmentSelections[app.id]?.time || ''}
                                  onChange={(e) => handleTimeChange(app.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  disabled={!!existingSchedule}
                                />
                              </div>
                            </div>

                            {/* Assign Button */}
                            {assignmentSelections[app.id]?.assigneeId && assignmentSelections[app.id]?.date && assignmentSelections[app.id]?.time && !existingSchedule && (
                              <button
                                onClick={() => handleAssign(app, 'quality_partner')}
                                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                              >
                                Assign & Schedule Visit
                              </button>
                            )}
                            
                            {existingSchedule && existingSchedule.status === 'pending_confirmation' && (
                              <p className="text-xs text-yellow-600 mt-2">
                                ⏳ Waiting for Assistant Director to send schedule to applicant
                              </p>
                            )}
                          </div>
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

      {/* Verifiers Queue */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-purple-50 border-b border-purple-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Verifier Queue
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {verifierAppsWithDetails.length} application(s) awaiting Verifier assignment
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {verifierAppsWithDetails.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No applications in Verifier queue</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifierAppsWithDetails.map(app => {
                const availableVerifiers = verifiers.map(ver => ({
                  ...ver,
                  slots: availabilitySlots.filter(s => 
                    s.userName === ver.name && 
                    s.userRole === 'verifier' && 
                    s.status === 'available'
                  )
                })).filter(ver => ver.slots.length > 0);

                // Check if this app already has a scheduled visit
                const existingSchedule = scheduledVisits.find(sv => sv.applicationId === app.id);

                return (
                  <div key={app.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Application Header */}
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium text-gray-900">{app.applicationId}</h4>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                              Verifier
                            </span>
                            {existingSchedule && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                existingSchedule.status === 'accepted' 
                                  ? 'bg-green-100 text-green-800'
                                  : existingSchedule.status === 'sent_to_applicant'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : existingSchedule.status === 'pending_confirmation'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {existingSchedule.status === 'accepted' ? 'Accepted' :
                                 existingSchedule.status === 'sent_to_applicant' ? 'Sent' :
                                 existingSchedule.status === 'pending_confirmation' ? 'Pending' : ''}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{app.applicationData?.applicantInfo.organisationName}</p>
                          <p className="text-sm text-gray-600 mt-1">{app.applicationData?.qualification}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            {app.applicationData?.applicantInfo.trainingLocation}
                          </div>
                          
                          {/* Show existing schedule if any */}
                          {existingSchedule && (
                            <div className="mt-2 text-xs text-gray-600">
                              <span className="font-medium">Scheduled:</span> {existingSchedule.scheduledDate} at {existingSchedule.scheduledTime} with {existingSchedule.assignedToName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop Reports - using the pre-computed desktopReports from verifierCategorizedWithDetails */}
                      {app.desktopReports && app.desktopReports.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">Desktop Reports:</p>
                          <div className="space-y-2">
                            {app.desktopReports.map((report: DesktopReport) => (
                              <div key={report.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 text-purple-500 mr-2" />
                                  <span className="text-sm text-gray-600">{report.fileName}</span>
                                </div>
                                <a
                                  href={report.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:text-purple-800 text-sm"
                                >
                                  View
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assignment Form - Only show if no schedule exists or schedule is pending */}
                    {(!existingSchedule || existingSchedule.status === 'pending_confirmation') && (
                      <div className="p-4 bg-white">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Assign to Verifier</h5>
                        
                        {availableVerifiers.length === 0 ? (
                          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
                            No Verifiers with available schedules at the moment.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Verifier Selection */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Select Verifier
                              </label>
                              <select
                                value={assignmentSelections[app.id]?.assigneeId || ''}
                                onChange={(e) => handleAssigneeChange(app.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                disabled={!!existingSchedule}
                              >
                                <option value="">Choose a Verifier...</option>
                                {availableVerifiers.map(ver => (
                                  <option key={ver.id} value={ver.id}>
                                    {ver.name} ({ver.slots.length} available slots)
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Show available slots for selected Verifier */}
                            {assignmentSelections[app.id]?.assigneeId && (
                              <div className="bg-purple-50 p-3 rounded-lg">
                                <p className="text-xs font-medium text-purple-700 mb-2">Available Slots:</p>
                                <div className="flex flex-wrap gap-2">
                                  {availableVerifiers
                                    .find(ver => ver.id === assignmentSelections[app.id].assigneeId)
                                    ?.slots.map(slot => (
                                      <button
                                        key={slot.id}
                                        onClick={() => {
                                          handleDateChange(app.id, slot.date);
                                          handleTimeChange(app.id, `${slot.startTime}-${slot.endTime}`);
                                        }}
                                        disabled={!!existingSchedule}
                                        className={`px-3 py-1 text-xs rounded-full ${
                                          assignmentSelections[app.id]?.date === slot.date && 
                                          assignmentSelections[app.id]?.time === `${slot.startTime}-${slot.endTime}`
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
                                        } ${existingSchedule ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        {new Date(slot.date).toLocaleDateString()} {slot.startTime}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Date/Time inputs as fallback */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  value={assignmentSelections[app.id]?.date || ''}
                                  onChange={(e) => handleDateChange(app.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  min={new Date().toISOString().split('T')[0]}
                                  disabled={!!existingSchedule}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Time
                                </label>
                                <input
                                  type="time"
                                  value={assignmentSelections[app.id]?.time || ''}
                                  onChange={(e) => handleTimeChange(app.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  disabled={!!existingSchedule}
                                />
                              </div>
                            </div>

                            {/* Assign Button */}
                            {assignmentSelections[app.id]?.assigneeId && assignmentSelections[app.id]?.date && assignmentSelections[app.id]?.time && !existingSchedule && (
                              <button
                                onClick={() => handleAssign(app, 'verifier')}
                                className="w-full mt-3 px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                              >
                                Assign & Schedule Visit
                              </button>
                            )}
                            
                            {existingSchedule && existingSchedule.status === 'pending_confirmation' && (
                              <p className="text-xs text-yellow-600 mt-2">
                                ⏳ Waiting for Assistant Director to send schedule to applicant
                              </p>
                            )}
                          </div>
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

      {/* Pending Confirmations Section - Visible to Assistant Director */}
      {userRole === 'Assistant Director' && pendingScheduledVisits.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden">
          <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-amber-600" />
                  Pending Schedule Confirmations
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingScheduledVisits.length} application(s) ready to send to applicants
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {pendingScheduledVisits.map(sv => {
                const app = applications.find(a => a.id === sv.applicationId);
                if (!app) return null;
                
                return (
                  <div key={sv.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{app.applicationId}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            sv.assignedToRole === 'qp' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {sv.assignedToRole === 'qp' ? 'QP' : 'Verifier'}: {sv.assignedToName}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{app.applicationData?.applicantInfo.organisationName}</p>
                        <p className="text-sm text-gray-600 mt-1">{app.applicationData?.qualification}</p>
                        <div className="flex items-center mt-2 space-x-4 text-sm">
                          <span className="flex items-center text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            {sv.scheduledDate}
                          </span>
                          <span className="flex items-center text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            {sv.scheduledTime}
                          </span>
                          <span className="flex items-center text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            {sv.venue}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedScheduledVisit(sv);
                          setShowSendScheduleModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        Send Schedule to Applicant
                      </button>
                    </div>

                    {/* Desktop Reports */}
                    {desktopReports.filter(r => r.applicationId === app.id).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Desktop Reports:</p>
                        <div className="space-y-2">
                          {desktopReports
                            .filter(r => r.applicationId === app.id)
                            .map(report => (
                              <div key={report.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 text-blue-500 mr-2" />
                                  <span className="text-sm text-gray-600">{report.fileName}</span>
                                </div>
                                <a
                                  href={report.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  View
                                </a>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Site Visits Section */}
      {confirmedScheduledVisits.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Confirmed Site Visits
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {confirmedScheduledVisits.map(sv => {
                const app = applications.find(a => a.id === sv.applicationId);
                if (!app) return null;
                
                return (
                  <div key={sv.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{app.applicationId} - {app.applicationData?.applicantInfo.organisationName}</p>
                        <p className="text-xs text-gray-600 mt-1">{app.applicationData?.qualification}</p>
                        <div className="flex items-center mt-1 space-x-3 text-xs">
                          <span className="flex items-center text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {sv.scheduledDate}
                          </span>
                          <span className="flex items-center text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {sv.scheduledTime}
                          </span>
                          <span className="flex items-center text-gray-500">
                            <User className="w-3 h-3 mr-1" />
                            {sv.assignedToName}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        Confirmed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Send Schedule Modal */}
      {showSendScheduleModal && selectedScheduledVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Send Schedule</h3>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to send this site visit schedule to the applicant?
              </p>
              
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-700">Application: {selectedScheduledVisit.applicationId}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Scheduled: {selectedScheduledVisit.scheduledDate} at {selectedScheduledVisit.scheduledTime}
                </p>
                <p className="text-sm text-gray-600">
                  With: {selectedScheduledVisit.assignedToName}
                </p>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                The applicant will receive this schedule in their dashboard and will be notified of the site visit.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSendScheduleModal(false);
                    setSelectedScheduledVisit(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendSchedule(selectedScheduledVisit)}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  Send Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const renderVisitTab = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards for Visit Tab */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Site Visits</p>
          <p className="text-2xl font-bold text-gray-900">{visitApplications.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
          <p className="text-sm text-blue-600">Scheduled</p>
          <p className="text-2xl font-bold text-blue-600">
            {visitApplications.filter(a => a.siteVisitSchedule?.status === 'accepted').length}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-sm p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">
            {visitApplications.filter(a => a.siteVisitSchedule?.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
          <p className="text-sm text-green-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {visitApplications.filter(a => a.siteVisitSchedule?.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Site Visits Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Site Visit Schedule & History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visitApplications.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    No site visits scheduled or in progress.
                  </td>
                </tr>
              ) : (
                visitApplications.map((app) => {
                  const schedule = app.siteVisitSchedule;
                  if (!schedule) return null;

                  return (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app.applicationId}</div>
                        <div className="text-xs text-gray-500">{app.applicationData?.applicationType}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{app.applicationData?.applicantInfo.organisationName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{app.applicationData?.qualification}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{schedule.assessorName || 'Not assigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {new Date(schedule.scheduledDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          {schedule.scheduledTime}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{schedule.venue}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {schedule.status === 'accepted' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Scheduled
                          </span>
                        )}
                        {schedule.status === 'in_progress' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            In Progress
                          </span>
                        )}
                        {schedule.status === 'completed' && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {app.siteVisitReport ? (
                          <span className="text-xs text-green-600">✓ Generated</span>
                        ) : (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedVisitApp(app);
                            setShowVisitModal(true);
                            setVisitModalTab('details');
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Site Visit Details Modal */}
      {showVisitModal && selectedVisitApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Application Details: {selectedVisitApp.applicationId}</h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedVisitApp.applicationData?.applicantInfo.organisationName}</p>
                </div>
                <button
                  onClick={() => {
                    setShowVisitModal(false);
                    setSelectedVisitApp(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex space-x-4 mt-4 border-b border-gray-200">
                <button
                  onClick={() => setVisitModalTab('details')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    visitModalTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setVisitModalTab('ai-report')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    visitModalTab === 'ai-report' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  AI Report
                </button>
                <button
                  onClick={() => setVisitModalTab('history')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    visitModalTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  History
                </button>
                {selectedVisitApp.siteVisitReport && (
                  <button
                    onClick={() => setVisitModalTab('report')}
                    className={`pb-2 px-1 text-sm font-medium ${
                      visitModalTab === 'report' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                    }`}
                  >
                    Site Visit Report
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Details Tab */}
              {visitModalTab === 'details' && (
                <div className="space-y-6">
                  {/* Applicant Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Applicant Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.applicantInfo.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ID Number</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.applicantInfo.idNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.applicantInfo.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.applicantInfo.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Organisation Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Organisation Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Organisation Name</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.applicantInfo.organisationName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Company Name</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.applicantInfo.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Company Registration</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.applicantInfo.companyRegistration || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Region</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.applicantInfo.region}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Training Location</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.applicantInfo.trainingLocation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Qualification</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.qualification}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Application Type</p>
                        <p className="text-sm font-medium">{selectedVisitApp.applicationData?.applicationType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Payment Status</p>
                        <p className="text-sm font-medium">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            selectedVisitApp.paymentStatus === 'verified' ? 'bg-green-100 text-green-800' :
                            selectedVisitApp.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedVisitApp.paymentStatus}
                          </span>
                        </p>
                      </div>
                      {selectedVisitApp.paymentDate && (
                        <div>
                          <p className="text-sm text-gray-600">Payment Date</p>
                          <p className="text-sm font-medium">{new Date(selectedVisitApp.paymentDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {/* Payment Notification */}
                    {selectedVisitApp.paymentNotification && (
                      <div className="bg-white p-4 rounded border border-gray-200 mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Payment Notification</p>
                        <p className="text-sm text-gray-600">Amount: R{selectedVisitApp.paymentNotification.amount}</p>
                        <p className="text-sm text-gray-600">Due Date: {new Date(selectedVisitApp.paymentNotification.dueDate).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">Reference: {selectedVisitApp.paymentNotification.paymentReference}</p>
                      </div>
                    )}

                    {/* Proof of Payment */}
                    {selectedVisitApp.proofOfPayment && selectedVisitApp.proofOfPayment.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Proof of Payment</p>
                        {selectedVisitApp.proofOfPayment.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 mb-2">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 text-green-500 mr-2" />
                              <span className="text-sm text-gray-600">{doc.name}</span>
                            </div>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Site Visit Schedule */}
                  {selectedVisitApp.siteVisitSchedule && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Site Visit Schedule</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Date</p>
                          <p className="text-sm font-medium">{new Date(selectedVisitApp.siteVisitSchedule.scheduledDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Time</p>
                          <p className="text-sm font-medium">{selectedVisitApp.siteVisitSchedule.scheduledTime}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Venue</p>
                          <p className="text-sm font-medium">{selectedVisitApp.siteVisitSchedule.venue}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Assessor</p>
                          <p className="text-sm font-medium">{selectedVisitApp.siteVisitSchedule.assessorName || 'Not assigned'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Uploaded Documents */}
                  {selectedVisitApp.applicationData?.documents && selectedVisitApp.applicationData.documents.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Documents</h3>
                      <div className="space-y-2">
                        {selectedVisitApp.applicationData.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 text-gray-500 mr-2" />
                              <span className="text-sm text-gray-600">{doc.name}</span>
                            </div>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Desktop Report (from preparation) */}
                  {desktopReports.filter(r => r.applicationId === selectedVisitApp.id).length > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Desktop Report</h3>
                      {desktopReports
                        .filter(r => r.applicationId === selectedVisitApp.id)
                        .map(report => (
                          <div key={report.id} className="bg-white p-3 rounded border border-purple-200 mb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 text-purple-500 mr-2" />
                                <span className="text-sm text-gray-600">{report.fileName}</span>
                              </div>
                              <a
                                href={report.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:text-purple-800 text-sm"
                              >
                                View
                              </a>
                            </div>
                            {report.notes && (
                              <p className="text-xs text-gray-600 mt-1">{report.notes}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Uploaded by {report.uploadedBy} on {new Date(report.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Acknowledgement Letter */}
                  {selectedVisitApp.acknowledgementLetter && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Acknowledgement Letter</h3>
                      <a
                        href={selectedVisitApp.acknowledgementLetter.letterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        View Acknowledgement Letter
                      </a>
                    </div>
                  )}

                  {/* Outcome Letter */}
                  {selectedVisitApp.outcomeLetter && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Outcome Letter</h3>
                      <a
                        href={selectedVisitApp.outcomeLetter.letterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        View Outcome Letter
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* AI Report Tab */}
              {visitModalTab === 'ai-report' && (
                <div className="space-y-4">
                  {!selectedVisitApp.finalReview?.aiRecommendation ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No AI report available for this application.</p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <Zap className="w-6 h-6 text-blue-600 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-800">AI Recommendation Report</h3>
                        </div>
                        <span className="text-sm text-gray-500">
                          Generated: {new Date(selectedVisitApp.finalReview.aiRecommendation.generatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Overall Score</p>
                          <p className="text-2xl font-bold text-blue-600">{selectedVisitApp.finalReview.aiRecommendation.overallScore}%</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Risk Level</p>
                          <p className={`text-2xl font-bold ${
                            selectedVisitApp.finalReview.aiRecommendation.riskLevel === 'low' ? 'text-green-600' :
                            selectedVisitApp.finalReview.aiRecommendation.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedVisitApp.finalReview.aiRecommendation.riskLevel.toUpperCase()}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Recommended Action</p>
                          <p className={`text-2xl font-bold ${
                            selectedVisitApp.finalReview.aiRecommendation.recommendedAction === 'approve' ? 'text-green-600' :
                            selectedVisitApp.finalReview.aiRecommendation.recommendedAction === 'reject' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {selectedVisitApp.finalReview.aiRecommendation.recommendedAction.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg mb-4">
                        <p className="text-sm text-gray-700">{selectedVisitApp.finalReview.aiRecommendation.summary}</p>
                      </div>

                      <h4 className="font-medium text-gray-800 mb-3">Document Findings</h4>
                      <div className="space-y-3">
                        {selectedVisitApp.finalReview.aiRecommendation.documentFindings.map((finding, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                <span className="text-sm font-medium">{finding.fileName}</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${
                                finding.status === 'valid' ? 'bg-green-100 text-green-700' :
                                finding.status === 'invalid' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {finding.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">Confidence: {finding.confidence}%</p>
                            {finding.issues && finding.issues.length > 0 && (
                              <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
                                {finding.issues.map((issue, i) => (
                                  <li key={i}>{issue}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {visitModalTab === 'history' && (
                <div className="space-y-4">
                  {!selectedVisitApp.evaluationHistory || selectedVisitApp.evaluationHistory.length === 0 ? (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No evaluation history available.</p>
                    </div>
                  ) : (
                    selectedVisitApp.evaluationHistory.map((entry, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              entry.stage === 'initial' ? 'bg-blue-100 text-blue-800' : 
                              entry.stage === 'final' ? 'bg-purple-100 text-purple-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {entry.stage === 'initial' ? 'Initial Review' : 
                               entry.stage === 'final' ? 'Final Review' : 'AI Evaluation'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {entry.reviewedBy} • {new Date(entry.reviewedAt).toLocaleString()}
                            </p>
                          </div>
                          {entry.stage !== 'ai-evaluation' && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              entry.decision === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {entry.decision}
                            </span>
                          )}
                        </div>
                        
                        {/* Checklist Results */}
                        {entry.checklist && entry.checklist.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Checklist Results:</h5>
                            <div className="space-y-2">
                              {entry.checklist.map((item) => (
                                <div key={item.criteriaId} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                  <span className="text-xs text-gray-600">{item.criteriaName}</span>
                                  {item.isMet ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Comments */}
                        {entry.comments && (
                          <div className="mt-3 p-2 bg-white rounded border border-gray-200">
                            <p className="text-xs text-gray-600">{entry.comments}</p>
                          </div>
                        )}

                        {/* AI Recommendation in History (for final reviews) */}
                        {entry.aiRecommendation && (
                          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs font-medium text-blue-700 mb-1">AI Recommendation:</p>
                            <p className="text-xs text-gray-600">{entry.aiRecommendation.summary}</p>
                            <div className="mt-1 flex space-x-3 text-xs">
                              <span className="text-gray-500">Score: {entry.aiRecommendation.overallScore}%</span>
                              <span className={`px-2 py-0.5 rounded ${
                                entry.aiRecommendation.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                                entry.aiRecommendation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                Risk: {entry.aiRecommendation.riskLevel}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Site Visit Report Tab */}
              {visitModalTab === 'report' && selectedVisitApp.siteVisitReport && (
                <div className="space-y-6">
                  {/* Report Header */}
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-2">Site Visit Report</h3>
                    <p className="text-sm opacity-90">Conducted by: {selectedVisitApp.siteVisitReport.conductedBy}</p>
                    <p className="text-sm opacity-90">Date: {new Date(selectedVisitApp.siteVisitReport.conductedAt).toLocaleDateString()}</p>
                  </div>

                  {/* Key Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Outcome</p>
                      <p className={`text-lg font-semibold ${
                        selectedVisitApp.siteVisitReport.outcome === 'compliant' ? 'text-green-600' :
                        selectedVisitApp.siteVisitReport.outcome === 'partially_compliant' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {selectedVisitApp.siteVisitReport.outcome.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Conducted By</p>
                      <p className="text-lg font-semibold text-gray-800">{selectedVisitApp.siteVisitReport.conductedBy}</p>
                      <p className="text-xs text-gray-500">{selectedVisitApp.siteVisitReport.conductedByRole === 'qp' ? 'Quality Partner' : 'Verifier'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Completed On</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {new Date(selectedVisitApp.siteVisitReport.completedAt || selectedVisitApp.siteVisitReport.conductedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Risk Profile (for QP) */}
                  {selectedVisitApp.siteVisitReport.riskProfile && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk Profile</h4>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedVisitApp.siteVisitReport.riskProfile === 'low' ? 'bg-green-100 text-green-800' :
                        selectedVisitApp.siteVisitReport.riskProfile === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedVisitApp.siteVisitReport.riskProfile.toUpperCase()} RISK
                      </div>
                    </div>
                  )}

                  {/* Executive Summary */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Executive Summary</h4>
                    <p className="text-gray-700">{selectedVisitApp.siteVisitReport.summary}</p>
                  </div>

                  {/* Checklist Results */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Checklist</h4>
                    <div className="space-y-4">
                      {selectedVisitApp.siteVisitReport.checklist.map((item, index) => (
                        <div key={index} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                          <div className="flex items-start space-x-3">
                            {item.isMet ? (
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{item.criteria}</p>
                              {item.comments && (
                                <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                                  {item.comments}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evidence Gallery */}
                  {selectedVisitApp.siteVisitReport.evidence && selectedVisitApp.siteVisitReport.evidence.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Evidence Collected ({selectedVisitApp.siteVisitReport.evidence.length})</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedVisitApp.siteVisitReport.evidence.map((item) => (
                          <a
                            key={item.id}
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="aspect-square bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                              <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="text-xs font-medium text-gray-700 truncate">{item.fileName}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedVisitApp.siteVisitReport.recommendations}</p>
                  </div>

                  {/* Download Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        const reportData = JSON.stringify(selectedVisitApp.siteVisitReport, null, 2);
                        const blob = new Blob([reportData], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `site-visit-report-${selectedVisitApp.applicationId}.json`;
                        a.click();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowVisitModal(false);
                    setSelectedVisitApp(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
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
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Site Visit Management</h1>
              <p className="text-sm text-gray-600">Manage and schedule site visits for accredited applications</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {userName.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Subtabs */}
     <div className="px-6 border-b border-gray-200">
  <nav className="flex space-x-8">
    <button
      onClick={() => setActiveSubTab('preparation')}
      className={`pb-4 px-1 border-b-2 font-medium text-sm ${
        activeSubTab === 'preparation'
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      Preparation
    </button>
    
    {/* Show Scheduling tab for both Deputy Director AND Assistant Director */}
    {(userRole === 'Deputy Director' || userRole === 'Assistant Director') && (
      <button
        onClick={() => setActiveSubTab('scheduling')}
        className={`pb-4 px-1 border-b-2 font-medium text-sm ${
          activeSubTab === 'scheduling'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        Scheduling
      </button>
    )}
    
    <button
      onClick={() => setActiveSubTab('visit')}
      className={`pb-4 px-1 border-b-2 font-medium text-sm ${
        activeSubTab === 'visit'
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      Site Visit
    </button>
  </nav>
</div>
      </div>

{/* Main Content */}
<div className="p-6">
  {activeSubTab === 'preparation' && renderPreparationTabList()}
  
  {/* Show scheduling content for both Deputy Director and Assistant Director */}
  {activeSubTab === 'scheduling' && (userRole === 'Deputy Director' || userRole === 'Assistant Director') && renderSchedulingTab()}
  
  {/* Show access denied if someone else tries to access scheduling */}
  {activeSubTab === 'scheduling' && userRole !== 'Deputy Director' && userRole !== 'Assistant Director' && (
    <div className="bg-red-50 p-8 rounded-lg text-center border border-red-200">
      <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-red-800 mb-2">Access Denied</h3>
      <p className="text-red-600 mb-4">
        You don't have permission to access the Scheduling tab.
      </p>
      <p className="text-sm text-red-500">
        This section is only available to Deputy Directors and Assistant Directors.
      </p>
      <button
        onClick={() => setActiveSubTab('preparation')}
        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        Return to Preparation
      </button>
    </div>
  )}
  
  {activeSubTab === 'visit' && renderVisitTab()}
</div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Application Details: {selectedApplication.applicationId}</h2>
                  <p className="text-xs text-gray-500 mt-1">{selectedApplication.applicationData?.applicantInfo.organisationName}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedApplication(null);
                    setModalActiveTab('details');
                    setReportNotes('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex space-x-4 mt-3 border-b border-gray-200">
                <button
                  onClick={() => setModalActiveTab('details')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    modalActiveTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setModalActiveTab('ai-report')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    modalActiveTab === 'ai-report' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  AI Report
                </button>
                <button
                  onClick={() => setModalActiveTab('history')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    modalActiveTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  History
                </button>
                <button
                  onClick={() => setModalActiveTab('preparation')}
                  className={`pb-2 px-1 text-sm font-medium ${
                    modalActiveTab === 'preparation' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  Preparation
                </button>
              </div>
            </div>

            <div className="p-4">
              {modalActiveTab === 'details' && renderDetailsTab()}
              {modalActiveTab === 'ai-report' && renderAIReportTab()}
              {modalActiveTab === 'history' && renderHistoryTab()}
              {modalActiveTab === 'preparation' && renderPreparationTab()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}