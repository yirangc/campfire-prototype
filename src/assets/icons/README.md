# Icon files

Export each `Campfire/Icon/*` component from Figma as SVG and save it here as `{name}.svg`
(24 × 24 canvas). Names and node IDs are listed in `../manifest.ts`.

Where a component uses an icon at a smaller box (10, 12, 14 or 16 px) and the Figma instance at that
size has its own stroke weight, export that instance too as `{name}-{size}.svg`. The `Icon` component
prefers the size-specific file.

Do not redraw, retrace or substitute icons. Until a file exists, the `Icon` component shows a
labelled placeholder at the correct size.
