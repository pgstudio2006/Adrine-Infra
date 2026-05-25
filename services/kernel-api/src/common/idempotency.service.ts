import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(
    tenantId: string,
    key: string | undefined,
    route: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    if (!key) return fn();

    const existing = await this.prisma.idempotencyRecord.findUnique({
      where: { tenantId_key: { tenantId, key } },
    });
    if (existing?.response) {
      return existing.response as T;
    }
    if (existing && !existing.response) {
      throw new ConflictException('Idempotent request in progress');
    }

    const result = await fn();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.idempotencyRecord.upsert({
      where: { tenantId_key: { tenantId, key } },
      create: {
        tenantId,
        key,
        route,
        response: result as object,
        status: 'completed',
        expiresAt,
      },
      update: { response: result as object, status: 'completed' },
    });
    return result;
  }
}
