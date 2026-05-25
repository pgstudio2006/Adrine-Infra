/**
 * Unified hospital operational snapshot — command center aggregate contract.
 */

export type SnapshotSeverity = 'info' | 'warning' | 'critical';

export type OperationalSnapshotCounts = {
  opdActiveVisits: number;
  opdWaitingQueue: number;
  ipdActiveAdmissions: number;
  bedsOccupied: number;
  bedsAvailable: number;
  labPending: number;
  labCriticalUnacked: number;
  radiologyPending?: number;
  pharmacyPending: number;
  nursingOpenTasks: number;
  nursingMissed: number;
  dischargeInProgress: number;
  insurancePending: number;
  openEscalations: number;
  billingDraftInvoices: number;
};

export type OperationalSnapshotBlocker = {
  id: string;
  domain: string;
  severity: SnapshotSeverity;
  message: string;
  resourceType?: string;
  resourceId?: string;
};

export type OperationalSnapshotEscalation = {
  id: string;
  type: string;
  severity: string;
  state: string;
  sourceRuntime: string;
  resourceId?: string;
  message: string;
  createdAt: string;
};

export type OperationalSnapshot = {
  branchId: string;
  tenantId: string;
  generatedAt: string;
  counts: OperationalSnapshotCounts;
  blockers: OperationalSnapshotBlocker[];
  escalations: OperationalSnapshotEscalation[];
  healthStatus: 'healthy' | 'degraded' | 'critical';
  reconciliationWarnings: string[];
};
