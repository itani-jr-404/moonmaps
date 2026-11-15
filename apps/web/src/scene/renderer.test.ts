import { afterEach, describe, expect, it, vi } from 'vitest';

import { shadowMapSize } from './renderer';

function device(width: number, coarse: boolean, cores: number) {
  vi.stubGlobal('innerWidth', width);
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('coarse') ? coarse : false,
  }));
  vi.stubGlobal('navigator', { hardwareConcurrency: cores });
}

describe('shadowMapSize', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('gives a desktop with a mouse and many cores the full map', () => {
    device(1440, false, 8);
    expect(shadowMapSize()).toBe(4096);
  });

  it('halves the map on phones, touch-only devices and low-core machines', () => {
    device(390, true, 8);
    expect(shadowMapSize()).toBe(2048);
    device(1280, true, 8);
    expect(shadowMapSize()).toBe(2048);
    device(1440, false, 4);
    expect(shadowMapSize()).toBe(2048);
  });
});
