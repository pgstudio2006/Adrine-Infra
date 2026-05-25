// ── Layer 4: CEO War Room — Strategic Intelligence Engine ──

import type {
  HospitalPatient,
  AdmissionCase,
  BillingInvoice,
  HospitalAppointment,
  QueueEntry,
} from '@/stores/hospitalStore';

import type {
  StrategicIntelligence,
  DemographicBucket,
  ServiceLineRevenue,
  ScoreResult,
  ScoreFactor,
  RetentionSummary,
  ReferralEntry,
  PayerMixEntry,
  CatchmentArea,
  IntelligenceAlert,
} from '../types';

import { AGE_BUCKETS, PAYER_COLORS, DOCTOR_SCORE_WEIGHTS } from '../constants';
import { groupBy, countBy, pct, alertId, clampScore } from '../utils';

// ── Input contract ──
export interface StrategicInput {
  patients: HospitalPatient[];
  admissions: AdmissionCase[];
  invoices: BillingInvoice[];
  appointments: HospitalAppointment[];
  queue: QueueEntry[];
}

// ── Main computation ──
export function computeStrategicIntelligence(input: StrategicInput): StrategicIntelligence {
  const { patients, admissions, invoices, appointments, queue } = input;
  const alerts: IntelligenceAlert[] = [];
  const now = new Date().toISOString();

  // ── 1. Patient demographics ──
  const ageDemographics = computeAgeDemographics(patients);
  const genderDemographics = computeGenderDemographics(patients);
  const categoryDemographics = computeCategoryDemographics(patients);

  // ── 2. Service line revenue ──
  const serviceLineRevenue = computeServiceLineRevenue(invoices);

  // ── 3. Doctor performance ──
  const doctorPerformance = computeDoctorPerformance(admissions, queue);

  // ── 4. Patient retention ──
  const retention = computeRetention(patients);

  // ── 5. Referral network ──
  const referralNetwork = computeReferralNetwork(patients);

  // ── 6. Payer mix ──
  const payerMix = computePayerMix(patients);

  // ── 7. Catchment areas ──
  const catchmentAreas = computeCatchmentAreas(patients);

  // ── 8. Generate strategic alerts ──

  if (retention.retentionRate < 40 && patients.length > 0) {
    alerts.push({
      id: alertId('strategic'),
      category: 'billing-gap',
      severity: 'high',
      title: 'Low Patient Retention Rate',
      message: `Only ${retention.retentionRate}% of registered patients have returned for follow-up visits. Consider outreach programs.`,
      timestamp: now,
      actionable: true,
      suggestedAction: 'Review patient engagement strategy and follow-up scheduling protocols.',
    });
  }

  const dominantPayer = payerMix.find((p) => p.percentage > 60);
  if (dominantPayer) {
    alerts.push({
      id: alertId('strategic'),
      category: 'collection-risk',
      severity: 'medium',
      title: 'Payer Concentration Risk',
      message: `${dominantPayer.category} patients represent ${dominantPayer.percentage}% of the patient base. Over-reliance on a single payer category increases financial risk.`,
      timestamp: now,
      actionable: true,
      suggestedAction: 'Diversify patient acquisition channels and payer partnerships.',
    });
  }

  if (referralNetwork.length === 0 && patients.length > 5) {
    alerts.push({
      id: alertId('strategic'),
      category: 'billing-gap',
      severity: 'medium',
      title: 'No Referral Sources Identified',
      message: 'No referral doctors or hospitals are contributing patients. Referral network is inactive.',
      timestamp: now,
      actionable: true,
      suggestedAction: 'Establish referring-doctor partnerships and hospital tie-ups.',
    });
  }

  if (serviceLineRevenue.length > 1) {
    const totalRevenue = serviceLineRevenue.reduce((s, l) => s + l.totalRevenue, 0);
    const top = serviceLineRevenue[0];
    if (totalRevenue > 0 && top) {
      const topPct = pct(top.totalRevenue, totalRevenue);
      if (topPct > 70) {
        alerts.push({
          id: alertId('strategic'),
          category: 'revenue-leakage',
          severity: 'medium',
          title: 'Revenue Concentrated in Single Service Line',
          message: `${top.category} contributes ${topPct}% of total revenue. Diversify service offerings to reduce risk.`,
          timestamp: now,
          actionable: true,
          suggestedAction: 'Invest in underperforming service lines and marketing.',
        });
      }
    }
  }

  for (const area of catchmentAreas) {
    if (area.patientCount <= 1 && patients.length > 5) {
      alerts.push({
        id: alertId('strategic'),
        category: 'billing-gap',
        severity: 'low',
        title: `Low Patient Volume at ${area.branch}`,
        message: `Only ${area.patientCount} patient(s) registered at ${area.branch}. Review branch viability or marketing.`,
        timestamp: now,
        actionable: true,
        suggestedAction: `Evaluate marketing strategy for ${area.branch} or consider consolidation.`,
      });
    }
  }

  return {
    ageDemographics,
    genderDemographics,
    categoryDemographics,
    serviceLineRevenue,
    doctorPerformance,
    retention,
    referralNetwork,
    payerMix,
    catchmentAreas,
    alerts,
  };
}

// ── Helpers ──

function computeAgeDemographics(patients: HospitalPatient[]): DemographicBucket[] {
  const total = patients.length;
  return AGE_BUCKETS.map((bucket) => {
    const count = patients.filter((p) => p.age >= bucket.min && p.age <= bucket.max).length;
    return { label: bucket.label, count, percentage: pct(count, total) };
  });
}

function computeGenderDemographics(patients: HospitalPatient[]): DemographicBucket[] {
  const total = patients.length;
  const counts = countBy(patients, (p) => p.gender || 'Unknown');
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, percentage: pct(count, total) }))
    .sort((a, b) => b.count - a.count);
}

function computeCategoryDemographics(patients: HospitalPatient[]): DemographicBucket[] {
  const total = patients.length;
  const counts = countBy(patients, (p) => p.category);
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, percentage: pct(count, total) }))
    .sort((a, b) => b.count - a.count);
}

function computeServiceLineRevenue(invoices: BillingInvoice[]): ServiceLineRevenue[] {
  if (invoices.length === 0) return [];
  const grouped = groupBy(invoices, (inv) => inv.category);
  return Object.entries(grouped)
    .map(([category, invs]) => {
      const totalRevenue = invs.reduce((s, i) => s + i.total, 0);
      return {
        category,
        invoiceCount: invs.length,
        totalRevenue,
        avgRevenue: invs.length > 0 ? Math.round(totalRevenue / invs.length) : 0,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

function computeDoctorPerformance(
  admissions: AdmissionCase[],
  queue: QueueEntry[],
): ScoreResult[] {
  const doctorMap: Record<string, { admissionCount: number; completedQueue: number; totalQueue: number }> = {};

  for (const adm of admissions) {
    const doc = adm.attendingDoctor;
    if (!doctorMap[doc]) doctorMap[doc] = { admissionCount: 0, completedQueue: 0, totalQueue: 0 };
    doctorMap[doc].admissionCount += 1;
  }

  for (const q of queue) {
    const doc = q.doctor;
    if (!doctorMap[doc]) doctorMap[doc] = { admissionCount: 0, completedQueue: 0, totalQueue: 0 };
    doctorMap[doc].totalQueue += 1;
    if (q.status === 'completed') {
      doctorMap[doc].completedQueue += 1;
    }
  }

  const entries = Object.entries(doctorMap);
  if (entries.length === 0) return [];

  const maxVolume = Math.max(...entries.map(([, d]) => d.admissionCount + d.totalQueue), 1);

  return entries.map(([name, data]) => {
    const volume = data.admissionCount + data.totalQueue;
    const volumeNormalized = clampScore((volume / maxVolume) * 100);

    const completionRate = data.totalQueue > 0
      ? (data.completedQueue / data.totalQueue) * 100
      : 100;
    const completionNormalized = clampScore(completionRate);

    const factors: ScoreFactor[] = [
      {
        name: 'volume',
        value: volume,
        weight: DOCTOR_SCORE_WEIGHTS.volume,
        normalized: volumeNormalized,
      },
      {
        name: 'completion',
        value: Math.round(completionRate),
        weight: DOCTOR_SCORE_WEIGHTS.completion,
        normalized: completionNormalized,
      },
    ];

    const weightedScore = factors.reduce((s, f) => s + f.normalized * f.weight, 0);
    const score = clampScore(weightedScore);

    let label = 'Average';
    if (score >= 80) label = 'Excellent';
    else if (score >= 60) label = 'Good';
    else if (score < 40) label = 'Needs Improvement';

    return { name, score, factors, label };
  }).sort((a, b) => b.score - a.score);
}

function computeRetention(patients: HospitalPatient[]): RetentionSummary {
  const totalRegistered = patients.length;
  if (totalRegistered === 0) {
    return { totalRegistered: 0, patientsWithRevisit: 0, retentionRate: 0 };
  }
  const patientsWithRevisit = patients.filter((p) => !!p.lastVisit).length;
  return {
    totalRegistered,
    patientsWithRevisit,
    retentionRate: pct(patientsWithRevisit, totalRegistered),
  };
}

function computeReferralNetwork(patients: HospitalPatient[]): ReferralEntry[] {
  const entries: ReferralEntry[] = [];
  const doctorCounts: Record<string, number> = {};
  const hospitalCounts: Record<string, number> = {};
  const otherCounts: Record<string, number> = {};

  for (const p of patients) {
    if (p.referralDoctor) {
      doctorCounts[p.referralDoctor] = (doctorCounts[p.referralDoctor] || 0) + 1;
    }
    if (p.referralHospital) {
      hospitalCounts[p.referralHospital] = (hospitalCounts[p.referralHospital] || 0) + 1;
    }
    if (p.referralSource && !p.referralDoctor && !p.referralHospital) {
      otherCounts[p.referralSource] = (otherCounts[p.referralSource] || 0) + 1;
    }
  }

  for (const [source, count] of Object.entries(doctorCounts)) {
    entries.push({ source, type: 'doctor', count });
  }
  for (const [source, count] of Object.entries(hospitalCounts)) {
    entries.push({ source, type: 'hospital', count });
  }
  for (const [source, count] of Object.entries(otherCounts)) {
    entries.push({ source, type: 'other', count });
  }

  return entries.sort((a, b) => b.count - a.count);
}

function computePayerMix(patients: HospitalPatient[]): PayerMixEntry[] {
  const total = patients.length;
  if (total === 0) return [];

  const counts = countBy(patients, (p) => p.category);
  const categories = ['general', 'corporate', 'insurance', 'government', 'vip'];

  return categories.map((cat) => ({
    category: cat,
    count: counts[cat] || 0,
    percentage: pct(counts[cat] || 0, total),
    color: PAYER_COLORS[cat] || 'hsl(var(--primary))',
  }));
}

function computeCatchmentAreas(patients: HospitalPatient[]): CatchmentArea[] {
  const total = patients.length;
  if (total === 0) return [];

  const counts = countBy(patients, (p) => p.branch || 'Unknown');
  return Object.entries(counts)
    .map(([branch, patientCount]) => ({
      branch,
      patientCount,
      percentage: pct(patientCount, total),
    }))
    .sort((a, b) => b.patientCount - a.patientCount);
}
