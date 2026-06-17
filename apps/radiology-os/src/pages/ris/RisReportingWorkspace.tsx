import { useState } from 'react';
import { FileText, Save, Send, Eye, CheckCircle, ChevronDown, ChevronUp, Lock, AlertTriangle } from 'lucide-react';

const DEMO_REPORT = {
  patient: 'Meena Devi', uhid: 'UH-2026-005', age: 45, gender: 'Female',
  study: 'CT Abdomen with Contrast', modality: 'CT Scan', orderedBy: 'Dr. Sharma',
  clinicalHistory: 'Chronic abdominal pain, weight loss. Rule out malignancy.',
  previousReports: 'USG Abdomen (May 2026): Hepatomegaly noted.',
};

const TEMPLATE_SECTIONS = [
  { key: 'technique', label: 'Technique', content: 'CT abdomen was performed with IV and oral contrast. Axial, coronal and sagittal reconstructions were reviewed.' },
  { key: 'findings', label: 'Findings', content: '' },
  { key: 'impression', label: 'Impression', content: '' },
  { key: 'recommendation', label: 'Recommendation', content: '' },
];

export default function RisReportingWorkspace() {
  const [sections, setSections] = useState(TEMPLATE_SECTIONS);
  const [radiologist, setRadiologist] = useState('Dr. Iyer');
  const [isCritical, setIsCritical] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rightPanel, setRightPanel] = useState<'templates' | 'previous' | 'ai'>('templates');

  const updateSection = (idx: number, content: string) => {
    setSections(s => s.map((sec, i) => i === idx ? { ...sec, content } : sec));
  };

  return (
    <div className="space-y-0 -m-6 min-h-screen bg-[#0A0C10]">
      {/* Reporting Header */}
      <div className="sticky top-0 z-40 bg-[#0F1115] border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-4 w-4 text-[#E53935]" />
          <div>
            <p className="text-sm font-semibold text-white">{DEMO_REPORT.patient} <span className="text-white/30 font-mono text-xs ml-1">{DEMO_REPORT.uhid}</span></p>
            <p className="text-[10px] text-white/30">{DEMO_REPORT.study} · {DEMO_REPORT.modality}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/30">Auto-save: ON</span>
          <button className="h-7 px-2.5 rounded-md bg-white/5 text-white/50 text-[10px] font-medium flex items-center gap-1 hover:bg-white/10"><Save className="h-3 w-3" />Save Draft</button>
          <button className="h-7 px-2.5 rounded-md bg-[#E53935] text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-[#d32f2f]"><Send className="h-3 w-3" />Finalize</button>
        </div>
      </div>

      {/* Three-Column Layout */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* LEFT: Patient Summary */}
        <div className="w-64 border-r border-white/5 p-4 overflow-y-auto shrink-0">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-3">Patient Summary</p>
          <div className="space-y-3">
            {[
              ['Patient', DEMO_REPORT.patient],
              ['UHID', DEMO_REPORT.uhid],
              ['Age/Gender', `${DEMO_REPORT.age}y ${DEMO_REPORT.gender}`],
              ['Study', DEMO_REPORT.study],
              ['Ordered by', DEMO_REPORT.orderedBy],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[9px] text-white/20 uppercase tracking-wider">{k}</p>
                <p className="text-xs text-white/70">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Clinical History</p>
            <p className="text-[10px] text-white/40 leading-relaxed">{DEMO_REPORT.clinicalHistory}</p>
          </div>
          <div className="mt-4">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Previous Reports</p>
            <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
              <p className="text-[9px] text-white/30">{DEMO_REPORT.previousReports}</p>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">Radiologist</label>
            <input value={radiologist} onChange={e => setRadiologist(e.target.value)}
              className="w-full h-8 rounded-lg bg-[#151922] border border-white/10 text-white text-xs px-3 focus:outline-none focus:border-[#E53935]/50" />
          </div>
          <label className="flex items-center gap-2 text-[10px] text-white/40 mt-3">
            <input type="checkbox" checked={isCritical} onChange={e => setIsCritical(e.target.checked)} className="rounded" />
            Mark as critical finding
          </label>
        </div>

        {/* CENTER: Report Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            {sections.map((sec, idx) => (
              <div key={sec.key}>
                <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2 block">{sec.label}</label>
                <textarea value={sec.content} onChange={e => updateSection(idx, e.target.value)} rows={sec.key === 'findings' ? 8 : sec.key === 'recommendation' ? 3 : 4}
                  placeholder={`Enter ${sec.label.toLowerCase()}...`}
                  className="w-full rounded-lg bg-[#151922] border border-white/10 text-white text-sm px-4 py-3 placeholder:text-white/15 focus:outline-none focus:border-[#E53935]/50 resize-none leading-relaxed" />
              </div>
            ))}
            {isCritical && (
              <div className="p-3 rounded-lg bg-[#E53935]/5 border border-[#E53935]/20 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#E53935] shrink-0" />
                <p className="text-[10px] text-[#E53935]">Critical finding — verbal communication required per ACR guidelines</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Templates / Previous / AI */}
        <div className="w-72 border-l border-white/5 overflow-y-auto shrink-0">
          <div className="flex border-b border-white/5">
            {(['templates', 'previous', 'ai'] as const).map(tab => (
              <button key={tab} onClick={() => setRightPanel(tab)}
                className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${rightPanel === tab ? 'text-[#E53935] border-b-2 border-[#E53935]' : 'text-white/30 hover:text-white/50'}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="p-3 space-y-2">
            {rightPanel === 'templates' && (
              <>
                {['CT Abdomen — Normal', 'CT Abdomen — Mass Lesion', 'CT Chest — PE Protocol', 'CT Brain — Stroke'].map(t => (
                  <button key={t} onClick={() => { updateSection(0, 'CT abdomen was performed with IV and oral contrast.'); updateSection(1, 'Findings based on template...'); }}
                    className="w-full text-left p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors">
                    <p className="text-[10px] text-white/60 font-medium">{t}</p>
                  </button>
                ))}
              </>
            )}
            {rightPanel === 'previous' && (
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <p className="text-[10px] text-white/30">No previous reports found for this patient.</p>
              </div>
            )}
            {rightPanel === 'ai' && (
              <div className="space-y-2">
                <button className="w-full text-left p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]">
                  <p className="text-[10px] text-[#6366f1] font-semibold">Generate Summary</p>
                  <p className="text-[9px] text-white/30">AI-generated clinical summary</p>
                </button>
                <button className="w-full text-left p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]">
                  <p className="text-[10px] text-[#6366f1] font-semibold">Suggest Impression</p>
                  <p className="text-[9px] text-white/30">Based on findings text</p>
                </button>
                <button className="w-full text-left p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]">
                  <p className="text-[10px] text-[#6366f1] font-semibold">Compare Previous</p>
                  <p className="text-[9px] text-white/30">Diff with prior studies</p>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
