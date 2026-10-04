## What changed

<!-- A short description in plain language. Link the Figma node(s) the change follows. -->

## Before and after

<!-- Required for visual changes: screenshots of the affected showcase sections.
     node scripts/compare-sections.mjs <url> <outDir> "Section title" ... captures them. -->

| Before | After |
| --- | --- |
|  |  |

## Design decisions

<!-- Anything that departs from Figma, fills a gap Figma leaves, or changes a flag. Update src/showcase/flags.ts
     (and run npm run flags:doc) or docs/prototype-decisions.md to match. Write "None" if there are none. -->

## Checks

- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `node scripts/measure.mjs` (layout changes)
- [ ] `node scripts/figma/compare-icons.mjs` (icon changes)
