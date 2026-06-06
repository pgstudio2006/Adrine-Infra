/**
 * Authoritative tab allow-lists for Navayu branch packs.
 * Every ROLE_TABS key must appear in generated navigation with explicit visible flag.
 */
import { ROLE_TABS } from '../apps/hospital-os/src/config/roleNavigation.ts';
import type { UserRole } from '../apps/hospital-os/src/types/roles.ts';

export type BranchPackCode = 'gurgaon' | 'pataudi';

const ALL_ROLES = Object.keys(ROLE_TABS) as UserRole[];

function allTabKeys(role: UserRole): string[] {
  return ROLE_TABS[role].map((tab) => tab.key);
}

function buildRoleNavigation(role: UserRole, enabledKeys: string[]) {
  const enabled = new Set(enabledKeys);
  return Object.fromEntries(
    allTabKeys(role).map((key) => [key, { visible: enabled.has(key) }]),
  );
}

function buildDisabledRoleNavigation(role: UserRole) {
  return Object.fromEntries(allTabKeys(role).map((key) => [key, { visible: false }]));
}

const GURGAON_ROLE_ENABLED: UserRole[] = [
  'admin',
  'doctor',
  'jr_doctor',
  'nurse',
  'receptionist',
  'pharmacist',
  'billing',
  'crm_manager',
];

const PATAUDI_ROLE_ENABLED: UserRole[] = [
  'admin',
  'doctor',
  'nurse',
  'receptionist',
  'pharmacist',
  'billing',
  'lab_technician',
];

const GURGAON_ADMIN_TABS = allTabKeys('admin');

const GURGAON_DOCTOR_TABS = ['dashboard', 'patients', 'queue', 'ipd', 'schedule', 'analytics'];

const GURGAON_JR_DOCTOR_TABS = ['dashboard', 'queue', 'patients'];

const GURGAON_PHARMACY_TABS = [
  'dashboard',
  'prescriptions',
  'inventory',
  'drugs',
  'reports',
  'billing',
  'schedule-h',
  'purchase',
  'queries',
  'suppliers',
  'indent',
  'returns',
];

const GURGAON_RECEPTION_TABS = [
  'dashboard',
  'flow-hub',
  'registration',
  'appointments',
  'checkin',
  'queue',
  'billing',
  'ipd',
  'visitors',
  'handover',
  'feedback',
  'enquiries',
];

const GURGAON_NURSE_TABS = [
  'dashboard',
  'ward',
  'vitals',
  'medications',
  'discharge',
  'shift',
  'task-board',
  'admissions',
  'orders',
  'assessments',
  'io',
  'reports',
];

const GURGAON_CRM_TABS = [
  'dashboard',
  'leads',
  'lifecycle',
  'campaigns',
  'drip-campaigns',
  'experience',
  'reports',
];

const GURGAON_COUNSELLOR_BILLING_TABS = ['dashboard', 'packages', 'counselling', 'revenue'];

const PATAUDI_ADMIN_TABS = [
  'dashboard',
  'staff',
  'audit',
  'settings',
  'mis',
];

const PATAUDI_DOCTOR_TABS = allTabKeys('doctor');
const PATAUDI_NURSE_TABS = allTabKeys('nurse');
const PATAUDI_RECEPTION_TABS = allTabKeys('receptionist');
const PATAUDI_PHARMACY_TABS = [
  'dashboard',
  'prescriptions',
  'inventory',
  'drugs',
  'reports',
  'billing',
  'purchase',
  'queries',
  'suppliers',
  'indent',
  'returns',
];
const PATAUDI_LAB_TABS = allTabKeys('lab_technician');
const PATAUDI_BILLING_TABS = [
  'dashboard',
  'invoices',
  'payments',
  'ipd-billing',
  'packages',
  'revenue',
  'insurance',
  'reports',
  'charge-master',
  'cashier',
];

function buildRoles(enabled: UserRole[], labels: Partial<Record<UserRole, { label: string; description: string }>>) {
  return Object.fromEntries(
    ALL_ROLES.map((role) => {
      const isEnabled = enabled.includes(role);
      const custom = labels[role];
      return [
        role,
        {
          label: custom?.label ?? role,
          description: custom?.description ?? '',
          enabled: isEnabled,
        },
      ];
    }),
  );
}

function buildNavigationForBranch(
  enabledRoles: UserRole[],
  tabMap: Partial<Record<UserRole, string[]>>,
) {
  const navigation: Record<string, Record<string, { visible: boolean }>> = {};
  for (const role of ALL_ROLES) {
    if (!enabledRoles.includes(role)) {
      navigation[role] = buildDisabledRoleNavigation(role);
      continue;
    }
    navigation[role] = buildRoleNavigation(role, tabMap[role] ?? []);
  }
  return navigation;
}

export function buildGurgaonPack() {
  return {
    roles: buildRoles(GURGAON_ROLE_ENABLED, {
      admin: { label: 'Administrator', description: 'Navayu Gurgaon MSK admin suite' },
      doctor: { label: 'Doctor', description: 'Senior MSK consult, AI summary, protocol mapping' },
      jr_doctor: { label: 'Junior Doctor', description: 'MSK intake, exam and investigations' },
      nurse: { label: 'Nurse', description: 'Ward care, vitals, medications' },
      receptionist: { label: 'Reception', description: 'Registration, queue, front-desk billing' },
      pharmacist: { label: 'Pharmacist', description: 'Dispensing and pharmacy inventory' },
      billing: { label: 'Counsellor / Packages', description: 'Treatment packages and revenue proposals' },
      crm_manager: { label: 'CRM & Counselling', description: 'Leads, lifecycle, referral analytics' },
      lab_technician: { label: 'Lab Technician', description: 'Disabled at Gurgaon center' },
      radiologist: { label: 'Radiologist', description: 'Disabled at Gurgaon center' },
      ot_coordinator: { label: 'OT Coordinator', description: 'Disabled at Gurgaon center' },
      inventory_manager: { label: 'Inventory Manager', description: 'Disabled at Gurgaon center' },
      emergency: { label: 'Emergency / ER', description: 'Disabled at Gurgaon center' },
      hr_manager: { label: 'HR & Staff', description: 'Disabled at Gurgaon center' },
      scheduler: { label: 'Scheduling', description: 'Disabled at Gurgaon center' },
      dialysis_tech: { label: 'Dialysis Unit', description: 'Disabled at Gurgaon center' },
    }),
    navigation: buildNavigationForBranch(GURGAON_ROLE_ENABLED, {
      admin: GURGAON_ADMIN_TABS,
      doctor: GURGAON_DOCTOR_TABS,
      jr_doctor: GURGAON_JR_DOCTOR_TABS,
      nurse: GURGAON_NURSE_TABS,
      receptionist: GURGAON_RECEPTION_TABS,
      pharmacist: GURGAON_PHARMACY_TABS,
      billing: GURGAON_COUNSELLOR_BILLING_TABS,
      crm_manager: GURGAON_CRM_TABS,
    }),
    featureFlags: {
      whiteLabelMode: false,
      telemedicineEnabled: false,
      patientRelationsEnabled: true,
      formBuilderEnabled: true,
      customFieldsEnabled: true,
      workflowDesignerEnabled: false,
      apiAccessEnabled: false,
    },
    navProfiles: {
      counsellor: {
        match: { role: 'billing', emailPattern: 'counsellor@' },
        navigationPatches: {
          billing: Object.fromEntries(
            allTabKeys('billing').map((key) => [
              key,
              { visible: GURGAON_COUNSELLOR_BILLING_TABS.includes(key) },
            ]),
          ),
        },
        allowedRoutePrefixes: ['/crm'],
      },
    },
  };
}

export function buildPataudiPack() {
  return {
    roles: buildRoles(PATAUDI_ROLE_ENABLED, {
      admin: { label: 'Administrator', description: 'Pataudi mini-hospital admin' },
      doctor: { label: 'Doctor', description: 'OPD, IPD, labs, radiology' },
      nurse: { label: 'Nurse', description: 'Ward and bedside care' },
      receptionist: { label: 'Reception', description: 'Registration and front desk' },
      pharmacist: { label: 'Pharmacist', description: 'Pharmacy dispensing' },
      billing: { label: 'Billing & Finance', description: 'Hospital billing operations' },
      lab_technician: { label: 'Lab Technician', description: 'LIMS worklists and verification' },
      crm_manager: { label: 'CRM & Patient Relations', description: 'Disabled at Pataudi' },
      ot_coordinator: { label: 'OT Coordinator', description: 'Disabled at Pataudi' },
      hr_manager: { label: 'HR & Staff', description: 'Disabled at Pataudi' },
      scheduler: { label: 'Scheduling', description: 'Disabled at Pataudi' },
      dialysis_tech: { label: 'Dialysis Unit', description: 'Disabled at Pataudi' },
      radiologist: { label: 'Radiologist', description: 'Disabled at Pataudi' },
      inventory_manager: { label: 'Inventory Manager', description: 'Disabled at Pataudi' },
      emergency: { label: 'Emergency / ER', description: 'Disabled at Pataudi' },
    }),
    navigation: buildNavigationForBranch(PATAUDI_ROLE_ENABLED, {
      admin: PATAUDI_ADMIN_TABS,
      doctor: PATAUDI_DOCTOR_TABS,
      nurse: PATAUDI_NURSE_TABS,
      receptionist: PATAUDI_RECEPTION_TABS,
      pharmacist: PATAUDI_PHARMACY_TABS,
      lab_technician: PATAUDI_LAB_TABS,
      billing: PATAUDI_BILLING_TABS,
    }),
    featureFlags: {
      whiteLabelMode: false,
      telemedicineEnabled: false,
      patientRelationsEnabled: false,
      formBuilderEnabled: true,
      customFieldsEnabled: true,
      workflowDesignerEnabled: false,
      apiAccessEnabled: false,
    },
    navProfiles: {},
  };
}

export function buildBranchPack(code: BranchPackCode) {
  return code === 'gurgaon' ? buildGurgaonPack() : buildPataudiPack();
}
