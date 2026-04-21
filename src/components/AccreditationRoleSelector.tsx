import React from 'react';
import { UserCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AccreditationRoleSelectorProps {
  currentRole: 'applicant' | 'qp' | 'verifier';
  currentUserName: string;
  onRoleChange: (role: 'applicant' | 'qp' | 'verifier') => void;
}

const accreditationRoles = [
  { id: 'applicant', label: 'Applicant (SDP)' },
  { id: 'qp', label: 'Quality Partner' },
  { id: 'verifier', label: 'Verifier' },
] as const;

export const AccreditationRoleSelector = ({
  currentRole,
  currentUserName,
  onRoleChange,
}: AccreditationRoleSelectorProps) => {
  return (
    <div className="flex items-center gap-3">
      <UserCircle className="h-5 w-5 text-muted-foreground" />
      <div className="text-sm text-muted-foreground">{currentUserName}</div>

      <Select
        value={currentRole}
        onValueChange={(value) =>
          onRoleChange(value as 'applicant' | 'qp' | 'verifier')
        }
      >
        <SelectTrigger className="w-[200px] bg-card">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {accreditationRoles.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};