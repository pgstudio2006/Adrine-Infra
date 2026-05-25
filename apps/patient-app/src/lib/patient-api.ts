import { domainBase, kernelBase, platformFetch } from '../runtime/platform-client';

export type PatientRecord = {
  id: string;
  fullName: string;
  mrn?: string | null;
  dob?: string | null;
};

export type Appointment = {
  id: string;
  startAt: string;
  endAt: string;
  resourceLabel: string;
  status: string;
};

export type LabOrder = {
  id: string;
  tests: string;
  state: string;
  priority?: string | null;
  createdAt: string;
};

export type PharmacyFulfillment = {
  id: string;
  state: string;
  priority?: string | null;
  prescribingDoctor: string;
  medications: unknown;
  createdAt: string;
};

export async function devLogin(fullName: string): Promise<{
  accessToken: string;
  user: {
    sub: string;
    tenantId: string;
    branchId: string;
    role: string;
    name: string;
    email: string;
  };
}> {
  const kernel = kernelBase();
  if (!kernel) throw new Error('NEXT_PUBLIC_KERNEL_API_URL is not configured');
  const email = `patient-${fullName.toLowerCase().replace(/\s+/g, '.')}@adrine.local`;
  return platformFetch(kernel, '/auth/dev-login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      fullName,
      role: 'patient',
      tenantId: process.env.NEXT_PUBLIC_DEV_TENANT_ID ?? 'tenant_dev',
    }),
  });
}

export async function resolvePatientId(fullName: string): Promise<string> {
  const preset = process.env.NEXT_PUBLIC_DEV_PATIENT_ID;
  if (preset) return preset;

  const domain = domainBase();
  if (!domain) throw new Error('NEXT_PUBLIC_DOMAIN_API_URL is not configured');

  const patients = await platformFetch<PatientRecord[]>(domain, '/patients');
  const match = patients.find(
    (p) => p.fullName.trim().toLowerCase() === fullName.trim().toLowerCase(),
  );
  if (match) return match.id;

  const created = await platformFetch<PatientRecord>(domain, '/patients', {
    method: 'POST',
    body: JSON.stringify({ fullName }),
  });
  return created.id;
}

export async function fetchAppointments(patientId: string): Promise<Appointment[]> {
  const domain = domainBase();
  if (!domain) return [];
  return platformFetch<Appointment[]>(domain, `/appointments/patient/${patientId}`);
}

export async function fetchLabReports(patientId: string): Promise<LabOrder[]> {
  const domain = domainBase();
  if (!domain) return [];
  return platformFetch<LabOrder[]>(domain, `/lab/patient/${patientId}/orders`);
}

export async function fetchPrescriptions(patientId: string): Promise<PharmacyFulfillment[]> {
  const domain = domainBase();
  if (!domain) return [];
  return platformFetch<PharmacyFulfillment[]>(
    domain,
    `/pharmacy/patient/${patientId}/fulfillments`,
  );
}
