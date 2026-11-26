export function ClinicMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {/* Crisp outer square emblem frame */}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="8"
        fill="#FFFFFF"
        stroke="#1E293B"
        strokeWidth="2.2"
      />
      {/* Stylized double-arc ophthalmology eye mark */}
      <path
        d="M14 39 C29 17, 71 17, 86 39 C71 61, 29 61, 14 39 Z"
        fill="none"
        stroke="#0284C7"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M22 39 C34 25, 66 25, 78 39 C66 53, 34 53, 22 39 Z"
        fill="none"
        stroke="#0284C7"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Crisp iris, pupil & light reflection */}
      <circle cx="50" cy="39" r="9.5" fill="#0369A1" opacity="0.16" />
      <circle cx="50" cy="39" r="6.2" fill="#0F172A" />
      <circle cx="47.8" cy="36.8" r="1.9" fill="#FFFFFF" />
      {/* Wordmark strictly bounded inside frame */}
      <text
        x="50"
        y="82"
        textAnchor="middle"
        textLength="80"
        lengthAdjust="spacingAndGlyphs"
        fill="#0369A1"
        fontSize="7.2"
        fontWeight="700"
        fontFamily="Figtree, system-ui, sans-serif"
        letterSpacing="0.2"
      >
        SHRIDHAR NETRALAYA
      </text>
    </svg>
  );
}
