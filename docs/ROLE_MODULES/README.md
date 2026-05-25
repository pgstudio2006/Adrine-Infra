# Hospital OS — Role Module Plans

Module-wise product and implementation plans aligned to the **role-based launch workspace** in `apps/hospital-os`. Each document inventories current routes, gaps, priorities (P0/P1/P2), workflows, API dependencies, cross-role handoffs, and UI constraints (no redesign — reuse existing shells).

| Role | Document | Base path | Status |
|------|----------|-----------|--------|
| Receptionist | [RECEPTIONIST_MODULE.md](./RECEPTIONIST_MODULE.md) | `/reception` | Active plan (2026-05-21) |
| CRM Manager | *(planned)* | `/crm` | Drip campaigns relocated here; full CRM module doc TBD |
| Doctor | [DOCTOR_MODULE.md](./DOCTOR_MODULE.md) | `/doctor` | Active plan (2026-05-21) — OPD spine live; EMR v1 planned |
| Nurse | [NURSE_MODULE.md](./NURSE_MODULE.md) | `/nurse` | Active plan (2026-05-21) — bedside IPD spine; MAR/vitals platform-backed; dashboard demo |
| Lab Technician | [LAB_TECHNICIAN_MODULE.md](./LAB_TECHNICIAN_MODULE.md) | `/lab` | Active plan (2026-05-21) — branch worklist + GAP-005 verify/release; no test catalog/LOINC yet |
| Pharmacist | [PHARMACIST_MODULE.md](./PHARMACIST_MODULE.md) | `/pharmacy` | Active plan (2026-05-24) — Rx dispense spine platform-backed; dashboard/Schedule H/procurement demo |
| Billing & Finance | [BILLING_FINANCE_MODULE.md](./BILLING_FINANCE_MODULE.md) | `/billing-dept` | Active plan (2026-05-24) — invoices/IPD/GAP-006/007 live-leaning; charge master/GST/claims gaps |
| Radiologist | [RADIOLOGIST_MODULE.md](./RADIOLOGIST_MODULE.md) | `/radiology` | Active plan (2026-05-24) — branch worklist + SSE; no PACS/governed sign-off yet |
| OT Coordinator | [OT_COORDINATOR_MODULE.md](./OT_COORDINATOR_MODULE.md) | `/ot` | Active plan (2026-05-24) — Board/Schedule partial platform; pre/intra/post-op demo-heavy |
| Inventory Manager | [INVENTORY_MANAGER_MODULE.md](./INVENTORY_MANAGER_MODULE.md) | `/inventory` | Active plan (2026-05-24) — Issue/GRN platform-backed; requisitions/PO demo |
| Emergency | [EMERGENCY_MODULE.md](./EMERGENCY_MODULE.md) | `/emergency` | Active plan (2026-05-24) — C1-leaning triage/IPD; reception handoff gap P0 |
| Scheduler | *(planned)* | `/scheduling` | — |

**Related repo docs**

- [ops/HOSPITAL_OS_PRODUCT_BACKLOG.md](../../ops/HOSPITAL_OS_PRODUCT_BACKLOG.md) — shipped P0 items and next candidates
- [MASTER_OPERATIONAL_CONNECTIVITY_MATRIX.md](../../MASTER_OPERATIONAL_CONNECTIVITY_MATRIX.md) — Live vs Preview per route
- [ENTERPRISE_AUDIT_REPORT.md](../../ENTERPRISE_AUDIT_REPORT.md) — platform readiness and security honesty

**Convention:** P0 = launch-blocking for reception desk daily ops; P1 = enterprise HMS expected within 90 days; P2 = differentiation / compliance / multi-site.
