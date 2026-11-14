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
