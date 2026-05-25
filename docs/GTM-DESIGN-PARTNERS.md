# Design partner hospitals (3–5) — execution checklist

This checklist operationalizes the Phase 1 GTM goal: **sign 3–5 design-partner hospitals** (no substitute for live sales conversations; use as an internal operating cadence).

## ICP filter (pass/fail before first workshop)

- [ ] 50–300 beds, multi-specialty, India-based operations.
- [ ] Decision maker available (medical director + IT + finance).
- [ ] Willingness to run **Hospital OS + Patient App** as a bundle pilot (not kernel-only).
- [ ] Data protection: signed NDA + DPA template reviewed; understanding of audit logging and consent capture.

## Discovery (week 1–2 per prospect)

- [ ] Map current OPD flow: check-in → token → consult → Rx → billing.
- [ ] Identify ABHA readiness (education only in Phase 1; no production ABDM scope).
- [ ] Inventory integrations: lab, radiology, pharmacy (even if “later phase”).
- [ ] Capture **success metrics**: wait time, revenue leakage, no-show rate (baseline).

## Pilot proposal

- [ ] Fixed pilot window (e.g., 8–12 weeks) with exit criteria.
- [ ] Support model: named Slack channel, weekly review, incident SLA for P0/P1.
- [ ] Pricing: design-partner discount documented; path to paid conversion month 4–6.

## Legal and security

- [ ] MSA / pilot order form executed.
- [ ] Subprocessors list acknowledged.
- [ ] Access controls: MFA for staff, break-glass procedure documented.

## Technical onboarding

- [ ] Tenant provisioned in **staging** first; smoke tests green.
- [ ] Production tenant in `ap-south-1` with KMS + Secrets Manager wiring per runbook.
- [ ] Synthetic checks for top journeys scheduled (Checkly or equivalent — wire when available).

## Exit / expansion

- [ ] Retrospective with quantified deltas vs baseline.
- [ ] Roadmap commit for Phase 2 modules (pharmacy/lab/ABDM) based on learnings.

---

**Status:** This document is the operational checklist for the business todo “Sign 3–5 design-partner hospitals.” Execution is owned by founders/GTM; engineering delivers the platform gates above.
