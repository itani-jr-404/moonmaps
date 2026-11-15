import { describe, expect, it } from 'vitest';
import { isActive, plannerPath, sitePath } from './routes';

describe('routes', () => {
  it('marks a page and its sub-pages as active', () => {
    expect(isActive('/sites', '/sites')).toBe(true);
    expect(isActive('/sites/apollo-11', '/sites')).toBe(true);
    expect(isActive('/sitesx', '/sites')).toBe(false);
    expect(isActive('/planner', '/')).toBe(false);
    expect(isActive('/', '/')).toBe(true);
  });

  it('builds site and planner links', () => {
    expect(sitePath('apollo-11', 0, 0)).toBe('/sites/apollo-11');
    expect(sitePath(null, -89.45, -137.3)).toBe(
      '/sites/spot?lat=-89.4500&lon=-137.3000',
    );
    expect(
      plannerPath(
        { kind: 'site', id: 'haworth' },
        Date.parse('2026-11-15T10:00:00Z'),
      ),
    ).toBe('/planner?site=haworth&t=2026-11-15T10%3A00Z');
  });
});
