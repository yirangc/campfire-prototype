/*
 * Metadata for the showcase. Values are NOT repeated here: the showcase reads them from the CSS custom
 * properties in src/tokens/tokens.css at runtime, so tokens.css stays the single source of truth.
 */

export type Evidence = 'observed' | 'inferred' | 'suggested' | 'proposed'

export interface ColorToken {
  variable: string
  name: string
  role: string
  evidence: Evidence
}

export const OBSERVED_COLORS: ColorToken[] = [
  { variable: '--color-text-primary', name: 'Primary / ink', role: 'Text, primary actions', evidence: 'observed' },
  { variable: '--color-text-secondary', name: 'Secondary / text', role: 'Labels, navigation, icons', evidence: 'observed' },
  { variable: '--color-text-muted', name: 'Muted / text', role: 'Supporting copy', evidence: 'observed' },
  { variable: '--color-border-default', name: 'Border', role: 'Controls, table rules', evidence: 'observed' },
  { variable: '--color-surface-white', name: 'Surface / white', role: 'Cards, inputs, modal', evidence: 'observed' },
  { variable: '--color-surface-sidebar', name: 'Surface / sidebar', role: 'Navigation background', evidence: 'observed' },
  { variable: '--color-surface-subtle', name: 'Surface / subtle', role: 'Headers, breadcrumb', evidence: 'observed' },
  { variable: '--color-selection-neutral', name: 'Neutral selection', role: 'Reporting navigation', evidence: 'observed' },
  { variable: '--color-accent-lime', name: 'Accent / lime', role: 'Dashboard selection', evidence: 'observed' },
  { variable: '--color-focus-lime', name: 'Focus / lime', role: 'Focus stroke and soft ring (Field/Focus)', evidence: 'observed' },
  { variable: '--color-success-ink', name: 'Success / ink', role: 'Positive trend', evidence: 'observed' },
  { variable: '--color-success-surface', name: 'Success / tint', role: 'Trend badge background', evidence: 'observed' },
  { variable: '--color-brand-orange', name: 'Brand / orange', role: 'Campfire rays', evidence: 'observed' },
  { variable: '--color-chart-lime', name: 'Chart / lime', role: 'Revenue area', evidence: 'observed' },
  { variable: '--color-chart-green', name: 'Chart / green', role: 'Revenue line', evidence: 'observed' },
  { variable: '--color-shell-purple', name: 'Shell / purple', role: 'Outer dashboard surround', evidence: 'observed' },
]

export const EXTRA_COLORS: ColorToken[] = [
  { variable: '--color-focus', name: 'Focus / outline', role: 'Alias of focus lime, used by every focus outline and focused input border', evidence: 'observed' },
  { variable: '--color-surface-canvas', name: 'Surface / canvas', role: 'Documentation canvas (bound variable, not in the palette)', evidence: 'observed' },
  { variable: '--color-brand-wordmark', name: 'Brand / wordmark', role: 'Logo wordmark (stated in Figma copy)', evidence: 'observed' },
  { variable: '--color-scrim', name: 'Scrim', role: 'Modal backdrop', evidence: 'proposed' },
]

export const GRAYS = ['100', '300', '400', '600', '700', '900'].map((step) => ({
  variable: `--color-gray-${step}`,
  name: `Gray ${step}`,
}))

export const TYPE_STYLES = [
  { role: 'Page title', className: 'cf-text-page-title', sample: 'Income Statement', spec: '20 / 28 px · 600', use: 'Page and modal headings' },
  { role: 'Metric value', className: 'cf-text-metric', sample: '$3.13M', spec: '28 / 34 px · 600 · −0.8 px', use: 'Revenue and ARR' },
  { role: 'Navigation / table', className: 'cf-text-body', sample: 'Financial Statements', spec: '12 / 18 px · 400', use: 'Navigation and table rows' },
  { role: 'Control / label', className: 'cf-text-body-medium', sample: 'Number', spec: '12 / 18 px · 500', use: 'Inputs, filters, buttons' },
  { role: 'Caption / metadata', className: 'cf-text-caption', sample: 'REVENUE', spec: '11 / 16 px · 400', use: 'Account labels, badges, helper text' },
]

export const SPACING = [2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 48]
export const DOCUMENTED_SPACING = new Set([4, 8, 12, 16, 24, 32, 48])

export const RADII = [
  { variable: '--radius-4', label: 'Small / 4 px', use: 'Nav items, breadcrumb pill, menu options' },
  { variable: '--radius-6', label: 'Control / 6 px', use: 'Buttons, inputs, dropdowns' },
  { variable: '--radius-8', label: 'Card / 8 px', use: 'Cards, panels' },
  { variable: '--radius-10', label: 'Modal / 10 px', use: 'Dialog' },
  { variable: '--radius-pill', label: 'Pill / 100 px', use: 'Trend badge' },
]

export const SHADOWS = [
  { variable: '--shadow-card', label: 'Card · 0 2 5 · 5%', evidence: 'inferred' as Evidence },
  { variable: '--shadow-modal', label: 'Modal · 0 12 32 · 15%', evidence: 'inferred' as Evidence },
  { variable: '--shadow-focus-ring', label: 'Focus ring · lime 50%, 2 px spread outside the control', evidence: 'proposed' as Evidence },
]

export const DIMENSIONS = [
  ['--size-control', 'Buttons, dropdowns'],
  ['--size-field', 'Text inputs'],
  ['--size-table-row', 'Financial table rows'],
  ['--size-table-header', 'Financial table header'],
  ['--size-allocation-row', 'Allocation rows and cells'],
  ['--size-allocation-header', 'Allocation header'],
  ['--size-nav-row', 'Navigation rows'],
  ['--size-nav-item', 'Navigation row width'],
  ['--size-sidebar', 'Side panel width'],
  ['--size-badge', 'Trend badge'],
  ['--size-modal', 'Dialog width'],
] as const
