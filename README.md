# Wayne's desk

A small desk. A lot of questions. A NeXTSTEP-inspired personal corner for **AI / Agent**, **Agent Sandbox**, and **AI Infra**.

[Explore the workbench](https://rcyw.github.io/)

The front door is a NeXTSTEP-inspired research desk after hours: a bright CRT, charcoal hardware, and a warm pool of lamplight. Look around, switch the lamp, and pick a numbered object: the display opens the desktop, while three small machines lead to AI / Agent, Agent Sandbox, and AI Infra. Physical nameplates match the compact navigation below; hovering an object reveals a quiet hint. The desktop has interest drawers, open questions, and a playful Terminal. Returning to the workbench preserves the current desktop and unfinished Terminal input.

[Enter the desktop directly](https://rcyw.github.io/#desktop). The direct link skips the 3D renderer. A static illustration keeps all content accessible when WebGL is unavailable; reduced-motion preferences skip the camera transition. The desktop and each interest also have keyboard-accessible buttons.

This is a static React, TypeScript, and Three.js site. Terminal commands run entirely in the browser. There is no backend, analytics, or account system. Desk preferences stay in this browser's local storage.

## Local development

Use Node.js 24.16.0 and pnpm 12.11.2 (versions are recorded in this repository).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Edit `src/content.ts` for the desktop introduction, interests, and questions. `src/Workstation.tsx` connects the workbench and desktop; `src/workbench.css` styles the entry page. The original 3D models and renderer live in `src/scene/`. The desktop interaction lives in `src/App.tsx`; its appearance lives in `src/styles.css`.

`/#workbench` and `/#desktop` support direct visits, refresh, and browser history on GitHub Pages. The renderer loads separately when entering the workbench, caps pixel density, pauses on hidden tabs, and releases its resources when entering the desktop. Models, material textures, and the fallback illustration are generated from code; no remote model or texture service is needed.

The camera frames the working surface independently on narrow screens. HTML markers follow projected 3D anchor points and appear individually on keyboard focus. They do not intercept pointer input; mouse and touch visitors select the actual objects. The plain navigation remains available in the static fallback. Anchor positions and material details live in `src/scene/models.ts`, camera framing in `src/scene/workbenchScene.ts`, and the surrounding layout in `src/workbench.css`.

## Verification

```sh
pnpm check
pnpm build
pnpm exec playwright install --with-deps
pnpm test:e2e
```

Browser tests run against the production build in Chromium, Firefox, WebKit, and a touch viewport. They cover the workbench and desktop journey, keyboard focus, retained state, mobile layouts, reduced motion, and the WebGL fallback. Each run chooses an available loopback port; set `E2E_PORT` to choose one explicitly. Reports and failure artifacts remain in ignored `playwright-report/` and `test-results/` directories.

Use `pnpm format` after editing. To preview the build manually, run `pnpm preview`.

## Publication

Push to `main` to run `.github/workflows/pages.yml`. It installs the locked dependencies, checks types and formatting, builds the site, and runs the Chromium interaction tests before publishing `dist/` to GitHub Pages. The full browser matrix can be run locally with the commands above.

GitHub Pages uses the **GitHub Actions** build source. The root URL is `https://rcyw.github.io/`, so Vite uses `/` as its base. The profile README is maintained separately in [rcyw/rcyw](https://github.com/rcyw/rcyw).

DM Sans and IBM Plex Mono are served with the site. Their SIL Open Font License notices and Three.js's MIT license are in `public/licenses/`.

This is a personal site inspired by NeXTSTEP's visual language, with original interface assets. It is not affiliated with NeXT or Apple.

The idea of exploring a personal site through objects in a room was inspired by [Felix Rieseberg’s website](https://felixrieseberg.com/). This workbench uses its own models, visual design, and interest-focused content.
