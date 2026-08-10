import { Navigate, Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { isAdmin, isStaff } from '../lib/roles'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/giris" replace />
  return children
}

export function PanelPage() {
  const { user } = useAuth()
  const staff = isStaff(user?.roles)
  const admin = isAdmin(user?.roles)

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Merhaba, {user?.fullName}</h1>
        <p className="muted">
          {admin
            ? 'Yönetici olarak coğrafya, duyuru ve personel işlemlerini buradan yönetin.'
            : staff
              ? 'Personel araçlarına panelden ulaşın; üst menü sade tutuldu.'
              : 'Hizmetlerinize buradan devam edin. Üst menüde Panel kısayolu yeterlidir.'}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {admin ? (
          <>
            <Link className="panel" to="/cografya">
              <h3>Coğrafya</h3>
              <p className="muted">İlçe, mahalle ve sokak yönetimi</p>
            </Link>
            <Link className="panel" to="/personel">
              <h3>Personel masası</h3>
              <p className="muted">Talep ve sosyal yardım değerlendirme</p>
            </Link>
            <Link className="panel" to="/su-yonetimi">
              <h3>Su yönetimi</h3>
              <p className="muted">Abonelik durumu ve borç kesme</p>
            </Link>
            <Link className="panel" to="/mulk-yonetimi">
              <h3>Mülk yönetimi</h3>
              <p className="muted">Emlak vergisi borcu kesme</p>
            </Link>
            <Link className="panel" to="/duyuru-yonetimi">
              <h3>Duyuru yönetimi</h3>
              <p className="muted">Taslak, yayın ve arşiv</p>
            </Link>
            <Link className="panel" to="/talepler">
              <h3>Talepler</h3>
              <p className="muted">Tüm hizmet talepleri</p>
            </Link>
          </>
        ) : staff ? (
          <>
            <Link className="panel" to="/personel">
              <h3>Personel masası</h3>
              <p className="muted">Talep ve sosyal yardım değerlendirme</p>
            </Link>
            <Link className="panel" to="/su-yonetimi">
              <h3>Su yönetimi</h3>
              <p className="muted">Abonelik durumu ve borç kesme</p>
            </Link>
            <Link className="panel" to="/mulk-yonetimi">
              <h3>Mülk yönetimi</h3>
              <p className="muted">Emlak vergisi borcu kesme</p>
            </Link>
            <Link className="panel" to="/duyuru-yonetimi">
              <h3>Duyuru yönetimi</h3>
              <p className="muted">Taslak, yayın ve arşiv</p>
            </Link>
            <Link className="panel" to="/talepler">
              <h3>Talepler</h3>
              <p className="muted">Tüm hizmet talepleri</p>
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
