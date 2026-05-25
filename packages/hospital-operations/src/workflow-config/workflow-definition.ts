/**
 * Workflow definition draft / publish model for branch-configurable lifecycles.
 */

export type WorkflowPublishState = 'draft' | 'published' | 'archived';

export type WorkflowDefinitionDraft = {
  lifecycleId: string;
  name: string;
  description?: string;
  /** Partial transition overrides keyed by action */
  transitionOverrides?: Record<
    string,
    {
      roles?: string[];
      validations?: string[];
      branchConfigKeys?: string[];
    }
  >;
  metadata?: Record<string, unknown>;
};

export type WorkflowVersionRecord = {
  id: string;
  definitionId: string;
  version: number;
  state: WorkflowPublishState;
  draft: WorkflowDefinitionDraft;
  publishedAt?: string;
  publishedBy?: string;
};

export type WorkflowPublishLogEntry = {
  id: string;
  definitionId: string;
  fromVersion: number;
  toVersion: number;
  action: 'publish' | 'rollback';
  actorId?: string;
  createdAt: string;
};

export type WorkflowBranchOverridePointer = {
  branchId: string;
  lifecycleId: string;
  workflowVersionId: string;
};
