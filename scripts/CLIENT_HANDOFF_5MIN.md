# Navayu client handoff — 5-minute unblock (you do this once)

Automation is blocked by: **no Coolify write API token**, **real-time service down** (terminals/UI), **Postgres not public**. Kernel is already **Running**.

## A. Coolify API token (2 min)

1. Open http://187.127.129.209:8000/security/api-tokens
2. **New token** → manually check: **root, write, deploy, read, read:sensitive**
3. Copy token → paste to your agent chat: `COOLIFY_WRITE_TOKEN=...`

## B. Postgres + database (3 min)

1. **adrine-postgres** → scroll to **Proxy** → enable **Make it publicly available**
2. **Ports mappings:** `5432:5432` → **Save** → **Restart**
3. From your PC PowerShell:

```powershell
$env:PGPASSWORD='AdrineNavayu2026!Pg'
# If psql installed:
psql -h 187.127.129.209 -U adrine -d adrine_kernel -c "CREATE DATABASE adrine_domain;"
```

Or use **Hostinger hPanel → VPS → Browser terminal** and run the `docker exec` line from `deploy/coolify/init-adrine-domain.sql`.

## C. Create two apps (10 min each build)

**+ New** → Private Repository → click **`lucky-llama-evx5km2ml1nobo1d0l`** → `Adrine-Infra` / `master`

### adrine-domain
- Dockerfile: `/services/domain-api/Dockerfile`
- Domain: `https://domain.adrine.in`, port `3002:3002`
- Env: see `scripts/COOLIFY_NAVAYU_DEPLOY_STATUS.md` → domain-api block

### adrine-hospital-os
- Dockerfile: `/apps/hospital-os/Dockerfile`
- Domain: `https://hms.adrine.in`, port `80:80`
- **Build-time** Vite env: see status doc → hospital-os block

## D. Provision tenant (2 min)

**Option A — from your PC** (only if Postgres port 5432 is reachable):

```powershell
cd "C:\Users\Parthrajsinh Gohil\Desktop\Adrine Cloud Infra"
$env:DATABASE_URL="postgresql://adrine:AdrineNavayu2026!Pg@187.127.129.209:5432/adrine_kernel?schema=public"
$env:DOMAIN_DATABASE_URL="postgresql://adrine:AdrineNavayu2026!Pg@187.127.129.209:5432/adrine_domain?schema=public"
$env:NAVAYU_DEFAULT_PASSWORD="Navayu@2026"
pnpm provision:navayu
```

**Option B — from VPS via kernel** (only if `NAVAYU_PROVISION_SECRET` is set on kernel-api; otherwise use Option A):

```powershell
curl.exe -X POST "https://kernel.adrine.in/internal/provision-navayu" `
  -H "x-provision-secret: YOUR_NAVAYU_PROVISION_SECRET"
```

Then **remove** public Postgres port `5432:5432` (if you enabled it).

## E. DNS (client-facing)

A records → `187.127.129.209`: `kernel`, `domain`, `hms`

## Client demo URL

- Staff: https://hms.adrine.in — `reception@navayuhealth.in` / `Navayu@2026`
