import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthShell } from '../components/auth/AuthShell'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    await new Promise((resolve) => window.setTimeout(resolve, 450))
    setSent(true)
    setBusy(false)
  }

  return (
    <AuthShell
      title="Şifrenizi mi unuttunuz?"
      lead="E-posta adresinizi girin. Bu demoda gerçek posta gönderilmez; akış portföy deneyimi içindir."
      footer={
        <>
          Şifrenizi hatırladınız mı? <Link to="/giris">Giriş yapın</Link>
          {' · '}
          <Link to="/">Ana sayfa</Link>
        </>
      }
    >
      {sent ? (
        <div className="ax-form">
          <p className="ax-hint is-ok" role="status">
            Talebiniz alındı. Bu portföy demosunda e-posta altyapısı yoktur; giriş
            yapabiliyorsanız paneldeki <strong>Ayarlar → Şifre değiştir</strong> adımını kullanın.
          </p>
          <Link className="btn btn-primary" to="/giris">
            Giriş ekranına dön
          </Link>
        </div>
      ) : (
        <form className="ax-form" onSubmit={(event) => void onSubmit(event)}>
          <div className="field">
            <label htmlFor="ax-forgot-email">E-posta</label>
            <input
              id="ax-forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Gönderiliyor…' : 'Şifre sıfırlama bağlantısı gönder'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
