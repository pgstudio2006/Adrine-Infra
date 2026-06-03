import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';

const COUNSELLOR_MSK_STATES = [
  'protocol_mapped',
  'counselling',
  'package_planned',
] as const;

function loadProtocolCatalog(): Record<string, unknown> {
  const candidates = [
    join(process.cwd(), 'clients', 'navayu', 'protocols.json'),
    join(process.cwd(), '..', '..', 'clients', 'navayu', 'protocols.json'),
    join(__dirname, '..', '..', '..', '..', 'clients', 'navayu', 'protocols.json'),
  ];
  for (const path of candidates) {
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    } catch {
      /* try next */
    }
  }
  return { version: 'v0', protocols: [], packageTiers: [] };
}

@Injectable()
export class NavayuService {
  private catalogCache: Record<string, unknown> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  getProtocols() {
    if (!this.catalogCache) {
      this.catalogCache = loadProtocolCatalog();
    }
    return {
      generatedAt: new Date().toISOString(),
      ...this.catalogCache,
    };
  }

  async listCounsellorQueue(tenantId: string, branchId: string) {
    const visits = await this.prisma.opdVisit.findMany({
      where: {
        tenantId,
        branchId,
        state: { notIn: ['cancelled', 'no_show'] },
      },
      include: { patient: true },
      orderBy: { updatedAt: 'desc' },
      take: 80,
    });

    const catalog = this.getProtocols() as {
      protocols?: Array<{ id: string; label: string }>;
    };

    const items = visits
      .map((visit) => {
        const meta =
          visit.metadata && typeof visit.metadata === 'object' && !Array.isArray(visit.metadata)
            ? (visit.metadata as Record<string, unknown>)
            : {};
        const mskState = meta.mskLifecycleState;
        if (
          typeof mskState !== 'string' ||
          !COUNSELLOR_MSK_STATES.includes(mskState as (typeof COUNSELLOR_MSK_STATES)[number])
        ) {
          return null;
        }
        const navayu =
          meta.navayu && typeof meta.navayu === 'object' && !Array.isArray(meta.navayu)
            ? (meta.navayu as Record<string, unknown>)
            : {};
        const protocolMap = navayu.protocolMap as
          | { protocolId?: string; stageId?: string }
          | undefined;
        const counselling = navayu.counselling as { tierLabel?: string } | undefined;
        const protocolLabel = protocolMap?.protocolId
          ? catalog.protocols?.find((p) => p.id === protocolMap.protocolId)?.label
          : undefined;

        return {
          visitId: visit.id,
          patientId: visit.patientId,
          patientName: visit.patient?.fullName ?? 'Patient',
          mrn: visit.patient?.mrn ?? null,
          department: visit.department,
          assignedDoctor: visit.assignedDoctor,
          mskLifecycleState: mskState,
          protocolLabel,
          tierLabel: counselling?.tierLabel,
          createdAt: visit.createdAt.toISOString(),
        };
      })
      .filter(Boolean);

    return {
      branchId,
      generatedAt: new Date().toISOString(),
      items,
    };
  }
}
