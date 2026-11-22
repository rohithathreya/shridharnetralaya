export const SERVICES = [
  {
    id: 'cataract',
    kannada: 'ಮೋತಿಬಿಂದು',
    title: 'Cataract surgery',
    body: 'Phacoemulsification through a small incision, or sutureless cataract surgery when that is the safer operation. A foldable lens. Done in Magadi.',
    image: 'microscope.jpg', // operating microscope — cataract
  },
  {
    id: 'spectacles',
    kannada: 'ಕನ್ನಡಕ',
    title: 'Spectacles',
    body: 'Computerised refraction, then the phoropter, then a trial frame. The number you leave with is the one you confirmed as clearer.',
    image: 'phoropter.jpg',
  },
  {
    id: 'lenses',
    kannada: 'ಕಾಂಟ್ಯಾಕ್ಟ್ ಲೆನ್ಸ್',
    title: 'Contact lenses',
    body: 'Contact lenses when the cornea can hold them. Low-vision aids when ordinary glasses will not clear the chart.',
    image: 'trial-frame.jpg', // trial lenses — contact lens fitting
  },
  {
    id: 'diabetes',
    kannada: 'ಮಧುಮೇಹ',
    title: 'Diabetic eye',
    body: 'If you take tablets or insulin, the pupil is dilated and the retina is examined — before the newspaper goes soft.',
    image: 'exam-room.jpg', // slit-lamp chair — retina exam
  },
  {
    id: 'laser',
    kannada: 'ಲೇಸರ್',
    title: 'LASIK and YAG',
    body: 'LASIK only after the cornea is measured. YAG laser when a membrane clouds the new lens after cataract surgery.',
    image: 'laser.jpg', // slit-lamp laser head — YAG / laser sitting
  },
  {
    id: 'other',
    kannada: 'ಸ್ಕ್ವಿಂಟ್ · ರೆಪ್ಪೆ',
    title: 'Squint, lids, pterygium',
    body: 'A turned eye. A drooping lid. Pterygium on the cornea. Glaucoma when drops are not enough. Children who cannot see the blackboard.',
    image: 'slit.jpg', // slit lamp — lids, surface, alignment
  },
] as const;
