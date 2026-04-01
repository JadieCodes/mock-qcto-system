// QualificationsDomain.tsx
import { useState } from "react";
import { 
  FileText, 
  GitBranch, 
  Users, 
  Award,
  PlusCircle,
  ChevronRight
} from "lucide-react";

import QualificationDesign from "@/pages/QualificationDesign";
import QualificationsDevelopment from "@/pages/QualificationDevelopment";
import PublicSubmissionsScreen from "@/pages/qualifications/PublicSubmissionsScreen";
import RegisteredQualificationsScreen from "@/pages/qualifications/RegisteredQualificationsScreen";

export default function QualificationsDomain() {
  const [activeTab, setActiveTab] = useState<
    "design" | "development" | "public" | "registered"
  >("design");
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navigationItems = [
    {
      id: "design",
      label: "Qualification Design",
      icon: FileText,
      description: "Create and manage applications",
      count: 12,
      color: "blue"
    },
    {
      id: "development",
      label: "Development",
      icon: GitBranch,
      description: "Track development phases",
      count: 8,
      color: "green"
    },
    {
      id: "public",
      label: "Public Submissions",
      icon: Users,
      description: "Manage public feedback",
      count: 24,
      color: "purple"
    },
    {
      id: "registered",
      label: "Registered Qualifications",
      icon: Award,
      description: "View registered qualifications",
      count: 156,
      color: "orange"
    }
  ];

  const getActiveColor = () => {
    switch(activeTab) {
      case "design": return "blue";
      case "development": return "green";
      case "public": return "purple";
      case "registered": return "orange";
      default: return "blue";
    }
  };

  const activeColor = getActiveColor();
  const activeItem = navigationItems.find(item => item.id === activeTab);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarCollapsed ? "w-20" : "w-72"
        } bg-white border-r shadow-sm transition-all duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div>
              <h3 className="font-semibold text-gray-700">Qualifications</h3>
              <p className="text-xs text-gray-500">Domain Navigation</p>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight 
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isSidebarCollapsed ? "rotate-180" : ""
              }`} 
            />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                  ${isSidebarCollapsed ? "justify-center" : ""}
                  ${isActive 
                    ? `bg-${item.color}-50 text-${item.color}-700 border-l-4 border-${item.color}-500` 
                    : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? `text-${item.color}-600` : "text-gray-500"}`} />
                
                {!isSidebarCollapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <div className={`font-medium text-sm ${isActive ? `text-${item.color}-700` : ""}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-400">{item.description}</div>
                    </div>
                    {item.count && (
                      <span className={`
                        text-xs font-medium px-2 py-1 rounded-full
                        ${isActive 
                          ? `bg-${item.color}-100 text-${item.color}-700` 
                          : "bg-gray-100 text-gray-600"
                        }
                      `}>
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Action Button */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t">
            {activeTab === "design" && (
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                <PlusCircle className="w-4 h-4" />
                New Application
              </button>
            )}
            {activeTab === "development" && (
              <button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                <PlusCircle className="w-4 h-4" />
                New Phase
              </button>
            )}
            {activeTab === "public" && (
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                <PlusCircle className="w-4 h-4" />
                New Submission
              </button>
            )}
            {activeTab === "registered" && (
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                <PlusCircle className="w-4 h-4" />
                Export Registry
              </button>
            )}
          </div>
        )}

        {/* Collapsed Quick Action */}
        {isSidebarCollapsed && (
          <div className="p-3 border-t">
            <button className="w-full p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors">
              <PlusCircle className="w-5 h-5 mx-auto" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {activeItem?.label}
                  </h2>
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded-full
                    bg-${activeColor}-100 text-${activeColor}-700
                  `}>
                    {activeItem?.count} total
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {activeItem?.description}
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search ${activeItem?.label.toLowerCase()}...`}
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                
                {/* Filter Button */}
                <button className="p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === "design" && <QualificationDesign />}
          {activeTab === "development" && <QualificationsDevelopment />}
          {activeTab === "public" && <PublicSubmissionsScreen />}
          {activeTab === "registered" && <RegisteredQualificationsScreen />}
        </div>
      </div>
    </div>
  );
}