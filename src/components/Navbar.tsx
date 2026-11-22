import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { role, clinic, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const linkClass = (to: string) =>
    `nav-pill w-full justify-center sm:w-auto ${pathname === to ? 'nav-pill-active' : 'nav-pill-idle'}`;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-ivory-50/10 bg-ink-950/95 backdrop-blur-md safe-top">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-8">
        <Link to="/" className="min-w-0 truncate font-display text-xl text-ivory-50 sm:text-[1.65rem]">
          {clinic.clinic_name}
        </Link>

        <nav className="hidden items-center gap-5 sm:flex sm:gap-7">
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
          className="flex h-11 w-11 items-center justify-center border border-ivory-50/15 text-ivory-100 sm:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ivory-50/10 bg-ink-950 px-4 py-4 sm:hidden">
          <div className="flex flex-col gap-1">
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