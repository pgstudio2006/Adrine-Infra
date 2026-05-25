# Security checklist — Hospital platform (pre-production / pen-test prep)

Use before external penetration testing or production go-live. Items map to Program 7 platform hardening gaps.

## Authentication & sessions

- [ ] Production JWT secret ≥ 256 bits; not committed to git
- [ ] `AUTH_MODE` not `disabled` in production
- [ ] JWT includes `sessionId`; revoked sessions rejected (`UserSession.revokedAt`)
- [ ] Hospital OS calls `GET /auth/me` on load; expired tokens cleared
- [ ] MFA enrollment API tested (`POST /auth/mfa/enroll`) if required for admin roles
- [ ] Session revoke tested (`POST /auth/sessions/revoke`)
- [ ] Plan documented for enterprise OIDC / ABHA (replacing dev-login)

## Authorization (RBAC)

- [ ] `DOMAIN_RBAC_ENFORCE=true` on domain-api in production
- [ ] Mutating requests without `x-actor-role` return 403
- [ ] Role matrix reviewed (`packages/hospital-operations/src/governance/domain-rbac.ts`)
- [ ] Hospital OS `ProtectedRoute` + module entitlements aligned with subscription
- [ ] Admin-only routes (`/migration`, platform admin) limited to `admin` role

## Multi-tenancy & data isolation

- [ ] Every API request carries `x-tenant-id` (middleware enforced in production)
- [ ] `DATABASE_RLS_ENABLED=true`; RLS policies applied on tenant-scoped tables
- [ ] Cross-tenant IDOR tests on patient, visit, invoice UUIDs
- [ ] Branch scoping: `x-branch-id` required on branch worklists

## Rate limiting & abuse

- [ ] `TenantRateLimitGuard` active on kernel (provisioning, global guard)
- [ ] `RATE_LIMIT_RPM` set per environment
- [ ] Signup uses `Idempotency-Key` header (duplicate signup returns cached response)
- [ ] API keys stored as SHA-256 hash only; raw key shown once at creation

## Integrations & webhooks

- [ ] Webhook payloads signed with HMAC-SHA256 (`IntegrationService.signPayload`)
- [ ] Webhook secrets rotatable; inactive subscriptions cannot deliver
- [ ] FHIR endpoints return stub metadata only until certified
- [ ] Outbound webhook HTTP worker behind VPC (not yet production — track as gap)

## Notifications & PHI

- [ ] PHI-safe logging interceptor on kernel auth routes
- [ ] Notification templates do not embed full clinical notes in SMS
- [ ] Outbox retry capped (`MAX_ATTEMPTS`); dead-letter reviewed
- [ ] On-call recipient mapping per tenant (not hardcoded `ops-oncall@tenant.local` in prod)

## Observability & audit

- [ ] Audit log writes on sensitive kernel actions
- [ ] Platform event outbox depth monitored (`ScaleReadinessService.health`)
- [ ] No stack traces or DB URLs in client-facing error JSON

## Infrastructure (pen-test scope)

- [ ] TLS 1.2+ only on public endpoints
- [ ] Postgres not publicly reachable; security group least privilege
- [ ] Secrets in KMS/secret manager; not in `.env` in CI logs
- [ ] CORS allowlist matches hospital-os origin only
- [ ] Dependency scan (npm/pnpm audit) on release branch

## Known open items (document for testers)

| Area | Risk | Mitigation timeline |
|------|------|---------------------|
| Dev role picker on hospital login | Medium in prod if left enabled | Disable UI; OIDC only |
| In-memory rate limit | Low at single replica | Redis limiter |
| Simulated webhook delivery | Low | HTTP worker + DLQ |
| Patient app | Out of scope this program | Separate hardening track |

## Pen-test focus scenarios

1. Tenant A token accessing Tenant B patient UUID on domain-api.
2. Reception role attempting `POST /lab/.../transition` with critical release bypass.
3. Replay of provisioning signup with same idempotency key.
4. JWT after session revoke — must fail on protected kernel routes.
5. Platform Admin hub — only admin role can open `/admin/platform` migration execute.

## Sign-off

| Reviewer | Date | Notes |
|----------|------|-------|
| Security lead | | |
| Engineering | | |
