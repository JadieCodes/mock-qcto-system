import React, { useState } from 'react';
import type {
  ApplicationForm,
  ApplicationType,
  ApplicantInfo,
  Region,
  AccreditationDocument
} from '@/types';

const applicationTypes: { value: ApplicationType; label: string }[] = [
  { value: 'OC', label: 'OC - Occupational Certificate' },
  { value: 'SP', label: 'SP - Skills Programme' },
  { value: 'AC', label: 'AC - Apprenticeship Certificate' },
  { value: 'N4-N6', label: 'N4 – N6' },
  { value: 'Non-accredited venue approval', label: 'Non-accredited venue approval' },
  { value: 'Temporary training approval', label: 'Temporary training approval' },
];

const regions: Region[] = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Mpumalanga',
  'Limpopo',
  'North West',
  'Northern Cape'
];

interface ApplicationRegistrationProps {
  onSave?: (applicationData: ApplicationForm) => void;
  onCancel?: () => void; 
}

type ValidationCheck = {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'passed' | 'failed';
  message?: string;
};

const initialFormData: ApplicationForm = {
  applicantInfo: {
    fullName: '',
    idNumber: '',
    email: '',
    phone: '',
    companyName: '',
    companyRegistration: '',
    organisationName: '',
    trainingLocation: '',
    region: 'Gauteng',
  },
  qualification: '',
  applicationType: 'OC',
  documents: [],
};

export default function ApplicationRegistration({ onSave, onCancel }: ApplicationRegistrationProps) {
  const [formData, setFormData] = useState<ApplicationForm>(initialFormData);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isUploadingApplicationForm, setIsUploadingApplicationForm] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ApplicationForm | 'applicantInfo' | 'applicationFormUpload', string>>
  >({});

  const [applicationFormValidationStatus, setApplicationFormValidationStatus] =
    useState<'idle' | 'processing' | 'passed' | 'failed'>('idle');
  const [applicationFormValidationError, setApplicationFormValidationError] = useState('');
  const [applicationFormValidationProgress, setApplicationFormValidationProgress] = useState(0);
  const [applicationFormChecks, setApplicationFormChecks] = useState<ValidationCheck[]>([]);
  const [applicationFormTestMode, setApplicationFormTestMode] = useState<'pass' | 'fail'>('pass');

  const handleInputChange = (
    section: 'applicantInfo' | 'qualification' | 'applicationType',
    field: keyof ApplicantInfo | 'qualification' | 'applicationType',
    value: string
  ) => {
    if (section === 'applicantInfo') {
      setFormData((prev) => ({
        ...prev,
        applicantInfo: {
          ...prev.applicantInfo,
          [field as keyof ApplicantInfo]: value
        }
      }));
    } else if (section === 'qualification') {
      setFormData((prev) => ({
        ...prev,
        qualification: value
      }));
    } else if (section === 'applicationType') {
      setFormData((prev) => ({
        ...prev,
        applicationType: value as ApplicationType
      }));
    }
  };

  const resetApplicationFormValidation = () => {
    setApplicationFormValidationStatus('idle');
    setApplicationFormValidationError('');
    setApplicationFormValidationProgress(0);
    setApplicationFormChecks([]);
  };

  const runApplicationFormValidation = async (): Promise<{
    passed: boolean;
    checks: ValidationCheck[];
    error: string;
  }> => {
    const checks: ValidationCheck[] = [
      {
        id: 'file_read',
        label: 'Reading uploaded application form...',
        status: 'pending'
      },
      {
        id: 'format_check',
        label: 'Checking file format and completeness...',
        status: 'pending'
      },
      {
        id: 'content_check',
        label: 'Checking document content against application requirements...',
        status: 'pending'
      },
    ];

    setApplicationFormChecks(checks);
    setApplicationFormValidationStatus('processing');
    setApplicationFormValidationError('');
    setApplicationFormValidationProgress(0);

    const shouldPass = applicationFormTestMode === 'pass';
    const updatedChecks = [...checks];

    updatedChecks[0].status = 'processing';
    setApplicationFormChecks([...updatedChecks]);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setApplicationFormValidationProgress(30);

    if (!shouldPass) {
      updatedChecks[0].status = 'failed';
      updatedChecks[0].message = 'The uploaded file could not be validated correctly.';
      setApplicationFormChecks([...updatedChecks]);
      setApplicationFormValidationStatus('failed');
      const error = 'Application form validation failed at file read stage.';
      setApplicationFormValidationError(error);
      return { passed: false, checks: [...updatedChecks], error };
    }

    updatedChecks[0].status = 'passed';
    updatedChecks[1].status = 'processing';
    setApplicationFormChecks([...updatedChecks]);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setApplicationFormValidationProgress(65);

    if (!shouldPass) {
      updatedChecks[1].status = 'failed';
      updatedChecks[1].message = 'Required sections appear incomplete or invalid.';
      setApplicationFormChecks([...updatedChecks]);
      setApplicationFormValidationStatus('failed');
      const error = 'The uploaded application form format/content failed validation.';
      setApplicationFormValidationError(error);
      return { passed: false, checks: [...updatedChecks], error };
    }

    updatedChecks[1].status = 'passed';
    updatedChecks[2].status = 'processing';
    setApplicationFormChecks([...updatedChecks]);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setApplicationFormValidationProgress(100);

    if (!shouldPass) {
      updatedChecks[2].status = 'failed';
      updatedChecks[2].message = 'Document content does not meet validation requirements.';
      setApplicationFormChecks([...updatedChecks]);
      setApplicationFormValidationStatus('failed');
      const error = 'Application form content validation failed.';
      setApplicationFormValidationError(error);
      return { passed: false, checks: [...updatedChecks], error };
    }

    updatedChecks[2].status = 'passed';
    setApplicationFormChecks([...updatedChecks]);
    setApplicationFormValidationStatus('passed');

    return {
      passed: true,
      checks: [...updatedChecks],
      error: ''
    };
  };

  const handleApplicationFormUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploadingApplicationForm(true);
    resetApplicationFormValidation();

    const reader = new FileReader();

    reader.onload = async () => {
      const validationResult = await runApplicationFormValidation();

      const uploadedDoc: AccreditationDocument = {
        id: `DOC-${Date.now()}`,
        type: 'application_form',
        name: file.name,
        fileUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        verified: false,
        validationStatus: validationResult.passed ? 'passed' : 'failed',
        validationError: validationResult.error,
        validationChecks: validationResult.checks,
        reviewDecision: 'pending',
      } as any;

      setFormData((prev) => {
        const otherDocs = (prev.documents || []).filter(
          (doc) => doc.type !== 'application_form'
        );

        return {
          ...prev,
          documents: [...otherDocs, uploadedDoc]
        };
      });

      setErrors((prev) => ({
        ...prev,
        applicationFormUpload: ''
      }));

      setIsUploadingApplicationForm(false);
    };

    reader.onerror = () => {
      console.error('Failed to read uploaded file');
      setApplicationFormValidationStatus('failed');
      setApplicationFormValidationError('Failed to read uploaded file.');
      setIsUploadingApplicationForm(false);
    };

    reader.readAsDataURL(file);
  };

  const removeApplicationForm = () => {
    setFormData((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter(
        (doc) => doc.type !== 'application_form'
      )
    }));
    resetApplicationFormValidation();
  };

  const getUploadedApplicationForm = () => {
    return (formData.documents || []).find(
      (doc) => doc.type === 'application_form'
    ) as (AccreditationDocument & {
      validationStatus?: 'passed' | 'failed';
      validationError?: string;
      validationChecks?: ValidationCheck[];
      reviewDecision?: 'pending' | 'approved' | 'rejected';
    }) | undefined;
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof ApplicationForm | 'applicantInfo' | 'applicationFormUpload', string>> = {};
    const {
      fullName,
      idNumber,
      email,
      phone,
      companyName,
      organisationName,
      trainingLocation,
      region
    } = formData.applicantInfo;

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
    const newErrors: Partial<Record<keyof ApplicationForm | 'applicantInfo' | 'applicationFormUpload', string>> = {};

    if (!formData.qualification.trim()) newErrors.qualification = 'Qualification is required';
    if (!formData.applicationType) newErrors.applicationType = 'Application type is required';

    const applicationFormDoc = (formData.documents || []).find(
      (doc) => doc.type === 'application_form'
    ) as any;

    if (!applicationFormDoc) {
      newErrors.applicationFormUpload = 'Please upload the application form';
    } else if (applicationFormDoc.validationStatus !== 'passed') {
      newErrors.applicationFormUpload = 'The uploaded application form must pass validation before submission';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (): void => {
    if (isUploadingApplicationForm) {
      alert('Please wait for the application form to finish uploading.');
      return;
    }

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
    const applicationWithId: ApplicationForm = {
      ...formData,
      id: `APP-${Date.now()}`,
      applicationId: `APP-${Date.now()}`,
      submittedAt: new Date().toISOString()
    };

    console.log('Application form submitted:', applicationWithId);

    alert('Application form submitted successfully! You will be notified of the initial review outcome.');

    if (onSave) {
      onSave(applicationWithId);
    }

    setFormData(initialFormData);
    setCurrentStep(1);
    resetApplicationFormValidation();
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

  const renderStep2 = () => {
    const uploadedApplicationForm = getUploadedApplicationForm();

    return (
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

        <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between gap-4 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload Application Form *
            </label>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Validation Test:</label>
              <select
                value={applicationFormTestMode}
                onChange={(e) => setApplicationFormTestMode(e.target.value as 'pass' | 'fail')}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </div>
          </div>

          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => handleApplicationFormUpload(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0 file:text-sm file:font-medium
                       file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />

          <p className="mt-2 text-xs text-gray-500">
            Upload the actual completed application form. This will be saved with the application
            and can be viewed later in the Documents tab.
          </p>

          {isUploadingApplicationForm && (
            <p className="mt-2 text-sm text-blue-600">Uploading application form...</p>
          )}

          {uploadedApplicationForm && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-green-800">
                  {uploadedApplicationForm.name}
                </p>
                <p className="text-xs text-green-700">
                  Uploaded successfully
                </p>
              </div>

              <button
                type="button"
                onClick={removeApplicationForm}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}

          {errors.applicationFormUpload && (
            <p className="mt-2 text-sm text-red-600">{errors.applicationFormUpload}</p>
          )}

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800">Document Upload Validation</h4>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  applicationFormValidationStatus === 'passed'
                    ? 'bg-green-100 text-green-700'
                    : applicationFormValidationStatus === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : applicationFormValidationStatus === 'processing'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {applicationFormValidationStatus === 'idle'
                  ? 'Waiting'
                  : applicationFormValidationStatus}
              </span>
            </div>

            {applicationFormValidationStatus === 'idle' && (
              <p className="text-sm text-gray-500">
                Validation will run automatically after the application form is uploaded.
              </p>
            )}

            {applicationFormValidationStatus === 'processing' && (
              <div className="space-y-3">
                <p className="text-sm text-blue-600">Validating uploaded application form...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${applicationFormValidationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {applicationFormChecks.length > 0 && (
              <div className="space-y-2 mt-3">
                {applicationFormChecks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between p-2 rounded border border-gray-200"
                  >
                    <div>
                      <span className="text-sm text-gray-700">{check.label}</span>
                      {check.message && (
                        <p className="text-xs text-gray-500 mt-1">{check.message}</p>
                      )}
                    </div>

                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        check.status === 'passed'
                          ? 'bg-green-100 text-green-700'
                          : check.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : check.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {applicationFormValidationStatus === 'failed' && applicationFormValidationError && (
              <p className="mt-3 text-sm text-red-600">{applicationFormValidationError}</p>
            )}

            {applicationFormValidationStatus === 'passed' && (
              <p className="mt-3 text-sm text-green-600">
                Application form passed validation and is ready for internal review.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Accreditation Application</h2>
        <p className="text-gray-600">
          Complete the form below to submit your accreditation application
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2
              ${currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}
            >
              1
            </div>
            <span className="ml-2 text-sm font-medium">Organisation Details</span>
          </div>

          <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>

          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2
              ${currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}
            >
              2
            </div>
            <span className="ml-2 text-sm font-medium">Application Details</span>
          </div>
        </div>
      </div>

      {errors.applicantInfo && currentStep === 1 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.applicantInfo}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleNext();
        }}
      >
        {currentStep === 1 ? renderStep1() : renderStep2()}

<div className="flex justify-between mt-6">
  <div>
    {currentStep === 2 && (
      <button
        type="button"
        onClick={handleBack}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
      >
        Back
      </button>
    )}
  </div>

  <div className="flex gap-2">
    {/* ✅ CANCEL BUTTON */}
    <button
      type="button"
      onClick={() => {
        if (window.confirm('Are you sure you want to cancel this application?')) {
          onCancel?.();
        }
      }}
      className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
    >
      Cancel
    </button>

    <button
      type="button"
      onClick={handleNext}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      {currentStep === 2 ? 'Submit' : 'Next'}
    </button>
  </div>
</div>
      </form>

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