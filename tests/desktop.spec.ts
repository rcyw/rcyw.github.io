import AxeBuilder from '@axe-core/playwright';
import {
  activate,
  boot,
  command,
  dock,
  expect,
  expectWithinWidth,
  mainWindow,
  openView,
  questionsNote,
  storageKey,
  test,
  topicButton,
} from './helpers';

test('About opens the curiosity drawer and each interest has distinct content', async ({
  page,
  isMobile,
}) => {
  await boot(page);
  await expect(
    dock(page).getByRole('button', { name: 'About', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await activate(
    page.getByRole('button', { name: /Open the curiosity drawer/ }),
    isMobile,
  );
  const topic = page.getByRole('region', {
    name: 'Selected topic',
    exact: true,
  });
  const names = ['AI / Agent', 'Agent Sandbox', 'AI Infra'];
  const contents = new Set<string>();
  for (const name of names) {
    await activate(topicButton(page, name), isMobile);
    await expect(topicButton(page, name)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    for (const other of names.filter((candidate) => candidate !== name)) {
      await expect(topicButton(page, other)).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    }
    await expect(topic).toBeVisible();
    await expect(topic.getByRole('heading')).not.toHaveText('');
    contents.add((await topic.innerText()).trim());
  }
  expect(
    contents.size,
    'Each curiosity drawer must present its own subject.',
  ).toBe(3);
  await openView(page, 'About', isMobile);
  await expect(
    page.getByRole('button', { name: /Open the curiosity drawer/ }),
  ).toBeVisible();
});

test('questions rotate and reopening Notes preserves the current question', async ({
  page,
  isMobile,
}) => {
  await boot(page);
  const note = questionsNote(page);
  const question = note.getByTestId('current-question');
  const first = await question.innerText();
  await activate(
    note.getByRole('button', { name: /Another question/ }),
    isMobile,
  );
  await expect(question).not.toHaveText(first);
  const next = await question.innerText();
  await activate(
    note.getByRole('button', { name: 'Close questions note', exact: true }),
    isMobile,
  );
  await expect(note).toBeHidden();
  const notesButton = dock(page).getByRole('button', {
    name: 'Notes',
    exact: true,
  });
  await expect(notesButton).toHaveAttribute('aria-pressed', 'false');
  await activate(notesButton, isMobile);
  await expect(note).toBeVisible();
  await expect(question).toHaveText(next);
  await activate(
    note.getByRole('button', { name: /Another question/ }),
    isMobile,
  );
  await expect(question).not.toHaveText(next);
});

test('the Dock restores folded and minimized main windows without losing the selected topic', async ({
  page,
  isMobile,
}) => {
  await boot(page);
  await openView(page, 'Interests', isMobile);
  const selected = topicButton(page, 'Agent Sandbox');
  const content = page.getByRole('region', {
    name: 'Selected topic',
    exact: true,
  });
  await activate(selected, isMobile);
  await activate(
    mainWindow(page).getByRole('button', { name: 'Fold window', exact: true }),
    isMobile,
  );
  await expect(content).toBeHidden();
  await expect(
    mainWindow(page).getByRole('button', {
      name: 'Expand window',
      exact: true,
    }),
  ).toHaveAttribute('aria-expanded', 'false');
  await openView(page, 'Interests', isMobile);
  await expect(content).toBeVisible();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await activate(
    mainWindow(page).getByRole('button', {
      name: 'Minimize window',
      exact: true,
    }),
    isMobile,
  );
  await expect(mainWindow(page)).toBeHidden();
  await openView(page, 'Interests', isMobile);
  await expect(content).toBeVisible();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
});

test('Terminal runs its documented commands, reports unknown commands, and opens Interests', async ({
  page,
  isMobile,
}) => {
  await boot(page);
  await openView(page, 'Terminal', isMobile);
  const output = page.getByRole('log', {
    name: 'Terminal output',
    exact: true,
  });
  await command(page, 'help');
  await expect(output).toContainText('whoami');
  await expect(output).toContainText('clear');
  await expect(output).toContainText('open');
  await command(page, 'whoami', 'button', isMobile);
  await expect(output).toContainText(/Wayne.*rcyw|rcyw.*Wayne/s);
  await command(page, 'not-a-desktop-command');
  await expect(output).toContainText(/No entry for/i);
  await expect(output).toContainText(/Type help/i);
  await command(page, 'clear');
  await expect(output).toBeEmpty();
  await command(page, 'open');
  await expect(
    page.getByRole('region', { name: 'Selected topic', exact: true }),
  ).toBeVisible();
  await expect(
    dock(page).getByRole('button', { name: 'Interests', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await openView(page, 'Terminal', isMobile);
  await command(page, 'open interests');
  await expect(
    page.getByRole('region', { name: 'Selected topic', exact: true }),
  ).toBeVisible();
});

test('reloading restores the open view, selected topic, folded state and hidden question', async ({
  page,
  isMobile,
}) => {
  await boot(page);
  const note = questionsNote(page);
  await activate(
    note.getByRole('button', { name: /Another question/ }),
    isMobile,
  );
  const question = await note.getByTestId('current-question').innerText();
  await activate(
    note.getByRole('button', { name: 'Close questions note', exact: true }),
    isMobile,
  );
  await openView(page, 'Interests', isMobile);
  await activate(topicButton(page, 'AI Infra'), isMobile);
  await activate(
    mainWindow(page).getByRole('button', { name: 'Fold window', exact: true }),
    isMobile,
  );
  await expect
    .poll(() =>
      page.evaluate((key) => {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
      }, storageKey),
    )
    .toMatchObject({
      version: 1,
      view: 'interests',
      topic: 'infra',
      noteVisible: false,
      folded: true,
    });
  await page.reload();
  await expect(dock(page)).toBeVisible();
  await expect(
    dock(page).getByRole('button', { name: 'Interests', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    mainWindow(page).getByRole('button', {
      name: 'Expand window',
      exact: true,
    }),
  ).toBeVisible();
  await expect(note).toBeHidden();
  await openView(page, 'Interests', isMobile);
  await expect(topicButton(page, 'AI Infra')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await activate(
    dock(page).getByRole('button', { name: 'Notes', exact: true }),
    isMobile,
  );
  await expect(note.getByTestId('current-question')).toHaveText(question);
});

for (const entry of [
  { name: 'malformed JSON', value: '{not json' },
  {
    name: 'invalid field values',
    value: JSON.stringify({
      version: 1,
      view: 'missing',
      topic: ['infra'],
      noteIndex: 'zero',
      noteVisible: 'false',
      folded: {},
      minimized: [],
    }),
  },
  {
    name: 'an unsupported version',
    value: JSON.stringify({
      version: 999,
      view: 'terminal',
      topic: 'infra',
      minimized: true,
    }),
  },
]) {
  test(`the desktop recovers from ${entry.name} in saved state`, async ({
    page,
    isMobile,
  }) => {
    await page.addInitScript(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: storageKey, value: entry.value },
    );
    await boot(page);
    await expect(
      page.getByRole('button', { name: /Open the curiosity drawer/ }),
    ).toBeVisible();
    await expect(
      questionsNote(page).getByTestId('current-question'),
    ).not.toHaveText('');
    await openView(page, 'Interests', isMobile);
    await activate(topicButton(page, 'Agent Sandbox'), isMobile);
    await expect(topicButton(page, 'Agent Sandbox')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
}

test('320px and 390px dark layouts keep the desktop controls reachable without horizontal overflow', async ({
  page,
  isMobile,
}, info) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await boot(page);
  await expect
    .poll(() =>
      page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches),
    )
    .toBe(true);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await openView(page, 'Interests', isMobile);
    await activate(topicButton(page, 'AI Infra'), isMobile);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      )
      .toBeLessThanOrEqual(1);
    for (const name of ['AI / Agent', 'Agent Sandbox', 'AI Infra'])
      await expectWithinWidth(topicButton(page, name), width);
    for (const control of await dock(page).getByRole('button').all())
      await expectWithinWidth(control, width);
    await openView(page, 'Terminal', isMobile);
    await command(page, 'help');
    await expectWithinWidth(
      page.getByRole('textbox', { name: 'Terminal command', exact: true }),
      width,
    );
    await expectWithinWidth(
      page.getByRole('button', { name: 'Run command', exact: true }),
      width,
    );
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
      )
      .toBeLessThanOrEqual(1);
    const path = info.outputPath(`desktop-dark-${width}.png`);
    await page.screenshot({ path, fullPage: true, animations: 'disabled' });
    await info.attach(`desktop-dark-${width}`, {
      path,
      contentType: 'image/png',
    });
  }
});

test('About, Interests and Terminal have no automatic WCAG A or AA violations', async ({
  page,
  isMobile,
}) => {
  await boot(page);
  for (const name of ['About', 'Interests', 'Terminal'] as const) {
    await openView(page, name, isMobile);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations,
      `${name}: ${JSON.stringify(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })))}`,
    ).toEqual([]);
  }
});
