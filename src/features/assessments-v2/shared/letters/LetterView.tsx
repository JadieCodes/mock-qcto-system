import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import type { GeneratedLetter } from './types';

export function LetterView({ letter }: { letter: GeneratedLetter }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-6 shadow-sm whitespace-pre-wrap font-serif text-sm text-gray-800">
        {letter.body}
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>
    </div>
  );
}
