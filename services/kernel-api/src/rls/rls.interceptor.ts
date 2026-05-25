import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import type { RequestWithTenant } from '../tenant/tenant.middleware';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = req.tenantId;
    if (!tenantId) {
      return next.handle();
    }
    return from(
      this.prisma.$executeRawUnsafe(
        `select set_config('app.tenant_id', $1::text, true)`,
        tenantId,
      ),
    ).pipe(mergeMap(() => next.handle()));
  }
}
