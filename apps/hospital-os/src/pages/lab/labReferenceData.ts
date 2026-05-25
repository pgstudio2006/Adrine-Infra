/**
 * Seeded laboratory reference data for the lab workspace.
 *
 * Honest scope: this is a local, illustrative master dataset (test catalog, sections,
 * reagents, analyzers). A production LIMS sources these from a domain test-catalog
 * service (LOINC, panels, reference ranges, tariffs) — see ENTERPRISE_AUDIT_REPORT.md §4.9
 * and LAB_TECHNICIAN_MODULE.md W2/W8/W9. Screens that consume this data are labelled Preview.
 */

export type LabSection =
  | "Hematology"
  | "Biochemistry"
  | "Microbiology"
  | "Serology"
  | "Histopathology";

export const LAB_SECTIONS: LabSection[] = [
  "Hematology",
  "Biochemistry",
  "Microbiology",
  "Serology",
  "Histopathology",
];

/** Map a free-text order category to a lab section (best-effort, since orders carry a string). */
export function sectionForCategory(category: string): LabSection {
  const c = (category || "").toLowerCase();
  if (/(hemat|cbc|blood count|coag|esr)/.test(c)) return "Hematology";
  if (/(micro|culture|sensitivity|gram)/.test(c)) return "Microbiology";
  if (/(sero|elisa|hiv|hbsag|widal|dengue|covid)/.test(c)) return "Serology";
  if (/(histo|cyto|biopsy|pap|fnac)/.test(c)) return "Histopathology";
  return "Biochemistry";
}

export type CatalogTest = {
  code: string;
  name: string;
  loinc: string;
  section: LabSection;
  specimen: string;
  container: string;
  unit: string;
  refLow?: number;
  refHigh?: number;
  tariffCents: number;
  tatHours: number;
};

export const TEST_CATALOG: CatalogTest[] = [
  { code: "CBC", name: "Complete Blood Count", loinc: "58410-2", section: "Hematology", specimen: "Whole blood", container: "EDTA (lavender)", unit: "—", tariffCents: 30000, tatHours: 4 },
  { code: "HB", name: "Hemoglobin", loinc: "718-7", section: "Hematology", specimen: "Whole blood", container: "EDTA (lavender)", unit: "g/dL", refLow: 12, refHigh: 17, tariffCents: 12000, tatHours: 2 },
  { code: "PLT", name: "Platelet Count", loinc: "777-3", section: "Hematology", specimen: "Whole blood", container: "EDTA (lavender)", unit: "10^3/µL", refLow: 150, refHigh: 410, tariffCents: 12000, tatHours: 2 },
  { code: "ESR", name: "ESR", loinc: "30341-2", section: "Hematology", specimen: "Whole blood", container: "EDTA (lavender)", unit: "mm/hr", refLow: 0, refHigh: 20, tariffCents: 10000, tatHours: 3 },
  { code: "PT-INR", name: "Prothrombin Time / INR", loinc: "5902-2", section: "Hematology", specimen: "Plasma", container: "Citrate (blue)", unit: "INR", refLow: 0.8, refHigh: 1.2, tariffCents: 35000, tatHours: 4 },
  { code: "FBS", name: "Fasting Blood Sugar", loinc: "1558-6", section: "Biochemistry", specimen: "Serum", container: "Fluoride (grey)", unit: "mg/dL", refLow: 70, refHigh: 100, tariffCents: 8000, tatHours: 3 },
  { code: "HBA1C", name: "HbA1c", loinc: "4548-4", section: "Biochemistry", specimen: "Whole blood", container: "EDTA (lavender)", unit: "%", refLow: 4, refHigh: 5.6, tariffCents: 45000, tatHours: 6 },
  { code: "CREAT", name: "Serum Creatinine", loinc: "2160-0", section: "Biochemistry", specimen: "Serum", container: "Plain (red)", unit: "mg/dL", refLow: 0.6, refHigh: 1.3, tariffCents: 15000, tatHours: 4 },
  { code: "UREA", name: "Blood Urea", loinc: "3094-0", section: "Biochemistry", specimen: "Serum", container: "Plain (red)", unit: "mg/dL", refLow: 15, refHigh: 40, tariffCents: 14000, tatHours: 4 },
  { code: "LFT", name: "Liver Function Test", loinc: "24325-3", section: "Biochemistry", specimen: "Serum", container: "Plain (red)", unit: "—", tariffCents: 60000, tatHours: 6 },
  { code: "LIPID", name: "Lipid Profile", loinc: "57698-3", section: "Biochemistry", specimen: "Serum", container: "Plain (red)", unit: "—", tariffCents: 55000, tatHours: 6 },
  { code: "TSH", name: "TSH", loinc: "3016-3", section: "Biochemistry", specimen: "Serum", container: "Plain (red)", unit: "µIU/mL", refLow: 0.4, refHigh: 4.0, tariffCents: 40000, tatHours: 8 },
  { code: "ELEC", name: "Serum Electrolytes", loinc: "55231-5", section: "Biochemistry", specimen: "Serum", container: "Plain (red)", unit: "mmol/L", tariffCents: 35000, tatHours: 3 },
  { code: "URINE-RE", name: "Urine Routine", loinc: "24356-8", section: "Microbiology", specimen: "Urine", container: "Sterile container", unit: "—", tariffCents: 12000, tatHours: 3 },
  { code: "URINE-CS", name: "Urine Culture & Sensitivity", loinc: "630-4", section: "Microbiology", specimen: "Urine", container: "Sterile container", unit: "—", tariffCents: 50000, tatHours: 48 },
  { code: "BLOOD-CS", name: "Blood Culture", loinc: "600-7", section: "Microbiology", specimen: "Whole blood", container: "Culture bottle", unit: "—", tariffCents: 75000, tatHours: 72 },
  { code: "HIV", name: "HIV I & II", loinc: "75622-1", section: "Serology", specimen: "Serum", container: "Plain (red)", unit: "—", tariffCents: 40000, tatHours: 6 },
  { code: "HBSAG", name: "HBsAg", loinc: "5196-1", section: "Serology", specimen: "Serum", container: "Plain (red)", unit: "—", tariffCents: 35000, tatHours: 6 },
  { code: "DENGUE", name: "Dengue NS1 / IgM-IgG", loinc: "85291-3", section: "Serology", specimen: "Serum", container: "Plain (red)", unit: "—", tariffCents: 80000, tatHours: 6 },
  { code: "BIOPSY", name: "Histopathology — Biopsy", loinc: "60572-5", section: "Histopathology", specimen: "Tissue", container: "10% formalin", unit: "—", tariffCents: 150000, tatHours: 96 },
  { code: "PAP", name: "Pap Smear (Cytology)", loinc: "47527-7", section: "Histopathology", specimen: "Cervical smear", container: "Glass slide / fixative", unit: "—", tariffCents: 90000, tatHours: 72 },
];

/** Lightweight tariff lookup used by the billing-handoff preview. */
export function estimateTariffCents(tests: string): { matched: { name: string; cents: number }[]; total: number } {
  const tokens = tests
    .split(/[,;/]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const matched: { name: string; cents: number }[] = [];
  for (const token of tokens) {
    const hit =
      TEST_CATALOG.find((t) => t.name.toLowerCase() === token) ??
      TEST_CATALOG.find((t) => t.code.toLowerCase() === token) ??
      TEST_CATALOG.find((t) => token.includes(t.code.toLowerCase()) || t.name.toLowerCase().includes(token));
    matched.push({ name: hit?.name ?? token, cents: hit?.tariffCents ?? 25000 });
  }
  if (matched.length === 0) matched.push({ name: tests || "Test", cents: 25000 });
  return { matched, total: matched.reduce((s, m) => s + m.cents, 0) };
}

/** Flag a numeric result against catalog reference range. */
export function flagResult(testCode: string, value: number): "H" | "L" | "N" | null {
  const t = TEST_CATALOG.find((x) => x.code === testCode);
  if (!t || t.refLow === undefined || t.refHigh === undefined) return null;
  if (value < t.refLow) return "L";
  if (value > t.refHigh) return "H";
  return "N";
}

export type Reagent = {
  code: string;
  name: string;
  section: LabSection;
  onHand: number;
  reorderLevel: number;
  unit: string;
  lot: string;
  expiry: string;
};

export const REAGENTS: Reagent[] = [
  { code: "RGT-CBC", name: "CBC diluent", section: "Hematology", onHand: 8, reorderLevel: 5, unit: "L", lot: "DIL-2291", expiry: "2026-11" },
  { code: "RGT-HBA1C", name: "HbA1c cartridge", section: "Biochemistry", onHand: 2, reorderLevel: 4, unit: "kit", lot: "A1C-7741", expiry: "2026-08" },
  { code: "RGT-LFT", name: "LFT panel reagent", section: "Biochemistry", onHand: 1, reorderLevel: 3, unit: "kit", lot: "LFT-5512", expiry: "2026-07" },
  { code: "RGT-CULT", name: "Blood agar plates", section: "Microbiology", onHand: 24, reorderLevel: 20, unit: "plate", lot: "AGR-3380", expiry: "2026-06" },
  { code: "RGT-HIV", name: "HIV ELISA kit", section: "Serology", onHand: 1, reorderLevel: 2, unit: "kit", lot: "HIV-9921", expiry: "2026-09" },
  { code: "RGT-FORMALIN", name: "10% Buffered formalin", section: "Histopathology", onHand: 12, reorderLevel: 6, unit: "L", lot: "FOR-1180", expiry: "2027-01" },
];

export type Analyzer = {
  id: string;
  name: string;
  section: LabSection;
  protocol: "HL7 ASTM" | "HL7 v2 ORU" | "Manual";
  status: "online" | "offline" | "maintenance";
  pendingMessages: number;
};

export const ANALYZERS: Analyzer[] = [
  { id: "AN-HEM-01", name: "Sysmex XN-1000", section: "Hematology", protocol: "HL7 ASTM", status: "online", pendingMessages: 0 },
  { id: "AN-CHE-01", name: "Roche cobas c311", section: "Biochemistry", protocol: "HL7 v2 ORU", status: "online", pendingMessages: 0 },
  { id: "AN-CHE-02", name: "Beckman AU480", section: "Biochemistry", protocol: "HL7 v2 ORU", status: "maintenance", pendingMessages: 0 },
  { id: "AN-MIC-01", name: "BD BACTEC FX", section: "Microbiology", protocol: "Manual", status: "online", pendingMessages: 0 },
  { id: "AN-SER-01", name: "BioMérieux VIDAS", section: "Serology", protocol: "HL7 ASTM", status: "offline", pendingMessages: 0 },
];
