export const NAVAYU_REGISTRATION_BRANCHES = ['Navayu', 'Pataudi'] as const;

export const NAVAYU_SERVICE_CATEGORIES = [
  { value: 'spine_joint', label: 'Spine and Joint Care' },
  { value: 'wellness_metabolic', label: 'Wellness and Metabolic Reset' },
] as const;

export const NAVAYU_APPOINTMENT_CENTRES = [
  { value: 'navayu_gurgaon', label: 'Navayu Gurgaon' },
  { value: 'ghtc_pataudi', label: 'GHTC Pataudi' },
  { value: 'ayush_pune', label: 'Ayush Hospital Pune' },
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

export const NAVAYU_COUNTRIES = [
  { value: 'India', label: 'India' },
  { value: 'Nepal', label: 'Nepal' },
  { value: 'Other', label: 'Other' },
] as const;

export const NAVAYU_STATES: Record<string, { value: string; label: string }[]> = {
  India: [
    { value: 'Haryana', label: 'Haryana' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Punjab', label: 'Punjab' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  ],
  Nepal: [{ value: 'Bagmati', label: 'Bagmati' }],
  Other: [{ value: 'Other', label: 'Other' }],
};

export const NAVAYU_DISTRICTS: Record<string, { value: string; label: string }[]> = {
  Haryana: [
    { value: 'Gurugram', label: 'Gurugram' },
    { value: 'Pataudi', label: 'Pataudi' },
    { value: 'Faridabad', label: 'Faridabad' },
    { value: 'Rewari', label: 'Rewari' },
  ],
  Maharashtra: [
    { value: 'Pune', label: 'Pune' },
    { value: 'Mumbai', label: 'Mumbai' },
  ],
  Delhi: [{ value: 'New Delhi', label: 'New Delhi' }],
  Gujarat: [{ value: 'Ahmedabad', label: 'Ahmedabad' }],
  Rajasthan: [{ value: 'Jaipur', label: 'Jaipur' }],
  Punjab: [{ value: 'Chandigarh', label: 'Chandigarh' }],
  'Uttar Pradesh': [{ value: 'Noida', label: 'Noida' }],
  Bagmati: [{ value: 'Kathmandu', label: 'Kathmandu' }],
  Other: [{ value: 'Other', label: 'Other' }],
};

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

export function defaultAppointmentDateTimeLocal(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}
