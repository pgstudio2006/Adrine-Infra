# Adrine Infra

Monorepo for the Adrine healthcare infrastructure platform (Hospital OS, APIs, control plane, IaC): kernel API, domain API, experience apps, AI gateway, workflow runtime, and IaC skeleton.

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io) 9+
- Docker (for local Postgres, Redis, Temporal)
- Go 1.22+ (optional, for `services/event-router`)
- Python 3.12+ (for `services/ai-gateway`)

## Quick start

```bash
pnpm install
docker compose up -d postgres redis temporal
# Set DATABASE_URL for both APIs (see docker-compose env hints)
cd services/kernel-api && pnpm prisma generate && cd ../..
pnpm build
```

Run services locally (separate terminals):

| Service | Port | Command |
|--------|------|---------|
| kernel-api | 3001 | `pnpm --filter @adrine/kernel-api dev` |
| domain-api | 3002 | `pnpm --filter @adrine/domain-api dev` |
| hospital-os (Vite) | 3100 | `pnpm --filter @adrine/hospital-os dev` |
| patient-app | 3101 | `pnpm --filter @adrine/patient-app dev` |
| control-plane | 3102 | `pnpm --filter @adrine/control-plane dev` |
| ai-gateway | 8000 | `cd services/ai-gateway && uv sync && uv run uvicorn app.main:app --reload --port 8000` |
| workflow-runtime | — | `pnpm --filter @adrine/workflow-runtime dev` (needs Temporal) |

Development tenant header: `x-tenant-id: tenant_dev` (non-production only).

## Documentation

- **[Current features & workflows](docs/CURRENT_FEATURES_AND_WORKFLOWS.md)** — what ships today, role map, end-to-end flows
- **[Deploy Hospital OS on Vercel](docs/DEPLOY_VERCEL.md)** — live UI hosting
- **[Role module plans](docs/ROLE_MODULES/README.md)** — per-role depth (Reception, Doctor, Nurse, …)

## Layout

- `apps/` — Hospital OS (Vite), patient app, control-plane (Next.js shells)
- `services/` — NestJS APIs, Temporal worker, FastAPI AI gateway, Go event router stub
- `packages/` — Shared libraries (`otel-bootstrap`, `tenant-context`, `api-contracts`)
- `infra/terraform/` — AWS module skeleton (VPC, RDS, Redis, S3, KMS, ECS)
- `docs/adrs/` — Architecture decision records
- `ops/slos/` — SLO and observability notes

## Compliance note

This repository is scaffolding only. Production PHI handling requires hardened deployment, key management, and jurisdictional review (DPDP, HIPAA, etc.).
