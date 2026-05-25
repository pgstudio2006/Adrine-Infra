import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DomainRbacGuard } from './common/rbac.guard';
import { BillingModule } from './billing/billing.module';
import { EmrModule } from './emr/emr.module';
import { EncounterModule } from './encounter/encounter.module';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';
import { PatientModule } from './patient/patient.module';
import { PrismaModule } from './prisma/prisma.module';
import { RlsInterceptor } from './rls/rls.interceptor';
import { LabModule } from './lab/lab.module';
import { RadiologyModule } from './radiology/radiology.module';
import { RealtimeModule } from './realtime/realtime.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { OpdModule } from './opd/opd.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { CrmModule } from './crm/crm.module';
import { TenantModule } from './tenant/tenant.module';
import { BedModule } from './bed/bed.module';
import { AdmissionModule } from './admission/admission.module';
import { NursingModule } from './nursing/nursing.module';
import { MarModule } from './mar/mar.module';
import { DischargeModule } from './discharge/discharge.module';
import { InsuranceModule } from './insurance/insurance.module';
import { OrchestrationModule } from './orchestration/orchestration.module';
import { CommandModule } from './command/command.module';
import { GovernanceModule } from './governance/governance.module';
import { WorkflowConfigModule } from './workflow-config/workflow-config.module';
import { EscalationModule } from './escalation/escalation.module';
import { FinancialOpsModule } from './finance/financial-ops.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MigrationModule } from './migration/migration.module';
import { PlatformNotificationModule } from './platform-notification/notification.module';
import { AIModule } from './ai/ai.module';
import { JobsModule } from './jobs/jobs.module';
import { ProvidersModule } from './providers/providers.module';
import { OtModule } from './ot/ot.module';
import { InventoryModule } from './inventory/inventory.module';
import { DialysisModule } from './dialysis/dialysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ProvidersModule,
    PrismaModule,
    TenantModule,
    EventsModule,
    HealthModule,
    PatientModule,
    EncounterModule,
    EmrModule,
    SchedulingModule,
    CrmModule,
    BillingModule,
    OpdModule,
    LabModule,
    RadiologyModule,
    RealtimeModule,
    PharmacyModule,
    BedModule,
    AdmissionModule,
    NursingModule,
    MarModule,
    DischargeModule,
    InsuranceModule,
    OrchestrationModule,
    CommandModule,
    GovernanceModule,
    WorkflowConfigModule,
    EscalationModule,
    FinancialOpsModule,
    AnalyticsModule,
    MigrationModule,
    PlatformNotificationModule,
    AIModule,
    JobsModule,
    OtModule,
    InventoryModule,
    DialysisModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RlsInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: DomainRbacGuard,
    },
  ],
})
export class AppModule {}
