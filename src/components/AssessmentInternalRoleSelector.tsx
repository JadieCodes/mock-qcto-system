// components/AssessmentInternalRoleSelector.tsx
import type { AppRole } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCircle } from 'lucide-react';

const assessmentInternalRoles: AppRole[] = [
  'Deputy Director',
  'CEO',
  'Internal Assessment Committee',
  'Director & Team',
  'AIC',
  'Qualifications Development',
  'Assistant Director',
  'Domain Director',
  'Sub Domain Admin',
  'Deputy & Assistant Director',
  'Director',
  'ASD'
];

export const AssessmentInternalRoleSelector = () => {
  const { currentRole, setCurrentRole } = useApp();

  return (
    <div className="flex items-center gap-2">
      <UserCircle className="h-5 w-5 text-muted-foreground" />
      <Select value={currentRole} onValueChange={(value: string) => setCurrentRole(value as AppRole)}>
        <SelectTrigger className="w-[220px] bg-card">
          <SelectValue placeholder="Select internal role" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {assessmentInternalRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
