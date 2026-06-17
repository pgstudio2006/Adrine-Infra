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
  pendingFollowUps: number;
  totalProposals: number;
  totalReferrals: number;
  pendingTasks: number;
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

// ── Follow-ups ──

export type PlatformCrmFollowUp = {
  id: string;
  patientName: string;
  phone?: string | null;
  assignedTo?: string | null;
  followUpType: string;
  scheduledAt: string;
  completedAt?: string | null;
  missedAt?: string | null;
  status: string;
  outcome?: string | null;
  notes?: string | null;
  priority: string;
};

export async function platformListFollowUps(branchId?: string, status?: string): Promise<PlatformCrmFollowUp[]> {
  const q = branchQuery(branchId);
  const s = status ? `&status=${encodeURIComponent(status)}` : '';
  return platformFetch<PlatformCrmFollowUp[]>(domainBase()!, `/crm/follow-ups?${q}${s}`);
}

export async function platformCreateFollowUp(body: Omit<PlatformCrmFollowUp, 'id' | 'completedAt' | 'missedAt'> & { completedAt?: string; missedAt?: string }, branchId?: string) {
  return platformFetch<PlatformCrmFollowUp>(domainBase()!, `/crm/follow-ups?${branchQuery(branchId)}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function platformUpdateFollowUp(id: string, body: Partial<{ status: string; outcome: string; notes: string; completedAt: string; missedAt: string }>) {
  return platformFetch<PlatformCrmFollowUp>(domainBase()!, `/crm/follow-ups/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

// ── Packages ──

export type PlatformCrmPackage = {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  basePriceCents: number;
  components?: unknown;
  isActive: boolean;
  proposals?: PlatformCrmProposal[];
};

export type PlatformCrmProposal = {
  id: string;
  patientName: string;
  packageName: string;
  proposedPriceCents: number;
  counsellorLabel?: string | null;
  status: string;
  notes?: string | null;
  convertedAt?: string | null;
  createdAt: string;
};

export async function platformListPackages(branchId?: string): Promise<PlatformCrmPackage[]> {
  return platformFetch<PlatformCrmPackage[]>(domainBase()!, `/crm/packages?${branchQuery(branchId)}`);
}

export async function platformCreatePackage(body: { name: string; category?: string; description?: string; basePriceCents?: number; components?: unknown }, branchId?: string) {
  return platformFetch<PlatformCrmPackage>(domainBase()!, `/crm/packages?${branchQuery(branchId)}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function platformListProposals(branchId?: string, status?: string): Promise<PlatformCrmProposal[]> {
  const q = branchQuery(branchId);
  const s = status ? `&status=${encodeURIComponent(status)}` : '';
  return platformFetch<PlatformCrmProposal[]>(domainBase()!, `/crm/proposals?${q}${s}`);
}

export async function platformCreateProposal(body: { patientName: string; packageName: string; proposedPriceCents?: number; counsellorLabel?: string; notes?: string; leadId?: string; patientId?: string; packageId?: string }, branchId?: string) {
  return platformFetch<PlatformCrmProposal>(domainBase()!, `/crm/proposals?${branchQuery(branchId)}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function platformUpdateProposal(id: string, body: Partial<{ status: string; notes: string; convertedAt: string }>) {
  return platformFetch<PlatformCrmProposal>(domainBase()!, `/crm/proposals/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

// ── Referrals ──

export type PlatformCrmReferral = {
  id: string;
  patientName: string;
  referralType: string;
  referringDoctor?: string | null;
  referringHospital?: string | null;
  referralSource?: string | null;
  specialty?: string | null;
  status: string;
  convertedToLead: boolean;
  leadId?: string | null;
  notes?: string | null;
  createdAt: string;
};

export async function platformListReferrals(branchId?: string, referralType?: string): Promise<PlatformCrmReferral[]> {
  const q = branchQuery(branchId);
  const t = referralType ? `&referralType=${encodeURIComponent(referralType)}` : '';
  return platformFetch<PlatformCrmReferral[]>(domainBase()!, `/crm/referrals?${q}${t}`);
}

export async function platformCreateReferral(body: { patientName: string; referralType?: string; referringDoctor?: string; referringHospital?: string; referralSource?: string; specialty?: string; notes?: string; patientId?: string }, branchId?: string) {
  return platformFetch<PlatformCrmReferral>(domainBase()!, `/crm/referrals?${branchQuery(branchId)}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function platformUpdateReferral(id: string, body: Partial<{ status: string; convertedToLead: boolean; leadId: string; notes: string }>) {
  return platformFetch<PlatformCrmReferral>(domainBase()!, `/crm/referrals/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

// ── Tasks ──

export type PlatformCrmTask = {
  id: string;
  patientName?: string | null;
  assignedTo?: string | null;
  taskType: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
};

export async function platformListTasks(branchId?: string, status?: string): Promise<PlatformCrmTask[]> {
  const q = branchQuery(branchId);
  const s = status ? `&status=${encodeURIComponent(status)}` : '';
  return platformFetch<PlatformCrmTask[]>(domainBase()!, `/crm/tasks?${q}${s}`);
}

export async function platformCreateTask(body: { title: string; patientName?: string; assignedTo?: string; taskType?: string; description?: string; priority?: string; dueAt?: string; leadId?: string }, branchId?: string) {
  return platformFetch<PlatformCrmTask>(domainBase()!, `/crm/tasks?${branchQuery(branchId)}`, { method: 'POST', body: JSON.stringify(body) });
}

export async function platformUpdateTask(id: string, body: Partial<{ status: string; completedAt: string; notes: string }>) {
  return platformFetch<PlatformCrmTask>(domainBase()!, `/crm/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}
