import { useState } from 'react';
import { Play, Pause, CheckCircle, Upload, MessageSquare, AlertTriangle, Clock, FileText, Image } from 'lucide-react';

const DEMO = {
  patient: 'Kavita Joshi', uhid: 'UH-2026-007', age: 42, gender: 'Female', mobile: '9876543220',
  study: 'CT Chest', modality: 'CT Scan', priority: 'STAT', clinicalHistory: 'Acute chest pain, rule out PE',
  orderId: 'ORD-2026-0892', scheduledTime: '11:00', room: 'CT Suite 2', technician: 'Tech. Suresh',
};

const STEPS = ['Arrived', 'Ready', 'Scanning', 'Completed'];
const STEP_ICONS = [Clock, Play, AlertTriangle, CheckCircle];

export default function RisStudyExecution() {
  const [currentStep, setCurrentStep] = useState(0);
  const [notes, setNotes] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--c-text)]">Study Execution</h1>
        <p className="text-sm text-[var(--c-text-secondary)] mt-0.5">Scan workflow with progress tracking</p>
      </div>

      {/* Patient Header — large, touch-friendly */}
      <div className="bg-[var(--c-surface-raised)] rounded-xl border border-[var(--c-border-light)] p-5">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[var(--c-accent-bg)] flex items-center justify-center text-[var(--c-accent)] text-lg font-bold shrink-0">
            {DEMO.patient.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-[var(--c-text)]">{DEMO.patient}</p>
              <span className="text-[10px] font-mono text-[var(--c-text-tertiary)]">{DEMO.uhid}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--c-accent-bg)] text-[var(--c-accent)] font-semibold">{DEMO.priority}</span>
            </div>
            <p className="text-xs text-[var(--c-text-secondary)] mt-0.5">{DEMO.age}y {DEMO.gender} · {DEMO.mobile}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--c-surface-hover)] text-[var(--c-text-secondary)]">{DEMO.modality}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--c-surface-hover)] text-[var(--c-text-secondary)]">{DEMO.room}</span>
              <span className="text-[10px] text-[var(--c-text-tertiary)]">Order: {DEMO.orderId}</span>
            </div>
          </div>
        </div>
        {DEMO.clinicalHistory && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border-light)]">
            <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-wider font-semibold mb-1">Clinical History</p>
            <p className="text-xs text-[var(--c-text-secondary)]">{DEMO.clinicalHistory}</p>
          </div>
        )}
      </div>

      {/* Progress Tracker */}
      <div className="bg-[var(--c-surface-raised)] rounded-xl border border-[var(--c-border-light)] p-5">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => {
            const Icon = STEP_ICONS[i];
            const isActive = i === currentStep;
            const isComplete = i < currentStep;
            return (
              <div key={step} className="flex-1 flex flex-col items-center">
                <button
                  onClick={() => setCurrentStep(i)}
                  className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                    isComplete ? 'bg-[#00C853] text-[var(--c-text)]' : isActive ? 'bg-[#E53935] text-[var(--c-text)] ring-4 ring-[#E53935]/20' : 'bg-[var(--c-surface-hover)] text-[var(--c-text-placeholder)]'
                  }`}>
                  <Icon className="h-5 w-5" />
                </button>
                <p className={`text-[10px] font-medium mt-2 ${isActive ? 'text-[var(--c-text)]' : isComplete ? 'text-[#00C853]' : 'text-[var(--c-text-tertiary)]'}`}>{step}</p>
                {i < STEPS.length - 1 && (
                  <div className="absolute h-[2px] w-16 bg-white/10" style={{ marginTop: '-26px', marginLeft: '50%' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scan Controls */}
      <div className="bg-[var(--c-surface-raised)] rounded-xl border border-[var(--c-border-light)] p-5 space-y-4">
        <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-widest font-semibold">Scan Controls</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Start Scan', icon: Play, color: '#E53935', action: () => setCurrentStep(2) },
            { label: 'Pause', icon: Pause, color: '#FFB300', action: () => setIsPaused(!isPaused) },
            { label: 'Complete', icon: CheckCircle, color: '#00C853', action: () => setCurrentStep(3) },
            { label: 'Upload Images', icon: Upload, color: '#6366f1', action: () => {} },
          ].map(b => (
            <button key={b.label} onClick={b.action}
              className="h-16 rounded-xl flex flex-col items-center justify-center gap-1.5 border border-[var(--c-border-light)] hover:border-[var(--c-border-hover)] transition-all"
              style={{ backgroundColor: `${b.color}08` }}>
              <b.icon className="h-5 w-5" style={{ color: b.color }} />
              <span className="text-[10px] font-medium" style={{ color: b.color }}>{b.label}</span>
            </button>
          ))}
        </div>
        {isPaused && (
          <div className="p-3 rounded-lg bg-[#FFB300]/5 border border-[#FFB300]/20 text-[#FFB300] text-xs font-medium flex items-center gap-2">
            <Pause className="h-4 w-4" />Scan paused
          </div>
        )}
      </div>

      {/* Notes + PACS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--c-surface-raised)] rounded-xl border border-[var(--c-border-light)] p-5 space-y-3">
          <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-widest font-semibold">Technician Notes</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
            placeholder="Scan observations, positioning, contrast administration notes..."
            className="w-full rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 py-2 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50 resize-none" />
        </div>
        <div className="bg-[var(--c-surface-raised)] rounded-xl border border-[var(--c-border-light)] p-5 space-y-3">
          <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-widest font-semibold">PACS Viewer</p>
          <div className="bg-[var(--c-surface)] rounded-lg border border-[var(--c-border)] p-8 text-center">
            <Image className="h-12 w-12 text-[var(--c-text-placeholder)] mx-auto mb-3" />
            <p className="text-xs text-[var(--c-text-tertiary)]">No images linked yet</p>
            <p className="text-[10px] text-[var(--c-text-placeholder)] mt-1">Images will appear after scan completion</p>
          </div>
          <button className="w-full h-9 rounded-lg bg-[var(--c-surface-hover)] border border-[var(--c-border)] text-[var(--c-text-secondary)] text-xs font-medium hover:bg-white/10 hover:text-[var(--c-text)]/70 transition-colors flex items-center justify-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />Open PACS Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
