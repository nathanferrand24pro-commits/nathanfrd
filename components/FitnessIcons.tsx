// Icônes SVG minimales (trait 1.8), style sobre proche des symboles iOS.

interface IconProps {
  className?: string;
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function IconHome({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-4V15h-5v5.5h-4A1.5 1.5 0 0 1 4 19Z" />
    </svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
      <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
      <path d="M8.5 14h2.5M13.5 14h2M8.5 17h2.5" />
    </svg>
  );
}

export function IconDumbbell({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M8.5 12h7" />
      <rect x="4.5" y="8.5" width="2.6" height="7" rx="1.1" />
      <rect x="16.9" y="8.5" width="2.6" height="7" rx="1.1" />
      <rect x="1.8" y="10" width="1.9" height="4" rx="0.9" />
      <rect x="20.3" y="10" width="1.9" height="4" rx="0.9" />
    </svg>
  );
}

export function IconMeal({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M7 3.5v6.5M4.8 3.5V7a2.2 2.2 0 0 0 4.4 0V3.5M7 10v10.5" />
      <path d="M15.5 13.5c-1.4 0-2-1.6-2-4s1.2-6 3-6c1.2 0 1.5 1.2 1.5 3.5V20.5" />
    </svg>
  );
}

export function IconMoon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

export function IconChart({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 4v15.5h16" />
      <path d="m7.5 14 3.5-4 3 2.5 4.5-5.5" />
    </svg>
  );
}

export function IconList({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
