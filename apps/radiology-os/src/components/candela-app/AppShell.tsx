'use client';

import { useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Shell, ShellProvider, useShell, WorkspaceNav, ModuleTabs } from './shell';
import { PatientDrawer } from './patient';
import { CommandPalette } from './action';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

/* ─── App Shell Inner (needs Shell context) ─── */
function AppShellInner() {
  const { setPatientDrawerOpen, setCommandPaletteOpen, workspaceMode } = useShell();
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Keyboard shortcuts ───
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlOrMeta: true,
      handler: () => setCommandPaletteOpen(o => !o),
      description: 'Open command palette',
    },
    {
      key: 'p',
      ctrlOrMeta: false,
      handler: () => setPatientDrawerOpen(o => !o),
      ignoreWhenEditing: false,
      description: 'Toggle patient drawer',
    },
    {
      key: '/',
      ctrlOrMeta: false,
      handler: () => setCommandPaletteOpen(true),
      description: 'Focus search',
    },
    {
      key: 'Escape',
      ctrlOrMeta: false,
      handler: () => {
        setPatientDrawerOpen(false);
        setCommandPaletteOpen(false);
      },
      description: 'Close drawers/palette',
    },
  ]);

  return (
    <Shell
      workspaceNav={<WorkspaceNav />}
      moduleTabs={<ModuleTabs />}
      patientDrawer={<PatientDrawer />}
      commandPalette={<CommandPalette />}
    >
      <Outlet />
    </Shell>
  );
}

/* ─── App Shell (provides context) ─── */
export default function AppShell() {
  return (
    <ShellProvider>
      <AppShellInner />
    </ShellProvider>
  );
}
