import { Navigate, Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/giris" replace />
  return children
}

export function PanelPage() {
  const { user } = useAuth()

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Merhaba, {user?.fullName}</h1>
        <p className="muted">Hizmetlerinize buradan devam edin.</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Link className="panel" to="/borclar">
          <h3>Borçlarım</h3>
          <p className="muted">Ödeme ve gecikme faizini görüntüle</p>
        </Link>
        <Link className="panel" to="/talepler">
          <h3>Taleplerim</h3>
          <p className="muted">Hizmet masası kayıtları</p>
        </Link>
        <Link className="panel" to="/ulasim">
          <h3>Ulaşım kartım</h3>
          <p className="muted">Bakiye ve biniş işlemleri</p>
        </Link>
      </div>
    </div>
  )
}
