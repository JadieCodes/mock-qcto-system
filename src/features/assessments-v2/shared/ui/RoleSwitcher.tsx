import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { rolesForPortal } from '../../config/roles';
import { personsForRole } from '../people/directory';
import { useV2Role } from './useV2Role';

// Role, then person: pick the role first (what the demo should show), then which named
// individual is holding it. Switching role jumps to that role's first seeded person
// (RoleContext.setRole), so this never lands on an empty person list.
export function RoleSwitcher() {
  const { portal, role, setRole, personId, setPersonId } = useV2Role();
  const roleOptions = rolesForPortal(portal);
  const personOptions = personsForRole(role);

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
        <SelectTrigger className="w-[190px]" aria-label="Acting as role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roleOptions.map((r) => (
            <SelectItem key={r.role} value={r.role}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={personId} onValueChange={setPersonId}>
        <SelectTrigger className="w-[190px]" aria-label="Acting as person">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {personOptions.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
