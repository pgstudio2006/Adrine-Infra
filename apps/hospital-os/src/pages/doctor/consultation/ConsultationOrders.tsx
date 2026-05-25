import { useState } from 'react';
import { X, FlaskConical, Scan, Syringe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LabTest { id: string; text: string; priority: 'routine' | 'urgent' | 'stat'; }
interface RadiologyOrder { id: string; type: string; bodyPart: string; indication: string; priority: 'routine' | 'urgent'; }
interface ProcedureOrder { id: string; name: string; notes: string; }

interface Props {
  labTests: LabTest[];
  onLabChange: (tests: LabTest[]) => void;
  radiologyOrders: RadiologyOrder[];
  onRadiologyChange: (orders: RadiologyOrder[]) => void;
  procedures: ProcedureOrder[];
  onProcedureChange: (procedures: ProcedureOrder[]) => void;
}

const LAB_SUGGESTIONS = ['CBC', 'ESR', 'Lipid Profile', 'HbA1c', 'FBS/PPBS', 'Thyroid Panel', 'RFT', 'LFT', 'Urine Routine', 'Electrolytes', 'Troponin', 'CRP', 'D-Dimer'];
const IMAGING_TYPES = ['X-ray', 'CT Scan', 'MRI', 'Ultrasound', 'Echocardiography', 'Doppler'];

export default function ConsultationOrders({ labTests, onLabChange, radiologyOrders, onRadiologyChange, procedures, onProcedureChange }: Props) {
  const [newLab, setNewLab] = useState('');
  const [labPriority, setLabPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');
  const [newRad, setNewRad] = useState({ type: 'X-ray', bodyPart: '', indication: '', priority: 'routine' as const });
  const [newProc, setNewProc] = useState('');

  const addLab = () => {
    if (!newLab.trim()) return;
    onLabChange([...labTests, { id: Date.now().toString(), text: newLab, priority: labPriority }]);
    setNewLab('');
  };

  const addRadiology = () => {
    if (!newRad.bodyPart.trim()) return;
    onRadiologyChange([...radiologyOrders, { id: Date.now().toString(), ...newRad }]);
    setNewRad({ type: 'X-ray', bodyPart: '', indication: '', priority: 'routine' });
  };

  const addProcedure = () => {
    if (!newProc.trim()) return;
    onProcedureChange([...procedures, { id: Date.now().toString(), name: newProc, notes: '' }]);
    setNewProc('');
  };

  const priorityStyle = { routine: 'bg-muted text-muted-foreground', urgent: 'bg-amber-500/10 text-amber-700', stat: 'bg-destructive/10 text-destructive' };

  return (
    <div className="space-y-3">
      {/* Lab Orders */}
      <div className="border rounded-xl bg-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-3">
          <FlaskConical className="w-3.5 h-3.5" /> Lab Orders
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {labTests.map(t => (
            <span key={t.id} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${priorityStyle[t.priority]}`}>
              {t.text}
              <button onClick={() => onLabChange(labTests.filter(x => x.id !== t.id))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        {/* Quick-add suggestions */}
        <div className="flex flex-wrap gap-1 mb-2">
          {LAB_SUGGESTIONS.filter(s => !labTests.some(t => t.text === s)).slice(0, 6).map(s => (
            <button key={s} onClick={() => onLabChange([...labTests, { id: Date.now().toString() + s, text: s, priority: 'routine' }])}
              className="text-[10px] px-2 py-0.5 rounded-full border hover:bg-accent transition-colors text-muted-foreground">
              + {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Input placeholder="Add test..." value={newLab} onChange={e => setNewLab(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLab()} className="h-7 text-xs flex-1" />
          <Select value={labPriority} onValueChange={(value) => setLabPriority(value as 'routine' | 'urgent' | 'stat')}>
            <SelectTrigger className="h-7 text-xs w-[110px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="stat">STAT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Radiology Orders */}
      <div className="border rounded-xl bg-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-3">
          <Scan className="w-3.5 h-3.5" /> Radiology Orders
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {radiologyOrders.map(r => (
            <span key={r.id} className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-700 px-2.5 py-1 rounded-full">
              {r.type} — {r.bodyPart}
              <button onClick={() => onRadiologyChange(radiologyOrders.filter(x => x.id !== r.id))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Select value={newRad.type} onValueChange={(value) => setNewRad({ ...newRad, type: value })}>
            <SelectTrigger className="h-7 text-xs w-[140px]">
              <SelectValue placeholder="Modality" />
            </SelectTrigger>
            <SelectContent>
              {IMAGING_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Body part" value={newRad.bodyPart} onChange={e => setNewRad({ ...newRad, bodyPart: e.target.value })} className="h-7 text-xs flex-1" />
          <Input placeholder="Indication" value={newRad.indication} onChange={e => setNewRad({ ...newRad, indication: e.target.value })} className="h-7 text-xs flex-1" />
          <button onClick={addRadiology} className="h-7 px-2 text-xs font-medium bg-foreground text-background rounded-md">Add</button>
        </div>
      </div>

      {/* Procedure Orders */}
      <div className="border rounded-xl bg-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-3">
          <Syringe className="w-3.5 h-3.5" /> Procedure Orders
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {procedures.map(p => (
            <span key={p.id} className="flex items-center gap-1 text-xs bg-purple-500/10 text-purple-700 px-2.5 py-1 rounded-full">
              {p.name}
              <button onClick={() => onProcedureChange(procedures.filter(x => x.id !== p.id))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <Input placeholder="Add procedure (e.g., Endoscopy, IV Therapy, Biopsy)..." value={newProc} onChange={e => setNewProc(e.target.value)} onKeyDown={e => e.key === 'Enter' && addProcedure()} className="h-7 text-xs" />
      </div>
    </div>
  );
}

export type { LabTest, RadiologyOrder, ProcedureOrder };
