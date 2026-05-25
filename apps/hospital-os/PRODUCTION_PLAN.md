# Adrine Hospital SaaS - 48-Hour Production Sprint Plan

## Context
- **Goal**: Internal tool launch — functional, real data, not just a demo
- **Backend**: Fastest/modern with minimal latency (Next.js + PostgreSQL + Prisma)
- **SaaS Model**: Every feature & detail customizable per tenant (full customization engine)
- **Deployment**: Deferred — architecture-first approach

---

## Stack Decisions

| Layer | Choice | Why |
|-------|--------|-----|
| **Backend** | Next.js 15 (App Router) + Server Actions | Zero-overhead API, edge-ready, type-safe |
| **ORM** | Prisma | Type-safe, migrations, multi-tenancy support |
| **Database** | PostgreSQL | Robust, row-level security, great for hospital data |
| **Auth** | Better Auth / NextAuth v5 | Multi-provider, session management |
| **Real-time** | SSE (Server-Sent Events) | Simpler than WebSockets for internal tools |
| **State** | Zustand (keep existing) + React Query (optimistic updates) | Fast DX, caching |
| **File Storage** | S3-compatible (Cloudflare R2 or AWS S3) | Documents, reports, images |
| **Validation** | Zod (keep existing) | Shared between frontend & backend |
| **Search** | PostgreSQL `tsvector` / Prisma full-text | No separate search cluster needed |
| **Hosting** | Vercel (frontend) + Railway/Supabase (backend DB) | Fastest to deploy |

---

## 48-Hour Sprint Breakdown

---

### Phase 1: Architecture & Foundation (Hours 1-8)

#### 1.1 Database Schema Design
- [ ] Design Prisma schema with **multi-tenant architecture**:
  - `Organization` (hospital/clinic) as root tenant table
  - All data tables have `organizationId` foreign key
  - Row-level security at Prisma middleware level
- [ ] Core entities:
  - Users, Roles, Permissions (keep existing RBAC)
  - Organization settings (customization configs)
  - Patient, Appointment, Queue, Lab, Radiology, Prescription, Billing, Inventory, HR
  - Audit logs (who did what, when)
  - Custom fields (tenant-defined schema extensions)
- [ ] Run initial migration
- [ ] Seed data matching existing frontend mock data

#### 1.2 Project Scaffolding
- [ ] Add Next.js to existing project OR create a monorepo:
  - `apps/web` — existing React frontend
  - `apps/api` — Next.js API layer (can be same Next.js app serving both)
- [ ] Configure Prisma in the project
- [ ] Set up environment variables (`.env.example`)
- [ ] Configure path aliases consistency (`@/` across apps)

#### 1.3 Authentication System
- [ ] Replace mock `AuthContext` with real auth
- [ ] Organization (tenant) onboarding flow
- [ ] User registration + login
- [ ] Role assignment per user within organization
- [ ] Session management with secure HTTP-only cookies
- [ ] Password reset flow

#### 1.4 Backend Infrastructure
- [ ] API route structure (grouped by domain)
- [ ] Global error handling middleware
- [ ] Request validation (Zod shared schemas)
- [ ] Tenant isolation middleware (extract org from session)
- [ ] Audit logging middleware

---

### Phase 2: Backend & API Layer (Hours 9-24)

Build API routes for every module. Use **Server Actions** + **REST API** hybrid.

#### 2.1 Core Modules (Priority Order)

| Priority | Module | API Tasks |
|----------|--------|-----------|
| 1 | Auth + Org | Login, register, session, org CRUD, user CRUD |
| 2 | Patients | CRUD, search, filters, pagination |
| 3 | Appointments/Queue | Create, update status, queue management |
| 4 | Billing | Invoice generation, payments, GST reports |
| 5 | Lab | Orders, results, report generation |
| 6 | Pharmacy | Prescriptions, inventory, stock alerts |
| 7 | Radiology | Orders, imaging reports |
| 8 | Emergency | Triage, case management |
| 9 | HR | Staff profiles, scheduling, leave |
| 10 | Inventory | Stock, procurement, alerts |
| 11 | Reports/Analytics | Dashboard aggregations, charts data |
| 12 | CRM | Leads, campaigns, feedback |

#### 2.2 For Each Module:
- [ ] Database schema (Prisma model)
- [ ] CRUD Server Actions
- [ ] REST API endpoints (for flexibility)
- [ ] Input validation (Zod)
- [ ] Permission checks (role-based)
- [ ] Optimistic update patterns
- [ ] Audit log entries
- [ ] Pagination & search

#### 2.3 Real-time Features
- [ ] SSE for live queue updates
- [ ] Real-time notifications (in-app bell icon)
- [ ] Live dashboard refresh

#### 2.4 File Handling
- [ ] Document upload (patient records, lab reports)
- [ ] File storage service (S3/R2)
- [ ] Secure download links

---

### Phase 3: Connect Frontend to Real Backend (Hours 25-36)

#### 3.1 API Integration Layer
- [ ] Create `api/` service layer (replace mock data)
- [ ] Configure React Query with backend URLs
- [ ] Replace all mock stores with real API calls
- [ ] Implement optimistic updates for critical flows:
  - Patient registration
  - Queue check-in
  - Lab order submission
  - Billing payments

#### 3.2 Page-by-Page Migration
- [ ] **Login/Auth pages** — connect to real auth
- [ ] **Dashboard** — real data from API
- [ ] **Reception** — patient registration, queue
- [ ] **Doctor** — patient profiles, orders
- [ ] **Billing** — real invoices, payments
- [ ] **Lab/Radiology/Pharmacy** — worklists
- [ ] **Admin pages** — settings, staff management
- [ ] **Reports** — chart data from API

#### 3.3 Error Handling
- [ ] Global error boundaries
- [ ] API error toast notifications
- [ ] Offline detection & retry logic
- [ ] Loading skeletons (already have shadcn skeletons)

---

### Phase 4: Customization Engine (Hours 37-44)

This is the **core differentiator** — making everything customizable.

#### 4.1 Organization Settings System
- [ ] `OrganizationSettings` table:
  ```json
  {
    "orgId": "uuid",
    "theme": { "primaryColor": "#...", "logo": "url", "name": "..." },
    "features": { "module_xyz": true, "module_abc": false },
    "customFields": [{ "name": "Blood Type", "type": "select", "options": [...] }],
    "workflows": { "patientRegistration": ["step1", "step2"] },
    "branding": { "favicon": "url", "emailFooter": "..." }
  }
  ```
- [ ] Settings UI in Admin panel
- [ ] Theme switcher (color, logo, name)
- [ ] Feature toggles per module

#### 4.2 Dynamic Forms (Custom Fields)
- [ ] Generic form renderer that reads `customFields` schema
- [ ] Patient, Appointment, and other entities support custom fields
- [ ] UI for admins to add/remove custom fields

#### 4.3 Workflow Customization
- [ ] Define workflow steps per module
- [ ] Reorder/enable/disable steps
- [ ] Required vs optional fields per org

#### 4.4 Role/Permission Customization
- [ ] Admin can create custom roles
- [ ] Assign specific permissions per role
- [ ] UI: Role & Permissions page in Admin

#### 4.5 Branding Per Organization
- [ ] Logo upload + display in sidebar/login
- [ ] Custom favicon
- [ ] Email templates with org branding
- [ ] White-label ready (remove "Adrine" branding)

---

### Phase 5: Polish, Security & Deploy (Hours 45-48)

#### 5.1 Performance
- [ ] React Query caching strategy
- [ ] Lazy loading for heavy pages
- [ ] Image optimization
- [ ] Bundle analysis + code splitting

#### 5.2 Security Hardening
- [ ] Input sanitization (XSS prevention)
- [ ] CSRF protection
- [ ] Rate limiting on API routes
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] Secure headers (CSP, HSTS)
- [ ] Environment variable audit (no secrets in code)
- [ ] Row-level tenant isolation verification

#### 5.3 Testing
- [ ] Critical path smoke tests (registration, patient flow, billing)
- [ ] API endpoint tests (at least CRUD for core modules)
- [ ] Tenant isolation test (ensure org A can't see org B data)

#### 5.4 Documentation
- [ ] API documentation (schema + examples)
- [ ] Deployment guide
- [ ] Environment variable list
- [ ] Onboarding guide for new organizations

#### 5.5 Deployment Prep
- [ ] Docker setup (if self-hosting later)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Database migrations script
- [ ] Health check endpoints
- [ ] Monitoring setup (error tracking with Sentry)

---

## Customization Engine Details

Everything should be configurable via `OrganizationSettings`:

| Category | What Can Be Customized |
|----------|------------------------|
| **Branding** | Logo, name, favicon, colors, theme |
| **Features** | Enable/disable entire modules |
| **Fields** | Add custom fields to any entity |
| **Workflows** | Steps in patient registration, billing flow, etc. |
| **Roles** | Create custom roles, assign permissions |
| **Labels** | Rename fields, change UI labels per org |
| **Notifications** | Email/SMS templates, triggers |
| **Integrations** | Third-party API keys (SMS, email, etc.) |
| **Reports** | Custom KPIs, dashboard widgets |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Scope creep in 48h | Stick to priority order. Cut lowest-priority modules if needed |
| Multi-tenancy complexity | Use Prisma middleware for automatic tenant scoping |
| Customization engine takes too long | Build a JSON-based settings system (fast) — skip dynamic DB schema changes |
| Auth bugs | Use battle-tested NextAuth, don't roll your own |
| Performance issues | React Query handles caching. Add DB indexes for common queries |
| Data migration | Use Prisma migrations. Keep seed data consistent |

---

## Team Allocation (if multiple people)

| Person | Focus |
|--------|-------|
| **Dev 1** | Backend + Auth + DB schema |
| **Dev 2** | Frontend API integration + UI fixes |
| **Dev 3** | Customization engine + settings UI |
| **Dev 4** | Testing + DevOps + deployment |

If solo: **Backend first → Frontend integration → Customization → Deploy**

---

## Quick Wins (Do These First)

1. **Add Next.js to existing project** — single command
2. **Prisma schema from mock data** — auto-generate models from `hospitalStore.tsx` interfaces
3. **Replace auth with NextAuth** — drop-in with minimal config
4. **Server Actions for CRUD** — minimal boilerplate
5. **Tenant middleware** — 20 lines of Prisma middleware

---

## Post-48h Roadmap (What Comes Next)

- [ ] SMS/Email integrations (OTP, notifications)
- [ ] Mobile app (React Native or PWA)
- [ ] Advanced analytics / BI dashboard
- [ ] API for third-party integrations (HL7, FHIR)
- [ ] Payment gateway integration
- [ ] Print layouts (prescriptions, reports, bills)
- [ ] Audit trail UI for compliance
- [ ] Data export (GDPR compliance)
- [ ] SSO / SAML for enterprise clients
