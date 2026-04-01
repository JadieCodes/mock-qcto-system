// components/ResearchRoleSelector.tsx
import type { AppRole } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCircle } from 'lucide-react';

const researchRoles: AppRole[] = [
  'Forum',
  'Research Deputy Director',
  'Research Director',
  'Research Chief Director',
  'Research Chief Financial Officer',
  'Research Chief Executive Officer',
  'Research Legal Director',
  'Research Service Provider',
  'Research Graphic Designer'
];

export const ResearchRoleSelector = () => {
  const { currentRole, setCurrentRole } = useApp();

  return (
    <div className="flex items-center gap-2">
      <UserCircle className="h-5 w-5 text-muted-foreground" />
      <Select value={currentRole} onValueChange={(value: string) => setCurrentRole(value as AppRole)}>
        <SelectTrigger className="w-[220px] bg-card">
          <SelectValue placeholder="Select research role" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {researchRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};