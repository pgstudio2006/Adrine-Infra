import { useState } from 'react';
import { Lock, CheckCircle, AlertTriangle, FileText, Clock } from 'lucide-react';

const DEMO = {
  patient: 'Meena Devi', uhid: 'UH-2026-005', study: 'CT Abdomen with Contrast', modality: 'CT Scan',
  radiologist: 'Dr. Iyer', orderId: 'ORD-2026-0891',
};

export default function RisReportFinalization() {
  const [isLocked, setIsLocked] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Report Finalization</h1>
        <p className="text-sm text-white/40 mt-0.5">Review, sign, lock, and dispatch finalized reports</p>
      </div>

      <div className="bg-[#151922] rounded-xl border border-white/5 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0F1115] rounded-lg p-3"><p className="text-[9px] text-white/30 uppercase">Patient</p><p className="text-white font-medium">{DEMO.patient}</p></div>
          <div className="bg-[#0F1115] rounded-lg p-3"><p className="text-[9px] text-white/30 uppercase">UHID</p><p className="text-white font-medium font-mono">{DEMO.uhid}</p></div>
          <div className="bg-[#0F1115] rounded-lg p-3"><p className="text-[9px] text-white/30 uppercase">Study</p><p className="text-white font-medium">{DEMO.study}</p></div>
          <div className="bg-[#0F1115] rounded-lg p-3"><p className="text-[9px] text-white/30 uppercase">Order</p><p className="text-white font-medium font-mono">{DEMO.orderId}</p></div>
        </div>

        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Report Summary</p>
          <div className="bg-[#0F1115] rounded-lg p-4 space-y-2 text-xs text-white/60">
            <p><span className="text-white/30 font-semibold">Findings:</span> Multiple diverta noted in the descending colon. No pneumoperitoneum. Liver, spleen, kidneys normal. No free fluid.</p>
            <p><span className="text-white/30 font-semibold">Impression:</span> Diverticulosis of descending colon. No acute pathology.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input type="checkbox" checked={isCritical} onChange={e => setIsCritical(e.target.checked)} className="rounded" />
            Critical finding
          </label>
          {isCritical && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#E53935]">
              <AlertTriangle className="h-3 w-3" />Verbal communication required
            </div>
          )}
        </div>

        <div className="bg-[#0F1115] rounded-lg p-4 space-y-2">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Digital Signature</p>
          <p className="text-xs text-white">{DEMO.radiologist}</p>
          <p className="text-[10px] text-white/30">By finalizing, you attest that this report is accurate and complete.</p>
        </div>

        <div className="flex gap-2">
          {!isLocked ? (
            <button onClick={() => setIsLocked(true)} className="flex-1 h-10 rounded-lg bg-[#E53935] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#d32f2f] transition-colors">
              <Lock className="h-4 w-4" />Finalize & Lock Report
            </button>
          ) : (
            <div className="flex-1 h-10 rounded-lg bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] text-xs font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle className="h-4 w-4" />Report Finalized & Locked
            </div>
          )}
        </div>

        {isLocked && (
          <div className="flex gap-2">
            <button className="flex-1 h-9 rounded-lg bg-[#00C853] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#00b848] transition-colors">
              Dispatch via WhatsApp
            </button>
            <button className="flex-1 h-9 rounded-lg bg-[#151922] border border-white/10 text-white/60 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#1a1f2e]">
              Download PDF
            </button>
          </div>
        )}
      </div>

      {/* Version History */}
      <div className="bg-[#151922] rounded-xl border border-white/5 p-5 space-y-3">
        <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Version History</p>
        <div className="space-y-2">
          {[{ v: 'v1.0', action: 'Draft created', by: 'Dr. Iyer', time: '10:30 AM' }, { v: 'v1.1', action: 'Findings updated', by: 'Dr. Iyer', time: '10:40 AM' }, { v: 'v1.2', action: 'Finalized & locked', by: 'Dr. Iyer', time: '10:45 AM' }].map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${i === 2 ? 'bg-[#00C853]' : 'bg-white/20'}`} />
              <span className="text-[10px] text-white/40 w-8 font-mono">{h.v}</span>
              <span className="text-[10px] text-white/50 flex-1">{h.action}</span>
              <span className="text-[10px] text-white/30">{h.by}</span>
              <span className="text-[10px] text-white/20">{h.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
