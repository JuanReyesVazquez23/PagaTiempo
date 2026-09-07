export function Logo({
  size = 48,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-label="PagaTiempo logo"
      role="img"
    >
      <defs>
        <linearGradient id="pt-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f2f5f8" />
          <stop offset="100%" stopColor="#dde3ec" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width="512" height="512" rx="96" ry="96" fill="url(#pt-bg)" />
      {/* Clock outer ring */}
      <circle cx="230" cy="230" r="165" fill="none" stroke="#0f172a" strokeWidth="26" />
      {/* Cardinal ticks */}
      <line x1="230" y1="78" x2="230" y2="102" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" />
      <line x1="230" y1="358" x2="230" y2="382" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" />
      <line x1="78" y1="230" x2="102" y2="230" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" />
      <line x1="358" y1="230" x2="382" y2="230" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" />
      {/* Diagonal ticks */}
      <line x1="310" y1="95" x2="299" y2="116" stroke="#0f172a" strokeWidth="11" strokeLinecap="round" />
      <line x1="150" y1="95" x2="161" y2="116" stroke="#0f172a" strokeWidth="11" strokeLinecap="round" />
      <line x1="365" y1="150" x2="344" y2="161" stroke="#0f172a" strokeWidth="11" strokeLinecap="round" />
      <line x1="95" y1="150" x2="116" y2="161" stroke="#0f172a" strokeWidth="11" strokeLinecap="round" />
      {/* Clock hands */}
      <line x1="230" y1="230" x2="230" y2="138" stroke="#0f172a" strokeWidth="18" strokeLinecap="round" />
      <line x1="230" y1="230" x2="290" y2="200" stroke="#0f172a" strokeWidth="14" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="230" cy="230" r="11" fill="#0f172a" />
      {/* Checkmark (green accent) */}
      <polyline
        points="175,270 210,308 290,218"
        fill="none"
        stroke="#059669"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Money badge */}
      <circle cx="372" cy="372" r="110" fill="#0f172a" />
      <circle cx="372" cy="372" r="94" fill="#e9edf2" />
      <text
        x="372"
        y="375"
        fontFamily="Arial, sans-serif"
        fontSize="96"
        fontWeight="700"
        fill="#0f172a"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        $
      </text>
    </svg>
  );
}
