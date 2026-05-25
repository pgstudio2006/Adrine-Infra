# Hospital OS — Product Backlog

Operational backlog for **hospital-os** (staff app). Patient-app is out of scope unless noted.

## Phase 8 — Program 2: Billing + insurance UX (2026-05-20)

| ID | Item | Status | Routes / notes |
|----|------|--------|----------------|
| P8-B2-01 | Billing-dept page shell with GAP-006/007 inline gate alerts | Done | All 12 legacy + 2 new `/billing-dept/*` screens |
| P8-B2-02 | Invoice wizard (step flow) | Done | `/billing-dept/invoices` dialog |
| P8-B2-03 | Payment wizard (step flow) | Done | `/billing-dept/payments` dialog |
| P8-B2-04 | Clearer empty states on list screens | Done | Invoices, payments, insurance, reconciliation |
| P8-B2-05 | Dashboard layout + KPI cards platform-only | Done | `/billing-dept` — live KPI grid when `platformOn` |
| P8-B2-06 | Insurance pre-auth wizard | Done | `/billing-dept/pre-auth` → `POST /insurance/authorizations` + transitions |
| P8-B2-07 | Day-end cash reconciliation | Done | `/billing-dept/reconciliation` → `GET /finance/operations/live` |
| P8-B2-08 | Connectivity matrix + gap doc sync | Done | `MASTER_OPERATIONAL_CONNECTIVITY_MATRIX.md`, `gaps.ts` |

### New routes

- `/billing-dept/pre-auth` — `BillingPreAuth`
- `/billing-dept/reconciliation` — `BillingReconciliation`

### Platform APIs used

- `GET /billing/dept/*` (dashboard, packages, revenue, GST, insurance, finance)
- `GET /billing/sync/opd|ipd/:id/live` (blockers → GAP-006)
- `GET /finance/operations/live` (reconciliation)
- `POST /insurance/authorizations` + `POST .../transition` (pre-auth wizard)

### Out of scope (this program)

- patient-app billing surfaces
- Payment gateway / GST filing automation
