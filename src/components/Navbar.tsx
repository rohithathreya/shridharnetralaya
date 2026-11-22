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
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
          active
            ? 'bg-clinic-600 text-white shadow-sm'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinic-600 text-white shadow-sm">
            <Eye className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
              {clinic.clinic_name}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              Magadi • {clinic.doctor_name}
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href={`tel:${clinic.phone}`}
            className="hidden items-center gap-1.5 rounded-lg border border-clinic-200 bg-clinic-50 px-3 py-2 text-xs font-bold text-clinic-800 hover:bg-clinic-100 md:inline-flex"
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
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700"
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
