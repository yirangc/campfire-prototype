# Design flags

Conflicts in the Figma references, choices Figma does not document, accessibility concerns, and what could not be verified. The showcase renders the same list from src/showcase/flags.ts; regenerate this file with `npm run flags:doc` after editing it. For the subset that affects the prototype, with recommendations, see prototype-decisions.md.

## Conflicts between references

- Panel icon (12:12165) is described as 75% artwork but is drawn edge to edge on the 24 px canvas; its 16 px instance (38:5739) also uses a 1 px stroke instead of 1.5 px. The files follow the drawing, including the 1 px stroke at 16 px.
- Primary button color. Foundations (12:10947) says "Primary is neutral ink; lime is a selective accent, not a universal brand fill", and the button specimen is labelled "Primary / neutral", but the Primary button component (12:12176) and every Reconcile screen fill it with accent lime. The build follows the component (lime fill, primary ink label), as asked on 2026-10-04.
- Tab row gaps. The Tab specimen row (31:909) uses 16 px between tabs; the Reconcile status tabs use 12 px (28:8032 and others) and 20 px (28:8614). Tab widths are fixed per instance (88, 96, 132 px) rather than following the label. The shared Tabs component uses 16 px and takes a width per tab.
- Reporting breadcrumb has two sizes. Navigation (12:12175): 12/20 text, 12 px chevron, 10 px gap. Financial reporting header (12:11632): 11/20 text, 10 px chevron, 8 px gap. Both are implemented (Breadcrumbs plain, and plain + compact).
- Metric value tracking. Foundations lists 28/34 semibold with no tracking; the metric cards use −0.8 px. The cards follow the component (−0.8 px).
- Date range control. Controls (12:12136) has a 16 px calendar icon at 300 px wide; the assembled Income Statement (12:11645) has no icon at 296 px. Both are possible with Select (icon prop optional); the Income Statement specimen follows its own frame.
- Table header recipes differ. Income Statement: 42 px, subtle fill, 12 px medium secondary. Allocation: 36 px, white, 12/20 regular secondary. Each table follows its own frame.
- Row anatomy specimens (12:12186, 12:12187) differ from rows inside the Income Statement: 12 px vs 8 px chevron gap, 11/20 vs 11/16 label, full border vs bottom rule, fixed 150 px amount. FinancialTable follows the assembled table.
- Allocation total. Inside the table: 38 px, "Total" at 200 px from the left, 14 px gap. Standalone specimen (12:12198): 44 px, 12 px inset, 16 px gap. Both are implemented.
- Allocation Percentage heading has no right inset, so it sits 12 px right of the values beneath it. Implemented as drawn; it breaks the "shared right edge" rule stated for financial tables.
- Spacing scale documents 4–48 but components bind 2, 6, 10, 14 and 20 (and raw 3 px and 40 px gaps). All are tokens; the off-scale steps are marked in Foundations.
- The side panels embed a "Campfire logo reconstruction" image while the identity page uses the "supplied high-resolution" logo. The build uses the supplied 4x exports of the identity layers (12:12168, 12:12169) everywhere.
- The full-page render of the navigation frame shows "Contracts" (unindented) where the Reporting side panel component contains "Cash Flow". The component and its isolated render agree on Cash Flow, which is what is built.
- The dropdown open menu is 260 px in Figma while the closed Cadence control is 160 px. The menu here is at least as wide as its trigger.
- Reconcile data. The Figma frames show an eight-transaction November (Stripe payout to Monthly bank service fee) with a $220 or $15 difference and "John Glasgow" as the user. The prototype uses the PRD dataset instead (24 records, 14 exceptions, 11 review cases, $320 initial difference) and Maya, because the PRD takes precedence. Five of the Figma rows survive as the "Already matched: 5 pairs" background section, outside the exception tabs and progress.
- Reconcile register heading and counts. Figma calls the register "Transactions" and counts rows in its tabs. The PRD counts the 14 original exception records and keeps background pairs out, so the heading reads "Exceptions to review" and every tab count is a record count, not a row count.
- Reconcile register columns. 49:617 has five columns; 28:8442 adds an Action column with an Undo link. The prototype keeps the Action column in every state so Undo always has the same place.
- Reconcile control heights. The expense form draws its dropdown and inputs at 34 px (38:7885, 38:7939, 38:8005); the controls page draws 36 px dropdowns and 38 px fields. Both are built (size="compact" on Select and TextField).
- "Paid from" (PRD) vs "Payment account" (Figma 38:7927) on the expense form. The PRD label is used.
- Completed summary (28:8924) shows "8 of 8 transactions" and a single Bank Fees adjustment. It is updated per the PRD: records out of 14, confirmed and outstanding counts, the three created entries, and the outstanding adjustment (+$1,000.00 / −$800.00 / net +$200.00) with its evidence.

## Undocumented choices

- Icon color by state. Icons use color/text/secondary everywhere, as bound in the components. Figma check instances 28:8846 and 28:8918 are green (#3E7461) and x instance 38:7385 is blue (#1A65F8), with no stated rule.
- Settings is now a filled gear (no stroke), the only filled icon in an outline set. Lock (38:7923) was added to the icon grid without an observed or suggested label, and its description is empty.
- Hover, pressed and disabled states for buttons, tabs, nav rows and inputs. Hover reuses surface/subtle, as the Tab hover variant does. There is no token for a lime primary hover, so primary hover shows no change. Disabled uses muted ink (tabs and buttons alike).
- Keyboard focus outside text inputs. Figma draws focus only on the text field (Field/Focus, 12:12184): a 2 px focus-lime stroke inside and a 2 px lime ring at 50% outside. The same recipe is applied to buttons, tabs and every other focusable element.
- Selected value styling inside dropdown cells (Figma shows placeholders only): primary ink, regular weight.
- Menu option highlight vs selection: Figma's open menu shows one row with both a subtle fill and a check. Here the fill follows the keyboard/pointer highlight and the check marks the selected value.
- Menu offset from its trigger (4 px) and its z-index.
- Child rows in the Income Statement (label indented to align with the parent label). Figma shows no child rows.
- Cleared department cell, allocation totals other than 100.00%, and "Collapse All" as the pressed Expand All label.
- Minimum width of the allocation table before it scrolls (960 px).
- Child labels for nav groups that are collapsed in Figma (Financial Statements, Accounting and Cash Management on the dashboard panel) are sample labels.
- Negative or neutral trend badges are not documented and are not built.
- Reconcile design additions (PRD "Design addition"; no Figma frame): the Outstanding pill and tab, the outstanding-item form with December evidence, search keyword suggestions, removable filter chips and empty results, the leave-unresolved note, the separate-expense acknowledgement, signal chips in the AI notice, the "Created" chip on generated entries, the history panel, the save-failure notice, the blocked-completion notice, Reopen, the unreadable-data recovery screen and the demo reset dialog. All reuse existing tokens and components; none adds a color.
- Field and dropdown error state: warning-ink border with an 11/16 warning-ink message under the field. Figma has no error state, so no new color is introduced.
- Ledger-only cases (outstanding checks, deposits and transfers) open with the ledger entry on the left and the search or outstanding form on the right, mirroring the bank-side layout.
- Undo scope. The Undo link and the history panel undo accounting actions (match, create and match, outstanding) in reverse order. A dismissed suggestion is restored from its own compact notice, as Figma draws it (38:6668), and a note left on an unresolved record is simply edited.

## Accessibility concerns in the designs

- Focus is back to Figma's lime, as asked on 2026-10-04 (it replaces the chart-green outline added earlier the same day). Focus lime #BCEFA3 is 1.31:1 on white and 1.24:1 on the sidebar, below the 3:1 WCAG 2.2 asks of focus indicators, and on the lime primary button (#B3ED92) the focus stroke is almost invisible (about 1.0:1). Switching --color-focus back to chart green #287D60 (5.0:1 on white) is a one-line change in src/tokens/tokens.css.
- Muted ink (#999D99) is 2.75:1 on white. Placeholders such as "Select Tag" fail WCAG AA text contrast (4.5:1).
- Secondary ink (#727572) is 4.19:1 on the subtle header fill (#F2F3F2), so Income Statement period headings fail AA. It passes on white (4.66:1).
- Selected nav rows differ from the sidebar only by fill (lime 1.29:1, neutral 1.11:1) plus a weight change. aria-current="page" is set for assistive tech, but sighted users get a weak cue, especially for neutral selection.
- Allocation row actions are 12 px icons 8 px apart. Hit areas are extended to 20 px, but WCAG 2.5.8 asks for 24 px targets or spacing; the design does not leave room.
- Every icon-only control (save, delete, close, edit, remove, clear) has no visible label. Accessible names are supplied in code.
- The trend badge communicates direction by color and arrow only; a visually hidden "Up" is added.
- Long nav labels truncate ("New Intercompany Journ..."). The full label is kept in the title attribute and accessible name.
- Input borders (#E7E9E7, 1.22:1) fail the 3:1 non-text contrast guideline for identifying form fields.
- Warning ink #B45309 on the warning pill fill #FFF1C9 is 4.47:1, just under 4.5:1 for the 11 px "Unmatched" label. Warning ink on the notice tint (#FFF8EC) passes at 4.76:1, AI ink passes on both AI fills (5.10:1 and 4.72:1) and the link blue passes on white (4.93:1). Using warning-ink-strong #92400E on the pill (6.31:1) would fix it.

## Not verified

- Logo and mark are the 4x PNG exports Yirang supplied on 2026-10-04 (552 × 128 and 104 × 128). They are renders of the layers, not the original image fills, so they are sharp up to 4x.
- Icons are rebuilt from the Figma vector data and match Figma's 4x renders of all 26 components (after the 2026-10-04 icon update) to within 1% of inked pixels. Five small instances were checked (check 14 and 16, x 16, panel 16, search 12): all within 1% except search 12, whose handle Figma draws about 0.25 px higher. Sizes 10 px and the remaining 12 to 16 px combinations have no Figma instance to compare against.
- Inter rendering differences between Figma and Chromium. Measured: the two reporting breadcrumbs render about 2 px narrower than Figma (190 vs 192, 171 vs 173); every other measured box is within 1 px.
- The allocation table's 8 px scroll track is the browser's native scrollbar, styled in Chromium and Firefox. Systems with overlay scrollbars (macOS default, touch devices) hide the track, so the table renders 8 px shorter there.
- Rendering in Safari and Firefox. Checks ran in Chromium only.
