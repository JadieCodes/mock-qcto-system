import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Camera, 
  FileText, 
  Download,
  Upload,
  Image,
  Trash2,
  Plus,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  User,
  Shield,
  AlertTriangle,
  Eye
} from 'lucide-react';
import type { ApplicationStatus, SiteVisitStatus, SiteVisitReport, SiteVisitEvidence, SiteVisitChecklistItem } from '@/types';



export interface SiteVisitEvaluationToolProps {
  application: ApplicationStatus;
  userRole: 'qp' | 'verifier';
  userName: string;
  initialReport?: SiteVisitReport; // Add this line
  onSave: (report: SiteVisitReport) => void;
  onComplete: (report: SiteVisitReport) => void;
  onCancel: () => void;
}

// QP-specific checklist
// QP-specific checklist
const qpChecklistItems = [
  { id: 'qp1', criteria: 'Training facilities meet required standards' },
  { id: 'qp2', criteria: 'Equipment and resources are adequate and in good condition' },
  { id: 'qp3', criteria: 'Staff qualifications are verified and appropriate' },
  { id: 'qp4', criteria: 'Learning materials are comprehensive and up-to-date' },
  { id: 'qp5', criteria: 'Assessment practices meet quality requirements' },
  { id: 'qp6', criteria: 'Learner support systems are in place' },
  { id: 'qp7', criteria: 'Health and safety measures are adequate' },
  { id: 'qp8', criteria: 'Records management system is effective' },
];

// Verifier-specific checklist
const verifierChecklistItems = [
  { id: 'ver1', criteria: 'Learner records are complete and accurate' },
  { id: 'ver2', criteria: 'Assessment evidence is authentic and valid' },
  { id: 'ver3', criteria: 'Moderation processes are followed' },
  { id: 'ver4', criteria: 'Results are correctly captured' },
  { id: 'ver5', criteria: 'Certification requirements are met' },
];

export default function SiteVisitEvaluationTool({
  application,
  userRole,
  userName,
  onSave,
  onComplete,
  onCancel
}: SiteVisitEvaluationToolProps) {
  const [checklist, setChecklist] = useState<SiteVisitChecklistItem[]>(
    (userRole === 'qp' ? qpChecklistItems : verifierChecklistItems).map(item => ({
      id: item.id,
      criteria: item.criteria,
      isMet: false,
      comments: '',
      evidenceIds: []
    }))
  );
  
  const [evidence, setEvidence] = useState<SiteVisitEvidence[]>([]);
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [riskProfile, setRiskProfile] = useState<'low' | 'medium' | 'high'>('medium');
  const [outcome, setOutcome] = useState<'compliant' | 'partially_compliant' | 'non_compliant'>('compliant');
  const [dragActive, setDragActive] = useState(false);
  const [uploadDescription, setUploadDescription] = useState('');

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
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    files.forEach(file => {
      const newEvidence: SiteVisitEvidence = {
        id: `evidence-${Date.now()}-${Math.random()}`,
        type: file.type.startsWith('image/') ? 'photo' : 'document',
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        description: uploadDescription || undefined,
      };
      setEvidence(prev => [...prev, newEvidence]);
    });
    setUploadDescription('');
  };

  const removeEvidence = (id: string) => {
    setEvidence(prev => prev.filter(e => e.id !== id));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, isMet: !item.isMet } : item
    ));
  };

  const updateChecklistComment = (id: string, comment: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, comments: comment } : item
    ));
  };

  const calculateCompletion = () => {
    const totalItems = checklist.length;
    const completedItems = checklist.filter(item => item.isMet).length;
    return Math.round((completedItems / totalItems) * 100);
  };

  const generateReport = (): SiteVisitReport => {
    return {
      id: `report-${Date.now()}`,
      applicationId: application.id,
      conductedBy: userName,
      conductedByRole: userRole,
      conductedAt: new Date().toISOString(),
      checklist,
      evidence,
      summary,
      recommendations,
      ...(userRole === 'qp' && {
        riskProfile,
        qualification: application.applicationData?.qualification,
        region: application.applicationData?.applicantInfo.region,
      }),
      outcome,
    };
  };

  const handleSave = () => {
    const report = generateReport();
    onSave(report);
  };

  const handleComplete = () => {
    const report = generateReport();
    report.completedAt = new Date().toISOString();
    onComplete(report);
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Site Visit Evaluation</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Completion:</span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${calculateCompletion()}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">{calculateCompletion()}%</span>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Application ID</p>
            <p className="font-medium">{application.applicationId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Organisation</p>
            <p className="font-medium">{application.applicationData?.applicantInfo.organisationName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Qualification</p>
            <p className="font-medium">{application.applicationData?.qualification}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Region</p>
            <p className="font-medium">{application.applicationData?.applicantInfo.region}</p>
          </div>
          {userRole === 'qp' && (
            <div className="col-span-2 md:col-span-1">
              <p className="text-xs text-gray-500">Risk Profile</p>
              <select
                value={riskProfile}
                onChange={(e) => setRiskProfile(e.target.value as 'low' | 'medium' | 'high')}
                className="mt-1 text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Checklist Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700">Evaluation Checklist</h4>
        </div>
        <div className="p-4 space-y-3">
          {checklist.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border ${
                        item.isMet 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {item.isMet && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <span className="text-sm text-gray-700">{item.criteria}</span>
                  </div>
                  
                  <div className="mt-2 ml-8">
                    <textarea
                      rows={2}
                      value={item.comments || ''}
                      onChange={(e) => updateChecklistComment(item.id, e.target.value)}
                      placeholder="Add comments or findings..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700">Evidence Collection</h4>
        </div>
        <div className="p-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop photos or documents, or{' '}
              <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                browse
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </p>
            <p className="text-xs text-gray-500">Photos, PDF, DOC up to 10MB each</p>
            
            <div className="mt-3">
              <input
                type="text"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Add description for uploads..."
                className="w-full max-w-md mx-auto px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Evidence List */}
          {evidence.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Uploaded Evidence</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {evidence.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center space-x-2">
                      {item.type === 'photo' ? (
                        <Image className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-purple-500" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-gray-700">{item.fileName}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => removeEvidence(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary and Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700">Findings & Recommendations</h4>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Executive Summary
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Provide a summary of your findings..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommendations
            </label>
            <textarea
              rows={3}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Provide recommendations for improvement..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="compliant">Compliant</option>
              <option value="partially_compliant">Partially Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          Save Draft
        </button>
        <button
          onClick={handleComplete}
          disabled={calculateCompletion() < 100}
          className={`px-4 py-2 text-sm rounded-md ${
            calculateCompletion() === 100
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Complete & Generate Report
        </button>
      </div>
    </div>
  );
}