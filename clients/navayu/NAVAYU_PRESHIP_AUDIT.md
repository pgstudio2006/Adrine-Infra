# Navayu Pre-Ship Audit — feature-by-feature, screen-by-screen

**Tenant:** `tenant_navayu` (Navayu Spine & Joint Care)
**Branches:** Gurgaon (MSK specialty, no lab) · Pataudi (mini hospital with lab)
**Ship target:** tomorrow morning
**Audit method:** code-grep cross-reference of every Navayu-visible route against (a) presence of platform/store runtime calls, (b) presence of hardcoded fake patient names. Heuristic — not a deep per-button audit. Flagged items must be spot-confirmed before hide-or-sweep decisions.

---

## Verdict in one sentence

**About 60–70% of what Navayu's nav exposes is genuinely wired; the rest is demo shells or works-with-cruft.** That's enough to ship a real OPD/IPD/Lab/Pharmacy/Billing spine — *if* we hide the demo shells before login.

## Classification key

- 🟢 **Live** — has real runtime/store calls, no fake-patient cruft detected
- 🟡 **Live-with-cruft** — works, but has leftover fake names/arrays that need a 5-min sweep before demo
- 🔴 **Demo shell** — no runtime calls, hardcoded fake data — clicks lead nowhere, **must hide**
- ⚪ **Unverified** — file exists but neither signal triggered; treat as demo shell until proven otherwise
- ⚫ **Honest Preview** — explicitly classed Preview in `routeReadiness.ts` (the nav already shows a "Preview" badge)

---

## 1. ADMIN module — Gurgaon (full MSK suite) + Pataudi (subset)

| Route | Component | Gurgaon | Pataudi | Status | What to do |
|---|---|---|---|---|---|
| `/admin` | AdminDashboard | ✅ | ✅ | 🟢 Live | keep |
| `/admin/morning-briefing` | AdminMorningBriefing | ✅ | ❌ | 🟢 Live | keep |
| `/admin/command-center` | AdminCommandCenter | ✅ | ❌ | 🟢 Live | keep |
| `/admin/ai-workflow` | AdminAIWorkflow | ✅ | ❌ | 🟡 Live-with-cruft | sweep fake names from sample-events list |
| `/admin/disease-mapping` | AdminDiseaseMapping | ✅ | ❌ | 🔴 Demo shell | **HIDE** |
| `/admin/data-mining` | AdminDataMining | ✅ | ❌ | ⚪ Unverified | likely demo — **HIDE** until verified |
| `/admin/kaizen` | AdminKaizen | ✅ | ❌ | 🔴 Demo shell | **HIDE** |
| `/admin/revenue-cycle` | AdminRevenueCycle | ✅ | ❌ | 🟡 Live-with-cruft | sweep demo cohort list |
| `/admin/treatment-success` | AdminTreatmentSuccess | ✅ | ❌ | 🔴 Demo shell | **HIDE** |
| `/admin/staff` | AdminStaff | ✅ | ✅ | 🟡 Live-with-cruft | reads kernel `/hr/staff` but renders demo cards too |
| `/admin/departments` | AdminDepartments | ✅ | ✅ | 🔴 Demo shell | **HIDE** |
| `/admin/finance` | AdminFinance | ✅ | ✅ | 🔴 Demo shell | **HIDE** |
| `/admin/expenses` | AdminExpenses | ✅ | ✅ | ⚪ Unverified | **HIDE** until verified |
| `/admin/approvals` | AdminApprovals | ✅ | ✅ | 🔴 Demo shell | **HIDE** |
| `/admin/claims` | AdminClaims | ✅ | ✅ | 🔴 Demo shell | **HIDE** |
| `/admin/doctor-sharing` | AdminDoctorSharing | ✅ | ❌ | ⚪ Unverified | **HIDE** until verified |
| `/admin/mrd` | AdminMRD | ✅ | ❌ | 🟡 Live-with-cruft | sweep demo records |
| `/admin/mis` | AdminMIS | ✅ | ✅ | 🟢 Live | keep |
| `/admin/audit` | AdminAudit | ✅ | ✅ | 🟢 Live | keep |
| `/admin/phonebook` | AdminPhonebook | ✅ | ❌ | 🔴 Demo shell | **HIDE** |
| `/admin/crm` | AdminCRM (tile) | ✅ | ❌ | ⚪ Unverified | likely tile redirect — verify |
| `/admin/settings` | AdminSettings | ✅ | ✅ | 🟡 Live-with-cruft | sweep / verify |

**Admin verdict:** **Hide ≥ 7 tabs at Gurgaon, ≥ 5 at Pataudi tonight.** Admin nav as currently configured looks impressive but most non-platform admin reports are demo MIS.

**Recommended admin tabs for Navayu v1 (both branches):**
`dashboard, command-center, mis, audit, settings, staff (after sweep), morning-briefing (Gurgaon), revenue-cycle (Gurgaon, after sweep), ai-workflow (Gurgaon, after sweep), mrd (Gurgaon, after sweep)`

---

## 2. DOCTOR module — both branches

| Route | Component | Gurgaon Sr | Gurgaon Jr | Pataudi | Status | What to do |
|---|---|---|---|---|---|---|
| `/doctor` | DoctorDashboard | ✅ | ✅ | ✅ | 🟢 Live | keep |
| `/doctor/queue` | DoctorQueue | ✅ | ✅ | ✅ | 🟢 Live (C1-leaning) | keep |
| `/doctor/patients` | DoctorPatients | ✅ | ✅ | ✅ | ⚪ Unverified | likely demo list — verify; **probably HIDE** until sweep |
| `/doctor/ipd` | DoctorIPD | ✅ | hidden | ✅ | 🟢 Live | keep |
| `/doctor/schedule` | DoctorSchedule | ✅ | hidden | ✅ | 🟢 Live | keep |
| `/doctor/analytics` | DoctorAnalytics | ✅ | hidden | ✅ | 🔴 Demo shell | **HIDE** everywhere |
| `/doctor/labs` | DoctorLabs | ❌ | ❌ | ✅ | 🟢 Live | keep (Pataudi only) |
| `/doctor/radiology` | DoctorRadiology | ❌ | ❌ | ✅ | 🟢 Live | keep (Pataudi only) |
| `/doctor/consultation/:id` | DoctorConsultation | ✅ | ✅ | ✅ | 🟢 Live (C1-leaning, deepest screen) | **the crown jewel — works** |
| `/doctor/ipd/:id` | DoctorIPDPatientProfile | ✅ | hidden | ✅ | 🟢 Live | keep |
| `/doctor/patients/:id` | DoctorPatientProfile | ✅ | ✅ | ✅ | 🟢 Live | keep |

**Doctor verdict:** the *clinical encounter spine* (`/doctor/queue` → `/doctor/consultation/:id` → orders / Rx / discharge) is genuinely solid. **`/doctor/analytics` and `/doctor/patients` should be hidden/swept.**

---

## 3. NURSE module — both branches

I rewrote/built much of this in the last 24 hours. Status:

| Route | Component | Gurgaon | Pataudi | Status |
|---|---|---|---|---|
| `/nurse` | NurseDashboard | ✅ | ✅ | 🟢 Live (rebuilt — derived KPIs, no demo arrays) |
| `/nurse/ward` | NurseWard | ✅ | ✅ | 🟢 Live |
| `/nurse/vitals` | NurseVitals | ✅ | ✅ | 🟢 Live |
| `/nurse/medications` | NurseMedications | ✅ | ✅ | 🟢 Live |
| `/nurse/discharge` | NurseDischarge | ✅ | ✅ | 🟢 Live |
| `/nurse/shift` | NurseShift (new) | ✅ | ✅ | 🟢 Live |
| `/nurse/task-board` | NurseTaskBoard | ✅ | ✅ | 🟢 Live |
| `/nurse/admissions` | NurseAdmissions | ✅ | ✅ | 🟢 Live |
| `/nurse/orders` | NurseOrders (new) | ✅ | ✅ | 🟢 Live |
| `/nurse/assessments` | NurseAssessments (new) | ✅ | ✅ | 🟢 Live |
| `/nurse/io` | NurseIO (new) | ✅ | ✅ | ⚫ Honest Preview |
| `/nurse/reports` | NurseReports | ✅ | ✅ | 🟡 Live-with-cruft (sweep demo report rows) |
| `/nurse/tasks` | NurseTasks | (hidden Gurgaon) | ✅ | 🟢 Live |
| `/nurse/care-plan` | NurseCarePlan (new) | (hidden Gurgaon) | ✅ | 🟢 Live |

**Nurse verdict:** the entire nurse workspace is in good shape. **One sweep needed: `NurseReports.tsx` has hardcoded sample patient rows.**

---

## 4. RECEPTION module — both branches

| Route | Component | Gurgaon | Pataudi | Status |
|---|---|---|---|---|
| `/reception` | ReceptionDashboard | ✅ | ✅ | 🟢 Live |
| `/reception/flow` | ReceptionFlowHub | ✅ | ✅ | 🟢 Live |
| `/reception/registration` | ReceptionRegistration | ✅ | ✅ | 🟡 Live-with-cruft (sweep demo last-registered list) |
| `/reception/feedback` | FeedbackSurveys | ✅ | ✅ | 🔴 Demo shell | **HIDE** |
| `/reception/appointments` | ReceptionAppointments | ✅ | ✅ | 🟢 Live (C1-leaning, SSE) |
| `/reception/checkin` | ReceptionCheckIn | ✅ | ✅ | 🟢 Live |
| `/reception/queue` | ReceptionQueue | ✅ | ✅ | 🟢 Live |
| `/reception/billing` | ReceptionBilling | ✅ | ✅ | 🟢 Live |
| `/reception/ipd` | ReceptionIPD | ✅ | ✅ | 🟢 Live |
| `/reception/beds` | ReceptionBeds | (hidden Gurgaon) | ✅ | 🟢 Live (Pataudi) |
| `/reception/visitors` | ReceptionVisitors | ✅ | ✅ | 🟡 Live-with-cruft |
| `/reception/handover` | ReceptionHandover | ✅ | ✅ | 🟡 Live-with-cruft |
| `/reception/enquiries` | ReceptionEnquiries | ✅ | ✅ | ⚪ Unverified — likely demo, **HIDE** until verified |
| `/reception/photos` | ReceptionPatientPhotos | (hidden Gurgaon) | ✅ | 🟡 Live-with-cruft |

**Reception verdict:** the OPD spine (register → appointments → check-in → queue → billing) is solid. **Hide `/reception/feedback` and probably `/reception/enquiries` until built.**

---

## 5. PHARMACY module — both branches

| Route | Component | Gurgaon | Pataudi | Status |
|---|---|---|---|---|
| `/pharmacy` | PharmacyDashboard | ✅ | ✅ | 🟡 Live-with-cruft |
| `/pharmacy/prescriptions` | PharmacyPrescriptions | ✅ | ✅ | 🟢 Live (C1-leaning) |
| `/pharmacy/inventory` | PharmacyInventory | ✅ | ✅ | 🟢 Live |
| `/pharmacy/schedule-h` | PharmacyScheduleH | ✅ | ❌ | 🔴 Demo shell | **HIDE Gurgaon** |
| `/pharmacy/drugs` | PharmacyDrugs | ✅ | ✅ | 🟢 Live (basic) |
| `/pharmacy/reports` | PharmacyReports | ✅ | ✅ | 🟢 Live |
| `/pharmacy/billing` | PharmacyBilling | ✅ | ✅ | 🟢 Live (basic) |
| `/pharmacy/suppliers` | PharmacySuppliers | ✅ | ✅ | ⚪ Unverified — likely demo, **HIDE** until verified |
| `/pharmacy/purchase` | PharmacyPurchase | ✅ | ✅ | 🔴 Demo shell | **HIDE** |
| `/pharmacy/queries` | PharmacyQueries | ✅ | ✅ | 🔴 Demo shell | **HIDE** |
| `/pharmacy/indent` | PharmacyIndent | ✅ | ✅ | ⚪ Unverified, **HIDE** |
| `/pharmacy/returns` | PharmacyReturns | ✅ | ✅ | ⚪ Unverified, **HIDE** |

**Pharmacy verdict:** dispensing + inventory + Rx + billing spine works. **Hide procurement-side tabs (purchase, queries, suppliers, indent, returns) — they're not built.**

**Recommended pharmacy tabs:** `dashboard, prescriptions, inventory, drugs, reports, billing` (6 of 12).

---

## 6. BILLING module

**Gurgaon "Counsellor" persona (4 tabs only — already scoped):**

| Route | Component | Status |
|---|---|---|
| `/billing-dept` | BillingDashboard | 🟢 Live |
| `/billing-dept/packages` | BillingPackages | 🟡 Live-with-cruft |
| `/billing-dept/counselling` | NavayuCounsellorDesk | ⚪ Unverified — **VERIFY ROUTING tonight** (file exists but is it routed?) |
| `/billing-dept/revenue` | BillingRevenue | 🟢 Live |

**Pataudi billing (10 tabs):**

| Route | Component | Status |
|---|---|---|
| `/billing-dept` | BillingDashboard | 🟢 Live |
| `/billing-dept/invoices` | BillingInvoices | 🟡 Live-with-cruft |
| `/billing-dept/payments` | BillingPayments | 🟢 Live |
| `/billing-dept/ipd-billing` | BillingIPD | 🟢 Live (C1-leaning) |
| `/billing-dept/packages` | BillingPackages | 🟡 Live-with-cruft |
| `/billing-dept/revenue` | BillingRevenue | 🟢 Live |
| `/billing-dept/insurance` | BillingInsurance | 🟡 Live-with-cruft |
| `/billing-dept/reports` | BillingReports | 🟡 Live-with-cruft |
| `/billing-dept/charge-master` | BillingChargeMaster | ⚪ Unverified — likely missing, **HIDE** |
| `/billing-dept/cashier` | BillingCashier | ⚪ Unverified — likely missing, **HIDE** |

**Billing verdict:** invoicing + payments + IPD billing core works. **`charge-master` and `cashier` need verification before they're shown to Pataudi.**

---

## 7. CRM module — Gurgaon only

| Route | Component | Status |
|---|---|---|
| `/crm` | CRMDashboard | 🟢 Live |
| `/crm/leads` | LeadManagement | 🟢 Live (C1-leaning) |
| `/crm/lifecycle` | PatientLifecycle | 🟢 Live (C1-leaning) |
| `/crm/campaigns` | Campaigns | 🟢 Live (C1-leaning) |
| `/crm/drip-campaigns` | CrmDripCampaigns | 🟢 Live |
| `/crm/experience` | FeedbackSurveys | 🔴 Demo shell | **HIDE** |
| `/crm/reports` | CrmReports | ⚪ Unverified | **HIDE** until verified |

**CRM verdict:** CRM at Gurgaon (Counsellor flow) is one of the more genuinely-built modules. **Hide `/crm/experience` and `/crm/reports`.**

---

## 8. LAB module — Pataudi only (22 tabs)

All 22 lab routes were built or refactored in the last 36 hours. Statuses already wired honestly into `routeReadiness.ts`:

**🟢 Live (16):** `dashboard, orders, phlebotomy, accession, worklist, sections, samples, entry, verification, critical, amendments, reports, audit, tat, billing-handoff, storage`

**⚫ Honest Preview (6) — shown with a "Preview" banner already:** `catalog, qc, analyzers, referral, consumables, histo`

**Lab verdict:** the lab spine is the strongest module in the platform right now. No hides needed; the 6 Preview tabs honestly label themselves as illustrative.

---

## 9. PUBLIC / PATIENT app (separate from Hospital OS)

| Route | Status |
|---|---|
| `/login` (patient) | 🟢 Live |
| `/dashboard` (patient) | 🟢 Live (basic) |
| `/appointments` | 🟢 Live |
| `/prescriptions` | 🟢 Live (read-only) |
| `/reports` | 🟢 Live (read-only) |
| `/book/navayu` (public booking) | per `public-booking-config.json` — needs verification |

---

# DEAD-ON-ARRIVAL LIST — must hide before Navayu users log in

Add these to the per-branch tab visibility in `clients/navayu/packs/*-pack.json` with `{ visible: false }`:

**Gurgaon (~12 hides):**
```
admin: disease-mapping, kaizen, treatment-success, departments, finance, approvals, claims, phonebook, expenses, doctor-sharing, data-mining
doctor: analytics, patients (until sweep)
reception: feedback, enquiries
pharmacy: schedule-h, purchase, queries, suppliers, indent, returns
billing (counsellor already scoped to 4 — verify counselling route lands)
crm: experience, reports
```

**Pataudi (~10 hides):**
```
admin: departments, finance, expenses, approvals, claims, treatment-success (if surfaced)
doctor: analytics, patients (until sweep)
reception: feedback, enquiries
pharmacy: purchase, queries, suppliers, indent, returns
billing: charge-master, cashier
```

# SWEEP-BEFORE-DEMO LIST — 5–15 min per file

Pages that are **wired** but contain hardcoded fake patients/staff in sidebars or example arrays. We strip the constants and let them render empty-states when there's no real data:

1. `apps/hospital-os/src/pages/nurse/NurseReports.tsx`
2. `apps/hospital-os/src/pages/reception/ReceptionRegistration.tsx` (recent-registrations panel)
3. `apps/hospital-os/src/pages/reception/ReceptionHandover.tsx`
4. `apps/hospital-os/src/pages/reception/ReceptionVisitors.tsx`
5. `apps/hospital-os/src/pages/reception/ReceptionPatientPhotos.tsx`
6. `apps/hospital-os/src/pages/billing/BillingInvoices.tsx`
7. `apps/hospital-os/src/pages/billing/BillingReports.tsx`
8. `apps/hospital-os/src/pages/billing/BillingInsurance.tsx`
9. `apps/hospital-os/src/pages/billing/BillingPackages.tsx`
10. `apps/hospital-os/src/pages/admin/AdminStaff.tsx` (only if shown)
11. `apps/hospital-os/src/pages/admin/AdminMRD.tsx`
12. `apps/hospital-os/src/pages/admin/AdminRevenueCycle.tsx`
13. `apps/hospital-os/src/pages/admin/AdminAIWorkflow.tsx`
14. `apps/hospital-os/src/pages/pharmacy/PharmacyDashboard.tsx`

**Sweep pattern:**
- Find `const SAMPLE_* = [`, `const DEMO_* = [`, `const _PATIENTS = [`, `const _STAFF = [`, etc.
- Replace usage with `const EXAMPLES = [] as ...` (preserves type) or compute from `useHospital()` store.
- Make sure the empty-state copy reads honestly (e.g., *"No registrations yet today"* not *"Sample data shown"*).

# SOLIDLY-WORKING SPINE — the v1 product Navayu actually has

If Navayu's clinical day-1 covers only these routes, **the platform is genuinely production-grade for that scope:**

- **Reception:** dashboard, flow, registration (after sweep), appointments, check-in, queue, billing, IPD, beds (Pataudi)
- **Doctor:** dashboard, queue, consultation, IPD, schedule, IPD profile, patient profile, labs/radiology (Pataudi)
- **Nurse:** dashboard, ward, vitals, medications, discharge, shift, task-board, admissions, orders, assessments, tasks, care-plan (Pataudi)
- **Pharmacy:** dashboard, prescriptions, inventory, drugs, reports, billing
- **Billing — Pataudi:** dashboard, invoices, payments, IPD billing, revenue
- **Billing — Gurgaon (Counsellor):** dashboard, packages, counselling (verify), revenue
- **CRM (Gurgaon):** dashboard, leads, lifecycle, campaigns, drip-campaigns
- **Lab (Pataudi):** all 16 live + 6 honestly-labelled Preview
- **Admin (both):** dashboard, MIS, audit, settings; + Gurgaon-only: command-center, morning-briefing, MRD, revenue-cycle, AI-workflow (after sweep)

That's still **~65 working routes**, which is a *substantial* HMS for a single MSK clinic. The pruning makes the product **smaller in scope, much higher in quality** — which is exactly what a real first customer should see.

# AUDIT METHODOLOGY & CAVEATS

- **Signal 1 (runtime):** `grep -rE "platform[A-Z]\w+|useHospital|useDepartmentWorklistSync|useClinicalPlatformListSync|canUse\w+Runtime" apps/hospital-os/src/pages/` → 123 files matched.
- **Signal 2 (demo patients):** `grep -rE "UH-2024|<known fake names>|UHID-\d+|MRN-\d+"` → 40 files matched.
- A page is `🟢` only if Signal 1 fires AND Signal 2 does not.
- A page is `🟡` if **both** fire (real wiring + cruft).
- A page is `🔴` if Signal 2 fires but Signal 1 does not (or only an `useAuth` import — which doesn't count as data wiring).
- A page is `⚪` if neither signal fires (could be a thin placeholder, or could use a non-standard runtime that grep missed). **Treat as 🔴 for shipping decisions** until verified by opening the file.
- **What this audit does NOT catch:**
  - Dead `onClick={() => {}}` buttons inside otherwise-wired pages
  - "Live" pages whose runtime call is decorative (e.g., import `useHospital` only to read `user.role`)
  - Pages with sneaky `??` fallbacks to demo arrays when API returns empty
  - Any backend-side breakage (this audit is UI-only)
- A **30-minute manual spot check** of each 🟡 and ⚪ page before login is strongly recommended.

---

# TONIGHT'S EXECUTION ORDER (for this specific task — module visibility)

1. **(10 min) Edit `scripts/navayu-pack-definitions.ts`** to drop the dead-on-arrival tabs from both `GURGAON_*_TABS` and `PATAUDI_*_TABS` arrays.
2. **(5 min) Regenerate the packs:** `pnpm exec tsx scripts/write-navayu-packs.ts` (or whatever the write script is — verify in `scripts/`).
3. **(10 min) Apply the new packs** via `pnpm provision:navayu` against the prod DB (or re-run from Coolify Terminal).
4. **(30 min) Sweep the 14 cruft pages** above — open each, delete demo arrays, replace with `[]` + empty state.
5. **(5 min) Spot-check** each ⚪ Unverified page by opening it and looking for hardcoded arrays vs. real data sources.
6. **(5 min) Re-run** `pnpm --filter hospital-os typecheck` to confirm green.
7. **(5 min) Commit, push, redeploy via Coolify.**

**Total: ~70 minutes.** Fits the night-shipping budget with room to spare.

---

*End of report. Next step: tell me whether to start (a) the pack-definition edits to hide the dead tabs, or (b) the sweep of the 14 cruft files. I'd start with (a) — it has the largest customer-perception impact for the smallest engineering risk.*
