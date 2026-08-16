import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/ui/PageChrome'
import { safeReturnPath } from '../lib/returnUrl'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeReturnPath(params.get('next'))
  const [email, setEmail] = useState('vatandas@demo.arnavutkoy.local')
  const [password, setPassword] = useState('Demo!Citizen123')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={next} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
      navigate(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container page" style={{ maxWidth: 460 }}>
      <div className="panel stack">
        <PageHeader title="Hesap girişi" description="E-posta ve şifrenizle giriş yapın." />

        <div className="notice">
          Vatandaş: <code>vatandas@demo.arnavutkoy.local</code> / <code>Demo!Citizen123</code>
          <br />
          Görevli: <code>gorevli@demo.arnavutkoy.local</code> / <code>Demo!Officer123</code>
          <br />
          Yönetici: <code>yonetici@demo.arnavutkoy.local</code> / <code>Demo!Admin123</code>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <form className="stack" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </button>
        </form>

        <p className="muted">
          Hesabınız yok mu?{' '}
          <Link to={next === '/panel' ? '/kayit' : `/kayit?next=${encodeURIComponent(next)}`}>Kayıt olun</Link>
          {' · '}
          <Link to="/">Ana sayfa</Link>
        </p>
      </div>
    </div>
  )
}
