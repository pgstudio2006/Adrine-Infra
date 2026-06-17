import { useState, useMemo } from 'react';
import { Play, CheckCircle, Clock, Search, AlertTriangle, ChevronRight } from 'lucide-react';

const DEMO_WORKLIST = [
  { id: '1', patient: 'Suresh Patel', uhid: 'UH-2026-004', study: 'USG Abdomen', modality: 'Ultrasound', priority: 'Routine', status: 'arrived', time: '09:30', room: 'US Room 1' },
  { id: '2', patient: 'Meena Devi', uhid: 'UH-2026-005', study: 'CT Abdomen with Contrast', modality: 'CT Scan', priority: 'Urgent', status: 'scheduled', time: '10:00', room: 'CT Suite 1' },
  { id: '3', patient: 'Vikram Singh', uhid: 'UH-2026-006', study: 'MRI Lumbar Spine', modality: 'MRI', priority: 'Routine', status: 'scheduled', time: '10:30', room: 'MRI Suite 1' },
  { id: '4', patient: 'Kavita Joshi', uhid: 'UH-2026-007', study: 'CT Chest', modality: 'CT Scan', priority: 'STAT', status: 'arrived', time: '11:00', room: 'CT Suite 2' },
  { id: '5', patient: 'Arun Nair', uhid: 'UH-2026-008', study: 'X-Ray Spine', modality: 'X-Ray', priority: 'Routine', status: 'scheduled', time: '11:30', room: 'X-Ray Room 1' },
];

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-[#2196F3]/10', text: 'text-[var(--c-info)]', label: 'Scheduled' },
  arrived: { bg: 'bg-[#FFB300]/10', text: 'text-[var(--c-warning)]', label: 'Arrived' },
  in_progress: { bg: 'bg-[#E53935]/10', text: 'text-[var(--c-accent)]', label: 'In Progress' },
  completed: { bg: 'bg-[#00C853]/10', text: 'text-[var(--c-success)]', label: 'Completed' },
};

const priorityStyle: Record<string, string> = {
  Routine: 'bg-[var(--c-surface-hover)] text-[var(--c-text-secondary)]',
  Urgent: 'bg-[var(--c-warning-bg)] text-[var(--c-warning)]',
  STAT: 'bg-[var(--c-accent-bg)] text-[var(--c-accent)]',
};

export default function RisTechWorklist() {
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState('All');
  const [selected, setSelected] = useState<typeof DEMO_WORKLIST[0] | null>(null);

  const filtered = useMemo(() => {
    return DEMO_WORKLIST.filter(w => {
      const matchSearch = w.patient.toLowerCase().includes(search.toLowerCase()) || w.uhid.includes(search);
      const matchMod = modalityFilter === 'All' || w.modality === modalityFilter;
      return matchSearch && matchMod;
    });
  }, [search, modalityFilter]);

  const arrivedCount = DEMO_WORKLIST.filter(w => w.status === 'arrived').length;
  const inProgressCount = DEMO_WORKLIST.filter(w => w.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--c-text)]">Technician Worklist</h1>
        <p className="text-sm text-[var(--c-text-secondary)] mt-0.5">Auto-populated queue from booked investigations</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-3">
          <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[var(--c-warning)]" /><span className="text-[10px] text-[var(--c-text-tertiary)] uppercase">Arrived</span></div>
          <p className="text-lg font-bold text-[var(--c-text)] mt-1">{arrivedCount}</p>
        </div>
        <div className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-3">
          <div className="flex items-center gap-2"><Play className="h-3.5 w-3.5 text-[var(--c-accent)]" /><span className="text-[10px] text-[var(--c-text-tertiary)] uppercase">In Progress</span></div>
          <p className="text-lg font-bold text-[var(--c-text)] mt-1">{inProgressCount}</p>
        </div>
        <div className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-3">
          <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[var(--c-success)]" /><span className="text-[10px] text-[var(--c-text-tertiary)] uppercase">Total</span></div>
          <p className="text-lg font-bold text-[var(--c-text)] mt-1">{DEMO_WORKLIST.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--c-text-tertiary)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient/UHID..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-[var(--c-surface-raised)] border border-[var(--c-border)] text-[var(--c-text)] text-xs placeholder:text-[var(--c-text-tertiary)] focus:outline-none focus:border-[var(--c-accent)]/50" />
        </div>
        <select value={modalityFilter} onChange={e => setModalityFilter(e.target.value)}
          className="h-9 rounded-lg bg-[var(--c-surface-raised)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 focus:outline-none">
          <option value="All">All modalities</option>
          {['MRI', 'CT Scan', 'X-Ray', 'Ultrasound'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="bg-[var(--c-surface-raised)] rounded-xl border border-[var(--c-border-light)] divide-y divide-[var(--c-border-light)]">
        {filtered.map(w => (
          <div key={w.id} onClick={() => setSelected(w)} className="flex items-center gap-4 p-4 hover:bg-[var(--c-surface-hover)] transition-colors cursor-pointer group">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ backgroundColor: w.modality === 'MRI' ? '#6366f115' : w.modality === 'CT Scan' ? '#E5393515' : w.modality === 'X-Ray' ? '#00C85315' : '#FFB30015', color: w.modality === 'MRI' ? '#6366f1' : w.modality === 'CT Scan' ? '#E53935' : w.modality === 'X-Ray' ? '#00C853' : '#FFB300' }}>
              {w.modality.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-[var(--c-text)]">{w.patient}</p>
                <span className="text-[9px] font-mono text-[var(--c-text-tertiary)]">{w.uhid}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${priorityStyle[w.priority]}`}>{w.priority}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${statusStyle[w.status]?.bg} ${statusStyle[w.status]?.text}`}>{statusStyle[w.status]?.label}</span>
              </div>
              <p className="text-[10px] text-[var(--c-text-secondary)] mt-0.5">{w.study} · {w.time} · {w.room}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {w.status === 'arrived' && (
                <button className="h-7 px-2.5 rounded-md bg-[var(--c-accent)] text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-[var(--c-accent-hover)] transition-colors" onClick={e => e.stopPropagation()}>
                  <Play className="h-3 w-3" />Start
                </button>
              )}
              {w.status === 'in_progress' && (
                <button className="h-7 px-2.5 rounded-md bg-[var(--c-success)] text-white text-[10px] font-semibold flex items-center gap-1 hover:brightness-90 transition-colors" onClick={e => e.stopPropagation()}>
                  <CheckCircle className="h-3 w-3" />Complete
                </button>
              )}
              <ChevronRight className="h-4 w-4 text-[var(--c-text-placeholder)] group-hover:text-[var(--c-text-tertiary)] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Study Detail Slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-[var(--c-overlay)] backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-[var(--c-surface)] border-l border-[var(--c-border)] p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--c-text)]">Study Details</h2>
              <button onClick={() => setSelected(null)} className="text-[var(--c-text-secondary)] hover:text-[var(--c-text)] text-lg">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[['Patient', selected.patient], ['UHID', selected.uhid], ['Study', selected.study], ['Modality', selected.modality], ['Priority', selected.priority], ['Time', selected.time], ['Room', selected.room], ['Status', statusStyle[selected.status]?.label]].map(([k, v]) => (
                  <div key={k} className="bg-[var(--c-surface-raised)] rounded-lg p-3">
                    <p className="text-[9px] text-[var(--c-text-tertiary)] uppercase tracking-wider">{k}</p>
                    <p className="text-xs text-[var(--c-text)] font-medium mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-wider font-semibold">Technician Notes</label>
                <textarea rows={3} placeholder="Scan observations, positioning, contrast notes..."
                  className="w-full rounded-lg bg-[var(--c-surface-raised)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 py-2 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50 resize-none" />
              </div>
              <div className="flex gap-2">
                {selected.status === 'arrived' && (
                  <button className="flex-1 h-9 rounded-lg bg-[var(--c-accent)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[var(--c-accent-hover)]">
                    <Play className="h-3.5 w-3.5" />Start Scan
                  </button>
                )}
                {(selected.status === 'arrived' || selected.status === 'in_progress') && (
                  <button className="flex-1 h-9 rounded-lg bg-[var(--c-success)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:brightness-90">
                    <CheckCircle className="h-3.5 w-3.5" />Complete Scan
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
