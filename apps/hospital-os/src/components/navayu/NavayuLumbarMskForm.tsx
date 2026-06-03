import { Activity } from 'lucide-react';
import { AppSelect } from '@/components/ui/app-select';
import { getNavayuLumbarForm, type NavayuLumbarExamData } from '@/lib/navayu/navayu-forms';

interface Props {
  value: NavayuLumbarExamData;
  onChange: (next: NavayuLumbarExamData) => void;
}

export function NavayuLumbarMskForm({ value, onChange }: Props) {
  const form = getNavayuLumbarForm();

  return (
    <div className="border rounded-xl bg-card p-4 space-y-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
        <Activity className="w-3.5 h-3.5" /> {form.label}
      </p>

      {form.sections.map((section) => (
        <div key={section.id} className="space-y-3">
          <p className="text-xs font-semibold text-foreground">{section.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.fields.map((field) => {
              if (field.type === 'number') {
                return (
                  <div key={field.id}>
                    <label className="text-xs font-medium mb-1 block">{field.label}</label>
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      value={value[field.id as keyof NavayuLumbarExamData] ?? ''}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          [field.id]: event.target.value === '' ? undefined : Number(event.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    />
                  </div>
                );
              }

              if (field.type === 'select' && field.options) {
                return (
                  <div key={field.id}>
                    <label className="text-xs font-medium mb-1 block">{field.label}</label>
                    <AppSelect
                      value={(value[field.id as keyof NavayuLumbarExamData] as string) ?? ''}
                      onValueChange={(next) => onChange({ ...value, [field.id]: next })}
                      options={[
                        { value: '', label: 'Select' },
                        ...field.options.map((option) => ({ value: option.value, label: option.label })),
                      ]}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    />
                  </div>
                );
              }

              return (
                <div key={field.id} className="sm:col-span-2">
                  <label className="text-xs font-medium mb-1 block">{field.label}</label>
                  <textarea
                    value={(value[field.id as keyof NavayuLumbarExamData] as string) ?? ''}
                    onChange={(event) => onChange({ ...value, [field.id]: event.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm min-h-[60px]"
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
