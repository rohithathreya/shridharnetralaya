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
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-clinic-900 via-clinic-800 to-clinic-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-clinic-100 ring-1 ring-white/20">
                <Eye className="h-4 w-4" />
                Trusted Eye Hospital in Magadi, Karnataka
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                {clinic.clinic_name}
              </h1>
              <p className="font-kannada text-base font-semibold text-clinic-100 sm:text-lg">
                ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ, ಮಾಗಡಿ — ಸಮಗ್ರ ಕಣ್ಣಿನ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಕೇಂದ್ರ
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">
                {clinic.tagline}. Dedicated cataract microsurgery, laser procedures, and everyday ophthalmic care delivered with clarity and compassion for families across Magadi and Ramanagara district.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={`tel:${clinic.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-extrabold text-clinic-900 shadow-lg hover:bg-clinic-50"
                >
                  <PhoneCall className="h-4 w-4" />
                  Call {clinic.phone}
                </a>
                <button
                  type="button"
                  onClick={handleWhatsAppEnquiry}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-emerald-600"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Clinic
                </button>
                <a
                  href={clinic.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3.5 text-sm font-bold text-white hover:bg-white/20"
                >
                  <MapPin className="h-4 w-4" />
                  Directions
                </a>
              </div>
            </div>

            {/* Doctor & Quick Info Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
                <div className="flex items-start gap-3.5 border-b border-slate-100 pb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-clinic-50 text-clinic-700">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-clinic-700">
                      Chief Ophthalmic Surgeon
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">{clinic.doctor_name}</h2>
                    <div className="text-sm font-bold text-slate-600">{clinic.doctor_qualification}</div>
                    {clinic.doctor_kmc_no && (
                      <div className="mt-0.5 text-xs text-slate-500">KMC Reg: {clinic.doctor_kmc_no}</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-clinic-600" />
                    <span className="font-medium text-slate-700">{clinic.address}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-clinic-600" />
                    <span className="font-medium text-slate-700">{clinic.timings}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                    <span className="font-bold text-red-700">
                      Post-Op Emergency Helpline: {clinic.emergency_phone || clinic.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-clinic-700">
              Clinical Capabilities
            </div>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Complete Eye Care & Surgical Services
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Award className="h-4 w-4 text-clinic-600" />
            Day-Care Surgical Facility • Bilingual Post-Op Guidance
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((svc) => (
            <div
              key={svc.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-clinic-300"
            >
              <div className="mb-2 flex items-center gap-2 text-clinic-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <h3 className="text-base font-extrabold text-slate-900">{svc.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{svc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left">
          <div>
            <span className="font-bold text-slate-800">{clinic.clinic_name}</span> • {clinic.address}
            {clinic.kpme_reg_no ? ` • KPME Reg: ${clinic.kpme_reg_no}` : ''}
          </div>
          <div className="inline-flex items-center gap-1 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-clinic-600" />
            Digital Records & Bilingual Discharge Support
          </div>
        </div>
      </footer>
    </div>
  );
}
