// ── Layer 6: Clinical Intelligence Engine ──
//
// Pure computation functions for clinical safety checks, antibiotic stewardship,
// LOS outlier detection, vital trend analysis, and monitoring alerts.

import type {
  DrugSafetyAlert,
  CriticalValueAlert,
  ClinicalIntelligence,
  AntibioticStewardshipEntry,
  LOSOutlier,
  VitalTrendEntry,
  IntelligenceAlert,
} from '../types';

import {
  DRUG_ALLERGY_CROSS_REACTIVITY,
  DRUG_INTERACTION_DB,
  CRITICAL_LAB_RANGES,
  VITAL_RANGES,
  ANTIBIOTIC_KEYWORDS,
  THRESHOLDS,
} from '../constants';

import {
  normalizeDrugName,
  parseBP,
  parseStoreDate,
  daysBetween,
  alertId,
  groupBy,
  nowISO,
} from '../utils';

import type {
  HospitalPatient,
  AdmissionCase,
  LabOrder,
  PrescriptionOrder,
  NursingRound,
  PharmacyInventoryItem,
} from '../../../stores/hospitalStore';

// ────────────────────────────────────────────────────────────────────────────
// 1. Drug-Allergy Safety
// ────────────────────────────────────────────────────────────────────────────

/**
 * Cross-reference a patient's allergy string (comma-separated, e.g. "Penicillin, Sulfa")
 * against their current medications using the DRUG_ALLERGY_CROSS_REACTIVITY database.
 *
 * Returns a DrugSafetyAlert for every medication that matches a known cross-reactive drug.
 */
export function checkDrugAllergySafety(
  patientAllergies: string,
  medications: { drug: string }[],
): DrugSafetyAlert[] {
  if (!patientAllergies || medications.length === 0) return [];

  const alerts: DrugSafetyAlert[] = [];

  // Parse allergy string into normalized tokens
  const allergies = patientAllergies
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);

  for (const allergy of allergies) {
    const crossReactivity = DRUG_ALLERGY_CROSS_REACTIVITY[allergy];
    if (!crossReactivity) continue;
    if (crossReactivity.drugs.length === 0) continue;

    for (const med of medications) {
      const normalizedDrug = normalizeDrugName(med.drug);

      const isMatch = crossReactivity.drugs.some((reactiveDrug) => {
        // Check if the normalized drug name contains or matches the reactive drug name
        return (
          normalizedDrug === reactiveDrug ||
          normalizedDrug.includes(reactiveDrug) ||
          reactiveDrug.includes(normalizedDrug)
        );
      });

      if (isMatch) {
        alerts.push({
          type: 'allergy-cross-reactivity',
          severity: crossReactivity.severity,
          drug: med.drug,
          conflictWith: allergy,
          message: `Patient is allergic to "${allergy}". ${crossReactivity.reaction}`,
          recommendation: `Avoid ${med.drug}. Consider non-cross-reactive alternative. Verify allergy history and consult pharmacist.`,
        });
      }
    }
  }

  return alerts;
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Drug-Drug Interactions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Check all medication pairs against the DRUG_INTERACTION_DB.
 * Uses normalized drug names for matching.
 *
 * Returns a DrugSafetyAlert for every detected interaction.
 */
export function checkDrugInteractions(
  medications: { drug: string }[],
): DrugSafetyAlert[] {
  if (medications.length < 2) return [];

  const alerts: DrugSafetyAlert[] = [];
  const normalizedMeds = medications.map((m) => ({
    original: m.drug,
    normalized: normalizeDrugName(m.drug),
  }));

  // Check every unique pair
  for (let i = 0; i < normalizedMeds.length; i++) {
    for (let j = i + 1; j < normalizedMeds.length; j++) {
      const medA = normalizedMeds[i];
      const medB = normalizedMeds[j];

      for (const interaction of DRUG_INTERACTION_DB) {
        const matchForward =
          (medA.normalized.includes(interaction.drugA) || interaction.drugA.includes(medA.normalized)) &&
          (medB.normalized.includes(interaction.drugB) || interaction.drugB.includes(medB.normalized));

        const matchReverse =
          (medA.normalized.includes(interaction.drugB) || interaction.drugB.includes(medA.normalized)) &&
          (medB.normalized.includes(interaction.drugA) || interaction.drugA.includes(medB.normalized));

        if (matchForward || matchReverse) {
          alerts.push({
            type: 'drug-interaction',
            severity: interaction.severity,
            drug: medA.original,
            conflictWith: medB.original,
            message: interaction.effect,
            recommendation: interaction.recommendation,
          });
        }
      }
    }
  }

  return alerts;
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Critical Lab Values
// ────────────────────────────────────────────────────────────────────────────

/**
 * Check a single lab test result against the CRITICAL_LAB_RANGES database.
 * Returns a CriticalValueAlert if the value is outside critical or abnormal range,
 * or null if the test is not in the database or is within normal range.
 */
export function detectCriticalLabValues(
  testName: string,
  value: number,
  unit: string,
): CriticalValueAlert | null {
  if (!testName || value == null || isNaN(value)) return null;

  const normalizedTest = testName.toLowerCase().trim();

  // Find matching range — case-insensitive match
  const range = CRITICAL_LAB_RANGES.find(
    (r) => r.testName.toLowerCase() === normalizedTest,
  );

  if (!range) return null;

  const isCriticalLow = range.criticalLow > 0 && value <= range.criticalLow;
  const isCriticalHigh = value >= range.criticalHigh;
  const isAbnormalLow = value < range.normalLow;
  const isAbnormalHigh = value > range.normalHigh;

  // Only alert if the value is outside normal range
  if (!isCriticalLow && !isCriticalHigh && !isAbnormalLow && !isAbnormalHigh) {
    return null;
  }

  let severity: CriticalValueAlert['severity'];
  let message: string;

  if (isCriticalLow) {
    severity = 'critical';
    message = `CRITICAL LOW: ${testName} = ${value} ${unit} (critical threshold: ${range.criticalLow} ${unit}). Immediate intervention required.`;
  } else if (isCriticalHigh) {
    severity = 'critical';
    message = `CRITICAL HIGH: ${testName} = ${value} ${unit} (critical threshold: ${range.criticalHigh} ${unit}). Immediate intervention required.`;
  } else if (isAbnormalLow) {
    severity = 'high';
    message = `ABNORMAL LOW: ${testName} = ${value} ${unit} (normal range: ${range.normalLow}-${range.normalHigh} ${unit}). Clinical review recommended.`;
  } else {
    severity = 'high';
    message = `ABNORMAL HIGH: ${testName} = ${value} ${unit} (normal range: ${range.normalLow}-${range.normalHigh} ${unit}). Clinical review recommended.`;
  }

  return {
    testName: range.testName,
    value,
    unit: unit || range.unit,
    normalRange: { low: range.normalLow, high: range.normalHigh },
    criticalRange: { criticalLow: range.criticalLow, criticalHigh: range.criticalHigh },
    severity,
    message,
    isCriticalLow,
    isCriticalHigh,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Full Clinical Intelligence Computation
// ────────────────────────────────────────────────────────────────────────────

export interface ClinicalIntelligenceInput {
  patients: HospitalPatient[];
  labOrders: LabOrder[];
  prescriptions: PrescriptionOrder[];
  admissions: AdmissionCase[];
  nursingRounds: NursingRound[];
  pharmacyInventory: PharmacyInventoryItem[];
}

/**
 * Compute the complete clinical intelligence picture:
 *  - Antibiotic stewardship entries
 *  - Length-of-stay outliers
 *  - Vital trend analysis (deterioration flags)
 *  - Monitoring alerts
 */
export function computeClinicalIntelligence(
  input: ClinicalIntelligenceInput,
): ClinicalIntelligence {
  const {
    patients,
    labOrders,
    prescriptions,
    admissions,
    nursingRounds,
    pharmacyInventory,
  } = input;

  const now = new Date();
  const alerts: IntelligenceAlert[] = [];

  // ── Antibiotic Stewardship ──
  const antibioticStewardship = computeAntibioticStewardship(
    admissions,
    prescriptions,
    now,
  );
  for (const entry of antibioticStewardship) {
    alerts.push({
      id: alertId('clinical'),
      category: 'antibiotic-stewardship',
      severity: entry.daysSinceAdmission >= THRESHOLDS.ANTIBIOTIC_REVIEW_DAYS * 2 ? 'high' : 'medium',
      title: 'Antibiotic Review Required',
      message: `${entry.patientName} (${entry.uhid}) has been on antibiotics [${entry.antibiotics.join(', ')}] for ${entry.daysSinceAdmission} days. ${entry.recommendation}`,
      relatedEntity: 'admission',
      relatedId: entry.admissionId,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Review antibiotic necessity, consider de-escalation or targeted therapy based on culture results.',
    });
  }

  // ── LOS Outliers ──
  const losOutliers = computeLOSOutliers(admissions, now);
  for (const outlier of losOutliers) {
    alerts.push({
      id: alertId('clinical'),
      category: 'los-outlier',
      severity: outlier.daysSinceAdmission > outlier.averageLOS * 2 ? 'high' : 'medium',
      title: 'Length-of-Stay Outlier',
      message: `${outlier.patientName} in ${outlier.ward} has been admitted for ${outlier.daysSinceAdmission} days (avg for ward: ${outlier.averageLOS} days). ${outlier.reason}`,
      relatedEntity: 'admission',
      relatedId: outlier.admissionId,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Review discharge readiness, care plan, and any barriers to discharge.',
    });
  }

  // ── Vital Trends ──
  const vitalTrends = computeVitalTrends(admissions, nursingRounds);
  for (const trend of vitalTrends) {
    if (trend.trend === 'critical' || trend.trend === 'deteriorating') {
      alerts.push({
        id: alertId('clinical'),
        category: 'vital-deterioration',
        severity: trend.trend === 'critical' ? 'critical' : 'high',
        title: trend.trend === 'critical' ? 'Critical Vital Signs' : 'Deteriorating Vitals',
        message: `${trend.patientName} (${trend.ward}, Bed ${trend.bed}): ${trend.flags.join('; ')}`,
        relatedEntity: 'admission',
        relatedId: trend.admissionId,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: 'Immediate bedside assessment and physician notification required.',
      });
    }
  }

  // ── Drug Safety Alerts (per-patient) ──
  const patientMap = new Map(patients.map((p) => [p.uhid, p]));
  for (const prescription of prescriptions) {
    if (prescription.status === 'Cancelled') continue;
    const patient = patientMap.get(prescription.uhid);
    if (!patient?.allergies) continue;

    const allergyAlerts = checkDrugAllergySafety(patient.allergies, prescription.meds);
    for (const da of allergyAlerts) {
      alerts.push({
        id: alertId('clinical'),
        category: 'drug-safety',
        severity: da.severity,
        title: 'Drug-Allergy Alert',
        message: `${prescription.patientName}: ${da.message}`,
        relatedEntity: 'prescription',
        relatedId: prescription.id,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: da.recommendation,
      });
    }

    const interactionAlerts = checkDrugInteractions(prescription.meds);
    for (const di of interactionAlerts) {
      alerts.push({
        id: alertId('clinical'),
        category: 'drug-safety',
        severity: di.severity,
        title: 'Drug Interaction Alert',
        message: `${prescription.patientName}: ${di.drug} interacts with ${di.conflictWith}. ${di.message}`,
        relatedEntity: 'prescription',
        relatedId: prescription.id,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: di.recommendation,
      });
    }
  }

  // ── Pharmacy Stock Alerts for Critical Items ──
  for (const item of pharmacyInventory) {
    if (item.qty <= 0) {
      alerts.push({
        id: alertId('clinical'),
        category: 'pharmacy-stock',
        severity: 'high',
        title: 'Out of Stock',
        message: `${item.drug} (${item.generic}) is out of stock. Batch: ${item.batch}, Location: ${item.location}.`,
        relatedEntity: 'pharmacy',
        relatedId: item.id,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: 'Place emergency procurement order immediately.',
      });
    } else if (item.qty <= item.reorder * 0.5) {
      alerts.push({
        id: alertId('clinical'),
        category: 'pharmacy-stock',
        severity: 'medium',
        title: 'Low Stock Warning',
        message: `${item.drug} stock is critically low: ${item.qty} units remaining (reorder point: ${item.reorder}).`,
        relatedEntity: 'pharmacy',
        relatedId: item.id,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: 'Initiate reorder before stock runs out.',
      });
    }

    // Expiry check
    const expiryDate = parseStoreDate(item.expiry);
    if (expiryDate) {
      const daysToExpiry = daysBetween(now, expiryDate);
      const isExpired = expiryDate.getTime() < now.getTime();
      if (isExpired) {
        alerts.push({
          id: alertId('clinical'),
          category: 'pharmacy-stock',
          severity: 'critical',
          title: 'Expired Medication',
          message: `${item.drug} (Batch: ${item.batch}) expired on ${item.expiry}. ${item.qty} units in inventory.`,
          relatedEntity: 'pharmacy',
          relatedId: item.id,
          timestamp: nowISO(),
          actionable: true,
          suggestedAction: 'Quarantine and remove from dispensing immediately. Notify pharmacy supervisor.',
        });
      } else if (daysToExpiry <= 90) {
        alerts.push({
          id: alertId('clinical'),
          category: 'pharmacy-stock',
          severity: daysToExpiry <= 30 ? 'high' : 'medium',
          title: 'Near-Expiry Medication',
          message: `${item.drug} (Batch: ${item.batch}) expires in ${daysToExpiry} days (${item.expiry}). ${item.qty} units remaining.`,
          relatedEntity: 'pharmacy',
          relatedId: item.id,
          timestamp: nowISO(),
          actionable: true,
          suggestedAction: daysToExpiry <= 30
            ? 'Prioritize dispensing or return to supplier. Do not restock.'
            : 'Plan to use before expiry or arrange return.',
        });
      }
    }
  }

  // ── Critical Lab Value Alerts ──
  for (const order of labOrders) {
    if (!order.results || order.stage !== 'Validated' && order.stage !== 'Reported') continue;

    // Attempt to parse numeric lab results from the results string
    // Format might vary; we do a best-effort parse: "Hemoglobin: 6.5 g/dL" etc.
    const resultLines = order.results.split(/[;\n,]/).map((s) => s.trim()).filter(Boolean);
    for (const line of resultLines) {
      const match = line.match(/^(.+?):\s*([\d.]+)\s*(.*)$/);
      if (!match) continue;
      const [, testName, valueStr, unit] = match;
      const value = parseFloat(valueStr);
      if (isNaN(value)) continue;

      const critAlert = detectCriticalLabValues(testName.trim(), value, unit.trim());
      if (critAlert) {
        alerts.push({
          id: alertId('clinical'),
          category: 'critical-lab',
          severity: critAlert.severity,
          title: 'Critical Lab Value',
          message: `${order.patientName} (${order.uhid}): ${critAlert.message}`,
          relatedEntity: 'lab-order',
          relatedId: order.orderId,
          timestamp: nowISO(),
          actionable: true,
          suggestedAction: 'Notify attending physician immediately. Repeat test if clinically indicated.',
        });
      }
    }
  }

  return {
    antibioticStewardship,
    losOutliers,
    vitalTrends,
    monitoringAlerts: alerts,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Internal Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Detect patients on antibiotics who may need stewardship review.
 * Looks at active admissions with prescriptions containing antibiotic keywords
 * and flags those past the review threshold.
 */
function computeAntibioticStewardship(
  admissions: AdmissionCase[],
  prescriptions: PrescriptionOrder[],
  now: Date,
): AntibioticStewardshipEntry[] {
  const entries: AntibioticStewardshipEntry[] = [];

  // Only active admissions
  const activeAdmissions = admissions.filter(
    (a) => a.status !== 'discharged',
  );

  // Group prescriptions by UHID for quick lookup
  const rxByUhid = groupBy(prescriptions, (rx) => rx.uhid);

  for (const admission of activeAdmissions) {
    const admitDate = parseStoreDate(admission.admittedAt);
    if (!admitDate) continue;

    const daysSinceAdmission = daysBetween(now, admitDate);
    if (daysSinceAdmission < THRESHOLDS.ANTIBIOTIC_REVIEW_DAYS) continue;

    // Find active prescriptions for this patient with antibiotics
    const patientRx = rxByUhid[admission.uhid] || [];
    const antibiotics: string[] = [];

    for (const rx of patientRx) {
      if (rx.status === 'Cancelled') continue;
      for (const med of rx.meds) {
        if (med.status === 'stopped') continue;
        const normalizedName = normalizeDrugName(med.drug);
        const isAntibiotic = ANTIBIOTIC_KEYWORDS.some(
          (kw) => normalizedName.includes(kw) || kw.includes(normalizedName),
        );
        if (isAntibiotic) {
          antibiotics.push(med.drug);
        }
      }
    }

    if (antibiotics.length > 0) {
      let recommendation: string;
      if (daysSinceAdmission >= THRESHOLDS.ANTIBIOTIC_REVIEW_DAYS * 2) {
        recommendation = `Prolonged antibiotic therapy (${daysSinceAdmission} days). Urgent review needed: consider culture-guided de-escalation or discontinuation.`;
      } else {
        recommendation = `Antibiotic therapy exceeds ${THRESHOLDS.ANTIBIOTIC_REVIEW_DAYS}-day threshold. Review necessity and consider narrowing spectrum.`;
      }

      entries.push({
        uhid: admission.uhid,
        patientName: admission.patientName,
        admissionId: admission.id,
        antibiotics: [...new Set(antibiotics)], // deduplicate
        daysSinceAdmission,
        recommendation,
      });
    }
  }

  return entries;
}

/**
 * Detect admissions whose LOS exceeds the ward's average.
 */
function computeLOSOutliers(
  admissions: AdmissionCase[],
  now: Date,
): LOSOutlier[] {
  const outliers: LOSOutlier[] = [];

  const activeAdmissions = admissions.filter(
    (a) => a.status !== 'discharged',
  );

  for (const admission of activeAdmissions) {
    const admitDate = parseStoreDate(admission.admittedAt);
    if (!admitDate) continue;

    const daysSinceAdmission = daysBetween(now, admitDate);
    const averageLOS =
      THRESHOLDS.AVERAGE_LOS[admission.ward] ??
      THRESHOLDS.AVERAGE_LOS['default'] ??
      5;

    if (daysSinceAdmission > averageLOS) {
      let reason: string;
      if (daysSinceAdmission > averageLOS * 2) {
        reason = `Significantly exceeds expected LOS for ${admission.ward}. Review for discharge barriers, complications, or social factors.`;
      } else {
        reason = `Exceeds average LOS for ${admission.ward}. Evaluate if continued inpatient care is medically necessary.`;
      }

      outliers.push({
        uhid: admission.uhid,
        patientName: admission.patientName,
        admissionId: admission.id,
        ward: admission.ward,
        daysSinceAdmission,
        averageLOS,
        status: admission.status,
        reason,
      });
    }
  }

  return outliers;
}

/**
 * Analyze nursing rounds for each active admission to detect vital sign trends.
 *
 * For each admission, takes the most recent nursing round and checks:
 *  - SpO2 < 92 => deteriorating
 *  - Temperature > 100.9F => fever flag
 *  - Pain score >= 7 => severe pain flag
 *  - Systolic BP outside warning range
 *  - Diastolic BP outside warning range
 *  - Pulse outside warning range
 */
function computeVitalTrends(
  admissions: AdmissionCase[],
  nursingRounds: NursingRound[],
): VitalTrendEntry[] {
  const entries: VitalTrendEntry[] = [];

  const activeAdmissions = admissions.filter(
    (a) => a.status !== 'discharged',
  );

  // Group nursing rounds by admission ID
  const roundsByAdmission = groupBy(nursingRounds, (nr) => nr.admissionId);

  for (const admission of activeAdmissions) {
    const rounds = roundsByAdmission[admission.id];
    if (!rounds || rounds.length === 0) continue;

    // Get the latest round (by recordedAt or last in array)
    // Since recordedAt might be a time string, we use the last entry as most recent
    const latestRound = rounds[rounds.length - 1];

    const flags: string[] = [];
    let trend: VitalTrendEntry['trend'] = 'stable';

    // ── SpO2 Check ──
    const spo2Range = VITAL_RANGES.spo2;
    if (latestRound.spo2 < spo2Range.criticalLow) {
      flags.push(`SpO2 critically low at ${latestRound.spo2}% (critical: <${spo2Range.criticalLow}%)`);
      trend = 'critical';
    } else if (latestRound.spo2 < spo2Range.warningLow) {
      flags.push(`SpO2 deteriorating at ${latestRound.spo2}% (warning: <${spo2Range.warningLow}%)`);
      if (trend === 'stable') trend = 'deteriorating';
    }

    // ── Temperature Check ──
    const tempRange = VITAL_RANGES.temperature;
    if (latestRound.temp > tempRange.criticalHigh) {
      flags.push(`High fever: ${latestRound.temp}F (critical: >${tempRange.criticalHigh}F)`);
      trend = 'critical';
    } else if (latestRound.temp > tempRange.warningHigh) {
      flags.push(`Fever: ${latestRound.temp}F (warning: >${tempRange.warningHigh}F)`);
      if (trend === 'stable') trend = 'deteriorating';
    } else if (latestRound.temp < tempRange.criticalLow) {
      flags.push(`Hypothermia: ${latestRound.temp}F (critical: <${tempRange.criticalLow}F)`);
      trend = 'critical';
    }

    // ── Pain Score Check ──
    const painRange = VITAL_RANGES.painScore;
    if (latestRound.painScore >= 7) {
      flags.push(`Severe pain: score ${latestRound.painScore}/10`);
      if (trend === 'stable') trend = 'deteriorating';
    } else if (latestRound.painScore > painRange.warningHigh) {
      flags.push(`Moderate pain: score ${latestRound.painScore}/10`);
      if (trend === 'stable') trend = 'deteriorating';
    }

    // ── Blood Pressure Check ──
    const bpParsed = parseBP(latestRound.bp);
    if (bpParsed) {
      const sysRange = VITAL_RANGES.systolicBP;
      const diaRange = VITAL_RANGES.diastolicBP;

      if (bpParsed.systolic >= sysRange.criticalHigh || bpParsed.systolic <= sysRange.criticalLow) {
        flags.push(`Critical BP: ${latestRound.bp} mmHg (systolic critical range: ${sysRange.criticalLow}-${sysRange.criticalHigh})`);
        trend = 'critical';
      } else if (bpParsed.systolic >= sysRange.warningHigh || bpParsed.systolic <= sysRange.warningLow) {
        flags.push(`Abnormal systolic BP: ${bpParsed.systolic} mmHg`);
        if (trend === 'stable') trend = 'deteriorating';
      }

      if (bpParsed.diastolic >= diaRange.criticalHigh || bpParsed.diastolic <= diaRange.criticalLow) {
        flags.push(`Critical diastolic BP: ${bpParsed.diastolic} mmHg`);
        trend = 'critical';
      } else if (bpParsed.diastolic >= diaRange.warningHigh || bpParsed.diastolic <= diaRange.warningLow) {
        flags.push(`Abnormal diastolic BP: ${bpParsed.diastolic} mmHg`);
        if (trend === 'stable') trend = 'deteriorating';
      }
    }

    // ── Pulse Check ──
    const pulseRange = VITAL_RANGES.pulse;
    if (latestRound.pulse >= pulseRange.criticalHigh || latestRound.pulse <= pulseRange.criticalLow) {
      flags.push(`Critical pulse: ${latestRound.pulse} bpm (range: ${pulseRange.criticalLow}-${pulseRange.criticalHigh})`);
      trend = 'critical';
    } else if (latestRound.pulse >= pulseRange.warningHigh || latestRound.pulse <= pulseRange.warningLow) {
      flags.push(`Abnormal pulse: ${latestRound.pulse} bpm`);
      if (trend === 'stable') trend = 'deteriorating';
    }

    // ── Trend from multiple rounds ──
    // If we have 2+ rounds, compare latest vs previous to detect improvement
    if (rounds.length >= 2 && trend === 'stable') {
      const prevRound = rounds[rounds.length - 2];
      // Check if vitals are improving from a prior abnormal reading
      if (
        prevRound.spo2 < spo2Range.warningLow &&
        latestRound.spo2 >= spo2Range.warningLow
      ) {
        trend = 'improving';
      }
      if (
        prevRound.temp > tempRange.warningHigh &&
        latestRound.temp <= tempRange.warningHigh
      ) {
        trend = 'improving';
      }
    }

    entries.push({
      uhid: admission.uhid,
      patientName: admission.patientName,
      admissionId: admission.id,
      ward: admission.ward,
      bed: admission.bed,
      latestVitals: {
        bp: latestRound.bp,
        pulse: latestRound.pulse,
        temp: latestRound.temp,
        spo2: latestRound.spo2,
        painScore: latestRound.painScore,
        recordedAt: latestRound.recordedAt,
      },
      flags,
      trend,
    });
  }

  return entries;
}
