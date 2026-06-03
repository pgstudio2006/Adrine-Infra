import { AppSelect } from '@/components/ui/app-select';
import type {
  NavayuFormDefinition,
  NavayuFormField,
} from '@/lib/navayu/navayu-forms';

export type FormAnswers = Record<string, string | number | boolean | string[] | undefined>;

type Props = {
  definition: NavayuFormDefinition;
  value: FormAnswers;
  onChange: (next: FormAnswers) => void;
  className?: string;
};

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: NavayuFormField;
  value: FormAnswers;
  onChange: (next: FormAnswers) => void;
}) {
  const current = value[field.id];

  if (field.type === 'number') {
    return (
      <div>
        <label className="text-xs font-medium mb-1 block">{field.label}</label>
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={current === undefined || current === '' ? '' : String(current)}
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
      <div>
        <label className="text-xs font-medium mb-1 block">{field.label}</label>
        <AppSelect
          value={typeof current === 'string' ? current : ''}
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

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
        <input
          type="checkbox"
          checked={current === true}
          onChange={(event) => onChange({ ...value, [field.id]: event.target.checked })}
          className="rounded border"
        />
        {field.label}
      </label>
    );
  }

  if (field.type === 'multiselect' && field.options) {
    const selected = Array.isArray(current) ? current : [];
    return (
      <div className="sm:col-span-2">
        <label className="text-xs font-medium mb-1 block">{field.label}</label>
        <div className="flex flex-wrap gap-2">
          {field.options.map((option) => {
            const active = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const next = active
                    ? selected.filter((item) => item !== option.value)
                    : [...selected, option.value];
                  onChange({ ...value, [field.id]: next });
                }}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/40 text-muted-foreground border-transparent'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="sm:col-span-2">
      <label className="text-xs font-medium mb-1 block">{field.label}</label>
      <textarea
        value={typeof current === 'string' ? current : ''}
        onChange={(event) => onChange({ ...value, [field.id]: event.target.value })}
        className="w-full px-3 py-2 rounded-lg border bg-background text-sm min-h-[60px]"
        rows={2}
      />
    </div>
  );
}

/** Renders tenant FormDefinition metadata (Navayu Form Engine v0). */
export function FormDefinitionRenderer({ definition, value, onChange, className }: Props) {
  return (
    <div className={className ?? 'border rounded-xl bg-card p-4 space-y-4'}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {definition.label}
        <span className="ml-2 font-normal normal-case text-[9px]">
          {definition.formId} · {definition.version}
        </span>
      </p>

      {definition.sections.map((section) => (
        <div key={section.id} className="space-y-3">
          <p className="text-xs font-semibold text-foreground">{section.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.fields.map((field) => (
              <FieldControl key={field.id} field={field} value={value} onChange={onChange} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
