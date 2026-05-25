import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { FileModule } from './file/file.module';
import { HealthModule } from './health/health.module';
import { NotificationModule } from './notification/notification.module';
import { PrismaModule } from './prisma/prisma.module';
import { RlsInterceptor } from './rls/rls.interceptor';
import { MeteringModule } from './metering/metering.module';
import { OrgModule } from './org/org.module';
import { TenantModule } from './tenant/tenant.module';
import { GovernanceModule } from './governance/governance.module';
import { AdminModule } from './admin/admin.module';
import { ProvisioningModule } from './provisioning/provisioning.module';
import { PlatformBillingModule } from './platform-billing/platform-billing.module';
import { ModuleRuntimeModule } from './module-runtime/module-runtime.module';
import { IntegrationModule } from './integration/integration.module';
import { ScaleModule } from './scale/scale.module';
import { OperationalTemplateModule } from './templates/operational-template.module';
import { TenantRateLimitGuard } from './common/tenant-rate-limit.guard';
import { InternalModule } from './internal/internal.module';
import { HrModule } from './hr/hr.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TenantModule,
    HealthModule,
    AuthModule,
    OrgModule,
    MeteringModule,
    NotificationModule,
    FileModule,
    BillingModule,
    AuditModule,
    GovernanceModule,
    AdminModule,
    ProvisioningModule,
    PlatformBillingModule,
    ModuleRuntimeModule,
    IntegrationModule,
    ScaleModule,
    OperationalTemplateModule,
    InternalModule,
    HrModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RlsInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: TenantRateLimitGuard,
    },
  ],
})
export class AppModule {}
