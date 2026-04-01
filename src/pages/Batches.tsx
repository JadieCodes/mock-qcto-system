import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Package, Printer, ClipboardList, Download, Eye } from 'lucide-react';
import type { 
  Pathway, 
  IntegrationSystem, 
  ProcessType, 
  Submission, 
  Batch,
  BatchRegistrationForm,
  PaperAllocationRecord,
  InventoryControlRecord 
} from '@/types';

// Paper inventory state
interface PaperInventory {
  totalStock: number;
  allocated: number;
  wasted: number;
  returned: number;
  destroyed: number;
  lastUpdated: string;
}

export default function Batches() {
  const { profileSubmissions, batches, addBatch, currentRole, updateBatchStatus, addPrintJob } = useApp();
  const { toast } = useToast();
  
  // Batch creation state
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [batchName, setBatchName] = useState('');
  const [pathway, setPathway] = useState<Pathway>('occupational');
  const [targetSystem, setTargetSystem] = useState<IntegrationSystem>('CVS');
  const [activeTab, setActiveTab] = useState<'occupational' | 'skills' | 'legacy'>('occupational');
  
  // Document viewer state
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  
  // Paper inventory state (simulated)
  const [paperInventory, setPaperInventory] = useState<PaperInventory>({
    totalStock: 10000,
    allocated: 0,
    wasted: 0,
    returned: 0,
    destroyed: 0,
    lastUpdated: new Date().toISOString()
  });

  // Paper allocation settings
  const [paperStartNumber, setPaperStartNumber] = useState<number>(10001);
  const [paperEndNumber, setPaperEndNumber] = useState<number>(10001);

  const canCreate = ['Cert Admin'].includes(currentRole);
const handleCreatePrintJob = (batch: Batch) => {
  // Update batch status to 'printing'
  updateBatchStatus(batch.batchUuid, 'printing');
  
  // Create print job
  addPrintJob({
    batchId: batch.batchUuid,
    paperStockAllocated: batch.totalCertificates, // Use certificate count as paper stock
    createdAt: new Date().toISOString(),
  });

  toast({
    title: 'Print Job Created',
    description: `Batch ${batch.batchName} has been sent to Printing`,
  });
};
  // Get integrated submissions ready for batching (status = 'integrated')
  const getIntegratedSubmissions = () => {
    return profileSubmissions.filter(sub => 
      sub.status === 'integrated' && 
      sub.assessmentData?.integrationStatus === 'completed'
    );
  };

  // Filter submissions by pathway
  const getSubmissionsByPathway = (pathway: Pathway) => {
    return getIntegratedSubmissions().filter(sub => sub.pathway === pathway);
  };

  const occupationalSubmissions = getSubmissionsByPathway('occupational');
  const skillsSubmissions = getSubmissionsByPathway('skills');
  const legacySubmissions = getSubmissionsByPathway('legacy');

  // Get current tab submissions
  const getCurrentTabSubmissions = () => {
    switch (activeTab) {
      case 'occupational': return occupationalSubmissions;
      case 'skills': return skillsSubmissions;
      case 'legacy': return legacySubmissions;
    }
  };

  const currentSubmissions = getCurrentTabSubmissions();
  const selectedSubs = profileSubmissions.filter(s => selectedSubmissions.includes(s.id));
  const hasReissue = selectedSubs.some(s => s.processType === 'reissue');
  const hasReplace = selectedSubs.some(s => s.processType === 'replace');
  const allReissue = selectedSubs.length > 0 && selectedSubs.every(s => s.processType === 'reissue');
  const allReplace = selectedSubs.length > 0 && selectedSubs.every(s => s.processType === 'replace');

  const handleToggleSubmission = (id: string) => {
    setSelectedSubmissions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubmissions.length === currentSubmissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(currentSubmissions.map(s => s.id));
    }
  };

  // Generate batch ID
  const generateBatchId = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const sequence = (batches.length + 1).toString().padStart(3, '0');
    return `B-${year}${month}${day}-${sequence}`;
  };

  // Generate Batch Registration Form
  const generateBatchRegistrationForm = (
    batchId: string,
    selectedSubs: Submission[],
    pathway: Pathway,
    processType: ProcessType
  ): BatchRegistrationForm => {
    return {
      batchId,
      pathway,
      type: processType,
      quantity: selectedSubs.length,
      createdBy: currentRole,
      dateCreated: new Date().toISOString(),
      certificateNumbers: selectedSubs.map(s => 
        s.processType === 'reissue' || s.processType === 'replace' 
          ? s.originalCertificateNumber || 'N/A' 
          : `CERT-${s.id}`
      ),
      status: 'registered'
    };
  };

  // Generate Paper Allocation Record
  const generatePaperAllocationRecord = (
    batchId: string,
    quantity: number
  ): PaperAllocationRecord => {
    const start = paperStartNumber;
    const end = paperStartNumber + quantity - 1;
    
    // Update paper start number for next batch
    setPaperStartNumber(end + 1);
    setPaperEndNumber(end);

    return {
      batchId,
      paperStartNumber: start,
      paperEndNumber: end,
      quantity,
      allocatedBy: currentRole,
      date: new Date().toISOString(),
      remainingStock: paperInventory.totalStock - (paperInventory.allocated + quantity)
    };
  };

  // Generate Inventory Control Record
  const generateInventoryControlRecord = (
    batchId: string,
    quantity: number
  ): InventoryControlRecord => {
    const beforeAllocation = paperInventory.totalStock - paperInventory.allocated;
    
    // Update inventory
    setPaperInventory(prev => ({
      ...prev,
      allocated: prev.allocated + quantity,
      lastUpdated: new Date().toISOString()
    }));

    return {
      batchId,
      beforeAllocation,
      allocated: quantity,
      wasted: 0,
      returned: 0,
      destroyed: 0,
      afterAllocation: beforeAllocation - quantity,
      updatedAt: new Date().toISOString(),
      updatedBy: currentRole
    };
  };

 const handleCreateBatch = () => {
  if (!canCreate) {
    toast({
      title: 'Permission Denied',
      description: 'Only CRT Admin can create batches',
      variant: 'destructive',
    });
    return;
  }

  if (selectedSubmissions.length === 0) {
    toast({
      title: 'Error',
      description: 'Please select at least one submission',
      variant: 'destructive',
    });
    return;
  }

  if (!batchName) {
    toast({
      title: 'Error',
      description: 'Please enter a batch name',
      variant: 'destructive',
    });
    return;
  }

  // Generate unique batch ID
  const batchId = generateBatchId();
  
  // Determine process type from selected submissions
  const batchProcessType = allReplace ? 'replace' : allReissue ? 'reissue' : 'issue';
  
  // Generate system documents
  const registrationForm = generateBatchRegistrationForm(
    batchId,
    selectedSubs,
    activeTab,
    batchProcessType
  );

  const paperAllocation = generatePaperAllocationRecord(
    batchId,
    selectedSubmissions.length
  );

  const inventoryControl = generateInventoryControlRecord(
    batchId,
    selectedSubmissions.length
  );

  // Create batch with all documents - CHANGE STATUS TO 'integrated'
  addBatch({
    batchName,
    totalCertificates: selectedSubmissions.length,
    status: 'integrated', // CHANGED FROM 'registered' TO 'integrated'
    submissions: selectedSubmissions,
    createdAt: new Date().toISOString(),
    createdBy: currentRole,
    processType: batchProcessType,
    isReissue: hasReissue,
    isReplace: hasReplace,
    pathway: activeTab,
    targetSystem: activeTab === 'legacy' ? 'Apprentice' : 'CVS',
    // System generated documents
    registrationForm,
    paperAllocation,
    inventoryControl
  });

  toast({
    title: '✅ Batch Created Successfully',
    description: `Batch ${batchId} created with ${selectedSubmissions.length} certificates. Ready for printing.`,
  });

  // Reset form
  setSelectedSubmissions([]);
  setBatchName('');
};

  const handleViewBatchDocuments = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsDocumentsModalOpen(true);
  };

  // Get status badge variant - FIXED: removed 'success' variant
  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'registered': return 'secondary';
    case 'integrated': return 'default'; // ADD THIS
    case 'printing': return 'default';
    case 'qc_passed': return 'default';
    case 'qc_failed': return 'destructive';
    case 'packaged': return 'outline';
    case 'collected': return 'outline';
    default: return 'secondary';
  }
};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Batch Management</h2>
        <p className="text-muted-foreground">
          Create batches from integrated submissions and generate system documents
        </p>
      </div>

      {/* Paper Stock Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Paper Inventory Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-600">Total Stock</p>
              <p className="text-2xl font-bold text-blue-700">{paperInventory.totalStock.toLocaleString()}</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <p className="text-xs text-amber-600">Allocated</p>
              <p className="text-2xl font-bold text-amber-700">{paperInventory.allocated.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-600">Available</p>
              <p className="text-2xl font-bold text-green-700">
                {(paperInventory.totalStock - paperInventory.allocated).toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-xs text-red-600">Wasted</p>
              <p className="text-2xl font-bold text-red-700">{paperInventory.wasted.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs text-purple-600">Last Updated</p>
              <p className="text-sm font-medium text-purple-700">
                {new Date(paperInventory.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Batch</CardTitle>
            <CardDescription>
              Select integrated submissions to create a batch. System will generate Batch Registration Form, 
              Paper Allocation Record, and Inventory Control Record.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pathway Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="occupational" className="relative">
                  Occupational
                  {occupationalSubmissions.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {occupationalSubmissions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="skills">
                  Skills
                  {skillsSubmissions.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {skillsSubmissions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="legacy">
                  Legacy
                  {legacySubmissions.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {legacySubmissions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-4">
                {/* Batch Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchName">Batch Name</Label>
                    <Input
                      id="batchName"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="e.g., Q1-2024-Occupational-1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Target System</Label>
                    <Select value={targetSystem} onValueChange={(v) => setTargetSystem(v as IntegrationSystem)}>
                      <SelectTrigger className="bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CVS">CVS (Occupational/Skills)</SelectItem>
                        <SelectItem value="Apprentice">Apprentice (Legacy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Paper Stock Start Number</Label>
                    <Input
                      type="number"
                      value={paperStartNumber}
                      onChange={(e) => setPaperStartNumber(parseInt(e.target.value))}
                      placeholder="e.g., 10001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated End Number</Label>
                    <Input
                      type="number"
                      value={paperStartNumber + selectedSubmissions.length - 1}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                {/* Submissions Selection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Select Submissions ({selectedSubmissions.length} selected)</Label>
                    {currentSubmissions.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                        {selectedSubmissions.length === currentSubmissions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    )}
                  </div>
                  
                  {currentSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No integrated submissions available for {activeTab} pathway</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {currentSubmissions.map((sub) => (
                        <div key={sub.id} className="flex items-center space-x-2 p-3 border-b last:border-b-0 hover:bg-accent">
                          <Checkbox
                            id={sub.id}
                            checked={selectedSubmissions.includes(sub.id)}
                            onCheckedChange={() => handleToggleSubmission(sub.id)}
                          />
                          <label htmlFor={sub.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={sub.processType === 'reissue' ? 'secondary' : sub.processType === 'replace' ? 'outline' : 'default'} 
                                className="text-xs"
                              >
                                {sub.processType === 'reissue' ? 'Re-Issue' : 
                                 sub.processType === 'replace' ? 'Replace' : 'Issue'}
                              </Badge>
                              <p className="text-sm font-medium">{sub.candidateName}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {sub.certificateType}
                              {sub.originalCertificateNumber && ` • Original: ${sub.originalCertificateNumber}`}
                            </p>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Batch Summary */}
                {selectedSubmissions.length > 0 && (
                  <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Batch Summary</h4>
                      <Badge variant="outline" className="font-mono">
                        {generateBatchId()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Pathway</p>
                        <p className="font-medium capitalize">{activeTab}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">
                          {allReplace ? 'Replace' : allReissue ? 'Re-Issue' : 'Issue'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-medium">{selectedSubmissions.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target System</p>
                        <p className="font-medium">{activeTab === 'legacy' ? 'Apprentice' : 'CVS'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Paper Range</p>
                        <p className="font-medium">
                          {paperStartNumber} - {paperStartNumber + selectedSubmissions.length - 1}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created By</p>
                        <p className="font-medium">{currentRole}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleCreateBatch} 
                  disabled={selectedSubmissions.length === 0 || !batchName}
                  className="w-full"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Create Batch & Generate Documents
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Batches List */}
      <Card>
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <CardDescription>
            {batches.length} total batch(es) created
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Pathway</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Certificates</TableHead>
                <TableHead>Paper Range</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Documents</TableHead>
                <TableHead className="text-center">Print</TableHead> 
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.batchUuid}>
                  <TableCell className="font-mono text-xs">{batch.batchUuid}</TableCell>
                  <TableCell>
                    <Badge variant={batch.isReplace ? 'outline' : batch.isReissue ? 'secondary' : 'default'}>
                      {batch.isReplace ? 'Replace' : batch.isReissue ? 'Re-Issue' : 'Issue'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{batch.batchName}</TableCell>
                  <TableCell className="capitalize">{batch.pathway || '—'}</TableCell>
                  <TableCell>
                    {batch.targetSystem && (
                      <Badge variant="outline" className="text-xs">
                        {batch.targetSystem}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{batch.totalCertificates}</TableCell>
                  <TableCell>
                    {batch.paperAllocation && (
                      <span className="text-xs font-mono">
                        {batch.paperAllocation.paperStartNumber} - {batch.paperAllocation.paperEndNumber}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(batch.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(batch.status)}>
                      {batch.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewBatchDocuments(batch)}
                      className="h-8 w-8 p-0"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
        <TableCell className="text-center">
  {batch.status === 'integrated' && (  // Make sure this matches
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleCreatePrintJob(batch)}
      className="h-8"
    >
      <Printer className="h-4 w-4 mr-1" />
      Print Job
    </Button>
  )}
</TableCell>
                </TableRow>
              ))}
              {batches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No batches created yet
                  </TableCell>
                </TableRow>
              )}
              
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Batch Documents Modal */}
      <Dialog open={isDocumentsModalOpen} onOpenChange={setIsDocumentsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Documents</DialogTitle>
            <DialogDescription>
              {selectedBatch?.batchName} - {selectedBatch?.batchUuid}
            </DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <div className="space-y-6 mt-4">
              {/* Batch Registration Form */}
              {selectedBatch.registrationForm && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold">Batch Registration Form</h3>
                    </div>
                    <Badge variant="outline">System Generated</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3 rounded">
                    <div>
                      <p className="text-muted-foreground">Batch ID</p>
                      <p className="font-mono font-medium">{selectedBatch.registrationForm.batchId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pathway</p>
                      <p className="font-medium capitalize">{selectedBatch.registrationForm.pathway}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{selectedBatch.registrationForm.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{selectedBatch.registrationForm.quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created By</p>
                      <p className="font-medium">{selectedBatch.registrationForm.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date Created</p>
                      <p className="font-medium">
                        {new Date(selectedBatch.registrationForm.dateCreated).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Certificate Numbers</p>
                      <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto">
                        {selectedBatch.registrationForm.certificateNumbers.map((cert, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-mono">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paper Allocation Record */}
              {selectedBatch.paperAllocation && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Printer className="h-5 w-5 text-green-500" />
                      <h3 className="font-semibold">Paper Allocation Record</h3>
                    </div>
                    <Badge variant="outline">System Generated</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-muted/30 p-3 rounded">
                    <div>
                      <p className="text-muted-foreground">Batch ID</p>
                      <p className="font-mono font-medium">{selectedBatch.paperAllocation.batchId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Paper Range</p>
                      <p className="font-medium">
                        {selectedBatch.paperAllocation.paperStartNumber} - {selectedBatch.paperAllocation.paperEndNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity Allocated</p>
                      <p className="font-medium">{selectedBatch.paperAllocation.quantity}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Allocated By</p>
                      <p className="font-medium">{selectedBatch.paperAllocation.allocatedBy}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {new Date(selectedBatch.paperAllocation.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining Stock</p>
                      <p className="font-medium">{selectedBatch.paperAllocation.remainingStock.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory Control Record */}
              {selectedBatch.inventoryControl && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-500" />
                      <h3 className="font-semibold">Inventory Control Record</h3>
                    </div>
                    <Badge variant="outline">System Generated</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm bg-muted/30 p-3 rounded">
                    <div>
                      <p className="text-muted-foreground">Before Allocation</p>
                      <p className="font-medium">{selectedBatch.inventoryControl.beforeAllocation.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Allocated</p>
                      <p className="font-medium text-amber-600">-{selectedBatch.inventoryControl.allocated}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">After Allocation</p>
                      <p className="font-medium">{selectedBatch.inventoryControl.afterAllocation.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Wasted</p>
                      <p className="font-medium text-red-600">{selectedBatch.inventoryControl.wasted}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Returned</p>
                      <p className="font-medium text-green-600">{selectedBatch.inventoryControl.returned}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Destroyed</p>
                      <p className="font-medium text-red-600">{selectedBatch.inventoryControl.destroyed}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {new Date(selectedBatch.inventoryControl.updatedAt).toLocaleString()} by {selectedBatch.inventoryControl.updatedBy}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocumentsModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />
              Export Documents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}