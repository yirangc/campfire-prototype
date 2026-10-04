# Status glyphs

Small status glyphs drawn inside the Reconcile mockups. They are local vector frames in those frames, not
Campfire icon components, so they are kept apart from `src/assets/icons/` and keep their drawn colors.

Each file is the Plugin API `exportAsync({ format: 'SVG_STRING' })` of the node below, read on 2026-10-04,
with the zero-width duplicate fill paths Figma emits next to open strokes removed. Don't edit them by hand.

| File | Figma node | Frame |
| --- | --- | --- |
| `info-20.svg` | 38:6881 Info icon | Suggestion dismissed notice (38:6512) |
| `info-14.svg` | I28:8871;38:5420 Info icon | Balance metric label (28:8761) |
| `warning-16.svg` | 51:1042 Warning icon | No matching ledger entry notice (28:8442) |
| `warning-14.svg` | 49:795 Unmatched warning icon | Unmatched status pill (49:617) |
| `sparkle-16.svg` | 49:968 Sparkle icon | Suggestion rationale (49:617) |
| `sparkle-14.svg` | 49:963 Suggested sparkle icon | Suggested status pill (49:617) |
| `check-14.svg` | 47:629 Confirmed check icon | Confirmed status pill (28:8761) |

The banner check in the completed frame (28:8918) and the completed badge (28:8846) are instances of the
Campfire check icon (12:12164) and use `Icon name="check"` in green instead.
