import { useEffect, useId, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiFetch, type CitizenRequestSummary, type Debt, type Paginated } from '../lib/api'
import { getSidebarSections } from '../lib/modules'
import { isAdmin, isStaff } from '../lib/roles'
import { BrandLogo } from './BrandLogo'
import { getMegaMenuLayout, MegaMenu } from './MegaMenu'
import { SiteFooter } from './SiteFooter'
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

  const mega = useMemo(
    () =>
      getMegaMenuLayout({
        isAuthenticated,
        isCitizen: citizen,
        isStaff: staff,
        isAdmin: admin,
        sections,
      }),
    [isAuthenticated, citizen, staff, admin, sections],
  )

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
    document.body.classList.toggle('shell-home-landing', onHome)
    return () => document.body.classList.remove('shell-home-landing')
  }, [onHome])

  useEffect(() => {
    document.body.classList.toggle('shell-menu-lock', menuOpen)
    return () => document.body.classList.remove('shell-menu-lock')
  }, [menuOpen])

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

  function openCategory(categoryId: string) {
    if (categoryId === 'iletisim') {
      setMenuOpen(false)
      return
    }
    setMenuOpen(true)
    requestAnimationFrame(() => {
      document.getElementById(`mega-col-${categoryId}`)?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    })
  }

  return (
    <div className={`shell${onHome ? ' shell--home' : ''}${menuOpen ? ' is-menu-open' : ''}`}>
      <div className="shell-frame">
        {!onHome ? (
          <header className="shell-header">
            <div className="shell-header-inner">
              <Link to="/" className="brand brand-top">
                <BrandLogo className="brand-mark" />
                <span className="brand-copy">
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
                    <Link className="btn btn-ghost shell-btn-register" to="/kayit">
                      Kayıt ol
                    </Link>
                    <Link className="btn btn-primary" to="/giris">
                      Giriş yap
                    </Link>
                  </>
                )}

                <button
                  type="button"
                  className={`shell-menu-toggle${menuOpen ? ' is-open' : ''}`}
                  aria-expanded={menuOpen}
                  aria-controls={menuId}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <span className="shell-menu-toggle-label">{menuOpen ? 'Kapat' : 'Menü'}</span>
                  <span className="shell-menu-icon" aria-hidden data-open={menuOpen} />
                </button>
              </div>
            </div>

            <nav className="shell-cats" aria-label="Kategoriler">
              <div className="shell-cats-inner">
                {mega.categories.map((cat) =>
                  cat.id === 'iletisim' ? (
                    <Link key={cat.id} to="/iletisim" className="shell-cat">
                      {cat.title}
                    </Link>
                  ) : (
                    <button
                      key={cat.id}
                      type="button"
                      className={`shell-cat${menuOpen ? ' is-active' : ''}`}
                      onClick={() => openCategory(cat.id)}
                    >
                      {cat.title}
                    </button>
                  ),
                )}
              </div>
            </nav>

            <MegaMenu
              open={menuOpen}
              menuId={menuId}
              columns={mega.columns}
              shortcuts={mega.shortcuts}
              onClose={() => setMenuOpen(false)}
            />
          </header>
        ) : null}

        {menuOpen && !onHome ? (
          <button
            type="button"
            className="shell-veil is-open"
            aria-label="Menüyü kapat"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <main className={`shell-main${onHome ? ' shell-main--home' : ''}`}>
          <Outlet />
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}
