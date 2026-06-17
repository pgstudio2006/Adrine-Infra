import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

const MODALITIES = ['MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Mammography', 'Fluoroscopy', 'PET Scan'];
const PRIORITIES = ['Routine', 'Urgent', 'STAT'];
const BODY_PARTS: Record<string, string[]> = {
  MRI: ['Brain', 'Cervical Spine', 'Lumbar Spine', 'Knee', 'Shoulder', 'Hip', 'Whole Body', 'Abdomen', 'Pelvis'],
  'CT Scan': ['Head', 'Chest', 'Abdomen', 'Pelvis', 'Spine', 'Neck', 'Whole Body', 'Angiography'],
  'X-Ray': ['Chest', 'Spine', 'Pelvis', 'Knee', 'Shoulder', 'Wrist', 'Ankle', 'Hip', 'Abdomen', 'Extremity'],
  Ultrasound: ['Abdomen', 'Pelvis', 'Obstetric', 'Thyroid', 'Breast', 'Scrotum', 'Doppler', 'MSK'],
  Mammography: ['Bilateral', 'Unilateral', 'Tomosynthesis'],
};

export default function RisOrderCreation() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    patientSearch: '', patientName: '', uhid: '', modality: '', study: '', bodyPart: '',
    priority: 'Routine', clinicalHistory: '', referringDoctor: '', amount: '',
  });
  const [saved, setSaved] = useState(false);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const selectedParts = BODY_PARTS[form.modality] || [];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => navigate('/worklist'), 1200);
  };

  if (saved) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-full bg-[#00C853]/10 flex items-center justify-center mx-auto">
            <Save className="h-8 w-8 text-[#00C853]" />
          </div>
          <p className="text-lg font-bold text-[var(--c-text)]">Order Created</p>
          <p className="text-xs text-[var(--c-text-secondary)]">Added to worklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-lg bg-[var(--c-surface-raised)] border border-[var(--c-border)] flex items-center justify-center hover:bg-[var(--c-surface-hover)]">
          <ArrowLeft className="h-4 w-4 text-[var(--c-text)]/50" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--c-text)]">New Radiology Order</h1>
          <p className="text-sm text-[var(--c-text-secondary)] mt-0.5">Create imaging investigation request</p>
        </div>
      </div>

      <div className="bg-[var(--c-surface-raised)] rounded-xl border border-[var(--c-border-light)] p-6 space-y-5">
        {/* Patient */}
        <div>
          <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Patient</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Search Patient (UHID / Name)</label>
              <input value={form.patientSearch} onChange={e => set('patientSearch', e.target.value)}
                className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">UHID</label>
              <input value={form.uhid} onChange={e => set('uhid', e.target.value)} placeholder="Auto-fill"
                className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50" />
            </div>
          </div>
        </div>

        {/* Investigation Type */}
        <div>
          <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Investigation Type</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Modality <span className="text-[var(--c-accent)]">*</span></label>
              <select value={form.modality} onChange={e => { set('modality', e.target.value); set('bodyPart', ''); }}
                className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 focus:outline-none focus:border-[var(--c-accent)]/50">
                <option value="">Select modality</option>
                {MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Investigation</label>
              <input value={form.study} onChange={e => set('study', e.target.value)} placeholder="e.g. Brain with Contrast"
                className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50" />
            </div>
            <div>
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Body Part</label>
              <select value={form.bodyPart} onChange={e => set('bodyPart', e.target.value)}
                className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 focus:outline-none focus:border-[var(--c-accent)]/50">
                <option value="">Select</option>
                {selectedParts.map(bp => <option key={bp} value={bp}>{bp}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => set('priority', p)}
                    className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
                      form.priority === p
                        ? p === 'STAT' ? 'bg-[var(--c-accent)] text-white' : 'bg-white/10 text-[var(--c-text)] border border-white/20'
                        : 'bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text-secondary)] hover:text-[var(--c-text-secondary)]'
                    }`}>
                    {p === 'STAT' && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[var(--c-text-secondary)] uppercase tracking-wider font-medium mb-1 block">Referring Doctor</label>
              <input value={form.referringDoctor} onChange={e => set('referringDoctor', e.target.value)}
                className="w-full h-9 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50" />
            </div>
          </div>
        </div>

        {/* Clinical History */}
        <div>
          <p className="text-[10px] text-[var(--c-text-tertiary)] uppercase tracking-widest font-semibold mb-3">Clinical History</p>
          <textarea value={form.clinicalHistory} onChange={e => set('clinicalHistory', e.target.value)} rows={3}
            placeholder="Symptoms, provisional diagnosis, reason for imaging..."
            className="w-full rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text)] text-xs px-3 py-2 placeholder:text-[var(--c-text-placeholder)] focus:outline-none focus:border-[var(--c-accent)]/50 resize-none" />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={() => navigate(-1)} className="h-9 px-4 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-[var(--c-text-secondary)] text-xs font-medium hover:bg-[var(--c-surface-hover)] transition-colors">Cancel</button>
          <button onClick={handleSave} className="h-9 px-5 rounded-lg bg-[var(--c-accent)] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--c-accent-hover)] transition-colors">
            <Save className="h-3.5 w-3.5" />Save Order & Send to Worklist
          </button>
        </div>
      </div>
    </div>
  );
}
