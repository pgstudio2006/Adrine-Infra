'use client';

import { useNavigate, useLocation } from 'react-router-dom';
import { useShell } from './Shell';
import { CANDELA_WORKSPACES, getModulesForWorkspace } from '@/design-system/candela';
import * as Icons from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { resolveIcon } from '@/design-system/candela/icons';

/* ─── Workspace Nav Component (48px) ─── */
export function WorkspaceNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    role,
    setRole,
    workspace,
    setWorkspace,
    theme,
    toggleTheme,
    setPatientDrawerOpen,
    setCommandPaletteOpen,
  } = useShell();

  const handleWorkspaceClick = useCallback((wid: string, path: string) => {
    setWorkspace(wid as any);
    navigate(path);
  }, [navigate, setWorkspace]);

  return (
    <nav
      style={{
        height: 'var(--c-shell-workspace-nav)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--c-space-4)',
        gap: 'var(--c-space-2)',
        background: 'var(--c-surface)',
        borderBottom: '1px solid var(--c-border)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--c-space-2)',
          marginRight: 'var(--c-space-4)',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--c-radius-md)',
            background: 'var(--c-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          R
        </div>
        <span
          style={{
            fontFamily: 'var(--c-font-display)',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '-0.01em',
          }}
        >
          Adrine RIS
        </span>
      </div>

      {/* Workspace buttons — all workspaces per role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {CANDELA_WORKSPACES.filter(w => {
          // Always show all workspaces; role filter can be refined
          return true;
        }).map(w => {
          const Icon = resolveIcon(w.icon);
          const isActive = location.pathname.startsWith(w.path);
          return (
            <button
              key={w.id}
              onClick={() => handleWorkspaceClick(w.id, w.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 32,
                padding: '0 12px',
                borderRadius: 'var(--c-radius-md)',
                border: 'none',
                background: isActive ? 'var(--c-surface-hover)' : 'transparent',
                color: isActive ? 'var(--c-text)' : 'var(--c-text-tertiary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all var(--c-transition-fast)',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--c-surface-hover)';
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <Icon size={16} />
              {w.label}
            </button>
          );
        })}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Search */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          title="Search (⌘K)"
          style={iconBtnStyle}
        >
          <Icons.Search size={16} />
        </button>

        {/* Notifications */}
        <button
          onClick={() => {}}
          title="Notifications"
          style={{ ...iconBtnStyle, position: 'relative' }}
        >
          <Icons.Bell size={16} />
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--c-critical)',
          }} />
        </button>

        {/* Patient drawer toggle (P) */}
        <button
          onClick={() => setPatientDrawerOpen(true)}
          title="Patient Drawer (P)"
          style={iconBtnStyle}
        >
          <Icons.Users size={16} />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          style={iconBtnStyle}
        >
          {theme === 'dark' ? <Icons.Sun size={16} /> : <Icons.Moon size={16} />}
        </button>

        {/* Role selector */}
        <select
          value={role}
          onChange={e => setRole(e.target.value as any)}
          style={{
            height: 28,
            padding: '0 8px',
            borderRadius: 'var(--c-radius-md)',
            border: '1px solid var(--c-border)',
            background: 'var(--c-surface-hover)',
            color: 'var(--c-text-secondary)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="admin">Admin</option>
          <option value="receptionist">Receptionist</option>
          <option value="technician">Technician</option>
          <option value="radiologist">Radiologist</option>
          <option value="billing">Billing</option>
          <option value="reporting_manager">Rep. Manager</option>
        </select>
      </div>
    </nav>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--c-radius-md)',
  border: 'none',
  background: 'transparent',
  color: 'var(--c-text-tertiary)',
  cursor: 'pointer',
  transition: 'all var(--c-transition-fast)',
};

/* ─── Module Tabs (40px) ─── */
export function ModuleTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspace, role } = useShell();

  const modules = useMemo(() => {
    return getModulesForWorkspace(workspace).filter(m => m.roles.includes(role));
  }, [workspace, role]);

  if (modules.length === 0) return null;

  return (
    <div
      style={{
        height: 'var(--c-shell-module-tabs)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--c-space-4)',
        gap: 2,
        background: 'var(--c-surface)',
        borderBottom: '1px solid var(--c-border)',
        overflowX: 'auto',
      }}
      className="c-scrollbar-hide"
    >
      {modules.map(m => {
        const isActive = location.pathname === m.path || 
          (m.path !== '/' && location.pathname.startsWith(m.path));
        const Icon = resolveIcon(m.icon);

        return (
          <button
            key={m.id}
            onClick={() => navigate(m.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 12px',
              borderRadius: 'var(--c-radius-md)',
              border: 'none',
              background: isActive ? 'var(--c-surface-hover)' : 'transparent',
              color: isActive ? 'var(--c-text)' : 'var(--c-text-tertiary)',
              fontWeight: isActive ? 600 : 400,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all var(--c-transition-fast)',
              position: 'relative',
            }}
          >
            <Icon size={14} />
            {m.label}
            {isActive && (
              <span style={{
                position: 'absolute',
                bottom: -5,
                left: '20%',
                right: '20%',
                height: 2,
                borderRadius: 1,
                background: 'var(--c-accent)',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
