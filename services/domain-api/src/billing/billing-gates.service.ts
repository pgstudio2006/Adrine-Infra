import { BadRequestException, Injectable } from '@nestjs/common';
import { INSURANCE_APPROVED_STATES } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';
import {
  HIGH_COST_CHARGE_THRESHOLD_CENTS,
  INSURANCE_MODES_REQUIRING_PREAUTH,
} from './billing-dept-catalog';

@Injectable()
export class BillingGatesService {
  constructor(private readonly prisma: PrismaService) {}

  /** GAP-006 — encounter must be closed before billable invoice mutations. */
  async assertEncounterClosed(tenantId: string, encounterId: string | null | undefined): Promise<void> {
    if (!encounterId) return;
    const encounter = await this.prisma.encounter.findFirst({
      where: { id: encounterId, tenantId },
    });
    if (!encounter) {
      throw new BadRequestException('Linked encounter not found');
    }
    if (encounter.status !== 'closed') {
      throw new BadRequestException(
        'Encounter must be closed before billing (billing.require_encounter_close)',
      );
    }
  }

  /** GAP-006 — OPD visit must be in billing_pending (or completed for read-only) for settlement paths. */
  async assertOpdBillingReady(
    tenantId: string,
    opdVisitId: string,
    options?: { allowCompleted?: boolean },
  ): Promise<void> {
    const visit = await this.prisma.opdVisit.findFirst({
      where: { id: opdVisitId, tenantId },
    });
    if (!visit) throw new BadRequestException('OPD visit not found');
    const ok =
      visit.state === 'billing_pending' ||
      (options?.allowCompleted && visit.state === 'completed');
    if (!ok) {
      throw new BadRequestException(
        `OPD visit must be in billing_pending before invoice settlement (current: ${visit.state})`,
      );
    }
    if (visit.encounterId) {
      await this.assertEncounterClosed(tenantId, visit.encounterId);
    }
  }

  /** GAP-007 — insurance / TPA pre-auth for IPD and high-cost charges. */
  async assertInsurancePreauthForIpd(
    tenantId: string,
    admissionId: string,
    amountCents: number,
    insuranceMode?: string | null,
  ): Promise<void> {
    const mode = (insuranceMode ?? 'self').toLowerCase();
    if (!INSURANCE_MODES_REQUIRING_PREAUTH.has(mode)) return;

    const admission = await this.prisma.ipdAdmission.findFirst({
      where: { id: admissionId, tenantId },
      include: { insurance: true },
    });
    if (!admission) throw new BadRequestException('IPD admission not found');

    const auth = admission.insurance;
    if (!auth) {
      throw new BadRequestException(
        'Insurance pre-authorization required — start authorization on admission',
      );
    }

    const approved = INSURANCE_APPROVED_STATES.includes(
      auth.state as (typeof INSURANCE_APPROVED_STATES)[number],
    );
    if (!approved) {
      throw new BadRequestException(
        `Insurance authorization must be approved (current: ${auth.state})`,
      );
    }

    if (amountCents >= HIGH_COST_CHARGE_THRESHOLD_CENTS) {
      const approvedCap = auth.approvedCents ?? 0;
      if (approvedCap > 0 && amountCents > approvedCap) {
        throw new BadRequestException(
          `Charge exceeds approved pre-auth amount (₹${(approvedCap / 100).toFixed(2)})`,
        );
      }
    }
  }

  async resolveInsurancePreauthOk(
    tenantId: string,
    opts: {
      insuranceMode?: string | null;
      admissionId?: string | null;
      opdVisitId?: string | null;
    },
  ): Promise<boolean | undefined> {
    const mode = (opts.insuranceMode ?? 'self').toLowerCase();
    if (!INSURANCE_MODES_REQUIRING_PREAUTH.has(mode)) return undefined;

    if (opts.admissionId) {
      const auth = await this.prisma.insuranceAuthorization.findFirst({
        where: { tenantId, admissionId: opts.admissionId },
      });
      if (!auth) return false;
      return INSURANCE_APPROVED_STATES.includes(
        auth.state as (typeof INSURANCE_APPROVED_STATES)[number],
      );
    }

    if (opts.opdVisitId) {
      const visit = await this.prisma.opdVisit.findFirst({
        where: { id: opts.opdVisitId, tenantId },
      });
      if (!visit?.encounterId) return false;
      const auth = await this.prisma.insuranceAuthorization.findFirst({
        where: { tenantId, patientId: visit.patientId },
        orderBy: { updatedAt: 'desc' },
      });
      if (!auth) return false;
      return INSURANCE_APPROVED_STATES.includes(
        auth.state as (typeof INSURANCE_APPROVED_STATES)[number],
      );
    }

    return false;
  }
}
