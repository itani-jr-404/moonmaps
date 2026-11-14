import { expect, test } from '@playwright/test';
import {
  collectPageErrors,
  isAimSky,
  isApi,
  skipIntro,
  waitForScrollToSettle,
} from './helpers';

type Sky = {
  lat: number;
  lon: number;
  sun: { visible: boolean };
  earth: { visible: boolean };
};

test('the live south pole readout shows the API answer', async ({ page }) => {
  const errors = collectPageErrors(page);
  const live = page.waitForResponse(
    (r) =>
      isApi('/sky')(r) && new URL(r.url()).searchParams.get('lat') === '-89.9',
  );
  await page.goto('/');
  const sky = (await (await live).json()) as Sky;
  await skipIntro(page);
  await expect(page.getByTestId('live-sun')).toHaveText(
    sky.sun.visible ? 'Yes, the Sun is up' : 'No, it is dark',
  );
  await expect(page.getByTestId('live-earth')).toHaveText(
    sky.earth.visible ? 'In view' : 'Hidden',
  );
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  expect(errors).toEqual([]);
});

test('aiming at the globe and landing show the API answer for that spot', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  await page.goto('/');
  await skipIntro(page);
  const stage = page.getByLabel(
    'Interactive 3D Moon. Hover to aim at a landing site, click to choose it.',
  );
  await stage.scrollIntoViewIfNeeded();
  await waitForScrollToSettle(page);
  const box = await stage.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;

  // Aim: the card shows the verdict for the point the page asked the API about.
  const aimed = page.waitForResponse(isAimSky);
  await page.mouse.move(x - 20, y - 20);
  await page.mouse.move(x, y, { steps: 5 });
  const aimSky = (await (await aimed).json()) as Sky;
  const aimCard = page.getByTestId('aim-card');
  await expect(aimCard).toHaveAttribute(
    'data-verdict',
    aimSky.sun.visible && aimSky.earth.visible ? 'good' : 'bad',
  );
  await expect(aimCard).toContainText(
    `Sunlight right now: ${aimSky.sun.visible ? 'Yes' : 'No'}`,
  );
  await expect(aimCard).toContainText(
    `Can see Earth: ${aimSky.earth.visible ? 'Yes' : 'No'}`,
  );

  // Land: the surface view shows the verdict for the landed point at that moment.
  const landed = page.waitForResponse(isAimSky);
  await page.mouse.click(x, y);
  const hud = page.getByTestId('surface-hud');
  const landSky = (await (await landed).json()) as Sky;
  await expect(hud).toBeVisible();
  await expect(hud).toHaveAttribute(
    'data-verdict',
    landSky.sun.visible && landSky.earth.visible ? 'good' : 'bad',
  );
  await expect(hud).toContainText(
    `Sunlight: ${landSky.sun.visible ? 'Yes' : 'No'}`,
  );
  await expect(hud).toContainText(
    `Can see Earth: ${landSky.earth.visible ? 'Yes' : 'No'}`,
  );

  // "See the best dates" hands the spot to the planner.
  const analyze = page.waitForResponse(isApi('/analyze', 'POST'));
  await hud.getByRole('button', { name: 'See the best dates' }).click();
  await analyze;
  await expect(page.getByTestId('planner-answer')).toHaveAttribute(
    'data-verdict',
    /good|bad/,
  );
  expect(errors).toEqual([]);
});
