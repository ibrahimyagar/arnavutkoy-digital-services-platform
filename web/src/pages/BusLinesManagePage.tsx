import { useCallback, useEffect, useState, type FormEvent } from 'react'
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

function BusLinesManageContent() {
  const [lines, setLines] = useState<BusLine[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState<BusLineDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [routeSummary, setRouteSummary] = useState('')
  const [baseFare, setBaseFare] = useState('17.50')

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
      setCode('')
      setName('')
      setRouteSummary('')
      setBaseFare('17.50')
      setSelectedId(created.id)
      setInfo('Hat oluşturuldu.')
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

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Hat yönetimi</h1>
        <p className="muted">
          Yeni hat, durak ve hareket saati ekleyin. Genel görünüm:{' '}
          <Link to="/hatlar">/hatlar</Link>
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <form className="panel stack" onSubmit={(e) => void onCreateLine(e)}>
        <h3>Yeni hat</h3>
        <div className="field">
          <label htmlFor="lineCode">Kod</label>
          <input id="lineCode" value={code} onChange={(e) => setCode(e.target.value)} required />
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
        <button className="btn btn-primary" type="submit" disabled={busy}>
          Hat oluştur
        </button>
      </form>

      <section className="panel stack">
        <h3>Hat seç</h3>
        <div className="field">
          <label htmlFor="selectedLine">Hat</label>
          <select
            id="selectedLine"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {lines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.code} — {line.name}
                {line.isActive ? '' : ' (pasif)'}
              </option>
            ))}
          </select>
        </div>
        {detail ? (
          <p className="muted" style={{ margin: 0 }}>
            {detail.routeSummary || 'Güzergâh yok'} · ₺{detail.baseFare.toFixed(2)} ·{' '}
            <Link to={`/hatlar/${detail.id}`}>Herkese açık detay</Link>
          </p>
        ) : null}
      </section>

      {selectedId ? (
        <>
          <form className="panel stack" onSubmit={(e) => void onAddStop(e)}>
            <h3>Durak ekle</h3>
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
            <h3>Hareket saati ekle</h3>
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
            <div className="field">
              <label htmlFor="depNote">Not</label>
              <input
                id="depNote"
                value={departureNote}
                onChange={(e) => setDepartureNote(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              Saat ekle
            </button>
            {detail && detail.departures.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {detail.departures.map((d) => (
                  <li key={d.id}>
                    {DAYS.find((x) => x.value === d.dayOfWeek)?.label ?? d.dayOfWeek} ·{' '}
                    {d.departureTime.slice(0, 5)}
                    {d.note ? ` — ${d.note}` : ''}
                  </li>
                ))}
              </ul>
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
