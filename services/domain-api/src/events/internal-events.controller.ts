import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { PlatformEventService } from './platform-event.service';

@ApiTags('internal')
@Controller('internal')
export class InternalEventsController {
  constructor(private readonly platformEvents: PlatformEventService) {}

  @Post('events')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  async ingest(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      event: string;
      actorId?: string;
      module?: string;
      uhid?: string;
      refId?: string;
      details?: Record<string, unknown>;
      occurredAt?: string;
    },
  ) {
    const tid = tenantId ?? 'tenant_dev';
    return this.platformEvents.record({
      tenantId: tid,
      branchId,
      eventName: body.event,
      actorId: body.actorId,
      payload: {
        module: body.module,
        uhid: body.uhid,
        refId: body.refId,
        details: body.details,
        occurredAt: body.occurredAt ?? new Date().toISOString(),
      },
      resourceType: body.module,
      resourceId: body.refId,
    });
  }
}
