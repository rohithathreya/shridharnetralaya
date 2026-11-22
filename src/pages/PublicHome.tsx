import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { openWhatsApp } from '../lib/whatsapp';

const SERVICES = [
  {
    title: 'Cataract microsurgery',
    detail: 'Phaco & SICS',
    desc: 'Stitchless topical phacoemulsification and small-incision surgery with Indian, imported hydrophobic, toric, and multifocal lenses.',
  },
  {
    title: 'Pterygium excision',
    detail: 'Conjunctival autograft',
    desc: 'Clean removal with autograft, aimed at low recurrence and a quieter cosmetic recovery.',
  },
  {
    title: 'Glaucoma',
    detail: 'Evaluation & surgery',
    desc: 'Applanation tonometry, visual fields, YAG laser PI, medical care, and trabeculectomy.',
  },
  {
    title: 'Retina & diabetes',
    detail: 'Dilated screening',
    desc: 'Fundus screening for diabetic and hypertensive disease, plus sterile intravitreal anti-VEGF injections.',
  },
  {
    title: 'Laser & minor care',
    detail: 'YAG and procedures',
    desc: 'Capsulotomy, corneal foreign body removal, sac syringing, and chalazion incision.',
  },
  {
    title: 'Refraction & OPD',
    detail: 'Everyday eye care',
    desc: 'Spectacle power, paediatric screening, and lid and squint evaluation.',
  },
];

export function PublicHome() {
  const { clinic } = useAuth();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  function handleWhatsAppEnquiry() {
    openWhatsApp(
      clinic.phone,
      `Namaste ${clinic.clinic_name}, I would like to enquire about an eye check-up / consultation with ${clinic.doctor_name}.`,
    );
  }

  return (
    <div className="pb-8 md:pb-0">
      <section className="page-shell !pb-6 sm:!pb-20">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_0.75fr] lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow">Eye hospital · Magadi</p>
            <h1 className="mt-4 font-display text-[2.75rem] leading-[0.95] text-ivory-50 sm:mt-6 sm:text-[5rem]">
              {clinic.clinic_name}
            </h1>
            <p className="font-kannada mt-5 text-base leading-relaxed text-ivory-300 sm:mt-7 sm:text-lg">
              ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ, ಮಾಗಡಿ — ಸಮಗ್ರ ಕಣ್ಣಿನ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಕೇಂದ್ರ
            </p>
            <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-ivory-500 sm:mt-5 sm:text-base">
              {clinic.tagline.replace(/\.\s*$/, '')}. Cataract microsurgery, laser care, and day-to-day ophthalmology for families in Magadi and Ramanagara.
            </p>

            <div className="mt-8 hidden flex-wrap items-center gap-3 md:flex">
              <a href={`tel:${clinic.phone}`} className="btn-primary w-auto">
                Call the clinic
              </a>
              <button type="button" onClick={handleWhatsAppEnquiry} className="btn-ghost w-auto">
                WhatsApp
              </button>
              <a
                href={clinic.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="px-2 text-[11px] uppercase tracking-[0.18em] text-ivory-500 underline-offset-4 hover:text-ivory-50 hover:underline"
              >
                Directions
              </a>
            </div>
          </div>

          <aside className="space-y-6 border-t border-ivory-50/15 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <div>
              <p className="eyebrow">Surgeon</p>
              <h2 className="mt-3 font-display text-3xl text-ivory-50 sm:text-4xl">{clinic.doctor_name}</h2>
              <p className="mt-2 text-sm text-ivory-500">{clinic.doctor_qualification}</p>
            </div>
            <dl className="space-y-5 text-sm">
              <div>
                <dt className="eyebrow">Address</dt>
                <dd className="mt-2 font-light leading-relaxed text-ivory-100">{clinic.address}</dd>
              </div>
              <div>
                <dt className="eyebrow">Hours</dt>
                <dd className="mt-2 font-light leading-relaxed text-ivory-100">{clinic.timings}</dd>
              </div>
              <div>
                <dt className="eyebrow">Emergency</dt>
                <dd className="mt-2">
                  <a href={`tel:${clinic.emergency_phone || clinic.phone}`} className="font-display text-2xl text-gold-300">
                    {clinic.emergency_phone || clinic.phone}
                  </a>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <div className="mobile-dock grid grid-cols-2 gap-2">
        <a href={`tel:${clinic.phone}`} className="btn-primary !min-h-[52px]">
          Call
        </a>
        <button type="button" onClick={handleWhatsAppEnquiry} className="btn-ghost !min-h-[52px]">
          WhatsApp
        </button>
      </div>

      <section className="border-t border-ivory-50/10">
        <div className="page-shell !pt-10 sm:!py-20">
          <div className="mb-8 space-y-2 sm:mb-12 sm:flex sm:items-end sm:justify-between">
            <h2 className="font-display text-3xl text-ivory-50 sm:text-5xl">The practice</h2>
            <p className="max-w-xs text-sm font-light text-ivory-500">
              Day-care surgery · English & Kannada discharge guidance
            </p>
          </div>

          <div className="border-t border-ivory-50/10 sm:border-0">
            {SERVICES.map((svc, index) => {
              const expanded = openIdx === index;
              return (
                <article key={svc.title} className="border-b border-ivory-50/10 sm:grid sm:grid-cols-12 sm:gap-8 sm:py-8">
                  <button
                    type="button"
                    onClick={() => setOpenIdx(expanded ? null : index)}
                    className="flex w-full items-start justify-between gap-4 py-5 text-left sm:pointer-events-none sm:cursor-default sm:py-0"
                    aria-expanded={expanded}
                  >
                    <div className="flex gap-4 sm:contents">
                      <p className="font-display text-xl text-gold-400 sm:col-span-1 sm:text-2xl">
                        {String(index + 1).padStart(2, '0')}
                      </p>
                      <div className="sm:col-span-4">
                        <h3 className="font-display text-2xl text-ivory-50 sm:text-3xl">{svc.title}</h3>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ivory-500">{svc.detail}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`mt-1 h-5 w-5 shrink-0 text-ivory-500 transition sm:hidden ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <p
                    className={`overflow-hidden pb-5 text-sm font-light leading-relaxed text-ivory-300 sm:col-span-7 sm:block sm:pb-0 sm:text-base ${
                      expanded ? 'block' : 'hidden sm:block'
                    }`}
                  >
                    {svc.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-ivory-50/10 pb-24 md:pb-10">
        <div className="page-shell !py-8 text-xs text-ivory-500">
          <p className="font-medium text-ivory-300">{clinic.clinic_name}</p>
          <p className="mt-2 leading-relaxed">{clinic.address}</p>
          {clinic.kpme_reg_no ? <p className="mt-1">KPME {clinic.kpme_reg_no}</p> : null}
          {import.meta.env.VITE_BUILD_SHA ? (
            <p className="mt-4 font-mono text-[10px] text-ivory-500/60">
              {import.meta.env.VITE_BUILD_SHA.slice(0, 7)}
            </p>
          ) : null}
        </div>
      </footer>
    </div>
  );
}