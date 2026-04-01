import { type ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DepartmentLogin from "@/departments/DepartmentLogin";

interface ProtectedDepartmentRouteProps {
  children: ReactNode;
  department: string;
}

export default function ProtectedDepartmentRoute({ children, department }: ProtectedDepartmentRouteProps) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is logged in for this department
    const loggedIn = localStorage.getItem(`department_login_${department}`) === "true";
    console.log(`Checking auth for ${department}:`, loggedIn);
    setIsAuthenticated(loggedIn);
    setIsChecking(false);
    
    // Listen for storage changes (in case login happens in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `department_login_${department}`) {
        const newLoggedIn = e.newValue === "true";
        console.log(`Storage changed for ${department}:`, newLoggedIn);
        setIsAuthenticated(newLoggedIn);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [department]);

  // If still checking, show loading
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    console.log(`Not authenticated for ${department}, showing login page`);
    return <DepartmentLogin />;
  }

  // If authenticated, render the protected content
  console.log(`Authenticated for ${department}, showing content`);
  return <>{children}</>;
}