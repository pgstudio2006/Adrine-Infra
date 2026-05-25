import { Injectable } from '@nestjs/common';
import { HospitalPlatformEvents } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderRuntimeService } from '../providers/provider-runtime.service';

const MAX_ATTEMPTS = 5;

@Injectable()
export class PlatformNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerRuntime: ProviderRuntimeService,
  ) {}

  async upsertTemplate(
    tenantId: string,
    input: { code: string; channel: string; subject?: string; body: string },
  ) {
    return this.prisma.notificationTemplate.upsert({
      where: {
        tenantId_code_channel: {
          tenantId,
          code: input.code,
          channel: input.channel,
        },
      },
      create: { tenantId, ...input },
      update: { subject: input.subject, body: input.body },
    });
  }

  listTemplates(tenantId: string) {
    return this.prisma.notificationTemplate.findMany({ where: { tenantId } });
  }

  async send(
    tenantId: string,
    input: {
      channel: string;
      recipient: string;
      templateCode?: string;
      payload?: Record<string, unknown>;
    },
  ) {
    let messageBody = JSON.stringify(input.payload ?? {});
    if (input.templateCode) {
      const tpl = await this.prisma.notificationTemplate.findFirst({
        where: { tenantId, code: input.templateCode, channel: input.channel },
      });
      if (tpl) messageBody = tpl.body;
    }
    const outbox = await this.prisma.notificationOutbox.create({
      data: {
        tenantId,
        channel: input.channel,
        templateCode: input.templateCode,
        recipient: input.recipient,
        payload: { body: messageBody, ...(input.payload ?? {}) } as object,
        status: 'pending',
      },
    });
    await this.processOutboxItem(outbox.id);
    return outbox;
  }

  async enqueueFromEvent(
    tenantId: string,
    input: {
      channel: string;
      recipient: string;
      templateCode?: string;
      eventName: string;
      payload?: Record<string, unknown>;
    },
  ) {
    await this.prisma.platformEvent.create({
      data: {
        tenantId,
        eventName: HospitalPlatformEvents.notifications.enqueued,
        payload: { sourceEvent: input.eventName, ...input.payload },
      },
    });
    return this.send(tenantId, input);
  }

  listOutbox(tenantId: string, status?: string) {
    return this.prisma.notificationOutbox.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async processPending() {
    const pending = await this.prisma.notificationOutbox.findMany({
      where: {
        status: { in: ['pending', 'retry'] },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
      },
      take: 50,
    });
    for (const item of pending) {
      await this.processOutboxItem(item.id);
    }
    return { processed: pending.length };
  }

  private async processOutboxItem(outboxId: string) {
    const item = await this.prisma.notificationOutbox.findUnique({ where: { id: outboxId } });
    if (!item) return;

    const messageBody =
      typeof item.payload === 'object' && item.payload && 'body' in item.payload
        ? String((item.payload as { body: unknown }).body)
        : JSON.stringify(item.payload);

    try {
      const channel = item.channel === 'email' ? 'email' : 'sms';
      const result = await this.providerRuntime.deliver({
        channel,
        recipient: item.recipient,
        body: messageBody,
      });
      if (result.ok) {
        await this.prisma.platformEvent.create({
          data: {
            tenantId: item.tenantId,
            eventName: 'adrine.providers.delivery.completed',
            payload: {
              channel,
              providerId: result.providerId,
              outboxId: item.id,
            },
          },
        });
      }
      await this.prisma.notificationDelivery.create({
        data: {
          outboxId: item.id,
          provider: result.providerId,
          status: result.ok ? 'sent' : 'failed',
          detail: result.error,
        },
      });
      await this.prisma.notificationOutbox.update({
        where: { id: item.id },
        data: { status: 'delivered', attempts: item.attempts + 1 },
      });
      await this.prisma.platformEvent.create({
        data: {
          tenantId: item.tenantId,
          eventName: HospitalPlatformEvents.notifications.delivered,
          payload: { outboxId: item.id },
        },
      });
    } catch (e) {
      const attempts = item.attempts + 1;
      const dead = attempts >= MAX_ATTEMPTS;
      await this.prisma.notificationOutbox.update({
        where: { id: item.id },
        data: {
          status: dead ? 'dead_letter' : 'retry',
          attempts,
          lastError: e instanceof Error ? e.message : 'delivery failed',
          nextRetryAt: dead ? null : new Date(Date.now() + attempts * 60_000),
        },
      });
      if (dead) {
        await this.prisma.platformEvent.create({
          data: {
            tenantId: item.tenantId,
            eventName: HospitalPlatformEvents.notifications.failed,
            payload: { outboxId: item.id },
          },
        });
      }
    }
  }
}
