import type { BusLineDeparture } from './api'

export type ScheduleDayGroup = 'weekday' | 'saturday' | 'sunday' | 'today'

const DAY_NAMES_TR: Record<number, string> = {
  0: 'Pazar',
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
}

const DAY_NAMES_EN: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export function parseDayOfWeek(value: string | number): number {
  if (typeof value === 'number' && value >= 0 && value <= 6) return value
  const key = String(value).trim().toLowerCase()
  if (key in DAY_NAMES_EN) return DAY_NAMES_EN[key]
  const asNum = Number(key)
  if (!Number.isNaN(asNum) && asNum >= 0 && asNum <= 6) return asNum
  return new Date().getDay()
}

export function dayLabel(day: number): string {
  return DAY_NAMES_TR[day] ?? 'Gün'
}

export function formatDepartureTime(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return value
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

export function parseDepartureMinutes(value: string): number {
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return 0
  return Number(match[1]) * 60 + Number(match[2])
}

export function departuresForDay(departures: BusLineDeparture[], day: number): BusLineDeparture[] {
  return departures
    .filter((item) => parseDayOfWeek(item.dayOfWeek) === day)
    .sort((a, b) => parseDepartureMinutes(a.departureTime) - parseDepartureMinutes(b.departureTime))
}

export function departuresForGroup(departures: BusLineDeparture[], group: ScheduleDayGroup): BusLineDeparture[] {
  const today = new Date().getDay()
  if (group === 'today') return departuresForDay(departures, today)
  if (group === 'saturday') return departuresForDay(departures, 6)
  if (group === 'sunday') return departuresForDay(departures, 0)
  const weekday = departures.filter((item) => {
    const day = parseDayOfWeek(item.dayOfWeek)
    return day >= 1 && day <= 5
  })
  if (weekday.length === 0) return []
  const monday = departuresForDay(departures, 1)
  return monday.length > 0 ? monday : weekday.slice(0, 40)
}

export type UpcomingDeparture = {
  time: string
  minutesUntil: number
  note: string
}

export function upcomingDepartures(
  departures: BusLineDeparture[],
  now = new Date(),
  limit = 3,
): UpcomingDeparture[] {
  const day = now.getDay()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const today = departuresForDay(departures, day)

  const upcoming = today
    .map((item) => {
      const minutes = parseDepartureMinutes(item.departureTime)
      return {
        time: formatDepartureTime(item.departureTime),
        minutesUntil: minutes - nowMinutes,
        note: item.note,
      }
    })
    .filter((item) => item.minutesUntil >= 0)
    .slice(0, limit)

  if (upcoming.length > 0) return upcoming

  const tomorrow = (day + 1) % 7
  const nextDay = departuresForDay(departures, tomorrow)
  if (nextDay.length === 0) return []

  const first = nextDay[0]
  const firstMinutes = parseDepartureMinutes(first.departureTime)
  const minutesUntil = (24 * 60 - nowMinutes) + firstMinutes

  return [
    {
      time: formatDepartureTime(first.departureTime),
      minutesUntil,
      note: first.note,
    },
  ]
}

export function scheduleSummary(departures: BusLineDeparture[], group: ScheduleDayGroup): string | null {
  const slots = departuresForGroup(departures, group)
  if (slots.length === 0) return null

  const times = slots.map((item) => parseDepartureMinutes(item.departureTime))
  const first = formatDepartureTime(slots[0].departureTime)
  const last = formatDepartureTime(slots[slots.length - 1].departureTime)

  let interval: number | null = null
  if (times.length >= 3) {
    const gaps = times.slice(1, 4).map((value, index) => value - times[index])
    const avg = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
    if (avg > 0 && avg < 120) interval = Math.round(avg)
  }

  if (interval) return `${first} – ${last} · ~${interval} dk aralık · ${slots.length} sefer`
  return `${first} – ${last} · ${slots.length} sefer`
}

export const SCHEDULE_PERIOD_LABEL = 'Ağustos 2026 demo tarifesi'
