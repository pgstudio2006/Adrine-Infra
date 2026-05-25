import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const PHI_PATTERNS = [
  /\b\d{10}\b/g,
  /\bMRN[-:]?\s*[\w-]+/gi,
  /\buhid[-:]?\s*[\w-]+/gi,
];

function redactPhi(text: string): string {
  let out = text;
  for (const re of PHI_PATTERNS) {
    out = out.replace(re, '[REDACTED]');
  }
  return out;
}

@Injectable()
export class PhiSafeLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('PhiSafe');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ method?: string; url?: string }>();
    const line = redactPhi(`${req.method ?? ''} ${req.url ?? ''}`);
    return next.handle().pipe(
      tap({
        next: () => this.logger.log(line),
        error: (err: Error) => this.logger.warn(`${line} — ${redactPhi(err.message)}`),
      }),
    );
  }
}
