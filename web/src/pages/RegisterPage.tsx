import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../lib/api'

export function RegisterPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'E' | 'K' | ''>('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
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
      if (!acceptedTerms) {
        setError('Kayıt sözleşmesini kabul etmelisiniz.')
        return
      }
      if (password !== confirmPassword) {
        setError('Parola ile tekrarı eşleşmiyor.')
        return
      }
      if (!gender) {
        setError('Cinsiyet seçiniz.')
        return
      }

      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          fullName,
          phoneNumber,
          nationalId,
          birthDate,
          gender,
          password,
        }),
      })
      await login(email.trim(), password)
      navigate('/panel')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="panel stack">
        <div>
          <h2>Kayıt ol</h2>
          <p className="muted">
            Giriş e-posta ile yapılır. TCKN, doğum tarihi ve cinsiyet profil alanıdır (kurgusal demo).
          </p>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <form className="stack" onSubmit={(e) => void onSubmit(e)}>
          <div className="field">
            <label htmlFor="reg-email">E-posta</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-name">Ad soyad</label>
            <input
              id="reg-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-phone">Telefon</label>
            <input
              id="reg-phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="05xxxxxxxxx"
              autoComplete="tel"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-nid">T.C. kimlik no</label>
            <input
              id="reg-nid"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
              inputMode="numeric"
              maxLength={11}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-birth">Doğum tarihi</label>
            <input
              id="reg-birth"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </div>
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink-soft)' }}>
              Cinsiyet
            </legend>
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.35rem' }}>
              <label style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'E'}
                  onChange={() => setGender('E')}
                />
                Erkek
              </label>
              <label style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="gender"
                  checked={gender === 'K'}
                  onChange={() => setGender('K')}
                />
                Kadın
              </label>
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="reg-pass">Parola</label>
            <input
              id="reg-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="field">
            <label htmlFor="reg-pass2">Parola tekrar</label>
            <input
              id="reg-pass2"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <label style={{ display: 'inline-flex', gap: '0.55rem', alignItems: 'flex-start', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              style={{ marginTop: '0.2rem' }}
            />
            <span className="muted">
              Demo kayıt sözleşmesini kabul ediyorum. Bu platform gerçek belediye işlemi değildir.
            </span>
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Kaydediliyor…' : 'Hesap oluştur'}
          </button>
        </form>

        <p className="muted">
          Zaten hesabınız var mı? <Link to="/giris">Giriş yapın</Link>
        </p>
      </div>
    </div>
  )
}
