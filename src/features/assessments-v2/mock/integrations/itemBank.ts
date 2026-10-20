import { notImplemented, type BackendStubResult } from './types';

// CR-020: possible integration with the legacy AIDB / item bank system. Architecture is
// pending a QCTO internal decision — no screen until that's resolved.
export function fetchFromItemBank(instrumentId: string): Promise<BackendStubResult> {
  return notImplemented('CR-020', `Legacy AIDB / item bank integration not decided yet (instrument "${instrumentId}").`);
}
