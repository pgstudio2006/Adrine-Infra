# Navayu on Coolify — click-by-click (187.127.129.209)

Project: **My first project** → **production**  
Repo: `https://github.com/pgstudio2006/Adrine-Infra` (branch `master`)

Do these **in order**. Each resource: **Start** after save.

---

## 0. Shared secrets (Coolify → Shared Variables)

| Key | Value |
|-----|--------|
| `JWT_SECRET` | (generate 32+ random chars) |
| `NAVAYU_DEFAULT_PASSWORD` | `Navayu@2026` (rotate after UAT) |

---

## 1. PostgreSQL

**+ Add Resource** → search `PostgreSQL` → click card

| Field | Value |
|-------|--------|
| Name | `adrine-postgres` |
| Database | `adrine_kernel` |
| Username | `adrine` |
| Password | (strong, save it) |

**Start** → wait green.

> Optional second DB on same Postgres: create database `adrine_domain` via Coolify terminal or SQL console:
> `CREATE DATABASE adrine_domain;`

For Navayu v0 you can use **one DB** `adrine` for both APIs if you prefer simpler setup.

---

## 2. Redis

**+ Add Resource** → `Redis` → name `adrine-redis` → **Start**

Copy internal URL (e.g. `redis://default:pass@adrine-redis:6379`).

---

## 3. kernel-api

**+ Add Resource** → **Private Repository (GitHub App)**

| Field | Value |
|-------|--------|
| Repository | `pgstudio2006/Adrine-Infra` |
| Branch | `master` |
| Build Pack | **Dockerfile** |
| Dockerfile location | `services/kernel-api/Dockerfile` |
| Base Directory | `/` (repo root) |
| Port | `3001` |
| Domain | `http://187.127.129.209:3001` or `kernel.adrine.in` |

**Environment variables:**

```env
DATABASE_URL=postgresql://adrine:PASSWORD@adrine-postgres:5432/adrine_kernel?schema=public
REDIS_URL=redis://adrine-redis:6379
JWT_SECRET=<from shared vars>
NODE_ENV=production
PORT=3001
CORS_ORIGINS=http://187.127.129.209:8080,http://187.127.129.209:3000
ALLOW_DEV_LOGIN=false
```

**Deploy** → after first deploy, open **Terminal** on container:

```bash
cd /repo/services/kernel-api && npx prisma migrate deploy
```

Health: `curl http://YOUR_DOMAIN/healthz`

---

## 4. domain-api

Same as kernel, but:

| Field | Value |
|-------|--------|
| Dockerfile | `services/domain-api/Dockerfile` |
| Port | `3002` |
| Domain | port 3002 or `domain.adrine.in` |

```env
DATABASE_URL=postgresql://adrine:PASSWORD@adrine-postgres:5432/adrine_domain?schema=public
REDIS_URL=redis://adrine-redis:6379
JWT_SECRET=<same as kernel>
NODE_ENV=production
PORT=3002
CORS_ORIGINS=http://187.127.129.209:8080,http://187.127.129.209:3000
```

Terminal:

```bash
cd /repo/services/domain-api && npx prisma migrate deploy
```

---

## 5. Provision Navayu (from your PC)

Tunnel Postgres or temporarily allow your IP, then:

```powershell
cd "C:\Users\Parthrajsinh Gohil\Desktop\Adrine Cloud Infra"
$env:DATABASE_URL="postgresql://adrine:PASSWORD@187.127.129.209:5432/adrine_kernel?schema=public"
$env:DOMAIN_DATABASE_URL="postgresql://adrine:PASSWORD@187.127.129.209:5432/adrine_domain?schema=public"
$env:NAVAYU_DEFAULT_PASSWORD="Navayu@2026"
pnpm provision:navayu
```

---

## 6. Hospital OS (static)

**+ Add Resource** → **Private Repository (GitHub App)** OR **Public Repository**

| Field | Value |
|-------|--------|
| Build Pack | **Nixpacks** or Static |
| Install | `corepack enable && corepack prepare pnpm@9.14.4 --activate && pnpm install --frozen-lockfile` |
| Build | `pnpm --filter @adrine/hospital-os build` |
| Publish | `apps/hospital-os/dist` |
| Port | `8080` |

**Build-time env:**

```env
VITE_PLATFORM_RUNTIME=true
VITE_KERNEL_API_URL=http://187.127.129.209:3001
VITE_DOMAIN_API_URL=http://187.127.129.209:3002
VITE_API_PROVIDER=nest
VITE_PATIENT_APP_URL=http://187.127.129.209:3000
```

Open `http://187.127.129.209:8080` → login `reception@navayuhealth.in` / `Navayu@2026`

---

## 7. Patient app

**+ Add Resource** → full repo (same as hospital-os):

| Field | Value |
|-------|--------|
| Dockerfile | `/apps/patient-app/Dockerfile` |
| Build context | repository root |
| Port expose | `3000` |
| Domain | `https://book.adrine.in` |

Build-time env (see `deploy/coolify/patient-app.env.example`):

```env
NEXT_PUBLIC_KERNEL_API_URL=https://kernel.adrine.in
NEXT_PUBLIC_DOMAIN_API_URL=https://domain.adrine.in
NEXT_PUBLIC_PLATFORM_RUNTIME=true
NEXT_PUBLIC_DEV_TENANT_ID=tenant_navayu
```

Booking: `https://book.adrine.in/book/navayu`

---

## Smoke test

1. `curl http://187.127.129.209:3001/healthz`
2. `curl http://187.127.129.209:3002/healthz`
3. Login Hospital OS as reception
4. Book slot on patient app
5. Register patient in Gurgaon branch

---

## Fix real-time warning (optional)

Hostinger firewall: open **6001**, **6002** TCP for Coolify UI updates.
