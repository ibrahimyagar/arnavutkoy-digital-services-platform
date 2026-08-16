/** Same-origin relative paths only — blocks protocol-relative and external redirects. */
export function safeReturnPath(value: string | null | undefined, fallback = '/panel'): string {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}

export function loginPath(next?: string): string {
  if (!next) return '/giris'
  return `/giris?next=${encodeURIComponent(next)}`
}
