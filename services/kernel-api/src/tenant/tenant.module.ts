import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TenantMiddleware } from './tenant.middleware';

@Module({})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'healthz', method: RequestMethod.GET },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/dev-login', method: RequestMethod.POST },
        { path: 'auth/branches', method: RequestMethod.GET },
        { path: 'auth/mfa/verify', method: RequestMethod.POST },
        { path: 'public/tenants/:slug/branches', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
