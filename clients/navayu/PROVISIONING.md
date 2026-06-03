# Navayu tenant provisioning

**Goal:** After payment / contract sign-off, bring `tenant_navayu` live on Postgres in hours — not a custom HMS fork. Long-term platform vision lives in `.cursor/plans/adrine_master_blueprint_3a1b9ff0.plan.md`; this path is **client seed + idempotent script** for Hostinger KVM 4 / local UAT.

**Spec:** [NAVAYU_IMPLEMENTATION_SPEC.md](./NAVAYU_IMPLEMENTATION_SPEC.md) (UAT v0 scope) · **Workflow:** [NAVAYU_MSK_WORKFLOW.md](./NAVAYU_MSK_WORKFLOW.md)

---

## Prerequisites

- Node.js 22+, pnpm 9+
- Postgres 16 (local Docker or Hostinger Coolify service)
- Same `DATABASE_URL` for **kernel-api** and **domain-api** (shared `adrine` database; see [DEPLOYMENT_HOSTINGER_COOLIFY.md](../../docs/DEPLOYMENT_HOSTINGER_COOLIFY.md))

```bash
# From repo root
cp .env.example .env
# Edit DATABASE_URL, e.g.:
# DATABASE_URL=postgresql://adrine:adrine@localhost:5432/adrine?schema=public

docker compose -f deploy/docker-compose.dev.yml up -d postgres
pnpm install
cd services/kernel-api && pnpm prisma generate && pnpm prisma migrate deploy && cd ../..
cd services/domain-api && pnpm prisma generate && pnpm prisma migrate deploy && cd ../..
```

Optional: start kernel-api once so `OperationalTemplatePack` rows sync (`navayu_msk` is also upserted by the provision script).

---

## Provision Navayu

```bash
# Preview (no writes)
pnpm provision:navayu -- --dry-run

# Apply
DATABASE_URL=postgresql://adrine:adrine@localhost:5432/adrine?schema=public pnpm provision:navayu
```

The script reads `clients/navayu/*.json` and idempotently upserts:

| Artifact | Store |
|----------|--------|
| Organization `tenant_navayu` | kernel `organizations` |
| Branches Pataudi + Gurgaon | kernel `branches` + `module_flags` |
| OPD / MSK policies | kernel `branch_configs` |
| Branding, nav, registration lists | Gurgaon `branch_configs` key `tenant.settings` |
| UAT v0 forms | Gurgaon `branch_configs` key `tenant.forms` |
| Staff users | kernel `platform_users` |
| Onboarding complete (`navayu_msk`) | `tenant_signups` + `onboarding_sessions` |
| Legacy subscription | `subscriptions` (`design_partner`) |
| SaaS plan | `tenant_subscriptions` (`free_trial` if plan exists) |
| `navayu_msk_visit` workflow | domain `workflow_definitions` + published `workflow_versions` |
| Protocol library stub | Gurgaon `branch_configs` key `tenant.protocols` |

---

## UAT dev-login accounts

Use Hospital OS **dev login** (non-production) with `x-tenant-id: tenant_navayu` or select tenant in UI when platform runtime is enabled.

| Email | Role | Branch |
|-------|------|--------|
| admin@navayuhealth.in | admin | Gurgaon |
| reception@navayuhealth.in | receptionist | Gurgaon |
| reception.pataudi@navayuhealth.in | receptionist | Pataudi |
| junior@navayuhealth.in | doctor (MSK associate) | Gurgaon |
| senior@navayuhealth.in | doctor (senior) | Gurgaon |
| counsellor@navayuhealth.in | billing (counsellor persona) | Gurgaon |
| crm@navayuhealth.in | crm_manager | Gurgaon |
| nurse@navayuhealth.in | nurse | Gurgaon |
| pharmacy@navayuhealth.in | pharmacist | Gurgaon |

**Smoke path (v0):** Reception register (referral + lifestyle + pain regions) → patient intake on tablet → junior lumbar form → senior queue with placeholder AI summary → CRM lead from referral.

---

## Staging on Hostinger

Follow [DEPLOYMENT_HOSTINGER_COOLIFY.md](../../docs/DEPLOYMENT_HOSTINGER_COOLIFY.md): Postgres + Redis + kernel-api + domain-api + Hospital OS static app, run migrations on deploy, then run `pnpm provision:navayu` against production/staging `DATABASE_URL` from Coolify secrets.

**Before real PHI:** disable dev-login, enable audit/RLS per [ENTERPRISE_AUDIT_REPORT.md](../../ENTERPRISE_AUDIT_REPORT.md).

---

## Hospital OS tenant settings (Wave 0 lite)

When `VITE_PLATFORM_RUNTIME=true` and the user is on **Gurgaon**, `loadBranchConfig()` merges `tenant.settings` from the branch config API into tenant settings (see `apps/hospital-os/src/runtime/branch-config.ts`).

**Manual fallback:** Admin → Settings → Import JSON from `clients/navayu/tenant-settings.json`.

---

## Re-run / update

The script is safe to re-run: upserts by `tenantId`, branch `code`, and user `email`. Workflow publish is skipped if a published version already exists.
