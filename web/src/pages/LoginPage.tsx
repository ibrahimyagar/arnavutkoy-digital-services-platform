import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  AuthShell,
  PasswordRevealButton,
  friendlyAuthError,
  loadRememberedEmail,
  saveRememberedEmail,
} from '../components/auth/AuthShell'
import { BusyButton } from '../components/ui/BusyButton'
import { safeReturnPath } from '../lib/returnUrl'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeReturnPath(params.get('next'))
  const [email, setEmail] = useState(() => loadRememberedEmail())
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => Boolean(loadRememberedEmail()))
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={next} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      saveRememberedEmail(email.trim(), remember)
      navigate(next, { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : null))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Tekrar hoş geldiniz"
      lead="Arnavutköy360 hesabınızla güvenli şekilde giriş yapın."
      footer={
        <>
          Hesabınız yok mu?{' '}
          <Link to={next === '/panel' ? '/kayit' : `/kayit?next=${encodeURIComponent(next)}`}>
            Yeni hesap oluştur
          </Link>
          {' · '}
          <Link to="/">Ana sayfa</Link>
        </>
      }
    >
      {error ? (
        <p className="ax-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="ax-form" onSubmit={(event) => void onSubmit(event)} noValidate aria-busy={busy}>
        <fieldset disabled={busy}>
          <div className="field">
          <label htmlFor="ax-email">E-posta</label>
          <input
            id="ax-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="ax-password">Şifre</label>
          <div className="ax-pass">
            <input
              id="ax-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <PasswordRevealButton shown={showPassword} onToggle={() => setShowPassword((value) => !value)} />
          </div>
        </div>
        <div className="ax-row">
          <label className="ax-check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            Beni hatırla
          </label>
          <Link to="/sifremi-unuttum">Şifremi unuttum</Link>
        </div>
          <BusyButton busy={busy} busyLabel="Giriş yapılıyor…">
            Giriş yap
          </BusyButton>
        </fieldset>
      </form>
    </AuthShell>
  )
}
