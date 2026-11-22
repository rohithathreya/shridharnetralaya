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

  function handleWhatsAppEnquiry() {
    openWhatsApp(
      clinic.phone,
      `Namaste ${clinic.clinic_name}, I would like to enquire about an eye check-up / consultation with ${clinic.doctor_name}.`,
    );
  }

  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-16 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.35fr_0.75fr] lg:items-end lg:pt-24">
        <div>
          <p className="eyebrow">Eye hospital · Magadi</p>
          <h1 className="mt-6 font-display text-[3.4rem] leading-[0.92] text-ivory-50 sm:text-[5.4rem]">
            {clinic.clinic_name}
          </h1>
          <p className="font-kannada mt-7 max-w-xl text-lg leading-relaxed text-ivory-300">
            ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ, ಮಾಗಡಿ — ಸಮಗ್ರ ಕಣ್ಣಿನ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಕೇಂದ್ರ
          </p>
          <p className="mt-5 max-w-md text-base font-light leading-relaxed text-ivory-500">
            {clinic.tagline.replace(/\.\s*$/, '')}. Cataract microsurgery, laser care, and day-to-day ophthalmology for families in Magadi and Ramanagara.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a href={`tel:${clinic.phone}`} className="btn-primary">
              Call the clinic
            </a>
            <button type="button" onClick={handleWhatsAppEnquiry} className="btn-ghost">
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

        <aside className="border-t border-ivory-50/15 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <p className="eyebrow">Surgeon</p>
          <h2 className="mt-4 font-display text-4xl text-ivory-50">{clinic.doctor_name}</h2>
          <p className="mt-2 text-sm text-ivory-500">{clinic.doctor_qualification}</p>
          {clinic.doctor_kmc_no ? (
            <p className="mt-1 text-xs tracking-wide text-ivory-500">KMC {clinic.doctor_kmc_no}</p>
          ) : null}

          <dl className="mt-10 space-y-6 text-sm">
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
              <dd className="mt-2 font-display text-2xl text-gold-300">
                {clinic.emergency_phone || clinic.phone}
              </dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="border-t border-ivory-50/10">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-4xl text-ivory-50 sm:text-5xl">The practice</h2>
            <p className="max-w-xs text-sm font-light text-ivory-500">
              Day-care surgery. English and Kannada guidance after the procedure.
            </p>
          </div>

          <div>
            {SERVICES.map((svc, index) => (
              <article
                key={svc.title}
                className="grid gap-3 border-t border-ivory-50/10 py-8 sm:grid-cols-12 sm:gap-8"
              >
                <p className="font-display text-2xl text-gold-400 sm:col-span-1">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <div className="sm:col-span-4">
                  <h3 className="font-display text-3xl text-ivory-50">{svc.title}</h3>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ivory-500">{svc.detail}</p>
                </div>
                <p className="font-light leading-relaxed text-ivory-300 sm:col-span-7">{svc.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-ivory-50/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-ivory-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            {clinic.clinic_name}
            {clinic.kpme_reg_no ? ` · KPME ${clinic.kpme_reg_no}` : ''}
          </p>
          <p>{clinic.address}</p>
          {import.meta.env.VITE_BUILD_SHA ? (
            <p className="font-mono text-[10px] text-ivory-500/70">
              {import.meta.env.VITE_BUILD_SHA.slice(0, 7)}
            </p>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
