'use client';

import { useState, useCallback, type ReactNode } from 'react';
import type { SchemaFormDef, SchemaFieldDef } from '@/design-system/candela';

interface FormRendererProps {
  form: SchemaFormDef;
  onSubmit?: (values: Record<string, any>) => void;
  onCancel?: () => void;
  initialValues?: Record<string, any>;
  submitLabel?: string;
}

export function FormRenderer({ form, onSubmit, onCancel, initialValues, submitLabel }: FormRendererProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = useCallback((fieldId: string, value: any) => {
    setValues(v => ({ ...v, [fieldId]: value }));
    // Clear error on change
    setErrors(e => { const { [fieldId]: _, ...rest } = e; return rest; });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const section of form.sections) {
      for (const field of section.fields) {
        if (field.validation?.required && !values[field.id]) {
          newErrors[field.id] = `${field.label} is required`;
        }
        if (field.validation?.minLength && typeof values[field.id] === 'string' && values[field.id].length < field.validation.minLength) {
          newErrors[field.id] = `${field.label} must be at least ${field.validation.minLength} characters`;
        }
        if (field.validation?.pattern && typeof values[field.id] === 'string') {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(values[field.id])) {
            newErrors[field.id] = field.validation.patternMessage || `${field.label} is invalid`;
          }
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values, form]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit?.(values);
    }
  }, [validate, values, onSubmit]);

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {form.sections.map(section => (
        <div key={section.id} style={{ marginBottom: 'var(--c-space-5)' }}>
          <h3 style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--c-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 12px 0',
            paddingBottom: 8,
            borderBottom: '1px solid var(--c-border)',
          }}>
            {section.label}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--c-space-3)',
          }}>
            {section.fields.map(field => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={val => setValue(field.id, val)}
                error={errors[field.id]}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--c-space-2)', paddingTop: 'var(--c-space-3)' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: 34,
              padding: '0 16px',
              borderRadius: 'var(--c-radius-md)',
              border: '1px solid var(--c-border)',
              background: 'transparent',
              color: 'var(--c-text-secondary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {form.cancelLabel || 'Cancel'}
          </button>
        )}
        <button
          type="submit"
          style={{
            height: 34,
            padding: '0 16px',
            borderRadius: 'var(--c-radius-md)',
            border: 'none',
            background: 'var(--c-accent)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background var(--c-transition-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-accent-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--c-accent)'; }}
        >
          {submitLabel || form.submitLabel || 'Submit'}
        </button>
      </div>
    </form>
  );
}

/* ─── Individual field renderer ─── */
interface FieldRendererProps {
  field: SchemaFieldDef;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  const span = field.span || 1;

  const wrapperStyle: React.CSSProperties = {
    gridColumn: `span ${span}`,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const inputBaseStyle: React.CSSProperties = {
    width: '100%',
    height: 34,
    padding: '0 10px',
    borderRadius: 'var(--c-radius-md)',
    border: `1px solid ${error ? 'var(--c-critical)' : 'var(--c-border)'}`,
    background: 'var(--c-surface)',
    color: 'var(--c-text)',
    fontSize: 12,
    outline: 'none',
    transition: 'border-color var(--c-transition-fast)',
    boxSizing: 'border-box',
  };

  const renderField = (): ReactNode => {
    switch (field.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={inputBaseStyle}
          >
            <option value="">{field.placeholder || 'Select...'}</option>
            {(field.options || []).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            style={{
              ...inputBaseStyle,
              height: 'auto',
              padding: '8px 10px',
              resize: 'vertical',
              minHeight: 70,
            }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={field.placeholder}
            style={inputBaseStyle}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            style={inputBaseStyle}
          />
        );

      case 'switch':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', height: 34 }}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={e => onChange(e.target.checked)}
              style={{ accentColor: 'var(--c-accent)' }}
            />
            <span style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>{field.label}</span>
          </label>
        );

      default: // text, email, phone, uhid, abha
        return (
          <input
            type={field.type === 'email' ? 'email' : 'text'}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            style={inputBaseStyle}
            onFocus={e => { e.currentTarget.style.borderColor = error ? 'var(--c-critical)' : 'var(--c-accent)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--c-critical)' : 'var(--c-border)'; }}
          />
        );
    }
  };

  return (
    <div style={wrapperStyle}>
      {field.type !== 'switch' && (
        <label style={{ fontSize: 10, fontWeight: 500, color: 'var(--c-text-secondary)', letterSpacing: '0.02em' }}>
          {field.label}
          {field.validation?.required && <span style={{ color: 'var(--c-critical)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {renderField()}
      {field.description && !error && (
        <span style={{ fontSize: 9, color: 'var(--c-text-tertiary)' }}>{field.description}</span>
      )}
      {error && (
        <span style={{ fontSize: 9, color: 'var(--c-critical)' }}>{error}</span>
      )}
    </div>
  );
}
