import { useEffect, useId, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
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
  const menuId = useId()

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

  return (
    <div className={`shell ${menuOpen ? 'is-drawer-open' : ''}`}>
      <aside id={menuId} className={`shell-sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Yan menü">
        <div className="shell-sidebar-inner">
          <Link to="/" className="brand brand-sidebar" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark" aria-hidden />
            <span>
              <strong>Arnavutköy</strong>
              <small>e-Belediye</small>
            </span>
          </Link>

          <nav className="side-nav" aria-label="Modüller">
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

          {isAuthenticated ? (
            <div className="side-nav-footer">
              <p className="side-nav-user">{user?.fullName}</p>
              <button type="button" className="btn btn-ghost side-logout" onClick={() => void logout()}>
                Çıkış yap
              </button>
              <div className="sidebar-cta">
                <strong>Belediye iletişim</strong>
                <p>Demo çağrı merkezi hattı — gerçek kurum değildir.</p>
                <a className="btn btn-primary" href="tel:+902126000000">
                  0212 600 00 00
                </a>
              </div>
            </div>
          ) : (
            <div className="sidebar-cta">
              <strong>Belediye iletişim</strong>
              <p>Demo çağrı merkezi hattı — gerçek kurum değildir.</p>
              <a className="btn btn-primary" href="tel:+902126000000">
                0212 600 00 00
              </a>
            </div>
          )}
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

      <div className="shell-frame">
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
                <small>Dijital Hizmetler</small>
              </span>
            </Link>

            <div className="shell-actions">
              {isAuthenticated ? (
                <>
                  <span className="shell-user">{user?.fullName}</span>
                  <Link className="btn btn-ghost" to="/panel">
                    Panel
                  </Link>
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

        <main className="shell-main">
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
