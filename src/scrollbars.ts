/**
 * Scrollbars (Yirang, 2026-10-05). The page always reserves the scrollbar's gutter (index.css), so a scrollbar
 * appearing or disappearing never shifts the layout. Where the system draws classic, always-on scrollbars, they are
 * hidden while idle and shown while scrolling or when the pointer is near a scroll area's edge. The scrollbars stay
 * native: same width, dragging and keyboard scrolling are unchanged, and only the thumb color changes.
 *
 * Left alone: overlay scrollbars (they already appear and fade natively), browsers without `scrollbar-color`, and
 * users who ask for forced colors or more contrast.
 */
const EDGE = 24 // px from a scroll area's edge that counts as "near"
const IDLE = 1000 // ms after the last scroll or nearby movement before the scrollbar fades

export function initScrollbars(doc: Document = document) {
  const win = doc.defaultView
  if (!win || typeof CSS === 'undefined' || !CSS.supports('scrollbar-color', 'auto')) return
  if (win.matchMedia('(forced-colors: active), (prefers-contrast: more)').matches) return
  if (!hasClassicScrollbars(doc)) return

  const root = doc.documentElement
  root.dataset.scrollbarFade = ''
  const timers = new Map<Element, number>()
  const show = (el: Element) => {
    el.setAttribute('data-scrollbar-visible', '')
    win.clearTimeout(timers.get(el))
    timers.set(
      el,
      win.setTimeout(() => {
        el.removeAttribute('data-scrollbar-visible')
        timers.delete(el)
      }, IDLE),
    )
  }

  doc.addEventListener('scroll', (e) => show(e.target === doc ? root : (e.target as Element)), { capture: true, passive: true })
  doc.addEventListener('pointermove', (e) => {
    const el = scrollerNearPointer(doc, e)
    if (el) show(el)
  }, { passive: true })
}

function hasClassicScrollbars(doc: Document) {
  const probe = doc.createElement('div')
  probe.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll'
  doc.body.append(probe)
  const width = probe.offsetWidth - probe.clientWidth
  probe.remove()
  return width > 0
}

/** The innermost scroll area whose right or bottom edge is within EDGE px of the pointer, including the page. */
function scrollerNearPointer(doc: Document, e: PointerEvent): Element | null {
  const win = doc.defaultView!
  for (let el = e.target instanceof Element ? e.target : null; el && el !== doc.documentElement; el = el.parentElement) {
    const style = win.getComputedStyle(el)
    const scrollsY = el.scrollHeight > el.clientHeight && /auto|scroll/.test(style.overflowY)
    const scrollsX = el.scrollWidth > el.clientWidth && /auto|scroll/.test(style.overflowX)
    if (!scrollsY && !scrollsX) continue
    const rect = el.getBoundingClientRect()
    if ((scrollsY && rect.right - e.clientX <= EDGE) || (scrollsX && rect.bottom - e.clientY <= EDGE)) return el
  }
  const root = doc.documentElement
  const pageY = root.scrollHeight > root.clientHeight && e.clientX >= root.clientWidth - EDGE
  const pageX = root.scrollWidth > root.clientWidth && e.clientY >= root.clientHeight - EDGE
  return pageY || pageX ? root : null
}
