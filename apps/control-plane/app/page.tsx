async function getKernelHealth(): Promise<{ status?: string; error?: string }> {
  const base = process.env.KERNEL_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${base}/healthz`, { next: { revalidate: 0 } });
    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }
    return (await res.json()) as { status: string };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'unknown' };
  }
}

export default async function HomePage() {
  const health = await getKernelHealth();
  return (
    <main>
      <h1>Adrine Control Plane</h1>
      <p>Internal operator console (SSO + MFA in production).</p>
      <section>
        <h2>Kernel reachability</h2>
        <pre>{JSON.stringify(health, null, 2)}</pre>
        <p>
          Configure <code>KERNEL_API_URL</code> for server-side checks (defaults to{' '}
          <code>http://localhost:3001</code>).
        </p>
      </section>
    </main>
  );
}
