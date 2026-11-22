import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, MessageCircle, Lock, Shield, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ClinicMark } from './ClinicMark';
import { openWhatsApp } from '../lib/whatsapp';

export function Navbar() {
  const { role, clinic, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = pathname === '/';

  const scrollToSection = (id: string) => {
    setOpen(false);
    if (!isHome) {
      window.location.hash = `/#${id}`;
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleWhatsAppInquiry = () => {
    const message = `Namaste Dr. Malathesh / Shridhar Netralaya Front Desk,\n\nI would like to inquire about an eye checkup / cataract consultation at your Magadi clinic.\n\nCould you please share appointment availability?\n\nThank you!`;
    openWhatsApp(clinic.phone, message);
  };

  return (
    <header className="no-print sticky top-0 z-40 transition-all duration-300">
      {/* Top hospital announcement & emergency bar */}
      <div className="bg-clinic-900 px-4 py-1.5 text-xs text-clinic-100 shadow-inner sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              OPD Open Today
            </span>
            <span className="hidden text-clinic-300 sm:inline">
              Mon–Sat: 9:30 AM–2:00 PM & 4:30 PM–7:30 PM
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium">
            <span className="hidden items-center gap-1 text-clinic-200 md:inline-flex">
              <MapPin className="h-3 w-3 text-clinic-400" /> Near Gramadevate Temple, Magadi
            </span>
            <a
              href={`tel:${clinic.emergency_phone || clinic.phone}`}
              className="inline-flex items-center gap-1 text-white hover:text-emerald-300 font-semibold"
            >
              <Phone className="h-3 w-3 text-emerald-400" />
              <span>Emergency / Help: {clinic.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div
        className={`border-b transition-all duration-200 ${
          scrolled
            ? 'border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm'
            : 'border-slate-200/60 bg-white/90 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          {/* Hospital Brand & Identity */}
          <Link to="/" className="group flex min-w-0 items-center gap-3.5">
            <ClinicMark className="h-11 w-11 shrink-0 transition-transform duration-300 group-hover:scale-105" />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {clinic.clinic_name}
                </span>
                <span className="hidden rounded bg-clinic-50 px-1.5 py-0.5 font-kannada text-xs font-semibold text-clinic-800 lg:inline-block">
                  ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                Eye Hospital & Microsurgery Centre · Magadi
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 xl:gap-2 lg:flex">
            {isHome ? (
              <>
                <button
                  type="button"
                  onClick={() => scrollToSection('services')}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-clinic-50 hover:text-clinic-900 transition"
                >
                  Treatments
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('simulator')}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-clinic-50 hover:text-clinic-900 transition"
                >
                  Vision Simulator
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('cataract-journey')}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-clinic-50 hover:text-clinic-900 transition"
                >
                  Daycare Cataract
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('doctor')}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-clinic-50 hover:text-clinic-900 transition"
                >
                  Chief Surgeon
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('schedule')}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-clinic-50 hover:text-clinic-900 transition"
                >
                  Timings & Route
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('faqs')}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-clinic-50 hover:text-clinic-900 transition"
                >
                  FAQs
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-clinic-50 hover:text-clinic-900 transition"
              >
                ← Back to Hospital Site
              </Link>
            )}

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition active:scale-95"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp Us
            </button>

            <Link
              to="/staff"
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                pathname === '/staff'
                  ? 'bg-clinic-100 text-clinic-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Staff Desk Portal"
            >
              <Lock className="h-3 w-3" />
              Staff
            </Link>

            <Link
              to="/admin"
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                pathname === '/admin'
                  ? 'bg-clinic-100 text-clinic-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Admin Portal"
            >
              <Shield className="h-3 w-3" />
              Admin
            </Link>

            {role && (
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Lock
              </button>
            )}
          </nav>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm"
              aria-label="WhatsApp Us"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition active:bg-slate-100"
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-b border-slate-200 bg-white/98 px-5 py-5 shadow-xl backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-2.5">
            {isHome ? (
              <>
                <button
                  type="button"
                  onClick={() => scrollToSection('services')}
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-clinic-50 transition"
                >
                  👁️ Eye Care & Surgical Treatments
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('simulator')}
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-clinic-50 transition"
                >
                  🔍 Interactive Vision Simulator
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('cataract-journey')}
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-clinic-50 transition"
                >
                  ⚡ 15-Min Daycare Cataract Journey
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('doctor')}
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-clinic-50 transition"
                >
                  👨‍⚕️ Chief Surgeon Dr. L. S. Malathesh
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('schedule')}
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-clinic-50 transition"
                >
                  🕒 OPD Timings & Magadi Route Map
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('faqs')}
                  className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-clinic-50 transition"
                >
                  ❓ Patient Questions & Answers (FAQ)
                </button>
              </>
            ) : (
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-bold text-clinic-800 bg-clinic-50"
              >
                ← Return to Public Hospital Site
              </Link>
            )}

            <div className="my-2 border-t border-slate-200" />

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${clinic.phone}`}
                className="btn-primary !min-h-[44px] text-xs"
                onClick={() => setOpen(false)}
              >
                <Phone className="h-3.5 w-3.5" />
                Call {clinic.phone}
              </a>
              <button
                type="button"
                onClick={() => {
                  handleWhatsAppInquiry();
                  setOpen(false);
                }}
                className="btn-whatsapp !min-h-[44px] text-xs"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                to="/staff"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700"
                onClick={() => setOpen(false)}
              >
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Staff Portal
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700"
                onClick={() => setOpen(false)}
              >
                <Shield className="h-3.5 w-3.5 text-slate-500" />
                Admin Portal
              </Link>
            </div>

            {role && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="mt-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-center text-xs font-bold text-red-700"
              >
                Lock Session
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
