import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { HomeHeroLanding } from '../components/home/HomeHeroLanding'
import { HomeFeatureCards, HomeAnnouncements, getHomeFeatureModules } from '../components/home/HomeSections'
import { HomeStories } from '../components/home/HomeStories'
import {
  apiFetch,
  type Announcement,
  type CitizenRequestSummary,
  type Debt,
  type Paginated,
  type SocialAssistanceApplication,
} from '../lib/api'
import {
  classifyAnnouncement,
  excerpt,
  formatAnnouncementWhen,
  parseAnnouncementContent,
} from '../lib/announcementVisuals'
import { isAdmin, isStaff } from '../lib/roles'
import './home.css'
import '../components/home/home-sections.css'

export function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const staff = isStaff(user?.roles)
  const admin = isAdmin(user?.roles)
  const [opsLine, setOpsLine] = useState<string | null>(null)
  const [opsLoading, setOpsLoading] = useState(false)
  const [homeAnnouncements, setHomeAnnouncements] = useState<
    {
      id: string
      title: string
      dateLabel: string
      to: string
      category: string
      image: string
      excerpt: string
    }[]
  >([])

  const featureModules = getHomeFeatureModules()

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

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const page = await apiFetch<Paginated<Announcement>>('/api/v1/announcements?pageSize=3')
        if (cancelled) return
        setHomeAnnouncements(
          page.items.map((item) => {
            const category = classifyAnnouncement(item.title, item.content)
            const parsed = parseAnnouncementContent(item.content)
            return {
              id: item.id,
              title: item.title,
              dateLabel: formatAnnouncementWhen(new Date(item.publishStartUtc ?? item.createdAtUtc)),
              to: `/duyurular/${item.id}`,
              category: category.label,
              image: category.cover.src,
              excerpt: excerpt(parsed.lead || item.content, 110),
            }
          }),
        )
      } catch {
        if (!cancelled) setHomeAnnouncements([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="home home--landing">
      <HomeHeroLanding isAuthenticated={isAuthenticated} />

      <div id="home-content" className="home-after">
        <section className="home-spotlight" aria-label="Öne çıkan girişler">
          <div className="container home-spotlight-grid">
            <Link to="/e-belediye" className="home-spotlight-card is-primary">
              <span className="home-spotlight-label">
                <i aria-hidden /> Online
              </span>
              <strong>E-Belediye</strong>
              <p className="muted">Nikah, imar, spor ve başvuru işlemlerine tek noktadan.</p>
            </Link>
            <Link to="/haberler" className="home-spotlight-card">
              <span className="home-spotlight-label">
                <i aria-hidden /> Bilgi
              </span>
              <strong>Haberler</strong>
              <p className="muted">İlçeden güncel gelişmeler.</p>
            </Link>
            <Link to="/hizmet-rehberi" className="home-spotlight-card">
              <span className="home-spotlight-label">
                <i aria-hidden /> Rehber
              </span>
              <strong>Hizmet ara</strong>
              <p className="muted">Sık kullanılan işlemleri hızlı bulun.</p>
            </Link>
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

        <HomeStories />

        <HomeAnnouncements items={homeAnnouncements} />

        <HomeFeatureCards modules={featureModules} />

        <section className="container home-place stack">
          <header className="home-section-head">
            <h2>İlçe</h2>
            <p className="muted">Demo coğrafya; resmi kurum verisi değildir.</p>
          </header>
          <div className="home-place-grid">
            <article>
              <h3>Hadımköy</h3>
              <p>Lojistik ve sanayi aksı — ulaşım ve hizmet noktaları.</p>
            </article>
            <article>
              <h3>Durusu / Terkos</h3>
              <p>Göl ve sahil bandı — bilgilendirme ve etkinlikler.</p>
            </article>
            <article>
              <h3>Merkez / Taşoluk</h3>
              <p>Çarşı, sosyal yardım ve muhtarlık işlemleri.</p>
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}
