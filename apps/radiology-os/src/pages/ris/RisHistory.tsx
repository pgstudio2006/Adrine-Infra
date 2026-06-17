import { useState, useMemo } from 'react';
import { Search, Eye, Download, FileText, Calendar, TrendingUp } from 'lucide-react';

const DEMO_HISTORY = [
  { id: '1', patient: 'Priya Sharma', uhid: 'UH-2026-001', studies: [
    { date: '2026-06-17', study: 'MRI Brain', modality: 'MRI', status: 'completed', orderId: 'ORD-2026-0888', reportStatus: 'finalized' },
    { date: '2026-05-20', study: 'X-Ray Chest', modality: 'X-Ray', status: 'completed', orderId: 'ORD-2026-0712', reportStatus: 'finalized' },
  ]},
  { id: '2', patient: 'Rajesh Kumar', uhid: 'UH-2026-002', studies: [
    { date: '2026-06-17', study: 'CT Chest with Contrast', modality: 'CT Scan', status: 'completed', orderId: 'ORD-2026-0889', reportStatus: 'finalized' },
    { date: '2026-04-10', study: 'CT Abdomen', modality: 'CT Scan', status: 'completed', orderId: 'ORD-2026-0445', reportStatus: 'finalized' },
    { date: '2026-01-15', study: 'X-Ray Knee', modality: 'X-Ray', status: 'completed', orderId: 'ORD-2026-0198', reportStatus: 'finalized' },
  ]},
  { id: '3', patient: 'Anita Desai', uhid: 'UH-2026-003', studies: [
    { date: '2026-06-16', study: 'X-Ray Knee', modality: 'X-Ray', status: 'completed', orderId: 'ORD-2026-0890', reportStatus: 'finalized' },
  ]},
  { id: '4', patient: 'Meena Devi', uhid: 'UH-2026-005', studies: [
    { date: '2026-06-17', study: 'CT Abdomen with Contrast', modality: 'CT Scan', status: 'in_progress', orderId: 'ORD-2026-0891', reportStatus: 'pending' },
    { date: '2026-05-01', study: 'USG Abdomen', modality: 'Ultrasound', status: 'completed', orderId: 'ORD-2026-0589', reportStatus: 'finalized' },
  ]},
];

export default function RisHistory() {
  const [search, setSearch] = useState('');
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return DEMO_HISTORY;
    const q = search.toLowerCase();
    return DEMO_HISTORY.filter(p => p.patient.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Investigation History</h1>
        <p className="text-sm text-white/40 mt-0.5">Patient timeline — all studies, reports, and billing</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient name or UHID..."
          className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#151922] border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#E53935]/50" />
      </div>

      <div className="space-y-3">
        {filtered.map(p => {
          const isExpanded = expandedPatient === p.id;
          return (
            <div key={p.id} className="bg-[#151922] rounded-xl border border-white/5 overflow-hidden">
              <div onClick={() => setExpandedPatient(isExpanded ? null : p.id)}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <div className="h-9 w-9 rounded-full bg-[#E53935]/10 flex items-center justify-center text-[#E53935] text-[10px] font-bold shrink-0">
                  {p.patient.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{p.patient}</p>
                  <p className="text-[10px] text-white/30 font-mono">{p.uhid}</p>
                </div>
                <span className="text-[10px] text-white/30">{p.studies.length} studies</span>
                <TrendingUp className={`h-4 w-4 text-white/20 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
              {isExpanded && (
                <div className="border-t border-white/5 p-4 space-y-2">
                  {p.studies.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: s.modality === 'MRI' ? '#6366f115' : s.modality === 'CT Scan' ? '#E5393515' : s.modality === 'X-Ray' ? '#00C85315' : '#FFB30015', color: s.modality === 'MRI' ? '#6366f1' : s.modality === 'CT Scan' ? '#E53935' : s.modality === 'X-Ray' ? '#00C853' : '#FFB300' }}>
                        {s.modality.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">{s.study}</p>
                        <p className="text-[10px] text-white/30">{s.date} · {s.orderId}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        s.reportStatus === 'finalized' ? 'bg-[#00C853]/10 text-[#00C853]' : 'bg-[#FFB300]/10 text-[#FFB300]'
                      }`}>{s.reportStatus}</span>
                      <div className="flex gap-1 shrink-0">
                        <button className="h-6 px-2 rounded bg-white/5 text-white/30 text-[9px] flex items-center gap-1 hover:bg-white/10 hover:text-white/50"><Eye className="h-2.5 w-2.5" />View</button>
                        {s.reportStatus === 'finalized' && <button className="h-6 px-2 rounded bg-white/5 text-white/30 text-[9px] flex items-center gap-1 hover:bg-white/10 hover:text-white/50"><Download className="h-2.5 w-2.5" />PDF</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
