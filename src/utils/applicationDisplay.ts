import type { ApplicationForm } from '@/types';

const str = (v: unknown) => (typeof v === 'string' ? v : '');

export function getApplicantInfo(data?: ApplicationForm) {
  const v = data?.answers?.values ?? {};
  return {
    fullName: [str(v.contactFullNames), str(v.contactSurname)].filter(Boolean).join(' ')
      || str(v.declarantFullName) || str(v.applicantNames) || 'N/A',
    idNumber: str(v.declarantIdOrPassportNumber) || 'N/A',
    email: str(v.contactEmail) || 'N/A',
    phone: str(v.contactPhoneOffice) || 'N/A',
    organisationName: str(v.tradingName) || 'N/A',
    companyName: str(v.legalName) || 'N/A',
    companyRegistration: str(v.cipcRegistrationNumber) || 'N/A',
    region: str(v.province) || 'N/A',
    trainingLocation: str(v.physicalAddress) || str(v.accreditedPhysicalAddress) || 'N/A',
  };
}

export function getQualification(data?: ApplicationForm): string {
  if (!data?.answers) return '-';
  const { repeats, values } = data.answers;
  const groups = ['qualifications', 'skillsProgrammes', 'natedProgrammes'];
  for (const g of groups) {
    const first = repeats?.[g]?.[0];
    if (first?.title) return String(first.title);
  }
  return str(values?.qualificationTitle) || '-';
}