import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { ArrowLeft } from 'lucide-react';

export default function ProfilesLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profiles = JSON.parse(localStorage.getItem("profiles") || "[]");
      
      console.log("All profiles:", profiles);
      
      // Find the profile
      const profile = profiles.find(
        (p: any) => p.username === username && p.password === password
      );

      console.log("Found profile:", profile);

      if (profile) {
        // Create a CLEAN version of the profile for localStorage
        // Only store essential fields, remove large data
        const cleanProfile = {
          id: profile.id,
          username: profile.username,
          fullName: profile.fullName,
          email: profile.email,
          role: profile.role,
          companyName: profile.companyName,
          status: profile.status,
          createdAt: profile.createdAt,
          // DO NOT store applications, documents, reports, etc.
          // These should be fetched from the server/storage when needed
          applicationCount: profile.applications?.length || 0,
          lastLogin: new Date().toISOString(),
        };
        
        // Check size before storing
        const serialized = JSON.stringify(cleanProfile);
        const sizeInKB = serialized.length / 1024;
        console.log(`Profile size being stored: ${sizeInKB.toFixed(2)} KB`);
        
        if (sizeInKB > 4000) {
          // If still too large, store only the bare minimum
          console.warn('Profile still too large, storing minimal version');
          const minimalProfile = {
            id: profile.id,
            username: profile.username,
            fullName: profile.fullName,
            role: profile.role,
            companyName: profile.companyName,
          };
          localStorage.setItem("currentProfile", JSON.stringify(minimalProfile));
        } else {
          localStorage.setItem("currentProfile", serialized);
        }
        
        // Store the user role separately for quick access
        if (profile.role) {
          localStorage.setItem("currentUserRole", profile.role);
        }

        // Store profile ID for fetching large data later
        localStorage.setItem("currentProfileId", profile.id);

        toast.success(`Welcome back, ${profile.fullName}!`, {
          description: "Login successful",
        });

        navigate("/profiles/dashboard");
      } else {
        toast.error("Login failed", {
          description: "Invalid username or password. Please check your credentials.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        toast.error("Storage error", {
          description: "Your profile data is too large. Please contact support.",
        });
      } else {
        toast.error("Login failed", {
          description: "An error occurred. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 relative">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Login</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/profiles")}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to Profiles
          </button>
        </div>
      </div>
    </div>
  );
}