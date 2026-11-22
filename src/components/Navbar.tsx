import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Lock, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClinicMark } from './ClinicMark';

export function Navbar() {
  const { role, clinic, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const linkClass = (to: string) =>
    `nav-pill w-full justify-center sm:w-auto ${
      pathname === to ? 'nav-pill-active' : 'nav-pill-idle'
    }`;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-ivory-50/10 bg-ink-950/80 backdrop-blur-xl safe-top">
      {/* Top Quiet Banner: Timings & Appointment Policy */}
      <div className="border-b border-ivory-50/5 bg-ink-900/60 px-4 py-1 text-[11px] text-ivory-400 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
            <span className="font-semibold text-ivory-200 truncate">
              Mon – Sat: 10:00 AM – 5:00 PM · By Prior Appointment Only
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3 text-xs font-semibold">
            <span className="hidden items-center gap-1 text-ivory-400 md:inline-flex">
              <MapPin className="h-3 w-3 text-gold-400" /> Magadi
            </span>
            <a
              href={`tel:${clinic.phone}`}
              className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-300 transition"
            >
              <Phone className="h-3 w-3" />
              <span>{clinic.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <ClinicMark className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="truncate font-display text-xl leading-none tracking-[-0.02em] text-ivory-50">
                {clinic.clinic_name}
              </span>
              <span className="hidden font-kannada text-xs font-semibold text-gold-500 md:inline-block">
                ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ
              </span>
            </div>
            <span className="mt-1 hidden text-[11px] tracking-wide text-ivory-500 sm:block">
              Eye Hospital & Microsurgery Centre · Magadi
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 sm:flex">
          <a
            href={`tel:${clinic.phone}`}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-gold-400/30 bg-clinic-50 px-3.5 py-1 text-xs font-semibold text-gold-600 hover:bg-gold-500 hover:text-ink-900 transition"
          >
            <Phone className="h-3 w-3" />
            Book: {clinic.phone}
          </a>
          <Link to="/staff" className={linkClass('/staff')}>
            Staff desk
          </Link>
          <Link to="/admin" className={linkClass('/admin')}>
            Admin
          </Link>
          {role && (
            <button type="button" onClick={logout} className="nav-pill nav-pill-idle text-xs">
              Lock
            </button>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-2xl border border-ivory-50/10 bg-ink-900 text-ivory-50 shadow-soft sm:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ivory-50/10 bg-ink-900 px-5 py-4 sm:hidden">
          <div className="flex flex-col gap-2">
            <div className="rounded-xl border border-gold-400/30 bg-clinic-50/60 p-3 text-xs text-ivory-300">
              <div className="font-bold text-gold-600">Hours: 10:00 AM – 5:00 PM (Mon–Sat)</div>
              <div className="mt-0.5 text-ivory-400">Strictly by prior appointment. Call ahead before visiting.</div>
            </div>
            <a href={`tel:${clinic.phone}`} className="btn-primary" onClick={() => setOpen(false)}>
              <Phone className="h-4 w-4" /> Call {clinic.phone} to Book
            </a>
            <Link to="/staff" className={linkClass('/staff')} onClick={() => setOpen(false)}>
              Staff desk
            </Link>
            <Link to="/admin" className={linkClass('/admin')} onClick={() => setOpen(false)}>
              Admin
            </Link>
            {role && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="btn-ghost"
              >
                Lock session
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
