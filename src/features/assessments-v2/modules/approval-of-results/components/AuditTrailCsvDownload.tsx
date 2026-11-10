import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { downloadCsvFile } from '../../../shared/csv/csv';
import { auditTrailCsv } from '../trackingRegister';

// Batch N2 (29.28): "Download audit trail (CSV)" for one batch, internal only, with an optional
// date range on the entries (blank = all dates).
export function AuditTrailCsvDownload({ recordType, recordId, fileName }: { recordType: string; recordId: string; fileName: string }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const rangeInvalid = !!from && !!to && from > to;

  function download() {
    const { csv, rowCount } = auditTrailCsv(getAuditTrail(recordType, recordId), from, to);
    downloadCsvFile(fileName, csv);
    if (rowCount === 0) toast.info('No audit entries in this range. The file has the headings only.');
  }

  return (
    <div className="flex flex-wrap items-end gap-3 pb-3">
      <div className="space-y-1.5">
        <Label htmlFor={`audit-from-${recordId}`}>From</Label>
        <Input id={`audit-from-${recordId}`} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`audit-to-${recordId}`}>To</Label>
        <Input id={`audit-to-${recordId}`} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <Button type="button" size="sm" variant="outline" className="gap-2" disabled={rangeInvalid} onClick={download}>
        <Download className="h-4 w-4" />
        Download audit trail (CSV)
      </Button>
      {rangeInvalid && <p className="text-xs text-amber-700">Choose a From date that is not after the To date.</p>}
    </div>
  );
}
