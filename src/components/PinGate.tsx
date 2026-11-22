import React, { useState } from 'react';
import { Lock, ShieldCheck, Stethoscope, Delete, Loader2 } from 'lucide-react';
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
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col items-center justify-center px-4 py-10">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
              isAdmin ? 'bg-slate-900 text-amber-400' : 'bg-clinic-600 text-white'
            }`}
          >
            {isAdmin ? <ShieldCheck className="h-7 w-7" /> : <Stethoscope className="h-7 w-7" />}
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            {isAdmin ? 'Admin Portal Access' : 'Staff Desk Access'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {clinic.clinic_name} • Enter your {isAdmin ? 'Admin' : 'Staff or Admin'} PIN
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => {
                setError('');
                setPin(e.target.value);
              }}
              placeholder="Enter PIN code"
              className="w-full rounded-xl border border-slate-300 py-3.5 pl-10 pr-4 text-center text-2xl font-bold tracking-[0.4em] text-slate-900 focus:border-clinic-600 focus:outline-none focus:ring-2 focus:ring-clinic-600/20"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Touch-friendly keypad for clinic phones / tablets */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => appendDigit(digit)}
                className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-lg font-bold text-slate-800 active:bg-clinic-100"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="rounded-xl border border-slate-200 bg-slate-100 py-3 text-xs font-bold text-slate-600 active:bg-slate-200"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => appendDigit('0')}
              className="rounded-xl border border-slate-200 bg-slate-50 py-3 text-lg font-bold text-slate-800 active:bg-clinic-100"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 py-3 text-slate-700 active:bg-slate-200"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={pin.trim().length < 4 || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-clinic-600 py-3.5 text-base font-bold text-white shadow-sm hover:bg-clinic-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {submitting ? 'Verifying...' : `Unlock ${isAdmin ? 'Admin' : 'Staff'} Workspace`}
          </button>
        </form>
      </div>
    </div>
  );
}
