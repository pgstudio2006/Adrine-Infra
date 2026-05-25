'use client';

import { useEffect, useState } from 'react';
import { fetchLabReports, type LabOrder } from '../../src/lib/patient-api';
import { useAuth } from '../../src/contexts/AuthContext';
import { PlatformApiError } from '../../src/runtime/platform-client';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium' });
}

export default function ReportsPage() {
  const { patientId, platformConnected } = useAuth();
  const [items, setItems] = useState<LabOrder[]>([]);
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
        const data = await fetchLabReports(patientId);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof PlatformApiError ? err.message : 'Failed to load reports');
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
      <h1>Lab reports</h1>
      {!platformConnected ? (
        <p className="muted">No live API — enable platform runtime to load lab orders.</p>
      ) : loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : items.length === 0 ? (
        <p className="muted">No lab orders on file yet.</p>
      ) : (
        <ul className="card-list">
          {items.map((o) => (
            <li key={o.id} className="card">
              <h3>{o.tests}</h3>
              <p className="muted">Ordered {formatWhen(o.createdAt)}</p>
              <p>
                Status: <strong>{o.state}</strong>
                {o.priority ? ` · ${o.priority}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
