import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { rolesForPortal } from '../../config/roles';
import { useV2Role } from './RoleContext';

export function RoleSwitcher() {
  const { portal, role, setRole } = useV2Role();
  const options = rolesForPortal(portal);

  return (
    <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
      <SelectTrigger className="w-[220px]" aria-label="Acting as role">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((r) => (
          <SelectItem key={r.role} value={r.role}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
