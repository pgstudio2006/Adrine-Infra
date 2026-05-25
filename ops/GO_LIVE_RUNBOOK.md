# Go-live runbook — Adrine Hospital OS (production)

Use this checklist when promoting the platform stack from staging to production. Do not store secrets in git; use your secret manager and inject at deploy time.

## 1. Preconditions

| Item | Owner | Done |
|------|-------|------|
| Postgres HA (backups + PITR) | Infra | [ ] |
| TLS on kernel-api, domain-api, hospital-os | Infra | [ ] |
| `JWT_DEV_SECRET` replaced with production signing key (or IdP) | Security | [ ] |
| `AUTH_MODE=production`, `DOMAIN_RBAC_ENFORCE=true` | Security | [ ] |
| `DATABASE_RLS_ENABLED=true` on both APIs | DBA | [ ] |
| `VITE_PLATFORM_RUNTIME=true` in hospital-os build | App | [ ] |
| Staging smoke passed (`ops/STAGING_SMOKE_CHECKLIST.md`) | QA | [ ] |

## 2. Environment (minimum)

### kernel-api

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Production Postgres |
| `JWT_DEV_SECRET` | Strong random; rotate plan documented |
| `AUTH_MODE` | `production` (reject disabled auth) |
| `CORS_ORIGINS` | Hospital OS origin only |
| `RATE_LIMIT_RPM` | e.g. `120` per tenant |
| `DATABASE_RLS_ENABLED` | `true` |

### domain-api

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Same cluster/schema strategy as staging |
| `DOMAIN_RBAC_ENFORCE` | `true` |
| `CORS_ORIGINS` | Hospital OS origin |
| `DATABASE_RLS_ENABLED` | `true` |

### hospital-os

Copy `apps/hospital-os/.env.production.example` → production env in CI/CD:

| Variable | Notes |
|----------|--------|
| `VITE_KERNEL_API_URL` | HTTPS kernel base |
| `VITE_DOMAIN_API_URL` | HTTPS domain base |
| `VITE_PLATFORM_RUNTIME` | `true` |
| Omit `VITE_DEV_TENANT_ID` | Tenant from JWT only |

## 3. Deploy sequence

1. **Migrate databases** — run Prisma migrations for kernel-api and domain-api against production.
2. **Seed platform catalog** — module catalog, subscription plans (`free_trial`, `standard`, `enterprise`) seed on kernel `onModuleInit`.
3. **Deploy kernel-api** — verify `GET /health`, `POST /auth/dev-login` (or OIDC) returns JWT with `sessionId`.
4. **Deploy domain-api** — verify `GET /health`, RBAC rejects mutating calls without `x-actor-role` when enforce on.
5. **Deploy hospital-os** static build — verify login, platform badge, `/admin/platform` hub.
6. **Tenant onboarding** — run Onboarding wizard or `POST /provisioning/signup` with `Idempotency-Key` header.
7. **Enable modules** — `POST /modules/enable` or subscription plan for tenant.
8. **Data migration** (if cutover) — Platform Admin → Migration: preview → execute → validate counts → rollback plan ready.

## 4. Post-deploy verification

| # | Check | Command / UI |
|---|--------|----------------|
| 1 | Session revoke works | Login → `POST /auth/sessions/revoke` → subsequent `/auth/me` fails |
| 2 | Module gate | Disable LIMS entitlement → lab routes show “Module not enabled” |
| 3 | Critical lab alert | Flag critical lab order → notification outbox row `pending` → `POST /jobs/reconcile` processes |
| 4 | Reconcile job | `POST /internal/jobs/reconcile` with `x-tenant-id` returns usage + metrics |
| 5 | Scale health | `GET /scale/health` (kernel) outbox depth &lt; threshold |
| 6 | OPD spine | Reception → check-in → consult → billing (manual once) |

## 5. Rollback

1. Revert hospital-os static asset to previous version (no DB change).
2. Revert domain-api / kernel-api containers to previous image.
3. If migration executed, run `POST /migration/jobs/:id/rollback` before restoring DB snapshot if needed.
4. Communicate incident window; preserve audit logs and outbox tables for forensics.

## 6. Ongoing operations

- **Daily**: check notification dead-letter count via Platform Admin or `GET /notifications/outbox?status=dead_letter`.
- **Weekly**: `POST /jobs/reconcile` per tenant; review platform invoice drafts.
- **Monthly**: rotate API keys; review `ops/SECURITY_CHECKLIST.md` and DPDP notes.

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering lead | | |
| Security | | |
| Hospital operations | | |
