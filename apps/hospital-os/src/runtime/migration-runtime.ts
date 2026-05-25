import { platformFetch } from './platform-client';
import { getPlatformSession, isPlatformRuntimeEnabled } from './platform-session';

function domainBase(): string | undefined {
  return import.meta.env.VITE_DOMAIN_API_URL as string | undefined;
}

export function canUseMigrationRuntime(): boolean {
  return isPlatformRuntimeEnabled() && !!domainBase() && !!getPlatformSession();
}

export async function platformCreateImportJob(body: {
  type: string;
  branchId?: string;
  fileName?: string;
  csv?: string;
}) {
  return platformFetch<{ id: string }>(domainBase()!, '/migration/jobs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function platformPreviewImportJob(jobId: string) {
  return platformFetch(domainBase()!, `/migration/jobs/${jobId}/preview`, { method: 'POST' });
}

export async function platformExecuteImportJob(jobId: string) {
  return platformFetch(domainBase()!, `/migration/jobs/${jobId}/execute`, { method: 'POST' });
}

export async function platformRollbackImportJob(jobId: string) {
  return platformFetch(domainBase()!, `/migration/jobs/${jobId}/rollback`, { method: 'POST' });
}
