import { SetMetadata } from '@nestjs/common';

export const RBAC_ROLES_KEY = 'rbac_roles';

/** Restrict handler to these operational roles (x-actor-role header). */
export const Roles = (...roles: string[]) => SetMetadata(RBAC_ROLES_KEY, roles);
