// components/qualifications/CyclePlanModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Upload,
  Edit,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import type { Application } from '@/types';

interface Phase {
  name: string;
  startDate: string;
  endDate: string;
  responsibleRole: string;
  status: 'pending' | 'in-progress' | 'completed';
  required?: boolean;
}

interface CyclePlan {
  id: number;
  title: string;
  qualificationCode: string;
  industry: string;
  nqfLevel: string;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'Published';
  phases: Phase[];
}

interface CyclePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: Partial<CyclePlan>) => void;
  onPhaseComplete?: (planId: number, phaseIndex: number, phaseData: Partial<Phase>) => void;
  plan: CyclePlan | null;
  application: Application | null;
  mode: 'create' | 'edit' | 'view';
}

const phaseOptions = [
  'Scoping',
  'Profile',
  'Curriculum Specification',
  'Knowledge & Practice',
  'Assessment Design',
  'Quality Assurance',
  'Accreditation',
  'Review'
];

const responsibleRoles = [
  'Curriculum Developer',
  'Subject Matter Expert',
  'Instructional Designer',
  'Assessment Specialist',
  'Quality Assurer',
  'Project Manager',
  'Industry Advisor',
  'Academic Board'
];

const industries = [
  'Information Technology',
  'Engineering',
  'Business Management',
  'Education',
  'Health Sciences',
  'Agriculture',
  'Hospitality',
  'Creative Arts'
];

const nqfLevels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function CyclePlanModal({ isOpen, onClose, onSave, onPhaseComplete, plan, application, mode }: CyclePlanModalProps) {
  const [formData, setFormData] = useState<Partial<CyclePlan>>({
    title: '',
    qualificationCode: '',
    industry: '',
    nqfLevel: '',
    startDate: '',
    endDate: '',
    status: 'Planning',
    phases: []
  });
  
  const [activeTab, setActiveTab] = useState<'details' | 'phases'>('details');

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    } else if (application) {
      // Pre-fill with application data for new cycle plan
      setFormData({
        title: application.qualification,
        qualificationCode: application.id,
        industry: '',
        nqfLevel: '',
        startDate: '',
        endDate: '',
        status: 'Planning',
        phases: [
          {
            name: 'Scoping',
            startDate: '',
            endDate: '',
            responsibleRole: 'Curriculum Developer',
            status: 'pending'
          },
          {
            name: 'Profile',
            startDate: '',
            endDate: '',
            responsibleRole: 'Subject Matter Expert',
            status: 'pending'
          },
          {
            name: 'Curriculum Specification',
            startDate: '',
            endDate: '',
            responsibleRole: 'Instructional Designer',
            status: 'pending'
          },
          {
            name: 'Knowledge & Practice',
            startDate: '',
            endDate: '',
            responsibleRole: 'Assessment Specialist',
            status: 'pending'
          }
        ]
      });
    } else {
      setFormData({
        title: '',
        qualificationCode: '',
        industry: '',
        nqfLevel: '',
        startDate: '',
        endDate: '',
        status: 'Planning',
        phases: []
      });
    }
  }, [plan, application]);

  const handleAddPhase = () => {
    setFormData({
      ...formData,
      phases: [
        ...(formData.phases || []),
        {
          name: phaseOptions[0],
          startDate: '',
          endDate: '',
          responsibleRole: responsibleRoles[0],
          status: 'pending'
        }
      ]
    });
  };

  const handleRemovePhase = (index: number) => {
    const phases = formData.phases || [];
    // Prevent removal of Final Verification phase if it exists and is required
    if (phases[index]?.name === 'Final Verification') {
      alert('Final Verification phase cannot be removed as it is required.');
      return;
    }
    setFormData({
      ...formData,
      phases: phases.filter((_, i) => i !== index)
    });
  };

  const handlePhaseChange = (index: number, field: keyof Phase, value: string) => {
    const updatedPhases = [...(formData.phases || [])];
    updatedPhases[index] = { ...updatedPhases[index], [field]: value };
    setFormData({ ...formData, phases: updatedPhases });
  };

  const handleSaveDraft = () => {
    onSave({ ...formData, status: 'Planning' });
  };

// In CyclePlanModal.tsx - Update the handlePublish function
const handlePublish = () => {
  // Get the current phases
  const phases = formData.phases || [];
  
  // Check if Final Verification phase exists (required)
  const hasFinalVerification = phases.some(p => p.name === 'Final Verification');
  
  let finalPhases = [...phases];
  
  // Add Final Verification only if it doesn't exist (as the last phase)
  if (!hasFinalVerification && finalPhases.length > 0) {
    // Get the last phase's end date to set a default start date
    const lastPhase = finalPhases[finalPhases.length - 1];
    const lastEndDate = lastPhase.endDate;
    
    // Calculate a default end date (3 months after start)
    let defaultEndDate = '';
    if (lastEndDate) {
      const date = new Date(lastEndDate);
      date.setMonth(date.getMonth() + 3);
      defaultEndDate = date.toISOString().split('T')[0];
    }
    
    finalPhases.push({
      name: 'Final Verification',
      startDate: lastEndDate || '',
      endDate: defaultEndDate,
      responsibleRole: 'Quality Assurer',
      status: 'pending',
      required: true
    });
  }
  
  // Save with all phases preserved
  onSave({ ...formData, phases: finalPhases, status: 'Published' });
};

  const handleUpdate = () => {
    onSave(formData);
  };

  if (!isOpen) return null;

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {isCreateMode && 'Create Cycle Plan'}
              {isEditMode && 'Edit Cycle Plan'}
              {isViewMode && 'Cycle Plan Details'}
            </h2>
            {formData.qualificationCode && (
              <p className="text-sm text-gray-500 mt-1">Qualification: {formData.title}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isViewMode && (
              <button
                onClick={handleSaveDraft}
                className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
            )}
            <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Qualification Details
            </button>
            <button
              onClick={() => setActiveTab('phases')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'phases' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Development Phases
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualification Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      disabled={isViewMode || !isCreateMode}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter qualification name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualification Code / ID
                    </label>
                    <input
                      type="text"
                      value={formData.qualificationCode || ''}
                      disabled={true}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry / Sector <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.industry || ''}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      disabled={isViewMode}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select industry</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NQF Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.nqfLevel || ''}
                      onChange={(e) => setFormData({ ...formData, nqfLevel: e.target.value })}
                      disabled={isViewMode}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select NQF level</option>
                      {nqfLevels.map((level) => (
                        <option key={level} value={level}>Level {level}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.startDate || ''}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        disabled={isViewMode}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.endDate || ''}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        disabled={isViewMode}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status || 'Planning'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      disabled={isViewMode || (plan?.status === 'Published')}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                </div>
              </div>

              {formData.phases && formData.phases.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Phase Summary</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Phases</p>
                      <p className="text-lg font-bold">{formData.phases.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Completed</p>
                      <p className="text-lg font-bold text-green-600">
                        {formData.phases.filter(p => p.status === 'completed').length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">In Progress</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formData.phases.filter(p => p.status === 'in-progress').length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pending</p>
                      <p className="text-lg font-bold text-gray-600">
                        {formData.phases.filter(p => p.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'phases' && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsible Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      {!isViewMode && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(formData.phases || []).map((phase, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">Phase {index + 1}</td>
                        <td className="px-4 py-3">
                          {isViewMode ? (
                            <span className="text-sm">
                              {phase.name}
                              {phase.name === 'Final Verification' && (
                                <span className="ml-2 text-xs text-purple-600">(Required)</span>
                              )}
                            </span>
                          ) : (
                            <select
                              value={phase.name}
                              onChange={(e) => handlePhaseChange(index, 'name', e.target.value)}
                              className="border rounded px-2 py-1 text-sm w-full"
                              disabled={phase.name === 'Final Verification' || (plan?.status === 'Published')}
                            >
                              {phaseOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                              <option value="Final Verification">Final Verification</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isViewMode ? (
                            <span className="text-sm">{phase.startDate}</span>
                          ) : (
                            <input
                              type="date"
                              value={phase.startDate}
                              onChange={(e) => handlePhaseChange(index, 'startDate', e.target.value)}
                              className="border rounded px-2 py-1 text-sm w-full"
                              disabled={plan?.status === 'Published'}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isViewMode ? (
                            <span className="text-sm">{phase.endDate}</span>
                          ) : (
                            <input
                              type="date"
                              value={phase.endDate}
                              onChange={(e) => handlePhaseChange(index, 'endDate', e.target.value)}
                              className="border rounded px-2 py-1 text-sm w-full"
                              disabled={plan?.status === 'Published'}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isViewMode ? (
                            <span className="text-sm">{phase.responsibleRole}</span>
                          ) : (
                            <select
                              value={phase.responsibleRole}
                              onChange={(e) => handlePhaseChange(index, 'responsibleRole', e.target.value)}
                              className="border rounded px-2 py-1 text-sm w-full"
                              disabled={plan?.status === 'Published'}
                            >
                              {responsibleRoles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isViewMode ? (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                              phase.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {phase.status}
                            </span>
                          ) : (
                            <select
                              value={phase.status}
                              onChange={(e) => handlePhaseChange(index, 'status', e.target.value as any)}
                              className="border rounded px-2 py-1 text-sm"
                              disabled={plan?.status === 'Published'}
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          )}
                        </td>
                        {!isViewMode && plan?.status !== 'Published' && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRemovePhase(index)}
                              className="text-red-600 hover:text-red-800"
                              disabled={phase.name === 'Final Verification'}
                              title={phase.name === 'Final Verification' ? 'Cannot remove required phase' : 'Remove phase'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isViewMode && plan?.status !== 'Published' && (
                <button
                  onClick={handleAddPhase}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Phase
                </button>
              )}

              {(!formData.phases || formData.phases.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No phases defined yet</p>
                  {!isViewMode && (
                    <button onClick={handleAddPhase} className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                      Add your first phase
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex gap-2">
            {!isViewMode && plan?.status !== 'Published' && (
              <>
                <button
                  onClick={handleSaveDraft}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-white flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Publish / Finalize
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isEditMode && plan?.status !== 'Published' && (
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Update Plan
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}