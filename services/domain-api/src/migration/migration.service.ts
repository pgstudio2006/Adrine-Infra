import { Injectable, NotFoundException } from '@nestjs/common';
import { HospitalPlatformEvents } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';

function parseCsv(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  return lines.map((line) => {
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === ',' && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
        continue;
      }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

@Injectable()
export class MigrationService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(
    tenantId: string,
    input: { type: string; branchId?: string; fileName?: string; csv?: string },
  ) {
    const job = await this.prisma.importJob.create({
      data: {
        tenantId,
        branchId: input.branchId,
        type: input.type,
        fileName: input.fileName,
        status: 'draft',
      },
    });
    if (input.csv) {
      const rows = parseCsv(input.csv);
      const header = rows[0];
      const dataRows = rows.slice(1);
      await this.prisma.importJobRow.createMany({
        data: dataRows.map((cells, idx) => ({
          jobId: job.id,
          rowIndex: idx + 1,
          rawData: Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])),
        })),
      });
      await this.prisma.importJob.update({
        where: { id: job.id },
        data: { rowCount: dataRows.length },
      });
    }
    await this.emit(tenantId, HospitalPlatformEvents.migration.jobCreated, { jobId: job.id });
    return job;
  }

  async preview(tenantId: string, jobId: string) {
    const job = await this.getJob(tenantId, jobId);
    const rows = await this.prisma.importJobRow.findMany({
      where: { jobId },
      take: 100,
      orderBy: { rowIndex: 'asc' },
    });
    const conflicts = rows.filter((r) => {
      const data = r.rawData as Record<string, string>;
      return !data.name && !data.fullName && !data.sku;
    });
    return { job, sampleRows: rows, conflictCount: conflicts.length };
  }

  async execute(tenantId: string, jobId: string) {
    const job = await this.getJob(tenantId, jobId);
    const rows = await this.prisma.importJobRow.findMany({ where: { jobId } });
    let errors = 0;
    for (const row of rows) {
      try {
        const data = row.rawData as Record<string, string>;
        if (job.type === 'patients' && (data.name || data.fullName)) {
          const patient = await this.prisma.patient.create({
            data: {
              tenantId,
              fullName: data.name ?? data.fullName ?? 'Unknown',
              mrn: data.mrn ?? data.uhid ?? `IMP-${row.rowIndex}`,
            },
          });
          await this.prisma.importJobRow.update({
            where: { id: row.id },
            data: { status: 'imported', entityId: patient.id },
          });
        } else {
          await this.prisma.importJobRow.update({
            where: { id: row.id },
            data: { status: 'skipped' },
          });
        }
      } catch (e) {
        errors += 1;
        await this.prisma.importJobRow.update({
          where: { id: row.id },
          data: {
            status: 'error',
            errors: { message: e instanceof Error ? e.message : 'unknown' },
          },
        });
      }
    }
    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'completed', errorCount: errors },
    });
    await this.emit(tenantId, HospitalPlatformEvents.migration.jobExecuted, { jobId });
    return { jobId, imported: rows.length - errors, errors };
  }

  async rollback(tenantId: string, jobId: string) {
    const job = await this.getJob(tenantId, jobId);
    const rows = await this.prisma.importJobRow.findMany({
      where: { jobId, status: 'imported', entityId: { not: null } },
    });
    for (const row of rows) {
      if (job.type === 'patients' && row.entityId) {
        await this.prisma.patient.deleteMany({ where: { id: row.entityId, tenantId } });
      }
      await this.prisma.importJobRow.update({
        where: { id: row.id },
        data: { status: 'rolled_back', entityId: null },
      });
    }
    await this.prisma.importJob.update({ where: { id: jobId }, data: { status: 'rolled_back' } });
    await this.emit(tenantId, HospitalPlatformEvents.migration.jobRolledBack, { jobId });
    return { jobId, rolledBack: rows.length };
  }

  private async getJob(tenantId: string, jobId: string) {
    const job = await this.prisma.importJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new NotFoundException('Import job not found');
    return job;
  }

  private async emit(tenantId: string, eventName: string, payload: object) {
    await this.prisma.platformEvent.create({
      data: { tenantId, eventName, payload },
    });
  }
}
