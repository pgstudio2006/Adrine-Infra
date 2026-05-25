import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { KernelNotificationService } from './notification.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: KernelNotificationService) {}

  @Post('enqueue')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  enqueue(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      channel: string;
      template: string;
      recipient?: string;
      payload?: Record<string, unknown>;
    },
  ) {
    return this.notifications.enqueue({
      tenantId: tenantId ?? 'tenant_dev',
      channel: body.channel,
      template: body.template,
      recipient: body.recipient,
      payload: body.payload,
    });
  }
}