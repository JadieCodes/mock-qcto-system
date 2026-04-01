import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  BadgeCheck,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";
import ProtectedTab from "@/components/ProtectedTab";

import CertificationDomain from "./dashboardTabs/CertificationDomain";
import QualificationsDomain from "./dashboardTabs/QualificationsDomain";
import AssessmentDomain from "./dashboardTabs/AssessmentDomain";
import AccreditationDomain from "./dashboardTabs/AccreditationDomain";
import QualityAssuranceDomain from "./dashboardTabs/QualityAssuranceDomain";
import ResearchDomain from "./dashboardTabs/ResearchDomain";

const tabs = [
  { label: "Certification Domain", icon: <BookOpen size={18} />, component: <CertificationDomain /> },
  { label: "Qualifications Domain", icon: <GraduationCap size={18} />, component: <QualificationsDomain /> },
  { label: "Assessment Domain", icon: <ClipboardCheck size={18} />, component: <AssessmentDomain 
   userRole="quality_partner"
  userName="John Doe"
  organizationName="ABC Training"/> },
  { label: "Accreditation Domain", icon: <BadgeCheck size={18} />, component: <AccreditationDomain /> },
  { label: "Quality Assurance Domain", icon: <ShieldCheck size={18} />, component: <QualityAssuranceDomain /> },
  { label: "Research Domain", icon: <FlaskConical size={18} />, component: <ResearchDomain /> },
];

export default function ProfilesMainDashboard() {
  const [activeTab, setActiveTab] = useState(0);

  // Get current profile info to display user name
  const currentProfile = JSON.parse(localStorage.getItem("currentProfile") || "{}");

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-8 py-6">
        {/* Header with user info only */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          {currentProfile.fullName && (
            <p className="text-gray-600 mt-1">
              Welcome, {currentProfile.fullName} ({currentProfile.companyName})
            </p>
          )}
        </div>

        <div className="sticky top-0 bg-gray-50 z-20 pb-4">
          <div className="grid grid-cols-6 gap-3 border-b pb-3">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center justify-center gap-2 py-3 text-base font-semibold rounded-lg transition-all
                  ${
                    activeTab === index
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-md mt-4 min-h-[55vh] -ml-7 -mr-5 -mb-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProtectedTab domainName={tabs[activeTab].label}>
                {tabs[activeTab].component}
              </ProtectedTab>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}