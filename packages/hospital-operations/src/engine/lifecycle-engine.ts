import type { LifecycleDefinition, Transition } from '../types.js';

export class LifecycleTransitionError extends Error {
  constructor(
    message: string,
    readonly lifecycleId: string,
    readonly from: string,
    readonly action: string,
  ) {
    super(message);
    this.name = 'LifecycleTransitionError';
  }
}

export function findTransition<S extends string>(
  def: LifecycleDefinition<S>,
  from: S,
  action: string,
): Transition<S> | undefined {
  return def.transitions.find((t) => {
    if (t.action !== action) return false;
    const fromStates = Array.isArray(t.from) ? t.from : [t.from];
    return fromStates.includes(from);
  });
}

export function canTransition<S extends string>(
  def: LifecycleDefinition<S>,
  from: S,
  action: string,
  actorRole: string,
): { ok: true; transition: Transition<S> } | { ok: false; reason: string } {
  const transition = findTransition(def, from, action);
  if (!transition) {
    return { ok: false, reason: `Action "${action}" is not valid from state "${from}"` };
  }
  if (!transition.roles.includes(actorRole) && !transition.roles.includes('admin')) {
    return { ok: false, reason: `Role "${actorRole}" cannot perform "${action}"` };
  }
  return { ok: true, transition };
}

export function assertTransition<S extends string>(
  def: LifecycleDefinition<S>,
  from: S,
  action: string,
  actorRole: string,
): Transition<S> {
  const result = canTransition(def, from, action, actorRole);
  if (!result.ok) {
    throw new LifecycleTransitionError(result.reason, def.id, from, action);
  }
  return result.transition;
}

export function nextState<S extends string>(
  def: LifecycleDefinition<S>,
  from: S,
  action: string,
  actorRole: string,
): S {
  return assertTransition(def, from, action, actorRole).to;
}
