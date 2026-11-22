export function ClinicMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none">
      <defs>
        <linearGradient id="clinicMarkTeal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#042f2e" />
        </linearGradient>
        <linearGradient id="clinicMarkGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      {/* Outer subtle shield container */}
      <rect width="64" height="64" rx="16" fill="#f0fdfa" stroke="#ccfbf1" strokeWidth="1.5" />
      {/* Precision Lens Ring */}
      <circle cx="32" cy="32" r="23" stroke="#0f766e" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
      {/* Eye Contour */}
      <path
        d="M10 32c5.8-9.5 13.5-14.5 22-14.5s16.2 5 22 14.5c-5.8 9.5-13.5 14.5-22 14.5S15.8 41.5 10 32z"
        stroke="#0f766e"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Iris */}
      <circle cx="32" cy="32" r="9.5" fill="url(#clinicMarkTeal)" />
      {/* Optical Focal Ring */}
      <circle cx="32" cy="32" r="6" stroke="#5eead4" strokeWidth="1.2" opacity="0.6" />
      {/* Pupil */}
      <circle cx="32" cy="32" r="3.8" fill="#042f2e" />
      {/* Light Glint / Crystal Clarity Highlight */}
      <circle cx="29.2" cy="29.2" r="1.6" fill="#ffffff" />
      <circle cx="34.5" cy="34.5" r="0.8" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}
