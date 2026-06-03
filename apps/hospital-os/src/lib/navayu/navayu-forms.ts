import { getServerTenantForms } from '@/runtime/branch-config';
import { getPlatformSession } from '@/runtime/platform-session';

export type NavayuFormOption = { value: string; label: string };

export type NavayuFormFieldType =
  | 'select'
  | 'boolean'
  | 'multiselect'
  | 'number'
  | 'text'
  | 'calculator'
  | 'pain_map'
  | 'file';

export type NavayuFormField = {
  id: string;
  type: NavayuFormFieldType;
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: NavayuFormOption[];
  calculatorId?: string;
  accept?: string;
  optionsSource?: string;
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

export type NavayuSeniorReviewData = {
  pathwayDecision?: string;
  confirmedDiagnosis?: string;
  seniorNotes?: string;
  savedAt?: string;
};

export type NavayuCalculatorValue = {
  answers?: Record<string, number>;
  score?: number;
  display?: string;
};

export type NavayuFormValues = Record<string, unknown>;

export type NavayuInvestigationUpload = {
  fieldId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  storageKey?: string;
};

export type NavayuProtocolMapData = {
  protocolId: string;
  stageId: string;
  packageTier?: string;
  protocolNotes?: string;
  mappedAt?: string;
};

export const REGION_TO_EXAM_FORM_KEY: Record<string, string> = {
  neck: 'msk_cervical_v0',
  back: 'msk_lumbar_v0',
  knee: 'msk_knee_v0',
  shoulder: 'msk_shoulder_v0',
  hip: 'msk_hip_v0',
  multiple: 'msk_lumbar_v0',
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
        { id: 'odi', type: 'calculator', calculatorId: 'odi', label: 'ODI', required: true },
        { id: 'vas', type: 'calculator', calculatorId: 'vas', label: 'VAS', required: true },
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
          required: true,
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

const DEFAULT_SENIOR_REVIEW_FORM: NavayuFormDefinition = {
  formId: 'navayu.senior.review',
  version: 'v0',
  label: 'Navayu Senior Review',
  sections: [
    {
      id: 'pathway',
      label: 'Pathway decision',
      fields: [
        {
          id: 'pathwayDecision',
          type: 'select',
          label: 'Recommended pathway',
          required: true,
          options: [
            { value: 'conservative', label: 'Conservative / physiotherapy' },
            { value: 'interventional', label: 'Interventional (injection)' },
            { value: 'surgical_consult', label: 'Surgical consult' },
            { value: 'regenerative', label: 'Regenerative protocol' },
            { value: 'observe', label: 'Observe & review' },
          ],
        },
        { id: 'confirmedDiagnosis', type: 'text', label: 'Working diagnosis (senior)' },
        { id: 'seniorNotes', type: 'text', label: 'Senior consultation notes' },
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
      fields: [{ id: 'vas', type: 'calculator', calculatorId: 'vas', label: 'Pain score (VAS)' }],
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

const DEFAULT_CERVICAL_FORM: NavayuFormDefinition = {
  formId: 'navayu.exam.cervical',
  version: 'v0',
  label: 'Navayu Cervical MSK Exam',
  sections: [{ id: 'scores', label: 'Scores', fields: [{ id: 'ndi', type: 'calculator', calculatorId: 'ndi', label: 'NDI' }] }],
};

const DEFAULT_KNEE_FORM: NavayuFormDefinition = {
  formId: 'navayu.exam.knee',
  version: 'v0',
  label: 'Navayu Knee MSK Exam',
  sections: [
    {
      id: 'scores',
      label: 'Scores',
      fields: [
        { id: 'womac', type: 'calculator', calculatorId: 'womac', label: 'WOMAC' },
        { id: 'koos', type: 'calculator', calculatorId: 'koos', label: 'KOOS' },
      ],
    },
  ],
};

const DEFAULT_SHOULDER_FORM: NavayuFormDefinition = {
  formId: 'navayu.exam.shoulder',
  version: 'v0',
  label: 'Navayu Shoulder MSK Exam',
  sections: [
    {
      id: 'scores',
      label: 'Scores',
      fields: [
        { id: 'dash', type: 'calculator', calculatorId: 'dash', label: 'DASH' },
        { id: 'spadi', type: 'calculator', calculatorId: 'spadi', label: 'SPADI' },
      ],
    },
  ],
};

const DEFAULT_HIP_FORM: NavayuFormDefinition = {
  formId: 'navayu.exam.hip',
  version: 'v0',
  label: 'Navayu Hip MSK Exam',
  sections: [
    {
      id: 'scores',
      label: 'Scores',
      fields: [{ id: 'harrisHip', type: 'calculator', calculatorId: 'harris_hip', label: 'Harris Hip' }],
    },
  ],
};

const DEFAULT_INVESTIGATIONS_FORM: NavayuFormDefinition = {
  formId: 'navayu.investigations',
  version: 'v0',
  label: 'Navayu Investigations',
  sections: [
    {
      id: 'imaging',
      label: 'Imaging',
      fields: [
        { id: 'mriUpload', type: 'file', label: 'MRI', accept: 'image/*,.pdf' },
        { id: 'xrayUpload', type: 'file', label: 'X-ray', accept: 'image/*,.pdf' },
      ],
    },
    {
      id: 'labs',
      label: 'Labs',
      fields: [{ id: 'bloodUpload', type: 'file', label: 'Blood work', accept: '.pdf,image/*' }],
    },
  ],
};

const DEFAULT_PROTOCOL_FORM: NavayuFormDefinition = {
  formId: 'navayu.protocol.map',
  version: 'v0',
  label: 'Protocol mapping',
  sections: [
    {
      id: 'protocol',
      label: 'Protocol',
      fields: [
        { id: 'protocolId', type: 'select', label: 'Protocol', options: [] },
        { id: 'stageId', type: 'select', label: 'Stage', options: [] },
      ],
    },
  ],
};

export function getNavayuCervicalForm(): NavayuFormDefinition {
  return loadFormFromBranch('msk_cervical_v0', DEFAULT_CERVICAL_FORM);
}

export function getNavayuKneeForm(): NavayuFormDefinition {
  return loadFormFromBranch('msk_knee_v0', DEFAULT_KNEE_FORM);
}

export function getNavayuShoulderForm(): NavayuFormDefinition {
  return loadFormFromBranch('msk_shoulder_v0', DEFAULT_SHOULDER_FORM);
}

export function getNavayuHipForm(): NavayuFormDefinition {
  return loadFormFromBranch('msk_hip_v0', DEFAULT_HIP_FORM);
}

export function getNavayuInvestigationsForm(): NavayuFormDefinition {
  return loadFormFromBranch('investigations_v0', DEFAULT_INVESTIGATIONS_FORM);
}

export function getNavayuProtocolMapForm(): NavayuFormDefinition {
  return loadFormFromBranch('protocol_map_v0', DEFAULT_PROTOCOL_FORM);
}

/** Resolve region exam forms from registration pain-map selections. */
export function resolveNavayuExamForms(bodyRegions: string[]): NavayuFormDefinition[] {
  const keys = new Set<string>();
  for (const region of bodyRegions) {
    const key = REGION_TO_EXAM_FORM_KEY[region];
    if (key) keys.add(key);
  }
  if (keys.size === 0) keys.add('msk_lumbar_v0');

  const loaders: Record<string, () => NavayuFormDefinition> = {
    msk_lumbar_v0: getNavayuLumbarForm,
    msk_cervical_v0: getNavayuCervicalForm,
    msk_knee_v0: getNavayuKneeForm,
    msk_shoulder_v0: getNavayuShoulderForm,
    msk_hip_v0: getNavayuHipForm,
  };
  return [...keys].map((k) => loaders[k]?.() ?? getNavayuLumbarForm());
}

/** Extract numeric score from calculator widget or legacy number field. */
export function scoreFromField(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'score' in value) {
    const s = (value as NavayuCalculatorValue).score;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

export function getNavayuSeniorReviewForm(): NavayuFormDefinition {
  return loadFormFromBranch('senior_review_v0', DEFAULT_SENIOR_REVIEW_FORM);
}

/** Required lumbar fields from published FormDefinition metadata. */
export function isNavayuLumbarExamComplete(exam: NavayuLumbarExamData): boolean {
  const form = getNavayuLumbarForm();
  for (const section of form.sections) {
    for (const field of section.fields) {
      if (!field.required) continue;
      const value = exam[field.id as keyof NavayuLumbarExamData];
      if (field.type === 'calculator') {
        if (scoreFromField(value) == null) return false;
        continue;
      }
      if (value === undefined || value === '') return false;
    }
  }
  const odiOk = scoreFromField(exam.odi) != null || exam.odi != null;
  const vasOk = scoreFromField(exam.vas) != null || exam.vas != null;
  return odiOk && vasOk && !!exam.slrt;
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
const SENIOR_REVIEW_PREFIX = 'adrine_navayu_senior_review:';

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

export function saveNavayuSeniorReview(uhid: string, data: NavayuSeniorReviewData): void {
  try {
    localStorage.setItem(`${SENIOR_REVIEW_PREFIX}${uhid}`, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadNavayuSeniorReview(uhid: string): NavayuSeniorReviewData {
  try {
    const raw = localStorage.getItem(`${SENIOR_REVIEW_PREFIX}${uhid}`);
    if (!raw) return {};
    return JSON.parse(raw) as NavayuSeniorReviewData;
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
