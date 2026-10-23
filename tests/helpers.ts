import { expect, test as base } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export const storageKey = 'rcyw.curiosity-desktop.v1';

export const test = base.extend<{ runtimeErrors: void }>({
  runtimeErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await use();
      expect(
        errors,
        'The application must not throw unhandled browser errors.',
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const mainWindow = (page: Page) =>
  page.getByRole('region', { name: 'Main window', exact: true });

export const questionsNote = (page: Page) =>
  page.getByRole('complementary', { name: 'Questions note', exact: true });

export const dock = (page: Page) =>
  page.getByRole('navigation', { name: 'Desktop applications', exact: true });

export const topicButton = (page: Page, name: string) =>
  page
    .getByRole('group', { name: 'Curiosity drawers', exact: true })
    .getByRole('button', { name, exact: true });

export async function activate(control: Locator, touch: boolean) {
  if (touch) await control.tap();
  else await control.click();
}

export async function expectWithinWidth(control: Locator, width: number) {
  await control.scrollIntoViewIfNeeded();
  await expect(control).toBeInViewport();
  const rect = await control.boundingBox();
  expect(rect).not.toBeNull();
  expect(rect!.x).toBeGreaterThanOrEqual(-1);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 1);
}

export async function boot(page: Page) {
  await page.goto('/#desktop');
  await expect(dock(page)).toBeVisible();
  await expect(mainWindow(page)).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

export async function openView(
  page: Page,
  name: 'About' | 'Interests' | 'Terminal',
  touch: boolean,
) {
  await activate(dock(page).getByRole('button', { name, exact: true }), touch);
}

export async function command(
  page: Page,
  value: string,
  submit: 'enter' | 'button' = 'enter',
  touch = false,
) {
  const input = page.getByRole('textbox', {
    name: 'Terminal command',
    exact: true,
  });
  await input.fill(value);
  if (submit === 'button')
    await activate(
      page.getByRole('button', { name: 'Run command', exact: true }),
      touch,
    );
  else await input.press('Enter');
}
