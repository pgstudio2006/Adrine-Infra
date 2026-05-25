import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { AuditService } from './audit.service';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Post('events')
  create(@Req() req: RequestWithTenant, @Body() body: { action: string; resource: string; metadata?: object }) {
    return this.audit.append({
      tenantId: req.tenantId!,
      actorId: (req as Request & { user?: { sub: string } }).user?.sub,
      action: body.action,
      resource: body.resource,
      metadata: body.metadata,
    });
  }

  @Get('recent')
  recent(@Req() req: RequestWithTenant) {
    return this.audit.listRecent(req.tenantId!);
  }
}
