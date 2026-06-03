# Navayu × Adrine — Delivery Status & Roadmap

**Prepared for:** Navayu Spine & Joint Care  
**Date:** May 2026  
**Platform:** Adrine Healthcare Operating System (multi-tenant SaaS)  
**Locations:** Pataudi Hospital · Gurgaon Center  

---

## 1. What you are getting

Adrine is your **dedicated hospital operating system** on a shared healthcare cloud — not a one-off custom website. You receive:

- Your own **organization** (Navayu branding, users, permissions)
- **Two locations** under one account (Pataudi + Gurgaon)
- **MSK-focused clinical workflow** (reception → intake → junior doctor → senior doctor → counselling → billing)
- **Editable forms and workflows** over time — **forms first**; workflow builder comes later on the Adrine platform
- **AI-assisted summaries** and automation in later phases
- **Patient-facing intake** on tablet/phone
- **CRM** for referral tracking and lead source analytics

**Commercial model:** One-time setup + annual subscription (both centers on one tenant).

---

## 2. What is already done (platform + Navayu setup)

| Item | Status |
|------|--------|
| Navayu tenant design (`tenant_navayu`) | ✅ Ready |
| Two branches — Pataudi mini hospital & Gurgaon MSK center | ✅ Ready |
| Navayu branding, navigation & referral source lists (config) | ✅ Ready |
| Staff login accounts (reception, doctors, admin, CRM, nurse, pharmacy) | ✅ Ready |
| MSK workflow definition (`navayu_msk_visit`) — published as config | ✅ Ready |
| UAT v0 form templates (registration, patient intake, lumbar exam) | ✅ Ready (JSON + Hospital OS UI wired) |
| One-command provisioning script for go-live | ✅ Ready (+ protocol stub seed) |
| Deployment architecture (Hostinger KVM 4 + Coolify + Cloudflare R2) | ✅ Documented + prod compose & checklist |
| Hospital OS role workspaces (Reception, Doctor, Nurse, Pharmacy, CRM, Admin) | ✅ Available on platform |

**Provisioning** can run as soon as the production/staging server and database are live — typically **within hours** after server setup, not months.

---

## 3. What we are completing now — UAT v0 (first hands-on test)

**Goal:** You can walk through a real patient journey at Gurgaon Center with Navayu branding — end-to-end on staging, before full AI and all specialty modules.

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Tenant + 2 branches live on staging server | ⏳ Pending server (KVM 4) |
| 2 | Navayu login & branding visible | ✅ Config ready |
| 3 | **Registration** — referral source, lifestyle flags, pain regions | ✅ ~90% (platform metadata sync when runtime on) |
| 4 | **Reception queue** → doctor queue (standard OPD flow) | ✅ Platform ready |
| 5 | **Patient intake** on tablet (complaint, pain score, red flags) | ✅ ~85% (domain-api intake endpoint; patient app wired) |
| 6 | **Junior doctor** — structured lumbar MSK form | ✅ ~85% (persists to visit metadata via API) |
| 7 | **Senior doctor** — clinical summary panel (rule-based v1) | ✅ ~75% (aggregates registration + intake + exam; no LLM yet) |
| 8 | **CRM lead** auto-created from referral source at registration | ✅ ~80% (best-effort when CRM runtime on) |
| 9 | Staging URL + guided UAT walkthrough | ⏳ After deploy — see `scripts/deploy-navayu-checklist.md` |
| 10 | Your sign-off on v0 vs full roadmap | ⏳ After UAT |
| 11 | **Patient profile timeline** (MSK milestones) | ✅ ~70% (API timeline + local fallback) |
| 12 | **Protocol library seed** (Disc Care, Frozen Shoulder, Knee OA, AVN) | ✅ Config stub provisioned; UI deferred |

### UAT v0 — what you will test

1. Reception registers patient at **Gurgaon** (with referral & lifestyle fields)  
2. Patient completes **intake questionnaire** on tablet  
3. **Junior doctor** completes MSK assessment form  
4. **Senior doctor** opens same patient from queue (summary panel visible)  
5. Referral appears in **CRM** as a lead  

### UAT v0 — intentionally not included yet

- Body pain diagram (interactive)  
- All spine/knee/hip/shoulder exam modules  
- Validated score calculators (ODI, NDI, WOMAC, etc.)  
- Real AI-generated clinical summary from MRI/investigations  
- Protocol mapper (Disc Care, Frozen Shoulder, etc.)  
- Counsellor package tiers & financial proposals  
- WhatsApp / SMS / email automation  
- Public online booking on adrine.in  
- Full management dashboards (revenue, outcomes, MIS)  
- **Admin workflow builder** (change clinical journey steps in UI — workflow is fixed config for now)

Pataudi mini hospital (OPD + IPD + lab + pharmacy) is **provisioned from day one** via `multi_specialty` branch config — not deferred.

Form customization is Phase 1; workflow customization is a **later platform release**.

These are scheduled in **Phase 1–3** below.

---

## Customization scope (agreed)

| What Navayu can edit | When |
|----------------------|------|
| Registration, intake, MSK exam, counsellor **forms** (fields, labels, options) | **Phase 1** — Form designer |
| Clinical **workflow** steps (reception → intake → junior → senior → counsellor) | **Later** — fixed MSK path until Workflow Engine designer ships; Adrine updates via config if process changes |

---

## 4. Full roadmap (after UAT v0)

### Phase 1 — Foundation (Weeks 1–2)

- **Admin-editable forms** — registration, intake, MSK templates (no developer for field changes)  
- Full patient intake on tablet with red-flag alerts  
- Server-synced settings (all staff see same branding/config)  
- MSK clinical path unchanged in UI — staff follow Reception → Doctor → CRM routes; workflow config updated by Adrine if needed  

*Editable workflow UI (drag-and-drop journey steps) is **not** in Phase 1.*

### Phase 2 — Clinical depth + AI (Weeks 3–4)

- All MSK region templates (spine, knee, hip, shoulder, AVN, sports)  
- Clinical scores (ODI, NDI, WOMAC, KOOS, DASH, SPADI, Harris Hip, VAS)  
- **AI one-page summary** before senior consultation  
- **Protocol engine** — Disc Care, Frozen Shoulder, Knee OA, AVN, Regenerative  
- Counsellor tiers (Basic / Advanced / Regenerative / Premium) + packages  
- Pain mapping diagram on tablet  
- Diagnosis summary & package PDFs for patients  

### Phase 3 — Automation & growth (Weeks 5+)

- Investigation upload (MRI, X-ray, blood) + AI summarize  
- WhatsApp, SMS, email confirmations & follow-ups  
- **Public online booking** — location, doctor, slot on adrine.in  
- Referral analytics & treatment outcome reports  

---

## 5. Pataudi Hospital — modules by role (mini hospital)

| Role | Modules |
|------|---------|
| **Reception** | Registration (OPD / IPD / Emergency), appointments, queue, billing, IPD admission request |
| **Doctor** | OPD queue, IPD rounds, patients, orders |
| **Nurse** | Ward vitals, medications, nursing tasks, IPD care |
| **Billing** | OPD billing, IPD billing, packages |
| **Pharmacy** | Inventory, dispensing (when pharmacist assigned) |
| **Laboratory** | Sample collection, results (LIMS module) |

*Pataudi uses standard hospital modules (`multi_specialty` pack). Full MSK specialty workflow is Gurgaon-first.*

---

## 6. Gurgaon Center — modules by role (target state)

| Role | Modules |
|------|---------|
| **Admin** | Dashboard, staff, settings, departments, finance, claims, MIS, AI briefing, revenue & outcomes |
| **Reception** | Registration, appointments, check-in, queue, billing, visitors, inquiry |
| **Doctor (Senior / Junior)** | OPD queue, patients, consultation, schedule, analytics |
| **Nurse** | Vitals, assessments, medications, ward tasks |
| **Pharmacy** | Inventory, dispensing, purchase orders, billing |
| **CRM / Counsellor** | Leads, lifecycle, care journeys, referral analytics, packages |
| **Patient (tablet/app)** | Intake questionnaire, documents, follow-up (portal — Phase 2+) |

*Many admin and analytics screens roll out in Phase 2–3; UAT v0 focuses on the **clinical OPD spine**.*

---

## 7. MSK clinical workflow (target state — Gurgaon)

```
Reception Registration
    → Patient AI Intake (tablet)
    → Junior Doctor Evaluation
    → Functional Assessment + Scores
    → AI Clinical Summary
    → Senior Doctor Consultation
    → Disease Classification
    → Protocol Mapping
    → Counsellor Planning & Package
    → Prescription + Follow-up
```

**Specialties supported (configurable):** Spine · Knee · Hip · Shoulder · AVN · Sports Medicine  

**Protocols (editable by Navayu admin):** Disc Care · Frozen Shoulder · Knee OA · AVN · Regenerative Medicine  

---

## 8. What Navayu needs to provide

| Item | When | Purpose |
|------|------|---------|
| **KVM / server access** or approval for Adrine-managed Hostinger KVM 4 | Before staging | Hosting |
| **Domain / DNS** (e.g. `hms.navayuhealth.in` or subdomain on adrine.in) | Before staging | Staff & patient URLs |
| **Referral source list** (how patients hear about Navayu) | UAT v0 | Registration dropdown |
| **Logo & brand colors** (if different from current config) | UAT v0 | White-label login |
| **Staff list** — name, email, role, branch | UAT v0 | User accounts |
| **WhatsApp Business API** credentials | Phase 3 | Patient notifications |
| **SMS gateway** credentials | Phase 3 | Confirmations |
| **Sample MRI / reports** (anonymized) | Phase 2 | AI summary tuning |

---

## 9. Staging access (after deploy)

**Staff app (Hospital OS):**  
`https://[staging-url]` — dev/staging login with accounts such as:

| Email | Role | Location |
|-------|------|----------|
| reception@navayuhealth.in | Reception | Gurgaon |
| junior@navayuhealth.in | Junior Doctor | Gurgaon |
| senior@navayuhealth.in | Senior Doctor | Gurgaon |
| admin@navayuhealth.in | Admin | Gurgaon |
| crm@navayuhealth.in | CRM | Gurgaon |
| reception.pataudi@navayuhealth.in | Reception | Pataudi |
| doctor@pataudi.navayuhealth.in | Doctor | Pataudi |
| nurse@pataudi.navayuhealth.in | Nurse | Pataudi |
| billing@pataudi.navayuhealth.in | Billing | Pataudi |

*(Final URLs and passwords shared securely at handover.)*

---

## 10. Summary

| | |
|--|--|
| **Done** | Navayu tenant architecture, 2 branches, users, branding config, MSK workflow & form seeds, protocol stub, provisioning automation, prod deploy templates |
| **In progress** | Staging deploy on KVM 4 (~75% UAT v0 clinical spine complete in code) |
| **Next** | Your UAT on staging → sign-off → Phase 1 (editable forms) |
| **Overall UAT v0 readiness** | **~72%** (code + docs); **~55%** including production server & client UAT |
| **Timeline to UAT v0** | Days after KVM 4 live + checklist run — not months |

---

## 11. Contact & next step

**Recommended next step:** Complete Hostinger KVM 4 setup → Adrine deploys staging → Navayu UAT walkthrough at Gurgaon Center flow.

For questions on scope, phasing, or UAT scheduling, contact your Adrine project lead.

---

*Internal references: [NAVAYU_IMPLEMENTATION_SPEC.md](./NAVAYU_IMPLEMENTATION_SPEC.md) · [NAVAYU_MSK_WORKFLOW.md](./NAVAYU_MSK_WORKFLOW.md) · [PROVISIONING.md](./PROVISIONING.md)*
