import type { Page, Response } from '@playwright/test';

/** The app's own date format for short times, evaluated in the page's time zone. */
export function pageShortTime(page: Page, iso: string): Promise<string> {
  return page.evaluate(
    (t) =>
      new Date(t).toLocaleString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
    iso,
  );
}

export function isApi(path: string, method = 'GET') {
  return (r: Response) =>
    r.request().method() === method &&
    new URL(r.url()).pathname === path &&
    r.ok();
}

/** Skips the intro if it is showing, then waits until the page can scroll. */
export async function skipIntro(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: 'Skip intro' });
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.getByRole('link', { name: 'Open the planner' }).waitFor();
  // The intro is over when the preloader has left the page.
  await page
    .locator('[data-pre]')
    .first()
    .waitFor({ state: 'detached', timeout: 30_000 });
}

/** Uncaught errors in the page; a test fails if any appear. */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

export type Window = { start: string; end: string };

/** Waits until smooth scrolling has stopped, so screen positions are stable. */
export async function waitForScrollToSettle(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        const y = window.scrollY;
        setTimeout(() => resolve(window.scrollY === y), 400);
      }),
    undefined,
    { timeout: 15_000 },
  );
}

/** A /sky request for a point other than the hero's live south pole readout. */
export function isAimSky(r: Response): boolean {
  if (!isApi('/sky')(r)) return false;
  const q = new URL(r.url()).searchParams;
  return !(q.get('lat') === '-89.9' && q.get('lon') === '0');
}

/** The /analyze response whose first scenario starts at the given UTC time. */
export function isAnalyzeFrom(startIso: string) {
  return (r: Response) => {
    if (!isApi('/analyze', 'POST')(r)) return false;
    const body = r.request().postDataJSON() as {
      scenarios?: Array<{ start?: string }>;
    };
    return (
      Date.parse(body.scenarios?.[0]?.start ?? '') === Date.parse(startIso)
    );
  };
}
