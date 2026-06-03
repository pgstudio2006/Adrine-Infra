import { getServerTenantForms } from '@/runtime/branch-config';
import { getPlatformSession } from '@/runtime/platform-session';

export type NavayuFormOption = { value: string; label: string };

export type NavayuFormField = {
  id: string;
  type: 'select' | 'boolean' | 'multiselect' | 'number' | 'text';
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: NavayuFormOption[];
};

export type NavayuFormSection = {
  id: string;
  label: string;
  fields: NavayuFormField[];
};

export type NavayuFormDefinition = {
  formId: string;
  version: string;
  label: string;
  sections: NavayuFormSection[];
};

export type NavayuLifestyleFlags = {
  smoker: boolean;
  alcohol: boolean;
  diabetes: boolean;
  htn: boolean;
  thyroid: boolean;
  obesity: boolean;
  prevSurgery: boolean;
  steroidUse: boolean;
  sportsInjury: boolean;
};

export type NavayuRegistrationMetadata = {
  hearAboutNavayu: string;
  lifestyle: NavayuLifestyleFlags;
  bodyRegions: string[];
  registeredAt: string;
};

export type NavayuLumbarExamData = {
  odi?: number;
  vas?: number;
  slrt?: string;
  femoralStretch?: string;
  gait?: string;
  neuroNotes?: string;
};

const NAVAYU_TENANT_ID = 'tenant_navayu';
const VISIT_META_PREFIX = 'adrine_navayu_visit_meta:';

/** Embedded v0 defaults — mirrors clients/navayu/forms/*.json for offline / pre-provision dev. */
const DEFAULT_REGISTRATION_FORM: NavayuFormDefinition = {
  formId: 'navayu.reception.registration',
  version: 'v0',
  label: 'Navayu Reception Registration',
  sections: [
    {
      id: 'referral',
      label: 'Referral source',
      fields: [
        {
          id: 'hearAboutNavayu',
          type: 'select',
          label: 'How did you hear about Navayu?',
          required: true,
          options: [
            { value: 'google', label: 'Google' },
            { value: 'instagram', label: 'Instagram' },
            { value: 'facebook', label: 'Facebook' },
            { value: 'youtube', label: 'YouTube' },
            { value: 'existing_patient', label: 'Existing Patient' },
            { value: 'doctor_referral', label: 'Doctor Referral' },
            { value: 'gp_referral', label: 'GP Referral' },
            { value: 'corporate_camp', label: 'Corporate Camp' },
            { value: 'walk_in', label: 'Walk-in' },
            { value: 'newspaper', label: 'Newspaper' },
            { value: 'village_camp', label: 'Village Camp' },
            { value: 'website', label: 'Website' },
            { value: 'other', label: 'Other' },
          ],
        },
      ],
    },
    {
      id: 'lifestyle',
      label: 'Lifestyle snapshot',
      fields: [
        { id: 'smoker', type: 'boolean', label: 'Smoker' },
        { id: 'alcohol', type: 'boolean', label: 'Alcohol use' },
        { id: 'diabetes', type: 'boolean', label: 'Diabetes' },
        { id: 'htn', type: 'boolean', label: 'Hypertension' },
        { id: 'thyroid', type: 'boolean', label: 'Thyroid disorder' },
        { id: 'obesity', type: 'boolean', label: 'Obesity' },
        { id: 'prevSurgery', type: 'boolean', label: 'Previous surgery' },
        { id: 'steroidUse', type: 'boolean', label: 'Steroid use' },
        { id: 'sportsInjury', type: 'boolean', label: 'Sports injury history' },
      ],
    },
    {
      id: 'pain_regions',
      label: 'Pain regions',
      fields: [
        {
          id: 'bodyRegions',
          type: 'multiselect',
          label: 'Affected regions',
          options: [
            { value: 'neck', label: 'Neck' },
            { value: 'back', label: 'Back / lumbar' },
            { value: 'knee', label: 'Knee' },
            { value: 'shoulder', label: 'Shoulder' },
            { value: 'hip', label: 'Hip' },
            { value: 'multiple', label: 'Multiple regions' },
          ],
        },
      ],
    },
  ],
};

const DEFAULT_LUMBAR_FORM: NavayuFormDefinition = {
  formId: 'navayu.exam.lumbar',
  version: 'v0',
  label: 'Navayu Lumbar MSK Exam',
  sections: [
    {
      id: 'scores',
      label: 'Scores',
      fields: [
        { id: 'odi', type: 'number', label: 'ODI (%)', min: 0, max: 100 },
        { id: 'vas', type: 'number', label: 'VAS (0–10)', min: 0, max: 10 },
      ],
    },
    {
      id: 'exam',
      label: 'Lumbar examination',
      fields: [
        {
          id: 'slrt',
          type: 'select',
          label: 'Straight leg raise',
          options: [
            { value: 'negative', label: 'Negative' },
            { value: 'positive_left', label: 'Positive left' },
            { value: 'positive_right', label: 'Positive right' },
            { value: 'positive_bilateral', label: 'Positive bilateral' },
          ],
        },
        {
          id: 'femoralStretch',
          type: 'select',
          label: 'Femoral stretch test',
          options: [
            { value: 'negative', label: 'Negative' },
            { value: 'positive', label: 'Positive' },
          ],
        },
        { id: 'gait', type: 'text', label: 'Gait / posture notes' },
        { id: 'neuroNotes', type: 'text', label: 'Neurological findings' },
      ],
    },
  ],
};

const DEFAULT_INTAKE_FORM: NavayuFormDefinition = {
  formId: 'navayu.patient.intake',
  version: 'v0',
  label: 'Navayu Patient Intake',
  sections: [
    {
      id: 'complaint',
      label: 'Chief complaint',
      fields: [
        {
          id: 'complaintType',
          type: 'select',
          label: 'Complaint type',
          options: [
            { value: 'pain', label: 'Pain' },
            { value: 'stiffness', label: 'Stiffness' },
            { value: 'weakness', label: 'Weakness' },
            { value: 'numbness', label: 'Numbness / tingling' },
            { value: 'other', label: 'Other' },
          ],
        },
        { id: 'complaintText', type: 'text', label: 'Describe your main problem' },
        {
          id: 'durationBucket',
          type: 'select',
          label: 'Duration',
          options: [
            { value: 'lt_1w', label: 'Less than 1 week' },
            { value: '1_4w', label: '1–4 weeks' },
            { value: '1_3m', label: '1–3 months' },
            { value: 'gt_3m', label: 'More than 3 months' },
          ],
        },
      ],
    },
    {
      id: 'severity',
      label: 'Pain severity',
      fields: [{ id: 'vas', type: 'number', label: 'Pain score (0–10)', min: 0, max: 10 }],
    },
    {
      id: 'red_flags',
      label: 'Red flags',
      fields: [
        {
          id: 'redFlag',
          type: 'multiselect',
          label: 'Any of the following?',
          options: [
            { value: 'fever_weight_loss', label: 'Unexplained fever or weight loss' },
            { value: 'bowel_bladder', label: 'Bowel or bladder dysfunction' },
            { value: 'saddle_anesthesia', label: 'Saddle anesthesia' },
            { value: 'progressive_weakness', label: 'Progressive limb weakness' },
            { value: 'trauma', label: 'Recent major trauma' },
            { value: 'night_pain', label: 'Severe night pain' },
            { value: 'none', label: 'None of the above' },
          ],
        },
      ],
    },
  ],
};

export const NAVAYU_CLINICAL_DEPARTMENTS = [
  'Spine & MSK',
  'Joint / Knee',
  'Sports Injury',
  'Physiotherapy',
  'Pain Management',
];

export const DEFAULT_NAVAYU_LIFESTYLE: NavayuLifestyleFlags = {
  smoker: false,
  alcohol: false,
  diabetes: false,
  htn: false,
  thyroid: false,
  obesity: false,
  prevSurgery: false,
  steroidUse: false,
  sportsInjury: false,
};

function coerceFormDefinition(value: unknown, fallback: NavayuFormDefinition): NavayuFormDefinition {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }
  const source = value as Partial<NavayuFormDefinition>;
  if (!Array.isArray(source.sections)) {
    return fallback;
  }
  return {
    formId: typeof source.formId === 'string' ? source.formId : fallback.formId,
    version: typeof source.version === 'string' ? source.version : fallback.version,
    label: typeof source.label === 'string' ? source.label : fallback.label,
    sections: source.sections as NavayuFormSection[],
  };
}

function loadFormFromBranch(key: string, fallback: NavayuFormDefinition): NavayuFormDefinition {
  const forms = getServerTenantForms();
  if (!forms?.[key]) {
    return fallback;
  }
  return coerceFormDefinition(forms[key], fallback);
}

export function isNavayuTenant(): boolean {
  const session = getPlatformSession();
  const devTenant = import.meta.env.VITE_DEV_TENANT_ID as string | undefined;
  if (session?.tenantId === NAVAYU_TENANT_ID || devTenant === NAVAYU_TENANT_ID) {
    return true;
  }
  const forms = getServerTenantForms();
  return !!(forms && ('registration_v0' in forms || 'msk_lumbar_v0' in forms));
}

export function getNavayuRegistrationForm(): NavayuFormDefinition {
  return loadFormFromBranch('registration_v0', DEFAULT_REGISTRATION_FORM);
}

export function getNavayuLumbarForm(): NavayuFormDefinition {
  return loadFormFromBranch('msk_lumbar_v0', DEFAULT_LUMBAR_FORM);
}

export function getNavayuIntakeForm(): NavayuFormDefinition {
  return loadFormFromBranch('intake_v0', DEFAULT_INTAKE_FORM);
}

export function getNavayuReferralOptions(): NavayuFormOption[] {
  const form = getNavayuRegistrationForm();
  const field = form.sections
    .find((section) => section.id === 'referral')
    ?.fields.find((item) => item.id === 'hearAboutNavayu');
  return field?.options ?? DEFAULT_REGISTRATION_FORM.sections[0].fields[0].options ?? [];
}

export function getNavayuLifestyleFields(): NavayuFormField[] {
  const form = getNavayuRegistrationForm();
  return form.sections.find((section) => section.id === 'lifestyle')?.fields ?? [];
}

export function getNavayuPainRegionOptions(): NavayuFormOption[] {
  const form = getNavayuRegistrationForm();
  const field = form.sections
    .find((section) => section.id === 'pain_regions')
    ?.fields.find((item) => item.id === 'bodyRegions');
  return field?.options ?? [];
}

export function referralLabel(value: string): string {
  return getNavayuReferralOptions().find((option) => option.value === value)?.label ?? value;
}

export function painRegionLabel(value: string): string {
  return getNavayuPainRegionOptions().find((option) => option.value === value)?.label ?? value;
}

export function saveNavayuVisitMetadata(uhid: string, metadata: NavayuRegistrationMetadata): void {
  try {
    localStorage.setItem(`${VISIT_META_PREFIX}${uhid}`, JSON.stringify(metadata));
  } catch {
    /* ignore quota errors in demo */
  }
}

export function loadNavayuVisitMetadata(uhid: string): NavayuRegistrationMetadata | null {
  try {
    const raw = localStorage.getItem(`${VISIT_META_PREFIX}${uhid}`);
    if (!raw) return null;
    return JSON.parse(raw) as NavayuRegistrationMetadata;
  } catch {
    return null;
  }
}

const LUMBAR_EXAM_PREFIX = 'adrine_navayu_lumbar_exam:';

export function saveNavayuLumbarExam(uhid: string, data: NavayuLumbarExamData): void {
  try {
    localStorage.setItem(`${LUMBAR_EXAM_PREFIX}${uhid}`, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadNavayuLumbarExam(uhid: string): NavayuLumbarExamData {
  try {
    const raw = localStorage.getItem(`${LUMBAR_EXAM_PREFIX}${uhid}`);
    if (!raw) return {};
    return JSON.parse(raw) as NavayuLumbarExamData;
  } catch {
    return {};
  }
}

export function isNavayuSeniorDoctor(email?: string | null): boolean {
  return !!email && /senior@navayuhealth\.in$/i.test(email);
}

export function buildNavayuRegistrationNotes(metadata: NavayuRegistrationMetadata): string {
  const lifestyleActive = Object.entries(metadata.lifestyle)
    .filter(([, active]) => active)
    .map(([key]) => key)
    .join(', ');
  const regions = metadata.bodyRegions.map(painRegionLabel).join(', ');
  return [
    `Navayu MSK registration`,
    `Referral: ${referralLabel(metadata.hearAboutNavayu)}`,
    regions ? `Pain regions: ${regions}` : null,
    lifestyleActive ? `Lifestyle flags: ${lifestyleActive}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
