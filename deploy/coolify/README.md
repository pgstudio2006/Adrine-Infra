# Coolify deploy templates — Navayu / Adrine Lite

Reference for self-hosted PaaS on Hostinger KVM 4. **Authoritative guide:** [docs/DEPLOYMENT_HOSTINGER_COOLIFY.md](../../docs/DEPLOYMENT_HOSTINGER_COOLIFY.md)

## Recommended Coolify apps (same Git repo)

| # | App name | Type | Dockerfile / build | Domain |
|---|----------|------|-------------------|--------|
| 1 | adrine-kernel | Docker | `services/kernel-api/Dockerfile` | `kernel.*` |
| 2 | adrine-domain | Docker | `services/domain-api/Dockerfile` | `domain.*` |
| 3 | hospital-os | Static / Docker | Build `apps/hospital-os/dist` or `apps/hospital-os/Dockerfile` | `hms.*` |
| 4 | patient-app | Nixpacks / Docker | `apps/patient-app` Next.js build | `patient.*` |

**Managed resources (Coolify UI):** PostgreSQL 16, Redis 7 — not in application compose unless you prefer single-file deploy.

## docker-compose alternative

For all-in-one VPS testing (not required when using Coolify app-per-service):

```bash
docker compose -f deploy/docker-compose.prod.yml up -d
```

Set env from `.env.production.example` first.

## Deploy order

1. Postgres + Redis
2. Run Prisma migrations (kernel + domain)
3. Deploy kernel-api + domain-api
4. `pnpm provision:navayu` against production DB
5. Deploy Hospital OS (+ optional Patient app)
6. Follow [scripts/deploy-navayu-checklist.md](../../scripts/deploy-navayu-checklist.md)

## Traefik routing (simplest)

- `kernel.yourdomain.com` → kernel-api:3001
- `domain.yourdomain.com` → domain-api:3002
- `hms.yourdomain.com` → static Hospital OS
- `patient.yourdomain.com` → Patient app

Hospital OS env must point `VITE_KERNEL_API_URL` and `VITE_DOMAIN_API_URL` to these public URLs.
