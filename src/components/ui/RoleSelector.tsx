import type { AppRole } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCircle } from 'lucide-react';

const roles: AppRole[] = ['Assessment Unit', 'Cert Admin', 'Supervisor', 'Printer', 'Finance'];

export const RoleSelector = () => {
  const { currentRole, setCurrentRole } = useApp();

  return (
    <div className="flex items-center gap-2">
      <UserCircle className="h-5 w-5 text-muted-foreground" />
      <Select value={currentRole} onValueChange={(value: string) => setCurrentRole(value as AppRole)}>
        <SelectTrigger className="w-[180px] bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {roles.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
