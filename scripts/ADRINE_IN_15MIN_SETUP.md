# adrine.in — 15-minute finish (manual UI)

Repo is on GitHub: **https://github.com/pgstudio2006/Adrine-Infra** (`master`, commit `f0986ba+`).

## 1. DNS (2 min) — at your registrar

A records → **187.127.129.209**: `kernel`, `domain`, `hms`, `book`  
See `scripts/ADRINE_IN_DNS.md`.

## 2. Coolify proxy (1 min)

http://187.127.129.209:8000/server/gsk4hshqgd09oemlj9z9d6n5/proxy → **Start Proxy** → wait until running.

## 3. Kernel app (5 min) — must Save manually

http://187.127.129.209:8000/project/umn8vjfqrqn7jglfr8wqee0i/environment/fzhhu9uv8kltz49e51qxp58h/application/t36wqfoh1hj88qrizvbr0q9h

If deploy fails with **`open Dockerfile: no such file or directory`**, Coolify is building from repo root without a Dockerfile path. Either pull latest `master` (root `Dockerfile` for kernel) **or** set Dockerfile location below and **Save** (reload page to confirm).

| Field | Value |
|-------|-------|
| Dockerfile | `Dockerfile` or `services/kernel-api/Dockerfile` |
| Domain | `https://kernel.adrine.in` |
| Ports exposes | `3001` |
| Port mappings | `3001:3001` |

**Reload page** — if Dockerfile is empty, fill again and **Save**.

Environment → `CORS_ORIGINS` = `https://hms.adrine.in,https://book.adrine.in` (runtime only for `NODE_ENV`).

**Deploy** → wait for build (10–20 min first time).

## 4. Add 3 more apps (+ New → GitHub → Adrine-Infra)

Copy from `scripts/COOLIFY_NAVAYU_CLICKBYCLICK.md`:

- **domain-api** → `services/domain-api/Dockerfile`, `https://domain.adrine.in`, port 3002
- **hospital-os** → static build → `https://hms.adrine.in`
- **patient-app** → `apps/patient-app` → `https://book.adrine.in`

## 5. Postgres second DB

Terminal on VPS or Coolify postgres:

```sql
CREATE DATABASE adrine_domain;
```

## 6. After apps green

App terminal: `cd /app/services/kernel-api && npx prisma migrate deploy`  
Then from PC: `pnpm provision:navayu` (see status doc for DATABASE_URL).

Login: https://hms.adrine.in — `reception@navayuhealth.in` / `Navayu@2026`
