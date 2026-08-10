import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [nationalId, setNationalId] = useState('10000000146')
  const [password, setPassword] = useState('Demo!Citizen123')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/panel" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(nationalId.trim(), password)
      navigate('/panel')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <div className="panel stack">
        <div>
          <h2>Hesap girişi</h2>
          <p className="muted">T.C. kimlik numarası ve şifrenizle giriş yapın.</p>
        </div>

        <div className="notice">
          Vatandaş: <code>10000000146</code> / <code>Demo!Citizen123</code>
          <br />
          Görevli: <code>10000000252</code> / <code>Demo!Officer123</code>
          <br />
          Yönetici: <code>10000000368</code> / <code>Demo!Admin123</code>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <form className="stack" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label htmlFor="nationalId">T.C. Kimlik No</label>
            <input
              id="nationalId"
              inputMode="numeric"
              autoComplete="username"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
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
          <Link to="/">Ana sayfaya dön</Link>
        </p>
      </div>
    </div>
  )
}
