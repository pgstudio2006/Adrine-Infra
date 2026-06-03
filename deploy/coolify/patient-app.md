# patient-app — book.adrine.in (Coolify)

Public online booking for Navayu and future tenants.

**UI deploy guide:** [scripts/COOLIFY_PATIENT_APP.md](../../scripts/COOLIFY_PATIENT_APP.md)

## Coolify app

| Setting | Value |
|---------|--------|
| Name | `adrine-patient-app` |
| Domain | `https://book.adrine.in` |
| Dockerfile | `/apps/patient-app/Dockerfile` (build from **repo root**) |
| Port expose | `3000` |
| Ports mappings | **empty** (Traefik only — avoid `3000:3000` host bind) |
| Branch | `master` |
| Repo | `pgstudio2006/Adrine-Infra` |

Build must run from repository root so `outputFileTracingRoot` and `clients/navayu` resolve correctly.

## Prerequisites

1. **kernel-api** running at `https://kernel.adrine.in`
2. **domain-api** running at `https://domain.adrine.in` (booking POST/GET)
3. Navayu tenant provisioned (`pnpm provision:navayu`)
4. **CORS** on kernel + domain includes `https://book.adrine.in` (see below)
5. DNS `book.adrine.in` → Coolify Traefik

## Build args (Coolify build-time env)

Set as **build-time** variables in Coolify (Dockerfile ARGs):

```env
NEXT_PUBLIC_PLATFORM_RUNTIME=true
NEXT_PUBLIC_KERNEL_API_URL=https://kernel.adrine.in
NEXT_PUBLIC_DOMAIN_API_URL=https://domain.adrine.in
NEXT_PUBLIC_DEV_TENANT_ID=tenant_navayu
```

Copy-paste file: [patient-app.env.example](./patient-app.env.example)

## Runtime env

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

## CORS (kernel + domain)

Browser booking calls kernel and domain APIs. On both **`adrine-kernel`** and **`adrine-domain`**:

```env
CORS_ORIGINS=https://hms.adrine.in,https://book.adrine.in
```

Without `CORS_ORIGINS`, pages render but fetch fails in the browser. See [ops/PRODUCTION_AUTH.md](../../ops/PRODUCTION_AUTH.md).

## Routes

| URL | Purpose |
|-----|---------|
| `/book/navayu` | Navayu public booking (stable alias) |
| `/book/[slug]` | Tenant slug booking (config-driven) |
| `/intake?visitId=` | Pre-visit intake (UAT) |

## Dependencies

1. **domain-api** — `GET/POST /public/booking/:slug/*`
2. **kernel-api** — `GET /public/tenants/:slug/branches`, `GET /public/tenants/:slug/booking-config`

## DNS

`book.adrine.in` → Coolify Traefik → patient-app container (port 3000 internal).

## Docker build verify

From repo root (Linux/macOS or Docker Desktop on Windows):

```bash
docker build -f apps/patient-app/Dockerfile -t adrine-patient-app:test .
```

Verified **2026-06-04** — Next.js standalone build succeeds (~3 min cold build).

## Local build (Windows)

Standalone Docker output may fail on Windows (symlink EPERM). Local dev:

```bash
cd apps/patient-app
pnpm build
```

`next.config.ts` skips standalone on `win32`; Docker/Linux builds use standalone for Coolify.

## Post-deploy smoke test

1. `https://book.adrine.in` → 200
2. `https://book.adrine.in/book/navayu` → booking UI
3. DevTools Network — no CORS errors to kernel/domain
4. Complete a test slot booking when domain-api is up
