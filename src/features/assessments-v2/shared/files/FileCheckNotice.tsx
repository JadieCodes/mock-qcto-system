import { CheckCircle2 } from 'lucide-react';

// Shown next to an upload: the empty-file message, or "Document checked" for a file that was added.
export function FileCheckError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-red-600">
      {message}
    </p>
  );
}

export function DocumentChecked() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      Document checked
    </span>
  );
}
