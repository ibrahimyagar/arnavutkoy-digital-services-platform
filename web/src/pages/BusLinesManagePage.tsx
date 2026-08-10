import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AdminGate } from '../components/RoleGates'
import { apiFetch, type BusLine, type BusLineDetails } from '../lib/api'
import { RequireAuth } from './PanelPage'

const DAYS = [
  { value: 'Sunday', label: 'Pazar' },
  { value: 'Monday', label: 'Pazartesi' },
  { value: 'Tuesday', label: 'Salı' },
  { value: 'Wednesday', label: 'Çarşamba' },
  { value: 'Thursday', label: 'Perşembe' },
  { value: 'Friday', label: 'Cuma' },
  { value: 'Saturday', label: 'Cumartesi' },
] as const

const LINE_TEMPLATES = [
  {
    code: 'AK-41',
    name: 'Merkez – Hadımköy',
    routeSummary: 'Arnavutköy Merkez → Taşoluk → Hadımköy Sanayi',
    baseFare: '17.50',
    stops: ['Merkez Meydan', 'Taşoluk Kavşak', 'Hadımköy Sanayi'],
  },
  {
    code: 'AK-12',
    name: 'Durusu ekspres',
    routeSummary: 'Merkez → Boğazköy → Durusu',
    baseFare: '22.00',
    stops: ['Belediye', 'Boğazköy İstiklal', 'Durusu Sahil'],
  },
] as const

const TIME_PRESETS = ['07:00', '08:30', '12:15', '17:45', '21:00'] as const

type ActiveFilter = 'all' | 'active' | 'inactive'

function BusLinesManageContent() {
  const [lines, setLines] = useState<BusLine[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<BusLineDetails | null>(null)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [routeSummary, setRouteSummary] = useState('')
  const [baseFare, setBaseFare] = useState('17.50')
  const [pendingStops, setPendingStops] = useState<string[]>([])

  const [stopSequence, setStopSequence] = useState('1')
  const [stopName, setStopName] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('Monday')
  const [departureTime, setDepartureTime] = useState('08:00')
  const [departureNote, setDepartureNote] = useState('')

  const loadLines = useCallback(async () => {
    const list = await apiFetch<BusLine[]>('/api/v1/bus-lines?activeOnly=false', {}, true)
    setLines(list)
    setSelectedId((current) => current || list[0]?.id || '')
  }, [])

  const loadDetail = useCallback(async (id: string) => {
    if (!id) {
      setDetail(null)
      return
    }
    const data = await apiFetch<BusLineDetails>(`/api/v1/bus-lines/${id}`, {}, true)
    setDetail(data)
    const nextSequence =
      data.stops.length === 0 ? 1 : Math.max(...data.stops.map((s) => s.sequence)) + 1
    setStopSequence(String(nextSequence))
  }, [])

  useEffect(() => {
    void loadLines().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Hatlar yüklenemedi.')
    })
  }, [loadLines])

  useEffect(() => {
    if (!selectedId) return
    void loadDetail(selectedId).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Hat detayı yüklenemedi.')
    })
  }, [selectedId, loadDetail])

  const counts = useMemo(() => {
    const next = { all: lines.length, active: 0, inactive: 0 }
    for (const line of lines) {
      if (line.isActive) next.active += 1
      else next.inactive += 1
    }
    return next
  }, [lines])

  const filteredLines = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return lines.filter((line) => {
      if (activeFilter === 'active' && !line.isActive) return false
      if (activeFilter === 'inactive' && line.isActive) return false
      if (!needle) return true
      return `${line.code} ${line.name} ${line.routeSummary}`
        .toLocaleLowerCase('tr-TR')
        .includes(needle)
    })
  }, [lines, activeFilter, q])

  const departuresByDay = useMemo(() => {
    if (!detail) return []
    return DAYS.map((day) => ({
      ...day,
      items: detail.departures
        .filter((d) => d.dayOfWeek === day.value)
        .sort((a, b) => a.departureTime.localeCompare(b.departureTime)),
    })).filter((group) => group.items.length > 0)
  }, [detail])

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await action()
      setInfo(okMessage)
      await loadLines()
      if (selectedId) await loadDetail(selectedId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function onCreateLine(event: FormEvent) {
    event.preventDefault()
    const fare = Number(baseFare)
    if (!Number.isFinite(fare) || fare < 0) {
      setError('Geçerli bir taban ücret girin.')
      return
    }

    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const created = await apiFetch<{ id: string }>(
        '/api/v1/bus-lines',
        {
          method: 'POST',
          body: JSON.stringify({
            code: code.trim(),
            name: name.trim(),
            routeSummary: routeSummary.trim() || null,
            baseFare: fare,
          }),
        },
        true,
      )

      for (let i = 0; i < pendingStops.length; i += 1) {
        await apiFetch(
          `/api/v1/bus-lines/${created.id}/stops`,
          {
            method: 'POST',
            body: JSON.stringify({ sequence: i + 1, name: pendingStops[i] }),
          },
          true,
        )
      }

      setCode('')
      setName('')
      setRouteSummary('')
      setBaseFare('17.50')
      setPendingStops([])
      setSelectedId(created.id)
      setInfo(
        pendingStops.length > 0
          ? `Hat oluşturuldu; ${pendingStops.length} durak eklendi.`
          : 'Hat oluşturuldu.',
      )
      await loadLines()
      await loadDetail(created.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function onAddStop(event: FormEvent) {
    event.preventDefault()
    if (!selectedId) return
    await run(async () => {
      await apiFetch(
        `/api/v1/bus-lines/${selectedId}/stops`,
        {
          method: 'POST',
          body: JSON.stringify({
            sequence: Number(stopSequence),
            name: stopName.trim(),
          }),
        },
        true,
      )
      setStopName('')
    }, 'Durak eklendi.')
  }

  async function onAddDeparture(event: FormEvent) {
    event.preventDefault()
    if (!selectedId) return
    await run(async () => {
      await apiFetch(
        `/api/v1/bus-lines/${selectedId}/departures`,
        {
          method: 'POST',
          body: JSON.stringify({
            dayOfWeek,
            departureTime: `${departureTime}:00`,
            note: departureNote.trim() || null,
          }),
        },
        true,
      )
      setDepartureNote('')
    }, 'Hareket saati eklendi.')
  }

  function applyTemplate(template: (typeof LINE_TEMPLATES)[number]) {
    setCode(template.code)
    setName(template.name)
    setRouteSummary(template.routeSummary)
    setBaseFare(template.baseFare)
    setPendingStops([...template.stops])
    setInfo('Hat şablonu yüklendi — oluşturunca duraklar da eklenir.')
    setError(null)
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Hat yönetimi</h1>
        <p className="muted">
          Yeni hat, durak ve hareket saati. Genel görünüm: <Link to="/hatlar">/hatlar</Link>
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="stats-strip" aria-label="Hat özeti">
        <div>
          <span className="muted">Toplam</span>
          <strong>{counts.all}</strong>
        </div>
        <div>
          <span className="muted">Aktif</span>
          <strong>{counts.active}</strong>
        </div>
        <div>
          <span className="muted">Pasif</span>
          <strong>{counts.inactive}</strong>
        </div>
        <div>
          <span className="muted">Seçili durak</span>
          <strong>{detail?.stops.length ?? 0}</strong>
        </div>
      </div>

      <form className="panel stack" onSubmit={(e) => void onCreateLine(e)}>
        <h3 style={{ margin: 0 }}>Yeni hat</h3>
        <div className="dept-chip-row" role="group" aria-label="Hat şablonları">
          {LINE_TEMPLATES.map((template) => (
            <button key={template.code} type="button" onClick={() => applyTemplate(template)}>
              {template.code}
              <span>{template.name.split('–')[0].trim()}</span>
            </button>
          ))}
        </div>
        <div className="form-two-col">
          <div className="field">
            <label htmlFor="lineCode">Kod</label>
            <input id="lineCode" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="lineFare">Taban ücret (₺)</label>
            <input
              id="lineFare"
              type="number"
              min="0"
              step="0.01"
              value={baseFare}
              onChange={(e) => setBaseFare(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="lineName">Ad</label>
          <input id="lineName" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="lineRoute">Güzergâh özeti</label>
          <input
            id="lineRoute"
            value={routeSummary}
            onChange={(e) => setRouteSummary(e.target.value)}
          />
        </div>
        {pendingStops.length > 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Şablon durakları: {pendingStops.join(' → ')}
          </p>
        ) : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          Hat oluştur
        </button>
      </form>

      <section className="panel stack">
        <h3 style={{ margin: 0 }}>Hat seç</h3>
        <div className="field">
          <label htmlFor="line-search">Ara</label>
          <input
            id="line-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kod, ad, güzergâh…"
          />
        </div>
        <div className="desk-tabs" role="tablist" aria-label="Aktiflik filtresi">
          {(
            [
              { id: 'all', label: 'Tümü', count: counts.all },
              { id: 'active', label: 'Aktif', count: counts.active },
              { id: 'inactive', label: 'Pasif', count: counts.inactive },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.id}
              className={activeFilter === filter.id ? 'is-active' : undefined}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
              <span>{filter.count}</span>
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="selectedLine">Hat</label>
          <select
            id="selectedLine"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {filteredLines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.code} — {line.name}
                {line.isActive ? '' : ' (pasif)'}
              </option>
            ))}
          </select>
        </div>
        {filteredLines.length === 0 ? <p className="muted">Bu filtrede hat yok.</p> : null}
        {detail ? (
          <p className="muted" style={{ margin: 0 }}>
            {detail.routeSummary || 'Güzergâh yok'} · ₺{detail.baseFare.toFixed(2)} ·{' '}
            {detail.departures.length} sefer · <Link to={`/hatlar/${detail.id}`}>Herkese açık detay</Link>
          </p>
        ) : null}
      </section>

      {selectedId ? (
        <>
          <form className="panel stack" onSubmit={(e) => void onAddStop(e)}>
            <h3 style={{ margin: 0 }}>Durak ekle</h3>
            <div className="form-two-col">
              <div className="field">
                <label htmlFor="stopSeq">Sıra</label>
                <input
                  id="stopSeq"
                  type="number"
                  min="1"
                  value={stopSequence}
                  onChange={(e) => setStopSequence(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="stopName">Durak adı</label>
                <input
                  id="stopName"
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Durak ekle
            </button>
            {detail && detail.stops.length > 0 ? (
              <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {detail.stops.map((s) => (
                  <li key={s.id}>
                    {s.sequence}. {s.name}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">Henüz durak yok.</p>
            )}
          </form>

          <form className="panel stack" onSubmit={(e) => void onAddDeparture(e)}>
            <h3 style={{ margin: 0 }}>Hareket saati ekle</h3>
            <div className="form-two-col">
              <div className="field">
                <label htmlFor="depDay">Gün</label>
                <select
                  id="depDay"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="depTime">Saat</label>
                <input
                  id="depTime"
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="dept-chip-row" role="group" aria-label="Saat önerileri">
              {TIME_PRESETS.map((time) => (
                <button key={time} type="button" onClick={() => setDepartureTime(time)}>
                  {time}
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="depNote">Not</label>
              <input
                id="depNote"
                value={departureNote}
                onChange={(e) => setDepartureNote(e.target.value)}
                placeholder="Örn. Yoğun sefer"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Saat ekle
            </button>
            {departuresByDay.length > 0 ? (
              <div className="stack">
                {departuresByDay.map((group) => (
                  <div key={group.value}>
                    <strong>{group.label}</strong>
                    <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>
                      {group.items.map((d) => (
                        <li key={d.id}>
                          {d.departureTime.slice(0, 5)}
                          {d.note ? ` — ${d.note}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Henüz hareket saati yok.</p>
            )}
          </form>
        </>
      ) : null}
    </div>
  )
}

export function BusLinesManagePage() {
  return (
    <RequireAuth>
      <AdminGate>
        <BusLinesManageContent />
      </AdminGate>
    </RequireAuth>
  )
}
