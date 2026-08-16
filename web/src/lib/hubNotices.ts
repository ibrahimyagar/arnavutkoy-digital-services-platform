export type NotifyKind = 'payment' | 'result' | 'announcement' | 'system'

export type NotifyPrefs = Record<NotifyKind, boolean>

export const DEFAULT_NOTIFY_PREFS: NotifyPrefs = {
  payment: true,
  result: true,
  announcement: true,
  system: true,
}

const PREF_KEY = 'arnavutkoy.hub.notifyPrefs'
const READ_KEY = 'arnavutkoy.hub.notices.read'

export function loadNotifyPrefs(userId: string): NotifyPrefs {
  try {
    const raw = localStorage.getItem(`${PREF_KEY}.${userId}`)
    if (!raw) return { ...DEFAULT_NOTIFY_PREFS }
    const parsed = JSON.parse(raw) as Partial<NotifyPrefs>
    return { ...DEFAULT_NOTIFY_PREFS, ...parsed }
  } catch {
    return { ...DEFAULT_NOTIFY_PREFS }
  }
}

export function saveNotifyPrefs(userId: string, prefs: NotifyPrefs) {
  localStorage.setItem(`${PREF_KEY}.${userId}`, JSON.stringify(prefs))
}

export function loadReadNoticeIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${READ_KEY}.${userId}`)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function saveReadNoticeIds(userId: string, ids: string[]) {
  localStorage.setItem(`${READ_KEY}.${userId}`, JSON.stringify(ids))
}
