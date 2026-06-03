import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

function branchQuery(branchId?: string): string {
  const session = getPlatformSession();
  const bid = branchId ?? session?.branchId ?? 'branch_main';
  return `branchId=${encodeURIComponent(bid)}`;
}

export type PlatformCrmLead = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  stage: string;
  specialty?: string | null;
  packageName?: string | null;
  ownerLabel?: string | null;
  channel?: string | null;
  valueCents?: number | null;
  priority: string;
  status: string;
  notes?: string | null;
  patientId?: string | null;
  opdVisitId?: string | null;
  patient?: { id: string; fullName: string; mrn?: string | null };
};

export type PlatformCrmCampaign = {
  id: string;
  name: string;
  segment?: string | null;
  channel?: string | null;
  status: string;
  reachCount: number;
};

export type PlatformCrmLifecycleEvent = {
  id: string;
  patientId: string;
  eventType: string;
  journey?: string | null;
  ownerLabel?: string | null;
  riskLevel?: string | null;
  nextStep?: string | null;
  detail?: string | null;
  createdAt: string;
  patient?: { id: string; fullName: string; mrn?: string | null };
};

export type PlatformCrmSummary = {
  openLeads: number;
  leadsByStage: Array<{ stage: string; _count: { _all: number } }>;
  activeCampaigns: PlatformCrmCampaign[];
  lifecycleEvents30d: number;
};

export function canUseCrmRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export async function platformGetCrmSummary(branchId?: string): Promise<PlatformCrmSummary> {
  return platformFetch<PlatformCrmSummary>(domainBase()!, `/crm/summary?${branchQuery(branchId)}`);
}

export async function platformListCrmLeads(branchId?: string, stage?: string): Promise<PlatformCrmLead[]> {
  const q = branchQuery(branchId);
  const stageQ = stage ? `&stage=${encodeURIComponent(stage)}` : '';
  return platformFetch<PlatformCrmLead[]>(domainBase()!, `/crm/leads?${q}${stageQ}`);
}

export async function platformCreateCrmLead(
  body: Omit<PlatformCrmLead, 'id' | 'status' | 'priority' | 'stage'> & {
    stage?: string;
    status?: string;
    priority?: string;
    opdVisitId?: string;
  },
  branchId?: string,
): Promise<PlatformCrmLead> {
  return platformFetch<PlatformCrmLead>(domainBase()!, `/crm/leads?${branchQuery(branchId)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function platformUpdateCrmLead(
  id: string,
  body: Partial<Pick<PlatformCrmLead, 'stage' | 'status' | 'ownerLabel' | 'priority' | 'notes' | 'patientId' | 'opdVisitId'>>,
): Promise<PlatformCrmLead> {
  return platformFetch<PlatformCrmLead>(domainBase()!, `/crm/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function platformListCrmCampaigns(branchId?: string): Promise<PlatformCrmCampaign[]> {
  return platformFetch<PlatformCrmCampaign[]>(domainBase()!, `/crm/campaigns?${branchQuery(branchId)}`);
}

export async function platformCreateCrmCampaign(
  body: { name: string; segment?: string; channel?: string; status?: string; reachCount?: number },
  branchId?: string,
): Promise<PlatformCrmCampaign> {
  return platformFetch<PlatformCrmCampaign>(domainBase()!, `/crm/campaigns?${branchQuery(branchId)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function platformListCrmLifecycle(
  branchId?: string,
  patientId?: string,
): Promise<PlatformCrmLifecycleEvent[]> {
  const q = branchQuery(branchId);
  const p = patientId ? `&patientId=${encodeURIComponent(patientId)}` : '';
  return platformFetch<PlatformCrmLifecycleEvent[]>(domainBase()!, `/crm/lifecycle?${q}${p}`);
}

export async function platformRecordCrmLifecycle(
  body: {
    patientId: string;
    eventType: string;
    journey?: string;
    ownerLabel?: string;
    riskLevel?: string;
    nextStep?: string;
    detail?: string;
  },
  branchId?: string,
): Promise<PlatformCrmLifecycleEvent> {
  return platformFetch<PlatformCrmLifecycleEvent>(domainBase()!, `/crm/lifecycle?${branchQuery(branchId)}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
