import { Injectable, Logger } from '@nestjs/common';

export type DomainEventPayload = Record<string, unknown>;

@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  emit(name: string, tenantId: string, payload: DomainEventPayload): void {
    this.logger.log(
      JSON.stringify({
        type: 'adrine.domain.event',
        name,
        tenantId,
        occurredAt: new Date().toISOString(),
        payload,
      }),
    );
  }
}
