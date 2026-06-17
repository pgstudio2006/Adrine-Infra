import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { RisService } from './ris.service';

@ApiTags('ris')
@ApiSecurity('tenant')
@Controller('ris')
export class RisController {
  constructor(private readonly ris: RisService) {}

  private tenant(req: Request): string {
    return (req as RequestWithTenant).tenantId!;
  }

  // ─── Patients ──────────────────────────────

  @Post('patients')
  createPatient(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body() body: any,
  ) {
    return this.ris.createPatient(this.tenant(req), branchId ?? 'branch_main', body);
  }

  @Get('patients/search')
  searchPatients(@Req() req: Request, @Query('q') q: string, @Query('take') take?: string) {
    return this.ris.searchPatients(this.tenant(req), q, take ? parseInt(take) : 20);
  }

  @Get('patients/:id')
  getPatient(@Req() req: Request, @Param('id') id: string) {
    return this.ris.getPatient(this.tenant(req), id);
  }

  // ─── Studies ───────────────────────────────

  @Post('studies')
  createStudy(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body() body: any,
  ) {
    return this.ris.createStudy(this.tenant(req), branchId ?? 'branch_main', body);
  }

  @Get('studies')
  listStudies(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('state') state?: string,
    @Query('modality') modality?: string,
    @Query('date') date?: string,
    @Query('take') take?: string,
  ) {
    return this.ris.listStudies(this.tenant(req), branchId ?? 'branch_main', {
      state, modality, date, take: take ? parseInt(take) : 100,
    });
  }

  @Get('worklist')
  getWorklist(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Headers('x-user-role') role: string | undefined,
  ) {
    return this.ris.getWorklist(this.tenant(req), branchId ?? 'branch_main', role ?? 'technician');
  }

  @Get('studies/:id')
  getStudy(@Req() req: Request, @Param('id') id: string) {
    return this.ris.getStudy(this.tenant(req), id);
  }

  @Post('studies/:id/transition')
  transitionStudy(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { action: string; actorId?: string; actorRole?: string; payload?: any },
  ) {
    return this.ris.transitionStudy(this.tenant(req), id, body.action, body.actorId, body.actorRole, body.payload);
  }

  // ─── Reports ───────────────────────────────

  @Post('studies/:studyId/report')
  saveReport(@Req() req: Request, @Param('studyId') studyId: string, @Body() body: any) {
    return this.ris.createOrUpdateReport(this.tenant(req), studyId, body);
  }

  @Post('studies/:studyId/report/finalize')
  finalizeReport(
    @Req() req: Request,
    @Param('studyId') studyId: string,
    @Body() body: { radiologist: string },
  ) {
    return this.ris.finalizeReport(this.tenant(req), studyId, body.radiologist);
  }

  @Get('studies/:studyId/report')
  getReport(@Req() req: Request, @Param('studyId') studyId: string) {
    return this.ris.getReport(this.tenant(req), studyId);
  }

  @Get('reports')
  listReports(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('status') status?: string,
    @Query('modality') modality?: string,
    @Query('take') take?: string,
  ) {
    return this.ris.listReports(this.tenant(req), branchId ?? 'branch_main', {
      status, modality, take: take ? parseInt(take) : 100,
    });
  }

  // ─── Templates ─────────────────────────────

  @Post('templates')
  createTemplate(@Req() req: Request, @Body() body: any) {
    return this.ris.createTemplate(this.tenant(req), body);
  }

  @Get('templates')
  listTemplates(
    @Req() req: Request,
    @Query('modality') modality?: string,
    @Query('bodyRegion') bodyRegion?: string,
  ) {
    return this.ris.listTemplates(this.tenant(req), modality, bodyRegion);
  }

  @Post('templates/:id')
  updateTemplate(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.ris.updateTemplate(this.tenant(req), id, body);
  }

  // ─── Appointments ──────────────────────────

  @Post('appointments')
  createAppointment(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body() body: any,
  ) {
    return this.ris.createAppointment(this.tenant(req), branchId ?? 'branch_main', body);
  }

  @Get('appointments')
  listAppointments(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Query('date') date?: string,
    @Query('modality') modality?: string,
  ) {
    return this.ris.listAppointments(this.tenant(req), branchId ?? 'branch_main', date, modality);
  }

  // ─── Billing ───────────────────────────────

  @Post('invoices')
  createInvoice(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body() body: any,
  ) {
    return this.ris.createInvoice(this.tenant(req), branchId ?? 'branch_main', body);
  }

  @Get('invoices')
  listInvoices(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
  ) {
    return this.ris.listInvoices(this.tenant(req), branchId ?? 'branch_main');
  }

  @Post('invoices/:id/pay')
  recordPayment(@Req() req: Request, @Param('id') id: string, @Body() body: any) {
    return this.ris.recordPayment(this.tenant(req), id, body);
  }

  // ─── Dispatch ──────────────────────────────

  @Post('studies/:studyId/dispatch')
  dispatchReport(
    @Req() req: Request,
    @Param('studyId') studyId: string,
    @Body() body: { mobile: string; patientName: string },
  ) {
    return this.ris.dispatchReport(this.tenant(req), studyId, body.mobile, body.patientName);
  }

  @Get('dispatch')
  getDispatchLogs(@Req() req: Request, @Query('studyId') studyId?: string) {
    return this.ris.getDispatchLogs(this.tenant(req), studyId);
  }

  // ─── Analytics ─────────────────────────────

  @Get('dashboard')
  getDashboard(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
  ) {
    return this.ris.getDashboardStats(this.tenant(req), branchId ?? 'branch_main');
  }

  @Get('analytics/revenue')
  getRevenue(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
  ) {
    return this.ris.getRevenueAnalytics(this.tenant(req), branchId ?? 'branch_main');
  }

  @Get('analytics/machines')
  getMachineUtilization(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
  ) {
    return this.ris.getMachineUtilization(this.tenant(req), branchId ?? 'branch_main');
  }
}
