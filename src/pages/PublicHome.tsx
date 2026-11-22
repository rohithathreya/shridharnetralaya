import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SERVICES } from '../data/clinicOfferings';

const base = import.meta.env.BASE_URL;

export function PublicHome() {
  const { clinic } = useAuth();
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const [weekRaw, sundayRaw] = clinic.timings.split('|').map((part) => part.trim());
  const weekBits = (weekRaw || clinic.timings).split(':');
  const dayLabel = /^mon/i.test(weekBits[0] || '') ? 'Monday – Saturday' : weekBits[0]?.trim() || 'Monday – Saturday';
  const sundayLabel = (sundayRaw || 'Emergency and post-operative review only.').replace(/^sun:\s*/i, '');
  const timeSlots = (weekBits.slice(1).join(':') || weekRaw || '')
    .split('&')
    .map((slot) => slot.trim())
    .filter(Boolean);

  function syncActive() {
    const el = rail.current;
    if (!el || el.children.length === 0) return;
    const slide = el.children[0] as HTMLElement;
    const width = slide.getBoundingClientRect().width + 16;
    setActive(Math.min(SERVICES.length - 1, Math.max(0, Math.round(el.scrollLeft / width))));
  }

  function goTo(index: number) {
    const slide = rail.current?.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setActive(index);
  }

  return (
    <div>
      {/* ── Hero ── */}
      <section className="flex min-h-[calc(100svh-4rem)] flex-col justify-end px-5 pb-28 pt-8 sm:justify-center sm:px-10 sm:pb-20">
        <div className="mx-auto w-full max-w-5xl">
          <p className="font-kannada text-lg text-gold-400 sm:text-xl">ಎಲ್ಲರ ಕಣ್ಣಿಗಾಗಿ</p>
          <h1 className="mt-4 max-w-[9ch] font-display text-[4.25rem] font-medium leading-[0.88] tracking-[-0.04em] text-ivory-50 sm:text-8xl">
            Vision for all.
          </h1>
          <p className="mt-6 max-w-md font-display text-[1.6rem] leading-snug text-ivory-300 sm:text-4xl">
            Advanced eye care & microsurgery, in Magadi.
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory-500">
            {clinic.clinic_name} · 30 years of cataract, retina, and refractive care for Ramanagara district.
          </p>
          <a href={`tel:${clinic.phone}`} className="btn-primary mt-8 hidden md:inline-flex">
            Call {clinic.phone}
          </a>
        </div>
      </section>

      {/* ── Specialities ── */}
      <section className="pb-6">
        <div className="px-5 pb-4 sm:px-8">
          <h2 className="font-display text-4xl font-medium tracking-[-0.03em] text-ivory-50">What we treat</h2>
          <p className="mt-2 max-w-md text-sm text-ivory-500">
            Comprehensive ophthalmology — consultations, spectacles, microsurgery, and laser.
          </p>
        </div>
        <div ref={rail} onScroll={syncActive} className="care-rail">
          {SERVICES.map((service) => (
            <article key={service.id} className="care-slide bg-ink-900">
              {service.image ? (
                <img
                  src={`${base}care/${service.image}`}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(14,126,115,0.14),transparent_55%)]" />
              )}
              {service.image ? (
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1510]/88 via-[#1a1510]/25 to-transparent" />
              ) : null}
              <div className={`relative flex h-full flex-col justify-end p-6 pb-8 ${service.image ? 'text-[#fffcf8]' : 'text-ivory-50'}`}>
                <p className={`font-kannada text-sm ${service.image ? 'text-[#d7efe9]' : 'text-gold-400'}`}>{service.kannada}</p>
                <h3 className="mt-2 font-display text-4xl leading-none">{service.title}</h3>
                <p className={`mt-3 max-w-xs text-sm leading-relaxed ${service.image ? 'text-[#f6f1e9]/90' : 'text-ivory-300'}`}>
                  {service.body}
                </p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between px-5 sm:px-8">
          <div className="flex gap-2">
            {SERVICES.map((service, index) => (
              <button
                key={service.id}
                type="button"
                aria-label={service.title}
                onClick={() => goTo(index)}
                className={`h-1.5 rounded-full transition-all ${index === active ? 'w-8 bg-gold-400' : 'w-2 bg-ivory-50/20'}`}
              />
            ))}
          </div>
          <p className="text-[11px] text-ivory-500">
            {String(active + 1).padStart(2, '0')} / {String(SERVICES.length).padStart(2, '0')}
          </p>
        </div>
      </section>

      {/* ── Surgeon ── */}
      <section className="border-t border-ivory-50/15">
        <div className="page-shell max-w-4xl">
          <p className="eyebrow">Consulting eye surgeon</p>
          <h2 className="mt-5 max-w-[12ch] font-display text-5xl font-medium leading-[0.95] tracking-[-0.03em] text-ivory-50 sm:text-7xl">
            {clinic.doctor_name}
          </h2>
          <p className="font-kannada mt-3 text-xl text-ivory-400">ಡಾ. ಎಲ್. ಎಸ್. ಮಲತೇಶ</p>
          <p className="mt-5 text-base leading-relaxed text-ivory-400">
            MBBS, Kasturba Medical College · DOMS & FGO, KMC Manipal.
          </p>
          <div className="mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-ivory-300">
            <p>
              He stayed in Magadi so that clear sight would not depend on a bus ride to Bengaluru. Thirty years at this address — cataract, squint, lid, pterygium, and the retinal work a district hospital sees every day.
            </p>
            <p>
              Phacoemulsification, YAG laser, and computerised refraction are part of that same intention: bring what the city has to the town that needs it.
            </p>
          </div>
        </div>
      </section>

      {/* ── Timings & directions ── */}
      <section className="border-t border-ivory-50/15">
        <div className="page-shell grid max-w-5xl gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow">When to come</p>
            <h2 className="mt-4 font-display text-5xl font-medium leading-[0.95] tracking-[-0.03em] text-ivory-50">
              Six days a week.
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ivory-500">
              {dayLabel}. Walk-in or call ahead — no prior appointment needed.
            </p>
          </div>
          <div className="space-y-8 md:col-span-7">
            <div>
              <p className="text-sm text-ivory-400">Morning</p>
              <p className="mt-1 font-display text-4xl text-ivory-50">{timeSlots[0] || '9:30 AM – 2:00 PM'}</p>
            </div>
            <div>
              <p className="text-sm text-ivory-400">Evening</p>
              <p className="mt-1 font-display text-4xl text-ivory-50">{timeSlots[1] || '4:30 PM – 7:30 PM'}</p>
            </div>
            <div className="border-t border-ivory-50/15 pt-6">
              <p className="text-sm text-ivory-400">Sunday</p>
              <p className="mt-1 text-lg text-ivory-100">{sundayLabel}</p>
            </div>
            <div className="border-t border-ivory-50/15 pt-6">
              <p className="text-sm text-ivory-400">Address</p>
              <p className="mt-1 text-lg leading-relaxed text-ivory-100">{clinic.address}</p>
              <a href={clinic.google_maps_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-gold-400 hover:text-gold-300 transition-colors">
                Open in Maps ↗
              </a>
            </div>
            <a href={`tel:${clinic.phone}`} className="block font-display text-4xl text-ivory-50 hover:text-gold-400 transition-colors">
              {clinic.phone}
            </a>
          </div>
        </div>
      </section>

      {/* ── Mobile dock ── */}
      <div className="mobile-dock">
        <a href={`tel:${clinic.phone}`} className="btn-primary">
          Call {clinic.phone}
        </a>
      </div>
    </div>
  );
}
