/** Services in the order a patient from Magadi usually needs them. */

export const SERVICES = [
  {
    id: 'cataract',
    kannada: 'ಮೋತಿಬಿಂದು',
    title: 'Cataract surgery',
    body: 'Phacoemulsification — a small incision, ultrasound, a foldable lens — or sutureless small-incision surgery when that is the safer operation. A routine cataract is done here.',
    image: '',
    caption: '',
  },
  {
    id: 'spectacles',
    kannada: 'ಕನ್ನಡಕ',
    title: 'Spectacles',
    body: 'Computerised refraction, then this instrument, then a trial frame. The number written for the optician is the one you confirmed as clearer.',
    image: 'phoropter.jpg',
    caption: 'A phoropter, turned until the letters sharpen.',
  },
  {
    id: 'lenses',
    kannada: 'ಟ್ರಯಲ್ ಫ್ರೇಮ್',
    title: 'The trial frame',
    body: 'Contact lenses when the eye can hold them. Low-vision aids when ordinary glasses will not clear the chart.',
    image: 'trial-frame.jpg',
    caption: 'Trial frame and trial lenses — the step after the computer.',
  },
  {
    id: 'diabetes',
    kannada: 'ಮಧುಮೇಹ',
    title: 'Diabetic eye',
    body: 'If you take tablets or insulin, the pupil is dilated and the retina is examined. Come while the newspaper still looks readable.',
    image: 'exam-room.jpg',
    caption: 'Examination chair and slit lamp. The retina is looked at after dilating drops.',
  },
  {
    id: 'laser',
    kannada: 'ಲೇಸರ್',
    title: 'LASIK and YAG',
    body: 'LASIK only after the cornea is measured. YAG laser when a membrane clouds the lens months after cataract surgery. A short sitting, not an admission.',
    image: '',
    caption: '',
  },
  {
    id: 'other',
    kannada: 'ಸ್ಕ್ವಿಂಟ್ · ರೆಪ್ಪೆ',
    title: 'Squint, lids, and more',
    body: 'A turned eye. A drooping lid. Pterygium on the cornea. Glaucoma when drops are not enough. Children who cannot see the blackboard.',
    image: '',
    caption: '',
  },
] as const;
