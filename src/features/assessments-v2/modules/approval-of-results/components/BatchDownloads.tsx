import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

// QCTO feedback 3.14 (d): shown on approved EISA and FISA batches, on both portals.
export function BatchDownloads({ onDownloadLetter, onDownloadReport }: { onDownloadLetter: () => void; onDownloadReport: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" className="gap-2" onClick={onDownloadLetter}>
        <Download className="h-4 w-4" />
        Download Outcome Letter
      </Button>
      <Button type="button" size="sm" variant="outline" className="gap-2" onClick={onDownloadReport}>
        <Download className="h-4 w-4" />
        Download verification report
      </Button>
    </div>
  );
}
