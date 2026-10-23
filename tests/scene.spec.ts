import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import {
  activate,
  command,
  dock,
  expect,
  expectWithinWidth,
  mainWindow,
  openView,
  test,
  topicButton,
} from './helpers';

const workbench = (page: Page) =>
  page.getByRole('main', { name: 'Workbench', exact: true });
const enterDesktop = (page: Page) =>
  workbench(page).getByRole('button', {
    name: 'Enter desktop',
    exact: true,
  });
const backToWorkbench = (page: Page) =>
  page.getByRole('button', { name: 'Back to workbench', exact: true });
const interests = (page: Page) =>
  workbench(page).getByRole('navigation', {
    name: 'Explore interests',
    exact: true,
  });
const interactiveObjects = (page: Page) =>
  workbench(page).getByRole('group', {
    name: 'Interactive desk objects',
    exact: true,
  });
const sceneObjects = [
  {
    target: 'desktop',
    label: 'Enter desktop from the monitor',
    topic: null,
  },
  {
    target: 'agents',
    label: 'Explore AI / Agent object',
    topic: 'AI / Agent',
  },
  {
    target: 'sandbox',
    label: 'Explore Agent Sandbox object',
    topic: 'Agent Sandbox',
  },
  {
    target: 'infra',
    label: 'Explore AI Infra object',
    topic: 'AI Infra',
  },
] as const;
const projectedObject = (page: Page, label: string) =>
  interactiveObjects(page).getByRole('button', { name: label, exact: true });

async function expectWorkbench(page: Page) {
  await expect(workbench(page)).toBeVisible();
  await expect(enterDesktop(page)).toBeEnabled();
  await expect(dock(page)).toBeHidden();
}

async function expectSceneSettled(page: Page) {
  await expect(workbench(page)).toHaveAttribute(
    'data-scene-status',
    /^(ready|fallback)$/,
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function expectDesktop(page: Page) {
  await expect(page).toHaveURL(/\/#desktop$/);
  await expect(dock(page)).toBeVisible();
  await expect(mainWindow(page)).toBeVisible();
  await expect(workbench(page)).toBeHidden();
  await expect(backToWorkbench(page)).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    )
    .toBeLessThanOrEqual(1);
}

async function expectFocusInside(control: Locator) {
  await expect
    .poll(() =>
      control.evaluate(
        (element) =>
          element === document.activeElement ||
          element.contains(document.activeElement),
      ),
    )
    .toBe(true);
}

async function expectQuietMarkers(page: Page) {
  for (const object of sceneObjects) {
    const marker = projectedObject(page, object.label);
    await expect(marker).toHaveCSS('opacity', '0');
    await expect(marker).toHaveCSS('pointer-events', 'none');
  }
}

async function focusWithKeyboard(page: Page, control: Locator) {
  await expect(control).toBeVisible();
  for (let attempt = 0; attempt < 16; attempt += 1) {
    await page.keyboard.press('Tab');
    if (await control.evaluate((element) => element === document.activeElement))
      return;
  }
  await expect(control).toBeFocused();
}

async function expectAccessible(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations,
    `${context}: ${JSON.stringify(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })))}`,
  ).toEqual([]);
}

test('the workbench enters and returns to the same desktop with Terminal history and draft intact', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await expectWorkbench(page);
  await expectSceneSettled(page);
  const lamp = workbench(page).getByRole('button', {
    name: 'Toggle desk lamp',
    exact: true,
  });
  const reset = workbench(page).getByRole('button', {
    name: 'Reset view',
    exact: true,
  });
  if ((await workbench(page).getAttribute('data-scene-status')) === 'ready') {
    await expect(lamp).toHaveAttribute('aria-pressed', /^(true|false)$/);
    const initiallyLit = await lamp.getAttribute('aria-pressed');
    await activate(lamp, isMobile);
    await expect(lamp).toHaveAttribute(
      'aria-pressed',
      initiallyLit === 'true' ? 'false' : 'true',
    );
    await activate(reset, isMobile);
  } else {
    await expect(lamp).toBeDisabled();
    await expect(reset).toBeDisabled();
  }
  await activate(enterDesktop(page), isMobile);
  await expectDesktop(page);
  await openView(page, 'Terminal', isMobile);
  await command(page, 'whoami');
  const output = page.getByRole('log', {
    name: 'Terminal output',
    exact: true,
  });
  await expect(output).toContainText(/Wayne.*rcyw|rcyw.*Wayne/s);
  const history = await output.innerText();
  const input = page.getByRole('textbox', {
    name: 'Terminal command',
    exact: true,
  });
  await input.fill('open interests');
  await activate(backToWorkbench(page), isMobile);
  await expectWorkbench(page);
  await expect(page).toHaveURL(/\/#workbench$/);
  await activate(enterDesktop(page), isMobile);
  await expectDesktop(page);
  await expect(input).toHaveValue('open interests');
  await expect(output).toHaveText(history, { useInnerText: true });
  await input.press('Enter');
  await expect(
    dock(page).getByRole('button', { name: 'Interests', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('each workbench interest opens its corresponding curiosity drawer', async ({
  page,
  isMobile,
}) => {
  await page.goto('/#workbench');
  const contents = new Set<string>();
  for (const name of ['AI / Agent', 'Agent Sandbox', 'AI Infra']) {
    await expectWorkbench(page);
    await activate(
      interests(page).getByRole('button', { name, exact: true }),
      isMobile,
    );
    await expectDesktop(page);
    await expect(topicButton(page, name)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const topic = page.getByRole('region', {
      name: 'Selected topic',
      exact: true,
    });
    await expect(topic).toBeVisible();
    contents.add((await topic.innerText()).trim());
    await activate(backToWorkbench(page), isMobile);
  }
  expect(contents.size, 'Each scene interest must open distinct content.').toBe(
    3,
  );
});

test('object markers stay quiet for pointers and reveal only the keyboard-focused object', async ({
  page,
}, info) => {
  await page.goto('/#workbench');
  await expectWorkbench(page);
  await expectSceneSettled(page);
  const status = await workbench(page).getAttribute('data-scene-status');
  info.annotations.push({ type: 'scene-status', description: status! });
  if (status === 'fallback') {
    await expect(interactiveObjects(page)).toBeHidden();
    return;
  }
  for (const object of sceneObjects) {
    await expectSceneSettled(page);
    await expectQuietMarkers(page);
    const marker = projectedObject(page, object.label);
    await expect(marker).toHaveAttribute('data-scene-target', object.target);
    await focusWithKeyboard(page, marker);
    await expect(marker).toHaveCSS('opacity', '1');
    await expectWithinWidth(marker, page.viewportSize()!.width);
    for (const other of sceneObjects.filter(
      (candidate) => candidate.target !== object.target,
    ))
      await expect(projectedObject(page, other.label)).toHaveCSS(
        'opacity',
        '0',
      );
    if (object.topic)
      await expect(
        interests(page).getByRole('button', {
          name: object.topic,
          exact: true,
        }),
      ).toHaveAttribute('data-active', 'true');
    await marker.press('Enter');
    await expectDesktop(page);
    if (object.topic)
      await expect(topicButton(page, object.topic)).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    else
      await expect(
        dock(page).getByRole('button', { name: 'About', exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
    await backToWorkbench(page).focus();
    await backToWorkbench(page).press('Enter');
    await expectWorkbench(page);
  }
  await expectSceneSettled(page);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const marker = projectedObject(page, sceneObjects[0].label);
    await focusWithKeyboard(page, marker);
    await expect(marker).toHaveCSS('opacity', '1');
    await expectWithinWidth(marker, width);
    await enterDesktop(page).focus();
    await expectQuietMarkers(page);
  }
});

test('hash navigation survives refresh and browser Back and Forward', async ({
  page,
  isMobile,
}) => {
  await page.goto('/#workbench');
  await expectWorkbench(page);
  await page.reload();
  await expectWorkbench(page);
  await activate(enterDesktop(page), isMobile);
  await expectDesktop(page);
  await openView(page, 'Interests', isMobile);
  await activate(topicButton(page, 'AI Infra'), isMobile);
  await page.reload();
  await expectDesktop(page);
  await expect(topicButton(page, 'AI Infra')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await activate(backToWorkbench(page), isMobile);
  await expectWorkbench(page);
  await page.goBack();
  await expectDesktop(page);
  await expect(topicButton(page, 'AI Infra')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goForward();
  await expectWorkbench(page);
  await expect(page).toHaveURL(/\/#workbench$/);

  await activate(
    interests(page).getByRole('button', { name: 'Agent Sandbox', exact: true }),
    isMobile,
  );
  await expectDesktop(page);
  await expectFocusInside(mainWindow(page));
  await page.goBack();
  await expectWorkbench(page);
  await expectFocusInside(workbench(page));
  await page.goForward();
  await expectDesktop(page);
  await expect(topicButton(page, 'Agent Sandbox')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expectFocusInside(mainWindow(page));
});

test('keyboard entry and return move focus into the visible experience', async ({
  page,
}) => {
  await page.goto('/');
  await expectWorkbench(page);
  await enterDesktop(page).focus();
  await page.keyboard.press('Enter');
  await expectDesktop(page);
  await expectFocusInside(mainWindow(page));
  await backToWorkbench(page).focus();
  await page.keyboard.press('Enter');
  await expectWorkbench(page);
  await expectFocusInside(workbench(page));
  await page.keyboard.press('Tab');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.activeElement !== document.body &&
          !document.activeElement?.closest('[hidden], [inert]'),
      ),
    )
    .toBe(true);
});

test('returning to the workbench cancels a pending entry and allows entering again', async ({
  page,
  isMobile,
}, info) => {
  await page.clock.install();
  await page.goto('/');
  await expectWorkbench(page);
  await expectSceneSettled(page);
  const status = await workbench(page).getAttribute('data-scene-status');
  info.annotations.push({ type: 'scene-status', description: status! });
  if (status === 'ready') {
    const brand = await workbench(page)
      .getByRole('link', { name: "Wayne's workbench", exact: true })
      .elementHandle();
    expect(brand).not.toBeNull();
    await enterDesktop(page).evaluate((button, brand) => {
      (button as HTMLButtonElement).click();
      (brand as HTMLAnchorElement).click();
    }, brand);
    // Advance beyond both the camera transition and its safety timer. A canceled
    // callback must not change the visitor's destination later.
    await page.clock.runFor(2_000);
    await expectWorkbench(page);
    await expect(page).toHaveURL(/\/#workbench$/);
    await activate(enterDesktop(page), isMobile);
    await expectDesktop(page);
  } else {
    await activate(enterDesktop(page), isMobile);
    await expectDesktop(page);
    await activate(backToWorkbench(page), isMobile);
    await expectWorkbench(page);
    await activate(enterDesktop(page), isMobile);
    await expectDesktop(page);
  }
});

test('320px and 390px workbench layouts keep controls reachable and allow touch entry and return', async ({
  page,
  isMobile,
}, info) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/#workbench');
    await expectWorkbench(page);
    await expectSceneSettled(page);
    await expectNoHorizontalOverflow(page);
    for (const control of await workbench(page).getByRole('button').all()) {
      if (await control.getAttribute('data-scene-target')) continue;
      await expectWithinWidth(control, width);
    }
    const path = info.outputPath(`workbench-${width}.png`);
    await page.screenshot({ path, fullPage: true, animations: 'disabled' });
    await info.attach(`workbench-${width}`, { path, contentType: 'image/png' });
    await activate(enterDesktop(page), isMobile);
    await expectDesktop(page);
    await expectWithinWidth(backToWorkbench(page), width);
    await expectNoHorizontalOverflow(page);
    await activate(backToWorkbench(page), isMobile);
    await expectWorkbench(page);
  }
});

test('unavailable WebGL provides an accessible fallback that still enters and returns from the desktop', async ({
  page,
  isMobile,
}, info) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      writable: true,
      value: function (
        this: HTMLCanvasElement,
        contextId: string,
        ...options: unknown[]
      ) {
        if (['webgl', 'webgl2', 'experimental-webgl'].includes(contextId))
          return null;
        return Reflect.apply(getContext, this, [contextId, ...options]);
      },
    });
  });
  await page.goto('/');
  await expectWorkbench(page);
  await expect(workbench(page)).toHaveAttribute(
    'data-scene-status',
    'fallback',
  );
  await expect(interactiveObjects(page)).toBeHidden();
  for (const name of ['Toggle desk lamp', 'Reset view'])
    await expect(
      workbench(page).getByRole('button', { name, exact: true }),
    ).toBeDisabled();
  await expectAccessible(page, 'The WebGL fallback');
  const path = info.outputPath('workbench-webgl-fallback.png');
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await info.attach('workbench-webgl-fallback', {
    path,
    contentType: 'image/png',
  });
  for (const name of ['AI / Agent', 'Agent Sandbox', 'AI Infra']) {
    await activate(
      interests(page).getByRole('button', { name, exact: true }),
      isMobile,
    );
    await expectDesktop(page);
    await expect(topicButton(page, name)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await activate(backToWorkbench(page), isMobile);
    await expectWorkbench(page);
  }
  await activate(enterDesktop(page), isMobile);
  await expectDesktop(page);
  await activate(backToWorkbench(page), isMobile);
  await expectWorkbench(page);
  await expect(workbench(page)).toHaveAttribute(
    'data-scene-status',
    'fallback',
  );
});

test('reduced-motion visitors can explore, enter and return without a blocked transition', async ({
  page,
  isMobile,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expectWorkbench(page);
  await expectSceneSettled(page);
  expect(
    await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    ),
  ).toBe(true);
  await activate(
    interests(page).getByRole('button', { name: 'Agent Sandbox', exact: true }),
    isMobile,
  );
  await expectDesktop(page);
  await expect(topicButton(page, 'Agent Sandbox')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await activate(backToWorkbench(page), isMobile);
  await expectWorkbench(page);
  await expectSceneSettled(page);
  const path = info.outputPath('workbench-reduced-motion.png');
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await info.attach('workbench-reduced-motion', {
    path,
    contentType: 'image/png',
  });
});

test('the workbench has no automatic WCAG A or AA violations', async ({
  page,
}) => {
  await page.goto('/');
  await expectWorkbench(page);
  await expectSceneSettled(page);
  await expectAccessible(page, 'The workbench');
});
