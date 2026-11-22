import React, { useRef, useState, useMemo } from 'react';
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Award,
  Sparkles,
  Eye,
  Glasses,
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Heart,
  Sliders,
  Calendar,
  AlertCircle,
  Stethoscope,
  Send,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SERVICES, ClinicServiceItem } from '../data/clinicOfferings';
import { openWhatsApp } from '../lib/whatsapp';

const base = import.meta.env.BASE_URL;

export function PublicHome() {
  const { clinic } = useAuth();

  // Interactive Vision Simulator state
  const [simCondition, setSimCondition] = useState<'cataract' | 'glaucoma' | 'diabetes'>('cataract');
  const [simSplit, setSimSplit] = useState(50); // percentage

  // Selected Service for modal detail
  const [selectedService, setSelectedService] = useState<ClinicServiceItem | null>(null);

  // FAQ accordion open index
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Interactive WhatsApp Appointment Booking Form
  const [bookName, setBookName] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookService, setBookService] = useState('Cataract Consultation (ಮೋತಿಬಿಂದು)');
  const [bookShift, setBookShift] = useState('Morning Clinic (9:30 AM – 2:00 PM)');
  const [bookSent, setBookSent] = useState(false);

  // Parse clinic timings
  const [weekRaw, sundayRaw] = clinic.timings.split('|').map((part) => part.trim());
  const weekBits = (weekRaw || clinic.timings).split(':');
  const dayLabel = /^mon/i.test(weekBits[0] || '') ? 'Monday to Saturday' : weekBits[0]?.trim() || 'Monday to Saturday';
  const sundayLabel = (sundayRaw || 'Emergency & Post-Op Review Only').replace(/^sun:\s*/i, '');
  const timeSlots = (weekBits.slice(1).join(':') || weekRaw || '')
    .split('&')
    .map((slot) => slot.trim())
    .filter(Boolean);

  // Real-time clinic open indicator
  const clinicStatus = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const hour = now.getHours() + now.getMinutes() / 60;

    if (day === 0) {
      return {
        isOpen: false,
        badge: 'Sunday: Emergency & Post-Op Care',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    }
    // Mon-Sat: 9.5 to 14.0 (Morning) & 16.5 to 19.5 (Evening)
    if (hour >= 9.5 && hour < 14) {
      return {
        isOpen: true,
        badge: 'OPD Open Now (Morning Clinic until 2:00 PM)',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    }
    if (hour >= 16.5 && hour < 19.5) {
      return {
        isOpen: true,
        badge: 'OPD Open Now (Evening Clinic until 7:30 PM)',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    }
    if (hour >= 14 && hour < 16.5) {
      return {
        isOpen: false,
        badge: 'Afternoon Break · Evening Clinic Opens at 4:30 PM',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    }
    return {
      isOpen: false,
      badge: 'Clinic Closed for the Day · Opens 9:30 AM Tomorrow',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }, []);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = [
      `*New Appointment Inquiry — Shridhar Netralaya*`,
      `Patient Name: *${bookName.trim() || 'Not specified'}*`,
      `Mobile: *${bookPhone.trim() || 'Not specified'}*`,
      `Required Service: *${bookService}*`,
      `Preferred Slot: *${bookShift}*`,
      ``,
      `Namaste Doctor, please confirm availability for consultation at your Magadi hospital. Thank you.`,
    ].join('\n');

    openWhatsApp(clinic.phone, message);
    setBookSent(true);
  };

  const handleQuickWhatsApp = (topic: string) => {
    const message = `Namaste Dr. Malathesh / Shridhar Netralaya Front Desk,\n\nI would like more information regarding *${topic}* at your Magadi clinic.\n\nPlease guide me regarding timings and consultation.\n\nThank you!`;
    openWhatsApp(clinic.phone, message);
  };

  const faqs = [
    {
      q: 'Is cataract surgery painful, and will there be injections or stitches?',
      kannadaQ: 'ಮೋತಿಬಿಂದು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ನೋವುಂಟುಮಾಡುತ್ತದೆಯೇ? ಚುಚ್ಚುಮದ್ದು ಅಥವಾ ಹೊಲಿಗೆ ಇರುತ್ತದೆಯೇ?',
      a: 'Not at all. At Shridhar Netralaya, we perform sutureless Phacoemulsification under topical anesthesia (numbing eye drops). There are NO painful needle injections around the eye, and zero stitches. The microscopic 2mm incision self-seals naturally, and the procedure takes just 15 minutes.',
    },
    {
      q: 'How long do I need to stay in the hospital after surgery?',
      kannadaQ: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಎಷ್ಟು ದಿನ ಇರಬೇಕು?',
      a: 'Cataract surgery is a modern Daycare procedure. You walk in on the morning of surgery, undergo the 15-minute procedure, rest comfortably in our observation lounge for 30–60 minutes, and walk home the very same day. No overnight hospital admission is required.',
    },
    {
      q: 'Which lens (IOL) is best for me — Monofocal, Multifocal, or Toric?',
      kannadaQ: 'ನನಗೆ ಯಾವ ಲೆನ್ಸ್ ಸೂಕ್ತ — ಮೊನೊಫೋಕಲ್, ಮಲ್ಟಿಫೋಕಲ್ ಅಥವಾ ಟೋರಿಕ್?',
      a: 'During your pre-operative evaluation, Dr. Malathesh uses high-precision optical biometry to examine your eye shape and lifestyle needs. Monofocal lenses give pristine distance vision (with reading glasses for small print); Multifocal lenses provide sharp vision for both distance and reading; and Toric lenses correct astigmatism (cylindrical power). We help you make an informed, pressure-free choice.',
    },
    {
      q: 'Do you treat diabetic eye disease and high blood pressure effects?',
      kannadaQ: 'ಮಧುಮೇಹ ಮತ್ತು ರಕ್ತದೊತ್ತಡದ ಕಣ್ಣಿನ ತೊಂದರೆಗಳಿಗೆ ಚಿಕಿತ್ಸೆ ಸಿಗುತ್ತದೆಯೇ?',
      a: 'Yes. Diabetic retinopathy and hypertensive retinopathy can silently damage the retina without any early pain. We conduct comprehensive dilated indirect ophthalmoscopy to detect retinal bleeding, microaneurysms, and macular swelling early, preventing irreversible blindness.',
    },
    {
      q: 'Do I need prior appointment, or can I walk in directly?',
      kannadaQ: 'ತಪಾಸಣೆಗೆ ಮೊದಲೇ ಬುಕ್ ಮಾಡಬೇಕೇ ಅಥವಾ ನೇರವಾಗಿ ಬರಬಹುದೇ?',
      a: 'Walk-in patients are warmly welcomed during our regular OPD hours (Monday to Saturday: 9:30 AM – 2:00 PM and 4:30 PM – 7:30 PM). However, to avoid waiting, you can pre-book your slot in 30 seconds via WhatsApp or phone.',
    },
    {
      q: 'When can I take a head bath and resume daily work after cataract surgery?',
      kannadaQ: 'ಆಪರೇಷನ್ ಆದ ನಂತರ ತಲೆಸ್ನಾನ ಯಾವಾಗ ಮಾಡಬಹುದು?',
      a: 'You can watch television and walk around inside your home from the very next day. We advise wearing protective sunglasses outdoors to shield against dust. Typically, head bath is permitted after 14 days to prevent tap water from entering the healing eye. Complete bilingual post-op instructions are provided on your discharge summary.',
    },
  ];

  return (
    <div className="bg-slate-50 text-slate-900 selection:bg-clinic-700 selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-clinic-50/80 via-white to-slate-50 pt-8 pb-16 sm:pt-14 sm:pb-24">
        {/* Ambient background decoration */}
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-clinic-200/40 blur-3xl" />
        <div className="pointer-events-none absolute top-48 -left-20 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Hospital Messaging */}
            <div className="space-y-6 lg:col-span-7">
              {/* Trust Badge & Live Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-clinic-300 bg-white px-3.5 py-1 text-xs font-bold text-clinic-800 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-clinic-600" />
                  Ramanagara District • KPME Registered
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${clinicStatus.color}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                  {clinicStatus.badge}
                </span>
              </div>

              {/* Kannada Cultural Connect */}
              <div className="border-l-4 border-clinic-600 pl-3">
                <p className="font-kannada text-base font-semibold text-clinic-800 sm:text-lg">
                  ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ — ಮಾಗಡಿಯಲ್ಲಿ 30+ ವರ್ಷಗಳ ನಂಬಿಕಾರ್ಹ ಕಣ್ಣಿನ ಆಸ್ಪತ್ರೆ
                </p>
                <p className="font-kannada text-xs text-slate-600">
                  ಬೆಂಗಳೂರಿಗೆ ಹೋಗುವ ಅಲೆದಾಟವಿಲ್ಲದೆ, ವಿಶ್ವದರ್ಜೆಯ ಫ್ಯಾಕೋ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಇಲ್ಲೇ ಲಭ್ಯ.
                </p>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.08]">
                World-Class Eye Microsurgery,{' '}
                <span className="bg-gradient-to-r from-clinic-800 via-clinic-700 to-clinic-900 bg-clip-text text-transparent">
                  Right Here in Magadi.
                </span>
              </h1>

              {/* Subtitle Copy */}
              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                No need to endure exhausting 100km highway travel to Bengaluru. Led by{' '}
                <strong className="text-slate-900 font-bold">
                  Dr. L. S. Malathesh (MBBS, DOMS, FGO — KMC Manipal)
                </strong>
                , Shridhar Netralaya brings 30+ years of surgical mastery, sutureless ultrasonic Phaco cataract surgery,
                and comprehensive vision care right to your doorstep.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleQuickWhatsApp('General Consultation')}
                  className="btn-whatsapp text-base"
                >
                  <MessageCircle className="h-5 w-5" />
                  Book on WhatsApp
                </button>
                <a href={`tel:${clinic.phone}`} className="btn-ghost text-base">
                  <Phone className="h-5 w-5 text-clinic-700" />
                  Call {clinic.phone}
                </a>
              </div>

              {/* Trust Metric Pillars */}
              <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-sm">
                  <div className="text-2xl font-black text-clinic-800">30+</div>
                  <div className="text-xs font-semibold text-slate-700">Years in Magadi</div>
                  <div className="text-[11px] text-slate-500 font-kannada">30 ವರ್ಷಗಳ ಸೇವೆ</div>
                </div>
                <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-sm">
                  <div className="text-2xl font-black text-clinic-800">25,000+</div>
                  <div className="text-xs font-semibold text-slate-700">Surgeries Performed</div>
                  <div className="text-[11px] text-slate-500 font-kannada">ಯಶಸ್ವಿ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ</div>
                </div>
                <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-sm">
                  <div className="text-2xl font-black text-clinic-800">15 Mins</div>
                  <div className="text-xs font-semibold text-slate-700">Daycare Phaco</div>
                  <div className="text-[11px] text-slate-500 font-kannada">ಹೊಲಿಗೆ ರಹಿತ ಚಿಕಿತ್ಸೆ</div>
                </div>
                <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3 shadow-sm">
                  <div className="text-2xl font-black text-clinic-800">100%</div>
                  <div className="text-xs font-semibold text-slate-700">Topical Drop Anesthesia</div>
                  <div className="text-[11px] text-slate-500 font-kannada">ಚುಚ್ಚುಮದ್ದಿಲ್ಲದೆ</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Interactive Feature Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-clinic-200 bg-white p-6 shadow-xl shadow-clinic-900/5">
                <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                  ★ Ramanagara's Choice
                </div>

                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clinic-50 text-clinic-700">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Dr. L. S. Malathesh</h2>
                    <p className="text-xs text-slate-500">Chief Eye Surgeon · MBBS, DOMS, FGO</p>
                    <p className="text-[11px] font-semibold text-clinic-700">KMC Manipal Alumnus</p>
                  </div>
                </div>

                <div className="space-y-3.5 py-4 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>
                      <strong className="text-slate-900 font-semibold">Micro-Incision Phacoemulsification:</strong>{' '}
                      Ultrasonic cataract removal with foldable intraocular lens implantation.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>
                      <strong className="text-slate-900 font-semibold">Zero-Needle Topical Anesthesia:</strong> Numbing
                      eye drops only. No painful eye block injection, no bandage over face.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>
                      <strong className="text-slate-900 font-semibold">Fast 2-Hour Daycare Discharge:</strong> Return
                      home the very same morning with your family.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>
                      <strong className="text-slate-900 font-semibold">Digital Optometry & Retina Lab:</strong> Accurate
                      spectacle refraction and diabetic retinopathy screening.
                    </span>
                  </div>
                </div>

                {/* Quick Consultation CTA */}
                <div className="mt-2 rounded-2xl border border-clinic-100 bg-clinic-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Need Immediate Help?</div>
                      <div className="text-[11px] text-slate-600">Talk directly with our Magadi reception</div>
                    </div>
                    <a
                      href={`tel:${clinic.phone}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-clinic-800 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-clinic-700"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {clinic.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE VISION SIMULATOR */}
      <section id="simulator" className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="text-center">
            <span className="step-badge">Interactive Vision Simulator</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Experience the Difference Clear Vision Makes
            </h2>
            <p className="font-kannada mt-2 text-sm text-clinic-700 sm:text-base">
              ನಿಮ್ಮ ಕಣ್ಣಿನಲ್ಲಿ ಮಂಜು, ಕತ್ತಲೆ ಅಥವಾ ದೃಷ್ಟಿ ದೋಷವಿದೆಯೇ? ಕೆಳಗಿನ ಸ್ಲೈಡರ್ ಬಳಸಿ ವ್ಯತ್ಯಾಸ ನೋಡಿ.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              Elderly parents often think blurry vision is an unavoidable part of aging. Compare how cataracts and
              retinal conditions affect daily sight — and how modern treatment restores sharp clarity.
            </p>
          </div>

          {/* Condition Switcher */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setSimCondition('cataract')}
              className={`choice-chip ${simCondition === 'cataract' ? 'choice-chip-on' : 'choice-chip-off'}`}
            >
              👁️ Cataract (ಮೋತಿಬಿಂದು)
            </button>
            <button
              type="button"
              onClick={() => setSimCondition('glaucoma')}
              className={`choice-chip ${simCondition === 'glaucoma' ? 'choice-chip-on' : 'choice-chip-off'}`}
            >
              ⭕ Glaucoma (ಗ್ಲುಕೋಮಾ - ಸೈಲೆಂಟ್ ಪ್ರೆಶರ್)
            </button>
            <button
              type="button"
              onClick={() => setSimCondition('diabetes')}
              className={`choice-chip ${simCondition === 'diabetes' ? 'choice-chip-on' : 'choice-chip-off'}`}
            >
              🩸 Diabetic Retinopathy (ಮಧುಮೇಹ ಕಣ್ಣಿನ ಕಲೆ)
            </button>
          </div>

          {/* Interactive Simulation Frame */}
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-300 bg-slate-900 shadow-xl">
            <div className="relative h-[22rem] sm:h-[28rem] w-full select-none overflow-hidden">
              {/* Background: Simulated Clean / Restored Vision */}
              <div
                className="absolute inset-0 bg-cover bg-center flex items-center justify-center p-8 text-center"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7)), url("https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80")',
                }}
              >
                <div className="max-w-md text-white drop-shadow-md">
                  <div className="inline-block rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    Post-Treatment Vision (HD Clarity)
                  </div>
                  <h3 className="mt-3 text-2xl font-black sm:text-3xl">Crisp, Vibrant Sight</h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-100">
                    Read newspapers easily, see loved ones' smiles, and move outdoors without hesitation.
                  </p>
                </div>
              </div>

              {/* Foreground: Condition Layer with clipping */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white/90 shadow-2xl transition-all"
                style={{
                  width: `${simSplit}%`,
                  backgroundImage:
                    'linear-gradient(rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.8)), url("https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80")',
                  filter:
                    simCondition === 'cataract'
                      ? 'blur(5px) contrast(65%) sepia(40%)'
                      : simCondition === 'glaucoma'
                      ? 'contrast(120%) brightness(55%)'
                      : 'blur(2px) contrast(80%) saturate(60%)',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center w-[100vw] max-w-6xl">
                  <div className="max-w-md text-white drop-shadow-md">
                    <div className="inline-block rounded-full bg-amber-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Untreated Condition
                    </div>
                    <h3 className="mt-3 text-2xl font-black sm:text-3xl text-amber-200">
                      {simCondition === 'cataract'
                        ? 'Cataract Haze & Glare'
                        : simCondition === 'glaucoma'
                        ? 'Tunnel Vision & Darkness'
                        : 'Patchy Blurred Retina'}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-200">
                      {simCondition === 'cataract'
                        ? 'Cloudy lens scatters light, fades contrast, and makes nighttime mobility hazardous.'
                        : simCondition === 'glaucoma'
                        ? 'Peripheral vision is gradually erased while central vision falsely appears fine.'
                        : 'Bleeding in small retinal vessels creates blind spots and fluctuating blur.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Split Slider Handle */}
              <div
                className="pointer-events-none absolute inset-y-0 flex items-center justify-center -ml-4 z-20"
                style={{ left: `${simSplit}%` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-clinic-900 shadow-2xl border-2 border-clinic-600">
                  <Sliders className="h-4 w-4" />
                </div>
              </div>

              {/* Native range input slider overlaid for mobile & desktop touch */}
              <input
                type="range"
                min="5"
                max="95"
                value={simSplit}
                onChange={(e) => setSimSplit(Number(e.target.value))}
                className="absolute inset-0 z-30 h-full w-full opacity-0 cursor-ew-resize"
                aria-label="Vision comparison slider"
              />
            </div>

            {/* Slider Control Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">← Slide left to see HD vision</span>
                <span className="hidden sm:inline">|</span>
                <span className="text-slate-400">Slide right to see condition severity</span>
              </div>
              <button
                type="button"
                onClick={() => handleQuickWhatsApp(`Vision Evaluation for ${simCondition}`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-clinic-600 px-4 py-2 font-bold text-white hover:bg-clinic-500 transition"
              >
                <MessageCircle className="h-4 w-4" />
                Schedule a 15-Min Eye Check
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CLINICAL EXCELLENCE & SPECIALTIES */}
      <section id="services" className="py-16 sm:py-24 border-b border-slate-200/80 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="step-badge">Comprehensive Eye Care</span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Advanced Clinical & Surgical Specialties
              </h2>
              <p className="font-kannada mt-2 text-sm text-clinic-700 sm:text-base">
                ಮಾಗಡಿ ಹಾಗೂ ಸುತ್ತಮುತ್ತಲಿನ ಹಳ್ಳಿಗಳ ಜನರಿಗಾಗಿ ಲಭ್ಯವಿರುವ ಸಮಗ್ರ ನೇತ್ರ ಚಿಕಿತ್ಸೆಗಳು
              </p>
            </div>
            <p className="max-w-md text-xs sm:text-sm text-slate-600">
              Every procedure is conducted under stringent sterilization protocols in our laminar airflow operating
              theatre using micro-surgical precision optics.
            </p>
          </div>

          {/* Services Grid */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <article
                key={service.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:border-clinic-400 hover:shadow-xl"
              >
                <div>
                  {/* Category & Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-clinic-700">
                      {service.category}
                    </span>
                    <span className="rounded-full bg-clinic-50 px-2.5 py-0.5 text-[11px] font-extrabold text-clinic-800 border border-clinic-200">
                      {service.tag}
                    </span>
                  </div>

                  {/* Kannada title */}
                  <p className="font-kannada mt-3 text-xs font-semibold text-clinic-600">{service.kannadaFull}</p>

                  {/* Title */}
                  <h3 className="mt-1 font-display text-xl font-bold text-slate-900 group-hover:text-clinic-800 transition">
                    {service.title}
                  </h3>

                  {/* Body description */}
                  <p className="mt-3 text-xs leading-relaxed text-slate-600">{service.body}</p>

                  {/* Bullet Highlights */}
                  <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-[11px] text-slate-700">
                    {service.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-3">
                    <span>⏱ {service.duration}</span>
                    <span className="text-emerald-700 font-bold">✓ {service.recovery}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickWhatsApp(service.title)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-clinic-200 bg-clinic-50/80 py-2.5 text-xs font-bold text-clinic-900 hover:bg-clinic-600 hover:text-white transition active:scale-95"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Inquire on WhatsApp
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. THE 3-STEP CATARACT DAYCARE JOURNEY */}
      <section id="cataract-journey" className="border-b border-slate-200/80 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="text-center">
            <span className="step-badge">Patient Care Protocol</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              The 15-Minute Daycare Cataract Journey
            </h2>
            <p className="font-kannada mt-2 text-sm text-clinic-700 sm:text-base">
              ಹೊಲಿಗೆ ಇಲ್ಲ, ನೋವಿಲ್ಲ, ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ರಾತ್ರಿ ಉಳಿಯುವ ಅವಶ್ಯಕತೆಯಿಲ್ಲ — ಹಂತ ಹಂತದ ಮಾಹಿತಿ
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              We understand that surgery can make families nervous. Here is exactly what happens from the moment you
              walk into Shridhar Netralaya until you walk home with restored vision.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clinic-700 text-white font-black text-lg">
                1
              </div>
              <p className="font-kannada mt-4 text-xs font-bold text-clinic-700">ಹಂತ ೧ · ನಿಖರ ತಪಾಸಣೆ</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Digital Pre-Op Evaluation (Day 1)</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Dr. Malathesh performs a slit lamp examination, intraocular pressure measurement, and computerized
                optical biometry (A-Scan) to calculate the exact power for your custom foldable lens.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-600 font-medium">
                <li>• Slit lamp corneal evaluation</li>
                <li>• Optical IOL power calculation</li>
                <li>• Blood pressure & sugar check</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-3xl border border-clinic-400 bg-clinic-50/60 p-6 shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-lg">
                2
              </div>
              <p className="font-kannada mt-4 text-xs font-bold text-clinic-700">ಹಂತ ೨ · ೧೫ ನಿಮಿಷಗಳ ಚಿಕಿತ್ಸೆ</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">The 15-Min Phaco Surgery (Day 2)</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Numbing eye drops are gently placed (no painful needle block injections). High-frequency ultrasound
                gently liquefies the cloudy cataract through a micro 2mm opening, and your foldable IOL is implanted.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700 font-semibold">
                <li>• Zero needle injections (Topical drops)</li>
                <li>• Zero stitches or sutures</li>
                <li>• Premium foldable intraocular lens</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clinic-700 text-white font-black text-lg">
                3
              </div>
              <p className="font-kannada mt-4 text-xs font-bold text-clinic-700">ಹಂತ ೩ · ಅಂದೇ ಮನೆಗೆ ವಾಪಸ್</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Walk Home Same Day (Daycare)</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                After relaxing 30 minutes in our daycare recovery lounge, you are provided with protective glasses,
                detailed bilingual drops schedule, and walk home with your family. Functional vision begins next morning!
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-600 font-medium">
                <li>• Same-day discharge within 2 hours</li>
                <li>• Bilingual WhatsApp instructions</li>
                <li>• 24/7 post-op emergency support</li>
              </ul>
            </div>
          </div>

          {/* IOL Lenses Comparison Guide */}
          <div className="mt-12 rounded-3xl border border-slate-200 bg-gradient-to-r from-clinic-900 via-clinic-800 to-clinic-900 p-6 text-white shadow-xl sm:p-10">
            <div className="max-w-2xl">
              <span className="rounded-full bg-clinic-700/80 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-clinic-200">
                Lens Selection Guide
              </span>
              <h3 className="mt-3 font-display text-2xl font-bold sm:text-3xl text-white">
                Choosing the Right Intraocular Lens (IOL) for Your Life
              </h3>
              <p className="font-kannada mt-2 text-xs text-clinic-300">
                ನಿಮ್ಮ ದೈನಂದಿನ ಜೀವನಕ್ಕೆ ಸರಿಹೊಂದುವ ಅತ್ಯುತ್ತಮ ಲೆನ್ಸ್ ಆಯ್ಕೆ ಮಾಡಲು ನಾವು ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇವೆ.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-sm font-bold text-emerald-300">Monofocal Lens</div>
                <div className="text-[11px] text-clinic-200 font-kannada">ಮೊನೊಫೋಕಲ್ ಲೆನ್ಸ್</div>
                <p className="mt-2 text-xs text-slate-200">
                  Provides razor-sharp distance clarity (driving, television, walking). Simple reading glasses are used
                  for near small print. Most economical and widely chosen.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-sm font-bold text-sky-300">Multifocal / EDOF Lens</div>
                <div className="text-[11px] text-clinic-200 font-kannada">ಮಲ್ಟಿಫೋಕಲ್ ಲೆನ್ಸ್</div>
                <p className="mt-2 text-xs text-slate-200">
                  Multiple focal points allow you to see distance, computer screens, and read newspapers with minimal
                  or zero spectacle dependence.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-sm font-bold text-amber-300">Toric Astigmatism Lens</div>
                <div className="text-[11px] text-clinic-200 font-kannada">ಟೋರಿಕ್ ಸಿಲಿಂಡರ್ ಲೆನ್ಸ್</div>
                <p className="mt-2 text-xs text-slate-200">
                  Engineered specifically for eyes with pre-existing cylindrical power (corneal astigmatism), eliminating
                  distortions without thick glasses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MEET THE CHIEF EYE SURGEON */}
      <section id="doctor" className="py-16 sm:py-24 border-b border-slate-200/80 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Left: Surgeon Credentials & Narrative */}
            <div className="space-y-6 lg:col-span-7">
              <span className="step-badge">Consulting Eye Surgeon & Medical Director</span>
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                {clinic.doctor_name}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-clinic-100 px-3 py-1 font-kannada text-sm font-bold text-clinic-900">
                  ಡಾ. ಎಲ್. ಎಸ್. ಮಲತೇಶ
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  MBBS (KMC Mangalore) · DOMS, FGO (KMC Manipal)
                </span>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                <p>
                  Dr. L. S. Malathesh founded Shridhar Netralaya with a single, uncompromising conviction:{' '}
                  <em>
                    "A villager or farmer in Ramanagara district should not lose their precious eyesight simply because
                    the bus ride to Bengaluru was too costly or exhausting."
                  </em>
                </p>
                <p>
                  Having trained at the prestigious <strong className="text-slate-900">Kasturba Medical College</strong>{' '}
                  and <strong className="text-slate-900">Manipal University</strong>, Dr. Malathesh chose to dedicate
                  his life to Magadi town. Over the past three decades at this exact address, he has performed more than{' '}
                  <strong className="text-slate-900">25,000 successful ophthalmic microsurgeries</strong>.
                </p>
                <p>
                  From routine sutureless cataract phacoemulsification and pterygium autografts to pediatric squint
                  therapy and emergency foreign body removals, Dr. Malathesh pairs international clinical standards with
                  deep local warmth and ethical, transparent fees.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 30+ Years Continuous Service
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> KMC Registered Eye Surgeon
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Over 25,000 Happy Restored Eyes
                </div>
              </div>
            </div>

            {/* Right: Doctor's Clinical Quote & Badges */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-clinic-200 bg-white p-6 shadow-xl sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clinic-50 text-clinic-700">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-clinic-700">Surgeon's Pledge</div>
                    <div className="text-sm font-extrabold text-slate-900">Compassionate, Honest Eye Care</div>
                  </div>
                </div>

                <blockquote className="mt-6 border-l-2 border-clinic-500 pl-4 text-sm italic text-slate-700">
                  “When an elderly grandmother from a nearby village sees her grandchildren clearly for the first time
                  in five years, no achievement in the world compares to that smile. That is why we are here in Magadi.”
                </blockquote>

                <div className="mt-6 space-y-2 border-t border-slate-100 pt-6 text-xs text-slate-600">
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-slate-900">Primary Specialization:</span>
                    <span>Phaco Microsurgery & Refraction</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-slate-900">Medical Council Reg:</span>
                    <span>Karnataka Medical Council (KMC)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-slate-900">Hospital KPME Reg:</span>
                    <span>{clinic.kpme_reg_no || 'KPME Registered Centre'}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => handleQuickWhatsApp('Consultation with Dr. Malathesh')}
                    className="btn-primary w-full text-xs"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Book Consultation with Dr. Malathesh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE CONSULTATION & WHATSAPP APPOINTMENT WIDGET */}
      <section className="py-16 sm:py-24 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <div className="rounded-3xl border border-clinic-300 bg-gradient-to-b from-clinic-50/70 to-white p-6 shadow-xl sm:p-10">
            <div className="text-center">
              <span className="step-badge">Easy 1-Minute Booking</span>
              <h2 className="mt-3 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                Schedule Your Eye Consultation or Inquire on WhatsApp
              </h2>
              <p className="font-kannada mt-1 text-xs text-clinic-700 sm:text-sm">
                ಹೆಸರು ಮತ್ತು ಮೊಬೈಲ್ ನಂಬರ್ ಹಾಕಿ, ನೇರವಾಗಿ ವಾಟ್ಸಾಪ್ ಮೂಲಕ ಸಮಯ ನಿಗದಿಪಡಿಸಿ.
              </p>
              <p className="mx-auto mt-2 max-w-lg text-xs text-slate-600">
                Prefer to talk? You can also call us directly at{' '}
                <a href={`tel:${clinic.phone}`} className="font-bold text-clinic-700 underline">
                  {clinic.phone}
                </a>
              </p>
            </div>

            <form onSubmit={handleBookingSubmit} className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Patient Full Name / ರೋಗಿಯ ಹೆಸರು</label>
                  <input
                    type="text"
                    required
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Mobile Number / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ</label>
                  <input
                    type="tel"
                    required
                    value={bookPhone}
                    onChange={(e) => setBookPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-field">Service Required / ಬೇಕಾದ ಚಿಕಿತ್ಸೆ</label>
                  <select
                    value={bookService}
                    onChange={(e) => setBookService(e.target.value)}
                    className="input-field"
                  >
                    <option value="Cataract Consultation (ಮೋತಿಬಿಂದು)">Cataract Consultation (ಮೋತಿಬಿಂದು)</option>
                    <option value="Computer Eye Test & Specs (ಕನ್ನಡಕ ಪರೀಕ್ಷೆ)">
                      Computer Eye Test & Specs (ಕನ್ನಡಕ ಪರೀಕ್ಷೆ)
                    </option>
                    <option value="Diabetic Retina Check (ಮಧುಮೇಹ ತಪಾಸಣೆ)">
                      Diabetic Retina Check (ಮಧುಮೇಹ ತಪಾಸಣೆ)
                    </option>
                    <option value="Glaucoma / Eye Pain (ಕಣ್ಣಿನ ಒತ್ತಡ)">Glaucoma / Eye Pain (ಕಣ್ಣಿನ ಒತ್ತಡ)</option>
                    <option value="Pterygium / Lid Issue (ರೆಪ್ಪೆ / ಮಾಂಸಖಂಡ)">
                      Pterygium / Lid Issue (ರೆಪ್ಪೆ / ಮಾಂಸಖಂಡ)
                    </option>
                    <option value="General Eye Checkup (ಸಾಮಾನ್ಯ ತಪಾಸಣೆ)">
                      General Eye Checkup (ಸಾಮಾನ್ಯ ತಪಾಸಣೆ)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Preferred OPD Timing / ಅನುಕೂಲಕರ ಸಮಯ</label>
                  <select
                    value={bookShift}
                    onChange={(e) => setBookShift(e.target.value)}
                    className="input-field"
                  >
                    <option value="Morning Clinic (9:30 AM – 2:00 PM)">Morning Clinic (9:30 AM – 2:00 PM)</option>
                    <option value="Evening Clinic (4:30 PM – 7:30 PM)">Evening Clinic (4:30 PM – 7:30 PM)</option>
                    <option value="Sunday Urgent / Post-Op Review">Sunday Urgent / Post-Op Review</option>
                  </select>
                </div>
              </div>

              {bookSent && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-semibold text-emerald-800">
                  ✓ Opening WhatsApp with your appointment details! Our reception will confirm your slot shortly.
                </div>
              )}

              <div className="pt-2">
                <button type="submit" className="btn-whatsapp w-full text-base">
                  <Send className="h-5 w-5" />
                  Confirm & Send on WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 7. PATIENT TESTIMONIALS & REVIEWS */}
      <section className="py-16 sm:py-24 border-b border-slate-200/80 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="text-center">
            <span className="step-badge">Patient Experiences</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Trusted by Generations Across Ramanagara District
            </h2>
            <p className="font-kannada mt-2 text-sm text-clinic-700 sm:text-base">
              ನಮ್ಮ ರೋಗಿಗಳ ನೈಜ ಅನುಭವಗಳು ಮತ್ತು ಕೃತಜ್ಞತೆಗಳು
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <div className="flex text-amber-400 text-sm">★★★★★</div>
                <p className="mt-3 text-xs leading-relaxed text-slate-700">
                  “I was terrified of having surgery. But Dr. Malathesh put only eye drops — no injections at all! The
                  phaco was over in 15 minutes. The very next morning I could read the newspaper and see my grandchildren
                  clearly.”
                </p>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-900">Nagarathnamma, 68 yrs</div>
                <div className="text-[11px] text-slate-500">Magadi Town · Cataract Phaco</div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <div className="flex text-amber-400 text-sm">★★★★★</div>
                <p className="mt-3 text-xs leading-relaxed text-slate-700">
                  “Got my diabetic eye checkup and new progressive glasses here. The computerized eye test was very
                  thorough, staff is polite, and prices are very honest. Magadi is truly blessed to have this hospital.”
                </p>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-900">Venkatesh Murthy, 54 yrs</div>
                <div className="text-[11px] text-slate-500">Solur · Retina Checkup & Specs</div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <div className="flex text-amber-400 text-sm">★★★★★</div>
                <p className="mt-3 text-xs leading-relaxed text-slate-700">
                  “We brought my mother from Bengaluru because big private hospitals quoted ₹75,000. Dr. Malathesh did
                  the same foldable IOL surgery with unmatched gentleness and zero complications at a fraction of the
                  cost.”
                </p>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-900">Chandrashekar (Tech Lead)</div>
                <div className="text-[11px] text-slate-500">Bengaluru / Tavarekere · Cataract</div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <div className="flex text-amber-400 text-sm">★★★★★</div>
                <p className="mt-3 text-xs leading-relaxed text-slate-700">
                  “Dr. Malathesh diagnosed my daughter's squint early and treated it patiently. He treats every patient
                  like family. We never have to worry about where to go for our eyes.”
                </p>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="text-xs font-bold text-slate-900">Pushpalatha, 38 yrs</div>
                <div className="text-[11px] text-slate-500">Kudur · Pediatric Eye Care</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS (ACCORDION) */}
      <section id="faqs" className="py-16 sm:py-24 border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <div className="text-center">
            <span className="step-badge">Patient Clarity</span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="font-kannada mt-2 text-sm text-clinic-700 sm:text-base">
              ಚಿಕಿತ್ಸೆ ಮತ್ತು ವೆಚ್ಚದ ಬಗ್ಗೆ ಸಾಮಾನ್ಯವಾಗಿ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೋತ್ತರಗಳು
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-bold text-slate-900 hover:text-clinic-800 transition"
                  >
                    <span>
                      {faq.q}
                      <span className="block font-kannada text-xs font-semibold text-clinic-700 mt-1">
                        {faq.kannadaQ}
                      </span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-clinic-700" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-200/70 bg-white px-5 py-4 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. SCHEDULE, EMERGENCY & ROUTE MAP */}
      <section id="schedule" className="py-16 sm:py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Timings Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg lg:col-span-6 sm:p-8">
              <span className="step-badge">Clinic Timings</span>
              <h2 className="mt-3 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                OPD Consultation Schedule
              </h2>
              <p className="font-kannada mt-1 text-xs text-clinic-700">ಸೋಮವಾರದಿಂದ ಶನಿವಾರದವರೆಗೆ ದಿನಕ್ಕೆ ೨ ಪಾಳಿಗಳು</p>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-clinic-200 bg-clinic-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-clinic-800">Morning Shift</span>
                    <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Primary OPD
                    </span>
                  </div>
                  <div className="mt-1 font-display text-2xl font-black text-slate-900">
                    {timeSlots[0] || '9:30 AM – 2:00 PM'}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Monday to Saturday · Consultations, Surgeries & Biometry</p>
                </div>

                <div className="rounded-2xl border border-clinic-200 bg-clinic-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-clinic-800">Evening Shift</span>
                    <span className="rounded-full bg-clinic-700 px-2 py-0.5 text-[10px] font-bold text-white">
                      Evening OPD
                    </span>
                  </div>
                  <div className="mt-1 font-display text-2xl font-black text-slate-900">
                    {timeSlots[1] || '4:30 PM – 7:30 PM'}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Monday to Saturday · Working hours consultation & spectacles testing
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Sunday Clinic</span>
                    <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Special Care
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{sundayLabel}</div>
                  <p className="mt-1 text-xs text-slate-600">
                    Dedicated post-operative checkups and urgent eye emergencies.
                  </p>
                </div>
              </div>
            </div>

            {/* Address & Navigation Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg lg:col-span-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="step-badge">Hospital Location</span>
                <h2 className="mt-3 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                  Easy to Reach in Magadi
                </h2>
                <p className="font-kannada mt-1 text-xs text-clinic-700">ಗ್ರಾಮದೇವತೆ ದೇವಾಲಯದ ಹತ್ತಿರ, ಮಾಗಡಿ</p>

                <div className="mt-6 space-y-3.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-clinic-700 mt-0.5" />
                    <div>
                      <strong className="block text-slate-900 font-bold text-sm">Shridhar Netralaya</strong>
                      <span className="leading-relaxed">{clinic.address}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="font-bold text-slate-900">Nearby Landmarks:</div>
                    <ul className="mt-1 list-disc list-inside space-y-0.5 text-slate-600">
                      <li>Near Gramadevate Temple</li>
                      <li>Just 5 minutes from Magadi KSRTC Main Bus Stand</li>
                      <li>Convenient auto-rickshaw access from all town corners</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold">Direct Telephone:</span>
                    <a href={`tel:${clinic.phone}`} className="font-bold text-clinic-800 text-sm">
                      {clinic.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-2.5">
                <a
                  href={clinic.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary w-full text-xs"
                >
                  <MapPin className="h-4 w-4" />
                  Open in Google Maps Navigation
                </a>
                <button
                  type="button"
                  onClick={() => handleQuickWhatsApp('Directions to Shridhar Netralaya')}
                  className="btn-whatsapp w-full text-xs"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask for Directions on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. COMPREHENSIVE MEDICAL FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="font-display text-xl font-bold text-white">{clinic.clinic_name}</div>
              <p className="font-kannada text-xs font-semibold text-clinic-300 mt-0.5">ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ, ಮಾಗಡಿ</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Advanced ophthalmic microsurgery, sutureless cataract phacoemulsification, computerized vision testing,
                and comprehensive eye care for Magadi and Ramanagara district.
              </p>
              <div className="mt-4 text-[11px] text-slate-400">
                KPME Reg: <span className="text-white font-semibold">{clinic.kpme_reg_no || 'Registered'}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white">Medical Director</div>
              <p className="mt-3 text-sm font-bold text-white">{clinic.doctor_name}</p>
              <p className="text-xs text-clinic-300">{clinic.doctor_qualification}</p>
              <p className="mt-2 text-xs text-slate-400">
                Alumnus of KMC Manipal & Kasturba Medical College. Over 30 years and 25,000+ eye surgeries performed.
              </p>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white">Hospital Address</div>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">{clinic.address}</p>
              <p className="mt-2 text-xs text-slate-300">
                Helpline:{' '}
                <a href={`tel:${clinic.phone}`} className="text-emerald-400 font-bold hover:underline">
                  {clinic.phone}
                </a>
              </p>
              <p className="text-xs text-red-300">
                24/7 Emergency:{' '}
                <a
                  href={`tel:${clinic.emergency_phone || clinic.phone}`}
                  className="text-red-400 font-bold hover:underline"
                >
                  {clinic.emergency_phone || clinic.phone}
                </a>
              </p>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white">OPD Hours</div>
              <p className="mt-3 text-xs text-slate-300">
                <strong className="text-white">Morning:</strong> {timeSlots[0] || '9:30 AM – 2:00 PM'}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                <strong className="text-white">Evening:</strong> {timeSlots[1] || '4:30 PM – 7:30 PM'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                <strong className="text-white">Sunday:</strong> {sundayLabel}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                Dedicated to clinical honesty, hygienic surgical standards, and community vision.
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-800 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} {clinic.clinic_name}. All rights reserved.
            </div>
            <div className="flex gap-4">
              <span className="hover:text-slate-300 transition">Magadi Town</span>
              <span>•</span>
              <span className="hover:text-slate-300 transition">Ramanagara District</span>
              <span>•</span>
              <span className="hover:text-slate-300 transition">Karnataka 562120</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 11. MOBILE BOTTOM STICKY ACTION BAR */}
      <div className="mobile-dock">
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:${clinic.phone}`} className="btn-primary !min-h-[46px] text-xs">
            <Phone className="h-4 w-4" />
            Call {clinic.phone}
          </a>
          <button
            type="button"
            onClick={() => handleQuickWhatsApp('Consultation')}
            className="btn-whatsapp !min-h-[46px] text-xs"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Us
          </button>
        </div>
      </div>
    </div>
  );
}
