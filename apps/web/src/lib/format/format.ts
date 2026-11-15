/** Formatting for the interface. Times show in the visitor's own time zone; the API is UTC. */

const HOUR = 3_600_000;

export function fmtWhen(t: number | Date): string {
  return new Date(t).toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtShort(t: number | Date): string {
  return new Date(t).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** A duration in plain words: "about an hour", "5 hours", "11 days 17 hours". */
export function plainDuration(ms: number | null): string {
  if (ms === null) return 'more than a month';
  const h = Math.round(ms / HOUR);
  const d = Math.floor(h / 24);
  const r = h % 24;
  if (d === 0) return h <= 1 ? 'about an hour' : `${h} hours`;
  return `${d} ${d === 1 ? 'day' : 'days'}${r ? ` ${r} ${r === 1 ? 'hour' : 'hours'}` : ''}`;
}

export function fmtCoord(lat: number, lon: number, digits = 3): string {
  return `${Math.abs(lat).toFixed(digits)}°${lat < 0 ? 'S' : 'N'}  ${Math.abs(lon).toFixed(digits)}°${lon < 0 ? 'W' : 'E'}`;
}

export function fmtDeg(v: number, digits = 2): string {
  return `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(digits)}°`;
}

export function compassWord(azDeg: number): string {
  const names = [
    'north',
    'north-east',
    'east',
    'south-east',
    'south',
    'south-west',
    'west',
    'north-west',
  ];
  return names[Math.round((((azDeg % 360) + 360) % 360) / 45) % 8]!;
}

/** A UTC calendar day, "Sun 15 Nov", for the day cards of the sky forecast. */
export function fmtUtcDay(t: number | Date): string {
  return new Date(t).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** A date without a time, "20 July 1969". */
export function fmtDate(t: number | Date): string {
  return new Date(t).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** A UTC date and time, "Tue, 1 Dec 2026, 12:00 UTC". */
export function fmtUtc(t: number | Date): string {
  const s = new Date(t).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${s} UTC`;
}

/** A trip length in days with one decimal, "4.3 days", from hours. */
export function fmtTravelDays(hours: number): string {
  return `${(hours / 24).toFixed(1)} days`;
}

/** A distance in whole kilometres with thousands separators, "384,400 km". */
export function fmtKm(km: number): string {
  return `${Math.round(km).toLocaleString('en-US')} km`;
}

/** A fraction from 0 to 1 as a whole percentage, "42%". */
export function fmtPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
