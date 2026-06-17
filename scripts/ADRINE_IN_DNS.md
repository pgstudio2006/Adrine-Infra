# adrine.in DNS → VPS (Navayu / Adrine production)

**VPS IP:** `187.127.129.209`  
**Do not use** `navayuhealth.in` for this deploy — only **adrine.in** subdomains below.

Add these **A records** at your DNS provider (Hostinger, Cloudflare, etc.):

| Host / name | Type | Value | Coolify app |
|-------------|------|-------|-------------|
| `kernel` | A | `187.127.129.209` | kernel-api |
| `domain` | A | `187.127.129.209` | domain-api |
| `hms` | A | `187.127.129.209` | Hospital OS (staff) |
| `book` | A | `187.127.129.209` | Patient app + `/book/navayu` |
| `crm` | A | `187.127.129.209` | Twenty CRM (embedded in Hospital OS `/crm`) |
| `*.crm` | A | `187.127.129.209` | Twenty client workspaces (e.g. `navayu.crm.adrine.in`) — only if multi-workspace |

Optional:

| Host | Type | Value | Use |
|------|------|-------|-----|
| `@` | A | `187.127.129.209` | Marketing redirect later |
| `www` | CNAME | `adrine.in` | Same |

**TTL:** 300 (5 min) for first deploy, then 3600.

**Cloudflare:** If proxied (orange cloud), Coolify still issues SSL via Let's Encrypt on the VPS; ensure **SSL/TLS → Full** and WebSockets enabled.

## URLs after DNS + Coolify SSL

| Service | URL |
|---------|-----|
| Kernel API | https://kernel.adrine.in |
| Domain API | https://domain.adrine.in |
| Hospital OS (Navayu staff) | https://hms.adrine.in |
| Online booking | https://book.adrine.in/book/navayu |
| Twenty CRM (platform) | https://crm.adrine.in |
| Navayu Twenty workspace | https://navayu.crm.adrine.in (multi-workspace) |

**Until DNS propagates**, use IP: `http://187.127.129.209:3001` (kernel), `:3002`, `:8080`, `:3000`.

## Coolify env (copy after apps exist)

```env
CORS_ORIGINS=https://hms.adrine.in,https://book.adrine.in
VITE_KERNEL_API_URL=https://kernel.adrine.in
VITE_DOMAIN_API_URL=https://domain.adrine.in
VITE_PATIENT_APP_URL=https://book.adrine.in
VITE_TWENTY_CRM_URL=https://crm.adrine.in
NEXT_PUBLIC_KERNEL_API_URL=https://kernel.adrine.in
NEXT_PUBLIC_DOMAIN_API_URL=https://domain.adrine.in
```

Login (tenant users, not domain): `reception@navayuhealth.in` / `Navayu@2026`
