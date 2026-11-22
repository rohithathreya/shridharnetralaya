import { useState } from 'react';
import { Delete, Loader2, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ClinicMark } from './ClinicMark';

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
      setError(res.error || 'Incorrect access PIN. Please try again.');
      setPin('');
    }
  }

  function appendDigit(d: string) {
    if (pin.length < 8) {
      setError('');
      const next = pin + d;
      setPin(next);
      if (next.length === 4) {
        // Auto-attempt submit when 4 digits are entered
        setTimeout(() => {
          submitDirect(next);
        }, 80);
      }
    }
  }

  async function submitDirect(pinValue: string) {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    const res = await loginWithPin(pinValue, requiredTier);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Incorrect access PIN. Please check with administrator.');
      setPin('');
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col justify-center px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-sm">
        {/* Back Link */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Public Website
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-clinic-50 text-clinic-700 shadow-sm border border-clinic-100">
              {isAdmin ? <ShieldCheck className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
            </div>

            <span className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              {isAdmin ? 'Tier 3 · Administrator' : 'Tier 2 · Staff Desk'}
            </span>

            <h1 className="mt-2 font-display text-2xl font-black text-slate-900">
              {isAdmin ? 'Admin Security Portal' : 'Reception & OT Desk'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">{clinic.clinic_name} · Magadi</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* PIN Visual Dots */}
            <div className="flex justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((i) => {
                const filled = pin.length > i;
                return (
                  <div
                    key={i}
                    className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                      filled
                        ? 'border-clinic-700 bg-clinic-700 scale-110 shadow-sm'
                        : 'border-slate-300 bg-slate-100'
                    }`}
                  />
                );
              })}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-bold text-red-700 animate-fade-in">
                {error}
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => appendDigit(digit)}
                  className="touch-key hover:bg-clinic-50/50"
                  disabled={submitting}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="touch-key text-xs font-extrabold uppercase tracking-wider text-slate-400 hover:text-slate-700"
                disabled={submitting}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => appendDigit('0')}
                className="touch-key hover:bg-clinic-50/50"
                disabled={submitting}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPin((p) => p.slice(0, -1))}
                className="touch-key text-slate-500 hover:text-slate-800"
                disabled={submitting}
                aria-label="Backspace"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>

            <button
              type="submit"
              disabled={pin.trim().length < 4 || submitting}
              className="btn-primary w-full mt-4"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          {/* Quick link between staff and admin */}
          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            {isAdmin ? (
              <Link to="/staff" className="text-xs font-semibold text-clinic-700 hover:underline">
                Switch to Staff Reception Desk →
              </Link>
            ) : (
              <Link to="/admin" className="text-xs font-semibold text-clinic-700 hover:underline">
                Switch to Administrator Portal →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
