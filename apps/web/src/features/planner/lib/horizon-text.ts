/**
 * Grid names come from the API's horizon_source: lola-80s-80m and lola-75s-120m near the
 * south pole, lola-global-16ppd elsewhere, sphere when no grid is loaded.
 */
export function horizonText(source: string): string {
  if (!source.startsWith('lola')) {
    return 'Smooth Moon: no terrain data loaded for this place';
  }
  const ppd = /^lola-global-(\d+)ppd$/.exec(source)?.[1];
  if (ppd) {
    return `Horizon from NASA LOLA terrain (global grid, ${ppd} pixels per degree)`;
  }
  const metres = /-(\d+)m$/.exec(source)?.[1];
  return metres
    ? `Horizon from NASA LOLA terrain (${metres} m grid)`
    : 'Horizon from NASA LOLA terrain';
}
