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
node scripts/screenshot.mjs   # one PNG per showcase chapter into screenshots/ (gitignored)
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

## Figma references

File `M4alZ0UMg6muqKn7l2WaXW`. Foundations `12:10929`, identity and icons `12:11103`, navigation `12:11289`, controls and metrics `12:11464`, financial reporting `12:11621`, cost allocation `12:11783`. Component frames carry their own node ids in code comments and in the showcase.

## Design rules

- Never invent design details missing from Figma. When something has to be decided, mark it in the showcase (`proposed`, `suggested`, `sample`) and add it to the flags.
- Do not redraw the logo or substitute icons. A missing asset renders a dashed placeholder at its Figma size.
- Figma strokes sit inside the frame and take no space. Emulate this by subtracting `--border-width` from padding, or by drawing the rule as an inset outline or `::after` overlay, so outer sizes match Figma.
- Match Figma sizes to within 1 px. Run `scripts/measure.mjs` after layout changes.
- Accessibility: semantic elements (`table`, `nav`, `dialog`, `button`), keyboard support, visible focus, an accessible name on every icon-only control.
- Keep the build static: `base: './'` in `vite.config.ts`, no server code, no absolute asset paths.

## Assets

Logo and icons are not in the repo yet. The network policy blocked downloads from figma.com. To add them, allow `www.figma.com` in the environment, then export each node listed in `src/assets/manifest.ts` through the Figma MCP `download_assets` tool:

- Icons go in `src/assets/icons/<name>.svg`. An optional per-size file `<name>-<size>.svg` overrides it at that size.
- The logo goes in `src/assets/brand/campfire-logo.png` and the mark in `src/assets/brand/campfire-mark.png`. Figma supplies the logo only as a PNG.

Files are picked up automatically through `import.meta.glob`.

## Git and deploy

Local git only. Do not add a remote, push or deploy until Yirang provides the GitHub destination. Deploy steps are in README.md.
