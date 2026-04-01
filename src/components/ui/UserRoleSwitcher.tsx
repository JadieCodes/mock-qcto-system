import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UserRoleSwitcherProps {
  currentRole: string;
  currentUserName: string;
  onRoleChange: (role: string, userName: string) => void;
}

export default function UserRoleSwitcher({ 
  currentRole, 
  currentUserName,
  onRoleChange 
}: UserRoleSwitcherProps) {
  const navigate = useNavigate();
  
  const roles = [
    { id: 'applicant', name: 'Applicant (SDP)', path: '/profiles/dashboard', icon: '👤', userName: 'John Applicant' },
    { id: 'qp', name: 'Quality Partner', path: '/qp-dashboard', icon: '🛡️', userName: 'John Smith' },
    { id: 'verifier', name: 'Verifier', path: '/verifier-dashboard', icon: '✓', userName: 'David Brown' },
    { id: 'accreditation', name: 'Accreditation Officer', path: '/departments/accreditation', icon: '📋', userName: 'Admin User' },
    { id: 'assistant-director', name: 'Assistant Director', path: '/departments/accreditation/site-visits', icon: '👔', userName: 'Sarah Assistant' },
    { id: 'deputy-director', name: 'Deputy Director', path: '/departments/accreditation/site-visits', icon: '👔', userName: 'Michael Deputy' },
  ];

  const handleRoleChange = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      onRoleChange(roleId, role.userName);
      navigate(role.path);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2">
        <select
          value={currentRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.icon} {role.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}