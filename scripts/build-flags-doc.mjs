// Writes docs/design-flags.md from src/showcase/flags.ts so the two stay in sync.
// Usage: node --experimental-strip-types scripts/build-flags-doc.mjs   (Node 22.6 or newer)
import { writeFileSync } from 'node:fs'
const { CONFLICTS, UNDOCUMENTED, ACCESSIBILITY, UNVERIFIED } = await import('../src/showcase/flags.ts')

const list = (items) => items.map((i) => `- ${i}`).join('\n')
const md = `# Design flags

Conflicts in the Figma references, choices Figma does not document, accessibility concerns, and what could not be verified. The showcase renders the same list from src/showcase/flags.ts; regenerate this file with \`npm run flags:doc\` after editing it. For the subset that affects the prototype, with recommendations, see prototype-decisions.md.

## Conflicts between references

${list(CONFLICTS)}

## Undocumented choices

${list(UNDOCUMENTED)}

## Accessibility concerns in the designs

${list(ACCESSIBILITY)}

## Not verified

${list(UNVERIFIED)}
`
writeFileSync(new URL('../docs/design-flags.md', import.meta.url), md)
console.log('Wrote docs/design-flags.md')
