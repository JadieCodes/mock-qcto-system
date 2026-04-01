// components/modals/PublicSubmissionsModal.tsx
import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Eye,
  User,
  Calendar,
  MessageSquare,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface PublicSubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any | null;
}

export default function PublicSubmissionsModal({ isOpen, onClose, submission }: PublicSubmissionsModalProps) {
  const [resolutionFile, setResolutionFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !submission) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResolutionFile(file.name);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      // Close modal after submission
      onClose();
    }, 1500);
  };

  // Mock public input data based on submission type
  const getPublicInputContent = () => {
    switch(submission.type) {
      case 'comment':
        return {
          category: 'Curriculum Content',
          section: 'Module 3: Advanced Project Management',
          summary: 'The submitter recommends including more practical case studies in Module 3, particularly focusing on agile project management methodologies in the South African context.',
          suggestions: [
            'Add case study on agile transformation in SA financial sector',
            'Include practical exercises using local project management tools',
            'Reference SA-specific project management regulations'
          ]
        };
      case 'objection':
        return {
          category: 'Qualification Design',
          section: 'NQF Level Alignment',
          summary: 'The submitter objects to the proposed NQF Level 7 designation, arguing that the content is more appropriate for Level 6 based on similar international qualifications.',
          suggestions: [
            'Reconsider NQF level alignment',
            'Provide more evidence for Level 7 designation',
            'Benchmark against similar qualifications in other countries'
          ]
        };
      case 'support':
        return {
          category: 'Industry Requirements',
          section: 'Workplace Experience',
          summary: 'Industry association supports the qualification but recommends increasing workplace experience hours from 120 to 200 hours to meet industry standards.',
          suggestions: [
            'Increase workplace experience hours',
            'Add more industry-specific case studies',
            'Include emerging technologies in curriculum'
          ]
        };
      default:
        return {
          category: 'General Feedback',
          section: 'Overall Qualification',
          summary: 'General feedback on the qualification structure and content.',
          suggestions: ['Review qualification outcomes', 'Consider industry alignment']
        };
    }
  };

  const publicInput = getPublicInputContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold">Public Submission Details</h2>
            <p className="text-sm text-gray-500 mt-1">Reference: {submission.referenceNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-blue-50 border-b flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            submission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            submission.status === 'reviewed' ? 'bg-purple-100 text-purple-700' :
            'bg-green-100 text-green-700'
          }`}>
            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
          </span>
          <span className="text-sm text-gray-500 ml-4">Type: {submission.type}</span>
        </div>

        {/* Main Content - Simplified to only show Public Input */}
        <div className="p-6">
          {/* Submitter Information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Submitter Information</span>
              </div>
              <p className="text-sm"><span className="text-gray-500">Name:</span> {submission.submitterName}</p>
              <p className="text-sm"><span className="text-gray-500">Email:</span> {submission.submitterName.toLowerCase().replace(' ', '.')}@email.com</p>
              <p className="text-sm"><span className="text-gray-500">Organization:</span> {
                submission.submitterName === 'Tech Industry Association' ? 'Tech Industry Association' : 'Independent Consultant'
              }</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Submission Details</span>
              </div>
              <p className="text-sm"><span className="text-gray-500">Date:</span> {submission.submissionDate}</p>
              <p className="text-sm"><span className="text-gray-500">Qualification:</span> {submission.qualificationTitle}</p>
            </div>
          </div>

          {/* Public Input Section - Main Focus */}
          <div className="border-2 border-blue-200 rounded-lg p-6 mb-6 bg-blue-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
              <MessageSquare className="w-5 h-5" />
              Public Input / Feedback
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Input Category</label>
                <p className="text-sm bg-white p-3 rounded-lg border mt-1">{publicInput.category}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Specific Section</label>
                <p className="text-sm bg-white p-3 rounded-lg border mt-1">{publicInput.section}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Feedback Summary</label>
                <div className="bg-white p-4 rounded-lg border mt-1">
                  <p className="text-sm">{publicInput.summary}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Suggestions / Recommendations</label>
                <div className="bg-white p-4 rounded-lg border mt-1">
                  <ul className="list-disc list-inside space-y-1">
                    {publicInput.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Attached Documents */}
          <div className="border rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Attached Documents
            </h3>
            <div className="space-y-2">
              {submission.documents.submissionLetter && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{submission.documents.submissionLetter}</span>
                  </div>
                  <button className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              )}
              {submission.documents.supportingDocs && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{submission.documents.supportingDocs}</span>
                  </div>
                  <button className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Upload Section */}
          <div className="border-2 border-dashed rounded-lg p-6 bg-gray-50">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-600" />
              Upload Resolution Document
            </h3>
            
            <div className="space-y-4">
              {/* File Upload Area */}
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-white">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resolution-upload"
                />
                <label
                  htmlFor="resolution-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {resolutionFile || 'Click to upload resolution document'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX up to 10MB
                  </span>
                </label>
              </div>

              {/* Resolution Text Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Notes / Response
                </label>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm"
                  rows={4}
                  placeholder="Enter your response to this public submission..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !resolutionFile}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                    isSubmitting || !resolutionFile
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Submit Resolution
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>

              {/* Status Message */}
              {resolutionFile && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-2 rounded">
                  <CheckCircle className="w-4 h-4" />
                  <span>File ready: {resolutionFile}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-lg text-sm hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}