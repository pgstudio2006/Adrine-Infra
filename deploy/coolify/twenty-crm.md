# Twenty CRM on Coolify (Navayu VPS)

**Coolify:** http://187.127.129.209:8000  
**Target URL:** `https://crm.adrine.in`  
**Compose file:** `deploy/twenty/docker-compose.coolify.yml`

Twenty runs on your Hostinger VPS (same as kernel/domain). Hospital OS on **Vercel** embeds it via iframe.

---

## Prerequisites

1. DNS **A record:** `crm` → `187.127.129.209`
2. Traefik proxy **running** in Coolify (Server → Proxy → Start)
3. Coolify API token with **write** scope: http://187.127.129.209:8000/security/api-tokens

---

## Option A — Coolify UI (recommended, ~10 min)

### 1. Create Docker Compose service

1. Project **Adrine** → environment **production** → **+ New** → **Docker Compose**
2. Name: `adrine-twenty-crm`
3. Source: **Git** → repo `pgstudio2006/Adrine-Infra` branch `master`
4. Compose path: `deploy/twenty/docker-compose.coolify.yml`
5. **Do not** map host ports — Coolify Traefik routes HTTPS only

### 2. Environment variables (service-level)

| Variable | Value |
|----------|--------|
| `SERVER_URL` | `https://crm.adrine.in` |
| `APP_SECRET` | `openssl rand -base64 32` (generate once, keep stable) |
| `PG_DATABASE_USER` | `postgres` |
| `PG_DATABASE_PASSWORD` | strong password (e.g. `openssl rand -base64 24`) |
| `STORAGE_TYPE` | `local` |
| `TAG` | `latest` |

### 3. Domain

1. Open service → **twenty-server** → **Domains**
2. Add: `https://crm.adrine.in` → port **3000**
3. Enable HTTPS (Let's Encrypt)

### 4. iframe CSP (required for Vercel embed)

Twenty blocks cross-origin iframes unless your reverse proxy adds `frame-ancestors`.

In Coolify → **twenty-server** → **Advanced** → **Custom Nginx/Traefik configuration** (or proxy labels), add middleware so responses include:

```
Content-Security-Policy: frame-ancestors 'self' https://adrine-hospital-os.vercel.app https://hms.adrine.in https://*.vercel.app;
```

**Traefik dynamic config** (if editing server proxy directly):

```yaml
http:
  middlewares:
    twenty-frame-embed:
      headers:
        contentSecurityPolicy: "frame-ancestors 'self' https://adrine-hospital-os.vercel.app https://hms.adrine.in https://*.vercel.app;"
```

Attach middleware to the `crm.adrine.in` router.

Verify:

```bash
curl -sI https://crm.adrine.in | findstr /i content-security-policy
```

### 5. First run

1. **Deploy** the compose stack
2. Open https://crm.adrine.in → create Twenty workspace + admin user
3. **Settings → API & Webhooks** → create API key (for lead sync)

### 6. domain-api env (lead sync from Navayu registration)

On Coolify app **adrine-domain** (`fxq9vh2765921yv0y6gvqs2z`), add runtime env:

```env
TWENTY_CRM_URL=https://crm.adrine.in
TWENTY_API_KEY=<paste from Twenty settings>
```

Redeploy domain-api.

---

## Option B — API script (with write token)

```powershell
$env:COOLIFY_WRITE_TOKEN = "your-token-from-coolify"
.\scripts\coolify-deploy-twenty.ps1
```

Then complete domain + CSP steps in UI (steps 3–4 above).

---

## Gurgaon pack (already in repo)

`clients/navayu/packs/gurgaon-pack.json` points Twenty to `https://crm.adrine.in` when enabled. After domain-api is live, Navayu counsellor/CRM roles see full Twenty at `/crm`.

---

## Vercel (Hospital OS)

See [docs/DEPLOY_VERCEL.md](../DEPLOY_VERCEL.md#twenty-crm-embed). Minimum:

```env
VITE_TWENTY_CRM_URL=https://crm.adrine.in
```

Redeploy Vercel after env change (Vite bakes env at build time).

---

## Smoke test

| Step | Expected |
|------|----------|
| https://crm.adrine.in | Twenty login / workspace |
| Vercel → login as `crm_manager` → **CRM** tab | Full Twenty iframe loads |
| Navayu registration | Lead appears in Twenty People (if `TWENTY_API_KEY` set) |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank iframe on Vercel | Missing `frame-ancestors` on `crm.adrine.in` |
| Twenty login redirect loop | `SERVER_URL` must exactly match browser URL |
| Lead sync silent | Check domain-api logs; verify `TWENTY_API_KEY` |
| 503 on crm.adrine.in | Stack not deployed or domain not attached to twenty-server:3000 |
