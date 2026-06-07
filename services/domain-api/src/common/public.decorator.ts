import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skip JWT enforcement (health checks, public booking). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
