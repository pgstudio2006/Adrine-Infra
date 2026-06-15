# Twenty CRM — Adrine / Navayu integration

[Twenty](https://github.com/twentyhq/twenty) is embedded as the **complete CRM product** — not a hospital-limited subset. Users get the full Twenty workspace: people, companies, opportunities, tasks, notes, workflows, email, calendar, settings, API keys, webhooks, and every other Twenty feature.

## Quick start (local)

```bash
cd deploy/twenty
cp .env.example .env
# Edit APP_SECRET (openssl rand -base64 32) and SERVER_URL
docker compose up -d
```

Open http://localhost:3000 → create workspace → **Settings → API & Webhooks** → generate API key.

## Hospital OS (full-app embed)

`apps/hospital-os/.env`:

```env
VITE_TWENTY_CRM_URL=http://localhost:3000
```

Or per-tenant in branch pack (`integrations.twentyCrm.fullApp: true`) — see `clients/navayu/packs/gurgaon-pack.json`.

When Twenty is enabled:

- Nav shows a single **CRM** tab (hospital sub-tabs like Leads / Lifecycle are hidden).
- `/crm` loads the **entire Twenty app** in a full-height iframe.
- All other `/crm/*` URLs still work and show the same full Twenty workspace.
- Legacy Hospital OS CRM UI is used only when Twenty is not configured.

## domain-api (lead sync)

Navayu registration and manual leads still sync into Twenty:

```env
TWENTY_CRM_URL=http://localhost:3000
TWENTY_API_KEY=your_api_key_from_twenty_settings
```

Creates a **person** + **opportunity** in Twenty; users manage the full lifecycle inside Twenty.

## iframe embedding (required)

Twenty must allow Hospital OS as a frame ancestor. On your reverse proxy in front of Twenty:

```nginx
add_header Content-Security-Policy "frame-ancestors 'self' http://localhost:3100 https://adrine-hospital-os.vercel.app https://hms.adrine.in" always;
```

Without this header, the embed shows a blank frame.

## Navayu

- Gurgaon: `crm_manager` + counsellor `/crm` access → full Twenty CRM.
- Registration → `maybeCreateNavayuCrmLead` → domain-api → Twenty (when API key set).
- Counsellor desk (`/billing-dept/counselling`) unchanged; CRM tab opens full Twenty.
