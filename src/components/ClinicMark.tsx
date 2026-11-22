export function ClinicMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#fffcf8" stroke="#1a1510" strokeWidth="1.25" />
      <path
        d="M8 32c6.2-10.5 14.2-16 24-16s17.8 5.5 24 16c-6.2 10.5-14.2 16-24 16S14.2 42.5 8 32z"
        fill="none"
        stroke="#1a1510"
        strokeWidth="1.35"
      />
      <circle cx="32" cy="32" r="9.2" fill="#0b6b62" />
      <circle cx="32" cy="32" r="3.6" fill="#1a1510" />
      <circle cx="29.4" cy="29.2" r="1.35" fill="#fffcf8" />
    </svg>
  );
}
