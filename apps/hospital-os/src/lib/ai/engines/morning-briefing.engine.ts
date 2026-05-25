// ── AI Command Center — Morning Briefing Synthesizer ──
//
// Aggregates outputs from all 7 intelligence layers into a unified
// briefing for the hospital administrator / CEO / COO.
// Fully defensive — gracefully handles missing/undefined layer data.

import type {
  MorningBriefing,
  MorningBriefingKPI,
  IntelligenceAlert,
  FinancialIntelligence,
  WorkforceIntelligence,
  OperationsIntelligence,
  StrategicIntelligence,
  RevenueCycleIntelligence,
  ClinicalIntelligence,
  ProcurementIntelligence,
} from '../types';

import { SCORING_WEIGHTS } from '../constants';
import { clampScore, nowIST } from '../utils';

export interface MorningBriefingInput {
  financial: FinancialIntelligence;
  workforce: WorkforceIntelligence;
  operations: OperationsIntelligence;
  strategic: StrategicIntelligence;
  revenueCycle: RevenueCycleIntelligence;
  clinical: ClinicalIntelligence;
  procurement: ProcurementIntelligence;
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

// Safe array helper — ensures we always have an iterable
function safeArr<T>(val: T[] | undefined | null): T[] {
  return Array.isArray(val) ? val : [];
}

export function computeMorningBriefing(input: MorningBriefingInput): MorningBriefing {
  const { financial, workforce, operations, strategic, revenueCycle, clinical, procurement } = input;

  // ── 1. Aggregate all alerts, sort by severity ──
  const allAlerts: IntelligenceAlert[] = [
    ...safeArr(financial?.alerts),
    ...safeArr(workforce?.alerts),
    ...safeArr(operations?.alerts),
    ...safeArr(strategic?.alerts),
    ...safeArr(revenueCycle?.alerts),
    ...safeArr(clinical?.monitoringAlerts),
    ...safeArr(procurement?.alerts),
  ].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4));

  const topAlerts = allAlerts.slice(0, 12);

  // ── 2. Compute hospital health score (0–100) ──
  const w = SCORING_WEIGHTS.hospitalHealth;

  // Collection rate score
  const collectionRate = financial?.overallCollectionRate ?? financial?.dailyDigest?.collectionRate ?? 80;
  const collectionRateNorm = collectionRate / 100; // normalize to 0-1
  const collectionScore = clampScore(((collectionRateNorm - 0.60) / 0.25) * 100);

  // Bed utilization score
  const beds = safeArr(operations?.bedOccupancy);
  const totalBeds = beds.reduce((s, b) => s + (b.capacity ?? 0), 0);
  const occupiedBeds = beds.reduce((s, b) => s + (b.occupied ?? 0), 0);
  const bedPct = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 50;
  const bedScore = bedPct >= 70 && bedPct <= 85 ? 100
    : bedPct >= 50 && bedPct < 70 ? clampScore(50 + ((bedPct - 50) / 20) * 50)
    : bedPct > 85 && bedPct <= 95 ? clampScore(100 - ((bedPct - 85) / 10) * 50)
    : bedPct > 95 ? clampScore(20 - ((bedPct - 95) / 5) * 20)
    : 30;

  // Clinical safety score
  const clinicalAlerts = safeArr(clinical?.monitoringAlerts);
  const criticalClinicalCount = clinicalAlerts.filter(a => a.severity === 'critical').length;
  const clinicalScore = clampScore(100 - criticalClinicalCount * 25);

  // ER capacity score
  const erSurge = operations?.emergencyLoad?.surgeAlert ?? false;
  const erActive = operations?.emergencyLoad?.totalActive ?? 0;
  const erCritical = safeArr(operations?.emergencyLoad?.byTriage).find(t => t.level?.toLowerCase() === 'critical')?.count ?? 0;
  const erScore = erSurge ? 20
    : erCritical > 3 ? 40
    : erActive > 5 ? 60
    : 90;

  // Staff workload score
  const staffList = safeArr(workforce?.staffWorkload);
  const overloadedStaff = staffList.filter(s => s.loadStatus === 'overloaded').length;
  const staffScore = clampScore(100 - overloadedStaff * 20);

  // Procurement score
  const reorderList = safeArr(procurement?.reorderAlerts);
  const criticalProcurement = reorderList.filter(a => a.urgency === 'critical').length;
  const procurementScore = clampScore(100 - criticalProcurement * 15);

  const healthScore = clampScore(
    collectionScore * w.collectionRate +
    bedScore * w.bedUtilization +
    clinicalScore * w.clinicalSafety +
    erScore * w.erCapacity +
    staffScore * w.staffWorkload +
    procurementScore * w.procurement
  );

  const healthLabel = healthScore >= 85 ? 'Excellent' : healthScore >= 70 ? 'Good' : healthScore >= 55 ? 'Needs Attention' : healthScore >= 40 ? 'Warning' : 'Critical';

  // ── 3. Build KPI cards ──
  const dailyRevenue = financial?.dailyDigest?.totalRevenue ?? 0;
  const dailyCollected = financial?.dailyDigest?.totalCollected ?? 0;
  const queueWaiting = operations?.queueMetrics?.waiting ?? 0;
  const queueInConsult = operations?.queueMetrics?.inConsultation ?? 0;

  const kpis: MorningBriefingKPI[] = [
    {
      label: 'Collection',
      value: `₹${(dailyCollected / 100000).toFixed(1)}L`,
      trend: `${collectionRate >= 85 ? '+' : ''}${Math.round(collectionRate)}% rate`,
      status: collectionRate >= 85 ? 'good' : collectionRate >= 70 ? 'warning' : 'critical',
    },
    {
      label: 'Bed Occupancy',
      value: `${Math.round(bedPct)}%`,
      trend: `${occupiedBeds}/${totalBeds} beds`,
      status: bedPct >= 70 && bedPct <= 85 ? 'good' : bedPct > 92 ? 'critical' : 'warning',
    },
    {
      label: 'Staff Present',
      value: `${staffList.length}`,
      trend: `${overloadedStaff} overloaded`,
      status: overloadedStaff === 0 ? 'good' : overloadedStaff <= 2 ? 'warning' : 'critical',
    },
    {
      label: 'OPD Queue',
      value: `${queueWaiting + queueInConsult}`,
      trend: `${queueWaiting} waiting`,
      status: queueWaiting <= 5 ? 'good' : queueWaiting <= 15 ? 'warning' : 'critical',
    },
    {
      label: 'ER Active',
      value: `${erActive}`,
      trend: `${erCritical} critical`,
      status: erSurge ? 'critical' : erCritical > 0 ? 'warning' : 'good',
    },
    {
      label: 'Drug Alerts',
      value: `${clinicalAlerts.filter(a => a.category === 'drug-safety').length}`,
      trend: `${clinicalAlerts.filter(a => a.category === 'critical-lab').length} lab critical`,
      status: clinicalAlerts.some(a => a.category === 'critical-lab') ? 'critical' : clinicalAlerts.some(a => a.category === 'drug-safety') ? 'warning' : 'good',
    },
  ];

  // ── 4. Build briefing sections ──
  const briefingSections: MorningBriefing['briefingSections'] = [];

  // Financial section
  const finLines: MorningBriefing['briefingSections'][0]['lines'] = [];
  finLines.push({ text: `Today's Revenue: ₹${(dailyRevenue / 100000).toFixed(2)}L | Collections: ₹${(dailyCollected / 100000).toFixed(2)}L | Collection Rate: ${Math.round(collectionRate)}%`, type: collectionRate >= 85 ? 'success' : 'warning' });
  const totalPending = financial?.dailyDigest?.totalPending ?? 0;
  finLines.push({ text: `Outstanding: ₹${(totalPending / 100000).toFixed(2)}L`, type: totalPending > 500000 ? 'warning' : 'info' });
  const leakage = safeArr(financial?.revenueLeakage);
  if (leakage.length > 0) {
    finLines.push({ text: `Revenue Leakage Detected: ${leakage.length} point(s) flagged for review`, type: 'critical' });
  }
  const discountAbuse = safeArr(financial?.discountAbuse);
  if (discountAbuse.length > 0) {
    finLines.push({ text: `Discount Abuse: ${discountAbuse.length} invoice(s) with excessive discount flagged`, type: 'warning' });
  }
  briefingSections.push({ title: 'Financial', icon: 'IndianRupee', lines: finLines });

  // Operations section
  const opsLines: MorningBriefing['briefingSections'][0]['lines'] = [];
  opsLines.push({ text: `Bed Occupancy: ${Math.round(bedPct)}% (${occupiedBeds}/${totalBeds})`, type: bedPct > 92 ? 'critical' : bedPct > 80 ? 'warning' : 'success' });
  const highOccWards = beds.filter(w => w.occupancyRate > 90);
  if (highOccWards.length > 0) {
    opsLines.push({ text: `High-Occupancy Wards: ${highOccWards.map(w => `${w.ward} (${Math.round(w.occupancyRate)}%)`).join(', ')}`, type: 'warning' });
  }
  opsLines.push({ text: `OPD Queue: ${queueWaiting} waiting, ${queueInConsult} in consultation, ${operations?.queueMetrics?.completed ?? 0} completed`, type: 'info' });
  if (erActive > 0) {
    opsLines.push({ text: `ER Active: ${erActive} cases (${erCritical} critical)`, type: erSurge ? 'critical' : 'warning' });
  }
  const delays = safeArr(operations?.dischargeDelays);
  if (delays.length > 0) {
    opsLines.push({ text: `Discharge Delays: ${delays.length} patient(s) awaiting discharge — longest: ${Math.round(delays[0]?.hoursWaiting ?? 0)}h`, type: 'warning' });
  }
  briefingSections.push({ title: 'Operations', icon: 'Activity', lines: opsLines });

  // Clinical Safety section
  const clinLines: MorningBriefing['briefingSections'][0]['lines'] = [];
  const labAlerts = clinicalAlerts.filter(a => a.category === 'critical-lab');
  if (labAlerts.length > 0) {
    clinLines.push({ text: `Critical Lab Values: ${labAlerts.length} alert(s) active`, type: 'critical' });
  }
  const drugAlerts = clinicalAlerts.filter(a => a.category === 'drug-safety');
  if (drugAlerts.length > 0) {
    clinLines.push({ text: `Drug Safety: ${drugAlerts.length} interaction/allergy alert(s) active`, type: 'warning' });
  }
  const stewardship = safeArr(clinical?.antibioticStewardship);
  if (stewardship.length > 0) {
    clinLines.push({ text: `Antibiotic Stewardship: ${stewardship.length} patient(s) on antibiotics > review threshold — review recommended`, type: 'warning' });
  }
  const vitalTrends = safeArr(clinical?.vitalTrends);
  const deteriorating = vitalTrends.filter(v => v.trend === 'deteriorating' || v.trend === 'critical');
  if (deteriorating.length > 0) {
    clinLines.push({ text: `Deteriorating Patients: ${deteriorating.map(d => d.patientName).join(', ')} — immediate attention needed`, type: 'critical' });
  }
  const losOutliers = safeArr(clinical?.losOutliers);
  if (losOutliers.length > 0) {
    clinLines.push({ text: `LOS Outliers: ${losOutliers.length} patient(s) exceeding ward benchmarks — ${losOutliers.map(l => `${l.patientName} (${l.daysSinceAdmission}d vs ${l.averageLOS}d avg)`).slice(0, 2).join(', ')}`, type: 'info' });
  }
  if (clinLines.length === 0) {
    clinLines.push({ text: 'All clinical safety indicators within normal parameters', type: 'success' });
  }
  briefingSections.push({ title: 'Clinical Safety', icon: 'Shield', lines: clinLines });

  // Workforce section
  const wfLines: MorningBriefing['briefingSections'][0]['lines'] = [];
  wfLines.push({ text: `Active Staff: ${staffList.length} personnel tracked`, type: 'info' });
  if (overloadedStaff > 0) {
    const names = staffList.filter(s => s.loadStatus === 'overloaded').map(s => s.name).slice(0, 3).join(', ');
    wfLines.push({ text: `Overloaded: ${names} — consider redistributing tasks`, type: 'warning' });
  }
  const gapShifts = safeArr(workforce?.shiftCoverage).filter(s => s.coverageStatus === 'gap');
  if (gapShifts.length > 0) {
    wfLines.push({ text: `Shift Coverage Gap: ${gapShifts.map(s => s.shift).join(', ')} shift(s) under-staffed`, type: 'warning' });
  }
  briefingSections.push({ title: 'Workforce', icon: 'Users', lines: wfLines });

  // Procurement section
  const procLines: MorningBriefing['briefingSections'][0]['lines'] = [];
  if (reorderList.length > 0) {
    const critical = reorderList.filter(a => a.urgency === 'critical');
    if (critical.length > 0) {
      procLines.push({ text: `STOCK OUT: ${critical.map(a => a.drug).join(', ')} — immediate procurement needed`, type: 'critical' });
    }
    const high = reorderList.filter(a => a.urgency === 'high');
    if (high.length > 0) {
      procLines.push({ text: `Low Stock: ${high.length} item(s) below 50% reorder level`, type: 'warning' });
    }
  }
  const expiryRisks = safeArr(procurement?.expiryRisks);
  if (expiryRisks.length > 0) {
    const imminentExpiry = expiryRisks.filter(e => e.daysUntilExpiry <= 30);
    if (imminentExpiry.length > 0) {
      procLines.push({ text: `Expiring within 30 days: ${imminentExpiry.length} item(s) — ₹${(imminentExpiry.reduce((s, e) => s + e.financialRisk, 0) / 1000).toFixed(1)}K at risk`, type: 'warning' });
    }
  }
  const vendorConc = safeArr(procurement?.vendorConcentration);
  if (vendorConc.some(v => v.isConcentrated)) {
    procLines.push({ text: `Vendor Concentration Risk: Single supplier dominates >50% of inventory`, type: 'info' });
  }
  if (procLines.length === 0) {
    procLines.push({ text: 'Procurement and inventory indicators healthy', type: 'success' });
  }
  briefingSections.push({ title: 'Procurement', icon: 'Package', lines: procLines });

  // ── 5. AI Advice ──
  const advice: string[] = [];
  if (queueWaiting > 10) {
    advice.push('OPD wait times high. Consider adding afternoon consultation slot.');
  }
  if (bedPct > 85) {
    advice.push(`Bed occupancy at ${Math.round(bedPct)}%. Plan early discharges or defer elective admissions.`);
  }
  if (collectionRate < 75) {
    advice.push('Collection rate below 75%. Prioritize follow-up on outstanding invoices >30 days.');
  }
  if (erCritical > 2) {
    advice.push('Multiple critical ER cases. Ensure ICU bed availability and senior doctor coverage.');
  }
  if (deteriorating.length > 0) {
    advice.push(`${deteriorating.length} patient(s) showing deteriorating vitals. Trigger rapid response team review.`);
  }
  if (reorderList.filter(a => a.urgency === 'critical').length > 0) {
    advice.push('Critical stock-out detected. Escalate procurement for out-of-stock items immediately.');
  }
  const retentionRate = strategic?.retention?.retentionRate ?? 50;
  if (retentionRate < 30) {
    advice.push('Patient retention below 30%. Review follow-up scheduling and patient satisfaction surveys.');
  }
  if (advice.length === 0) {
    advice.push('All systems operating within normal parameters. Continue monitoring throughout the day.');
  }

  return {
    healthScore,
    healthLabel,
    topAlerts,
    kpis,
    briefingSections,
    generatedAt: nowIST(),
    advice,
  };
}
