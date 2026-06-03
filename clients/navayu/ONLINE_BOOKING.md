# Navayu Online Booking API (Wave 0)

Public appointment booking for **Navayu Spine & Joint Care** (`tenant_navayu`), embeddable on adrine.in / navayuhealth.in.

## Base URLs

| Service | Local | Purpose |
|---------|-------|---------|
| domain-api | `http://localhost:3002` | Slots + book appointments |
| kernel-api | `http://localhost:3001` | Branch list (optional UI helper) |

## Tenant slug

| Slug | tenantId |
|------|----------|
| `navayu` | `tenant_navayu` |

## Branches (`branchCode`)

| Code | Name |
|------|------|
| `gurgaon` | Gurgaon Center |
| `pataudi` | Pataudi Hospital |

Resolve branch IDs for staff login via kernel:

```http
GET /public/tenants/navayu/branches
GET /auth/branches?tenantId=tenant_navayu
```

---

## GET booking config (Form Engine / publicBookingConfig)

```http
GET /public/tenants/navayu/booking-config
```

(kernel-api) — branches, service types (MSK vs General OPD), patient field schema.

Fallback:

```http
GET /public/booking/navayu/config
```

(domain-api, same JSON from `clients/navayu/public-booking-config.json`)

---

## GET available slots

```http
GET /public/booking/navayu/slots?branch=gurgaon&date=2026-06-10
```

**Query**

| Param | Required | Description |
|-------|----------|-------------|
| `branch` | yes | `gurgaon` or `pataudi` |
| `date` | yes | `YYYY-MM-DD` |

**Response `200`**

```json
{
  "tenantId": "tenant_navayu",
  "branchCode": "gurgaon",
  "date": "2026-06-10",
  "slotMinutes": 30,
  "slots": [
    {
      "startAt": "2026-06-10T09:00:00.000Z",
      "endAt": "2026-06-10T09:30:00.000Z",
      "available": true
    }
  ]
}
```

Slots are generated **09:00–17:00 UTC** in 30-minute steps (v1 fixed schedule). Booked slots for the same branch prefix are excluded.

**Rate limit:** 30 requests / minute / client IP (in-memory stub).

---

## POST book appointment

```http
POST /public/booking/navayu/appointments
Content-Type: application/json
```

**Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `branchCode` | yes | string | `gurgaon` \| `pataudi` |
| `serviceType` | yes | string | e.g. `MSK Consultation` |
| `datetime` | yes | ISO-8601 | Slot start time |
| `patientName` | yes | string | Full name |
| `phone` | yes | string | Used as patient lookup key (stored in `mrn`) |
| `email` | no | string | Logged in booking event payload |

**Example**

```json
{
  "branchCode": "gurgaon",
  "serviceType": "MSK Consultation",
  "datetime": "2026-06-10T09:00:00.000Z",
  "patientName": "Rajesh Kumar",
  "phone": "+919876543210",
  "email": "rajesh@example.com"
}
```

**Response `201` / `200`**

```json
{
  "appointmentId": "clx…",
  "patientId": "clx…",
  "startAt": "2026-06-10T09:00:00.000Z",
  "endAt": "2026-06-10T09:30:00.000Z",
  "resourceLabel": "[gurgaon] MSK Consultation",
  "status": "scheduled"
}
```

**Errors**

| Status | Meaning |
|--------|---------|
| `400` | Invalid branch, date, or slot taken |
| `404` | Unknown tenant slug |
| `429` | Rate limit exceeded |

No authentication required. Tenant is resolved from URL slug; `x-tenant-id` is **not** required on these routes.

---

## Staff auth (hospital-os)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@navayuhealth.in",
  "password": "<from provisioning>",
  "tenantId": "tenant_navayu",
  "branchId": "<optional branch cuid>"
}
```

**Response**

```json
{
  "accessToken": "eyJ…",
  "user": {
    "sub": "…",
    "email": "admin@navayuhealth.in",
    "name": "Navayu Administrator",
    "role": "admin",
    "tenantId": "tenant_navayu",
    "branchId": "…"
  },
  "sessionId": "…"
}
```

`POST /auth/dev-login` remains available in **non-production** only (unless `ALLOW_DEV_LOGIN=true`).

Default provisioned password: env `NAVAYU_DEFAULT_PASSWORD` or per-user `password` in `users.json` (default fallback `Navayu@2026`).

---

## Patient clinical timeline

```http
GET /patients/:patientId/timeline
x-tenant-id: tenant_navayu
```

Also available at:

```http
GET /opd/visits/patient/:patientId/timeline
```

Returns visits, Navayu intake/exam milestones, and OPD transitions aggregated from visit metadata.

---

## Embed / frontend

Minimal patient-app route: `/book/navayu` (calls domain-api public booking).

Example fetch:

```javascript
const base = 'http://localhost:3002';
const slug = 'navayu';

const slots = await fetch(
  `${base}/public/booking/${slug}/slots?branch=gurgaon&date=2026-06-10`
).then((r) => r.json());

await fetch(`${base}/public/booking/${slug}/appointments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    branchCode: 'gurgaon',
    serviceType: 'MSK Consultation',
    datetime: slots.slots[0].startAt,
    patientName: 'Rajesh Kumar',
    phone: '+919876543210',
  }),
});
```

---

## Migrations required

### kernel-api (`adrine_kernel` / shared `adrine` DB)

```sql
ALTER TABLE "platform_users" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
```

Migration file: `services/kernel-api/prisma/migrations/20260603120000_platform_user_password/migration.sql`

After migrate, re-run provisioning to set password hashes:

```bash
NAVAYU_DEFAULT_PASSWORD='YourTempPassword' pnpm provision:navayu
```

### domain-api

No schema migration for Wave 0 public booking (uses existing `patients` + `appointments`).

---

## Environment

| Variable | Service | Purpose |
|----------|---------|---------|
| `NAVAYU_DEFAULT_PASSWORD` | provision script | Default temp password for all 12 users |
| `NAVAYU_DEFAULT_TENANT_ID` | kernel-api | Default tenant for `/auth/login` when omitted |
| `JWT_DEV_SECRET` | kernel-api | JWT signing secret |
| `ALLOW_DEV_LOGIN` | kernel-api | Set `true` to allow dev-login in production (not recommended) |
