import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Phone, Shield, Stethoscope, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SITE_COPY } from '../data/clinicOfferings';
import { ClinicMark } from './ClinicMark';

export function Navbar() {
  const { clinic, role } = useAuth();
  const { lang, setLang } = useLanguage();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const copy = SITE_COPY[lang];
  const isHome = pathname === '/';

  function scrollToSection(sectionId: string) {
    setOpen(false);
    if (!isHome) {
      navigate('/');
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'start',
    });
  }

  const navLinkClass = (active: boolean) =>
    `nav-pill ${active ? 'nav-pill-active' : 'nav-pill-idle'}`;

  return (
    <header
      className={
        isHome
          ? 'no-print fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-black/55 via-black/20 to-transparent safe-top'
          : 'no-print sticky top-0 z-40 border-b border-ivory-50/[0.07] bg-ink-950/80 backdrop-blur-xl safe-top'
      }
    >
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2.5 px-4 py-2 sm:px-6 lg:px-8">
        <Link to="/" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-2.5">
          <ClinicMark className="h-9 w-9 shrink-0" />
          <span className="min-w-0">
            <span
              className={`block text-[15px] font-semibold tracking-[-0.02em] sm:text-xl ${
                isHome ? 'text-white' : 'text-ivory-50'
              } ${lang === 'kn' ? 'font-kannada leading-[1.45]' : 'font-display leading-none'}`}
            >
              {lang === 'kn' ? copy.brandName : clinic.clinic_name}
            </span>
            <span
              className={`mt-0.5 block text-[10.5px] font-medium tracking-wide ${
                isHome ? 'text-white/70' : 'text-ivory-400'
              }`}
            >
              {copy.brandLocation}
            </span>
          </span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden items-center gap-1 lg:flex">
          <button
            type="button"
            onClick={() => scrollToSection('treatments')}
            className={isHome ? 'nav-pill text-white/85 hover:bg-white/10 hover:text-white' : 'nav-pill nav-pill-idle'}
          >
            {copy.nav.treatments}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('doctor')}
            className={isHome ? 'nav-pill text-white/85 hover:bg-white/10 hover:text-white' : 'nav-pill nav-pill-idle'}
          >
            {copy.nav.doctor}
          </button>
          <span className={`mx-1.5 h-4 w-px ${isHome ? 'bg-white/25' : 'bg-ivory-50/15'}`} />
          <Link
            to="/staff"
            className={
              isHome
                ? 'nav-pill text-white/85 hover:bg-white/10 hover:text-white'
                : navLinkClass(pathname === '/staff')
            }
          >
            <Stethoscope className="h-3.5 w-3.5" />
            {copy.nav.staff}
          </Link>
          {role === 'admin' && (
            <Link to="/admin" className={navLinkClass(pathname === '/admin')}>
              <Shield className="h-3.5 w-3.5" />
              {copy.nav.admin}
            </Link>
          )}
        </nav>

        {/* Right Controls: Always-visible EN | ಕನ್ನಡ toggle */}
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center rounded-full border p-0.5 shadow-soft ${
              isHome ? 'border-white/25 bg-white/10' : 'border-ivory-50/12 bg-ink-900'
            }`}
            role="group"
            aria-label="Language"
          >
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                lang === 'en'
                  ? 'bg-white text-[#141210] shadow-soft'
                  : isHome
                    ? 'text-white/75 hover:text-white'
                    : 'text-ivory-400 hover:text-ivory-50'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('kn')}
              className={`font-kannada rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                lang === 'kn'
                  ? 'bg-white text-[#141210] shadow-soft'
                  : isHome
                    ? 'text-white/75 hover:text-white'
                    : 'text-ivory-400 hover:text-ivory-50'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>

          {isHome && (
            <a
              href={`tel:${clinic.phone}`}
              className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold text-white shadow-soft ring-1 ring-white/30 backdrop-blur-md transition hover:bg-white hover:text-[#141210] sm:inline-flex"
            >
              <Phone className="h-3.5 w-3.5" />
              {clinic.phone}
            </a>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`grid h-9 w-9 place-items-center rounded-full border shadow-soft lg:hidden ${
              isHome ? 'border-white/30 bg-white/10 text-white' : 'border-ivory-50/12 bg-ink-900 text-ivory-50'
            }`}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      {open && (
        <div
          className={`animate-fade-in border-t px-4 py-4 backdrop-blur-xl lg:hidden ${
            isHome ? 'border-white/10 bg-[#141210]/92 text-white' : 'border-ivory-50/10 bg-ink-950/98'
          }`}
        >
          <div className="grid gap-1.5">
            <button
              type="button"
              onClick={() => scrollToSection('treatments')}
              className={`nav-pill w-full justify-start py-2.5 text-sm ${
                isHome ? 'text-white hover:bg-white/10' : 'nav-pill-idle'
              }`}
            >
              {copy.nav.treatments}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('doctor')}
              className={`nav-pill w-full justify-start py-2.5 text-sm ${
                isHome ? 'text-white hover:bg-white/10' : 'nav-pill-idle'
              }`}
            >
              {copy.nav.doctor}
            </button>
            <div className="my-1.5 h-px bg-ivory-50/10" />
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/staff"
                onClick={() => setOpen(false)}
                className={`${navLinkClass(pathname === '/staff')} justify-center border py-2.5 ${
                  isHome ? 'border-white/15 text-white' : 'border-ivory-50/10'
                }`}
              >
                <Stethoscope className="h-4 w-4" />
                {copy.nav.staff}
              </Link>
              {role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className={`${navLinkClass(pathname === '/admin')} justify-center border border-white/15 py-2.5 ${
                    isHome ? 'text-white' : ''
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  {copy.nav.admin}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
