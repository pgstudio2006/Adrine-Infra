// ── AI Engine Constants & Thresholds ──

/** Age bucket boundaries for demographic analysis */
export const AGE_BUCKETS = [
  { label: '0-10', min: 0, max: 10 },
  { label: '11-20', min: 11, max: 20 },
  { label: '21-30', min: 21, max: 30 },
  { label: '31-40', min: 31, max: 40 },
  { label: '41-50', min: 41, max: 50 },
  { label: '51-60', min: 51, max: 60 },
  { label: '61-70', min: 61, max: 70 },
  { label: '71+', min: 71, max: Infinity },
] as const;

/** Invoice aging buckets (days) */
export const AGING_BUCKETS = [
  { label: '0-30 days', min: 0, max: 30, color: '#10b981' },
  { label: '31-60 days', min: 31, max: 60, color: '#3b82f6' },
  { label: '61-90 days', min: 61, max: 90, color: '#f59e0b' },
  { label: '90+ days', min: 91, max: Infinity, color: '#ef4444' },
] as const;

/** Payer mix colors keyed by category */
export const PAYER_COLORS: Record<string, string> = {
  general: 'hsl(var(--primary))',
  corporate: 'hsl(var(--accent-foreground))',
  insurance: 'hsl(var(--destructive))',
  government: 'hsl(var(--muted-foreground))',
  vip: 'hsl(var(--secondary-foreground))',
};

/** Scoring weights for doctor performance */
export const DOCTOR_SCORE_WEIGHTS = {
  volume: 0.6,
  completion: 0.4,
} as const;

/** Workload thresholds */
export const WORKLOAD_THRESHOLDS = {
  overloadedMultiplier: 2.0,
  underutilizedMultiplier: 0.5,
} as const;

/** Shift coverage gap threshold */
export const SHIFT_COVERAGE_GAP_THRESHOLD = 0.5;

/** Procurement thresholds */
export const PROCUREMENT_THRESHOLDS = {
  expiryWarningDays: 90,
  vendorConcentrationPct: 50,
  criticalStockMultiplier: 0,
  highStockMultiplier: 0.5,
} as const;

/** Collection rate alert thresholds */
export const COLLECTION_THRESHOLDS = {
  criticalRate: 50,
  warningRate: 75,
} as const;

/** Default score range */
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

/** Scoring weights for hospital health & doctor performance */
export const SCORING_WEIGHTS = {
  hospitalHealth: {
    collectionRate: 0.20,
    bedUtilization: 0.20,
    clinicalSafety: 0.25,
    erCapacity: 0.15,
    staffWorkload: 0.10,
    procurement: 0.10,
  },
  doctorPerformance: {
    patientVolume: 0.30,
    consultationComplete: 0.25,
    labOrderFollowUp: 0.20,
    ipdOutcomes: 0.25,
  },
} as const;

// ── Clinical Intelligence Constants ──

export interface DrugInteractionEntry {
  drugA: string;
  drugB: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  effect: string;
  recommendation: string;
}

export const DRUG_INTERACTION_DB: DrugInteractionEntry[] = [
  { drugA: 'warfarin', drugB: 'aspirin', severity: 'critical', effect: 'Greatly increased bleeding risk due to combined anticoagulant and antiplatelet effect.', recommendation: 'Avoid combination or monitor INR closely. Consider alternative antiplatelet if needed.' },
  { drugA: 'metformin', drugB: 'contrast dye', severity: 'high', effect: 'Risk of lactic acidosis when metformin is combined with iodinated contrast agents.', recommendation: 'Withhold metformin 48 hours before and after contrast administration.' },
  { drugA: 'atorvastatin', drugB: 'clarithromycin', severity: 'high', effect: 'Clarithromycin inhibits CYP3A4 metabolism of atorvastatin, increasing rhabdomyolysis risk.', recommendation: 'Use azithromycin instead or temporarily pause statin.' },
  { drugA: 'amlodipine', drugB: 'simvastatin', severity: 'medium', effect: 'Amlodipine increases simvastatin levels, raising myopathy risk.', recommendation: 'Limit simvastatin to 20mg when combined with amlodipine.' },
  { drugA: 'methotrexate', drugB: 'nsaid', severity: 'critical', effect: 'NSAIDs reduce methotrexate renal clearance, causing severe toxicity.', recommendation: 'Avoid combination. If necessary, monitor methotrexate levels closely.' },
  { drugA: 'digoxin', drugB: 'amiodarone', severity: 'high', effect: 'Amiodarone increases digoxin serum concentration by 70-100%.', recommendation: 'Reduce digoxin dose by 50% and monitor serum digoxin levels.' },
  { drugA: 'clopidogrel', drugB: 'omeprazole', severity: 'medium', effect: 'Omeprazole inhibits CYP2C19-mediated activation of clopidogrel, reducing efficacy.', recommendation: 'Switch to pantoprazole or rabeprazole which have minimal CYP2C19 effect.' },
  { drugA: 'lithium', drugB: 'ace inhibitor', severity: 'high', effect: 'ACE inhibitors reduce lithium excretion, causing lithium toxicity.', recommendation: 'Monitor lithium levels closely. Consider dose adjustment or alternative mood stabilizer.' },
  { drugA: 'ciprofloxacin', drugB: 'theophylline', severity: 'high', effect: 'Ciprofloxacin inhibits theophylline metabolism, causing toxicity (seizures, arrhythmias).', recommendation: 'Reduce theophylline dose by 30-50% or use alternative antibiotic.' },
  { drugA: 'fluconazole', drugB: 'warfarin', severity: 'critical', effect: 'Fluconazole inhibits warfarin metabolism via CYP2C9, dramatically increasing INR.', recommendation: 'Reduce warfarin dose and monitor INR daily during fluconazole therapy.' },
  { drugA: 'morphine', drugB: 'benzodiazepine', severity: 'critical', effect: 'Combined CNS and respiratory depression. High risk of fatal overdose.', recommendation: 'Avoid combination. If medically necessary, use lowest effective doses with monitoring.' },
  { drugA: 'aspirin', drugB: 'ibuprofen', severity: 'medium', effect: 'Ibuprofen blocks the irreversible antiplatelet effect of aspirin.', recommendation: 'If both needed, take aspirin at least 30 minutes before ibuprofen.' },
  { drugA: 'insulin', drugB: 'beta-blocker', severity: 'medium', effect: 'Beta-blockers mask symptoms of hypoglycemia (tremor, tachycardia).', recommendation: 'Monitor blood glucose more frequently. Educate patient on atypical hypoglycemia signs.' },
  { drugA: 'potassium', drugB: 'spironolactone', severity: 'high', effect: 'Both increase serum potassium; combination may cause life-threatening hyperkalemia.', recommendation: 'Avoid potassium supplements with spironolactone. Monitor serum potassium levels.' },
];

export const DRUG_ALLERGY_CROSS_REACTIVITY: Record<string, { drugs: string[]; severity: 'critical' | 'high' | 'medium'; reaction: string }> = {
  penicillin: {
    drugs: ['amoxicillin', 'ampicillin', 'piperacillin', 'penicillin', 'augmentin', 'amoxyclav', 'co-amoxiclav', 'flucloxacillin', 'dicloxacillin', 'nafcillin', 'oxacillin'],
    severity: 'critical',
    reaction: 'Anaphylaxis risk. Penicillin allergy cross-reacts with all penicillin-class antibiotics.',
  },
  sulfa: {
    drugs: ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole', 'bactrim', 'septran', 'cotrimoxazole', 'sulfasalazine', 'dapsone', 'sulfadiazine'],
    severity: 'critical',
    reaction: 'Sulfonamide hypersensitivity. May cause Stevens-Johnson syndrome or severe rash.',
  },
  cephalosporin: {
    drugs: ['cefixime', 'ceftriaxone', 'cephalexin', 'cefuroxime', 'cefotaxime', 'cefazolin', 'cefepime', 'cefpodoxime'],
    severity: 'high',
    reaction: 'Cephalosporin allergy. ~2% cross-reactivity with penicillin-allergic patients.',
  },
  nsaid: {
    drugs: ['ibuprofen', 'diclofenac', 'naproxen', 'aspirin', 'ketorolac', 'piroxicam', 'indomethacin', 'mefenamic acid', 'celecoxib'],
    severity: 'high',
    reaction: 'NSAID hypersensitivity. May cause bronchospasm, urticaria, or angioedema.',
  },
  aspirin: {
    drugs: ['aspirin', 'ecosprin', 'disprin'],
    severity: 'high',
    reaction: 'Aspirin-exacerbated respiratory disease or urticaria. Cross-reacts with other NSAIDs in some patients.',
  },
  morphine: {
    drugs: ['morphine', 'codeine', 'hydromorphone', 'oxycodone', 'fentanyl', 'tramadol', 'pethidine'],
    severity: 'high',
    reaction: 'Opioid hypersensitivity. May cause histamine release, pruritus, respiratory depression.',
  },
  iodine: {
    drugs: ['contrast dye', 'povidone-iodine', 'amiodarone', 'iodinated contrast'],
    severity: 'medium',
    reaction: 'Iodine sensitivity. Not a true allergy in most cases but may cause contrast reactions.',
  },
  latex: {
    drugs: [],
    severity: 'medium',
    reaction: 'Latex allergy. No direct drug cross-reactivity but affects procedure materials.',
  },
  egg: {
    drugs: ['propofol'],
    severity: 'medium',
    reaction: 'Egg allergy patients may react to propofol (contains egg lecithin).',
  },
};

export interface CriticalLabRange {
  testName: string;
  unit: string;
  normalLow: number;
  normalHigh: number;
  criticalLow: number;
  criticalHigh: number;
}

export const CRITICAL_LAB_RANGES: CriticalLabRange[] = [
  { testName: 'Hemoglobin', unit: 'g/dL', normalLow: 12.0, normalHigh: 17.5, criticalLow: 7.0, criticalHigh: 20.0 },
  { testName: 'Platelet Count', unit: 'x10^3/uL', normalLow: 150, normalHigh: 400, criticalLow: 50, criticalHigh: 1000 },
  { testName: 'WBC', unit: 'x10^3/uL', normalLow: 4.0, normalHigh: 11.0, criticalLow: 2.0, criticalHigh: 30.0 },
  { testName: 'Potassium', unit: 'mEq/L', normalLow: 3.5, normalHigh: 5.0, criticalLow: 2.5, criticalHigh: 6.5 },
  { testName: 'Sodium', unit: 'mEq/L', normalLow: 136, normalHigh: 145, criticalLow: 120, criticalHigh: 160 },
  { testName: 'Glucose', unit: 'mg/dL', normalLow: 70, normalHigh: 100, criticalLow: 40, criticalHigh: 500 },
  { testName: 'Creatinine', unit: 'mg/dL', normalLow: 0.7, normalHigh: 1.3, criticalLow: 0, criticalHigh: 10.0 },
  { testName: 'BUN', unit: 'mg/dL', normalLow: 7, normalHigh: 20, criticalLow: 0, criticalHigh: 100 },
  { testName: 'INR', unit: '', normalLow: 0.8, normalHigh: 1.2, criticalLow: 0, criticalHigh: 5.0 },
  { testName: 'Troponin I', unit: 'ng/mL', normalLow: 0, normalHigh: 0.04, criticalLow: 0, criticalHigh: 0.1 },
  { testName: 'Calcium', unit: 'mg/dL', normalLow: 8.5, normalHigh: 10.5, criticalLow: 6.0, criticalHigh: 13.0 },
  { testName: 'Magnesium', unit: 'mg/dL', normalLow: 1.7, normalHigh: 2.2, criticalLow: 1.0, criticalHigh: 4.7 },
  { testName: 'Lactate', unit: 'mmol/L', normalLow: 0.5, normalHigh: 2.0, criticalLow: 0, criticalHigh: 4.0 },
  { testName: 'pH', unit: '', normalLow: 7.35, normalHigh: 7.45, criticalLow: 7.1, criticalHigh: 7.6 },
  { testName: 'pO2', unit: 'mmHg', normalLow: 80, normalHigh: 100, criticalLow: 40, criticalHigh: 200 },
  { testName: 'pCO2', unit: 'mmHg', normalLow: 35, normalHigh: 45, criticalLow: 20, criticalHigh: 70 },
  { testName: 'Bilirubin Total', unit: 'mg/dL', normalLow: 0.1, normalHigh: 1.2, criticalLow: 0, criticalHigh: 15.0 },
  { testName: 'ALT', unit: 'U/L', normalLow: 7, normalHigh: 56, criticalLow: 0, criticalHigh: 1000 },
  { testName: 'AST', unit: 'U/L', normalLow: 10, normalHigh: 40, criticalLow: 0, criticalHigh: 1000 },
];

export interface VitalRange {
  name: string;
  unit: string;
  normalLow: number;
  normalHigh: number;
  warningLow: number;
  warningHigh: number;
  criticalLow: number;
  criticalHigh: number;
}

export const VITAL_RANGES: Record<string, VitalRange> = {
  systolicBP: { name: 'Systolic BP', unit: 'mmHg', normalLow: 90, normalHigh: 140, warningLow: 80, warningHigh: 160, criticalLow: 70, criticalHigh: 180 },
  diastolicBP: { name: 'Diastolic BP', unit: 'mmHg', normalLow: 60, normalHigh: 90, warningLow: 50, warningHigh: 100, criticalLow: 40, criticalHigh: 120 },
  pulse: { name: 'Pulse', unit: 'bpm', normalLow: 60, normalHigh: 100, warningLow: 50, warningHigh: 110, criticalLow: 40, criticalHigh: 130 },
  temperature: { name: 'Temperature', unit: 'F', normalLow: 97.0, normalHigh: 99.5, warningLow: 96.0, warningHigh: 100.9, criticalLow: 95.0, criticalHigh: 103.0 },
  spo2: { name: 'SpO2', unit: '%', normalLow: 95, normalHigh: 100, warningLow: 92, warningHigh: 100, criticalLow: 88, criticalHigh: 100 },
  painScore: { name: 'Pain Score', unit: '/10', normalLow: 0, normalHigh: 3, warningLow: 0, warningHigh: 6, criticalLow: 0, criticalHigh: 10 },
};

export const WARD_CAPACITY: Record<string, number> = {
  'ICU': 8,
  'General Ward': 30,
  'Cardiac Ward': 12,
  'Maternity Ward': 15,
  'Pediatric Ward': 12,
  'Orthopedic Ward': 10,
  'Surgical Ward': 15,
  'Neuro Ward': 8,
  'Newborn Care Unit': 10,
  'Dialysis Unit': 6,
  'Trauma Observation': 8,
  'ENT Ward': 6,
  'Urology Ward': 6,
  'Women & Mother Care': 10,
};

export const THRESHOLDS = {
  AVERAGE_LOS: {
    'ICU': 5,
    'General Ward': 7,
    'Cardiac Ward': 6,
    'Maternity Ward': 3,
    'Pediatric Ward': 4,
    'Orthopedic Ward': 7,
    'Surgical Ward': 5,
    'Neuro Ward': 7,
    'Newborn Care Unit': 5,
    'Dialysis Unit': 1,
    'Trauma Observation': 3,
    default: 5,
  } as Record<string, number>,

  ANTIBIOTIC_REVIEW_DAYS: 3,
  BED_OCCUPANCY_HIGH: 80,
  BED_OCCUPANCY_CRITICAL: 95,
  EMERGENCY_SURGE_THRESHOLD: 5,
  QUEUE_WAIT_WARNING_MINUTES: 30,
  QUEUE_WAIT_CRITICAL_MINUTES: 60,
  AVG_CONSULTATION_MINUTES: 15,
  DISCHARGE_DELAY_WARNING_HOURS: 4,
  DISCHARGE_DELAY_CRITICAL_HOURS: 12,
  DISCOUNT_ABUSE_PERCENT: 20,
  COLLECTION_RATE_WARNING: 70,
  COLLECTION_RATE_CRITICAL: 50,
  DEPARTMENT_LOAD_BUSY: 70,
  DEPARTMENT_LOAD_OVERLOADED: 90,
} as const;

export const ANTIBIOTIC_KEYWORDS: string[] = [
  'amoxicillin', 'ampicillin', 'penicillin', 'piperacillin', 'flucloxacillin',
  'ceftriaxone', 'cefixime', 'cephalexin', 'cefuroxime', 'cefotaxime', 'cefazolin', 'cefepime',
  'azithromycin', 'clarithromycin', 'erythromycin',
  'ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'ofloxacin', 'norfloxacin',
  'metronidazole', 'tinidazole',
  'doxycycline', 'tetracycline', 'minocycline',
  'vancomycin', 'linezolid', 'clindamycin',
  'gentamicin', 'amikacin', 'tobramycin',
  'meropenem', 'imipenem', 'ertapenem',
  'cotrimoxazole', 'sulfamethoxazole', 'trimethoprim',
  'nitrofurantoin', 'fosfomycin',
  'colistin', 'polymyxin',
];
