import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Printer, FileText, Download, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Batch, PrintJob } from '@/types';

export default function Printing() {
  const { batches, printJobs, addPrintJob, updatePrintJob, updateBatchStatus, currentRole } = useApp();
  const { toast } = useToast();
  
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedPrintJob, setSelectedPrintJob] = useState<PrintJob | null>(null);

  const canPrint = ['Printer', 'Cert Admin'].includes(currentRole);
  
  // Get batches ready for printing (status = 'integrated')
  const readyForPrinting = batches.filter(b => b.status === 'integrated');

  // Get all print jobs sorted by creation date (newest first)
  const allPrintJobs = [...printJobs].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleCreatePrintJob = () => {
    if (!canPrint) {
      toast({
        title: 'Permission Denied',
        description: 'Only Printer role can create print jobs',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedBatch) {
      toast({
        title: 'Error',
        description: 'Please select a batch',
        variant: 'destructive',
      });
      return;
    }

    const batch = batches.find(b => b.batchUuid === selectedBatch);
    if (!batch) return;

    // Create print job
    addPrintJob({
      batchId: selectedBatch,
      paperStockAllocated: batch.totalCertificates,
      createdAt: new Date().toISOString(),
    });

    // Update batch status to printing
    updateBatchStatus(selectedBatch, 'printing');

    toast({
      title: '✅ Print Job Created',
      description: `Batch ${batch.batchName} sent to printing queue`,
    });

    setSelectedBatch('');
  };

  const handleViewBatchReport = (printJob: PrintJob) => {
    setSelectedPrintJob(printJob);
    setIsReportModalOpen(true);
  };

  const generateBatchReport = (batch: Batch, printJob: PrintJob) => {
    // This would typically generate a PDF, but for now we'll show a modal
    return (
      <div className="space-y-4">
        <div className="border-b pb-2">
          <h3 className="font-semibold text-lg">Batch Print Report</h3>
          <p className="text-sm text-muted-foreground">Generated: {new Date().toLocaleString()}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Batch ID</p>
            <p className="font-mono font-medium">{batch.batchUuid}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Batch Name</p>
            <p className="font-medium">{batch.batchName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium capitalize">
              {batch.isReplace ? 'Replace' : batch.isReissue ? 'Re-Issue' : 'Issue'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Pathway</p>
            <p className="font-medium capitalize">{batch.pathway || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Target System</p>
            <p className="font-medium">{batch.targetSystem || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Certificates</p>
            <p className="font-medium">{batch.totalCertificates}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Paper Stock</p>
            <p className="font-medium">{printJob.paperStockAllocated} sheets</p>
          </div>
          <div>
            <p className="text-muted-foreground">Paper Range</p>
            <p className="font-medium font-mono">
              {batch.paperAllocation?.paperStartNumber} - {batch.paperAllocation?.paperEndNumber}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Certificate Numbers</p>
            <div className="flex flex-wrap gap-1 mt-1 max-h-24 overflow-y-auto">
              {batch.registrationForm?.certificateNumbers.map((cert, idx) => (
                <Badge key={idx} variant="outline" className="text-xs font-mono">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Created By</p>
            <p className="font-medium">{batch.createdBy} at {new Date(batch.createdAt).toLocaleString()}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Printed By</p>
            <p className="font-medium">{currentRole} at {new Date(printJob.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Printing</h2>
        <p className="text-muted-foreground">
          Print certificates from CVS/Apprentice and generate batch reports
        </p>
      </div>

      {/* Create Print Job - Only for Printer role */}
      {canPrint && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Create Print Job
            </CardTitle>
            <CardDescription>
              Select a batch to send to the printing queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Batch</Label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Choose batch to print..." />
                  </SelectTrigger>
                  <SelectContent>
                    {readyForPrinting.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No batches ready for printing
                      </SelectItem>
                    ) : (
                      readyForPrinting.map((batch) => (
                        <SelectItem key={batch.batchUuid} value={batch.batchUuid}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {batch.batchUuid}
                            </Badge>
                            <span>{batch.batchName}</span>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {batch.pathway || 'N/A'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({batch.totalCertificates} certs)
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleCreatePrintJob} 
                  disabled={!selectedBatch || readyForPrinting.length === 0}
                  className="w-full"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Create Print Job
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print Jobs Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Print Jobs Queue</CardTitle>
          <CardDescription>
            {allPrintJobs.length} job(s) in the printing queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pathway</TableHead>
                <TableHead>Certificates</TableHead>
                <TableHead>Paper Stock</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPrintJobs.map((job) => {
                const batch = batches.find(b => b.batchUuid === job.batchId);
                if (!batch) return null;
                
                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">{job.id}</TableCell>
                    <TableCell className="font-mono text-xs">{job.batchId}</TableCell>
                    <TableCell className="font-medium">{batch.batchName}</TableCell>
                    <TableCell>
                      <Badge variant={batch.isReplace ? 'outline' : batch.isReissue ? 'secondary' : 'default'}>
                        {batch.isReplace ? 'Replace' : batch.isReissue ? 'Re-Issue' : 'Issue'}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{batch.pathway || '—'}</TableCell>
                    <TableCell>{batch.totalCertificates}</TableCell>
                    <TableCell>{job.paperStockAllocated} sheets</TableCell>
                    <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        batch.status === 'printing' ? 'default' :
                        batch.status === 'qc_passed' ? 'default' :
                        batch.status === 'qc_failed' ? 'destructive' :
                        batch.status === 'packaged' ? 'outline' :
                        batch.status === 'collected' ? 'outline' :
                        'secondary'
                      }>
                        {batch.status === 'printing' ? '🖨️ Printing' : 
                         batch.status === 'qc_passed' ? '✅ QC Passed' :
                         batch.status === 'qc_failed' ? '❌ QC Failed' :
                         batch.status === 'packaged' ? '📦 Packaged' :
                         batch.status === 'collected' ? '📋 Collected' :
                         batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBatchReport(job)}
                        className="h-8 w-8 p-0"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {allPrintJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    <Printer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No print jobs in queue</p>
                    <p className="text-sm">Create a print job from the Batches section</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Batch Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Print Report</DialogTitle>
            <DialogDescription>
              {selectedPrintJob && (() => {
                const batch = batches.find(b => b.batchUuid === selectedPrintJob.batchId);
                return batch ? `${batch.batchName} - ${batch.batchUuid}` : '';
              })()}
            </DialogDescription>
          </DialogHeader>

          {selectedPrintJob && (() => {
            const batch = batches.find(b => b.batchUuid === selectedPrintJob.batchId);
            if (!batch) return null;
            
            return (
              <div className="space-y-4 mt-2">
                {generateBatchReport(batch, selectedPrintJob)}
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}