'use client';

import { useEffect, useState } from 'react';
import { fetchAppointments, type Appointment } from '../../src/lib/patient-api';
import { useAuth } from '../../src/contexts/AuthContext';
import { PlatformApiError } from '../../src/runtime/platform-client';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AppointmentsPage() {
  const { patientId, platformConnected } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    if (!platformConnected) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchAppointments(patientId);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof PlatformApiError ? err.message : 'Failed to load appointments');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId, platformConnected]);

  return (
    <>
      <h1>Appointments</h1>
      {!platformConnected ? (
        <p className="muted">No live API — sign in with platform runtime enabled to load appointments.</p>
      ) : loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : items.length === 0 ? (
        <p className="muted">No appointments yet. Book one at reception in Hospital OS.</p>
      ) : (
        <ul className="card-list">
          {items.map((a) => (
            <li key={a.id} className="card">
              <h3>{a.resourceLabel}</h3>
              <p className="muted">{formatWhen(a.startAt)} – {formatWhen(a.endAt)}</p>
              <p>Status: {a.status}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
