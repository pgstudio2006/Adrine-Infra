/* ═══════════════════════════════════════════
   Candela Design System v2 — Roles
   Who sees what workspace + density preference
   ═══════════════════════════════════════════ */

import type { WorkspaceId } from './workspaces';

export type CandelaRoleId =
  | 'admin'
  | 'receptionist'
  | 'technician'
  | 'radiologist'
  | 'billing'
  | 'reporting_manager';

export type DensityPreference = 'comfortable' | 'default' | 'compact';

export interface CandelaRole {
  id: CandelaRoleId;
  label: string;
  workspaces: WorkspaceId[];
  defaultWorkspace: WorkspaceId;
  defaultDensity: DensityPreference;
  description: string;
}

export const CANDELA_ROLES: CandelaRole[] = [
  {
    id: 'receptionist',
    label: 'Receptionist',
    workspaces: ['command', 'patients', 'diagnostics', 'finance'],
    defaultWorkspace: 'patients',
    defaultDensity: 'default',
    description: 'Patient registration, order entry, appointment scheduling, billing',
  },
  {
    id: 'technician',
    label: 'Technician',
    workspaces: ['command', 'diagnostics'],
    defaultWorkspace: 'diagnostics',
    defaultDensity: 'default',
    description: 'Scan execution, worklist management, image acquisition',
  },
  {
    id: 'radiologist',
    label: 'Radiologist',
    workspaces: ['command', 'patients', 'diagnostics'],
    defaultWorkspace: 'diagnostics',
    defaultDensity: 'comfortable',
    description: 'Report dictation, image review, study interpretation',
  },
  {
    id: 'billing',
    label: 'Billing Executive',
    workspaces: ['command', 'finance'],
    defaultWorkspace: 'finance',
    defaultDensity: 'compact',
    description: 'Invoice management, payment collection, insurance claims',
  },
  {
    id: 'reporting_manager',
    label: 'Reporting Manager',
    workspaces: ['command', 'diagnostics'],
    defaultWorkspace: 'command',
    defaultDensity: 'default',
    description: 'Report quality review, TAT monitoring, radiologist workload',
  },
  {
    id: 'admin',
    label: 'Admin',
    workspaces: ['command', 'patients', 'diagnostics', 'finance', 'admin'],
    defaultWorkspace: 'command',
    defaultDensity: 'default',
    description: 'Full system access, configuration, user management',
  },
];

export function getRole(roleId: CandelaRoleId): CandelaRole | undefined {
  return CANDELA_ROLES.find(r => r.id === roleId);
}
