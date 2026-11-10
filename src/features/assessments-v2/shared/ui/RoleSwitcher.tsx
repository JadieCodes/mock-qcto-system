import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { rolesForPortal } from '../../config/roles';
import { activeActingHolders, activeActingRoles } from '../administration/acting';
import { roleLabel, useRoleLabelsVersion } from '../administration/roleLabels';
import { getPerson, personsForRole } from '../people/directory';
import { useV2Role } from './useV2Role';

// Role, then person: pick the role first (what the demo should show), then which named
// individual is holding it. Switching role jumps to that role's first seeded person
// (RoleContext.setRole), so this never lands on an empty person list.
export function RoleSwitcher() {
  const { portal, role, setRole, personId, setPersonId, basePerson } = useV2Role();
  useRoleLabelsVersion();
  // Batch S (29.2): a person with an active acting appointment can switch to that role too, and
  // shows up (marked "acting") among that role's people.
  const actingRoles = activeActingRoles(basePerson.id);
  const roleOptions = rolesForPortal(portal);
  const holders = personsForRole(role);
  const actingHolders = activeActingHolders(role)
    .filter((id) => !holders.some((h) => h.id === id))
    .flatMap((id) => getPerson(id) ?? []);
  const personOptions = [...holders, ...actingHolders];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
        <SelectTrigger className="w-[150px] sm:w-[190px]" aria-label="Acting as role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roleOptions.map((r) => (
            <SelectItem key={r.role} value={r.role}>
              {roleLabel(r.role)}{actingRoles.includes(r.role) ? ' (acting)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={personId} onValueChange={setPersonId}>
        <SelectTrigger className="w-[150px] sm:w-[190px]" aria-label="Acting as person">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {personOptions.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}{p.role !== role ? ' (acting)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
