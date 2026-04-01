import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route ,Navigate} from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { Layout } from "@/components/ui/Layout";
import { AssessmentLayout } from "@/components/AssessmentLayout";


// Certification domain pages
import Dashboard from "./pages/Dashboard";
import Intake from "./pages/Intake";
import Batches from "./pages/Batches";
import Integrations from "./pages/Integrations";
import Printing from "./pages/Printing";
import InternalCorrections from "./pages/internalCorrections";
import NotFound from "./pages/NotFound";

// Profiles flow pages
import ChooseUser from "./users/ChooseUser";
import ProfilesLanding from "./users/ProfilesLanding";
import ProfilesLogin from "./users/ProfilesLogin";
import CreateProfile from "./users/CreateProfile";
import { ProfilesLayout } from "./components/ui/ProfilesLayout";
import ProfilesDashboard from "./pages/ProfilesDashboard";
import ProfilesMainDashboard from "./users/ProfilesMainDashboard";
import DepartmentsLanding from "./departments/DepartmentsLanding";
import QualificationDesign from "./pages/QualificationDesign";
import QualificationDevelopment from "./pages/QualificationDevelopment";
import QualificationPublicInput from "./pages/QualificationPublicInput";
import QualificationApproval from "./pages/QualificationApproval";

// Assessment domain pages
import AssessmentDomain from "./users/dashboardTabs/AssessmentDomain";
import AssessorManagement from "./pages/assessment/AssessorManagement";
import StandardsManagement from "./pages/assessment/StandardsManagement";
import CenterManagement from "./pages/assessment/CenterManagement";
import CandidateRegistration from "./pages/assessment/CandidateRegistration";
import QualityAssurance from "./pages/assessment/QualityAssurance";
import ResultsManagement from "./pages/assessment/ResultsManagement";

import InternalDashboard from "./pages/qualifications/internal/InternalDashboard";
import InternalApplications from "./pages/qualifications/internal/InternalApplications";
import InternalEvaluations from "./pages/qualifications/internal/InternalEvaluations";
import DevelopmentWorkspace from "./pages/qualifications/internal/DevelopmentWorkspace";
import PublicInputDashboard from "./pages/qualifications/internal/PublicInputDashboard";
import QualificationsApprovalPhase from "./pages/qualifications/internal/QualificationsApprovalPhase";
import InternalReporting from "./pages/qualifications/internal/InternalReporting";
import InternalQualificationsLayout from "./components/ui/InternalQualificationsLayout";

import AccreditationInternalDashboard from './pages/accreditation/AccreditationInternalDashboard';
import { AccreditationLayout } from './components/ui/AccreditationLayout';
import SiteVisitManagement from './pages/accreditation/SiteVisitManagement';
import QPDashboard from './pages/accreditation/QPDashboard';
import VerifierDashboard from './pages/accreditation/VerifierDashboard';
import UserRoleSwitcher from "./components/ui/UserRoleSwitcher";
import { useState } from 'react';

// Research domain pages
// Research domain pages
import ResearchRequestManagement from "./pages/research/internal/ResearchRequestManagement";
import ServiceProviderAppointment from "./pages/research/internal/ServiceProviderAppointment";
import ResearchReporting from "./pages/research/internal/ResearchReporting";
import ResearchBulletinManagement from "./pages/research/internal/ResearchBulletinManagement";
import ExternalResearchApplications from "./pages/research/internal/ExternalResearchApplications";
import DashboardResearch from "./pages/research/internal/DashboardResearch";
import AgendaManagement from "./pages/research/internal/AgendaManagement";
import ProjectArchive from "./pages/research/internal/ProjectArchive";
import { InternalSideMenuBar } from './components/InternalSideMenuBar';

import QAInternalSideBar from './components/QAInternalSideBar';
import InternalLearnerEnrolment from "./pages/QA/QAInternal/InternalLearnerEnrolment";
import InternalCurriculumImplementation from "./pages/QA/QAInternal/InternalCurriculumImplementation";
import InternalSkillsProgrammes from "./pages/QA/QAInternal/InternalSkillsProgrammes";
import InternalHistoricalQualifications from "./pages/QA/QAInternal/InternalHistoricalQualifications";
import ResearchAuditTrail from "./pages/research/internal/ResearchAuditTrail";

import ProtectedDepartmentRoute from "@/components/ProtectedDepartmentRoute";

const App = () => {
  const [userRole, setUserRole] = useState('applicant');
  const [userName, setUserName] = useState('John Applicant'); // Add this
  
  const handleRoleChange = (role: string, name: string) => {
    setUserRole(role);
    setUserName(name);
  };
  
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* User Role Switcher - visible on all pages */}
           
            
            <Routes>
              {/* Landing page to choose Profiles or Certification */}
              <Route path="/" element={<ChooseUser />} />

              {/* Profiles Flow */}
              <Route path="/profiles" element={<ProfilesLanding />} />
              <Route path="/profiles/login" element={<ProfilesLogin />} />
              <Route path="/profiles/create" element={<CreateProfile />} />

              {/* Profiles Dashboard - uses ProfilesLayout */}
              <Route
                path="/profiles/*"
                element={
                  <ProfilesLayout>
                    <Routes>
                      <Route path="dashboard" element={<ProfilesDashboard />} />
                      <Route path="main-dashboard" element={<ProfilesMainDashboard />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ProfilesLayout>
                }
              />
              
              {/* QP Dashboard */}
              <Route path="/qp-dashboard" element={<QPDashboard />} />
              
              {/* Verifier Dashboard */}
              <Route path="/verifier-dashboard" element={<VerifierDashboard />} />
              
              <Route path="/departments" element={<DepartmentsLanding />} />

             
   {/* NEW: Internal Qualifications Domain Routes */}
                      {/* UPDATED: Internal Qualifications Domain Routes - now the main qualifications domain */}
              {/* Protected Internal Qualifications Domain Routes */}
  <Route
    path="/departments/qualifications/*"
    element={
      <ProtectedDepartmentRoute department="qualifications">
        <InternalQualificationsLayout>
          <Routes>
            <Route path="" element={<Navigate to="/departments/qualifications/dashboard" replace />} />
            <Route path="dashboard" element={<InternalDashboard />} />
            <Route path="applications" element={<InternalApplications />} />
            <Route path="evaluations" element={<InternalEvaluations />} />
            <Route path="workspace" element={<DevelopmentWorkspace />} />
            <Route path="public-input" element={<PublicInputDashboard />} />
            <Route path="approval" element={<QualificationsApprovalPhase />} />
            <Route path="reporting" element={<InternalReporting />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </InternalQualificationsLayout>
      </ProtectedDepartmentRoute>
    }
  />

              {/* Certification domain - wrapped with Layout */}
            {/* Protected Certification domain */}
  <Route
    path="/certification/*"
    element={
      <ProtectedDepartmentRoute department="certification">
        <Layout>
          <Routes>
            <Route path="" element={<Dashboard />} />
            <Route path="intake" element={<Intake />} />
            <Route path="corrections" element={<InternalCorrections />} />
            <Route path="batches" element={<Batches />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="printing" element={<Printing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </ProtectedDepartmentRoute>
    }
  />
              {/* Assessment domain */}
       {/* Protected Assessment domain */}
  <Route
    path="/departments/assessment/*"
    element={
      <ProtectedDepartmentRoute department="assessment">
        <AssessmentLayout 
          userName="John Doe" 
          organizationName="ABC Training Institute"
        >
          <Routes>
            <Route 
              path="" 
              element={<Navigate to="/departments/assessment/assessor-management" replace />} 
            />
            <Route 
              path="assessor-management" 
              element={
                <AssessorManagement 
                  userRole="quality_partner" 
                  userName="John Doe" 
                  organizationName="ABC Training Institute" 
                />
              } 
            />
            <Route 
              path="standards-management" 
              element={<StandardsManagement />} 
            />
            <Route 
              path="candidate-registration" 
              element={<CandidateRegistration />} 
            />
            <Route 
              path="quality-assurance" 
              element={<QualityAssurance />} 
            />
            <Route 
              path="results-management" 
              element={<ResultsManagement />} 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AssessmentLayout>
      </ProtectedDepartmentRoute>
    }
  />

              {/* Accreditation Domain */}
  <Route
    path="/departments/accreditation/*"
    element={
      <ProtectedDepartmentRoute department="accreditation">
        <AccreditationLayout userName="John Doe" userRole="Accreditation Officer">
          <Routes>
            <Route 
              path="" 
              element={<Navigate to="/departments/accreditation/applications" replace />} 
            />
            <Route 
              path="applications" 
              element={<AccreditationInternalDashboard />} 
            />
            <Route 
              path="site-visits" 
              element={
                <SiteVisitManagement 
                  userName={userName} 
                  userRole={userRole === 'deputy-director' ? 'Deputy Director' : 'Assistant Director'} 
                />
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AccreditationLayout>
      </ProtectedDepartmentRoute>
    }
  />

  {/* Protected Research Domain */}
  <Route
    path="/departments/research/*"
    element={
      <ProtectedDepartmentRoute department="research">
        <InternalSideMenuBar>
          <Routes>
            <Route 
              path="" 
              element={<Navigate to="/departments/research/dashboard" replace />} 
            />
            <Route 
              path="dashboard" 
              element={<DashboardResearch />} 
            />
            <Route 
              path="requests" 
              element={<ResearchRequestManagement />} 
            />
            <Route 
              path="appointments" 
              element={<ServiceProviderAppointment />} 
            />
            <Route 
              path="reporting" 
              element={<ResearchReporting />} 
            />
            <Route 
              path="bulletin" 
              element={<ResearchBulletinManagement />} 
            />
            <Route 
              path="external" 
              element={<ExternalResearchApplications />} 
            />
            <Route 
              path="agenda-management" 
              element={<AgendaManagement />} 
            />
            <Route 
              path="project-archive" 
              element={<ProjectArchive />} 
            />
            <Route 
              path="audit-trail" 
              element={<ResearchAuditTrail />} 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </InternalSideMenuBar>
      </ProtectedDepartmentRoute>
    }
  />

  {/* Protected Quality Assurance Internal Domain */}
  <Route
    path="/departments/quality-assurance/*"
    element={
      <ProtectedDepartmentRoute department="qa">
        <QAInternalSideBar>
          <Routes>
            <Route 
              path="" 
              element={<Navigate to="/departments/quality-assurance/learner-enrolment" replace />} 
            />
            <Route 
              path="learner-enrolment" 
              element={<InternalLearnerEnrolment />} 
            />
            <Route 
              path="curriculum-implementation" 
              element={<InternalCurriculumImplementation />} 
            />
            <Route 
              path="skills-programmes" 
              element={<InternalSkillsProgrammes />} 
            />
            <Route 
              path="historical-qualifications" 
              element={<InternalHistoricalQualifications />} 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </QAInternalSideBar>
      </ProtectedDepartmentRoute>
    }
  />
              {/* Catch all for unknown routes */}
            {/* Redirect old QA path */}
  <Route 
    path="/departments/qa/*" 
    element={<Navigate to="/departments/quality-assurance/learner-enrolment" replace />} 
  />

  {/* Catch all for unknown routes */}
  <Route path="*" element={<NotFound />} />
</Routes>
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;