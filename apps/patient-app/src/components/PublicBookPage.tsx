'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  bookPublicAppointment,
  fetchAvailableSlots,
  fetchPublicBookingConfig,
  fetchPublicBranches,
  serviceTypesForBranch,
  type PublicBookingBranch,
  type PublicBookingConfig,
} from '../lib/public-booking';

type Props = { tenantSlug: string };

export function PublicBookPage({ tenantSlug }: Props) {
  const [config, setConfig] = useState<PublicBookingConfig | null>(null);
  const [branches, setBranches] = useState<PublicBookingBranch[]>([]);
  const [branchCode, setBranchCode] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [serviceLabel, setServiceLabel] = useState('');
  const [slots, setSlots] = useState<{ startAt: string; endAt: string; available: boolean }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [cfg, br] = await Promise.all([
          fetchPublicBookingConfig(tenantSlug),
          fetchPublicBranches(tenantSlug),
        ]);
        setConfig(cfg);
        setBranches(br);
        const defaultBranch = br[0]?.code ?? 'gurgaon';
        setBranchCode(defaultBranch);
        const services = serviceTypesForBranch(cfg, defaultBranch);
        setServiceLabel(services[0]?.label ?? '');
        setLoadError(null);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load booking');
      }
    };
    void load();
  }, [tenantSlug]);

  const services = useMemo(() => {
    if (!config || !branchCode) return [];
    return serviceTypesForBranch(config, branchCode);
  }, [config, branchCode]);

  useEffect(() => {
    if (!services.some((s) => s.label === serviceLabel)) {
      setServiceLabel(services[0]?.label ?? '');
    }
  }, [services, serviceLabel]);

  const loadSlots = useCallback(async () => {
    if (!branchCode || !date) return;
    const list = await fetchAvailableSlots(tenantSlug, branchCode, date);
    setSlots(list);
    setSelectedSlot(list[0]?.startAt ?? '');
  }, [tenantSlug, branchCode, date]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const book = async () => {
    if (!selectedSlot || !patientName.trim() || !phone.trim() || !serviceLabel) {
      setStatus('Name, phone, service, and slot are required.');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const result = await bookPublicAppointment(tenantSlug, {
        branchCode,
        serviceType: serviceLabel,
        datetime: selectedSlot,
        patientName: patientName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });
      setStatus(`Booked · ref ${result.appointmentId}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (loadError) {
    return (
      <main className="mx-auto max-w-lg p-6">
        <p className="text-sm text-red-700">{loadError}</p>
        <p className="text-sm text-neutral-600 mt-2">
          Ensure kernel-api and domain-api are running and NEXT_PUBLIC_* URLs are set.
        </p>
      </main>
    );
  }

  if (!config) {
    return <main className="mx-auto max-w-lg p-6 text-sm text-neutral-600">Loading booking…</main>;
  }

  return (
    <main className="mx-auto max-w-lg p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{config.title}</h1>
        <p className="text-sm text-neutral-600">{config.subtitle}</p>
      </header>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Location</span>
        <select
          className="w-full border rounded px-3 py-2"
          value={branchCode}
          onChange={(e) => setBranchCode(e.target.value)}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.code}>
              {b.name}
            </option>
          ))}
          {branches.length === 0 && (
            <>
              <option value="gurgaon">Gurgaon Center</option>
              <option value="pataudi">Pataudi Hospital</option>
            </>
          )}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Service</span>
        <select
          className="w-full border rounded px-3 py-2"
          value={serviceLabel}
          onChange={(e) => setServiceLabel(e.target.value)}
        >
          {services.map((s) => (
            <option key={s.code} value={s.label}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Date</span>
        <input
          type="date"
          className="w-full border rounded px-3 py-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Time slot</span>
        <select
          className="w-full border rounded px-3 py-2"
          value={selectedSlot}
          onChange={(e) => setSelectedSlot(e.target.value)}
        >
          {slots.length === 0 && <option value="">No slots available</option>}
          {slots.map((s) => (
            <option key={s.startAt} value={s.startAt}>
              {new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </option>
          ))}
        </select>
      </label>

      {config.patientFields.map((field) => {
        const value =
          field.key === 'patientName'
            ? patientName
            : field.key === 'phone'
              ? phone
              : field.key === 'email'
                ? email
                : '';
        const setValue =
          field.key === 'patientName'
            ? setPatientName
            : field.key === 'phone'
              ? setPhone
              : field.key === 'email'
                ? setEmail
                : () => undefined;
        return (
          <label key={field.key} className="block space-y-1">
            <span className="text-sm font-medium">{field.label}</span>
            <input
              type={field.type === 'tel' ? 'tel' : field.type}
              className="w-full border rounded px-3 py-2"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required={field.required}
            />
          </label>
        );
      })}

      <button
        type="button"
        onClick={() => void book()}
        disabled={loading || slots.length === 0}
        className="w-full rounded bg-black text-white py-3 font-semibold disabled:opacity-50"
      >
        {loading ? 'Booking…' : 'Confirm appointment'}
      </button>

      {status && <p className="text-sm">{status}</p>}
    </main>
  );
}
