import { useNavigate } from 'react-router-dom';
import { getModulesForWorkspace } from '@/design-system/candela';
import { resolveIcon } from '@/design-system/candela/icons';
import type { CandelaModule } from '@/design-system/candela';

const MODULE_DESCRIPTIONS: Record<string, string> = {
  'ris-orders': 'Create imaging investigation requests',
  'ris-scheduler': 'Modality slot board with conflict detection',
  'ris-worklist': 'Auto-populated queue from booked investigations',
  'ris-execution': 'Study execution and scan workflow',
  'ris-pacs': 'PACS viewer and image review',
  'ris-radiologist': 'Radiologist reading queue',
  'ris-reporting': 'Report dictation and editing workspace',
  'ris-templates': 'Report template library management',
  'ris-reports': 'Report preview and quality review',
  'ris-dispatch': 'WhatsApp report dispatch',
};

export default function DiagnosticsLanding() {
  const navigate = useNavigate();
  const modules = getModulesForWorkspace('diagnostics');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--c-space-6)' }}>
        <h1 style={{
          fontFamily: 'var(--c-font-display)',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--c-text)',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          Diagnostics
        </h1>
        <p style={{ fontSize: 13, color: 'var(--c-text-tertiary)', marginTop: 4 }}>
          Radiology Information System — module hub
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 'var(--c-space-3)',
      }}>
        {modules.map(m => (
          <ModuleCard key={m.id} module={m} onClick={() => navigate(m.path)} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ module, onClick }: { module: CandelaModule; onClick: () => void }) {
  const Icon = resolveIcon(module.icon);
  const description = MODULE_DESCRIPTIONS[module.id] || 'Radiology module';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 'var(--c-space-4)',
        borderRadius: 'var(--c-radius-lg)',
        border: '1px solid var(--c-border)',
        background: 'var(--c-surface)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all var(--c-transition-fast)',
      }}
      className="c-surface-hoverable"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--c-accent)';
        e.currentTarget.style.boxShadow = 'var(--c-shadow-md)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--c-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 'var(--c-radius-lg)',
        background: 'var(--c-accent-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color: 'var(--c-accent)' }} />
      </div>

      <div>
        <p style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--c-text)',
          margin: 0,
        }}>
          {module.label}
        </p>
        <p style={{
          fontSize: 11,
          color: 'var(--c-text-tertiary)',
          marginTop: 2,
          lineHeight: 1.4,
        }}>
          {description}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {module.roles.slice(0, 3).map(r => (
          <span
            key={r}
            style={{
              fontSize: 9,
              padding: '1px 6px',
              borderRadius: 'var(--c-radius-full)',
              background: 'var(--c-surface-hover)',
              color: 'var(--c-text-tertiary)',
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {r.replace('_', ' ')}
          </span>
        ))}
      </div>
    </button>
  );
}
