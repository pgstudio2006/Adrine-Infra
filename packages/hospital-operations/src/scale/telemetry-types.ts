export type TenantScaleMetrics = {
  tenantId: string;
  visitCount: number;
  admissionCount: number;
  eventsLastHour: number;
  outboxPending: number;
  notificationPending: number;
  checkedAt: string;
};

export type PlatformScaleHealth = {
  status: 'healthy' | 'degraded';
  outboxDepth: number;
  notificationOutboxDepth: number;
  rlsEnabled: boolean;
  checkedAt: string;
};
