# Patient app (monorepo copy)

The **standalone repository** for company team access:

**https://github.com/pgstudio2006/Adrine-Patient-App**

Develop there if your team only needs the patient mobile app. This folder stays in Adrine-Infra for full-stack local dev (`pnpm dev` from repo root).

## Local dev

```bash
pnpm --filter @adrine/patient-app dev
```

Runs at **http://localhost:3101** (see root `README.md`).

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_PLATFORM_RUNTIME` / API URLs as needed.

## Routes

| Route | Purpose |
|-------|---------|
| `/login` | Patient sign-in |
| `/dashboard` | Home after sign-in |
| `/appointments` | Upcoming visits |
| `/reports` | Lab orders |
| `/prescriptions` | Pharmacy fulfillments |
| `/intake?visitId=` | **Navayu UAT v0** — pre-visit intake (public; no sign-in). `visitId` from reception registration (appointment or UHID in demo mode). |

### Navayu intake (UAT)

1. In Hospital OS, complete registration and copy the **intake URL** from the success banner (or build manually).
2. Open on a tablet or phone, e.g. `http://localhost:3101/intake?visitId=APT-1`.
3. Submit chief complaint, VAS 0–10, and red flags. Answers are stored in **sessionStorage** until domain-api exposes `POST /opd/visits/:id/intake`.

Hospital OS uses `VITE_PATIENT_APP_URL` (default `http://localhost:3101`) when copying the link.
