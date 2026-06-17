import { useState } from 'react';
import { ExternalLink, RefreshCw, Link2, Image, Monitor, CheckCircle } from 'lucide-react';

const DEMO_STUDIES = [
  { id: '1', patient: 'Priya Sharma', uhid: 'UH-2026-001', study: 'MRI Brain', modality: 'MRI', seriesCount: 12, imageCount: 384, studyUid: '1.2.840.113619.2.55.3.604', linked: true },
  { id: '2', patient: 'Rajesh Kumar', uhid: 'UH-2026-002', study: 'CT Chest', modality: 'CT Scan', seriesCount: 8, imageCount: 512, studyUid: '1.2.840.113619.2.55.3.605', linked: true },
  { id: '3', patient: 'Kavita Joshi', uhid: 'UH-2026-007', study: 'CT Chest', modality: 'CT Scan', seriesCount: 0, imageCount: 0, studyUid: '', linked: false },
];

export default function RisPacsViewer() {
  const [selected, setSelected] = useState<typeof DEMO_STUDIES[0] | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">PACS Integration</h1>
          <p className="text-sm text-white/40 mt-0.5">Connect RIS with PACS — view and link studies</p>
        </div>
        <button className="h-8 px-3 rounded-md bg-[#151922] border border-white/10 text-white/70 text-xs font-medium flex items-center gap-1.5 hover:bg-[#1a1f2e] transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DEMO_STUDIES.map(s => (
          <div key={s.id} onClick={() => setSelected(s)}
            className={`bg-[#151922] rounded-xl border p-4 cursor-pointer hover:border-white/15 transition-all ${s.linked ? 'border-[#00C853]/20' : 'border-white/5'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-white/30" />
              </div>
              {s.linked ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00C853]/10 text-[#00C853] font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />Linked
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E53935]/10 text-[#E53935] font-semibold">Not Linked</span>
              )}
            </div>
            <p className="text-xs font-semibold text-white">{s.patient}</p>
            <p className="text-[10px] text-white/30 font-mono">{s.uhid}</p>
            <p className="text-xs text-white/50 mt-1">{s.study}</p>
            {s.linked && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] text-white/30">{s.seriesCount} series</span>
                <span className="text-[10px] text-white/30">{s.imageCount} images</span>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button className="flex-1 h-7 rounded-md bg-[#E53935] text-white text-[10px] font-semibold flex items-center justify-center gap-1 hover:bg-[#d32f2f] transition-colors">
                <ExternalLink className="h-3 w-3" />Open PACS
              </button>
              {!s.linked && (
                <button className="h-7 px-2.5 rounded-md bg-white/5 text-white/40 text-[10px] font-medium flex items-center gap-1 hover:bg-white/10 transition-colors">
                  <Link2 className="h-3 w-3" />Link
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/80" />
          <div className="relative bg-[#0F1115] rounded-xl border border-white/10 w-[90vw] h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-white">{selected.patient}</p>
                <span className="text-[10px] font-mono text-white/30">{selected.uhid}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{selected.study}</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-7 px-2.5 rounded-md bg-[#E53935] text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-[#d32f2f]">
                  <ExternalLink className="h-3 w-3" />Open Full Viewer
                </button>
                <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white text-lg ml-2">×</button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center bg-black/50">
              <div className="text-center space-y-3">
                <Image className="h-16 w-16 text-white/10 mx-auto" />
                <p className="text-sm text-white/30">DICOM Viewer Placeholder</p>
                <p className="text-[10px] text-white/20">Connect PACS server to view images</p>
                {selected.linked && (
                  <p className="text-[10px] text-white/30">Study UID: <span className="font-mono">{selected.studyUid}</span></p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
