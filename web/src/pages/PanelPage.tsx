import { Navigate, Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/giris" replace />
  return children
}

function isStaff(roles: string[] | undefined) {
  return Boolean(roles?.includes('Officer') || roles?.includes('Administrator'))
}

export function PanelPage() {
  const { user } = useAuth()
  const staff = isStaff(user?.roles)

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Merhaba, {user?.fullName}</h1>
        <p className="muted">
          {staff
            ? 'Personel olarak talepleri ve başvuruları yönetebilirsiniz.'
            : 'Hizmetlerinize buradan devam edin.'}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {staff ? (
          <>
            <Link className="panel" to="/personel">
              <h3>Personel masası</h3>
              <p className="muted">Talep ve sosyal yardım değerlendirme</p>
            </Link>
            <Link className="panel" to="/duyurular">
              <h3>Duyurular</h3>
              <p className="muted">Yayımlanan duyuruları gör</p>
            </Link>
          </>
        ) : (
          <>
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
            <Link className="panel" to="/mulkler">
              <h3>Mülklerim</h3>
              <p className="muted">Mahalle bazlı kayıtlar</p>
            </Link>
            <Link className="panel" to="/su">
              <h3>Su aboneliği</h3>
              <p className="muted">Abone no ve durum</p>
            </Link>
            <Link className="panel" to="/yardim">
              <h3>Sosyal yardım</h3>
              <p className="muted">Başvuru ve durum takibi</p>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
