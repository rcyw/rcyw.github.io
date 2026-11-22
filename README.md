# Wayne’s Desk on GitHub Pages

Wayne’s Desk is a personal site about AI agents and infrastructure. It includes **Wayne’s Notes** for articles and topics, **AI Brief**, and **Papers**. This repository deploys the site to GitHub Pages using GitHub Actions. [Visit Wayne’s Desk](https://rcyw.github.io/) · [Desk source and content](https://github.com/rcyw/desk)

## Desk release

Desk dispatches **Desk Pages** after push CI succeeds for the current commit on its `main` branch. The workflow verifies CI for the supplied commit SHA, builds that revision, and confirms it is still current before publishing. It then checks the revision reported by the live site. [Desk Pages workflow](.github/workflows/desk-pages.yml) · [Live Desk revision](https://rcyw.github.io/desk-revision.txt)

Pull requests to `main` that change either Pages workflow build an artifact for review. To run **Desk Pages** manually, select this repository’s `main`, enter the current Desk `main` SHA in `desk_sha`, and choose `publish=false` for a preview or `publish=true` for a live release.

Production uses `PAGES_SOURCE=desk` in this repository. Automatic dispatch uses `PAGES_AUTO_PUBLISH=true` in Desk and a `PAGES_DISPATCH_TOKEN` secret in Desk’s `pages-dispatch` environment. Give the token Actions write access scoped to this repository. [Desk dispatch workflow](https://github.com/rcyw/desk/blob/main/.github/workflows/dispatch-pages.yml)
