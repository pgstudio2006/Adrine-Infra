const INSECURE_JWT_SECRETS = new Set([
  'dev-insecure-change-me',
  'dev-local-navayu',
  'change-me',
  'secret',
  'jwt_secret',
]);

/** Fail fast when production is misconfigured for client shipping. */
export function assertProductionSecurityEnv(serviceName: string): void {
  if (process.env.NODE_ENV !== 'production') return;

  if (process.env.ALLOW_DEV_LOGIN === 'true') {
    throw new Error(`[${serviceName}] ALLOW_DEV_LOGIN must not be true in production`);
  }

  if (process.env.JWT_DEV_SECRET?.trim()) {
    throw new Error(`[${serviceName}] JWT_DEV_SECRET must not be set in production`);
  }

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32 || INSECURE_JWT_SECRETS.has(secret.toLowerCase())) {
    throw new Error(
      `[${serviceName}] JWT_SECRET must be a strong random secret (32+ chars) in production`,
    );
  }

  if (!process.env.CORS_ORIGINS?.trim()) {
    throw new Error(
      `[${serviceName}] CORS_ORIGINS must list allowed browser origins in production`,
    );
  }
}

export function isJwtEnforced(): boolean {
  if (process.env.DOMAIN_JWT_ENFORCE === 'false' || process.env.KERNEL_JWT_ENFORCE === 'false') {
    return false;
  }
  return (
    process.env.DOMAIN_JWT_ENFORCE === 'true' ||
    process.env.KERNEL_JWT_ENFORCE === 'true' ||
    process.env.NODE_ENV === 'production'
  );
}
