import { useState } from 'react';
import { Delete, Loader2 } from 'lucide-react';
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
      setError(res.error || 'Incorrect access code');
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
    <div className="page-shell flex min-h-[70dvh] flex-col justify-center">
      <div className="mx-auto w-full max-w-md">
        <p className="eyebrow">{isAdmin ? 'Step 0 · Admin' : 'Step 0 · Staff'}</p>
        <h1 className="mt-3 font-display text-3xl text-ivory-50">
          {isAdmin ? 'Admin sign-in' : 'Staff sign-in'}
        </h1>
        <p className="mt-2 text-sm font-light text-ivory-500">{clinic.clinic_name}</p>

        <form onSubmit={handleSubmit} className="card-surface mt-8 space-y-4 p-5 sm:p-6">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            readOnly
            value={pin}
            aria-label="PIN"
            className="input-field text-center text-2xl font-medium tracking-[0.5em]"
            placeholder="••••"
          />

          {error && (
            <p className="border border-red-400/30 bg-red-950/30 px-3 py-2 text-center text-sm text-red-300">{error}</p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button key={digit} type="button" onClick={() => appendDigit(digit)} className="touch-key">
                {digit}
              </button>
            ))}
            <button type="button" onClick={() => setPin('')} className="touch-key text-xs uppercase tracking-widest text-ivory-400">
              Clear
            </button>
            <button type="button" onClick={() => appendDigit('0')} className="touch-key">
              0
            </button>
            <button
              type="button"
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="touch-key text-ivory-400"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <button type="submit" disabled={pin.trim().length < 4 || submitting} className="btn-primary">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}