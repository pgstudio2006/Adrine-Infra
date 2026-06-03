# Adrine Lite — Hostinger + Coolify + R2 Deployment

**Target:** Low-cost multi-tenant tier (Navayu + up to ~15–20 small hospitals)  
**Server:** Hostinger **KVM 4** (4 vCPU, 16 GB RAM, 200 GB NVMe) — **chosen plan**  
**Orchestrator:** [Coolify](https://coolify.io) (self-hosted PaaS on the VPS)  
**Files:** Cloudflare R2 (reports, PDFs, images, documents)

---

## Architecture

```text
                    ┌──────────────────────────────────────┐
                    │  Cloudflare (DNS + optional proxy)    │
                    │  hms.adrine.in / api.adrine.in        │
                    └───────────────┬──────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐         ┌─────────────────────┐     ┌───────────────┐
│ Coolify app   │         │ Coolify app         │     │ Cloudflare R2 │
│ Adrine        │         │ Adrine Backend      │     │ (S3-compatible)│
│ Frontend      │         │ (kernel + domain)   │     │               │
│ Hospital OS   │         │                     │     │ • Reports     │
│ static/Vite   │         │ NestJS APIs         │     │ • PDFs        │
└───────────────┘         └──────────┬──────────┘     │ • Images      │
                                     │                │ • Documents   │
                    ┌────────────────┼────────────────┤               │
                    │ Hostinger KVM 4│                └───────────────┘
                    │ Coolify        │
                    │ ├── PostgreSQL │
                    │ ├── Redis      │
                    │ └── Daily      │
                    │     backups    │
                    └────────────────┘
```

**Optional:** Patient app as a **second Coolify app** (Next.js) or separate Vercel project pointing at the same API.

---

## What runs where

| Component | Where | Notes |
|-----------|--------|--------|
| **Hospital OS** | Coolify → static site or Node build serving `dist/` | Build: `pnpm --filter @adrine/hospital-os build` |
| **kernel-api** | Coolify Docker service | Port 3001 internal |
| **domain-api** | Coolify Docker service | Port 3002 internal |
| **PostgreSQL** | Coolify managed Postgres (or compose service) | One DB, multi-tenant |
| **Redis** | Coolify Redis | Cache, sessions, rate limits |
| **Daily backups** | Coolify scheduled backup + **off-server** `pg_dump` to R2 | Do not rely on 1 VPS snapshot only |
| **AI (Navayu summaries)** | **External API** (OpenRouter / Vercel AI Gateway) | Do not run LLM on VPS — keep CPU for APIs + Postgres |
| **Large files** | **R2 only** | kernel `FILE_STORAGE=s3` → R2 endpoint |

---

## Why this stack works

| Choice | Reason |
|--------|--------|
| **Hostinger KVM 4** | Comfortable headroom: Postgres + 2 NestJS + Redis + Coolify + optional Patient app |
| **Coolify** | Git push deploy, SSL, env vars, backups — AWS-like DX without AWS cost |
| **R2** | Cheap egress; keeps 200 GB NVMe for DB + apps + logs, not MRIs/PDFs at scale |
| **Single VPS** | Matches low-ticket SaaS (₹1L/year clients); room to grow before AWS tier |

---

## Coolify setup (order)

### 1. VPS bootstrap

- Ubuntu 22.04/24.04 on Hostinger  
- Point domain A record to VPS IP (or Cloudflare proxy)  
- Install Coolify (official script)  
- Enable Coolify **daily backups** for Postgres volume  

### 2. PostgreSQL + Redis

- Create **PostgreSQL 16** resource in Coolify  
- Create **Redis 7** resource  
- Note internal URLs for `DATABASE_URL` and `REDIS_URL`  

### 3. Backend (one or two services)

**Option A — Recommended start:** Two Coolify applications from same repo:

| App | Dockerfile / build | Port |
|-----|-------------------|------|
| `adrine-kernel` | `services/kernel-api` | 3001 |
| `adrine-domain` | `services/domain-api` | 3002 |

**Option B — Single container** (save RAM): monolith image running both — only if you build a combined Dockerfile later.

**Env (both APIs):**

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
NODE_ENV=production
CORS_ORIGINS=https://hms.yourdomain.com,https://patient.yourdomain.com
JWT_SECRET=<strong-secret>
FILE_STORAGE=s3
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_BUCKET=adrine-files
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=auto
```

Run migrations on deploy:

```bash
pnpm prisma migrate deploy
```

(kernel and domain may use separate DB schemas or DBs — match your current Prisma setup.)

### 4. Frontend (Hospital OS)

Coolify **Static** or **Nixpacks** app:

| Setting | Value |
|---------|--------|
| Root / build | Monorepo root |
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm --filter @adrine/hospital-os build` |
| Publish | `apps/hospital-os/dist` |

**Build-time env (Vite):**

```env
VITE_PLATFORM_RUNTIME=true
VITE_KERNEL_API_URL=https://api.yourdomain.com
VITE_DOMAIN_API_URL=https://api.yourdomain.com
VITE_API_PROVIDER=nest
```

Use Coolify **Traefik** routes:

- `hms.yourdomain.com` → frontend  
- `api.yourdomain.com` → kernel (path `/`) + domain (path rewrite or subdomain split: `kernel.` / `domain.`)  

**Simplest API routing:**

- `https://kernel.yourdomain.com` → kernel-api  
- `https://domain.yourdomain.com` → domain-api  
- Frontend env points to both URLs  

### 5. Cloudflare R2

1. Create bucket `adrine-files` (or per-env `adrine-staging-files`)  
2. Create API token with read/write  
3. Optional: public CDN subdomain for patient-facing PDFs via signed URLs only (prefer **signed URLs** from API, not public bucket)  
4. Wire kernel **file service** to R2 (S3-compatible SDK)  

**Folder layout in R2:**

```text
{tenantId}/{branchId}/patients/{patientId}/reports/...
{tenantId}/{branchId}/patients/{patientId}/documents/...
{tenantId}/exports/...
```

### 6. Daily backups (defense in depth)

| Layer | What |
|-------|------|
| Coolify | Automated volume/DB backup |
| Cron on VPS | `pg_dump | gzip` → upload to R2 `backups/postgres/YYYY-MM-DD.sql.gz` |
| Hostinger | 1 snapshot — emergency only |

Retention: 7 daily, 4 weekly on R2 (lifecycle rule).

---

## Multi-tenant (~15–20 hospitals on KVM 4)

- **One PostgreSQL** instance  
- **One** kernel + domain deployment  
- **Tenants** = `tenant_id` in DB (Navayu = `tenant_navayu`, others as you onboard)  
- **Branches** = two centers per client where needed  
- **Hospital OS** = single build; tenant chosen at login / dev-login email  

Do **not** deploy separate Coolify stacks per client — one shared platform, tenant isolation in DB.

**KVM 4 extras you can afford:**

- Patient intake app on same VPS (Next.js Coolify app)  
- Staging + production on one box (separate Postgres DBs, not duplicate full stacks)  
- More concurrent OPD users during peak hours without RAM pressure  

---

## Resource limits (KVM 4)

| OK on KVM 4 | Still avoid |
|-------------|-------------|
| 15–20 small OPD tenants | Running LLM / embeddings on VPS |
| Hospital OS + Patient app + APIs + Postgres + Redis | Temporal / ClickHouse / heavy analytics on same box |
| External LLM API | Storing large imaging on NVMe long-term |
| Daily pg_dump + Coolify backups → R2 | Ignoring disk >80% or RAM >85% sustained |

**Upgrade when:** sustained RAM >85%, disk >80%, or p95 API latency bad during OPD hours → second VPS (staging) or move enterprise clients to AWS tier.

---

## Navayu-specific

- Run **[Navayu provisioning](../clients/navayu/PROVISIONING.md)** after Postgres is up: `pnpm provision:navayu` (idempotent; seeds `tenant_navayu`, Pataudi + Gurgaon, users, forms, MSK workflow)
- Step-by-step go-live: **[scripts/deploy-navayu-checklist.md](../scripts/deploy-navayu-checklist.md)**
- Config seed: `clients/navayu/*.json`
- Patient intake: second Coolify app from **Adrine-Patient-App** repo, same API URLs

See [NAVAYU_MSK_WORKFLOW.md](./navayu/NAVAYU_MSK_WORKFLOW.md).

---

## Security checklist (staging / light prod)

- [ ] HTTPS only (Coolify + Cloudflare)  
- [ ] Strong `JWT_SECRET`; disable dev-login in prod when ready  
- [ ] CORS limited to your domains  
- [ ] R2 private bucket + signed URLs  
- [ ] Firewall: only 80/443 public; Postgres not exposed  
- [ ] Automated security updates on VPS  
- [ ] Full audit + RLS before real PHI at scale ([ENTERPRISE_AUDIT_REPORT.md](../ENTERPRISE_AUDIT_REPORT.md))  

---

## Alternative: Frontend on Vercel

You can keep **only backend + DB + Redis on Hostinger** and leave **Hospital OS on Vercel** (already deployed). Same R2, same API URLs — slightly simpler Coolify (no static frontend build on VPS).

Both models are valid; this doc assumes **all-in on Coolify** as you specified.

---

## Related

- [DEPLOY_VERCEL.md](../DEPLOY_VERCEL.md) — if frontend stays on Vercel  
- [adrine_master_blueprint](.cursor/plans/) — AWS tier for enterprise later  
