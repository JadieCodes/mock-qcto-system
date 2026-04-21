import { useState } from 'react';
import { CertExternalLayout } from '@/components/CertExternalLayout';
import ProfileIntake from '@/users/dashboardTabs/ProfileIntake';
import CertificationExternalCorrections from '@/users/dashboardTabs/CertificationExternalCorrections';

export default function CertificationDomain() {
  const [activeTab, setActiveTab] = useState('submissions');

  const renderContent = () => {
    switch (activeTab) {
      case 'submissions':
        return <ProfileIntake />;
      case 'corrections':
        return <CertificationExternalCorrections />;
      default:
        return <ProfileIntake />;
    }
  };

  return (
    <CertExternalLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </CertExternalLayout>
  );
}