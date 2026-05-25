import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Receipt, FilePlus, FileText } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import type { SdpInvoiceEntry } from '@/contexts/AppContext';
import { useAuditTrail } from '@/context/AuditTrailContext';
import { useToast } from '@/hooks/use-toast';

type TariffItem = {
  id: string;
  name: string;
  category: string;
  rate: string;
  effectiveDate: string;
  status: string;
};

const INITIAL_TARIFF_ITEMS: TariffItem[] = [
  { id: 'T-001', name: 'Certificate Issuance (CERT-01)', category: 'Certification', rate: 'R 450.00', effectiveDate: '2026-01-01', status: 'Active' },
  { id: 'T-002', name: 'Certificate Re-Issue (CERT-02)', category: 'Certification', rate: 'R 250.00', effectiveDate: '2026-01-01', status: 'Active' },
  { id: 'T-003', name: 'Certificate Replace (CERT-03)', category: 'Certification', rate: 'R 300.00', effectiveDate: '2026-01-01', status: 'Active' },
];

const EMPTY_TARIFF_FORM = { name: '', category: '', rate: '', effectiveDate: '', status: 'Active' };

export default function TariffInvoicing() {
  const { sdpInvoices, updateSdpInvoice, currentRole } = useApp();
  const { toast } = useToast();
  const { logAction } = useAuditTrail();

  const [activeTab, setActiveTab] = useState('tariff-setup');
  const [tariffItems, setTariffItems] = useState<TariffItem[]>(INITIAL_TARIFF_ITEMS);

  // Add Tariff modal
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [tariffForm, setTariffForm] = useState(EMPTY_TARIFF_FORM);

  // Generate Invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState<SdpInvoiceEntry | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // ── Tariff handlers ───────────────────────────────────────────────────────

  const handleOpenTariffModal = () => {
    setTariffForm(EMPTY_TARIFF_FORM);
    setIsTariffModalOpen(true);
  };

  const handleAddTariff = () => {
    const newId = `T-${String(tariffItems.length + 1).padStart(3, '0')}`;
    setTariffItems(prev => [...prev, { id: newId, ...tariffForm }]);
    setIsTariffModalOpen(false);
    logAction({ user: currentRole, module: 'Tariff & Invoicing', action: `Added tariff ${newId}`, status: 'Success', details: tariffForm.name });
  };

  const isTariffFormValid = tariffForm.name.trim() && tariffForm.category.trim() && tariffForm.rate.trim() && tariffForm.effectiveDate;

  // ── Invoice handlers ──────────────────────────────────────────────────────

  const handleOpenInvoiceModal = (invoice: SdpInvoiceEntry) => {
    setSelectedInvoice(invoice);
    setInvoiceAmount(invoice.invoiceAmount ?? '');
    setInvoiceNotes(invoice.notes ?? '');
    setIsInvoiceModalOpen(true);
  };

  const handleSendInvoice = () => {
    if (!selectedInvoice) return;
    updateSdpInvoice(selectedInvoice.id, {
      status: 'Sent',
      invoiceAmount,
      notes: invoiceNotes,
    });
    logAction({ user: currentRole, module: 'Tariff & Invoicing', action: `Sent invoice ${selectedInvoice.id}`, status: 'Success', details: `${selectedInvoice.sdpName} — ${invoiceAmount}` });
    setIsInvoiceModalOpen(false);
    setSelectedInvoice(null);
    toast({ title: 'Invoice Sent', description: `Invoice for ${selectedInvoice.sdpName} has been sent.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tariff &amp; Invoicing</h2>
        <p className="text-muted-foreground">Manage billing tariffs and generate SDP invoices</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tariff-setup">Tariff Setup</TabsTrigger>
          <TabsTrigger value="sdp-invoices">SDP Invoices</TabsTrigger>
        </TabsList>

        {/* ── Tariff Setup tab ─────────────────────────────────────────────── */}
        <TabsContent value="tariff-setup" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Billing Tariffs</CardTitle>
                <CardDescription>Configure the rates applied per certification process type</CardDescription>
              </div>
              <Button onClick={handleOpenTariffModal}>
                <FilePlus className="h-4 w-4 mr-2" />
                Add Tariff
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tariff ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tariffItems.map((tariff) => (
                    <TableRow key={tariff.id}>
                      <TableCell className="font-mono text-xs">{tariff.id}</TableCell>
                      <TableCell className="font-medium">{tariff.name}</TableCell>
                      <TableCell>{tariff.category}</TableCell>
                      <TableCell className="font-medium">{tariff.rate}</TableCell>
                      <TableCell>{tariff.effectiveDate}</TableCell>
                      <TableCell>
                        <Badge variant={tariff.status === 'Active' ? 'default' : 'secondary'}>
                          {tariff.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SDP Invoices tab ─────────────────────────────────────────────── */}
        <TabsContent value="sdp-invoices" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>SDP Invoices</CardTitle>
              <CardDescription>Invoices generated from SDP re-issue and replace submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {sdpInvoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No invoices yet</p>
                  <p className="text-sm mt-1">Submissions from SDPs will appear here.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Process Type</TableHead>
                      <TableHead>Certificate Type</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sdpInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                        <TableCell className="font-medium">{inv.sdpName}</TableCell>
                        <TableCell>{inv.candidateName}</TableCell>
                        <TableCell>{inv.processType}</TableCell>
                        <TableCell className="capitalize">{inv.certificateType}</TableCell>
                        <TableCell>{new Date(inv.submissionDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={inv.status === 'Sent' ? 'outline' : 'default'}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant={inv.status === 'Pending' ? 'default' : 'outline'}
                            onClick={() => handleOpenInvoiceModal(inv)}
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            {inv.status === 'Sent' ? 'View Invoice' : 'Generate Invoice'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Add Tariff modal ─────────────────────────────────────────────────── */}
      <Dialog open={isTariffModalOpen} onOpenChange={setIsTariffModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Tariff</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="tariff-name">Tariff Name</Label>
              <Input
                id="tariff-name"
                value={tariffForm.name}
                onChange={e => setTariffForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Certificate Issuance (CERT-01)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tariff-category">Category</Label>
              <Input
                id="tariff-category"
                value={tariffForm.category}
                onChange={e => setTariffForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. Certification"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tariff-rate">Rate</Label>
              <Input
                id="tariff-rate"
                value={tariffForm.rate}
                onChange={e => setTariffForm(prev => ({ ...prev, rate: e.target.value }))}
                placeholder="e.g. R 450.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tariff-date">Effective Date</Label>
              <Input
                id="tariff-date"
                type="date"
                value={tariffForm.effectiveDate}
                onChange={e => setTariffForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={tariffForm.status} onValueChange={v => setTariffForm(prev => ({ ...prev, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsTariffModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTariff} disabled={!isTariffFormValid}>Add Tariff</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Generate Invoice modal ───────────────────────────────────────────── */}
      <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice?.status === 'Sent' ? 'Invoice Details' : 'Generate Invoice'}
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-5 mt-2">
              {/* Read-only details */}
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Invoice Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice ID</p>
                    <p className="font-mono text-xs mt-0.5">{selectedInvoice.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className="mt-0.5" variant={selectedInvoice.status === 'Sent' ? 'outline' : 'default'}>
                      {selectedInvoice.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Provider</p>
                    <p className="font-medium mt-0.5">{selectedInvoice.sdpName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Process Type</p>
                    <p className="font-medium mt-0.5">{selectedInvoice.processType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Candidate</p>
                    <p className="font-medium mt-0.5">{selectedInvoice.candidateName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Certificate Type</p>
                    <p className="font-medium capitalize mt-0.5">{selectedInvoice.certificateType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-medium mt-0.5">{new Date(selectedInvoice.submissionDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-1.5">
                <Label htmlFor="invoice-amount">Invoice Amount</Label>
                <Input
                  id="invoice-amount"
                  value={invoiceAmount}
                  onChange={e => setInvoiceAmount(e.target.value)}
                  placeholder="e.g. R 250.00"
                  disabled={selectedInvoice.status === 'Sent'}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invoice-notes">Notes (optional)</Label>
                <Textarea
                  id="invoice-notes"
                  value={invoiceNotes}
                  onChange={e => setInvoiceNotes(e.target.value)}
                  placeholder="Add any billing notes or references..."
                  rows={3}
                  disabled={selectedInvoice.status === 'Sent'}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
              {selectedInvoice?.status === 'Sent' ? 'Close' : 'Cancel'}
            </Button>
            {selectedInvoice?.status !== 'Sent' && (
              <Button onClick={handleSendInvoice} disabled={!invoiceAmount.trim()}>
                <Receipt className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
