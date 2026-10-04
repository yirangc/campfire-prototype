# Campfire prototype and design system

One public repository for the Campfire exercise. It holds the design system (tokens, icons, logo, components and a browsable showcase, built from the Campfire Figma file) and the reconciliation prototype that uses it ([prototype/README.md](prototype/README.md): demo steps, calculations, assumptions and design departures). Everything in the showcase is labelled as transcribed from Figma, proposed, or sample data.

This repository is the source of truth. Changes go through a branch and a pull request (see [Making changes](#making-changes)).

## Run it locally

You need Node 22 (Node 20 works for everything except `npm run flags:doc`) and git.

```sh
git clone https://github.com/yirangc/campfire-prototype.git
cd campfire-prototype
npm ci
npm run dev      # showcase at http://localhost:5173, prototype at http://localhost:5173/prototype/
```

Other commands:

```sh
npm test                          # interaction tests (vitest)
npm run lint                      # oxlint
npm run build && npm run preview  # static build, served at http://localhost:4173
```

The verification scripts in `scripts/` (measurements, screenshots, icon comparisons) use playwright-core with a local Chromium; see [CLAUDE.md](CLAUDE.md).

## What's here

| Path | What it holds |
| --- | --- |
| `src/tokens/` | Every color, spacing, radius, border, shadow, type and size value as CSS custom properties |
| `src/assets/` | Logo PNGs and the generated icon SVGs, with their Figma node ids in `manifest.ts` |
| `src/components/` | Shared React components, one folder each |
| `src/showcase/` | The showcase app: one chapter per Figma reference, the reconciliation components, and the flags |
| `prototype/` | The reconciliation prototype (see its README) |
| `docs/figma-and-decisions.md` | Figma references, icon reconstructions and intentional design changes, in one place |
| `docs/design-flags.md` | Every conflict, undocumented choice, accessibility concern and unverified item |
| `docs/prototype-decisions.md` | The flags that affect the prototype, with recommendations |
| `docs/screenshots/` | One screenshot per showcase chapter, refreshed with visual changes |
| `scripts/` | Measurement, screenshot and Figma comparison tooling |

## Showcase and prototype

The showcase and the reconciliation prototype are separate apps in this repository. They share one set of components, icons and tokens, so a change to the design system shows up in both.

| Part | Where | Role |
| --- | --- | --- |
| Design system | `src/tokens`, `src/assets`, `src/components` | Shared by both apps. The only place tokens, icons and components are defined. |
| Showcase | `index.html`, `src/showcase` | The existing design-system showcase, kept as it is |
| Prototype | `prototype/` | The reconciliation prototype, a second Vite entry at `/prototype/` |

Rules:

- The prototype imports from `src/components`, `src/tokens` and `src/assets`. It never copies or restyles them.
- If the prototype needs something the design system lacks, it's added to the shared components first and shown in the showcase, then used in the prototype.
- One `npm run build` builds both apps into `dist/`, and CI checks both.
- Product screens, flows and data live only in `prototype/`. The showcase keeps sample data labelled as such.

## Making changes

1. Each update gets its own branch from `main`, named for the change, for example `update/tabs` or `fix/focus-color`.
2. Open a pull request into `main` using the template. It asks for a short description, the Figma nodes followed, before-and-after screenshots for visual changes, any design decisions, and the checks that were run.
3. CI runs lint, tests, the typecheck and build, and checks that `docs/design-flags.md` matches `src/showcase/flags.ts`. A pull request should be green before review.
4. Yirang reviews and merges. Nothing merges into `main` without that review.
5. Open tasks and blockers are tracked as GitHub issues.

Before-and-after screenshots are captured with `node scripts/compare-sections.mjs <url> <outDir> "Section title" ...` against the `main` build and the branch build. They're stored on the `pr-screenshots` branch so they don't add weight to `main`.

## Deploying to GitHub Pages

The repository and the site are public (Yirang approved both on 2026-10-04). `.github/workflows/pages.yml` ("Deploy showcase and reconciliation prototype to GitHub Pages") builds both apps into one static site:

| App | URL |
| --- | --- |
| Design-system showcase | `https://yirangc.github.io/campfire-prototype/` |
| Reconciliation prototype | `https://yirangc.github.io/campfire-prototype/prototype/` |

It runs only when started by hand from `main` (Actions → the workflow → Run workflow). Each deployment needs Yirang's go-ahead.

Setup (done): the repository is public, so Pages is free on GitHub Free, and Settings → Pages → "Build and deployment → Source" is **GitHub Actions**. The `github-pages` environment only accepts deployments from `main`. The prototype holds fictional sample data only. If the repository is made private again, Pages needs a paid plan and the site stops updating.

Both apps are static files with relative asset paths (`base: './'`), so they work under the `/campfire-prototype/` subpath without a 404 fallback. The prototype keeps its progress in each visitor's browser (localStorage); nothing is sent anywhere.

Checks before deploying:

```sh
npm run build
node scripts/serve-pages.mjs &                 # dist/ at http://localhost:4174/campfire-prototype/, served like Pages
node scripts/e2e-pages.mjs chromium            # both apps open, refresh and load assets; full reconciliation flow
```

The "Pages build in Chromium, Firefox and WebKit" workflow (`e2e.yml`) runs the same script in all three engines on every pull request. WebKit is Safari's engine on Linux, not Safari itself.

**Rollback.** Pages keeps serving the last successful deployment, so a failed run changes nothing. To undo a bad deployment, revert the merge on `main` in a pull request (`git revert -m 1 <merge commit>`), merge it and run the workflow again. To take the site offline, choose **Unpublish site** in Settings → Pages.

## Open an offline copy

If you have the `campfire.bundle` file instead of repository access, run `git clone campfire.bundle campfire`, then `npm ci` and `npm run dev` inside the folder.
