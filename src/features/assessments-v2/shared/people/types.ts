import type { Portal, ProcessStageTeam, Role } from '../../types';

// A named individual acting in the system — the unit CR-053 ("a different person") and
// CR-055 ("re-route to a named colleague") actually need. A Role is still what the workflow
// engine gates on; a Person is who, specifically, is holding that role right now.
export interface Person {
  id: string;
  name: string;
  role: Role;
  portal: Portal;
  teams: ProcessStageTeam[];
  managerId?: string;
  qpId?: string;
  sdpId?: string;
}
