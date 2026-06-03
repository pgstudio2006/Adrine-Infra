# patient-app — Coolify UI steps (copy-paste)

**Goal:** public Navayu booking at `https://book.adrine.in`  
**Coolify:** http://187.127.129.209:8000  
**Project:** My first project → **production**  
**Repo:** `pgstudio2006/Adrine-Infra` @ `master`

**Prerequisites:** `adrine-kernel` and `adrine-domain` running; DNS `book.adrine.in` → Coolify server.

---

## 1. Create app

1. **+ Add Resource** → **Private Repository (GitHub App)**
2. Click GitHub App card: **`lucky-llama-evx5km2ml1nobo1d0l`** (headless UI may not advance — click manually)
3. Repository: **`pgstudio2006/Adrine-Infra`**
4. Branch: **`master`**

| Field | Value |
|-------|--------|
| Name | `adrine-patient-app` |
| Build Pack | **Dockerfile** |
| Dockerfile location | `/apps/patient-app/Dockerfile` |
| Base Directory | `/` (repo root — required) |
| Port (expose) | `3000` |
| Ports mappings | **leave empty** (Traefik only — do not bind `3000:3000` on host) |
| Domain | `https://book.adrine.in` |

---

## 2. Build-time environment (Dockerfile ARGs)

Coolify → **Environment Variables** → enable **Build-time** for each:

```env
NEXT_PUBLIC_PLATFORM_RUNTIME=true
NEXT_PUBLIC_KERNEL_API_URL=https://kernel.adrine.in
NEXT_PUBLIC_DOMAIN_API_URL=https://domain.adrine.in
NEXT_PUBLIC_DEV_TENANT_ID=tenant_navayu
```

These are baked into the Next.js bundle at build. Changing them requires **Redeploy** (rebuild).

---

## 3. Runtime environment

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

No database or Redis on this app.

---

## 4. CORS on kernel + domain (required)

Patient app calls kernel/domain from the browser. Both APIs must allow `https://book.adrine.in`.

On **`adrine-kernel`** and **`adrine-domain`** → Environment → set or extend:

```env
CORS_ORIGINS=https://hms.adrine.in,https://book.adrine.in
```

Without this, booking pages load but API calls fail in the browser (no `Access-Control-Allow-Origin`).

Kernel is already configured this way in production; update domain-api when it is deployed.

---

## 5. Deploy

1. **Save** all settings
2. **Deploy** → wait for green / running
3. Open **Logs** if build fails — confirm build context is repo root (not `apps/patient-app`)

---

## 6. Smoke test

| Check | Expected |
|-------|----------|
| `https://book.adrine.in` | 200 — patient app home |
| `https://book.adrine.in/book/navayu` | Booking UI loads |
| Browser devtools → Network | Calls to `kernel.adrine.in` / `domain.adrine.in` succeed (not CORS-blocked) |

If domain-api is still down, booking may show an API error banner — that is expected until `adrine-domain` is healthy.

---

## Reference

- Deploy template: [deploy/coolify/patient-app.md](../deploy/coolify/patient-app.md)
- Env example: [deploy/coolify/patient-app.env.example](../deploy/coolify/patient-app.env.example)
- Local Docker verify:

```powershell
cd "C:\Users\Parthrajsinh Gohil\Desktop\Adrine Cloud Infra"
docker build -f apps/patient-app/Dockerfile -t adrine-patient-app:test .
```

Build verified 2026-06-04 (~3 min on agent PC).
