import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { SUPER_ADMIN_ROLE } from '../../config/administration';
import { rolesForPortal } from '../../config/roles';
import type { Role } from '../../types';
import { AuditTrailView } from '../audit/AuditTrailView';
import { personsForPortal } from '../people/directory';
import { PageHeader } from '../ui/PageHeader';
import { SectionCard } from '../ui/PageSections';
import { ReasonDialog } from '../ui/ReasonDialog';
import { useV2Role } from '../ui/useV2Role';
import {
  ACTING_RECORD_TYPE,
  appointmentStatus,
  createAppointment,
  endAppointmentEarly,
  listAppointments,
  type ActingAppointment,
  type AppointmentStatus,
} from './acting';
import { roleLabel, useRoleLabelsVersion } from './roleLabels';

const PEOPLE = personsForPortal('internal').filter((p) => p.role !== SUPER_ADMIN_ROLE);
const ROLES = rolesForPortal('internal').filter((r) => r.role !== SUPER_ADMIN_ROLE);
const STATUS_TITLES: Record<AppointmentStatus, string> = {
  active: 'Active appointments',
  upcoming: 'Upcoming appointments',
  past: 'Past appointments',
};

// Batch S (29.2): acting rights. The person can switch to the role in the header while the appointment
// is active; actions are recorded as "<name> (acting <role>)".
export function ActingAppointmentsPage() {
  useRoleLabelsVersion();
  const { role: actorRole, person } = useV2Role();
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);
  const [personId, setPersonId] = useState('');
  const [actingRole, setActingRole] = useState<Role | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [endTarget, setEndTarget] = useState<ActingAppointment | null>(null);

  const actor = { actorId: person.id, actorName: person.name, actorRole };
  const appointments = listAppointments();
  const byStatus = (status: AppointmentStatus) => appointments.filter((a) => appointmentStatus(a) === status);

  const onCreate = () => {
    try {
      if (!personId || !actingRole) throw new Error('Choose a person and the role they will act in.');
      createAppointment({ ...actor, personId, actingRole, from, to, reason });
      toast.success('Acting appointment saved.');
      setPersonId('');
      setActingRole('');
      setFrom('');
      setTo('');
      setReason('');
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  const onEnd = (endReason: string) => {
    if (!endTarget) return;
    try {
      endAppointmentEarly({ ...actor, id: endTarget.id, reason: endReason });
      toast.success('Appointment ended.');
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acting appointments"
        description="Give a person another role's rights for a date range, for example an ASD acting as DD. The appointment ends by itself after the end date."
      />

      <SectionCard title="New appointment">
        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Person *</Label>
            <Select value={personId} onValueChange={setPersonId}>
              <SelectTrigger aria-label="Person">
                <SelectValue placeholder="Choose a person" />
              </SelectTrigger>
              <SelectContent>
                {PEOPLE.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {roleLabel(p.role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Acts as *</Label>
            <Select value={actingRole} onValueChange={(v) => setActingRole(v as Role)}>
              <SelectTrigger aria-label="Acts as role">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.filter((r) => r.role !== PEOPLE.find((p) => p.id === personId)?.role).map((r) => (
                  <SelectItem key={r.role} value={r.role}>
                    {roleLabel(r.role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="acting-from">From *</Label>
            <Input id="acting-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="acting-to">To (last day) *</Label>
            <Input id="acting-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="acting-reason">Reason *</Label>
            <Textarea id="acting-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this person acting?" />
          </div>
          <div className="md:col-span-2">
            <Button onClick={onCreate}>Save appointment</Button>
          </div>
        </div>
      </SectionCard>

      {(['active', 'upcoming', 'past'] as const).map((status) => (
        <SectionCard key={status} title={STATUS_TITLES[status]}>
          {byStatus(status).length === 0 ? (
            <p className="p-6 text-sm text-gray-500">None.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Acts as</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byStatus(status).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap font-medium">{a.personName}</TableCell>
                      <TableCell className="whitespace-nowrap">{roleLabel(a.actingRole)}</TableCell>
                      <TableCell className="whitespace-nowrap">{a.from}</TableCell>
                      <TableCell className="whitespace-nowrap">{a.to}</TableCell>
                      <TableCell className="max-w-[320px] text-xs text-gray-600">
                        {a.reason}
                        {a.endedAt && (
                          <span className="block text-amber-700">
                            Ended early on {a.endedAt.slice(0, 10)}: {a.endedReason}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {status !== 'past' && (
                          <Button size="sm" variant="outline" onClick={() => setEndTarget(a)}>
                            End early
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      ))}

      <SectionCard title="Audit trail">
        <div className="p-4">
          <AuditTrailView recordTypes={[ACTING_RECORD_TYPE]} />
        </div>
      </SectionCard>

      <ReasonDialog
        open={!!endTarget}
        title="End appointment early"
        description={endTarget ? `${endTarget.personName} will stop acting as ${roleLabel(endTarget.actingRole)} straight away.` : undefined}
        confirmLabel="End appointment"
        destructive
        onOpenChange={(open) => !open && setEndTarget(null)}
        onConfirm={onEnd}
      />
    </div>
  );
}
