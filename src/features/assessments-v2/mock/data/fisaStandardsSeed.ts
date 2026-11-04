import { buildFisaStandardChecklist } from './fisaStandardChecklistItems';
import type { ChecklistSection } from '../../shared/checklist/types';
import type { FisaStandardRecord } from '../../modules/fisa/types';

// Demo seed so the FISA Standards chain isn't empty on first load: one Standard already
// Approved (so the SDP can start instrument development immediately in a demo — see the FISA
// Standards correction in progress.md) plus one waiting at each earlier stage, including the
// QCTO feedback 2.9 stages (Director Office, IAC outcome, CEO signature), so every
// internal role has something in their queue the first time they switch to it. Read by
// `fisa/api.ts`'s `loadStandards()` as the fallback `readStore` seeds — `resetDemoData()`
// clears localStorage, so the next read falls back to these again.

function completedChecklist(): ChecklistSection[] {
  return buildFisaStandardChecklist().map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item, answer: 'yes' as const, comment: 'Confirmed — meets requirements.' })),
  }));
}

export function seedFisaStandards(): FisaStandardRecord[] {
  const blankChecklist = buildFisaStandardChecklist();
  const blankReport = { findings: '', recommendation: '' as const };
  const minutes = (fileName: string, uploadedAt: string, uploadedBy: string) => ({
    fileName,
    fileSize: 184_320,
    fileType: 'application/pdf',
    uploadedAt,
    uploadedBy,
  });
  const doneReport = {
    findings: 'Standard is clear, internally consistent and ready for instrument development.',
    recommendation: 'recommended' as const,
  };

  return [
    {
      id: 'seed-fisa-standard-approved',
      skillsProgrammeTitle: 'Electrical Installation Skills Programme',
      sourceDocuments: [{ fileName: 'electrical-installation-standard.pdf', fileSize: 184_320, uploadedAt: '2026-09-01T08:00:00.000Z' }],
      notes: '',
      workflow: { stageId: 'approved', submittedBy: 'Angela Fourie', submittedById: 'angela-fourie' },
      checklist: completedChecklist(),
      evaluationReport: doneReport,
      iacMinutesFile: minutes('IAC_Minutes_Electrical_Installation.pdf', '2026-09-10T08:00:00.000Z', 'Grace Mokoena'),
      createdBy: 'Fundiswa Ngcobo',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'seed-fisa-standard-ceo-signature',
      skillsProgrammeTitle: 'Plumbing Fundamentals Skills Programme',
      sourceDocuments: [{ fileName: 'plumbing-fundamentals-standard.pdf', fileSize: 162_048, uploadedAt: '2026-09-15T08:00:00.000Z' }],
      notes: '',
      workflow: { stageId: 'ceo-signature', submittedBy: 'Peter Botha', submittedById: 'peter-botha' },
      checklist: completedChecklist(),
      evaluationReport: doneReport,
      iacMinutesFile: minutes('IAC_Minutes_Plumbing_Fundamentals.pdf', '2026-10-20T08:00:00.000Z', 'Peter Botha'),
      createdBy: 'Fundiswa Ngcobo',
      createdAt: '2026-09-15T08:00:00.000Z',
    },
    {
      id: 'seed-fisa-standard-iac-review',
      skillsProgrammeTitle: 'Welding Techniques Skills Programme',
      sourceDocuments: [{ fileName: 'welding-techniques-standard.pdf', fileSize: 201_216, uploadedAt: '2026-09-22T08:00:00.000Z' }],
      notes: '',
      workflow: { stageId: 'iac-review', submittedBy: 'Elsabe Steyn', submittedById: 'elsabe-steyn' },
      checklist: completedChecklist(),
      evaluationReport: doneReport,
      createdBy: 'Fundiswa Ngcobo',
      createdAt: '2026-09-22T08:00:00.000Z',
    },
    {
      id: 'seed-fisa-standard-ceo-signature-declined',
      skillsProgrammeTitle: 'Painting and Decorating Skills Programme',
      sourceDocuments: [{ fileName: 'painting-decorating-standard.pdf', fileSize: 118_784, uploadedAt: '2026-09-18T08:00:00.000Z' }],
      notes: '',
      workflow: { stageId: 'ceo-signature-declined', submittedBy: 'Grace Mokoena', submittedById: 'grace-mokoena' },
      checklist: completedChecklist(),
      evaluationReport: doneReport,
      iacMinutesFile: minutes('IAC_Minutes_Painting_Decorating.pdf', '2026-10-27T08:00:00.000Z', 'Grace Mokoena'),
      createdBy: 'Ayesha Patel',
      createdAt: '2026-09-18T08:00:00.000Z',
    },
    {
      id: 'seed-fisa-standard-director-office-review',
      skillsProgrammeTitle: 'Tiling Skills Programme',
      sourceDocuments: [{ fileName: 'tiling-standard.pdf', fileSize: 131_072, uploadedAt: '2026-09-25T08:00:00.000Z' }],
      notes: '',
      workflow: { stageId: 'director-office-review', submittedBy: 'Peter Botha', submittedById: 'peter-botha' },
      checklist: completedChecklist(),
      evaluationReport: doneReport,
      createdBy: 'Fundiswa Ngcobo',
      createdAt: '2026-09-25T08:00:00.000Z',
    },
    {
      id: 'seed-fisa-standard-dd-review',
      skillsProgrammeTitle: 'Carpentry Basics Skills Programme',
      sourceDocuments: [{ fileName: 'carpentry-basics-standard.pdf', fileSize: 146_944, uploadedAt: '2026-09-29T08:00:00.000Z' }],
      notes: '',
      workflow: { stageId: 'dd-review', submittedBy: 'Sipho Ndlovu', submittedById: 'sipho-ndlovu' },
      checklist: completedChecklist(),
      evaluationReport: doneReport,
      createdBy: 'Fundiswa Ngcobo',
      createdAt: '2026-09-29T08:00:00.000Z',
    },
    {
      id: 'seed-fisa-standard-asd-evaluation',
      skillsProgrammeTitle: 'Bricklaying Skills Programme',
      sourceDocuments: [{ fileName: 'bricklaying-standard.pdf', fileSize: 128_512, uploadedAt: '2026-10-06T08:00:00.000Z' }],
      notes: '',
      workflow: { stageId: 'asd-evaluation', submittedBy: 'Fundiswa Ngcobo', submittedById: 'fundiswa-ngcobo' },
      checklist: blankChecklist,
      evaluationReport: blankReport,
      createdBy: 'Fundiswa Ngcobo',
      createdAt: '2026-10-06T08:00:00.000Z',
    },
    {
      id: 'seed-fisa-standard-qd-submission',
      skillsProgrammeTitle: 'Road Transport Skills Programme',
      sourceDocuments: [{ fileName: 'road-transport-standard.pdf', fileSize: 139_264, uploadedAt: '2026-10-13T08:00:00.000Z' }],
      notes: '',
      workflow: { stageId: 'qd-submission', submittedBy: 'Fundiswa Ngcobo' },
      checklist: blankChecklist,
      evaluationReport: blankReport,
      createdBy: 'Fundiswa Ngcobo',
      createdAt: '2026-10-13T08:00:00.000Z',
    },
  ];
}
