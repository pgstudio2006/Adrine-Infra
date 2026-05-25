// ── Layer 3: Operations Intelligence Engine ──
//
// Pure computation functions for bed occupancy, queue metrics, emergency load,
// discharge delays, department activity, and operational alerts.

import type {
  OperationsIntelligence,
  WardOccupancy,
  QueueMetrics,
  EmergencyLoadMetrics,
  DischargeDelay,
  DepartmentActivity,
  IntelligenceAlert,
} from '../types';

import {
  WARD_CAPACITY,
  THRESHOLDS,
} from '../constants';

import {
  groupBy,
  countBy,
  pct,
  alertId,
  nowISO,
  parseStoreDate,
  hoursBetween,
} from '../utils';

import type {
  QueueEntry,
  AdmissionCase,
  EmergencyCase,
  HospitalAppointment,
  LabOrder,
  NursingRound,
} from '../../../stores/hospitalStore';

// ────────────────────────────────────────────────────────────────────────────
// Input Type
// ────────────────────────────────────────────────────────────────────────────

export interface OperationsIntelligenceInput {
  queue: QueueEntry[];
  admissions: AdmissionCase[];
  emergencyCases: EmergencyCase[];
  appointments: HospitalAppointment[];
  labOrders: LabOrder[];
  nursingRounds: NursingRound[];
}

// ────────────────────────────────────────────────────────────────────────────
// Main Export
// ────────────────────────────────────────────────────────────────────────────

/**
 * Compute the complete operations intelligence picture:
 *  - Bed occupancy by ward with capacity status
 *  - Queue metrics with department breakdown and wait time estimates
 *  - Emergency load with triage distribution and surge detection
 *  - Discharge delays for patients waiting to leave
 *  - Department activity with workload classification
 *  - Alerts for each threshold breach
 */
export function computeOperationsIntelligence(
  input: OperationsIntelligenceInput,
): OperationsIntelligence {
  const {
    queue,
    admissions,
    emergencyCases,
    appointments,
    labOrders,
    nursingRounds,
  } = input;

  const now = new Date();
  const alerts: IntelligenceAlert[] = [];

  // ── Bed Occupancy ──
  const bedOccupancy = computeBedOccupancy(admissions);

  for (const ward of bedOccupancy) {
    if (ward.status === 'over-capacity') {
      alerts.push({
        id: alertId('operations'),
        category: 'bed-capacity',
        severity: 'critical',
        title: `${ward.ward} Over Capacity`,
        message: `${ward.ward} is over capacity: ${ward.occupied}/${ward.capacity} beds occupied (${ward.occupancyRate.toFixed(0)}%). Patient safety may be compromised.`,
        relatedEntity: 'ward',
        relatedId: ward.ward,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: 'Initiate surge protocol. Expedite discharges and consider diverting new admissions.',
      });
    } else if (ward.status === 'critical') {
      alerts.push({
        id: alertId('operations'),
        category: 'bed-capacity',
        severity: 'high',
        title: `${ward.ward} Near Capacity`,
        message: `${ward.ward} occupancy is at ${ward.occupancyRate.toFixed(0)}% (${ward.occupied}/${ward.capacity} beds). Only ${ward.capacity - ward.occupied} bed(s) available.`,
        relatedEntity: 'ward',
        relatedId: ward.ward,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: 'Review discharge-ready patients in this ward. Alert admissions desk to limit new admits.',
      });
    } else if (ward.status === 'high') {
      alerts.push({
        id: alertId('operations'),
        category: 'bed-capacity',
        severity: 'medium',
        title: `${ward.ward} High Occupancy`,
        message: `${ward.ward} occupancy is at ${ward.occupancyRate.toFixed(0)}% (${ward.occupied}/${ward.capacity} beds).`,
        relatedEntity: 'ward',
        relatedId: ward.ward,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: 'Monitor closely. Plan for potential capacity issues.',
      });
    }
  }

  // ── Queue Metrics ──
  const queueMetrics = computeQueueMetrics(queue);

  if (queueMetrics.averageWaitEstimate >= THRESHOLDS.QUEUE_WAIT_CRITICAL_MINUTES) {
    alerts.push({
      id: alertId('operations'),
      category: 'queue-bottleneck',
      severity: 'high',
      title: 'Critical Queue Wait Time',
      message: `Estimated average wait time is ${queueMetrics.averageWaitEstimate} minutes. ${queueMetrics.waiting} patients are currently waiting across ${queueMetrics.departmentBreakdown.length} departments.`,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Open additional consultation rooms. Consider redistributing patients to less busy doctors.',
    });
  } else if (queueMetrics.averageWaitEstimate >= THRESHOLDS.QUEUE_WAIT_WARNING_MINUTES) {
    alerts.push({
      id: alertId('operations'),
      category: 'queue-bottleneck',
      severity: 'medium',
      title: 'Queue Wait Time Rising',
      message: `Estimated average wait time is ${queueMetrics.averageWaitEstimate} minutes with ${queueMetrics.waiting} patients waiting.`,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Monitor queue flow. Consider adding a consultation slot.',
    });
  }

  for (const dept of queueMetrics.departmentBreakdown) {
    if (dept.waiting >= 5) {
      alerts.push({
        id: alertId('operations'),
        category: 'queue-bottleneck',
        severity: 'medium',
        title: `${dept.department} Queue Backup`,
        message: `${dept.department} has ${dept.waiting} patients waiting with ${dept.inConsultation} in consultation.`,
        relatedEntity: 'department',
        relatedId: dept.department,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: `Consider adding consultation capacity for ${dept.department}.`,
      });
    }
  }

  // ── Emergency Load ──
  const emergencyLoad = computeEmergencyLoad(emergencyCases);

  if (emergencyLoad.surgeAlert) {
    alerts.push({
      id: alertId('operations'),
      category: 'emergency-surge',
      severity: 'critical',
      title: 'Emergency Surge Alert',
      message: emergencyLoad.surgeMessage || `${emergencyLoad.totalActive} active emergency cases exceed surge threshold of ${THRESHOLDS.EMERGENCY_SURGE_THRESHOLD}.`,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Activate emergency surge protocol. Call in additional staff. Prepare for mass-casualty triage if needed.',
    });
  }

  if (emergencyLoad.unTriagedCount > 0) {
    alerts.push({
      id: alertId('operations'),
      category: 'emergency-surge',
      severity: emergencyLoad.unTriagedCount > 2 ? 'high' : 'medium',
      title: 'Untriaged Emergency Patients',
      message: `${emergencyLoad.unTriagedCount} emergency patient(s) are pending triage assessment.`,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Prioritize triage for pending patients immediately.',
    });
  }

  const criticalTriageCount = emergencyLoad.byTriage.find(
    (t) => t.level === 'critical',
  )?.count ?? 0;
  if (criticalTriageCount >= 2) {
    alerts.push({
      id: alertId('operations'),
      category: 'emergency-surge',
      severity: 'critical',
      title: 'Multiple Critical Emergency Patients',
      message: `${criticalTriageCount} patients currently triaged as critical in the emergency department.`,
      timestamp: nowISO(),
      actionable: true,
      suggestedAction: 'Ensure sufficient critical care staff and equipment. Prepare ICU beds.',
    });
  }

  // ── Discharge Delays ──
  const dischargeDelays = computeDischargeDelays(admissions, now);

  for (const delay of dischargeDelays) {
    const severity =
      delay.hoursWaiting >= THRESHOLDS.DISCHARGE_DELAY_CRITICAL_HOURS
        ? 'high'
        : delay.hoursWaiting >= THRESHOLDS.DISCHARGE_DELAY_WARNING_HOURS
          ? 'medium'
          : 'low';

    if (severity !== 'low') {
      alerts.push({
        id: alertId('operations'),
        category: 'discharge-delay',
        severity,
        title: 'Discharge Delay',
        message: `${delay.patientName} (${delay.ward}, Bed ${delay.bed}) has been discharge-ready for ${delay.hoursWaiting.toFixed(1)} hours since ${delay.dischargeReadyAt}.`,
        relatedEntity: 'admission',
        relatedId: delay.admissionId,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: delay.hoursWaiting >= THRESHOLDS.DISCHARGE_DELAY_CRITICAL_HOURS
          ? 'Escalate immediately: identify and resolve discharge blockers (billing, transport, medication).'
          : 'Follow up on discharge process. Ensure all clearances are complete.',
      });
    }
  }

  // ── Department Activity ──
  const departmentActivity = computeDepartmentActivity(
    admissions,
    queue,
    labOrders,
    appointments,
    nursingRounds,
  );

  for (const dept of departmentActivity) {
    if (dept.status === 'overloaded') {
      alerts.push({
        id: alertId('operations'),
        category: 'department-overload',
        severity: 'high',
        title: `${dept.department} Overloaded`,
        message: `${dept.department} load is at ${dept.loadPercent.toFixed(0)}% with ${dept.activeCases} active cases and ${dept.pendingTasks} pending tasks.`,
        relatedEntity: 'department',
        relatedId: dept.department,
        timestamp: nowISO(),
        actionable: true,
        suggestedAction: `Redistribute workload from ${dept.department}. Consider temporary staff augmentation.`,
      });
    } else if (dept.status === 'busy') {
      alerts.push({
        id: alertId('operations'),
        category: 'department-overload',
        severity: 'medium',
        title: `${dept.department} Busy`,
        message: `${dept.department} is running at ${dept.loadPercent.toFixed(0)}% capacity with ${dept.activeCases} active cases.`,
        relatedEntity: 'department',
        relatedId: dept.department,
        timestamp: nowISO(),
        actionable: false,
      });
    }
  }

  return {
    bedOccupancy,
    queueMetrics,
    emergencyLoad,
    dischargeDelays,
    departmentActivity,
    alerts,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Bed Occupancy
// ────────────────────────────────────────────────────────────────────────────

function computeBedOccupancy(admissions: AdmissionCase[]): WardOccupancy[] {
  const activeAdmissions = admissions.filter(
    (a) => a.status !== 'discharged',
  );

  const byWard = groupBy(activeAdmissions, (a) => a.ward);

  const occupancy: WardOccupancy[] = [];

  const allWards = new Set([
    ...Object.keys(WARD_CAPACITY),
    ...Object.keys(byWard),
  ]);

  for (const ward of allWards) {
    const occupied = byWard[ward]?.length ?? 0;
    const capacity = WARD_CAPACITY[ward] ?? 10;
    const occupancyRate = pct(occupied, capacity);

    let status: WardOccupancy['status'];
    if (occupancyRate > 100) {
      status = 'over-capacity';
    } else if (occupancyRate >= THRESHOLDS.BED_OCCUPANCY_CRITICAL) {
      status = 'critical';
    } else if (occupancyRate >= THRESHOLDS.BED_OCCUPANCY_HIGH) {
      status = 'high';
    } else {
      status = 'normal';
    }

    if (occupied > 0 || WARD_CAPACITY[ward] !== undefined) {
      occupancy.push({
        ward,
        occupied,
        capacity,
        occupancyRate,
        status,
      });
    }
  }

  occupancy.sort((a, b) => {
    const statusOrder = { 'over-capacity': 0, 'critical': 1, 'high': 2, 'normal': 3 };
    const aOrder = statusOrder[a.status];
    const bOrder = statusOrder[b.status];
    if (aOrder !== bOrder) return aOrder - bOrder;
    return b.occupancyRate - a.occupancyRate;
  });

  return occupancy;
}

// ────────────────────────────────────────────────────────────────────────────
// Queue Metrics
// ────────────────────────────────────────────────────────────────────────────

function computeQueueMetrics(queue: QueueEntry[]): QueueMetrics {
  if (queue.length === 0) {
    return {
      totalInQueue: 0,
      waiting: 0,
      inConsultation: 0,
      completed: 0,
      skipped: 0,
      averageWaitEstimate: 0,
      departmentBreakdown: [],
    };
  }

  const statusCounts = countBy(queue, (q) => q.status);
  const waiting = statusCounts['waiting'] ?? 0;
  const called = statusCounts['called'] ?? 0;
  const inConsultation = statusCounts['in-consultation'] ?? 0;
  const completed = statusCounts['completed'] ?? 0;
  const skipped = statusCounts['skipped'] ?? 0;

  const totalInQueue = waiting + called + inConsultation;

  const concurrentDoctors = Math.max(inConsultation, 1);
  const averageWaitEstimate = Math.round(
    (waiting * THRESHOLDS.AVG_CONSULTATION_MINUTES) / concurrentDoctors,
  );

  const waitingEntries = queue.filter((q) => q.status === 'waiting');
  const longestWaitingToken = waitingEntries.length > 0
    ? waitingEntries.reduce(
        (oldest, entry) => {
          return entry.tokenNo < oldest.tokenNo ? entry : oldest;
        },
        waitingEntries[0],
      ).tokenNo
    : undefined;

  const byDept = groupBy(queue, (q) => q.department);
  const departmentBreakdown = Object.entries(byDept).map(
    ([department, entries]) => {
      const deptWaiting = entries.filter(
        (e) => e.status === 'waiting' || e.status === 'called',
      ).length;
      const deptInConsultation = entries.filter(
        (e) => e.status === 'in-consultation',
      ).length;
      return { department, waiting: deptWaiting, inConsultation: deptInConsultation };
    },
  );

  departmentBreakdown.sort((a, b) => b.waiting - a.waiting);

  return {
    totalInQueue,
    waiting: waiting + called,
    inConsultation,
    completed,
    skipped,
    averageWaitEstimate,
    longestWaitingToken,
    departmentBreakdown,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Emergency Load
// ────────────────────────────────────────────────────────────────────────────

function computeEmergencyLoad(
  emergencyCases: EmergencyCase[],
): EmergencyLoadMetrics {
  const activeCases = emergencyCases.filter(
    (c) => c.status !== 'discharged' && c.status !== 'transferred-ipd',
  );

  const totalActive = activeCases.length;

  const triageLevels = ['critical', 'urgent', 'semi-urgent', 'non-urgent', 'unassigned'];
  const triageCounts = countBy(activeCases, (c) => c.triage ?? 'unassigned');

  const byTriage = triageLevels
    .map((level) => ({
      level,
      count: triageCounts[level] ?? 0,
    }))
    .filter((t) => t.count > 0);

  const unTriagedCount = activeCases.filter(
    (c) => c.triage === null || c.status === 'triage-pending',
  ).length;

  const surgeAlert = totalActive >= THRESHOLDS.EMERGENCY_SURGE_THRESHOLD;
  const criticalCount = triageCounts['critical'] ?? 0;

  let surgeMessage: string | undefined;
  if (surgeAlert) {
    surgeMessage = `Emergency department surge: ${totalActive} active cases (threshold: ${THRESHOLDS.EMERGENCY_SURGE_THRESHOLD}).`;
    if (criticalCount > 0) {
      surgeMessage += ` ${criticalCount} critical patient(s) requiring immediate attention.`;
    }
    if (unTriagedCount > 0) {
      surgeMessage += ` ${unTriagedCount} patient(s) still pending triage.`;
    }
  }

  return {
    totalActive,
    byTriage,
    surgeAlert,
    surgeMessage,
    unTriagedCount,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Discharge Delays
// ────────────────────────────────────────────────────────────────────────────

function computeDischargeDelays(
  admissions: AdmissionCase[],
  now: Date,
): DischargeDelay[] {
  const delays: DischargeDelay[] = [];

  const dischargeReady = admissions.filter(
    (a) => a.status === 'discharge-ready',
  );

  for (const admission of dischargeReady) {
    let hoursWaiting: number;
    let readyAtStr: string;

    if (admission.dischargeReadyAt) {
      const readyAt = parseStoreDate(admission.dischargeReadyAt);
      if (readyAt) {
        hoursWaiting = hoursBetween(now, readyAt);
        readyAtStr = admission.dischargeReadyAt;
      } else {
        hoursWaiting = 2;
        readyAtStr = admission.dischargeReadyAt;
      }
    } else {
      hoursWaiting = 1;
      readyAtStr = 'Unknown';
    }

    delays.push({
      admissionId: admission.id,
      uhid: admission.uhid,
      patientName: admission.patientName,
      ward: admission.ward,
      bed: admission.bed,
      hoursWaiting: Math.round(hoursWaiting * 10) / 10,
      dischargeReadyAt: readyAtStr,
    });
  }

  delays.sort((a, b) => b.hoursWaiting - a.hoursWaiting);

  return delays;
}

// ────────────────────────────────────────────────────────────────────────────
// Department Activity
// ────────────────────────────────────────────────────────────────────────────

function computeDepartmentActivity(
  admissions: AdmissionCase[],
  queue: QueueEntry[],
  labOrders: LabOrder[],
  appointments: HospitalAppointment[],
  nursingRounds: NursingRound[],
): DepartmentActivity[] {
  const deptMap = new Map<
    string,
    { activeCases: number; pendingTasks: number }
  >();

  const ensureDept = (dept: string) => {
    if (!dept) return;
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { activeCases: 0, pendingTasks: 0 });
    }
  };

  const activeAdmissions = admissions.filter(
    (a) => a.status !== 'discharged',
  );
  for (const adm of activeAdmissions) {
    const dept = adm.department || adm.ward;
    ensureDept(dept);
    const entry = deptMap.get(dept)!;
    entry.activeCases++;
  }

  const activeQueue = queue.filter(
    (q) => q.status === 'waiting' || q.status === 'called' || q.status === 'in-consultation',
  );
  for (const q of activeQueue) {
    ensureDept(q.department);
    const entry = deptMap.get(q.department)!;
    entry.activeCases++;
  }

  const pendingLabs = labOrders.filter(
    (lo) =>
      lo.stage === 'Pending Analysis' ||
      lo.stage === 'In Analysis' ||
      lo.stage === 'Awaiting Validation',
  );
  for (const lab of pendingLabs) {
    const dept = lab.category || 'Lab';
    ensureDept(dept);
    const entry = deptMap.get(dept)!;
    entry.pendingTasks++;
  }

  const pendingAppointments = appointments.filter(
    (a) =>
      a.status === 'scheduled' || a.status === 'confirmed',
  );
  for (const appt of pendingAppointments) {
    ensureDept(appt.department);
    const entry = deptMap.get(appt.department)!;
    entry.pendingTasks++;
  }

  const activities: DepartmentActivity[] = [];

  for (const [department, data] of deptMap) {
    const rawLoad = data.activeCases * 10 + data.pendingTasks * 5;
    const loadPercent = Math.min(rawLoad, 100);

    let status: DepartmentActivity['status'];
    if (loadPercent >= THRESHOLDS.DEPARTMENT_LOAD_OVERLOADED) {
      status = 'overloaded';
    } else if (loadPercent >= THRESHOLDS.DEPARTMENT_LOAD_BUSY) {
      status = 'busy';
    } else {
      status = 'normal';
    }

    activities.push({
      department,
      activeCases: data.activeCases,
      pendingTasks: data.pendingTasks,
      loadPercent,
      status,
    });
  }

  activities.sort((a, b) => {
    const statusOrder = { overloaded: 0, busy: 1, normal: 2 };
    const aOrder = statusOrder[a.status];
    const bOrder = statusOrder[b.status];
    if (aOrder !== bOrder) return aOrder - bOrder;
    return b.loadPercent - a.loadPercent;
  });

  return activities;
}
