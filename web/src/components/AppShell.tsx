import { useEffect, useId, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { isAdmin, isStaff } from '../lib/roles'
import './shell.css'

export function AppShell() {
  const { user, isAuthenticated, logout } = useAuth()
  const staff = isStaff(user?.roles)
  const admin = isAdmin(user?.roles)
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()

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

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="container shell-header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden />
            <span>
              <strong>Arnavutköy</strong>
              <small>Dijital Hizmetler</small>
            </span>
          </Link>

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

          <div id={menuId} className={`shell-menu ${menuOpen ? 'is-open' : ''}`}>
            <nav className="shell-nav" aria-label="Ana menü">
              <NavLink to="/duyurular">Duyurular</NavLink>
              <NavLink to="/hatlar">Hatlar</NavLink>
              {isAuthenticated ? <NavLink to="/panel">Panel</NavLink> : null}
              {staff ? <NavLink to="/personel">Personel</NavLink> : null}
              {admin ? <NavLink to="/cografya">Coğrafya</NavLink> : null}
            </nav>

            <div className="shell-actions">
              {isAuthenticated ? (
                <>
                  <span className="shell-user">{user?.fullName}</span>
                  <button type="button" className="btn btn-ghost" onClick={() => void logout()}>
                    Çıkış
                  </button>
                </>
              ) : (
                <Link className="btn btn-primary" to="/giris">
                  Giriş yap
                </Link>
              )}
            </div>
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
  )
}
