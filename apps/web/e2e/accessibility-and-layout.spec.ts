import { expect, test } from '@playwright/test';
import {
  collectPageErrors,
  isAnalyzeFrom,
  skipIntro,
  waitForScrollToSettle,
} from './helpers';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows everything at once, with no intro', async ({ page }) => {
    const errors = collectPageErrors(page);
    const analyze = page.waitForResponse(isAnalyzeFrom('2026-11-20T00:00:00Z'));
    await page.goto('/?site=mons-mouton&t=2026-11-20T00:00Z');
    await expect(page.getByRole('button', { name: 'Skip intro' })).toHaveCount(
      0,
    );
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    await expect(
      page.getByRole('link', { name: 'Open the planner' }),
    ).toBeVisible();
    await analyze;
    // Scroll-reveal blocks are fully visible without animation.
    const hidden = await page
      .locator('[data-reveal]')
      .evaluateAll(
        (els) =>
          els.filter((e) => Number(getComputedStyle(e).opacity) < 1).length,
      );
    expect(hidden).toBe(0);
    await page.locator('#navigator').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('planner-answer')).toHaveAttribute(
      'data-verdict',
      /good|bad/,
    );
    expect(errors).toEqual([]);
  });
});

test.describe('phone', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('fits the screen and the planner works', async ({ page }) => {
    const errors = collectPageErrors(page);
    const analyze = page.waitForResponse(isAnalyzeFrom('2026-11-20T00:00:00Z'));
    await page.goto('/?site=haworth&t=2026-11-20T00:00Z');
    await analyze;
    const skip = page.getByRole('button', { name: 'Skip intro' });
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await page.locator('#navigator').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('planner-answer')).toHaveAttribute(
      'data-verdict',
      /good|bad/,
    );
    const width = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(width).toBeLessThanOrEqual(390);
    expect(errors).toEqual([]);
  });
});

test('every section is reachable from the navigation', async ({ page }) => {
  await page.goto('/');
  await skipIntro(page);
  for (const [name, id] of [
    ['Why the pole', 'why'],
    ['Planner', 'navigator'],
    ['Landing', 'land'],
    ['About', 'about'],
  ] as const) {
    // The bar hides while scrolling down and comes back on a small scroll up, as designed.
    await page.mouse.wheel(0, -120);
    const link = page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name });
    await expect(link).toBeInViewport();
    await link.click();
    await waitForScrollToSettle(page);
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});
