import AxeBuilder from '@axe-core/playwright';
import {
  activate,
  boot,
  command,
  expect,
  mainWindow,
  openView,
  test,
  topicButton,
} from './helpers';

test('overflowing Terminal output remains reachable and scrollable with the keyboard', async ({
  page,
  isMobile,
}) => {
  await boot(page);
  await openView(page, 'Terminal', isMobile);
  const input = page.getByRole('textbox', {
    name: 'Terminal command',
    exact: true,
  });
  const output = page.getByRole('log', {
    name: 'Terminal output',
    exact: true,
  });
  await expect(input).toBeFocused();
  for (let index = 0; index < 20; index += 1) await command(page, 'help');
  await expect
    .poll(() =>
      output.evaluate((element) => element.scrollHeight - element.clientHeight),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(() => output.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0);

  await input.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(output).toBeFocused();
  const bottom = await output.evaluate((element) => element.scrollTop);
  await page.keyboard.press('PageUp');
  await expect
    .poll(() => output.evaluate((element) => element.scrollTop))
    .toBeLessThan(bottom);
  await expect(output).toContainText('whoami');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations,
    'Long terminal output must remain keyboard accessible.',
  ).toEqual([]);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    )
    .toBeLessThanOrEqual(1);
});

test('the skip link restores the current view after its window is minimized or folded', async ({
  page,
  isMobile,
}) => {
  await boot(page);
  await openView(page, 'Interests', isMobile);
  await activate(topicButton(page, 'Agent Sandbox'), isMobile);
  await activate(
    mainWindow(page).getByRole('button', {
      name: 'Minimize window',
      exact: true,
    }),
    isMobile,
  );
  await expect(mainWindow(page)).toBeHidden();
  const skip = page.getByRole('link', {
    name: 'Skip to the open window',
    exact: true,
  });
  await skip.focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('region', { name: 'Selected topic', exact: true }),
  ).toBeVisible();
  await expect(topicButton(page, 'Agent Sandbox')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect
    .poll(() =>
      mainWindow(page).evaluate(
        (element) =>
          element === document.activeElement ||
          element.contains(document.activeElement),
      ),
    )
    .toBe(true);

  await openView(page, 'Terminal', isMobile);
  await activate(
    mainWindow(page).getByRole('button', { name: 'Fold window', exact: true }),
    isMobile,
  );
  const input = page.getByRole('textbox', {
    name: 'Terminal command',
    exact: true,
  });
  await expect(input).toBeHidden();
  await skip.focus();
  await page.keyboard.press('Enter');
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
});
