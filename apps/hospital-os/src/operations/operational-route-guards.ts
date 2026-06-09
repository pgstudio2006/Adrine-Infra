/**
 * Global OPD/IPD route guards — block navigation when lifecycle prerequisites are not met.
 * Active only when platform runtime is authoritative (see platform-store-bridge).
 */
import {
  frontDeskSpine,
  opdVisitLifecycle,
  canTransition,
  type OpdVisitState,
} from '@adrine/hospital-operations';
import { isPlatformAuthoritative } from '@/runtime/platform-store-bridge';
import { getClientOpdState } from '@/operations/lifecycle-guards';

export type OperationalRouteGuardContext = {
  role: string;
  patients: ReadonlyArray<{
    opdState?: string;
    platformOpdVisitId?: string;
    patientType?: string;
  }>;
  queue: ReadonlyArray<{ status: string }>;
  appointments: ReadonlyArray<{ status: string }>;
};

export type RouteAccessResult = {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
};

const OPD_STATE_RANK: Record<OpdVisitState, number> = {
  intent: 0,
  registered: 1,
  appointment_or_walkin: 2,
  checked_in: 3,
  routed: 4,
  queued: 5,
  in_consultation: 6,
  orders_pending: 7,
  billing_pending: 8,
  follow_up_scheduled: 8,
  completed: 9,
  cancelled: -1,
  no_show: -1,
};

function opdRank(state: OpdVisitState): number {
  return OPD_STATE_RANK[state] ?? 0;
}

function hasOpdAtLeast(ctx: OperationalRouteGuardContext, min: OpdVisitState): boolean {
  return ctx.patients.some((p) => {
    if (p.patientType && p.patientType !== 'OPD') return false;
    const st = getClientOpdState(p.opdState);
    if (st === 'cancelled' || st === 'no_show') return false;
    return opdRank(st) >= opdRank(min);
  });
}

function spineStepSatisfied(
  stepId: string,
  ctx: OperationalRouteGuardContext,
): boolean {
  switch (stepId) {
    case 'register':
      return ctx.patients.length > 0;
    case 'schedule':
      return (
        ctx.appointments.some((a) => a.status !== 'cancelled' && a.status !== 'no-show') ||
        hasOpdAtLeast(ctx, 'appointment_or_walkin')
      );
    case 'checkin':
      return (
        ctx.appointments.some((a) => a.status === 'checked-in' || a.status === 'in-consultation') ||
        hasOpdAtLeast(ctx, 'checked_in')
      );
    case 'routing':
      return hasOpdAtLeast(ctx, 'routed') || ctx.queue.length > 0;
    case 'queue':
      return ctx.queue.some((q) => q.status !== 'skipped') || hasOpdAtLeast(ctx, 'queued');
    case 'billing_exit':
      return hasOpdAtLeast(ctx, 'billing_pending') || hasOpdAtLeast(ctx, 'orders_pending');
    default:
      return true;
  }
}

function prerequisitesForRoute(pathname: string): string[] {
  for (const step of frontDeskSpine.steps) {
    if (!step.route) continue;
    if (pathname === step.route || pathname.startsWith(`${step.route}/`)) {
      return [...(step.dependsOn ?? [])];
    }
  }
  return [];
}

const ALWAYS_ALLOWED_PREFIXES = [
  '/reception/registration',
  '/reception/appointments',
  '/login',
];

const ROLE_BYPASS_BILLING = new Set(['billing', 'admin']);

export function evaluateOperationalRouteAccess(
  pathname: string,
  ctx: OperationalRouteGuardContext,
): RouteAccessResult {
  if (!isPlatformAuthoritative()) {
    return { allowed: true };
  }

  if (ALWAYS_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return { allowed: true };
  }

  if (pathname === '/reception' || pathname === '/reception/') {
    return { allowed: true };
  }

  const prereq = prerequisitesForRoute(pathname);
  for (const stepId of prereq) {
    if (!spineStepSatisfied(stepId, ctx)) {
      const step = frontDeskSpine.steps.find((s) => s.id === stepId);
      const label = step?.label ?? stepId;
      const redirectTo = step?.route ?? '/reception';
      return {
        allowed: false,
        reason: `Complete "${label}" before this screen when platform runtime is on.`,
        redirectTo,
      };
    }
  }

  if (
    (pathname === '/reception/billing' || pathname.startsWith('/reception/billing/')) &&
    !ROLE_BYPASS_BILLING.has(ctx.role)
  ) {
    const billingReady =
      hasOpdAtLeast(ctx, 'queued') ||
      ctx.queue.some((q) => ['waiting', 'called', 'in-consultation', 'completed'].includes(q.status));
    if (!billingReady) {
      const gate = canTransition(opdVisitLifecycle, 'checked_in', 'issue_token', ctx.role);
      return {
        allowed: false,
        reason: gate.ok
          ? 'Issue a queue token before OPD billing.'
          : ('reason' in gate ? gate.reason : 'Check in and queue the visit before billing.'),
        redirectTo: '/reception/checkin',
      };
    }
  }

  if (pathname === '/reception/queue') {
    const ok =
      hasOpdAtLeast(ctx, 'checked_in') ||
      ctx.appointments.some((a) => a.status === 'checked-in' || a.status === 'in-consultation');
    if (!ok) {
      return {
        allowed: false,
        reason: 'Check in patients before opening the queue.',
        redirectTo: '/reception/checkin',
      };
    }
  }

  if (pathname === '/reception/checkin') {
    const ok =
      ctx.appointments.some((a) => a.status === 'scheduled' || a.status === 'confirmed') ||
      hasOpdAtLeast(ctx, 'appointment_or_walkin');
    if (!ok) {
      return {
        allowed: false,
        reason: 'Book an appointment or register a walk-in before check-in.',
        redirectTo: '/reception/appointments',
      };
    }
  }

  if (pathname.startsWith('/doctor/consultation/') || pathname.startsWith('/jr-doctor/consultation/')) {
    const uhid = pathname.split('/').filter(Boolean).pop();
    const queuePath = ctx.role === 'jr_doctor' ? '/jr-doctor/queue' : '/doctor/queue';
    const target = uhid ? ctx.patients.find((p) => p.uhid === uhid) : undefined;
    const queuedForPatient =
      !!uhid &&
      ctx.queue.some(
        (q) =>
          q.uhid === uhid &&
          ['waiting', 'called', 'in-consultation', 'completed'].includes(q.status),
      );
    const targetOpdReady =
      !!target &&
      (() => {
        const st = getClientOpdState(target.opdState);
        if (st === 'cancelled' || st === 'no_show') return false;
        return opdRank(st) >= opdRank('queued') || st === 'in_consultation';
      })();
    const ok = targetOpdReady || queuedForPatient || hasOpdAtLeast(ctx, 'in_consultation');
    if (!ok) {
      return {
        allowed: false,
        reason: 'Patient must be queued or in consultation before opening the consultation workspace.',
        redirectTo: queuePath,
      };
    }
  }

  return { allowed: true };
}
