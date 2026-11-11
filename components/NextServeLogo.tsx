// Generic food-business SVG logo icon
// Works for: restaurants, bakeries, cafés, food courts, etc.
// Uses a serving cloche (plate dome) + fork — universal food service symbol

interface NextServeLogoProps {
  size?: number;
  className?: string;
}

export default function NextServeLogo({ size = 40, className = "" }: NextServeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NextServe Logo"
    >
      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" fill="url(#grad)" />

      {/* Serving cloche dome */}
      <path
        d="M8 22C8 15.373 13.373 10 20 10C26.627 10 32 15.373 32 22"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Plate base line */}
      <line
        x1="6"
        y1="23.5"
        x2="34"
        y2="23.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Fork on the left */}
      <line x1="11" y1="26" x2="11" y2="33" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9.5" y1="26" x2="9.5" y2="29" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="12.5" y1="26" x2="12.5" y2="29" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9.5 29 Q11 30.5 12.5 29" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Spoon on the right */}
      <line x1="29" y1="30" x2="29" y2="33" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="29" cy="28" rx="2" ry="2.5" stroke="white" strokeWidth="1.5" fill="none" />

      {/* Small star / sparkle on dome top - represents quality */}
      <circle cx="20" cy="8.5" r="1.5" fill="white" opacity="0.9" />

      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
    </svg>
  );
}
