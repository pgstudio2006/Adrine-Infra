# Collaborator setup — why "Failed to fetch" on localhost

## What you see

Patient app at **http://localhost:3101** loads, but sign-in shows **Failed to fetch**.

## Why

`localhost` on **your PC** only runs the **patient UI**. Sign-in with `NEXT_PUBLIC_PLATFORM_RUNTIME=true` calls:

| Service | Default URL | Must be running on **your** machine |
|---------|-------------|-------------------------------------|
| kernel-api | `http://localhost:3001` | Yes — `/auth/dev-login` |
| domain-api | `http://localhost:3002` | Yes — `/patients`, appointments, etc. |

If your teammate did not start Postgres + kernel + domain, the browser cannot connect → **Failed to fetch**.

The app does **not** use your lead developer’s APIs over the network unless you point env vars to their **staging URLs**.

---

## Fix A — UI demo only (fastest, no backend)

Create `.env.local`:

```env
NEXT_PUBLIC_PLATFORM_RUNTIME=false
```

Restart: `pnpm dev`

Sign-in works offline (demo session). Lists may be empty — that is expected.

---

## Fix B — Full local stack (real data)

1. Clone **Adrine-Infra** (separate repo): https://github.com/pgstudio2006/Adrine-Infra  
2. From repo root:

   ```bash
   pnpm install
   docker compose up -d postgres redis
   ```

3. Start APIs (two terminals):

   ```bash
   pnpm --filter @adrine/kernel-api dev
   pnpm --filter @adrine/domain-api dev
   ```

4. In **Adrine-Patient-App**, `.env.local`:

   ```env
   NEXT_PUBLIC_KERNEL_API_URL=http://localhost:3001
   NEXT_PUBLIC_DOMAIN_API_URL=http://localhost:3002
   NEXT_PUBLIC_DEV_TENANT_ID=tenant_dev
   NEXT_PUBLIC_PLATFORM_RUNTIME=true
   ```

5. `pnpm dev` → http://localhost:3101

---

## Fix C — Shared staging APIs (team uses same backend)

When your team has **deployed** kernel + domain (Railway, Render, etc.), use those URLs in `.env.local`:

```env
NEXT_PUBLIC_KERNEL_API_URL=https://your-kernel-staging.example.com
NEXT_PUBLIC_DOMAIN_API_URL=https://your-domain-staging.example.com
NEXT_PUBLIC_DEV_TENANT_ID=tenant_dev
NEXT_PUBLIC_PLATFORM_RUNTIME=true
```

Ask your lead for the exact URLs. APIs must allow CORS for `http://localhost:3101`.

---

## Checklist

- [ ] `.env.local` exists (copy from `.env.example`)
- [ ] Either `PLATFORM_RUNTIME=false` **or** both APIs running / reachable
- [ ] Restart `pnpm dev` after changing env
- [ ] Browser DevTools → Network: failed request should show which host (3001 vs wrong URL)
