import { notImplemented, type BackendStubResult } from './types';

// CR-002: a data-quality gate-check at the point of data entry, across the whole system.
// Backend infrastructure, not a screen — stubbed so forms can call it once it exists.
export function runDataQualityGateCheck(formId: string): Promise<BackendStubResult> {
  return notImplemented('CR-002', `No data-quality gate-check infrastructure for "${formId}" yet.`);
}
