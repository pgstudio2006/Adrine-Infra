import { useState } from 'react';
import { Settings2, Monitor, Users, Palette, Link2, Shield, Save, Plus, Trash2 } from 'lucide-react';

const DEFAULT_MODALITIES = ['MRI', 'CT Scan', 'X-Ray', 'Ultrasound', 'Mammography'];
const DEFAULT_ROOMS: Record<string, string[]> = {
  MRI: ['MRI Suite 1', 'MRI Suite 2'],
  'CT Scan': ['CT Suite 1', 'CT Suite 2'],
  'X-Ray': ['X-Ray Room 1', 'X-Ray Room 2', 'Portable'],
  Ultrasound: ['US Room 1', 'US Room 2', 'US Room 3'],
  Mammography: ['Mammo Suite'],
};

const USERS = [
  { id: '1', name: 'Dr. Iyer', role: 'Radiologist', email: 'iyer@adrine.in', status: 'active' },
  { id: '2', name: 'Dr. Mehta', role: 'Radiologist', email: 'mehta@adrine.in', status: 'active' },
  { id: '3', name: 'Tech. Ramesh', role: 'Technician', email: 'ramesh@adrine.in', status: 'active' },
  { id: '4', name: 'Priya Admin', role: 'Receptionist', email: 'priya@adrine.in', status: 'active' },
  { id: '5', name: 'Raj Billing', role: 'Billing', email: 'raj@adrine.in', status: 'active' },
];

export default function RisSettings() {
  const [tab, setTab] = useState<'modalities' | 'users' | 'pacs' | 'whatsapp' | 'branding'>('modalities');
  const [modalities, setModalities] = useState(DEFAULT_MODALITIES);
  const [newModality, setNewModality] = useState('');
  const [pacsUrl, setPacsUrl] = useState('https://pacs.adrine-hospital.local');
  const [pacsPort, setPacsPort] = useState('4242');
  const [whatsappToken, setWhatsappToken] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Admin Settings</h1>
        <p className="text-sm text-white/40 mt-0.5">Configure modalities, users, PACS, WhatsApp, and branding</p>
      </div>

      <div className="flex gap-2">
        {(['modalities', 'users', 'pacs', 'whatsapp', 'branding'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-[#E53935] text-white' : 'bg-[#151922] text-white/50 hover:text-white/70'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Modalities */}
      {tab === 'modalities' && (
        <div className="bg-[#151922] rounded-xl border border-white/5 p-5 space-y-4">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Imaging Modalities</p>
          <div className="flex gap-2">
            <input value={newModality} onChange={e => setNewModality(e.target.value)} placeholder="New modality name..."
              className="flex-1 h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 placeholder:text-white/20 focus:outline-none" />
            <button onClick={() => { if (newModality.trim()) { setModalities(m => [...m, newModality.trim()]); setNewModality(''); } }}
              className="h-9 px-3 rounded-lg bg-[#E53935] text-white text-xs font-semibold flex items-center gap-1 hover:bg-[#d32f2f]"><Plus className="h-3 w-3" />Add</button>
          </div>
          <div className="space-y-2">
            {modalities.map((m, i) => (
              <div key={m} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <Monitor className="h-4 w-4 text-white/20 shrink-0" />
                <span className="text-xs text-white flex-1">{m}</span>
                <span className="text-[9px] text-white/30">{(DEFAULT_ROOMS[m] || []).length} rooms</span>
                <button onClick={() => setModalities(mod => mod.filter((_, j) => j !== i))} className="text-[#E53935]/40 hover:text-[#E53935]"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Rooms per Modality</p>
            {modalities.map(m => (
              <div key={m} className="flex items-center gap-3 py-2 border-b border-white/5">
                <span className="text-[11px] text-white/50 w-24">{m}</span>
                <div className="flex flex-wrap gap-1.5">
                  {(DEFAULT_ROOMS[m] || []).map(r => (
                    <span key={r} className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-white/40">{r}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="bg-[#151922] rounded-xl border border-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Users & Permissions</p>
            <button className="h-7 px-2.5 rounded-md bg-[#E53935] text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-[#d32f2f]"><Plus className="h-3 w-3" />Add User</button>
          </div>
          <div className="space-y-2">
            {USERS.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/50">{u.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">{u.name}</p>
                  <p className="text-[10px] text-white/30">{u.email}</p>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{u.role}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00C853]/10 text-[#00C853]">{u.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PACS */}
      {tab === 'pacs' && (
        <div className="bg-[#151922] rounded-xl border border-white/5 p-5 space-y-4">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">PACS Integration</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">PACS Server URL</label>
              <input value={pacsUrl} onChange={e => setPacsUrl(e.target.value)}
                className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none focus:border-[#E53935]/50" />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">DICOM Port</label>
              <input value={pacsPort} onChange={e => setPacsPort(e.target.value)}
                className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none focus:border-[#E53935]/50" />
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Auto-link studies to PACS', desc: 'Automatically link studies after scan completion', checked: true },
              { label: 'Sync study status', desc: 'Real-time status sync between RIS and PACS', checked: true },
              { label: 'Open PACS viewer in new tab', desc: 'Launch PACS viewer when clicking Open PACS', checked: false },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div><p className="text-xs text-white font-medium">{s.label}</p><p className="text-[10px] text-white/30">{s.desc}</p></div>
                <button className={`h-5 w-9 rounded-full transition-colors ${s.checked ? 'bg-[#00C853]' : 'bg-white/10'}`}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${s.checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
          <button className="h-9 px-4 rounded-lg bg-[#E53935] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#d32f2f]"><Save className="h-3.5 w-3.5" />Save PACS Settings</button>
        </div>
      )}

      {/* WhatsApp */}
      {tab === 'whatsapp' && (
        <div className="bg-[#151922] rounded-xl border border-white/5 p-5 space-y-4">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">WhatsApp Integration</p>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">API Token</label>
            <input type="password" value={whatsappToken} onChange={e => setWhatsappToken(e.target.value)} placeholder="Enter WhatsApp Business API token..."
              className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 placeholder:text-white/20 focus:outline-none focus:border-[#E53935]/50" />
          </div>
          <div className="space-y-2">
            {[
              { label: 'Auto-dispatch reports', desc: 'Automatically send finalized reports via WhatsApp', checked: true },
              { label: 'Include PDF attachment', desc: 'Attach report PDF to WhatsApp message', checked: true },
              { label: 'Delivery confirmation tracking', desc: 'Track sent/delivered/failed status', checked: true },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div><p className="text-xs text-white font-medium">{s.label}</p><p className="text-[10px] text-white/30">{s.desc}</p></div>
                <button className={`h-5 w-9 rounded-full transition-colors ${s.checked ? 'bg-[#00C853]' : 'bg-white/10'}`}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-transform ${s.checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
          <button className="h-9 px-4 rounded-lg bg-[#E53935] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#d32f2f]"><Save className="h-3.5 w-3.5" />Save WhatsApp Settings</button>
        </div>
      )}

      {/* Branding */}
      {tab === 'branding' && (
        <div className="bg-[#151922] rounded-xl border border-white/5 p-5 space-y-4">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Department Branding</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Hospital Name</label><input defaultValue="Adrine Hospital" className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none" /></div>
            <div><label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Department</label><input defaultValue="Radiology & Imaging" className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none" /></div>
            <div><label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Department Head</label><input defaultValue="Dr. Iyer" className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none" /></div>
            <div><label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Report Footer Text</label><input defaultValue="This is a computer-generated report." className="w-full h-9 rounded-lg bg-[#0F1115] border border-white/10 text-white text-xs px-3 focus:outline-none" /></div>
          </div>
          <button className="h-9 px-4 rounded-lg bg-[#E53935] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#d32f2f]"><Save className="h-3.5 w-3.5" />Save Branding</button>
        </div>
      )}
    </div>
  );
}
