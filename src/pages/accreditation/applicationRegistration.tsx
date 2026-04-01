import React, { useState } from 'react';
import type { ApplicationForm, ApplicationType, ApplicantInfo, Region } from '@/types';

const applicationTypes: { value: ApplicationType; label: string }[] = [
  { value: 'OC', label: 'OC - Occupational Certificate' },
  { value: 'SP', label: 'SP - Skills Programme' },
  { value: 'AC', label: 'AC - Apprenticeship Certificate' },
  { value: 'N4-N6', label: 'N4 – N6' },
  { value: 'Non-accredited venue approval', label: 'Non-accredited venue approval' },
  { value: 'Temporary training approval', label: 'Temporary training approval' },
];

const regions: Region[] = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
  'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape'
];

interface ApplicationRegistrationProps {
  onSave?: (applicationData: ApplicationForm) => void;
}

const initialFormData: ApplicationForm = {
  applicantInfo: {
    fullName: '',
    idNumber: '',
    email: '',
    phone: '',
    companyName: '',
    companyRegistration: '',
    organisationName: '', // New field
    trainingLocation: '', // New field
    region: 'Gauteng', // New field with default
  },
  qualification: '',
  applicationType: 'OC',
};

export default function ApplicationRegistration({ onSave }: ApplicationRegistrationProps) {
  const [formData, setFormData] = useState<ApplicationForm>(initialFormData);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationForm | 'applicantInfo', string>>>({});

  const handleInputChange = (
    section: 'applicantInfo' | 'qualification' | 'applicationType', 
    field: keyof ApplicantInfo | 'qualification' | 'applicationType', 
    value: string
  ) => {
    if (section === 'applicantInfo') {
      setFormData((prev: ApplicationForm) => ({
        ...prev,
        applicantInfo: {
          ...prev.applicantInfo,
          [field as keyof ApplicantInfo]: value
        }
      }));
    } else if (section === 'qualification') {
      setFormData((prev: ApplicationForm) => ({
        ...prev,
        qualification: value
      }));
    } else if (section === 'applicationType') {
      setFormData((prev: ApplicationForm) => ({
        ...prev,
        applicationType: value as ApplicationType
      }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof ApplicationForm | 'applicantInfo', string>> = {};
    const { fullName, idNumber, email, phone, companyName, organisationName, trainingLocation, region } = formData.applicantInfo;
    
    if (!fullName.trim()) newErrors.applicantInfo = 'Full name is required';
    else if (!idNumber.trim()) newErrors.applicantInfo = 'ID/Passport number is required';
    else if (!email.trim()) newErrors.applicantInfo = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.applicantInfo = 'Email is invalid';
    else if (!phone.trim()) newErrors.applicantInfo = 'Phone number is required';
    else if (!companyName.trim()) newErrors.applicantInfo = 'Company name is required';
    else if (!organisationName.trim()) newErrors.applicantInfo = 'Organisation name is required';
    else if (!trainingLocation.trim()) newErrors.applicantInfo = 'Training location is required';
    else if (!region) newErrors.applicantInfo = 'Region is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof ApplicationForm | 'applicantInfo', string>> = {};
    
    if (!formData.qualification.trim()) newErrors.qualification = 'Qualification is required';
    if (!formData.applicationType) newErrors.applicationType = 'Application type is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (): void => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleBack = (): void => {
    setCurrentStep(1);
  };

 const handleSubmit = (): void => {
  // Generate application ID
  const applicationWithId = {
    ...formData,
    id: `APP-${Date.now()}`,
    submittedAt: new Date().toISOString()
  };
  
  console.log('Application form submitted:', applicationWithId);
  
  // Show success message
  alert('Application form submitted successfully! You will be notified of the initial review outcome.');
  
  // Call onSave callback with the form data
  if (onSave) {
    onSave(applicationWithId);
  }
  
  // Reset form
  setFormData(initialFormData);
  setCurrentStep(1);
};

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Organisation Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.applicantInfo.fullName}
            onChange={(e) => handleInputChange('applicantInfo', 'fullName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID/Passport Number *
          </label>
          <input
            type="text"
            value={formData.applicantInfo.idNumber}
            onChange={(e) => handleInputChange('applicantInfo', 'idNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.applicantInfo.email}
            onChange={(e) => handleInputChange('applicantInfo', 'email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.applicantInfo.phone}
            onChange={(e) => handleInputChange('applicantInfo', 'phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.applicantInfo.companyName}
            onChange={(e) => handleInputChange('applicantInfo', 'companyName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Registration Number
          </label>
          <input
            type="text"
            value={formData.applicantInfo.companyRegistration}
            onChange={(e) => handleInputChange('applicantInfo', 'companyRegistration', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* New fields */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organisation Name *
          </label>
          <input
            type="text"
            value={formData.applicantInfo.organisationName}
            onChange={(e) => handleInputChange('applicantInfo', 'organisationName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Training Location *
          </label>
          <input
            type="text"
            value={formData.applicantInfo.trainingLocation}
            onChange={(e) => handleInputChange('applicantInfo', 'trainingLocation', e.target.value)}
            placeholder="Physical address of training venue"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region *
          </label>
          <select
            value={formData.applicantInfo.region}
            onChange={(e) => handleInputChange('applicantInfo', 'region', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-700">Application Details</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Qualification Applying For *
        </label>
        <input
          type="text"
          value={formData.qualification}
          onChange={(e) => handleInputChange('qualification', 'qualification', e.target.value)}
          placeholder="e.g., Occupational Certificate: Electrician"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        {errors.qualification && (
          <p className="mt-1 text-sm text-red-600">{errors.qualification}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Application Type *
        </label>
        <select
          value={formData.applicationType}
          onChange={(e) => handleInputChange('applicationType', 'applicationType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select application type</option>
          {applicationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.applicationType && (
          <p className="mt-1 text-sm text-red-600">{errors.applicationType}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Accreditation Application</h2>
        <p className="text-gray-600">Complete the form below to submit your accreditation application</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
              ${currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Organisation Details</span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
              ${currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Application Details</span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errors.applicantInfo && currentStep === 1 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.applicantInfo}</p>
        </div>
      )}

      {/* Form Steps */}
      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        {currentStep === 1 ? renderStep1() : renderStep2()}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          {currentStep === 2 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${currentStep === 1 ? 'ml-auto' : ''}`}
          >
            {currentStep === 1 ? 'Next' : 'Submit Application'}
          </button>
        </div>
      </form>

      {/* Application Status Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">What happens next?</h4>
        <p className="text-sm text-gray-600">
          After submission, your application will be reviewed. You can track its status in your 
          Applicant Portfolio. You'll receive notifications about document uploads, site visits, 
          and the final outcome.
        </p>
      </div>
    </div>
  );
}