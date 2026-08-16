import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  AuthShell,
  friendlyAuthError,
  passwordStrengthOk,
} from '../components/auth/AuthShell'
import { apiFetch } from '../lib/api'
import { safeReturnPath } from '../lib/returnUrl'

export function RegisterPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeReturnPath(params.get('next'))
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'E' | 'K' | ''>('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const passwordHint = useMemo(() => {
    if (!password) return null
    if (!passwordStrengthOk(password)) {
      return 'En az 8 karakter; büyük harf, küçük harf ve rakam içermeli.'
    }
    if (confirmPassword && password !== confirmPassword) return 'Şifreler eşleşmiyor.'
    if (confirmPassword && password === confirmPassword) return 'Şifreler eşleşiyor.'
    return 'Şifre kuralına uygun.'
  }, [password, confirmPassword])

  if (isAuthenticated) {
    return <Navigate to={next} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      if (!acceptedTerms) {
        setError('Kayıt bilgilendirmesini kabul etmelisiniz.')
        return
      }
      if (!passwordStrengthOk(password)) {
        setError('Şifre en az 8 karakter olmalı; büyük harf, küçük harf ve rakam içermelidir.')
        return
      }
      if (password !== confirmPassword) {
        setError('Şifre ile tekrarı eşleşmiyor.')
        return
      }
      if (!gender) {
        setError('Cinsiyet seçiniz.')
        return
      }

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          fullName,
          phoneNumber: phoneNumber.trim(),
          nationalId: nationalId.trim(),
          birthDate,
          gender,
          password,
        }),
      })
      await login(email.trim(), password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : null))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Yeni hesap oluştur"
      lead="Arnavutköy360 vatandaş hesabı ile kişisel işlemlere güvenli erişim sağlayın."
      footer={
        <>
          Zaten hesabınız var mı?{' '}
          <Link to={next === '/panel' ? '/giris' : `/giris?next=${encodeURIComponent(next)}`}>
            Giriş yapın
          </Link>
        </>
      }
    >
      {error ? (
        <p className="ax-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="ax-form" onSubmit={(event) => void onSubmit(event)} noValidate>
        <div className="ax-pair">
          <div className="field">
            <label htmlFor="ax-first">Ad</label>
            <input
              id="ax-first"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              autoComplete="given-name"
            />
          </div>
          <div className="field">
            <label htmlFor="ax-last">Soyad</label>
            <input
              id="ax-last"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="ax-reg-email">E-posta</label>
          <input
            id="ax-reg-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="ax-reg-phone">Telefon</label>
          <input
            id="ax-reg-phone"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder="05xxxxxxxxx"
          />
        </div>
        <div className="ax-pair">
          <div className="field">
            <label htmlFor="ax-nid">T.C. kimlik no</label>
            <input
              id="ax-nid"
              value={nationalId}
              onChange={(event) => setNationalId(event.target.value)}
              required
              inputMode="numeric"
              maxLength={11}
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="ax-birth">Doğum tarihi</label>
            <input
              id="ax-birth"
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              required
              autoComplete="bday"
            />
          </div>
        </div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cinsiyet</legend>
          <div style={{ display: 'flex', gap: '1.1rem', marginTop: '0.35rem' }}>
            <label className="ax-check">
              <input type="radio" name="ax-gender" checked={gender === 'E'} onChange={() => setGender('E')} />
              Erkek
            </label>
            <label className="ax-check">
              <input type="radio" name="ax-gender" checked={gender === 'K'} onChange={() => setGender('K')} />
              Kadın
            </label>
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor="ax-reg-pass">Şifre</label>
          <div className="ax-pass">
            <input
              id="ax-reg-pass"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? 'Gizle' : 'Göster'}
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="ax-reg-pass2">Şifre tekrar</label>
          <input
            id="ax-reg-pass2"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {passwordHint ? (
          <p className={`ax-hint${passwordHint.includes('eşleşmiyor') || passwordHint.includes('içermeli') ? ' is-bad' : ' is-ok'}`}>
            {passwordHint}
          </p>
        ) : null}
        <label className="ax-check" style={{ alignItems: 'flex-start' }}>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            style={{ marginTop: '0.2rem' }}
          />
          <span>
            Bu platformun portföy/demo amaçlı olduğunu ve gerçek belediye işlemi olmadığını kabul
            ediyorum.
          </span>
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Hesap oluşturuluyor…' : 'Hesap oluştur'}
        </button>
      </form>
    </AuthShell>
  )
}
