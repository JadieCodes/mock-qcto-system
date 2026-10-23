import { notImplemented, type BackendStubResult } from './types';

// CR-037: needs a real Qualifications↔Modules database relationship, plus AI validation
// of an uploaded Statement of Results (SOR) against the qualification's required modules.
export function validateSorAgainstModules(sorId: string, qualificationId: string): Promise<BackendStubResult> {
  return notImplemented(
    'CR-037',
    `No Qualifications↔Modules relationship to validate SOR "${sorId}" against qualification "${qualificationId}" yet.`,
  );
}
