/**
 * Honest operational connectivity cues — UI hints only; does not change routing.
 */
import {
  canUseDashboardRuntime,
  routeRequiresApiForLiveBadge,
} from "@/lib/dashboard/dashboard-engine";

export type RouteConnectivityClass = "c1" | "c1-leaning" | "preview";

export type RouteReadinessBadge = "Preview" | "Live" | null;

const PREVIEW_MODULE_PREFIXES = [] as const;

/** Platform-backed or partial-sync routes (not full C1). */
const C1_LEANING_EXACT: readonly string[] = [
  "/admin",
  "/admin/platform",
  "/admin/onboarding",
  "/admin/command-center",
  "/admin/mortality",
  "/admin/revenue-cycle",
  "/admin/mis",
  "/admin/audit",
  "/admin/ai-workflow",
  "/admin/morning-briefing",
  "/doctor/labs",
  "/doctor/radiology",
  "/doctor/ipd",
  "/reception",
  "/reception/registration",
  "/reception/checkin",
  "/reception/queue",
  "/reception/appointments",
  "/reception/billing",
  "/reception/ipd",
  "/reception/beds",
  "/nurse",
  "/nurse/tasks",
  "/nurse/task-board",
  "/nurse/ward",
  "/nurse/admissions",
  "/nurse/discharge",
  "/nurse/medications",
  "/nurse/vitals",
  "/nurse/shift",
  "/nurse/assessments",
  "/nurse/care-plan",
  "/nurse/orders",
  "/lab",
  "/lab/worklist",
  "/lab/entry",
  "/lab/samples",
  "/lab/verification",
  "/lab/critical",
  "/lab/reports",
  "/pharmacy/prescriptions",
  "/radiology/orders",
  "/radiology/worklist",
  "/radiology/reports",
  "/emergency",
  "/ot",
  "/inventory",
  "/dialysis",
  "/hr",
  "/hr/staff",
  "/scheduling",
  "/scheduling/book",
  "/scheduling/calendar",
  "/scheduling/resources",
  "/scheduling/waitlist",
  "/crm",
  "/crm/leads",
  "/crm/campaigns",
  "/crm/lifecycle",
  "/crm/drip-campaigns",
  "/admin/crm",
];

const C1_LEANING_LAB_PREFIXES: readonly string[] = ["/lab/"];

/** Seeded/reference lab screens — illustrative master data, not platform-backed yet. */
const LAB_PREVIEW_EXACT = new Set([
  "/lab/catalog",
  "/lab/qc",
  "/lab/analyzers",
  "/lab/referral",
  "/lab/consumables",
  "/lab/histo",
]);

const C1_LEANING_PHARMACY_PREFIXES: readonly string[] = [
  "/pharmacy/prescriptions",
  "/pharmacy/inventory",
  "/pharmacy/reports",
];

const C1_LEANING_RADIOLOGY_PREFIXES: readonly string[] = [
  "/radiology/orders",
  "/radiology/worklist",
  "/radiology/reports",
];

/** Doctor UAT P0 — platform OPD queue + consultation; no navbar readiness badge. */
const DOCTOR_OPERATIONAL_EXACT = new Set(["/doctor/queue", "/jr-doctor/queue"]);

const C1_LEANING_PREFIXES: readonly string[] = [
  "/nurse/vitals/chart/",
  "/nurse/notes/",
  "/doctor/ipd/",
  "/emergency/",
  "/billing-dept/",
  "/crm/leads",
  "/crm/lifecycle",
  "/ot/",
  "/dialysis/",
];

/** Demo / MIS admin surfaces — preview until wired. */
const ADMIN_PREVIEW_EXACT = new Set([
  '/admin/disease-mapping',
  '/admin/data-mining',
  '/admin/kaizen',
  '/admin/treatment-success',
  '/admin/departments',
  '/admin/finance',
  '/admin/expenses',
  '/admin/approvals',
  '/admin/claims',
  '/admin/doctor-sharing',
  '/admin/phonebook',
  '/admin/mortality',
  '/admin/geo-intelligence',
]);

const DOCTOR_PREVIEW_EXACT = new Set([
  '/doctor/analytics',
  '/doctor/patients',
  '/doctor/inbox',
  '/doctor/critical',
  '/doctor/emr',
]);

const NURSE_PREVIEW_EXACT = new Set([
  "/nurse/reports",
  "/nurse/io",
  "/nurse/blood-admin",
  "/nurse/iv-therapy",
  "/nurse/wound-care",
  "/nurse/restraints",
  "/nurse/code-blue",
  "/nurse/fall-risk",
  "/nurse/pressure-injury",
  "/nurse/sepsis",
  "/nurse/pain",
  "/nurse/behavior",
  "/nurse/education",
]);

const PHARMACY_PREVIEW_EXACT = new Set([
  '/pharmacy/formulary',
  '/pharmacy/indent',
  '/pharmacy/returns',
  '/pharmacy/purchase',
  '/pharmacy/queries',
  '/pharmacy/suppliers',
  '/pharmacy/schedule-h',
  '/pharmacy/narcotics',
  "/pharmacy/expiry",
  "/pharmacy/audit",
  "/pharmacy/barcode",
  "/pharmacy/counseling",
  "/pharmacy/refills",
  "/pharmacy/compounding",
  "/pharmacy/cold-chain",
  "/pharmacy/interactions",
]);

const RECEPTION_PREVIEW_EXACT = new Set([
  "/reception/photos",
  "/reception/visitors",
  "/reception/handover",
  "/reception/insurance",
  "/reception/discharge-clearance",
  "/reception/print",
  "/reception/scan",
  "/reception/enquiries",
  "/reception/branches",
  "/reception/feedback",
]);

const HR_PREVIEW_EXACT = new Set([
  "/hr/scheduling",
  "/hr/attendance",
  "/hr/leave",
  "/hr/credentials",
  "/hr/training",
  "/hr/performance",
  "/hr/reports",
]);

const SCHEDULING_PREVIEW_EXACT = new Set([
  "/scheduling/doctors",
  "/scheduling/teleconsult",
  "/scheduling/reports",
]);

const BILLING_PREVIEW_EXACT = new Set([
  "/billing-dept/charge-master",
  "/billing-dept/tpa-desk",
  "/billing-dept/copay",
  "/billing-dept/ecl",
  "/billing-dept/claims",
  "/billing-dept/denials",
  "/billing-dept/pharmacy-billing",
  "/billing-dept/corporate-billing",
  "/billing-dept/cashier",
  "/billing-dept/copay-audit",
  "/billing-dept/scheme-billing",
  "/billing-dept/settlement",
]);

const RADIOLOGY_PREVIEW_EXACT = new Set([
  "/radiology/critical",
  "/radiology/templates",
  "/radiology/schedule",
  "/radiology/contrast",
  "/radiology/tat",
  "/radiology/amendments",
  "/radiology/peer-review",
  "/radiology/dose",
  "/radiology/telerad",
  "/radiology/pacs",
  "/radiology/modality-worklist",
]);

const CRM_PREVIEW_EXACT = new Set([
  "/crm/experience",
  "/crm/reports",
]);

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  for (const p of prefixes) {
    if (pathname === p || pathname.startsWith(`${p}/`)) {
      return true;
    }
  }
  return false;
}

function isC1LeaningRoute(pathname: string): boolean {
  if (LAB_PREVIEW_EXACT.has(pathname)) {
    return false;
  }
  if (C1_LEANING_EXACT.includes(pathname)) {
    return true;
  }
  if (matchesPrefix(pathname, C1_LEANING_PREFIXES)) {
    return true;
  }
  if (matchesPrefix(pathname, C1_LEANING_LAB_PREFIXES) && pathname !== "/lab") {
    return true;
  }
  if (matchesPrefix(pathname, C1_LEANING_PHARMACY_PREFIXES)) {
    return true;
  }
  if (matchesPrefix(pathname, C1_LEANING_RADIOLOGY_PREFIXES)) {
    return true;
  }
  return false;
}

function isPreviewRoute(pathname: string): boolean {
  if (matchesPrefix(pathname, PREVIEW_MODULE_PREFIXES)) {
    return true;
  }
  if (LAB_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (pathname.startsWith("/admin") && ADMIN_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (DOCTOR_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (pathname.startsWith("/doctor/emr/")) {
    return true;
  }
  if (NURSE_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (PHARMACY_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (RECEPTION_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (HR_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (SCHEDULING_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (BILLING_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (RADIOLOGY_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (CRM_PREVIEW_EXACT.has(pathname)) {
    return true;
  }
  if (
    pathname === '/doctor' ||
    pathname === '/doctor/schedule'
  ) {
    return false;
  }
  if (pathname.startsWith('/doctor/patients/')) {
    return false;
  }
  return false;
}

export function getRouteConnectivityClass(
  pathname: string,
): RouteConnectivityClass | null {
  if (isC1LeaningRoute(pathname)) {
    return "c1-leaning";
  }
  if (isPreviewRoute(pathname)) {
    return "preview";
  }
  if (
    pathname === "/doctor" ||
    pathname === "/doctor/patients" ||
    pathname === "/doctor/schedule" ||
    pathname.startsWith("/doctor/patients/")
  ) {
    return "c1-leaning";
  }
  return null;
}

function isDoctorOperationalRoute(pathname: string): boolean {
  if (DOCTOR_OPERATIONAL_EXACT.has(pathname)) return true;
  return pathname.startsWith("/doctor/consultation/") || pathname.startsWith("/jr-doctor/consultation/");
}

export function getRouteReadinessBadge(pathname: string): RouteReadinessBadge {
  if (isDoctorOperationalRoute(pathname)) {
    return null;
  }
  const cls = getRouteConnectivityClass(pathname);
  if (cls === "preview") {
    return "Preview";
  }
  if (cls === "c1-leaning") {
    if (routeRequiresApiForLiveBadge(pathname) && !canUseDashboardRuntime()) {
      return "Preview";
    }
    return "Live";
  }
  return null;
}

export function shouldShowRoutePreviewBanner(pathname: string): boolean {
  return getRouteConnectivityClass(pathname) === "preview";
}

export function getRoutePreviewMessage(pathname: string): string {
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin") {
      return "Admin home KPIs use domain command + analytics when platform runtime is on; otherwise local store summary.";
    }
    if (
      pathname === "/admin/command-center" ||
      pathname === "/admin/mortality" ||
      pathname === "/admin/revenue-cycle" ||
      pathname === "/admin/mis" ||
      pathname === "/admin/audit" ||
      pathname === "/admin/ai-workflow" ||
      pathname === "/admin/morning-briefing"
    ) {
      return "Live KPIs and exports use domain command, analytics, finance, and AI modules when platform runtime is on. Charts and libraries marked preview remain illustrative.";
    }
    return "Admin screen is preview-only. Use Platform Admin, Command Center, or MIS for connected operational surfaces.";
  }
  if (pathname === "/hr/attendance") {
    return "Attendance is preview-only with demo shift data. Staff roster on /hr/staff uses kernel GET /hr/staff when runtime is on.";
  }
  if (pathname.startsWith("/hr")) {
    return "HR staff roster reads from kernel when runtime is on. Attendance, leave, and training screens remain demo-first.";
  }
  if (pathname === "/scheduling/teleconsult") {
    return "Teleconsult room UX is a preview shell. Book live slots on /scheduling/calendar or /scheduling/book when platform runtime is on.";
  }
  if (pathname.startsWith("/scheduling")) {
    return "Central calendar loads GET /scheduling/appointments/range when runtime is on. Teleconsult and scheduling reports remain preview.";
  }
  if (pathname === "/crm/experience") {
    return "Patient experience surveys are preview-only. Leads, campaigns (with appointment booking), and lifecycle use domain /crm/* when runtime is on.";
  }
  if (pathname.startsWith("/crm") || pathname === "/admin/crm") {
    return "CRM leads (kanban), campaigns, and lifecycle persist to domain-api when runtime is on. Experience surveys remain preview.";
  }
  if (pathname.startsWith("/nurse/medications")) {
    return "MAR schedules load from domain-api when runtime is on.";
  }
  if (
    pathname.startsWith("/nurse/vitals/chart") ||
    pathname.startsWith("/nurse/notes")
  ) {
    return "Vitals trends and nursing notes use domain-api when runtime is on and the admission is platform-linked.";
  }
  if (pathname.startsWith("/nurse/vitals")) {
    return "Vitals record and list sync to domain-api for platform-linked admissions.";
  }
  if (pathname.startsWith("/nurse/discharge")) {
    return "Discharge prep combines local checklist with platform clearance when runtime is on.";
  }
  if (pathname.startsWith("/nurse/ward")) {
    return "Ward board syncs IPD census when runtime is on. Ward transfer may use platform initiate_transfer or local roster update.";
  }
  if (LAB_PREVIEW_EXACT.has(pathname)) {
    return "This lab screen uses illustrative master/reference data (catalog, QC, analyzers, referral, consumables, histopathology). It is not platform-backed yet — see LAB_TECHNICIAN_MODULE.md waves W2/W7/W8/W9.";
  }
  if (pathname.startsWith("/lab")) {
    return "Lab worklist and stages sync to domain-api when runtime is on. Dashboard KPI tiles may include local demo aggregates.";
  }
  if (
    pathname.startsWith("/pharmacy/prescriptions") ||
    pathname.startsWith("/pharmacy/inventory")
  ) {
    return "Prescriptions and stock reads merge from platform branch worklists when runtime is on.";
  }
  if (pathname.startsWith("/radiology")) {
    return "Radiology orders and worklist sync to domain-api when runtime is on. Settings remain local.";
  }
  if (pathname.startsWith("/nurse/io")) {
    return "Intake/output running balance is local to this shift. A summary note persists to domain-api when the admission is platform-linked.";
  }
  if (pathname.startsWith("/nurse")) {
    return "This nursing screen uses local shift data. Use Tasks or Ward for platform-backed nursing work.";
  }
  if (pathname.startsWith("/doctor")) {
    return "This doctor view is partially connected. Queue, consultation, labs, and IPD profiles use platform when runtime is on.";
  }
  if (pathname === "/reception/photos") {
    return "Patient photos are preview-only. Registration, check-in, and queue are the platform-backed front desk P0 path.";
  }
  if (pathname === "/reception/billing") {
    return "Front-desk billing posts charges to domain finance when platform runtime is on (OPD draft + sync charge). Counsellor MSK packages use /billing-dept/counselling.";
  }
  if (pathname === "/billing-dept/counselling") {
    return "Navayu counsellor desk: protocol tiers from protocols.json, MSK workflow transitions, billing charge sync, and scheduling follow-up when runtime is on.";
  }
  if (pathname.startsWith("/reception")) {
    return "Front desk P0 is C1-leaning: dashboard, registration, appointments, check-in, queue, billing, beds, and IPD use platform data when runtime is on.";
  }
  return "This module is in preview. Operational truth may be local-only until the platform spine is connected.";
}

/** Billing-dept page banner (separate from global Preview banner). */
export type BillingPageBanner = "preview" | "local-demo" | "live";

const BILLING_LIVE_ROUTES = new Set([
  "/billing-dept/invoices",
  "/billing-dept/payments",
  "/billing-dept/ipd-billing",
]);

const BILLING_PREVIEW_ROUTES = new Set([
  "/billing-dept/charge-master",
  "/billing-dept/tpa-desk",
  "/billing-dept/copay",
  "/billing-dept/ecl",
  "/billing-dept/claims",
  "/billing-dept/denials",
  "/billing-dept/pharmacy-billing",
  "/billing-dept/corporate-billing",
  "/billing-dept/cashier",
  "/billing-dept/copay-audit",
  "/billing-dept/scheme-billing",
  "/billing-dept/settlement",
  "/billing-dept/revenue",
  "/billing-dept/health-plans",
  "/billing-dept/gst",
]);

const BILLING_LIVE_EXTRA = new Set([
  "/billing-dept/packages",
  "/billing-dept/counselling",
  "/billing-dept/insurance",
  "/billing-dept/finance",
  "/billing-dept/tpa-charges",
  "/billing-dept/pre-auth",
  "/billing-dept/reconciliation",
]);

export function getBillingPageBanner(
  pathname: string,
  platformOn: boolean,
): BillingPageBanner | null {
  if (!pathname.startsWith("/billing-dept")) {
    return null;
  }
  if (BILLING_PREVIEW_ROUTES.has(pathname)) {
    return "preview";
  }
  if (pathname === "/billing-dept" || pathname === "/billing-dept/reports") {
    return platformOn ? "live" : "preview";
  }
  if (BILLING_LIVE_ROUTES.has(pathname) || BILLING_LIVE_EXTRA.has(pathname)) {
    return platformOn ? "live" : "local-demo";
  }
  return "preview";
}
