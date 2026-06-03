/** Navayu UAT v0 — mirrors clients/navayu/forms/intake-v0.json */
export const NAVAYU_INTAKE_FORM_ID = 'navayu.patient.intake';
export const NAVAYU_INTAKE_VERSION = 'v0';

export const COMPLAINT_TYPE_OPTIONS = [
  { value: 'pain', label: 'Pain' },
  { value: 'stiffness', label: 'Stiffness' },
  { value: 'weakness', label: 'Weakness' },
  { value: 'numbness', label: 'Numbness / tingling' },
  { value: 'other', label: 'Other' },
] as const;

export const DURATION_OPTIONS = [
  { value: 'lt_1w', label: 'Less than 1 week' },
  { value: '1_4w', label: '1–4 weeks' },
  { value: '1_3m', label: '1–3 months' },
  { value: 'gt_3m', label: 'More than 3 months' },
] as const;

export const RED_FLAG_OPTIONS = [
  { value: 'fever_weight_loss', label: 'Unexplained fever or weight loss' },
  { value: 'bowel_bladder', label: 'Bowel or bladder dysfunction' },
  { value: 'saddle_anesthesia', label: 'Saddle anesthesia' },
  { value: 'progressive_weakness', label: 'Progressive limb weakness' },
  { value: 'trauma', label: 'Recent major trauma' },
  { value: 'night_pain', label: 'Severe night pain' },
  { value: 'none', label: 'None of the above' },
] as const;

export type NavayuIntakePayload = {
  formId: typeof NAVAYU_INTAKE_FORM_ID;
  version: typeof NAVAYU_INTAKE_VERSION;
  visitId: string;
  complaintType: string;
  complaintText: string;
  durationBucket: string;
  vas: number;
  redFlags: string[];
};

export type NavayuIntakeSubmitResult = {
  ok: true;
  stub: boolean;
  storedAt: string;
};
