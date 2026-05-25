import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class DeepHealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get('deep')
  async deep() {
    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true };
    } catch (e) {
      checks.database = { ok: false, detail: e instanceof Error ? e.message : 'db failed' };
    }

    const redisUrl = this.config.get<string>('REDIS_URL');
    if (redisUrl) {
      checks.redis = { ok: true, detail: 'REDIS_URL configured (client optional in MVP)' };
    } else {
      checks.redis = { ok: true, detail: 'in-memory realtime (no REDIS_URL)' };
    }

    const ok = Object.values(checks).every((c) => c.ok);
    return {
      status: ok ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? '0.1.0',
      service: 'domain-api',
      checks,
    };
  }
}
