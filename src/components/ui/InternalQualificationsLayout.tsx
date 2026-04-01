// components/ui/InternalQualificationsLayout.tsx
import React, { useState } from 'react';
import { Link, useLocation ,useNavigate} from 'react-router-dom';
import {
  FileText,
  ClipboardList,
  GitBranch,
  Users,
  CheckCircle,
  LayoutDashboard,
  BarChart3,
  ChevronRight,
  Menu,
  X,
  LogOut
} from "lucide-react";

interface InternalQualificationsLayoutProps {
  children: React.ReactNode;
}

export default function InternalQualificationsLayout({ children }: InternalQualificationsLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
   const navigate = useNavigate();
const handleLogout = () => {
  localStorage.removeItem('department_login_qualifications');
  localStorage.removeItem('current_department');
  navigate('/departments');
};
  // Update paths to match the new route structure in App.tsx
  const navigationItems = [
    {
      path: "/departments/qualifications/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview and statistics",
      count: null,
      color: "blue"
    },
    {
      path: "/departments/qualifications/applications",
      label: "Applications",
      icon: FileText,
      description: "Manage incoming applications",
      count: 24,
      color: "green"
    },
    {
      path: "/departments/qualifications/evaluations",
      label: "Evaluations",
      icon: ClipboardList,
      description: "Review and evaluate submissions",
      count: 12,
      color: "purple"
    },
    {
      path: "/departments/qualifications/workspace",
      label: "Development Workspace",
      icon: GitBranch,
      description: "Active development projects",
      count: 8,
      color: "orange"
    },
    {
      path: "/departments/qualifications/public-input",
      label: "Public Input Dashboard",
      icon: Users,
      description: "Manage public feedback",
      count: 156,
      color: "pink"
    },
    {
      path: "/departments/qualifications/approval",
      label: "Qualifications Approval Phase",
      icon: CheckCircle,
      description: "Approval workflow management",
      count: 6,
      color: "indigo"
    },
    {
      path: "/departments/qualifications/reporting",
      label: "Reporting",
      icon: BarChart3,
      description: "Reports and analytics",
      count: null,
      color: "red"
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:block ${
          isSidebarCollapsed ? "w-20" : "w-72"
        } bg-white border-r shadow-sm transition-all duration-300 flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between h-16">
          {!isSidebarCollapsed && (
            <div>
              <h3 className="font-semibold text-gray-700">Internal Qualifications</h3>
              <p className="text-xs text-gray-500">Staff Portal</p>
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

        {/* Staff Info - Collapsed */}
        {isSidebarCollapsed && (
          <div className="p-3 border-b flex justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              SA
            </div>
          </div>
        )}

        {/* Staff Info - Expanded */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                SA
              </div>
              <div>
                <p className="font-medium text-gray-800">Sarah Anderson</p>
                <p className="text-xs text-gray-500">Qualifications Manager</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                  ${isSidebarCollapsed ? "justify-center" : ""}
                  ${active 
                    ? `bg-${item.color}-50 text-${item.color}-700 border-l-4 border-${item.color}-500` 
                    : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? `text-${item.color}-600` : "text-gray-500"}`} />
                
                {!isSidebarCollapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <div className={`font-medium text-sm ${active ? `text-${item.color}-700` : ""}`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-400">{item.description}</div>
                    </div>
                    {item.count && (
                      <span className={`
                        text-xs font-medium px-2 py-1 rounded-full
                        ${active 
                          ? `bg-${item.color}-100 text-${item.color}-700` 
                          : "bg-gray-100 text-gray-600"
                        }
                      `}>
                        {item.count}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
           <div className="p-4 border-t border-gray-200">
          <button  onClick={handleLogout}
          className="flex items-center text-sm text-gray-700 hover:text-gray-900">
            <LogOut className="w-5 h-5 mr-3 text-gray-500" />
            Logout
          </button>
        </div>
        </nav>

       
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white rounded-lg shadow-lg"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-black bg-opacity-50">
          <div className="w-72 bg-white h-full p-4 overflow-y-auto">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                SA
              </div>
              <div>
                <p className="font-medium text-gray-800">Sarah Anderson</p>
                <p className="text-xs text-gray-500">Qualifications Manager</p>
              </div>
            </div>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg
                      ${active ? `bg-${item.color}-50 text-${item.color}-700` : "text-gray-600 hover:bg-gray-100"}
                    `}
                  >
                    <Icon className={`w-5 h-5 ${active ? `text-${item.color}-600` : "text-gray-500"}`} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.description}</div>
                    </div>
                    {item.count && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gray-100`}>
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
          
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {navigationItems.find(item => isActive(item.path))?.label || "Internal Qualifications"}
                  </h2>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {navigationItems.find(item => isActive(item.path))?.description}
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
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
                
                {/* Notification Bell */}
                <button className="p-2 border rounded-lg hover:bg-gray-50 transition-colors relative">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
          </div>
          
        </div>
        

        {/* Content Area */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}