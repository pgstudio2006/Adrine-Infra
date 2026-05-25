'use client';

import { useEffect, useState } from 'react';
import { fetchPrescriptions, type PharmacyFulfillment } from '../../src/lib/patient-api';
import { useAuth } from '../../src/contexts/AuthContext';
import { PlatformApiError } from '../../src/runtime/platform-client';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium' });
}

function medicationSummary(medications: unknown): string {
  if (!Array.isArray(medications)) return '—';
  return medications
    .map((m) => {
      if (typeof m === 'object' && m && 'name' in m) {
        return String((m as { name: string }).name);
      }
      return 'Medication';
    })
    .join(', ');
}

export default function PrescriptionsPage() {
  const { patientId, platformConnected } = useAuth();
  const [items, setItems] = useState<PharmacyFulfillment[]>([]);
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
        const data = await fetchPrescriptions(patientId);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof PlatformApiError ? err.message : 'Failed to load prescriptions');
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
      <h1>Prescriptions</h1>
      {!platformConnected ? (
        <p className="muted">No live API — enable platform runtime to load prescriptions.</p>
      ) : loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : items.length === 0 ? (
        <p className="muted">No prescriptions on file yet.</p>
      ) : (
        <ul className="card-list">
          {items.map((rx) => (
            <li key={rx.id} className="card">
              <h3>{medicationSummary(rx.medications)}</h3>
              <p className="muted">
                Dr. {rx.prescribingDoctor} · {formatWhen(rx.createdAt)}
              </p>
              <p>
                Status: <strong>{rx.state}</strong>
                {rx.priority ? ` · ${rx.priority}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
