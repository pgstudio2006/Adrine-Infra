# Twenty CRM — connect after you deploy from public repo

**You deploy Twenty** in Coolify from the official repo. **We connect** HMS + domain-api + DNS.

## Architecture (agreed)

```
crm.adrine.in          → one Twenty instance (shared platform)
navayu.crm.adrine.in   → Navayu client workspace (Twenty profile)
hms.adrine.in          → Navayu HMS tenant embeds Navayu workspace in /crm
```

| Layer | Navayu mapping |
|--------|----------------|
| HMS tenant | `tenant_navayu` (Navayu Spine & Joint Care) |
| Branch pack | `clients/navayu/packs/gurgaon-pack.json` |
| Twenty workspace | subdomain `navayu` on `crm.adrine.in` |
| Lead sync | domain-api → Twenty REST API (Navayu API key) |

---

## Step 1 — You: deploy Twenty in Coolify

1. Coolify → **+ New** → **Docker Compose** (or **Service** if using Twenty template)
2. Source: **Public repository** → `https://github.com/twentyhq/twenty`
3. Use Twenty’s official compose under `packages/twenty-docker/docker-compose.yml` (or Coolify Twenty template if listed)
4. **Do not** bind host port 3000 — let Traefik route HTTPS only

### Required env (service-level)

| Variable | Value |
|----------|--------|
| `SERVER_URL` | `https://crm.adrine.in` |
| `APP_SECRET` | `openssl rand -base64 32` (keep stable across restarts) |
| `PG_DATABASE_USER` | `postgres` |
| `PG_DATABASE_PASSWORD` | strong password |
| `STORAGE_TYPE` | `local` |

### Multi-workspace (one profile per client — Navayu, future hospitals)

| Variable | Value |
|----------|--------|
| `IS_MULTIWORKSPACE_ENABLED` | `true` |
| `DEFAULT_SUBDOMAIN` | `app` |
| `IS_WORKSPACE_CREATION_LIMITED_TO_SERVER_ADMINS` | `true` (recommended) |

**DNS (required for multi-workspace):**

| Host | Type | Value |
|------|------|--------|
| `crm` | A | `187.127.129.209` |
| `*.crm` | A | `187.127.129.209` |

### Single-workspace shortcut (Navayu only, fastest first test)

Skip multi-workspace env vars. Open `https://crm.adrine.in`, create one workspace named Navayu.  
Temporarily remove `"workspaceSubdomain": "navayu"` from `gurgaon-pack.json` so HMS embeds `https://crm.adrine.in` directly.

---

## Step 2 — We connect in Coolify (after your deploy is Running)

### A. Domain on Twenty server container

- Service → **twenty-server** (or main app service) → **Domains**
- Add: `https://crm.adrine.in:3000`
- Enable HTTPS (Let’s Encrypt)

If multi-workspace: Coolify/Traefik must also route `*.crm.adrine.in` (wildcard cert or DNS challenge).

### B. iframe CSP (HMS embed)

Twenty blocks iframes unless the proxy adds `frame-ancestors`.

On **twenty-server** → proxy labels / custom headers:

```
Content-Security-Policy: frame-ancestors 'self' https://hms.adrine.in https://book.adrine.in https://*.vercel.app;
```

Verify:

```powershell
curl.exe -skI --resolve crm.adrine.in:443:187.127.129.209 https://crm.adrine.in/ | findstr /i content-security-policy
```

### C. Create Navayu workspace (multi-workspace)

1. Open `https://app.crm.adrine.in` (or `https://crm.adrine.in` in single mode)
2. Create workspace **Navayu** with subdomain **`navayu`**
3. Admin user for Navayu CRM team
4. **Settings → API & Webhooks** → create API key (for lead sync)

### D. domain-api (lead sync into Navayu workspace)

Coolify app **adrine-domain** (`fxq9vh2765921yv0y6gvqs2z`):

```env
TWENTY_CRM_URL=https://navayu.crm.adrine.in
TWENTY_API_KEY=<Navayu workspace API key>
```

Single-workspace test: use `TWENTY_CRM_URL=https://crm.adrine.in` instead.

Redeploy domain-api.

### E. Hospital OS (Navayu tenant embed)

Already in Gurgaon pack:

```json
"twentyCrm": {
  "enabled": true,
  "baseUrl": "https://crm.adrine.in",
  "workspaceSubdomain": "navayu",
  "embedMode": true,
  "fullApp": true
}
```

HMS resolves embed URL → `https://navayu.crm.adrine.in/`

Coolify **hospital-os** build env (fallback when pack not loaded):

```env
VITE_TWENTY_CRM_URL=https://crm.adrine.in
```

Redeploy hospital-os after Twenty is live.

---

## Step 3 — Smoke test

| Check | Expected |
|--------|----------|
| `https://crm.adrine.in` | Twenty loads (app hub or workspace) |
| `https://navayu.crm.adrine.in` | Navayu workspace login (multi-workspace) |
| `https://hms.adrine.in` → CRM role → **CRM** tab | Full Twenty iframe |
| Navayu patient registration | Person + opportunity in Navayu Twenty (if API key set) |

---

## When you finish Step 1

Reply with:

1. Coolify service name / UUID for the new Twenty stack
2. Whether you used **single** or **multi-workspace**
3. Whether `https://crm.adrine.in` returns **200** (not 503)

Then we complete Steps 2A–2E in Coolify (domain, CSP, domain-api, hospital-os redeploy).
