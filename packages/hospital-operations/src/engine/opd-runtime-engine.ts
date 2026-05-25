import { canTransition, findTransition } from './lifecycle-engine.js';
import { opdVisitLifecycle, type OpdVisitState } from '../lifecycles/opd-visit.js';
import { runOpdValidations, type OpdValidationContext } from '../opd/opd-validation.js';
import type { Transition } from '../types.js';

export type OpdTransitionRequest = {
  visitState: OpdVisitState;
  action: string;
  actorRole: string;
  validationContext?: OpdValidationContext;
  branchOverrides?: Record<string, boolean>;
};

export type OpdTransitionResult =
  | {
      ok: true;
      nextState: OpdVisitState;
      transition: Transition<OpdVisitState>;
      events: readonly string[];
      notifications: readonly string[];
      metering: readonly string[];
      aiHooks: readonly string[];
    }
  | { ok: false; reason: string; code: 'INVALID_TRANSITION' | 'FORBIDDEN' | 'VALIDATION' | 'ESCALATION' };

/** List actions that would be invalid from the current state (for UX hints). */
export function listInvalidOpdActions(
  from: OpdVisitState,
  actorRole: string,
): string[] {
  const allActions = [...new Set(opdVisitLifecycle.transitions.map((t) => t.action))];
  return allActions.filter((action) => {
    const r = evaluateOpdTransition({ visitState: from, action, actorRole });
    return !r.ok;
  });
}

/** List allowed actions from current state for role. */
export function listAllowedOpdActions(from: OpdVisitState, actorRole: string): string[] {
  const allActions = [...new Set(opdVisitLifecycle.transitions.map((t) => t.action))];
  return allActions.filter((action) => {
    const r = evaluateOpdTransition({ visitState: from, action, actorRole });
    return r.ok;
  });
}

export function evaluateOpdTransition(req: OpdTransitionRequest): OpdTransitionResult {
  const gate = canTransition(opdVisitLifecycle, req.visitState, req.action, req.actorRole);
  if (!gate.ok) {
    return {
      ok: false,
      reason: gate.reason,
      code: gate.reason.includes('Role') ? 'FORBIDDEN' : 'INVALID_TRANSITION',
    };
  }

  const transition = gate.transition;

  if (transition.blockedWhenEscalated && req.validationContext?.visitEscalated) {
    if (!req.validationContext.actorIsSupervisor) {
      return {
        ok: false,
        reason: 'Visit is escalated — supervisor approval required',
        code: 'ESCALATION',
      };
    }
  }

  if (req.branchOverrides) {
    for (const key of transition.branchConfigKeys ?? []) {
      if (req.branchOverrides[key] === false) {
        return {
          ok: false,
          reason: `Branch policy blocks action (${key})`,
          code: 'VALIDATION',
        };
      }
    }
  }

  const validationError = runOpdValidations(transition.validations, req.validationContext ?? {});
  if (validationError) {
    return { ok: false, reason: validationError, code: 'VALIDATION' };
  }

  return {
    ok: true,
    nextState: transition.to,
    transition,
    events: transition.emits ?? [],
    notifications: transition.notifications ?? [],
    metering: transition.metering ?? [],
    aiHooks: transition.aiHooks ?? [],
  };
}

export function getOpdTransition(
  from: OpdVisitState,
  action: string,
): Transition<OpdVisitState> | undefined {
  return findTransition(opdVisitLifecycle, from, action);
}
