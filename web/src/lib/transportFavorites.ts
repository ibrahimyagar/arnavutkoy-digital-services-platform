const KEY = 'arnavutkoy.tx.favLines'
const PREFERRED_CARD = 'arnavutkoy.tx.preferredCard'

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function readFavoriteLineIds(): string[] {
  return readIds(KEY)
}

export function isFavoriteLine(id: string): boolean {
  return readFavoriteLineIds().includes(id)
}

export function toggleFavoriteLine(id: string): string[] {
  const current = readFavoriteLineIds()
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function readPreferredCardId(): string | null {
  return localStorage.getItem(PREFERRED_CARD)
}

export function writePreferredCardId(id: string | null) {
  if (!id) localStorage.removeItem(PREFERRED_CARD)
  else localStorage.setItem(PREFERRED_CARD, id)
}
