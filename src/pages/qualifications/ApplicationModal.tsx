// components/qualifications/ApplicationModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, FileText, Mail, FileCheck2, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (applicationData: any) => void;
  mode: 'create' | 'view' | 'evalReadOnly';
  application: any | null;
}

export default function ApplicationModal({
  isOpen,
  onClose,
  onSave,
  mode,
  application
}: ApplicationModalProps) {
  // ── Helper: build fresh form state from an application object (or empty) ──
  const buildFormData = (app: any) => ({
    qualificationType:  app?.qualificationType  || '',
    actionType:         app?.actionType         || '',
    occupationTitle:    app?.occupationTitle    || '',
    ofoCode:            app?.ofoCode            || '',
    specialisationTitle:app?.specialisationTitle|| '',
    setaChamber:        app?.setaChamber        || '',
    sicCode:            app?.sicCode            || '',
    existingQualId:     app?.existingQualId     || '',
    existingQualTitle:  app?.existingQualTitle  || '',
    existingQualLevel:  app?.existingQualLevel  || '',
    existingQualCredits:app?.existingQualCredits|| '',
    existingQualQP:     app?.existingQualQP     || '',
    learnershipRegNo:   app?.learnershipRegNo   || '',
    learnershipTitle:   app?.learnershipTitle   || '',
    learnershipNqfLevel:app?.learnershipNqfLevel|| '',
    errp:           app?.errp           || false,
    ndp:            app?.ndp            || false,
    ngp:            app?.ngp            || false,
    ipap:           app?.ipap           || false,
    sips:           app?.sips           || false,
    n4n6Reconfig:   app?.n4n6Reconfig   || false,
    scarceSkills:   app?.scarceSkills   || false,
    legacyOqsf:     app?.legacyOqsf     || false,
    otherPriority:  app?.otherPriority  || false,
    rationale:        app?.rationale        || '',
    regulatoryBodies: app?.regulatoryBodies || '',
    applicantName:       app?.applicantName       || '',
    applicantDesignation:app?.applicantDesignation|| '',
    applicantEmail:      app?.applicantEmail      || '',
    applicantSignature:  app?.applicantSignature  || '',
    applicationDate:     app?.applicationDate     || '',
    qualityPartnerName:  app?.qualityPartnerName  || '',
    documents: app?.documents || { motivation: null, reference: null, acrLetter: null, other: null }
  });

  const [formData, setFormData] = useState(() => buildFormData(application));
  const [report, setReport] = useState(application?.report || null);
  const [isVerified, setIsVerified] = useState(application?.status === 'verified');
  const [evalTab, setEvalTab] = useState<'details' | 'evaluation' | 'acknowledgement' | 'outcome'>('details');
  const [expandedEvalSection, setExpandedEvalSection] = useState<string | null>('summary');

  // ── Reset all form state whenever the modal opens with a different application ──
  // This prevents data from a previously opened application bleeding into a new one.
  useEffect(() => {
    setFormData(buildFormData(application));
    setReport(application?.report || null);
    setIsVerified(application?.status === 'verified');
    setEvalTab('details');
    setExpandedEvalSection('summary');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id, mode, isOpen]);

  if (!isOpen) return null;

  const isEvalReadOnly = mode === 'evalReadOnly';
  const isDisabled = isEvalReadOnly || (mode === 'view' && application?.status !== 'draft');

  // Stored evaluation data
  const storedEval = application?.evaluationSummary;
  const storedLetter = application?.acknowledgementLetter;
  const storedOutcome = application?.outcomeLetter;

  const handleFileUpload = (documentType: string, file: File) => {
    setFormData({ ...formData, documents: { ...formData.documents, [documentType]: file.name } });
  };

  const handleVerifyAndGenerateReport = () => {
    const allDocsPresent = formData.documents.motivation && formData.documents.reference && formData.documents.acrLetter;
    const draftReport = {
      applicationId: application?.id || 'New Application',
      applicant: formData.applicantName,
      qualification: formData.occupationTitle,
      qualificationType: formData.qualificationType,
      actionType: formData.actionType,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      documents: [
        { label: 'Motivation', status: !!formData.documents.motivation, file: formData.documents.motivation },
        { label: 'Reference', status: !!formData.documents.reference, file: formData.documents.reference },
        { label: 'ACR Letter', status: !!formData.documents.acrLetter, file: formData.documents.acrLetter },
        { label: 'Other Document', status: !!formData.documents.other, optional: true, file: formData.documents.other }
      ],
      overallStatus: allDocsPresent ? 'complete' : 'incomplete',
      recommendation: allDocsPresent ? 'Proceed to next stage - Application meets minimum requirements.' : 'Hold - Please upload all required documents.'
    };
    setReport({ verified: true, draftReport, verificationDate: new Date().toISOString().split('T')[0] });
    setIsVerified(true);
  };

  const handleSubmit = () => { onSave({ ...formData, report, status: 'submitted' }); };
  const handleSave = () => { onSave({ ...formData, report, status: 'draft' }); };

  const uploadDocuments = [
    { id: 'motivation', label: 'Motivation', required: true },
    { id: 'reference', label: 'Reference', required: true },
    { id: 'acrLetter', label: 'ACR Letter', required: true },
    { id: 'other', label: 'Other Document', required: false }
  ];

  // ── Read-only field helper ─────────────────────────────────────────────────
  const ROField = ({ label, value }: { label: string; value: string }) => (
    <div><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{value || 'Not specified'}</p></div>
  );

  // ── QCTO Letterhead ────────────────────────────────────────────────────────
  const Letterhead = () => (
    <div className="text-center border-b pb-4 mb-4">
      <div className="inline-flex items-center gap-2 mb-1"><div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">QCTO</div><span className="text-sm font-semibold text-gray-700">Quality Council for Trades and Occupations</span></div>
      <div className="text-xs text-gray-500">256 Glyn Street, Hatfield, Pretoria, 0083 | +27 12 003 1800 | www.qcto.org.za</div>
      <div className="text-xs text-gray-500 mt-0.5">Enquiries: <span className="text-blue-600">qualifications@qcto.org.za</span> | Tel: 012 003 0103</div>
    </div>
  );

  // ── Evaluation Outcome tab ─────────────────────────────────────────────────
  const renderEvalOutcomeTab = () => (
    <div className="space-y-4">
      {/* ── Evaluation Summary Report ── */}
      <div className="border-2 border-purple-100 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedEvalSection(expandedEvalSection === 'summary' ? null : 'summary')}
          className="w-full flex items-center justify-between px-5 py-3 bg-purple-50 hover:bg-purple-100 transition-colors"
        >
          <span className="font-semibold text-purple-800 flex items-center gap-2"><FileCheck2 className="w-4 h-4" />Evaluation Summary Report</span>
          {expandedEvalSection === 'summary' ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-purple-600" />}
        </button>
        {expandedEvalSection === 'summary' && (
          <div className="p-5 space-y-4">
            {storedEval ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Recommendation:</span>{' '}
                    {storedEval.recommendation === 'approve' ? <span className="text-green-700 font-semibold">✓ Approved for Committee</span> : <span className="text-red-700 font-semibold">✗ Return for Amendments</span>}
                  </div>
                  <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Signed by:</span> {storedEval.signature || '—'}</div>
                  <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Date:</span> {storedEval.date || '—'}</div>
                  <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Completed by:</span> {storedEval.completedBy || '—'}</div>
                </div>
                {storedEval.notes && <div className="bg-gray-50 px-3 py-2 rounded border text-sm"><span className="font-medium">Notes:</span> {storedEval.notes}</div>}
                {storedEval.evaluationApplications?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Applications Evaluated</p>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left border">TYPE</th><th className="px-3 py-2 text-left border">OFO Code</th><th className="px-3 py-2 text-left border">Qualification Title</th><th className="px-3 py-2 text-left border">Specialisation</th><th className="px-3 py-2 text-left border">Quality Partner</th><th className="px-3 py-2 text-left border">Criterion Met</th></tr></thead>
                        <tbody>{storedEval.evaluationApplications.map((a: any) => (<tr key={a.id} className="border-t"><td className="px-3 py-2 border">{a.type}</td><td className="px-3 py-2 border">{a.ofoCode}</td><td className="px-3 py-2 border">{a.qualificationTitle}</td><td className="px-3 py-2 border">{a.specialisation}</td><td className="px-3 py-2 border">{a.qualityPartner}</td><td className="px-3 py-2 border">{a.criterionMet}</td></tr>))}</tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : <p className="text-sm text-gray-400 italic">No evaluation summary data available.</p>}
          </div>
        )}
      </div>

      {/* ── Acknowledgement Letter ── */}
      <div className="border-2 border-green-100 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedEvalSection(expandedEvalSection === 'ack' ? null : 'ack')}
          className="w-full flex items-center justify-between px-5 py-3 bg-green-50 hover:bg-green-100 transition-colors"
        >
          <span className="font-semibold text-green-800 flex items-center gap-2"><Mail className="w-4 h-4" />Acknowledgement Letter (Evaluation Receipt)</span>
          {expandedEvalSection === 'ack' ? <ChevronUp className="w-4 h-4 text-green-600" /> : <ChevronDown className="w-4 h-4 text-green-600" />}
        </button>
        {expandedEvalSection === 'ack' && (
          <div className="p-5 space-y-4 text-sm">
            {storedLetter ? (
              <>
                <Letterhead />
                <div className="space-y-1">
                  <p className="font-semibold">{storedLetter.recipientName}</p>
                  <p className="font-semibold">{storedLetter.recipientOrganization}</p>
                  <p className="text-gray-600 whitespace-pre-line">{storedLetter.recipientAddress}</p>
                </div>
                <p>Dear <strong>{storedLetter.recipientName}</strong>,</p>
                <p className="font-semibold underline uppercase">ACKNOWLEDGMENT OF RECEIPT: SKILLS PROGRAMMES RECEIVED FOR EVALUATION</p>
                <p>The Quality Council for Trades and Occupation (QCTO) acknowledges receipt of <strong>{storedLetter.skillsProgrammes?.length || 0}</strong> skills programme(s) received on <strong>{storedLetter.submissionDate}</strong> for evaluation, as follows:</p>
                {storedLetter.skillsProgrammes?.length > 0 && (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left">No.</th><th className="px-3 py-2 border text-left">Type</th><th className="px-3 py-2 border text-left">Descriptor</th><th className="px-3 py-2 border text-left">NQF Level</th><th className="px-3 py-2 border text-left">Credits</th><th className="px-3 py-2 border text-left">Curriculum Code</th></tr></thead>
                      <tbody>{storedLetter.skillsProgrammes.map((sp: any, idx: number) => (<tr key={sp.id} className="border-t"><td className="px-3 py-2 border">{idx + 1}</td><td className="px-3 py-2 border">{sp.type}</td><td className="px-3 py-2 border">{sp.title}</td><td className="px-3 py-2 border">{sp.nqfLevel}</td><td className="px-3 py-2 border">{sp.credits}</td><td className="px-3 py-2 border">{sp.curriculumCode}</td></tr>))}</tbody>
                    </table>
                  </div>
                )}
                {storedLetter.documentsChecklist?.length > 0 && (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left">No.</th><th className="px-3 py-2 border text-left">Document</th><th className="px-3 py-2 border text-center">Submitted</th><th className="px-3 py-2 border text-center">Completed</th></tr></thead>
                      <tbody>{storedLetter.documentsChecklist.map((doc: any, idx: number) => (<tr key={idx} className="border-t"><td className="px-3 py-2 border">{idx + 1}</td><td className="px-3 py-2 border">{doc.documentName}</td><td className="px-3 py-2 border text-center">{doc.submitted ? '✓' : '—'}</td><td className="px-3 py-2 border text-center">{doc.completed ? 'Yes' : 'No'}</td></tr>))}</tbody>
                    </table>
                  </div>
                )}
                {storedLetter.additionalNotes && <div className="bg-gray-50 px-3 py-2 rounded border"><span className="font-medium">Additional Notes:</span> {storedLetter.additionalNotes}</div>}
                <div className="pt-2">
                  <p>Regards,</p>
                  <p className="font-semibold mt-1">{storedLetter.senderName}</p>
                  <p className="text-gray-500">{storedLetter.senderDesignation}</p>
                  <p className="text-gray-500">Date: {storedLetter.letterDate}</p>
                </div>
              </>
            ) : <p className="text-sm text-gray-400 italic">No acknowledgement letter data available.</p>}
          </div>
        )}
      </div>

      {/* ── Outcome Letter ── */}
      <div className="border-2 border-blue-100 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedEvalSection(expandedEvalSection === 'outcome' ? null : 'outcome')}
          className="w-full flex items-center justify-between px-5 py-3 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <span className="font-semibold text-blue-800 flex items-center gap-2"><FileText className="w-4 h-4" />Outcome Letter ({storedOutcome?.letterTypeLabel || 'N/A'})</span>
          {expandedEvalSection === 'outcome' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
        </button>
        {expandedEvalSection === 'outcome' && (
          <div className="p-5 space-y-4 text-sm">
            {storedOutcome?.sent ? (
              <>
                <Letterhead />
                <div className="space-y-1">
                  <p className="font-semibold">{storedOutcome.recipientName}</p>
                  <p className="font-semibold">{storedOutcome.recipientOrganization}</p>
                  <p className="text-gray-600 whitespace-pre-line">{storedOutcome.recipientAddress}</p>
                </div>
                <p>Dear <strong>{storedOutcome.recipientName}</strong>,</p>

                {/* Acknowledgement (DE-ACTIVATE / REPLACE) */}
                {storedOutcome.letterTypeLabel?.includes('De-Activate') || storedOutcome.letterTypeLabel?.includes('Replace') ? (
                  <>
                    <p className="font-semibold uppercase">ACKNOWLEDGEMENT OF RECEIPT: SKILLS PROGRAMME APPLICATION(S)</p>
                    <p>1. The Quality Council for Trades and Occupations (QCTO) acknowledged the receipt of the skills programme application(s) received on <strong>{storedOutcome.receivedDate}</strong>. The details of the skills programmes are as follows:</p>
                    {storedOutcome.programmes?.length > 0 && (
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left">No.</th><th className="px-3 py-2 border text-left">Type</th><th className="px-3 py-2 border text-left">Descriptor</th><th className="px-3 py-2 border text-left">SETA Chamber</th><th className="px-3 py-2 border text-left">SIC Code</th></tr></thead>
                          <tbody>{storedOutcome.programmes.map((p: any, idx: number) => (<tr key={p.id} className="border-t"><td className="px-3 py-2 border">{idx + 1}</td><td className="px-3 py-2 border">{p.type}</td><td className="px-3 py-2 border">{p.descriptor}</td><td className="px-3 py-2 border">{p.setaChamber}</td><td className="px-3 py-2 border">{p.sicCode}</td></tr>))}</tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : null}

                {/* Acknowledgement for Review */}
                {storedOutcome.letterTypeLabel?.includes('Review') ? (
                  <>
                    <p className="font-semibold uppercase">ACKNOWLEDGEMENT OF RECEIPT: APPLICATIONS TO REVIEW REGISTERED OCCUPATIONAL QUALIFICATION(S)</p>
                    <p>Your applications requested to review the following registered occupational qualification(s) refers:</p>
                    {storedOutcome.qualifications?.length > 0 && (
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left">Qual ID</th><th className="px-3 py-2 border text-left">Title</th><th className="px-3 py-2 border text-left">Level</th><th className="px-3 py-2 border text-left">Credits</th><th className="px-3 py-2 border text-left">QAP</th></tr></thead>
                          <tbody>{storedOutcome.qualifications.map((q: any) => (<tr key={q.id} className="border-t"><td className="px-3 py-2 border">{q.qualId}</td><td className="px-3 py-2 border">{q.qualTitle}</td><td className="px-3 py-2 border">{q.level}</td><td className="px-3 py-2 border">{q.credits}</td><td className="px-3 py-2 border">{q.qap}</td></tr>))}</tbody>
                        </table>
                      </div>
                    )}
                    <p>These applications were received on <strong>{storedOutcome.receivedDate}</strong>.</p>
                    <p>The review of the qualifications may only commence once the applications have received approval letter from the QCTO.</p>
                  </>
                ) : null}

                {/* Approval Letter */}
                {storedOutcome.letterTypeLabel === 'Approval Letter' ? (
                  <>
                    <p className="font-semibold uppercase">APPROVAL LETTER: QUALIFICATIONS DEVELOPMENT APPLICATIONS</p>
                    <p>This letter serves to confirm the approval of application(s) received for the development of occupational qualification(s). The QCTO Internal Qualifications Committee seating of <strong>{storedOutcome.iqcDate}</strong> approved the application(s) outlined below:</p>
                    {storedOutcome.qualifications?.length > 0 && (
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left">Type</th><th className="px-3 py-2 border text-left">SAQA ID</th><th className="px-3 py-2 border text-left">Title</th><th className="px-3 py-2 border text-left">NQF Level</th><th className="px-3 py-2 border text-left">Credits</th></tr></thead>
                          <tbody>{storedOutcome.qualifications.map((q: any) => (<tr key={q.id} className="border-t"><td className="px-3 py-2 border">{q.qap}</td><td className="px-3 py-2 border">{q.qualId}</td><td className="px-3 py-2 border">{q.qualTitle}</td><td className="px-3 py-2 border">{q.level}</td><td className="px-3 py-2 border">{q.credits}</td></tr>))}</tbody>
                        </table>
                      </div>
                    )}
                    <p>Your project is linked to <strong>{storedOutcome.cluster}</strong>. Please expect further communication from the relevant Cluster manager in the next 14 working days.</p>
                  </>
                ) : null}

                {/* Decline Letter */}
                {storedOutcome.letterTypeLabel === 'Decline Letter' ? (
                  <>
                    <p className="font-semibold uppercase">SKILLS PROGRAMME IN EVALUATION: NOT MEETING CRITERIA FOR APPROVAL AND RECORDING ON THE OQSF</p>
                    <p>The skills programme mentioned below was evaluated by the QCTO and was found not to meet the criteria for approval and recording on the OQSF.</p>
                    {storedOutcome.declineQualifications?.length > 0 && (
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-100"><tr><th className="px-3 py-2 border text-left">Type</th><th className="px-3 py-2 border text-left">Descriptor</th><th className="px-3 py-2 border text-left">NQF</th><th className="px-3 py-2 border text-left">Credits</th><th className="px-3 py-2 border text-left">Code</th><th className="px-3 py-2 border text-left">Shortcomings</th></tr></thead>
                          <tbody>{storedOutcome.declineQualifications.map((q: any) => (<tr key={q.id} className="border-t"><td className="px-3 py-2 border">{q.qualType}</td><td className="px-3 py-2 border">{q.descriptor}</td><td className="px-3 py-2 border">{q.nqfLevel}</td><td className="px-3 py-2 border">{q.credits}</td><td className="px-3 py-2 border">{q.curriculumCode}</td><td className="px-3 py-2 border whitespace-pre-wrap">{q.shortcomings}</td></tr>))}</tbody>
                        </table>
                      </div>
                    )}
                    {storedOutcome.declineRecommendedBy && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="bg-gray-50 px-3 py-2 rounded border text-xs"><span className="font-medium">Recommended by:</span> {storedOutcome.declineRecommendedBy}<br/><span className="text-gray-500">{storedOutcome.declineRecommendedByDesignation}</span><br/><span className="text-gray-500">Date: {storedOutcome.declineRecommendedDate}</span></div>
                        <div className="bg-gray-50 px-3 py-2 rounded border text-xs"><span className="font-medium">Approved by:</span> {storedOutcome.declineApprovedBy}<br/><span className="text-gray-500">{storedOutcome.declineApprovedByDesignation}</span><br/><span className="text-gray-500">Date: {storedOutcome.declineApprovedDate}</span></div>
                      </div>
                    )}
                  </>
                ) : null}

                {/* Common sender */}
                <div className="pt-3 border-t">
                  <p>Yours sincerely,</p>
                  <p className="font-semibold mt-1">{storedOutcome.senderName}</p>
                  <p className="text-gray-500">{storedOutcome.senderDesignation}</p>
                  <p className="text-gray-500">Date: {storedOutcome.letterDate}</p>
                </div>
              </>
            ) : <p className="text-sm text-gray-400 italic">No outcome letter has been sent yet.</p>}
          </div>
        )}
      </div>
    </div>
  );

  // ── Application form sections (shared between create / view / evalReadOnly) ─

  const renderFormSections = () => (
    <div className="space-y-8">
      {/* SECTION A */}
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
  <h3 className="font-semibold text-gray-900 mb-1">SECTION A: SPECIFY TYPE OF DEVELOPMENT REQUESTED</h3>
  <p className="text-sm text-gray-500 mb-4">Tick the applicable box in the table below:</p>
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-300 px-4 py-2 text-left">QUALIFICATION TYPE</th>
          <th className="border border-gray-300 px-4 py-2 text-center">DEVELOP</th>
          <th className="border border-gray-300 px-4 py-2 text-center">REVIEW</th>
          <th className="border border-gray-300 px-4 py-2 text-center">DE-ACTIVATE</th>
          <th className="border border-gray-300 px-4 py-2 text-center">REPLACE</th>
        </tr>
      </thead>
      <tbody>
        {[
          { label: 'QUALIFICATION', val: 'QUALIFICATION' },
          { label: 'PART-QUALIFICATION', val: 'PART-QUALIFICATION' },
          { label: 'SKILLS PROGRAMME', val: 'SKILLS PROGRAMME' }
        ].map(({ label, val }) => (
          <tr key={val}>
            <td className="border border-gray-300 px-4 py-2 font-medium">{label}</td>
            {['DEVELOP', 'REVIEW', 'DE-ACTIVATE', 'REPLACE'].map(action => (
              <td key={action} className="border border-gray-300 px-4 py-2 text-center">
                <input
                  type="radio"
                  name="qualificationTypeAction"
                  value={`${val}_${action}`}
                  checked={formData.qualificationType === val && formData.actionType === action}
                  onChange={() => setFormData({ ...formData, qualificationType: val, actionType: action })}
                  disabled={isDisabled}
                  className="w-4 h-4"
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

      {/* SECTION B1 */}
      <div className="border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">SECTION B1: OCCUPATION DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['Occupation Title', 'occupationTitle', 'e.g., Bus Driver'], ['OFO Code', 'ofoCode', 'e.g., 7331011'], ['Specialisation Title', 'specialisationTitle', 'Enter specialisation if applicable'], ['SETA Chamber', 'setaChamber', 'SETA Chamber'], ['SIC Code', 'sicCode', 'SIC Code']].map(([label, field, placeholder]) => (
            <div key={field}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type="text" value={(formData as any)[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} disabled={isDisabled} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder={placeholder} /></div>
          ))}
        </div>
      </div>

      {/* SECTION B2 */}
      <div className="border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">SECTION B2: EXISTING QUALIFICATION AFFECTED</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['Qualification ID', 'existingQualId', 'e.g., 94202'], ['Qualification Title', 'existingQualTitle', 'e.g., Occupational Certificate: Bus Driver'], ['NQF Level', 'existingQualLevel', 'e.g., 3'], ['Credits', 'existingQualCredits', 'e.g., 120']].map(([label, field, placeholder]) => (
            <div key={field}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type="text" value={(formData as any)[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} disabled={isDisabled} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder={placeholder} /></div>
          ))}
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Quality Partner (QP)</label><input type="text" value={formData.existingQualQP} onChange={e => setFormData({ ...formData, existingQualQP: e.target.value })} disabled={isDisabled} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., TETA" /></div>
        </div>
      </div>

      {/* SECTION B3 */}
      <div className="border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">SECTION B3: LEARNERSHIP DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['Learnership Registration Number', 'learnershipRegNo', 'e.g., 32 Q 320118 11 120 3'], ['Learnership Title', 'learnershipTitle', 'e.g., Occupational Certificate: Bus Driver'], ['NQF Level', 'learnershipNqfLevel', 'e.g., 3']].map(([label, field, placeholder]) => (
            <div key={field}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type="text" value={(formData as any)[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} disabled={isDisabled} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder={placeholder} /></div>
          ))}
        </div>
      </div>

      {/* SECTION B4 */}
      <div className="border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">SECTION B4: POLICY & PRIORITY ALIGNMENTS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[['errp', 'Economic Reconstruction and Recovery Plan (ERRP)'], ['ndp', 'National Development Plan'], ['ngp', 'New Growth Path'], ['ipap', 'Industrial Policy Action Plan'], ['sips', 'Strategic Infrastructure Projects (SIPs)'], ['n4n6Reconfig', 'N4-N6 Part Qualifications Reconfiguration'], ['scarceSkills', 'DHET Scarce Skills List'], ['legacyOqsf', 'Legacy/Historically OQSF Qualifications'], ['otherPriority', 'Other Priorities']].map(([field, label]) => (
            <label key={field} className="flex items-center gap-3 p-2 border rounded-lg"><input type="checkbox" checked={(formData as any)[field]} onChange={e => setFormData({ ...formData, [field]: e.target.checked })} disabled={isDisabled} className="w-4 h-4" /><span className="text-sm">{label}</span></label>
          ))}
        </div>
      </div>

      {/* SECTION B5 */}
      <div className="border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">SECTION B5: RATIONALE</h3>
        <textarea value={formData.rationale} onChange={e => setFormData({ ...formData, rationale: e.target.value })} disabled={isDisabled} rows={6} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Describe the need, benefit, and typical learners for this occupation..." />
      </div>

      {/* SECTION B6 */}
      <div className="border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">SECTION B6: REGULATORY BODIES & STAKEHOLDERS</h3>
        <textarea value={formData.regulatoryBodies} onChange={e => setFormData({ ...formData, regulatoryBodies: e.target.value })} disabled={isDisabled} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="List regulatory bodies, professional bodies, associations..." />
      </div>

      {/* SECTION C */}
      <div className="border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">SECTION C: QUALITY PARTNER & APPLICANT DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Name of Quality Partner</label><input type="text" value={formData.qualityPartnerName} onChange={e => setFormData({ ...formData, qualityPartnerName: e.target.value })} disabled={isDisabled} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., TETA" /></div>
          {[['Name and Surname of Applicant', 'applicantName', 'e.g., Ms. Sandy Ndlovu'], ['Designation of Applicant', 'applicantDesignation', 'e.g., ETQA Manager']].map(([label, field, placeholder]) => (
            <div key={field}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type="text" value={(formData as any)[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} disabled={isDisabled} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder={placeholder} /></div>
          ))}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" value={formData.applicantEmail} onChange={e => setFormData({ ...formData, applicantEmail: e.target.value })} disabled={isDisabled} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="email@organization.org.za" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="text" value={formData.applicationDate} onChange={e => setFormData({ ...formData, applicationDate: e.target.value })} disabled={isDisabled} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="DD Month YYYY" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Signature</label><input type="text" value={formData.applicantSignature} onChange={e => setFormData({ ...formData, applicantSignature: e.target.value })} disabled={isDisabled} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Applicant signature" /></div>
        </div>
      </div>

      {/* Supporting Documentation */}
      <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-1">Supporting Documentation</h3>
        <p className="text-sm text-gray-500 mb-4">Upload all required documents for the external application submission.</p>
        <div className="space-y-4">
          {uploadDocuments.map((doc) => (
            <div key={doc.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="min-w-[180px]"><div className="text-sm font-medium text-gray-800">{doc.label}{doc.required ? <span className="ml-2 text-xs text-red-500">Required</span> : <span className="ml-2 text-xs text-gray-400">Optional</span>}</div></div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                {formData.documents[doc.id] ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2"><CheckCircle className="w-4 h-4 shrink-0" /><span className="break-all">{formData.documents[doc.id]}</span></div>
                ) : <div className="text-sm text-gray-400">No file selected</div>}
                {(mode === 'create' || application?.status === 'draft') && (
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-700">
                    <Upload className="w-4 h-4" />Choose File
                    <input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(doc.id, e.target.files[0]); }} />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verify button */}
      {mode === 'view' && application?.status === 'draft' && !report && (
        <div className="border-t pt-4">
          <button onClick={handleVerifyAndGenerateReport} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">Gate Evaluation Check & Generate Draft Report</button>
        </div>
      )}

      {/* Report Display */}
      {report && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Draft Report</h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b"><h3 className="text-lg font-semibold text-gray-900">Gate Evaluation Report</h3><p className="text-sm text-gray-500">Generated on {report.draftReport.date} at {report.draftReport.time}</p></div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Application ID</p><p className="font-medium">{report.draftReport.applicationId}</p></div>
                <div><p className="text-sm text-gray-500">Applicant</p><p className="font-medium">{report.draftReport.applicant}</p></div>
                <div><p className="text-sm text-gray-500">Qualification Type</p><p className="font-medium">{report.draftReport.qualificationType || 'Not specified'}</p></div>
                <div><p className="text-sm text-gray-500">Action Type</p><p className="font-medium">{report.draftReport.actionType || 'Not specified'}</p></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Document Verification</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-4 py-2">Document</th><th className="text-left px-4 py-2">Status</th><th className="text-left px-4 py-2">File</th></tr></thead>
                  <tbody>{report.draftReport.documents.map((doc: any, idx: number) => (<tr key={idx} className="border-t"><td className="px-4 py-2">{doc.label}{doc.optional && <span className="ml-2 text-xs text-gray-400">(Optional)</span>}</td><td className="px-4 py-2">{doc.status ? <span className="text-green-600 font-medium">✓ Present</span> : doc.optional ? <span className="text-gray-400">—</span> : <span className="text-red-600 font-medium">✗ Missing</span>}</td><td className="px-4 py-2 text-gray-600">{doc.file || 'Not uploaded'}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div><p className="text-sm text-gray-500">Overall Status</p><p className={`font-semibold ${report.draftReport.overallStatus === 'complete' ? 'text-green-600' : 'text-red-600'}`}>{report.draftReport.overallStatus === 'complete' ? 'Complete' : 'Incomplete'}</p></div>
                <div className="text-right"><p className="text-sm text-gray-500">Recommendation</p><p className="font-medium text-gray-800 max-w-md">{report.draftReport.recommendation}</p></div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Verified on: {report.verificationDate}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'QCTO Application Form' : mode === 'evalReadOnly' ? 'Application & Evaluation Outcome' : 'Application Details'}
            </h2>
            {mode === 'evalReadOnly' && application && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">{application.qualificationType} / {application.actionType}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Outcome Received</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        {/* Tabs — evalReadOnly gets extra tab */}
        {isEvalReadOnly && (
          <div className="px-6 border-b flex gap-6 bg-white">
            {[
              { key: 'details', label: 'Application Details', icon: <FileText className="w-4 h-4" /> },
              { key: 'evaluation', label: 'Evaluation Outcome', icon: <ClipboardList className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setEvalTab(tab.key as any)}
                className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-1.5 ${evalTab === tab.key ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEvalReadOnly && evalTab === 'evaluation'
            ? renderEvalOutcomeTab()
            : renderFormSections()
          }
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            {isEvalReadOnly ? 'Close' : 'Cancel'}
          </button>
          {mode === 'create' && (
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create Application</button>
          )}
          {mode === 'view' && application?.status === 'draft' && !report && (
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save Draft</button>
          )}
          {mode === 'view' && report && application?.status === 'draft' && (
            <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Submit Application</button>
          )}
        </div>
      </div>
    </div>
  );
}