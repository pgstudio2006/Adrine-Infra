import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseAIRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export type AIExecuteResult = {
  logId: string;
  output: Record<string, unknown>;
  tokensUsed?: number;
};

const ADMIN_AI_PERMISSIONS = [
  'clinical.notes.read',
  'operations.command.read',
  'lab.results.read',
  'billing.invoices.read',
  'ipd.discharge.read',
  'nursing.tasks.read',
];

export async function platformExecuteAI(input: {
  actionType: string;
  permissions?: string[];
  payload?: Record<string, unknown>;
}): Promise<AIExecuteResult> {
  const session = getPlatformSession();
  return platformFetch<AIExecuteResult>(domainBase()!, '/ai/execute', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      permissions: input.permissions ?? ADMIN_AI_PERMISSIONS,
      userId: session?.userId,
      branchId: session?.branchId,
      payload: {
        ...input.payload,
        branchId: session?.branchId,
      },
    }),
  });
}

export type AIScribeResult = {
  result: Record<string, unknown>;
  model?: string;
};

export async function platformScribeConsultation(input: {
  patientName: string;
  transcript: string;
}): Promise<AIScribeResult> {
  return platformFetch<AIScribeResult>(domainBase()!, '/ai/scribe', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
