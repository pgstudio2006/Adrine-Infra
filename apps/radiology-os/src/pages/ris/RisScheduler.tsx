import { useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle, Play, Search, Plus, AlertTriangle } from 'lucide-react';

const MODALITY_ROOMS: Record<string, string[]> = {
  MRI: ['MRI Suite 1', 'MRI Suite 2'],
  'CT Scan': ['CT Suite 1', 'CT Suite 2'],
  'X-Ray': ['X-Ray Room 1', 'X-Ray Room 2', 'Portable'],
  Ultrasound: ['US Room 1', 'US Room 2', 'US Room 3'],
  Mammography: ['Mammo Suite'],
};

const TIME_SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','14:00','14:30','15:00','15:30','16:00','16:30'];

const DEMO_SLOTS = [
  { id: '1', time: '08:00', patient: 'Priya Sharma', uhid: 'UH-2026-001', study: 'MRI Brain', modality: 'MRI', room: 'MRI Suite 1', status: 'completed', tech: 'Tech. Ramesh' },
  { id: '2', time: '08:30', patient: 'Rajesh Kumar', uhid: 'UH-2026-002', study: 'CT Chest', modality: 'CT Scan', room: 'CT Suite 1', status: 'completed', tech: 'Tech. Suresh' },
  { id: '3', time: '09:00', patient: 'Anita Desai', uhid: 'UH-2026-003', study: 'X-Ray Knee', modality: 'X-Ray', room: 'X-Ray Room 1', status: 'in-progress', tech: 'Tech. Ramesh' },
  { id: '4', time: '09:30', patient: 'Suresh Patel', uhid: 'UH-2026-004', study: 'USG Abdomen', modality: 'Ultrasound', room: 'US Room 1', status: 'booked', tech: 'Tech. Priya' },
  { id: '5', time: '10:00', patient: 'Meena Devi', uhid: 'UH-2026-005', study: 'CT Abdomen', modality: 'CT Scan', room: 'CT Suite 1', status: 'booked', tech: 'Tech. Suresh' },
  { id: '6', time: '10:30', patient: 'Vikram Singh', uhid: 'UH-2026-006', study: 'MRI Lumbar', modality: 'MRI', room: 'MRI Suite 1', status: 'booked', tech: 'Tech. Ramesh' },
];

const statusStyle: Record<string, string> = {
  available: 'bg-[#00C853]/10 text-[#00C853]',
  booked: 'bg-[#2196F3]/10 text-[#2196F3]',
  'in-progress': 'bg-[#FFB300]/10 text-[#FFB300]',
  completed: 'bg-white/5 text-[var(--c-text-tertiary)]',
};

export default function RisScheduler() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalityFilter, setModalityFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ time: '09:00', modality: 'MRI', room: 'MRI Suite 1', patient: '', uhid: '', study: '', tech: '' });

  const booked = DEMO_SLOTS.filter(s => s.status !== 'available').length;
  const completed = DEMO_SLOTS.filter(s => s.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--c-text)]">Appointment Scheduler</h1>
          <p className="text-sm text-[var(--c-text-secondary)] mt-0.5">Modality slot board with conflict detection</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="h-8 px-3 rounded-md bg-[#E53935] text-[var(--c-text)] text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--c-accent-hover)] transition-colors">
          <Plus className="h-3.5 w-3.5" />Book Slot
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-3">
          <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-[#2196F3]" /><span className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-wider">Date</span></div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm font-bold bg-transparent text-[var(--c-text)] border-none p-0 focus:outline-none mt-1" />
        </div>
        <div className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-3">
          <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[#FFB300]" /><span className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-wider">Booked</span></div>
          <p className="text-lg font-bold text-[var(--c-text)] mt-1">{booked}</p>
        </div>
        <div className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-3">
          <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#00C853]" /><span className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-wider">Completed</span></div>
          <p className="text-lg font-bold text-[var(--c-text)] mt-1">{completed}</p>
        </div>
        <div className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-3">
          <div className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-[var(--c-accent)]" /><span className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-wider">STAT/Urgent</span></div>
          <p className="text-lg font-bold text-[var(--c-text)] mt-1">1</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--c-text-tertiary)]" />
          <input placeholder="Search patient..." className="w-full h-9 pl-9 pr-3 rounded-lg bg-[var(--c-surface-raised)] border border-[var(--c-border)] text-[var(--c-text)] text-xs placeholder:text-[var(--c-text-tertiary)] focus:outline-none focus:border-[var(--c-accent)]/50" />
        </div>
        <select value={modalityFilter} onChange={e => setModalityFilter(e.target.value)}
          className="h-9 rounded-lg bg-[var(--c-surface-raised)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 focus:outline-none">
          <option value="All">All modalities</option>
          {Object.keys(MODALITY_ROOMS).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Booking Form */}
      {showForm && (
        <div className="bg-[var(--c-surface-raised)] rounded-xl border border-[#E53935]/20 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              className="h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 focus:outline-none">
              {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.modality} onChange={e => { const rooms = MODALITY_ROOMS[e.target.value] || ['Room 1']; setForm(f => ({ ...f, modality: e.target.value, room: rooms[0] })); }}
              className="h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 focus:outline-none">
              {Object.keys(MODALITY_ROOMS).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
              className="h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 focus:outline-none">
              {(MODALITY_ROOMS[form.modality] || []).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Patient name" value={form.patient} onChange={e => setForm(f => ({ ...f, patient: e.target.value }))}
              className="h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none" />
            <input placeholder="UHID" value={form.uhid} onChange={e => setForm(f => ({ ...f, uhid: e.target.value }))}
              className="h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none" />
            <input placeholder="Study/procedure" value={form.study} onChange={e => setForm(f => ({ ...f, study: e.target.value }))}
              className="h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="h-8 px-3 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text-secondary)] text-xs hover:bg-[var(--c-surface-hover)]">Cancel</button>
            <button className="h-8 px-4 rounded-lg bg-[#E53935] text-[var(--c-text)] text-xs font-semibold hover:bg-[var(--c-accent-hover)]">Book Slot</button>
          </div>
        </div>
      )}

      {/* Slot Timeline */}
      <div className="bg-[var(--c-surface-raised)] rounded-xl border border-[var(--c-border-light)] divide-y divide-white/5">
        {DEMO_SLOTS.filter(s => modalityFilter === 'All' || s.modality === modalityFilter).map(slot => (
          <div key={slot.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
            <div className="text-center w-14 shrink-0">
              <p className="text-sm font-bold text-[var(--c-text)]">{slot.time}</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-[var(--c-text)]">{slot.patient}</p>
                <span className="text-[9px] font-mono text-[var(--c-text-tertiary)]">{slot.uhid}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--c-text-secondary)]">{slot.modality}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--c-text-tertiary)]">{slot.room}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${statusStyle[slot.status]}`}>{slot.status}</span>
              </div>
              <p className="text-[10px] text-[var(--c-text-tertiary)] mt-0.5">{slot.study} · {slot.tech}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {slot.status === 'booked' && (
                <button className="h-7 px-2.5 rounded-md bg-[#FFB300]/10 text-[#FFB300] text-[10px] font-semibold flex items-center gap-1 hover:bg-[#FFB300]/20 transition-colors">
                  <Play className="h-3 w-3" />Start
                </button>
              )}
              {slot.status === 'in-progress' && (
                <button className="h-7 px-2.5 rounded-md bg-[#00C853]/10 text-[#00C853] text-[10px] font-semibold flex items-center gap-1 hover:bg-[#00C853]/20 transition-colors">
                  <CheckCircle className="h-3 w-3" />Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
