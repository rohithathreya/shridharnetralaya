/** Public-facing services aligned with clinic signage and typical single-surgeon ophthalmology. */

export const OFFERING_GROUPS = [
  {
    id: 'surgery',
    label: 'Surgery',
    items: [
      'Phacoemulsification (phaco)',
      'Sutureless cataract (SICS)',
      'Pterygium excision',
      'Squint correction',
      'Lid surgery',
      'Glaucoma surgery',
    ],
  },
  {
    id: 'laser',
    label: 'Laser & procedures',
    items: ['LASIK', 'YAG capsulotomy', 'Pterygium & minor OT procedures', 'Intravitreal injections'],
  },
  {
    id: 'opd',
    label: 'Clinic & vision',
    items: [
      'Computerised eye testing',
      'Refraction & spectacles',
      'Diabetic eye screening',
      'Contact lenses',
      'Low vision aids',
      'Paediatric eye check-up',
    ],
  },
] as const;