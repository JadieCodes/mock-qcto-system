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
  status:
    | 'pending_confirmation'
    | 'sent_to_applicant'
    | 'pending_acceptance'
    | 'applicant_confirmed'
    | 'pending_qcto_confirmation'
    | 'booking_confirmed'
    | 'reschedule_requested'
    | 'completed'
    | 'cancelled';
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
const [schedulingRoleTab, setSchedulingRoleTab] = useState<'qp' | 'verifier'>('qp');

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
      applicantConfirmed: false,
      applicantConfirmedAt: undefined,
      qctoConfirmed: false,
      qctoConfirmedAt: undefined,
      qctoConfirmedBy: undefined,
      bookingConfirmed: false,
      bookingConfirmedAt: undefined,
      rescheduleRequested: false,
      rescheduleRequestedAt: undefined,
      rescheduleRequestedBy: undefined,
      rescheduleReason: undefined,
    },
    scheduleSent: true,
    scheduleStatus: 'pending_acceptance' as const,
  };

  mockAccreditationService.updateApplication(scheduledVisit.applicationId, updatedApp);

  const updatedScheduledVisits = scheduledVisits.map(sv =>
    sv.id === scheduledVisit.id
      ? { ...sv, status: 'pending_acceptance' as const, notified: true }
      : sv
  );

  const updatedAssignments = assignments.map(a =>
    a.applicationId === scheduledVisit.applicationId
      ? { ...a, status: 'pending' as const }
      : a
  );

  setApplications(prev =>
    prev.map(a => a.id === scheduledVisit.applicationId ? updatedApp : a)
  );
  setScheduledVisits(updatedScheduledVisits);
  setAssignments(updatedAssignments);

  localStorage.setItem('scheduledVisits', JSON.stringify(updatedScheduledVisits));
  localStorage.setItem('assignments', JSON.stringify(updatedAssignments));

  alert('Schedule sent to applicant successfully. Waiting for applicant confirmation.');
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
      mockAccreditationService.updateApplication(selectedApplication.id, {
  desktopEvaluationUploaded: true,
  desktopEvaluationUploadedAt: new Date().toISOString(),
  desktopEvaluationUploadedBy: userName,
});
loadApplications();
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
      mockAccreditationService.updateApplication(selectedApplication.id, {
  desktopEvaluationUploaded: true,
  desktopEvaluationUploadedAt: new Date().toISOString(),
  desktopEvaluationUploadedBy: userName,
});
loadApplications();
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
  const people =
    schedulingRoleTab === 'qp' ? qualityPartners : verifiers;

  const selectedPerson = people.find((person) => person.id === assigneeId);

  const personRole: 'qp' | 'verifier' =
    schedulingRoleTab === 'qp' ? 'qp' : 'verifier';

  const personSlots = availabilitySlots.filter(
    (slot) =>
      slot.userRole === personRole &&
      slot.userName === selectedPerson?.name &&
      slot.status === 'available'
  );

  const firstOpenSlot = personSlots[0];

  setAssignmentSelections((prev) => ({
    ...prev,
    [appId]: {
      assigneeId,
      date: firstOpenSlot?.date || '',
      time: firstOpenSlot
        ? `${firstOpenSlot.startTime}-${firstOpenSlot.endTime}`
        : '',
    },
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
  const desktopReportsForApp = getDesktopReportsForApplication(app.id);

  if (desktopReportsForApp.length === 0 || !app.desktopEvaluationUploaded) {
    alert('You cannot allocate this application before the desktop evaluation has been uploaded in the Preparation tab.');
    return;
  }

  if (!selection?.assigneeId || !selection?.date || !selection?.time) return;
  if (!selection?.assigneeId || !selection?.date || !selection?.time) {
  alert('Please select a QP / Verifier with an available slot before allocating.');
  return;
}

  const assignee = category === 'quality_partner'
    ? qualityPartners.find(qp => qp.id === selection.assigneeId)
    : verifiers.find(v => v.id === selection.assigneeId);

  if (!assignee) return;

  const assignmentId = `assign-${Date.now()}-${app.id}`;

  const newAssignment: Assignment = {
    id: assignmentId,
    applicationId: app.id,
    category,
    assignedToName: assignee.name,
    assignedToId: assignee.id,
    assignedAt: new Date().toISOString(),
    assignedBy: userName,
    status: 'pending',
  };

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

  const updatedAssignments = [...assignments, newAssignment];
  setAssignments(updatedAssignments);
  localStorage.setItem('assignments', JSON.stringify(updatedAssignments));

  const updatedScheduledVisits = [...scheduledVisits, newScheduledVisit];
  setScheduledVisits(updatedScheduledVisits);
  localStorage.setItem('scheduledVisits', JSON.stringify(updatedScheduledVisits));

  const siteVisitAllocations = JSON.parse(localStorage.getItem('siteVisitAllocations') || '[]');
  const updatedSiteVisitAllocations = [...siteVisitAllocations, newSiteVisitAllocation];
  localStorage.setItem('siteVisitAllocations', JSON.stringify(updatedSiteVisitAllocations));

  markSlotsAsBooked(
    assignee.name,
    category === 'quality_partner' ? 'qp' : 'verifier',
    selection.date,
    selection.time
  );

  const newSelections = { ...assignmentSelections };
  delete newSelections[app.id];
  setAssignmentSelections(newSelections);

  mockAccreditationService.updateApplication(app.id, {
    siteVisitAssigned: true,
    siteVisitAssignedAt: new Date().toISOString(),
    siteVisitAssignedBy: userName,
  });

  loadApplications();

  alert(`Application scheduled with ${assignee.name} and is awaiting internal send-to-applicant confirmation.`);
};

  // Get desktop reports for an application
  const getDesktopReportsForApplication = (applicationId: string) => {
    return desktopReports.filter(r => r.applicationId === applicationId);
  };

  // Filter applications for Preparation tab (payment verified and ready for site visit)
const preparationApplications = applications.filter(app =>
  app.status === 'step9_completed' &&
  app.paymentStatus === 'verified' &&
  !categoryAllocations.some(c => c.applicationId === app.id) &&
  !assignments.some(a => a.applicationId === app.id) &&
  !scheduledVisits.some(sv => sv.applicationId === app.id)
);

  // Get categorized applications (excluding those already assigned)
const pendingScheduledVisits = scheduledVisits.filter(
  (sv) =>
    sv.status === 'pending_confirmation' ||
    sv.status === 'pending_acceptance' ||
    sv.status === 'applicant_confirmed' ||
    sv.status === 'pending_qcto_confirmation' ||
    sv.status === 'reschedule_requested'
);

const confirmedScheduledVisits = scheduledVisits.filter(
  (sv) => sv.status === 'booking_confirmed'
);

const categorizedQpApplications = applications.filter((app) => {
  const category = categoryAllocations.find(
    (c) => c.applicationId === app.id && c.category === 'quality_partner'
  );
  const isAssigned = assignments.some(
    (a) => a.applicationId === app.id && a.category === 'quality_partner'
  );
  return Boolean(category) && !isAssigned;
});

const categorizedVerifierApplications = applications.filter((app) => {
  const category = categoryAllocations.find(
    (c) => c.applicationId === app.id && c.category === 'verifier'
  );
  const isAssigned = assignments.some(
    (a) => a.applicationId === app.id && a.category === 'verifier'
  );
  return Boolean(category) && !isAssigned;
});

const assignedQpApplications = applications.filter((app) => {
  const isAssigned = assignments.some(
    (a) => a.applicationId === app.id && a.category === 'quality_partner'
  );
  return isAssigned;
});

const assignedVerifierApplications = applications.filter((app) => {
  const isAssigned = assignments.some(
    (a) => a.applicationId === app.id && a.category === 'verifier'
  );
  return isAssigned;
});

const visitApplications = applications.filter(
  (app) =>
    app.siteVisitSchedule &&
    (
      app.siteVisitSchedule.status === 'booking_confirmed' ||
      app.siteVisitSchedule.status === 'in_progress' ||
      app.siteVisitSchedule.status === 'completed'
    )
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

const scheduledVisitCount = visitApplications.filter(
  (app) => app.siteVisitSchedule?.status === 'booking_confirmed'
).length;

const inProgressVisitCount = visitApplications.filter(
  (app) => app.siteVisitSchedule?.status === 'in_progress'
).length;

const completedVisitCount = visitApplications.filter(
  (app) => app.siteVisitSchedule?.status === 'completed'
).length;


// Get assigned applications - EXCLUDE those with accepted status




// Applications for Visit tab - include accepted, in_progress, and completed

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
  const roleLabel = schedulingRoleTab === 'qp' ? 'Quality Partners' : 'Verifiers';
  const roleIcon =
    schedulingRoleTab === 'qp' ? (
      <Shield className="w-5 h-5 mr-2 text-blue-600" />
    ) : (
      <Users className="w-5 h-5 mr-2 text-purple-600" />
    );

  const readyToAssignApps =
    schedulingRoleTab === 'qp' ? categorizedQpApplications : categorizedVerifierApplications;

  const assignedApps =
    schedulingRoleTab === 'qp' ? assignedQpApplications : assignedVerifierApplications;

  const roleAssignments = assignments.filter((a) =>
    schedulingRoleTab === 'qp'
      ? a.category === 'quality_partner'
      : a.category === 'verifier'
  );

  const rolePendingVisits = pendingScheduledVisits.filter((sv) =>
    schedulingRoleTab === 'qp'
      ? sv.assignedToRole === 'qp'
      : sv.assignedToRole === 'verifier'
  );

  const roleConfirmedVisits = confirmedScheduledVisits.filter((sv) =>
    schedulingRoleTab === 'qp'
      ? sv.assignedToRole === 'qp'
      : sv.assignedToRole === 'verifier'
  );

  const getAvailablePeople = () => {
    if (schedulingRoleTab === 'qp') {
      return qualityPartners.map((person) => ({
        ...person,
        slots: availabilitySlots.filter(
          (slot) =>
            slot.userRole === 'qp' &&
            slot.userName === person.name &&
            slot.status === 'available'
        ),
      }));
    }

    return verifiers.map((person) => ({
      ...person,
      slots: availabilitySlots.filter(
        (slot) =>
          slot.userRole === 'verifier' &&
          slot.userName === person.name &&
          slot.status === 'available'
      ),
    }));
  };

  const availablePeople = getAvailablePeople();

  const getAppById = (applicationId: string) =>
    applications.find((app) => app.id === applicationId);

  const handleConfirmBookingByQCTO = (applicationId: string) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app?.siteVisitSchedule) return;

    const updatedApp = {
      ...app,
      siteVisitSchedule: {
        ...app.siteVisitSchedule,
        qctoConfirmed: true,
        qctoConfirmedAt: new Date().toISOString(),
        qctoConfirmedBy: userName,
        bookingConfirmed: true,
        bookingConfirmedAt: new Date().toISOString(),
        status: 'booking_confirmed' as const,
      },
      scheduleStatus: 'booking_confirmed' as const,
      status: 'step10_site_visit_scheduled' as const,
    };

    mockAccreditationService.updateApplication(applicationId, updatedApp);

    const updatedVisits = scheduledVisits.map((sv) =>
      sv.applicationId === applicationId
        ? { ...sv, status: 'booking_confirmed' as const }
        : sv
    );

    setScheduledVisits(updatedVisits);
    setApplications((prev) =>
      prev.map((appItem) => (appItem.id === applicationId ? updatedApp : appItem))
    );
    localStorage.setItem('scheduledVisits', JSON.stringify(updatedVisits));

    alert('Booking confirmed by QCTO successfully.');
  };

  const getScheduleStatusBadge = (status: ScheduledVisit['status']) => {
    const styles: Record<ScheduledVisit['status'], string> = {
      pending_confirmation: 'bg-purple-100 text-purple-800',
      sent_to_applicant: 'bg-blue-100 text-blue-800',
      pending_acceptance: 'bg-yellow-100 text-yellow-800',
      applicant_confirmed: 'bg-green-100 text-green-800',
      pending_qcto_confirmation: 'bg-orange-100 text-orange-800',
      booking_confirmed: 'bg-emerald-100 text-emerald-800',
      reschedule_requested: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-200 text-gray-700',
    };

    const labels: Record<ScheduledVisit['status'], string> = {
      pending_confirmation: 'Pending Internal Send',
      sent_to_applicant: 'Sent to Applicant',
      pending_acceptance: 'Pending Applicant',
      applicant_confirmed: 'Applicant Confirmed',
      pending_qcto_confirmation: 'Awaiting QCTO',
      booking_confirmed: 'Booking Confirmed',
      reschedule_requested: 'Reschedule Requested',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };
return (
  <div className="space-y-8">
    {/* Top Header + Summary */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 pt-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {roleIcon}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{roleLabel} Scheduling</h3>
                <p className="text-sm text-gray-600">
                  Assign applications, send proposed dates, and manage confirmations
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-b border-transparent">
            <button
              onClick={() => setSchedulingRoleTab('qp')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                schedulingRoleTab === 'qp'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 border-b-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              QPs
            </button>
            <button
              onClick={() => setSchedulingRoleTab('verifier')}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                schedulingRoleTab === 'verifier'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200 border-b-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Verifiers
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5">
          <p className="text-sm font-medium text-blue-700">Ready to Assign</p>
          <p className="mt-2 text-3xl font-bold text-blue-900">{readyToAssignApps.length}</p>
          <p className="mt-1 text-xs text-blue-600">Categorized and waiting for allocation</p>
        </div>

        <div className="rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-5">
          <p className="text-sm font-medium text-yellow-700">Pending Workflow</p>
          <p className="mt-2 text-3xl font-bold text-yellow-900">{rolePendingVisits.length}</p>
          <p className="mt-1 text-xs text-yellow-700">Waiting for send, applicant, or QCTO action</p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5">
          <p className="text-sm font-medium text-green-700">Confirmed Bookings</p>
          <p className="mt-2 text-3xl font-bold text-green-900">{roleConfirmedVisits.length}</p>
          <p className="mt-1 text-xs text-green-700">Fully confirmed and ready for visit</p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5">
          <p className="text-sm font-medium text-purple-700">Available Assessors</p>
          <p className="mt-2 text-3xl font-bold text-purple-900">
            {availablePeople.filter((p) => p.slots.length > 0).length}
          </p>
          <p className="mt-1 text-xs text-purple-700">People with open scheduling slots</p>
        </div>
      </div>
    </div>

    {/* Ready to Assign */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h4 className="text-lg font-semibold text-gray-900">Ready to Assign</h4>
        <p className="text-sm text-gray-600 mt-1">
          Categorized applications waiting for allocation
        </p>
      </div>

      <div className="p-6 space-y-5">
        {readyToAssignApps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-500">No applications ready to assign.</p>
          </div>
        ) : (
          readyToAssignApps.map((app) => {
            const appAvailablePeople = availablePeople.filter((person) => person.slots.length > 0);

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
  <div className="flex-1 space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-blue-600" />
        </div>

        <div>
          <h5 className="text-lg font-semibold text-gray-900 leading-tight">
            {app.applicationId}
          </h5>
          <p className="text-xs text-gray-500">
            {schedulingRoleTab === 'qp' ? 'Quality Partner allocation' : 'Verifier allocation'}
          </p>
        </div>
      </div>

      <span
        className={`px-3 py-1 text-xs font-medium rounded-full border ${
          schedulingRoleTab === 'qp'
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-purple-50 text-purple-700 border-purple-200'
        }`}
      >
        {schedulingRoleTab === 'qp' ? 'QP Allocation' : 'Verifier Allocation'}
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-xs font-medium text-gray-500 mb-1">Organisation</p>
        <p className="text-sm font-semibold text-gray-800">
          {app.applicationData?.applicantInfo.organisationName}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-xs font-medium text-gray-500 mb-1">Qualification</p>
        <p className="text-sm font-semibold text-gray-800">
          {app.applicationData?.qualification}
        </p>
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
        Region: {app.applicationData?.applicantInfo.region || 'N/A'}
      </span>

      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
        Venue: {app.applicationData?.applicantInfo.trainingLocation || 'N/A'}
      </span>
    </div>
  </div>

  <div className="flex xl:block">
    <button
      onClick={() => {
        setSelectedApplication(app);
        setModalActiveTab('details');
      }}
      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
    >
      View Details
    </button>
  </div>
</div>

                <div className="mt-5 pt-5 border-t border-gray-100">
                  {appAvailablePeople.length === 0 ? (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                      No available {schedulingRoleTab === 'qp' ? 'QPs' : 'Verifiers'} with open slots.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Assign To
                        </label>
                        <select
                          value={assignmentSelections[app.id]?.assigneeId || ''}
                          onChange={(e) => handleAssigneeChange(app.id, e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select person</option>
                          {appAvailablePeople.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Date</label>
                        <input
                          type="date"
                          value={assignmentSelections[app.id]?.date || ''}
                          readOnly
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Time</label>
                        <input
                          type="text"
                          value={assignmentSelections[app.id]?.time || ''}
                          readOnly
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() =>
                            handleAssign(
                              app,
                              schedulingRoleTab === 'qp' ? 'quality_partner' : 'verifier'
                            )
                          }
                          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium shadow-sm"
                        >
                          Allocate Booking
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>

    {/* Pending Scheduling Workflow */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h4 className="text-lg font-semibold text-gray-900">Pending Scheduling Workflow</h4>
        <p className="text-sm text-gray-600 mt-1">
          Allocated visits waiting for send, applicant action, or QCTO confirmation
        </p>
      </div>

      <div className="p-6 space-y-4">
        {rolePendingVisits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-500">No pending scheduling items.</p>
          </div>
        ) : (
          rolePendingVisits.map((visit) => {
            const app = getAppById(visit.applicationId);
            if (!app) return null;

            return (
          <div
  key={visit.id}
  className="rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 via-white to-white p-5 shadow-sm"
>
  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
    <div className="flex-1 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-yellow-100 border border-yellow-200 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-yellow-700" />
          </div>

          <div>
            <h5 className="text-lg font-semibold text-gray-900 leading-tight">
              {app.applicationId}
            </h5>
            <p className="text-xs text-gray-500">Pending scheduling workflow</p>
          </div>
        </div>

        {getScheduleStatusBadge(visit.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Organisation</p>
          <p className="text-sm font-semibold text-gray-800">
            {app.applicationData?.applicantInfo.organisationName}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Assigned To</p>
          <p className="text-sm font-semibold text-gray-800">{visit.assignedToName}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Scheduled Date</p>
          <p className="text-sm font-semibold text-gray-800">{visit.scheduledDate}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Scheduled Time</p>
          <p className="text-sm font-semibold text-gray-800">{visit.scheduledTime}</p>
        </div>
      </div>
    </div>

    <div className="flex flex-wrap xl:flex-col gap-2 xl:min-w-[190px]">
      {visit.status === 'pending_confirmation' && (
        <button
          onClick={() => handleSendSchedule(visit)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium shadow-sm"
        >
          Send to Applicant
        </button>
      )}

      {visit.status === 'applicant_confirmed' && (
        <button
          onClick={() => handleConfirmBookingByQCTO(visit.applicationId)}
          className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium shadow-sm"
        >
          Confirm Booking
        </button>
      )}

      <button
        onClick={() => {
          setSelectedApplication(app);
          setModalActiveTab('details');
        }}
        className="px-4 py-2.5 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700"
      >
        View Details
      </button>
    </div>
  </div>

  {visit.status === 'reschedule_requested' && (
    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700">
            Applicant requested a new date
          </p>
          <p className="text-sm text-red-600 mt-1">
            Please select and send a replacement booking slot.
          </p>
        </div>
      </div>
    </div>
  )}
</div>
            );
          })
        )}
      </div>
    </div>

    {/* Confirmed Bookings */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h4 className="text-lg font-semibold text-gray-900">Confirmed Bookings</h4>
        <p className="text-sm text-gray-600 mt-1">
          Fully confirmed site visits ready to move into the Site Visit tab
        </p>
      </div>

      <div className="p-6 space-y-4">
        {roleConfirmedVisits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-500">No confirmed bookings yet.</p>
          </div>
        ) : (
          roleConfirmedVisits.map((visit) => {
            const app = getAppById(visit.applicationId);
            if (!app) return null;

            return (
          <div
  key={visit.id}
  className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-white p-5 shadow-sm"
>
  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
    <div className="flex-1 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-700" />
          </div>

          <div>
            <h5 className="text-lg font-semibold text-gray-900 leading-tight">
              {app.applicationId}
            </h5>
            <p className="text-xs text-gray-500">Confirmed booking</p>
          </div>
        </div>

        {getScheduleStatusBadge(visit.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Organisation</p>
          <p className="text-sm font-semibold text-gray-800">
            {app.applicationData?.applicantInfo.organisationName}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Assigned To</p>
          <p className="text-sm font-semibold text-gray-800">{visit.assignedToName}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Scheduled Date</p>
          <p className="text-sm font-semibold text-gray-800">{visit.scheduledDate}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Scheduled Time</p>
          <p className="text-sm font-semibold text-gray-800">{visit.scheduledTime}</p>
        </div>
      </div>
    </div>

    <div className="flex xl:flex-col gap-2 xl:min-w-[190px]">
      <button
        onClick={() => {
          setSelectedApplication(app);
          setModalActiveTab('details');
        }}
        className="px-4 py-2.5 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700"
      >
        View Details
      </button>
    </div>
  </div>
</div>
            );
          })
        )}
      </div>
    </div>
  </div>
);
};

const renderVisitTab = () => {

  const getVisitStatusBadge = (status?: string) => {
  if (status === 'booking_confirmed') {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Booking Confirmed
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
        In Progress
      </span>
    );
  }

  if (status === 'completed') {
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        Completed
      </span>
    );
  }

  return (
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
      Pending
    </span>
  );
};
  return (
    <div className="space-y-6">
      {/* Stats Cards for Visit Tab */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total Site Visits</p>
          <p className="text-2xl font-bold text-gray-900">{visitApplications.length}</p>
        </div>
     <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
  <p className="text-sm text-green-600">Scheduled</p>
  <p className="text-2xl font-bold text-green-600">{scheduledVisitCount}</p>
</div>

<div className="bg-yellow-50 rounded-lg shadow-sm p-4 border border-yellow-200">
  <p className="text-sm text-yellow-600">In Progress</p>
  <p className="text-2xl font-bold text-yellow-600">{inProgressVisitCount}</p>
</div>

<div className="bg-gray-50 rounded-lg shadow-sm p-4 border border-gray-200">
  <p className="text-sm text-gray-600">Completed</p>
  <p className="text-2xl font-bold text-gray-700">{completedVisitCount}</p>
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
  {getVisitStatusBadge(app.siteVisitSchedule?.status)}
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
            {visitModalTab === 'report' && selectedVisitApp.siteVisitReport && (() => {
  const report = selectedVisitApp.siteVisitReport as any;
  const visitExecution = report.visitExecution || {};
  const headerFields = report.headerFields || {};
  const reportSections = report.sections || [];

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
            {report.outcome.replace('_', ' ').toUpperCase()}
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
              {headerFields.legalName || selectedVisitApp.applicationData?.applicantInfo.organisationName || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Physical Address</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.physicalAddress || selectedVisitApp.applicationData?.applicantInfo.trainingLocation || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Contact Person</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.contactPerson || selectedVisitApp.applicationData?.applicantInfo.fullName || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Contact Number</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.contactNumber || selectedVisitApp.applicationData?.applicantInfo.phone || 'N/A'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Contact Email</p>
            <p className="text-sm font-semibold text-gray-800">
              {headerFields.contactEmail || selectedVisitApp.applicationData?.applicantInfo.email || 'N/A'}
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
              {headerFields.qualificationTitle || report.qualification || selectedVisitApp.applicationData?.qualification || 'N/A'}
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
        /* Fallback flat checklist */
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Checklist</h4>
          <div className="space-y-4">
            {report.checklist.map((item: any) => (
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
})()}
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