/**
 * Gap analysis: current Hospital OS vs production operational model.
 * Used to prioritize refactors — not user-facing copy.
 */

export type GapSeverity = 'critical' | 'high' | 'medium';

export type OperationalGap = {
  id: string;
  severity: GapSeverity;
  domain: string;
  issue: string;
  impact: string;
  remediation: string;
};

export const CURRENT_OPERATIONAL_GAPS: readonly OperationalGap[] = [
  {
    id: 'GAP-001',
    severity: 'critical',
    domain: 'Platform binding',
    issue:
      'PARTIAL (2026-05-20): P0 lists refresh from domain (useClinicalPlatformListSync, useDepartmentWorklistSync, HospitalProvider boot); store is UI cache; lab guards on ui-stage.',
    impact: 'No multi-tenant isolation, no audit at platform layer, no recovery.',
    remediation:
      'Strangler: non-P0 procurement/MIS reads; authoritative-only mode for billing-dept demo charts.',
  },
  {
    id: 'GAP-002',
    severity: 'critical',
    domain: 'Auth & tenancy',
    issue:
      'PARTIAL: kernel dev-login JWT + revocable UserSession; hospital-os restores /auth/me; DOMAIN_RBAC_ENFORCE on domain-api mutations. Mock role picker remains for dev.',
    impact: 'Cannot run real hospitals or chains; no SSO/MFA.',
    remediation:
      'CLOSED (dev/MVP): session validation + RBAC guard. PARTIAL: prod fail-closed without kernel URL; ops/PRODUCTION_AUTH.md OIDC stub. Enterprise OIDC/MFA for go-live.',
  },
  {
    id: 'GAP-003',
    severity: 'critical',
    domain: 'OPD ordering',
    issue:
      'PARTIAL (2026-05-20): operational-route-guards + LifecycleRouteGuardBanner + guarded TopNavbar when platform authoritative.',
    impact: 'Operational mistakes, revenue leakage, queue chaos.',
    remediation:
      'Extend guards to billing-dept OPD exit; verify server rejects out-of-order transitions on staging.',
  },
  {
    id: 'GAP-004',
    severity: 'high',
    domain: 'Emergency',
    issue: 'ED status model exists but is not gated against IPD admission workflow.',
    impact: 'Duplicate admissions, bed conflicts.',
    remediation: 'Single admissionLifecycle entry from ED with bed validation.',
  },
  {
    id: 'GAP-005',
    severity: 'high',
    domain: 'Lab',
    issue:
      'PARTIAL (2026-05-20 Phase 8): lab worklist/verification/entry use guardLabUiStageAdvance + disabled-reason tooltips on verify/release; critical banner on verification; Sample→Verify→Report step strip.',
    impact: 'Critical results may release without verification when platform state is missing offline.',
    remediation:
      'CLOSED on-platform: verify_results / publish_report gates. Remaining: enforce server-side on all lab mutation paths in staging.',
  },
  {
    id: 'GAP-006',
    severity: 'high',
    domain: 'Billing',
    issue:
      'PARTIAL (2026-05-20): BillingGatesService on domain-api; hospital-os BillingDeptShell shows GAP-006 inline on all /billing-dept/* pages; invoice/payment wizards.',
    impact: 'Billing disputes, compliance risk.',
    remediation:
      'CLOSED (API): encounter-close + billing_pending gates. PARTIAL: extend gate copy to reception billing exit UX.',
  },
  {
    id: 'GAP-007',
    severity: 'high',
    domain: 'Insurance / TPA',
    issue:
      'PARTIAL (2026-05-20): insuranceTpaLifecycle + /billing-dept/pre-auth wizard; GAP-007 alerts on insurance/IPD/finance screens.',
    impact: 'Denied claims, rework.',
    remediation:
      'CLOSED (API): pre-auth on IPD/high-cost via BillingGatesService. PARTIAL: OPD insurance path + claim settlement automation.',
  },
  {
    id: 'GAP-008',
    severity: 'medium',
    domain: 'Admin navigation',
    issue: 'Admin menu leads with analytics/AI before operational command functions.',
    impact: 'MS/admin confusion during live operations.',
    remediation: 'Reorder: command center → approvals → staff → finance → analytics.',
  },
  {
    id: 'GAP-009',
    severity: 'medium',
    domain: 'Events',
    issue: 'workflowEvents are local strings, not platform event catalog.',
    impact: 'Automations cannot subscribe consistently.',
    remediation: 'Map all pushWorkflowEvent calls to HospitalPlatformEvents.',
  },
  {
    id: 'GAP-010',
    severity: 'medium',
    domain: 'Automation',
    issue: 'No user-configurable WHEN/THEN; AI scribe calls external API from browser.',
    impact: 'Security, cost, no governance.',
    remediation: 'ai-gateway + workflow IR; automation builder phase 2.',
  },
  {
    id: 'GAP-011',
    severity: 'medium',
    domain: 'Branch / chain',
    issue: 'branch is a string on patient, not hierarchy-aware context.',
    impact: 'Chains cannot govern centrally with branch overrides.',
    remediation: 'OperationalContext branchId on every action; config inheritance model.',
  },
  {
    id: 'GAP-012',
    severity: 'medium',
    domain: 'Discharge',
    issue: 'Discharge scattered across nurse/doctor/reception without single discharge lifecycle.',
    impact: 'Patients leave without summary/billing/pharmacy clearance.',
    remediation: 'Unified discharge checklist driven by admissionLifecycle.discharge_ready.',
  },
  {
    id: 'GAP-013',
    severity: 'high',
    domain: 'Command center',
    issue: 'No unified operational snapshot across OPD/IPD/lab/pharmacy/finance runtimes.',
    impact: 'Leadership cannot see live hospital state during incidents.',
    remediation: 'OperationalCommandService + ReceptionFlowHub command panel with platform polling.',
  },
  {
    id: 'GAP-014',
    severity: 'high',
    domain: 'Governance',
    issue:
      'PARTIAL: kernel governance effective policies merged in loadBranchConfig; AdminSettings + /admin/platform link. Local tenant JSON still used for branding.',
    impact: 'Chains cannot enforce billing/discharge/insurance rules consistently.',
    remediation:
      'CLOSED (API): PolicyDefinition + effective /governance/policies/effective. PARTIAL: hospital-os policy editor UI and chain-wide override workflows.',
  },
  {
    id: 'GAP-015',
    severity: 'medium',
    domain: 'Escalation',
    issue: 'Cross-runtime escalations are ad-hoc UI alerts, not persisted operational records.',
    impact: 'Missed nursing tasks and critical labs lack accountable resolution trail.',
    remediation: 'OperationalEscalation model + evaluate rules on snapshot build.',
  },
  {
    id: 'GAP-016',
    severity: 'high',
    domain: 'Tenant provisioning',
    issue:
      'PARTIAL: TenantProvisioningService + idempotent signup; OnboardingWizard at /admin/platform and /admin/onboarding.',
    impact: 'Cannot scale customer acquisition or branch rollout.',
    remediation:
      'CLOSED (MVP): provisioning API + wizard steps (signup → hospital → branches → template → activate). PARTIAL: public signup URL + email verification.',
  },
  {
    id: 'GAP-017',
    severity: 'high',
    domain: 'Platform billing',
    issue:
      'PARTIAL: PlatformBillingService (plans, usage, quotas, invoices); hub shows /billing/usage/summary; assertQuota on record.',
    impact: 'Cannot monetize or throttle abusive tenants.',
    remediation:
      'CLOSED (MVP): metering + SaaS plans + invoice generation. PARTIAL: payment gateway and GST filing automation.',
  },
  {
    id: 'GAP-018',
    severity: 'high',
    domain: 'Module entitlements',
    issue:
      'PARTIAL: ModuleRuntimeService + /modules/effective; canUseModule + ModuleEntitlementGate on ProtectedRoute.',
    impact: 'Features enabled without subscription alignment.',
    remediation:
      'CLOSED (MVP): entitlement API + UI gate. PARTIAL: per-route enforcement on all dept screens and plan downgrade flows.',
  },
  {
    id: 'GAP-019',
    severity: 'medium',
    domain: 'Data migration',
    issue:
      'PARTIAL: domain-api MigrationService (patients CSV) + Platform Admin migration tab (preview/execute/rollback).',
    impact: 'Onboarding requires manual re-entry.',
    remediation:
      'CLOSED (MVP): patient import jobs. PARTIAL: inventory/pricing loaders and bulk validation reports.',
  },
  {
    id: 'GAP-020',
    severity: 'high',
    domain: 'Notifications',
    issue:
      'PARTIAL: domain platform-notification outbox + escalation/lab critical enqueue; kernel relay to event outbox.',
    impact: 'Critical lab/nursing alerts lack retry and audit trail.',
    remediation:
      'CLOSED (MVP): NotificationOutbox + enqueueFromEvent + jobs/reconcile retry. PARTIAL: SES/WhatsApp providers and on-call routing per branch.',
  },
  {
    id: 'GAP-021',
    severity: 'medium',
    domain: 'Integrations',
    issue:
      'PARTIAL: API keys + HMAC webhooks + FHIR stub in kernel-api; Platform Admin integrations tab.',
    impact: 'Cannot integrate LIS/RIS/ERP systems.',
    remediation:
      'CLOSED (MVP): keys/webhooks/FHIR metadata stub. PARTIAL: outbound webhook HTTP worker and partner sandbox certs.',
  },
  {
    id: 'GAP-022',
    severity: 'medium',
    domain: 'AI orchestration',
    issue: 'AI actions are not audited, quota-governed, or permission-checked centrally.',
    impact: 'Cost and compliance risk.',
    remediation: 'AIOrchestrationService + ai-action-catalog permissions.',
  },
  {
    id: 'GAP-023',
    severity: 'medium',
    domain: 'Production readiness',
    issue:
      'PARTIAL: IdempotencyService + TenantRateLimitGuard; provisioning signup idempotent; POST /jobs/reconcile (kernel + domain).',
    impact: 'Duplicate signups and billing drift under load.',
    remediation:
      'CLOSED (MVP): idempotency + rate limits + reconcile entry. PARTIAL: Redis-backed rate limits and scheduled reconcile cron.',
  },
  {
    id: 'GAP-024',
    severity: 'medium',
    domain: 'Scale observability',
    issue:
      'PARTIAL: ScaleReadinessService tenant metrics + health outbox depth (incl. notification events).',
    impact: 'Cannot detect hot tenants or queue backlog.',
    remediation:
      'CLOSED (MVP): per-tenant snapshot + platform outbox depth. PARTIAL: Prometheus/Grafana dashboards and cross-DB notification depth.',
  },
  {
    id: 'GAP-025',
    severity: 'medium',
    domain: 'Operational templates',
    issue:
      'PARTIAL: OperationalTemplateService + onboarding instantiate; Platform Admin templates tab.',
    impact: 'Each branch reconfigures workflows manually.',
    remediation:
      'CLOSED (MVP): template catalog + instantiate API. PARTIAL: branch-level pack diff/rollback UI.',
  },
  {
    id: 'GAP-026',
    severity: 'medium',
    domain: 'Self-service admin',
    issue:
      'PARTIAL: PlatformAdminHub at /admin/platform (onboarding, modules, billing, notifications, integrations, migration, templates, command).',
    impact: 'MS must use raw APIs or DB for tenant ops.',
    remediation:
      'CLOSED (MVP): unified hub routes. PARTIAL: role-based MS impersonation and audit export from hub.',
  },
];
