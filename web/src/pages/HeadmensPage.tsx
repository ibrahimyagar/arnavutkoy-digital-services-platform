import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, type Neighborhood } from '../lib/api'
import { COVERS } from '../lib/contentVisuals'
import {
  DATA_SOURCES,
  DISTRICT_POPULATION_ADNKS,
  LETTERS,
  POPULATION_YEAR,
  REGIONS,
  densityLabel,
  formatPhoneTr,
  isOfficialNeighborhood,
  matchesDensity,
  neighborhoodOsmOpen,
  neighborhoodOsmSrc,
  regionForName,
  regionLabel,
  shareNeighborhood,
  toTelHref,
  type DensityFilter,
  type ExploreRegion,
} from '../lib/neighborhoodVisuals'
import './neighborhood.css'

const NOTICE =
  'Bu proje portföy/demo amaçlıdır. Resmi kurum sistemi değildir; nüfus ve muhtarlık bilgileri yayımlanmış kaynaklardan referans alınmıştır.'

type SortKey = 'pop-desc' | 'name'

function useNeighborhoods() {
  const [items, setItems] = useState<Neighborhood[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void apiFetch<Neighborhood[]>('/api/v1/neighborhoods')
      .then((list) => {
        if (cancelled) return
        setItems(list.filter((item) => isOfficialNeighborhood(item.name)))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Mahalle rehberi yüklenemedi.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { items, error, loading }
}

export function HeadmensPage() {
  const { items, error, loading } = useNeighborhoods()
  const [q, setQ] = useState('')
  const [letter, setLetter] = useState<string | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('pop-desc')
  const [density, setDensity] = useState<DensityFilter>('all')
  const [region, setRegion] = useState<ExploreRegion | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    let list = items.filter((n) => {
      if (letter !== 'all') {
        const first = n.name.trim().charAt(0).toLocaleUpperCase('tr-TR')
        if (first !== letter) return false
      }
      if (region !== 'all' && regionForName(n.name) !== region) return false
      if (!matchesDensity(n.population, density)) return false
      if (!needle) return true
      return (
        n.name.toLocaleLowerCase('tr-TR').includes(needle) ||
        n.headmanFullName.toLocaleLowerCase('tr-TR').includes(needle) ||
        n.headmanPhoneNumber.includes(needle) ||
        formatPhoneTr(n.headmanPhoneNumber).includes(needle)
      )
    })
    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'tr')
      return b.population - a.population
    })
    return list
  }, [items, q, letter, sort, density, region])

  const selected = useMemo(() => {
    if (selectedId) {
      const fromFilter = filtered.find((n) => n.id === selectedId)
      if (fromFilter) return fromFilter
      const fromAll = items.find((n) => n.id === selectedId)
      if (fromAll) return fromAll
    }
    return filtered[0] ?? items[0] ?? null
  }, [filtered, items, selectedId])

  const totalPopulation = useMemo(() => items.reduce((sum, n) => sum + n.population, 0), [items])
  const listedPopulation = useMemo(() => filtered.reduce((sum, n) => sum + n.population, 0), [filtered])
  const densest = useMemo(() => [...items].sort((a, b) => b.population - a.population)[0], [items])
  const matchesDistrictTotal = totalPopulation === DISTRICT_POPULATION_ADNKS
  const usedLetters = useMemo(() => {
    const set = new Set(items.map((n) => n.name.trim().charAt(0).toLocaleUpperCase('tr-TR')))
    return LETTERS.filter((item) => set.has(item))
  }, [items])

  return (
    <div className="mah">
      <header className="mah-hero">
        <div className="mah-hero-copy">
          <p className="mah-kicker">Mahalle rehberi</p>
          <h1>
            Arnavutköy’ü
            <em> mahalle mahalle keşfet.</em>
          </h1>
          <p className="mah-lead">
            Harita, nüfus ve muhtar hattı aynı rehberde. Bu sayfa bir tablo dökümü değil; ilçeyi yerinden
            okuma aracıdır.
          </p>
          <p className="mah-notice">
            <strong>Demo / portföy.</strong> {NOTICE}
          </p>
        </div>
        <figure className="mah-lens" aria-hidden>
          <img src={COVERS.park.src} alt="" />
          <figcaption>Yerel doku</figcaption>
        </figure>
      </header>

      {error ? <div className="error-box">{error}</div> : null}

      <section className="mah-legend" aria-label="İlçe özeti">
        <div>
          <strong>{loading ? '—' : items.length}</strong>
          <span>Mahalle</span>
        </div>
        <div>
          <strong>{loading ? '—' : totalPopulation.toLocaleString('tr-TR')}</strong>
          <span>İlçe nüfusu · {POPULATION_YEAR}</span>
        </div>
        <div>
          <strong>{loading ? '—' : densest?.name ?? '—'}</strong>
          <span>En kalabalık mahalle</span>
        </div>
        <div>
          <strong>{loading ? '—' : items.filter((n) => n.headmanPhoneNumber).length}</strong>
          <span>Muhtarlık hattı</span>
        </div>
      </section>

      <p className="mah-source">
        Nüfus: {DATA_SOURCES.population}. Muhtarlık: {DATA_SOURCES.headmen}. Son kontrol:{' '}
        {DATA_SOURCES.lastVerified}.
        {matchesDistrictTotal
          ? ' Listelenen mahalle nüfuslarının toplamı, aynı yılın ilçe ADNKS toplamı ile örtüşüyor.'
          : ` Listelenen mahalle toplamı ${totalPopulation.toLocaleString('tr-TR')}; TÜİK ADNKS ${POPULATION_YEAR} ilçe nüfusu ${DISTRICT_POPULATION_ADNKS.toLocaleString('tr-TR')}.`}
      </p>

      <div className="mah-toolbar">
        <div className="mah-search">
          <label htmlFor="mah-q">Mahalle, muhtar veya telefon</label>
          <input
            id="mah-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Örn. Hadımköy, Rıza, 0535"
          />
        </div>
        <div className="mah-field">
          <label htmlFor="mah-sort">Sırala</label>
          <select id="mah-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="pop-desc">Nüfus (çoktan aza)</option>
            <option value="name">Ada göre (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="mah-chips" role="group" aria-label="Keşif bölgesi">
        <button type="button" className={region === 'all' ? 'is-on' : undefined} onClick={() => setRegion('all')}>
          Tüm ilçe
        </button>
        {REGIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={region === item.id ? 'is-on' : undefined}
            onClick={() => setRegion(item.id)}
            title={item.hint}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mah-chips mah-chips--soft" role="group" aria-label="Yoğunluk">
        {(
          [
            ['all', 'Her yoğunluk'],
            ['dense', 'Kalabalık'],
            ['mid', 'Orta'],
            ['quiet', 'Sakin'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={density === id ? 'is-on' : undefined}
            onClick={() => setDensity(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mah-letters" role="group" aria-label="Harf filtresi">
        <button type="button" className={letter === 'all' ? 'is-on' : undefined} onClick={() => setLetter('all')}>
          A–Z
        </button>
        {usedLetters.map((item) => (
          <button
            key={item}
            type="button"
            className={letter === item ? 'is-on' : undefined}
            onClick={() => setLetter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="mah-count" aria-live="polite">
        {loading
          ? 'Rehber yükleniyor…'
          : `${filtered.length} mahalle · ${listedPopulation.toLocaleString('tr-TR')} kişi (${POPULATION_YEAR} nüfusu)`}
      </p>

      <div className="mah-atlas">
        <aside className="mah-map-panel">
          {selected ? (
            <>
              <div className="mah-map">
                <iframe title={`${selected.name} yaklaşık konumu`} src={neighborhoodOsmSrc(selected.name)} loading="lazy" />
              </div>
              <p className="mah-map-note">Yaklaşık konum · OpenStreetMap. Kadastro sınırı değildir.</p>
              <SelectedSheet item={selected} />
            </>
          ) : (
            <p className="mah-empty">Haritada göstermek için bir mahalle seçin.</p>
          )}
        </aside>

        <div className="mah-list" role="list">
          {loading
            ? Array.from({ length: 6 }, (_, index) => <div key={index} className="mah-card mah-card--ghost" />)
            : null}
          {filtered.map((item, index) => {
            const active = selected?.id === item.id
            const tel = toTelHref(item.headmanPhoneNumber)
            return (
              <article key={item.id} className={`mah-card${active ? ' is-active' : ''}`} role="listitem">
                <button type="button" className="mah-card-hit" onClick={() => setSelectedId(item.id)}>
                  <span className="mah-rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="mah-card-copy">
                    <strong>{item.name}</strong>
                    <em>
                      {regionLabel(item.name)} · {densityLabel(item.population)}
                    </em>
                  </span>
                  <span className="mah-pop">
                    <b>{item.population.toLocaleString('tr-TR')}</b>
                    <small>{POPULATION_YEAR} nüfusu</small>
                  </span>
                </button>
                <footer>
                  <span>{item.headmanFullName}</span>
                  {tel ? (
                    <a href={tel} onClick={(e) => e.stopPropagation()}>
                      {formatPhoneTr(item.headmanPhoneNumber)}
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                  <Link to={`/muhtarliklar/${item.id}`}>Kart →</Link>
                </footer>
              </article>
            )
          })}
          {!loading && filtered.length === 0 ? (
            <p className="mah-empty">Bu arama ve filtrede mahalle yok. Filtreyi genişletin.</p>
          ) : null}
        </div>
      </div>

      <nav className="mah-related" aria-label="İlgili kapılar">
        <p className="mah-kicker">Mahalleden sonra</p>
        <h2>Yerel iletişim burada biter, hizmet başka kapıda devam eder.</h2>
        <ul>
          <li>
            <Link to="/birimler">
              <strong>Birimler</strong>
              <span>Müdürlük ve dizin</span>
            </Link>
          </li>
          <li>
            <Link to="/hizmet-rehberi">
              <strong>Hizmet rehberi</strong>
              <span>İşlem kapıları</span>
            </Link>
          </li>
          <li>
            <Link to="/iletisim">
              <strong>İletişim</strong>
              <span>Yazışma formu</span>
            </Link>
          </li>
          <li>
            <Link to="/kurumsal">
              <strong>Kurumsal</strong>
              <span>Belediyeyi tanı</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}

function SelectedSheet({ item }: { item: Neighborhood }) {
  const tel = toTelHref(item.headmanPhoneNumber)
  return (
    <div className="mah-sheet">
      <p className="mah-kicker">{regionLabel(item.name)}</p>
      <h2>{item.name}</h2>
      <dl>
        <div>
          <dt>Nüfus</dt>
          <dd>
            {item.population.toLocaleString('tr-TR')}
            <small>{POPULATION_YEAR}</small>
          </dd>
        </div>
        <div>
          <dt>Muhtar</dt>
          <dd>{item.headmanFullName}</dd>
        </div>
      </dl>
      {tel ? (
        <a className="mah-call" href={tel}>
          Ara · {formatPhoneTr(item.headmanPhoneNumber)}
        </a>
      ) : null}
      <div className="mah-sheet-links">
        <Link to={`/muhtarliklar/${item.id}`}>Mahalle kartı →</Link>
        <a href={neighborhoodOsmOpen(item.name)} target="_blank" rel="noreferrer">
          Haritada aç →
        </a>
      </div>
    </div>
  )
}

export function HeadmensDetailPage() {
  const { id } = useParams()
  const { items, error, loading } = useNeighborhoods()
  const item = items.find((n) => n.id === id) ?? null
  const region = item ? regionForName(item.name) : 'merkez'
  const nearby = items
    .filter((n) => n.id !== item?.id && regionForName(n.name) === region)
    .sort((a, b) => b.population - a.population)
    .slice(0, 4)

  if (!loading && !item) {
    return (
      <div className="mah mah--detail">
        <p className="mah-empty">Bu mahalle rehberde yok.</p>
        <Link className="mah-back" to="/muhtarliklar">
          ← Mahalle rehberi
        </Link>
      </div>
    )
  }

  const tel = item ? toTelHref(item.headmanPhoneNumber) : ''

  return (
    <div className="mah mah--detail">
      <Link className="mah-back" to="/muhtarliklar">
        ← Mahalle rehberi
      </Link>
      {error ? <div className="error-box">{error}</div> : null}
      {loading || !item ? (
        <p className="mah-empty">Mahalle kartı yükleniyor…</p>
      ) : (
        <>
          <header className="mah-dossier">
            <p className="mah-kicker">
              {regionLabel(item.name)} · {densityLabel(item.population)}
            </p>
            <h1>{item.name}</h1>
            <p className="mah-lead">
              Nüfus, muhtar ve hat aynı kaynaktan gelir. Liste ile bu kart çelişmez.
            </p>
          </header>

          <section className="mah-legend" aria-label="Mahalle özeti">
            <div>
              <strong>{item.population.toLocaleString('tr-TR')}</strong>
              <span>{POPULATION_YEAR} nüfusu</span>
            </div>
            <div>
              <strong>{item.headmanFullName}</strong>
              <span>Muhtar</span>
            </div>
            <div>
              <strong>{formatPhoneTr(item.headmanPhoneNumber)}</strong>
              <span>Muhtarlık hattı</span>
            </div>
          </section>

          <div className="mah-dossier-grid">
            <div className="mah-map">
              <iframe title={`${item.name} yaklaşık konumu`} src={neighborhoodOsmSrc(item.name)} loading="lazy" />
            </div>
            <aside className="mah-sheet">
              <p className="mah-kicker">Yerel iletişim</p>
              <h2>Muhtarlık</h2>
              <p>
                Telefon belediye e-Rehber kaydıdır. Bu sayfa resmi muhtarlık sistemi gibi
                kullanılmamalıdır.
              </p>
              {tel ? (
                <a className="mah-call" href={tel}>
                  Ara · {formatPhoneTr(item.headmanPhoneNumber)}
                </a>
              ) : null}
              <div className="mah-sheet-links">
                <a href={neighborhoodOsmOpen(item.name)} target="_blank" rel="noreferrer">
                  OpenStreetMap’te aç →
                </a>
                <button type="button" onClick={() => void shareNeighborhood(item.id, item.name)}>
                  Paylaş
                </button>
              </div>
              <p className="mah-map-note">Yaklaşık konum. Nüfus yılı: {POPULATION_YEAR}.</p>
            </aside>
          </div>

          {nearby.length > 0 ? (
            <section className="mah-nearby">
              <p className="mah-kicker">Aynı keşif bölgesi</p>
              <h2>{regionLabel(item.name)} içinde yanına bakın.</h2>
              <ul>
                {nearby.map((n) => (
                  <li key={n.id}>
                    <Link to={`/muhtarliklar/${n.id}`}>
                      <strong>{n.name}</strong>
                      <span>
                        {n.population.toLocaleString('tr-TR')} · {POPULATION_YEAR}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="mah-source">
            Nüfus: {DATA_SOURCES.population}. Muhtarlık: {DATA_SOURCES.headmen}.
          </p>
        </>
      )}
    </div>
  )
}
