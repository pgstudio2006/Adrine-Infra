'use client';

import { useShell } from '../shell/Shell';
import * as Icons from 'lucide-react';

export interface PatientBarProps {
  patient?: {
    id: string;
    uhid: string;
    fullName: string;
    age: number;
    gender: string;
  } | null;
}

export function PatientBar({ patient }: PatientBarProps) {
  const { setPatientDrawerOpen } = useShell();

  if (!patient) return null;

  return (
    <div
      style={{
        height: 'var(--c-shell-patient-bar)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--c-space-4)',
        gap: 'var(--c-space-3)',
        background: 'var(--c-surface)',
        borderBottom: '1px solid var(--c-border)',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 'var(--c-radius-full)',
          background: 'var(--c-accent-bg)',
          color: 'var(--c-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 11,
        }}
      >
        {patient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>
            {patient.fullName}
          </span>
          <span style={{ fontSize: 10, fontFamily: 'var(--c-font-mono)', color: 'var(--c-text-tertiary)' }}>
            {patient.uhid}
          </span>
          <span style={{ fontSize: 10, color: 'var(--c-text-tertiary)' }}>
            {patient.age}y {patient.gender}
          </span>
        </div>
      </div>
      <button
        onClick={() => setPatientDrawerOpen(true)}
        style={{
          height: 28,
          padding: '0 10px',
          borderRadius: 'var(--c-radius-md)',
          border: '1px solid var(--c-border)',
          background: 'transparent',
          color: 'var(--c-text-tertiary)',
          fontSize: 11,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <Icons.ChevronRight size={14} />
        Patient Info
      </button>
    </div>
  );
}
