# Deploy Hospital OS UI on Vercel

Hospital OS is a **Vite + React SPA** (`apps/hospital-os`). Vercel hosts the static UI well. **kernel-api** and **domain-api** (Postgres, Redis, etc.) do **not** run on Vercel — deploy them on Railway, Render, Fly.io, or AWS, then point the UI at their public URLs.

---

## What goes where

| Component | Vercel? | Notes |
|-----------|---------|--------|
| **Hospital OS** (`apps/hospital-os`) | **Yes** | Static `dist/` after `vite build` |
| **Control plane** (`apps/control-plane`, Next.js) | **Yes** | Separate Vercel project |
| **Patient app** (`apps/patient-app`) | **Yes** | Separate project if needed |
| **kernel-api** (3001) | **No** | Long-running NestJS + DB |
| **domain-api** (3002) | **No** | Long-running NestJS + DB |
| **ai-gateway, Temporal, NATS** | **No** | Background / workers |

---

## 1. Deploy APIs first (staging)

Pick one host (example: **Railway** or **Render**) for:

- Postgres (or managed RDS)
- `kernel-api` — public URL e.g. `https://kernel-staging.example.com`
- `domain-api` — public URL e.g. `https://domain-staging.example.com`

Set on both APIs:

```env
CORS_ORIGINS=https://your-hospital-os.vercel.app,https://your-hospital-os-*.vercel.app
```

Run migrations: `prisma migrate deploy` on kernel and domain databases.

Without APIs, the UI still **builds and loads**, but live data needs `VITE_PLATFORM_RUNTIME=true` and reachable API URLs.

---

## 2. Vercel project — Hospital OS

1. Import the Git repo in [Vercel](https://vercel.com).
2. **Root Directory:** `apps/hospital-os`
3. **Framework Preset:** Vite
4. **Install Command** (monorepo — run from repo root):

   ```bash
   cd ../.. && pnpm install
   ```

5. **Build Command:**

   ```bash
   pnpm build
   ```

6. **Output Directory:** `dist`

7. **Environment variables** (Production + Preview):

   | Name | Example |
   |------|---------|
   | `VITE_KERNEL_API_URL` | `https://kernel-staging.example.com` |
   | `VITE_DOMAIN_API_URL` | `https://domain-staging.example.com` |
   | `VITE_API_BASE_URL` | same as domain |
   | `VITE_API_PROVIDER` | `nest` |
   | `VITE_PLATFORM_RUNTIME` | `true` |
   | `VITE_DEV_TENANT_ID` | your staging tenant id (until OIDC is live) |

8. Deploy. `vercel.json` in this app enables **SPA routing** (all paths → `index.html`).

---

## 3. Auth on a public URL

- **Staging:** kernel `dev-login` + role email (see `ops/PRODUCTION_AUTH.md`). Ensure CORS and HTTPS API URLs match.
- **Production:** configure `VITE_OIDC_*` and disable dev-login on kernel.

Do not expose real PHI on Vercel preview URLs without staging tenant isolation and audit controls.

---

## 4. Optional: demo-only UI (no backend)

For a **marketing / UI-only** deploy:

```env
VITE_PLATFORM_RUNTIME=false
```

The app runs on local/demo store data. Good for screenshots; not for hospital go-live.

---

## 5. Control plane (second Vercel project)

- **Root Directory:** `apps/control-plane`
- **Install:** `cd ../.. && pnpm install`
- **Build:** `pnpm build`
- Wire env for kernel URL when control-plane API calls are implemented.

---

## 6. Checklist after deploy

- [ ] Open `https://<project>.vercel.app` — login page loads
- [ ] Browser network tab — API calls go to staging kernel/domain, not `localhost`
- [ ] No CORS errors (fix `CORS_ORIGINS` on APIs)
- [ ] Role selection → dashboard loads
- [ ] Deep link e.g. `/reception/queue` works (SPA rewrite)

---

## 7. Custom domain

Vercel → Project → Domains → e.g. `hms.staging.adrine.hospital` → add same origin to API `CORS_ORIGINS`.

---

## Related

- `apps/hospital-os/.env.example`
- `ops/PRODUCTION_AUTH.md`
- `ops/GO_LIVE_RUNBOOK.md`
- Master blueprint IaC: `infra/terraform/` (production target is AWS, not Vercel)
