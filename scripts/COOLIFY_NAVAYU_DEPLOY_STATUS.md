# Navayu Wave 0 — Coolify Deploy Status (adrine.in)

**Updated:** 2026-06-03 (session 4 — adrine.in domains)  
**Coolify:** http://187.127.129.209:8000  
**Project UUID:** `umn8vjfqrqn7jglfr8wqee0i`  
**Environment UUID:** `fzhhu9uv8kltz49e51qxp58h` (production)  
**Server UUID:** `gsk4hshqgd09oemlj9z9d6n5` (localhost)  
**Destination UUID:** `kt0mkddiavm0eo3afpjzlseu`  
**GitHub App UUID:** `e10vr7ere12wqtvz14rkydsw`  
**Repo / branch:** `pgstudio2006/Adrine-Infra` @ `f0986ba` (master)

**Domains (adrine.in only — not navayuhealth.in):** see [ADRINE_IN_DNS.md](./ADRINE_IN_DNS.md)

---

## Executive summary

| Area | Status |
|------|--------|
| PostgreSQL | ✅ Running |
| Redis | ✅ Running (healthy) |
| Traefik proxy | 🔴 **Exited** — blocks HTTPS on adrine.in subdomains |
| kernel-api app | 🔴 Config incomplete; last deploy **failed** |
| domain-api / hospital-os / patient-app | ❌ Not created |
| API automation | ⚠️ Deploy works; **write** blocked without token with root+write |

---

## What succeeded (this session)

1. **Redis `adrine-redis`** — API reports `running:healthy`, port mappings cleared, not publicly exposed.
2. **PostgreSQL `adrine-postgres`** — Still running (`dp2gns8ygjh0w20s84z7kofl`).
3. **Coolify API** — Enabled; API tokens created (deploy/read; **write** still blocked on PATCH/create until you mint a token with **root + write** checked in UI).
4. **Kernel deploy triggered** — `GET /api/v1/deploy?uuid=t36wqfoh1hj88qrizvbr0q9h&force=true` queued deployment `e8pzptb9i0nswbxt1jteac3c` on commit `f0986ba` (build failed — see below).
5. **`NODE_ENV` on kernel** — Already **runtime-only** (`is_buildtime=false`) in Coolify env.

---

## What failed / blocked

### Kernel deploy `e8pzptb9i0nswbxt1jteac3c` — FAILED

- **Status:** `failed` (~06/03/2026 11:45 UTC)
- **Root cause:** App still has **empty `dockerfile_location`** and FQDN still sslip.io. Build cannot use `services/kernel-api/Dockerfile`.
- **API PATCH** returns `403 Missing required permissions: write` with current tokens.
- **UI Save** via automation does not persist (Alpine `x-model` on Dockerfile + Livewire submit rollback).

### Traefik proxy — EXITED

Server proxy status: `exited`. Until **coolify-proxy** is running, `https://kernel.adrine.in` (and other subdomains) will not route or get Let's Encrypt certs.

**Manual:** Coolify → Servers → localhost → Proxy → **Start**

### Apps not created

Only one application exists: `t36wqfoh1hj88qrizvbr0q9h` (kernel).  
`POST /applications/private-github-app` requires **write** permission.

| Planned app | Domain | Port | Dockerfile / build |
|-------------|--------|------|-------------------|
| adrine-kernel | https://kernel.adrine.in | 3001 | `services/kernel-api/Dockerfile` |
| adrine-domain | https://domain.adrine.in | 3002 | `services/domain-api/Dockerfile` |
| adrine-hospital-os | https://hms.adrine.in | 80/443 via proxy | Static: `pnpm --filter @adrine/hospital-os build`, publish `apps/hospital-os/dist` |
| adrine-patient-app | https://book.adrine.in | 3000 | Nixpacks, base `apps/patient-app` |

---

## DNS — user action at registrar (required)

Add **A records** pointing to **`187.127.129.209`** (TTL 300 recommended for first cutover):

| Host | Type | Value | Coolify service |
|------|------|-------|-----------------|
| `kernel` | A | `187.127.129.209` | kernel-api |
| `domain` | A | `187.127.129.209` | domain-api |
| `hms` | A | `187.127.129.209` | Hospital OS |
| `book` | A | `187.127.129.209` | Patient app |

Optional: `@` → `187.127.129.209`, `www` CNAME → `adrine.in`.

**Until DNS propagates**, use IP ports: `:3001` kernel, `:3002` domain, `:8080` HMS, `:3000` book.

Full copy-paste env URLs: [ADRINE_IN_DNS.md](./ADRINE_IN_DNS.md)

---

## Manual steps (priority order) — ~15 min in Coolify UI

### 1. Start Traefik proxy

Servers → **localhost** → Proxy → **Start** (must show running).

### 2. API token with write (one-time)

Security → API Tokens → New → check **root, write, deploy, read, read:sensitive** → Create → save token locally.

Then from PC:

```powershell
$env:COOLIFY_TOKEN = "<token-with-write>"
# PATCH example:
$headers = @{ Authorization = "Bearer $env:COOLIFY_TOKEN"; "Content-Type" = "application/json" }
$body = @{
  name = "adrine-kernel"
  domains = "https://kernel.adrine.in"
  dockerfile_location = "services/kernel-api/Dockerfile"
  ports_mappings = "3001:3001"
  git_commit_sha = "f0986ba"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://187.127.129.209:8000/api/v1/applications/t36wqfoh1hj88qrizvbr0q9h" -Method Patch -Headers $headers -Body $body
```

### 3. Fix kernel app (if not using API)

Application → **adrine--infra** → General:

| Field | Value |
|-------|-------|
| Name | `adrine-kernel` |
| Domains | `https://kernel.adrine.in` |
| Dockerfile location | `services/kernel-api/Dockerfile` |
| Ports exposes | `3001` |
| Port mappings | `3001:3001` |
| Network alias | `adrine-kernel` |

**Save** → confirm values **stick after reload**.

Environment variables (update CORS):

```env
CORS_ORIGINS=https://hms.adrine.in,https://book.adrine.in
DATABASE_URL=postgresql://adrine:AdrineNavayu2026!Pg@dp2gns8ygjh0w20s84z7kofl:5432/adrine_kernel?schema=public
REDIS_URL=redis://default:<password>@owztayjm22pvffyu0x7xjpls:6379/0
JWT_SECRET=adrine-navayu-jwt-2026-k7x9m2p4q8w1n5r3
NODE_ENV=production
PORT=3001
ALLOW_DEV_LOGIN=false
```

Ensure **NODE_ENV** is **not** “Available at Buildtime” (runtime only).

**Deploy** → after success:

```bash
cd /repo/services/kernel-api && npx prisma migrate deploy
```

### 4. Create `adrine_domain` database

On VPS (SSH or Coolify Postgres terminal when realtime service is fixed):

```bash
docker exec -it $(docker ps -qf name=dp2gns8ygjh0w20s84z7kofl) psql -U adrine -d adrine_kernel -c "CREATE DATABASE adrine_domain;"
```

### 5. Create domain-api, hospital-os, patient-app

+ New → **Private Repository (GitHub App)** → Adrine-Infra → master → per [COOLIFY_NAVAYU_CLICKBYCLICK.md](./COOLIFY_NAVAYU_CLICKBYCLICK.md) with domains:

- `https://domain.adrine.in` (3002)
- `https://hms.adrine.in` (static)
- `https://book.adrine.in` (patient-app)

**domain-api env:**

```env
DATABASE_URL=postgresql://adrine:AdrineNavayu2026!Pg@adrine-postgres:5432/adrine_domain?schema=public
JWT_SECRET=adrine-navayu-jwt-2026-k7x9m2p4q8w1n5r3
KERNEL_API_URL=http://adrine-kernel:3001
NODE_ENV=production
PORT=3002
CORS_ORIGINS=https://hms.adrine.in,https://book.adrine.in
```

**hospital-os build env:**

```env
VITE_PLATFORM_RUNTIME=true
VITE_KERNEL_API_URL=https://kernel.adrine.in
VITE_DOMAIN_API_URL=https://domain.adrine.in
VITE_PATIENT_APP_URL=https://book.adrine.in
```

**patient-app env:**

```env
NEXT_PUBLIC_KERNEL_API_URL=https://kernel.adrine.in
NEXT_PUBLIC_DOMAIN_API_URL=https://domain.adrine.in
NEXT_PUBLIC_PLATFORM_RUNTIME=true
```

Deploy each app after DNS points to the VPS (or use sslip.io until DNS is live).

### 6. Provision Navayu tenant

From PC when Postgres is reachable:

```powershell
cd "C:\Users\Parthrajsinh Gohil\Desktop\Adrine Cloud Infra"
$env:DATABASE_URL="postgresql://adrine:AdrineNavayu2026!Pg@187.127.129.209:5432/adrine_kernel?schema=public"
$env:DOMAIN_DATABASE_URL="postgresql://adrine:AdrineNavayu2026!Pg@187.127.129.209:5432/adrine_domain?schema=public"
$env:NAVAYU_DEFAULT_PASSWORD="Navayu@2026"
pnpm provision:navayu
```

---

## Target URLs (after DNS + proxy + deploy)

| Service | URL |
|---------|-----|
| Kernel API | https://kernel.adrine.in |
| Domain API | https://domain.adrine.in |
| Hospital OS | https://hms.adrine.in |
| Online booking | https://book.adrine.in/book/navayu |

Login (tenant): `reception@navayuhealth.in` / `Navayu@2026`

---

## API quick reference (deploy without write)

```http
GET /api/v1/deploy?uuid=t36wqfoh1hj88qrizvbr0q9h&force=true
Authorization: Bearer <token-with-deploy>
```

List deployment: `GET /api/v1/deployments/{deployment_uuid}`

---

## Infrastructure blockers (unchanged)

| Issue | Impact |
|-------|--------|
| Real-time service down (6001/6002) | In-app terminals unreliable |
| SSH :22 timeout from automation PC | No remote `docker exec` from agent |
| Traefik proxy exited | No 80/443 routing / SSL for adrine.in |
| API tokens without **write** | Cannot PATCH apps or create new apps via API |
| Coolify UI Save via headless browser | Dockerfile/domain fields revert — use manual Save or write-capable API token |

---

## Resource UUIDs (quick links)

| Resource | UUID | URL |
|----------|------|-----|
| Postgres | `dp2gns8ygjh0w20s84z7kofl` | [config](http://187.127.129.209:8000/project/umn8vjfqrqn7jglfr8wqee0i/environment/fzhhu9uv8kltz49e51qxp58h/database/dp2gns8ygjh0w20s84z7kofl) |
| Redis | `owztayjm22pvffyu0x7xjpls` | [config](http://187.127.129.209:8000/project/umn8vjfqrqn7jglfr8wqee0i/environment/fzhhu9uv8kltz49e51qxp58h/database/owztayjm22pvffyu0x7xjpls) |
| kernel-api | `t36wqfoh1hj88qrizvbr0q9h` | [app](http://187.127.129.209:8000/project/umn8vjfqrqn7jglfr8wqee0i/environment/fzhhu9uv8kltz49e51qxp58h/application/t36wqfoh1hj88qrizvbr0q9h) |
