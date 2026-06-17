'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CandelaRoleId, WorkspaceId, WorkspaceModeId, ModuleId } from '@/design-system/candela';

/* ─── Shell Context ─── */
export interface ShellContextType {
  role: CandelaRoleId;
  setRole: (r: CandelaRoleId) => void;
  workspace: WorkspaceId;
  setWorkspace: (w: WorkspaceId) => void;
  workspaceMode: WorkspaceModeId;
  setWorkspaceMode: (m: WorkspaceModeId) => void;
  activeModule: ModuleId | null;
  setActiveModule: (m: ModuleId | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  patientDrawerOpen: boolean;
  setPatientDrawerOpen: (o: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (o: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const ShellContext = createContext<ShellContextType | null>(null);

export function useShell(): ShellContextType {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error('useShell must be used within a ShellProvider');
  return ctx;
}

/* ─── Shell Provider ─── */
export function ShellProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<CandelaRoleId>('admin');
  const [workspace, setWorkspace] = useState<WorkspaceId>('command');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceModeId>('standard');
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [patientDrawerOpen, setPatientDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);

  // Sync data-mode attribute to the document element for CSS variable theming
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', theme);
  }, [theme]);

  return (
    <ShellContext.Provider
      value={{
        role, setRole,
        workspace, setWorkspace,
        workspaceMode, setWorkspaceMode,
        activeModule, setActiveModule,
        theme, toggleTheme,
        patientDrawerOpen, setPatientDrawerOpen,
        commandPaletteOpen, setCommandPaletteOpen,
        searchQuery, setSearchQuery,
      }}
    >
      {children}
    </ShellContext.Provider>
  );
}

/* ─── Shell Layout ─── */
export interface ShellProps {
  workspaceNav: ReactNode;
  moduleTabs?: ReactNode;
  contextRail?: ReactNode;
  patientBar?: ReactNode;
  patientDrawer?: ReactNode;
  commandPalette?: ReactNode;
  children: ReactNode;
}

export function Shell({
  workspaceNav,
  moduleTabs,
  contextRail,
  patientBar,
  patientDrawer,
  commandPalette,
  children,
}: ShellProps) {
  const { workspaceMode } = useShell();

  return (
    <div
      className="c-shell"
      data-candela-app
      data-workspace-mode={workspaceMode}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--c-canvas)',
        color: 'var(--c-text)',
        fontFamily: 'var(--c-font-sans)',
        fontSize: 'var(--c-text-base)',
      }}
    >
      {/* Workspace Nav (48px) */}
      <div className="c-workspace-nav" style={{ flexShrink: 0 }}>
        {workspaceNav}
      </div>

      {/* Module Tabs (40px) */}
      {moduleTabs && (
        <div className="c-module-tabs" style={{ flexShrink: 0 }}>
          {moduleTabs}
        </div>
      )}

      {/* Patient Bar (56px, contextual) */}
      {patientBar && (
        <div className="c-patient-bar" style={{ flexShrink: 0 }}>
          {patientBar}
        </div>
      )}

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Context Rail (200px, optional) */}
        {contextRail && (
          <div
            className="c-context-rail"
            style={{
              width: 'var(--c-shell-context-rail)',
              flexShrink: 0,
              borderRight: '1px solid var(--c-border)',
              overflowY: 'auto',
              background: 'var(--c-surface)',
            }}
          >
            {contextRail}
          </div>
        )}

        {/* Main Canvas */}
        <main
          className="c-main-canvas"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--c-space-6)',
          }}
        >
          {children}
        </main>
      </div>

      {/* Patient Drawer (overlay) */}
      {patientDrawer}

      {/* Command Palette (overlay) */}
      {commandPalette}
    </div>
  );
}
