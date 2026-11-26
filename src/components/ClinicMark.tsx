export function ClinicMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {/* Crisp outer square emblem frame */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="6"
        fill="#FFFFFF"
        stroke="#272420"
        strokeWidth="2.5"
      />
      {/* Stylized double-arc eye mark matching clinic stationery */}
      <path
        d="M12 41 C28 19, 72 19, 88 41 C72 63, 28 63, 12 41 Z"
        fill="none"
        stroke="#0277BD"
        strokeWidth="4.2"
        strokeLinejoin="round"
      />
      <path
        d="M19 41 C33 27, 67 27, 81 41 C67 55, 33 55, 19 41 Z"
        fill="none"
        stroke="#0277BD"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* Central pupil */}
      <circle cx="50" cy="41" r="7.5" fill="#141210" />
      <circle cx="47.5" cy="38.5" r="2" fill="#FFFFFF" />
      {/* Wordmark inside emblem */}
      <text
        x="50"
        y="83"
        textAnchor="middle"
        fill="#01579B"
        fontSize="8.8"
        fontWeight="700"
        fontFamily="Figtree, system-ui, sans-serif"
        letterSpacing="0.35"
      >
        SHRIDHAR NETRALAYA
      </text>
    </svg>
  );
}
