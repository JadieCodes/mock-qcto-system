import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ESCALATION_WORKING_DAYS } from '../../config/administration';
import { AuditTrailView } from '../audit/AuditTrailView';
import { PageHeader } from '../ui/PageHeader';
import { SectionCard } from '../ui/PageSections';
import { useV2Role } from '../ui/useV2Role';
import { ESCALATION_RECORD_TYPE, nextLevelRole, overdueLabel, reassignCandidates, reassignItem, type OverdueItem } from './overdue';
import { roleLabel, useRoleLabelsVersion } from './roleLabels';
import { OVERDUE_QUERY_KEY, useOverdueItems } from './useOverdue';

// Batch S (29.2): every overdue internal item across the modules. Reassign is offered only where a
// module records a named person for the item.
export function OverdueItemsPage() {
  useRoleLabelsVersion();
  const { data: items = [], isLoading } = useOverdueItems();
  const [target, setTarget] = useState<OverdueItem | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overdue items"
        description={`Internal items that have waited at one stage for more than ${ESCALATION_WORKING_DAYS} working days (weekends and SA public holidays skipped). The next level up is told once.`}
      />
      <SectionCard>
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">Nothing is overdue.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Module', 'Item', 'Stage', 'Waiting since', 'Days', 'Held by', 'Next level', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell className="whitespace-nowrap">{item.moduleLabel}</TableCell>
                    <TableCell className="max-w-[260px]">{item.itemLabel}</TableCell>
                    <TableCell>{item.stageLabel}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.enteredAt.slice(0, 10)}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-red-700">{overdueLabel(item)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {roleLabel(item.role)}
                      {item.assigneeName && <span className="block text-xs text-gray-500">{item.assigneeName}</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-gray-500">{roleLabel(nextLevelRole(item))}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.reassignKind ? (
                        <Button size="sm" variant="outline" onClick={() => setTarget(item)}>
                          Reassign
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">No person assignment in this module</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
      <SectionCard title="Escalations and reassignments">
        <div className="p-4">
          <AuditTrailView recordTypes={[ESCALATION_RECORD_TYPE]} />
        </div>
      </SectionCard>
      <ReassignDialog item={target} onClose={() => setTarget(null)} />
    </div>
  );
}

function ReassignDialog({ item, onClose }: { item: OverdueItem | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">{item && <ReassignForm key={item.key} item={item} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function ReassignForm({ item, onClose }: { item: OverdueItem; onClose: () => void }) {
  const { role, person } = useV2Role();
  const queryClient = useQueryClient();
  const [toPersonId, setToPersonId] = useState('');
  const [reason, setReason] = useState('');
  const candidates = reassignCandidates(item);

  const onSave = () => {
    try {
      reassignItem({ item, toPersonId, reason, actorId: person.id, actorName: person.name, actorRole: role });
      toast.success('Reassigned. Both people have been told.');
      queryClient.invalidateQueries({ queryKey: OVERDUE_QUERY_KEY });
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reassign</DialogTitle>
        <DialogDescription>
          {item.itemLabel} — held by {item.assigneeName ?? `any ${roleLabel(item.role)}`}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label>Reassign to *</Label>
          <Select value={toPersonId} onValueChange={setToPersonId}>
            <SelectTrigger aria-label="Reassign to">
              <SelectValue placeholder="Choose a person" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.acting ? ` (acting ${roleLabel(item.role)})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">People who hold the {roleLabel(item.role)} role, or have an active acting appointment for it.</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="reassign-reason">Reason *</Label>
          <Textarea id="reassign-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!toPersonId || !reason.trim()} onClick={onSave}>
          Reassign
        </Button>
      </DialogFooter>
    </>
  );
}
