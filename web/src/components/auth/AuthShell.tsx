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

export function AuthShell({
  title,
  lead,
  children,
  footer,
}: {
  title: string
  lead: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="ax">
      <div className="ax-frame">
        <aside className="ax-brand" aria-label="Arnavutköy360">
          <Link to="/" className="ax-brand-link">
            <BrandLogo className="ax-logo" />
            <span>
              <strong>Arnavutköy360</strong>
              <small>Dijital Belediye Hizmet Platformu</small>
            </span>
          </Link>
          <h1>
            Dijital belediyecilik,
            <br />
            tek noktadan hizmet.
          </h1>
          <p>
            Belediye hizmetlerine, başvurularınıza ve kişisel işlemlerinize güvenli şekilde ulaşın.
          </p>
          <ul>
            {BENEFITS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="ax-note">
            Bu proje portföy amaçlı bir demadır; resmi belediye işlemi değildir.
          </p>
        </aside>
        <section className="ax-panel">
          <div className="ax-card">
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

export function friendlyAuthError(message: string | null | undefined) {
  if (!message) return 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'
  const lower = message.toLocaleLowerCase('tr-TR')
  if (
    lower.includes('password') ||
    lower.includes('parola') ||
    lower.includes('şifre') ||
    lower.includes('unauthorized') ||
    lower.includes('401') ||
    lower.includes('invalid') ||
    lower.includes('hatalı') ||
    lower.includes('yanlış') ||
    lower.includes('credentials')
  ) {
    return 'E-posta veya şifre hatalı. Bilgilerinizi kontrol ederek tekrar deneyin.'
  }
  if (lower.includes('lock') || lower.includes('kilit')) {
    return 'Hesabınız geçici olarak kilitlendi. Kısa süre sonra tekrar deneyin.'
  }
  if (lower.includes('email') || lower.includes('e-posta') || lower.includes('already')) {
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
