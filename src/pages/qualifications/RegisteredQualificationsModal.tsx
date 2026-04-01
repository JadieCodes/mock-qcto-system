// RegisteredQualificationsModal.tsx
import React, { useState } from 'react';

interface RegisteredQualificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  qualification: any | null;
}

export default function RegisteredQualificationsModal({ 
  isOpen, 
  onClose, 
  qualification 
}: RegisteredQualificationsModalProps) {
  const [activeTab, setActiveTab] = useState<'application' | 'qualifications' | 'publicInput' | 'registration'>('application');

  if (!isOpen || !qualification) return null;

  const tabs = [
    { id: 'application', label: 'Application' },
    { id: 'qualifications', label: 'Qualifications Development' },
    { id: 'publicInput', label: 'Public Input' },
    { id: 'registration', label: 'Registration Details' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Registered Qualification Details</h2>
            <p className="text-sm text-gray-500 mt-1">Code: {qualification.qualificationCode} | Reg: {qualification.registrationNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-3 px-4 font-medium whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'application' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500">Qualification Title</label>
                  <p className="font-medium">{qualification.qualificationTitle}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500">Qualification Code</label>
                  <p className="font-medium">{qualification.qualificationCode}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500">NQF Level</label>
                  <p className="font-medium">Level {qualification.nqfLevel}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500">Credits</label>
                  <p className="font-medium">{qualification.credits}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500">Application Date</label>
                  <p className="font-medium">2023-06-01</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <label className="text-sm text-gray-500">Approval Date</label>
                  <p className="font-medium">{qualification.registrationDate}</p>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-4">Application Documents</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Application Form.pdf</span>
                    <button className="text-blue-600 text-sm hover:underline">Download</button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Curriculum Vitae.pdf</span>
                    <button className="text-blue-600 text-sm hover:underline">Download</button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Supporting Documents.zip</span>
                    <button className="text-blue-600 text-sm hover:underline">Download</button>
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-4">Application Notes</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">
                    This qualification was submitted for registration on 2023-06-01. 
                    All required documentation was provided and verified. The application 
                    went through the standard review process with no major issues identified.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qualifications' && (
            <div className="space-y-6">
              <div className="border rounded p-4">
                <h3 className="font-medium mb-4">Qualification Development History</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 mt-1 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Initial Draft Developed</p>
                      <p className="text-sm text-gray-600">2023-01-15</p>
                      <p className="text-sm text-gray-500 mt-1">Curriculum framework and learning outcomes defined</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 mt-1 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Stakeholder Consultation</p>
                      <p className="text-sm text-gray-600">2023-02-20 to 2023-03-20</p>
                      <p className="text-sm text-gray-500 mt-1">Industry and academic feedback incorporated</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 mt-1 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Quality Assurance Review</p>
                      <p className="text-sm text-gray-600">2023-04-10</p>
                      <p className="text-sm text-gray-500 mt-1">Internal QA committee approval obtained</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 mt-1 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium">Public Comment Period</p>
                      <p className="text-sm text-gray-600">2023-05-01 to 2023-05-30</p>
                      <p className="text-sm text-gray-500 mt-1">15 submissions received and addressed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-4">Curriculum Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Purpose of Qualification</label>
                    <p className="text-sm mt-1">
                      To provide learners with advanced knowledge and skills in project management,
                      enabling them to manage complex projects in various sectors.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Learning Outcomes</label>
                    <ul className="list-disc list-inside text-sm mt-1">
                      <li>Develop and manage project portfolios</li>
                      <li>Apply advanced project management methodologies</li>
                      <li>Lead project teams and stakeholders</li>
                      <li>Manage project risks and quality</li>
                    </ul>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Modules/Subjects</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="text-sm">• Advanced Project Planning</div>
                      <div className="text-sm">• Risk Management</div>
                      <div className="text-sm">• Stakeholder Engagement</div>
                      <div className="text-sm">• Project Finance</div>
                      <div className="text-sm">• Quality Management</div>
                      <div className="text-sm">• Research Project</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'publicInput' && (
            <div className="space-y-6">
              <div className="border rounded p-4">
                <h3 className="font-medium mb-4">Public Submissions Summary</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Industry Body Submission</p>
                        <p className="text-xs text-gray-500">Received: 2023-05-15</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Addressed</span>
                    </div>
                    <p className="text-sm mt-2">
                      Recommended inclusion of digital transformation module to reflect current industry trends.
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Response:</span> Module added as elective in curriculum.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Academic Reviewer</p>
                        <p className="text-xs text-gray-500">Received: 2023-05-18</p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Addressed</span>
                    </div>
                    <p className="text-sm mt-2">
                      Suggested increasing research component to align with NQF level 7 requirements.
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Response:</span> Research project credits increased from 15 to 20.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Public Individual</p>
                        <p className="text-xs text-gray-500">Received: 2023-05-22</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Under Review</span>
                    </div>
                    <p className="text-sm mt-2">
                      Question about articulation pathways to other qualifications.
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Response:</span> Pending further investigation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-4">Public Input Analysis</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-600">15</p>
                    <p className="text-xs text-gray-600">Total Submissions</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-600">12</p>
                    <p className="text-xs text-gray-600">Addressed</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded">
                    <p className="text-2xl font-bold text-yellow-600">3</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'registration' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded p-4">
                  <h3 className="font-medium mb-3">Registration Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Registration Number</span>
                      <span className="text-sm font-medium">{qualification.registrationNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Registration Date</span>
                      <span className="text-sm font-medium">{qualification.registrationDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Expiry Date</span>
                      <span className="text-sm font-medium">{qualification.expiryDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className={`text-sm font-medium capitalize ${
                        qualification.status === 'active' ? 'text-green-600' :
                        qualification.status === 'expiring' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {qualification.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border rounded p-4">
                  <h3 className="font-medium mb-3">SAQA Decision</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Decision</span>
                      <span className="text-sm font-medium text-green-600">{qualification.saqaDecision}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Decision Date</span>
                      <span className="text-sm font-medium">2023-12-15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Review Committee</span>
                      <span className="text-sm font-medium">Qualifications Committee</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-3">Registration Conditions</h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <input type="checkbox" className="mt-1" checked readOnly />
                    <span className="text-sm">Annual reporting on graduate employment outcomes</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <input type="checkbox" className="mt-1" checked readOnly />
                    <span className="text-sm">Curriculum review every 3 years</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <input type="checkbox" className="mt-1" checked readOnly />
                    <span className="text-sm">Maintain accreditation of assessors</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-sm">Submit moderation reports quarterly (Pending)</span>
                  </div>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-3">Renewal/Extension Options</h3>
                <div className="space-y-3">
                  {qualification.status === 'expiring' && (
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-sm text-yellow-800">
                        This qualification is expiring in less than 3 months. Renewal application recommended.
                      </p>
                    </div>
                  )}
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Apply for Renewal
                  </button>
                  <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 ml-2">
                    Request Extension
                  </button>
                </div>
              </div>

              <div className="border rounded p-4">
                <h3 className="font-medium mb-3">Compliance History</h3>
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Report</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr>
                      <td className="py-1">2024-01-15</td>
                      <td>Annual Report</td>
                      <td><span className="text-green-600">Compliant</span></td>
                      <td><button className="text-blue-600">View</button></td>
                    </tr>
                    <tr>
                      <td className="py-1">2023-07-20</td>
                      <td>Site Visit</td>
                      <td><span className="text-green-600">Compliant</span></td>
                      <td><button className="text-blue-600">View</button></td>
                    </tr>
                    <tr>
                      <td className="py-1">2023-01-10</td>
                      <td>Moderation</td>
                      <td><span className="text-yellow-600">Partial</span></td>
                      <td><button className="text-blue-600">View</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}