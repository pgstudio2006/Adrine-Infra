'use client';

import { useState, useCallback, useEffect } from 'react';
import { useShell } from '../shell/Shell';
import { PATIENT_DRAWER_SECTIONS } from '@/design-system/candela';
import * as Icons from 'lucide-react';
import { resolveIcon } from '@/design-system/candela/icons';

/* ─── Demo patient (will be replaced with real data) ─── */
const DEMO_PATIENT = {
  id: '1',
  uhid: 'UH-2026-001',
  fullName: 'Priya Sharma',
  age: 34,
  gender: 'Female',
  mobile: '9876543210',
};

export function PatientDrawer() {
  const { patientDrawerOpen, setPatientDrawerOpen } = useShell();
  const [activeTab, setActiveTab] = useState('timeline');

  // Close on Escape
  useEffect(() => {
    if (!patientDrawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPatientDrawerOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [patientDrawerOpen, setPatientDrawerOpen]);

  if (!patientDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setPatientDrawerOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--c-overlay)',
          zIndex: 'var(--c-z-drawer)',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'var(--c-shell-patient-drawer)',
          maxWidth: '100vw',
          background: 'var(--c-surface)',
          borderLeft: '1px solid var(--c-border)',
          boxShadow: 'var(--c-shadow-drawer)',
          zIndex: 'calc(var(--c-z-drawer) + 1)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--c-space-4) var(--c-space-5)',
            borderBottom: '1px solid var(--c-border)',
          }}
        >
          <div>
            <p style={{ fontSize: 10, color: 'var(--c-text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Patient
            </p>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)', marginTop: 2 }}>
              {DEMO_PATIENT.fullName}
            </p>
            <p style={{ fontSize: 11, color: 'var(--c-text-tertiary)', fontFamily: 'var(--c-font-mono)', marginTop: 1 }}>
              {DEMO_PATIENT.uhid} · {DEMO_PATIENT.age}y {DEMO_PATIENT.gender} · {DEMO_PATIENT.mobile}
            </p>
          </div>
          <button
            onClick={() => setPatientDrawerOpen(false)}
            style={{
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
            }}
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            borderBottom: '1px solid var(--c-border)',
            padding: '0 var(--c-space-3)',
            gap: 2,
          }}
          className="c-scrollbar-hide"
        >
          {PATIENT_DRAWER_SECTIONS.map(s => {
            const Icon = resolveIcon(s.icon);
            const isActive = activeTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  height: 34,
                  padding: '0 10px',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? 'var(--c-text)' : 'var(--c-text-tertiary)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 11,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  borderBottom: isActive ? '2px solid var(--c-accent)' : '2px solid transparent',
                  transition: 'all var(--c-transition-fast)',
                }}
              >
                <Icon size={13} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--c-space-4)' }}>
          <TabContent tab={activeTab} />
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

function TabContent({ tab }: { tab: string }) {
  switch (tab) {
    case 'timeline':
      return <ActivityTimeline />;
    case 'radiology':
      return (
        <div style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>
          <StudyHistory />
        </div>
      );
    case 'billing':
      return (
        <div style={{ padding: 'var(--c-space-6)', textAlign: 'center', fontSize: 12, color: 'var(--c-text-tertiary)' }}>
          Billing history will appear here
        </div>
      );
    default:
      return (
        <div style={{ padding: 'var(--c-space-6)', textAlign: 'center', fontSize: 12, color: 'var(--c-text-tertiary)' }}>
          {tab.charAt(0).toUpperCase() + tab.slice(1)} content
        </div>
      );
  }
}

function ActivityTimeline() {
  const timelineEvents = [
    { time: 'Today, 09:30', event: 'MRI Brain ordered', type: 'order' },
    { time: 'Today, 09:15', event: 'Patient arrived', type: 'arrival' },
    { time: 'Yesterday, 14:00', event: 'Appointment booked for MRI Brain', type: 'appointment' },
    { time: '2026-06-15', event: 'CT Abdomen completed - Report finalized', type: 'report' },
    { time: '2026-06-10', event: 'X-Ray Chest - Dispatched to patient', type: 'dispatch' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {timelineEvents.map((evt, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            padding: '10px 0',
            borderBottom: '1px solid var(--c-border-light)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              marginTop: 5,
              flexShrink: 0,
              background: 'var(--c-accent)',
              opacity: 0.6,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, color: 'var(--c-text)', fontWeight: 500 }}>{evt.event}</p>
            <p style={{ fontSize: 10, color: 'var(--c-text-tertiary)', marginTop: 1 }}>{evt.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StudyHistory() {
  const studies = [
    { date: '2026-06-17', study: 'MRI Brain', status: 'Ordered', modality: 'MRI' },
    { date: '2026-06-15', study: 'CT Abdomen', status: 'Completed', modality: 'CT' },
    { date: '2026-06-10', study: 'X-Ray Chest', status: 'Completed', modality: 'X-Ray' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {studies.map((s, i) => (
        <div
          key={i}
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--c-radius-lg)',
            background: 'var(--c-surface-hover)',
            border: '1px solid var(--c-border-light)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)' }}>{s.study}</p>
            <span
              style={{
                fontSize: 10,
                padding: '1px 8px',
                borderRadius: 'var(--c-radius-full)',
                fontWeight: 500,
                background: s.status === 'Completed' ? 'var(--c-success-bg)' : 'var(--c-info-bg)',
                color: s.status === 'Completed' ? 'var(--c-success)' : 'var(--c-info)',
              }}
            >
              {s.status}
            </span>
          </div>
          <p style={{ fontSize: 10, color: 'var(--c-text-tertiary)', marginTop: 2 }}>
            {s.modality} · {s.date}
          </p>
        </div>
      ))}
    </div>
  );
}
