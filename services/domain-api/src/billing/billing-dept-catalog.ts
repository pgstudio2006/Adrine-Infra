/** Governed billing catalog — server source of truth (not UI demo tables). */
export type CatalogPackage = {
  code: string;
  name: string;
  category: string;
  priceCents: number;
  validity: string;
  active: boolean;
  services: { service: string; dept: string; included: boolean }[];
};

export type CatalogHealthPlan = {
  code: string;
  name: string;
  tests: number;
  priceCents: number;
  discountedPriceCents: number;
  category: string;
  ageGroup: string;
  gender: string;
  status: string;
  testNames: string[];
};

export type CatalogTpaProvider = {
  code: string;
  name: string;
  type: 'Insurance' | 'Corporate' | 'Government';
  status: string;
};

export type CatalogTpaRateRow = {
  service: string;
  generalCents: number;
  ratesByPayer: Record<string, number>;
};

export const BILLING_DEPT_PACKAGES: CatalogPackage[] = [
  {
    code: 'PKG-001',
    name: 'Appendectomy Package',
    category: 'Surgery',
    priceCents: 4_500_000,
    validity: '5 days stay',
    active: true,
    services: [
      { service: 'General Ward — 5 days', dept: 'IPD', included: true },
      { service: 'Appendectomy Surgery', dept: 'Surgery', included: true },
      { service: 'General Anesthesia', dept: 'OT', included: true },
      { service: 'Pre-op investigations', dept: 'Laboratory', included: true },
      { service: 'Post-op medications — 5 days', dept: 'Pharmacy', included: true },
      { service: 'Nursing care', dept: 'Nursing', included: true },
      { service: 'X-ray Chest PA (if needed)', dept: 'Radiology', included: false },
    ],
  },
  {
    code: 'PKG-002',
    name: 'Normal Delivery Package',
    category: 'Maternity',
    priceCents: 3_500_000,
    validity: '3 days stay',
    active: true,
    services: [
      { service: 'Maternity Ward — 3 days', dept: 'IPD', included: true },
      { service: 'Normal Delivery charges', dept: 'OB-GYN', included: true },
      { service: 'Routine lab investigations', dept: 'Laboratory', included: true },
      { service: 'Medications — 3 days', dept: 'Pharmacy', included: true },
      { service: 'Newborn care — basic', dept: 'Pediatrics', included: true },
    ],
  },
  {
    code: 'NAV-MSK-BASIC',
    name: 'Navayu MSK — Basic Care Package',
    category: 'MSK',
    priceCents: 2_500_000,
    validity: '12 weeks program',
    active: true,
    services: [
      { service: 'Senior MSK consultation', dept: 'Orthopedics', included: true },
      { service: 'Structured physiotherapy — 8 sessions', dept: 'Rehab', included: true },
      { service: 'Pain management review', dept: 'Medicine', included: true },
      { service: 'Home exercise program', dept: 'Rehab', included: true },
    ],
  },
  {
    code: 'NAV-MSK-ADV',
    name: 'Navayu MSK — Advanced Care Package',
    category: 'MSK',
    priceCents: 7_500_000,
    validity: '16 weeks program',
    active: true,
    services: [
      { service: 'Senior MSK consultation — 2 visits', dept: 'Orthopedics', included: true },
      { service: 'Structured physiotherapy — 16 sessions', dept: 'Rehab', included: true },
      { service: 'Diagnostic imaging review', dept: 'Radiology', included: true },
      { service: 'Nutrition counselling', dept: 'Medicine', included: true },
    ],
  },
  {
    code: 'NAV-MSK-REGEN',
    name: 'Navayu MSK — Regenerative Package',
    category: 'MSK',
    priceCents: 15_000_000,
    validity: '20 weeks program',
    active: true,
    services: [
      { service: 'Regenerative consult planning', dept: 'Orthopedics', included: true },
      { service: 'PRP / ozone pathway (as indicated)', dept: 'OT', included: true },
      { service: 'Physiotherapy — 20 sessions', dept: 'Rehab', included: true },
      { service: 'Follow-up imaging', dept: 'Radiology', included: true },
    ],
  },
  {
    code: 'NAV-MSK-PREM',
    name: 'Navayu MSK — Premium Package',
    category: 'MSK',
    priceCents: 25_000_000,
    validity: '24 weeks program',
    active: true,
    services: [
      { service: 'Multidisciplinary MSK board review', dept: 'Orthopedics', included: true },
      { service: 'Regenerative + surgical pathway coordination', dept: 'OT', included: true },
      { service: 'Dedicated care coordinator', dept: 'CRM', included: true },
      { service: 'Premium rehab suite access', dept: 'Rehab', included: true },
    ],
  },
  {
    code: 'PKG-003',
    name: 'Premium Health Checkup',
    category: 'Preventive',
    priceCents: 599_900,
    validity: '1 day',
    active: true,
    services: [
      { service: 'Complete Blood Count', dept: 'Laboratory', included: true },
      { service: 'Lipid Profile', dept: 'Laboratory', included: true },
      { service: 'Liver Function Test', dept: 'Laboratory', included: true },
      { service: 'Kidney Function Test', dept: 'Laboratory', included: true },
      { service: 'Thyroid Profile', dept: 'Laboratory', included: true },
      { service: 'X-ray Chest PA', dept: 'Radiology', included: true },
      { service: 'Ultrasound Abdomen', dept: 'Radiology', included: true },
      { service: 'ECG', dept: 'Cardiology', included: true },
      { service: 'Doctor Consultation', dept: 'Medicine', included: true },
    ],
  },
];

export const BILLING_DEPT_HEALTH_PLANS: CatalogHealthPlan[] = [
  {
    code: 'HCP-001',
    name: 'Basic Health Checkup',
    tests: 12,
    priceCents: 149_900,
    discountedPriceCents: 119_900,
    category: 'Basic',
    ageGroup: 'All Ages',
    gender: 'Both',
    status: 'active',
    testNames: ['CBC', 'Blood Sugar', 'Lipid Profile', 'Liver Function', 'Kidney Function', 'Urine Routine', 'TSH', 'Chest X-Ray', 'ECG', 'BMI', 'Blood Pressure', 'Eye Screening'],
  },
  {
    code: 'HCP-002',
    name: 'Executive Health Checkup',
    tests: 28,
    priceCents: 499_900,
    discountedPriceCents: 399_900,
    category: 'Premium',
    ageGroup: '25-60',
    gender: 'Both',
    status: 'active',
    testNames: ['Full metabolic panel', 'Vitamin D', 'TMT', 'USG Abdomen', 'Doctor consultation'],
  },
  {
    code: 'HCP-003',
    name: 'Cardiac Screening Package',
    tests: 15,
    priceCents: 650_000,
    discountedPriceCents: 550_000,
    category: 'Specialty',
    ageGroup: '40+',
    gender: 'Both',
    status: 'active',
    testNames: ['ECG', 'Echo', 'Lipid profile', 'Cardiology consult'],
  },
];

export const BILLING_DEPT_TPA_PROVIDERS: CatalogTpaProvider[] = [
  { code: 'star_health', name: 'Star Health TPA', type: 'Insurance', status: 'Active' },
  { code: 'medi_assist', name: 'Medi Assist TPA', type: 'Insurance', status: 'Active' },
  { code: 'icici_lombard', name: 'ICICI Lombard', type: 'Insurance', status: 'Active' },
  { code: 'infosys', name: 'Infosys Ltd.', type: 'Corporate', status: 'Active' },
  { code: 'pmjay', name: 'PMJAY / Ayushman', type: 'Government', status: 'Active' },
];

export const BILLING_DEPT_TPA_RATES: CatalogTpaRateRow[] = [
  {
    service: 'OPD Consultation (General)',
    generalCents: 50_000,
    ratesByPayer: { star_health: 45_000, medi_assist: 40_000, infosys: 35_000, pmjay: 30_000 },
  },
  {
    service: 'ICU Charges (per day)',
    generalCents: 800_000,
    ratesByPayer: { star_health: 700_000, medi_assist: 650_000, infosys: 600_000, pmjay: 450_000 },
  },
  {
    service: 'Appendectomy (package)',
    generalCents: 4_500_000,
    ratesByPayer: { star_health: 4_000_000, medi_assist: 3_800_000, pmjay: 2_500_000 },
  },
];

export const HIGH_COST_CHARGE_THRESHOLD_CENTS = 500_000;

export const INSURANCE_MODES_REQUIRING_PREAUTH = new Set(['insurance', 'tpa']);

export type CatalogChargeItem = {
  id: string;
  code: string;
  name: string;
  type: 'room' | 'procedure' | 'consultation' | 'pharmacy' | 'lab' | 'radiology' | 'misc';
  department: string;
  hsnSac: string;
  baseRateCents: number;
  cgst: number;
  sgst: number;
  igst: number;
  effectiveFrom: string;
  effectiveTo: string;
  status: 'active' | 'inactive';
  packageFlag: boolean;
  notes?: string;
};

/** Governed charge master — server source of truth for billing-dept tariff screens. */
export const BILLING_CHARGE_MASTER: CatalogChargeItem[] = [
  { id: 'CH001', code: 'ROOM-GEN', name: 'General Ward (per day)', type: 'room', department: 'IPD', hsnSac: '996311', baseRateCents: 25_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: false },
  { id: 'CH002', code: 'ROOM-ICU', name: 'ICU (per day)', type: 'room', department: 'IPD', hsnSac: '996311', baseRateCents: 80_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: false },
  { id: 'CH003', code: 'CONS-GEN', name: 'General Consultation', type: 'consultation', department: 'OPD', hsnSac: '998311', baseRateCents: 50_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: false },
  { id: 'CH004', code: 'CONS-SPEC', name: 'Specialist Consultation', type: 'consultation', department: 'OPD', hsnSac: '998312', baseRateCents: 100_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: false },
  { id: 'CH005', code: 'PROC-CSEC', name: 'Caesarean Section', type: 'procedure', department: 'OT', hsnSac: '998332', baseRateCents: 3_500_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: true },
  { id: 'CH006', code: 'PROC-LAP', name: 'Laparoscopic Cholecystectomy', type: 'procedure', department: 'OT', hsnSac: '998332', baseRateCents: 5_500_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: true },
  { id: 'CH007', code: 'LAB-CBC', name: 'Complete Blood Count', type: 'lab', department: 'Lab', hsnSac: '998311', baseRateCents: 35_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: false },
  { id: 'CH008', code: 'RAD-XR', name: 'Chest X-Ray PA View', type: 'radiology', department: 'Radiology', hsnSac: '998312', baseRateCents: 60_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: false },
  { id: 'CH009', code: 'PHARM-PCM', name: 'Paracetamol 500mg (10 tabs)', type: 'pharmacy', department: 'Pharmacy', hsnSac: '300490', baseRateCents: 4_500, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: false },
  { id: 'CH010', code: 'MISC-MLC', name: 'MLC Certificate', type: 'misc', department: 'Admin', hsnSac: '998391', baseRateCents: 20_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: false, notes: 'Medicolegal certificate' },
  { id: 'NAV-MSK-CONS', code: 'CONS-MSK', name: 'MSK Specialist Consultation', type: 'consultation', department: 'Orthopedics', hsnSac: '998312', baseRateCents: 120_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: false },
  { id: 'NAV-MSK-PT', code: 'PROC-PT', name: 'Physiotherapy Session', type: 'procedure', department: 'Rehab', hsnSac: '998334', baseRateCents: 80_000, cgst: 9, sgst: 9, igst: 0, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', status: 'active', packageFlag: false },
];
