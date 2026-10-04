import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

/** Gap kept between a menu and the edge of the visible screen. */
const EDGE = 8
/** Gap between the anchor and the menu, as drawn (4 px). */
const OFFSET = 4

export interface MenuPlacement {
  /** Opens below the anchor unless there is too little room below and more above. */
  side: 'below' | 'above'
  style: CSSProperties
}

/**
 * Keeps an anchored menu inside the visible screen: it opens upward when there isn't room below, gets a
 * max-height so long lists scroll, and a max-width and left shift so wide options stay on screen.
 * The menu is positioned against `anchor` (position: relative) and must render while `open` is true.
 */
export function useMenuPlacement(
  open: boolean,
  anchor: RefObject<HTMLElement | null>,
  menu: RefObject<HTMLElement | null>,
  /** Upper limit on the menu height, when its design sets one. */
  maxHeightCap = Infinity,
): MenuPlacement {
  const [placement, setPlacement] = useState<MenuPlacement>({ side: 'below', style: {} })

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const a = anchor.current
      const m = menu.current
      if (!a || !m) return
      const rect = a.getBoundingClientRect()
      const vw = document.documentElement.clientWidth || window.innerWidth
      const vh = window.innerHeight
      // jsdom and hidden frames report no layout; leave the menu where CSS puts it.
      if (!vw || !vh || (rect.width === 0 && rect.height === 0)) return
      const below = vh - rect.bottom - OFFSET - EDGE
      const above = rect.top - OFFSET - EDGE
      const natural = m.scrollHeight
      const side = natural > below && above > below ? 'above' : 'below'
      const maxWidth = vw - 2 * EDGE
      const width = Math.min(m.scrollWidth, maxWidth)
      const overflowRight = rect.left + width - (vw - EDGE)
      const shift = overflowRight > 0 ? -Math.min(overflowRight, rect.left - EDGE) : 0
      setPlacement({
        side,
        style: {
          maxHeight: Math.min(maxHeightCap, Math.max(120, side === 'above' ? above : below)),
          maxWidth,
          overflowY: 'auto',
          ...(shift ? { left: shift } : {}),
          ...(side === 'above' ? { top: 'auto', bottom: `calc(100% + ${OFFSET}px)` } : {}),
        },
      })
    }
    place()
    // Results that change while the menu is open (typing in a search) change its natural height.
    const mutation = typeof MutationObserver === 'undefined' || !menu.current ? null : new MutationObserver(place)
    if (menu.current) mutation?.observe(menu.current, { childList: true })
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      mutation?.disconnect()
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, anchor, menu, maxHeightCap])

  return open ? placement : { side: 'below', style: {} }
}
