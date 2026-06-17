/* ═══════════════════════════════════════════
   Candela Design System v2 — Patterns
   Composable UI primitive catalog
   ═══════════════════════════════════════════ */

export type PatternId =
  | 'shell.standard'
  | 'nav.top-workspace'
  | 'nav.secondary-module'
  | 'data.queue-split'
  | 'data.list-detail'
  | 'data.table'
  | 'data.activity-feed'
  | 'data.metric-grid'
  | 'data.filter-bar'
  | 'surface.briefing'
  | 'surface.card'
  | 'surface.modal'
  | 'patient.bar'
  | 'patient.drawer'
  | 'form.schema'
  | 'form.workflow-stepper'
  | 'action.command-palette'
  | 'action.status-pill'
  | 'workspace.reporting'
  | 'workspace.handover';

export interface CandelaPattern {
  id: PatternId;
  name: string;
  description: string;
  category: 'shell' | 'nav' | 'data' | 'surface' | 'patient' | 'form' | 'action' | 'workspace';
  /** Suggested Tailwind width classes for the pattern */
  defaultWidth?: string;
  /** When true, this pattern is a top-level layout wrapper */
  isLayout?: boolean;
}

export const CANDELA_PATTERNS: CandelaPattern[] = [
  // ─── Shell ───
  { id: 'shell.standard', name: 'Standard Shell', description: 'Full app layout with nav, tabs, and context rail', category: 'shell', isLayout: true },

  // ─── Nav ───
  { id: 'nav.top-workspace', name: 'Workspace Nav', description: 'L1 top navigation bar (48px)', category: 'nav' },
  { id: 'nav.secondary-module', name: 'Module Tabs', description: 'L2 secondary tab bar (40px)', category: 'nav' },

  // ─── Data ───
  { id: 'data.queue-split', name: 'Queue Split', description: 'Split view with queue on left, detail on right', category: 'data', isLayout: true },
  { id: 'data.list-detail', name: 'List Detail', description: 'Master-detail list view', category: 'data', isLayout: true },
  { id: 'data.table', name: 'Data Table', description: 'Density-aware data table with sort/filter', category: 'data' },
  { id: 'data.activity-feed', name: 'Activity Feed', description: 'Chronological event feed with semantic coloring', category: 'data' },
  { id: 'data.metric-grid', name: 'Metric Grid', description: 'KPI metric cards in a responsive grid', category: 'data' },
  { id: 'data.filter-bar', name: 'Filter Bar', description: 'Horizontal filter controls for data views', category: 'data' },

  // ─── Surface ───
  { id: 'surface.briefing', name: 'Briefing', description: 'Command Center morning briefing layout', category: 'surface', isLayout: true },
  { id: 'surface.card', name: 'Card', description: 'Surface-raised container for content', category: 'surface' },
  { id: 'surface.modal', name: 'Modal', description: 'Overlay modal dialog', category: 'surface' },

  // ─── Patient ───
  { id: 'patient.bar', name: 'Patient Bar', description: 'Contextual patient info bar (56px)', category: 'patient' },
  { id: 'patient.drawer', name: 'Patient Drawer', description: 'Universal patient context drawer (480px)', category: 'patient' },

  // ─── Form ───
  { id: 'form.schema', name: 'Schema Form', description: 'Schema-driven form renderer', category: 'form' },
  { id: 'form.workflow-stepper', name: 'Workflow Stepper', description: 'Multi-step workflow stepper', category: 'form' },

  // ─── Action ───
  { id: 'action.command-palette', name: 'Command Palette', description: '⌘K command palette', category: 'action' },
  { id: 'action.status-pill', name: 'Status Pill', description: 'Semantic status badge', category: 'action' },

  // ─── Workspace ───
  { id: 'workspace.reporting', name: 'Reporting Mode', description: 'Distraction-free reporting layout', category: 'workspace', isLayout: true },
  { id: 'workspace.handover', name: 'Handover Mode', description: 'Nursing shift handover layout', category: 'workspace', isLayout: true },
];

export function getPattern(id: PatternId): CandelaPattern | undefined {
  return CANDELA_PATTERNS.find(p => p.id === id);
}

export function getPatternsByCategory(category: CandelaPattern['category']): CandelaPattern[] {
  return CANDELA_PATTERNS.filter(p => p.category === category);
}

/** Compose a view from pattern IDs — e.g. consult = [shell.standard, patient.drawer, data.queue-split, form.schema] */
export function composeView(patternIds: PatternId[]): CandelaPattern[] {
  return patternIds.map(id => getPattern(id)).filter(Boolean) as CandelaPattern[];
}
