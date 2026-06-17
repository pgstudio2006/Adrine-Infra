/* ═══════════════════════════════════════════
   Candela Design System v2 — Schema
   Form and workflow definitions for schema-driven UI
   ═══════════════════════════════════════════ */

/* ─── Field types ─── */
export type SchemaFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'date'
  | 'datetime'
  | 'time'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'uhid'
  | 'abha'
  | 'drug-search'
  | 'vitals-group'
  | 'switch'
  | 'radio'
  | 'checkbox';

export interface SchemaFieldOption {
  label: string;
  value: string;
}

export interface SchemaFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface SchemaFieldDef {
  id: string;
  type: SchemaFieldType;
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  options?: SchemaFieldOption[];
  validation?: SchemaFieldValidation;
  /** Column span in grid (1-4) */
  span?: 1 | 2 | 3 | 4;
  /** Conditionally show based on another field's value */
  dependsOn?: { field: string; value: any };
  /** Group fields under a section heading */
  section?: string;
}

/* ─── Form definition ─── */
export interface SchemaFormDef {
  id: string;
  title: string;
  description?: string;
  sections: {
    id: string;
    label: string;
    fields: SchemaFieldDef[];
  }[];
  submitLabel?: string;
  cancelLabel?: string;
}

/* ─── Workflow step ─── */
export interface SchemaWorkflowStep {
  id: string;
  label: string;
  description?: string;
  forms: string[]; // SchemaFormDef ids
  /** Roles that can perform this step */
  allowedRoles: string[];
  /** Whether this step can be skipped */
  optional?: boolean;
}

/* ─── Workflow definition ─── */
export interface SchemaWorkflowDef {
  id: string;
  name: string;
  description?: string;
  steps: SchemaWorkflowStep[];
}

/* ─── Built-in form registry ─── */
export const CANDELA_FORM_REGISTRY: Record<string, SchemaFormDef> = {};

export function registerForm(form: SchemaFormDef): void {
  CANDELA_FORM_REGISTRY[form.id] = form;
}

export function getForm(id: string): SchemaFormDef | undefined {
  return CANDELA_FORM_REGISTRY[id];
}

/* ─── Built-in workflow registry ─── */
export const CANDELA_WORKFLOW_REGISTRY: Record<string, SchemaWorkflowDef> = {};

export function registerWorkflow(workflow: SchemaWorkflowDef): void {
  CANDELA_WORKFLOW_REGISTRY[workflow.id] = workflow;
}

export function getWorkflow(id: string): SchemaWorkflowDef | undefined {
  return CANDELA_WORKFLOW_REGISTRY[id];
}
