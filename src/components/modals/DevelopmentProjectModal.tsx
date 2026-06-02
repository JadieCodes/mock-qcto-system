// components/modals/DevelopmentProjectModal.tsx - Full submitted content rendering
import React, { useState, useEffect } from 'react';
import {
  X, FileText, CheckCircle, Clock, AlertCircle, Download, Eye,
  User, Calendar, Users, MessageSquare, Upload, Award, Paperclip,
  ChevronRight, ChevronLeft, Plus, Send, RefreshCw, Target,
  BookOpen, Shield, CheckSquare as CheckSquareIcon, Trash2
} from 'lucide-react';

interface Phase {
  name: string;
  startDate: string;
  endDate: string;
  responsibleRole: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedDate?: string;
  approved?: boolean;
  notes?: string;
  reportSubmitted?: boolean;
  reportData?: any;
}

interface DocumentType {
  id: string;
  name: string;
  file: string;
  size: number;
  uploadedBy: string;
  uploadedDate: string;
  version: string;
  status: string;
  section?: string;
  type?: string;
}

interface DevelopmentProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any | null;
  mode: 'development' | 'resolution';
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ── Reusable read-only field components ──────────────────────────────────────

const ReadField = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
    <p className="text-sm text-gray-800 bg-white border rounded-lg px-3 py-2 min-h-[36px]">
      {value || <span className="text-gray-400 italic">Not provided</span>}
    </p>
  </div>
);

const ReadTextArea = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
    <div className="text-sm text-gray-800 bg-white border rounded-lg px-3 py-2 min-h-[60px] whitespace-pre-wrap">
      {value || <span className="text-gray-400 italic">Not provided</span>}
    </div>
  </div>
);

const SectionBox = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-gray-50 p-4 rounded-lg border">
    <h3 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

const YesNoBadge = ({ value }: { value?: string }) => {
  if (!value) return <span className="text-gray-400 italic text-sm">Not answered</span>;
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${value === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {value}
    </span>
  );
};

// ── Phase-specific full report renderers ──────────────────────────────────────

const renderScopingReport = (r: any) => (
  <div className="space-y-6">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      Scoping Report — OQD-RT-01
    </div>

    <SectionBox title="QCTO Approved Application Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadField label="Occupation" value={r.scopingOccupation} />
        <ReadField label="OFO Code" value={r.scopingOfoCode} />
        <ReadField label="Specialisation" value={r.scopingSpecialisation} />
      </div>
    </SectionBox>

    <SectionBox title="Scoping Meeting Details" icon={<Calendar className="w-4 h-4" />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadField label="Date" value={r.scopingMeetingDate} />
        <ReadField label="Venue" value={r.scopingMeetingVenue} />
        <ReadField label="Time" value={r.scopingMeetingTime} />
      </div>
    </SectionBox>

    <SectionBox title="Preliminary Qualification Details">
      {[
        { label: 'Full Qualification', rows: r.scopingQualRows },
        { label: 'Part-Qualification', rows: r.scopingPartQualRows },
        { label: 'Skills Programme', rows: r.scopingSkillsProgRows },
      ].map(({ label, rows }) => (
        <div key={label} className="mb-4">
          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">{label}</p>
          {rows?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    {['Qualification Type', 'Qualification Title', 'NQF Level', 'Credits'].map(h => (
                      <th key={h} className="border px-3 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border px-3 py-2">{row.qualType || '—'}</td>
                      <td className="border px-3 py-2">{row.qualTitle || '—'}</td>
                      <td className="border px-3 py-2">{row.nqfLevel || '—'}</td>
                      <td className="border px-3 py-2">{row.credits || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-gray-400 italic">No rows recorded</p>}
        </div>
      ))}
    </SectionBox>

    <SectionBox title="Analysis of Stakeholders Consulted" icon={<Users className="w-4 h-4" />}>
      {r.scopingStakeholders?.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Classification</th>
                <th className="border px-3 py-2 text-center">Invited</th>
                <th className="border px-3 py-2 text-center">Attended</th>
              </tr>
            </thead>
            <tbody>
              {r.scopingStakeholders.map((row: any, i: number) => (
                <tr key={i} className={row.isTotal ? 'bg-gray-200 font-semibold' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2 text-xs">{row.classification}</td>
                  <td className="border px-3 py-2 text-center">{row.invited || '0'}</td>
                  <td className="border px-3 py-2 text-center">{row.attended || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-gray-400 italic">No stakeholder data recorded</p>}
    </SectionBox>

    <SectionBox title="Process Discussed at Meeting">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm text-gray-600">Development process and requirements discussed:</span>
        <YesNoBadge value={r.scopingProcessDiscussed} />
      </div>
      {r.scopingProcessComment && <ReadTextArea label="Comments" value={r.scopingProcessComment} />}
    </SectionBox>

    <SectionBox title="Subject Matter Expert (SME) Details" icon={<User className="w-4 h-4" />}>
      {r.scopingSMERows?.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                {['Name', 'Surname', 'Email', 'Cell', 'Phone'].map(h => (
                  <th key={h} className="border px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.scopingSMERows.map((row: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2">{row.name || '—'}</td>
                  <td className="border px-3 py-2">{row.surname || '—'}</td>
                  <td className="border px-3 py-2">{row.email || '—'}</td>
                  <td className="border px-3 py-2">{row.cell || '—'}</td>
                  <td className="border px-3 py-2">{row.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-gray-400 italic">No SME details recorded</p>}
      {r.scopingSMEComments && <div className="mt-3"><ReadTextArea label="Comments" value={r.scopingSMEComments} /></div>}
    </SectionBox>

    <SectionBox title="Rationale Confirmed">
      <div className="flex items-center gap-3 mb-2">
        <YesNoBadge value={r.scopingRationaleConfirmed} />
      </div>
      {r.scopingRationaleComment && <ReadTextArea label="Comments" value={r.scopingRationaleComment} />}
    </SectionBox>

    <SectionBox title="Additional Stakeholders Identified">
      <div className="flex items-center gap-3 mb-2">
        <YesNoBadge value={r.scopingStakeholdersIdentified} />
      </div>
      {r.scopingStakeholdersComment && <ReadTextArea label="Comments" value={r.scopingStakeholdersComment} />}
    </SectionBox>

    <SectionBox title="Working Group Members Nominated">
      <div className="flex items-center gap-3 mb-2">
        <YesNoBadge value={r.scopingWGNominated} />
      </div>
      {r.scopingWGComment && <ReadTextArea label="Comments" value={r.scopingWGComment} />}
    </SectionBox>

    <SectionBox title="Development Schedule Outlined">
      <div className="flex items-center gap-3 mb-2">
        <YesNoBadge value={r.scopingScheduleOutlined} />
      </div>
      {r.scopingScheduleComment && <ReadTextArea label="Comments" value={r.scopingScheduleComment} />}
    </SectionBox>

    <SectionBox title="QP Declaration" icon={<Shield className="w-4 h-4" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <ReadField label="QP Representative Name" value={r.scopingDeclarantName} />
      </div>
      <div className="grid grid-cols-4 gap-3 mb-3">
        <ReadField label="Day" value={r.scopingDeclarationDay} />
        <ReadField label="Month" value={r.scopingDeclarationMonth} />
        <ReadField label="Year" value={r.scopingDeclarationYear} />
        <ReadField label="Place" value={r.scopingDeclarationPlace} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ReadField label="Witness 1" value={r.scopingWitness1} />
        <ReadField label="Witness 2" value={r.scopingWitness2} />
      </div>
      <p className="text-xs text-gray-400 mt-3 italic">Document No: OQD-RT-01 | Version: 1.2 | ©Copyright: QCTO</p>
    </SectionBox>
  </div>
);

const renderProfilingReport = (r: any) => (
  <div className="space-y-6">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      Profile Report — OQD-RT-02
    </div>

    <SectionBox title="QCTO Approved Application Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadField label="Occupation" value={r.profilingOccupation} />
        <ReadField label="OFO Code" value={r.profilingOfoCode} />
        <ReadField label="Specialisation" value={r.profilingSpecialisation} />
      </div>
    </SectionBox>

    <SectionBox title="Profile Meeting Details" icon={<Calendar className="w-4 h-4" />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadField label="Date" value={r.meetingDate} />
        <ReadField label="Venue" value={r.meetingVenue} />
        <ReadField label="Time" value={r.meetingTime} />
      </div>
    </SectionBox>

    <SectionBox title="Details of Qualification(s) in Development">
      {[
        { label: 'Full Qualification', rows: r.qualRows },
        { label: 'Part-Qualification', rows: r.partQualRows },
        { label: 'Skills Programme', rows: r.skillsProgRows },
      ].map(({ label, rows }) => (
        <div key={label} className="mb-4">
          <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">{label}</p>
          {rows?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    {['Qualification Type', 'Qualification Title', 'NQF Level', 'Credits'].map(h => (
                      <th key={h} className="border px-3 py-2 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border px-3 py-2">{row.qualType || '—'}</td>
                      <td className="border px-3 py-2">{row.qualTitle || '—'}</td>
                      <td className="border px-3 py-2">{row.nqfLevel || '—'}</td>
                      <td className="border px-3 py-2">{row.credits || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-gray-400 italic">No rows recorded</p>}
        </div>
      ))}
    </SectionBox>

    <SectionBox title="Working Group (WG) Member Participation" icon={<Users className="w-4 h-4" />}>
      {r.wgMembers?.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left w-8">No.</th>
                <th className="border px-3 py-2 text-left">Name & Surname</th>
                <th className="border px-3 py-2 text-left">Classification</th>
                <th className="border px-3 py-2 text-center">Invited</th>
                <th className="border px-3 py-2 text-center">Attended</th>
              </tr>
            </thead>
            <tbody>
              {r.wgMembers.map((m: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2 text-center text-xs text-gray-500">{i + 1}.</td>
                  <td className="border px-3 py-2">{m.nameAndSurname || '—'}</td>
                  <td className="border px-3 py-2 text-xs">{m.classification}</td>
                  <td className="border px-3 py-2 text-center">
                    {m.invited ? <span className={`px-2 py-0.5 rounded text-xs ${m.invited === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.invited}</span> : '—'}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {m.attended ? <span className={`px-2 py-0.5 rounded text-xs ${m.attended === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.attended}</span> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-gray-400 italic">No WG member data recorded</p>}
      {r.wgComments && <div className="mt-3"><ReadTextArea label="Comments" value={r.wgComments} /></div>}
    </SectionBox>

    <SectionBox title="Stakeholder Verification of Profile">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-gray-600">Profile sent for verification:</span>
        <YesNoBadge value={r.verificationSentConfirm} />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <ReadField label="Year" value={r.verificationSentYear} />
        <ReadField label="Month" value={r.verificationSentMonth} />
        <ReadField label="Day" value={r.verificationSentDay} />
      </div>
      <ReadTextArea label="Consultation Methods Used" value={r.consultationMethods} />
    </SectionBox>

    <SectionBox title="Final Profile Distribution">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm text-gray-600">Final profile sent to stakeholders:</span>
        <YesNoBadge value={r.finalProfileSentConfirm} />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <ReadField label="Year" value={r.finalProfileSentYear} />
        <ReadField label="Month" value={r.finalProfileSentMonth} />
        <ReadField label="Day" value={r.finalProfileSentDay} />
      </div>
      <ReadTextArea label="Distribution Methods" value={r.finalProfileMethods} />
    </SectionBox>

    <SectionBox title="QP Declaration" icon={<Shield className="w-4 h-4" />}>
      <ReadField label="QP Representative Name" value={r.declarantName} />
      <div className="grid grid-cols-4 gap-3 mt-3 mb-3">
        <ReadField label="Day" value={r.declarationDay} />
        <ReadField label="Month" value={r.declarationMonth} />
        <ReadField label="Year" value={r.declarationYear} />
        <ReadField label="Place" value={r.declarationPlace} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ReadField label="Witness 1" value={r.witness1Name} />
        <ReadField label="Witness 2" value={r.witness2Name} />
      </div>
      <p className="text-xs text-gray-400 mt-3 italic">Document No: OQD-RT-02 | Version: 1.2 | ©Copyright: QCTO</p>
    </SectionBox>
  </div>
);

const renderCurriculumReport = (r: any) => (
  <div className="space-y-6">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      Curriculum Specifications Report — OQD-RT-03
    </div>

    <SectionBox title="QCTO Approved Application Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadField label="Occupation" value={r.curriculumOccupation} />
        <ReadField label="OFO Code" value={r.curriculumOfoCode} />
        <ReadField label="Specialisation" value={r.curriculumSpecialisation} />
      </div>
    </SectionBox>

    <SectionBox title="Curriculum Meeting Details" icon={<Calendar className="w-4 h-4" />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadField label="Date" value={r.curriculumMeetingDate} />
        <ReadField label="Venue" value={r.curriculumMeetingVenue} />
        <ReadField label="Time" value={r.curriculumMeetingTime} />
      </div>
    </SectionBox>

    {[
      { label: 'Full Qualification', rows: r.curriculumQualRows },
      { label: 'Part-Qualification', rows: r.curriculumPartQualRows },
      { label: 'Skills Programme', rows: r.curriculumSkillsProgRows },
    ].map(({ label, rows }) => (
      <SectionBox key={label} title={`${label} Details`}>
        {rows?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  {['No.', 'Qualification Type', 'Qualification Title', 'NQF Level', 'Credits'].map(h => (
                    <th key={h} className="border px-3 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-3 py-2 text-center text-xs text-gray-500">{i + 1}.</td>
                    <td className="border px-3 py-2">{row.qualType || '—'}</td>
                    <td className="border px-3 py-2">{row.qualTitle || '—'}</td>
                    <td className="border px-3 py-2">{row.nqfLevel || '—'}</td>
                    <td className="border px-3 py-2">{row.credits || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-gray-400 italic">No rows recorded</p>}
      </SectionBox>
    ))}

    <SectionBox title="Working Group (WG) Member Participation" icon={<Users className="w-4 h-4" />}>
      {r.curriculumWgMembers?.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 w-8">No.</th>
                <th className="border px-3 py-2 text-left">Name & Surname</th>
                <th className="border px-3 py-2 text-left">Classification</th>
                <th className="border px-3 py-2 text-left">Component</th>
                <th className="border px-3 py-2 text-center">Invited</th>
                <th className="border px-3 py-2 text-center">Attended</th>
              </tr>
            </thead>
            <tbody>
              {r.curriculumWgMembers.map((m: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2 text-center text-xs text-gray-500">{i + 1}.</td>
                  <td className="border px-3 py-2">{m.nameAndSurname || '—'}</td>
                  <td className="border px-3 py-2 text-xs">{m.classification}</td>
                  <td className="border px-3 py-2 text-xs font-medium">{m.component || '—'}</td>
                  <td className="border px-3 py-2 text-center">
                    {m.invited ? <span className={`px-2 py-0.5 rounded text-xs ${m.invited === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.invited}</span> : '—'}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {m.attended ? <span className={`px-2 py-0.5 rounded text-xs ${m.attended === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.attended}</span> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-gray-400 italic">No WG member data</p>}
    </SectionBox>

    {r.curriculumComments && (
      <SectionBox title="Comments">
        <ReadTextArea label="" value={r.curriculumComments} />
      </SectionBox>
    )}

    <SectionBox title="QP Declaration" icon={<Shield className="w-4 h-4" />}>
      <ReadField label="QP Representative Name" value={r.curriculumDeclarantName} />
      <div className="grid grid-cols-4 gap-3 mt-3 mb-3">
        <ReadField label="Day" value={r.curriculumDeclarationDay} />
        <ReadField label="Month" value={r.curriculumDeclarationMonth} />
        <ReadField label="Year" value={r.curriculumDeclarationYear} />
        <ReadField label="Place" value={r.curriculumDeclarationPlace} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ReadField label="Witness 1" value={r.curriculumWitness1} />
        <ReadField label="Witness 2" value={r.curriculumWitness2} />
      </div>
      <p className="text-xs text-gray-400 mt-3 italic">Document No: OQD-RT-03 | Version: 1.0 | ©Copyright: QCTO</p>
    </SectionBox>
  </div>
);

const renderAssessmentSpecsReport = (r: any) => (
  <div className="space-y-6">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      Assessment Specifications Report — QAS-01
    </div>

    <SectionBox title="Qualification Details">
      {r.qasQualRows?.length ? (
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                {['Type', 'Title', 'NQF Level', 'Credits'].map(h => (
                  <th key={h} className="border px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.qasQualRows.map((row: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2">{row.type || '—'}</td>
                  <td className="border px-3 py-2">{row.title || '—'}</td>
                  <td className="border px-3 py-2">{row.nqfLevel || '—'}</td>
                  <td className="border px-3 py-2">{row.credits || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadField label="Curriculum Code" value={r.qasCurriculumCode} />
        <ReadField label="Organisation Name" value={r.qasOrganisationName} />
        <ReadField label="Quality Partner Type" value={r.qasQualityPartnerType} />
      </div>
    </SectionBox>

    <SectionBox title="Section 1: Assessment Strategy" icon={<BookOpen className="w-4 h-4" />}>
      <ReadTextArea label="Internal Formative Assessment" value={r.qasFormativeAssessment} />
      <div className="mt-4"><ReadTextArea label="Internal Summative Assessment" value={r.qasSummativeAssessment} /></div>
      <div className="mt-4"><ReadTextArea label="EISA Planning & Conduct Notes" value={r.qasEisaPlanning} /></div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReadField label="Format of Assessment" value={r.qasFormatAssessment} />
        <ReadField label="Open/Closed Book" value={r.qasOpenClosedBook} />
        <ReadField label="Total Marks" value={r.qasTotalMarks} />
        <ReadField label="Final Result Calculation" value={r.qasFinalResultCalc} />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cognitive Ability Split</p>
        <div className="grid grid-cols-3 gap-4">
          <ReadField label="Knowledge" value={r.qasCognitiveKnowledge} />
          <ReadField label="Application" value={r.qasCognitiveApplication} />
          <ReadField label="Critical Thinking" value={r.qasCognitiveCriticalThinking} />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Duration per Component</p>
        <div className="grid grid-cols-3 gap-4">
          <ReadField label="Written" value={r.qasDurationWritten} />
          <ReadField label="Practical" value={r.qasDurationPractical} />
          <ReadField label="Other" value={r.qasDurationOther} />
        </div>
      </div>

      {r.qasExitLevelOutcomes?.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Exit Level Outcomes</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left">Exit Level Outcome</th>
                  <th className="border px-3 py-2 text-center w-24">Weighting</th>
                  <th className="border px-3 py-2 text-left">Critical Aspects</th>
                </tr>
              </thead>
              <tbody>
                {r.qasExitLevelOutcomes.map((elo: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-3 py-2">{elo.outcome || '—'}</td>
                    <td className="border px-3 py-2 text-center">{elo.weighting || '—'}</td>
                    <td className="border px-3 py-2">{elo.criticalAspects || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-4"><ReadTextArea label="Assessment Centre Requirements" value={r.qasAssessmentCentreReqs} /></div>
      <div className="mt-4"><ReadTextArea label="Candidate Requirements" value={r.qasCandidateRequirements} /></div>
      <div className="mt-4"><ReadTextArea label="Special Needs Access" value={r.qasSpecialNeeds} /></div>
    </SectionBox>

    <SectionBox title="Section 2: SME Criteria">
      <ReadTextArea label="Requirements for EISA Developers" value={r.qasSmeDevelopers} />
      <div className="mt-4"><ReadTextArea label="Requirements for EISA Markers/Assessors" value={r.qasSmeMarkers} /></div>
      <div className="mt-4"><ReadTextArea label="Requirements for EISA Moderators" value={r.qasSmeModerators} /></div>
    </SectionBox>

    <SectionBox title="QP Declaration" icon={<Shield className="w-4 h-4" />}>
      <ReadField label="QP Representative Name" value={r.qasDeclarantName} />
      <div className="grid grid-cols-4 gap-3 mt-3 mb-3">
        <ReadField label="Day" value={r.qasDeclarationDay} />
        <ReadField label="Month" value={r.qasDeclarationMonth} />
        <ReadField label="Year" value={r.qasDeclarationYear} />
        <ReadField label="Place" value={r.qasDeclarationPlace} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ReadField label="Witness 1" value={r.qasWitness1} />
        <ReadField label="Witness 2" value={r.qasWitness2} />
      </div>
      <p className="text-xs text-gray-400 mt-3 italic">Document No: QAS-01 | Version: 1.2 | ©Copyright: QCTO</p>
    </SectionBox>
  </div>
);
const renderQasAddendumReport = (r: any) => (
  <div className="space-y-6">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      QAS Addendum Evaluation Report — QAS-ADD-01
    </div>

    {/* Assessment Committee Approval */}
    <SectionBox title="ASSESSMENT COMMITTEE APPROVAL" icon={<Shield className="w-4 h-4" />}>
      <div className="flex gap-8 items-center">
        <YesNoBadge value={r.qasAddendumCommitteeApproval === 'yes' ? 'YES' : r.qasAddendumCommitteeApproval === 'no' ? 'NO' : undefined} />
        {r.qasAddendumApprovalDate && (
          <ReadField label="Date" value={r.qasAddendumApprovalDate} />
        )}
      </div>
    </SectionBox>

    {/* SECTION A: AQP DETAILS */}
    <SectionBox title="SECTION A: ASSESSMENT QUALITY PARTNER (AQP) DETAILS" icon={<Users className="w-4 h-4" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReadField label="AQP Name" value={r.qasAddendumAqpName} />
        <ReadField label="Contact Name" value={r.qasAddendumContactName} />
        <ReadField label="Contact Email" value={r.qasAddendumContactEmail} />
        <ReadField label="Physical Address" value={r.qasAddendumPhysicalAddress} />
        <ReadField label="Date Received" value={r.qasAddendumDateReceived} />
        <ReadField label="Date Evaluated" value={r.qasAddendumDateEvaluated} />
        <ReadField label="Evaluator's Name" value={r.qasAddendumEvaluatorName} />
      </div>
    </SectionBox>

    {/* SECTION B: ASSESSMENT SPECIFICATION REQUIREMENTS */}
    <SectionBox title="SECTION B: ASSESSMENT SPECIFICATION REQUIREMENTS" icon={<FileText className="w-4 h-4" />}>
      {/* Qualification Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ReadField label="Qualification Title" value={r.qasAddendumQualTitle} />
        <ReadField label="SAQA ID" value={r.qasAddendumSaqaId} />
        <ReadField label="Date Registered" value={r.qasAddendumDateRegistered} />
        <ReadField label="NQF Level" value={r.qasAddendumNqfLevel} />
        <ReadField label="Credits" value={r.qasAddendumCredits} />
        <ReadField label="Registration Start Date" value={r.qasAddendumRegStartDate} />
        <ReadField label="Registration End Date" value={r.qasAddendumRegEndDate} />
      </div>

      {/* Verification Items */}
      {r.qasAddendumVerificationItems?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Verification Items</p>
          {r.qasAddendumVerificationItems.map((item: any, idx: number) => (
            <div key={idx} className="mb-3 p-2 bg-white rounded border">
              <p className="text-sm font-medium">{item.label}</p>
              <div className="flex items-center gap-4 mt-1">
                <YesNoBadge value={item.value === 'yes' ? 'YES' : item.value === 'no' ? 'NO' : undefined} />
                {item.comment && <span className="text-xs text-gray-500 italic">Comment: {item.comment}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Final Achievements Table */}
      {r.qasAddendumComponents?.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Final achievements for each component</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2">Component</th>
                  <th className="border px-3 py-2">Name of Components</th>
                  <th className="border px-3 py-2">Total Marks/Competency</th>
                  <th className="border px-3 py-2">Pass Mark/Competency Required</th>
                </tr>
              </thead>
              <tbody>
                {r.qasAddendumComponents.map((comp: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border px-3 py-2 text-center">Component {idx + 1}</td>
                    <td className="border px-3 py-2">{comp.name || '—'}</td>
                    <td className="border px-3 py-2 text-center">{comp.totalMarks || '—'}</td>
                    <td className="border px-3 py-2 text-center">{comp.passMark || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional Requirements */}
      <div className="space-y-3 mt-4">
        <ReadTextArea label="Calculation of final achievement" value={r.qasAddendumFinalCalc} />
        <ReadField label="Final achievement (pass mark/competency result)" value={r.qasAddendumFinalPass} />
        <ReadTextArea label="Duration of each component (hours/days)" value={r.qasAddendumDuration} />
        <ReadTextArea label="Format (written, practical, presentation, etc.)" value={r.qasAddendumFormat} />
        <ReadTextArea label="Layout of question types" value={r.qasAddendumLayout} />
        <ReadField label="Open or Closed Book" value={r.qasAddendumOpenClosed} />
        <ReadTextArea label="Assessment Points indicated" value={r.qasAddendumAssessmentPoints} />
        <ReadField label="Supplementary Assessments" value={r.qasAddendumSupplementary} />
        <ReadField label="% to be moderated" value={r.qasAddendumModerationPercent} />
        <ReadField label="Number of marking days" value={r.qasAddendumMarkingDays} />
        <ReadField label="Number of Moderation days" value={r.qasAddendumModerationDays} />
      </div>
    </SectionBox>

    {/* SECTION C: CORE QUALIFICATION ASSESSMENT EVALUATION */}
    {r.qasAddendumEvaluation?.length > 0 && (
      <SectionBox title="SECTION C: CORE QUALIFICATION ASSESSMENT (blueprint) EVALUATION" icon={<CheckSquareIcon className="w-4 h-4" />}>
        <div className="space-y-2">
          {r.qasAddendumEvaluation.map((item: any, idx: number) => (
            <div key={idx} className="p-2 bg-white rounded border">
              <p className="text-sm font-medium">{item.item}</p>
              {item.subItem && <p className="text-xs text-gray-600 ml-2">- {item.subItem}</p>}
              <div className="flex items-center gap-4 mt-1">
                <YesNoBadge value={item.status === 'yes' ? 'YES' : item.status === 'no' ? 'NO' : undefined} />
                {item.comment && <span className="text-xs text-gray-500 italic">Comment: {item.comment}</span>}
              </div>
            </div>
          ))}
        </div>
      </SectionBox>
    )}

    {/* SECTION D: OVERALL GENERAL EVALUATION */}
    {r.qasAddendumCharacteristics?.length > 0 && (
      <SectionBox title="SECTION D: OVERALL GENERAL EVALUATION" icon={<BookOpen className="w-4 h-4" />}>
        <div className="space-y-2 mb-4">
          {r.qasAddendumCharacteristics.map((char: any, idx: number) => (
            <div key={idx} className="p-2 bg-white rounded border">
              <p className="text-sm font-medium">{char.characteristic}</p>
              <p className="text-xs text-gray-500">{char.description}</p>
              <div className="mt-1">
                <YesNoBadge value={char.status === 'yes' ? 'YES' : char.status === 'no' ? 'NO' : undefined} />
                {char.comment && <span className="text-xs text-gray-500 italic ml-2">Comment: {char.comment}</span>}
              </div>
            </div>
          ))}
        </div>
        <ReadTextArea label="Evaluation Findings" value={r.qasAddendumFindings} />
        <ReadTextArea label="Recommendation" value={r.qasAddendumRecommendation} />
      </SectionBox>
    )}

    {/* SECTION E: FINAL RECOMMENDATIONS */}
    <SectionBox title="SECTION E: FINAL RECOMMENDATIONS" icon={<Shield className="w-4 h-4" />}>
      <div className="mb-4">
        <p className="text-sm font-semibold">Final Recommendation:</p>
        <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block mt-1 ${
          r.qasAddendumFinalRecommendation === 'approved' ? 'bg-green-100 text-green-700' : 
          r.qasAddendumFinalRecommendation === 'notApproved' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {r.qasAddendumFinalRecommendation === 'approved' ? '✓ Approved - Meets minimum requirements' : 
           r.qasAddendumFinalRecommendation === 'notApproved' ? '✗ Not Approved - Does NOT meet minimum requirements' : 'Not specified'}
        </span>
      </div>

      {/* Evaluator Sign-offs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-3 rounded border">
          <p className="text-sm font-semibold">FIRST EVALUATOR</p>
          <ReadField label="Name" value={r.qasAddendumFirstEvaluatorName} />
          <ReadField label="Recommendation" value={r.qasAddendumFirstRec} />
          <ReadField label="Assistant Director" value={r.qasAddendumAssistantDirector} />
          <ReadField label="Date" value={r.qasAddendumAssistantDirectorDate} />
        </div>
        <div className="bg-white p-3 rounded border">
          <p className="text-sm font-semibold">SECOND EVALUATOR</p>
          <ReadField label="Name" value={r.qasAddendumSecondEvaluatorName} />
          <ReadField label="Recommendation" value={r.qasAddendumSecondRec} />
          <ReadField label="Deputy Director" value={r.qasAddendumDeputyDirector} />
          <ReadField label="Date" value={r.qasAddendumDeputyDirectorDate} />
        </div>
      </div>

      {/* Final Approval */}
      <div className="mt-4 p-3 bg-white rounded border">
        <p className="text-sm font-semibold">FINAL RECOMMENDATION</p>
        <ReadField label="Final Decision" value={r.qasAddendumFinalRec} />
        <div className="grid grid-cols-2 gap-4 mt-2">
          <ReadField label="Director: Assessments Name" value={r.qasAddendumDirectorName} />
          <ReadField label="Date" value={r.qasAddendumDirectorDate} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-medium">Approved by QCTO Assessment Committee:</span>
          <YesNoBadge value={r.qasAddendumCommitteeFinal === 'yes' ? 'YES' : r.qasAddendumCommitteeFinal === 'no' ? 'NO' : undefined} />
          {r.qasAddendumCommitteeFinalDate && <ReadField label="Date" value={r.qasAddendumCommitteeFinalDate} />}
        </div>
      </div>
    </SectionBox>

    {/* Supporting Documents */}
    {r.qasAddendumSupportingDocs?.length > 0 && (
      <SectionBox title="Supporting Documents" icon={<Paperclip className="w-4 h-4" />}>
        <div className="space-y-2">
          {r.qasAddendumSupportingDocs.map((doc: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border">
              {doc.uploaded ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              <span className="text-sm">{doc.name}</span>
            </div>
          ))}
        </div>
      </SectionBox>
    )}

    <p className="text-xs text-gray-400 mt-3 italic text-center">Document No: QAS-ADD-01 | Version: 1.2 | ©Copyright: QCTO</p>
  </div>
);
const renderQualificationDocReport = (r: any) => (
  <div className="space-y-6">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      Qualification Document + Stage 1 Evaluation — QD-STG1
    </div>

    <SectionBox title="Section 1: Qualification Document Compilation" icon={<FileText className="w-4 h-4" />}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <ReadField label="Document Version" value={r.qualificationDocVersion} />
        <ReadField label="Date of Completion" value={r.qualificationDocCompletionDate} />
      </div>
      <ReadTextArea label="Document Summary / Executive Overview" value={r.qualificationDocSummary} />

      {r.qualificationDocSections?.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Document Sections Status</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {r.qualificationDocSections.map((s: any, i: number) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded border ${s.completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                {s.completed
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                <span className="text-sm">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </SectionBox>

    <SectionBox title="Section 2: Stage 1 Self-Evaluation (SME Checklist)" icon={<CheckSquareIcon className="w-4 h-4" />}>
      {r.stage1Evaluation && Object.keys(r.stage1Evaluation).length > 0 ? (
        <div className="space-y-2">
          {Object.entries(r.stage1Evaluation).map(([key, val]: [string, any]) => (
            <div key={key} className={`flex items-start gap-3 p-2 rounded border ${val.status === 'pass' ? 'bg-green-50' : val.status === 'fail' ? 'bg-red-50' : 'bg-white'}`}>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${val.status === 'pass' ? 'bg-green-100 text-green-700' : val.status === 'fail' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                {val.status === 'pass' ? '✓ Pass' : val.status === 'fail' ? '✗ Fail' : 'Pending'}
              </span>
              <span className="text-sm flex-1">Criterion {key}</span>
              {val.comment && <span className="text-xs text-gray-500 italic">{val.comment}</span>}
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-gray-400 italic">No self-evaluation data recorded</p>}

      <div className="mt-4 grid grid-cols-3 gap-4 p-3 bg-gray-100 rounded-lg">
        <ReadField label="SME Name" value={r.stage1SmeName} />
        <ReadField label="Role" value={r.stage1SmeRole} />
        <ReadField label="Date" value={r.stage1SmeDate} />
      </div>
      <div className="mt-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${r.stage1SmeDeclaration ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {r.stage1SmeDeclaration ? '✓ SME Declaration Signed' : 'SME Declaration Not Signed'}
        </span>
      </div>
    </SectionBox>

    {r.qualificationDocReviewerNotes && (
      <SectionBox title="Notes for QP Reviewer">
        <ReadTextArea label="" value={r.qualificationDocReviewerNotes} />
      </SectionBox>
    )}
  </div>
);

const renderFinalVerificationReport = (r: any) => (
  <div className="space-y-6">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      Final Verification Report — FVR-01
    </div>

    <SectionBox title="QCTO Approved Application Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadField label="Occupation" value={r.finalVerificationOccupation} />
        <ReadField label="OFO Code" value={r.finalVerificationOfoCode} />
        <ReadField label="Specialisation" value={r.finalVerificationSpecialisation} />
      </div>
    </SectionBox>

    <SectionBox title="Final Verification Meeting Details" icon={<Calendar className="w-4 h-4" />}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReadField label="Date" value={r.finalVerificationMeetingDate} />
        <ReadField label="Venue" value={r.finalVerificationMeetingVenue} />
        <ReadField label="Time" value={r.finalVerificationMeetingTime} />
      </div>
    </SectionBox>

    {[
      { label: 'Full Qualification', rows: r.finalVerificationQualRows },
      { label: 'Part-Qualification', rows: r.finalVerificationPartQualRows },
      { label: 'Skills Programme', rows: r.finalVerificationSkillsProgRows },
    ].map(({ label, rows }) => (
      <SectionBox key={label} title={`${label} Details`}>
        {rows?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  {['No.', 'Qualification Type', 'Qualification Title', 'NQF Level', 'Credits'].map(h => (
                    <th key={h} className="border px-3 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border px-3 py-2 text-center text-xs text-gray-500">{i + 1}.</td>
                    <td className="border px-3 py-2">{row.qualType || '—'}</td>
                    <td className="border px-3 py-2">{row.qualTitle || '—'}</td>
                    <td className="border px-3 py-2">{row.nqfLevel || '—'}</td>
                    <td className="border px-3 py-2">{row.credits || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-gray-400 italic">No rows recorded</p>}
      </SectionBox>
    ))}

    <SectionBox title="Stakeholders Consulted" icon={<Users className="w-4 h-4" />}>
      {r.finalVerificationStakeholders?.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Classification</th>
                <th className="border px-3 py-2 text-center">Invited</th>
                <th className="border px-3 py-2 text-center">Attended</th>
              </tr>
            </thead>
            <tbody>
              {r.finalVerificationStakeholders.map((row: any, i: number) => (
                <tr key={i} className={row.isTotal ? 'bg-gray-200 font-semibold' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2 text-xs">{row.classification}</td>
                  <td className="border px-3 py-2 text-center">{row.invited || '0'}</td>
                  <td className="border px-3 py-2 text-center">{row.attended || '0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-gray-400 italic">No stakeholder data recorded</p>}
    </SectionBox>

    <SectionBox title="Subject Matter Expert (SME) Details" icon={<User className="w-4 h-4" />}>
      {r.finalVerificationSMERows?.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                {['Name', 'Surname', 'Email', 'Cell', 'Phone'].map(h => (
                  <th key={h} className="border px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.finalVerificationSMERows.map((row: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-3 py-2">{row.name || '—'}</td>
                  <td className="border px-3 py-2">{row.surname || '—'}</td>
                  <td className="border px-3 py-2">{row.email || '—'}</td>
                  <td className="border px-3 py-2">{row.cell || '—'}</td>
                  <td className="border px-3 py-2">{row.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-gray-400 italic">No SME details recorded</p>}
    </SectionBox>

    {r.finalVerificationComments && (
      <SectionBox title="Comments">
        <ReadTextArea label="" value={r.finalVerificationComments} />
      </SectionBox>
    )}

    <SectionBox title="QP Declaration" icon={<Shield className="w-4 h-4" />}>
      <ReadField label="QP Representative Name" value={r.finalVerificationDeclarantName} />
      <div className="grid grid-cols-4 gap-3 mt-3 mb-3">
        <ReadField label="Day" value={r.finalVerificationDeclarationDay} />
        <ReadField label="Month" value={r.finalVerificationDeclarationMonth} />
        <ReadField label="Year" value={r.finalVerificationDeclarationYear} />
        <ReadField label="Place" value={r.finalVerificationDeclarationPlace} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ReadField label="Witness 1" value={r.finalVerificationWitness1} />
        <ReadField label="Witness 2" value={r.finalVerificationWitness2} />
      </div>
      <p className="text-xs text-gray-400 mt-3 italic">Document No: FVR-01 | Version: 1.0 | ©Copyright: QCTO</p>
    </SectionBox>
  </div>
);
const renderStage2EvaluationReport = (r: any) => (
  <div className="space-y-6">
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      Stage 2 Evaluation + QCTO Submission — QP-STG2-SUB
    </div>

    {/* Submission Readiness Dashboard */}
    <SectionBox title="Submission Readiness Dashboard" icon={<Award className="w-4 h-4" />}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 text-center border">
          <p className="text-2xl font-bold text-blue-600">{r.readinessPercentage || 0}%</p>
          <p className="text-xs text-gray-500">Overall Readiness</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border">
          <p className="text-2xl font-bold text-green-600">
            {(r.qualityCriteria || []).filter((c: any) => c.checked).length}/{r.qualityCriteria?.length || 0}
          </p>
          <p className="text-xs text-gray-500">Quality Criteria Met</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border">
          <p className="text-2xl font-bold text-purple-600">
            {(r.submissionDocuments || []).filter((d: any) => d.uploaded).length}/{r.submissionDocuments?.length || 0}
          </p>
          <p className="text-xs text-gray-500">Documents Ready</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border">
          <p className="text-2xl font-bold text-orange-600">
            {(r.stage2Phases || []).filter((p: any) => p.completed).length}/{r.stage2Phases?.length || 0}
          </p>
          <p className="text-xs text-gray-500">Phases Completed</p>
        </div>
      </div>
    </SectionBox>

    {/* Section 1: Phase Completion Status */}
    <SectionBox title="Section 1: Development Phase Completion Status" icon={<CheckCircle className="w-4 h-4" />}>
      <div className="space-y-2">
        {(r.stage2Phases || []).map((phase: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              {phase.completed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium">{phase.name}</p>
                <p className="text-xs text-gray-500">{phase.description}</p>
              </div>
            </div>
            {phase.completed && phase.approvedDate && (
              <span className="text-xs text-gray-400">Approved: {phase.approvedDate}</span>
            )}
          </div>
        ))}
      </div>
    </SectionBox>

    {/* Section 2: QP Quality Checklist */}
    <SectionBox title="Section 2: QP Quality Checklist (Final Review)" icon={<CheckSquareIcon className="w-4 h-4" />}>
      <div className="space-y-2">
        {(r.qualityCriteria || []).map((criterion: any, idx: number) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
            {criterion.checked ? (
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{criterion.item}</p>
              {criterion.notes && (
                <p className="text-xs text-gray-500 mt-0.5">{criterion.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionBox>

    {/* Section 3: Document Checklist for QCTO Submission */}
    <SectionBox title="Section 3: Document Checklist for QCTO Submission" icon={<FileText className="w-4 h-4" />}>
      <div className="space-y-2">
        {(r.submissionDocuments || []).map((doc: any, idx: number) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
            {doc.uploaded ? (
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{doc.name}</p>
              <p className="text-xs text-gray-500">{doc.requiredFormat}</p>
            </div>
            {doc.uploaded && doc.fileName && (
              <span className="text-xs text-green-600 truncate max-w-[150px]">{doc.fileName}</span>
            )}
          </div>
        ))}
      </div>
    </SectionBox>

    {/* Section 4: QP Declaration & Sign-off */}
    <SectionBox title="Section 4: QP Declaration & Final Sign-off" icon={<Shield className="w-4 h-4" />}>
      <div className="bg-white p-4 rounded-lg border mb-4">
        <p className="text-sm text-gray-700 italic">
          "I, the undersigned Quality Partner representative, hereby declare that:
        </p>
        <ul className="list-disc ml-6 mt-2 text-sm text-gray-600 space-y-1">
          <li>All development phases have been completed and approved</li>
          <li>The qualification meets all QCTO quality requirements and standards</li>
          <li>All required documentation has been reviewed and is accurate</li>
          <li>The complete submission package is ready for QCTO evaluation</li>
        </ul>
      </div>
      
      <div className="flex items-start gap-3 p-3 bg-white rounded-lg border mb-4">
        {r.stage2QpDeclaration ? (
          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 mt-0.5" />
        )}
        <span className="text-sm text-gray-700">
          I confirm that I have reviewed all deliverables and the complete package is ready for submission to the QCTO.
        </span>
      </div>
      
      {r.stage2QpDeclaration && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <ReadField label="QP Name" value={r.stage2QpName} />
          <ReadField label="Role / Title" value={r.stage2QpRole} />
          <ReadField label="Date of Sign-off" value={r.stage2QpDate} />
        </div>
      )}
    </SectionBox>

    {/* Section 5: Submission Details */}
    <SectionBox title="Section 5: Submission Details to QCTO" icon={<Send className="w-4 h-4" />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ReadField label="QCTO Reference Number" value={r.stage2QctoReference} />
        <ReadField label="Submission Method" value={r.stage2SubmissionMethod} />
      </div>
      <ReadTextArea label="Submission Notes / Comments" value={r.stage2SubmissionNotes} />
      <div className="mt-4">
        <div className="flex items-center gap-2">
          {r.stage2QctoAcknowledged ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
          )}
          <span className="text-sm text-gray-600">Acknowledged that QCTO may contact for additional information</span>
        </div>
      </div>
    </SectionBox>

    {/* Submission Final Status */}
    {r.stage2QpDeclaration && (
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Ready for QCTO Submission</p>
            <p className="text-xs text-green-700 mt-1">
              The complete submission package is ready for QCTO evaluation and qualification registration.
            </p>
          </div>
        </div>
      </div>
    )}

    <p className="text-xs text-gray-400 mt-3 italic text-center">Document No: QP-STG2-SUB | Version: 1.0 | ©Copyright: QCTO</p>
  </div>
);
// ── Main modal component ──────────────────────────────────────────────────────

export default function DevelopmentProjectModal({
  isOpen,
  onClose,
  project,
  mode
}: DevelopmentProjectModalProps) {
  const phases: Phase[] = project?.phases || [];
  const [activePhaseTab, setActivePhaseTab] = useState<string>(phases[0]?.name || 'overview');
  const [activeMainTab, setActiveMainTab] = useState<'overview' | 'phaseDetails' | 'documents'>('overview');
  const [isReportReviewOpen, setIsReportReviewOpen] = useState(false);
  const [selectedReportPhase, setSelectedReportPhase] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!isOpen || !project) return null;

  const currentPhaseData = phases.find(p => p.name === activePhaseTab);

  // ── Data helpers ────────────────────────────────────────────────────────────

 const getReportData = (phaseName: string) => {
  // First check submittedPhaseReports
  const submittedReports = localStorage.getItem('submittedPhaseReports');
  if (submittedReports) {
    const reports = JSON.parse(submittedReports);
    const found = reports.find((r: any) =>
      r.qualificationCode === project.id && r.phaseName === phaseName
    );
    if (found) return found;
  }
  
  // Fallback to phase.reportData
  const phaseObj = phases.find(p => p.name === phaseName);
  if (phaseObj?.reportData) {
    return { reportData: phaseObj.reportData, submittedAt: phaseObj.completedDate };
  }
  
  return null;
};

// Returns the full flat report object, merging localStorage report + phase.reportData
const getFullReport = (phaseName: string): any => {
  const stored = getReportData(phaseName);
  const phaseObj = phases.find(p => p.name === phaseName);
  
  // Merge report data from both sources
  const reportData = stored?.reportData || phaseObj?.reportData || null;
  
  return reportData;
};

  const getPhaseDocuments = (phaseName: string): DocumentType[] => {
    const storedFiles = localStorage.getItem(`phaseFiles_${project.id}_${phaseName}`);
    if (storedFiles) {
      const files = JSON.parse(storedFiles);
      return files.map((file: any, index: number) => ({
        id: file.id || String(index),
        name: file.name,
        file: file.data,
        size: file.size,
        uploadedBy: 'External Team',
        uploadedDate: file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Unknown',
        version: 'v1.0',
        status: 'pending',
        section: file.section,
        type: file.type
      }));
    }
    return [];
  };

  // ── Phase approval ──────────────────────────────────────────────────────────

 const handleApprovePhase = () => {
  if (!selectedReportPhase) return;
  setIsApproving(true);

  // 1. Update cyclePlans
  const persistAndGetUpdated = (key: string): Phase[] | null => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const plans = JSON.parse(raw);
    const updated = plans.map((plan: any) => {
      if (plan.qualificationCode !== project.id) return plan;
      return {
        ...plan,
        phases: plan.phases.map((p: Phase) =>
          p.name === selectedReportPhase
            ? { ...p, approved: true, status: 'completed' as const, approvedDate: new Date().toISOString(), approvalNotes, reportSubmitted: true }
            : p
        )
      };
    });
    localStorage.setItem(key, JSON.stringify(updated));
    return updated.find((p: any) => p.qualificationCode === project.id)?.phases || null;
  };

  persistAndGetUpdated('cyclePlans');
  const freshInternalPhases = persistAndGetUpdated('internalCyclePlans');

  // 2. Update submittedPhaseReports
  const reportsRaw = localStorage.getItem('submittedPhaseReports');
  if (reportsRaw) {
    const reports = JSON.parse(reportsRaw);
    localStorage.setItem('submittedPhaseReports', JSON.stringify(
      reports.map((report: any) =>
        report.qualificationCode === project.id && report.phaseName === selectedReportPhase
          ? { ...report, status: 'approved', approvalNotes, approvedAt: new Date().toISOString() }
          : report
      )
    ));
  }

  // 3. Check allApproved using FRESH data from localStorage
  const freshReports = JSON.parse(localStorage.getItem('submittedPhaseReports') || '[]');
  const projectReports = freshReports.filter((r: any) => r.qualificationCode === project.id);

  // Use fresh phases from localStorage, not the stale snapshot
  const freshPhases = freshInternalPhases || phases;

  const allApproved = freshPhases.every((p: Phase) => {
    if (p.name === selectedReportPhase) return true; // just approved
    const report = projectReports.find((r: any) => r.phaseName === p.name);
    return !!p.approved || report?.status === 'approved';
  });

  console.log('Fresh phases check:', freshPhases.map((p: Phase) => ({
    name: p.name,
    approved: p.approved,
    reportStatus: projectReports.find((r: any) => r.phaseName === p.name)?.status
  })));
  console.log('allApproved:', allApproved);

  if (allApproved) {
    const existingResolutions = localStorage.getItem('resolutionProjects');
    let resolutions = existingResolutions ? JSON.parse(existingResolutions) : [];
    resolutions = resolutions.filter((r: any) => r.qualificationCode !== project.id);

    resolutions.push({
      id: project.id,
      qualificationCode: project.id,
      qualificationTitle: project.qualificationTitle || project.title,
      submitterName: project.projectLead || 'External Team',
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'pending_review',
      progress: 0,
      allPhasesCompleted: true,
      finalVerificationApproved: true,
      checklists: [
        { id: 'c1', item: 'All phase reports submitted and approved', required: true, completed: true },
        { id: 'c2', item: 'Final verification report reviewed', required: true, completed: true },
        { id: 'c3', item: 'Quality assurance standards met', required: true, completed: false },
        { id: 'c4', item: 'Industry stakeholder consultation completed', required: true, completed: false },
        { id: 'c5', item: 'Alignment with NQF level descriptors verified', required: true, completed: false },
        { id: 'c6', item: 'Credit value justification provided', required: true, completed: false },
        { id: 'c7', item: 'Articulation routes identified', required: false, completed: false },
        { id: 'c8', item: 'Assessment strategy approved', required: true, completed: false }
      ]
    });

    localStorage.setItem('resolutionProjects', JSON.stringify(resolutions));
    window.dispatchEvent(new StorageEvent('storage', { key: 'resolutionProjects', newValue: JSON.stringify(resolutions) }));
    window.dispatchEvent(new CustomEvent('refreshWorkspace'));
  }

  // 4. Dispatch remaining storage events
  ['cyclePlans', 'internalCyclePlans', 'submittedPhaseReports'].forEach(key => {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: localStorage.getItem(key) }));
  });

  project.phases = freshPhases;
  setIsApproving(false);
  setIsReportReviewOpen(false);
  setSelectedReportPhase(null);
  setApprovalNotes('');
  setRefreshKey(prev => prev + 1);
  onClose();
};

  // ── Report content dispatcher ───────────────────────────────────────────────

  const renderFullReportContent = (phaseName: string) => {
    const report = getFullReport(phaseName);

    if (!report) {
      return (
        <div className="text-center py-8 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No report data found for this phase.</p>
        </div>
      );
    }

    // Phase name matching — handles both exact names and variations
    const name = phaseName.toLowerCase();

    if (name.includes('scoping')) return renderScopingReport(report);
    if (name.includes('profil')) return renderProfilingReport(report);
    if (name.includes('curriculum')) return renderCurriculumReport(report);
    if (name.includes('assessment spec')) return renderAssessmentSpecsReport(report);
     if (name.includes('qas addendum') || name.includes('develop qas addendum')) return renderQasAddendumReport(report);  // ADD THIS LINE
    if (name.includes('qualification document') || name.includes('stage 1')) return renderQualificationDocReport(report);
    if (name.includes('final verification')) return renderFinalVerificationReport(report);
      if (name.includes('stage 2') || name.includes('submission to qcto')) return renderStage2EvaluationReport(report);

    // Fallback for unrecognised phases — render all key-value pairs
    return (
      <div className="space-y-4">
        <SectionBox title="Report Summary">
          <ReadTextArea label="Objectives" value={report.objectives} />
          <div className="mt-4"><ReadTextArea label="Findings" value={report.findings} /></div>
          {report.deliverables?.length ? (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Deliverables</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {report.deliverables.map((d: string, i: number) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          ) : null}
        </SectionBox>
        {report.additionalNotes && (
          <SectionBox title="Additional Notes">
            <ReadTextArea label="" value={report.additionalNotes} />
          </SectionBox>
        )}
      </div>
    );
  };

  // ── Status badge helpers ────────────────────────────────────────────────────

  const getStatusBadge = (status: string, reportSubmitted?: boolean, approved?: boolean) => {
    if (approved) return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
    if (reportSubmitted) return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Review</span>;
    switch (status) {
      case 'completed': return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'in-progress': return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> In Progress</span>;
      default: return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pending</span>;
    }
  };

  // ── Document list renderer ──────────────────────────────────────────────────

  const renderDocumentEntries = (phaseName: string) => {
    const documents = getPhaseDocuments(phaseName);
    if (documents.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No documents uploaded for this phase</p>
          <p className="text-xs text-gray-400 mt-1">Documents will appear here once the external team uploads them</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {documents.map(doc => (
          <div key={doc.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><FileText className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <h4 className="font-medium text-gray-800">{doc.name}</h4>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {formatFileSize(doc.size)}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {doc.uploadedBy}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {doc.uploadedDate}</span>
                  </div>
                  {doc.section && <span className="text-xs text-gray-400 mt-1 block">Section: {doc.section}</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  if (doc.file) {
                    const link = document.createElement('a');
                    link.href = doc.file;
                    link.download = doc.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Submitted report section (in phase details tab) ─────────────────────────

  const renderSubmittedReportSection = () => {
    if (!currentPhaseData) return null;
    const report = getFullReport(currentPhaseData.name);
    if (!currentPhaseData.reportSubmitted && !report) return null;

    return (
      <div className="bg-white border rounded-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-white px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Submitted Phase Report
            {currentPhaseData.reportSubmitted && !currentPhaseData.approved && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pending Review</span>
            )}
            {currentPhaseData.approved && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Approved</span>
            )}
          </h3>
          {/* Submitted timestamp */}
          {getReportData(currentPhaseData.name)?.submittedAt && (
            <span className="text-xs text-gray-400">
              Submitted: {new Date(getReportData(currentPhaseData.name).submittedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className="p-4">
          {renderFullReportContent(currentPhaseData.name)}
        </div>

        {/* Report attachments uploaded with the submission */}
        {getPhaseDocuments(currentPhaseData.name).length > 0 && (
          <div className="px-4 pb-4">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Attached Files
            </p>
            {renderDocumentEntries(currentPhaseData.name)}
          </div>
        )}

        {currentPhaseData.reportSubmitted && !currentPhaseData.approved && (
          <div className="px-4 py-3 border-t bg-gray-50 flex justify-end">
            <button
              onClick={() => { setSelectedReportPhase(currentPhaseData.name); setIsReportReviewOpen(true); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Review & Approve Phase
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-800">
                {mode === 'development' ? 'Development Project' : 'Resolution Project'}
              </h2>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">ID: {project.id}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{project.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Info Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600"><Calendar className="w-4 h-4" /><span>Start: {project.startDate || 'Not set'}</span></div>
          <div className="flex items-center gap-1 text-gray-600"><Calendar className="w-4 h-4" /><span>Target: {project.targetDate || 'Not set'}</span></div>
          <div className="flex items-center gap-1 text-gray-600"><User className="w-4 h-4" /><span>Lead: {project.projectLead || 'Unassigned'}</span></div>
          <div className="flex items-center gap-1 text-gray-600"><Users className="w-4 h-4" /><span>Team: {project.teamSize || 0} members</span></div>
        </div>

        {/* Main Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-6">
            {(['overview', 'phaseDetails', 'documents'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveMainTab(tab)}
                className={`py-3 font-medium text-sm border-b-2 transition-colors capitalize ${activeMainTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab === 'phaseDetails' ? 'Phase Details' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6" key={refreshKey}>

          {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
          {activeMainTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                <h3 className="font-semibold mb-4">Project Progress</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                      <circle cx="48" cy="48" r="42" stroke="white" strokeWidth="8" fill="none"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - (project.progress || 0) / 100)}`}
                        className="transition-all duration-500" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{Math.round(project.progress || 0)}%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-xs opacity-80">Completed Phases</p>
                        <p className="text-xl font-bold">{phases.filter(p => p.status === 'completed').length}/{phases.length}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-xs opacity-80">Approved Phases</p>
                        <p className="text-xl font-bold">{phases.filter(p => p.approved).length}/{phases.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Last updated: {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2"><Flag className="w-4 h-4 text-blue-600" />Key Milestones</h3>
                <div className="space-y-3">
                  {phases.map((phase, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${phase.status === 'completed' ? 'bg-green-500' : phase.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                      <span className="text-sm flex-1">{phase.name}</span>
                      <span className="text-xs text-gray-500">{phase.startDate} — {phase.endDate}</span>
                      {getStatusBadge(phase.status, phase.reportSubmitted, phase.approved)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" />Project Description</h3>
                  <p className="text-sm text-gray-600">{project.description || 'No description provided'}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" />Team Members</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-xs">SJ</div><div><p className="text-sm font-medium">Dr. Sarah Johnson</p><p className="text-xs text-gray-500">Lead Developer</p></div></div>
                    <div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-medium text-xs">MC</div><div><p className="text-sm font-medium">Prof. Michael Chen</p><p className="text-xs text-gray-500">Subject Matter Expert</p></div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE DETAILS TAB ────────────────────────────────────────── */}
          {activeMainTab === 'phaseDetails' && (
            <div className="space-y-6">
              {/* Phase selector tabs */}
              <div className="border-b">
                <div className="flex gap-1 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActivePhaseTab('overview')}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap ${activePhaseTab === 'overview' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    All Phases
                  </button>
                  {phases.map(phase => (
                    <button
                      key={phase.name}
                      onClick={() => setActivePhaseTab(phase.name)}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${activePhaseTab === phase.name ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {phase.name}
                      {phase.reportSubmitted && !phase.approved && <Clock className="w-3 h-3 text-yellow-500" />}
                      {phase.approved && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* All phases overview */}
              {activePhaseTab === 'overview' ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">All Phases Progress</h3>
                  {phases.map((phase, idx) => (
                    <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{phase.name}</h4>
                          <p className="text-xs text-gray-500">{phase.startDate} — {phase.endDate} | Responsible: {phase.responsibleRole}</p>
                        </div>
                        {getStatusBadge(phase.status, phase.reportSubmitted, phase.approved)}
                      </div>
                      {phase.notes && <p className="text-sm text-gray-600 mt-2">{phase.notes}</p>}
                      {phase.reportSubmitted && !phase.approved && (
                        <button
                          onClick={() => { setSelectedReportPhase(phase.name); setIsReportReviewOpen(true); }}
                          className="mt-3 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700"
                        >
                          <CheckCircle className="w-3 h-3" /> Review & Approve
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Individual phase detail */
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{currentPhaseData?.name}</h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {currentPhaseData?.startDate} — {currentPhaseData?.endDate}</span>
                          <span className="flex items-center gap-1"><User className="w-4 h-4" /> {currentPhaseData?.responsibleRole}</span>
                        </div>
                      </div>
                      {getStatusBadge(currentPhaseData?.status || 'pending', currentPhaseData?.reportSubmitted, currentPhaseData?.approved)}
                    </div>
                  </div>

                  {/* Phase progress steps */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Phase Progress</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Phase Initiated', sub: 'Phase has been started', done: currentPhaseData?.status !== 'pending' },
                        { label: 'Report Submitted', sub: 'Phase report submitted for review', done: !!currentPhaseData?.reportSubmitted },
                        { label: 'Phase Approved', sub: 'Phase approved by reviewer', done: !!currentPhaseData?.approved },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step.done ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>{i + 1}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{step.label}</p>
                            <p className="text-xs text-gray-500">{step.sub}</p>
                          </div>
                          {step.done && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full submitted report content */}
                  {renderSubmittedReportSection()}

                  {currentPhaseData?.notes && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <h3 className="font-medium mb-2 flex items-center gap-2 text-yellow-800"><MessageSquare className="w-4 h-4" />Phase Notes</h3>
                      <p className="text-sm text-yellow-700">{currentPhaseData.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── DOCUMENTS TAB ────────────────────────────────────────────── */}
          {activeMainTab === 'documents' && (
            <div className="space-y-6">
              <h3 className="font-medium text-lg">Phase Documents</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 border-b">
                {phases.map(phase => (
                  <button
                    key={phase.name}
                    onClick={() => setActivePhaseTab(phase.name)}
                    className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${activePhaseTab === phase.name ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {phase.name}
                  </button>
                ))}
              </div>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  {activePhaseTab} Documents
                </h4>
                {renderDocumentEntries(activePhaseTab)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white transition-colors">Close</button>
        </div>
      </div>

      {/* ── Review Modal ──────────────────────────────────────────────────── */}
      {isReportReviewOpen && selectedReportPhase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h3 className="text-lg font-semibold">Review Phase Report: {selectedReportPhase}</h3>
                <p className="text-sm text-gray-500 mt-1">{project.title}</p>
              </div>
              <button onClick={() => { setIsReportReviewOpen(false); setSelectedReportPhase(null); setApprovalNotes(''); }} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {renderFullReportContent(selectedReportPhase)}

              {/* Uploaded documents attached to this phase */}
              {getPhaseDocuments(selectedReportPhase).length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Attached Documents
                  </p>
                  {renderDocumentEntries(selectedReportPhase)}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <div className="flex-1 mr-4">
                <textarea
                  value={approvalNotes}
                  onChange={e => setApprovalNotes(e.target.value)}
                  placeholder="Add approval notes or comments (visible to the external team)..."
                  className="w-full border rounded-lg p-2 text-sm"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setIsReportReviewOpen(false); setSelectedReportPhase(null); setApprovalNotes(''); }} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">
                  Close
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                  Request Changes
                </button>
                <button
                  onClick={handleApprovePhase}
                  disabled={isApproving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isApproving ? 'Approving...' : 'Approve Phase'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Flag icon
// Flag icon component (add before the export default)
const Flag = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);