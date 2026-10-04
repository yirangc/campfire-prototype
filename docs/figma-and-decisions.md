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

- **Icons.** All 26 icons are reconstructions. Figma itself labels them "screenshot-derived reconstruction; geometry is estimated" (lock, added later, has no description). The SVGs are generated from the Figma vector data by `scripts/figma/build-icons.mjs`, re-read after the 2026-10-04 icon update, and match Figma's renders within 1% (`scripts/figma/compare-icons.mjs`). Yirang approved using them for this exercise on 2026-10-04.
- **Logo and mark.** Not reconstructions: the 4x PNG exports of layers 12:12168 and 12:12169 that Yirang supplied, used as supplied.

## Intentional changes from Figma

- **Focus everywhere.** Figma draws focus only on the text field. Its Field/Focus recipe (2 px focus lime inside, 2 px lime ring at 50% outside) is applied to buttons, tabs and every focusable control, as Yirang asked on 2026-10-04. This replaced a chart-green outline from earlier that day. Lime fails the 3:1 contrast WCAG asks of focus indicators; see the accessibility flags.
- **Primary button.** Follows the component (accent lime fill) rather than the Foundations note that calls primary "neutral ink".
- **Undrawn states.** Button and tab hover reuse surface/subtle (the Tab hover variant), disabled uses muted ink, and there is no primary hover because Figma has no token for one. All are labelled proposed in the showcase.
- **Tab row gap.** The shared Tabs component uses the 16 px gap from the Tab specimen; the Reconcile screens use 12 and 20 px.
- **Dropdown menu width.** At least as wide as its trigger instead of a fixed 260 px.
- **Hit areas.** Allocation row actions get 20 px hit areas around 12 px icons.

Everything else follows Figma. Where two frames conflict, each screen follows its own frame (see the conflicts in design-flags.md).
