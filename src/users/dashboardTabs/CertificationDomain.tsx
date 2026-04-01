import ProfileIntake from '@/users/dashboardTabs/ProfileIntake';

export default function CertificationDomain() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Certification Domain</h2>
      <p>Manage submissions from profiles and department here.</p>

      {/* Render the Profile Intake form */}
      <ProfileIntake />
    </div>
  );
}
