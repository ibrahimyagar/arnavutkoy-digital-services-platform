import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AdminGate } from '../components/RoleGates'
import { apiFetch, type District, type Neighborhood, type Street } from '../lib/api'
import { RequireAuth } from './PanelPage'

const STREET_SUGGESTIONS = [
  'Atatürk Caddesi',
  'Cumhuriyet Sokak',
  'İstiklal Caddesi',
  'Fatih Sokak',
  'Yeşil Vadi Caddesi',
  'Sanayi Caddesi',
] as const

const NEIGHBORHOOD_PRESETS = [
  { name: 'Örnek Mahalle', headman: 'Ayşe Yılmaz', phone: '0212 000 00 01', population: 4200 },
  { name: 'Demo Köy', headman: 'Mehmet Kaya', phone: '0212 000 00 02', population: 1850 },
] as const

type AdminTab = 'districts' | 'neighborhoods' | 'streets'

function GeographyContent() {
  const [districts, setDistricts] = useState<District[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [streets, setStreets] = useState<Street[]>([])
  const [districtId, setDistrictId] = useState('')
  const [neighborhoodId, setNeighborhoodId] = useState('')
  const [tab, setTab] = useState<AdminTab>('neighborhoods')
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [districtName, setDistrictName] = useState('')
  const [neighborhoodName, setNeighborhoodName] = useState('')
  const [headmanName, setHeadmanName] = useState('')
  const [headmanPhone, setHeadmanPhone] = useState('')
  const [population, setPopulation] = useState(1000)
  const [streetName, setStreetName] = useState('')

  const loadDistricts = useCallback(async () => {
    const list = await apiFetch<District[]>('/api/v1/districts')
    setDistricts(list)
    setDistrictId((current) => current || list[0]?.id || '')
  }, [])

  const loadNeighborhoods = useCallback(async (selectedDistrictId: string) => {
    if (!selectedDistrictId) {
      setNeighborhoods([])
      setNeighborhoodId('')
      return
    }
    const list = await apiFetch<Neighborhood[]>(
      `/api/v1/neighborhoods?districtId=${encodeURIComponent(selectedDistrictId)}`,
    )
    setNeighborhoods(list)
    setNeighborhoodId((current) =>
      list.some((n) => n.id === current) ? current : list[0]?.id || '',
    )
  }, [])

  const loadStreets = useCallback(async (selectedNeighborhoodId: string) => {
    if (!selectedNeighborhoodId) {
      setStreets([])
      return
    }
    const list = await apiFetch<Street[]>(
      `/api/v1/streets?neighborhoodId=${encodeURIComponent(selectedNeighborhoodId)}`,
    )
    setStreets(list)
  }, [])

  useEffect(() => {
    void loadDistricts().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'İlçeler yüklenemedi.')
    })
  }, [loadDistricts])

  useEffect(() => {
    if (!districtId) return
    void loadNeighborhoods(districtId).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Mahalleler yüklenemedi.')
    })
  }, [districtId, loadNeighborhoods])

  useEffect(() => {
    if (!neighborhoodId) {
      setStreets([])
      return
    }
    void loadStreets(neighborhoodId).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Sokaklar yüklenemedi.')
    })
  }, [neighborhoodId, loadStreets])

  const totalPopulation = useMemo(
    () => neighborhoods.reduce((sum, n) => sum + n.population, 0),
    [neighborhoods],
  )

  const filteredNeighborhoods = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    const list = [...neighborhoods].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    if (!needle) return list
    return list.filter(
      (n) =>
        n.name.toLocaleLowerCase('tr-TR').includes(needle) ||
        n.headmanFullName.toLocaleLowerCase('tr-TR').includes(needle),
    )
  }, [neighborhoods, q])

  const filteredStreets = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    const list = [...streets].sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    if (!needle) return list
    return list.filter((s) => s.name.toLocaleLowerCase('tr-TR').includes(needle))
  }, [streets, q])

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await action()
      setInfo(okMessage)
      await loadDistricts()
      if (districtId) await loadNeighborhoods(districtId)
      if (neighborhoodId) await loadStreets(neighborhoodId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function createDistrict(event: FormEvent) {
    event.preventDefault()
    await run(async () => {
      await apiFetch(
        '/api/v1/districts',
        { method: 'POST', body: JSON.stringify({ name: districtName.trim() }) },
        true,
      )
      setDistrictName('')
    }, 'İlçe oluşturuldu.')
  }

  async function createNeighborhood(event: FormEvent) {
    event.preventDefault()
    if (!districtId) return
    await run(async () => {
      await apiFetch(
        '/api/v1/neighborhoods',
        {
          method: 'POST',
          body: JSON.stringify({
            districtId,
            name: neighborhoodName.trim(),
            headmanFullName: headmanName.trim(),
            headmanPhoneNumber: headmanPhone.trim(),
            population,
          }),
        },
        true,
      )
      setNeighborhoodName('')
      setHeadmanName('')
      setHeadmanPhone('')
      setPopulation(1000)
    }, 'Mahalle oluşturuldu. Halka açık görünüm: /muhtarliklar')
  }

  async function createStreet(event: FormEvent) {
    event.preventDefault()
    if (!neighborhoodId) return
    await run(async () => {
      await apiFetch(
        '/api/v1/streets',
        {
          method: 'POST',
          body: JSON.stringify({
            neighborhoodId,
            name: streetName.trim(),
          }),
        },
        true,
      )
      setStreetName('')
    }, 'Sokak oluşturuldu.')
  }

  const selectedDistrict = districts.find((d) => d.id === districtId)
  const selectedNeighborhood = neighborhoods.find((n) => n.id === neighborhoodId)

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Coğrafya yönetimi</h1>
        <p className="muted">
          İlçe → mahalle → sokak. Halka açık muhtarlık listesi:{' '}
          <Link to="/muhtarliklar">/muhtarliklar</Link>
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="stats-strip" aria-label="Coğrafya özeti">
        <div>
          <span className="muted">İlçe</span>
          <strong>{districts.length}</strong>
        </div>
        <div>
          <span className="muted">Mahalle</span>
          <strong>{neighborhoods.length}</strong>
        </div>
        <div>
          <span className="muted">Sokak</span>
          <strong>{streets.length}</strong>
        </div>
        <div>
          <span className="muted">Seçili nüfus</span>
          <strong>{totalPopulation.toLocaleString('tr-TR')}</strong>
        </div>
      </div>

      <div className="desk-tabs" role="tablist" aria-label="Coğrafya bölümü">
        {(
          [
            { id: 'districts', label: 'İlçeler', count: districts.length },
            { id: 'neighborhoods', label: 'Mahalleler', count: neighborhoods.length },
            { id: 'streets', label: 'Sokaklar', count: streets.length },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'is-active' : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            <span>{item.count}</span>
          </button>
        ))}
      </div>

      {tab !== 'districts' ? (
        <div className="field">
          <label htmlFor="geo-search">
            {tab === 'neighborhoods' ? 'Mahalle / muhtar ara' : 'Sokak ara'}
          </label>
          <input
            id="geo-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tab === 'neighborhoods' ? 'Örn. Hadımköy' : 'Örn. Atatürk'}
          />
        </div>
      ) : null}

      {tab === 'districts' ? (
        <section className="panel stack">
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>İlçeler</h2>
          <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: '0.35rem' }}>
            {districts.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className={d.id === districtId ? 'btn btn-primary' : 'btn btn-ghost'}
                  onClick={() => {
                    setDistrictId(d.id)
                    setTab('neighborhoods')
                  }}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span>{d.name}</span>
                  <span className="muted">{d.neighborhoodCount} mahalle</span>
                </button>
              </li>
            ))}
            {districts.length === 0 ? <li className="muted">Henüz ilçe yok.</li> : null}
          </ul>

          <form className="stack" onSubmit={(e) => void createDistrict(e)}>
            <div className="field">
              <label htmlFor="districtName">Yeni ilçe</label>
              <input
                id="districtName"
                value={districtName}
                onChange={(e) => setDistrictName(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              İlçe ekle
            </button>
          </form>
        </section>
      ) : null}

      {tab === 'neighborhoods' ? (
        <section className="panel stack">
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
            Mahalleler
            {selectedDistrict ? ` · ${selectedDistrict.name}` : ''}
          </h2>

          {!districtId ? (
            <p className="muted">Önce bir ilçe seçin.</p>
          ) : (
            <>
              <div className="field">
                <label htmlFor="districtPick">İlçe</label>
                <select
                  id="districtPick"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.neighborhoodCount})
                    </option>
                  ))}
                </select>
              </div>

              <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: '0.35rem' }}>
                {filteredNeighborhoods.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={n.id === neighborhoodId ? 'btn btn-primary' : 'btn btn-ghost'}
                      onClick={() => {
                        setNeighborhoodId(n.id)
                        setTab('streets')
                        setQ('')
                      }}
                      style={{ width: '100%', justifyContent: 'space-between', textAlign: 'left' }}
                    >
                      <span>
                        {n.name}
                        <small className="muted" style={{ display: 'block' }}>
                          Muhtar: {n.headmanFullName || '—'} · Nüfus{' '}
                          {n.population.toLocaleString('tr-TR')}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
                {filteredNeighborhoods.length === 0 ? (
                  <li className="muted">Bu filtrede mahalle yok.</li>
                ) : null}
              </ul>

              <div className="dept-chip-row" role="group" aria-label="Mahalle şablonları">
                {NEIGHBORHOOD_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setNeighborhoodName(preset.name)
                      setHeadmanName(preset.headman)
                      setHeadmanPhone(preset.phone)
                      setPopulation(preset.population)
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <form className="stack" onSubmit={(e) => void createNeighborhood(e)}>
                <div className="form-two-col">
                  <div className="field">
                    <label htmlFor="neighborhoodName">Mahalle adı</label>
                    <input
                      id="neighborhoodName"
                      value={neighborhoodName}
                      onChange={(e) => setNeighborhoodName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="population">Nüfus</label>
                    <input
                      id="population"
                      type="number"
                      min={0}
                      value={population}
                      onChange={(e) => setPopulation(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
                <div className="form-two-col">
                  <div className="field">
                    <label htmlFor="headmanName">Muhtar adı</label>
                    <input
                      id="headmanName"
                      value={headmanName}
                      onChange={(e) => setHeadmanName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="headmanPhone">Muhtar telefon</label>
                    <input
                      id="headmanPhone"
                      value={headmanPhone}
                      onChange={(e) => setHeadmanPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Mahalle ekle
                </button>
              </form>
            </>
          )}
        </section>
      ) : null}

      {tab === 'streets' ? (
        <section className="panel stack">
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>
            Sokaklar
            {selectedNeighborhood ? ` · ${selectedNeighborhood.name}` : ''}
          </h2>

          {!neighborhoodId ? (
            <p className="muted">Önce bir mahalle seçin.</p>
          ) : (
            <>
              <div className="field">
                <label htmlFor="neighPick">Mahalle</label>
                <select
                  id="neighPick"
                  value={neighborhoodId}
                  onChange={(e) => setNeighborhoodId(e.target.value)}
                >
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {filteredStreets.map((s) => (
                  <li key={s.id} style={{ padding: '0.45rem 0', borderBottom: '1px solid var(--line)' }}>
                    {s.name}
                  </li>
                ))}
                {filteredStreets.length === 0 ? <li className="muted">Bu filtrede sokak yok.</li> : null}
              </ul>

              <div className="dept-chip-row" role="group" aria-label="Sokak önerileri">
                {STREET_SUGGESTIONS.map((name) => (
                  <button key={name} type="button" onClick={() => setStreetName(name)}>
                    {name}
                  </button>
                ))}
              </div>

              <form className="stack" onSubmit={(e) => void createStreet(e)}>
                <div className="field">
                  <label htmlFor="streetName">Sokak adı</label>
                  <input
                    id="streetName"
                    value={streetName}
                    onChange={(e) => setStreetName(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  Sokak ekle
                </button>
              </form>
            </>
          )}
        </section>
      ) : null}
    </div>
  )
}

export function GeographyAdminPage() {
  return (
    <RequireAuth>
      <AdminGate>
        <GeographyContent />
      </AdminGate>
    </RequireAuth>
  )
}
