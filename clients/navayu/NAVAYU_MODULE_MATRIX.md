# Navayu Module Matrix (Wave 0)

Authoritative visibility matrix for **Gurgaon Center** (MSK specialty) vs **Pataudi Hospital** (mini hospital).  
Enforced via `clients/navayu/packs/*-pack.json` → `BranchConfig.tenant.settings` → Hospital OS nav + route guard.

**Legend:** ✅ = visible · ❌ = hidden · 🔒 = role disabled · 👤 = nav profile override

---

## Roles enabled by branch

| Role | Gurgaon | Pataudi | Notes |
|------|---------|---------|-------|
| admin | ✅ | ✅ | Gurgaon: full MSK admin suite; Pataudi: hospital-common admin only |
| doctor | ✅ | ✅ | Jr doctor profile at Gurgaon (MSK dept) |
| nurse | ✅ | ✅ | Ward / bedside |
| receptionist | ✅ | ✅ | Front desk |
| pharmacist | ✅ | ✅ | Dispensing + inventory subset |
| billing | ✅ | ✅ | Gurgaon: counsellor persona; Pataudi: full billing desk |
| crm_manager | ✅ | 🔒 | Gurgaon CRM; disabled at Pataudi |
| lab_technician | 🔒 | ✅ | LIMS at Pataudi only |
| radiologist | 🔒 | 🔒 | Not sold either branch (Wave 0) |
| ot_coordinator | 🔒 | 🔒 | Hidden — no OT module sold |
| inventory_manager | 🔒 | 🔒 | Hidden |
| emergency | 🔒 | 🔒 | Hidden |
| hr_manager | 🔒 | 🔒 | Hidden |
| scheduler | 🔒 | 🔒 | Hidden |
| dialysis_tech | 🔒 | 🔒 | Hidden |

---

## Admin tabs

| Tab | Gurgaon | Pataudi | Notes |
|-----|---------|---------|-------|
| dashboard | ✅ | ✅ | |
| morning-briefing | ✅ | ❌ | Gurgaon MSK admin |
| command-center | ✅ | ❌ | Gurgaon MSK admin |
| mortality | ❌ | ❌ | Not in sold list |
| ai-workflow | ✅ | ❌ | Gurgaon MSK admin |
| disease-mapping | ✅ | ❌ | Gurgaon MSK admin |
| data-mining | ✅ | ❌ | Gurgaon MSK admin |
| kaizen | ✅ | ❌ | Gurgaon MSK admin |
| revenue-cycle | ✅ | ❌ | Gurgaon MSK admin |
| treatment-success | ✅ | ❌ | Gurgaon MSK admin |
| staff | ✅ | ✅ | |
| departments | ✅ | ✅ | |
| finance | ✅ | ✅ | |
| expenses | ✅ | ✅ | |
| approvals | ✅ | ✅ | |
| claims | ✅ | ✅ | |
| doctor-sharing | ✅ | ❌ | Gurgaon MSK admin |
| mrd | ✅ | ❌ | Gurgaon MSK admin |
| mis | ✅ | ✅ | |
| audit | ✅ | ✅ | |
| phonebook | ✅ | ❌ | Call book — Gurgaon only |
| crm | ✅ | ❌ | Admin CRM tile — Gurgaon only |
| settings | ✅ | ✅ | |

---

## Doctor tabs

| Tab | Gurgaon (senior) | Gurgaon (jr MSK) | Pataudi | Notes |
|-----|------------------|------------------|---------|-------|
| dashboard | ✅ | ✅ | ✅ | |
| queue | ✅ | ✅ | ✅ | OPD queue |
| patients | ✅ | ✅ | ✅ | |
| ipd | ✅ | ❌ 👤 | ✅ | Jr doctor: IPD hidden via `navProfiles.jr_doctor` |
| schedule | ✅ | ❌ 👤 | ✅ | Jr doctor: schedule hidden |
| analytics | ✅ | ❌ 👤 | ✅ | Jr doctor: analytics hidden |
| labs | ❌ | ❌ | ✅ | Gurgaon: not sold |
| radiology | ❌ | ❌ | ✅ | Gurgaon: not sold |

---

## Pharmacy tabs

| Tab | Gurgaon | Pataudi | Notes |
|-----|---------|---------|-------|
| dashboard | ✅ | ✅ | |
| prescriptions | ✅ | ✅ | |
| inventory | ✅ | ✅ | |
| schedule-h | ✅ | ❌ | Gurgaon sold list |
| drugs | ✅ | ✅ | |
| reports | ✅ | ✅ | |
| billing | ✅ | ✅ | |
| suppliers | ✅ | ✅ | |
| purchase | ✅ | ✅ | Purchase orders |
| queries | ✅ | ✅ | Query |
| indent | ✅ | ✅ | Ward indent |
| returns | ✅ | ✅ | |
| *all other pharmacy tabs* | ❌ | ❌ | formulary, narcotics, audit, etc. |

---

## Reception tabs

| Tab | Gurgaon | Pataudi | Notes |
|-----|---------|---------|-------|
| dashboard | ✅ | ✅ | |
| flow-hub | ✅ | ✅ | Flow |
| registration | ✅ | ✅ | |
| feedback | ✅ | ✅ | |
| appointments | ✅ | ✅ | |
| checkin | ✅ | ✅ | |
| queue | ✅ | ✅ | |
| billing | ✅ | ✅ | |
| ipd | ✅ | ✅ | |
| visitors | ✅ | ✅ | |
| handover | ✅ | ✅ | |
| enquiries | ✅ | ✅ | Inquiry |
| beds | ❌ | ❌ | Not sold |
| branches | ❌ | ❌ | Not sold |

---

## Nurse tabs

| Tab | Gurgaon | Pataudi | Notes |
|-----|---------|---------|-------|
| dashboard | ✅ | ✅ | |
| ward | ✅ | ✅ | My ward |
| vitals | ✅ | ✅ | |
| medications | ✅ | ✅ | |
| discharge | ✅ | ✅ | |
| shift | ✅ | ✅ | Shift handoff |
| task-board | ✅ | ✅ | Task board |
| admissions | ✅ | ✅ | |
| orders | ✅ | ✅ | Order verification |
| assessments | ✅ | ✅ | |
| io | ✅ | ✅ | Intake/output |
| reports | ✅ | ✅ | |
| tasks | ❌ | ❌ | Not in sold list |
| care-plan | ❌ | ❌ | Not in sold list |

---

## CRM tabs (`crm_manager` role)

| Tab | Gurgaon | Pataudi |
|-----|---------|---------|
| dashboard | ✅ | 🔒 |
| leads | ✅ | 🔒 |
| lifecycle | ✅ | 🔒 |
| campaigns | ✅ | 🔒 |
| drip-campaigns | ✅ | 🔒 |
| experience | ✅ | 🔒 |
| reports | ✅ | 🔒 |

---

## Counsellor (`billing` role + `navProfiles.counsellor`)

| Tab / route | Gurgaon counsellor | Gurgaon other billing | Pataudi billing |
|-------------|-------------------|----------------------|-----------------|
| dashboard | ✅ | ❌ | ✅ |
| packages | ✅ | ❌ | ✅ |
| revenue | ✅ | ❌ | ✅ |
| `/crm/*` | ✅ 👤 | ❌ | ❌ |
| all other billing tabs | ❌ | ❌ | partial set (invoices, payments, IPD, insurance, etc.) |

Match rule: `role=billing` + email contains `counsellor@`.

---

## Lab tabs (`lab_technician`)

| Tab | Gurgaon | Pataudi |
|-----|---------|---------|
| *all LIMS tabs* | 🔒 | ✅ |

Role disabled at Gurgaon; full LIMS nav at Pataudi.

---

## Feature flags

| Flag | Gurgaon | Pataudi |
|------|---------|---------|
| whiteLabelMode | true | true |
| telemedicineEnabled | false | false |
| patientRelationsEnabled | true | false |
| formBuilderEnabled | true | true |
| workflowDesignerEnabled | false | false |

---

## Enforcement stack

1. **Provision:** `scripts/provision-navayu.ts` merges `tenant-settings.json` + `{branch}-pack.json` into `BranchConfig` key `tenant.settings` per branch.
2. **Runtime load:** `loadBranchConfig()` → `TenantSettingsProvider` → `coerceTenantSettings()` (unlisted tabs default **visible** — packs must set `visible: false` explicitly).
3. **Nav render:** `getTabsForRole()` + nav profiles (`jr_doctor`, `counsellor`).
4. **Route guard:** `canAccessRoute()` in `AppLayout` blocks direct URL access to hidden paths.

---

## Blockers / gaps (branch-specific nav at runtime)

| Gap | Impact | Mitigation |
|-----|--------|------------|
| Dev login uses `role@adrine.local` — no branch pack until kernel session + `loadBranchConfig` | Local demo may show default Adrine nav | Set `VITE_PLATFORM_RUNTIME=true` + provision Navayu; or import pack JSON into Admin Settings |
| Nav profiles need email/name for jr doctor & counsellor | Senior vs junior both MSK dept | Profile match uses `junior@` email or name contains `Junior` |
| Counsellor CRM routes cross role boundary | `/crm/*` not in `billing` ROLE_TABS | `allowedRoutePrefixes: ["/crm"]` on counsellor profile |
| Pataudi has no server settings until reprovision | Old DB rows lack pack merge | Re-run `pnpm provision:navayu` after deploy |
| Module entitlements (`moduleFlags`) separate from tab visibility | Kernel may still expose module APIs | Wave 0 is UI/config only; API enforcement is Wave 1 |

---

*Generated for Navayu Wave 0 — see `clients/navayu/packs/gurgaon-pack.json` and `pataudi-pack.json` for machine-readable source.*
