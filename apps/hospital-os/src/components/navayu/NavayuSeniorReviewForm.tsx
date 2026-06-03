import { Stethoscope } from 'lucide-react';
import { FormDefinitionRenderer } from '@/components/forms/FormDefinitionRenderer';
import { getNavayuSeniorReviewForm, type NavayuSeniorReviewData } from '@/lib/navayu/navayu-forms';

interface Props {
  value: NavayuSeniorReviewData;
  onChange: (next: NavayuSeniorReviewData) => void;
}

export function NavayuSeniorReviewForm({ value, onChange }: Props) {
  const form = getNavayuSeniorReviewForm();

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 px-1">
        <Stethoscope className="w-3.5 h-3.5" /> Senior consultation
      </p>
      <FormDefinitionRenderer
        definition={form}
        value={value}
        onChange={(next) => onChange(next as NavayuSeniorReviewData)}
      />
    </div>
  );
}
