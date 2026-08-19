import { useMemo, useState } from 'react'
import type { BusLineDeparture } from '../../lib/api'
import {
  dayLabel,
  departuresForGroup,
  formatDepartureTime,
  scheduleSummary,
  SCHEDULE_PERIOD_LABEL,
  type ScheduleDayGroup,
  upcomingDepartures,
} from '../../lib/busSchedule'

type Props = {
  departures: BusLineDeparture[]
  lineCode: string
  compact?: boolean
}

const TABS: { id: ScheduleDayGroup; label: string }[] = [
  { id: 'today', label: 'Bugün' },
  { id: 'weekday', label: 'Hafta içi' },
  { id: 'saturday', label: 'Cumartesi' },
  { id: 'sunday', label: 'Pazar' },
]

export function BusLineSchedulePanel({ departures, lineCode, compact = false }: Props) {
  const [tab, setTab] = useState<ScheduleDayGroup>('today')
  const upcoming = useMemo(() => upcomingDepartures(departures), [departures])
  const slots = useMemo(() => departuresForGroup(departures, tab), [departures, tab])
  const summary = useMemo(() => scheduleSummary(departures, tab), [departures, tab])

  if (departures.length === 0) {
    return (
      <section className="tx-schedule tx-schedule--empty">
        <p className="tx-kicker">Sefer saati</p>
        <h2>Hareket saatleri henüz yüklenmedi.</h2>
        <p className="tx-muted">Hat katalogu güncelleniyor. Resmi saatler için İETT sayfasını kullanın.</p>
      </section>
    )
  }

  return (
    <section className={`tx-schedule${compact ? ' tx-schedule--compact' : ''}`} aria-labelledby="tx-sched-title">
      <header className="tx-schedule-head">
        <div>
          <p className="tx-kicker">Sefer saati</p>
          <h2 id="tx-sched-title">{lineCode} — {SCHEDULE_PERIOD_LABEL}</h2>
          {summary ? <p className="tx-muted">{summary}</p> : null}
        </div>
        {!compact && upcoming.length > 0 ? (
          <div className="tx-upcoming" aria-label="Yaklaşan seferler">
            <p className="tx-kicker">Sıradaki</p>
            <ul>
              {upcoming.map((item) => (
                <li key={item.time}>
                  <strong>{item.time}</strong>
                  <span>
                    {item.minutesUntil === 0
                      ? 'Şimdi'
                      : item.minutesUntil < 60
                        ? `${item.minutesUntil} dk`
                        : `${Math.floor(item.minutesUntil / 60)} sa ${item.minutesUntil % 60} dk`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

      <div className="tx-sched-tabs" role="tablist" aria-label="Gün seçimi">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'is-on' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.id === 'today' ? `${item.label} (${dayLabel(new Date().getDay())})` : item.label}
          </button>
        ))}
      </div>

      {slots.length === 0 ? (
        <p className="tx-muted">Bu gün için kayıtlı sefer yok.</p>
      ) : (
        <ol className="tx-sched-grid" aria-label="Kalkış saatleri">
          {slots.map((item) => (
            <li key={`${item.dayOfWeek}-${item.departureTime}`}>
              <time dateTime={item.departureTime}>{formatDepartureTime(item.departureTime)}</time>
              {item.note ? <span className="tx-sched-note">{item.note}</span> : null}
            </li>
          ))}
        </ol>
      )}

      <p className="tx-muted tx-sched-disclaimer">
        Demo tarife — gerçek İETT/İBB canlı verisi değildir. Resmi duyuru ve yaz/kış tarifesi değişikliklerini İETT
        üzerinden doğrulayın.
      </p>
    </section>
  )
}
