import { expect, test, type Page, type Request } from '@playwright/test';
import { collectPageErrors } from './helpers';

/*
  The site assistant on a site page, with POST /assistant/chat mocked: answers depend on a
  language model and a server key, so these tests check what the web app does with a known
  response, and never send a real question.
*/

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

const ANSWER = {
  reply:
    'Haworth has sunlight and a view of Earth at that time.\n- Sun: above the horizon\n- Earth: above the horizon\nMore at https://science.nasa.gov/moon/ and https://example.com/x',
  sources: [
    { kind: 'tool', id: 'analyze', title: 'Moon Maps analysis' },
    { kind: 'knowledge', id: 'sites', title: 'Landing sites' },
  ],
  tools_used: ['analyze'],
  app_link: {
    site_id: 'haworth',
    lat: -86.8,
    lon: -22,
    t: '2026-12-01T12:00:00Z',
  },
  model: 'test-model',
};

async function mockChat(page: Page, delayMs = 300): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route('**/assistant/chat', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers: CORS });
    requests.push(req);
    await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: 200,
      headers: CORS,
      contentType: 'application/json',
      body: JSON.stringify(ANSWER),
    });
  });
  return requests;
}

const panel = (page: Page) =>
  page.getByRole('complementary', { name: /^Ask about Haworth/ });

test.describe('site assistant', () => {
  test('opens by itself, answers with the site as context, and folds into a pill', async ({
    page,
  }) => {
    const errors = collectPageErrors(page);
    const requests = await mockChat(page);
    await page.goto('/sites/haworth');

    await expect(panel(page)).toBeVisible({ timeout: 15_000 });
    await expect(
      panel(page).getByText('What would you like to know about Haworth?'),
    ).toBeVisible();
    await expect(
      panel(page)
        .getByRole('group', { name: 'Suggested questions' })
        .getByRole('button'),
    ).toHaveCount(4);
    // The global launcher stays hidden on a site page.
    await expect(
      page.getByRole('button', { name: /^Ask the Moon Maps assistant/ }),
    ).toHaveCount(0);

    await panel(page)
      .getByRole('button', { name: 'When is it next good for landing?' })
      .click();
    await expect(panel(page).getByText('Thinking…')).toBeVisible();
    const answer = panel(page).getByTestId('site-answer');
    await expect(answer).toContainText('Earth: above the horizon');
    await expect(
      answer.getByRole('link', { name: /science\.nasa\.gov/ }),
    ).toBeVisible();
    // A link to a host that is not allowed stays plain text.
    await expect(
      answer.getByRole('link', { name: /example\.com/ }),
    ).toHaveCount(0);
    await expect(
      answer.getByRole('list', { name: 'Sources' }).getByRole('listitem'),
    ).toHaveCount(2);
    await expect(answer.getByRole('button', { name: 'Copy' })).toBeVisible();
    await expect(answer.getByRole('button', { name: 'Retry' })).toBeVisible();

    expect(requests).toHaveLength(1);
    const body = requests[0]!.postDataJSON() as {
      context: { site_id?: string; t?: string };
      messages: { role: string; content: string }[];
    };
    expect(body.context.site_id).toBe('haworth');
    expect(body.context.t).toBeTruthy();
    expect(body.messages.at(-1)!.content).toContain('Haworth');

    // Retry asks the same question again and replaces the answer.
    await answer.getByRole('button', { name: 'Retry' }).click();
    await expect(panel(page).getByTestId('site-answer')).toHaveCount(1);
    await expect.poll(() => requests.length).toBe(2);

    // Typing: Enter sends, Shift+Enter makes a new line.
    const input = panel(page).getByRole('textbox', {
      name: 'Your question about Haworth',
    });
    await expect(panel(page).getByTestId('site-answer')).toContainText('Earth');
    await input.fill('Line one');
    await input.press('Shift+Enter');
    await input.pressSequentially('line two');
    await expect(input).toHaveValue('Line one\nline two');
    await input.press('Enter');
    await expect(panel(page).getByTestId('site-question')).toHaveCount(2);
    await expect.poll(() => requests.length).toBe(3);

    // Escape folds the panel into the pill, and the pill opens it again.
    await expect(panel(page).getByTestId('site-answer')).toHaveCount(2);
    await input.press('Escape');
    const pill = page.getByRole('button', { name: 'Ask about Haworth' });
    await expect(pill).toBeVisible();
    await expect(pill).toBeFocused();
    await pill.click();
    await expect(input).toBeFocused();
    // The conversation is still there.
    await expect(panel(page).getByTestId('site-question')).toHaveCount(2);

    expect(errors).toEqual([]);
  });

  test('keeps a separate conversation per site', async ({ page }) => {
    await mockChat(page, 50);
    await page.goto('/sites/haworth');
    await expect(panel(page)).toBeVisible({ timeout: 15_000 });
    await panel(page)
      .getByRole('button', { name: 'How long can a lander stay here?' })
      .click();
    await expect(panel(page).getByTestId('site-answer')).toHaveCount(1);

    await page.goto('/sites/malapert-massif');
    const other = page.getByRole('complementary', { name: /^Ask about / });
    await expect(other).toBeVisible({ timeout: 15_000 });
    await expect(other.getByTestId('site-question')).toHaveCount(0);
    await expect(
      other.getByText(/^What would you like to know about /),
    ).toBeVisible();
  });

  test('is shown at once with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/sites/haworth');
    await expect(panel(page)).toBeVisible({ timeout: 10_000 });
  });
});
