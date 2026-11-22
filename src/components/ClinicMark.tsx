export function ClinicMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#FFFDF9" stroke="#1F1A16" strokeWidth="1.25" />
      <path
        d="M8 32c6.2-10.5 14.2-16 24-16s17.8 5.5 24 16c-6.2 10.5-14.2 16-24 16S14.2 42.5 8 32z"
        fill="none"
        stroke="#1F1A16"
        strokeWidth="1.35"
      />
      <circle cx="32" cy="32" r="9.2" fill="#8C5928" />
      <circle cx="32" cy="32" r="3.6" fill="#1F1A16" />
      <circle cx="29.4" cy="29.2" r="1.35" fill="#FFFDF9" />
    </svg>
  );
}
