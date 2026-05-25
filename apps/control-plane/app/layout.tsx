import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Adrine Control Plane',
  description: 'Internal admin for tenants, modules, AI budgets, and operations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui', margin: 0, padding: '2rem' }}>{children}</body>
    </html>
  );
}
