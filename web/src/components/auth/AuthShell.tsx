import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../BrandLogo'
import '../../pages/auth.css'

const BENEFITS = [
  'Güvenli kullanıcı hesabı',
  'Dijital başvuru ve takip',
  'Kişisel hizmetler',
  '7/24 erişilebilir portal',
]

const COMPACT_BENEFITS = ['Güvenli hesap', 'Dijital başvuru']

export function AuthShell({
  title,
  lead,
  children,
  footer,
  wide = false,
  compact = false,
}: {
  title: string
  lead: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  compact?: boolean
}) {
  const benefits = compact ? COMPACT_BENEFITS : BENEFITS
  return (
    <div className={compact ? 'ax ax--compact' : 'ax'}>
      <div className="ax-frame">
        <aside className={compact ? 'ax-brand ax-brand--compact' : 'ax-brand'} aria-label="Arnavutköy360">
          <Link to="/" className="ax-brand-link">
            <BrandLogo className="ax-logo" />
            <span>
              <strong>Arnavutköy360</strong>
              <small>Dijital Belediye Hizmet Platformu</small>
            </span>
          </Link>
          <h1>{compact ? 'Vatandaş hesabı, tek noktadan hizmet.' : <>Dijital belediyecilik,<br />tek noktadan hizmet.</>}</h1>
          <p>
            {compact
              ? 'Başvuru ve kişisel işlemlere güvenli erişim.'
              : 'Belediye hizmetlerine, başvurularınıza ve kişisel işlemlerinize güvenli şekilde ulaşın.'}
          </p>
          <ul>
            {benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="ax-note">Portföy demosu · resmi işlem değildir.</p>
        </aside>
        <section className="ax-panel">
          <div className={wide ? 'ax-card ax-card--wide' : 'ax-card'}>
            <header className="ax-card-head">
              <h2>{title}</h2>
              <p>{lead}</p>
            </header>
            {children}
            {footer ? <footer className="ax-card-foot">{footer}</footer> : null}
          </div>
        </section>
      </div>
    </div>
  )
}

export function friendlyRegisterError(message: string | null | undefined) {
  if (!message) return 'Kayıt tamamlanamadı. Lütfen bilgilerinizi kontrol edin.'
  const lower = message.toLocaleLowerCase('tr-TR')
  if (message.length > 180 || lower.includes('exception') || lower.includes('stack')) {
    return 'Kayıt şu an tamamlanamadı. Lütfen daha sonra tekrar deneyin.'
  }
  return message
}

export function friendlyAuthError(message: string | null | undefined) {
  if (!message) return 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'
  const lower = message.toLocaleLowerCase('tr-TR')
  if (
    lower.includes('429') ||
    lower.includes('too many') ||
    lower.includes('çok fazla deneme') ||
    lower.includes('kısa süre sonra')
  ) {
    return 'Çok fazla deneme yaptınız. Lütfen bir dakika sonra tekrar deneyin.'
  }
  if (lower.includes('lock') || lower.includes('kilit')) {
    return 'Hesabınız geçici olarak kilitlendi. Kısa süre sonra tekrar deneyin.'
  }
  if (
    lower.includes('parola hatalı') ||
    lower.includes('e-posta veya parola') ||
    lower.includes('e-posta veya şifre') ||
    lower.includes('unauthorized') ||
    lower.includes('401')
  ) {
    return 'E-posta veya şifre hatalı. Bilgilerinizi kontrol ederek tekrar deneyin.'
  }
  if (lower.includes('already') || lower.includes('zaten bir hesap')) {
    return message.length > 180 ? 'Kayıt tamamlanamadı. Bilgilerinizi kontrol edin.' : message
  }
  if (message.length > 180 || lower.includes('exception') || lower.includes('stack')) {
    return 'İşlem şu an tamamlanamadı. Lütfen daha sonra tekrar deneyin.'
  }
  return message
}

const REMEMBER_KEY = 'arnavutkoy.auth.rememberEmail'
const WELCOME_KEY = 'arnavutkoy.auth.welcome'

export function loadRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveRememberedEmail(email: string, remember: boolean) {
  try {
    if (remember && email) localStorage.setItem(REMEMBER_KEY, email)
    else localStorage.removeItem(REMEMBER_KEY)
  } catch {
    /* ignore */
  }
}

export function markWelcome(fullName: string) {
  try {
    sessionStorage.setItem(WELCOME_KEY, fullName)
  } catch {
    /* ignore */
  }
}

export function consumeWelcome() {
  try {
    const value = sessionStorage.getItem(WELCOME_KEY)
    if (value) sessionStorage.removeItem(WELCOME_KEY)
    return value
  } catch {
    return null
  }
}

export function passwordStrengthOk(password: string) {
  return (
    password.length >= 8 &&
    /[A-ZÇĞİÖŞÜ]/.test(password) &&
    /[a-zçğıöşü]/.test(password) &&
    /\d/.test(password)
  )
}

export function passwordStrengthScore(password: string) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-ZÇĞİÖŞÜ]/.test(password) && /[a-zçğıöşü]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (password.length >= 12 || /[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(password)) score += 1
  return Math.min(4, score)
}

export function PasswordRevealButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="ax-pass-toggle"
      aria-label={shown ? 'Şifreyi gizle' : 'Şifreyi göster'}
      onClick={onToggle}
    >
      {shown ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path
            fill="currentColor"
            d="M3.3 2.3 2 3.6l3.2 3.2A11.6 11.6 0 0 0 1 12c1.8 3.9 5.7 7 11 7 1.8 0 3.4-.3 4.9-.9l3.5 3.5 1.3-1.3zM12 17c-3.9 0-7-2.4-8.6-5 1-1.6 2.4-3 4.1-3.9l1.6 1.6A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1.1l1.5 1.5c-1.1.4-2.4.6-3.8.6m0-10c3.9 0 7 2.4 8.6 5-.5.8-1.1 1.6-1.9 2.3l-1.5-1.5A3 3 0 0 0 12 9c-.3 0-.6 0-.9.1L9.5 7.5C10.3 7.2 11.1 7 12 7"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path
            fill="currentColor"
            d="M12 5c-5.3 0-9.2 3.1-11 7 1.8 3.9 5.7 7 11 7s9.2-3.1 11-7c-1.8-3.9-5.7-7-11-7m0 12c-3.9 0-7-2.4-8.6-5C5 9.4 8.1 7 12 7s7 2.4 8.6 5c-1.6 2.6-4.7 5-8.6 5m0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6"
          />
        </svg>
      )}
    </button>
  )
}
