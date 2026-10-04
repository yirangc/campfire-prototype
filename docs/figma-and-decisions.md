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
| Reconcile: expanded suggested match | 49:617 (detail 49:952) | 07 Reconciliation, prototype |
| Reconcile: dismissed suggestion and search | 38:6512 (detail 38:6667) | prototype |
| Reconcile: selected ledger entry | 38:6907 (detail 38:7064) | prototype |
| Reconcile: resolve exception (expense form) | 28:8442 (detail 51:1040) | prototype |
| Reconcile: completed | 28:8761 (summary 28:8924) | prototype |
| Labelled inputs, Field/Focus | 12:12184 (12:11503 in the PRD could not be found; Yirang supplied 12:12184) | 04 Controls |
| Navigation tab | 31:926 | 04 Controls, prototype |

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

## Reconciliation prototype

The PRD sets behavior, data and calculations; Figma sets the visual design. Where they conflict the PRD wins, and the difference is listed here and in the flags.

- **Data.** The Figma frames' eight-row November, their balances and "John Glasgow" are replaced by the PRD dataset (14 exceptions in 11 cases, 5 background pairs) and Maya.
- **Counts and heading.** Tabs count the 14 original exception records. Unmatched counts every record not yet confirmed or documented, suggested pairs included (14 at the start, with Suggested 6 as a subset), at Yirang's request; the PRD splits them 6 / 8. The register is titled "Exceptions to review" and background pairs sit in their own "Already matched: 5 pairs" section.
- **Action column.** Kept in every state (it appears only in 28:8442) so the Undo link has a fixed place.
- **Expense form.** "Paid from" (PRD) instead of "Payment account". Fields are the 34 px compact size drawn in that frame.
- **Completed summary.** Records out of 14, created entries, and the outstanding adjustment with evidence, instead of "8 of 8 transactions".
- **Design additions** (PRD, no Figma frame): Outstanding pill, tab and form; search empty results; separate-expense acknowledgement; history; save-failure, blocked-completion and recovery notices; reopen; demo reset. They reuse existing tokens and components.
- **Field errors** use warning ink (proposed). No new color was added.

Everything else follows Figma. Where two frames conflict, each screen follows its own frame (see the conflicts in design-flags.md).
