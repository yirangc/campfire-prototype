# Decisions that could affect the prototype

These are the flagged issues that would change what the prototype looks like or how it behaves. Each one has a recommendation. Everything else is in [design-flags.md](design-flags.md) and can wait.

## Needs your input

1. **Logo files.** The logo and mark PNGs still can't be downloaded here, so every screen shows a dashed placeholder where the logo goes. **Recommendation:** export the two layers listed under "Assets to export manually" below and upload them. I'll add them as supplied.

2. **States the designs don't show.** The prototype will probably need states that Figma doesn't draw: a negative trend badge, an allocation total other than 100%, a cleared department cell, empty and loading tables, and disabled controls. **Recommendation:** once the PRD says which ones the flows need, I'll build them from existing tokens (the success ink and tint for positive, the same recipe in neutral gray for negative, muted ink for disabled) and label each one "proposed" in the showcase so you can approve or replace it. I won't add a new color for errors without your sign-off.

3. **The seven suggested icons.** Edit, download, search, check, panel, settings and help fill the whole 24 px canvas, like the observed utility icons, so they look larger than the 18 px navigation glyphs. **Recommendation:** use them in toolbars, buttons and menus, and not in the side navigation. Panel is the weakest fit. Its description says 75% artwork but it's drawn edge to edge, and its 16 px instance uses a 1 px stroke. Avoid it unless the PRD needs a "toggle panel" control.

## Recommended changes (small visual shifts, better accessibility)

4. **Placeholder text is too light.** Muted ink #999D99 is 2.75:1 on white, below the 4.5:1 that text needs. This affects every empty dropdown cell ("Select Tag") and input placeholder. **Recommendation:** use secondary ink #727572 (4.66:1) for placeholders. It's one token change, and placeholders would still read as lighter than entered values (#292929).

5. **Income Statement column headings are slightly too light.** Secondary ink on the subtle header fill is 4.19:1. **Recommendation:** use gray/600 #626862 for header text on that fill (5.14:1). Gray/600 is one of Figma's suggested grays, and the change is barely visible.

6. **Allocation row actions are tight.** The edit and remove icons are 12 px wide and 8 px apart. I extended the hit areas to 20 px, but 24 px targets don't fit without overlapping. **Recommendation:** widen the gap to 12 px so each action gets a 24 px target (WCAG 2.5.8). The Account column has room. Otherwise, keep the drawing and accept the risk for a desktop prototype.

## Recommended to keep as is

7. **Focus indicator: fixed as you asked.** The outline is now chart green #287D60 (5.0:1 on white, 3.7:1 on the lime selection), and Figma's soft lime ring stays outside it. Focused text inputs use the green border instead of lime. This is already in the build, stored as `--color-focus` in `src/tokens/tokens.css`.

8. **The selected nav row is mostly a fill change.** Lime is 1.29:1 against the sidebar and neutral is 1.11:1. The medium text weight and `aria-current` add a second cue. **Recommendation:** keep it for the prototype. If testers miss the current page, the least invasive fix is primary ink on the selected label.

9. **Variant conflicts between frames.** There are two breadcrumb sizes, a date range with and without the calendar icon, two table header styles, and two allocation total layouts. All of them are built as variants. **Recommendation:** each prototype screen uses the variant from the Figma frame it comes from: compact breadcrumb and the 42 px header for reporting, and the 36 px header with the in-table total for allocation.

10. **Dropdown menu width.** Figma's proposed open menu is 260 px under a 160 px trigger. **Recommendation:** keep the menu at least as wide as its trigger and let it grow to fit its options. A fixed 260 px would overhang narrow table cells.

11. **Desktop only.** Every frame is about 1440 px wide, and the allocation table scrolls horizontally below 960 px. **Recommendation:** build the prototype for a 1440 px desktop viewport unless the PRD asks for mobile.

## Assets to export manually

The icons no longer need exporting. I rebuilt all 25 from the Figma vector data, as reconstructions. Only the brand PNGs are left:

| Figma layer | Node | Export | Save as |
| --- | --- | --- | --- |
| Campfire/Brand/Campfire logo/High resolution | 12:12168 | PNG, 4x | `src/assets/brand/campfire-logo.png` |
| Campfire/Brand/Campfire mark/High resolution | 12:12169 | PNG, 4x | `src/assets/brand/campfire-mark.png` |

You can upload them in the thread and I'll put them in place. Exporting at 4x keeps the transparent background and is sharp on high-density screens.
