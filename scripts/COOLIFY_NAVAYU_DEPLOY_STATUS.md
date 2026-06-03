# Navayu Wave 0 — Coolify Deploy Status

**Updated:** 2026-06-03 (session 3 — continued deployment)  
**Coolify:** http://187.127.129.209:8000  
**Project UUID:** `umn8vjfqrqn7jglfr8wqee0i`  
**Environment UUID:** `fzhhu9uv8kltz49e51qxp58h` (production)  
**Server UUID:** `gsk4hshqgd09oemlj9z9d6n5` (localhost)  
**Destination UUID:** `kt0mkddiavm0eo3afpjzlseu`  
**GitHub App UUID:** `e10vr7ere12wqtvz14rkydsw` (lucky-llama-evx5km2ml1nobo1d0l)

---

## Current status (dashboard dots)

| Resource | Status | Action |
|----------|--------|--------|
| **adrine-postgres** | 🟢 Running | OK |
| **adrine-redis** | 🔴 Down | Clear wrong port mapping, **Save**, **Start** — [config](http://187.127.129.209:8000/project/umn8vjfqrqn7jglfr8wqee0i/environment/fzhhu9uv8kltz49e51qxp58h/database/owztayjm22pvffyu0x7xjpls) |
| **adrine--infra (kernel)** | 🔴 Down | Fix Redis first, then **Deploy** — [app](http://187.127.129.209:8000/project/umn8vjfqrqn7jglfr8wqee0i/environment/fzhhu9uv8kltz49e51qxp58h/application/t36wqfoh1hj88qrizvbr0q9h) |

**Redis misconfiguration:** Ports Mappings must be **empty** (not `3000:5432`). That mapping is for Postgres and prevents Redis from starting.

---

## Completed

### 1. PostgreSQL — `adrine-postgres` ✅ RUNNING

| Field | Value |
|-------|-------|
| Resource UUID | `dp2gns8ygjh0w20s84z7kofl` |
| Config URL | http://187.127.129.209:8000/project/umn8vjfqrqn7jglfr8wqee0i/environment/fzhhu9uv8kltz49e51qxp58h/database/dp2gns8ygjh0w20s84z7kofl |
| Internal URL | `postgres://adrine:AdrineNavayu2026%21Pg@adrine-postgres:5432/adrine_kernel` |

### 2. Redis — `adrine-redis` 🔴 STOPPED (fix ports, then Start)

| Field | Value |
|-------|-------|
| Resource UUID | `owztayjm22pvffyu0x7xjpls` |
| Internal URL | `redis://default:OAbFqBZHLoa2hGNiEYKzwuDf0XnxBy5YCSTklcTszVZH4meDJtdiDa9pZ9gXF90c@adrine-redis:6379/0` |

### 3. Coolify API — ✅ ENABLED (session 3)

Settings → Advanced → **API Access** was disabled; enabled via Livewire (`is_api_enabled=true`).

Next: create token at http://187.127.129.209:8000/security/api-tokens with permissions **root, write, deploy, read, read:sensitive**, then use `scripts/coolify-deploy-navayu.ps1 -ApiToken "..."` for reliable PATCH/deploy.

---

## In progress / blocked

### 4. kernel-api — `adrine-kernel` ❌ EXITED (config not persisting)

| Field | Value |
|-------|-------|
| Resource UUID | `t36wqfoh1hj88qrizvbr0q9h` |
| Config URL | http://187.127.129.209:8000/project/umn8vjfqrqn7jglfr8wqee0i/environment/fzhhu9uv8kltz49e51qxp58h/application/t36wqfoh1hj88qrizvbr0q9h |
| Deployments | http://187.127.129.209:8000/project/umn8vjfqrqn7jglfr8wqee0i/environment/fzhhu9uv8kltz49e51qxp58h/application/t36wqfoh1hj88qrizvbr0q9h/deployments |

**Session 3 findings:**

- App status: **Exited** — Logs: *"No containers are running on server: localhost"*
- `http://187.127.129.209:3001/healthz` — not reachable from deploy agent (connection timeout)
- sslip.io returns **404** (proxy up, app not running)
- **Root cause:** General config keeps reverting after page reload:
  - Dockerfile location empty (should be `services/kernel-api/Dockerfile`)
  - Domain still sslip.io (should be `http://187.127.129.209:3001`)
  - Port mapping empty (should be `3001:3001`)
- Browser `fill` updates DOM but **Livewire `submit` does not persist** (Alpine entangle on dockerfile field). Use **Coolify API PATCH** after token is created, or save manually in UI and confirm values stick before Deploy.

**Target config:**

| Setting | Value |
|---------|-------|
| Name | `adrine-kernel` |
| Dockerfile | `services/kernel-api/Dockerfile` |
| Port / mapping | `3001` / `3001:3001` |
| Network alias | `adrine-kernel` |
| Domain | `http://187.127.129.209:3001` |

**Environment variables** (already set in prior session — verify on Environment Variables page):

```env
DATABASE_URL=postgresql://adrine:AdrineNavayu2026!Pg@adrine-postgres:5432/adrine_kernel?schema=public
REDIS_URL=redis://default:OAbFqBZHLoa2hGNiEYKzwuDf0XnxBy5YCSTklcTszVZH4meDJtdiDa9pZ9gXF90c@adrine-redis:6379/0
JWT_SECRET=adrine-navayu-jwt-2026-k7x9m2p4q8w1n5r3
NODE_ENV=production
PORT=3001
CORS_ORIGINS=http://187.127.129.209:8080,http://187.127.129.209:3000
ALLOW_DEV_LOGIN=false
```

**Build failed? (`NODE_ENV=production` at build time)**  
Coolify warns that build-time `NODE_ENV=production` skips devDependencies (TypeScript, Nest CLI, Prisma). Fix in UI:

1. **Environment Variables** → `NODE_ENV` → **uncheck “Available at Buildtime”** (runtime only), **or**
2. Push latest `Adrine-Infra` (Dockerfiles now run `NODE_ENV=development` during `pnpm install` / build).

Then **Redeploy** kernel app.

**After container is running:**

```bash
cd /app/services/kernel-api && npx prisma migrate deploy
```

---

### 5. `adrine_domain` database — ❌ NOT CREATED

Postgres terminal / Coolify sidebar terminal blocked (**real-time service down** on ports 6001/6002). SSH port 22 and Postgres 5432 not reachable from automation host.

**Manual on VPS (SSH or Coolify server terminal when realtime is fixed):**

```bash
docker exec -it $(docker ps -qf name=dp2gns8ygjh0w20s84z7kofl) psql -U adrine -d adrine_kernel -c "CREATE DATABASE adrine_domain;"
```

**Alternative:** Postgres → General → enable **Make it publicly available** on port 5432, then from your PC:

```powershell
# If psql installed:
$env:PGPASSWORD="AdrineNavayu2026!Pg"
psql -h 187.127.129.209 -U adrine -d adrine_kernel -c "CREATE DATABASE adrine_domain;"
```

---

### 6. domain-api — `adrine-domain` ❌ NOT CREATED

Wizard started (Adrine-Infra repo visible) but app resource not created yet.

Repeat: + New → Private Repository (GitHub App) → **Adrine-Infra** → branch **master** → Build Pack **Dockerfile** → `services/domain-api/Dockerfile` → port **3002** → save config → env → deploy.

Or via API after token:

```http
POST /api/v1/applications/private-github-app
```

| Setting | Value |
|---------|-------|
| Name | `adrine-domain` |
| Dockerfile | `services/domain-api/Dockerfile` |
| Port / mapping | `3002` / `3002:3002` |
| Network alias | `adrine-domain` |
| Domain | `http://187.127.129.209:3002` |

```env
DATABASE_URL=postgresql://adrine:AdrineNavayu2026!Pg@adrine-postgres:5432/adrine_domain?schema=public
JWT_SECRET=adrine-navayu-jwt-2026-k7x9m2p4q8w1n5r3
KERNEL_API_URL=http://adrine-kernel:3001
NODE_ENV=production
PORT=3002
CORS_ORIGINS=http://187.127.129.209:8080,http://187.127.129.209:3000
```

---

### 7. Hospital OS — port 8080 ❌ NOT CREATED

| Setting | Value |
|---------|-------|
| Repo | Adrine-Infra, branch master |
| Build Pack | Static or Nixpacks |
| Build | `pnpm --filter @adrine/hospital-os build` |
| Publish | `apps/hospital-os/dist` |
| Port | `8080` |
| Domain | `http://187.127.129.209:8080` |

Build env: `VITE_PLATFORM_RUNTIME=true`, `VITE_KERNEL_API_URL=http://187.127.129.209:3001`, `VITE_DOMAIN_API_URL=http://187.127.129.209:3002`, `VITE_PATIENT_APP_URL=http://187.127.129.209:3000`

---

### 8. Patient app — port 3000 ❌ NOT CREATED

| Setting | Value |
|---------|-------|
| Base Directory | `apps/patient-app` |
| Build Pack | Nixpacks (Next.js) |
| Port | `3000` |
| Domain | `http://187.127.129.209:3000` |

```env
NEXT_PUBLIC_KERNEL_API_URL=http://187.127.129.209:3001
NEXT_PUBLIC_DOMAIN_API_URL=http://187.127.129.209:3002
NEXT_PUBLIC_PLATFORM_RUNTIME=true
```

---

### 9. Provision Navayu — ❌ NOT RUN

Requires `adrine_domain` DB + reachable Postgres from your PC.

```powershell
cd "C:\Users\Parthrajsinh Gohil\Desktop\Adrine Cloud Infra"
$env:DATABASE_URL="postgresql://adrine:AdrineNavayu2026!Pg@187.127.129.209:5432/adrine_kernel?schema=public"
$env:DOMAIN_DATABASE_URL="postgresql://adrine:AdrineNavayu2026!Pg@187.127.129.209:5432/adrine_domain?schema=public"
$env:NAVAYU_DEFAULT_PASSWORD="Navayu@2026"
pnpm provision:navayu
```

---

## Shared secrets

```env
JWT_SECRET=adrine-navayu-jwt-2026-k7x9m2p4q8w1n5r3
NAVAYU_DEFAULT_PASSWORD=Navayu@2026
```

---

## Recommended next steps (priority order)

1. **Create API token** (API now enabled): http://187.127.129.209:8000/security/api-tokens — name `navayu-deploy`, permissions root+write+deploy+read+sensitive.
2. **PATCH kernel** via API — fix name, dockerfile, fqdn, ports, then `POST .../applications/t36wqfoh1hj88qrizvbr0q9h/deploy`.
3. **Create `adrine_domain`** on VPS (docker exec above).
4. **Create domain-api, hospital-os, patient-app** (API or UI wizard).
5. **Run migrations** in kernel/domain containers after deploy succeeds.
6. **`pnpm provision:navayu`** from PC once Postgres is reachable.

---

## Infrastructure blockers

| Issue | Impact |
|-------|--------|
| Real-time service down (6001/6002) | Terminals (app/postgres/sidebar) unusable |
| SSH :22 timeout from agent | Cannot docker exec remotely |
| Postgres :5432 / app :3001 closed externally | Cannot health-check or provision from agent |
| Coolify UI Save via automation | Config reverts — use API PATCH or manual save |

---

## Target URLs (after full deploy)

| Service | URL |
|---------|-----|
| Kernel API | http://187.127.129.209:3001 |
| Domain API | http://187.127.129.209:3002 |
| Hospital OS | http://187.127.129.209:8080 |
| Patient app | http://187.127.129.209:3000 |
| Booking | http://187.127.129.209:3000/book/navayu |

Login: `reception@navayuhealth.in` / `Navayu@2026`
