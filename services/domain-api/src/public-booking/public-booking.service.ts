import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { EventBusService } from '../events/event-bus.service';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { NAVAYU_BRANCH_CODES, resolveTenantIdFromSlug } from './tenant-slugs';

const SLOT_MINUTES = 30;
const DAY_START_HOUR = 9;
const DAY_END_HOUR = 17;

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

@Injectable()
export class PublicBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduling: SchedulingService,
    private readonly events: EventBusService,
  ) {}

  assertRateLimit(clientKey: string) {
    const now = Date.now();
    const bucket = rateBuckets.get(clientKey);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(clientKey, { count: 1, resetAt: now + RATE_WINDOW_MS });
      return;
    }
    bucket.count += 1;
    if (bucket.count > RATE_LIMIT) {
      throw new HttpException('Rate limit exceeded — try again shortly', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  resolveTenant(slug: string) {
    const tenantId = resolveTenantIdFromSlug(slug);
    if (!tenantId) {
      throw new NotFoundException(`Unknown booking tenant slug: ${slug}`);
    }
    return tenantId;
  }

  getBookingConfig(tenantSlug: string) {
    const tenantId = this.resolveTenant(tenantSlug);
    const config = loadClientPublicBookingConfig(tenantSlug);
    if (!config) {
      throw new NotFoundException(`No public booking config for slug: ${tenantSlug}`);
    }
    return { tenantId, ...config };
  }

  async listSlots(tenantSlug: string, branchCode: string, date: string, clientKey: string) {
    this.assertRateLimit(clientKey);
    const tenantId = this.resolveTenant(tenantSlug);
    this.assertBranchCode(branchCode);

    const day = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(day.getTime())) {
      throw new BadRequestException('Invalid date — use YYYY-MM-DD');
    }

    const dayEnd = new Date(day);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const resourcePrefix = `[${branchCode}]`;
    const booked = await this.prisma.appointment.findMany({
      where: {
        tenantId,
        startAt: { gte: day, lt: dayEnd },
        resourceLabel: { startsWith: resourcePrefix },
        status: { notIn: ['cancelled', 'no_show'] },
      },
      select: { startAt: true, endAt: true },
    });

    const bookedStarts = new Set(booked.map((b) => b.startAt.toISOString()));

    const slots: Array<{ startAt: string; endAt: string; available: boolean }> = [];
    const cursor = new Date(day);
    cursor.setUTCHours(DAY_START_HOUR, 0, 0, 0);

    const end = new Date(day);
    end.setUTCHours(DAY_END_HOUR, 0, 0, 0);

    while (cursor < end) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor);
      slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + SLOT_MINUTES);

      const isoStart = slotStart.toISOString();
      slots.push({
        startAt: isoStart,
        endAt: slotEnd.toISOString(),
        available: !bookedStarts.has(isoStart),
      });

      cursor.setUTCMinutes(cursor.getUTCMinutes() + SLOT_MINUTES);
    }

    return {
      tenantId,
      branchCode,
      date,
      slotMinutes: SLOT_MINUTES,
      slots: slots.filter((s) => s.available),
    };
  }

  async bookAppointment(
    tenantSlug: string,
    body: {
      branchCode: string;
      serviceType: string;
      datetime: string;
      patientName: string;
      phone: string;
      email?: string;
    },
    clientKey: string,
  ) {
    this.assertRateLimit(clientKey);
    const tenantId = this.resolveTenant(tenantSlug);
    this.assertBranchCode(body.branchCode);

    const startAt = new Date(body.datetime);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Invalid datetime — use ISO-8601');
    }

    const endAt = new Date(startAt);
    endAt.setMinutes(endAt.getMinutes() + SLOT_MINUTES);

    const phone = body.phone.trim();
    const patientName = body.patientName.trim();
    const serviceType = body.serviceType.trim();
    if (!phone || !patientName) {
      throw new BadRequestException('patientName and phone are required');
    }
    if (!serviceType) {
      throw new BadRequestException('serviceType is required');
    }

    const bookingConfig = loadClientPublicBookingConfig(tenantSlug);
    if (bookingConfig) {
      const allowed = (bookingConfig.serviceTypes as Array<{ label: string; branchCodes: string[] }>).filter(
        (s) => s.branchCodes.includes(body.branchCode),
      );
      if (allowed.length > 0 && !allowed.some((s) => s.label === serviceType)) {
        throw new BadRequestException('Invalid serviceType for this branch');
      }
    }

    let patient = await this.prisma.patient.findFirst({
      where: {
        tenantId,
        mrn: phone,
      },
    });

    if (!patient) {
      patient = await this.prisma.patient.create({
        data: {
          tenantId,
          fullName: patientName,
          mrn: phone,
        },
      });
      this.events.emit('adrine.patient.profile.created', tenantId, { patientId: patient.id });
    } else if (patient.fullName !== patientName) {
      patient = await this.prisma.patient.update({
        where: { id: patient.id },
        data: { fullName: patientName },
      });
    }

    const resourceLabel = `[${body.branchCode}] ${serviceType}`;

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        tenantId,
        startAt,
        resourceLabel: { startsWith: `[${body.branchCode}]` },
        status: { notIn: ['cancelled', 'no_show'] },
      },
    });
    if (conflict) {
      throw new BadRequestException('Selected slot is no longer available');
    }

    const appointment = await this.scheduling.book(tenantId, {
      patientId: patient.id,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      resourceLabel,
      status: 'scheduled',
    });

    this.events.emit('adrine.public_booking.created', tenantId, {
      appointmentId: appointment.id,
      branchCode: body.branchCode,
      phone,
      email: body.email,
    });

    return {
      appointmentId: appointment.id,
      patientId: patient.id,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      resourceLabel: appointment.resourceLabel,
      status: appointment.status,
    };
  }

  private assertBranchCode(branchCode: string) {
    if (!NAVAYU_BRANCH_CODES.has(branchCode)) {
      throw new BadRequestException(
        `Invalid branchCode — use one of: ${[...NAVAYU_BRANCH_CODES].join(', ')}`,
      );
    }
  }
}

function repoRoot(): string {
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'clients', 'navayu', 'public-booking-config.json'))) {
    return cwd;
  }
  if (existsSync(join(cwd, '..', '..', 'clients', 'navayu', 'public-booking-config.json'))) {
    return join(cwd, '..', '..');
  }
  return cwd;
}

function loadClientPublicBookingConfig(slug: string): Record<string, unknown> | undefined {
  if (slug.toLowerCase() !== 'navayu') return undefined;
  const path = join(repoRoot(), 'clients', 'navayu', 'public-booking-config.json');
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}
