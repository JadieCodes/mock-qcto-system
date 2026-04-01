import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Building2 } from "lucide-react";

// Define the 6 departments with their login credentials
const departmentCredentials = {
  research: {
    username: "Research",
    password: "ResearchDomain",
    redirectPath: "/departments/research/dashboard",
    displayName: "Research Domain"
  },
  certification: {
    username: "Certification",
    password: "CertificationDomain",
    redirectPath: "/certification",
    displayName: "Certification Domain"
  },
  qualifications: {
    username: "Qualifications",
    password: "QualificationsDomain",
    redirectPath: "/departments/qualifications/dashboard",
    displayName: "Qualifications Domain"
  },
  assessment: {
    username: "Assessment",
    password: "AssessmentDomain",
    redirectPath: "/departments/assessment",
    displayName: "Assessment Domain"
  },
  accreditation: {
    username: "Accreditation",
    password: "AccreditationDomain",
    redirectPath: "/departments/accreditation",
    displayName: "Accreditation Domain"
  },
  qa: {
    username: "QualityAssurance",
    password: "QADomain",
    redirectPath: "/departments/quality-assurance/learner-enrolment",
    displayName: "Quality Assurance Domain"
  }
};

type DepartmentKey = keyof typeof departmentCredentials;

export default function DepartmentLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Get which department is being accessed from the URL
  const getDepartmentFromPath = (): DepartmentKey | null => {
    const path = location.pathname;
    if (path.includes("/departments/research")) return "research";
    if (path.includes("/certification")) return "certification";
    if (path.includes("/departments/qualifications")) return "qualifications";
    if (path.includes("/departments/assessment")) return "assessment";
    if (path.includes("/departments/accreditation")) return "accreditation";
    if (path.includes("/departments/quality-assurance")) return "qa";
    if (path.includes("/departments/qa")) return "qa";
    return null;
  };

  const department = getDepartmentFromPath();
  const credentials = department ? departmentCredentials[department] : null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("Attempting login for department:", department);
    console.log("Username entered:", username);
    console.log("Expected username:", credentials?.username);
    console.log("Password entered:", password);
    console.log("Expected password:", credentials?.password);

    setTimeout(() => {
      if (credentials && 
          username === credentials.username && 
          password === credentials.password) {
        console.log("Login successful!");
        
        // Store login state in localStorage
        localStorage.setItem(`department_login_${department}`, "true");
        localStorage.setItem(`current_department`, department || "");
        
        console.log("Stored login:", localStorage.getItem(`department_login_${department}`));
        console.log("Redirecting to:", credentials.redirectPath);
        
        // Force a page reload to ensure the ProtectedDepartmentRoute re-checks auth
        window.location.href = credentials.redirectPath;
      } else {
        console.log("Login failed - credentials don't match");
        setError("Invalid username or password. Please try again.");
        setIsLoading(false);
      }
    }, 500);
  };

  // If no department is identified, show error
  if (!department || !credentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Error</h2>
          <p className="text-gray-600">Invalid department access path.</p>
          <button
            onClick={() => navigate("/departments")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Departments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{credentials.displayName}</h1>
          <p className="text-gray-600 mt-2">Please login to access this department</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Logging in...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Login to {credentials.displayName}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Need login credentials? Contact your department administrator.
          </p>
          <button
            onClick={() => navigate("/departments")}
            className="mt-2 w-full text-center text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Back to Departments
          </button>
        </div>
      </div>
    </div>
  );
}