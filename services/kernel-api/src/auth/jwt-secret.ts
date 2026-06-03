import { ConfigService } from '@nestjs/config';

export function resolveJwtSecret(config: ConfigService): string {
  const secret =
    config.get<string>('JWT_SECRET')?.trim() ||
    config.get<string>('JWT_DEV_SECRET')?.trim();
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('JWT_SECRET is required when NODE_ENV=production');
  }
  return secret ?? 'dev-insecure-change-me';
}
