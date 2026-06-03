'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const NAV = [
  { href: '/dashboard', label: 'Home' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/reports', label: 'Reports' },
  { href: '/prescriptions', label: 'Prescriptions' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { session, loading, logout, platformConnected } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = pathname === '/login' || pathname === '/intake';

  useEffect(() => {
    if (!loading && !session && !isPublicRoute) {
      router.replace('/login');
    }
  }, [loading, session, isPublicRoute, router]);

  if (loading) {
    return <p className="muted">Loading…</p>;
  }

  if (!session) {
    return (
      <div className={pathname === '/intake' ? 'shell intake-shell-public' : undefined}>
        {children}
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="header">
        <div>
          <strong>Adrine Patient</strong>
          <span className="badge">{platformConnected ? 'Live' : 'Demo'}</span>
        </div>
        <div className="header-actions">
          <span className="muted">{session.name}</span>
          <button type="button" className="btn-secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <nav className="nav">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'nav-link active' : 'nav-link'}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
