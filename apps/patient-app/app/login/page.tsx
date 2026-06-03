'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  PlatformApiError,
  formatLoginFetchError,
  isPlatformRuntimeEnabled,
  kernelBase,
} from '../../src/runtime/platform-client';

export default function LoginPage() {
  const { login, session } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) router.replace('/dashboard');
  }, [session, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(fullName.trim());
      router.push('/dashboard');
    } catch (err) {
      const msg =
        err instanceof PlatformApiError
          ? err.message
          : formatLoginFetchError(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <h1>Sign in</h1>
      <p className="muted">
        {isPlatformRuntimeEnabled() ? (
          <>
            Live mode: calls kernel at <code>{kernelBase() ?? '(set NEXT_PUBLIC_KERNEL_API_URL)'}</code>.
            APIs must run on <strong>this computer</strong> or use staging URLs in <code>.env.local</code>.
          </>
        ) : (
          <>Demo mode: no backend required. Set <code>NEXT_PUBLIC_PLATFORM_RUNTIME=true</code> for live APIs.</>
        )}
      </p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Full name
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            required
            autoComplete="name"
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit" disabled={submitting || !fullName.trim()}>
          {submitting ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
