import { createHmac, randomBytes, createHash } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { HospitalPlatformEvents } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from '../common/idempotency.service';

@Injectable()
export class IntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async createApiKey(tenantId: string, name: string, rateLimitRpm = 60) {
    const raw = `adr_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(raw).digest('hex');
    const row = await this.prisma.apiKey.create({
      data: {
        tenantId,
        name,
        keyPrefix: raw.slice(0, 12),
        keyHash,
        rateLimitRpm,
      },
    });
    return { id: row.id, name: row.name, apiKey: raw, rateLimitRpm: row.rateLimitRpm };
  }

  listApiKeys(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, keyPrefix: true, rateLimitRpm: true, createdAt: true },
    });
  }

  async createWebhook(
    tenantId: string,
    input: { url: string; events: string[] },
  ) {
    const secret = randomBytes(32).toString('hex');
    return this.prisma.webhookSubscription.create({
      data: { tenantId, url: input.url, secret, events: input.events },
    });
  }

  signPayload(secret: string, body: string): string {
    return createHmac('sha256', secret).update(body).digest('hex');
  }

  async testWebhook(tenantId: string, id: string) {
    const sub = await this.prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!sub) throw new NotFoundException('Webhook not found');
    const payload = { test: true, at: new Date().toISOString() };
    const body = JSON.stringify(payload);
    const signature = this.signPayload(sub.secret, body);
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        tenantId,
        subscriptionId: sub.id,
        eventName: 'test.ping',
        payload,
        status: 'simulated',
      },
    });
    return { deliveryId: delivery.id, signature, payload };
  }

  async deliverWebhook(
    tenantId: string,
    subscriptionId: string,
    eventName: string,
    payload: object,
    idempotencyKey?: string,
  ) {
    return this.idempotency.run(tenantId, idempotencyKey, `webhook:${subscriptionId}`, async () => {
      const sub = await this.prisma.webhookSubscription.findFirst({
        where: { id: subscriptionId, tenantId, isActive: true },
      });
      if (!sub) throw new NotFoundException('Webhook not found');
      const body = JSON.stringify(payload);
      const signature = this.signPayload(sub.secret, body);
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          tenantId,
          subscriptionId: sub.id,
          eventName,
          payload,
          status: 'pending',
        },
      });
      await this.prisma.platformEventOutbox.create({
        data: {
          tenantId,
          eventName: HospitalPlatformEvents.integrations.webhookDelivered,
          payload: { deliveryId: delivery.id, eventName },
        },
      });
      return { deliveryId: delivery.id, signature, url: sub.url };
    });
  }
}
