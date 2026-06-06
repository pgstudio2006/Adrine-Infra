import { useAuth } from '@/contexts/AuthContext';
import { ROLE_BASE_PATH } from '@/config/roleNavigation';
import type { UserRole } from '@/types/roles';

export function isClinicalDoctorRole(role?: string | null): role is 'doctor' | 'jr_doctor' {
  return role === 'doctor' || role === 'jr_doctor';
}

export function useClinicalBasePath(): string {
  const { user } = useAuth();
  const role = user?.role;
  if (role && role in ROLE_BASE_PATH) {
    return ROLE_BASE_PATH[role as UserRole];
  }
  return '/doctor';
}
