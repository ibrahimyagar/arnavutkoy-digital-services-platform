import { useEffect, useMemo, useState } from 'react'
import { PublicPage, PublicRelated } from '../components/ui/PublicPage'
import { apiFetch, type Neighborhood } from '../lib/api'
import { COVERS, RELATED } from '../lib/contentVisuals'

const LETTERS = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('')

export function HeadmensPage() {
  const [items, setItems] = useState<Neighborhood[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [letter, setLetter] = useState<string | 'all'>('all')
  const [sort, setSort] = useState<'pop-desc' | 'name'>('pop-desc')

  useEffect(() => {
    setLoading(true)
    void apiFetch<Neighborhood[]>('/api/v1/neighborhoods')
      .then(setItems)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Muhtarlıklar yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    let list = items.filter((n) => {
      if (letter !== 'all') {
        const first = n.name.trim().charAt(0).toLocaleUpperCase('tr-TR')
        if (first !== letter) return false
      }
      if (!needle) return true
      return (
        n.name.toLocaleLowerCase('tr-TR').includes(needle) ||
        n.headmanFullName.toLocaleLowerCase('tr-TR').includes(needle) ||
        n.headmanPhoneNumber.includes(needle)
      )
    })

    list = [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'tr')
      return b.population - a.population
    })
    return list
  }, [items, q, letter, sort])

  const totalPopulation = useMemo(
    () => filtered.reduce((sum, n) => sum + n.population, 0),
    [filtered],
  )

  const withPhone = useMemo(
    () => filtered.filter((n) => Boolean(n.headmanPhoneNumber)).length,
    [filtered],
  )

  return (
    <PublicPage
      eyebrow="İlçe"
      title="Muhtarlıklar"
      lead="Mahalle bazlı muhtar, telefon ve nüfus — kurgusal demo dizini."
      cover={COVERS.guide}
    >
      {error ? <div className="error-box">{error}</div> : null}

      {loading ? (
        <div className="stats-strip stats-strip--skeleton" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <span className="skeleton-line skeleton-line--sm" />
              <span className="skeleton-line skeleton-line--lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-strip" aria-label="Muhtarlık özeti">
          <div>
            <span className="muted">Mahalle</span>
            <strong>{items.length}</strong>
          </div>
          <div>
            <span className="muted">Listelenen</span>
            <strong>{filtered.length}</strong>
          </div>
          <div>
            <span className="muted">Toplam nüfus</span>
            <strong>{totalPopulation.toLocaleString('tr-TR')}</strong>
          </div>
          <div>
            <span className="muted">Telefonlu</span>
            <strong>{withPhone}</strong>
          </div>
        </div>
      )}

      <div className="form-two-col">
        <div className="field">
          <label htmlFor="hq">Mahalle / muhtar / telefon ara</label>
          <input
            id="hq"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Örn. Hadımköy, Ayşe, 0212"
          />
        </div>
        <div className="field">
          <label htmlFor="hsort">Sırala</label>
          <select id="hsort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="pop-desc">Nüfus (çoktan aza)</option>
            <option value="name">Ada göre (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="dept-chip-row" role="group" aria-label="Harf filtresi">
        <button
          type="button"
          className={letter === 'all' ? 'is-active' : undefined}
          onClick={() => setLetter('all')}
        >
          Tümü
        </button>
        {LETTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={letter === item ? 'is-active' : undefined}
            onClick={() => setLetter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mahalle</th>
              <th>Nüfus</th>
              <th>Muhtar</th>
              <th>İletişim</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n, index) => (
              <tr key={n.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{n.name}</strong>
                </td>
                <td>{n.population.toLocaleString('tr-TR')}</td>
                <td>{n.headmanFullName || '—'}</td>
                <td>
                  {n.headmanPhoneNumber ? (
                    <a className="btn btn-ghost" href={`tel:${n.headmanPhoneNumber}`}>
                      {n.headmanPhoneNumber}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  Bu filtrede mahalle yok.
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={2}>
                  <strong>Toplam nüfus</strong>
                </td>
                <td colSpan={3}>
                  <strong>{totalPopulation.toLocaleString('tr-TR')}</strong>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PublicRelated items={RELATED.municipal} />
    </PublicPage>
  )
}
