import type { INestApplication } from '@nestjs/common';

const DEV_ORIGINS = [
  'http://localhost:3100',
  'http://127.0.0.1:3100',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'x-tenant-id',
  'x-branch-id',
  'x-actor-role',
  'x-actor-id',
  'Idempotency-Key',
];

function parseOrigins(): string[] | boolean {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (raw) {
    return raw
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return DEV_ORIGINS;
}

export function configurePlatformCors(app: INestApplication): void {
  const origin = parseOrigins();
  if (origin === false) {
    console.warn(
      '[domain-api] CORS_ORIGINS unset in production — set e.g. https://hms.adrine.in,https://book.adrine.in',
    );
  }
  app.enableCors({
    origin,
    credentials: true,
    allowedHeaders: ALLOWED_HEADERS,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}
