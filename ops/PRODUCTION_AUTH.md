# Hospital OS — production authentication

Hospital OS must not rely on mock role cards alone when `VITE_PLATFORM_RUNTIME=true` in a **production** build.

## Required environment

| Variable | Purpose |
|----------|---------|
| `VITE_PLATFORM_RUNTIME` | `true` to use domain-api / kernel-api as authoritative |
| `VITE_KERNEL_API_URL` | Kernel base URL (auth, tenant, branch, config) |
| `VITE_DOMAIN_API_URL` | Clinical runtime base URL |
| `VITE_DEV_TENANT_ID` | Dev/staging tenant until OIDC signup exists |

## Session shape

After login, `sessionStorage` holds `adrine_platform_session` with:

- `accessToken` — sent as `Authorization: Bearer`
- `tenantId` — sent as `x-tenant-id`
- `branchId` — sent as `x-branch-id` (required in production API calls)
- `role` / `userId` — sent as `x-actor-role` / `x-actor-id`

`platformHeaders()` throws in **production** if runtime is on but branch or bearer token is missing.

## Dev login (staging)

`POST {VITE_KERNEL_API_URL}/auth/dev-login` with role email `{role}@adrine.local` is enabled for local and staging builds. Production builds still use this endpoint until OIDC is wired; configure kernel CORS and tenant seeding.

## OIDC stub (future)

When the identity provider is ready, add to hospital-os env (no code change required in clients beyond AuthContext):

```env
# VITE_OIDC_ISSUER=https://login.example.com/realms/hospital
# VITE_OIDC_CLIENT_ID=hospital-os
# VITE_OIDC_REDIRECT_URI=https://os.example.com/callback
```

Flow: redirect to issuer → callback exchanges code at kernel-api → same `PlatformSession` shape as dev-login.

Until then, document staging tenants in kernel and enforce branch assignment on `/auth/dev-login` responses.

## Checklist before go-live

1. `VITE_KERNEL_API_URL` and `VITE_DOMAIN_API_URL` set in deployment env (not `.env` committed).
2. CORS allows the hospital-os origin on kernel-api and domain-api.
3. Smoke login returns non-empty `branchId` and `tenantId`.
4. `pnpm --filter hospital-os build` with `VITE_PLATFORM_RUNTIME=true` — login without kernel URL must fail closed in production.
