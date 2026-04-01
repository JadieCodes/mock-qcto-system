import React from 'react';
import { Link, useLocation,useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Calendar, 
  FileText, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface AccreditationLayoutProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: string;
}

export function AccreditationLayout({ children, userName = "Admin User", userRole = "Accreditation Officer" }: AccreditationLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navigation = [
    { name: 'Dashboard', href: '/departments/accreditation', icon: LayoutDashboard },
    { name: 'Applications', href: '/departments/accreditation/applications', icon: ClipboardList },
    { name: 'Site Visits', href: '/departments/accreditation/site-visits', icon: Calendar },
    //{ name: 'Reports', href: '/departments/accreditation/reports', icon: FileText },
    { name: 'Settings', href: '/departments/accreditation/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/departments/accreditation') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
const handleLogout = () => {
    navigate('/');
  };
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Accreditation Domain</h2>
          <p className="text-xs text-gray-500 mt-1">Manage SDP Applications</p>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {userName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`w-5 h-5 mr-3 ${active ? 'text-blue-700' : 'text-gray-500'}`} />
                      {item.name}
                    </div>
                    {active && <ChevronRight className="w-4 h-4" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button  onClick={handleLogout}
          className="flex items-center text-sm text-gray-700 hover:text-gray-900">
            <LogOut className="w-5 h-5 mr-3 text-gray-500" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}