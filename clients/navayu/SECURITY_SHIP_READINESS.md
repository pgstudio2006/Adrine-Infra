# Navayu — Security ship readiness

Pre-client deployment checklist for `hms.adrine.in` (Navayu Health, Gurgaon).

## Ship blockers addressed (this release)

| Risk | Fix |
|------|-----|
| domain-api accepted `x-actor-role` without JWT | Global `JwtAuthGuard` + JWT strategy; actor role bound from token |
| RBAC default-allow on unmapped routes | `DomainRbacGuard` default-deny; PHI GET paths require matrix match |
| Client-exposed OpenRouter key | `POST /ai/scribe` on domain-api; removed `VITE_OPENROUTER_API_KEY` |
| Mock role-picker login in production | Blocked in `AuthContext`; prod routes require platform session |
| Weak boot config | `assertProductionSecurityEnv()` on kernel-api + domain-api startup |
| Missing security headers | Helmet on APIs; nginx CSP / X-Frame-Options on hospital-os |
| Public Swagger in prod | Disabled unless `ENABLE_SWAGGER=true` |

## Required Coolify / production env

### kernel-api + domain-api (shared)

```
NODE_ENV=production
JWT_SECRET=<random 32+ chars — rotate from any dev default>
CORS_ORIGINS=https://hms.adrine.in
ALLOW_DEV_LOGIN=false
AUTH_MODE=enabled
DOMAIN_RBAC_ENFORCE=true
DATABASE_RLS_ENABLED=true
```

Do **not** set `JWT_DEV_SECRET`, `DOMAIN_JWT_ENFORCE=false`, or `KERNEL_JWT_ENFORCE=false` in production.

### domain-api only

```
OPENROUTER_API_KEY=<server-side only — rotate if ever exposed in chat>
OPENROUTER_MODEL=deepseek/deepseek-v4-flash
OPENROUTER_HTTP_REFERER=https://hms.adrine.in
```

### hospital-os build args

```
VITE_KERNEL_API_URL=https://kernel.adrine.in
VITE_DOMAIN_API_URL=https://domain.adrine.in
VITE_PLATFORM_RUNTIME=true
```

Never bake API keys into `VITE_*` variables.

## Deploy order

1. Set env vars above on kernel-api and domain-api.
2. Redeploy **kernel-api** (global JWT guard).
3. Redeploy **domain-api** (JWT + RBAC + AI scribe).
4. Rebuild **hospital-os** (auth gate + scribe proxy).
5. Smoke test: login → reception walk-in → junior handoff → senior queue.

## Post-deploy smoke tests

- [ ] Unauthenticated `GET /patients` → 401
- [ ] Reception JWT + `GET /opd/queue` → 200
- [ ] Doctor JWT + `POST /billing/sync/charge` → not 403 (may 400 if visit open)
- [ ] Role header spoof (`x-actor-role: admin` with reception JWT) → 403 on admin routes
- [ ] AI scribe from senior consult → works without browser network call to openrouter.ai
- [ ] Mock role picker on login page → blocked in prod build

## Known follow-ups (not ship blockers)

- httpOnly cookie sessions (today: Bearer in sessionStorage)
- Redis-backed rate limits (today: in-memory per replica)
- Enterprise OIDC / ABHA replacing password login
- Pen-test on tenant IDOR and session revoke flows

See also `ops/SECURITY_CHECKLIST.md` for full platform hardening matrix.
