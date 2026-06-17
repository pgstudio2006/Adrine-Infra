import type { Diagnosis } from '@/pages/doctor/consultation/ConsultationDiagnosis';
import type { Medication } from '@/pages/doctor/consultation/ConsultationMedications';

export type OpdPaymentStatus = 'billing_pending' | 'payment_deferred' | 'paid';
export type OpdExamStatus = 'pending' | 'in_progress' | 'done';

export type DoctorConsultTemplate = {
  id: string;
  name: string;
  diseaseOrTreatment: string;
  medications: Medication[];
  advice: string;
  treatmentPlan: string;
  diagnoses: Diagnosis[];
  createdBy?: string;
  createdAt: string;
};

export type ChiefComplaintTemplate = {
  id: string;
  doctorName: string;
  label: string;
  fields: Array<{ id: string; label: string; type: 'text' | 'select'; options?: string[] }>;
};

export type CounsellorHandoffPayload = {
  visitId?: string;
  uhid: string;
  patientName: string;
  doctorName: string;
  department: string;
  diagnoses: Diagnosis[];
  treatmentPlan: string;
  advice: string;
  nextProcedure?: string;
  medications: Medication[];
  packages: Array<{ code: string; name: string; amountInr: number; discountPercent?: number }>;
  counselNotes?: string;
  careMode: 'OPD' | 'IPD' | 'Daycare';
  savedAt: string;
};

const EXAM_KEY = 'adrine_navayu_opd_exam_status';
const PAYMENT_KEY = 'adrine_navayu_opd_payment_status';
const TEMPLATES_KEY = 'adrine_navayu_doctor_templates';
const COMPLAINT_TEMPLATES_KEY = 'adrine_navayu_chief_complaint_templates';
const HANDOFF_KEY = 'adrine_navayu_counsellor_handoff';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function getOpdExamStatus(uhid: string): OpdExamStatus {
  const map = readJson<Record<string, OpdExamStatus>>(EXAM_KEY, {});
  return map[uhid] ?? 'pending';
}

export function setOpdExamStatus(uhid: string, status: OpdExamStatus): void {
  const map = readJson<Record<string, OpdExamStatus>>(EXAM_KEY, {});
  map[uhid] = status;
  writeJson(EXAM_KEY, map);
}

export function getOpdPaymentStatus(uhid: string): OpdPaymentStatus | undefined {
  const map = readJson<Record<string, OpdPaymentStatus>>(PAYMENT_KEY, {});
  return map[uhid];
}

export function setOpdPaymentStatus(uhid: string, status: OpdPaymentStatus): void {
  const map = readJson<Record<string, OpdPaymentStatus>>(PAYMENT_KEY, {});
  map[uhid] = status;
  writeJson(PAYMENT_KEY, map);
}

export function listDoctorConsultTemplates(doctorName?: string): DoctorConsultTemplate[] {
  const all = readJson<DoctorConsultTemplate[]>(TEMPLATES_KEY, []);
  if (!doctorName) return all;
  return all.filter((item) => !item.createdBy || item.createdBy === doctorName);
}

export function saveDoctorConsultTemplate(template: DoctorConsultTemplate): void {
  const all = readJson<DoctorConsultTemplate[]>(TEMPLATES_KEY, []);
  const index = all.findIndex((item) => item.id === template.id);
  if (index >= 0) {
    all[index] = template;
  } else {
    all.push(template);
  }
  writeJson(TEMPLATES_KEY, all);
}

export function listChiefComplaintTemplates(doctorName?: string): ChiefComplaintTemplate[] {
  const defaults: ChiefComplaintTemplate[] = [
    {
      id: 'msk_spine_default',
      doctorName: '*',
      label: 'MSK Spine intake',
      fields: [
        { id: 'onset', label: 'Onset duration', type: 'text' },
        { id: 'radiation', label: 'Radiation', type: 'select', options: ['None', 'Leg', 'Arm', 'Both'] },
        { id: 'aggravating', label: 'Aggravating factors', type: 'text' },
      ],
    },
  ];
  const stored = readJson<ChiefComplaintTemplate[]>(COMPLAINT_TEMPLATES_KEY, []);
  const merged = [...defaults, ...stored];
  if (!doctorName) return merged;
  return merged.filter((item) => item.doctorName === '*' || item.doctorName === doctorName);
}

export function saveChiefComplaintTemplate(template: ChiefComplaintTemplate): void {
  const stored = readJson<ChiefComplaintTemplate[]>(COMPLAINT_TEMPLATES_KEY, []);
  const index = stored.findIndex((item) => item.id === template.id);
  if (index >= 0) {
    stored[index] = template;
  } else {
    stored.push(template);
  }
  writeJson(COMPLAINT_TEMPLATES_KEY, stored);
}

export function saveCounsellorHandoff(payload: CounsellorHandoffPayload): void {
  const map = readJson<Record<string, CounsellorHandoffPayload>>(HANDOFF_KEY, {});
  map[payload.uhid] = payload;
  writeJson(HANDOFF_KEY, map);
}

export function loadCounsellorHandoff(uhid: string): CounsellorHandoffPayload | null {
  const map = readJson<Record<string, CounsellorHandoffPayload>>(HANDOFF_KEY, {});
  return map[uhid] ?? null;
}

export function sharePrescriptionWhatsApp(params: {
  phone: string;
  patientName: string;
  doctorName: string;
  advice: string;
  medications: Medication[];
}): void {
  const medLines = params.medications
    .map((med) => `• ${med.name} ${med.dosage} — ${med.frequency} × ${med.duration}`)
    .join('\n');
  const text = [
    `Prescription from ${params.doctorName}`,
    `Patient: ${params.patientName}`,
    medLines ? `\nMedications:\n${medLines}` : '',
    params.advice ? `\nAdvice: ${params.advice}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const digits = params.phone.replace(/\D/g, '').slice(-10);
  const url = `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
