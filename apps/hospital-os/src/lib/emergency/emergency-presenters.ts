import type { EmergencyCase, LabOrder, RadiologyOrder } from '@/stores/hospitalStore';

export const EMERGENCY_STATUS_LABELS: Record<EmergencyCase['status'], string> = {
  'triage-pending': 'Waiting for Triage',
  triaged: 'Waiting for Doctor',
  'in-treatment': 'Under Treatment',
  'under-observation': 'Under Observation',
  'transferred-ipd': 'Transferred to IPD',
  discharged: 'Discharged',
};

export const EMERGENCY_TRIAGE_LABELS: Record<NonNullable<EmergencyCase['triage']>, string> = {
  critical: 'Critical',
  urgent: 'Urgent',
  'semi-urgent': 'Semi-Urgent',
  'non-urgent': 'Non-Urgent',
};

export function isActiveEmergencyCase(caseItem: EmergencyCase): boolean {
  return !['discharged', 'transferred-ipd'].includes(caseItem.status);
}

export function isClosedEmergencyCase(caseItem: EmergencyCase): boolean {
  return ['discharged', 'transferred-ipd'].includes(caseItem.status);
}

export function emergencyCasesForOrders(
  emergencyCases: EmergencyCase[],
  labOrders: LabOrder[],
  radiologyOrders: RadiologyOrder[],
) {
  const activeUhids = new Set(
    emergencyCases.filter(isActiveEmergencyCase).map((c) => c.uhid).filter(Boolean) as string[],
  );
  const activeIds = new Set(emergencyCases.filter(isActiveEmergencyCase).map((c) => c.id));

  const labs = labOrders.filter(
    (o) => activeUhids.has(o.uhid) || o.tests.toLowerCase().includes('emergency'),
  );
  const rads = radiologyOrders.filter((o) => activeUhids.has(o.uhid));

  return { labs, rads, activeUhids, activeIds };
}

export function computeEmergencyDashboardStats(cases: EmergencyCase[]) {
  const active = cases.filter(isActiveEmergencyCase);
  const inTriage = cases.filter((c) => c.status === 'triage-pending' || !c.triage).length;
  const inTreatment = cases.filter((c) => c.status === 'in-treatment').length;
  const critical = cases.filter((c) => c.triage === 'critical').length;

  return {
    activeCases: active.length,
    inTriage,
    inTreatment,
    critical,
  };
}

export function triageDistribution(cases: EmergencyCase[]) {
  const buckets = {
    critical: 0,
    urgent: 0,
    'semi-urgent': 0,
    'non-urgent': 0,
    pending: 0,
  } as const;

  const counts = { ...buckets };
  for (const c of cases) {
    if (!c.triage) counts.pending += 1;
    else counts[c.triage] += 1;
  }
  const total = cases.length || 1;
  return [
    { category: 'Critical (Immediate)', count: counts.critical, percent: Math.round((counts.critical / total) * 100) },
    { category: 'Urgent', count: counts.urgent, percent: Math.round((counts.urgent / total) * 100) },
    { category: 'Semi-Urgent', count: counts['semi-urgent'], percent: Math.round((counts['semi-urgent'] / total) * 100) },
    { category: 'Non-Urgent', count: counts['non-urgent'], percent: Math.round((counts['non-urgent'] / total) * 100) },
  ];
}
