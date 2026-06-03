import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { PublicBookingService } from './public-booking.service';

function clientKey(req: Request): string {
  const forwarded = req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

@ApiTags('public-booking')
@Controller('public/booking')
export class PublicBookingController {
  constructor(private readonly booking: PublicBookingService) {}

  @Get(':tenantSlug/slots')
  @ApiOperation({ summary: 'List available online booking slots (no auth)' })
  slots(
    @Req() req: Request,
    @Param('tenantSlug') tenantSlug: string,
    @Query('branch') branch: string,
    @Query('date') date: string,
  ) {
    if (!branch || !date) {
      throw new BadRequestException('Query params branch and date (YYYY-MM-DD) are required');
    }
    return this.booking.listSlots(tenantSlug, branch, date, clientKey(req));
  }

  @Post(':tenantSlug/appointments')
  @ApiOperation({ summary: 'Create a public online appointment (no auth)' })
  create(
    @Req() req: Request,
    @Param('tenantSlug') tenantSlug: string,
    @Body()
    body: {
      branchCode: string;
      serviceType: string;
      datetime: string;
      patientName: string;
      phone: string;
      email?: string;
    },
  ) {
    return this.booking.bookAppointment(tenantSlug, body, clientKey(req));
  }
}
