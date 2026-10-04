import { useMemo } from 'react'

/** Reads resolved custom property values from :root so the showcase never duplicates token values. */
export function useCssVars(names: readonly string[]): Record<string, string> {
  const key = names.join('|')
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    return Object.fromEntries(key.split('|').map((n) => [n, style.getPropertyValue(n).trim()]))
  }, [key])
}
