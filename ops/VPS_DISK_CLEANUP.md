# VPS disk cleanup (Hostinger + Coolify)

**Server:** `187.127.129.209` · **Coolify:** http://187.127.129.209:8000

## What fills the disk

| Source | Typical size |
|--------|----------------|
| Old Docker **images** (each deploy) | 2–5 GB per app |
| Docker **build cache** | 10–40+ GB |
| Stopped build containers | small |
| Postgres/Redis **volumes** | keep — do not prune volumes |

Repeated Coolify builds of kernel, domain, hospital-os, patient-app are the main cause — not Git source code.

---

## Option A — Coolify UI (recommended)

1. Open: http://187.127.129.209:8000/server/gsk4hshqgd09oemlj9z9d6n5/docker-cleanup
2. Leave **Delete Unused Volumes** and **Delete Unused Networks** **OFF** (protects Postgres).
3. Click **Trigger Manual Cleanup** → **Trigger Docker Cleanup**.
4. Enter your Coolify login password if asked.
5. Wait for **Recent executions** to show success.

Scheduled cleanup is already set (`0 0 * * *` = daily midnight).

---

## Option B — Hostinger browser terminal (if Coolify stuck)

hPanel → VPS → **Browser terminal**, then:

```bash
df -h /
docker system df

# SAFE — does not remove named volumes used by Postgres/Redis
docker builder prune -af
docker image prune -af
docker container prune -f

df -h /
docker system df
```

**Never run** `docker volume prune` or `docker system prune -a --volumes` on production unless you have a verified backup.

---

## Option C — From your PC (API token)

```powershell
$env:COOLIFY_WRITE_TOKEN = "your-write-token"
.\scripts\coolify-docker-cleanup.ps1
```

Token: http://187.127.129.209:8000/security/api-tokens (needs **write** scope).

---

## Your Windows PC (local dev)

```powershell
docker builder prune -af
docker image prune -af
```

Frees ~20–40 GB from local test builds (`adrine-kernel-test`, `adrine-patient-app:test`, etc.).

---

## After cleanup

Redeploy only if a service shows **Exited** in Coolify. Postgres data survives when volumes were not deleted.

---

## Prevention (so 62% does not come back)

Do these **once** in Coolify → Server → **Docker Cleanup**:

| Setting | Recommended | Why |
|---------|-------------|-----|
| **Docker cleanup frequency** | `0 4 * * *` (daily 04:00 UTC) or `0 4,16 * * *` (twice daily) | Runs before staff hours + after heavy deploy days |
| **Force Docker Cleanup** | ON | Prunes images + build cache |
| **Delete Unused Volumes** | **OFF** | Protects Postgres/Redis |
| **Delete Unused Networks** | OFF | Safer for Coolify networking |
| **Disable Application Image Retention** | **ON** | Stops keeping every old deploy tag (`:903e977`, `:67f9a61`, …) |

**Server → Advanced** (http://187.127.129.209:8000/server/gsk4hshqgd09oemlj9z9d6n5/advanced):

| Field | Set to |
|-------|--------|
| Server disk usage notification threshold | **70%** (was 80) |
| Number of concurrent builds | **1** (was 2 — stops two huge builds filling disk at once) |
| Disk usage check frequency | `0 */6 * * *` (every 6 hours) optional |

Click **Save** on that page.

Enable **Notifications** in Coolify (email/Discord) so you get alerted at 70% — disk check alone does not auto-prune; scheduled cleanup does.

### Deploy habits (biggest lever)

- **Do not** redeploy all 3 apps (kernel + domain + hospital-os) for every small commit — deploy only what changed.
- Avoid **Rebuild without cache** unless debugging a Docker issue.
- While iterating, deploy **one** service per push, not three parallel builds.
- **patient-app** builds are large — deploy only when booking UI changed.

### Weekly 30-second check

```bash
df -h / | tail -1
docker system df
```

If **Images + Build Cache** > 15 GB combined, run **Trigger Manual Cleanup** in Coolify.

### If disk hits ~50% again

Same as Option A above — manual cleanup takes ~2 minutes, no data loss when volumes stay OFF.
