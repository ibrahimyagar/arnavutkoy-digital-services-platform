import { useLayoutEffect, useState, useEffect, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigationType } from 'react-router-dom'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * Global route scroll reset: PUSH/REPLACE → top (or hash target).
 * Browser POP left alone. Same-route filters/search do not force top.
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
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, hash, key, navigationType])

  return null
}

/**
 * Subtle entrance polish around the routed page.
 * Pathname-only: search/filter on same route does not re-animate.
 */
export function RouteTransitionOutlet({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const reducedMotion = usePrefersReducedMotion()
  const animate = navigationType !== 'POP' && !reducedMotion

  const className = animate ? 'shell-route-enter' : undefined

  return (
    <div key={pathname} className={className}>
      {children ?? <Outlet />}
    </div>
  )
}
