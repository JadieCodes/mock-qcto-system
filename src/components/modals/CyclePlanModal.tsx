// components/qualifications/CyclePlanModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X, Save, Upload, Edit, Plus, Trash2, FileText, CheckCircle, Clock, Mail, FileCheck2, Lock
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

// ── Phase definitions ──────────────────────────────────────────────────────────
// All 8 phases in order. The last 3 are mandatory (cannot be removed).
// 'qualFull' marks the phase that only appears for full qualifications.
const ALL_PHASES: Array<{ name: string; required: boolean; qualFull?: boolean }> = [
  { name: 'Scoping',                                              required: false },
  { name: 'Profiling',                                            required: false },
  { name: 'Develop Curriculum Specifications',                    required: false },
  { name: 'Develop Assessment Specifications',                    required: false },
  { name: 'Develop QAS Addendum',                                 required: false, qualFull: true },
  { name: 'Develop Qualification Document + Stage 1 Evaluation', required: true  },
  { name: 'Final Verification',                                   required: true  },
  { name: 'Stage 2 Evaluation (by QP) + Submission to QCTO',     required: true  },
];

const MANDATORY_PHASE_NAMES = ALL_PHASES.filter(p => p.required).map(p => p.name);

// Build the default phase list for a new plan based on qualification type
const buildDefaultPhases = (qualType?: string): Phase[] => {
  const isFull = !qualType ||
    (qualType || '').toUpperCase().includes('QUALIFICATION') ||
    (qualType || '').toUpperCase().includes('PART');

  return ALL_PHASES
    .filter(p => !p.qualFull || isFull)
    .map(p => ({
      name: p.name,
      startDate: '',
      endDate: '',
      responsibleRole: defaultRole(p.name),
      status: 'pending' as const,
      required: p.required
    }));
};

const defaultRole = (phaseName: string): string => {
  if (phaseName.includes('Curriculum'))    return 'Curriculum Developer';
  if (phaseName.includes('Assessment'))   return 'Assessment Specialist';
  if (phaseName.includes('QAS'))          return 'Quality Assurer';
  if (phaseName.includes('Qualification') || phaseName.includes('Stage 1')) return 'Curriculum Developer';
  if (phaseName.includes('Final'))        return 'Quality Assurer';
  if (phaseName.includes('Stage 2'))      return 'Subject Matter Expert';
  if (phaseName === 'Scoping')            return 'Project Manager';
  if (phaseName === 'Profiling')          return 'Subject Matter Expert';
  return 'Curriculum Developer';
};

const responsibleRoles = [
  'Curriculum Developer', 'Subject Matter Expert', 'Instructional Designer',
  'Assessment Specialist', 'Quality Assurer', 'Project Manager', 'Industry Advisor', 'Academic Board'
];
const industries = [
  'Information Technology', 'Engineering', 'Business Management', 'Education',
  'Health Sciences', 'Agriculture', 'Hospitality', 'Creative Arts'
];
const nqfLevels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export default function CyclePlanModal({
  isOpen, onClose, onSave, onPhaseComplete, plan, application, mode
}: CyclePlanModalProps) {
  const [formData, setFormData] = useState<Partial<CyclePlan>>({
    title: '', qualificationCode: '', industry: '', nqfLevel: '',
    startDate: '', endDate: '', status: 'Planning', phases: []
  });
  const [activeTab, setActiveTab] = useState<'details' | 'phases' | 'evaluation'>('details');

  // Resolve application for Evaluation Outcome tab
  const resolvedApp: any = application ?? (plan as any)?.applicationData ?? null;
  const storedEval    = resolvedApp?.evaluationSummary;
  const storedLetter  = resolvedApp?.acknowledgementLetter;
  const storedOutcome = resolvedApp?.outcomeLetter;
  const hasEvalData   = !!(storedEval?.evaluationApplications || storedLetter || storedOutcome?.sent);

  useEffect(() => {
    setActiveTab('details');
    if (plan) {
      // Existing plan — ensure mandatory phases still carry the required flag
      const phasesWithFlags = plan.phases.map(p => ({
        ...p,
        required: MANDATORY_PHASE_NAMES.includes(p.name)
      }));
      setFormData({ ...plan, phases: phasesWithFlags });
    } else if (application) {
      setFormData({
        title: application.qualification,
        qualificationCode: application.id,
        industry: '',
        nqfLevel: '',
        startDate: '',
        endDate: '',
        status: 'Planning',
        phases: buildDefaultPhases(application.qualificationType)
      });
    } else {
      setFormData({
        title: '', qualificationCode: '', industry: '', nqfLevel: '',
        startDate: '', endDate: '', status: 'Planning',
        phases: buildDefaultPhases()
      });
    }
  }, [plan?.id, application?.id, isOpen]);

  // ── Phase helpers ──────────────────────────────────────────────────────────

  const isMandatory = (phaseName: string) => MANDATORY_PHASE_NAMES.includes(phaseName);

  // Optional phases are the ones not in the mandatory list
  const OPTIONAL_PHASE_NAMES = ALL_PHASES.filter(p => !p.required).map(p => p.name);

  const addablePhases = OPTIONAL_PHASE_NAMES.filter(
    name => !(formData.phases || []).some(p => p.name === name)
  );

  const handleAddPhase = (name: string) => {
    const newPhase: Phase = {
      name,
      startDate: '',
      endDate: '',
      responsibleRole: defaultRole(name),
      status: 'pending',
      required: false
    };
    // Insert before the first mandatory phase so order is preserved
    const phases = [...(formData.phases || [])];
    const firstMandatoryIdx = phases.findIndex(p => isMandatory(p.name));
    if (firstMandatoryIdx === -1) {
      phases.push(newPhase);
    } else {
      phases.splice(firstMandatoryIdx, 0, newPhase);
    }
    setFormData({ ...formData, phases });
  };

  const handleRemovePhase = (index: number) => {
    const phases = formData.phases || [];
    if (isMandatory(phases[index]?.name)) return; // should never be reachable via UI
    setFormData({ ...formData, phases: phases.filter((_, i) => i !== index) });
  };

  const handlePhaseChange = (index: number, field: keyof Phase, value: string) => {
    const updated = [...(formData.phases || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, phases: updated });
  };

  // ── Save helpers ───────────────────────────────────────────────────────────

  const handleSaveDraft  = () => { onSave({ ...formData, status: 'Planning' }); };
  const handlePublish    = () => { onSave({ ...formData, status: 'Published' }); };
  const handleUpdate     = () => { onSave(formData); };

  if (!isOpen) return null;

  const isViewMode   = mode === 'view';
  const isEditMode   = mode === 'edit';
  const isCreateMode = mode === 'create';
  const isPublished  = plan?.status === 'Published';

  // ── Evaluation Outcome tab ────────────────────────────────────────────────

  const renderEvaluationTab = () => (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-medium">
          This application was approved through the QCTO Internal Evaluation process.
          The evaluation documents and outcome letter are displayed below for reference.
        </p>
      </div>

      {storedEval?.evaluationApplications && (
        <div className="border-2 border-purple-100 rounded-lg overflow-hidden">
          <div className="bg-purple-50 px-5 py-3 border-b border-purple-100">
            <h4 className="font-semibold text-purple-800 flex items-center gap-2"><FileCheck2 className="w-4 h-4" />Evaluation Summary Report</h4>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Recommendation:</span> <span className="text-green-700 font-semibold">✓ {storedEval.recommendation === 'approve' ? 'Approved for Committee' : 'Return for Amendments'}</span></div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Signed by:</span> {storedEval.signature || '—'}</div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Date:</span> {storedEval.date || '—'}</div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Completed by:</span> {storedEval.completedBy || '—'}</div>
            </div>
            {storedEval.notes && <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Notes:</span> {storedEval.notes}</div>}
            {storedEval.evaluationApplications?.length > 0 && (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left">TYPE</th><th className="px-3 py-2 border text-left">OFO Code</th><th className="px-3 py-2 border text-left">Qualification Title</th><th className="px-3 py-2 border text-left">Quality Partner</th><th className="px-3 py-2 border text-left">Criterion Met</th><th className="px-3 py-2 border text-left">Rationale</th></tr></thead>
                  <tbody>{storedEval.evaluationApplications.map((a: any) => (<tr key={a.id} className="border-t"><td className="px-3 py-2 border">{a.type}</td><td className="px-3 py-2 border">{a.ofoCode}</td><td className="px-3 py-2 border">{a.qualificationTitle}</td><td className="px-3 py-2 border">{a.qualityPartner}</td><td className="px-3 py-2 border">{a.criterionMet}</td><td className="px-3 py-2 border">{a.rationale}</td></tr>))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {storedLetter && (
        <div className="border-2 border-green-100 rounded-lg overflow-hidden">
          <div className="bg-green-50 px-5 py-3 border-b border-green-100">
            <h4 className="font-semibold text-green-800 flex items-center gap-2"><Mail className="w-4 h-4" />Acknowledgement Letter (Evaluation Receipt)</h4>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">To:</span> {storedLetter.recipientName || '—'}</div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Organization:</span> {storedLetter.recipientOrganization || '—'}</div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Sent by:</span> {storedLetter.senderName || '—'}</div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Letter Date:</span> {storedLetter.letterDate || '—'}</div>
            </div>
            {storedLetter.skillsProgrammes?.length > 0 && (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left">No.</th><th className="px-3 py-2 border text-left">Type</th><th className="px-3 py-2 border text-left">Descriptor</th><th className="px-3 py-2 border text-left">NQF</th><th className="px-3 py-2 border text-left">Credits</th><th className="px-3 py-2 border text-left">Code</th></tr></thead>
                  <tbody>{storedLetter.skillsProgrammes.map((sp: any, idx: number) => (<tr key={sp.id} className="border-t"><td className="px-3 py-2 border">{idx + 1}</td><td className="px-3 py-2 border">{sp.type}</td><td className="px-3 py-2 border">{sp.title}</td><td className="px-3 py-2 border">{sp.nqfLevel}</td><td className="px-3 py-2 border">{sp.credits}</td><td className="px-3 py-2 border">{sp.curriculumCode}</td></tr>))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {storedOutcome?.sent && storedOutcome.letterTypeLabel === 'Approval Letter' && (
        <div className="border-2 border-blue-100 rounded-lg overflow-hidden">
          <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" />Approval Letter: Qualifications Development</h4>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">To:</span> {storedOutcome.recipientName || '—'}</div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Organization:</span> {storedOutcome.recipientOrganization || '—'}</div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">IQC Date:</span> {storedOutcome.iqcDate || '—'}</div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Cluster:</span> {storedOutcome.cluster || '—'}</div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Sent by:</span> {storedOutcome.senderName || '—'}</div>
              <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Letter Date:</span> {storedOutcome.letterDate || '—'}</div>
            </div>
            {storedOutcome.qualifications?.length > 0 && (
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left">Type</th><th className="px-3 py-2 border text-left">SAQA ID</th><th className="px-3 py-2 border text-left">Title</th><th className="px-3 py-2 border text-left">NQF Level</th><th className="px-3 py-2 border text-left">Credits</th></tr></thead>
                  <tbody>{storedOutcome.qualifications.map((q: any) => (<tr key={q.id} className="border-t"><td className="px-3 py-2 border">{q.qap}</td><td className="px-3 py-2 border">{q.qualId}</td><td className="px-3 py-2 border">{q.qualTitle}</td><td className="px-3 py-2 border">{q.level}</td><td className="px-3 py-2 border">{q.credits}</td></tr>))}</tbody>
                </table>
              </div>
            )}
            <p className="text-gray-600">Your project is linked to <strong>{storedOutcome.cluster}</strong>. The approved application(s) must be included in your qualifications development quarterly reporting to the QCTO.</p>
          </div>
        </div>
      )}

      {!hasEvalData && (
        <div className="text-center py-10 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No evaluation data found for this application.</p>
        </div>
      )}
    </div>
  );

  // ── Details tab ───────────────────────────────────────────────────────────

  const renderDetailsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification Name <span className="text-red-500">*</span></label>
            <input type="text" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })}
              disabled={isViewMode || !isCreateMode}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Enter qualification name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification Code / ID</label>
            <input type="text" value={formData.qualificationCode || ''} disabled className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Sector <span className="text-red-500">*</span></label>
            <select value={formData.industry || ''} onChange={e => setFormData({ ...formData, industry: e.target.value })}
              disabled={isViewMode} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select industry</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NQF Level <span className="text-red-500">*</span></label>
            <select value={formData.nqfLevel || ''} onChange={e => setFormData({ ...formData, nqfLevel: e.target.value })}
              disabled={isViewMode} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select NQF level</option>
              {nqfLevels.map(l => <option key={l} value={l}>Level {l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
              <input type="date" value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                disabled={isViewMode} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date <span className="text-red-500">*</span></label>
              <input type="date" value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                disabled={isViewMode} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          {/* Status — only editable in edit mode (not create, not view) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            {isCreateMode ? (
              <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-gray-50 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                Planning (set automatically on creation)
              </div>
            ) : (
              <select value={formData.status || 'Planning'} onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                disabled={isViewMode || isPublished} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Published">Published</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {formData.phases && formData.phases.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Phase Summary</h4>
          <div className="grid grid-cols-4 gap-4">
            <div><p className="text-xs text-gray-500">Total Phases</p><p className="text-lg font-bold">{formData.phases.length}</p></div>
            <div><p className="text-xs text-gray-500">Completed</p><p className="text-lg font-bold text-green-600">{formData.phases.filter(p => p.status === 'completed').length}</p></div>
            <div><p className="text-xs text-gray-500">In Progress</p><p className="text-lg font-bold text-blue-600">{formData.phases.filter(p => p.status === 'in-progress').length}</p></div>
            <div><p className="text-xs text-gray-500">Pending</p><p className="text-lg font-bold text-gray-600">{formData.phases.filter(p => p.status === 'pending').length}</p></div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Phases tab ────────────────────────────────────────────────────────────

  const renderPhasesTab = () => {
    const phases = formData.phases || [];
    const canEdit = !isViewMode && !isPublished;

    return (
      <div className="space-y-4">
        {/* Mandatory phases notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>Mandatory phases</strong> — <em>Develop Qualification Document + Stage 1 Evaluation</em>,{' '}
            <em>Final Verification</em>, and <em>Stage 2 Evaluation (by QP) + Submission to QCTO</em>{' '}
            cannot be removed or renamed.
          </span>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsible Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                {canEdit && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Remove</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {phases.map((phase, index) => {
                const mandatory = isMandatory(phase.name);
                return (
                  <tr key={index} className={`hover:bg-gray-50 ${mandatory ? 'bg-purple-50/30' : ''}`}>
                    {/* Phase number + mandatory badge */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">#{index + 1}</span>
                        {mandatory && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Required</span>
                        )}
                      </div>
                    </td>
                    {/* Phase name — fixed for mandatory, display only */}
                    <td className="px-4 py-3">
                      <span className={`text-sm ${mandatory ? 'font-medium text-gray-800' : 'text-gray-700'}`}>
                        {phase.name}
                      </span>
                    </td>
                    {/* Start date */}
                    <td className="px-4 py-3">
                      {isViewMode
                        ? <span className="text-sm">{phase.startDate || '—'}</span>
                        : <input type="date" value={phase.startDate} onChange={e => handlePhaseChange(index, 'startDate', e.target.value)}
                            className="border rounded px-2 py-1 text-sm w-full" disabled={isPublished} />
                      }
                    </td>
                    {/* End date */}
                    <td className="px-4 py-3">
                      {isViewMode
                        ? <span className="text-sm">{phase.endDate || '—'}</span>
                        : <input type="date" value={phase.endDate} onChange={e => handlePhaseChange(index, 'endDate', e.target.value)}
                            className="border rounded px-2 py-1 text-sm w-full" disabled={isPublished} />
                      }
                    </td>
                    {/* Responsible role */}
                    <td className="px-4 py-3">
                      {isViewMode
                        ? <span className="text-sm">{phase.responsibleRole}</span>
                        : <select value={phase.responsibleRole} onChange={e => handlePhaseChange(index, 'responsibleRole', e.target.value)}
                            className="border rounded px-2 py-1 text-sm w-full" disabled={isPublished}>
                            {responsibleRoles.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                      }
                    </td>
                    {/* Status — read-only when creating (always starts as pending) */}
                    <td className="px-4 py-3">
                      {isViewMode || isCreateMode
                        ? <span className={`text-xs px-2 py-1 rounded-full ${
                            phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                            phase.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'}`}>
                            {phase.status}
                          </span>
                        : <select value={phase.status} onChange={e => handlePhaseChange(index, 'status', e.target.value as any)}
                            className="border rounded px-2 py-1 text-sm" disabled={isPublished}>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                      }
                    </td>
                    {/* Remove button — only for optional phases in edit/create mode */}
                    {canEdit && (
                      <td className="px-4 py-3 text-center">
                        {mandatory
                          ? <span className="text-gray-300"><Lock className="w-4 h-4 inline" /></span>
                          : <button onClick={() => handleRemovePhase(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded" title="Remove phase">
                              <Trash2 className="w-4 h-4" />
                            </button>
                        }
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Add optional phase — only show if there are phases still available to add */}
        {canEdit && addablePhases.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Add optional phase:</span>
            <div className="flex flex-wrap gap-2">
              {addablePhases.map(name => (
                <button key={name} onClick={() => handleAddPhase(name)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                  <Plus className="w-3.5 h-3.5" />{name}
                </button>
              ))}
            </div>
          </div>
        )}

        {phases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No phases defined yet.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {isCreateMode ? 'Create Cycle Plan' : isEditMode ? 'Edit Cycle Plan' : 'Cycle Plan Details'}
            </h2>
            {formData.qualificationCode && (
              <p className="text-sm text-gray-500 mt-1">Qualification: {formData.title}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isViewMode && (
              <button onClick={handleSaveDraft} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                <Save className="w-4 h-4" />Save Draft
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
            <button onClick={() => setActiveTab('details')} className={`py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Qualification Details
            </button>
            <button onClick={() => setActiveTab('phases')} className={`py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'phases' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Development Phases
            </button>
            {hasEvalData && (
              <button onClick={() => setActiveTab('evaluation')} className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === 'evaluation' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <FileCheck2 className="w-4 h-4" />Evaluation Outcome
                <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" title="Data available" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details'    && renderDetailsTab()}
          {activeTab === 'phases'     && renderPhasesTab()}
          {activeTab === 'evaluation' && renderEvaluationTab()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex gap-2">
            {!isViewMode && !isPublished && (
              <>
                <button onClick={handleSaveDraft} className="px-4 py-2 border rounded-lg text-sm hover:bg-white flex items-center gap-2">
                  <Save className="w-4 h-4" />Save Draft
                </button>
                <button onClick={handlePublish} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
                  <Upload className="w-4 h-4" />Publish / Finalize
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isEditMode && !isPublished && (
              <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
                <Edit className="w-4 h-4" />Update Plan
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