import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  apiFetch,
  type Announcement,
  type CitizenRequestSummary,
  type Debt,
  type Paginated,
  type SocialAssistanceApplication,
} from '../lib/api'
import { CITIZEN_MODULES, PUBLIC_MODULES, STAFF_MODULES, ADMIN_MODULES, moduleVisual, type ModuleTile } from '../lib/modules'
import { isAdmin, isStaff } from '../lib/roles'
import './home.css'

function ModuleCard({ mod, badge }: { mod: ModuleTile; badge: string }) {
  const visual = moduleVisual(mod)
  return (
    <Link to={mod.to} className="module-tile">
      <span className={`module-visual module-visual--${visual}`} aria-hidden>
        <span className="module-visual-label">{mod.title}</span>
      </span>
      <span className={`module-badge ${mod.requiresAuth ? 'is-auth' : 'is-public'}`}>{badge}</span>
      <h3>{mod.title}</h3>
      <p>{mod.description}</p>
    </Link>
  )
}

export function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const staff = isStaff(user?.roles)
  const admin = isAdmin(user?.roles)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [opsLine, setOpsLine] = useState<string | null>(null)
  const [opsLoading, setOpsLoading] = useState(false)

  const guestTiles = PUBLIC_MODULES
  const lockedCitizenTiles = !isAuthenticated
    ? CITIZEN_MODULES.filter(
        (m) => !['panel', 'settings', 'cash-desk-member'].includes(m.id),
      )
    : []
  const memberTiles = isAuthenticated && !staff ? CITIZEN_MODULES : []
  const staffHomeTiles =
    isAuthenticated && staff
      ? [
          ...STAFF_MODULES.filter((m) => !['staff-panel', 'staff-settings'].includes(m.id)),
          ...(admin ? ADMIN_MODULES : []),
        ]
      : []

  useEffect(() => {
    void apiFetch<Paginated<Announcement>>('/api/v1/announcements?pageSize=3')
      .then((page) => setAnnouncements(page.items))
      .catch(() => setAnnouncements([]))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setOpsLine(null)
      setOpsLoading(false)
      return
    }

    let cancelled = false
    setOpsLoading(true)
    setOpsLine(null)

    async function loadOps() {
      if (staff) {
        const [requests, aid] = await Promise.all([
          apiFetch<Paginated<CitizenRequestSummary>>(
            '/api/v1/citizen-requests?pageSize=100',
            {},
            true,
          ),
          apiFetch<Paginated<SocialAssistanceApplication>>(
            '/api/v1/social-assistance?pageSize=100',
            {},
            true,
          ),
        ])
        const openRequests = requests.items.filter(
          (r) => r.status === 'Pending' || r.status === 'UnderReview',
        ).length
        const aidQueue = aid.items.filter(
          (a) => a.status === 'Submitted' || a.status === 'UnderReview',
        ).length
        return admin
          ? `Yönetici oturumu · ${openRequests} açık talep · ${aidQueue} yardım kuyruğu`
          : `Personel oturumu · ${openRequests} açık talep · ${aidQueue} yardım kuyruğu`
      }

      const debts = await apiFetch<Paginated<Debt>>('/api/v1/debts/mine?pageSize=50', {}, true)
      const openDebts = debts.items.filter((d) => d.status !== 'Paid')
      const total = openDebts.reduce((sum, d) => sum + d.totalPayable, 0)
      return openDebts.length > 0
        ? `Vatandaş oturumu · ${openDebts.length} açık borç (${total.toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          })})`
        : 'Vatandaş oturumu · açık borç yok'
    }

    void loadOps()
      .then((line) => {
        if (!cancelled) setOpsLine(line)
      })
      .catch(() => {
        if (!cancelled) setOpsLine(null)
      })
      .finally(() => {
        if (!cancelled) setOpsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, staff, admin])

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-glow" aria-hidden />
        <div className="container home-hero-copy">
          <p className="home-kicker">Örnek dijital hizmetler platformu</p>
          <h1>Arnavutköy</h1>
          <p className="home-lead">
            Hadımköy’den Durusu’ya, Taşoluk’tan Merkez’e — vezne, hizmet masası, ulaşım ve sosyal
            yardım tek portalda.
          </p>
          <div className="home-cta">
            {isAuthenticated ? (
              <Link className="btn btn-primary" to="/panel">
                Panele git
              </Link>
            ) : (
              <>
                <Link className="btn btn-primary" to="/giris">
                  Giriş yap
                </Link>
                <Link className="btn btn-ghost" to="/kayit">
                  Kayıt ol
                </Link>
              </>
            )}
            <Link className="btn btn-ghost" to="/vezne">
              Dijital vezne
            </Link>
            <Link className="btn btn-ghost" to="/e-belediye">
              E-Belediye
            </Link>
          </div>
        </div>
      </section>

      <section className="container home-quick">
        <div className="home-quick-grid">
          <Link to="/haberler">Haberler</Link>
          <Link to="/etkinlikler">Etkinlikler</Link>
          <Link to="/basvuru-takip">Başvuru takibi</Link>
          <Link to="/nikah">Nikah</Link>
          <Link to="/imar">İmar / harç</Link>
          <Link to="/spor-randevu">Spor randevu</Link>
          <Link to="/iletisim">İletişim</Link>
          <Link to="/hizmet-rehberi">Hizmet rehberi</Link>
        </div>
      </section>
      {opsLoading ? (
        <div className="container">
          <p className="home-ops-line home-ops-line--skeleton" aria-busy="true" aria-live="polite">
            <span className="skeleton-line skeleton-line--xl" />
          </p>
        </div>
      ) : opsLine ? (
        <div className="container">
          <p className="home-ops-line">
            {opsLine} · <Link to="/panel">Panel</Link>
          </p>
        </div>
      ) : null}

      {announcements.length > 0 ? (
        <section className="container stack home-announcements">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              alignItems: 'end',
            }}
          >
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Güncel duyurular</h2>
              <p className="muted" style={{ margin: 0 }}>
                Seed’den gelen Arnavutköy temalı bildirimler.
              </p>
            </div>
            <Link className="btn btn-ghost" to="/duyurular">
              Tümü
            </Link>
          </div>
          <div className="home-announcements-grid">
            {announcements.map((item) => (
              <Link key={item.id} to={`/duyurular/${item.id}`} className="home-announcement">
                <time className="muted">
                  {new Date(item.publishStartUtc ?? item.createdAtUtc).toLocaleDateString('tr-TR')}
                </time>
                <strong>{item.title}</strong>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container stack" style={{ marginTop: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Modüller</h2>
          <p className="muted">Üyeliksiz ve üyelikli işlemler — Arnavutköy temalı hizmet kataloğu.</p>
        </div>

        <div className="module-grid">
          {guestTiles.map((mod) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              badge={mod.requiresAuth ? 'Üyelik gerekir' : 'Üyeliksiz'}
            />
          ))}
        </div>

        {lockedCitizenTiles.length > 0 ? (
          <>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Üyelikli işlemler</h2>
              <p className="muted">
                Referans katalog gibi tüm özel modüller görünür; giriş sonrası açılır.
              </p>
            </div>
            <div className="module-grid">
              {lockedCitizenTiles.map((mod) => (
                <ModuleCard key={mod.id} mod={mod} badge="Üyelik gerekir" />
              ))}
            </div>
          </>
        ) : null}

        {memberTiles.length > 0 ? (
          <>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Özel işlemler</h2>
              <p className="muted">Oturumunuz açık; vatandaş hizmetlerine devam edin.</p>
            </div>
            <div className="module-grid">
              {memberTiles.map((mod) => (
                <ModuleCard key={mod.id} mod={mod} badge="Üyelikli" />
              ))}
            </div>
          </>
        ) : null}

        {staffHomeTiles.length > 0 ? (
          <>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
                {admin ? 'Personel / yönetim' : 'Personel masaları'}
              </h2>
              <p className="muted">Operasyon ekranlarına hızlı geçiş.</p>
            </div>
            <div className="module-grid">
              {staffHomeTiles.map((mod) => (
                <ModuleCard key={mod.id} mod={mod} badge={admin ? 'Yönetim' : 'Personel'} />
              ))}
            </div>
          </>
        ) : null}

        {staff ? (
          <div className="notice">
            {admin ? 'Yönetici' : 'Personel'} hesabındasınız. Canlı kuyruk özeti için{' '}
            <Link to="/panel">Panele</Link> gidin
            {opsLine ? ` — ${opsLine.split('·').slice(1).join('·').trim()}` : ''}.
          </div>
        ) : null}
      </section>

      <section className="container home-place stack">
        <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>İlçe bağlamı</h2>
        <p className="muted" style={{ margin: 0 }}>
          Demo coğrafya; resmi kurum verisi değildir. Seed’de 38 Arnavutköy mahallesi, Durusu/Terkos
          güzergâhları ve Hadımköy lojistik aksı yer alır.
        </p>
        <div className="home-place-grid">
          <article>
            <h3>Hadımköy</h3>
            <p>Lojistik ve sanayi aksı — 36AS hat güzergâhı.</p>
          </article>
          <article>
            <h3>Durusu / Terkos</h3>
            <p>Göl ve sahil bandı — temizlik ve bilgilendirme duyuruları.</p>
          </article>
          <article>
            <h3>Merkez / Taşoluk</h3>
            <p>Çarşı, sosyal yardım ve muhtarlık işlemleri.</p>
          </article>
        </div>
      </section>
    </div>
  )
}
