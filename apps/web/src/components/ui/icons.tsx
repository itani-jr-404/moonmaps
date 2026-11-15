import type { SVGProps } from 'react';

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/** A small Moon inside a tilted orbit ring, with a satellite dot. Used for the assistant. */
export function OrbitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M10.6 10.2a1 1 0 0 0 1.4 1.3" opacity=".6" />
      <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-24 12 12)" />
      <circle cx="20.1" cy="8.1" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

/** A target crosshair: a ring with four ticks and a centre dot. */
export function CrosshairIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A page with a plus, for starting a new conversation. */
export function NewChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M18 3v6M15 6h6" />
    </svg>
  );
}

export function ExternalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5" />
    </svg>
  );
}

/** The Moon Maps mark: a ring and a crescent. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4A7FD4" />
          <stop offset=".5" stopColor="#9CC2FF" />
          <stop offset="1" stopColor="#4A7FD4" />
        </linearGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="15"
        fill="none"
        stroke="url(#logo-grad)"
        strokeWidth="1.6"
      />
      <path
        d="M20 5a15 15 0 0 1 0 30a9 15 0 0 0 0-30z"
        fill="url(#logo-grad)"
      />
    </svg>
  );
}
