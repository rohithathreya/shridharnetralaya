export interface ClinicServiceItem {
  id: string;
  kannada: string;
  kannadaFull: string;
  title: string;
  category: string;
  tag: string;
  body: string;
  highlights: string[];
  duration: string;
  recovery: string;
  image: string;
  caption: string;
}

export const SERVICES: ClinicServiceItem[] = [
  {
    id: 'cataract',
    kannada: 'ಮೋತಿಬಿಂದು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ',
    kannadaFull: 'ಅತ್ಯಾಧುನಿಕ ಫ್ಯಾಕೋ ಮೋತಿಬಿಂದು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ',
    title: 'Advanced Cataract Microsurgery (MICS / Phaco)',
    category: 'Surgical Excellence',
    tag: '15-Min Daycare',
    body: 'State-of-the-art sutureless phacoemulsification under topical anesthesia (eye drops, no painful injections). A microscopic 1.8mm to 2.2mm incision with premium foldable intraocular lens (IOL) implantation. Walk in and walk out the same day with zero stitches and rapid visual restoration.',
    highlights: [
      'Topical drop anesthesia — zero needle injection pain',
      'Foldable Monofocal, Multifocal & Toric IOL choices',
      'No eye patch or hospital overnight stay required',
      'Same-day discharge within 2 hours',
    ],
    duration: '15 - 20 mins',
    recovery: 'Clear vision within 24 hours',
    image: '',
    caption: 'Sterile laminar airflow OT equipped for sutureless phacoemulsification.',
  },
  {
    id: 'spectacles',
    kannada: 'ಕಂಪ್ಯೂಟರೀಕೃತ ದೃಷ್ಟಿ ಪರೀಕ್ಷೆ',
    kannadaFull: 'ನಿಖರವಾದ ಕಂಪ್ಯೂಟರ್ ಕಣ್ಣಿನ ಪರೀಕ್ಷೆ ಮತ್ತು ಕನ್ನಡಕ',
    title: 'Computerized Eye Examination & Refraction',
    category: 'Diagnostic & Optical',
    tag: 'Zero Wait',
    body: 'High-precision automated digital refraction paired with manual subjective trial lens refinement. Our comprehensive examination checks visual acuity, corneal curvature, refractive errors (myopia, hyperopia, astigmatism), and presbyopia for crystal-clear customized eyewear prescriptions.',
    highlights: [
      'Digital autorefractometer analysis',
      'Manual trial frame comfort validation',
      'Reading, distance & progressive bifocal testing',
      'Screen strain & computer vision syndrome evaluation',
    ],
    duration: '15 mins',
    recovery: 'Instant prescription',
    image: 'phoropter.jpg',
    caption: 'Precision phoropter & digital optometry testing unit.',
  },
  {
    id: 'diabetes',
    kannada: 'ಮಧುಮೇಹ ಕಣ್ಣಿನ ತಪಾಸಣೆ',
    kannadaFull: 'ಡಯಾಬಿಟಿಕ್ ರೆಟಿನೋಪತಿ ಪರೀಕ್ಷೆ ಮತ್ತು ಚಿಕಿತ್ಸೆ',
    title: 'Diabetic & Hypertensive Retinopathy Care',
    category: 'Retina & Medical',
    tag: 'Prevent Blindness',
    body: 'Patients with diabetes and high blood pressure require routine dilated fundus evaluations to detect silent retinal hemorrhages, microaneurysms, and macular edema before irreversible vision loss occurs. Early detection protects your sight for decades.',
    highlights: [
      'Dilated binocular indirect ophthalmoscopy',
      'Macular health & blood vessel grading',
      'Timely medical management & laser referral if needed',
      'Annual retinal screening protocol for all diabetics',
    ],
    duration: '30 - 45 mins (with drops)',
    recovery: 'Drops wear off in 3-4 hours',
    image: 'exam-room.jpg',
    caption: 'Slit lamp bio-microscopy for anterior and posterior segment examination.',
  },
  {
    id: 'glaucoma',
    kannada: 'ಗ್ಲುಕೋಮಾ (ಕಣ್ಣಿನ ಒತ್ತಡ)',
    kannadaFull: 'ಗ್ಲುಕೋಮಾ ಮುನ್ನೆಚ್ಚರಿಕೆ ಮತ್ತು ಒತ್ತಡ ತಪಾಸಣೆ',
    title: 'Glaucoma Early Detection & Tonometry',
    category: 'Preventative Care',
    tag: 'Silent Vision Thief',
    body: 'Glaucoma often steals peripheral vision silently without pain. We measure intraocular fluid pressure using gold-standard Goldman applanation tonometry and evaluate the optic disc cup-to-disc ratio to catch optic nerve damage at the earliest possible stage.',
    highlights: [
      'Precise intraocular pressure (IOP) measurement',
      'Optic nerve head and cup-to-disc ratio evaluation',
      'Targeted pressure-lowering eye drop regimens',
      'Family history & risk assessment profiling',
    ],
    duration: '20 mins',
    recovery: 'Immediate normal routine',
    image: 'trial-frame.jpg',
    caption: 'Optical diagnostic and visual field assessment setup.',
  },
  {
    id: 'laser',
    kannada: 'ಯಾಗ್ ಲೇಸರ್ ಚಿಕಿತ್ಸೆ',
    kannadaFull: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆಯ ನಂತರದ ಲೇಸರ್ ಕ್ಲಿಯರೆನ್ಸ್',
    title: 'YAG Laser Capsulotomy & OPD Laser Care',
    category: 'Laser Clinic',
    tag: '5-Minute OPD Sitting',
    body: 'If vision becomes hazy months or years following cataract surgery due to posterior capsule opacification (PCO / secondary cataract), a gentle 5-minute Nd:YAG laser sitting instantly clears the optical pathway without surgery, needles, or admission.',
    highlights: [
      'Painless 5-minute walk-in laser procedure',
      'Zero surgical cuts, incisions, or stitches',
      'Instant restoration of crisp clear vision',
      'Laser iridotomy for narrow-angle glaucoma prevention',
    ],
    duration: '5 - 10 mins',
    recovery: 'Immediate same-day clarity',
    image: '',
    caption: 'Non-invasive Nd:YAG laser for capsular clearance and iridotomy.',
  },
  {
    id: 'other',
    kannada: 'ರೆಪ್ಪೆ, ಸ್ಕ್ವಿಂಟ್ ಮತ್ತು ಟೆರಿಜಿಯಂ',
    kannadaFull: 'ಕಣ್ಣಿನ ರೆಪ್ಪೆ, ವಕ್ರದೃಷ್ಟಿ ಮತ್ತು ಮಾಂಸಖಂಡ ಬೆಳವಣಿಗೆ ಚಿಕಿತ್ಸೆ',
    title: 'Pterygium, Lid Microsurgery & Squint Care',
    category: 'Specialized Care',
    tag: 'Cosmetic & Functional',
    body: 'Complete treatment for pterygium (conjunctival flesh growth) with autograft microsurgery to minimize recurrence, chalazion and lid cyst removal, pediatric squint (strabismus) alignment, and emergency trauma / corneal foreign body removal.',
    highlights: [
      'Pterygium excision with autograft (low recurrence rate)',
      'Chalazion, stye & eyelid cyst microsurgery',
      'Pediatric lazy eye (amblyopia) & squint evaluation',
      'Emergency corneal foreign body removal & eye injury care',
    ],
    duration: '20 - 30 mins',
    recovery: 'Rapid recovery within days',
    image: '',
    caption: 'Dedicated minor OT for anterior ocular surface procedures.',
  },
];
