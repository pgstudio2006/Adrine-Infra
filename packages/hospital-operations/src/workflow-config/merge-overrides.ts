import type { LifecycleDefinition } from '../types.js';
import type { WorkflowDefinitionDraft } from './workflow-definition.js';

/**
 * Merges branch workflow override JSON into a lifecycle definition (roles/validations per action).
 */
export function mergeLifecycleWithWorkflowOverride<S extends string>(
  definition: LifecycleDefinition<S>,
  override: WorkflowDefinitionDraft | Record<string, unknown> | null | undefined,
): LifecycleDefinition<S> {
  if (!override || typeof override !== 'object') return definition;
  const draft = override as WorkflowDefinitionDraft;
  const overrides = draft.transitionOverrides;
  if (!overrides) return definition;

  return {
    ...definition,
    transitions: definition.transitions.map((t) => {
      const o = overrides[t.action];
      if (!o) return t;
      return {
        ...t,
        roles: o.roles ?? t.roles,
        validations: o.validations ?? t.validations,
        branchConfigKeys: o.branchConfigKeys ?? t.branchConfigKeys,
      };
    }),
  };
}
