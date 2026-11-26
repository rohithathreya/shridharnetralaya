import { useId } from 'react';

interface ClinicMarkProps {
  className?: string;
  showWordmark?: boolean;
  variant?: 'color' | 'watermark';
}

/**
 * Transparent interlocking S-eye emblem for Shridhar Netralaya.
 * Uses unique SVG gradient IDs per instance so multiple marks + watermarks
 * on the same page never collide.
 */
export function ClinicMark({
  className = 'h-10 w-10',
  showWordmark = false,
  variant = 'color',
}: ClinicMarkProps) {
  const uid = useId().replace(/:/g, '');
  const topGradId = `sn-top-${uid}`;
  const botGradId = `sn-bot-${uid}`;
  const isWatermark = variant === 'watermark';

  return (
    <svg
      viewBox={showWordmark ? '0 0 140 108' : '0 0 140 84'}
      className={className}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={topGradId} x1="15%" y1="15%" x2="90%" y2="75%">
          <stop offset="0%" stopColor={isWatermark ? '#13345B' : '#13345B'} />
          <stop offset="65%" stopColor={isWatermark ? '#1E4E79' : '#26618D'} />
          <stop offset="100%" stopColor={isWatermark ? '#3A7CA5' : '#4086AD'} />
        </linearGradient>
        <linearGradient id={botGradId} x1="10%" y1="30%" x2="92%" y2="85%">
          <stop offset="0%" stopColor={isWatermark ? '#13345B' : '#13345B'} />
          <stop offset="55%" stopColor={isWatermark ? '#2A5478' : '#2B5B84'} />
          <stop offset="100%" stopColor={isWatermark ? '#A67C46' : '#C09556'} />
        </linearGradient>
      </defs>

      {/* Upper-to-inner-lower sweeping S-ribbon (Navy to Cerulean) */}
      <path
        d="M 118 27 C 88 4, 42 7, 20 34 C 38 49, 64 60, 102 47"
        stroke={`url(#${topGradId})`}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Inner-upper-to-bottom sweeping S-ribbon (Navy to Warm Gold) */}
      <path
        d="M 38 35 C 76 22, 102 33, 120 48 C 98 75, 52 78, 22 55"
        stroke={`url(#${botGradId})`}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Crisp concentric iris ring, dark pupil & light reflection */}
      <circle
        cx="70"
        cy="41"
        r="13.5"
        fill="#FFFFFF"
        fillOpacity={isWatermark ? 0 : 0.92}
        stroke="#274E73"
        strokeWidth="2.2"
      />
      <circle cx="70" cy="41" r="8.2" fill="#0F1D32" />
      <circle cx="67.2" cy="38.2" r="2.3" fill="#FFFFFF" fillOpacity={isWatermark ? 0.4 : 0.95} />

      {showWordmark && (
        <text
          x="70"
          y="99"
          textAnchor="middle"
          textLength="126"
          lengthAdjust="spacingAndGlyphs"
          fill="#13345B"
          fontSize="10.2"
          fontWeight="700"
          fontFamily="Figtree, system-ui, sans-serif"
          letterSpacing="0.8"
        >
          SHRIDHAR NETRALAYA
        </text>
      )}
    </svg>
  );
}
