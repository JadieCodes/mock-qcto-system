import type { SiteVisit, VisitDomain } from './types';

// QCTO feedback 2.5: Site Visits can be used across QCTO domains. Every domain shares the same
// planning and report chain; who may plan for a domain other than Assessment is still open.
export const VISIT_DOMAIN_LABELS: Record<VisitDomain, string> = {
  assessment: 'Assessment',
  'accreditation-qa': 'Accreditation and Quality Assurance',
  'qualifications-development': 'Qualifications Development',
  certification: 'Certification',
};

export const VISIT_DOMAIN_OPTIONS = Object.keys(VISIT_DOMAIN_LABELS) as VisitDomain[];

export const DEFAULT_VISIT_DOMAIN: VisitDomain = 'assessment';

export function visitDomainOf(visit: SiteVisit): VisitDomain {
  return visit.domain ?? DEFAULT_VISIT_DOMAIN;
}
