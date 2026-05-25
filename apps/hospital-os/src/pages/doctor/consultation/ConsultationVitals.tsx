import { Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Vitals {
  bp: string; spo2: string; temp: string; pulse: string; weight: string; sugar: string;
  height: string; rr: string; bmi: string;
}

interface Props {
  vitals: Vitals;
  onChange: (vitals: Vitals) => void;
}

export default function ConsultationVitals({ vitals, onChange }: Props) {
  const fields = [
    { label: 'BP', key: 'bp' as const },
    { label: 'SPO2 (%)', key: 'spo2' as const },
    { label: 'TEMP (°F)', key: 'temp' as const },
    { label: 'PULSE', key: 'pulse' as const },
    { label: 'RESP RATE', key: 'rr' as const },
    { label: 'WEIGHT (KG)', key: 'weight' as const },
    { label: 'HEIGHT (CM)', key: 'height' as const },
    { label: 'BMI', key: 'bmi' as const },
    { label: 'SUGAR/RBS', key: 'sugar' as const },
  ];

  return (
    <div className="border rounded-xl bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-3">
        <Activity className="w-3.5 h-3.5" /> Vitals
      </p>
      <div className="grid grid-cols-3 gap-2">
        {fields.map(v => (
          <div key={v.key}>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{v.label}</label>
            <Input
              value={vitals[v.key]}
              onChange={e => onChange({ ...vitals, [v.key]: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
