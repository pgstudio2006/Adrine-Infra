'use client';

import { FormEvent, Suspense, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  COMPLAINT_TYPE_OPTIONS,
  DURATION_OPTIONS,
  NAVAYU_INTAKE_FORM_ID,
  NAVAYU_INTAKE_VERSION,
  RED_FLAG_OPTIONS,
  type NavayuIntakePayload,
} from '../../src/lib/navayu-intake-v0';
import { submitPatientIntake } from '../../src/lib/patient-intake';
import { PlatformApiError, isPlatformRuntimeEnabled } from '../../src/runtime/platform-client';

function IntakeForm() {
  const searchParams = useSearchParams();
  const visitId = (searchParams.get('visitId') ?? '').trim();

  const [complaintType, setComplaintType] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [durationBucket, setDurationBucket] = useState('');
  const [vas, setVas] = useState('5');
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const vasNum = useMemo(() => {
    const n = Number(vas);
    return Number.isFinite(n) ? Math.min(10, Math.max(0, Math.round(n))) : NaN;
  }, [vas]);

  const toggleRedFlag = useCallback((value: string) => {
    setRedFlags((prev) => {
      if (value === 'none') return ['none'];
      const withoutNone = prev.filter((v) => v !== 'none');
      if (withoutNone.includes(value)) {
        return withoutNone.filter((v) => v !== value);
      }
      return [...withoutNone, value];
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setToast(null);

    if (!visitId) {
      setError('Missing visit link. Open this page with ?visitId= from reception.');
      return;
    }
    if (!complaintType || !complaintText.trim() || !durationBucket) {
      setError('Please complete chief complaint, description, and duration.');
      return;
    }
    if (!Number.isFinite(vasNum)) {
      setError('Enter a pain score from 0 to 10.');
      return;
    }
    if (redFlags.length === 0) {
      setError('Select at least one red-flag option (or “None of the above”).');
      return;
    }

    const payload: NavayuIntakePayload = {
      formId: NAVAYU_INTAKE_FORM_ID,
      version: NAVAYU_INTAKE_VERSION,
      visitId,
      complaintType,
      complaintText: complaintText.trim(),
      durationBucket,
      vas: vasNum,
      redFlags,
    };

    setSubmitting(true);
    try {
      const result = await submitPatientIntake(payload);
      setSubmitted(true);
      setToast(
        result.stub
          ? 'Intake saved locally for UAT (domain-api intake endpoint not available yet).'
          : 'Intake submitted to the hospital record.',
      );
    } catch (err) {
      setError(err instanceof PlatformApiError ? err.message : 'Could not submit intake. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="intake-page">
      <h1>Navayu patient intake</h1>
      <p className="muted">
        {NAVAYU_INTAKE_FORM_ID} · {NAVAYU_INTAKE_VERSION}
        {isPlatformRuntimeEnabled() ? ' · Live APIs when intake route exists' : ' · UAT stub mode'}
      </p>
      {visitId ? (
        <p className="muted">
          Visit: <code>{visitId}</code>
        </p>
      ) : (
        <p className="error">Add <code>?visitId=</code> to the URL (from reception registration).</p>
      )}

      {toast ? <p className="toast success">{toast}</p> : null}

      {submitted ? (
        <p className="muted">You can close this tab. Staff will see your answers in Hospital OS.</p>
      ) : (
        <form className="form intake-form" onSubmit={onSubmit}>
          <fieldset className="intake-section">
            <legend>Chief complaint</legend>
            <label>
              Complaint type
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {COMPLAINT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Describe your main problem
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                rows={3}
                required
                placeholder="Where it hurts, what makes it worse…"
              />
            </label>
            <label>
              Duration
              <select
                value={durationBucket}
                onChange={(e) => setDurationBucket(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset className="intake-section">
            <legend>Pain severity</legend>
            <label>
              Pain score (0–10)
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={Number.isFinite(vasNum) ? vasNum : 0}
                onChange={(e) => setVas(e.target.value)}
              />
              <span className="vas-value">{Number.isFinite(vasNum) ? vasNum : '—'} / 10</span>
            </label>
          </fieldset>

          <fieldset className="intake-section">
            <legend>Red flags</legend>
            <p className="muted">Any of the following?</p>
            <div className="checkbox-group">
              {RED_FLAG_OPTIONS.map((o) => (
                <label key={o.value} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={redFlags.includes(o.value)}
                    onChange={() => toggleRedFlag(o.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="submit" disabled={submitting || !visitId}>
            {submitting ? 'Submitting…' : 'Submit intake'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function IntakePage() {
  return (
    <Suspense fallback={<p className="muted">Loading intake…</p>}>
      <IntakeForm />
    </Suspense>
  );
}
