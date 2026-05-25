import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { PlatformNotificationService } from './notification.service';

@ApiTags('notifications')
@Controller('notifications')
export class PlatformNotificationController {
  constructor(private readonly notifications: PlatformNotificationService) {}

  @Post('send')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  send(
    @Headers('x-tenant-id') tenantId: string,
    @Body()
    body: {
      channel: string;
      recipient: string;
      templateCode?: string;
      payload?: Record<string, unknown>;
    },
  ) {
    return this.notifications.send(tenantId ?? 'tenant_dev', body);
  }

  @Get('outbox')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  outbox(@Headers('x-tenant-id') tenantId: string, @Query('status') status?: string) {
    return this.notifications.listOutbox(tenantId ?? 'tenant_dev', status);
  }

  @Get('templates')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  templates(@Headers('x-tenant-id') tenantId: string) {
    return this.notifications.listTemplates(tenantId ?? 'tenant_dev');
  }

  @Post('templates')
  @ApiHeader({ name: 'x-tenant-id', required: true })
  upsertTemplate(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: { code: string; channel: string; subject?: string; body: string },
  ) {
    return this.notifications.upsertTemplate(tenantId ?? 'tenant_dev', body);
  }
}
