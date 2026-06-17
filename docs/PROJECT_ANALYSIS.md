# Navayu Health — Complete Project Analysis

> **Project:** Adrine Cloud Infra — Hospital OS  
> **Application:** Navayu Health Hospital Operating System  
> **Architecture:** Multi-tenant, event-driven, microservices monorepo (Turborepo)  
> **Tech Stack:** React 18 + Vite + shadcn (Frontend), NestJS (Backend), PostgreSQL (Database), Temporal (Workflow Engine), Redis (Cache/Events), Docker (Containerization), Prisma (ORM), Vercel (Deployment)

---

## 1. SYSTEM ARCHITECTURE

### 1.1 High-Level Architecture

The system follows a **Backend-for-Frontend (BFF) + Microservices + Event-Driven** pattern:

```
┌──────────────────────────────────────────────────────────────┐
│                     HOSPITAL OS UI (React)                    │
│                 apps/hospital-os  (port 3100)                  │
│              apps/control-plane  (port 3000)                   │
│                    apps/patient-app  (port ?)                   │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS/REST
┌──────────────────────▼───────────────────────────────────────┐
│                 DOMAIN API (NestJS)                           │
│              services/domain-api  (port ?)                     │
│         - All domain logic: OPD, IPD, Billing, Lab, etc.      │
│         - JWT Auth + RBAC + RLS (Row-Level Security)           │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                 KERNEL API (NestJS)                           │
│              services/kernel-api  (port ?)                     │
│         - Platform concerns: Auth, Tenancy, Audit, Integrations │
│         - Subscription management, Module entitlements          │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  PostgreSQL  │ │  Redis   │ │   Temporal   │
│ (Per-tenant  │ │ (Events/ │ │  (Workflow   │
│   RLS)       │ │  Queue)  │ │   Engine)    │
└──────────────┘ └──────────┘ └──────────────┘
```

### 1.2 Monorepo Structure (Turborepo)

```
Adrine Cloud Infra/
├── apps/                          # Application layer
│   ├── hospital-os/               # Main Hospital OS (React + Vite)
│   ├── control-plane/             # Admin/Control Plane (Next.js)
│   └── patient-app/               # Patient mobile/web app
├── services/                      # Backend microservices
│   ├── domain-api/                # Core domain logic (NestJS)
│   ├── kernel-api/                # Platform kernel (NestJS)
│   ├── ai-gateway/                # AI/ML inference gateway
│   ├── event-router/              # Event routing & orchestration
│   └── workflow-runtime/          # Temporal workflow runtime
├── packages/                      # Shared libraries
│   ├── api-contracts/             # Shared API contracts/types
│   ├── hospital-operations/       # Hospital business logic
│   ├── otel-bootstrap/            # OpenTelemetry observability
│   └── tenant-context/            # Tenant-aware context utilities
├── deploy/                        # Deployment configurations
├── infra/                         # Infrastructure-as-Code
├── ops/                           # Operations scripts
├── scripts/                       # Utility scripts
├── clients/                       # External client integrations
├── docker-compose.yml             # Local development services
├── Dockerfile                     # Root Docker build
├── turbo.json                     # Turborepo pipeline config
├── pnpm-workspace.yaml            # Workspace configuration
└── package.json                   # Root package config
```

### 1.3 Module Registration (46 Backend Modules)

The `app.module.ts` registers **43 domain-api modules**:

| Module | Purpose | Status |
|--------|---------|--------|
| Auth | JWT authentication, RBAC guards | 🟢 Implemented |
| Tenant | Tenant isolation, RLS middleware | 🟢 Implemented |
| Patient | Patient registration & MRN | 🟢 Implemented |
| Encounter | Encounter management lifecycle | 🟢 Implemented |
| EMR | Electronic Medical Records | 🟡 Partial |
| Scheduling | Appointment & resource scheduling | 🟢 Implemented |
| Public Booking | Public-facing appointment booking | 🟢 Implemented |
| Navayu | Navayu-specific workflows (MSK, Protocols) | 🟢 Implemented |
| CRM | Lead pipeline, campaigns, lifecycle | 🟢 Implemented |
| Billing | Invoice, payments, charge lines | 🟢 Implemented |
| OPD | Outpatient workflow state machine | 🟢 Implemented |
| Lab | Lab diagnostic orders & workflows | 🟢 Implemented |
| Radiology | Radiology study orders & reporting | 🟢 Implemented |
| Pharmacy | Pharmacy fulfillment & inventory | 🟢 Implemented |
| Bed | Bed inventory & occupancy | 🟢 Implemented |
| Admission (IPD) | Inpatient admission lifecycle | 🟢 Implemented |
| Nursing | Nursing tasks, vitals, notes | 🟢 Implemented |
| MAR (Medication Admin) | Medication administration records | 🟢 Implemented |
| Discharge | Multi-department discharge orchestration | 🟢 Implemented |
| Insurance/TPA | Insurance authorization workflows | 🟢 Implemented |
| OT | Operation Theatre management | 🟢 Implemented |
| Inventory | Stock management, catalog, moves | 🟢 Implemented |
| Dialysis | Dialysis session management | 🟢 Implemented |
| Real-time | WebSocket/SSE real-time updates | 🟢 Implemented |
| Orchestration | Operational health, reconciliation | 🟢 Implemented |
| Command | Operational command center | 🟢 Implemented |
| Governance | Policy & compliance definitions | 🟢 Implemented |
| Workflow Config | Workflow definitions & branching | 🟢 Implemented |
| Escalation | Operational escalation management | 🟢 Implemented |
| Financial Operations | Financial operations & reconciliation | 🟢 Implemented |
| Analytics | Operational dashboards & KPIs | 🟢 Implemented |
| Migration | Data import/migration framework | 🟢 Implemented |
| Notifications | Platform notifications (Email/SMS) | 🟢 Implemented |
| AI | AI orchestration layer | 🟢 Implemented |
| Jobs | Background job processing | 🟢 Implemented |
| Providers | Provider drivers (Twilio, SendGrid) | 🟢 Implemented |
| Health | Health checks, deep health | 🟢 Implemented |
| Events | Event bus, platform events | 🟢 Implemented |

---

## 2. DATABASE SCHEMA

### 2.1 Domain Database (domain-api — 48 tables)

**Patient-Centric Core:**
- `patients` — Patient master record with multi-tenant isolation
- `encounters` — Visit/encounter sessions
- `clinical_notes` — Free-text clinical documentation
- `opd_visits` — OPD state machine (intent → waiting → in_consultation → completed)
- `opd_visit_transitions` — Full state transition audit trail

**Appointment & Scheduling:**
- `appointments` — Scheduled appointments
- `scheduling_resources` — Bookable doctors, rooms, equipment
- `scheduling_waitlist` — Waitlist for full slots

**CRM:**
- `crm_leads` — Lead pipeline (new_inquiry → contacted → qualified → converted → lost)
- `crm_campaigns` — Campaign definitions and tracking
- `crm_lifecycle_events` — Patient lifecycle touchpoints

**Billing & Finance:**
- `invoices` — Full invoice lifecycle (draft → due → paid → settled → cancelled)
- `invoice_charge_lines` — Idempotent charge lines per module
- `invoice_transitions` — Invoice state audit trail
- `payment_records` — Payment capture

**Diagnostics:**
- `lab_diagnostic_orders` — Lab order state machine (ordered → sample_collected → processing → verified → reported)
- `lab_order_transitions` — Lab order audit trail
- `radiology_study_orders` — Radiology study order lifecycle
- `radiology_order_transitions` — Radiology audit trail

**Pharmacy:**
- `pharmacy_stock_items` — Branch-level drug inventory with batch/expiry
- `pharmacy_fulfillments` — Prescription fulfillment lifecycle
- `pharmacy_fulfillment_transitions` — Fulfillment audit trail
- `pharmacy_inventory_reservations` — Drug reservation against stock

**Bed & Admission:**
- `bed_units` — Ward/unit grouping
- `beds` — Bed with occupancy state machine
- `bed_transitions` — Bed state audit trail
- `ipd_admissions` — IPD admission lifecycle (13 states)
- `ipd_admission_transitions` — Admission audit trail

**Nursing:**
- `nursing_tasks` — Task assignment lifecycle
- `nursing_task_transitions` — Task audit trail
- `nursing_vital_rounds` — Vital signs documentation (BP, Pulse, Temp, SpO2, Pain)
- `nursing_notes` — Progress/handover/incident notes

**Medication:**
- `medication_schedules` — MAR schedule with state
- `medication_admin_transitions` — Medication admin audit trail

**Discharge & Insurance:**
- `discharge_orchestrations` — Multi-department discharge workflow
- `discharge_transitions` — Discharge audit trail
- `insurance_authorizations` — TPA/Insurance authorization workflow
- `insurance_transitions` — Insurance audit trail

**Facilities:**
- `ot_rooms` / `ot_cases` / `ot_case_transitions` — OT management
- `dialysis_machines` / `dialysis_sessions` / `dialysis_session_transitions`
- `inventory_catalog_items` — Stock catalog
- `inventory_stock_moves` — Stock movements with audit trail
- `inventory_stock_move_transitions`

**Data Migration:**
- `import_jobs` / `import_job_rows` / `import_mapping_templates`

**Notifications:**
- `notification_templates` / `notification_outbox` / `notification_deliveries`

**AI:**
- `ai_action_logs` / `ai_tenant_quotas`

**Platform Events:**
- `platform_events` — Outbox/metering/audit source

### 2.2 Kernel Database (kernel-api — 25+ tables)

**Organization & Tenancy:**
- `organizations` — Tenant organizations with hierarchy
- `branches` — Multi-branch support with parent-child relationships
- `branch_configs` — Per-branch configuration store

**User & Access:**
- `platform_users` — User accounts with role-based access
- `role_templates` — Role/permission templates
- `staff_assignments` — User-to-role assignments per branch/department
- `delegation_grants` — Temporary permission delegation
- `user_sessions` — JWT session tracking with revocation
- `mfa_challenges` — TOTP MFA enrollment

**Policies:**
- `policy_definitions` — Organization-level policy definitions
- `policy_overrides` — Branch-level policy overrides
- `approval_chains` — Multi-step approval workflows

**Departments:**
- `departments` — Branch-department catalog

**Onboarding:**
- `tenant_signups` / `onboarding_sessions` / `onboarding_steps`

**Subscription & Metering:**
- `subscription_plans` / `tenant_subscriptions`
- `quota_limits` / `usage_records`
- `tenant_metrics_snapshots`
- `platform_invoices` — SaaS billing invoices

**Module Entitlements:**
- `module_catalog` / `tenant_module_entitlements` / `branch_module_overrides`

**Integrations:**
- `api_keys` / `webhook_subscriptions` / `webhook_deliveries`
- `integration_connections`

**Infrastructure:**
- `idempotency_records` — Distributed idempotency
- `platform_event_outbox` — Reliable event delivery
- `dead_letter_events` — Failed event storage
- `job_queue` — Background job management
- `audit_logs` — Append-only audit entries

---

## 3. STATE MACHINE ARCHITECTURE

The system uses a **unified state machine pattern** across all clinical workflows. Every stateful entity has:

1. A **state field** tracking current position
2. A **previous_state** field for rollback awareness
3. A **transitions table** recording every action, actor, and timestamp
4. **Optimistic concurrency** via version fields

### OPD State Machine
```
intent → check_in → waiting → in_consultation → 
    ├── awaiting_diagnostics → in_consultation*
    ├── awaiting_pharmacy → completed
    ├── completed (prescribed)
    └── escalated → resolved → completed
```

### IPD Admission State Machine
```
admission_requested → deposit_pending → bed_assigned → admitted
    → treatment_in_progress → discharge_initiated → 
       ├── discharge_clearance_pending (clinical/billing/pharmacy/nursing/insurance)
       → discharge_ready → discharged
       └── escalated → resolved → discharged
```

### Lab Order State Machine
```
ordered → sample_collected → sample_received → processing → 
    ├── verified → reported
    └── critical → acknowledged → reported
```

### Invoice State Machine
```
draft → due → partial → paid → settled → 
    ├── cancelled
    └── refunded
```

---

## 4. CROSS-CUTTING CONCERNS

### 4.1 Multi-Tenancy (RLS)
- Every table has `tenantId` field
- `rls.interceptor.ts` intercepts all queries and appends tenant filters
- Middleware reads tenant from JWT or subdomain
- Branches within a tenant can have module-level overrides

### 4.2 Security
- JWT authentication via `@nestjs/jwt` + passport
- Role-Based Access Control (RBAC) via dedicated guard
- Decorator-based permission checking (`@Rbac()`)
- Row-Level Security (RLS) interceptor
- MFA support (TOTP via `mfa_challenges`)
- Session tracking with revocation support

### 4.3 Event-Driven Architecture
- `PlatformEvent` model as audit/metering source
- `PlatformEventOutbox` for reliable delivery
- `DeadLetterEvent` for failed event handling
- `InternalEventsController` for intra-service events
- Webhook subscriptions for external integrations

### 4.4 Provider Abstraction
- `ProviderDriverInterface` for pluggable communication
- Console (dev), Twilio (SMS), SendGrid (Email) drivers
- Extensible provider runtime

### 4.5 Notifications
- Template-based notification system
- Outbox pattern with retry/delivery tracking
- Channel abstraction (Email, SMS)

---

## 5. FRONTEND ARCHITECTURE

### 5.1 Hospital OS (apps/hospital-os)
- **Framework:** React 18 + Vite + TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **State:** Zustand stores (hospitalStore.tsx)
- **Build:** Vite with rollup options

### 5.2 Key Frontend Modules

| Component | Module |
|-----------|--------|
| `AppLayout.tsx`, `DashboardLayout.tsx` | Core layout |
| `DashboardKpiGrid.tsx` | Dashboard KPIs |
| `HospitalLoginWizard.tsx` | Auth flow |
| `WorkflowStepStrip.tsx` | OPD workflow |
| `BillingStepWizard.tsx` | Billing workflow |
| `TraumaBayBoard.tsx` | Emergency |
| `EmergencyFastTrackPanel.tsx` | Emergency triage |
| `OperationalCommandCenterPanel.tsx` | Command center |
| `OperationalDischargePanel.tsx` | Discharge workflow |
| `OperationalIpdPanel.tsx` | IPD operations |
| `OperationalLabPanel.tsx` | Lab worklist |
| `OperationalPharmacyPanel.tsx` | Pharmacy ops |
| `OperationalRadiologyPanel.tsx` | Radiology ops |
| `DialysisPlatformStrip.tsx` | Dialysis |
| `InventoryPlatformStrip.tsx` | Inventory |
| `OtPlatformStrip.tsx` | OT management |
| `LeadPipeline.tsx`, `LeadsKanban.tsx` | CRM |
| `Navayu*` (11 components) | Navayu-specific: MSK forms, intake, protocol maps |
| `FormDefinitionRenderer.tsx` | Dynamic form rendering |
| `ModuleEntitlementGate.tsx` | Feature/module gating |
| `LifecycleRouteGuardBanner.tsx` | Lifecycle guard |

### 5.3 Control Plane (apps/control-plane)
- **Framework:** Next.js (App Router)
- **Role:** Admin console, tenant management, platform operations

---

## 6. INFRASTRUCTURE & DEVOPS

### 6.1 Containerization
- Root `docker-compose.yml` with PostgreSQL, Redis, Temporal
- `Dockerfile` for each service (multi-stage builds)
- `.dockerignore` files per service

### 6.2 CI/CD
- GitHub Actions (`.github/` directory)
- Vercel deployment configuration (`.vercel/`, `vercel.json`)
- Turborepo pipeline for build caching

### 6.3 Monitoring
- OpenTelemetry (`packages/otel-bootstrap`)
- Deep health checks (`src/health/deep-health.controller.ts`)
- Usage metering and tenant metrics snapshots

---

## 7. EXISTING DOCUMENTATION

| File | Size | Purpose |
|------|------|---------|
| `PROJECT_STATE_ANALYSIS.md` | 11KB | Current project state |
| `ADRINE_FEATURE_GAPS_ANALYSIS.md` | 14KB | Feature gap analysis |
| `BILLING_FINANCE_MODULE.md` | 27KB | Billing module spec |
| `DOCTOR_MODULE.md` | 27KB | Doctor workbench spec |
| `EMERGENCY_MODULE.md` | 29KB | Emergency module spec |
| `INVENTORY_MANAGER_MODULE.md` | 27KB | Inventory module spec |
| `LAB_TECHNICIAN_MODULE.md` | 27KB | Lab module spec |
| `NURSE_MODULE.md` | 26KB | Nursing module spec |
| `OT_COORDINATOR_MODULE.md` | 27KB | OT module spec |
| `PHARMACIST_MODULE.md` | 27KB | Pharmacy module spec |
| `RADIOLOGIST_MODULE.md` | 27KB | Radiology module spec |
| `RECEPTIONIST_MODULE.md` | 17KB | Reception module spec |
| `INTEGRATED_HOSPITAL_OS_ARCHITECTURE.md` | 12KB | Architecture doc |
| `MULTI_TENANT_MIGRATION_STRATEGY.md` | 17KB | Multi-tenant plan |
| `AI_CUSTOMIZATION_ENGINE.md` | 10KB | AI/ML customization |
| `ADRINE_CONTROL_PLANE_ARCHITECTURE.md` | 21KB | Control plane docs |
| `PRODUCTION_PLAN.md` | 10KB | Production readiness |
| `ENTERPRISE_AUDIT_REPORT.md` | 62KB | Enterprise audit |
| `MASTER_OPERATIONAL_CONNECTIVITY_MATRIX.md` | 33KB | Operations matrix |
| `HOSPITAL_OS_PRODUCT_BACKLOG.md` | 1.6KB | Product backlog |

---

## 8. KEY STRENGTHS

1. **Comprehensive module coverage** — 43+ backend modules covering nearly all hospital departments
2. **State machine architecture** — Every workflow has formal state machines with full audit trails
3. **Multi-tenant by design** — RLS at database level, tenant context middleware, branch hierarchies
4. **Event-driven backbone** — Platform events, outbox pattern, dead letter queues
5. **Production-ready patterns** — Idempotency, optimistic concurrency, outbox pattern, retry mechanisms
6. **Modern tech stack** — React 18 + NestJS + PostgreSQL + Prisma + Turborepo
7. **Excellent documentation** — 20+ detailed module specification docs already exist
8. **Provider abstraction** — Pluggable notification/communication drivers
9. **Modular monorepo** — Clear separation of concerns with shared packages
10. **Navayu specialization** — Custom MSK (Musculoskeletal) forms and protocol maps

---

## 9. KEY WEAKNESSES & RISKS

1. **Frontend maturity lags backend** — Many UI components exist as placeholders (`ModulePlaceholder.tsx`, `RolePlaceholder.tsx`)
2. **Mock auth in dev** — Hospital OS defaults to mock role-based auth; kernel-api integration not wired
3. **No EHR core depth** — Clinical notes are free-text without structured SOAP templates, problem lists, or clinical decision support
4. **Incomplete audit trail integration** — Audit logs exist but full compliance (HIPAA/GDPR) automation not in place
5. **No patient portal** — `patient-app` exists but no actual patient self-service features
6. **Limited mobile support** — No dedicated mobile apps for patients or clinicians
7. **No RCM (Revenue Cycle Management)** — Insurance claims, denial management, eligibility verification missing
8. **No telemedicine integration** — No video visit platform
9. **No device/HIS integration** — No HL7/FHIR interfaces, PACS/LIS integration
10. **No CDS (Clinical Decision Support)** — Drug interactions, allergy checks, dosing recommendations missing
