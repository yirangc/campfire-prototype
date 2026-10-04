# Campfire design system

React 19 + TypeScript + Vite. Phase 1 is the design system and its showcase only. Product screens, workflows and business logic wait for the PRD.

## Run

```sh
npm install
npm run dev       # showcase at http://localhost:5173
npm test          # interaction tests (vitest + Testing Library, jsdom)
npm run lint      # oxlint
npm run build     # typecheck + static build to dist/
npm run preview   # serve dist/ at http://localhost:4173
node scripts/measure.mjs      # compare rendered boxes with Figma sizes (needs preview running)
node scripts/screenshot.mjs   # one PNG per showcase chapter into screenshots/ (gitignored); pass <url> docs/screenshots to refresh the committed set
npm run flags:doc             # regenerate docs/design-flags.md from src/showcase/flags.ts (Node 22)
```

The scripts use playwright-core with a local Chromium. Set `CHROMIUM_PATH` if it is not at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## Layout

- `src/tokens/tokens.css`: every color, spacing, radius, border, shadow, type and dimension value as CSS custom properties. Components never hard-code these values.
- `src/tokens/typography.css`: `.cf-text-*` text style classes and `.cf-visually-hidden`.
- `src/index.css`: font imports (self-hosted Inter 400/500/600), reset, global `:focus-visible`.
- `src/assets/manifest.ts`: icon and brand registry with Figma node ids. `src/assets/icons/` and `src/assets/brand/` hold the exported files (see the README in each).
- `src/components/<Name>/`: one folder per component (`.tsx` + `.module.css`), re-exported from `src/components/index.ts`. Tests are in `src/components/components.test.tsx`.
- `src/showcase/`: the browsable showcase. `sampleData.ts` holds all transcribed and sample data, `flags.ts` the design flags, `sections/` one file per chapter.
- `docs/design-flags.md`: the flags as Markdown. Keep it in sync with `src/showcase/flags.ts`.
- `docs/prototype-decisions.md`: the flags that affect the prototype, with recommendations.
- `docs/figma-and-decisions.md`: Figma references, reconstructions and intentional changes in one place.
- `docs/screenshots/`: chapter screenshots, committed.

## Figma references

File `M4alZ0UMg6muqKn7l2WaXW`. Foundations `12:10929`, identity and icons `12:11103`, navigation `12:11289`, controls and metrics `12:11464`, financial reporting `12:11621`, cost allocation `12:11783`. Component frames carry their own node ids in code comments and in the showcase.

## Design rules

- Never invent design details missing from Figma. When something has to be decided, mark it in the showcase (`proposed`, `suggested`, `sample`) and add it to the flags.
- Do not redraw the logo or substitute icons. A missing asset renders a dashed placeholder at its Figma size.
- Figma strokes sit inside the frame and take no space. Emulate this by subtracting `--border-width` from padding, or by drawing the rule as an inset outline or `::after` overlay, so outer sizes match Figma.
- Match Figma sizes to within 1 px. Run `scripts/measure.mjs` after layout changes.
- Accessibility: semantic elements (`table`, `nav`, `dialog`, `button`), keyboard support, visible focus, an accessible name on every icon-only control. Focus uses `--color-focus` (chart green), not Figma's lime, which is 1.31:1 on white.
- Keep the build static: `base: './'` in `vite.config.ts`, no server code, no absolute asset paths.

## Assets

- Icons: `src/assets/icons/*.svg` are generated. Don't edit them by hand. `scripts/figma/icon-geometry.json` holds the vector paths, offsets and fill regions read from the Figma components 12:12143 to 12:12167 through the Plugin API. `node scripts/figma/build-icons.mjs` rebuilds the 24 px files and the per-size files (`{name}-{16,14,12,10}.svg`), which keep the 1.5 px stroke. Figma calls these icons screenshot-derived reconstructions, and the showcase labels them that way.
- Figma's own SVG export drops open sub-paths from these vectors, which is why the files are rebuilt from the paths. `node scripts/figma/compare-icons.mjs` checks the files against Figma's 4x renders in `scripts/figma/reference/`. `compare-instances.mjs` checks the small instances.
- Icons render inline and use `currentColor`. The Icon component sets color/text/secondary.
- Logo: the supplied transparent PNGs go in `src/assets/brand/campfire-logo.png` and `campfire-mark.png`. Export layers 12:12168 and 12:12169 as PNG at 4x. Use them as supplied; don't redraw them as SVG. Until the files are there, a dashed placeholder shows.

## Git, review and deploy

GitHub (`yirangc/campfire-design-system`, private) is the source of truth.

- One branch per update, from `main`. Never commit to `main` directly.
- Open a pull request with `.github/pull_request_template.md`: short description, Figma nodes, before-and-after screenshots for visual changes (`scripts/compare-sections.mjs`, images pushed to the `pr-screenshots` branch), design decisions, and checks run.
- CI (`.github/workflows/ci.yml`) runs lint, tests, build and the flags-doc sync check. Get it green before asking for review. Yirang reviews and merges.
- Refresh `docs/screenshots/` (`node scripts/screenshot.mjs http://localhost:4173/ docs/screenshots`) in pull requests that change visuals.
- Track open tasks as GitHub issues.
- Don't deploy, make anything public or add paid services without Yirang's approval. `pages.yml` is manual only and not approved.
- The reconciliation prototype will be a separate entry (`prototype/`) that imports the shared components and tokens. It waits for the PRD.
