import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Eye, FileText, ArrowRight } from 'lucide-react';

const DEMO_PATIENTS = [
  { id: '1', uhid: 'UH-2026-001', fullName: 'Priya Sharma', age: 34, gender: 'Female', mobile: '9876543210', lastStudy: 'MRI Brain', lastDate: '2026-06-17' },
  { id: '2', uhid: 'UH-2026-002', fullName: 'Rajesh Kumar', age: 52, gender: 'Male', mobile: '9876543211', lastStudy: 'CT Chest', lastDate: '2026-06-17' },
  { id: '3', uhid: 'UH-2026-003', fullName: 'Anita Desai', age: 28, gender: 'Female', mobile: '9876543212', lastStudy: 'X-Ray Knee', lastDate: '2026-06-16' },
  { id: '4', uhid: 'UH-2026-004', fullName: 'Suresh Patel', age: 67, gender: 'Male', mobile: '9876543213', lastStudy: 'USG Abdomen', lastDate: '2026-06-16' },
  { id: '5', uhid: 'UH-2026-005', fullName: 'Meena Devi', age: 45, gender: 'Female', mobile: '9876543214', lastStudy: 'CT Abdomen', lastDate: '2026-06-15' },
  { id: '6', uhid: 'UH-2026-006', fullName: 'Vikram Singh', age: 39, gender: 'Male', mobile: '9876543215', lastStudy: 'MRI Lumbar Spine', lastDate: '2026-06-15' },
];

export default function RisPatientSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(DEMO_PATIENTS);
  const [selected, setSelected] = useState<typeof DEMO_PATIENTS[0] | null>(null);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults(DEMO_PATIENTS); return; }
    const lower = q.toLowerCase();
    setResults(DEMO_PATIENTS.filter(p =>
      p.fullName.toLowerCase().includes(lower) ||
      p.uhid.toLowerCase().includes(lower) ||
      p.mobile.includes(q)
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--c-text)]">Patient Search</h1>
          <p className="text-sm text-[var(--c-text-secondary)] mt-0.5">Search by UHID, mobile, or patient name</p>
        </div>
        <button onClick={() => navigate('/patients/new')} className="h-8 px-3 rounded-md c-btn-primary">
          <UserPlus className="h-3.5 w-3.5" />New Patient
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--c-text-tertiary)]" />
        <input
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Type UHID, name, or mobile..."
          className="w-full h-12 pl-11 pr-4 rounded-xl bg-[var(--c-surface-raised)] border border-[var(--c-border)] text-[var(--c-text)] text-sm placeholder:text-[var(--c-text-tertiary)] focus:outline-none focus:border-[var(--c-accent)]/50 transition-colors"
        />
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map(p => (
          <div
            key={p.id}
            onClick={() => setSelected(p)}
            className="bg-[var(--c-surface-raised)] rounded-xl border border-[var(--c-border-light)] p-4 cursor-pointer hover:border-[var(--c-border-hover)] hover:bg-[var(--c-surface-hover)] transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-[var(--c-accent-bg)] flex items-center justify-center text-[var(--c-accent)] text-sm font-bold shrink-0">
                {p.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--c-text)] truncate">{p.fullName}</p>
                <p className="text-[10px] text-[var(--c-text-tertiary)] font-mono">{p.uhid}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[var(--c-text-secondary)]">{p.age}y {p.gender}</span>
                  <span className="text-[10px] text-[var(--c-text-placeholder)]">·</span>
                  <span className="text-[10px] text-[var(--c-text-secondary)]">{p.mobile}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--c-surface-hover)] text-[var(--c-text-secondary)]">{p.lastStudy}</span>
                  <span className="text-[10px] text-[var(--c-text-placeholder)]">{p.lastDate}</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--c-text-placeholder)] group-hover:text-[var(--c-text-tertiary)] transition-colors shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--c-text-tertiary)]">No patients found matching &quot;{query}&quot;</p>
          <button onClick={() => navigate('/patients/new')} className="mt-3 text-xs text-[var(--c-accent)] hover:underline">Register new patient</button>
        </div>
      )}

      {/* Patient Detail Slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-[var(--c-overlay)] backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-[var(--c-surface)] border-l border-[var(--c-border)] p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--c-text)]">Patient Details</h2>
              <button onClick={() => setSelected(null)} className="text-[var(--c-text-secondary)] hover:text-[var(--c-text)] text-lg">×</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-[var(--c-accent-bg)] flex items-center justify-center text-[var(--c-accent)] text-lg font-bold">
                  {selected.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-base font-bold text-[var(--c-text)]">{selected.fullName}</p>
                  <p className="text-xs text-[var(--c-text-tertiary)] font-mono">{selected.uhid}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Age', `${selected.age} years`],
                  ['Gender', selected.gender],
                  ['Mobile', selected.mobile],
                  ['Last Study', selected.lastStudy],
                  ['Last Visit', selected.lastDate],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[var(--c-surface-raised)] rounded-lg p-3">
                    <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-wider">{k}</p>
                    <p className="text-xs text-[var(--c-text)] font-medium mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelected(null); navigate('/orders'); }} className="flex-1 c-btn-primary justify-center">
                  <FileText className="h-3.5 w-3.5" />New Order
                </button>
                <button onClick={() => { setSelected(null); navigate('/history'); }} className="flex-1 h-9 rounded-md bg-[var(--c-surface-raised)] border border-[var(--c-border)] text-[var(--c-text-secondary)] text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[var(--c-surface-hover)]">
                  <Eye className="h-3.5 w-3.5" />History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
