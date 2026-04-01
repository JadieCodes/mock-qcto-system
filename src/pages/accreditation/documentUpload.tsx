import React, { useState } from 'react';
import type { AccreditationDocumentType, AccreditationDocument } from '@/types';

interface DocumentUploadProps {
  applicationId: string;
  documents?: AccreditationDocument[];
  onUpload: (files: File[], type: AccreditationDocumentType) => void; // For regular documents
  onPaymentUpload?: (files: File[]) => void; // New prop for payment uploads
  onNext: () => void;
  onBack: () => void;
  isPaymentUpload?: boolean;
}

// Document types for initial document upload (after initial approval)
const initialDocumentTypes: { value: AccreditationDocumentType; label: string; required: boolean }[] = [
  { value: 'company_registration', label: 'Company Registration', required: true },
  { value: 'qms_documents', label: 'QMS Documents', required: true },
  { value: 'training_material', label: 'Training Material', required: true },
  { value: 'staff_details', label: 'Staff Details', required: true },
  { value: 'venue_details', label: 'Venue Details', required: true },
  // proof_of_payment is NOT included here
];

// Document types for payment upload
const paymentDocumentTypes: { value: AccreditationDocumentType; label: string; required: boolean }[] = [
  { value: 'proof_of_payment', label: 'Proof of Payment', required: true },
];

export default function DocumentUpload({ 
  applicationId, 
  documents = [], 
  onUpload, 
  onPaymentUpload,
  onNext, 
  onBack,
  isPaymentUpload = false 
}: DocumentUploadProps) {
  const documentTypes = isPaymentUpload ? paymentDocumentTypes : initialDocumentTypes;
  
  const [selectedType, setSelectedType] = useState<AccreditationDocumentType>(
    isPaymentUpload ? 'proof_of_payment' : documentTypes[0]?.value || 'company_registration'
  );
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleUpload = () => {
    if (uploadedFiles.length > 0) {
      if (isPaymentUpload && onPaymentUpload) {
        // For payment upload, call the payment-specific handler
        onPaymentUpload(uploadedFiles);
      } else {
        // For regular document upload, call the regular handler with the selected type
        onUpload(uploadedFiles, selectedType);
      }
      setUploadedFiles([]);
    }
  };

  const handleSubmit = () => {
    if (isPaymentUpload) {
      // For payment upload, we've already uploaded via handleUpload
      // Now just call onNext to proceed
      onNext();
    } else {
      // For regular document upload, call onNext to submit all documents
      onNext();
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getDocumentStatus = (type: AccreditationDocumentType) => {
    const hasDocument = documents.some(doc => doc.type === type);
    return hasDocument ? 'uploaded' : 'pending';
  };

  const allRequiredUploaded = isPaymentUpload 
    ? documents.some(doc => doc.type === 'proof_of_payment')
    : documentTypes
        .filter(dt => dt.required)
        .every(dt => documents.some(doc => doc.type === dt.value));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isPaymentUpload ? 'Upload Proof of Payment' : 'Upload Required Documents'}
        </h2>
        <p className="text-gray-600">Application ID: {applicationId}</p>
        {isPaymentUpload ? (
          <p className="text-sm text-yellow-600 mt-2">
            Please upload your proof of payment to complete the application process.
          </p>
        ) : (
          <p className="text-sm text-blue-600 mt-2">
            Please upload all required documents for final review.
          </p>
        )}
      </div>

      {/* Document Checklist - Only show for regular document upload */}
      {!isPaymentUpload && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Required Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documentTypes.map((dt) => (
              <div key={dt.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    getDocumentStatus(dt.value) === 'uploaded' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></span>
                  <span className="text-sm text-gray-700">{dt.label}</span>
                  {dt.required && <span className="text-xs text-red-500 ml-1">*</span>}
                </div>
                {getDocumentStatus(dt.value) === 'uploaded' ? (
                  <span className="text-xs text-green-600">Uploaded</span>
                ) : (
                  <button
                    onClick={() => setSelectedType(dt.value)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Upload
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          {isPaymentUpload ? 'Upload Proof of Payment' : 'Upload Files'}
        </h3>
        
        {!isPaymentUpload && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Document Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as AccreditationDocumentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {documentTypes.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label} {dt.required ? '(Required)' : '(Optional)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-600">
            Drag and drop files here, or{' '}
            <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
              browse
              <input
                type="file"
                multiple={!isPaymentUpload}
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            PDF, DOC, DOCX, JPG, PNG up to 10MB each
          </p>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Files to upload:</h4>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleUpload}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Upload Selected Files
            </button>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {isPaymentUpload ? 'Uploaded Proof of Payment' : 'Uploaded Documents'}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {documentTypes.find(dt => dt.value === doc.type)?.label || doc.type}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-xs text-gray-400">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!allRequiredUploaded}
          className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            allRequiredUploaded 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isPaymentUpload ? 'Submit Payment' : 'Submit Documents'}
        </button>
      </div>
    </div>
  );
}