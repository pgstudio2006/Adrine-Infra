export type BackendProvider = "nest" | "fastapi";

export interface ApiClientConfig {
  baseUrl: string;
  provider: BackendProvider;
}

export interface HospitalMetricsResponse {
  generatedAt: string;
  admissions: number;
  discharges: number;
  occupancyRatePct: number;
}

export interface PatientDocumentPayload {
  uhid: string;
  admissionId: string;
  templateKey: string;
  fileName: string;
  sourceModule: string;
}

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const DEFAULT_BACKEND = (import.meta.env.VITE_API_PROVIDER as BackendProvider) || "nest";

function resolveConfig(config?: Partial<ApiClientConfig>): ApiClientConfig {
  return {
    baseUrl: config?.baseUrl || DEFAULT_API_BASE_URL,
    provider: config?.provider || DEFAULT_BACKEND,
  };
}

async function requestJson<T>(path: string, init?: RequestInit, config?: Partial<ApiClientConfig>): Promise<T> {
  const resolved = resolveConfig(config);
  if (!resolved.baseUrl) {
    throw new Error("API base URL is not configured. Set VITE_API_BASE_URL for backend integration.");
  }

  const response = await fetch(`${resolved.baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchHospitalMetrics(config?: Partial<ApiClientConfig>): Promise<HospitalMetricsResponse> {
  try {
    return await requestJson<HospitalMetricsResponse>("/integration/hospital-metrics", undefined, config);
  } catch {
    // Frontend stays mock-first until backend is wired.
    return {
      generatedAt: new Date().toISOString(),
      admissions: 0,
      discharges: 0,
      occupancyRatePct: 0,
    };
  }
}

export async function pushPatientDocument(payload: PatientDocumentPayload, config?: Partial<ApiClientConfig>): Promise<{ id: string }> {
  return requestJson<{ id: string }>(
    "/integration/patient-documents",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    config,
  );
}

export async function healthCheck(config?: Partial<ApiClientConfig>): Promise<{ status: string; provider: BackendProvider }> {
  const resolved = resolveConfig(config);

  if (!resolved.baseUrl) {
    return { status: "mock", provider: resolved.provider };
  }

  return requestJson<{ status: string; provider: BackendProvider }>("/health", undefined, resolved);
}
