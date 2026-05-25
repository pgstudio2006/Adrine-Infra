import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { OperationalCommandService } from '../command/operational-command.service';
import { RealtimeService } from './realtime.service';

@ApiTags('realtime')
@ApiSecurity('tenant')
@Controller('realtime')
export class RealtimeController {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly command: OperationalCommandService,
  ) {}

  /** SSE stream — tenant-scoped via middleware; branchId query required. */
  @Get('stream')
  async stream(
    @Req() req: Request,
    @Res() res: Response,
    @Query('branchId') branchId: string,
    @Query('lite') lite?: string,
  ) {
    const tenantId = (req as RequestWithTenant).tenantId!;
    const bid = branchId || 'branch_main';
    const channel = this.realtime.channelKey(tenantId, bid);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const snapshot = await this.command.buildSnapshot(tenantId, bid, lite === 'true');
    send('snapshot', snapshot);

    const unsub = this.realtime.subscribe(channel, (raw) => {
      try {
        send('delta', JSON.parse(raw));
      } catch {
        send('delta', { raw });
      }
    });

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsub();
      res.end();
    });
  }
}
