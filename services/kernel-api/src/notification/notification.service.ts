import { Injectable } from '@nestjs/common';
import { HospitalPlatformEvents } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';

export type EnqueueNotificationInput = {
  tenantId: string;
  channel: string;
  template: string;
  recipient?: string;
  payload?: Record<string, unknown>;
};

/**
 * Kernel notification relay — persists to platform event outbox.
 * Delivery is processed by domain-api platform-notification (shared worker / jobs/reconcile).
 */
@Injectable()
export class KernelNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async enqueue(input: EnqueueNotificationInput) {
    const row = await this.prisma.platformEventOutbox.create({
      data: {
        tenantId: input.tenantId,
        eventName: HospitalPlatformEvents.notifications.enqueued,
        payload: {
          channel: input.channel,
          template: input.template,
          recipient: input.recipient ?? 'ops-oncall@tenant.local',
          ...input.payload,
        },
      },
    });
    return {
      accepted: true,
      outboxId: row.id,
      channel: input.channel,
      template: input.template,
      detail: 'Queued for platform-notification worker',
    };
  }
}
