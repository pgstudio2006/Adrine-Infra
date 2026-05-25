'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/contexts/AuthContext';
import { PlatformApiError } from '../../src/runtime/platform-client';

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
          : err instanceof Error
            ? err.message
            : 'Sign-in failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <h1>Sign in</h1>
      <p className="muted">
        Dev login uses kernel <code>/auth/dev-login</code> and links your clinical record via
        domain-api. Set <code>NEXT_PUBLIC_PLATFORM_RUNTIME=true</code> against a local stack.
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
