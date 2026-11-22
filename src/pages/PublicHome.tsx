import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SERVICES } from '../data/clinicOfferings';

const base = import.meta.env.BASE_URL;

export function PublicHome() {
  const { clinic } = useAuth();
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const slides = [
    {
      id: 'vision',
      kannada: 'ಎಲ್ಲರ ದೃಷ್ಟಿಗಾಗಿ',
      title: 'Vision for all.',
      body: 'The best of eye care, in Magadi.',
      image: 'vision.jpg',
      focus: 'center 28%',
    },
    ...SERVICES,
  ];

  function syncActive() {
    const el = rail.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(slides.length - 1, Math.max(0, index)));
  }

  function goTo(index: number) {
    const slide = rail.current?.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setActive(index);
  }

  return (
    <div className="home-snap">
      <section className="home-panel" aria-label="Care">
        <div ref={rail} onScroll={syncActive} className="bleed-rail">
          {slides.map((slide) => (
            <article key={slide.id} className="bleed-slide">
              <img
                src={`${base}care/${slide.image}`}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: 'focus' in slide ? slide.focus : 'center' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1c1712]/80 via-[#1c1712]/15 to-[#1c1712]/25" />
              <div className="absolute inset-x-4 bottom-16 sm:inset-x-10 sm:bottom-14">
                <div className="max-w-lg rounded-[28px] border border-white/35 bg-white/15 p-6 text-white shadow-lift backdrop-blur-xl">
                  <p className="font-kannada text-sm text-[#d7efe9]">{slide.kannada}</p>
                  <h1 className="mt-2 font-display text-4xl leading-[0.95] sm:text-6xl">{slide.title}</h1>
                  <p className="mt-3 text-sm leading-relaxed text-white/90 sm:text-base">{slide.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={slide.title}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full transition-all ${index === active ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
        <p className="pointer-events-none absolute bottom-10 left-5 z-10 text-[11px] tracking-wide text-white/80">
          Swipe across · swipe up for the doctor
        </p>
      </section>

      <section className="home-panel overflow-y-auto bg-ink-950" aria-label="The doctor">
        <div className="mx-auto flex max-w-2xl flex-col px-5 py-10 sm:px-10 sm:py-14">
          <img
            src={`${base}care/doctor.jpg`}
            alt={clinic.doctor_name}
            className="h-36 w-36 rounded-full object-cover object-[center_22%] shadow-lift ring-4 ring-white sm:h-44 sm:w-44"
          />
          <h2 className="mt-6 max-w-[12ch] font-display text-5xl font-medium leading-[0.92] tracking-[-0.03em] text-ivory-50 sm:text-6xl">
            {clinic.doctor_name}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ivory-400 sm:text-base">
            MBBS (Kasturba Medical College) • DOMS, FGO (KMC, Manipal)
          </p>
          <div className="mt-6 max-w-xl space-y-4 text-base leading-relaxed text-ivory-300">
            <p>
              After completing his medical degree and specialized ophthalmic training at Kasturba Medical College, Manipal, Dr. L. S. Malathesh made a deliberate choice: to bring city-grade eye surgery home to Magadi—and stay. His goal was straightforward: build a full-fledged surgical eye hospital on Eye Hospital Road so families across Magadi and Ramanagara district would never have to travel far for serious care.
            </p>
            <p>
              More than three decades later, that commitment is measured in thousands of restored eyes. From complex cataracts and childhood squints to pterygium, eyelid surgeries, diabetic retinal care, and precise spectacle testing, every patient is examined with the same unhurried rigor. Thirty years on, the principle remains unchanged: serious eye care, done properly, right where people live.
            </p>
          </div>
          <a href={`tel:${clinic.phone}`} className="mt-8 font-display text-3xl text-ivory-50">
            {clinic.phone}
          </a>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ivory-400">{clinic.address}</p>
        </div>
      </section>
    </div>
  );
}
