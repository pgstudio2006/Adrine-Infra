import { useState, useMemo } from 'react';
import { Search, Plus, Edit3, Save, Trash2, FileText } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  { id: '1', name: 'Chest X-Ray Normal', modality: 'X-Ray', bodyRegion: 'Chest', category: 'Normal', sections: [{ key: 'findings', label: 'Findings', content: 'Lungs: Clear bilaterally. No focal consolidation. Cardiac silhouette normal. Bones intact.' }, { key: 'impression', label: 'Impression', content: 'Normal chest radiograph.' }], author: 'Dr. Iyer', active: true },
  { id: '2', name: 'CT Brain — Stroke Protocol', modality: 'CT Scan', bodyRegion: 'Brain', category: 'Emergency', sections: [{ key: 'findings', label: 'Findings', content: 'No acute intracranial hemorrhage. No midline shift. Ventricles normal.' }, { key: 'impression', label: 'Impression', content: 'No evidence of acute intracranial pathology on non-contrast CT.' }], author: 'Dr. Mehta', active: true },
  { id: '3', name: 'MRI Lumbar Spine', modality: 'MRI', bodyRegion: 'Spine', category: 'Routine', sections: [{ key: 'findings', label: 'Findings', content: 'Vertebral body heights maintained. Disc desiccation at L4-L5. No significant canal stenosis.' }, { key: 'impression', label: 'Impression', content: 'Mild degenerative changes at L4-L5.' }], author: 'Dr. Iyer', active: true },
  { id: '4', name: 'USG Abdomen — Normal', modality: 'Ultrasound', bodyRegion: 'Abdomen', category: 'Normal', sections: [{ key: 'findings', label: 'Findings', content: 'Liver normal in size and echotexture. Gallbladder normal. Both kidneys normal. No free fluid.' }, { key: 'impression', label: 'Impression', content: 'Normal abdominal ultrasound.' }], author: 'Dr. Nair', active: true },
];

const MODALITIES = ['All', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound'];
const REGIONS = ['All', 'Chest', 'Brain', 'Spine', 'Abdomen', 'Extremity', 'Breast'];

export default function RisTemplates() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [showEditor, setShowEditor] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', modality: 'X-Ray', bodyRegion: 'Chest', category: 'Normal', sections: [{ key: 'findings', label: 'Findings', content: '' }, { key: 'impression', label: 'Impression', content: '' }], author: '' });

  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchMod = modalityFilter === 'All' || t.modality === modalityFilter;
      const matchRegion = regionFilter === 'All' || t.bodyRegion === regionFilter;
      return matchSearch && matchMod && matchRegion;
    });
  }, [templates, search, modalityFilter, regionFilter]);

  const saveTemplate = () => {
    if (editIdx !== null) {
      setTemplates(t => t.map((tpl, i) => i === editIdx ? { ...tpl, ...form } : tpl));
    } else {
      setTemplates(t => [{ ...form, id: String(Date.now()), author: form.author || 'Admin', active: true }, ...t]);
    }
    setShowEditor(false);
    setEditIdx(null);
  };

  const deleteTemplate = (idx: number) => {
    setTemplates(t => t.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Report Templates</h1>
          <p className="text-sm text-white/40 mt-0.5">Modality and body-region specific structured templates</p>
        </div>
        <button onClick={() => { setForm({ name: '', modality: 'X-Ray', bodyRegion: 'Chest', category: 'Normal', sections: [{ key: 'findings', label: 'Findings', content: '' }, { key: 'impression', label: 'Impression', content: '' }], author: '' }); setEditIdx(null); setShowEditor(true); }}
          className="h-8 px-3 rounded-md bg-[#E53935] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#d32f2f] transition-colors">
          <Plus className="h-3.5 w-3.5" />New Template
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#151922] border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#E53935]/50" />
        </div>
        <select value={modalityFilter} onChange={e => setModalityFilter(e.target.value)} className="h-9 rounded-lg bg-[#151922] border border-white/10 text-white text-xs px-3 focus:outline-none">
          {MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="h-9 rounded-lg bg-[#151922] border border-white/10 text-white text-xs px-3 focus:outline-none">
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {showEditor && (
        <div className="bg-[#151922] rounded-xl border border-[#E53935]/20 p-5 space-y-3">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">{editIdx !== null ? 'Edit Template' : 'New Template'}</p>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Template name" className="h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 placeholder:text-white/20 focus:outline-none" />
            <select value={form.modality} onChange={e => setForm(f => ({ ...f, modality: e.target.value }))} className="h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none">
              {['X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Mammography'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={form.bodyRegion} onChange={e => setForm(f => ({ ...f, bodyRegion: e.target.value }))} className="h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none">
              {['Chest', 'Brain', 'Spine', 'Abdomen', 'Extremity', 'Breast', 'Pelvis'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {form.sections.map((sec, idx) => (
            <div key={idx}>
              <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1 block">{sec.label}</label>
              <textarea value={sec.content} onChange={e => setForm(f => ({ ...f, sections: f.sections.map((s, i) => i === idx ? { ...s, content: e.target.value } : s) }))} rows={3}
                className="w-full rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 py-2 placeholder:text-white/20 focus:outline-none resize-none" />
            </div>
          ))}
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowEditor(false); setEditIdx(null); }} className="h-8 px-3 rounded-lg bg-[#0F1115] border border-white/10 text-white/60 text-xs hover:bg-[#1a1f2e]">Cancel</button>
            <button onClick={saveTemplate} className="h-8 px-4 rounded-lg bg-[#E53935] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#d32f2f]"><Save className="h-3 w-3" />Save</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((t, i) => (
          <div key={t.id} className="bg-[#151922] rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-semibold text-white">{t.name}</p>
                <p className="text-[9px] text-white/30">{t.modality} · {t.bodyRegion}</p>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 uppercase">{t.category}</span>
            </div>
            <div className="space-y-1 mb-3">
              {t.sections.map((s, si) => (
                <p key={si} className="text-[10px] text-white/40 line-clamp-2">[{s.label}] {s.content.slice(0, 80)}...</p>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-white/20">By {t.author}</span>
              <div className="flex gap-1">
                <button onClick={() => { setForm(t); setEditIdx(i); setShowEditor(true); }} className="h-6 px-2 rounded bg-white/5 text-white/30 text-[9px] flex items-center gap-1 hover:bg-white/10 hover:text-white/50"><Edit3 className="h-2.5 w-2.5" />Edit</button>
                <button onClick={() => deleteTemplate(i)} className="h-6 px-2 rounded bg-[#E53935]/5 text-[#E53935]/50 text-[9px] flex items-center gap-1 hover:bg-[#E53935]/10"><Trash2 className="h-2.5 w-2.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
