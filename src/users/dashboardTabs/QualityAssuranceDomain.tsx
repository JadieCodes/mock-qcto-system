import React, { useState } from 'react';
import QAExternalSideBar from '@/components/QAExternalSideBar';
import ExternalLearnerEnrolment from '@/pages/QA/ExternalLearnerEnrolment';
import ExternalCurriculumImplementation from '@/pages/QA/ExternalCurriculumImplementation';
import ExternalSkillsProgrammes from '@/pages/QA/ExternalSkillsProgrammes';
import ExternalHistoricalQualifications from '@/pages/QA/ExternalHistoricalQualifications';

export default function QualityAssuranceDomain() {
  const [activeTab, setActiveTab] = useState('learnerEnrolment');

  const renderContent = () => {
    switch(activeTab) {
      case 'learnerEnrolment':
        return <ExternalLearnerEnrolment />;
      case 'curriculumImplementation':
        return <ExternalCurriculumImplementation />;
      case 'skillsProgrammes':
        return <ExternalSkillsProgrammes />;
      case 'historicalQualifications':
        return <ExternalHistoricalQualifications />;
      default:
        return <ExternalLearnerEnrolment />;
    }
  };

  return (
    <QAExternalSideBar 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </QAExternalSideBar>
  );
}