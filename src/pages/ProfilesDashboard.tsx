import { useEffect, useState } from "react";

interface Profile {
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
}

export default function ProfilesDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem("currentProfile");
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  if (!profile) {
    return (
      <div className="p-8">
        <p className="text-gray-500">No profile found. Please create one.</p>
      </div>
    );
  }

  const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-semibold mb-4 text-blue-700">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div>
      <p className="text-gray-600 font-medium">{label}</p>
      <p className="text-gray-800">{value || "-"}</p>
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Profile</h1>

      <InfoCard title="User Information">
        <InfoItem label="Full Name" value={profile.fullName} />
        <InfoItem label="Email" value={profile.email} />
      </InfoCard>

      <InfoCard title="Company Information">
        <InfoItem label="Company Name" value={profile.companyName} />
        <InfoItem label="Company Type" value={profile.companyType} />
        <InfoItem label="Registration Number" value={profile.registrationNumber} />
        <InfoItem label="VAT Number" value={profile.vatNumber} />
        <InfoItem label="Industry/Sector" value={profile.industry} />
      </InfoCard>

      <InfoCard title="SETA Information">
        <InfoItem label="SETA" value={profile.seta} />
      </InfoCard>

      <InfoCard title="Contact Information">
        <InfoItem label="Primary Contact" value={profile.primaryContact} />
        <InfoItem label="Contact Email" value={profile.contactEmail} />
        <InfoItem label="Contact Phone" value={profile.contactPhone} />
        <InfoItem label="Address" value={profile.address} />
        <InfoItem label="Website" value={profile.website} />
      </InfoCard>

      <InfoCard title="Additional Information">
        <InfoItem label="Number of Employees" value={profile.numberOfEmployees} />
        <InfoItem label="Operating Region" value={profile.operatingRegion} />
        <InfoItem label="Notes" value={profile.notes} />
      </InfoCard>
    </div>
  );
}
