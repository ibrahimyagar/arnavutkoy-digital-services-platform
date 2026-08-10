import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import { RequireAuth } from './PanelPage'

function ChangePasswordContent() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (newPassword !== confirmPassword) {
      setError('Yeni parola ile tekrarı eşleşmiyor.')
      return
    }

    if (newPassword.length < 8) {
      setError('Yeni parola en az 8 karakter olmalı.')
      return
    }

    setBusy(true)
    try {
      await apiFetch(
        '/api/v1/auth/change-password',
        {
          method: 'POST',
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        },
        true,
      )
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setInfo('Parolanız güncellendi.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parola değiştirilemedi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <p className="muted">
        <Link to="/panel">← Panel</Link>
      </p>

      <form className="panel stack" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.8rem' }}>
            Parola değiştir
          </h1>
          <p className="muted">Mevcut parolanızı doğrulayıp yenisini kaydedin.</p>
        </div>

        {error ? <div className="error-box">{error}</div> : null}
        {info ? <div className="notice">{info}</div> : null}

        <div className="field">
          <label htmlFor="currentPassword">Mevcut parola</label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="newPassword">Yeni parola</label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Yeni parola (tekrar)</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          En az 8 karakter; en az bir harf ve bir rakam içermeli.
        </p>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Kaydediliyor…' : 'Parolayı güncelle'}
        </button>
      </form>
    </div>
  )
}

export function ChangePasswordPage() {
  return (
    <RequireAuth>
      <ChangePasswordContent />
    </RequireAuth>
  )
}
