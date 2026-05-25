# Connectivity backlog — Hospital OS

Tracks honest UI↔API connectivity work. Patient-app is out of scope for Phase 8 Program 5.

## Done — Phase 8 Program 5 (HR + scheduling + CRM UX)

| Item | Route / surface | Notes |
|------|-----------------|-------|
| Central week calendar | `/scheduling/calendar` | `useSchedulingPlatform` + range API; demo fallback |
| HR staff polish | `/hr/staff` | Cards/table, kernel roster strip, department filters |
| Leads kanban + table | `/crm/leads` | Stage columns aligned with `CrmLead.stage`; platform summary |
| Campaign → appointment | `/crm/campaigns` | `ScheduleFromLeadDialog` → `platformBookAppointment` |
| Preview wire copy | `/hr/attendance`, `/scheduling/teleconsult`, `/crm/experience` | `PreviewWireBanner` + route preview messages |

## Open — HR / scheduling / CRM

| Priority | Item | Target API | Blocker |
|----------|------|------------|---------|
| P1 | HR attendance live | `GET/POST /hr/attendance` (kernel) | Kernel attendance endpoints |
| P1 | Lead stage drag-drop | `PATCH /crm/leads/:id` | UX + optimistic updates |
| P2 | Teleconsult ↔ appointment | Scheduling + telemedicine module | Domain teleconsult resource type |
| P2 | CRM experience ingest | `/crm/experience` or lifecycle events | Survey schema + storage |
| P2 | Scheduling reports | `/scheduling/reports` | Analytics aggregates |
| P3 | HR leave/credentials/training | Kernel HR modules | Same pattern as staff roster |

## Explicitly not in scope (this program)

- Patient app (`apps/patient-app`) — no changes
- Full C1 per route — still **C1-leaning** ceiling until governed writes + realtime unify
