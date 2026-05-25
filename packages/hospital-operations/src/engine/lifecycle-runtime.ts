/**
 * Reusable Adrine operational lifecycle pattern:
 * Definition → Engine → Validation → Enforcement → Events → Metering → Audit → Config → Permissions → Adapter → UI
 */
import type { LifecycleDefinition, Transition } from '../types.js';
import { canTransition, findTransition } from './lifecycle-engine.js';

export type TransitionRequest<C> = {
  state: string;
  action: string;
  actorRole: string;
  validationContext?: C;
  branchOverrides?: Record<string, boolean>;
};

export type TransitionResult<S extends string> =
  | {
      ok: true;
      nextState: S;
      transition: Transition<S>;
      events: readonly string[];
      notifications: readonly string[];
      metering: readonly string[];
      aiHooks: readonly string[];
    }
  | { ok: false; reason: string; code: 'INVALID_TRANSITION' | 'FORBIDDEN' | 'VALIDATION' | 'POLICY' };

export function createLifecycleRuntime<S extends string, C extends object>(config: {
  definition: LifecycleDefinition<S>;
  validate?: (validationIds: readonly string[] | undefined, ctx: C) => string | null;
  policyCheck?: (transition: Transition<S>, ctx: C) => string | null;
}) {
  const { definition, validate, policyCheck } = config;

  return {
    definition,
    evaluate(req: TransitionRequest<C>): TransitionResult<S> {
      const gate = canTransition(definition, req.state as S, req.action, req.actorRole);
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
            return { ok: false, reason: `Branch policy blocks action (${key})`, code: 'POLICY' };
          }
        }
      }

      if (policyCheck) {
        const policyErr = policyCheck(transition, req.validationContext ?? ({} as C));
        if (policyErr) return { ok: false, reason: policyErr, code: 'POLICY' };
      }

      if (validate) {
        const err = validate(transition.validations, req.validationContext ?? ({} as C));
        if (err) return { ok: false, reason: err, code: 'VALIDATION' };
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
    },
    allowedActions(from: S, actorRole: string): string[] {
      const actions = [...new Set(definition.transitions.map((t) => t.action))];
      return actions.filter((action) => this.evaluate({ state: from, action, actorRole }).ok);
    },
    getTransition(from: S, action: string) {
      return findTransition(definition, from, action);
    },
  };
}
