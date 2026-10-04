/*
 * Asset manifest. Every logo and icon used by the system is listed here with its Figma source node,
 * so files can be exported 1:1 and checked against their intended dimensions.
 *
 * Files live in src/assets/icons and src/assets/brand. Icons are generated from the Figma vector data by
 * scripts/figma/build-icons.mjs; Figma labels every icon a screenshot-derived reconstruction, not original
 * Campfire artwork. A missing file renders a labelled placeholder at the exact Figma size instead of a
 * substitute glyph (see components/Icon and components/Logo).
 */

export const FIGMA_FILE_KEY = 'M4alZ0UMg6muqKn7l2WaXW'

export const figmaNodeUrl = (nodeId: string) =>
  `https://www.figma.com/design/${FIGMA_FILE_KEY}/Campfire-take-home?node-id=${nodeId.replace(':', '-')}`

/**
 * How Figma classifies each icon. "suggested" icons are utility additions not seen in the product screenshots.
 * "unclassified" icons were added to the icon grid later without an evidence note (lock).
 */
export type IconEvidence = 'observed' | 'suggested' | 'unclassified'

export interface IconSpec {
  /** File name without extension: src/assets/icons/{name}.svg */
  name: string
  label: string
  nodeId: string
  evidence: IconEvidence
  /** Share of the 24 px canvas the artwork occupies, from the Figma component description. */
  artwork?: '75%' | '62.5%'
}

export const ICONS = [
  { name: 'home', label: 'Home', nodeId: '12:12143', evidence: 'observed', artwork: '75%' },
  { name: 'chart', label: 'Financial statements', nodeId: '12:12144', evidence: 'observed', artwork: '75%' },
  { name: 'revenue', label: 'Revenue', nodeId: '12:12145', evidence: 'observed', artwork: '75%' },
  { name: 'accounting', label: 'Accounting', nodeId: '12:12146', evidence: 'observed', artwork: '75%' },
  { name: 'wallet', label: 'Cash management', nodeId: '12:12147', evidence: 'observed', artwork: '75%' },
  { name: 'ember', label: 'Ember AI', nodeId: '12:12148', evidence: 'observed', artwork: '75%' },
  { name: 'chevron-down', label: 'Chevron down', nodeId: '12:12149', evidence: 'observed', artwork: '62.5%' },
  { name: 'chevron-right', label: 'Chevron right', nodeId: '12:12150', evidence: 'observed', artwork: '62.5%' },
  { name: 'chevron-up', label: 'Chevron up', nodeId: '12:12151', evidence: 'observed', artwork: '62.5%' },
  { name: 'chevrons-up-down', label: 'Select indicator', nodeId: '12:12152', evidence: 'observed', artwork: '62.5%' },
  { name: 'calendar', label: 'Date range', nodeId: '12:12153', evidence: 'observed' },
  { name: 'filter', label: 'Filters', nodeId: '12:12154', evidence: 'observed' },
  { name: 'save', label: 'Save report', nodeId: '12:12155', evidence: 'observed' },
  { name: 'trash', label: 'Delete', nodeId: '12:12156', evidence: 'observed' },
  { name: 'plus', label: 'Add row', nodeId: '12:12157', evidence: 'observed' },
  { name: 'x', label: 'Remove / close', nodeId: '12:12158', evidence: 'observed' },
  { name: 'arrow-up', label: 'Positive trend', nodeId: '12:12159', evidence: 'observed' },
  { name: 'arrow-up-right', label: 'Open / expand', nodeId: '12:12160', evidence: 'observed' },
  { name: 'edit', label: 'Edit', nodeId: '12:12161', evidence: 'suggested' },
  { name: 'download', label: 'Download', nodeId: '12:12162', evidence: 'suggested' },
  { name: 'search', label: 'Search', nodeId: '12:12163', evidence: 'suggested' },
  { name: 'check', label: 'Check', nodeId: '12:12164', evidence: 'suggested' },
  { name: 'panel', label: 'Panel', nodeId: '12:12165', evidence: 'suggested', artwork: '75%' },
  { name: 'settings', label: 'Settings', nodeId: '12:12166', evidence: 'suggested' },
  { name: 'help', label: 'Help', nodeId: '12:12167', evidence: 'suggested' },
  { name: 'lock', label: 'Lock', nodeId: '38:7923', evidence: 'unclassified' },
] as const satisfies readonly IconSpec[]

export type IconName = (typeof ICONS)[number]['name']

/** Icon box sizes used inside components. The 24 px canvas is the canonical export. */
export type IconSize = 10 | 12 | 14 | 16 | 24

export const BRAND = {
  logo: {
    file: 'campfire-logo.png',
    nodeId: '12:12168',
    width: 138,
    height: 32,
    source: 'Supplied PNG, 552 × 128 px (4x export of the 138 × 32 layer), transparent background',
  },
  mark: {
    file: 'campfire-mark.png',
    nodeId: '12:12169',
    width: 26,
    height: 32,
    source: 'Supplied PNG, 104 × 128 px (4x export of the 26 × 32 layer), transparent background',
  },
} as const

const iconFiles = import.meta.glob<string>('./icons/*.svg', { eager: true, query: '?raw', import: 'default' })
const brandFiles = import.meta.glob<string>('./brand/*.png', { eager: true, query: '?url', import: 'default' })

/**
 * Resolve an icon's SVG markup. A size-specific file (e.g. chevron-down-12.svg) wins over the 24 px canvas,
 * so each size keeps Figma's 1.5 px stroke instead of scaling it down.
 */
export function iconSvg(name: IconName, size: IconSize): string | undefined {
  return iconFiles[`./icons/${name}-${size}.svg`] ?? iconFiles[`./icons/${name}.svg`]
}

export function brandUrl(kind: keyof typeof BRAND): string | undefined {
  return brandFiles[`./brand/${BRAND[kind].file}`]
}

/**
 * Status glyphs drawn locally inside the Reconcile mockups (see src/assets/status/README.md).
 * They keep their drawn colors and are not part of the Campfire icon set.
 */
export const STATUS_GLYPHS = {
  'info-20': { nodeId: '38:6881', size: 20 },
  'info-14': { nodeId: 'I28:8871;38:5420', size: 14 },
  'warning-16': { nodeId: '51:1042', size: 16 },
  'warning-14': { nodeId: '49:795', size: 14 },
  'sparkle-16': { nodeId: '49:968', size: 16 },
  'sparkle-14': { nodeId: '49:963', size: 14 },
  'check-14': { nodeId: '47:629', size: 14 },
} as const

export type StatusGlyphName = keyof typeof STATUS_GLYPHS

const statusFiles = import.meta.glob<string>('./status/*.svg', { eager: true, query: '?raw', import: 'default' })

export function statusGlyphSvg(name: StatusGlyphName): string | undefined {
  return statusFiles[`./status/${name}.svg`]
}
