import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, ShieldCheck, Stethoscope, LogOut, PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { role, clinic, logout } = useAuth();
  const { pathname } = useLocation();

  const navBtn = (to: string, label: string, icon: React.ReactNode) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={`nav-pill ${active ? 'nav-pill-active' : 'nav-pill-idle'}`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/[0.06] bg-obsidian-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-clinic-500 to-clinic-800 text-white shadow-glow ring-1 ring-clinic-400/30">
            <Eye className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
              {clinic.clinic_name}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              Magadi · {clinic.doctor_name}
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href={`tel:${clinic.phone}`}
            className="hidden items-center gap-1.5 rounded-lg border border-gold-500/25 bg-gold-500/10 px-3 py-2 text-xs font-bold text-gold-300 hover:bg-gold-500/15 md:inline-flex"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            {clinic.phone}
          </a>

          {navBtn('/staff', 'Staff Desk', <Stethoscope className="h-4 w-4" />)}
          {navBtn('/admin', 'Admin', <ShieldCheck className="h-4 w-4" />)}

          {role && (
            <button
              onClick={logout}
              title={`Signed in as ${role}. Click to lock.`}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-2 text-xs font-semibold text-slate-400 hover:border-red-500/30 hover:bg-red-950/40 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}