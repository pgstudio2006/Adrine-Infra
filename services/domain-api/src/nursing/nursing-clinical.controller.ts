import { Body, Controller, Get, Headers, Param, Post, Query, Req } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { NursingClinicalRuntimeService } from './nursing-clinical-runtime.service';

@ApiTags('nursing')
@ApiSecurity('tenant')
@Controller('nursing')
export class NursingClinicalController {
  constructor(private readonly clinical: NursingClinicalRuntimeService) {}

  @Post('vitals')
  recordVitals(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      admissionId: string;
      patientId: string;
      nurse: string;
      shift?: string;
      bp: string;
      pulse: number;
      temp: number;
      spo2: number;
      painScore: number;
      notes?: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    return this.clinical.recordVitals(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Get('vitals/admission/:admissionId')
  listVitals(@Req() req: Request, @Param('admissionId') admissionId: string) {
    return this.clinical.listVitalsForAdmission(
      (req as RequestWithTenant).tenantId!,
      admissionId,
    );
  }

  @Post('notes')
  createNote(
    @Req() req: Request,
    @Headers('x-branch-id') branchId: string | undefined,
    @Body()
    body: {
      admissionId: string;
      patientId: string;
      nurse: string;
      noteType: string;
      body: string;
      actorId?: string;
      actorRole?: string;
    },
  ) {
    return this.clinical.createNote(
      (req as RequestWithTenant).tenantId!,
      branchId ?? 'branch_main',
      body,
    );
  }

  @Get('notes/admission/:admissionId')
  listNotes(@Req() req: Request, @Param('admissionId') admissionId: string) {
    return this.clinical.listNotesForAdmission(
      (req as RequestWithTenant).tenantId!,
      admissionId,
    );
  }

  @Get('reports/admission/:admissionId')
  nurseReport(@Req() req: Request, @Param('admissionId') admissionId: string) {
    return this.clinical.buildNurseReport(
      (req as RequestWithTenant).tenantId!,
      admissionId,
    );
  }

  @Get('audit/admission/:admissionId')
  audit(
    @Req() req: Request,
    @Param('admissionId') admissionId: string,
    @Query('take') take?: string,
  ) {
    return this.clinical.buildNurseReport(
      (req as RequestWithTenant).tenantId!,
      admissionId,
    ).then((r) => ({
      auditTrail: r.auditTrail.slice(0, take ? parseInt(take, 10) : 80),
    }));
  }
}
