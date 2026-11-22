import {
  PhoneCall,
  MapPin,
  Clock,
  ShieldCheck,
  Eye,
  Stethoscope,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { openWhatsApp } from '../lib/whatsapp';

const SERVICES = [
  {
    title: 'Cataract Microsurgery (Phaco & SICS)',
    desc: 'Stitchless topical phacoemulsification and small-incision cataract surgery with Indian, imported hydrophobic, toric, and multifocal IOLs.',
  },
  {
    title: 'Pterygium Excision + Autograft',
    desc: 'Clean pterygium removal with conjunctival autograft (CAG) for minimal recurrence and faster cosmetic recovery.',
  },
  {
    title: 'Glaucoma Evaluation & Surgery',
    desc: 'Applanation tonometry, visual field perimetry, YAG laser PI, medical management, and trabeculectomy surgery.',
  },
  {
    title: 'Diabetic Eye & Retinal Care',
    desc: 'Dilated fundus screening for diabetic retinopathy and hypertension, plus sterile OT intravitreal anti-VEGF injections.',
  },
  {
    title: 'YAG Laser & Minor Procedures',
    desc: 'YAG capsulotomy for after-cataract, corneal foreign body removal, sac syringing, chalazion incision & curettage.',
  },
  {
    title: 'Refraction & Comprehensive OPD',
    desc: 'Accurate computerized and clinical spectacle power checkup, pediatric eye screening, lid & squint evaluation.',
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
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-white/[0.06] bg-obsidian-950 bg-hero-radial">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/25 bg-gold-500/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-gold-300">
                <Eye className="h-4 w-4" />
                Trusted eye hospital · Magadi, Karnataka
              </div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                {clinic.clinic_name}
              </h1>
              <p className="font-kannada text-base font-medium text-clinic-300 sm:text-lg">
                ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ, ಮಾಗಡಿ — ಸಮಗ್ರ ಕಣ್ಣಿನ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಕೇಂದ್ರ
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                {clinic.tagline}. Cataract microsurgery, laser procedures, and everyday ophthalmic care for families across Magadi and Ramanagara district.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <a href={`tel:${clinic.phone}`} className="btn-primary py-3.5">
                  <PhoneCall className="h-4 w-4" />
                  Call {clinic.phone}
                </a>
                <button
                  type="button"
                  onClick={handleWhatsAppEnquiry}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-5 py-3.5 text-sm font-bold text-emerald-300 hover:bg-emerald-900/40"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </button>
                <a
                  href={clinic.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost py-3.5"
                >
                  <MapPin className="h-4 w-4" />
                  Directions
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="card-surface p-6 ring-1 ring-gold-500/10">
                <div className="flex items-start gap-3.5 border-b border-white/[0.06] pb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-clinic-500/15 text-clinic-300 ring-1 ring-clinic-500/25">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="label-field">Chief ophthalmic surgeon</div>
                    <h2 className="font-display text-2xl font-semibold text-white">{clinic.doctor_name}</h2>
                    <div className="text-sm font-medium text-slate-400">{clinic.doctor_qualification}</div>
                    {clinic.doctor_kmc_no && (
                      <div className="mt-0.5 text-xs text-slate-500">KMC Reg: {clinic.doctor_kmc_no}</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5 text-slate-400">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clinic-400" />
                    <span>{clinic.address}</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-400">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-clinic-400" />
                    <span>{clinic.timings}</span>
                  </div>
                  <div className="flex items-start gap-2.5 font-semibold text-red-300">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    Emergency: {clinic.emergency_phone || clinic.phone}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="label-field text-clinic-500">Clinical capabilities</div>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Complete eye care & surgery
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Award className="h-4 w-4 text-gold-400" />
            Day-care OT · Bilingual discharge
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((svc) => (
            <div
              key={svc.title}
              className="card-surface group p-5 transition hover:border-clinic-500/30 hover:shadow-glow"
            >
              <div className="mb-2 flex items-center gap-2 text-clinic-400">
                <CheckCircle2 className="h-5 w-5 shrink-0 group-hover:text-clinic-300" />
                <h3 className="text-base font-bold text-white">{svc.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">{svc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.06] bg-obsidian-950/80 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left">
          <div>
            <span className="font-semibold text-slate-300">{clinic.clinic_name}</span> · {clinic.address}
            {clinic.kpme_reg_no ? ` · KPME ${clinic.kpme_reg_no}` : ''}
          </div>
          <div className="flex flex-col items-center gap-1 sm:items-end">
            <div className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-gold-500" />
              Digital records & bilingual discharge
            </div>
            {import.meta.env.VITE_BUILD_SHA ? (
              <span className="font-mono text-[10px] text-slate-600" title="Confirm you have the latest deploy">
                build {import.meta.env.VITE_BUILD_SHA.slice(0, 7)}
              </span>
            ) : null}
          </div>
        </div>
      </footer>
    </div>
  );
}