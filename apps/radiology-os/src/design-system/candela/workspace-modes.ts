/* ═══════════════════════════════════════════
   Candela Design System v2 — Workspace Modes
   Focus modes for distraction-free workflows
   ═══════════════════════════════════════════ */

export type WorkspaceModeId = 'standard' | 'reporting' | 'handover' | 'reconciliation' | 'documentation' | 'review';

export interface CandelaWorkspaceMode {
  id: WorkspaceModeId;
  label: string;
  description: string;
  shortcut?: string;
  /** Which elements are hidden in this mode */
  hides: ('module-tabs' | 'context-rail' | 'patient-bar' | 'workspace-nav-secondary')[];
}

export const CANDELA_WORKSPACE_MODES: CandelaWorkspaceMode[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Default full navigation',
    hides: [],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    description: 'RIS/PACS/report only — hides subnav and context rail',
    shortcut: 'F',
    hides: ['module-tabs', 'context-rail'],
  },
  {
    id: 'handover',
    label: 'Handover',
    description: 'Nursing shift handover view',
    shortcut: 'H',
    hides: ['context-rail'],
  },
  {
    id: 'reconciliation',
    label: 'Reconciliation',
    description: 'Billing/finance dense review',
    shortcut: 'R',
    hides: ['module-tabs', 'context-rail'],
  },
  {
    id: 'documentation',
    label: 'Documentation',
    description: 'OT/surgical notes focus',
    hides: ['context-rail'],
  },
  {
    id: 'review',
    label: 'Review',
    description: 'NABH audit / compliance review',
    hides: ['context-rail'],
  },
];

export function getWorkspaceMode(id: WorkspaceModeId): CandelaWorkspaceMode | undefined {
  return CANDELA_WORKSPACE_MODES.find(m => m.id === id);
}
