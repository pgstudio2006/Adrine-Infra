'use client';

import { useEffect, useState } from 'react';

const DOMAIN_API =
  process.env.NEXT_PUBLIC_DOMAIN_API_URL ?? 'http://localhost:3002';
const TENANT_SLUG = 'navayu';

type Slot = { startAt: string; endAt: string; available: boolean };

export default function NavayuBookPage() {
  const [branch, setBranch] = useState('gurgaon');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceType, setServiceType] = useState('MSK Consultation');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${DOMAIN_API}/public/booking/${TENANT_SLUG}/slots?branch=${branch}&date=${date}`,
        );
        const data = (await res.json()) as { slots?: Slot[] };
        setSlots(data.slots ?? []);
        setSelectedSlot(data.slots?.[0]?.startAt ?? '');
      } catch {
        setSlots([]);
      }
    };
    void load();
  }, [branch, date]);

  const book = async () => {
    if (!selectedSlot || !patientName.trim() || !phone.trim()) {
      setStatus('Name, phone, and slot are required.');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${DOMAIN_API}/public/booking/${TENANT_SLUG}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchCode: branch,
          serviceType,
          datetime: selectedSlot,
          patientName: patientName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message ?? 'Booking failed');
        return;
      }
      setStatus(`Booked · ref ${data.appointmentId}`);
    } catch {
      setStatus('Network error — is domain-api running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Book at Navayu</h1>
        <p className="text-sm text-neutral-600">Online appointment · Wave 0 embed</p>
      </header>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Branch</span>
        <select
          className="w-full border rounded px-3 py-2"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        >
          <option value="gurgaon">Gurgaon Center</option>
          <option value="pataudi">Pataudi Hospital</option>
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

      <label className="block space-y-1">
        <span className="text-sm font-medium">Full name</span>
        <input
          className="w-full border rounded px-3 py-2"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Phone</span>
        <input
          className="w-full border rounded px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Email (optional)</span>
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Service</span>
        <input
          className="w-full border rounded px-3 py-2"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        />
      </label>

      <button
        type="button"
        onClick={() => void book()}
        disabled={loading}
        className="w-full rounded bg-black text-white py-3 font-semibold disabled:opacity-50"
      >
        {loading ? 'Booking…' : 'Confirm appointment'}
      </button>

      {status && <p className="text-sm">{status}</p>}
    </main>
  );
}
