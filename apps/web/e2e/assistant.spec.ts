import { expect, test, type Page, type Request } from '@playwright/test';
import { collectPageErrors, skipIntro, waitForScrollToSettle } from './helpers';

/*
  The assistant panel, with POST /assistant/chat mocked: answers depend on a language model and a
  server key, so these tests check what the web app does with a known response, and never send
  a real question.
*/

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

type Reply = { status: number; json: unknown; delayMs?: number } | 'abort';

/** Answers every chat request with `next()`, and records the requests. */
async function mockChat(page: Page, next: () => Reply): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route('**/assistant/chat', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers: CORS });
    requests.push(req);
    const reply = next();
    if (reply === 'abort') return route.abort('failed');
    if (reply.delayMs) await new Promise((r) => setTimeout(r, reply.delayMs));
    await route.fulfill({
      status: reply.status,
      headers: CORS,
      contentType: 'application/json',
      body: JSON.stringify(reply.json),
    });
  });
  return requests;
}

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
const OK: Reply = { status: 200, json: ANSWER };

const launcher = (page: Page) =>
  page.getByRole('button', { name: /^Ask the Moon Maps assistant/ });
const panel = (page: Page) =>
  page.getByRole('dialog', { name: 'Moon Maps assistant' });
const input = (page: Page) =>
  page.getByRole('textbox', { name: 'Your question' });

async function openPanel(page: Page) {
  await launcher(page).click();
  await expect(panel(page)).toBeVisible();
}

async function ask(page: Page, text: string) {
  await openPanel(page);
  await input(page).fill(text);
  await input(page).press('Enter');
}

test('a floating pill asks a question; the answer has footnotes, a target card and quick replies', async ({
  page,
}) => {
  const errors = collectPageErrors(page);
  const requests = await mockChat(page, () => OK);
  await page.goto('/?site=mons-mouton&t=2026-11-20T00:00Z');
  await skipIntro(page);

  const pill = page
    .getByRole('group', { name: 'Suggested questions' })
    .getByRole('button', { name: 'Is this spot good right now?' });
  await pill.click();
  await expect(panel(page)).toBeVisible();
  // The pills are gone once the panel has been opened.
  await expect(pill).toHaveCount(0);

  // The context readout shows the site on screen, from GET /sites and the scenario store.
  const context = panel(page).getByTestId('assistant-context');
  await expect(context).toContainText('Mons Mouton');
  await expect(context).toContainText('84.60°S 31.00°E');
  await expect(context).toContainText('2026-11-20 00:00 UTC');

  const answer = panel(page).getByTestId('assistant-answer');
  await expect(answer).toContainText(
    'Haworth has sunlight and a view of Earth',
  );
  const body = requests[0]!.postDataJSON() as {
    messages: Array<{ role: string; content: string }>;
    context: { site_id?: string; t?: string };
  };
  expect(body.messages).toEqual([
    { role: 'user', content: 'Is this spot good right now?' },
  ]);
  expect(body.context.site_id).toBe('mons-mouton');
  expect(body.context.t).toMatch(/^2026-11-20T00:00/);

  // The question is a bubble on the right with its time under it; the answer is plain text
  // with a label row.
  const question = panel(page).getByTestId('assistant-question');
  await expect(question).toContainText(/\d\d:\d\d UTC/);
  const bubble = await question
    .locator('p')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        corner: s.borderBottomRightRadius,
        other: s.borderTopLeftRadius,
      };
    });
  expect(bubble).toEqual({ corner: '5px', other: '18px' });
  await expect(answer).toContainText(/MOON MAPS\s*·\s*\d\d:\d\d UTC/);
  const answerBg = await answer.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  expect(answerBg).toBe('rgba(0, 0, 0, 0)');

  // Only allowed hosts become links.
  await expect(answer.getByRole('link')).toHaveCount(1);
  await expect(answer.getByRole('link')).toHaveAttribute(
    'href',
    'https://science.nasa.gov/moon/',
  );
  await expect(answer).toContainText('https://example.com/x');

  // Sources as numbered footnotes, named by their full titles.
  const sources = answer.getByRole('list', { name: 'Sources' });
  await expect(
    sources.getByRole('listitem', { name: 'Moon Maps analysis' }),
  ).toHaveText('[1]');
  await expect(
    sources.getByRole('listitem', { name: 'Landing sites' }),
  ).toHaveText('[2]');

  // The target card loads the planner.
  const target = answer.getByTestId('assistant-target');
  await expect(target).toContainText('Haworth');
  await expect(target).toContainText('86.80°S 22.00°W');
  await expect(target).toContainText('2026-12-01 12:00 UTC');
  await target.getByRole('button', { name: 'Load in planner' }).click();
  await expect(page).toHaveURL(/[?&]site=haworth(&|$)/);
  await expect(page).toHaveURL(/[?&]t=2026-12-01T12(:|%3A)00Z/);
  await expect(context).toContainText('Haworth');
  // On a large screen the panel stays open.
  await expect(panel(page)).toBeVisible();

  // Quick replies are pills under the latest answer; one sends its question.
  const quick = answer.getByRole('group', { name: 'Quick replies' });
  await expect(quick.getByRole('button')).toHaveCount(2);
  await quick.getByRole('button', { name: 'Explain more simply' }).click();
  await expect(panel(page).getByTestId('assistant-answer')).toHaveCount(2);
  const second = requests[1]!.postDataJSON() as {
    messages: Array<{ role: string; content: string }>;
  };
  expect(second.messages.at(-1)).toEqual({
    role: 'user',
    content: 'Can you explain that more simply?',
  });
  // Only the latest answer keeps its quick replies.
  await expect(
    panel(page).getByRole('group', { name: 'Quick replies' }),
  ).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('the tabs work from the keyboard', async ({ page }) => {
  await mockChat(page, () => OK);
  await page.goto('/');
  await skipIntro(page);
  await openPanel(page);

  const chat = panel(page).getByRole('tab', { name: 'Chat' });
  const resources = panel(page).getByRole('tab', { name: 'Resources' });
  await expect(chat).toHaveAttribute('aria-selected', 'true');
  await chat.focus();
  await page.keyboard.press('ArrowRight');
  await expect(resources).toHaveAttribute('aria-selected', 'true');
  await expect(resources).toBeFocused();
  const tabpanel = panel(page).getByRole('tabpanel', { name: 'Resources' });
  await expect(tabpanel.getByRole('link', { name: /Moon Trek/ })).toBeVisible();
  await expect(tabpanel).toContainText('trek.nasa.gov');

  await page.keyboard.press('Home');
  await expect(chat).toHaveAttribute('aria-selected', 'true');
  await expect(chat).toBeFocused();
  await page.keyboard.press('End');
  await expect(resources).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(chat).toHaveAttribute('aria-selected', 'true');
});

test('slash commands jump to a section and start a new chat', async ({
  page,
}) => {
  await mockChat(page, () => OK);
  await page.goto('/');
  await skipIntro(page);
  await openPanel(page);

  // A lone "/" lists every shortcut; the arrow keys move the highlight; Escape closes the menu only.
  await input(page).fill('/');
  const menu = panel(page).getByRole('listbox', { name: 'Shortcuts' });
  await expect(menu.getByRole('option')).toHaveCount(6);
  await expect(menu.getByRole('option', { name: /\/planner/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await input(page).press('ArrowDown');
  await expect(menu.getByRole('option', { name: /\/landing/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await input(page).press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(panel(page)).toBeVisible();

  await input(page).fill('/pla');
  await expect(menu.getByRole('option')).toHaveCount(1);
  await input(page).press('Enter');
  await expect(input(page)).toHaveValue('');
  await waitForScrollToSettle(page);
  await expect(page.locator('#navigator')).toBeInViewport();

  await input(page).fill('What does Earthrise mean?');
  await input(page).press('Enter');
  await expect(panel(page).getByTestId('assistant-answer')).toBeVisible();

  await input(page).fill('/new');
  await input(page).press('Enter');
  await expect(panel(page).getByTestId('assistant-answer')).toHaveCount(0);
  await expect(panel(page).getByTestId('assistant-question')).toHaveCount(0);
  await expect(
    panel(page).getByRole('list', { name: 'Suggested questions' }),
  ).toBeVisible();
});

test('503 shows NO LINK and NOT SENT, and Retry sends the question again', async ({
  page,
}) => {
  let reply: Reply = {
    status: 503,
    json: {
      error: { code: 'assistant_unavailable', message: 'No model key set.' },
    },
  };
  const requests = await mockChat(page, () => reply);
  await page.goto('/');
  await skipIntro(page);
  await ask(page, 'What does Earthrise mean?');

  await expect(panel(page).getByRole('alert')).toHaveText(
    'The assistant is not available right now. The rest of Moon Maps still works.',
  );
  await expect(panel(page).getByTestId('assistant-link')).toHaveText('NO LINK');
  const question = panel(page).getByTestId('assistant-question');
  await expect(question.getByText('NOT SENT')).toBeVisible();
  await expect(question).toContainText('What does Earthrise mean?');
  // No automatic retry for 503.
  await page.waitForTimeout(1500);
  expect(requests).toHaveLength(1);

  reply = OK;
  await question.getByRole('button', { name: 'Retry' }).click();
  await expect(panel(page).getByTestId('assistant-answer')).toBeVisible();
  await expect(panel(page).getByTestId('assistant-link')).toHaveText('LINK OK');
  await expect(panel(page).getByText('NOT SENT')).toHaveCount(0);
  await expect(panel(page).getByRole('alert')).toHaveCount(0);
});

test('a lost signal counts down to an automatic retry', async ({ page }) => {
  let calls = 0;
  await mockChat(page, () => (calls++ === 0 ? 'abort' : OK));
  await page.goto('/');
  await skipIntro(page);
  await ask(page, 'How do I pick a landing spot?');

  await expect(panel(page).getByRole('status').first()).toContainText(
    'Signal lost, retrying in 1 s',
  );
  await expect(panel(page).getByTestId('assistant-answer')).toBeVisible();
  await expect(panel(page).getByTestId('assistant-link')).toHaveText('LINK OK');
});

test('429 shows the wait and puts the question back in the input', async ({
  page,
}) => {
  await mockChat(page, () => ({
    status: 429,
    json: {
      error: {
        code: 'rate_limited',
        message: 'Too many questions in a short time. Please wait 12 seconds.',
      },
    },
  }));
  await page.goto('/');
  await skipIntro(page);
  await ask(page, 'How do I pick a landing spot?');

  await expect(panel(page).getByRole('alert')).toContainText(
    'Please wait 12 seconds',
  );
  await expect(input(page)).toHaveValue('How do I pick a landing spot?');
  await expect(panel(page).getByTestId('assistant-question')).toHaveCount(0);
});

test('Escape closes the panel and returns focus; an answer that arrives meanwhile lights the unread dot', async ({
  page,
}) => {
  await mockChat(page, () => ({ ...OK, delayMs: 1500 }));
  await page.goto('/');
  await skipIntro(page);
  await ask(page, 'Is this spot good right now?');
  await expect(panel(page).getByText('Working on it')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(panel(page)).toBeHidden();
  await expect(launcher(page)).toBeFocused();

  const light = page.getByTestId('assistant-light');
  await expect(light).toHaveText('1');
  await expect(launcher(page)).toHaveAccessibleName(
    'Ask the Moon Maps assistant, 1 new answer',
  );

  await launcher(page).click();
  await expect(panel(page).getByTestId('assistant-answer')).toBeVisible();
  await expect(light).toHaveText('');
});

test('scrolling over the panel never scrolls the page behind it', async ({
  page,
}) => {
  const long = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}.`).join(
    '\n',
  );
  await mockChat(page, () => ({
    status: 200,
    json: { ...ANSWER, reply: long, app_link: null },
  }));
  await page.goto('/');
  await skipIntro(page);
  await ask(page, 'A long answer, please');
  await expect(page.getByText('Line 30.')).toBeVisible();
  // Let the opening animation finish, so the whole panel is under the pointer.
  await page.waitForTimeout(1000);

  const panel = page.getByRole('dialog', { name: 'Moon Maps assistant' });
  const box = (await panel.boundingBox())!;
  const pageY = () => page.evaluate(() => window.scrollY);
  const start = await pageY();
  // Over the header and over the input: nothing there scrolls, and the page must not either.
  for (const y of [box.y + 30, box.y + box.height - 30]) {
    await page.mouse.move(box.x + 120, y);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(300);
    expect(await pageY()).toBe(start);
  }
  // Over the conversation: the conversation scrolls, the page does not.
  const log = panel.getByRole('log');
  const logBox = (await log.boundingBox())!;
  await page.mouse.move(logBox.x + 120, logBox.y + logBox.height / 2);
  const before = await log.evaluate((el) => el.scrollTop);
  await page.mouse.wheel(0, -400);
  // Wheel scrolling is animated; slower machines need longer than a fixed pause.
  await expect
    .poll(() => log.evaluate((el) => el.scrollTop), { timeout: 5000 })
    .toBeLessThan(before);
  expect(await pageY()).toBe(start);
});
