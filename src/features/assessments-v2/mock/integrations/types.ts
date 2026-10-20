// Shape returned by every backend-dependent stub in this folder. None of these have a screen —
// they exist so the typed call site is already in place when the real backend arrives.
export interface BackendStubResult {
  status: 'not-implemented';
  cr: string;
  message: string;
}

export function notImplemented(cr: string, message: string): Promise<BackendStubResult> {
  return Promise.resolve({ status: 'not-implemented', cr, message });
}
