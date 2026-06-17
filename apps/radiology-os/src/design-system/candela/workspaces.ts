/* ═══════════════════════════════════════════
   Candela Design System v2 — Workspaces
   L1 top navigation entries
   ═══════════════════════════════════════════ */

export type WorkspaceId =
  | 'command'
  | 'patients'
  | 'clinical'
  | 'diagnostics'
  | 'operations'
  | 'finance'
  | 'compliance'
  | 'admin';

export interface CandelaWorkspace {
  id: WorkspaceId;
  label: string;
  icon: string; // lucide icon name
  chroma: string; // CSS variable name
  path: string;
  shortcut?: string;
}

export const CANDELA_WORKSPACES: CandelaWorkspace[] = [
  {
    id: 'command',
    label: 'Command',
    icon: 'LayoutDashboard',
    chroma: '--c-chroma-command',
    path: '/',
    shortcut: '1',
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: 'Users',
    chroma: '--c-chroma-patients',
    path: '/patients',
    shortcut: '2',
  },
  {
    id: 'clinical',
    label: 'Clinical',
    icon: 'Stethoscope',
    chroma: '--c-chroma-clinical',
    path: '/clinical',
    shortcut: '3',
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics',
    icon: 'ScanLine',
    chroma: '--c-chroma-diagnostics',
    path: '/diagnostics',
    shortcut: '4',
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: 'Package',
    chroma: '--c-chroma-operations',
    path: '/operations',
    shortcut: '5',
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'IndianRupee',
    chroma: '--c-chroma-finance',
    path: '/billing',
    shortcut: '6',
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: 'Shield',
    chroma: '--c-chroma-compliance',
    path: '/compliance',
    shortcut: '7',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: 'Settings',
    chroma: '--c-chroma-admin',
    path: '/settings',
    shortcut: '8',
  },
];

export function getWorkspace(id: WorkspaceId): CandelaWorkspace | undefined {
  return CANDELA_WORKSPACES.find(w => w.id === id);
}

export function getWorkspaceByPath(path: string): CandelaWorkspace | undefined {
  return CANDELA_WORKSPACES.find(w => path.startsWith(w.path));
}
