# Wayne’s Desk on GitHub Pages

Wayne’s Desk is a personal site about AI agents and infrastructure. It opens **Wayne’s Notes** for articles and topics, with **AI Brief** and **Papers** alongside it. This repository handles GitHub Pages releases and keeps the original NeXTSTEP workbench as a fallback. [Visit Wayne’s Desk](https://rcyw.github.io/) · [Desk source and content](https://github.com/rcyw/desk)

## Publication

This repository uses GitHub Actions as its Pages build source.

### Desk release

Desk’s `main` supplies the live site. Once push CI succeeds for its current commit, Desk dispatches **Desk Pages** with the verified commit SHA. The workflow checks the successful CI record for that SHA and builds the revision. It checks Desk’s current commit again before deploying and verifies the live revision afterward. [Desk Pages workflow](.github/workflows/desk-pages.yml) · [Live Desk revision](https://rcyw.github.io/desk-revision.txt)

Pull requests to `main` that change either Pages workflow build an artifact for review. To run **Desk Pages** manually, select this repository’s `main`, enter the current Desk `main` SHA in `desk_sha`, and choose `publish=false` for a preview or `publish=true` for a live release.

Set `PAGES_SOURCE` to `desk` in this repository to enable live Desk releases. For automatic dispatches, configure Desk’s `pages-dispatch` environment for `main` with a `PAGES_DISPATCH_TOKEN` secret that has Actions write access to this repository. Set `PAGES_AUTO_PUBLISH` to `true` in Desk. [Desk dispatch workflow](https://github.com/rcyw/desk/blob/main/.github/workflows/dispatch-pages.yml)

## NeXTSTEP workbench fallback

The original workbench is a NeXTSTEP-inspired research desk after hours, with a bright CRT, charcoal hardware, and a warm pool of lamplight. The display opens the desktop, while three small machines lead to AI / Agent, Agent Sandbox, and AI Infra. The desktop has interest drawers, open questions, and a browser-based Terminal. Returning to the workbench preserves the current desktop and unfinished Terminal input.

### Restore the workbench

After any current deployment finishes, remove `PAGES_SOURCE` and run **Publish curiosity desktop** on this repository’s `main`. Pushes to `main` also build and publish the workbench while it is selected. The workflow checks types and formatting, builds the site, and runs Chromium interaction tests before publishing `dist/`. To return to Desk, set `PAGES_SOURCE` back to `desk` and run a manual production release. [Workbench Pages workflow](.github/workflows/pages.yml) · [Desk release](#desk-release)

### Local development

Use the Node.js and pnpm versions recorded in this repository. [Node.js version](.node-version) · [pnpm version](package.json)

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Edit `src/content.ts` for the desktop introduction, interests, and questions. `src/Workstation.tsx` connects the workbench and desktop; `src/workbench.css` styles the entry page. The original 3D models and renderer live in `src/scene/`. The desktop interaction lives in `src/App.tsx`; its appearance lives in `src/styles.css`.

In the workbench build, `/#workbench` and `/#desktop` support direct visits, refresh, and browser history. The desktop route skips the 3D renderer. A static illustration keeps the content accessible without WebGL, and reduced-motion preferences skip the camera transition.

The React, TypeScript, and Three.js workbench runs in the browser. The renderer loads separately when entering the workbench, caps pixel density, pauses on hidden tabs, and releases its resources when entering the desktop. Models, material textures, and the fallback illustration are generated from code. Preferences stay in browser local storage. Vite uses `/` as its base for GitHub Pages.

The camera frames the working surface independently on narrow screens. HTML markers follow projected 3D anchor points and appear individually on keyboard focus. They do not intercept pointer input; mouse and touch visitors select the actual objects. The plain navigation remains available in the static fallback. Anchor positions and material details live in `src/scene/models.ts`, camera framing in `src/scene/workbenchScene.ts`, and the surrounding layout in `src/workbench.css`.

### Verification

```sh
pnpm check
pnpm build
pnpm exec playwright install --with-deps
pnpm test:e2e
```

Browser tests run against the production build in Chromium, Firefox, WebKit, and a touch viewport. They cover the workbench and desktop journey, keyboard focus, retained state, mobile layouts, reduced motion, and the WebGL fallback. Each run chooses an available loopback port; set `E2E_PORT` to choose one explicitly. Reports and failure artifacts remain in ignored `playwright-report/` and `test-results/` directories.

Use `pnpm format` after editing. To preview the build manually, run `pnpm preview`.

### Credits

The workbench is an independent project with original interface assets inspired by NeXTSTEP’s visual language. The SIL Open Font License notices for DM Sans and IBM Plex Mono and the MIT license for Three.js are in the repository. [Third-party licenses](public/licenses/)

The idea of exploring a personal site through objects in a room was inspired by [Felix Rieseberg’s website](https://felixrieseberg.com/). This workbench uses its own models, visual design, and interest-focused content.
