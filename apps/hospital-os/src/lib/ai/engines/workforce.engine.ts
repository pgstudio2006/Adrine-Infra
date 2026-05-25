// ── Layer 2: HRMS AI — Workforce Intelligence Engine ──

import type {
  AdmissionCase,
  NursingRound,
  QueueEntry,
  HospitalAppointment,
} from '@/stores/hospitalStore';

import type {
  WorkforceIntelligence,
  StaffWorkload,
  ShiftCoverage,
  ScoreResult,
  ScoreFactor,
  IntelligenceAlert,
} from '../types';

import {
  WORKLOAD_THRESHOLDS,
  SHIFT_COVERAGE_GAP_THRESHOLD,
  DOCTOR_SCORE_WEIGHTS,
} from '../constants';
import { groupBy, countBy, pct, alertId, clampScore } from '../utils';

// ── Input contract ──
export interface WorkforceInput {
  admissions: AdmissionCase[];
  nursingRounds: NursingRound[];
  queue: QueueEntry[];
  appointments: HospitalAppointment[];
}

// ── Main computation ──
export function computeWorkforceIntelligence(input: WorkforceInput): WorkforceIntelligence {
  const { admissions, nursingRounds, queue, appointments } = input;
  const alerts: IntelligenceAlert[] = [];
  const now = new Date().toISOString();

  // ── 1. Workload by staff ──
  const staffWorkload = computeStaffWorkload(admissions, nursingRounds, queue, alerts, now);

  // ── 2. Shift coverage ──
  const shiftCoverage = computeShiftCoverage(nursingRounds, alerts, now);

  // ── 3. Doctor productivity ──
  const doctorProductivity = computeDoctorProductivity(admissions, queue, appointments, alerts, now);

  return {
    staffWorkload,
    shiftCoverage,
    doctorProductivity,
    alerts,
  };
}

// ── Helpers ──

function computeStaffWorkload(
  admissions: AdmissionCase[],
  nursingRounds: NursingRound[],
  queue: QueueEntry[],
  alerts: IntelligenceAlert[],
  now: string,
): StaffWorkload[] {
  const workloads: StaffWorkload[] = [];

  // ── Nurse workload: count tasks from nursingRounds by nurse ──
  const nurseTaskCounts = countBy(nursingRounds, (r) => r.nurse);
  const nurseNames = Object.keys(nurseTaskCounts);
  const nurseTasks = Object.values(nurseTaskCounts);
  const nurseAvg = nurseTasks.length > 0
    ? nurseTasks.reduce((s, c) => s + c, 0) / nurseTasks.length
    : 0;

  for (const nurseName of nurseNames) {
    const taskCount = nurseTaskCounts[nurseName];
    const { loadStatus, score } = computeLoadStatus(taskCount, nurseAvg);

    workloads.push({
      name: nurseName,
      role: 'nurse',
      taskCount,
      loadStatus,
      score,
    });

    if (loadStatus === 'overloaded') {
      alerts.push({
        id: alertId('workforce'),
        category: 'department-overload',
        severity: 'high',
        title: `Nurse Overloaded: ${nurseName}`,
        message: `${nurseName} has ${taskCount} nursing rounds, which is more than ${WORKLOAD_THRESHOLDS.overloadedMultiplier}x the average (${Math.round(nurseAvg)}).`,
        timestamp: now,
        actionable: true,
        suggestedAction: `Redistribute nursing rounds from ${nurseName} to underutilized staff.`,
      });
    }
  }

  // ── Doctor workload: count patients from admissions + queue ──
  const doctorTaskCounts: Record<string, number> = {};

  for (const adm of admissions) {
    const doc = adm.attendingDoctor;
    doctorTaskCounts[doc] = (doctorTaskCounts[doc] || 0) + 1;
  }

  for (const q of queue) {
    const doc = q.doctor;
    doctorTaskCounts[doc] = (doctorTaskCounts[doc] || 0) + 1;
  }

  const doctorNames = Object.keys(doctorTaskCounts);
  const doctorTasks = Object.values(doctorTaskCounts);
  const doctorAvg = doctorTasks.length > 0
    ? doctorTasks.reduce((s, c) => s + c, 0) / doctorTasks.length
    : 0;

  for (const docName of doctorNames) {
    const taskCount = doctorTaskCounts[docName];
    const { loadStatus, score } = computeLoadStatus(taskCount, doctorAvg);

    workloads.push({
      name: docName,
      role: 'doctor',
      taskCount,
      loadStatus,
      score,
    });

    if (loadStatus === 'overloaded') {
      alerts.push({
        id: alertId('workforce'),
        category: 'department-overload',
        severity: 'high',
        title: `Doctor Overloaded: ${docName}`,
        message: `${docName} is handling ${taskCount} cases, more than ${WORKLOAD_THRESHOLDS.overloadedMultiplier}x the average (${Math.round(doctorAvg)}).`,
        timestamp: now,
        actionable: true,
        suggestedAction: `Consider redistributing patients or providing support to ${docName}.`,
      });
    }
  }

  return workloads.sort((a, b) => b.taskCount - a.taskCount);
}

function computeLoadStatus(
  taskCount: number,
  average: number,
): { loadStatus: StaffWorkload['loadStatus']; score: number } {
  if (average === 0) {
    return { loadStatus: 'optimal', score: 50 };
  }

  const ratio = taskCount / average;

  let loadStatus: StaffWorkload['loadStatus'];
  if (ratio > WORKLOAD_THRESHOLDS.overloadedMultiplier) {
    loadStatus = 'overloaded';
  } else if (ratio < WORKLOAD_THRESHOLDS.underutilizedMultiplier) {
    loadStatus = 'underutilized';
  } else {
    loadStatus = 'optimal';
  }

  const distance = Math.abs(ratio - 1.0);
  const score = clampScore(Math.round(100 * Math.max(0, 1 - distance)));

  return { loadStatus, score };
}

function computeShiftCoverage(
  nursingRounds: NursingRound[],
  alerts: IntelligenceAlert[],
  now: string,
): ShiftCoverage[] {
  if (nursingRounds.length === 0) return [];

  const shiftGroups = groupBy(nursingRounds, (r) => r.shift);
  const shifts = ['Morning', 'Evening', 'Night'];

  const coverage: ShiftCoverage[] = shifts.map((shift) => {
    const rounds = shiftGroups[shift] || [];
    const uniqueNurses = new Set(rounds.map((r) => r.nurse)).size;
    return {
      shift,
      roundCount: rounds.length,
      uniqueNurses,
      coverageStatus: 'adequate' as const,
    };
  });

  const maxRounds = Math.max(...coverage.map((c) => c.roundCount), 0);

  if (maxRounds > 0) {
    for (const shift of coverage) {
      if (shift.roundCount < maxRounds * SHIFT_COVERAGE_GAP_THRESHOLD) {
        shift.coverageStatus = 'gap';

        alerts.push({
          id: alertId('workforce'),
          category: 'department-overload',
          severity: 'medium',
          title: `Shift Coverage Gap: ${shift.shift}`,
          message: `${shift.shift} shift has only ${shift.roundCount} round(s) with ${shift.uniqueNurses} nurse(s), which is less than 50% of the busiest shift (${maxRounds} rounds).`,
          timestamp: now,
          actionable: true,
          suggestedAction: `Review and reinforce staffing for the ${shift.shift} shift.`,
        });
      }
    }
  }

  return coverage;
}

function computeDoctorProductivity(
  admissions: AdmissionCase[],
  queue: QueueEntry[],
  appointments: HospitalAppointment[],
  alerts: IntelligenceAlert[],
  now: string,
): ScoreResult[] {
  const doctorCases: Record<string, { handled: number; total: number }> = {};

  for (const adm of admissions) {
    const doc = adm.attendingDoctor;
    if (!doctorCases[doc]) doctorCases[doc] = { handled: 0, total: 0 };
    doctorCases[doc].handled += 1;
    doctorCases[doc].total += 1;
  }

  for (const q of queue) {
    const doc = q.doctor;
    if (!doctorCases[doc]) doctorCases[doc] = { handled: 0, total: 0 };
    doctorCases[doc].total += 1;
    if (q.status === 'completed' || q.status === 'in-consultation') {
      doctorCases[doc].handled += 1;
    }
  }

  const entries = Object.entries(doctorCases);
  if (entries.length === 0) return [];

  const maxTotal = Math.max(...entries.map(([, d]) => d.total), 1);

  return entries.map(([name, data]) => {
    const volumeNormalized = clampScore((data.total / maxTotal) * 100);
    const completionRate = data.total > 0
      ? (data.handled / data.total) * 100
      : 100;
    const completionNormalized = clampScore(completionRate);

    const factors: ScoreFactor[] = [
      {
        name: 'volume',
        value: data.total,
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
    if (score >= 80) label = 'High Performer';
    else if (score >= 60) label = 'Good';
    else if (score < 40) label = 'Needs Review';

    return { name, score, factors, label };
  }).sort((a, b) => b.score - a.score);
}
