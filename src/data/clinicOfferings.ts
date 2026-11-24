import type { SiteLang } from '../context/LanguageContext';

export interface TreatmentOffering {
  id: string;
  shortLabel: string;
  tag: string;
  title: string;
  summary: string;
  whoNeedsIt: string;
  whatWeDo: string;
  recoveryNote: string;
  image: string;
}

export interface SiteCopy {
  brandName: string;
  brandLocation: string;
  nav: {
    treatments: string;
    doctor: string;
    visit: string;
    staff: string;
    admin: string;
    lock: string;
    callNow: string;
    directions: string;
    whatsapp: string;
  };
  hero: {
    kicker: string;
    line: string;
    branches: string;
    eyebrow: string;
    headlineLine1: string;
    headlineAccent: string;
    subheadline: string;
    callCta: string;
    directionsCta: string;
    whatsappCta: string;
    timingsLabel: string;
    timingsValue: string;
    stats: Array<{ value: string; label: string }>;
  };
  treatments: {
    eyebrow: string;
    heading: string;
    subheading: string;
    allFilter: string;
    whoLabel: string;
    howLabel: string;
    askCta: string;
    items: TreatmentOffering[];
  };
  doctor: {
    eyebrow: string;
    name: string;
    role: string;
    qualifications: string;
    kmcLabel: string;
    kpmeLabel: string;
    paragraphs: string[];
    highlights: Array<{ title: string; detail: string }>;
  };
  visit: {
    eyebrow: string;
    heading: string;
    addressLabel: string;
    addressValue: string;
    phoneLabel: string;
    emergencyLabel: string;
    hoursLabel: string;
    hoursValue: string;
    appointmentNote: string;
    openMaps: string;
    callReception: string;
  };
  footerNote: string;
}

export const SITE_COPY: Record<SiteLang, SiteCopy> = {
  en: {
    brandName: 'Shridhar Netralaya',
    brandLocation: 'Magadi, Karnataka',
    nav: {
      treatments: 'Treatments',
      doctor: 'Dr. Malathesh',
      visit: 'Visit & Hours',
      staff: 'Staff Desk',
      admin: 'Admin',
      lock: 'Sign Out',
      callNow: 'Call',
      directions: 'Maps',
      whatsapp: 'WhatsApp',
    },
    hero: {
      kicker: 'Best-in-class eye care',
      line: 'Best-in-class eyecare since 1996',
      branches: '2 branches - Magadi, Bangalore',
      eyebrow: 'Magadi’s Dedicated Eye Hospital · Since 1996',
      headlineLine1: 'Clear sight,',
      headlineAccent: 'treated right at home.',
      subheadline:
        'Stitchless cataract surgery, diabetic retina checks, glaucoma care, and precision refraction — led personally by Dr. L. S. Malathesh on Eye Hospital Road.',
      callCta: 'Call for Appointment',
      directionsCta: 'Directions',
      whatsappCta: 'WhatsApp',
      timingsLabel: 'OPD Hours',
      timingsValue: 'Mon – Sat · 10:00 AM – 5:00 PM (Prior Appointment)',
      stats: [
        { value: '30+ yrs', label: 'Surgical practice in Magadi' },
        { value: 'Day-Care', label: 'Same-day cataract discharge' },
        { value: '24/7', label: 'Post-op emergency helpline' },
      ],
    },
    treatments: {
      eyebrow: 'Clinical Care',
      heading: 'Conditions we treat, explained plainly.',
      subheading:
        'Every visit begins with an unhurried slit-lamp evaluation so you and your family clearly understand the diagnosis before deciding on any procedure.',
      allFilter: 'All Services',
      whoLabel: 'Signs & who needs it',
      howLabel: 'How we treat it',
      askCta: 'Enquire on WhatsApp',
      items: [
        {
          id: 'cataract',
          shortLabel: 'Cataract',
          tag: 'Most Common · Day-Care OT',
          title: 'Cataract Surgery (Phaco & SICS)',
          summary: 'Modern stitchless microsurgery with Indian or imported foldable lenses.',
          whoNeedsIt:
            'Adults over 55 noticing cloudy or misty vision, night headlight glare, faded colours, or glasses that no longer sharpen sight.',
          whatWeDo:
            'Micro-incision phacoemulsification — or sutureless SICS when safer for dense cataracts — using precision biometry and foldable IOLs.',
          recoveryNote: 'Walk-in, walk-out day-care procedure — patients return home the same afternoon.',
          image: 'microscope.jpg',
        },
        {
          id: 'diabetic-retina',
          shortLabel: 'Diabetic Eye',
          tag: 'Annual Preventive Check',
          title: 'Diabetic Eye & Retina Care',
          summary: 'Silent retinal damage starts early — yearly dilated checks protect long-term sight.',
          whoNeedsIt:
            'Anyone living with diabetes for 5+ years, even when vision feels completely normal, since retinal bleeding begins without pain.',
          whatWeDo:
            'Dilated fundus evaluation to spot diabetic retinopathy early, medical control, and targeted intravitreal therapy when clinically indicated.',
          recoveryNote: 'A 30-minute annual dilated check safeguards reading and driving vision.',
          image: 'exam-room.jpg',
        },
        {
          id: 'refraction',
          shortLabel: 'Spectacles',
          tag: 'Children & Adults',
          title: 'Comprehensive Eye Exam & Spectacles',
          summary: 'Verified prescription testing — confirmed on a trial lens before you leave.',
          whoNeedsIt:
            'Schoolchildren struggling with the blackboard, adults with headaches or near-vision fatigue, and anyone due for an annual check-up.',
          whatWeDo:
            'Computerised autorefraction refined through phoropter and real-world trial frames, alongside complete front-to-back eye health screening.',
          recoveryNote: 'You leave with the exact lens power you confirmed as clearest.',
          image: 'phoropter.jpg',
        },
        {
          id: 'glaucoma',
          shortLabel: 'Glaucoma',
          tag: 'Silent Vision Threat',
          title: 'Glaucoma Screening & Management',
          summary: 'Eye-pressure control that protects side vision before irreversible loss occurs.',
          whoNeedsIt:
            'Adults over 40, individuals with a family history of glaucoma, or patients using steroid eye drops or tablets long term.',
          whatWeDo:
            'Applanation eye-pressure measurement (IOP), optic nerve assessment, daily drop therapy, YAG PI laser, and surgery if drops are insufficient.',
          recoveryNote: 'Early diagnosis and regular drops preserve side vision for life.',
          image: 'trial-frame.jpg',
        },
        {
          id: 'pterygium',
          shortLabel: 'Pterygium & Lids',
          tag: 'Surface & Cornea',
          title: 'Pterygium, Eyelid & Surface Surgery',
          summary: 'Autograft technique designed to keep recurrence low for outdoor workers.',
          whoNeedsIt:
            'Farmers and outdoor workers developing a fleshy growth across the white of the eye, persistent redness, or drooping/turned eyelids.',
          whatWeDo:
            'Pterygium excision with conjunctival autograft (CAG), plus targeted eyelid microsurgery for chalazion, entropion, and ectropion.',
          recoveryNote: 'Performed cleanly under local anaesthesia as a day-care procedure.',
          image: 'slit.jpg',
        },
        {
          id: 'laser-squint',
          shortLabel: 'Laser & Squint',
          tag: 'OPD Laser & Alignment',
          title: 'YAG Laser & Childhood Squint Care',
          summary: '5-minute painless post-cataract laser clearing and eye alignment care.',
          whoNeedsIt:
            'Post-cataract patients noticing misty vision months or years later (posterior capsule haze), and children or adults with squint.',
          whatWeDo:
            'Painless OPD YAG laser capsulotomy to clear lens haze, plus early childhood amblyopia screening and surgical squint correction.',
          recoveryNote: 'YAG laser requires no admission, stitches, or eye patching.',
          image: 'laser.jpg',
        },
      ],
    },
    doctor: {
      eyebrow: 'Chief Ophthalmic Surgeon',
      name: 'Dr. L. S. Malathesh',
      role: 'Founder & Senior Eye Surgeon',
      qualifications: 'MBBS, DOMS, FGO · Kasturba Medical College, Manipal',
      kmcLabel: 'KMC Reg.',
      kpmeLabel: 'KPME Reg.',
      paragraphs: [
        'After completing his medical degree and ophthalmic surgical training at Kasturba Medical College, Manipal, Dr. L. S. Malathesh founded Shridhar Netralaya with one clear mission: bring city-grade eye microsurgery home to Magadi and stay.',
        'For over three decades on Eye Hospital Road, families across Magadi and Ramanagara district have relied on his unhurried diagnosis, transparent counsel, and dependable surgical follow-through — without travelling to Bengaluru.',
      ],
      highlights: [
        { title: '30+ Years', detail: 'Continuous surgical practice serving Magadi & Ramanagara' },
        { title: 'KMC, Manipal', detail: 'MBBS, DOMS & FGO specialist ophthalmic training' },
        { title: 'Full In-House OT', detail: 'Cataract, Pterygium, Glaucoma, Lid & Squint microsurgery' },
      ],
    },
    visit: {
      eyebrow: 'Plan Your Visit',
      heading: 'Find Shridhar Netralaya in Magadi.',
      addressLabel: 'Hospital Address',
      addressValue: 'Eye Hospital Road, Near Gramadevate Temple, Magadi, Karnataka 562120',
      phoneLabel: 'Reception & Appointments',
      emergencyLabel: '24/7 Post-Op Emergency',
      hoursLabel: 'OPD Timings',
      hoursValue: 'Mon – Sat · 10:00 AM – 5:00 PM · Sun: Closed (Emergency & Post-Op On-Call)',
      appointmentNote:
        'Call reception ahead of your visit to confirm your slot, especially for dilated diabetic eye checks or surgical evaluations.',
      openMaps: 'Open in Google Maps',
      callReception: 'Call Reception',
    },
    footerNote: 'Shridhar Netralaya, Magadi · Comprehensive Eye Care & Microsurgery Centre',
  },
  kn: {
    brandName: 'ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ',
    brandLocation: 'ಮಾಗಡಿ, ಕರ್ನಾಟಕ',
    nav: {
      treatments: 'ಚಿಕಿತ್ಸೆಗಳು',
      doctor: 'ಡಾ. ಮಾಲತೇಶ್',
      visit: 'ವಿಳಾಸ ಮತ್ತು ಸಮಯ',
      staff: 'ಸಿಬ್ಬಂದಿ ವಿಭಾಗ',
      admin: 'ಆಡಳಿತ',
      lock: 'ನಿರ್ಗಮಿಸಿ',
      callNow: 'ಕರೆ',
      directions: 'ಮ್ಯಾಪ್',
      whatsapp: 'ವಾಟ್ಸಾಪ್',
    },
    hero: {
      kicker: 'ಅತ್ಯುತ್ತಮ ಕಣ್ಣಿನ ಆರೈಕೆ',
      line: '1996 ರಿಂದ ಅತ್ಯುತ್ತಮ ಕಣ್ಣಿನ ಆರೈಕೆ',
      branches: '2 ಶಾಖೆಗಳು - ಮಾಗಡಿ, ಬೆಂಗಳೂರು',
      eyebrow: 'ಮಾಗಡಿಯ ವಿಶ್ವಾಸಾರ್ಹ ಕಣ್ಣಿನ ಆಸ್ಪತ್ರೆ · 1996 ರಿಂದ',
      headlineLine1: 'ಸ್ಪಷ್ಟ ದೃಷ್ಟಿ,',
      headlineAccent: 'ನಿಮ್ಮ ಮಾಗಡಿಯಲ್ಲೇ ನಿಖರ ಚಿಕಿತ್ಸೆ.',
      subheadline:
        'ಹೊಲಿಗೆ ಇಲ್ಲದ ಮೋತಿಬಿಂದು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ, ಮಧುಮೇಹ ಕಣ್ಣಿನ ತಪಾಸಣೆ, ಗ್ಲಾಕೋಮಾ ಚಿಕಿತ್ಸೆ ಮತ್ತು ನಿಖರ ಕನ್ನಡಕ ಪರೀಕ್ಷೆ — ಡಾ. ಎಲ್. ಎಸ್. ಮಾಲತೇಶ್ ಅವರ ನೇರ ಮೇಲ್ವಿಚಾರಣೆಯಲ್ಲಿ.',
      callCta: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಾಗಿ ಕರೆ ಮಾಡಿ',
      directionsCta: 'ದಾರಿ',
      whatsappCta: 'ವಾಟ್ಸಾಪ್',
      timingsLabel: 'ಆಸ್ಪತ್ರೆ ಸಮಯ',
      timingsValue: 'ಸೋಮ – ಶನಿ · ಬೆಳಿಗ್ಗೆ 10:00 – ಸಂಜೆ 5:00 (ಮುಂಚಿತ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್)',
      stats: [
        { value: '30+ ವರ್ಷ', label: 'ಮಾಗಡಿಯಲ್ಲಿ ನಿರಂತರ ಸೇವೆ' },
        { value: 'ಅದೇ ದಿನ', label: 'ಮೋತಿಬಿಂದು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮತ್ತು ಡಿಸ್ಚಾರ್ಜ್' },
        { value: '24/7', label: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ನಂತರದ ತುರ್ತು ಸಂಪರ್ಕ' },
      ],
    },
    treatments: {
      eyebrow: 'ನಮ್ಮ ಸೇವೆಗಳು',
      heading: 'ಕಣ್ಣಿನ ಸಮಸ್ಯೆಗಳು ಮತ್ತು ಚಿಕಿತ್ಸೆಯ ಸರಳ ಮಾಹಿತಿ.',
      subheading:
        'ಪ್ರತಿ ರೋಗಿಯ ಕಣ್ಣನ್ನು ನಿಧಾನವಾಗಿ ಮತ್ತು ಸಂಪೂರ್ಣವಾಗಿ ಪರೀಕ್ಷಿಸಿ, ಸಮಸ್ಯೆಯನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ವಿವರಿಸಿದ ನಂತರವೇ ಚಿಕಿತ್ಸೆ ನಿರ್ಧರಿಸಲಾಗುತ್ತದೆ.',
      allFilter: 'ಎಲ್ಲಾ ಸೇವೆಗಳು',
      whoLabel: 'ಲಕ್ಷಣಗಳು ಮತ್ತು ಯಾರಿಗೆ ಅಗತ್ಯ?',
      howLabel: 'ನಮ್ಮ ಚಿಕಿತ್ಸಾ ವಿಧಾನ',
      askCta: 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ವಿಚಾರಿಸಿ',
      items: [
        {
          id: 'cataract',
          shortLabel: 'ಮೋತಿಬಿಂದು',
          tag: 'ಅತಿ ಸಾಮಾನ್ಯ · ಡೇ-ಕೇರ್ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ',
          title: 'ಮೋತಿಬಿಂದು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ (Phaco ಮತ್ತು SICS)',
          summary: 'ಹೊಲಿಗೆ ಇಲ್ಲದ ಆಧುನಿಕ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಮತ್ತು ಗುಣಮಟ್ಟದ ಫೋಲ್ಡಬಲ್ ಲೆನ್ಸ್.',
          whoNeedsIt:
            '55 ವರ್ಷ ಮೇಲ್ಪಟ್ಟವರಲ್ಲಿ ದೃಷ್ಟಿ ಮಂಜಾಗುವುದು, ರಾತ್ರಿ ವಾಹನದ ಬೆಳಕು ಕಣ್ಣು ಕುಕ್ಕುವುದು, ಬಣ್ಣಗಳು ಮಸುಕಾಗುವುದು ಅಥವಾ ಕನ್ನಡಕ ಹಾಕಿದರೂ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣದಿರುವುದು.',
          whatWeDo:
            'ಹೊಲಿಗೆ ಇಲ್ಲದ ಫ್ಯಾಕೋ (Phaco) ಅಥವಾ ಸುರಕ್ಷಿತ SICS ವಿಧಾನದ ಮೂಲಕ ಮೋತಿಬಿಂದು ತೆಗೆದು, ಗುಣಮಟ್ಟದ ಫೋಲ್ಡಬಲ್ ಲೆನ್ಸ್ ಅಳವಡಿಸಲಾಗುತ್ತದೆ.',
          recoveryNote: 'ಡೇ-ಕೇರ್ ವಿಧಾನ — ರೋಗಿಗಳು ಅದೇ ದಿನ ಮಧ್ಯಾಹ್ನ ಮನೆಗೆ ತೆರಳಬಹುದು.',
          image: 'microscope.jpg',
        },
        {
          id: 'diabetic-retina',
          shortLabel: 'ಮಧುಮೇಹ ಕಣ್ಣು',
          tag: 'ವಾರ್ಷಿಕ ಮುನ್ನೆಚ್ಚರಿಕೆ ತಪಾಸಣೆ',
          title: 'ಮಧುಮೇಹ (ಶುಗರ್) ಕಣ್ಣಿನ ತಪಾಸಣೆ',
          summary: 'ನೋವಿಲ್ಲದೆ ಶುರುವಾಗುವ ರೆಟಿನಾ ಹಾನಿಯನ್ನು ವರ್ಷಕ್ಕೊಮ್ಮೆ ತಪಾಸಣೆಯಿಂದ ತಡೆಯಿರಿ.',
          whoNeedsIt:
            '5 ವರ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚು ಕಾಲ ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಇರುವವರು — ದೃಷ್ಟಿ ಸರಿಯಾಗಿ ಕಾಣುತ್ತಿದ್ದರೂ ರೆಟಿನಾ ಹಾನಿ ಆರಂಭದಲ್ಲಿ ತಿಳಿಯುವುದಿಲ್ಲ.',
          whatWeDo:
            'ಕಣ್ಣಿಗೆ ಡ್ರಾಪ್ಸ್ ಹಾಕಿ ರೆಟಿನಾವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಪರೀಕ್ಷಿಸುವುದು, ಆರಂಭಿಕ ಔಷಧ ಚಿಕಿತ್ಸೆ ಹಾಗೂ ಅಗತ್ಯವಿದ್ದಲ್ಲಿ ಇಂಜೆಕ್ಷನ್ ಚಿಕಿತ್ಸೆ.',
          recoveryNote: 'ಮಧುಮೇಹ ಇರುವ ಪ್ರತಿಯೊಬ್ಬರೂ ವರ್ಷಕ್ಕೊಮ್ಮೆ ತಪಾಸಣೆ ಮಾಡಿಸುವುದು ಅತ್ಯಗತ್ಯ.',
          image: 'exam-room.jpg',
        },
        {
          id: 'refraction',
          shortLabel: 'ಕನ್ನಡಕ',
          tag: 'ಮಕ್ಕಳು ಮತ್ತು ದೊಡ್ಡವರಿಗೆ',
          title: 'ಸಂಪೂರ್ಣ ಕಣ್ಣಿನ ತಪಾಸಣೆ ಮತ್ತು ಕನ್ನಡಕ',
          summary: 'ಟ್ರಯಲ್ ಫ್ರೇಮ್‌ನಲ್ಲಿ ಸ್ಪಷ್ಟತೆ ಖಚಿತಪಡಿಸಿದ ನಂತರವೇ ನಿಖರ ಕನ್ನಡಕದ ನಂಬರ್.',
          whoNeedsIt:
            'ಶಾಲಾ ಮಕ್ಕಳಿಗೆ ಬೋರ್ಡ್ ಕಾಣದಿರುವುದು, ಓದುವಾಗ ತಲೆನೋವು ಅಥವಾ ಕಣ್ಣು ಆಯಾಸ, ಹಾಗೂ ವಾರ್ಷಿಕ ಕಣ್ಣಿನ ತಪಾಸಣೆ ಮಾಡಿಸಿಕೊಳ್ಳುವವರು.',
          whatWeDo:
            'ಕಂಪ್ಯೂಟರೀಕೃತ ಪರೀಕ್ಷೆಯ ನಂತರ ಫೋರೋಪ್ಟರ್ ಮತ್ತು ಟ್ರಯಲ್ ಫ್ರೇಮ್ ಮೂಲಕ ನಿಖರ ಕನ್ನಡಕದ ನಂಬರ್ ಮತ್ತು ಕಣ್ಣಿನ ಆರೋಗ್ಯ ಪರೀಕ್ಷೆ.',
          recoveryNote: 'ನಿಮಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುವ ನಂಬರ್ ಖಚಿತಪಡಿಸಿದ ನಂತರವೇ ಚೀಟಿ ನೀಡಲಾಗುತ್ತದೆ.',
          image: 'phoropter.jpg',
        },
        {
          id: 'glaucoma',
          shortLabel: 'ಗ್ಲಾಕೋಮಾ',
          tag: 'ಆರಂಭಿಕ ಪತ್ತೆ ಅತ್ಯಗತ್ಯ',
          title: 'ಗ್ಲಾಕೋಮಾ (ಕಣ್ಣಿನ ಒತ್ತಡ) ತಪಾಸಣೆ ಮತ್ತು ಚಿಕಿತ್ಸೆ',
          summary: 'ಕಣ್ಣಿನ ಒತ್ತಡ ನಿಯಂತ್ರಿಸಿ ಶಾಶ್ವತ ದೃಷ್ಟಿ ನಷ್ಟವನ್ನು ತಡೆಯಿರಿ.',
          whoNeedsIt:
            '40 ವರ್ಷ ಮೇಲ್ಪಟ್ಟವರು, ಕುಟುಂಬದಲ್ಲಿ ಗ್ಲಾಕೋಮಾ ಇರುವವರು ಅಥವಾ ದೀರ್ಘಕಾಲ ಸ್ಟೆರಾಯ್ಡ್ ಡ್ರಾಪ್ಸ್ ಬಳಸುವವರು.',
          whatWeDo:
            'ಕಣ್ಣಿನ ಒತ್ತಡದ (IOP) ನಿಖರ ಅಳತೆ, ದೃಷ್ಟಿ ನರದ ತಪಾಸಣೆ, ನಿಯಮಿತ ಡ್ರಾಪ್ಸ್ ಚಿಕಿತ್ಸೆ, ಲೇಸರ್ ಮತ್ತು ಅಗತ್ಯವಿದ್ದಲ್ಲಿ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ.',
          recoveryNote: 'ಆರಂಭದಲ್ಲೇ ಪತ್ತೆ ಹಚ್ಚಿ ಡ್ರಾಪ್ಸ್ ಮುಂದುವರಿಸಿದರೆ ದೃಷ್ಟಿ ಸುರಕ್ಷಿತವಾಗಿರುತ್ತದೆ.',
          image: 'trial-frame.jpg',
        },
        {
          id: 'pterygium',
          shortLabel: 'ಮಾಂಸ ಬೆಳವಣಿಗೆ',
          tag: 'ಕಣ್ಣಿನ ಮೇಲ್ಮೈ ಮತ್ತು ರೆಪ್ಪೆ',
          title: 'ಕಣ್ಣಿನ ಮಾಂಸ ಬೆಳವಣಿಗೆ (Pterygium) ಮತ್ತು ರೆಪ್ಪೆ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ',
          summary: 'ಮತ್ತೆ ಬೆಳೆಯದಂತೆ ಆಧುನಿಕ ಆಟೋಗ್ರಾಫ್ಟ್ (CAG) ವಿಧಾನದ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ.',
          whoNeedsIt:
            'ಬಿಸಿಲು ಮತ್ತು ಧೂಳಿನಲ್ಲಿ ಕೆಲಸ ಮಾಡುವವರಲ್ಲಿ ಕಣ್ಣಿನ ಬಿಳಿ ಭಾಗದಲ್ಲಿ ಮಾಂಸ ಬೆಳೆಯುವುದು, ಕಣ್ಣು ಕೆಂಪಾಗುವುದು ಅಥವಾ ರೆಪ್ಪೆ ಜೋತು ಬೀಳುವುದು.',
          whatWeDo:
            'ಮರುಕಳಿಸದಂತೆ ಆಟೋಗ್ರಾಫ್ಟ್ (CAG) ವಿಧಾನದಿಂದ ಮಾಂಸ ತೆಗೆಯುವಿಕೆ ಹಾಗೂ ರೆಪ್ಪೆ ಸಮಸ್ಯೆಗಳಿಗೆ ನಿಖರ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ.',
          recoveryNote: 'ಸ್ಥಳೀಯ ಅರಿವಳಿಕೆಯೊಂದಿಗೆ ಅದೇ ದಿನ ಮನೆಗೆ ಮರಳಬಹುದಾದ ಚಿಕಿತ್ಸೆ.',
          image: 'slit.jpg',
        },
        {
          id: 'laser-squint',
          shortLabel: 'ಲೇಸರ್ / ಮೆಳ್ಳೆಗಣ್ಣು',
          tag: 'ಲೇಸರ್ ಮತ್ತು ಮೆಳ್ಳೆಗಣ್ಣು',
          title: 'ಯಾಗ್ (YAG) ಲೇಸರ್ ಮತ್ತು ಮಕ್ಕಳ ಮೆಳ್ಳೆಗಣ್ಣು ಚಿಕಿತ್ಸೆ',
          summary: 'ನೋವಿಲ್ಲದ 5 ನಿಮಿಷದ YAG ಲೇಸರ್ ಮತ್ತು ಮಕ್ಕಳ ದೃಷ್ಟಿ ತಪಾಸಣೆ.',
          whoNeedsIt:
            'ಮೋತಿಬಿಂದು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರ ಕೆಲವು ತಿಂಗಳು ಅಥವಾ ವರ್ಷಗಳಲ್ಲಿ ಮತ್ತೆ ದೃಷ್ಟಿ ಮಂಜಾದವರು, ಹಾಗೂ ಮೆಳ್ಳೆಗಣ್ಣು ಇರುವ ಮಕ್ಕಳು ಮತ್ತು ದೊಡ್ಡವರು.',
          whatWeDo:
            'ನೋವಿಲ್ಲದ 5 ನಿಮಿಷದ YAG ಲೇಸರ್ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಮೆಳ್ಳೆಗಣ್ಣು ಸರಿಪಡಿಸುವ ವೈದ್ಯಕೀಯ ಹಾಗೂ ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಪರಿಹಾರ.',
          recoveryNote: 'YAG ಲೇಸರ್‌ಗೆ ಹೊಲಿಗೆ, ಕಣ್ಣಿಗೆ ಪಟ್ಟಿ ಅಥವಾ ಆಸ್ಪತ್ರೆ ದಾಖಲಾತಿ ಅಗತ್ಯವಿಲ್ಲ.',
          image: 'laser.jpg',
        },
      ],
    },
    doctor: {
      eyebrow: 'ಮುಖ್ಯ ನೇತ್ರ ಶಸ್ತ್ರಚಿಕಿತ್ಸಕರು',
      name: 'ಡಾ. ಎಲ್. ಎಸ್. ಮಾಲತೇಶ್',
      role: 'ಸ್ಥಾಪಕರು ಮತ್ತು ಹಿರಿಯ ನೇತ್ರ ತಜ್ಞರು',
      qualifications: 'MBBS, DOMS, FGO · ಕಸ್ತೂರ್ಬಾ ಮೆಡಿಕಲ್ ಕಾಲೇಜ್, ಮಣಿಪಾಲ',
      kmcLabel: 'KMC ನೋಂದಣಿ',
      kpmeLabel: 'KPME ನೋಂದಣಿ',
      paragraphs: [
        'ಮಣಿಪಾಲದ ಕಸ್ತೂರ್ಬಾ ಮೆಡಿಕಲ್ ಕಾಲೇಜಿನಲ್ಲಿ ವೈದ್ಯಕೀಯ ಮತ್ತು ನೇತ್ರ ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಪದವಿ ಪೂರ್ಣಗೊಳಿಸಿದ ಡಾ. ಎಲ್. ಎಸ್. ಮಾಲತೇಶ್ ಅವರು, ನಗರ ಮಟ್ಟದ ಕಣ್ಣಿನ ಚಿಕಿತ್ಸೆಯನ್ನು ಮಾಗಡಿ ಮತ್ತು ರಾಮನಗರ ಜಿಲ್ಲೆಯ ಜನರಿಗೆ ತಲುಪಿಸುವ ಉದ್ದೇಶದಿಂದ ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯವನ್ನು ಸ್ಥಾಪಿಸಿದರು.',
        'ಕಳೆದ ಮೂರು ದಶಕಗಳಿಂದ ಐ ಹಾಸ್ಪಿಟಲ್ ರಸ್ತೆಯಲ್ಲಿ ನಿರಂತರ ಸೇವೆ ಸಲ್ಲಿಸುತ್ತಾ, ಬೆಂಗಳೂರಿಗೆ ಅಲೆಯುವ ಅಗತ್ಯವಿಲ್ಲದೆ ಸಾವಿರಾರು ಕುಟುಂಬಗಳಿಗೆ ನಿಖರ ತಪಾಸಣೆ ಮತ್ತು ಸುರಕ್ಷಿತ ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ನೀಡಿದ್ದಾರೆ.',
      ],
      highlights: [
        { title: '30+ ವರ್ಷ', detail: 'ಮಾಗಡಿ ಮತ್ತು ರಾಮನಗರ ಜಿಲ್ಲೆಯಲ್ಲಿ ನಿರಂತರ ಕಣ್ಣಿನ ಸೇವೆ' },
        { title: 'ಕೆ.ಎಂ.ಸಿ ಮಣಿಪಾಲ', detail: 'MBBS, DOMS ಮತ್ತು FGO ವಿಶೇಷ ನೇತ್ರ ತರಬೇತಿ' },
        { title: 'ಸುಸಜ್ಜಿತ ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಘಟಕ', detail: 'ಮೋತಿಬಿಂದು, ಪ್ಟೆರಿಜಿಯಂ, ಗ್ಲಾಕೋಮಾ, ರೆಪ್ಪೆ ಮತ್ತು ಮೆಳ್ಳೆಗಣ್ಣು' },
      ],
    },
    visit: {
      eyebrow: 'ಭೇಟಿ ನೀಡಿ',
      heading: 'ಮಾಗಡಿಯಲ್ಲಿ ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯದ ವಿಳಾಸ.',
      addressLabel: 'ಆಸ್ಪತ್ರೆ ವಿಳಾಸ',
      addressValue: 'ಐ ಹಾಸ್ಪಿಟಲ್ ರಸ್ತೆ, ಗ್ರಾಮದೇವತೆ ದೇವಸ್ಥಾನದ ಹತ್ತಿರ, ಮಾಗಡಿ, ಕರ್ನಾಟಕ 562120',
      phoneLabel: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಮತ್ತು ವಿಚಾರಣೆ',
      emergencyLabel: '24/7 ತುರ್ತು ಸಂಪರ್ಕ',
      hoursLabel: 'ಆಸ್ಪತ್ರೆ ಸಮಯ',
      hoursValue: 'ಸೋಮ – ಶನಿ: ಬೆಳಿಗ್ಗೆ 10:00 – ಸಂಜೆ 5:00 · ಭಾನುವಾರ: ರಜೆ (ತುರ್ತು ಸೇವೆ ಲಭ್ಯ)',
      appointmentNote:
        'ವಿಶೇಷವಾಗಿ ಮಧುಮೇಹ ರೆಟಿನಾ ತಪಾಸಣೆ ಅಥವಾ ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಪರೀಕ್ಷೆಗೆ ಬರುವ ಮುನ್ನ ಕರೆ ಮಾಡಿ ಸಮಯ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
      openMaps: 'ಗೂಗಲ್ ಮ್ಯಾಪ್ ತೆರೆಯಿರಿ',
      callReception: 'ಆಸ್ಪತ್ರೆಗೆ ಕರೆ ಮಾಡಿ',
    },
    footerNote: 'ಶ್ರೀಧರ್ ನೇತ್ರಾಲಯ, ಮಾಗಡಿ · ಸಮಗ್ರ ಕಣ್ಣಿನ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸಾ ಕೇಂದ್ರ',
  },
};
