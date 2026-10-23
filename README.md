# Wayne's desk

A small desk. A lot of questions. A NeXTSTEP-inspired personal corner for **AI / Agent**, **Agent Sandbox**, and **AI Infra**.

[Open the desktop](https://rcyw.github.io/)

The desktop is a static React and TypeScript site. Explore the interest drawers, rotate an open question, or try `help` in the playful Terminal. Terminal commands run entirely in the browser. There is no backend, analytics, or account system. Desk preferences stay in this browser's local storage.

## Local development

Use Node.js 24.16.0 and pnpm 12.11.2 (versions are recorded in this repository).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Edit `src/content.ts` for the introduction, interests, and questions. The desktop interaction lives in `src/App.tsx`; its appearance lives in `src/styles.css`.

## Verification

```sh
pnpm check
pnpm build
pnpm exec playwright install --with-deps
pnpm test:e2e
```

Browser tests run against the production build in Chromium, Firefox, WebKit, and a touch viewport. Each run chooses an available loopback port; set `E2E_PORT` to choose one explicitly. Reports and failure artifacts remain in ignored `playwright-report/` and `test-results/` directories.

Use `pnpm format` after editing. To preview the build manually, run `pnpm preview`.

## Publication

Push to `main` to run `.github/workflows/pages.yml`. It installs the locked dependencies, checks types and formatting, builds the site, and runs the Chromium interaction tests before publishing `dist/` to GitHub Pages. The full browser matrix can be run locally with the commands above.

GitHub Pages uses the **GitHub Actions** build source. The root URL is `https://rcyw.github.io/`, so Vite uses `/` as its base. The profile README is maintained separately in [rcyw/rcyw](https://github.com/rcyw/rcyw).

DM Sans and IBM Plex Mono are served with the site. Their SIL Open Font License notices are in `public/licenses/`.

This is a personal site inspired by NeXTSTEP's visual language, with original interface assets. It is not affiliated with NeXT or Apple.
