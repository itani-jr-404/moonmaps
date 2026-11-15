import { type Place } from '@/lib/state/scenario-store';
import { scenarioQuery } from '@/lib/state/url-sync';

/** The pages of the site, in the order the navigation and the footer list them. */
export const PAGES = [
  { href: '/explore', label: 'Choose a landing', short: 'Explore' },
  { href: '/planner', label: 'Planner', short: 'Planner' },
  { href: '/sites', label: 'Sites', short: 'Sites' },
  { href: '/accuracy', label: 'How sure are we', short: 'Accuracy' },
  { href: '/about', label: 'About', short: 'About' },
] as const;

/** True when `pathname` is this page or one of its sub-pages. */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The site page for a curated site, or for any point on the Moon. */
export function sitePath(
  siteId: string | null,
  lat: number,
  lon: number,
): string {
  if (siteId) return `/sites/${encodeURIComponent(siteId)}`;
  return `/sites/spot?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
}

/** The planner opened on a place and a moment. */
export function plannerPath(place: Place, timeMs: number): string {
  return `/planner?${scenarioQuery(place, timeMs)}`;
}
