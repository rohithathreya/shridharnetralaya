import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SITE_COPY } from '../data/clinicOfferings';
import { EyeBlink } from '../components/EyeBlink';

const base = import.meta.env.BASE_URL;

export function PublicHome() {
  const { clinic } = useAuth();
  const { lang } = useLanguage();
  const copy = SITE_COPY[lang];
  const isKn = lang === 'kn';
  const vertRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [deck, setDeck] = useState<'row' | 'doctor'>('row');
  const [branch, setBranch] = useState<'magadi' | 'bangalore'>('magadi');

  const cardCount = 1 + copy.treatments.items.length;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const vert = vertRef.current;
    const row = rowRef.current;
    if (!vert || !row) return;

    const decks = [...vert.querySelectorAll<HTMLElement>('[data-deck]')];
    const cards = [...row.querySelectorAll<HTMLElement>('[data-slide]')];

    const deckObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const next = (visible.target as HTMLElement).dataset.deck;
        if (next === 'row' || next === 'doctor') setDeck(next);
      },
      { root: vert, threshold: [0.6, 0.85] },
    );

    const cardObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.slide);
        if (!Number.isNaN(index)) setActive(index);
      },
      { root: row, threshold: [0.6, 0.85] },
    );

    decks.forEach((node) => deckObserver.observe(node));
    cards.forEach((node) => cardObserver.observe(node));
    return () => {
      deckObserver.disconnect();
      cardObserver.disconnect();
    };
  }, [lang, cardCount]);

  function goToCard(index: number) {
    const row = rowRef.current;
    if (!row) return;
    const next = Math.max(0, Math.min(cardCount - 1, index));
    setActive(next);
    row.scrollTo({ left: next * row.clientWidth, behavior: 'smooth' });
  }

  return (
    <div className={`fixed inset-0 z-0 bg-[#100e0c] ${isKn ? 'font-kannada' : ''}`}>
      <div ref={vertRef} className="home-vert h-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain">
        <section data-deck="row" className="h-full snap-start snap-always">
          <div
            ref={rowRef}
            className="home-row flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          >
            <article data-slide={0} className="relative h-full w-full shrink-0 snap-start snap-always">
              <img
                src={`${base}care/vision.jpg`}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
              />
              <div className="edge-fade" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a09]/70 via-[#0c0a09]/25 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09]/80 via-transparent to-[#0c0a09]/20" />
              <div className="relative flex h-full flex-col justify-end px-5 pb-16 pt-24 sm:px-12 lg:px-20">
                <h1
                  className={`max-w-4xl text-balance text-[2.65rem] font-medium leading-[0.98] tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl ${
                    isKn ? 'font-kannada leading-snug' : 'font-display'
                  }`}
                >
                  {copy.hero.line}
                </h1>
                <div className="mt-6 inline-flex w-fit rounded-full border border-white/25 bg-black/40 p-0.5 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setBranch('magadi')}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                      branch === 'magadi' ? 'bg-white text-[#141210]' : 'text-white/80'
                    }`}
                  >
                    {isKn ? 'ಮಾಗಡಿ' : 'Magadi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBranch('bangalore')}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                      branch === 'bangalore' ? 'bg-white text-[#141210]' : 'text-white/80'
                    }`}
                  >
                    {isKn ? 'ಬೆಂಗಳೂರು' : 'Bangalore'}
                  </button>
                </div>
                <div className="mt-3 grid max-w-3xl gap-px overflow-hidden rounded-2xl border border-white/20 bg-white/20 sm:grid-cols-3">
                  <div className="flex items-center gap-3 bg-black/50 px-4 py-3.5 backdrop-blur-md">
                    <Clock className="h-4 w-4 shrink-0 text-white" strokeWidth={1.75} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                        {copy.hero.timingsLabel}
                      </div>
                      <div className="mt-0.5 text-[13px] leading-snug text-white">
                        {branch === 'bangalore'
                          ? isKn
                            ? 'ಸೋಮ – ಶನಿ · ಸಂಜೆ 7:00 – ರಾತ್ರಿ 9:00'
                            : 'Mon – Sat · 7:00 PM – 9:00 PM'
                          : copy.hero.timingsValue}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`tel:${clinic.phone}`}
                    className="flex items-center gap-3 bg-black/50 px-4 py-3.5 backdrop-blur-md"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-white" strokeWidth={1.75} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                        {isKn ? 'ಸಂಪರ್ಕ' : 'Contact'}
                      </div>
                      <div className="mt-0.5 text-[13px] leading-snug text-white">{clinic.phone}</div>
                    </div>
                  </a>
                  <a
                    href={
                      branch === 'bangalore'
                        ? 'https://maps.app.goo.gl/5hDjoXnHdDqPAoX7A'
                        : clinic.google_maps_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 bg-black/50 px-4 py-3.5 backdrop-blur-md"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-white" strokeWidth={1.75} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                        {isKn ? 'ನಕ್ಷೆ' : 'Map'}
                      </div>
                      <div className="mt-0.5 text-[13px] leading-snug text-white">
                        {branch === 'bangalore' ? (isKn ? 'ಬೆಂಗಳೂರು' : 'Bangalore') : isKn ? 'ಮಾಗಡಿ' : 'Magadi'}
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </article>

            {copy.treatments.items.map((item, index) => (
              <article
                key={item.id}
                id={index === 0 ? 'treatments' : undefined}
                data-slide={index + 1}
                className="relative h-full w-full shrink-0 snap-start snap-always"
              >
                <img
                  src={`${base}care/${item.image}`}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="edge-fade" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09]/80 via-[#0c0a09]/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 px-5 pb-16 sm:px-12 lg:px-20">
                  <div className="max-w-2xl">
                    <h2
                      className={`text-[1.85rem] font-medium leading-tight text-white sm:text-5xl ${
                        isKn ? 'font-kannada' : 'font-display'
                      }`}
                    >
                      {item.title}
                    </h2>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                      {item.summary} {item.whoNeedsIt}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="doctor" data-deck="doctor" className="flex h-full snap-start snap-always flex-col bg-ink-950">
          <div className="relative h-[58%] shrink-0 overflow-hidden bg-[#1a1614] pt-16">
            <img
              src={`${base}care/doctor.jpg`}
              alt=""
              className="absolute inset-0 h-full w-full scale-110 object-cover object-[center_30%] opacity-40 blur-2xl"
            />
            <div className="relative flex h-full items-end justify-center px-6">
              <img
                src={`${base}care/doctor.jpg`}
                alt=""
                className="max-h-full w-auto max-w-full object-contain object-bottom shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-ivory-50 sm:px-10 lg:px-16 [scrollbar-width:none]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-500">
              {copy.doctor.eyebrow}
            </p>
            <h2
              className={`mt-1.5 text-[1.85rem] font-medium leading-tight sm:text-4xl ${
                isKn ? 'font-kannada' : 'font-display'
              }`}
            >
              {isKn ? copy.doctor.name : clinic.doctor_name}
            </h2>
            <p className="mt-1 text-sm text-gold-600">{copy.doctor.role}</p>
            <p className="mt-1 text-sm text-ivory-300">{copy.doctor.qualifications}</p>
            <div className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-ivory-100">
              {copy.doctor.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-3">
              {copy.doctor.highlights.map((item) => (
                <div key={item.title}>
                  <div className={`text-sm ${isKn ? '' : 'font-display'}`}>{item.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-ivory-300">{item.detail}</p>
                </div>
              ))}
            </div>
            {(clinic.doctor_kmc_no || clinic.kpme_reg_no) && (
              <div className="mt-4 flex flex-wrap gap-2 pb-2">
                {clinic.doctor_kmc_no && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-ivory-50/15 px-3 py-1 text-[11px] text-ivory-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold-500" />
                    {copy.doctor.kmcLabel}: {clinic.doctor_kmc_no}
                  </span>
                )}
                {clinic.kpme_reg_no && (
                  <span className="inline-flex items-center rounded-full border border-ivory-50/15 px-3 py-1 text-[11px] text-ivory-200">
                    {copy.doctor.kpmeLabel}: {clinic.kpme_reg_no}
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {deck === 'row' && (
        <>
          {active > 0 && (
            <button
              type="button"
              aria-label="Previous"
              onClick={() => goToCard(active - 1)}
              className="absolute bottom-3 left-3 z-30 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {active < cardCount - 1 && (
            <button
              type="button"
              aria-label="Next"
              onClick={() => goToCard(active + 1)}
              className="absolute bottom-3 right-3 z-30 grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-black/40 text-white backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div className="absolute inset-x-0 bottom-4 z-30 flex items-center justify-center gap-1.5">
            {Array.from({ length: cardCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => goToCard(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === active ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}

      <EyeBlink />
    </div>
  );
}
