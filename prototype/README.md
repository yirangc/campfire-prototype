# Campfire reconciliation prototype

A clickable prototype of AI-assisted bank reconciliation for one account (Chase Operating ••4821, USD) and one period (November 2025). Maya, a staff accountant, reviews the exceptions, resolves each one, and completes the reconciliation. The behavior, data and calculations follow the PRD; the visual design follows the Figma Reconcile frames and the shared design system in `src/`.

Everything runs in the browser. There is no server, no real AI and no bank connection. The "AI" suggestions are fixed fixture data.

## Run it

```sh
npm ci
npm run dev          # showcase at http://localhost:5173/, prototype at http://localhost:5173/prototype/
npm run build && npm run preview   # static build at http://localhost:4173/prototype/
npm test             # includes the accounting tests in prototype/src/domain/engine.test.ts
```

Progress is saved in this browser's localStorage (`campfire.reconciliation.chase-4821.2025-11.v1`). **Reset demo** in the page header restores the original November data after a confirmation.

## Demo walkthrough

Start from a reset. The page opens with a $320.00 difference and 24 records in 16 review cases: the PRD's 14 exceptions and 5 auto-matched pairs that still need review.

1. **Confirm a suggestion.** Expand *Nov 04 · ACH NORTH*. The AI notice explains the suggestion, and the two cards show the amounts, dates, references and the 1-day date difference. Choose **Confirm match**. Cleared balance moves; book balance doesn't. Expand the row again and its "Match confirmed" banner has **Undo** at the right.
2. **Spot a wrong suggestion and dismiss it.** Expand *Nov 18 · ALDER SUPPLY*. The suggestion points at Birch Studio (GL-1108) and the notice says the reference and counterparty differ. Choose **Dismiss suggestion**. A compact notice says the suggestion was dismissed, with Undo, and both records become Unmatched. Nothing changes in the balances.
3. **Search for the right entry.** In the same row, type `alder` or a date such as `Nov 17` or `11/17`, use the arrow keys and Enter to pick GL-1107, then **Confirm match**. Clicking the field lists every unmatched ledger entry, same-amount entries first; typing a keyword, date or amount (such as `12,500` or `-450`) narrows the list. Only an entry with the same signed amount, currency and account can be confirmed; picking another shows why it can't. Do the same for *BIRCH STUDIO* with GL-1108.
4. **Create a missing expense.** Expand *Nov 30 · Monthly bank service fee* and choose **Create entry…**. Submit without a category to see field errors (focus moves to the first one). Pick *Bank Fees* and **Create and match**. GL-1115 is created and matched; book balance drops by $15.00. Repeat for the wire fee (GL-1116) and the account service charge (GL-1117).
5. **Document outstanding items.** Expand *Check 1042 · Riverside Janitorial*. Choose *Outstanding check* and, as evidence, the unrelated *CHECK 1047 PAID*: the claim is rejected and the entry stays unresolved. Pick *CHECK 1042 PAID* (Dec 2), add an explanation and **Document as outstanding**. Repeat for the deposit DEP-1130 (deposit in transit, Dec 1) and the transfer TR-1130 (Dec 3). The outstanding line under the balance cards reaches +$1,000.00 / −$800.00 / net +$200.00.
6. **Review the auto-matched pairs.** Open the **Auto-matched** tab. Each pair (Stripe payout, Acme payment, AWS, Gusto payroll, Figma subscription) opens with the bank transaction and ledger entry side by side and the same three actions as a suggestion. **Confirm match** moves both records to Confirmed and clears the bank amount; **Dismiss suggestion** makes both Unmatched (with Undo); **Leave Unresolved** just collapses the row. Completion stays blocked until every pair is confirmed or dismissed and resolved.
7. **Complete.** The difference is $0.00 and 24 of 24 records are reviewed (21 Confirmed, 3 Outstanding). **Complete reconciliation** locks the actions and shows the summary with the created entries and outstanding evidence. **Download summary** saves a CSV.
8. **Reopen.** **Reopen reconciliation** restores editing and keeps every resolution. Refresh the page at any point: the state, drafts and recorded actions come back.

Other paths worth trying:

- **Status tooltips.** Hover over a status pill, or Tab to it, to read what the status means. Escape hides the tooltip; clicking the pill doesn't expand the row.
- **Undo.** Expand a confirmed or outstanding row and use **Undo** at the right of its banner. It reverses that row's own action, even after later actions elsewhere. Undoing a created expense removes the entry and its match together.
- **Blocked completion.** Click **Complete reconciliation** early: the reasons are listed (unresolved records, a non-zero difference, or both).
- **Leave unresolved.** Choose **Leave Unresolved** in any open case: the row collapses in place and keeps its status (Unmatched, Suggested or Auto-matched). Nothing else changes, and it still needs a resolution before you can complete. Click the row to continue.
- **Unreadable save.** In the browser console run `localStorage.setItem('campfire.reconciliation.chase-4821.2025-11.v1', '{')` and reload. A recovery screen explains the problem, shows the raw data, and offers Try again or Reset demo. Nothing is overwritten until you choose.

## Calculations

Money is stored in integer cents. Balances, counts and completion are derived from the fixture plus the saved actions (`prototype/src/domain/selectors.ts`); nothing derived is stored.

| Balance | Definition | Start | Finish |
| --- | --- | --- | --- |
| Statement closing | Opening bank balance + all November bank activity (fixed) | $109,650.00 | $109,650.00 |
| Book balance | Opening ledger cash + November ledger activity, including entries created here | $109,970.00 | $109,850.00 |
| Cleared balance | Opening cash + bank records with a confirmed match (auto-matched pairs clear once confirmed; PRD start: $109,870.00) | $100,000.00 | $109,650.00 |
| Remaining difference | Book − statement closing − net documented outstanding | $320.00 | $0.00 |

Matches change the cleared balance only. Created expenses change the book balance. Outstanding documentation changes the adjustment only. Completion needs every one of the 24 original records reviewed (auto-matched pairs confirmed or dismissed and resolved) **and** a difference of exactly $0.00.

## Code map

| Path | What it holds |
| --- | --- |
| `src/domain/fixture.ts` | The PRD's November dataset, suggestions and December evidence |
| `src/domain/engine.ts` | Pure reducer for every accounting action, with validation and undo |
| `src/domain/selectors.ts` | Statuses, review cases, balances, blockers and search |
| `src/domain/persistence.ts` | Versioned localStorage save and load with structural checks |
| `src/useRecon.ts` | React state, saving after each change, save errors and recovery |
| `src/ui/` | The page, register, expanded case detail, forms and summary |

The UI imports every component, icon and token from `../../src` (the shared design system). New shared pieces (status pills, notices, info tips, field errors, compact fields, the link button, balance cards and the app sidebar) were added there and are shown in the showcase's Reconciliation chapter.

## Assumptions

- One browser tab, one user (Maya), November 2025 as a historical period. Opening ledger cash equals the opening bank balance.
- Matches are one-to-one with identical signed amounts. No partial or many-to-one matches, no foreign exchange.
- Expenses can only be created for bank debits, in one of four sample categories, posted in November.
- Outstanding evidence must be later activity (after Nov 30) on the same account with the same amount and reference.
- A dismissed suggestion is restored from its own notice (only while both records are still unexplained). Undo covers matches, created entries and outstanding items.

## Limitations

- No real AI, bank feed, statement import, authentication or server. Data lives in localStorage only.
- Account and period selectors show the single demo account and period.
- Navigation outside Reconcile is decorative.
- Figma draws desktop only (1440 px). Narrower layouts are checked from 320 to 1440 px in Chromium. The main flow is also checked at 1440 px in Firefox and WebKit (`scripts/e2e-pages.mjs`).

## Design departures

The PRD wins where it conflicts with Figma. The main departures, all listed in `docs/design-flags.md` and `docs/figma-and-decisions.md`:

- The Figma frames' eight-row November and "John Glasgow" are replaced by the PRD dataset and Maya. Tabs count records (24), not rows. The PRD's five background pairs are Auto-matched items in the main table that still need review (Yirang's design), so the cleared balance starts at $100,000.00. Unmatched counts every transaction not yet confirmed or documented, so it starts at 14 and includes the 6 records in suggested pairs (Suggested is a subset, listed in both tabs). The PRD splits them 6 / 8; this follows Yirang's request.
- The GL-1101 and GL-1105 memos read "ACH Northstar Hosting" and "DELTA PAY receipt" (PRD: "Northstar hosting", "Delta receipt") so the two correct suggestions look like close matches, at Yirang's request.
- The register heading is "Transactions", following Figma and Yirang's design.
- Expanded rows have no arrow between the bank and ledger cards (Figma draws a 32 px chevron column), at Yirang's request. Side by side, the two cards line up row by row so the amount, date, description and reference are at the same height and column.
- Outstanding status, the outstanding form, search popover details, save errors, blocked completion, reopen and recovery are PRD design additions with no Figma frame. They reuse existing tokens and components and are marked in the flags.
- The expense form says "Paid from" (PRD) where Figma says "Payment account".
- Field errors use warning ink (proposed; Figma has no error state).
- Narrower screens are a design addition: below 1100 px the sidebar becomes a menu drawer, and the balance cards, register rows, expanded-row cards, forms and actions reflow by the width the page has (container queries). Dropdowns open upward when there is no room below. At 1440 px the page is laid out as on desktop.
- Icons are reconstructions of the Figma icon components, not original Campfire assets.
