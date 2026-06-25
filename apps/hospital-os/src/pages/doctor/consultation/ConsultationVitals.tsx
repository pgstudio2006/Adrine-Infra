import { Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTenantSettings } from '@/hooks/useTenantSettings';

interface Vitals {
  bp: string; spo2: string; temp: string; pulse: string; weight: string; sugar: string;
  height: string; rr: string; bmi: string;
}

interface Props {
  vitals: Vitals;
  onChange: (vitals: Vitals) => void;
}

export default function ConsultationVitals({ vitals, onChange }: Props) {
  const { settings } = useTenantSettings();
  const form = settings.dynamicForms.consultation_vitals_v0;
  const fields = (form?.sections.flatMap((section) => section.fields) ?? [
    { label: 'BP', id: 'bp' },
    { label: 'SPO2 (%)', id: 'spo2' },
    { label: 'TEMP (°F)', id: 'temp' },
    { label: 'PULSE', id: 'pulse' },
    { label: 'RESP RATE', id: 'rr' },
    { label: 'WEIGHT (KG)', id: 'weight' },
    { label: 'HEIGHT (CM)', id: 'height' },
    { label: 'BMI', id: 'bmi' },
    { label: 'SUGAR/RBS', id: 'sugar' },
  ]).filter((field) => field.id in vitals) as Array<{
    id: keyof Vitals;
    label: string;
    min?: number;
    max?: number;
    type?: string;
  }>;

  return (
    <div className="border rounded-lg bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-3">
        <Activity className="w-3.5 h-3.5" /> Vitals
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {fields.map(v => (
          <div key={v.id}>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{v.label}</label>
            <Input
              type={v.type === 'number' ? 'number' : 'text'}
              min={v.min}
              max={v.max}
              value={vitals[v.id]}
              onChange={e => onChange({ ...vitals, [v.id]: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
