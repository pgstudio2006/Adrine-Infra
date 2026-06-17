/* ═══════════════════════════════════════════
   Candela Design System v2 — Modules
   L2 secondary tab registry under workspaces
   ═══════════════════════════════════════════ */

import type { WorkspaceId } from './workspaces';

export type ModuleId =
  | 'ris-dashboard'
  | 'ris-patients'
  | 'ris-orders'
  | 'ris-scheduler'
  | 'ris-worklist'
  | 'ris-execution'
  | 'ris-pacs'
  | 'ris-radiologist'
  | 'ris-reporting'
  | 'ris-templates'
  | 'ris-reports'
  | 'ris-dispatch'
  | 'ris-history'
  | 'ris-billing'
  | 'ris-revenue'
  | 'ris-operational'
  | 'ris-utilization'
  | 'ris-radiologist-perf'
  | 'ris-referrals'
  | 'ris-settings';

export interface CandelaModule {
  id: ModuleId;
  label: string;
  workspace: WorkspaceId;
  path: string;
  icon: string;
  roles: string[];
  badge?: { color: string; getCount: () => number };
}

export const CANDELA_MODULES: CandelaModule[] = [
  // ─── Command workspace ───
  { id: 'ris-dashboard', label: 'Dashboard', workspace: 'command', path: '/', icon: 'LayoutDashboard', roles: ['admin', 'receptionist', 'technician', 'radiologist', 'billing', 'reporting_manager'] },
  { id: 'ris-revenue', label: 'Revenue Analytics', workspace: 'command', path: '/analytics/revenue', icon: 'TrendingUp', roles: ['admin', 'billing'] },
  { id: 'ris-operational', label: 'Operations', workspace: 'command', path: '/analytics/operational', icon: 'BarChart3', roles: ['admin', 'reporting_manager'] },
  { id: 'ris-utilization', label: 'Utilization', workspace: 'command', path: '/analytics/utilization', icon: 'Activity', roles: ['admin', 'technician'] },
  { id: 'ris-radiologist-perf', label: 'Radiologist Perf.', workspace: 'command', path: '/analytics/radiologist', icon: 'Award', roles: ['admin', 'reporting_manager'] },
  { id: 'ris-referrals', label: 'Referrals', workspace: 'command', path: '/analytics/referrals', icon: 'GitBranch', roles: ['admin'] },

  // ─── Patients workspace ───
  { id: 'ris-patients', label: 'Patient Search', workspace: 'patients', path: '/patients', icon: 'Search', roles: ['receptionist', 'admin'] },
  { id: 'ris-history', label: 'Investigation History', workspace: 'patients', path: '/history', icon: 'Clock', roles: ['admin', 'receptionist', 'radiologist'] },

  // ─── Diagnostics workspace (RIS) ───
  { id: 'ris-orders', label: 'Orders', workspace: 'diagnostics', path: '/orders', icon: 'FilePlus', roles: ['admin', 'receptionist'] },
  { id: 'ris-scheduler', label: 'Scheduler', workspace: 'diagnostics', path: '/scheduler', icon: 'Calendar', roles: ['admin', 'receptionist'] },
  { id: 'ris-worklist', label: 'Worklist', workspace: 'diagnostics', path: '/worklist', icon: 'ListTodo', roles: ['technician'] },
  { id: 'ris-execution', label: 'Study Execution', workspace: 'diagnostics', path: '/execution', icon: 'Play', roles: ['technician'] },
  { id: 'ris-pacs', label: 'PACS Viewer', workspace: 'diagnostics', path: '/pacs', icon: 'Monitor', roles: ['technician', 'radiologist'] },
  { id: 'ris-radiologist', label: 'Radiologist Queue', workspace: 'diagnostics', path: '/radiologist-queue', icon: 'Users', roles: ['radiologist'] },
  { id: 'ris-reporting', label: 'Reporting', workspace: 'diagnostics', path: '/reporting', icon: 'FileText', roles: ['radiologist'] },
  { id: 'ris-templates', label: 'Templates', workspace: 'diagnostics', path: '/templates', icon: 'BookTemplate', roles: ['radiologist', 'admin'] },
  { id: 'ris-reports', label: 'Reports', workspace: 'diagnostics', path: '/reports', icon: 'FileCheck', roles: ['admin', 'radiologist', 'reporting_manager'] },
  { id: 'ris-dispatch', label: 'Dispatch', workspace: 'diagnostics', path: '/dispatch', icon: 'Send', roles: ['admin', 'receptionist'] },

  // ─── Finance workspace ───
  { id: 'ris-billing', label: 'Billing', workspace: 'finance', path: '/billing', icon: 'Receipt', roles: ['billing', 'admin', 'receptionist'] },

  // ─── Admin workspace ───
  { id: 'ris-settings', label: 'Settings', workspace: 'admin', path: '/settings', icon: 'Settings', roles: ['admin'] },
];

export function getModulesForWorkspace(workspaceId: WorkspaceId): CandelaModule[] {
  return CANDELA_MODULES.filter(m => m.workspace === workspaceId);
}

export function getModuleByPath(path: string): CandelaModule | undefined {
  // Sort by path length descending to match most specific path first
  return [...CANDELA_MODULES]
    .sort((a, b) => b.path.length - a.path.length)
    .find(m => path.startsWith(m.path));
}
