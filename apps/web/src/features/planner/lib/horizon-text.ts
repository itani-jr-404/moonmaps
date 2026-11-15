/** Grid names come from the API's horizon_source, for example lola-75s-120m. */
export function horizonText(source: string): string {
  if (!source.startsWith('lola')) {
    return 'Smooth Moon: no terrain data at this latitude';
  }
  const metres = /-(\d+)m$/.exec(source)?.[1];
  return metres
    ? `Horizon from NASA LOLA terrain (${metres} m grid)`
    : 'Horizon from NASA LOLA terrain';
}
