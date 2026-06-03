import { canTransition, findTransition } from './lifecycle-engine.js';
import {
  navayuMskVisitLifecycle,
  type NavayuMskVisitState,
} from '../lifecycles/navayu-msk-visit.js';
import { runMskValidations, type MskValidationContext } from '../msk/msk-validation.js';
import type { Transition } from '../types.js';

export type MskTransitionRequest = {
  mskState: NavayuMskVisitState;
  action: string;
  actorRole: string;
  validationContext?: MskValidationContext;
  branchOverrides?: Record<string, boolean>;
};

export type MskTransitionResult =
  | {
      ok: true;
      nextState: NavayuMskVisitState;
      transition: Transition<NavayuMskVisitState>;
    }
  | { ok: false; reason: string; code: 'INVALID_TRANSITION' | 'FORBIDDEN' | 'VALIDATION' };

export function listAllowedMskActions(
  from: NavayuMskVisitState,
  actorRole: string,
): string[] {
  const allActions = [...new Set(navayuMskVisitLifecycle.transitions.map((t) => t.action))];
  return allActions.filter((action) => {
    const r = evaluateMskTransition({ mskState: from, action, actorRole });
    return r.ok;
  });
}

export function evaluateMskTransition(req: MskTransitionRequest): MskTransitionResult {
  const gate = canTransition(navayuMskVisitLifecycle, req.mskState, req.action, req.actorRole);
  if (!gate.ok) {
    return {
      ok: false,
      reason: gate.reason,
      code: gate.reason.includes('Role') ? 'FORBIDDEN' : 'INVALID_TRANSITION',
    };
  }

  const transition = gate.transition;

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

  const validationError = runMskValidations(transition.validations, req.validationContext ?? {});
  if (validationError) {
    return { ok: false, reason: validationError, code: 'VALIDATION' };
  }

  return {
    ok: true,
    nextState: transition.to,
    transition,
  };
}

export function resolveMskState(raw: unknown): NavayuMskVisitState {
  if (typeof raw === 'string' && navayuMskVisitLifecycle.states.includes(raw as NavayuMskVisitState)) {
    return raw as NavayuMskVisitState;
  }
  return navayuMskVisitLifecycle.initial;
}
