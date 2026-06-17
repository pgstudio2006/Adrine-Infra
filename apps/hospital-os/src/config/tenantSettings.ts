import { ROLE_TABS } from '@/config/roleNavigation';
import { coerceMasterData, DEFAULT_MASTER_DATA } from '@/lib/admin/master-data';
import { ROLE_LABELS, UserRole } from '@/types/roles';

export type TenantFeatureFlag =
  | 'whiteLabelMode'
  | 'telemedicineEnabled'
  | 'patientRelationsEnabled'
  | 'formBuilderEnabled'
  | 'customFieldsEnabled'
  | 'workflowDesignerEnabled'
  | 'apiAccessEnabled';

export interface TenantBranding {
  platformName: string;
  platformMark: string;
  productDescriptor: string;
  organizationName: string;
  organizationShortName: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  loginHeadline: string;
  loginSubheadline: string;
}

export interface TenantRoleConfig {
  label: string;
  description: string;
  enabled: boolean;
}

export interface TenantNavigationItemConfig {
  label: string;
  visible: boolean;
}

export type RegistrationJourneyType =
  | 'OPD'
  | 'IPD'
  | 'Emergency'
  | 'Maternity'
  | 'Newborn'
  | 'ICU'
  | 'Surgery'
  | 'Dialysis'
  | 'Trauma';

export interface TenantPatientTypeOption {
  label: string;
  journeyType: RegistrationJourneyType;
}

export interface TenantRegistrationConfig {
  departments: string[];
  patientTypes: TenantPatientTypeOption[];
}

export type TenantFormTemplateKey =
  | 'admissionForm'
  | 'consentForm'
  | 'nursingChart'
  | 'doctorOrderSheet'
  | 'dischargeSummary';

export interface TenantFormTemplateConfig {
  label: string;
  fields: string[];
}

export type TenantFormTemplates = Record<TenantFormTemplateKey, TenantFormTemplateConfig>;

export type TenantDynamicFormFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'date'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'calculator'
  | 'pain_map'
  | 'file';

export interface TenantDynamicFormOption {
  value: string;
  label: string;
}

export interface TenantDynamicFormField {
  id: string;
  label: string;
  type: TenantDynamicFormFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  calculatorId?: string;
  accept?: string;
  options?: TenantDynamicFormOption[];
}

export interface TenantDynamicFormSection {
  id: string;
  label: string;
  fields: TenantDynamicFormField[];
}

export interface TenantDynamicFormDefinition {
  formId: string;
  version: string;
  label: string;
  sections: TenantDynamicFormSection[];
}

export type TenantDynamicForms = Record<string, TenantDynamicFormDefinition>;

export interface NavProfileMatch {
  role?: UserRole;
  department?: string;
  emailPattern?: string;
  namePattern?: string;
}

export interface NavProfile {
  match: NavProfileMatch;
  navigationPatches?: Partial<Record<UserRole, Record<string, Partial<TenantNavigationItemConfig>>>>;
  /** Cross-role route prefixes (e.g. counsellor billing → /crm/*). */
  allowedRoutePrefixes?: string[];
}

export interface TenantTwentyCrmIntegration {
  enabled: boolean;
  /** Platform root, e.g. https://crm.adrine.in */
  baseUrl?: string;
  /**
   * Client workspace on shared Twenty (multi-workspace mode).
   * Example: "navayu" → https://navayu.crm.adrine.in
   */
  workspaceSubdomain?: string;
  /** Override when subdomain rules differ — full workspace URL */
  workspaceUrl?: string;
  embedMode?: boolean;
  /** Embed complete Twenty workspace (default true) — not hospital CRM sub-screens */
  fullApp?: boolean;
}

export interface TenantIntegrations {
  twentyCrm?: TenantTwentyCrmIntegration;
}

export interface NavayuOpdDepartment {
  id: string;
  label: string;
  clinicalDepartments: string[];
}

export interface TenantMasterData {
  doctorDepartments: string[];
  expenseCategories: string[];
  roleDepartments: Record<string, string[]>;
  adminDashboardSections: string[];
  /** Navayu front-desk OPD categories (Spine & Joint Care, Wellness & Metabolic) */
  opdDepartments?: NavayuOpdDepartment[];
  /** Doctor roster keyed by OPD department id or label */
  opdDepartmentDoctors?: Record<string, string[]>;
}

export interface TenantSettings {
  branding: TenantBranding;
  roles: Record<UserRole, TenantRoleConfig>;
  navigation: Record<UserRole, Record<string, TenantNavigationItemConfig>>;
  featureFlags: Record<TenantFeatureFlag, boolean>;
  registration: TenantRegistrationConfig;
  forms: TenantFormTemplates;
  dynamicForms: TenantDynamicForms;
  masterData?: TenantMasterData;
  navProfiles?: Record<string, NavProfile>;
  integrations?: TenantIntegrations;
}

export const DEFAULT_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full system access and tenant-wide configuration',
  doctor: 'OPD, IPD, prescriptions, orders and clinical workflow',
  jr_doctor: 'MSK intake, junior exam and investigations handoff',
  nurse: 'Ward management, medications and bedside care',
  receptionist: 'Registration, appointments, check-in and front desk billing',
  lab_technician: 'Lab worklists, sample flow and verification',
  pharmacist: 'Dispensing, drug master and pharmacy inventory',
  billing: 'Billing operations, revenue tracking and insurance follow-up',
  radiologist: 'Radiology worklists, reporting and imaging coordination',
  ot_coordinator: 'OT scheduling, rooms, teams and peri-op workflow',
  inventory_manager: 'Stock, procurement and supply chain control',
  emergency: 'Triage, cases, observation and ambulance workflow',
  hr_manager: 'Staff operations, attendance and workforce planning',
  scheduler: 'Calendar operations, resource allocation and teleconsult setup',
  dialysis_tech: 'Dialysis sessions, machines and consumables',
  crm_manager: 'Patient relations, lifecycle, campaigns and experience management',
};

export const TENANT_FEATURE_LABELS: Record<TenantFeatureFlag, { label: string; description: string }> = {
  whiteLabelMode: {
    label: 'White-label mode',
    description: 'Use organization branding more prominently across login and navigation surfaces.',
  },
  telemedicineEnabled: {
    label: 'Telemedicine enabled',
    description: 'Expose teleconsult workflow inside scheduling navigation.',
  },
  patientRelationsEnabled: {
    label: 'Patient relations enabled',
    description: 'Expose CRM and patient relations workflows for eligible roles.',
  },
  formBuilderEnabled: {
    label: 'Form builder enabled',
    description: 'Enable tenant-level customization for admission and clinical form templates.',
  },
  customFieldsEnabled: {
    label: 'Custom fields engine',
    description: 'Foundation flag for dynamic field configuration across modules.',
  },
  workflowDesignerEnabled: {
    label: 'Workflow designer',
    description: 'Foundation flag for future editable workflow steps per tenant.',
  },
  apiAccessEnabled: {
    label: 'API access',
    description: 'Foundation flag for exposing tenant integrations and external API access.',
  },
};

export const REGISTRATION_JOURNEY_OPTIONS: RegistrationJourneyType[] = [
  'OPD',
  'IPD',
  'Emergency',
  'Maternity',
  'Newborn',
  'ICU',
  'Surgery',
  'Dialysis',
  'Trauma',
];

const DEFAULT_REGISTRATION_DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Gynecology',
  'Pediatrics',
  'Dermatology',
  'ENT',
  'Neurology',
  'Ophthalmology',
  'Urology',
];

const DEFAULT_REGISTRATION_PATIENT_TYPES: TenantPatientTypeOption[] = REGISTRATION_JOURNEY_OPTIONS.map((journeyType) => ({
  label: journeyType,
  journeyType,
}));

const DEFAULT_FORM_TEMPLATES: TenantFormTemplates = {
  admissionForm: {
    label: 'Admission Form',
    fields: ['UHID', 'IPD Number', 'Department', 'Ward', 'Bed', 'Attending Doctor', 'Primary Diagnosis'],
  },
  consentForm: {
    label: 'Consent Form',
    fields: ['General Consent', 'Privacy Consent', 'Procedure Consent', 'Insurance Consent'],
  },
  nursingChart: {
    label: 'Nursing Chart',
    fields: ['Vitals Trend', 'Intake/Output', 'Medication Administration', 'Nursing Notes'],
  },
  doctorOrderSheet: {
    label: 'Doctor Order Sheet',
    fields: ['Medication Orders', 'Investigation Orders', 'Procedure Orders', 'Diet Orders'],
  },
  dischargeSummary: {
    label: 'Discharge Summary',
    fields: ['Clinical Course', 'Final Diagnosis', 'Medications', 'Follow-up Plan'],
  },
};

const DEFAULT_DYNAMIC_FORMS: TenantDynamicForms = {
  registration_v0: {
    formId: 'navayu.reception.registration',
    version: 'admin-v1',
    label: 'Reception Registration',
    sections: [
      {
        id: 'referral',
        label: 'Referral source',
        fields: [
          {
            id: 'hearAboutNavayu',
            type: 'select',
            label: 'How did you hear about us?',
            required: true,
            options: [
              { value: 'google_search', label: 'Google Search' },
              { value: 'website', label: 'Website' },
              { value: 'instagram_facebook', label: 'Instagram & Facebook' },
              { value: 'hoardings', label: 'Hoardings' },
              { value: 'whatsapp_campaign', label: 'Whatsapp Campaign' },
              { value: 'patient_referral', label: 'Patient Referral' },
              { value: 'youtube', label: 'YouTube' },
              { value: 'doctor_referral', label: 'Doctor Referral' },
              { value: 'other', label: 'Other' },
            ],
          },
        ],
      },
      {
        id: 'lifestyle',
        label: 'Lifestyle snapshot',
        fields: [
          { id: 'smoker', type: 'boolean', label: 'Smoker' },
          { id: 'alcohol', type: 'boolean', label: 'Alcohol use' },
          { id: 'diabetes', type: 'boolean', label: 'Diabetes' },
          { id: 'htn', type: 'boolean', label: 'Hypertension' },
          { id: 'thyroid', type: 'boolean', label: 'Thyroid disorder' },
          { id: 'obesity', type: 'boolean', label: 'Obesity' },
          { id: 'prevSurgery', type: 'boolean', label: 'Previous surgery' },
          { id: 'steroidUse', type: 'boolean', label: 'Steroid use' },
          { id: 'sportsInjury', type: 'boolean', label: 'Sports injury history' },
        ],
      },
      {
        id: 'pain_regions',
        label: 'Pain regions',
        fields: [
          {
            id: 'bodyRegions',
            type: 'multiselect',
            label: 'Affected regions',
            options: [
              { value: 'neck', label: 'Neck' },
              { value: 'back', label: 'Back / lumbar' },
              { value: 'knee', label: 'Knee' },
              { value: 'shoulder', label: 'Shoulder' },
              { value: 'hip', label: 'Hip' },
              { value: 'multiple', label: 'Multiple regions' },
            ],
          },
        ],
      },
    ],
  },
  msk_lumbar_v0: {
    formId: 'navayu.exam.lumbar',
    version: 'admin-v1',
    label: 'Lumbar MSK Exam',
    sections: [
      {
        id: 'scores',
        label: 'Scores',
        fields: [
          { id: 'odi', type: 'calculator', calculatorId: 'odi', label: 'ODI', required: true },
          { id: 'vas', type: 'calculator', calculatorId: 'vas', label: 'VAS', required: true },
        ],
      },
      {
        id: 'exam',
        label: 'Lumbar examination',
        fields: [
          {
            id: 'slrt',
            type: 'select',
            label: 'Straight leg raise',
            required: true,
            options: [
              { value: 'negative', label: 'Negative' },
              { value: 'positive_left', label: 'Positive left' },
              { value: 'positive_right', label: 'Positive right' },
              { value: 'positive_bilateral', label: 'Positive bilateral' },
            ],
          },
          { id: 'gait', type: 'text', label: 'Gait / posture notes' },
          { id: 'neuroNotes', type: 'text', label: 'Neurological findings' },
        ],
      },
    ],
  },
  senior_review_v0: {
    formId: 'navayu.senior.review',
    version: 'admin-v1',
    label: 'Senior Review',
    sections: [
      {
        id: 'pathway',
        label: 'Pathway decision',
        fields: [
          {
            id: 'pathwayDecision',
            type: 'select',
            label: 'Recommended pathway',
            required: true,
            options: [
              { value: 'conservative', label: 'Conservative / physiotherapy' },
              { value: 'interventional', label: 'Interventional (injection)' },
              { value: 'surgical_consult', label: 'Surgical consult' },
              { value: 'regenerative', label: 'Regenerative protocol' },
            ],
          },
          { id: 'confirmedDiagnosis', type: 'text', label: 'Confirmed diagnosis' },
          { id: 'seniorNotes', type: 'text', label: 'Senior notes' },
        ],
      },
    ],
  },
  investigations_v0: {
    formId: 'navayu.investigations',
    version: 'admin-v1',
    label: 'Investigations Upload',
    sections: [
      {
        id: 'imaging',
        label: 'Imaging',
        fields: [
          { id: 'mriUpload', type: 'file', label: 'MRI', accept: 'image/*,.pdf' },
          { id: 'xrayUpload', type: 'file', label: 'X-ray', accept: 'image/*,.pdf' },
        ],
      },
    ],
  },
  consultation_vitals_v0: {
    formId: 'opd.consultation.vitals',
    version: 'admin-v1',
    label: 'OPD Consultation Vitals',
    sections: [
      {
        id: 'vitals',
        label: 'Vitals',
        fields: [
          { id: 'bp', type: 'text', label: 'BP' },
          { id: 'spo2', type: 'number', label: 'SPO2 (%)', min: 0, max: 100 },
          { id: 'temp', type: 'number', label: 'Temp (F)' },
          { id: 'pulse', type: 'number', label: 'Pulse' },
          { id: 'rr', type: 'number', label: 'Resp Rate' },
          { id: 'weight', type: 'number', label: 'Weight (kg)' },
          { id: 'height', type: 'number', label: 'Height (cm)' },
          { id: 'bmi', type: 'number', label: 'BMI' },
          { id: 'sugar', type: 'number', label: 'Sugar/RBS' },
        ],
      },
    ],
  },
  consultation_complaints_v0: {
    formId: 'opd.consultation.complaints',
    version: 'admin-v1',
    label: 'Chief Complaints',
    sections: [
      {
        id: 'complaints',
        label: 'Complaints',
        fields: [
          {
            id: 'quickComplaint',
            type: 'select',
            label: 'Quick complaint',
            options: [
              { value: 'Low back pain', label: 'Low back pain' },
              { value: 'Neck pain', label: 'Neck pain' },
              { value: 'Knee pain', label: 'Knee pain' },
              { value: 'Shoulder pain', label: 'Shoulder pain' },
              { value: 'Radiating leg pain', label: 'Radiating leg pain' },
              { value: 'Numbness / tingling', label: 'Numbness / tingling' },
              { value: 'Difficulty walking', label: 'Difficulty walking' },
              { value: 'Posture imbalance', label: 'Posture imbalance' },
              { value: 'Sports injury', label: 'Sports injury' },
              { value: 'Follow-up review', label: 'Follow-up review' },
            ],
          },
          { id: 'duration', type: 'text', label: 'Duration' },
          {
            id: 'severity',
            type: 'select',
            label: 'Severity',
            options: [
              { value: 'mild', label: 'Mild' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'severe', label: 'Severe' },
            ],
          },
        ],
      },
    ],
  },
  appointment_booking_v0: {
    formId: 'reception.appointment.booking',
    version: 'admin-v1',
    label: 'Book Appointment',
    sections: [
      {
        id: 'booking',
        label: 'Appointment details',
        fields: [
          { id: 'patientUhid', type: 'text', label: 'Patient UHID', required: true },
          { id: 'patientName', type: 'text', label: 'Patient Name', required: true },
          { id: 'phone', type: 'text', label: 'Phone', required: true },
          { id: 'department', type: 'select', label: 'Department', required: true },
          { id: 'doctor', type: 'select', label: 'Doctor', required: true },
          { id: 'date', type: 'text', label: 'Date', required: true },
          { id: 'time', type: 'select', label: 'Time', required: true },
          { id: 'duration', type: 'select', label: 'Duration', required: true },
          { id: 'notes', type: 'text', label: 'Notes' },
        ],
      },
    ],
  },
  reception_walkin_v0: {
    formId: 'reception.walkin.checkin',
    version: 'admin-v1',
    label: 'Walk-in Check-in',
    sections: [
      {
        id: 'walkin',
        label: 'Walk-in token',
        fields: [
          { id: 'name', type: 'text', label: 'Patient name', required: true },
          { id: 'age', type: 'number', label: 'Age' },
          { id: 'gender', type: 'select', label: 'Gender', options: [{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }, { value: 'O', label: 'Other' }] },
          { id: 'phone', type: 'text', label: 'Phone', required: true },
          { id: 'department', type: 'select', label: 'Department' },
          { id: 'doctor', type: 'select', label: 'Doctor' },
          { id: 'notes', type: 'text', label: 'Notes' },
        ],
      },
    ],
  },
  billing_invoice_v0: {
    formId: 'billing.invoice',
    version: 'admin-v1',
    label: 'Billing Invoice',
    sections: [
      {
        id: 'invoice',
        label: 'Invoice',
        fields: [
          { id: 'patient', type: 'text', label: 'Patient', required: true },
          { id: 'uhid', type: 'text', label: 'UHID', required: true },
          { id: 'category', type: 'select', label: 'Category', required: true, options: [{ value: 'OPD', label: 'OPD' }, { value: 'IPD', label: 'IPD' }, { value: 'Emergency', label: 'Emergency' }, { value: 'Lab', label: 'Lab' }, { value: 'Radiology', label: 'Radiology' }, { value: 'Package', label: 'Package' }] },
          { id: 'service', type: 'text', label: 'Service', required: true },
          { id: 'qty', type: 'number', label: 'Qty', min: 1 },
          { id: 'rate', type: 'number', label: 'Rate' },
          { id: 'tax', type: 'number', label: 'Tax %' },
        ],
      },
    ],
  },
};

const ROLE_KEYS = Object.keys(ROLE_LABELS) as UserRole[];

function buildDefaultNavigation(): Record<UserRole, Record<string, TenantNavigationItemConfig>> {
  return ROLE_KEYS.reduce((result, role) => {
    result[role] = ROLE_TABS[role].reduce<Record<string, TenantNavigationItemConfig>>((tabs, tab) => {
      tabs[tab.key] = {
        label: tab.label,
        visible: true,
      };
      return tabs;
    }, {});
    return result;
  }, {} as Record<UserRole, Record<string, TenantNavigationItemConfig>>);
}

function buildDefaultRoles(): Record<UserRole, TenantRoleConfig> {
  return ROLE_KEYS.reduce((result, role) => {
    result[role] = {
      label: ROLE_LABELS[role],
      description: DEFAULT_ROLE_DESCRIPTIONS[role],
      enabled: true,
    };
    return result;
  }, {} as Record<UserRole, TenantRoleConfig>);
}

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  branding: {
    platformName: 'Adrine Hospital Operating System',
    platformMark: 'ADRINE.',
    productDescriptor: 'Hospital Operating System',
    organizationName: 'Adrine Multi-Specialty Hospital',
    organizationShortName: 'Adrine',
    supportEmail: 'admin@adrine.hospital',
    supportPhone: '+91 79 2654 7890',
    address: '123 Healthcare Avenue, Satellite, Ahmedabad, Gujarat 380015',
    loginHeadline: 'Secure Demo Environment',
    loginSubheadline: 'Role-based launch workspace for every hospital team',
  },
  roles: buildDefaultRoles(),
  navigation: buildDefaultNavigation(),
  featureFlags: {
    whiteLabelMode: false,
    telemedicineEnabled: true,
    patientRelationsEnabled: true,
    formBuilderEnabled: true,
    customFieldsEnabled: true,
    workflowDesignerEnabled: true,
    apiAccessEnabled: false,
  },
  registration: {
    departments: DEFAULT_REGISTRATION_DEPARTMENTS,
    patientTypes: DEFAULT_REGISTRATION_PATIENT_TYPES,
  },
  forms: DEFAULT_FORM_TEMPLATES,
  dynamicForms: DEFAULT_DYNAMIC_FORMS,
  masterData: DEFAULT_MASTER_DATA,
  integrations: {
    twentyCrm: {
      enabled: false,
      embedMode: true,
      fullApp: true,
    },
  },
};

/** Primary mark in app chrome (navbar). Platform brand unless tenant white-labels. */
export function getHeaderBrandMark(settings: TenantSettings): string {
  return settings.featureFlags.whiteLabelMode
    ? settings.branding.organizationShortName
    : settings.branding.platformMark;
}

export function getDocumentTitle(settings: TenantSettings): string {
  return settings.featureFlags.whiteLabelMode
    ? settings.branding.organizationName
    : settings.branding.platformName;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function getString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function getStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const seen = new Set<string>();
  const normalized = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => {
      if (!item) {
        return false;
      }

      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

  return normalized.length > 0 ? normalized : fallback;
}

function resolveJourneyType(value: unknown): RegistrationJourneyType | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return REGISTRATION_JOURNEY_OPTIONS.find((option) => option.toLowerCase() === normalized) ?? null;
}

function inferJourneyTypeFromLabel(label: string): RegistrationJourneyType {
  return resolveJourneyType(label) ?? 'OPD';
}

function coercePatientTypeOptions(value: unknown, fallback: TenantPatientTypeOption[]): TenantPatientTypeOption[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const seen = new Set<string>();
  const normalized: TenantPatientTypeOption[] = [];

  value.forEach((item) => {
    if (typeof item === 'string') {
      const label = item.trim();
      if (!label) {
        return;
      }

      const key = label.toLowerCase();
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      normalized.push({
        label,
        journeyType: inferJourneyTypeFromLabel(label),
      });
      return;
    }

    const source = asRecord(item);
    const label = typeof source.label === 'string' ? source.label.trim() : '';
    if (!label) {
      return;
    }

    const key = label.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    normalized.push({
      label,
      journeyType: resolveJourneyType(source.journeyType) ?? inferJourneyTypeFromLabel(label),
    });
  });

  return normalized.length > 0 ? normalized : fallback;
}

function coerceFormTemplates(value: unknown, fallback: TenantFormTemplates): TenantFormTemplates {
  const source = asRecord(value);
  return (Object.keys(fallback) as TenantFormTemplateKey[]).reduce((result, key) => {
    const templateSource = asRecord(source[key]);
    result[key] = {
      label: getString(templateSource.label, fallback[key].label),
      fields: getStringArray(templateSource.fields, fallback[key].fields),
    };
    return result;
  }, {} as TenantFormTemplates);
}

const DYNAMIC_FIELD_TYPES: TenantDynamicFormFieldType[] = [
  'text',
  'number',
  'email',
  'date',
  'time',
  'select',
  'multiselect',
  'boolean',
  'calculator',
  'pain_map',
  'file',
];

function coerceDynamicField(value: unknown): TenantDynamicFormField | null {
  const source = asRecord(value);
  const id = getString(source.id, '').trim();
  const label = getString(source.label, '').trim();
  const rawType = getString(source.type, 'text') as TenantDynamicFormFieldType;
  if (!id || !label) return null;
  const type = DYNAMIC_FIELD_TYPES.includes(rawType) ? rawType : 'text';
  const options = Array.isArray(source.options)
    ? source.options
        .map((option) => {
          const opt = asRecord(option);
          const value = getString(opt.value, '').trim();
          const label = getString(opt.label, '').trim();
          return value && label ? { value, label } : null;
        })
        .filter((option): option is TenantDynamicFormOption => option !== null)
    : undefined;
  return {
    id,
    label,
    type,
    ...(typeof source.required === 'boolean' ? { required: source.required } : {}),
    ...(typeof source.min === 'number' ? { min: source.min } : {}),
    ...(typeof source.max === 'number' ? { max: source.max } : {}),
    ...(typeof source.calculatorId === 'string' ? { calculatorId: source.calculatorId } : {}),
    ...(typeof source.accept === 'string' ? { accept: source.accept } : {}),
    ...(options?.length ? { options } : {}),
  };
}

function coerceDynamicForms(value: unknown, fallback: TenantDynamicForms): TenantDynamicForms {
  const source = asRecord(value);
  const keys = new Set([...Object.keys(fallback), ...Object.keys(source)]);
  const result: TenantDynamicForms = {};
  keys.forEach((key) => {
    const formSource = asRecord(source[key]);
    const fallbackForm = fallback[key];
    const formId = getString(formSource.formId, fallbackForm?.formId ?? key).trim();
    const version = getString(formSource.version, fallbackForm?.version ?? 'admin-v1').trim();
    const label = getString(formSource.label, fallbackForm?.label ?? key).trim();
    const sourceSections = Array.isArray(formSource.sections) ? formSource.sections : fallbackForm?.sections ?? [];
    const sections = sourceSections
      .map((section) => {
        const sectionSource = asRecord(section);
        const id = getString(sectionSource.id, '').trim();
        const label = getString(sectionSource.label, '').trim();
        const fields = Array.isArray(sectionSource.fields)
          ? sectionSource.fields.map(coerceDynamicField).filter((field): field is TenantDynamicFormField => field !== null)
          : [];
        return id && label && fields.length ? { id, label, fields } : null;
      })
      .filter((section): section is TenantDynamicFormSection => section !== null);
    if (formId && label && sections.length) {
      result[key] = { formId, version, label, sections };
    }
  });
  return Object.keys(result).length ? result : fallback;
}

export function coerceTenantSettings(input: unknown): TenantSettings {
  const source = asRecord(input);
  const brandingSource = asRecord(source.branding);
  const rolesSource = asRecord(source.roles);
  const navigationSource = asRecord(source.navigation);
  const featureSource = asRecord(source.featureFlags);
  const registrationSource = asRecord(source.registration);
  const formsSource = asRecord(source.forms);
  const dynamicFormsSource = asRecord(source.dynamicForms);

  const roles = ROLE_KEYS.reduce((result, role) => {
    const roleDefaults = DEFAULT_TENANT_SETTINGS.roles[role];
    const roleSource = asRecord(rolesSource[role]);
    result[role] = {
      label: getString(roleSource.label, roleDefaults.label),
      description: getString(roleSource.description, roleDefaults.description),
      enabled: getBoolean(roleSource.enabled, roleDefaults.enabled),
    };
    return result;
  }, {} as Record<UserRole, TenantRoleConfig>);

  const navigation = ROLE_KEYS.reduce((result, role) => {
    const roleSource = asRecord(navigationSource[role]);
    result[role] = ROLE_TABS[role].reduce<Record<string, TenantNavigationItemConfig>>((tabs, tab) => {
      const tabDefaults = DEFAULT_TENANT_SETTINGS.navigation[role][tab.key];
      const tabSource = asRecord(roleSource[tab.key]);
      tabs[tab.key] = {
        label: getString(tabSource.label, tabDefaults.label),
        visible: getBoolean(tabSource.visible, tabDefaults.visible),
      };
      return tabs;
    }, {});
    return result;
  }, {} as Record<UserRole, Record<string, TenantNavigationItemConfig>>);

  const featureFlags = (Object.keys(DEFAULT_TENANT_SETTINGS.featureFlags) as TenantFeatureFlag[]).reduce(
    (result, flag) => {
      result[flag] = getBoolean(featureSource[flag], DEFAULT_TENANT_SETTINGS.featureFlags[flag]);
      return result;
    },
    {} as Record<TenantFeatureFlag, boolean>,
  );

  const registration = {
    departments: getStringArray(registrationSource.departments, DEFAULT_TENANT_SETTINGS.registration.departments),
    patientTypes: coercePatientTypeOptions(registrationSource.patientTypes, DEFAULT_TENANT_SETTINGS.registration.patientTypes),
  };

  const forms = coerceFormTemplates(formsSource, DEFAULT_TENANT_SETTINGS.forms);
  const dynamicForms = coerceDynamicForms(dynamicFormsSource, DEFAULT_TENANT_SETTINGS.dynamicForms);
  const navProfiles = coerceNavProfiles(source.navProfiles);
  const masterDataSource = asRecord(source.masterData);
  const masterData = coerceMasterData({
    doctorDepartments: getStringArray(
      masterDataSource.doctorDepartments,
      DEFAULT_TENANT_SETTINGS.masterData?.doctorDepartments ?? DEFAULT_MASTER_DATA.doctorDepartments,
    ),
    expenseCategories: getStringArray(
      masterDataSource.expenseCategories,
      DEFAULT_TENANT_SETTINGS.masterData?.expenseCategories ?? DEFAULT_MASTER_DATA.expenseCategories,
    ),
    roleDepartments: coerceRoleDepartments(masterDataSource.roleDepartments),
    adminDashboardSections: getStringArray(
      masterDataSource.adminDashboardSections,
      DEFAULT_TENANT_SETTINGS.masterData?.adminDashboardSections ?? DEFAULT_MASTER_DATA.adminDashboardSections,
    ),
    opdDepartments: coerceMasterData({
      opdDepartments: masterDataSource.opdDepartments,
    } as Partial<TenantMasterData>).opdDepartments,
    opdDepartmentDoctors: coerceMasterData({
      opdDepartmentDoctors: masterDataSource.opdDepartmentDoctors,
    } as Partial<TenantMasterData>).opdDepartmentDoctors,
  });
  const integrationsSource = asRecord(source.integrations);
  const twentySource = asRecord(integrationsSource.twentyCrm);
  const defaultTwenty = DEFAULT_TENANT_SETTINGS.integrations?.twentyCrm;
  const integrations: TenantIntegrations = {
    twentyCrm: {
      enabled: getBoolean(twentySource.enabled, defaultTwenty?.enabled ?? false),
      baseUrl: getString(twentySource.baseUrl, defaultTwenty?.baseUrl ?? ''),
      workspaceSubdomain: getString(
        twentySource.workspaceSubdomain,
        defaultTwenty?.workspaceSubdomain ?? '',
      ) || undefined,
      workspaceUrl: getString(twentySource.workspaceUrl, defaultTwenty?.workspaceUrl ?? '') || undefined,
      embedMode: getBoolean(twentySource.embedMode, defaultTwenty?.embedMode ?? true),
      fullApp: getBoolean(twentySource.fullApp, defaultTwenty?.fullApp ?? true),
    },
  };

  return {
    branding: {
      platformName: getString(brandingSource.platformName, DEFAULT_TENANT_SETTINGS.branding.platformName),
      platformMark: getString(brandingSource.platformMark, DEFAULT_TENANT_SETTINGS.branding.platformMark),
      productDescriptor: getString(brandingSource.productDescriptor, DEFAULT_TENANT_SETTINGS.branding.productDescriptor),
      organizationName: getString(brandingSource.organizationName, DEFAULT_TENANT_SETTINGS.branding.organizationName),
      organizationShortName: getString(brandingSource.organizationShortName, DEFAULT_TENANT_SETTINGS.branding.organizationShortName),
      supportEmail: getString(brandingSource.supportEmail, DEFAULT_TENANT_SETTINGS.branding.supportEmail),
      supportPhone: getString(brandingSource.supportPhone, DEFAULT_TENANT_SETTINGS.branding.supportPhone),
      address: getString(brandingSource.address, DEFAULT_TENANT_SETTINGS.branding.address),
      loginHeadline: getString(brandingSource.loginHeadline, DEFAULT_TENANT_SETTINGS.branding.loginHeadline),
      loginSubheadline: getString(brandingSource.loginSubheadline, DEFAULT_TENANT_SETTINGS.branding.loginSubheadline),
    },
    roles,
    navigation,
    featureFlags,
    registration,
    forms,
    dynamicForms,
    masterData,
    navProfiles,
    integrations,
  };
}

function coerceRoleDepartments(value: unknown): Record<string, string[]> {
  const source = asRecord(value);
  const result = { ...(DEFAULT_TENANT_SETTINGS.masterData?.roleDepartments ?? DEFAULT_MASTER_DATA.roleDepartments) };
  Object.entries(source).forEach(([role, departments]) => {
    if (Array.isArray(departments)) {
      const normalized = departments
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean);
      if (normalized.length > 0) {
        result[role] = normalized;
      }
    }
  });
  return result;
}

function coerceNavProfiles(value: unknown): Record<string, NavProfile> | undefined {
  const source = asRecord(value);
  const keys = Object.keys(source);
  if (!keys.length) {
    return undefined;
  }

  const profiles: Record<string, NavProfile> = {};
  keys.forEach((key) => {
    const profileSource = asRecord(source[key]);
    const matchSource = asRecord(profileSource.match);
    const patchesSource = asRecord(profileSource.navigationPatches);
    const allowedRoutePrefixes = Array.isArray(profileSource.allowedRoutePrefixes)
      ? profileSource.allowedRoutePrefixes.filter((item): item is string => typeof item === 'string')
      : undefined;

    const navigationPatches = Object.keys(patchesSource).reduce<
      Partial<Record<UserRole, Record<string, Partial<TenantNavigationItemConfig>>>>
    >((result, roleKey) => {
      if (!ROLE_KEYS.includes(roleKey as UserRole)) {
        return result;
      }
      const rolePatchSource = asRecord(patchesSource[roleKey]);
      result[roleKey as UserRole] = Object.keys(rolePatchSource).reduce<
        Record<string, Partial<TenantNavigationItemConfig>>
      >((tabs, tabKey) => {
        const tabPatch = asRecord(rolePatchSource[tabKey]);
        tabs[tabKey] = {
          ...(typeof tabPatch.label === 'string' ? { label: tabPatch.label } : {}),
          ...(typeof tabPatch.visible === 'boolean' ? { visible: tabPatch.visible } : {}),
        };
        return tabs;
      }, {});
      return result;
    }, {});

    profiles[key] = {
      match: {
        ...(typeof matchSource.role === 'string' && ROLE_KEYS.includes(matchSource.role as UserRole)
          ? { role: matchSource.role as UserRole }
          : {}),
        ...(typeof matchSource.department === 'string' ? { department: matchSource.department } : {}),
        ...(typeof matchSource.emailPattern === 'string' ? { emailPattern: matchSource.emailPattern } : {}),
        ...(typeof matchSource.namePattern === 'string' ? { namePattern: matchSource.namePattern } : {}),
      },
      ...(Object.keys(navigationPatches).length ? { navigationPatches } : {}),
      ...(allowedRoutePrefixes?.length ? { allowedRoutePrefixes } : {}),
    };
  });

  return profiles;
}
