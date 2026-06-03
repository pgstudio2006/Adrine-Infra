import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { NavayuMetadataForm, type NavayuFormValues } from '@/components/navayu/NavayuMetadataForm';
import {
  resolveNavayuExamForms,
  type NavayuFormDefinition,
  type NavayuLumbarExamData,
} from '@/lib/navayu/navayu-forms';

interface Props {
  bodyRegions: string[];
  examsByFormId: Record<string, NavayuFormValues>;
  onExamChange: (formId: string, values: NavayuFormValues) => void;
}

export function NavayuMskExamPanel({ bodyRegions, examsByFormId, onExamChange }: Props) {
  const forms = useMemo(() => resolveNavayuExamForms(bodyRegions), [bodyRegions]);

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5" /> Regional MSK exam (metadata-driven)
      </p>
      {forms.map((form: NavayuFormDefinition) => (
        <NavayuMetadataForm
          key={form.formId}
          form={form}
          value={(examsByFormId[form.formId] as NavayuLumbarExamData) ?? {}}
          onChange={(next) => onExamChange(form.formId, next)}
        />
      ))}
    </div>
  );
}
