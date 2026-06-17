export const NAVAYU_REGISTRATION_BRANCHES = ['Gurgaon', 'Pataudi'] as const;

export const NAVAYU_APPOINTMENT_CENTRES = [
  { value: 'navayu_gurgaon', label: 'Navayu Gurgaon' },
  { value: 'ghtc_pataudi', label: 'GHTC Pataudi' },
  { value: 'ayush_hospital_pune', label: 'Ayush Hospital Pune' },
] as const;

export const NAVAYU_REFERRAL_SOURCES = [
  { value: 'google_search', label: 'Google Search' },
  { value: 'website', label: 'Website' },
  { value: 'instagram_facebook', label: 'Instagram & Facebook' },
  { value: 'hoardings', label: 'Hoardings' },
  { value: 'whatsapp_campaign', label: 'Whatsapp Campaign' },
  { value: 'patient_referral', label: 'Patient Referral' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'doctor_referral', label: 'Doctor Referral' },
  { value: 'other', label: 'Other' },
] as const;

export const NAVAYU_COUNSELLORS = [
  { id: 'counsellor_priya', name: 'Priya Sharma' },
  { id: 'counsellor_rahul', name: 'Rahul Verma' },
  { id: 'counsellor_anjali', name: 'Anjali Mehta' },
  { id: 'counsellor_kavita', name: 'Kavita Singh' },
] as const;

/** @deprecated Use india-locations.ts — kept for backward imports */
export {
  INDIA_COUNTRIES as NAVAYU_COUNTRIES,
  STATES_BY_COUNTRY as NAVAYU_STATES,
  INDIA_DISTRICTS as NAVAYU_DISTRICTS,
} from '@/lib/geo/india-locations';

export function pickAutoCounsellorId(): string {
  const pool = NAVAYU_COUNSELLORS;
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? pool[0].id;
}

export function counsellorNameById(id: string): string {
  return NAVAYU_COUNSELLORS.find((item) => item.id === id)?.name ?? 'Unassigned';
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
