import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { role, clinic, logout } = useAuth();
  const { pathname } = useLocation();

  const linkClass = (to: string) =>
    `nav-pill ${pathname === to ? 'nav-pill-active' : 'nav-pill-idle'}`;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-ivory-50/10 bg-ink-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="leading-none">
          <span className="font-display text-[1.65rem] text-ivory-50">{clinic.clinic_name}</span>
        </Link>

        <nav className="flex items-center gap-5 sm:gap-7">
          <a href={`tel:${clinic.phone}`} className="nav-pill nav-pill-idle hidden sm:inline-flex">
            {clinic.phone}
          </a>
          <Link to="/staff" className={linkClass('/staff')}>
            Staff
          </Link>
          <Link to="/admin" className={linkClass('/admin')}>
            Admin
          </Link>
          {role && (
            <button
              type="button"
              onClick={logout}
              title={`Signed in as ${role}`}
              className="nav-pill nav-pill-idle"
            >
              Lock
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
