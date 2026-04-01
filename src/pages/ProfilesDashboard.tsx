import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Edit2, Save, X, Lock, User, Mail, Building2, Phone, MapPin, Globe, Users, Briefcase } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  companyName: string;
  companyType: string;
  registrationNumber: string;
  vatNumber: string;
  industry: string;
  seta: string;
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
  numberOfEmployees: string;
  operatingRegion: string;
  notes: string;
  role?: string;
  createdAt?: string;
}

export default function ProfilesDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    const savedProfile = localStorage.getItem("currentProfile");
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile(parsedProfile);
      setEditUsername(parsedProfile.username || "");
    }
  };

  const handleUpdateCredentials = () => {
    if (!profile) return;
    
    if (!editUsername.trim()) {
      toast.error("Error", { description: "Username cannot be empty" });
      return;
    }

    if (!editPassword.trim()) {
      toast.error("Error", { description: "Password cannot be empty" });
      return;
    }

    if (editPassword !== confirmPassword) {
      toast.error("Error", { description: "Passwords do not match" });
      return;
    }

    // Get all profiles
    const profiles = JSON.parse(localStorage.getItem("profiles") || "[]");
    
    // Check if username already exists (excluding current profile)
    const usernameExists = profiles.some(
      (p: any) => p.username === editUsername && p.id !== profile.id
    );
    
    if (usernameExists) {
      toast.error("Error", { description: "Username already taken. Please choose another." });
      return;
    }

    // Update the profile in the profiles array
    const updatedProfiles = profiles.map((p: any) => {
      if (p.id === profile.id) {
        return {
          ...p,
          username: editUsername,
          password: editPassword,
        };
      }
      return p;
    });

    // Save updated profiles
    localStorage.setItem("profiles", JSON.stringify(updatedProfiles));

    // Update current profile
    const updatedProfile: Profile = {
      ...profile,
      username: editUsername,
      password: editPassword,
    };
    localStorage.setItem("currentProfile", JSON.stringify(updatedProfile));
    setProfile(updatedProfile);

    setIsEditingCredentials(false);
    setEditPassword("");
    setConfirmPassword("");
    toast.success("Success", { description: "Credentials updated successfully!" });
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="bg-gray-100 rounded-full p-4 mb-4 inline-block">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-500">No profile found. Please create one.</p>
        </div>
      </div>
    );
  }

  const InfoCard = ({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
          <h2 className="text-lg font-semibold text-blue-800">{title}</h2>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
      </div>
    </div>
  );

  const InfoItem = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />}
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-gray-800 font-medium mt-1 break-words">{value || "-"}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-500 mt-1">View and manage your profile information</p>
      </div>

      {/* Credentials Section */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-md border border-blue-200 mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-blue-800">Login Credentials</h2>
            </div>
            {!isEditingCredentials && (
              <button
                onClick={() => setIsEditingCredentials(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {isEditingCredentials ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    New Password
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleUpdateCredentials}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditingCredentials(false);
                    setEditUsername(profile.username);
                    setEditPassword("");
                    setConfirmPassword("");
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem label="Username" value={profile.username} icon={User} />
              <InfoItem label="Password" value="••••••••" icon={Lock} />
            </div>
          )}
        </div>
      </div>

      {/* User Information */}
      <InfoCard title="User Information" icon={User}>
        <InfoItem label="Full Name" value={profile.fullName} icon={User} />
        <InfoItem label="Email" value={profile.email} icon={Mail} />
      </InfoCard>

      {/* Company Information */}
      <InfoCard title="Company Information" icon={Building2}>
        <InfoItem label="Company Name" value={profile.companyName} icon={Building2} />
        <InfoItem label="Company Type" value={profile.companyType} icon={Briefcase} />
        <InfoItem label="Registration Number" value={profile.registrationNumber} />
        <InfoItem label="VAT Number" value={profile.vatNumber} />
        <InfoItem label="Industry/Sector" value={profile.industry} />
      </InfoCard>

      {/* SETA Information */}
      <InfoCard title="SETA Information" icon={Users}>
        <InfoItem label="SETA" value={profile.seta} />
      </InfoCard>

      {/* Contact Information */}
      <InfoCard title="Contact Information" icon={Phone}>
        <InfoItem label="Primary Contact" value={profile.primaryContact} icon={User} />
        <InfoItem label="Contact Email" value={profile.contactEmail} icon={Mail} />
        <InfoItem label="Contact Phone" value={profile.contactPhone} icon={Phone} />
        <InfoItem label="Address" value={profile.address} icon={MapPin} />
        <InfoItem label="Website" value={profile.website} icon={Globe} />
      </InfoCard>

      {/* Additional Information */}
      <InfoCard title="Additional Information" icon={Users}>
        <InfoItem label="Number of Employees" value={profile.numberOfEmployees} />
        <InfoItem label="Operating Region" value={profile.operatingRegion} />
        <div className="lg:col-span-3">
          <InfoItem label="Notes" value={profile.notes} />
        </div>
      </InfoCard>

      {/* Profile Metadata */}
      {profile.createdAt && (
        <div className="mt-6 text-center text-xs text-gray-400">
          Profile created on {new Date(profile.createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}