import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PublicBookingTenantMiddleware } from './public-booking-tenant.middleware';
import { TenantMiddleware } from './tenant.middleware';

@Module({})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PublicBookingTenantMiddleware).forRoutes({
      path: 'public/booking/*',
      method: RequestMethod.ALL,
    });
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'healthz', method: RequestMethod.GET },
        { path: 'readyz', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
