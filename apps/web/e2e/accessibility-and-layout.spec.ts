import { expect, test } from '@playwright/test';
import { collectPageErrors, isAnalyzeFrom, skipIntro } from './helpers';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('shows everything at once, with no intro', async ({ page }) => {
    const errors = collectPageErrors(page);
    const analyze = page.waitForResponse(isAnalyzeFrom('2026-11-20T00:00:00Z'));
    await page.goto('/planner?site=mons-mouton&t=2026-11-20T00:00Z');
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
    await page.goto('/planner?site=haworth&t=2026-11-20T00:00Z');
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

test('every page is reachable from the navigation', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/');
  await skipIntro(page);
  for (const [name, path] of [
    ['Explore', '/explore'],
    ['Planner', '/planner'],
    ['Sites', '/sites'],
    ['Accuracy', '/accuracy'],
    ['About', '/about'],
    ['Home', '/'],
  ] as const) {
    const link = page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('link', { name, exact: true });
    await expect(link).toBeInViewport();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(link).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('a site page answers from the API and an unknown site says so', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await page.goto('/sites');
  await expect(page.getByTestId('site-card').first()).toBeVisible();
  await page.goto('/sites/shackleton-ridge');
  await expect(page.getByTestId('site-title')).toBeVisible();
  await expect(page.getByTestId('outlook-headline')).toHaveAttribute(
    'data-good',
    /yes|no/,
  );
  await expect(page.getByTestId('forecast-days').locator('li')).toHaveCount(14);
  await expect(page.getByTestId('horizon-panorama')).toBeVisible();
  await page.goto('/sites/not-a-site');
  await expect(
    page.getByRole('heading', { name: 'We do not know this site' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
