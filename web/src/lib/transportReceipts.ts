export type TransportReceipt = {
  id: string
  kind: 'topup' | 'board'
  createdAtUtc: string
  amount: number
  cardId: string
  cardNumber: string
  lineCode?: string
  lineName?: string
  stopName?: string
  boardingId?: string
  note: string
}

const KEY = 'arnavutkoy.tx.receipts'

export function readReceipts(): TransportReceipt[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TransportReceipt[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addReceipt(receipt: TransportReceipt) {
  const next = [receipt, ...readReceipts()].slice(0, 40)
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function receiptCode(kind: 'topup' | 'board', id: string) {
  const short = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return kind === 'topup' ? `ARB-YUK-${short}` : `ARB-BIN-${short}`
}
