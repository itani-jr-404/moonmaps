import { describe, expect, it } from 'vitest';
import { horizonText } from './horizon-text';

describe('horizonText', () => {
  it('names the grid the API used', () => {
    expect(horizonText('lola-80s-80m')).toBe(
      'Horizon from NASA LOLA terrain (80 m grid)',
    );
    expect(horizonText('lola-75s-120m')).toBe(
      'Horizon from NASA LOLA terrain (120 m grid)',
    );
  });

  it('says when there is no terrain', () => {
    expect(horizonText('sphere')).toBe(
      'Smooth Moon: no terrain data at this latitude',
    );
  });
});
