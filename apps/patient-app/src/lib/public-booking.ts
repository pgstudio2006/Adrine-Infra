const KERNEL_API = process.env.NEXT_PUBLIC_KERNEL_API_URL ?? 'http://localhost:3001';
const DOMAIN_API = process.env.NEXT_PUBLIC_DOMAIN_API_URL ?? 'http://localhost:3002';

export type BookingSlot = { startAt: string; endAt: string; available: boolean };

export type PublicBookingBranch = { id: string; code: string; name: string; timezone?: string };

export type PublicBookingServiceType = {
  code: string;
  label: string;
  branchCodes: string[];
};

export type PublicBookingPatientField = {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'email';
  required: boolean;
};

export type PublicBookingConfig = {
  tenantSlug: string;
  tenantId?: string;
  title: string;
  subtitle: string;
  slotMinutes: number;
  serviceTypes: PublicBookingServiceType[];
  patientFields: PublicBookingPatientField[];
};

export async function fetchPublicBookingConfig(slug: string): Promise<PublicBookingConfig> {
  const kernelUrl = `${KERNEL_API}/public/tenants/${slug}/booking-config`;
  let res = await fetch(kernelUrl, { cache: 'no-store' });
  if (!res.ok) {
    res = await fetch(`${DOMAIN_API}/public/booking/${slug}/config`, { cache: 'no-store' });
  }
  if (!res.ok) {
    throw new Error(`Booking config unavailable (${res.status})`);
  }
  return res.json() as Promise<PublicBookingConfig>;
}

export async function fetchPublicBranches(slug: string): Promise<PublicBookingBranch[]> {
  const res = await fetch(`${KERNEL_API}/public/tenants/${slug}/branches`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Branches unavailable (${res.status})`);
  }
  const data = (await res.json()) as { branches?: PublicBookingBranch[] };
  return data.branches ?? [];
}

export async function fetchAvailableSlots(
  slug: string,
  branchCode: string,
  date: string,
): Promise<BookingSlot[]> {
  const res = await fetch(
    `${DOMAIN_API}/public/booking/${slug}/slots?branch=${encodeURIComponent(branchCode)}&date=${encodeURIComponent(date)}`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as { slots?: BookingSlot[] };
  return data.slots ?? [];
}

export async function bookPublicAppointment(
  slug: string,
  body: {
    branchCode: string;
    serviceType: string;
    datetime: string;
    patientName: string;
    phone: string;
    email?: string;
  },
): Promise<{ appointmentId: string; message?: string }> {
  const res = await fetch(`${DOMAIN_API}/public/booking/${slug}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { appointmentId?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? 'Booking failed');
  }
  if (!data.appointmentId) {
    throw new Error('Booking succeeded but no appointment id returned');
  }
  return { appointmentId: data.appointmentId };
}

export function serviceTypesForBranch(
  config: PublicBookingConfig,
  branchCode: string,
): PublicBookingServiceType[] {
  return config.serviceTypes.filter((s) => s.branchCodes.includes(branchCode));
}
