'use client';

import { AuthProvider } from '../src/contexts/AuthContext';
import { AppShell } from '../src/components/AppShell';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
