import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClinicMark } from './ClinicMark';

export function Navbar() {
  const { role, clinic, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const linkClass = (to: string) =>
    `nav-pill w-full justify-center sm:w-auto ${pathname === to ? 'nav-pill-active' : 'nav-pill-idle'}`;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-ivory-50/10 bg-ink-950/75 backdrop-blur-xl safe-top">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <ClinicMark className="h-11 w-11 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-display text-xl leading-none tracking-[-0.02em] text-ivory-50">
              {clinic.clinic_name}
            </span>
            <span className="mt-1 hidden text-[11px] tracking-wide text-ivory-500 sm:block">Magadi</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <a href={`tel:${clinic.phone}`} className="nav-pill nav-pill-idle">
            {clinic.phone}
          </a>
          <Link to="/staff" className={linkClass('/staff')}>
            Staff
          </Link>
          <Link to="/admin" className={linkClass('/admin')}>
            Admin
          </Link>
          {role && (
            <button type="button" onClick={logout} className="nav-pill nav-pill-idle">
              Lock
            </button>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 place-items-center rounded-full border border-ivory-50/10 bg-ink-900 text-ivory-50 shadow-soft sm:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ivory-50/10 bg-ink-900 px-5 py-4 sm:hidden">
          <div className="flex flex-col gap-2">
            <a href={`tel:${clinic.phone}`} className="btn-primary" onClick={() => setOpen(false)}>
              Call {clinic.phone}
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
