// Batch P (05.21): which skills programme each enrolled learner is enrolled for, and the date they
// were enrolled. Owned by the Quality Assurance domain (learner enrolment); this is the mock
// stand-in (see mock/api/qaDomain.ts). Every learner is enrolled for the Electrical Installation
// Skills Programme (the programme the demo FISA results use); a few are also enrolled for the
// other programmes so those can be tried once their FISA Standard is Approved.
import { ENROLLED_LEARNERS } from './enrolledLearners';

export interface SkillsProgrammeEnrolment {
  learnerId: string;
  skillsProgrammeTitle: string;
  // YYYY-MM-DD
  enrolledDate: string;
}

const ELECTRICAL = 'Electrical Installation Skills Programme';

const EXTRA_ENROLMENTS: { skillsProgrammeTitle: string; learnerIds: string[] }[] = [
  { skillsProgrammeTitle: 'Plumbing Fundamentals Skills Programme', learnerIds: ['learner-008', 'learner-009', 'learner-010', 'learner-011', 'learner-012', 'learner-019', 'learner-020', 'learner-021'] },
  { skillsProgrammeTitle: 'Welding Techniques Skills Programme', learnerIds: ['learner-005', 'learner-006', 'learner-007', 'learner-022', 'learner-023', 'learner-024'] },
];

function enrolledDateFor(index: number): string {
  const day = 5 + (index % 20);
  return `2026-0${1 + (index % 3)}-${String(day).padStart(2, '0')}`;
}

export const SKILLS_PROGRAMME_ENROLMENTS: SkillsProgrammeEnrolment[] = [
  ...ENROLLED_LEARNERS.map((l, i) => ({ learnerId: l.id, skillsProgrammeTitle: ELECTRICAL, enrolledDate: enrolledDateFor(i) })),
  ...EXTRA_ENROLMENTS.flatMap((e) =>
    e.learnerIds.map((learnerId) => ({
      learnerId,
      skillsProgrammeTitle: e.skillsProgrammeTitle,
      enrolledDate: enrolledDateFor(ENROLLED_LEARNERS.findIndex((l) => l.id === learnerId) + 7),
    })),
  ),
];
