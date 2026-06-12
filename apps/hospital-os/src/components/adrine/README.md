# Adrine 2026 — Design System & Redesign Notes

Full-product redesign of the Hospital OS UI, gated behind
`isAdrine2026Experience()` (`src/lib/adrine/experience.ts`). Navayu tenants
(Gurgaon MSK / Pataudi) always receive the legacy UI — **zero Navayu files
were modified**; the only coupling is a read-only call to `isNavayuTenant()`.

## Architecture

```
lib/adrine/
  experience.ts      Tenant gate (2026 vs legacy)
  ai-insights.ts     Typed advisory AI contract + per-role heuristic engines
  module-presets.ts  Realistic operational presets for extended routes

components/adrine/
  primitives.tsx     PageScaffold · MetricGrid · SectionPanel · StatusChip ·
                     WorkflowStepper · ListRow · EmptyState
  dense-table.tsx    DenseTable — sticky header, column visibility, quick filter
  ai-panel.tsx       AIInsightPanel — recommendation + expandable reasoning chain
  command-palette.tsx  Ctrl/Cmd+K module navigation (cmdk)
  theme-toggle.tsx   Class-based dark/light, persisted
  ModuleWorkspace.tsx  Standard screen for extended/planned routes

components/shell/
  AdrineTopShell.tsx Two-tier TOP navigation shell (constraint: no sidebar)
                     Tier 1: brand · role · ⌘K · AI · theme · notifications · user
                     Tier 2: contextual module tabs per role
```

## Navigation decision

The product constraint mandates the top-bar pattern. The shell keeps a
two-tier top bar: global actions on tier 1, the role's module tabs on
tier 2. Data-dense modules achieve density through `DenseTable` and
`SectionPanel` composition, not chrome — no sidebar was needed for any
module in this pass.

## AI intelligence layer

`ai-insights.ts` defines the advisory contract: every insight ships a
`recommendation`, an auditable `reasoning[]` chain, and a `confidence`
score. Engines per role (admin, doctor, nurse, pharmacy, lab, billing,
emergency) reason over live `hospitalStore` data with deterministic
heuristics today; `services/ai-gateway` is the drop-in replacement —
swap engine internals, keep the contract, UI unchanged. AI output is
advisory-only; all actions route through normal governed workflows.

## Module redesigns (each `*Dashboard2026.tsx` + early-return wiring in parent)

| Module | Screen | Notes |
|--------|--------|-------|
| Admin | `pages/admin/AdminDashboard2026.tsx` | Command metrics, dept pulse, AI panel, event ledger |
| Doctor | `pages/doctor/DoctorDashboard2026.tsx` | Queue table, consult workflow, STAT-lab insights |
| Reception | `pages/reception/ReceptionDashboard2026.tsx` | Live queue, appointments, front-door workflow |
| Lab | `pages/lab/LabDashboard2026.tsx` | Pipeline metrics, worklist, analyser fleet |
| Nurse | `pages/nurse/NurseDashboard2026.tsx` | Ward census, vitals/MAR due, shift workflow |
| Pharmacy | `pages/pharmacy/PharmacyDashboard2026.tsx` | Rx queue, low-stock, dispense workflow |
| Billing | `pages/billing/BillingDashboard2026.tsx` | Collections, pending invoices, RCM workflow |
| Emergency | `pages/emergency/EmergencyDashboard2026.tsx` | Triage board, trauma bays, acuity insights |
| HR | `pages/hr/HRDashboard2026.tsx` | Roster, credential-expiry insights |
| OT | `pages/ot/OTDashboard2026.tsx` | Surgery list, time-out workflow, turnover insights |
| Inventory | `pages/inventory/InventoryDashboard2026.tsx` | Stock moves, reorder insights |
| Radiology | `pages/radiology/RadiologyDashboard2026.tsx` | Modality worklist, TAT insights |
| CRM | `pages/crm/CRMDashboard2026.tsx` | Pipeline, funnel, SLA-breach insights |
| Blood Bank | `pages/blood-bank/BloodBankDashboard2026.tsx` | Requisition queue, critical-group stock |
| Scheduling | `pages/scheduling/SchedulingDashboard2026.tsx` | Bookings, peak-hour insights |
| Dialysis | `pages/dialysis/DialysisDashboard2026.tsx` | Session schedule, machine maintenance insights |
| Generic | `pages/DashboardPage2026.tsx` | Fallback for roles without a dedicated workspace |
| Extended routes | `RolePlaceholder` → `ModuleWorkspace` | Metrics + workflow + AI per module preset |

## Login

`pages/AdrineLoginPage.tsx` — split brand/ops statement + role grid +
LIS / Blood Bank standalone module spotlights. Credential wizard
(`HospitalLoginWizard`) takes over automatically when the platform
kernel is configured.

## Theming & accessibility

- Tokens in `src/index.css` (monochrome Adrine palette + semantic
  success/warning/info/destructive), dark mode via `class` strategy,
  toggle persisted in `localStorage('adrine_theme')`.
- Focus-visible rings, aria-labels on icon buttons, keyboard palette,
  WCAG-AA contrast on both themes.

## Assumptions

- Static Vercel demo has empty platform stores → screens render inline
  realistic fallback rows (`FALLBACK_*` constants) when arrays are empty.
- Notifications in the shell are representative samples until the
  notification runtime is wired to this surface.
- `routeReadiness.ts` remains the source of truth for Live/Preview badges.
