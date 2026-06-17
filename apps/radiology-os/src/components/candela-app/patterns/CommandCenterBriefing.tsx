'use client';

import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';

/* ─── Demo metrics — replaced with API data ─── */
const METRICS = [
  { label: "Today's Studies", value: 59, icon: Icons.ScanLine, color: 'var(--c-chroma-diagnostics)', change: '+12%', positive: true },
  { label: 'Pending Reports', value: 14, icon: Icons.Clock, color: 'var(--c-warning)', change: '-3', positive: false },
  { label: 'Completed Today', value: 38, icon: Icons.CheckCircle, color: 'var(--c-success)', change: '+18%', positive: true },
  { label: 'Avg TAT', value: '47m', icon: Icons.Activity, color: 'var(--c-info)', change: '-5m', positive: true },
  { label: 'Revenue Today', value: '₹3.42L', icon: Icons.IndianRupee, color: 'var(--c-chroma-finance)', change: '+22%', positive: true },
  { label: 'Critical Alerts', value: 2, icon: Icons.AlertTriangle, color: 'var(--c-critical)', change: '0', positive: false },
];

const RECENT_ACTIVITY = [
  { patient: 'Priya Sharma', study: 'MRI Brain', event: 'New Order', time: '2 min ago', severity: 'info' as const },
  { patient: 'Rajesh Kumar', study: 'CT Chest', event: 'Scan Complete', time: '8 min ago', severity: 'success' as const },
  { patient: 'Anita Desai', study: 'X-Ray Knee', event: 'Report Ready', time: '15 min ago', severity: 'info' as const },
  { patient: 'Meena Devi', study: 'CT Abdomen', event: 'Critical Finding', time: '35 min ago', severity: 'critical' as const },
  { patient: 'Suresh Patel', study: 'USG Abdomen', event: 'Dispatched', time: '22 min ago', severity: 'success' as const },
];

const MODALITY_BREAKDOWN = [
  { modality: 'MRI', count: 8, color: '#6366f1' },
  { modality: 'CT', count: 12, color: '#e53935' },
  { modality: 'X-Ray', count: 24, color: '#22c55e' },
  { modality: 'USG', count: 15, color: '#f59e0b' },
];

export function CommandCenterBriefing() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--c-space-6)' }}>
        <h1 style={{
          fontFamily: 'var(--c-font-display)',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--c-text)',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          Morning Briefing
        </h1>
        <p style={{ fontSize: 12, color: 'var(--c-text-tertiary)', marginTop: 4 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
        gap: 'var(--c-space-3)',
        marginBottom: 'var(--c-space-6)',
      }}>
        {METRICS.map(m => (
          <div
            key={m.label}
            style={{
              background: 'var(--c-surface)',
              borderRadius: 'var(--c-radius-lg)',
              border: '1px solid var(--c-border)',
              padding: 'var(--c-space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <m.icon size={14} style={{ color: m.color }} />
              <span style={{ fontSize: 9, color: 'var(--c-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {m.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-text)' }}>{m.value}</span>
              <span style={{
                fontSize: 10,
                fontWeight: 500,
                color: m.positive ? 'var(--c-success)' : 'var(--c-critical)',
              }}>
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--c-space-4)' }}>
        {/* Recent Activity */}
        <div style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--c-radius-lg)',
          border: '1px solid var(--c-border)',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--c-space-3) var(--c-space-4)',
            borderBottom: '1px solid var(--c-border)',
          }}>
            <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', margin: 0 }}>
              Recent Activity
            </h2>
            <button
              onClick={() => navigate('/worklist')}
              style={{
                fontSize: 10,
                color: 'var(--c-accent)',
                fontWeight: 500,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              View all →
            </button>
          </div>
          <div style={{ padding: 'var(--c-space-2)' }}>
            {RECENT_ACTIVITY.map((a, i) => {
              const severityColor = a.severity === 'critical' ? 'var(--c-critical)' 
                : a.severity === 'success' ? 'var(--c-success)' 
                : 'var(--c-info)';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 'var(--c-radius-md)',
                    cursor: 'pointer',
                    transition: 'background var(--c-transition-fast)',
                  }}
                  className="c-surface-hoverable"
                >
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: severityColor,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--c-text)' }}>{a.patient}</span>
                      <span style={{
                        fontSize: 9,
                        padding: '1px 6px',
                        borderRadius: 'var(--c-radius-full)',
                        fontWeight: 500,
                        background: a.severity === 'critical' ? 'var(--c-critical-bg)' 
                          : a.severity === 'success' ? 'var(--c-success-bg)' 
                          : 'var(--c-info-bg)',
                        color: severityColor,
                      }}>
                        {a.event}
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--c-text-tertiary)', marginTop: 1 }}>
                      {a.study}
                    </p>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--c-text-tertiary)', flexShrink: 0 }}>{a.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modality Breakdown + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--c-space-4)' }}>
          {/* Modality Breakdown */}
          <div style={{
            background: 'var(--c-surface)',
            borderRadius: 'var(--c-radius-lg)',
            border: '1px solid var(--c-border)',
            padding: 'var(--c-space-3) var(--c-space-4)',
          }}>
            <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', margin: '0 0 12px 0' }}>
              Today by Modality
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {MODALITY_BREAKDOWN.map(m => (
                <div
                  key={m.modality}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--c-radius-md)',
                    background: 'var(--c-surface-hover)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: m.color,
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text)' }}>{m.modality}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)' }}>{m.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'var(--c-surface)',
            borderRadius: 'var(--c-radius-lg)',
            border: '1px solid var(--c-border)',
            padding: 'var(--c-space-3) var(--c-space-4)',
          }}>
            <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', margin: '0 0 10px 0' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                { label: 'New Order', path: '/orders', color: 'var(--c-accent)' },
                { label: 'New Patient', path: '/patients/new', color: 'var(--c-chroma-command)' },
                { label: 'Worklist', path: '/worklist', color: 'var(--c-success)' },
                { label: 'Report', path: '/reporting', color: 'var(--c-warning)' },
                { label: 'Billing', path: '/billing', color: 'var(--c-chroma-finance)' },
              ].map(q => (
                <button
                  key={q.path}
                  onClick={() => navigate(q.path)}
                  style={{
                    height: 30,
                    padding: '0 12px',
                    borderRadius: 'var(--c-radius-md)',
                    border: '1px solid var(--c-border)',
                    background: 'var(--c-surface-hover)',
                    color: 'var(--c-text-secondary)',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all var(--c-transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = q.color; e.currentTarget.style.color = q.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text-secondary)'; }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Machine Utilization Section */}
      <div style={{
        background: 'var(--c-surface)',
        borderRadius: 'var(--c-radius-lg)',
        border: '1px solid var(--c-border)',
        padding: 'var(--c-space-4)',
        marginTop: 'var(--c-space-4)',
      }}>
        <h2 style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', margin: '0 0 12px 0' }}>
          Machine Utilization Today
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { name: 'MRI Suite 1', modality: 'MRI', pct: 75 },
            { name: 'CT Suite 1', modality: 'CT', pct: 90 },
            { name: 'CT Suite 2', modality: 'CT', pct: 45 },
            { name: 'X-Ray Room 1', modality: 'X-Ray', pct: 80 },
            { name: 'US Room 1', modality: 'USG', pct: 60 },
          ].map(m => (
            <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 110, fontSize: 11, color: 'var(--c-text-secondary)', flexShrink: 0 }}>{m.name}</span>
              <div style={{
                flex: 1,
                height: 6,
                borderRadius: 'var(--c-radius-full)',
                background: 'var(--c-surface-hover)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${m.pct}%`,
                  height: '100%',
                  borderRadius: 'var(--c-radius-full)',
                  background: m.pct > 80 ? 'var(--c-critical)' : m.pct > 60 ? 'var(--c-warning)' : 'var(--c-success)',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ width: 30, fontSize: 10, color: 'var(--c-text-tertiary)', textAlign: 'right' }}>{m.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
