/**
 * Central strangler helpers — hydrate hospitalStore slices from domain-api when platform is authoritative.
 */
import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';
import { platformGetCommandSnapshot } from './command-runtime';
import {
  platformGetLiveLabState,
  platformListLabBranchWorklist,
} from './lab-runtime';
import {
  platformGetLivePharmacyState,
  platformListPharmacyBranchWorklist,
} from './pharmacy-runtime';
import {
  platformListRadiologyBranchWorklist,
  platformListRadiologyOrders,
} from './radiology-runtime';
import { platformListOpdBoard } from './opd-runtime';
import type { LabOrderState } from '@adrine/hospital-operations';
import type { HospitalPatient, QueueEntry, RadiologyOrder, LabOrder, PrescriptionOrder, HospitalAppointment } from '@/stores/hospitalStore';
import {
  platformListAppointmentsInRange,
  platformSearchPatients,
  type PlatformAppointment,
  type PlatformPatientRow,
} from './scheduling-runtime';

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function isPlatformAuthoritative(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export async function hydratePatientFromPlatform(
  platformPatientId: string,
): Promise<Partial<HospitalPatient> | null> {
  if (!isPlatformAuthoritative()) return null;
  try {
    const row = await platformFetch<{ id: string; fullName: string; mrn?: string | null; createdAt?: string }>(
      domainBase()!,
      `/patients/${platformPatientId}`,
    );
    return mapPlatformPatientRow(row);
  } catch {
    return null;
  }
}

export function mapPlatformPatientRow(row: PlatformPatientRow): Partial<HospitalPatient> {
  const registeredOn = row.createdAt
    ? new Date(row.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
  return {
    platformPatientId: row.id,
    name: row.fullName,
    uhid: row.mrn ?? `UHID-${row.id.slice(-6).toUpperCase()}`,
    age: 0,
    gender: '',
    phone: '',
    category: 'general',
    patientType: 'OPD',
    registeredOn,
    branch: 'Main Hospital',
  };
}

/** Platform-backed rows merge into local patients; backfill `platformPatientId` on MRN match. */
export function mergePatientsFromPlatform(
  previous: HospitalPatient[],
  incoming: Partial<HospitalPatient>[],
): HospitalPatient[] {
  const byPlatform = new Map(
    previous.filter((p) => p.platformPatientId).map((p) => [p.platformPatientId!, p]),
  );
  const byUhid = new Map(previous.map((p) => [p.uhid, p]));
  const out = [...previous];

  for (const row of incoming) {
    if (!row.platformPatientId || !row.name) continue;
    const byId = byPlatform.get(row.platformPatientId);
    const byMrn = row.uhid ? byUhid.get(row.uhid) : undefined;
    const existing = byId ?? byMrn;

    if (existing) {
      const idx = out.findIndex((p) => p.uhid === existing.uhid);
      if (idx >= 0) {
        out[idx] = {
          ...out[idx],
          platformPatientId: row.platformPatientId,
          name: row.name ?? out[idx].name,
          department: row.department ?? out[idx].department,
          assignedDoctor: row.assignedDoctor ?? out[idx].assignedDoctor,
          opdState: row.opdState ?? out[idx].opdState,
          platformOpdVisitId: row.platformOpdVisitId ?? out[idx].platformOpdVisitId,
          visitMetadata: row.visitMetadata ?? out[idx].visitMetadata,
          phone: row.phone || out[idx].phone,
        };
      }
      continue;
    }

    out.unshift({
      uhid: row.uhid ?? `UHID-${row.platformPatientId.slice(-6).toUpperCase()}`,
      platformPatientId: row.platformPatientId,
      name: row.name,
      age: row.age ?? 0,
      gender: row.gender ?? '',
      phone: row.phone ?? '',
      category: row.category ?? 'general',
      patientType: row.patientType ?? 'OPD',
      registeredOn: row.registeredOn ?? new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      branch: row.branch ?? 'Main Hospital',
    });
  }

  return out;
}

export async function fetchMappedPatientsFromPlatform(
  query?: string,
): Promise<Partial<HospitalPatient>[] | null> {
  if (!isPlatformAuthoritative()) return null;
  try {
    const rows = query?.trim()
      ? await platformSearchPatients(query.trim())
      : await platformFetch<PlatformPatientRow[]>(domainBase()!, '/patients');
    return rows.map((r) => mapPlatformPatientRow(r));
  } catch {
    return null;
  }
}

export async function syncQueueFromPlatform(
  branchId: string,
): Promise<Partial<QueueEntry>[]> {
  if (!isPlatformAuthoritative()) return [];
  try {
    const visits = await platformListOpdBoard(branchId);
    return visits
      .filter((v) =>
        ['routed', 'queued', 'in_consultation', 'orders_pending'].includes(v.state),
      )
      .map((v) => ({
        platformOpdVisitId: v.id,
        tokenNo: v.tokenNumber ?? 0,
        uhid: v.patient?.mrn ?? v.patientId,
        patientName: v.patient?.fullName ?? '',
        doctor: v.assignedDoctor ?? 'Unassigned',
        department: v.department ?? 'General Medicine',
        status:
          v.state === 'in_consultation' || v.state === 'orders_pending'
            ? ('in-consultation' as const)
            : ('waiting' as const),
        checkedInAt: '',
      }));
  } catch {
    return [];
  }
}

export async function fetchPlatformHydrationSnapshot(branchId: string) {
  const snapshot = await platformGetCommandSnapshot(branchId);
  return snapshot;
}

export async function refreshLabOrdersForVisit(
  opdVisitId: string,
  mapRow: (row: {
    id: string;
    externalRef?: string | null;
    tests: string;
    state: string;
    priority: string;
  }) => LabOrder,
): Promise<LabOrder[]> {
  const live = await platformGetLiveLabState(opdVisitId);
  return live.orders.map((o) =>
    mapRow({
      id: o.id,
      externalRef: o.externalRef,
      tests: o.tests,
      state: o.state,
      priority: o.priority,
    }),
  );
}

export async function refreshPharmacyForVisit(
  opdVisitId: string,
): Promise<ReturnType<typeof platformGetLivePharmacyState>> {
  return platformGetLivePharmacyState(opdVisitId);
}

export async function refreshRadiologyForVisit(
  opdVisitId: string,
  patient: { uhid: string; name: string; doctor: string },
): Promise<RadiologyOrder[]> {
  const rows = await platformListRadiologyOrders(opdVisitId);
  const stateToUi = (s: string): RadiologyOrder['status'] => {
    if (s === 'scheduled') return 'Scheduled';
    if (s === 'imaging_in_progress') return 'In Progress';
    if (['awaiting_review', 'critical_review', 'approved'].includes(s)) return 'Completed';
    if (['published', 'completed'].includes(s)) return 'Reported';
    return 'Ordered';
  };
  return rows.map((o) => ({
    orderId: o.externalRef ?? o.id,
    platformRadiologyOrderId: o.id,
    uhid: patient.uhid,
    patientName: patient.name,
    study: o.study,
    modality: o.modality,
    priority: (o.priority as RadiologyOrder['priority']) || 'Routine',
    doctor: patient.doctor,
    orderTime: new Date().toISOString(),
    status: stateToUi(o.state),
    critical: o.isCritical,
  }));
}

function formatOrderTime(createdAt: unknown): string {
  if (typeof createdAt !== 'string') return '';
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function extractLabResultsText(results: unknown): string | undefined {
  if (results == null) return undefined;
  if (typeof results === 'string') return results;
  if (typeof results === 'object' && results !== null && 'summary' in results) {
    return String((results as { summary?: unknown }).summary ?? '');
  }
  return undefined;
}

function mapLabDomainStateToUi(state: string): { stage: LabOrder['stage']; sampleStatus: LabOrder['sampleStatus'] } {
  if (['ordered', 'awaiting_collection', 'recollect_required'].includes(state)) {
    return { stage: 'Pending Analysis', sampleStatus: 'Ordered' };
  }
  if (['collected', 'labeled', 'in_transit'].includes(state)) {
    return { stage: 'Pending Analysis', sampleStatus: 'Collected' };
  }
  if (state === 'in_processing') {
    return { stage: 'In Analysis', sampleStatus: 'Processing' };
  }
  if (['awaiting_review', 'critical_review'].includes(state)) {
    return { stage: 'Awaiting Validation', sampleStatus: 'Analysis Complete' };
  }
  if (state === 'approved') {
    return { stage: 'Validated', sampleStatus: 'Analysis Complete' };
  }
  if (['published', 'completed'].includes(state)) {
    return { stage: 'Reported', sampleStatus: 'Analysis Complete' };
  }
  return { stage: 'Pending Analysis', sampleStatus: 'Ordered' };
}

export function mapBranchLabRowToLabOrder(row: Record<string, unknown>): LabOrder {
  const patient = row.patient as { mrn?: string | null; fullName?: string; id?: string } | undefined;
  const pid = patient?.id ?? '';
  const uhid = (patient?.mrn && String(patient.mrn)) || pid.slice(-8).toUpperCase();
  const priorityRaw = String(row.priority ?? 'Routine');
  const priority: LabOrder['priority'] =
    priorityRaw === 'Emergency' || priorityRaw === 'Urgent' || priorityRaw === 'Routine'
      ? priorityRaw
      : 'Routine';
  const st = String(row.state ?? '');
  const { stage, sampleStatus } = mapLabDomainStateToUi(st);
  const id = String(row.id ?? '');
  const externalRef = row.externalRef != null ? String(row.externalRef) : null;
  return {
    orderId: externalRef || `LO-${id.slice(-6)}`,
    platformLabOrderId: id,
    platformLabState: st as LabOrderState,
    uhid,
    patientName: patient?.fullName ?? 'Unknown',
    tests: String(row.tests ?? ''),
    category: String(row.category ?? 'General'),
    priority,
    doctor: String(row.orderingDoctor ?? ''),
    orderTime:
      formatOrderTime(row.createdAt) ||
      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    stage,
    sampleStatus,
    results: extractLabResultsText(row.results),
    sampleId: row.sampleId != null ? String(row.sampleId) : undefined,
    criticalAlert: Boolean(row.isCritical),
  };
}

/** Known demo-seed UHIDs — never retain when platform runtime is authoritative. */
const DEMO_UHID_PREFIXES = ['UH-2024-', 'UHID-2400'] as const;

function isDemoSeedUhid(uhid: string): boolean {
  return DEMO_UHID_PREFIXES.some((prefix) => uhid.startsWith(prefix));
}

function retainLocalDepartmentRow<T extends { uhid: string }>(
  row: T,
  platformAuthoritative: boolean,
  hasPlatformLink: boolean,
): boolean {
  if (hasPlatformLink) return false;
  if (platformAuthoritative && isDemoSeedUhid(row.uhid)) return false;
  return true;
}

/** Platform-backed rows replace prior platform-linked entries; local-only demo rows are retained when not superseded. */
export function mergeLabDepartmentWorklist(
  previous: LabOrder[],
  incoming: LabOrder[],
  platformAuthoritative = false,
): LabOrder[] {
  const incomingOrderIds = new Set(incoming.map((i) => i.orderId));
  const out: LabOrder[] = [...incoming];
  for (const p of previous) {
    if (!retainLocalDepartmentRow(p, platformAuthoritative, Boolean(p.platformLabOrderId))) continue;
    if (incomingOrderIds.has(p.orderId)) continue;
    out.push(p);
  }
  return out;
}

function radiologyBranchStateToUi(s: string): RadiologyOrder['status'] {
  if (s === 'scheduled') return 'Scheduled';
  if (s === 'imaging_in_progress') return 'In Progress';
  if (['awaiting_review', 'critical_review', 'approved'].includes(s)) return 'Completed';
  if (['published', 'completed'].includes(s)) return 'Reported';
  return 'Ordered';
}

export function mapBranchRadiologyRowToOrder(row: Record<string, unknown>): RadiologyOrder {
  const patient = row.patient as { mrn?: string | null; fullName?: string; id?: string } | undefined;
  const pid = patient?.id ?? '';
  const uhid = (patient?.mrn && String(patient.mrn)) || pid.slice(-8).toUpperCase();
  const id = String(row.id ?? '');
  const externalRef = row.externalRef != null ? String(row.externalRef) : null;
  const priorityRaw = String(row.priority ?? 'Routine');
  const priority: RadiologyOrder['priority'] =
    priorityRaw === 'Emergency' || priorityRaw === 'Urgent' || priorityRaw === 'Routine'
      ? priorityRaw
      : 'Routine';
  return {
    orderId: externalRef || `RO-${id.slice(-6)}`,
    platformRadiologyOrderId: id,
    uhid,
    patientName: patient?.fullName ?? 'Unknown',
    study: String(row.study ?? ''),
    modality: String(row.modality ?? ''),
    priority,
    doctor: String(row.orderingDoctor ?? ''),
    orderTime: formatOrderTime(row.createdAt) || '—',
    status: radiologyBranchStateToUi(String(row.state ?? '')),
    critical: Boolean(row.isCritical),
  };
}

export function mergeRadiologyDepartmentWorklist(
  previous: RadiologyOrder[],
  incoming: RadiologyOrder[],
  platformAuthoritative = false,
): RadiologyOrder[] {
  const incomingOrderIds = new Set(incoming.map((i) => i.orderId));
  const out = [...incoming];
  for (const p of previous) {
    if (!retainLocalDepartmentRow(p, platformAuthoritative, Boolean(p.platformRadiologyOrderId))) continue;
    if (incomingOrderIds.has(p.orderId)) continue;
    out.push(p);
  }
  return out;
}

function mapPharmacyStateToUi(state: string): PrescriptionOrder['status'] {
  if (['prescribed', 'awaiting_review'].includes(state)) return 'Pending';
  if (['inventory_reserved', 'preparing', 'ready_to_dispense'].includes(state)) return 'Verified';
  if (state === 'partially_dispensed') return 'Partially dispensed';
  if (['dispensed', 'completed'].includes(state)) return 'Dispensed';
  if (state === 'cancelled') return 'Cancelled';
  return 'Pending';
}

function mapMedicationsJson(meds: unknown): PrescriptionOrder['meds'] {
  if (!Array.isArray(meds)) return [];
  return meds.map((m) => {
    const x = m as Record<string, unknown>;
    return {
      drug: String(x.drug ?? ''),
      dosage: String(x.dosage ?? ''),
      frequency: String(x.frequency ?? ''),
      duration: String(x.duration ?? ''),
      route: String(x.route ?? ''),
      qty: Number(x.qty ?? 0),
      dispensed: Number(x.dispensed ?? 0),
      status: x.status as 'active' | 'stopped' | undefined,
    };
  });
}

export function mapBranchPharmacyRowToPrescription(row: Record<string, unknown>): PrescriptionOrder {
  const patient = row.patient as { mrn?: string | null; fullName?: string; id?: string } | undefined;
  const pid = patient?.id ?? '';
  const uhid = (patient?.mrn && String(patient.mrn)) || pid.slice(-8).toUpperCase();
  const id = String(row.id ?? '');
  const externalRef = row.externalRef != null ? String(row.externalRef) : null;
  const created = typeof row.createdAt === 'string' ? row.createdAt : new Date().toISOString();
  const date = created.split('T')[0] ?? '';
  const priorityRaw = String(row.priority ?? 'Routine');
  const priority: PrescriptionOrder['priority'] =
    priorityRaw === 'Emergency' || priorityRaw === 'Urgent' || priorityRaw === 'Routine'
      ? priorityRaw
      : 'Routine';
  return {
    id: externalRef || `RX-${id.slice(-6)}`,
    platformFulfillmentId: id,
    uhid,
    patientName: patient?.fullName ?? 'Unknown',
    doctor: String(row.prescribingDoctor ?? ''),
    department: String(row.department ?? ''),
    date,
    priority,
    status: mapPharmacyStateToUi(String(row.state ?? '')),
    meds: mapMedicationsJson(row.medications),
  };
}

export function mergePharmacyDepartmentWorklist(
  previous: PrescriptionOrder[],
  incoming: PrescriptionOrder[],
  platformAuthoritative = false,
): PrescriptionOrder[] {
  const incomingIds = new Set(incoming.map((i) => i.id));
  const out = [...incoming];
  for (const p of previous) {
    if (!retainLocalDepartmentRow(p, platformAuthoritative, Boolean(p.platformFulfillmentId))) continue;
    if (incomingIds.has(p.id)) continue;
    out.push(p);
  }
  return out;
}

export async function fetchMappedLabBranchWorklist(): Promise<LabOrder[] | null> {
  if (!isPlatformAuthoritative()) return null;
  try {
    const raw = await platformListLabBranchWorklist();
    if (!Array.isArray(raw)) return null;
    return raw.map((r) => mapBranchLabRowToLabOrder(r as Record<string, unknown>));
  } catch {
    return null;
  }
}

export async function fetchMappedRadiologyBranchWorklist(): Promise<RadiologyOrder[] | null> {
  if (!isPlatformAuthoritative()) return null;
  try {
    const raw = await platformListRadiologyBranchWorklist();
    if (!Array.isArray(raw)) return null;
    return raw.map((r) => mapBranchRadiologyRowToOrder(r as Record<string, unknown>));
  } catch {
    return null;
  }
}

export async function fetchMappedPharmacyBranchWorklist(): Promise<PrescriptionOrder[] | null> {
  if (!isPlatformAuthoritative()) return null;
  try {
    const raw = await platformListPharmacyBranchWorklist();
    if (!Array.isArray(raw)) return null;
    return raw.map((r) => mapBranchPharmacyRowToPrescription(r as Record<string, unknown>));
  } catch {
    return null;
  }
}

export type { PrescriptionOrder };

function mapPlatformAppointmentStatus(
  row: PlatformAppointment,
  visitState?: string,
): HospitalAppointment['status'] {
  if (row.status === 'cancelled') return 'cancelled';
  if (row.status === 'completed') return 'completed';
  if (row.status === 'no_show') return 'no-show';
  if (row.status === 'checked_in') return 'checked-in';
  if (visitState === 'in_consultation' || visitState === 'orders_pending') return 'in-consultation';
  if (visitState && ['routed', 'queued'].includes(visitState)) return 'checked-in';
  if (row.status === 'confirmed') return 'confirmed';
  return 'scheduled';
}

function parseAppointmentResourceLabel(resourceLabel: string): {
  doctor: string;
  department: string;
} {
  const online = resourceLabel.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (online) {
    return {
      doctor: 'Online booking',
      department: online[2]?.trim() || 'Consultation',
    };
  }
  const labelParts = resourceLabel.split(' — ');
  return {
    doctor: labelParts[0]?.trim() || 'Unassigned',
    department: labelParts[1]?.trim() || 'General Medicine',
  };
}

export function mapPlatformAppointmentRow(
  row: PlatformAppointment,
  patients: HospitalPatient[],
  visitByAppointmentId: Map<string, { state: string }>,
): HospitalAppointment {
  const pt = patients.find((p) => p.platformPatientId === row.patientId);
  const uhid = pt?.uhid ?? row.patient?.mrn ?? row.patientId.slice(-8).toUpperCase();
  const start = new Date(row.startAt);
  const end = new Date(row.endAt);
  const durationMin = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60_000) || 30);
  const { doctor, department } = parseAppointmentResourceLabel(row.resourceLabel);
  const doctorResolved = doctor === 'Unassigned' ? pt?.assignedDoctor || doctor : doctor;
  const departmentResolved =
    department === 'General Medicine' && pt?.department ? pt.department : department;
  const visit = visitByAppointmentId.get(row.id);
  const time = start.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return {
    id: `APT-P-${row.id.slice(-8).toUpperCase()}`,
    platformAppointmentId: row.id,
    uhid,
    patientName: pt?.name ?? row.patient?.fullName ?? 'Unknown',
    phone: pt?.phone ?? row.patient?.mrn ?? '',
    doctor: doctorResolved,
    department: departmentResolved,
    date: start.toISOString().split('T')[0] ?? '',
    time,
    duration: durationMin,
    status: mapPlatformAppointmentStatus(row, visit?.state),
    type: 'new',
    notes: '',
  };
}

/** Platform-backed rows replace prior platform-linked entries; local-only demo rows are retained. */
export function mergeAppointmentsFromPlatform(
  previous: HospitalAppointment[],
  incoming: HospitalAppointment[],
): HospitalAppointment[] {
  const prevByPlatform = new Map(
    previous.filter((a) => a.platformAppointmentId).map((a) => [a.platformAppointmentId!, a]),
  );
  const mergedIncoming = incoming.map((row) => {
    const prior = row.platformAppointmentId
      ? prevByPlatform.get(row.platformAppointmentId)
      : undefined;
    if (!prior) return row;
    return {
      ...row,
      id: prior.id,
      notes: prior.notes || row.notes,
      type: prior.type,
    };
  });
  const out = [...mergedIncoming];
  for (const p of previous) {
    if (p.platformAppointmentId) continue;
    out.push(p);
  }
  return out;
}

export async function fetchMappedAppointmentsInRange(
  from: string,
  to: string,
  patients: HospitalPatient[],
  branchId: string,
): Promise<HospitalAppointment[] | null> {
  if (!isPlatformAuthoritative()) return null;
  try {
    const [rows, visits] = await Promise.all([
      platformListAppointmentsInRange(from, to),
      platformListOpdBoard(branchId),
    ]);
    const visitByAppointmentId = new Map<string, { state: string }>();
    for (const v of visits) {
      if (v.appointmentId) {
        visitByAppointmentId.set(v.appointmentId, { state: v.state });
      }
    }
    return rows.map((r) => mapPlatformAppointmentRow(r, patients, visitByAppointmentId));
  } catch {
    return null;
  }
}
