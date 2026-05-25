import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList } from 'lucide-react';

interface ExamFindings {
  general: string;
  cardiovascular: string;
  respiratory: string;
  neurological: string;
  abdominal: string;
  musculoskeletal: string;
  ent: string;
  dermatological: string;
}

interface Props {
  findings: ExamFindings;
  onChange: (findings: ExamFindings) => void;
}

const EXAM_CATEGORIES = [
  { key: 'general' as const, label: 'General Examination' },
  { key: 'cardiovascular' as const, label: 'Cardiovascular' },
  { key: 'respiratory' as const, label: 'Respiratory' },
  { key: 'abdominal' as const, label: 'Abdominal' },
  { key: 'neurological' as const, label: 'Neurological' },
  { key: 'musculoskeletal' as const, label: 'Musculoskeletal' },
  { key: 'ent' as const, label: 'ENT' },
  { key: 'dermatological' as const, label: 'Dermatological' },
];

export default function ConsultationExamination({ findings, onChange }: Props) {
  const [expanded, setExpanded] = useState<string[]>(['general']);

  const toggle = (key: string) => {
    setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <div className="border rounded-xl bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-3">
        <ClipboardList className="w-3.5 h-3.5" /> Physical Examination
      </p>
      <div className="space-y-1">
        {EXAM_CATEGORIES.map(cat => (
          <div key={cat.key}>
            <button
              onClick={() => toggle(cat.key)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                expanded.includes(cat.key) ? 'bg-accent text-foreground' : 'hover:bg-accent/50 text-muted-foreground'
              }`}
            >
              {cat.label}
              {findings[cat.key] && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
            {expanded.includes(cat.key) && (
              <Textarea
                placeholder={`${cat.label} findings...`}
                value={findings[cat.key]}
                onChange={e => onChange({ ...findings, [cat.key]: e.target.value })}
                className="text-xs min-h-[50px] resize-none mt-1 mb-1"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export type { ExamFindings };
