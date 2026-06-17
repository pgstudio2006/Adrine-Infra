import { useState } from 'react';
import { Eye, Download, Send, Printer, CheckCircle, Lock, FileText } from 'lucide-react';

const DEMO_REPORT = {
  orderId: 'ORD-2026-0890', patient: 'Priya Sharma', uhid: 'UH-2026-001', age: 34, gender: 'Female',
  study: 'MRI Brain', modality: 'MRI', radiologist: 'Dr. Iyer', signedAt: '2026-06-17 10:45 AM',
  technique: 'Multiplanar multisequence MRI of the brain without IV contrast.',
  clinicalHistory: 'Recurrent headaches, 3 months duration.',
  findings: 'Brain Parenchyma: Normal gray-white matter differentiation. No focal signal abnormality, mass effect, or midline shift.\nVentricles: Normal size and configuration.\nVascular: Patent flow voids of major intracranial vessels.\nPituitary: Normal size and signal.\nCP Angle: Unremarkable.\nOrbits: Normal.',
  impression: 'Normal MRI of the brain.',
  recommendation: 'No further imaging recommended. Clinical correlation.',
  status: 'finalized',
};

export default function RisReportPreview() {
  const [dispatched, setDispatched] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Report Preview</h1>
          <p className="text-sm text-white/40 mt-0.5">Final report with hospital branding, radiologist signature, and dispatch options</p>
        </div>
        <div className="flex gap-2">
          <button className="h-8 px-3 rounded-md bg-[#151922] border border-white/10 text-white/70 text-xs font-medium flex items-center gap-1.5 hover:bg-[#1a1f2e] transition-colors">
            <Printer className="h-3.5 w-3.5" />Print
          </button>
          <button className="h-8 px-3 rounded-md bg-[#151922] border border-white/10 text-white/70 text-xs font-medium flex items-center gap-1.5 hover:bg-[#1a1f2e] transition-colors">
            <Download className="h-3.5 w-3.5" />Download PDF
          </button>
          <button onClick={() => setDispatched(true)} className="h-8 px-3 rounded-md bg-[#00C853] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#00b848] transition-colors">
            <Send className="h-3.5 w-3.5" />Send via WhatsApp
          </button>
        </div>
      </div>

      {dispatched && (
        <div className="p-3 rounded-lg bg-[#00C853]/5 border border-[#00C853]/20 text-[#00C853] text-xs font-medium flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />Report dispatched via WhatsApp to {DEMO_REPORT.patient}
        </div>
      )}

      {/* Report Card */}
      <div className="bg-[#151922] rounded-xl border border-white/5 max-w-3xl mx-auto">
        {/* Header */}
        <div className="border-b border-white/5 p-6 text-center">
          <p className="text-sm font-bold text-white tracking-wide">ADRINE HOSPITAL</p>
          <p className="text-[10px] text-white/30 mt-0.5">Department of Radiology & Imaging</p>
          <div className="h-px bg-white/10 my-3" />
          <p className="text-lg font-bold text-white">RADIOLOGY REPORT</p>
        </div>

        {/* Patient Info */}
        <div className="p-6 border-b border-white/5">
          <div className="grid grid-cols-3 gap-3 text-xs">
            {[
              ['Patient Name', DEMO_REPORT.patient],
              ['UHID', DEMO_REPORT.uhid],
              ['Age/Gender', `${DEMO_REPORT.age} years / ${DEMO_REPORT.gender}`],
              ['Study', DEMO_REPORT.study],
              ['Modality', DEMO_REPORT.modality],
              ['Order ID', DEMO_REPORT.orderId],
              ['Date', 'June 17, 2026'],
              ['Clinical History', DEMO_REPORT.clinicalHistory],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="text-white/30">{k}:</span>
                <span className="text-white ml-1">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Report Body */}
        <div className="p-6 space-y-4">
          {[
            ['Technique', DEMO_REPORT.technique],
            ['Findings', DEMO_REPORT.findings],
            ['Impression', DEMO_REPORT.impression],
            ['Recommendation', DEMO_REPORT.recommendation],
          ].map(([label, content]) => (
            <div key={label}>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1">{label}</p>
              <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{content}</p>
            </div>
          ))}
        </div>

        {/* Signature */}
        <div className="p-6 border-t border-white/5 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Digital Signature</p>
            <p className="text-xs text-white font-semibold mt-1">{DEMO_REPORT.radiologist}</p>
            <p className="text-[10px] text-white/30">Signed: {DEMO_REPORT.signedAt}</p>
          </div>
          <div className="text-right">
            <span className="text-[9px] px-2 py-1 rounded bg-[#00C853]/10 text-[#00C853] font-semibold flex items-center gap-1">
              <Lock className="h-3 w-3" />Finalized & Locked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
