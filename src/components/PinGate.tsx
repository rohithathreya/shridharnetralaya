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
      <div className="card-surface w-full p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${
              isAdmin
                ? 'bg-gold-500/15 text-gold-400 ring-gold-500/30'
                : 'bg-clinic-500/15 text-clinic-300 ring-clinic-500/30'
            }`}
          >
            {isAdmin ? <ShieldCheck className="h-8 w-8" /> : <Stethoscope className="h-8 w-8" />}
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">
            {isAdmin ? 'Admin Portal' : 'Staff Desk'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {clinic.clinic_name} · {isAdmin ? 'Admin' : 'Staff or Admin'} access code
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => {
                setError('');
                setPin(e.target.value);
              }}
              placeholder="••••"
              className="input-field py-4 pl-10 text-center text-2xl font-bold tracking-[0.45em]"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2 text-center text-sm font-semibold text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => appendDigit(digit)}
                className="rounded-xl border border-white/10 bg-obsidian-800 py-3 text-lg font-bold text-slate-200 active:bg-obsidian-700"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="rounded-xl border border-white/10 bg-obsidian-800 py-3 text-xs font-bold text-slate-400"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => appendDigit('0')}
              className="rounded-xl border border-white/10 bg-obsidian-800 py-3 text-lg font-bold text-slate-200"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="flex items-center justify-center rounded-xl border border-white/10 bg-obsidian-800 py-3 text-slate-400"
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={pin.trim().length < 4 || submitting}
            className="btn-primary w-full py-3.5 text-base"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {submitting ? 'Verifying…' : `Unlock ${isAdmin ? 'Admin' : 'Staff'}`}
          </button>
        </form>
      </div>
    </div>
  );
}