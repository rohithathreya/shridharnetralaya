import { useAuth } from '../context/AuthContext';
import { openWhatsApp } from '../lib/whatsapp';
import { OFFERING_GROUPS } from '../data/clinicOfferings';

export function PublicHome() {
  const { clinic } = useAuth();

  function handleWhatsAppEnquiry() {
    openWhatsApp(
      clinic.phone,
      `Namaste ${clinic.clinic_name}, I would like to enquire about an eye check-up with ${clinic.doctor_name}.`,
    );
  }

  return (
    <div className="pb-4 md:pb-0">
      <section className="page-shell max-w-lg sm:max-w-2xl lg:max-w-6xl">
        <p className="eyebrow">Magadi · Eye hospital</p>
        <h1 className="mt-5 font-display text-[2.5rem] leading-[1] text-ivory-50 sm:text-6xl">
          {clinic.clinic_name}
        </h1>
        <p className="font-kannada mt-6 text-base leading-relaxed text-ivory-400">
          ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ
        </p>

        <div className="mt-10 space-y-1 border-t border-ivory-50/10 pt-8">
          <p className="font-display text-2xl text-ivory-50">{clinic.doctor_name}</p>
          <p className="text-sm font-light text-ivory-500">{clinic.doctor_qualification}</p>
        </div>

        <dl className="mt-10 space-y-6 text-sm font-light text-ivory-300">
          <div>
            <dt className="eyebrow">When</dt>
            <dd className="mt-2 leading-relaxed">{clinic.timings}</dd>
          </div>
          <div>
            <dt className="eyebrow">Where</dt>
            <dd className="mt-2 leading-relaxed">{clinic.address}</dd>
          </div>
          <div>
            <dt className="eyebrow">Phone</dt>
            <dd className="mt-2">
              <a href={`tel:${clinic.phone}`} className="font-display text-3xl text-gold-300">
                {clinic.phone}
              </a>
            </dd>
          </div>
        </dl>

        <div className="mt-10 hidden gap-3 md:flex">
          <a href={`tel:${clinic.phone}`} className="btn-primary w-auto">
            Call
          </a>
          <button type="button" onClick={handleWhatsAppEnquiry} className="btn-ghost w-auto">
            WhatsApp
          </button>
          <a
            href={clinic.google_maps_url}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost w-auto"
          >
            Maps
          </a>
        </div>
      </section>

      <div className="mobile-dock grid grid-cols-2 gap-2 md:hidden">
        <a href={`tel:${clinic.phone}`} className="btn-primary !min-h-[52px]">
          Call
        </a>
        <button type="button" onClick={handleWhatsAppEnquiry} className="btn-ghost !min-h-[52px]">
          WhatsApp
        </button>
      </div>

      <section className="border-t border-ivory-50/10">
        <div className="page-shell max-w-lg space-y-12 sm:max-w-2xl lg:max-w-3xl">
          <div>
            <h2 className="font-display text-3xl text-ivory-50">What we offer</h2>
            <p className="mt-2 text-sm font-light text-ivory-500">
              Cataract, laser, and everyday eye care — one consulting surgeon, bilingual guidance.
            </p>
          </div>

          {OFFERING_GROUPS.map((group) => (
            <div key={group.id}>
              <h3 className="eyebrow text-gold-400">{group.label}</h3>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="border-b border-ivory-50/10 pb-3 text-base font-light text-ivory-100 last:border-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ivory-50/10 pb-28 md:pb-12">
        <div className="page-shell max-w-lg py-8 text-xs text-ivory-500 sm:max-w-2xl">
          <p>{clinic.clinic_name}</p>
          {clinic.kpme_reg_no ? <p className="mt-1">KPME {clinic.kpme_reg_no}</p> : null}
        </div>
      </footer>
    </div>
  );
}