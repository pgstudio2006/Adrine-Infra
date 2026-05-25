'use client';

import Link from 'next/link';
import { useAuth } from '../../src/contexts/AuthContext';

export default function DashboardPage() {
  const { session, patientId, platformConnected } = useAuth();

  return (
    <>
      <h1>Welcome{session?.name ? `, ${session.name}` : ''}</h1>
      <p className="muted">
        {platformConnected
          ? 'Connected to kernel + domain APIs.'
          : 'Demo mode — enable NEXT_PUBLIC_PLATFORM_RUNTIME and start APIs for live data.'}
      </p>
      {patientId ? (
        <p className="muted">
          Clinical record: <code>{patientId}</code>
        </p>
      ) : null}
      <ul className="card-list" style={{ marginTop: '1rem' }}>
        <li className="card">
          <h3>Appointments</h3>
          <p className="muted">Upcoming visits and booking history.</p>
          <Link href="/appointments">View appointments →</Link>
        </li>
        <li className="card">
          <h3>Lab reports</h3>
          <p className="muted">Diagnostic orders and report status.</p>
          <Link href="/reports">View reports →</Link>
        </li>
        <li className="card">
          <h3>Prescriptions</h3>
          <p className="muted">Medication fulfillments from your visits.</p>
          <Link href="/prescriptions">View prescriptions →</Link>
        </li>
      </ul>
    </>
  );
}
