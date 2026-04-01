import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

export default function ProfilesLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);

   const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const profiles = JSON.parse(localStorage.getItem("profiles") || "[]");

    const profile = profiles.find(
      (p: any) => p.companyName === username && p.password === password
    );

    setTimeout(() => {
      if (profile) {
        localStorage.setItem("currentProfile", JSON.stringify(profile));

        toast.success(`Welcome back, ${profile.fullName}!`, {
          description: "Login successful",
        });

        navigate("/profiles/dashboard");
      } else {
        toast.error("Login failed", {
          description: "Invalid company name or password",
        });
      }

      setLoading(false);
    }, 1000);
  };
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Login</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
