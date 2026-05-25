# DPDP Act (India) — minimum compliance notes (Hospital OS platform)

**Disclaimer:** This document is engineering guidance only, not legal advice. Engage qualified counsel for DPDP registration, consent artifacts, and breach notification.

## Scope

Applies to Adrine Hospital OS + kernel/domain APIs processing **digital personal data** of patients, staff, and visitors in India. Patient mobile app (`patient-app`) has separate consent flows — referenced but not fully covered here.

## Data principals & roles

| Role under DPDP | Platform mapping |
|-----------------|------------------|
| Data fiduciary | Hospital / chain customer (tenant) |
| Data processor | Adrine platform (SaaS operator) |
| Data principal | Patient, staff |

Contractual DPA between Adrine and each hospital tenant must define processor obligations, sub-processors, and breach notice timelines.

## Lawful purpose & consent (Section 6–7)

Minimum engineering controls:

- [ ] **Purpose limitation** — collect only fields required for care/billing; registration forms configurable per tenant (`AdminSettings` / governance policies).
- [ ] **Consent flags** — branch config keys `opd.require_consent`, `opd.require_abha` enforced in OPD runtime when platform policies enabled.
- [ ] **Withdrawal** — document process to mark patient record inactive and stop marketing (`ReceptionDripMarketing`) per tenant policy.
- [ ] **Notice** — privacy notice URL in tenant branding settings (hospital-owned content).

## Data minimization & retention

- [ ] Audit logs: metadata only where possible; no full clinical note bodies in kernel audit by default.
- [ ] Notification SMS: template codes, not full lab result text.
- [ ] Retention schedule per tenant (MRD policy) — implement purge jobs (future); until then document manual export + delete SOP.
- [ ] Migration import jobs: CSV deleted after execute; `ImportJob` rows retained for audit with row counts.

## Security safeguards (Section 8)

Aligned with `ops/SECURITY_CHECKLIST.md`:

- Encryption in transit (TLS)
- Access control: RBAC + tenant isolation + optional RLS
- Session revocation and MFA path for privileged users
- Incident logging via audit + platform events

## Cross-border transfer

- [ ] Host Postgres and backups in India region unless Standard Contractual Clauses / government approval documented.
- [ ] List sub-processors (email/SMS, cloud) in customer DPA.

## Rights of data principals

| Right | Platform support (current) |
|-------|----------------------------|
| Access | Patient app reports/appointments; hospital staff via patient profile |
| Correction | Patient update APIs / reception registration edit |
| Erasure | Manual patient delete post-rollback migration; full erasure workflow — partial |
| Grievance | Hospital-operated contact; Adrine processor ticket |

Engineering backlog: **data export** endpoint per patient (JSON bundle) and **erasure request** workflow with cooling-off period.

## Breach notification (Section 8(6))

- Monitor notification dead-letter and auth anomaly spikes.
- Runbook: infra on-call → security lead → affected tenants within contractual window (often 72h awareness to Board).
- Preserve `audit_logs`, `platform_event_outbox`, `notification_outbox` for forensics.

## Children’s data

If paediatric modules enabled, require guardian consent capture on registration journey (`registration` tenant settings).

## Significant data fiduciary (SDF)

If Adrine or a tenant meets SDF thresholds:

- Enhanced DPIA
- Independent auditor
- Data protection officer appointment

Track in customer success, not only engineering.

## Evidence for auditors

| Artifact | Location |
|----------|----------|
| Access control matrix | `domain-rbac.ts`, `ROLE_PERMISSIONS` in hospital-os |
| Consent / policy config | kernel `BranchConfig`, governance effective policies |
| Processing records | platform events catalog `packages/hospital-operations/src/events.ts` |
| Security controls | `ops/SECURITY_CHECKLIST.md` |
| Go-live controls | `ops/GO_LIVE_RUNBOOK.md` |

## Review cadence

- Quarterly: security checklist + this note with legal
- Per release: gap analysis `packages/hospital-operations/src/analysis/gaps.ts` for privacy-related items
