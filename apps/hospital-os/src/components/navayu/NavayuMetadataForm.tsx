import { useMemo } from 'react';
import { AppSelect } from '@/components/ui/app-select';
import {
  computeCalculatorScore,
  getCalculatorDef,
  type CalculatorAnswers,
} from '@/lib/navayu/msk-calculators';
import type { NavayuFormDefinition, NavayuFormField } from '@/lib/navayu/navayu-forms';

export type NavayuFormValues = Record<string, unknown>;

interface Props {
  form: NavayuFormDefinition;
  value: NavayuFormValues;
  onChange: (next: NavayuFormValues) => void;
  visitId?: string;
  onFileUpload?: (fieldId: string, file: File) => Promise<void>;
}

function CalculatorField({
  field,
  value,
  onChange,
}: {
  field: NavayuFormField;
  value: NavayuFormValues;
  onChange: (next: NavayuFormValues) => void;
}) {
  const calculatorId = field.calculatorId ?? field.id;
  const def = getCalculatorDef(calculatorId);
  const stored = (value[field.id] as { answers?: CalculatorAnswers; score?: number; display?: string }) ?? {};
  const answers = stored.answers ?? {};

  const result = useMemo(
    () => computeCalculatorScore(calculatorId, answers),
    [calculatorId, answers],
  );

  if (!def) {
    return <p className="text-xs text-destructive">Unknown calculator: {calculatorId}</p>;
  }

  return (
    <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
      <p className="text-xs font-semibold">{field.label}</p>
      {def.items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
          <input
            type="range"
            min={0}
            max={item.maxPoints}
            value={answers[item.id] ?? 0}
            onChange={(e) => {
              const nextAnswers = { ...answers, [item.id]: Number(e.target.value) };
              const computed = computeCalculatorScore(calculatorId, nextAnswers);
              onChange({
                ...value,
                [field.id]: {
                  answers: nextAnswers,
                  score: computed?.score,
                  display: computed?.display,
                },
              });
            }}
            className="w-24"
          />
          <span className="text-[10px] w-6 text-right">{answers[item.id] ?? 0}</span>
        </div>
      ))}
      {result ? (
        <p className="text-xs font-medium text-primary">
          Score: {result.display}
          {def.moderateThreshold != null && result.score >= def.moderateThreshold
            ? ' — elevated'
            : ''}
        </p>
      ) : null}
    </div>
  );
}

function PainMapField({
  field,
  value,
  onChange,
}: {
  field: NavayuFormField;
  value: NavayuFormValues;
  onChange: (next: NavayuFormValues) => void;
}) {
  const selected = (value[field.id] as string[]) ?? [];
  const options = field.options ?? [];

  const toggle = (region: string) => {
    const next = selected.includes(region)
      ? selected.filter((r) => r !== region)
      : [...selected, region];
    onChange({ ...value, [field.id]: next });
  };

  return (
    <div>
      <p className="text-xs font-medium mb-2">{field.label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={`text-xs px-2 py-2 rounded-lg border transition-colors ${
              selected.includes(option.value)
                ? 'bg-primary/15 border-primary text-primary font-medium'
                : 'bg-background hover:bg-muted/50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FileField({
  field,
  value,
  onChange,
  onFileUpload,
}: {
  field: NavayuFormField;
  value: NavayuFormValues;
  onChange: (next: NavayuFormValues) => void;
  onFileUpload?: (fieldId: string, file: File) => Promise<void>;
}) {
  const uploads = (value[field.id] as Array<{ fileName: string; mimeType: string; uploadedAt: string }>) ?? [];

  return (
    <div>
      <p className="text-xs font-medium mb-1">{field.label}</p>
      <input
        type="file"
        accept={field.accept ?? 'image/*,.pdf'}
        className="text-xs w-full"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (onFileUpload) {
            await onFileUpload(field.id, file);
          } else {
            const entry = {
              fileName: file.name,
              mimeType: file.type,
              uploadedAt: new Date().toISOString(),
              stub: true,
            };
            onChange({ ...value, [field.id]: [...uploads, entry] });
          }
          e.target.value = '';
        }}
      />
      {uploads.length > 0 ? (
        <ul className="mt-1 text-[10px] text-muted-foreground space-y-0.5">
          {uploads.map((u, i) => (
            <li key={`${u.fileName}-${i}`}>• {u.fileName}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function NavayuMetadataForm({ form, value, onChange, onFileUpload }: Props) {
  return (
    <div className="border rounded-xl bg-card p-4 space-y-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {form.label}
      </p>
      {form.sections.map((section) => (
        <div key={section.id} className="space-y-3">
          <p className="text-xs font-semibold text-foreground">{section.label}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.fields.map((field) => {
              if (field.type === 'calculator') {
                return (
                  <div key={field.id} className="sm:col-span-2">
                    <CalculatorField field={field} value={value} onChange={onChange} />
                  </div>
                );
              }
              if (field.type === 'pain_map') {
                return (
                  <div key={field.id} className="sm:col-span-2">
                    <PainMapField field={field} value={value} onChange={onChange} />
                  </div>
                );
              }
              if (field.type === 'file') {
                return (
                  <div key={field.id} className="sm:col-span-2">
                    <FileField
                      field={field}
                      value={value}
                      onChange={onChange}
                      onFileUpload={onFileUpload}
                    />
                  </div>
                );
              }
              if (field.type === 'boolean') {
                return (
                  <label key={field.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!value[field.id]}
                      onChange={(e) => onChange({ ...value, [field.id]: e.target.checked })}
                    />
                    {field.label}
                  </label>
                );
              }
              if (field.type === 'number') {
                return (
                  <div key={field.id}>
                    <label className="text-xs font-medium mb-1 block">{field.label}</label>
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      value={value[field.id] != null ? String(value[field.id]) : ''}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          [field.id]: e.target.value === '' ? undefined : Number(e.target.value),
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
                      value={(value[field.id] as string) ?? ''}
                      onValueChange={(next) => onChange({ ...value, [field.id]: next })}
                      options={[
                        { value: '', label: 'Select' },
                        ...field.options.map((o) => ({ value: o.value, label: o.label })),
                      ]}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    />
                  </div>
                );
              }
              if (field.type === 'multiselect' && field.options) {
                const selected = (value[field.id] as string[]) ?? [];
                return (
                  <div key={field.id} className="sm:col-span-2">
                    <p className="text-xs font-medium mb-1">{field.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {field.options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            const next = selected.includes(option.value)
                              ? selected.filter((v) => v !== option.value)
                              : [...selected, option.value];
                            onChange({ ...value, [field.id]: next });
                          }}
                          className={`text-xs px-2 py-1 rounded-full border ${
                            selected.includes(option.value) ? 'bg-primary/15 border-primary' : ''
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={field.id} className="sm:col-span-2">
                  <label className="text-xs font-medium mb-1 block">{field.label}</label>
                  <textarea
                    value={(value[field.id] as string) ?? ''}
                    onChange={(e) => onChange({ ...value, [field.id]: e.target.value })}
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
