/* ═══════════════════════════════════════════
   Candela Design System v2 — Barrel Export
   ═══════════════════════════════════════════ */

export * from './workspaces';
export * from './modules';
export * from './roles';
export * from './workspace-modes';
export * from './patterns';
export * from './schema';
export * from './activity';

export type { CandelaRoleId } from './roles';
export type { CandelaWorkspace, WorkspaceId } from './workspaces';
export type { CandelaModule, ModuleId } from './modules';
export type { CandelaWorkspaceMode, WorkspaceModeId } from './workspace-modes';
export type { PatternId } from './patterns';
export type { SchemaFormDef, SchemaWorkflowDef, SchemaFieldDef, SchemaFieldType } from './schema';
export type { CandelaActivityEvent, ActivityEventType } from './activity';
export { resolveIcon } from './icons';
