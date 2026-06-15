# Twenty CRM — Adrine / Navayu integration

[Twenty](https://github.com/twentyhq/twenty) is the full CRM UI embedded in Hospital OS `/crm/*` routes and synced from Navayu registration leads.

## Quick start (local)

```bash
cd deploy/twenty
cp .env.example .env
# Edit APP_SECRET (openssl rand -base64 32) and SERVER_URL
docker compose up -d
```

Open http://localhost:3000 → create workspace → **Settings → API & Webhooks** → generate API key.

## Hospital OS (embed)

`apps/hospital-os/.env`:

```env
VITE_TWENTY_CRM_URL=http://localhost:3000
```

Or enable per-tenant in branch pack (`integrations.twentyCrm`) — see `clients/navayu/packs/gurgaon-pack.json`.

## domain-api (lead sync)

When a lead is created via `POST /crm/leads` (including Navayu `maybeCreateNavayuCrmLead`), domain-api mirrors to Twenty:

```env
TWENTY_CRM_URL=http://localhost:3000
TWENTY_API_KEY=your_api_key_from_twenty_settings
```

Sync is best-effort and never blocks Adrine lead creation.

## iframe embedding (required)

Twenty must allow Hospital OS as a frame ancestor. On your reverse proxy in front of Twenty:

```nginx
add_header Content-Security-Policy "frame-ancestors 'self' http://localhost:3100 https://adrine-hospital-os.vercel.app https://hms.adrine.in" always;
```

Adjust origins for your deployment. Without this header, the embed shows a blank frame.

## Route mapping

| Hospital OS | Twenty |
|-------------|--------|
| `/crm` | `/` |
| `/crm/leads` | `/objects/people` |
| `/crm/lifecycle` | `/objects/opportunities` |
| `/crm/campaigns` | `/workflows` |
| `/crm/drip-campaigns` | `/workflows` |
| `/crm/experience` | `/objects/notes` |
| `/crm/reports` | `/settings` |

## Navayu

- Gurgaon pack enables `integrations.twentyCrm` for `crm_manager` and counsellor cross-role `/crm` access.
- Registration → `maybeCreateNavayuCrmLead` → domain-api → Twenty person + opportunity (when API key set).
- Counsellor desk (`/billing-dept/counselling`) unchanged; CRM tabs open Twenty embed.
