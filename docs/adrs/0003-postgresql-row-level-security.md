# ADR 0003: PostgreSQL with Row-Level Security (RLS)

## Status

Accepted

## Context

Multi-tenant healthcare data must not rely on application checks alone. PHI isolation is a regulatory and safety requirement (DPDP, HIPAA-aligned controls).

## Decision

Use **Amazon RDS for PostgreSQL** as the operational store with:

- `tenant_id` (and hierarchy columns such as `branch_id` where applicable) on tenant-scoped tables.
- **PostgreSQL RLS** policies enforcing tenant isolation using session GUC **`app.tenant_id`**, set at the start of each request (or transaction) after authenticated tenant resolution.

Application ORM: **Prisma** for TypeScript services with migrations via `prisma migrate`. RLS session variables are set via raw SQL (`set_config`) in NestJS middleware/interceptors; Prisma schema documents RLS expectations. Full policy DDL is applied alongside migrations in production paths (expand–contract discipline).

## Consequences

- Positive: Defense in depth; misconfigured queries still hit database-enforced boundaries.
- Negative: Connection pooling must reset or set GUC per checkout; Prisma middleware must align with transaction boundaries. Documented in service READMEs.
