import { expect, test } from '@playwright/test';
import {
  collectPageErrors,
  isAnalyzeFrom,
  isApi,
  pageShortTime,
  skipIntro,
  type Window,
} from './helpers';

const HOUR = 3_600_000;

type Analyze = {
  results: Array<{
    site: { id: string; name: string };
    start: string;
    at_start: { sun_visible: boolean; earth_visible: boolean };
    metrics: {
      next_sunset: string | null;
      next_sunrise: string | null;
      next_earthset: string | null;
      next_earthrise: string | null;
    };
    windows: { both: Window[] };
  }>;
};

/** Checks the answer card, the calendar and the best times against the API's own response. */
async function expectPlannerMatches(
  page: import('@playwright/test').Page,
  body: Analyze,
) {
  const [verdict, month] = body.results;
  expect(verdict && month).toBeTruthy();
  const sun = verdict!.at_start.sun_visible;
  const earth = verdict!.at_start.earth_visible;

  const card = page.getByTestId('planner-answer');
  await expect(card).toHaveAttribute(
    'data-verdict',
    sun && earth ? 'good' : 'bad',
  );
  await expect(card.locator('h3')).toHaveText(
    sun && earth ? 'Good landing site' : 'Bad landing site',
  );

  const sunFact = page.getByTestId('fact-sun');
  const earthFact = page.getByTestId('fact-earth');
  await expect(sunFact).toHaveAttribute('data-ok', String(sun));
  await expect(earthFact).toHaveAttribute('data-ok', String(earth));
  const sunChange = sun
    ? verdict!.metrics.next_sunset
    : verdict!.metrics.next_sunrise;
  const earthChange = earth
    ? verdict!.metrics.next_earthset
    : verdict!.metrics.next_earthrise;
  if (!sun && sunChange)
    await expect(sunFact).toContainText(await pageShortTime(page, sunChange));
  if (!earth && earthChange)
    await expect(earthFact).toContainText(
      await pageShortTime(page, earthChange),
    );
  if (sun && !sunChange)
    await expect(sunFact).toContainText('more than a month');
  if (earth && !earthChange)
    await expect(earthFact).toContainText('more than a month');

  // The 30-day calendar: each local day's grade follows the hours of the API's "both" windows.
  const days = page.getByTestId('calendar-day');
  await expect(days).toHaveCount(30);
  const starts = (await days.evaluateAll((els) =>
    els.map((e) => Number(e.getAttribute('data-start'))),
  )) as number[];
  const kinds = await days.evaluateAll((els) =>
    els.map((e) => e.getAttribute('data-kind')),
  );
  const both = month!.windows.both.map(
    (w) => [Date.parse(w.start), Date.parse(w.end)] as const,
  );
  starts.forEach((dayStart, i) => {
    const dayEnd = starts[i + 1] ?? dayStart + 24 * HOUR;
    const hours =
      both.reduce(
        (sum, [a, b]) =>
          sum + Math.max(0, Math.min(b, dayEnd) - Math.max(a, dayStart)),
        0,
      ) / HOUR;
    const expected = hours >= 18 ? 'good' : hours > 0 ? 'some' : 'bad';
    expect(
      kinds[i],
      `day ${new Date(dayStart).toISOString()} with ${hours.toFixed(2)} good hours`,
    ).toBe(expected);
  });

  // Best times: every listed window lies inside one of the API's "both" windows and ends with it.
  const listed = page.getByTestId('best-window');
  const count = await listed.count();
  expect(count).toBeLessThanOrEqual(4);
  for (let i = 0; i < count; i++) {
    const start = Number(await listed.nth(i).getAttribute('data-start'));
    const end = Number(await listed.nth(i).getAttribute('data-end'));
    expect(
      both.some(([a, b]) => Math.abs(b - end) < 60_000 && start >= a - 60_000),
    ).toBe(true);
  }
  if (both.some(([, b]) => b > Date.now())) expect(count).toBeGreaterThan(0);
}

test('planner opened from a link shows exactly the API answer', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  const analyze = page.waitForResponse(isAnalyzeFrom('2026-11-14T14:56:00Z'));
  await page.goto('/planner?site=shackleton-ridge&t=2026-11-14T14:56Z');
  const body = (await (await analyze).json()) as Analyze;
  await skipIntro(page);
  await page.locator('#navigator').scrollIntoViewIfNeeded();
  expect(body.results[0]!.start).toBe('2026-11-14T14:56:00Z');
  await expectPlannerMatches(page, body);
  await expect(page.getByText('Horizon from NASA LOLA terrain')).toBeVisible();
  expect(errors).toEqual([]);
});

test('choosing another site and a quick date updates the answer from the API', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await page.goto('/planner?site=shackleton-ridge&t=2026-11-14T14:56Z');
  await skipIntro(page);
  await page.locator('#navigator').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('planner-answer')).toHaveAttribute(
    'data-verdict',
    /good|bad/,
  );

  let analyze = page.waitForResponse(isApi('/analyze', 'POST'));
  await page.getByRole('button', { name: 'Malapert Massif' }).click();
  let body = (await (await analyze).json()) as Analyze;
  expect(body.results[0]!.site.id).toBe('malapert-massif');
  await expectPlannerMatches(page, body);
  await expect(page).toHaveURL(/site=malapert-massif/);

  analyze = page.waitForResponse(isApi('/analyze', 'POST'));
  await page.getByRole('button', { name: 'In a week' }).click();
  body = (await (await analyze).json()) as Analyze;
  const askedFor = Date.parse(body.results[0]!.start);
  expect(Math.abs(askedFor - (Date.now() + 7 * 24 * HOUR))).toBeLessThan(
    2 * HOUR,
  );
  await expectPlannerMatches(page, body);

  analyze = page.waitForResponse(isApi('/analyze', 'POST'));
  await page.getByRole('button', { name: 'Apollo 11' }).click();
  body = (await (await analyze).json()) as Analyze;
  await expectPlannerMatches(page, body);
  await expect(
    page.getByText(
      'Horizon from NASA LOLA terrain (global grid, 16 pixels per degree)',
    ),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('the planner shows an error with a retry when the API cannot be reached', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await page.route('**/analyze', (route) => route.abort());
  await page.goto('/planner?site=haworth&t=2026-11-20T00:00Z');
  await skipIntro(page);
  await page.waitForTimeout(500);
  await page.locator('#navigator').scrollIntoViewIfNeeded();
  const card = page.getByTestId('planner-answer');
  await expect(card.getByRole('alert')).toContainText(
    'could not reach the Moon Maps API',
  );
  await page.unroute('**/analyze');
  const analyze = page.waitForResponse(isApi('/analyze', 'POST'));
  await card.getByRole('button', { name: 'Try again' }).click();
  await expectPlannerMatches(page, (await (await analyze).json()) as Analyze);
  expect(errors).toEqual([]);
});
