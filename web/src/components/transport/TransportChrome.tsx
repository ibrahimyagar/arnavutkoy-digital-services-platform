import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { TRANSPORT_CONTINUE, TRANSPORT_NAV } from '../../lib/transportNav'
import { loginPath } from '../../lib/returnUrl'
import './transport-chrome.css'

export function TransportNav() {
  const { pathname, hash } = useLocation()
  const { isAuthenticated } = useAuth()

  return (
    <nav className="tx-nav" aria-label="Ulaşım">
      {TRANSPORT_NAV.map((item) => {
        const hrefBase = !item.auth || isAuthenticated ? item.to : loginPath(item.to)
        const href = item.hash ? `${hrefBase}${item.hash}` : hrefBase
        const active = item.hash
          ? pathname === item.to && hash === item.hash
          : item.to === '/ulasim-agi'
            ? pathname === '/ulasim-agi' && hash !== '#harita'
            : pathname === item.to || pathname.startsWith(`${item.to}/`)
        return (
          <Link
            key={`${item.to}${item.hash}${item.label}`}
            to={href}
            className={active ? 'is-on' : ''}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function TransportContinue({ exclude }: { exclude?: string }) {
  const { isAuthenticated } = useAuth()
  const items = TRANSPORT_CONTINUE.filter((item) => item.to !== exclude)
  return (
    <nav className="tx-continue" aria-label="Yolculuğunuz için">
      <header>
        <p className="tx-kicker">Yolculuğunuz için</p>
        <h2>Nereye devam edelim?</h2>
      </header>
      <div>
        {items.map((item, index) => {
          const needsAuth = item.to === '/ulasim' || item.to === '/binis' || item.to === '/vezne'
          const href = !needsAuth || isAuthenticated ? item.to : loginPath(item.to)
          return (
            <Link key={item.to} to={href}>
              <em>
                {String(index + 1).padStart(2, '0')} · {item.kicker}
              </em>
              <strong>{item.title}</strong>
              <span>{item.hint}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
