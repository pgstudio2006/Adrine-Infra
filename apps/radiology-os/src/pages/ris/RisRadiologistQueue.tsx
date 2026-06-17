import { useState } from 'react';
import { FileText, Eye, AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react';

const DEMO_QUEUE = [
  { id: '1', patient: 'Anita Desai', uhid: 'UH-2026-003', study: 'X-Ray Knee', modality: 'X-Ray', priority: 'Routine', status: 'imaging_complete', tech: 'Tech. Ramesh', orderedAt: '09:00' },
  { id: '2', patient: 'Suresh Patel', uhid: 'UH-2026-004', study: 'USG Abdomen', modality: 'Ultrasound', priority: 'Routine', status: 'imaging_complete', tech: 'Tech. Priya', orderedAt: '09:30' },
  { id: '3', patient: 'Meena Devi', uhid: 'UH-2026-005', study: 'CT Abdomen with Contrast', modality: 'CT Scan', priority: 'Urgent', status: 'awaiting_report', tech: 'Tech. Suresh', orderedAt: '10:00' },
  { id: '4', patient: 'Vikram Singh', uhid: 'UH-2026-006', study: 'MRI Lumbar Spine', modality: 'MRI', priority: 'Routine', status: 'awaiting_report', tech: 'Tech. Ramesh', orderedAt: '10:30' },
  { id: '5', patient: 'Kavita Joshi', uhid: 'UH-2026-007', study: 'CT Chest', modality: 'CT Scan', priority: 'STAT', status: 'awaiting_report', tech: 'Tech. Suresh', orderedAt: '11:00' },
];

const statusStyle: Record<string, { bg: string; text: string; label: string }> = {
  imaging_complete: { bg: 'bg-[#6366f1]/10', text: 'text-[#6366f1]', label: 'Scan Complete' },
  awaiting_report: { bg: 'bg-[#FFB300]/10', text: 'text-[#FFB300]', label: 'Awaiting Report' },
  report_in_progress: { bg: 'bg-[#E53935]/10', text: 'text-[#E53935]', label: 'Reporting' },
};

const priorityStyle: Record<string, string> = {
  Routine: 'bg-white/5 text-white/40',
  Urgent: 'bg-[#FFB300]/10 text-[#FFB300]',
  STAT: 'bg-[#E53935]/10 text-[#E53935]',
};

export default function RisRadiologistQueue() {
  const [selected, setSelected] = useState<typeof DEMO_QUEUE[0] | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Radiologist Queue</h1>
        <p className="text-sm text-white/40 mt-0.5">Studies awaiting reporting — sorted by priority</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#151922] rounded-lg border border-white/5 p-3">
          <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[#FFB300]" /><span className="text-[10px] text-white/30 uppercase">Awaiting</span></div>
          <p className="text-lg font-bold text-white mt-1">{DEMO_QUEUE.length}</p>
        </div>
        <div className="bg-[#151922] rounded-lg border border-white/5 p-3">
          <div className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-[#E53935]" /><span className="text-[10px] text-white/30 uppercase">STAT</span></div>
          <p className="text-lg font-bold text-[#E53935] mt-1">{DEMO_QUEUE.filter(q => q.priority === 'STAT').length}</p>
        </div>
        <div className="bg-[#151922] rounded-lg border border-white/5 p-3">
          <div className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 text-[#00C853]" /><span className="text-[10px] text-white/30 uppercase">Reported Today</span></div>
          <p className="text-lg font-bold text-white mt-1">12</p>
        </div>
      </div>

      <div className="bg-[#151922] rounded-xl border border-white/5 divide-y divide-white/5">
        {DEMO_QUEUE.map(q => (
          <div key={q.id} onClick={() => setSelected(q)} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ backgroundColor: q.modality === 'MRI' ? '#6366f115' : q.modality === 'CT Scan' ? '#E5393515' : q.modality === 'X-Ray' ? '#00C85315' : '#FFB30015', color: q.modality === 'MRI' ? '#6366f1' : q.modality === 'CT Scan' ? '#E53935' : q.modality === 'X-Ray' ? '#00C853' : '#FFB300' }}>
              {q.modality.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-white">{q.patient}</p>
                <span className="text-[9px] font-mono text-white/30">{q.uhid}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${priorityStyle[q.priority]}`}>{q.priority}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${statusStyle[q.status]?.bg} ${statusStyle[q.status]?.text}`}>{statusStyle[q.status]?.label}</span>
              </div>
              <p className="text-[10px] text-white/40 mt-0.5">{q.study} · Ordered: {q.orderedAt} · Tech: {q.tech}</p>
            </div>
            <button className="h-7 px-3 rounded-md bg-[#E53935] text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-[#d32f2f] transition-colors shrink-0">
              <FileText className="h-3 w-3" />Report
            </button>
            <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-white/30 transition-colors shrink-0" />
          </div>
        ))}
      </div>

      {/* Quick Report Slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-[#0F1115] border-l border-white/10 p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Report — {selected.patient}</h2>
              <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white text-lg">×</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#151922] rounded-lg p-3"><p className="text-[9px] text-white/30 uppercase">Study</p><p className="text-xs text-white font-medium">{selected.study}</p></div>
                <div className="bg-[#151922] rounded-lg p-3"><p className="text-[9px] text-white/30 uppercase">Modality</p><p className="text-xs text-white font-medium">{selected.modality}</p></div>
              </div>
              <div><label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Findings</label><textarea rows={4} className="w-full rounded-lg bg-[#151922] border border-white/10 text-white text-xs px-3 py-2 placeholder:text-white/20 focus:outline-none focus:border-[#E53935]/50 resize-none" placeholder="Describe imaging findings..." /></div>
              <div><label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Impression</label><textarea rows={3} className="w-full rounded-lg bg-[#151922] border border-white/10 text-white text-xs px-3 py-2 placeholder:text-white/20 focus:outline-none focus:border-[#E53935]/50 resize-none" placeholder="Final impression..." /></div>
              <div><label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Recommendation</label><textarea rows={2} className="w-full rounded-lg bg-[#151922] border border-white/10 text-white text-xs px-3 py-2 placeholder:text-white/20 focus:outline-none focus:border-[#E53935]/50 resize-none" placeholder="Follow-up recommendation..." /></div>
              <label className="flex items-center gap-2 text-xs text-white/60"><input type="checkbox" className="rounded" />Mark as critical finding</label>
              <div className="flex gap-2 pt-2">
                <button className="flex-1 h-9 rounded-lg bg-[#151922] border border-white/10 text-white/60 text-xs font-medium hover:bg-[#1a1f2e]">Save Draft</button>
                <button className="flex-1 h-9 rounded-lg bg-[#E53935] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#d32f2f]">Finalize Report</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
