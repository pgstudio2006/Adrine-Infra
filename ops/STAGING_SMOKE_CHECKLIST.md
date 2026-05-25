# Staging smoke checklist — reception → OPD → billing

Use this after deploying or bringing up the **local dev stack** to confirm the core hospital spine is reachable end-to-end. No real secrets belong in this repo — copy values from your secret manager into env files locally or in staging.

## Prerequisites

1. **Data services** (repo root):

   ```bash
   docker compose up -d postgres redis temporal
   ```

   Or full API containers via `deploy/docker-compose.dev.yml` (Postgres + kernel-api + domain-api).

2. **Environment** — set at minimum (see root `.env.example` and `apps/hospital-os/.env.example`):

   | Variable | Example | Notes |
   |----------|---------|--------|
   | `DATABASE_URL` | `postgresql://adrine:adrine_dev@localhost:5432/adrine?schema=public` | Both APIs share schema |
   | `JWT_DEV_SECRET` | *(from secret store)* | kernel-api signing |
   | `VITE_KERNEL_API_URL` | `http://localhost:3001` | Hospital OS |
   | `VITE_DOMAIN_API_URL` | `http://localhost:3002` | Hospital OS |
   | `VITE_PLATFORM_RUNTIME` | `true` | Enables platform reads/writes |
   | `VITE_DEV_TENANT_ID` | `tenant_dev` | Non-prod tenant header |

3. **Run APIs** (separate terminals):

   ```bash
   pnpm --filter @adrine/kernel-api dev
   pnpm --filter @adrine/domain-api dev
   pnpm --filter @adrine/hospital-os dev
   ```

   Optional patient portal: `pnpm --filter @adrine/patient-app dev` (port **3101**).

## Smoke path (manual)

| # | Step | Where | Pass criteria |
|---|------|--------|----------------|
| 1 | Dev login | Hospital OS login | Platform badge / session; no console CORS errors to `:3001`/`:3002` |
| 2 | Register patient | `/reception/registration` | Patient appears; `platformPatientId` set when runtime on |
| 3 | Book appointment | `/reception/appointments` or domain `POST /appointments` | Row in DB / list refresh |
| 4 | Check-in | `/reception/checkin` | OPD visit created; queue token |
| 5 | Queue | `/reception/queue` | Visit visible; `GET /opd/visits/board` hydrates when platform on |
| 6 | Consultation | `/doctor/consultation/:id` | Save succeeds or surfaces governed transition error |
| 7 | Lab / Rx orders | Doctor consultation or dept worklists | `GET /lab/branch/worklist`, `GET /pharmacy/branch/worklist` return rows for branch |
| 8 | Billing | `/reception/billing` or `/billing-dept/invoices` | Invoice/charge lines; payment blocked when live blockers present |
| 9 | Patient read-back | Patient app `/appointments`, `/reports`, `/prescriptions` | Lists match same tenant + patient UUID |

## Smoke path — IPD + beds

| # | Step | Where | Pass criteria |
|---|------|--------|----------------|
| 10 | IPD admission | `/reception/ipd` | Admission row created; platform `admissionId` when runtime on |
| 11 | Bed board | `/reception/beds` | `GET /beds` + `GET /ipd/admissions/branch/active` hydrate board; assign bed resolves platform bed UUID |
| 12 | Nurse ward / tasks | `/nurse/ward`, `/nurse/tasks` | Platform task list/create/complete when runtime on |
| 13 | Doctor IPD profile | `/doctor/ipd/:patientId` | Allowed-actions poll; guarded discharge attempt surfaces blocker message |
| 14 | IPD billing exit | `/billing-dept/ipd-billing` | `postServiceCharge` syncs charge; paid exit calls `POST /ipd/admissions/:id/billing/exit` |

## Smoke path — discharge

| # | Step | Where | Pass criteria |
|---|------|--------|----------------|
| 15 | Nurse discharge checklist | `/nurse/discharge` | Live blockers visible; `grant_nursing_clearance` when checklist complete |
| 16 | Reception flow discharge panel | `/reception/flow` | Discharge orchestration transitions; financial strip reflects blockers |
| 17 | Blocked payment (negative) | Billing with open blockers | Payment/invoice transition rejected with governed reason (toast) |

## Smoke path — emergency (ER)

Prereq: log in as **emergency** role (or role with ER tabs). `VITE_PLATFORM_RUNTIME=true`.

| # | Step | Where | Pass criteria |
|---|------|--------|----------------|
| 18 | ER dashboard | `/emergency` | Board loads; SSE or 15s poll refreshes worklists (no stale-only UI) |
| 19 | Triage | `/emergency/triage` | Triage saves; optional **transfer to IPD** creates/links admission |
| 20 | Case + treatment | `/emergency/cases`, `/emergency/treatment` | Case list hydrates; treatment / observation / discharge actions persist in store + platform encounter |
| 21 | ER orders | `/emergency/orders` | Linked lab/pharmacy/rad worklist rows; Create Orders → consultation path opens |
| 22 | Observation + IPD | `/emergency/observation` | Observation beds; IPD transfer without duplicate platform admission |
| 23 | MLC / ambulance | `/emergency/mlc`, `/emergency/ambulance` | MLC flag + ambulance arrival creates governed ER case |

## API spot checks (curl)

Replace `TOKEN` with JWT from `POST /auth/dev-login`.

```bash
# Kernel health / auth
curl -s -X POST http://localhost:3001/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"reception@adrine.local","fullName":"Reception","role":"reception","tenantId":"tenant_dev"}'

# OPD board (domain)
curl -s http://localhost:3002/opd/visits/board \
  -H "x-tenant-id: tenant_dev" -H "x-branch-id: <branchId>" \
  -H "Authorization: Bearer TOKEN"

# Branch worklists
curl -s "http://localhost:3002/lab/branch/worklist" \
  -H "x-tenant-id: tenant_dev" -H "x-branch-id: <branchId>" \
  -H "Authorization: Bearer TOKEN"

curl -s "http://localhost:3002/pharmacy/branch/worklist" \
  -H "x-tenant-id: tenant_dev" -H "x-branch-id: <branchId>" \
  -H "Authorization: Bearer TOKEN"
```

## Patient app env template

Copy `apps/patient-app/.env.example` → `apps/patient-app/.env.local`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_KERNEL_API_URL` | Dev login / session |
| `NEXT_PUBLIC_DOMAIN_API_URL` | Appointments, lab, pharmacy reads |
| `NEXT_PUBLIC_DEV_TENANT_ID` | Tenant header default |
| `NEXT_PUBLIC_PLATFORM_RUNTIME` | `true` for live stack |
| `NEXT_PUBLIC_DEV_PATIENT_ID` | Optional fixed patient UUID |

## Known gaps (not in this checklist)

- Production OIDC / ABHA linking (patient app uses dev-login stub)
- AWS staging deploy (see `infra/terraform/` skeleton only)
- Automated CI smoke (add later under `.github/workflows/`)

## Sign-off

- [ ] Postgres healthy (`docker compose ps`)
- [ ] kernel-api `:3001` responds
- [ ] domain-api `:3002` responds
- [ ] Reception → OPD → billing path completed once manually
- [ ] Patient app lists appointments/reports/Rx for same patient record
