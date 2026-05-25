/** Platform-aligned operational context (maps to kernel tenant/branch). */
export type OperationalContext = {
  tenantId: string;
  organizationId: string;
  branchId: string;
  actorId: string;
  actorRole: string;
};

export type LifecycleId =
  | 'patient_identity'
  | 'visit_encounter'
  | 'opd_visit'
  | 'emergency_case'
  | 'admission'
  | 'bed_allocation'
  | 'inpatient_care'
  | 'icu_care'
  | 'nursing_round'
  | 'medication_administration'
  | 'clinical_consultation'
  | 'lab_order'
  | 'lab_sample'
  | 'radiology_order'
  | 'prescription'
  | 'pharmacy_dispense'
  | 'billing_invoice'
  | 'payment'
  | 'insurance_preauth'
  | 'tpa_claim'
  | 'discharge'
  | 'follow_up'
  | 'referral'
  | 'telemedicine_session'
  | 'consent'
  | 'document'
  | 'approval'
  | 'escalation'
  | 'ot_case'
  | 'inventory_stock_move'
  | 'dialysis_session';

export type LifecycleDefinition<S extends string = string> = {
  id: LifecycleId;
  label: string;
  initial: S;
  states: readonly S[];
  transitions: readonly Transition<S>[];
};

export type Transition<S extends string = string> = {
  from: S | S[];
  to: S;
  action: string;
  roles: readonly string[];
  /** Human-readable gate (configurable later). */
  validations?: readonly string[];
  emits?: readonly string[];
  notifications?: readonly string[];
  /** Usage metering keys (kernel). */
  metering?: readonly string[];
  /** AI workflow hook ids. */
  aiHooks?: readonly string[];
  /** Branch config keys that can override behavior. */
  branchConfigKeys?: readonly string[];
  /** Actions that undo or partially reverse this step. */
  reversibleBy?: readonly string[];
  auditLevel: 'standard' | 'phi' | 'critical';
  /** When true, transition blocked if visit is escalated without supervisor role. */
  blockedWhenEscalated?: boolean;
};

export type JourneyStep = {
  id: string;
  label: string;
  lifecycleId: LifecycleId;
  targetState: string;
  route?: string;
  roles: readonly string[];
  dependsOn?: readonly string[];
};

export type OperationalJourney = {
  id: string;
  label: string;
  description: string;
  steps: readonly JourneyStep[];
};

export type NavGroup = {
  id: string;
  label: string;
  journeyId?: string;
  items: readonly { key: string; label: string; path: string; stepId?: string }[];
};
