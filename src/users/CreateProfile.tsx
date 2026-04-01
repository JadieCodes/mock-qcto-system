import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import type { AppRole } from '@/types';
import { toast } from "sonner";
import { ArrowLeft } from 'lucide-react';

export default function CreateProfile() {
  const navigate = useNavigate();
  const { setCurrentRole } = useApp();
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    companyName: '',
    companyType: '',
    registrationNumber: '',
    vatNumber: '',
    industry: '',
    primaryContact: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    website: '',
    numberOfEmployees: '',
    operatingRegion: '',
    seta: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Map company type to AppRole
    const getRoleFromCompanyType = (companyType: string): AppRole => {
      switch (companyType) {
        case 'Assessment Unit':
          return 'Assessment Unit';
        case 'QP':
          return 'QP';
        case 'SDP':
          return 'SDP';
        case 'NAMB (Legacy)':
        case 'NAMB':
          return 'NAMB';
        case 'Cert Admin':
          return 'Cert Admin';
        default:
          return 'SDP';
      }
    };

    // Get existing profiles or empty array
    const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');

    // Check if username already exists
    const existingProfile = profiles.find((p: any) => p.username === form.username);
    if (existingProfile) {
      toast.error("Profile creation failed", {
        description: "Username already exists. Please choose a different username.",
      });
      return;
    }

    // Determine the role from company type
    const userRole = getRoleFromCompanyType(form.companyType);

    // Add the new profile with role
    const newProfile = { 
      ...form, 
      role: userRole,
      createdAt: new Date().toISOString(),
      id: `PROF-${Date.now()}`
    };
    
    profiles.push(newProfile);

    // Save back to localStorage
    localStorage.setItem('profiles', JSON.stringify(profiles));

    // Save current profile for session
    localStorage.setItem('currentProfile', JSON.stringify(newProfile));
    localStorage.setItem('currentUserRole', userRole);
    
    // Update the global role context
    setCurrentRole(userRole);

    toast.success("Profile Created!", {
      description: `${form.fullName} at ${form.companyName} has been created as ${userRole}`,
    });
    
    navigate("/profiles/dashboard");
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 relative">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => navigate('/profiles')}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profiles
        </button>
      </div>

      <div className="max-w-4xl w-full bg-white p-8 rounded-xl shadow-lg overflow-auto max-h-[90vh]">
        <h1 className="text-3xl font-bold mb-8 text-center">Create Profile</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* User Information */}
          <div className="p-6 border rounded-xl bg-blue-50">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={form.fullName}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                name="username"
                placeholder="Username (for login)"
                value={form.username}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Company Information */}
          <div className="p-6 border rounded-xl bg-blue-50">
            <h2 className="text-xl font-semibold mb-4">Company Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="companyName"
                placeholder="Company Name"
                value={form.companyName}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                name="companyType"
                value={form.companyType}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Company Type</option>
                <option value="Assessment Unit">Assessment Unit</option>
                <option value="QP">QP (Quality Partner)</option>
                <option value="SDP">SDP (Skills Development Provider)</option>
                <option value="NAMB">NAMB (Legacy)</option>
                <option value="Cert Admin">Certification Administrator</option>
              </select>
              <input
                type="text"
                name="registrationNumber"
                placeholder="Registration Number"
                value={form.registrationNumber}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="vatNumber"
                placeholder="VAT Number"
                value={form.vatNumber}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="industry"
                placeholder="Industry/Sector"
                value={form.industry}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* SETA Information */}
          <div className="p-6 border rounded-xl bg-blue-50">
            <h2 className="text-xl font-semibold mb-4">SETA Information</h2>
            <select
              name="seta"
              value={form.seta}
              onChange={handleChange}
              className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              required
            >
              <option value="">Select SETA</option>
              <option value="AgriSETA">AgriSETA</option>
              <option value="BANKSETA">BANKSETA</option>
              <option value="CETA">CETA</option>
              <option value="CHIETA">CHIETA</option>
              <option value="CATHSSETA">CATHSSETA</option>
              <option value="ETDP SETA">ETDP SETA</option>
              <option value="EWSETA">EWSETA</option>
              <option value="FP&M SETA">FP&M SETA</option>
              <option value="FASSET">FASSET</option>
              <option value="FoodBev SETA">FoodBev SETA</option>
              <option value="HWSETA">HWSETA</option>
              <option value="INSETA">INSETA</option>
              <option value="LGSETA">LGSETA</option>
              <option value="merSETA">merSETA</option>
              <option value="MICT SETA">MICT SETA</option>
              <option value="MQA">MQA</option>
              <option value="PSETA">PSETA</option>
              <option value="SASSETA">SASSETA</option>
              <option value="SERVICES SETA">SERVICES SETA</option>
              <option value="TETA">TETA</option>
              <option value="W&RSETA">W&RSETA</option>
            </select>
          </div>

          {/* Contact Information */}
          <div className="p-6 border rounded-xl bg-blue-50">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="primaryContact"
                placeholder="Primary Contact Name"
                value={form.primaryContact}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                name="contactEmail"
                placeholder="Contact Email"
                value={form.contactEmail}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                name="contactPhone"
                placeholder="Contact Phone"
                value={form.contactPhone}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="address"
                placeholder="Physical Address"
                value={form.address}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="website"
                placeholder="Website URL"
                value={form.website}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="p-6 border rounded-xl bg-blue-50">
            <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="number"
                name="numberOfEmployees"
                placeholder="Number of Employees"
                value={form.numberOfEmployees}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                name="operatingRegion"
                placeholder="Operating Region"
                value={form.operatingRegion}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="notes"
                placeholder="Additional Notes"
                value={form.notes}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-full"
                rows={3}
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mt-4"
          >
            Create Profile
          </button>
        </form>
      </div>
    </div>
  );
}