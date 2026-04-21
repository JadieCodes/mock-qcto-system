import React, { useState } from 'react';
import { ExternalAssessmentSidemenu } from '@/components/ExternalAssessmentSidemenu';
import ExternalQasaAddendumSubmission from '@/pages/assessment/External/ExternalQasaAddendumSubmission';
import ExternalValidationOfFisa from '@/pages/assessment/External/ExternalValidationOfFisa';
import ExternalEisaRegistration from '@/pages/assessment/External/ExternalEisaRegistration';
import ExternalSiteVisitsAndMonitoring from '@/pages/assessment/External/ExternalSiteVisitsAndMonitoring';

export default function AssessmentDomain() {
  const [activeTab, setActiveTab] = useState('qasaAddendumSubmission');

  const renderContent = () => {
    switch (activeTab) {
      case 'qasaAddendumSubmission':
        return <ExternalQasaAddendumSubmission />;
      case 'validationOfFisa':
        return <ExternalValidationOfFisa />;
      case 'eisaRegistration':
        return <ExternalEisaRegistration />;
      case 'siteVisitsAndMonitoring':
        return <ExternalSiteVisitsAndMonitoring />;
      default:
        return <ExternalQasaAddendumSubmission />;
    }
  };

  return (
    <ExternalAssessmentSidemenu
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </ExternalAssessmentSidemenu>
  );
}