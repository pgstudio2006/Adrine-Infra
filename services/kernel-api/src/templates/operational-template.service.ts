import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import {
  HospitalPlatformEvents,
  OPERATIONAL_TEMPLATE_PACKS,
} from '@adrine/hospital-operations';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperationalTemplateService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    for (const pack of OPERATIONAL_TEMPLATE_PACKS) {
      await this.prisma.operationalTemplatePack.upsert({
        where: { code: pack.code },
        create: {
          code: pack.code,
          label: pack.label,
          description: pack.description,
          packJson: pack,
        },
        update: { label: pack.label, packJson: pack },
      });
    }
  }

  catalog() {
    return this.prisma.operationalTemplatePack.findMany({ orderBy: { code: 'asc' } });
  }

  async instantiate(tenantId: string, branchId: string, packCode: string) {
    const pack = await this.prisma.operationalTemplatePack.findUnique({
      where: { code: packCode },
    });
    if (!pack) throw new NotFoundException('Template pack not found');

    const def = pack.packJson as { modules?: string[] };
    if (def.modules?.length) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: branchId, tenantId },
      });
      if (branch) {
        await this.prisma.branch.update({
          where: { id: branchId },
          data: {
            moduleFlags: Object.fromEntries(
              def.modules.map((m: string) => [m, true]),
            ) as Prisma.InputJsonValue,
          },
        });
      }
    }

    const inst = await this.prisma.templateInstantiation.create({
      data: { tenantId, branchId, packId: pack.id, status: 'completed' },
    });

    await this.prisma.platformEventOutbox.create({
      data: {
        tenantId,
        eventName: HospitalPlatformEvents.templates.instantiated,
        payload: { packCode, branchId, instantiationId: inst.id },
      },
    });
    return inst;
  }
}
