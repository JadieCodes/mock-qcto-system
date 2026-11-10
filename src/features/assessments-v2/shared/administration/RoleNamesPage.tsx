import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROLE_DESCRIPTORS } from '../../config/roles';
import type { Role } from '../../types';
import { AuditTrailView } from '../audit/AuditTrailView';
import { PageHeader } from '../ui/PageHeader';
import { SectionCard } from '../ui/PageSections';
import { ReasonDialog } from '../ui/ReasonDialog';
import { useV2Role } from '../ui/useV2Role';
import { defaultRoleLabel, hasRoleLabelOverride, resetRoleLabel, ROLE_LABEL_RECORD_TYPE, roleLabel, setRoleLabel, useRoleLabelsVersion } from './roleLabels';

type Pending = { kind: 'save'; role: Role; label: string } | { kind: 'reset'; role: Role };

// Batch S (29.1): QCTO keeps today's titles; the super admin can rename a role if the structure
// changes. Only the name people read changes — ids, workflow rights and visibility stay as they are.
export function RoleNamesPage() {
  useRoleLabelsVersion();
  const { role: actorRole, person } = useV2Role();
  const [drafts, setDrafts] = useState<Partial<Record<Role, string>>>({});
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = (reason: string) => {
    if (!pending) return;
    const actor = { reason, actorId: person.id, actorName: person.name, actorRole };
    try {
      if (pending.kind === 'save') setRoleLabel({ role: pending.role, label: pending.label, ...actor });
      else resetRoleLabel({ role: pending.role, ...actor });
      setDrafts((d) => ({ ...d, [pending.role]: undefined }));
      toast.success('Role name saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Role names" description="Every role with the name it shows today. Rename a role if QCTO's structure changes." />
      <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Changing a name does not change what the role can see or do.
      </p>
      <SectionCard>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Portal</TableHead>
                <TableHead>Default name</TableHead>
                <TableHead>Name shown now</TableHead>
                <TableHead>New name</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROLE_DESCRIPTORS.map((d) => {
                const draft = drafts[d.role] ?? '';
                return (
                  <TableRow key={d.role}>
                    <TableCell className="whitespace-nowrap text-xs text-gray-500">{d.portal === 'internal' ? 'Internal' : 'External'}</TableCell>
                    <TableCell className="whitespace-nowrap">{defaultRoleLabel(d.role)}</TableCell>
                    <TableCell className="whitespace-nowrap font-medium">{roleLabel(d.role)}</TableCell>
                    <TableCell>
                      <Input
                        aria-label={`New name for ${defaultRoleLabel(d.role)}`}
                        className="h-8 w-56"
                        value={draft}
                        placeholder={roleLabel(d.role)}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [d.role]: e.target.value }))}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap space-x-2">
                      <Button
                        size="sm"
                        disabled={!draft.trim() || draft.trim() === roleLabel(d.role)}
                        onClick={() => setPending({ kind: 'save', role: d.role, label: draft })}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="outline" disabled={!hasRoleLabelOverride(d.role)} onClick={() => setPending({ kind: 'reset', role: d.role })}>
                        Reset to default
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
      <SectionCard title="Audit trail">
        <div className="p-4">
          <AuditTrailView recordTypes={[ROLE_LABEL_RECORD_TYPE]} />
        </div>
      </SectionCard>
      <ReasonDialog
        open={!!pending}
        title={pending?.kind === 'reset' ? 'Reset role name' : 'Save role name'}
        description="Every screen, notification and letter will show the new name. Say why the name is changing."
        confirmLabel={pending?.kind === 'reset' ? 'Reset' : 'Save'}
        onOpenChange={(open) => !open && setPending(null)}
        onConfirm={confirm}
      />
    </div>
  );
}
