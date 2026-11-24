import React, { useState } from 'react';
import { Delete, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PinGateProps {
  requiredTier: 'staff' | 'admin';
}

export function PinGate({ requiredTier }: PinGateProps) {
  const { loginWithPin, clinic } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = requiredTier === 'admin';

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (pin.trim().length < 4 || submitting) return;
    setSubmitting(true);
    setError('');
    const res = await loginWithPin(pin, requiredTier);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Incorrect access PIN');
      setPin('');
    }
  }

  function appendDigit(d: string) {
    if (pin.length < 12) {
      setError('');
      setPin((prev) => prev + d);
    }
  }

  return (
    <div className="page-shell flex min-h-[75dvh] flex-col justify-center">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ivory-50 text-gold-300 shadow-lift">
            <Lock className="h-5 w-5" />
          </div>
          <p className="eyebrow">{isAdmin ? 'Admin Portal' : 'Staff Clinical Desk'}</p>
          <h1 className="mt-1 font-display text-3xl font-medium text-ivory-50">
            {isAdmin ? 'Admin Sign-In' : 'Enter Staff PIN'}
          </h1>
          <p className="mt-1 text-xs text-ivory-400">{clinic.clinic_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="card-surface mt-6 space-y-4 p-5">
          <div className="flex justify-center gap-2.5 py-2">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-150 ${
                  pin.length > i ? 'scale-125 bg-ivory-50' : 'bg-ink-700'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-800">
              {error}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button key={digit} type="button" onClick={() => appendDigit(digit)} className="touch-key">
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="touch-key text-[11px] font-bold uppercase tracking-wider text-ivory-400"
            >
              Clear
            </button>
            <button type="button" onClick={() => appendDigit('0')} className="touch-key">
              0
            </button>
            <button
              type="button"
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="touch-key text-ivory-400"
              aria-label="Backspace"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <button type="submit" disabled={pin.trim().length < 4 || submitting} className="btn-primary w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Verifying…' : 'Unlock Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
