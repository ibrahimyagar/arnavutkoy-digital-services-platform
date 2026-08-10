import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './shell.css'

export function AppShell() {
  const { user, isAuthenticated, logout } = useAuth()

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

          <nav className="shell-nav" aria-label="Ana menü">
            <NavLink to="/duyurular">Duyurular</NavLink>
            <NavLink to="/hatlar">Hatlar</NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/panel">Panel</NavLink>
                <NavLink to="/borclar">Borçlar</NavLink>
                <NavLink to="/talepler">Talepler</NavLink>
                <NavLink to="/ulasim">Ulaşım</NavLink>
                <NavLink to="/mulkler">Mülkler</NavLink>
                <NavLink to="/su">Su</NavLink>
              </>
            ) : null}
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
