import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Resets window scroll on normal route navigations (PUSH/REPLACE).
 * Skips browser back/forward (POP). Honors same-document hash targets.
 */
export function ScrollToTop() {
  const { pathname, hash, key } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType === 'POP') return

    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      const target = id ? document.getElementById(id) : null
      if (target) {
        target.scrollIntoView()
        return
      }
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash, key, navigationType])

  return null
}
