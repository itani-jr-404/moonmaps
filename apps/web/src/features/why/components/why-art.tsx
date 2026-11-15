'use client';

import { useReducedMotion } from '@/lib/motion/reduced-motion';

/*
  The three small drawings of the "why the pole" cards, copied from the prototype.
  They animate with SVG <animate>, which the reduced-motion CSS rule cannot stop,
  so the animation elements are left out when motion is reduced.
  The ground is a light grey Moon surface with a few craters, drawn by the team (no image),
  so it stands out from the dark sky.
*/

/** A light grey gradient for the ground; `id` must be unique on the page. */
function GroundGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#e4e7ec" />
      <stop offset=".45" stopColor="#c3c8d0" />
      <stop offset="1" stopColor="#8f96a1" />
    </linearGradient>
  );
}

/** Small craters on the ground: a darker bowl with a lit rim. */
function Craters({
  at,
}: {
  at: readonly (readonly [number, number, number])[];
}) {
  return (
    <g>
      {at.map(([cx, cy, r]) => (
        <g key={`${cx}-${cy}`}>
          <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.38} fill="#9aa1ac" />
          <ellipse
            cx={cx + r * 0.12}
            cy={cy + r * 0.08}
            rx={r * 0.8}
            ry={r * 0.26}
            fill="#b3b9c2"
          />
          <path
            d={`M${cx - r} ${cy} A${r} ${r * 0.38} 0 0 0 ${cx + r} ${cy}`}
            fill="none"
            stroke="#eef0f3"
            strokeWidth=".8"
            opacity=".8"
          />
        </g>
      ))}
    </g>
  );
}

export function IceArt() {
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 320 180">
      <defs>
        <GroundGradient id="why-ground-1" />
        <linearGradient id="why-shadow-1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4560" />
          <stop offset="1" stopColor="#1b2440" />
        </linearGradient>
      </defs>
      {/* The inside of the crater never sees the Sun, so it is dark. */}
      <path d="M90 118 L120 160 L200 160 L230 118Z" fill="url(#why-shadow-1)" />
      <path
        d="M0 120 Q60 112 90 118 L120 160 L200 160 L230 118 Q270 110 320 120 L320 180 L0 180Z"
        fill="url(#why-ground-1)"
      />
      <Craters
        at={[
          [40, 140, 14],
          [270, 150, 18],
          [160, 172, 10],
        ]}
      />
      <path
        d="M120 160 L200 160 L190 148 Q160 140 130 148Z"
        fill="#9CC2FF"
        opacity=".85"
      >
        {reduced ? null : (
          <animate
            attributeName="opacity"
            values=".55;.95;.55"
            dur="3s"
            repeatCount="indefinite"
          />
        )}
      </path>
      <g fill="#E8EEF8" opacity=".9">
        <circle cx="145" cy="150" r="2" />
        <circle cx="170" cy="153" r="1.6" />
        <circle cx="185" cy="149" r="1.4" />
      </g>
    </svg>
  );
}

export function LowSunArt() {
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 320 180">
      <defs>
        <radialGradient id="w2sun">
          <stop offset="0" stopColor="#fff3cf" />
          <stop offset=".45" stopColor="#FFC36B" />
          <stop offset="1" stopColor="#FFC36B" stopOpacity="0" />
        </radialGradient>
        <GroundGradient id="why-ground-2" />
      </defs>
      <circle cx="60" cy="112" r="34" fill="url(#w2sun)">
        {reduced ? null : (
          <animate
            attributeName="cx"
            values="40;280;40"
            dur="9s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <path
        d="M0 120 L50 116 L110 122 L170 104 L220 120 L320 118 L320 180 L0 180Z"
        fill="url(#why-ground-2)"
      />
      <Craters
        at={[
          [60, 145, 16],
          [190, 138, 12],
          [265, 160, 20],
        ]}
      />
    </svg>
  );
}

export function EarthArt() {
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 320 180">
      <defs>
        <GroundGradient id="why-ground-3" />
      </defs>
      <g>
        <circle cx="160" cy="100" r="22" fill="#2a6fb0" />
        <path d="M148 92 q8-6 14 2 q6 6 2 12 q-8 2-14-4z" fill="#5f9e6a" />
        {reduced ? null : (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 30;0 -18;0 30"
            dur="6s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines=".45 0 .55 1;.45 0 .55 1"
          />
        )}
      </g>
      <path d="M0 122 L320 122 L320 180 L0 180Z" fill="url(#why-ground-3)" />
      <Craters
        at={[
          [50, 150, 18],
          [150, 140, 10],
          [250, 158, 15],
        ]}
      />
    </svg>
  );
}
