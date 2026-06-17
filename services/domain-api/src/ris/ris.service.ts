import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlatformEventService } from '../events/platform-event.service';
import { RealtimeService } from '../realtime/realtime.service';

// ═══════════════════════════════════════════
// RIS Study State Machine
// ═══════════════════════════════════════════

type StudyState =
  | 'ordered'
  | 'scheduled'
  | 'arrived'
  | 'in_progress'
  | 'imaging_complete'
  | 'awaiting_report'
  | 'report_in_progress'
  | 'report_ready'
  | 'finalized'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

const STUDY_TRANSITIONS: Record<string, { from: StudyState[]; to: StudyState; actorRoles: string[] }> = {
  schedule_study:        { from: ['ordered'], to: 'scheduled', actorRoles: ['receptionist', 'admin'] },
  patient_arrived:       { from: ['scheduled'], to: 'arrived', actorRoles: ['receptionist', 'technician'] },
  start_scan:            { from: ['arrived', 'scheduled'], to: 'in_progress', actorRoles: ['technician'] },
  complete_scan:         { from: ['in_progress'], to: 'imaging_complete', actorRoles: ['technician'] },
  submit_to_report:      { from: ['imaging_complete'], to: 'awaiting_report', actorRoles: ['technician', 'system'] },
  start_report:          { from: ['awaiting_report'], to: 'report_in_progress', actorRoles: ['radiologist'] },
  save_draft:            { from: ['report_in_progress'], to: 'report_in_progress', actorRoles: ['radiologist'] },
  finalize_report:       { from: ['report_in_progress', 'awaiting_report'], to: 'finalized', actorRoles: ['radiologist'] },
  dispatch_report:       { from: ['finalized'], to: 'dispatched', actorRoles: ['system', 'receptionist'] },
  complete_study:        { from: ['dispatched', 'finalized'], to: 'completed', actorRoles: ['system', 'receptionist'] },
  cancel_study:          { from: ['ordered', 'scheduled', 'arrived'], to: 'cancelled', actorRoles: ['doctor', 'admin', 'receptionist'] },
};

function canTransition(currentState: string, action: string): { ok: boolean; to?: StudyState; reason?: string } {
  const transition = STUDY_TRANSITIONS[action];
  if (!transition) return { ok: false, reason: `Unknown action: ${action}` };
  if (!transition.from.includes(currentState as StudyState)) {
    return { ok: false, reason: `Cannot ${action} from state ${currentState}` };
  }
  return { ok: true, to: transition.to };
}

function canActorAct(actorRole: string, action: string): boolean {
  const transition = STUDY_TRANSITIONS[action];
  if (!transition) return false;
  return transition.actorRoles.includes(actorRole);
}

@Injectable()
export class RisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: PlatformEventService,
    private readonly realtime: RealtimeService,
  ) {}

  // ═══════════════════════════════════════════
  // PATIENTS
  // ═══════════════════════════════════════════

  async createPatient(tenantId: string, branchId: string, dto: any) {
    const uhid = dto.uhid || `UH-${Date.now().toString(36).toUpperCase()}`;
    return this.prisma.risPatient.create({
      data: {
        tenantId,
        branchId,
        uhid,
        fullName: dto.fullName,
        age: dto.age,
        gender: dto.gender,
        dob: dto.dob ? new Date(dto.dob) : null,
        mobile: dto.mobile,
        email: dto.email,
        address: dto.address,
        referringDoctor: dto.referringDoctor,
        department: dto.department,
        clinicalNotes: dto.clinicalNotes,
        symptoms: dto.symptoms,
      },
    });
  }

  async searchPatients(tenantId: string, query: string, take = 20) {
    if (!query || query.length < 2) return [];
    return this.prisma.risPatient.findMany({
      where: {
        tenantId,
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { uhid: { contains: query, mode: 'insensitive' } },
          { mobile: { contains: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async getPatient(tenantId: string, id: string) {
    const patient = await this.prisma.risPatient.findFirst({ where: { id, tenantId } });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async getPatientByUhid(tenantId: string, uhid: string) {
    return this.prisma.risPatient.findFirst({ where: { uhid, tenantId } });
  }

  // ═══════════════════════════════════════════
  // STUDIES
  // ═══════════════════════════════════════════

  async createStudy(tenantId: string, branchId: string, dto: any) {
    const orderId = dto.orderId || `ORD-${Date.now().toString(36).toUpperCase()}`;
    const study = await this.prisma.risStudy.create({
      data: {
        tenantId,
        branchId,
        patientId: dto.patientId,
        orderId,
        procedureId: dto.procedureId,
        modalityId: dto.modalityId,
        modality: dto.modality,
        study: dto.study,
        bodyPart: dto.bodyPart,
        priority: dto.priority || 'Routine',
        clinicalHistory: dto.clinicalHistory,
        referringDoctor: dto.referringDoctor,
        amountCents: dto.amountCents || 0,
        state: 'ordered',
      },
    });

    await this.prisma.risStudyTransition.create({
      data: {
        tenantId,
        studyId: study.id,
        action: 'create_order',
        fromState: '',
        toState: 'ordered',
        actorId: dto.actorId,
        actorRole: dto.actorRole,
      },
    });

    return study;
  }

  async transitionStudy(
    tenantId: string,
    studyId: string,
    action: string,
    actorId?: string,
    actorRole?: string,
    payload?: Record<string, any>,
  ) {
    const study = await this.prisma.risStudy.findFirst({ where: { id: studyId, tenantId } });
    if (!study) throw new NotFoundException('Study not found');

    if (actorRole && !canActorAct(actorRole, action)) {
      throw new BadRequestException(`Role ${actorRole} cannot perform ${action}`);
    }

    const result = canTransition(study.state, action);
    if (!result.ok) throw new BadRequestException(result.reason);

    const patches: Record<string, any> = {
      state: result.to,
      previousState: study.state,
      version: { increment: 1 },
    };

    // Auto-set timestamps based on state
    if (result.to === 'scheduled') patches.scheduledAt = new Date();
    if (result.to === 'arrived') patches.arrivedAt = new Date();
    if (result.to === 'in_progress') patches.imagingStartedAt = new Date();
    if (result.to === 'imaging_complete') patches.imagingCompletedAt = new Date();
    if (result.to === 'awaiting_report') patches.imagingCompletedAt = patches.imagingCompletedAt || new Date();
    if (result.to === 'report_in_progress') patches.reportStartedAt = new Date();
    if (result.to === 'finalized') { patches.reportCompletedAt = new Date(); patches.finalizedAt = new Date(); }
    if (result.to === 'dispatched') patches.dispatchedAt = new Date();
    if (result.to === 'completed') patches.completedAt = new Date();

    if (action === 'cancel_study') patches.completedAt = new Date();
    if (payload?.technicianNotes) patches.technicianNotes = payload.technicianNotes;
    if (payload?.machineId) patches.machineId = payload.machineId;
    if (payload?.isCritical !== undefined) patches.isCritical = payload.isCritical;

    const [updated] = await this.prisma.$transaction([
      this.prisma.risStudy.update({ where: { id: studyId }, data: patches }),
      this.prisma.risStudyTransition.create({
        data: {
          tenantId,
          studyId,
          action,
          fromState: study.state,
          toState: result.to!,
          actorId,
          actorRole,
          reason: payload?.reason,
          metadata: payload,
        },
      }),
    ]);

    this.realtime.emit(`${tenantId}:${branchId}`, {
      type: 'ris.study.transition',
      studyId,
      state: result.to,
    });

    return updated;
  }

  async getStudy(tenantId: string, studyId: string) {
    const study = await this.prisma.risStudy.findFirst({
      where: { id: studyId, tenantId },
      include: {
        patient: true,
        transitions: { orderBy: { createdAt: 'desc' }, take: 20 },
        reports: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!study) throw new NotFoundException('Study not found');
    return study;
  }

  async listStudies(tenantId: string, branchId: string, filters?: { state?: string; modality?: string; date?: string; take?: number }) {
    const where: any = { tenantId, branchId };
    if (filters?.state) where.state = filters.state;
    if (filters?.modality) where.modality = filters.modality;
    return this.prisma.risStudy.findMany({
      where,
      include: { patient: { select: { id: true, fullName: true, uhid: true, mobile: true } } },
      orderBy: { createdAt: 'desc' },
      take: filters?.take || 100,
    });
  }

  async getWorklist(tenantId: string, branchId: string, role: string) {
    const stateFilter = role === 'technician'
      ? ['scheduled', 'arrived', 'in_progress']
      : role === 'radiologist'
        ? ['imaging_complete', 'awaiting_report', 'report_in_progress']
        : ['ordered', 'scheduled', 'arrived', 'in_progress', 'imaging_complete', 'awaiting_report'];

    return this.prisma.risStudy.findMany({
      where: {
        tenantId,
        branchId,
        state: { in: stateFilter },
      },
      include: { patient: { select: { id: true, fullName: true, uhid: true, mobile: true } } },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  // ═══════════════════════════════════════════
  // REPORTS
  // ═══════════════════════════════════════════

  async createOrUpdateReport(tenantId: string, studyId: string, dto: any) {
    const existing = await this.prisma.risReport.findFirst({ where: { studyId, tenantId } });
    if (existing) {
      return this.prisma.risReport.update({
        where: { id: existing.id },
        data: {
          radiologist: dto.radiologist,
          technique: dto.technique,
          clinicalHistory: dto.clinicalHistory,
          comparison: dto.comparison,
          contrastUsed: dto.contrastUsed,
          findings: dto.findings,
          impression: dto.impression,
          conclusion: dto.conclusion,
          recommendation: dto.recommendation,
          isCritical: dto.isCritical || false,
          version: { increment: 1 },
        },
      });
    }

    const study = await this.prisma.risStudy.findFirst({ where: { id: studyId, tenantId } });
    if (!study) throw new NotFoundException('Study not found');

    return this.prisma.risReport.create({
      data: {
        tenantId,
        studyId,
        patientId: study.patientId,
        templateId: dto.templateId,
        radiologist: dto.radiologist,
        technique: dto.technique,
        clinicalHistory: dto.clinicalHistory,
        comparison: dto.comparison,
        contrastUsed: dto.contrastUsed,
        findings: dto.findings,
        impression: dto.impression,
        conclusion: dto.conclusion,
        recommendation: dto.recommendation,
        isCritical: dto.isCritical || false,
        status: 'draft',
      },
    });
  }

  async finalizeReport(tenantId: string, studyId: string, radiologist: string) {
    const report = await this.prisma.risReport.findFirst({ where: { studyId, tenantId } });
    if (!report) throw new NotFoundException('Report not found');

    const updated = await this.prisma.risReport.update({
      where: { id: report.id },
      data: {
        status: 'finalized',
        signedAt: new Date(),
        signedBy: radiologist,
        lockedAt: new Date(),
      },
    });

    await this.transitionStudy(tenantId, studyId, 'finalize_report', radiologist, 'radiologist');
    return updated;
  }

  async getReport(tenantId: string, studyId: string) {
    return this.prisma.risReport.findFirst({ where: { studyId, tenantId } });
  }

  async listReports(tenantId: string, branchId: string, filters?: { status?: string; modality?: string; take?: number }) {
    const where: any = { tenantId, study: { branchId } };
    if (filters?.status) where.status = filters.status;
    return this.prisma.risReport.findMany({
      where,
      include: {
        study: { select: { id: true, orderId: true, modality: true, study: true, state: true } },
        patient: { select: { id: true, fullName: true, uhid: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.take || 100,
    });
  }

  // ═══════════════════════════════════════════
  // TEMPLATES
  // ═══════════════════════════════════════════

  async createTemplate(tenantId: string, dto: any) {
    return this.prisma.risReportTemplate.create({
      data: { tenantId, ...dto },
    });
  }

  async listTemplates(tenantId: string, modality?: string, bodyRegion?: string) {
    const where: any = { tenantId, isActive: true };
    if (modality) where.modality = modality;
    if (bodyRegion) where.bodyRegion = bodyRegion;
    return this.prisma.risReportTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async updateTemplate(tenantId: string, id: string, dto: any) {
    return this.prisma.risReportTemplate.updateMany({
      where: { id, tenantId },
      data: dto,
    });
  }

  // ═══════════════════════════════════════════
  // APPOINTMENTS
  // ═══════════════════════════════════════════

  async createAppointment(tenantId: string, branchId: string, dto: any) {
    return this.prisma.risAppointment.create({
      data: {
        tenantId,
        branchId,
        patientId: dto.patientId,
        studyId: dto.studyId,
        modality: dto.modality,
        study: dto.study,
        scheduledAt: new Date(dto.scheduledAt),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        machineId: dto.machineId,
        room: dto.room,
        technician: dto.technician,
        notes: dto.notes,
      },
    });
  }

  async listAppointments(tenantId: string, branchId: string, date?: string, modality?: string) {
    const where: any = { tenantId, branchId };
    if (modality) where.modality = modality;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.scheduledAt = { gte: start, lt: end };
    }
    return this.prisma.risAppointment.findMany({
      where,
      include: { patient: { select: { fullName: true, uhid: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  // ═══════════════════════════════════════════
  // BILLING
  // ═══════════════════════════════════════════

  async createInvoice(tenantId: string, branchId: string, dto: any) {
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    return this.prisma.risInvoice.create({
      data: {
        tenantId,
        branchId,
        patientId: dto.patientId,
        invoiceNumber,
        lineItems: dto.lineItems || [],
        subtotalCents: dto.subtotalCents || 0,
        discountCents: dto.discountCents || 0,
        taxCents: dto.taxCents || 0,
        totalCents: dto.totalCents || 0,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
      },
    });
  }

  async listInvoices(tenantId: string, branchId: string) {
    return this.prisma.risInvoice.findMany({
      where: { tenantId, branchId },
      include: { patient: { select: { fullName: true, uhid: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordPayment(tenantId: string, invoiceId: string, dto: any) {
    const invoice = await this.prisma.risInvoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const payment = await this.prisma.risPayment.create({
      data: { tenantId, invoiceId, method: dto.method, amountCents: dto.amountCents, reference: dto.reference },
    });

    const newPaid = invoice.paidCents + dto.amountCents;
    const newStatus = newPaid >= invoice.totalCents ? 'paid' : newPaid > 0 ? 'partial' : 'pending';

    await this.prisma.risInvoice.update({
      where: { id: invoiceId },
      data: { paidCents: newPaid, status: newStatus, paymentMethod: dto.method },
    });

    return payment;
  }

  // ═══════════════════════════════════════════
  // DISPATCH
  // ═══════════════════════════════════════════

  async dispatchReport(tenantId: string, studyId: string, mobile: string, patientName: string) {
    return this.prisma.risDispatchLog.create({
      data: {
        tenantId,
        studyId,
        patientName,
        mobile,
        channel: 'whatsapp',
        status: 'queued',
      },
    });
  }

  async getDispatchLogs(tenantId: string, studyId?: string) {
    const where: any = { tenantId };
    if (studyId) where.studyId = studyId;
    return this.prisma.risDispatchLog.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  // ═══════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════

  async getDashboardStats(tenantId: string, branchId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayStudies, pendingReports, completedToday, activeStudies, revenueToday] = await Promise.all([
      this.prisma.risStudy.count({ where: { tenantId, branchId, createdAt: { gte: todayStart } } }),
      this.prisma.risStudy.count({ where: { tenantId, branchId, state: { in: ['awaiting_report', 'report_in_progress'] } } }),
      this.prisma.risStudy.count({ where: { tenantId, branchId, state: { in: ['finalized', 'completed'] }, completedAt: { gte: todayStart } } }),
      this.prisma.risStudy.count({ where: { tenantId, branchId, state: { in: ['ordered', 'scheduled', 'arrived', 'in_progress', 'imaging_complete'] } } }),
      this.prisma.risInvoice.aggregate({ where: { tenantId, branchId, createdAt: { gte: todayStart } }, _sum: { totalCents: true } }),
    ]);

    const modalityStats = await this.prisma.risStudy.groupBy({
      by: ['modality'],
      where: { tenantId, branchId, createdAt: { gte: todayStart } },
      _count: true,
    });

    return {
      todayStudies,
      pendingReports,
      completedToday,
      activeStudies,
      revenueToday: revenueToday._sum.totalCents || 0,
      modalityBreakdown: modalityStats.map(m => ({ modality: m.modality, count: m._count })),
    };
  }

  async getRevenueAnalytics(tenantId: string, branchId: string) {
    const invoices = await this.prisma.risInvoice.findMany({
      where: { tenantId, branchId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const totalRevenue = invoices.reduce((sum, i) => sum + i.totalCents, 0);
    const totalCollected = invoices.reduce((sum, i) => sum + i.paidCents, 0);
    const outstanding = totalRevenue - totalCollected;

    return { totalRevenue, totalCollected, outstanding, invoiceCount: invoices.length };
  }

  async getMachineUtilization(tenantId: string, branchId: string) {
    return this.prisma.risMachine.findMany({
      where: { tenantId, branchId },
      include: { modality: true },
    });
  }
}
