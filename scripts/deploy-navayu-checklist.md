# Navayu production deploy checklist

Step-by-step go-live for **Hostinger KVM 4 + Coolify**. Full architecture: [docs/DEPLOYMENT_HOSTINGER_COOLIFY.md](../docs/DEPLOYMENT_HOSTINGER_COOLIFY.md).

---

## 1. Server bootstrap

- [ ] Hostinger KVM 4 (Ubuntu 22.04/24.04) provisioned
- [ ] DNS A records: `hms.yourdomain.com`, `kernel.yourdomain.com`, `domain.yourdomain.com` (or split API subdomain)
- [ ] Coolify installed on VPS
- [ ] Firewall: only **80/443** public; Postgres/Redis internal only

---

## 2. Data layer (Coolify resources)

- [ ] **PostgreSQL 16** created — note internal connection string
- [ ] **Redis 7** created — note `REDIS_URL`
- [ ] Copy values into Coolify secrets / `.env.production` (see repo root `.env.production.example`)

---

## 3. Backend deploy (two Coolify apps)

Build from monorepo root. See `deploy/docker-compose.prod.yml` for reference stack.

| App | Dockerfile | Port |
|-----|------------|------|
| adrine-kernel | `services/kernel-api/Dockerfile` | 3001 |
| adrine-domain | `services/domain-api/Dockerfile` | 3002 |

**Required env (both):**

```env
KERNEL_DATABASE_URL=postgresql://...
DOMAIN_DATABASE_URL=postgresql://...   # same DB for Navayu v0
REDIS_URL=redis://...
JWT_SECRET=<strong-secret>
NODE_ENV=production
CORS_ORIGINS=https://hms.yourdomain.com
FILE_STORAGE=s3
S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com
S3_BUCKET=adrine-files
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=auto
```

**Deploy hook — migrations (run once per deploy):**

```bash
cd services/kernel-api && pnpm prisma migrate deploy
cd services/domain-api && pnpm prisma migrate deploy

**Coolify kernel crash loop (`P2021` / `subscription_plans` does not exist):** Postgres is up but schema was never applied. In the app **Terminal** (path inside container is `/repo`):

```bash
cd /repo/services/kernel-api && npx prisma db push
```

Then **Restart**. After the baseline migration is on `master`, **Redeploy** so startup runs `prisma migrate deploy` automatically.
```

---

## 4. Navayu tenant provision

From a machine with repo access and production `DATABASE_URL`:

```bash
cp .env.production.example .env.production
# Edit KERNEL_DATABASE_URL / DOMAIN_DATABASE_URL

pnpm install
pnpm provision:navayu -- --dry-run   # preview
DATABASE_URL="$KERNEL_DATABASE_URL" DOMAIN_DATABASE_URL="$DOMAIN_DATABASE_URL" pnpm provision:navayu
```

Confirms: `tenant_navayu`, Gurgaon + Pataudi branches, users, forms, `navayu_msk_visit` workflow, protocol stub.

---

## 5. Hospital OS (frontend)

Coolify **Static** or Nixpacks from monorepo root:

| Setting | Value |
|---------|--------|
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm --filter @adrine/hospital-os build` |
| Publish | `apps/hospital-os/dist` |

**Build-time env:**

```env
VITE_PLATFORM_RUNTIME=true
VITE_KERNEL_API_URL=https://kernel.yourdomain.com
VITE_DOMAIN_API_URL=https://domain.yourdomain.com
VITE_API_PROVIDER=nest
VITE_PATIENT_APP_URL=https://patient.yourdomain.com
```

Optional: `docker-compose.prod.yml` service `hospital-os` uses `apps/hospital-os/Dockerfile` (nginx serving `dist/`).

---

## 6. Patient app (Coolify app: adrine-patient-app)

| Field | Value |
|-------|--------|
| Dockerfile | `/apps/patient-app/Dockerfile` (repo root build context) |
| Domain | `https://book.adrine.in` |
| Port expose | `3000` (Traefik only — no host `3000:3000` if port 80 is in use) |

Build-time env — copy from [deploy/coolify/patient-app.env.example](../deploy/coolify/patient-app.env.example):

```env
NEXT_PUBLIC_PLATFORM_RUNTIME=true
NEXT_PUBLIC_KERNEL_API_URL=https://kernel.adrine.in
NEXT_PUBLIC_DOMAIN_API_URL=https://domain.adrine.in
NEXT_PUBLIC_DEV_TENANT_ID=tenant_navayu
```

Booking smoke: `https://book.adrine.in/book/navayu`

Intake URL pattern: `https://book.adrine.in/intake?visitId=<platform-opd-visit-id>`

---

## 7. Health checks

```bash
# Kernel
curl -s https://kernel.yourdomain.com/health

# Domain OPD board (requires tenant headers in prod auth setup)
curl -s -H "x-tenant-id: tenant_navayu" -H "x-branch-id: <gurgaon-branch-id>" \
  "https://domain.yourdomain.com/opd/visits/board?branchId=<gurgaon-branch-id>"
```

**Functional smoke (Gurgaon MSK):**

1. Dev-login / prod auth as `reception@navayuhealth.in`
2. Register patient with referral + lifestyle + pain regions
3. Open intake link on tablet → submit VAS + red flags
4. Login as `junior@navayuhealth.in` → complete lumbar MSK form
5. Login as `senior@navayuhealth.in` → verify rule-based AI summary panel
6. CRM: lead visible for referral source
7. Patient profile → timeline shows registration, intake, exam events

---

## 8. Post-deploy hardening

- [ ] Set `NAVAYU_DEFAULT_PASSWORD` rotated; share credentials securely
- [ ] Disable dev-login when OIDC ready
- [ ] Coolify daily Postgres backup + off-server `pg_dump` → R2
- [ ] R2 bucket private; signed URLs only

---

## 9. Still post-deploy (not in this release)

- WhatsApp / SMS automation
- OpenRouter / AI Gateway one-page summary (LLM)
- Admin form designer (Phase 1)
- Protocol mapper UI (uses `clients/navayu/protocols.json` seed)

---

## Related

- [clients/navayu/PROVISIONING.md](../clients/navayu/PROVISIONING.md)
- [clients/navayu/NAVAYU_CLIENT_DELIVERY_STATUS.md](../clients/navayu/NAVAYU_CLIENT_DELIVERY_STATUS.md)
- [deploy/coolify/README.md](../deploy/coolify/README.md)
