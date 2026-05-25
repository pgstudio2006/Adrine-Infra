/**
 * Journey-first navigation overlays.
 * Merges with legacy ROLE_TABS in Hospital OS — operational groups appear first.
 */

import type { NavGroup } from '../types.js';

type RoleKey =
  | 'admin'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'lab_technician'
  | 'pharmacist'
  | 'billing'
  | 'radiologist'
  | 'ot_coordinator'
  | 'inventory_manager'
  | 'emergency'
  | 'hr_manager'
  | 'scheduler'
  | 'dialysis_tech'
  | 'crm_manager';

/** Operational groups prepended to role menus (order matters). */
export const OPERATIONAL_NAV_BY_ROLE: Partial<Record<RoleKey, NavGroup[]>> = {
  receptionist: [
    {
      id: 'opd-flow',
      label: 'OPD flow (in order)',
      journeyId: 'front_desk_spine',
      items: [
        { key: 'flow-hub', label: 'Flow hub', path: '/reception/flow', stepId: 'register' },
        { key: 'registration', label: '1. Registration', path: '/reception/registration', stepId: 'register' },
        { key: 'appointments', label: '2. Appointments', path: '/reception/appointments', stepId: 'schedule' },
        { key: 'checkin', label: '3. Check-in', path: '/reception/checkin', stepId: 'checkin' },
        { key: 'queue', label: '4. Queue / token', path: '/reception/queue', stepId: 'queue' },
        { key: 'billing', label: '5. Billing', path: '/reception/billing', stepId: 'billing_exit' },
      ],
    },
    {
      id: 'ipd-access',
      label: 'IPD & beds',
      journeyId: 'ipd_spine',
      items: [
        { key: 'ipd', label: 'Admissions', path: '/reception/ipd', stepId: 'admit_request' },
        { key: 'beds', label: 'Bed board', path: '/reception/beds' },
      ],
    },
  ],
  doctor: [
    {
      id: 'clinical-opd',
      label: 'OPD clinical',
      journeyId: 'clinical_opd_spine',
      items: [
        { key: 'queue', label: '1. Queue', path: '/doctor/queue', stepId: 'queue' },
        { key: 'patients', label: '2. Patients / consult', path: '/doctor/patients', stepId: 'consult' },
        { key: 'labs', label: '3. Lab results', path: '/doctor/labs', stepId: 'orders' },
        { key: 'radiology', label: '4. Radiology', path: '/doctor/radiology', stepId: 'orders' },
      ],
    },
    {
      id: 'clinical-ipd',
      label: 'IPD',
      journeyId: 'ipd_spine',
      items: [
        { key: 'ipd', label: 'Inpatients', path: '/doctor/ipd', stepId: 'doctor_rounds' },
      ],
    },
  ],
  nurse: [
    {
      id: 'nursing-ipd',
      label: 'Ward operations',
      journeyId: 'ipd_spine',
      items: [
        { key: 'ward', label: 'Ward board', path: '/nurse/ward', stepId: 'nursing' },
        { key: 'vitals', label: 'Vitals', path: '/nurse/vitals' },
        { key: 'medications', label: 'Medications', path: '/nurse/medications' },
        { key: 'discharge', label: 'Discharge prep', path: '/nurse/discharge', stepId: 'discharge_ready' },
      ],
    },
  ],
  admin: [
    {
      id: 'command',
      label: 'Operations command',
      items: [
        { key: 'command-center', label: 'Command center', path: '/admin/command-center' },
        { key: 'approvals', label: 'Approvals', path: '/admin/approvals' },
        { key: 'staff', label: 'Staff', path: '/admin/staff' },
        { key: 'audit', label: 'Audit', path: '/admin/audit' },
      ],
    },
    {
      id: 'config',
      label: 'Tenant configuration',
      items: [
        { key: 'settings', label: 'Settings & forms', path: '/admin/settings' },
      ],
    },
  ],
  lab_technician: [
    {
      id: 'lab-flow',
      label: 'Lab pipeline',
      items: [
        { key: 'worklist', label: '1. Worklist', path: '/lab/worklist' },
        { key: 'samples', label: '2. Samples', path: '/lab/samples' },
        { key: 'entry', label: '3. Entry', path: '/lab/entry' },
        { key: 'verification', label: '4. Verification', path: '/lab/verification' },
        { key: 'reports', label: '5. Release', path: '/lab/reports' },
      ],
    },
  ],
  pharmacist: [
    {
      id: 'rx-flow',
      label: 'Dispensing pipeline',
      items: [
        { key: 'prescriptions', label: '1. Prescriptions', path: '/pharmacy/prescriptions' },
        { key: 'inventory', label: '2. Stock', path: '/pharmacy/inventory' },
        { key: 'schedule-h', label: '3. Compliance', path: '/pharmacy/schedule-h' },
      ],
    },
  ],
  billing: [
    {
      id: 'revenue',
      label: 'Revenue cycle',
      items: [
        { key: 'invoices', label: 'Invoices', path: '/billing-dept/invoices' },
        { key: 'payments', label: 'Payments', path: '/billing-dept/payments' },
        { key: 'insurance', label: 'Insurance', path: '/billing-dept/insurance' },
        { key: 'pre-auth', label: 'Pre-auth wizard', path: '/billing-dept/pre-auth' },
        { key: 'tpa-charges', label: 'TPA', path: '/billing-dept/tpa-charges' },
        { key: 'reconciliation', label: 'Day-end reconcile', path: '/billing-dept/reconciliation' },
        { key: 'ipd-billing', label: 'IPD billing', path: '/billing-dept/ipd-billing' },
      ],
    },
  ],
  emergency: [
    {
      id: 'ed-flow',
      label: 'Emergency spine',
      journeyId: 'emergency_spine',
      items: [
        { key: 'triage', label: '1. Triage', path: '/emergency/triage', stepId: 'triage' },
        { key: 'cases', label: '2. Cases', path: '/emergency/cases' },
        { key: 'treatment', label: '3. Treatment', path: '/emergency/treatment', stepId: 'treat' },
      ],
    },
  ],
};

/** Filter nav items when platform module entitlements disable a path prefix. */
export function filterNavByModules(
  groups: NavGroup[],
  entitlements: Record<string, boolean>,
): NavGroup[] {
  const pathModule: Record<string, string> = {
    '/lab': 'lims',
    '/pharmacy': 'pharmacy',
    '/billing-dept/insurance': 'insurance',
    '/doctor/ipd': 'ipd',
    '/nurse': 'ipd',
    '/reception/ipd': 'ipd',
  };

  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        const key = Object.entries(pathModule).find(([prefix]) => item.path.startsWith(prefix))?.[1];
        if (!key) return true;
        return entitlements[key] !== false;
      }),
    }))
    .filter((g) => g.items.length > 0);
}
