import React, { useState } from 'react';

// Mirrors the official SAQA letter layout — read-only
function SaqaLetterPreview({ letter }: { letter: any }) {
  if (!letter) return null;
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-[#003087] px-6 py-3 flex items-center justify-between">
        <div className="text-white">
          <p className="text-xs font-bold tracking-widest uppercase opacity-80">South African Qualifications Authority</p>
          <p className="text-xs opacity-60">SAQA House · 1067 Arcadia Street · Hatfield, 0083</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
          <span className="text-[#003087] font-black text-lg">S</span>
        </div>
      </div>
      <div className="p-6 space-y-4 font-serif text-sm text-gray-800">
        <div className="text-right text-gray-500">{letter.letterDate}</div>
        <div className="space-y-0.5">
          <p className="font-semibold">{letter.recipientName}</p>
          <p>{letter.recipientTitle}</p>
          <p>{letter.recipientOrganisation}</p>
        </div>
        <p className="font-semibold">Dear {letter.recipientName?.split(' ').slice(-1)[0]}</p>
        <p className="font-bold text-center underline uppercase tracking-wide">
          Registration of OQSF Qualifications on the NQF by SAQA
        </p>
        <p className="text-sm">
          I am pleased to inform you that SAQA's NQF Qualifications Committee, at its meeting held on{' '}
          <strong>{letter.committeeDate}</strong>, approved the registration of the following OQSF
          qualification(s) on the National Qualifications Framework.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold w-8">No.</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold">Qualification Title</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold w-24">NQF Level</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold w-20">Min Credits</th>
                <th className="border border-gray-400 px-3 py-2 text-left font-bold w-20">SAQA ID</th>
              </tr>
            </thead>
            <tbody>
              {(letter.rows || []).map((row: any, i: number) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-400 px-3 py-2">{row.no}.</td>
                  <td className="border border-gray-400 px-3 py-2">{row.qualificationTitle}</td>
                  <td className="border border-gray-400 px-3 py-2">{row.nqfLevel}</td>
                  <td className="border border-gray-400 px-3 py-2">{row.minCredits}</td>
                  <td className="border border-gray-400 px-3 py-2">{row.saqaId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Should you require further information, please contact me.</p>
        <p>Sincerely</p>
        <div className="mt-4">
          <div className="w-32 border-b border-gray-500 mb-1" />
          <p className="font-bold uppercase">{letter.signedBy}</p>
          <p className="font-bold uppercase">{letter.signedByTitle}</p>
        </div>
      </div>
    </div>
  );
}

interface RegisteredQualificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  qualification: any | null;
}

export default function RegisteredQualificationsModal({
  isOpen,
  onClose,
  qualification,
}: RegisteredQualificationsModalProps) {
  const [activeTab, setActiveTab] = useState<'registration' | 'saqa_letter' | 'qp_notification'>('registration');

  if (!isOpen || !qualification) return null;

  const dl = qualification.digitalSaqaLetter;
  const qpNotif = qualification.qpNotification;

  const tabs = [
    { id: 'registration', label: 'Registration Details' },
    ...(dl ? [{ id: 'saqa_letter', label: 'SAQA Registration Letter' }] : []),
    ...(qpNotif ? [{ id: 'qp_notification', label: 'QP Notification' }] : []),
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-green-50 to-white shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Registered Qualification Details</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">Via Approval Phase</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Code: {qualification.qualificationCode}
              {qualification.registrationNumber && ` · Reg: ${qualification.registrationNumber}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 overflow-x-auto shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-3 px-4 font-medium whitespace-nowrap text-sm transition-colors relative ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
              {tab.id === 'saqa_letter' && dl && (
                <span className="ml-1.5 w-2 h-2 rounded-full bg-green-500 inline-block" />
              )}
              {tab.id === 'qp_notification' && qpNotif && (
                <span className="ml-1.5 w-2 h-2 rounded-full bg-green-500 inline-block" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Registration Details ── */}
          {activeTab === 'registration' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-sm uppercase text-gray-600 tracking-wide">Registration Information</h3>
                  <div className="space-y-2">
                    {[
                      ['Qualification Title', qualification.qualificationTitle],
                      ['Qualification Code', qualification.qualificationCode],
                      ['NQF Level', `Level ${qualification.nqfLevel}`],
                      ['Credits', `${qualification.credits}`],
                      ['SAQA ID', qualification.saqaId || '—'],
                      ['Registration Number', qualification.registrationNumber],
                      ['Registration Date', qualification.registrationDate],
                      ['Expiry Date', qualification.expiryDate],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-right max-w-xs">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className={`text-sm font-medium capitalize ${
                        qualification.status === 'active' ? 'text-green-600' :
                        qualification.status === 'expiring' ? 'text-yellow-600' : 'text-red-600'
                      }`}>{qualification.status}</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-sm uppercase text-gray-600 tracking-wide">SAQA Decision</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Decision</span><span className="font-medium text-green-600">{qualification.saqaDecision || 'Approved'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Provider</span><span className="font-medium">{qualification.provider}</span></div>
                    {dl && (
                      <>
                        <div className="flex justify-between"><span className="text-gray-500">Committee Date</span><span className="font-medium">{dl.committeeDate}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">SAQA Signatory</span><span className="font-medium">{dl.signedBy}</span></div>
                      </>
                    )}
                  </div>

                  {/* Quick status indicators */}
                  <div className="mt-4 space-y-2">
                    <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${dl ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {dl ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                      </svg>
                      SAQA Registration Letter — {dl ? 'Attached' : 'Not available'}
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${qpNotif ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {qpNotif ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                      </svg>
                      QP Notification — {qpNotif ? `Sent to ${qpNotif.recipientName}` : 'Not sent'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-sm uppercase text-gray-600 tracking-wide">Registration Conditions</h3>
                <div className="space-y-2">
                  {['Annual reporting on graduate employment outcomes', 'Curriculum review every 3 years', 'Maintain accreditation of assessors'].map(cond => (
                    <div key={cond} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {cond}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SAQA Registration Letter ── */}
          {activeTab === 'saqa_letter' && dl && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <div>
                  <p className="font-semibold text-green-800 text-sm">Official SAQA Registration Letter</p>
                  <p className="text-xs text-green-700">
                    Committee meeting: {dl.committeeDate} · Created: {dl.createdDate ? new Date(dl.createdDate).toLocaleDateString() : '—'}
                    {dl.sentDate && ` · Sent to Registration: ${new Date(dl.sentDate).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
              <SaqaLetterPreview letter={dl} />
            </div>
          )}

          {/* ── QP Notification ── */}
          {activeTab === 'qp_notification' && qpNotif && (
            <div className="space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-800 mb-1">Registration Notification Sent to QP</p>
                    <p className="text-xs text-green-600 mb-3">Sent on {new Date(qpNotif.sentDate).toLocaleDateString()}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Recipient</p><p className="font-medium">{qpNotif.recipientName}</p></div>
                      <div><p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Email</p><p className="font-medium">{qpNotif.recipientEmail}</p></div>
                      <div className="col-span-2"><p className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Subject</p><p className="font-medium">{qpNotif.subject}</p></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3">Message</h4>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{qpNotif.message}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t shrink-0 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Close</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Generate Report</button>
        </div>
      </div>
    </div>
  );
}