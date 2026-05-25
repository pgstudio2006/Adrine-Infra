import { Injectable } from '@nestjs/common';
import { evaluateDischargeBlockers } from '@adrine/hospital-operations';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrchestrationHealth(tenantId: string) {
    const activeAdmissions = await this.prisma.ipdAdmission.count({
      where: { tenantId, state: { notIn: ['discharged', 'cancelled'] } },
    });

    const orphanedBeds = await this.prisma.bed.count({
      where: {
        tenantId,
        state: 'occupied',
        currentAdmissionId: null,
      },
    });

    const admissionsWithoutBed = await this.prisma.ipdAdmission.count({
      where: {
        tenantId,
        state: { in: ['bed_assignment_pending', 'admitted', 'active_care'] },
        bedId: null,
      },
    });

    const pendingDischarges = await this.prisma.dischargeOrchestration.count({
      where: {
        tenantId,
        state: { notIn: ['discharged', 'cancelled'] },
      },
    });

    const stuckInsurance = await this.prisma.insuranceAuthorization.count({
      where: {
        tenantId,
        state: { in: ['submitted', 'under_review', 'documents_pending'] },
      },
    });

    return {
      status: orphanedBeds > 0 || admissionsWithoutBed > 0 ? 'degraded' : 'healthy',
      activeAdmissions,
      orphanedBeds,
      admissionsWithoutBed,
      pendingDischarges,
      stuckInsurance,
      checkedAt: new Date().toISOString(),
    };
  }

  async getAdmissionReconciliation(tenantId: string, admissionId: string) {
    const admission = await this.prisma.ipdAdmission.findFirst({
      where: { id: admissionId, tenantId },
      include: {
        bed: true,
        discharge: true,
        insurance: true,
        nursingTasks: true,
      },
    });

    if (!admission) {
      return { found: false };
    }

    const issues: string[] = [];

    if (
      ['admitted', 'active_care', 'discharge_pending'].includes(admission.state) &&
      !admission.bedId
    ) {
      issues.push('Active admission without assigned bed');
    }

    if (admission.bed && admission.bed.state === 'occupied' && admission.bed.currentAdmissionId !== admission.id) {
      issues.push('Bed occupancy mismatch with admission');
    }

    if (admission.state === 'discharge_pending' && !admission.discharge) {
      issues.push('Discharge pending but no discharge orchestration record');
    }

    let dischargeBlockers: ReturnType<typeof evaluateDischargeBlockers> = [];
    if (admission.discharge) {
      dischargeBlockers = evaluateDischargeBlockers({
        dischargeState: admission.discharge.state as never,
        nursingTasks: admission.nursingTasks.map((t) => ({ state: t.state as never })),
        insuranceState: admission.insurance?.state as never,
        insuranceMode: admission.insuranceMode as 'self' | 'corporate' | 'tpa',
        clinicalClearanceGranted: !!admission.discharge.clinicalClearedAt,
        pharmacyClearanceGranted: !!admission.discharge.pharmacyClearedAt,
        nursingClearanceGranted: !!admission.discharge.nursingClearedAt,
        insuranceClearanceGranted: !!admission.discharge.insuranceClearedAt,
      });
    }

    return {
      found: true,
      admissionId,
      state: admission.state,
      version: admission.version,
      issues,
      dischargeBlockers,
    };
  }
}
