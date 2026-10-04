# Figma references and design decisions

One place for where the design comes from and where the build departs from it. Details live in [design-flags.md](design-flags.md) (every flag) and [prototype-decisions.md](prototype-decisions.md) (the ones that matter for the prototype).

## Figma references

File `M4alZ0UMg6muqKn7l2WaXW` (Campfire take-home).

| Reference | Node | Showcase chapter |
| --- | --- | --- |
| Foundations | 12:10929 | 01 Foundations |
| Identity and icons | 12:11103 (icon grid 12:11131) | 02 Logo and icons |
| Side panels and navigation | 12:11289 | 03 Navigation |
| Controls, fields and metric cards | 12:11464 | 04 Controls |
| Financial reporting | 12:11621 | 05 Reporting |
| Cost allocation | 12:11783 | 06 Allocation |

Component frames carry their own node ids in code comments, in `src/assets/manifest.ts` and in the showcase.

## Reconstructions

- **Icons.** All 25 icons are reconstructions. Figma itself labels them "screenshot-derived reconstruction; geometry is estimated". The SVGs are generated from the Figma vector data by `scripts/figma/build-icons.mjs` and match Figma's renders within 1% (`scripts/figma/compare-icons.mjs`). Yirang approved using them for this exercise on 2026-10-04.
- **Logo and mark.** Not in the build yet. Exports of layers 12:12168 and 12:12169 as PNG at 4x are needed (tracked in an issue).

## Intentional changes from Figma

- **Focus color.** Figma's focus lime (#BCEFA3, 1.31:1 on white) is replaced with chart green #287D60 (5.0:1) for the outline, at Yirang's request on 2026-10-04. The soft lime ring stays.
- **Dropdown menu width.** At least as wide as its trigger instead of a fixed 260 px.
- **Hit areas.** Allocation row actions get 20 px hit areas around 12 px icons.

Everything else follows Figma. Where two frames conflict, each screen follows its own frame (see the conflicts in design-flags.md).
