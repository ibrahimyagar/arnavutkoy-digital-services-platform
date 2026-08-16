import type { Debt } from './api'

export type StatusFilter = 'all' | 'unpaid' | 'paid' | 'overdue'
export type TypeFilter = 'all' | 'Water' | 'Property' | 'Other'
export type PanelMode = 'detail' | 'pay' | 'receipt'

export const TYPE_LABEL: Record<string, string> = {
  Water: 'Su tüketimi',
  Property: 'Emlak vergisi',
  Other: 'Diğer belediye alacağı',
}

export const TYPE_SHORT: Record<string, string> = {
  Water: 'Su',
  Property: 'Emlak',
  Other: 'Diğer',
}

export function moneyTry(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

export function dateTr(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function dateTimeTr(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function dueYear(debt: Debt) {
  return new Date(debt.dueDateUtc).getFullYear()
}

export function recordCode(id: string) {
  return `BRC-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

export function isUnpaid(debt: Debt) {
  return debt.status === 'Unpaid'
}

export function overdueDays(debt: Debt) {
  if (typeof debt.overdueDays === 'number') return debt.overdueDays
  if (!isUnpaid(debt)) return 0
  const start = new Date(debt.dueDateUtc)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((today.getTime() - start.getTime()) / 86_400_000)
  return days > 0 ? days : 0
}

export function isOverdue(debt: Debt) {
  return isUnpaid(debt) && overdueDays(debt) > 0
}

export function displayStatus(debt: Debt): 'Paid' | 'Overdue' | 'Unpaid' {
  if (debt.status === 'Paid') return 'Paid'
  if (isOverdue(debt)) return 'Overdue'
  return 'Unpaid'
}

export function statusLabel(debt: Debt) {
  const status = displayStatus(debt)
  if (status === 'Paid') return 'Ödendi'
  if (status === 'Overdue') return 'Gecikmiş'
  return 'Ödenmedi'
}

export function settledAmount(debt: Debt) {
  if (debt.status !== 'Paid') return 0
  return debt.paidAmount ?? debt.principalAmount
}

export function maskCard(digits: string) {
  const clean = digits.replace(/\D/g, '')
  if (clean.length < 8) return '****'
  return `${clean.slice(0, 4)}${'*'.repeat(Math.max(clean.length - 8, 0))}${clean.slice(-4)}`
}

export function parseStatus(value: string | null): StatusFilter {
  if (value === 'tumu' || value === 'all') return 'all'
  if (value === 'odendi' || value === 'Paid') return 'paid'
  if (value === 'gecikmis' || value === 'overdue') return 'overdue'
  if (value === 'odenmedi' || value === 'Unpaid' || value === 'unpaid') return 'unpaid'
  return 'unpaid'
}

export function statusQuery(value: StatusFilter) {
  if (value === 'all') return 'tumu'
  if (value === 'paid') return 'odendi'
  if (value === 'overdue') return 'gecikmis'
  return 'odenmedi'
}

export function parseType(value: string | null): TypeFilter {
  if (value === 'su' || value === 'Water') return 'Water'
  if (value === 'emlak' || value === 'Property') return 'Property'
  if (value === 'diger' || value === 'Other') return 'Other'
  return 'all'
}

export function typeQuery(value: TypeFilter) {
  if (value === 'Water') return 'su'
  if (value === 'Property') return 'emlak'
  if (value === 'Other') return 'diger'
  return 'tumu'
}

export function parseYear(value: string | null) {
  if (!value || value === 'tumu' || value === 'all') return 'all'
  const year = Number(value)
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : 'all'
}

export function parsePanel(value: string | null): PanelMode | null {
  if (value === 'detay' || value === 'detail') return 'detail'
  if (value === 'ode' || value === 'pay') return 'pay'
  if (value === 'dekont' || value === 'receipt') return 'receipt'
  return null
}

export function panelQuery(value: PanelMode) {
  if (value === 'pay') return 'ode'
  if (value === 'receipt') return 'dekont'
  return 'detay'
}

export function matchesQuery(debt: Debt, query: string) {
  const needle = query.trim().toLocaleLowerCase('tr-TR')
  if (!needle) return true
  const hay = [
    TYPE_LABEL[debt.type],
    TYPE_SHORT[debt.type],
    debt.type,
    recordCode(debt.id),
    debt.id,
    String(dueYear(debt)),
    statusLabel(debt),
  ]
    .join(' ')
    .toLocaleLowerCase('tr-TR')
  return hay.includes(needle)
}

export function filterDebts(
  items: Debt[],
  status: StatusFilter,
  type: TypeFilter,
  year: number | 'all',
  query: string,
) {
  return items
    .filter((debt) => {
      if (type !== 'all' && debt.type !== type) return false
      if (year !== 'all' && dueYear(debt) !== year) return false
      if (!matchesQuery(debt, query)) return false
      if (status === 'unpaid') return isUnpaid(debt)
      if (status === 'paid') return debt.status === 'Paid'
      if (status === 'overdue') return isOverdue(debt)
      return true
    })
    .sort((a, b) => {
      const rank = (debt: Debt) => {
        if (isOverdue(debt)) return 0
        if (isUnpaid(debt)) return 1
        return 2
      }
      const byStatus = rank(a) - rank(b)
      if (byStatus !== 0) return byStatus
      return new Date(a.dueDateUtc).getTime() - new Date(b.dueDateUtc).getTime()
    })
}

export function accountTotals(items: Debt[]) {
  let open = 0
  let paid = 0
  let overdue = 0
  let upcoming = 0
  let openCount = 0
  let overdueCount = 0
  let paidCount = 0

  for (const debt of items) {
    if (isUnpaid(debt)) {
      open += debt.totalPayable
      openCount += 1
      if (isOverdue(debt)) {
        overdue += debt.totalPayable
        overdueCount += 1
      } else {
        upcoming += debt.totalPayable
      }
    } else if (debt.status === 'Paid') {
      paid += settledAmount(debt)
      paidCount += 1
    }
  }

  return { open, paid, overdue, upcoming, openCount, overdueCount, paidCount }
}
