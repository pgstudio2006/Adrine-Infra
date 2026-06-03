# Navayu Wave 0 — Coolify Deploy Status (adrine.in)

**Updated:** 2026-06-03 (session 6 — hospital-os deployed)  
**Coolify:** http://187.127.129.209:8000  
**Project UUID:** `umn8vjfqrqn7jglfr8wqee0i`  
**Environment UUID:** `fzhhu9uv8kltz49e51qxp58h` (production)  
**Server UUID:** `gsk4hshqgd09oemlj9z9d6n5` (localhost)  
**Destination UUID:** `kt0mkddiavm0eo3afpjzlseu`  
**GitHub App UUID:** `e10vr7ere12wqtvz14rkydsw` (UI name: `lucky-llama-evx5km2ml1nobo1d0l`)  
**Repo / branch:** `pgstudio2006/Adrine-Infra` @ `master`

---

## Executive summary

| Area | Status |
|------|--------|
| Traefik proxy | ✅ **Running** (API: `proxy.status=running`) |
| PostgreSQL | ✅ Running (`adrine-postgres`) |
| Redis | ✅ Running |
| **kernel-api** (`adrine-kernel`) | ✅ **Running** — `https://kernel.adrine.in` routes; API returns 401 without `x-tenant-id` (expected) |
| domain-api | ❌ Not created |
| hospital-os | ✅ **Running** — `https://hms.adrine.in` |
| patient-app | ❌ Not created |
| `adrine_domain` DB | ❌ Not created |
| API automation (create/PATCH apps) | ⚠️ Needs token with **write** (latest auto-token was read-only) |

---

## Service status & URLs (verified 2026-06-03)

| Service | Coolify status | URL | HTTP |
|---------|----------------|-----|------|
| Traefik | Running | — | — |
| adrine-postgres | Running | internal `dp2gns8ygjh0w20s84z7kofl:5432` | — |
| adrine-redis | Running | internal `owztayjm22pvffyu0x7xjpls:6379` | — |
| adrine-kernel | Running | https://kernel.adrine.in | `/health` → 401 (app up); `/healthz` same middleware |
| domain-api | — | https://domain.adrine.in | 503 no backend |
| hospital-os | Running | https://hms.adrine.in | **200** (login UI) |
| patient-app | — | https://book.adrine.in | 503 |

---

## Kernel app — configured & running

**UUID:** `t36wqfoh1hj88qrizvbr0q9h`

| Setting | Value |
|---------|--------|
| Name | `adrine-kernel` |
| Domain | `https://kernel.adrine.in` |
| Dockerfile | `/services/kernel-api/Dockerfile` |
| Ports | `3001` / `3001:3001` |
| Branch | `master` |
| Repo | `pgstudio2006/Adrine-Infra` |

**Environment (runtime):**

```env
DATABASE_URL=postgresql://adrine:AdrineNavayu2026!Pg@dp2gns8ygjh0w20s84z7kofl:5432/adrine_kernel?schema=public
REDIS_URL=redis://default:AdrineNavayu2026!Redis@owztayjm22pvffyu0x7xjpls:6379/0
JWT_SECRET=adrine-navayu-jwt-2026-k7x9m2p4q8w1n5r3
NODE_ENV=production
PORT=3001
CORS_ORIGINS=https://hms.adrine.in,https://book.adrine.in
ALLOW_DEV_LOGIN=false
```

Container CMD runs `npx prisma migrate deploy` on start.

---

## Hospital OS — configured & running

**UUID:** `lm0z1tqxf5xm6mzme3veytnd`

| Setting | Value |
|---------|--------|
| Name | `adrine-hospital-os` |
| Domain | `https://hms.adrine.in` |
| Dockerfile | `/apps/hospital-os/Dockerfile` |
| Ports expose | `80` (Traefik only — **no** `80:80` host map) |
| Branch | `master` |
| Repo | `pgstudio2006/Adrine-Infra` |

**Build-time env (set via API):**

```env
VITE_PLATFORM_RUNTIME=true
VITE_API_PROVIDER=nest
VITE_KERNEL_API_URL=https://kernel.adrine.in
VITE_DOMAIN_API_URL=https://domain.adrine.in
VITE_PATIENT_APP_URL=https://book.adrine.in
```

First deploy failed on `80:80` host bind (Traefik already uses port 80). Fix: clear `ports_mappings` and redeploy.

---

## Domain API — created (needs DB + redeploy after Dockerfile fix)

**UUID:** `fxq9vh2765921yv0y6gvqs2z`

| Setting | Value |
|---------|--------|
| Name | `adrine-domain` |
| Domain | `https://domain.adrine.in` |
| Dockerfile | `/services/domain-api/Dockerfile` |
| Ports | `3002` / `3002:3002` |
| Branch | `master` |

**Runtime env:** `DATABASE_URL` → `adrine_domain`, `KERNEL_API_URL=http://adrine-kernel:3001`, same Redis/JWT/CORS as kernel.

**Blocker:** `adrine_domain` database must exist before Prisma migrate. Dockerfile CMD now creates it on start (push `master` then redeploy). Do **not** use `pre_deployment_command` with `docker exec` — Coolify runs that inside the app container.

---

## Remaining manual steps (~15 min)

### 1. Push latest `services/domain-api/Dockerfile` to `master` and redeploy `adrine-domain`

### 2. Create `adrine_domain` database (if not using updated Dockerfile yet)

Init scripts only run on **first** Postgres start. For existing `adrine-postgres`, use **Servers → localhost → Terminal → Connect**, then:

```bash
docker exec -i $(docker ps -qf name=dp2gns8ygjh0w20s84z7kofl) psql -U adrine -d adrine_kernel -c "CREATE DATABASE adrine_domain;"
```

See `deploy/coolify/init-adrine-domain.sql`.

### 4. Provision Navayu tenant (from PC when Postgres reachable)

```powershell
cd "C:\Users\Parthrajsinh Gohil\Desktop\Adrine Cloud Infra"
$env:DATABASE_URL="postgresql://adrine:AdrineNavayu2026!Pg@187.127.129.209:5432/adrine_kernel?schema=public"
$env:DOMAIN_DATABASE_URL="postgresql://adrine:AdrineNavayu2026!Pg@187.127.129.209:5432/adrine_domain?schema=public"
$env:NAVAYU_DEFAULT_PASSWORD="Navayu@2026"
pnpm provision:navayu
```

---

## Blockers

| Issue | Impact |
|-------|--------|
| Real-time service down (6001/6002) | In-app terminals unreliable |
| Coolify “New app” GitHub card | Headless click does not advance to repo list; **click manually** on `lucky-llama-evx5km2ml1nobo1d0l` |
| API token without **write** | `POST /applications/private-github-app` → 403 |
| No `psql` / SSH from agent PC | Cannot create `adrine_domain` remotely |

---

## Resource UUIDs

| Resource | UUID |
|----------|------|
| Postgres | `dp2gns8ygjh0w20s84z7kofl` |
| Redis | `owztayjm22pvffyu0x7xjpls` |
| kernel-api | `t36wqfoh1hj88qrizvbr0q9h` |
| hospital-os | `lm0z1tqxf5xm6mzme3veytnd` |
