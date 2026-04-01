import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { User, LayoutDashboard, LogOut } from "lucide-react";
import { toast } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/profiles/dashboard", label: "My Profile", icon: User },
  { path: "/profiles/main-dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export const ProfilesLayout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all profile-related data from localStorage
    localStorage.removeItem("currentProfile");
    localStorage.removeItem("currentUserRole");
    localStorage.removeItem("unlockedDomains"); // Clear unlocked domains so they need to re-enter passwords
    
    toast.success("Logged out", {
      description: "You have been successfully logged out.",
    });
    
    navigate("/profiles"); // Go back to profiles landing page
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r shadow-sm flex flex-col justify-between">
        <div>
          <div className="px-6 py-6 text-2xl font-bold text-blue-600 border-b">
            Profiles
          </div>
          <nav className="mt-6 space-y-2 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-md font-medium transition",
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-600 font-medium cursor-pointer hover:bg-red-100 hover:text-red-700 m-6 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-auto">
        {children}
      </main>
    </div>
  );
};