import { ConfigService } from '@nestjs/config';

const INSECURE_JWT_SECRETS = new Set([
  'dev-insecure-change-me',
  'dev-local-navayu',
  'change-me',
]);

export function resolveJwtSecret(config: ConfigService): string {
  if (process.env.NODE_ENV === 'production' && process.env.JWT_DEV_SECRET?.trim()) {
    throw new Error('JWT_DEV_SECRET must not be set in production');
  }

  const secret =
    config.get<string>('JWT_SECRET')?.trim() ||
    config.get<string>('JWT_DEV_SECRET')?.trim();

  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32 || INSECURE_JWT_SECRETS.has(secret)) {
      throw new Error('JWT_SECRET is required and must be strong when NODE_ENV=production');
    }
    return secret;
  }

  return secret ?? 'dev-insecure-change-me';
}
