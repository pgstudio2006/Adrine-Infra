# Hospital OS (`@adrine/hospital-os`)

Operational runtime UI for hospitals on the Adrine platform (Vite + React 18 + shadcn).

Imported from the Hospital blueprint; **platform wiring is incremental** (auth → tenant config → domain APIs → events → metering).

Operational lifecycles and journey order live in `@adrine/hospital-operations`. Reception **Flow hub** (`/reception/flow`) shows the mandated OPD sequence.

## Run

From repository root:

```bash
pnpm install
pnpm --filter @adrine/hospital-os dev
```

Open http://localhost:3100

Use root `docker compose` for Postgres/Redis/Temporal and run `kernel-api` + `domain-api` when testing API integration.

## Environment

Copy `.env.example` to `.env.local` and set API URLs when connecting to infra services.

## Notes

- Default dev login remains mock role-based auth until `kernel-api` auth is integrated.
- Clinical/operational state lives in `src/stores/hospitalStore.tsx` until each flow is backed by `domain-api`.
- Use the monorepo root `docker-compose.yml` for data services; the local `docker-compose.yml` in this folder is legacy from the standalone blueprint.
