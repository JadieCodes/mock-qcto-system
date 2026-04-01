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

    const profiles = JSON.parse(localStorage.getItem("profiles") || "[]");
    
    console.log("All profiles:", profiles); // Debug log
    
    // Check against username (not companyName)
    const profile = profiles.find(
      (p: any) => p.username === username && p.password === password
    );

    console.log("Found profile:", profile); // Debug log

    setTimeout(() => {
      if (profile) {
        localStorage.setItem("currentProfile", JSON.stringify(profile));
        
        // Also store the user role
        if (profile.role) {
          localStorage.setItem("currentUserRole", profile.role);
        }

        toast.success(`Welcome back, ${profile.fullName}!`, {
          description: "Login successful",
        });

        navigate("/profiles/dashboard");
      } else {
        toast.error("Login failed", {
          description: "Invalid username or password. Please check your credentials.",
        });
      }

      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 relative">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
      
      </div>

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