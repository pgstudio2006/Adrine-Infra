import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function domainDatabaseUrl(): string {
  if (process.env.DOMAIN_DATABASE_URL?.trim()) {
    return process.env.DOMAIN_DATABASE_URL.trim();
  }
  const kernel = process.env.DATABASE_URL ?? '';
  if (kernel.includes('/adrine_kernel')) {
    return kernel.replace('/adrine_kernel', '/adrine_domain');
  }
  return kernel;
}

/** Runs repo-root `pnpm provision:navayu` inside the kernel container (/repo). */
export async function runNavayuProvisionScript(): Promise<{ stdout: string; stderr: string }> {
  const repoRoot = process.env.ADRINE_REPO_ROOT ?? '/repo';
  const script = [
    'set -e',
    'cd /repo/services/kernel-api && npx prisma generate',
    'cd /repo/services/domain-api && npx prisma generate',
    'cd /repo && pnpm provision:navayu',
  ].join(' && ');

  const { stdout, stderr } = await execFileAsync('sh', ['-c', script], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
      DOMAIN_DATABASE_URL: domainDatabaseUrl(),
      NAVAYU_DEFAULT_PASSWORD: process.env.NAVAYU_DEFAULT_PASSWORD ?? 'Navayu@2026',
    },
    maxBuffer: 16 * 1024 * 1024,
    timeout: 180_000,
  });
  return { stdout, stderr };
}
