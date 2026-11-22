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
    <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-ink-950/40 backdrop-blur-xl safe-top">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <ClinicMark className="h-10 w-10 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate font-display text-xl leading-none tracking-[-0.02em] text-ivory-50">
              {clinic.clinic_name}
            </span>
            <span className="mt-1 hidden text-[11px] tracking-wide text-ivory-400 sm:block">Magadi</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link to="/staff" className={linkClass('/staff')}>
            Staff
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
          className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-ivory-50 backdrop-blur sm:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ink-950/90 px-5 py-4 backdrop-blur-xl sm:hidden">
          <div className="flex flex-col gap-2">
            <Link to="/staff" className={linkClass('/staff')} onClick={() => setOpen(false)}>
              Staff
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
