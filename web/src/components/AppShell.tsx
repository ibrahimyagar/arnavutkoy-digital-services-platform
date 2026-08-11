import { useEffect, useId, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiFetch, type CitizenRequestSummary, type Debt, type Paginated } from '../lib/api'
import { getSidebarSections } from '../lib/modules'
import { isAdmin, isStaff } from '../lib/roles'
import './shell.css'

export function AppShell() {
  const { user, isAuthenticated, logout } = useAuth()
  const staff = isStaff(user?.roles)
  const admin = isAdmin(user?.roles)
  const citizen = isAuthenticated && !staff
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const menuId = useId()
  const onPanel = location.pathname === '/panel'
  const onHome = location.pathname === '/'

  const sections = getSidebarSections({
    isAuthenticated,
    isCitizen: citizen,
    isStaff: staff,
    isAdmin: admin,
  })

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useEffect(() => {
    document.body.classList.toggle('shell-drawer-open', menuOpen)
    return () => document.body.classList.remove('shell-drawer-open')
  }, [menuOpen])

  useEffect(() => {
    document.body.classList.toggle('shell-home-landing', onHome)
    return () => document.body.classList.remove('shell-home-landing')
  }, [onHome])

  useEffect(() => {
    if (!isAuthenticated) {
      setAlertCount(0)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        if (staff) {
          const [requests, aid] = await Promise.all([
            apiFetch<Paginated<CitizenRequestSummary>>(
              '/api/v1/citizen-requests?pageSize=100',
              {},
              true,
            ),
            apiFetch<Paginated<{ status: string }>>(
              '/api/v1/social-assistance?pageSize=100',
              {},
              true,
            ),
          ])
          const openReq = requests.items.filter(
            (r) => r.status === 'Pending' || r.status === 'UnderReview',
          ).length
          const openAid = aid.items.filter(
            (a) => a.status === 'Submitted' || a.status === 'UnderReview',
          ).length
          if (!cancelled) setAlertCount(openReq + openAid)
          return
        }

        const [debts, requests] = await Promise.all([
          apiFetch<Paginated<Debt>>('/api/v1/debts/mine?pageSize=50', {}, true),
          apiFetch<Paginated<CitizenRequestSummary>>(
            '/api/v1/citizen-requests/mine?pageSize=50',
            {},
            true,
          ),
        ])
        const openDebts = debts.items.filter((d) => d.status !== 'Paid').length
        const openReq = requests.items.filter(
          (r) => r.status === 'Pending' || r.status === 'UnderReview',
        ).length
        if (!cancelled) setAlertCount(openDebts + openReq)
      } catch {
        if (!cancelled) setAlertCount(0)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, staff, location.pathname])

  return (
    <div className={`shell${onHome ? ' shell--home' : ''}${menuOpen ? ' is-drawer-open' : ''}`}>
      {!onHome ? (
        <>
          <aside
            id={menuId}
            className={`shell-sidebar ${menuOpen ? 'is-open' : ''}`}
            aria-label="Yan menü"
          >
            <div className="shell-sidebar-inner">
              <Link to="/" className="brand brand-sidebar" onClick={() => setMenuOpen(false)}>
                <span className="brand-mark" aria-hidden />
                <span>
                  <strong>Arnavutköy</strong>
                  <small>Belediyesi</small>
                </span>
              </Link>

              <nav className="side-nav" aria-label="Ana menü">
                {sections.map((section) => (
                  <div key={section.id} className="side-nav-section">
                    <p className="side-nav-label">{section.title}</p>
                    <ul>
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <NavLink
                            to={item.to}
                            end={item.to === '/'}
                            onClick={() => setMenuOpen(false)}
                          >
                            {item.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              <div className="side-nav-footer">
                {isAuthenticated ? (
                  <p className="side-nav-user">{user?.fullName}</p>
                ) : (
                  <p className="side-nav-hint muted">
                    <Link to="/iletisim">İletişim</Link>
                  </p>
                )}
              </div>
            </div>
          </aside>

          {menuOpen ? (
            <button
              type="button"
              className="shell-backdrop"
              aria-label="Menüyü kapat"
              onClick={() => setMenuOpen(false)}
            />
          ) : null}
        </>
      ) : null}

      <div className="shell-frame">
        {!onHome ? (
          <header className="shell-header">
            <div className="shell-header-inner">
              <button
                type="button"
                className="shell-menu-toggle"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="sr-only">{menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}</span>
                <span className="shell-menu-icon" aria-hidden data-open={menuOpen} />
              </button>

              <Link to="/" className="brand brand-top">
                <span className="brand-mark" aria-hidden />
                <span>
                  <strong>Arnavutköy</strong>
                  <small>Belediyesi</small>
                </span>
              </Link>

              <div className="shell-actions">
                {isAuthenticated ? (
                  <>
                    <span className="shell-user">{user?.fullName}</span>
                    <Link
                      className={`shell-notify${alertCount > 0 ? ' has-alerts' : ''}`}
                      to="/panel"
                      aria-label={
                        alertCount > 0 ? `${alertCount} dikkat gerektiren kayıt` : 'Panele git'
                      }
                    >
                      <span className="shell-notify-dot" aria-hidden />
                      {alertCount > 0 ? <em>{alertCount > 9 ? '9+' : alertCount}</em> : null}
                    </Link>
                    {!onPanel ? (
                      <Link className="btn btn-ghost" to="/panel">
                        Panel
                      </Link>
                    ) : null}
                    <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                      Çıkış
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="btn btn-ghost" to="/kayit">
                      Kayıt ol
                    </Link>
                    <Link className="btn btn-primary" to="/giris">
                      Giriş yap
                    </Link>
                  </>
                )}
              </div>
            </div>
          </header>
        ) : null}

        <main className={`shell-main${onHome ? ' shell-main--home' : ''}`}>
          <Outlet />
        </main>

        <footer className="shell-footer">
          <div className="container">
            <p>
              Bağımsız portföy/demo çalışmasıdır; gerçek Arnavutköy Belediyesi ile resmi bağlantısı
              yoktur. Tüm veriler kurgusaldır.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

