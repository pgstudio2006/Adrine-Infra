import { useNavigate } from 'react-router-dom';
import { CANDELA_WORKSPACES, getModulesForWorkspace } from '@/design-system/candela';
import type { WorkspaceId } from '@/design-system/candela';
import { resolveIcon } from '@/design-system/candela/icons';

interface WorkspacePlaceholderProps {
  workspaceId: WorkspaceId;
  title?: string;
  description?: string;
}

export function WorkspacePlaceholder({ workspaceId, title, description }: WorkspacePlaceholderProps) {
  const navigate = useNavigate();
  const workspace = CANDELA_WORKSPACES.find(w => w.id === workspaceId);

  if (!workspace) return null;

  const Icon = resolveIcon(workspace.icon);
  const modules = getModulesForWorkspace(workspaceId);

  return (
    <div style={{ maxWidth: 640, margin: '80px auto', textAlign: 'center' }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 'var(--c-radius-xl)',
        background: 'var(--c-surface)',
        border: '1px solid var(--c-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <Icon size={28} style={{ color: `var(${workspace.chroma})` }} />
      </div>

      <h1 style={{
        fontFamily: 'var(--c-font-display)',
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--c-text)',
        margin: 0,
      }}>
        {title || workspace.label}
      </h1>

      <p style={{
        fontSize: 13,
        color: 'var(--c-text-tertiary)',
        marginTop: 8,
        lineHeight: 1.5,
      }}>
        {description || `The ${workspace.label} workspace is not yet configured for this Radiology instance.`}
      </p>

      {modules.length > 0 && (
        <div style={{ marginTop: 32, textAlign: 'left' }}>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--c-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 12,
          }}>
            Available modules
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {modules.map(m => {
              const MIcon = resolveIcon(m.icon);
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(m.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 'var(--c-radius-lg)',
                    border: '1px solid var(--c-border)',
                    background: 'var(--c-surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all var(--c-transition-fast)',
                    color: 'var(--c-text)',
                  }}
                  className="c-surface-hoverable"
                >
                  <MIcon size={18} style={{ color: `var(${workspace.chroma})` }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--c-text-tertiary)', marginLeft: 'auto' }}>→</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 32,
          height: 34,
          padding: '0 20px',
          borderRadius: 'var(--c-radius-md)',
          border: '1px solid var(--c-border)',
          background: 'var(--c-surface)',
          color: 'var(--c-text-secondary)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
