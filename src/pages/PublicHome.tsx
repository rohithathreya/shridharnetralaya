import React from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Check,
  AlertCircle,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SERVICES } from '../data/clinicOfferings';
import { openWhatsApp } from '../lib/whatsapp';

const base = import.meta.env.BASE_URL;

export function PublicHome() {
  const { clinic } = useAuth();

  const handleWhatsAppBooking = () => {
    const text = `Namaste Dr. Malathesh / Shridhar Netralaya,\n\nI would like to schedule an eye consultation appointment at your Magadi clinic (Mon–Sat, 10 AM – 5 PM).\n\nPatient Name:\nPreferred Day / Time:\nIssue (Cataract / Eye Test / Retina / Other):\n\nThank you!`;
    openWhatsApp(clinic.phone, text);
  };

  return (
    <div className="bg-ink-950 text-ivory-50 selection:bg-gold-500 selection:text-ink-900">
      {/* ── 1. HERO SECTION ── */}
      <section className="relative overflow-hidden border-b border-ivory-50/10 px-5 pt-12 pb-20 sm:px-8 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-5xl">
          {/* Appointment Notice Pill */}
          <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-full border border-gold-400/30 bg-clinic-50/70 px-4 py-1.5 text-xs font-semibold text-gold-600 shadow-soft">
            <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
            <span>Mon – Sat: 10:00 AM – 5:00 PM</span>
            <span className="text-ivory-400">·</span>
            <span className="font-bold">Strictly by Prior Appointment · No Walk-Ins</span>
          </div>

          {/* Kannada Dedication */}
          <p className="font-kannada text-lg font-semibold text-gold-500 sm:text-xl">
            ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ · ಮಾಗಡಿ · ಡಾ. ಎಲ್. ಎಸ್. ಮಲತೇಶ
          </p>

          {/* Grand Headline */}
          <h1 className="mt-4 font-display text-[3.25rem] font-medium leading-[0.92] tracking-[-0.03em] text-ivory-50 sm:text-7xl lg:text-8xl">
            Thirty years of microsurgical mastery, in Magadi.
          </h1>

          {/* Editorial Subhead */}
          <p className="mt-6 max-w-2xl font-display text-xl leading-relaxed text-ivory-300 sm:text-2xl">
            Sutureless cataract phacoemulsification, precision biometry, and medical retina care for Ramanagara district. Unhurried, one-on-one clinical attention.
          </p>

          {/* Policy Guidance */}
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory-400">
            To ensure every patient receives meticulous, unhurried time with Dr. Malathesh, all consultations are scheduled strictly in advance. Please call or message to confirm your appointment before travelling.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={`tel:${clinic.phone}`}
              className="btn-primary !min-h-[54px] text-base font-semibold"
            >
              <Phone className="h-4 w-4" />
              Call {clinic.phone} to Book
            </a>
            <button
              type="button"
              onClick={handleWhatsAppBooking}
              className="btn-ghost !min-h-[54px] text-base font-semibold"
            >
              <MessageCircle className="h-4 w-4 text-gold-400" />
              Book on WhatsApp
            </button>
          </div>

          {/* 4 Key Pillars */}
          <div className="mt-14 grid grid-cols-2 gap-3 border-t border-ivory-50/10 pt-8 sm:grid-cols-4">
            <div className="rounded-2xl border border-ivory-50/10 bg-ink-900/60 p-4 shadow-soft">
              <div className="font-display text-2xl text-ivory-50 sm:text-3xl">30+ Yrs</div>
              <div className="mt-1 text-xs text-ivory-400">In Magadi town</div>
              <div className="font-kannada text-[11px] text-gold-500 mt-0.5">ಮಾಗಡಿಯಲ್ಲಿ ೩೦ ವರ್ಷ</div>
            </div>
            <div className="rounded-2xl border border-ivory-50/10 bg-ink-900/60 p-4 shadow-soft">
              <div className="font-display text-2xl text-ivory-50 sm:text-3xl">10 – 5</div>
              <div className="mt-1 text-xs text-ivory-400">Mon to Sat hours</div>
              <div className="font-kannada text-[11px] text-gold-500 mt-0.5">ಬೆಳಿಗ್ಗೆ ೧೦ ರಿಂದ ಸಂಜೆ ೫</div>
            </div>
            <div className="rounded-2xl border border-ivory-50/10 bg-ink-900/60 p-4 shadow-soft">
              <div className="font-display text-2xl text-ivory-50 sm:text-3xl">15 Mins</div>
              <div className="mt-1 text-xs text-ivory-400">Daycare Phaco</div>
              <div className="font-kannada text-[11px] text-gold-500 mt-0.5">ಹೊಲಿಗೆ ರಹಿತ ಫ್ಯಾಕೋ</div>
            </div>
            <div className="rounded-2xl border border-ivory-50/10 bg-ink-900/60 p-4 shadow-soft">
              <div className="font-display text-2xl text-ivory-50 sm:text-3xl">By Appt</div>
              <div className="mt-1 text-xs text-ivory-400">No crowded waiting</div>
              <div className="font-kannada text-[11px] text-gold-500 mt-0.5">ಮುಂಗಡ ಕಾಯ್ದಿರಿಸಿ</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CLINICAL DISCIPLINES & SERVICES ── */}
      <section className="border-b border-ivory-50/10 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mb-10 max-w-xl">
            <span className="eyebrow">Clinical care</span>
            <h2 className="mt-2 font-display text-4xl font-medium tracking-[-0.03em] text-ivory-50 sm:text-5xl">
              What we treat
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ivory-400">
              International ophthalmic surgical protocols conducted with uncompromised sterility in our dedicated microsurgical theatre.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <article
                key={s.id}
                className="flex flex-col justify-between rounded-3xl border border-ivory-50/10 bg-ink-900/80 p-6 shadow-soft transition hover:border-gold-400/40"
              >
                <div>
                  <p className="font-kannada text-xs font-semibold text-gold-500">{s.kannada}</p>
                  <h3 className="mt-1 font-display text-2xl text-ivory-50">{s.title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-ivory-400">{s.body}</p>
                </div>

                <div className="mt-6 border-t border-ivory-50/10 pt-4">
                  <a
                    href={`tel:${clinic.phone}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gold-400 hover:text-gold-300 transition"
                  >
                    <span>Schedule consultation</span>
                    <span>→</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. SURGEON PROFILE ── */}
      <section className="border-b border-ivory-50/10 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <span className="eyebrow">Consulting eye surgeon</span>
          <h2 className="mt-3 font-display text-4xl font-medium tracking-[-0.03em] text-ivory-50 sm:text-6xl">
            {clinic.doctor_name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-kannada text-lg text-gold-500 font-semibold">ಡಾ. ಎಲ್. ಎಸ್. ಮಲತೇಶ</span>
            <span className="text-xs text-ivory-400">·</span>
            <span className="text-xs font-medium text-ivory-400">
              MBBS (KMC Mangalore) · DOMS & FGO (KMC Manipal)
            </span>
          </div>

          <div className="mt-8 space-y-5 text-base leading-relaxed text-ivory-300 sm:text-lg">
            <p>
              Dr. Malathesh established Shridhar Netralaya so that a farmer in Ramanagara district or an elderly teacher in Magadi would never have to lose clear sight due to the cost and exhaustion of travelling 100km to Bangalore.
            </p>
            <p>
              Three decades at this exact address. Over 25,000 surgical operations performed — cataract microsurgery above all, alongside squint alignment, ptosis, pterygium autografts, and medical retina management.
            </p>
            <p>
              Trained at Kasturba Medical College and Manipal Academy of Higher Education, his practice combines precision ultrasound phacoemulsification with ethical, unhurried patient care.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. TIMINGS, APPOINTMENT POLICY & DIRECTIONS ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="grid gap-10 md:grid-cols-12">
            {/* Timings card */}
            <div className="space-y-6 md:col-span-5">
              <div>
                <span className="eyebrow">Hours & Access</span>
                <h2 className="mt-2 font-display text-3xl font-medium text-ivory-50 sm:text-4xl">
                  Consultation schedule
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-ivory-400">
                  Strictly by prior appointment. No walk-in queues.
                </p>
              </div>

              <div className="rounded-3xl border border-ivory-50/10 bg-ink-900/80 p-5 space-y-4 shadow-soft">
                <div className="border-b border-ivory-50/10 pb-3">
                  <div className="text-xs font-semibold text-ivory-400">Monday to Saturday</div>
                  <div className="mt-1 font-display text-3xl text-ivory-50">10:00 AM – 5:00 PM</div>
                  <div className="mt-1 text-xs text-gold-500 font-kannada">ಸೋಮವಾರದಿಂದ ಶನಿವಾರದವರೆಗೆ</div>
                </div>

                <div className="border-b border-ivory-50/10 pb-3">
                  <div className="text-xs font-semibold text-ivory-400">Sunday</div>
                  <div className="mt-1 text-base font-semibold text-ivory-200">
                    Closed (Emergency & Surgical Review On-Call)
                  </div>
                </div>

                <div className="rounded-2xl border border-gold-400/25 bg-clinic-50/60 p-3.5 text-xs text-ivory-300">
                  <div className="flex items-center gap-1.5 font-bold text-gold-600">
                    <AlertCircle className="h-4 w-4" />
                    Appointment Policy
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-ivory-400">
                    To maintain dedicated, unhurried time for each eye, please call or WhatsApp ahead to schedule your visit.
                  </p>
                </div>
              </div>
            </div>

            {/* Address & Booking details */}
            <div className="space-y-6 md:col-span-7">
              <div>
                <span className="eyebrow">Hospital address</span>
                <h2 className="mt-2 font-display text-3xl font-medium text-ivory-50 sm:text-4xl">
                  How to reach us
                </h2>
              </div>

              <div className="rounded-3xl border border-ivory-50/10 bg-ink-900/80 p-6 space-y-5 shadow-soft">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gold-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-ivory-50">{clinic.clinic_name}</div>
                    <div className="mt-1 text-sm leading-relaxed text-ivory-300">{clinic.address}</div>
                    <div className="mt-1 text-xs text-ivory-500">
                      Near Gramadevate Temple · 5 minutes from Magadi KSRTC Main Bus Stand
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2 border-t border-ivory-50/10">
                  <a
                    href={clinic.google_maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost !min-h-[46px] text-xs font-semibold"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open in Google Maps
                  </a>
                  <a
                    href={`tel:${clinic.phone}`}
                    className="btn-primary !min-h-[46px] text-xs font-semibold"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call {clinic.phone} to Book
                  </a>
                </div>
              </div>

              <div className="p-2">
                <div className="text-xs text-ivory-500">Direct Telephone Inquiries</div>
                <a
                  href={`tel:${clinic.phone}`}
                  className="font-display text-4xl font-medium text-ivory-50 hover:text-gold-400 transition"
                >
                  {clinic.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. MOBILE DOCK ── */}
      <div className="mobile-dock">
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:${clinic.phone}`} className="btn-primary !min-h-[46px] text-xs font-semibold">
            <Phone className="h-4 w-4" />
            Call to Book
          </a>
          <button
            type="button"
            onClick={handleWhatsAppBooking}
            className="btn-ghost !min-h-[46px] text-xs font-semibold"
          >
            <MessageCircle className="h-4 w-4 text-gold-400" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
