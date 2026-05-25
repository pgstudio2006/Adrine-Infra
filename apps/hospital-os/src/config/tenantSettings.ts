import { ROLE_TABS } from '@/config/roleNavigation';
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

export interface TenantSettings {
  branding: TenantBranding;
  roles: Record<UserRole, TenantRoleConfig>;
  navigation: Record<UserRole, Record<string, TenantNavigationItemConfig>>;
  featureFlags: Record<TenantFeatureFlag, boolean>;
  registration: TenantRegistrationConfig;
  forms: TenantFormTemplates;
}

export const DEFAULT_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full system access and tenant-wide configuration',
  doctor: 'OPD, IPD, prescriptions, orders and clinical workflow',
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
};

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

export function coerceTenantSettings(input: unknown): TenantSettings {
  const source = asRecord(input);
  const brandingSource = asRecord(source.branding);
  const rolesSource = asRecord(source.roles);
  const navigationSource = asRecord(source.navigation);
  const featureSource = asRecord(source.featureFlags);
  const registrationSource = asRecord(source.registration);
  const formsSource = asRecord(source.forms);

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
  };
}
