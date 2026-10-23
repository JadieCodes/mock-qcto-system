// Simulated "already enrolled" learner list, owned by the Quality Assurance domain (CR-036).
// Registration selects from this instead of an uploaded LEISA spreadsheet. Each learner
// belongs to exactly one SDP. Real learner enrolment/ID data lives in QA once that backend
// exists — this is the mock stand-in (see mock/api/qaDomain.ts).
export interface EnrolledLearner {
  id: string;
  fullName: string;
  idNumber: string;
  sdpName: string;
}

export const ENROLLED_LEARNERS: EnrolledLearner[] = [
  { id: 'learner-001', fullName: 'Sipho Dlamini', idNumber: '9801015800087', sdpName: 'Khanya Skills Academy' },
  { id: 'learner-002', fullName: 'Nomvula Mahlangu', idNumber: '9602126800088', sdpName: 'Khanya Skills Academy' },
  { id: 'learner-003', fullName: 'Pieter van der Merwe', idNumber: '9703037800089', sdpName: 'Khanya Skills Academy' },
  { id: 'learner-004', fullName: 'Thandeka Nkosi', idNumber: '9804048800090', sdpName: 'Khanya Skills Academy' },
  { id: 'learner-005', fullName: 'Lindiwe Zulu', idNumber: '9905059800091', sdpName: 'Thabo Technical College' },
  { id: 'learner-006', fullName: 'Johan Botha', idNumber: '9606068800092', sdpName: 'Thabo Technical College' },
  { id: 'learner-007', fullName: 'Palesa Molefe', idNumber: '9707079800093', sdpName: 'Thabo Technical College' },
  { id: 'learner-008', fullName: 'Kagiso Sithole', idNumber: '9808089800094', sdpName: 'Vuma Trade Centre' },
  { id: 'learner-009', fullName: 'Refilwe Mokoena', idNumber: '9909099800095', sdpName: 'Vuma Trade Centre' },
  { id: 'learner-010', fullName: 'Andile Khumalo', idNumber: '9610109800096', sdpName: 'Lerato Training Institute' },
  { id: 'learner-011', fullName: 'Zanele Ndlovu', idNumber: '9711119800097', sdpName: 'Lerato Training Institute' },
  { id: 'learner-012', fullName: 'Bongani Mthembu', idNumber: '9812129800098', sdpName: 'Lerato Training Institute' },
];
