import { Link } from 'react-router-dom'
import { COVERS } from '../../lib/contentVisuals'
import './home-stories.css'

export type HomeStory = {
  id: string
  kind: 'Duyuru' | 'Haber' | 'Etkinlik'
  title: string
  headline: string
  image: string
  imageAlt: string
  to: string
  meta?: string
}

/** Ana sayfa öne çıkan görsel içerikler — demo; resmi kurum yayını değildir. */
export const HOME_STORIES: HomeStory[] = [
  {
    id: 'waste',
    kind: 'Duyuru',
    title: '17–31 Ağustos 2026 Evsel Katı Atık Sözleşmeleri',
    headline: 'Hadımköy ve Taşoluk bölgelerinde sözleşme yenileme randevuları başladı.',
    image: COVERS.waste.src,
    imageAlt: COVERS.waste.alt,
    to: '/duyurular',
    meta: 'Çevre hizmetleri',
  },
  {
    id: 'rhythm',
    kind: 'Haber',
    title: 'Ritim Atölyesi',
    headline: 'Ritim enstrümanını al gel — açık hava müzik buluşması.',
    image: COVERS.rhythm.src,
    imageAlt: COVERS.rhythm.alt,
    to: '/etkinlikler',
    meta: '19 Ağustos 2026 · Kültür merkezi',
  },
  {
    id: 'coding',
    kind: 'Etkinlik',
    title: 'Kodlamaya Yolculuk',
    headline: '9–14 yaş için 4 haftalık bilim ve kodlama programı kayıtları açık.',
    image: COVERS.coding.src,
    imageAlt: COVERS.coding.alt,
    to: '/etkinlikler',
    meta: 'Bilim merkezi · haftada 1 gün',
  },
  {
    id: 'park',
    kind: 'Haber',
    title: 'Yeni mahalle parkı hizmete açıldı',
    headline: 'Taşoluk’ta yürüyüş yolu ve çocuk oyun alanı vatandaşların kullanımına sunuldu.',
    image: COVERS.park.src,
    imageAlt: COVERS.park.alt,
    to: '/haberler',
    meta: 'İlçe yatırımları',
  },
]

export function HomeStories() {
  const [featuredLeft, featuredRight, ...rest] = HOME_STORIES

  return (
    <section className="hs" aria-labelledby="hs-title">
      <div className="hs-inner">
        <header className="hs-head">
          <h2 id="hs-title">Duyurular ve Haberler</h2>
          <p>Güncel bildirimler, etkinlikler ve ilçe haberleri — demo içerik.</p>
        </header>

        <div className="hs-featured">
          <div className="hs-col">
            <div className="hs-col-top">
              <span>Duyurular</span>
              <Link to="/duyurular">Tümünü Gör</Link>
            </div>
            <StoryCard story={featuredLeft} size="lg" />
          </div>
          <div className="hs-col">
            <div className="hs-col-top">
              <span>Haberler</span>
              <Link to="/haberler">Tümünü Gör</Link>
            </div>
            <StoryCard story={featuredRight} size="lg" />
          </div>
        </div>

        {rest.length > 0 ? (
          <div className="hs-row" aria-label="Diğer öne çıkanlar">
            {rest.map((story) => (
              <StoryCard key={story.id} story={story} size="md" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function StoryCard({ story, size }: { story: HomeStory; size: 'lg' | 'md' }) {
  return (
    <Link to={story.to} className={`hs-card hs-card--${size}`}>
      <div className="hs-card-media">
        <img src={story.image} alt={story.imageAlt} loading="lazy" decoding="async" />
      </div>
      <div className="hs-card-foot">
        <span className={`hs-tag hs-tag--${story.kind.toLocaleLowerCase('tr-TR')}`}>
          {story.kind}
        </span>
        <div className="hs-card-copy">
          <strong>{story.title}</strong>
          <span>{story.headline}</span>
          {story.meta ? <em>{story.meta}</em> : null}
        </div>
      </div>
    </Link>
  )
}
