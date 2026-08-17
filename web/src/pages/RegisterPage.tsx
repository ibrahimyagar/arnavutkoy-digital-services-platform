import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  AuthShell,
  PasswordRevealButton,
  friendlyRegisterError,
  passwordStrengthOk,
  passwordStrengthScore,
} from '../components/auth/AuthShell'
import { BusyButton } from '../components/ui/BusyButton'
import { apiFetch, normalizeEmail } from '../lib/api'
import { EMAIL_VERIFICATION } from '../lib/emailVerification'
import { safeReturnPath } from '../lib/returnUrl'

type FieldKey =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'nationalId'
  | 'birthDate'
  | 'password'
  | 'confirm'
  | 'terms'

function isValidTurkishNationalId(value: string) {
  if (!/^[1-9]\d{10}$/.test(value)) return false
  const digits = [...value].map((char) => Number(char))
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7]
  let tenth = ((oddSum * 7) - evenSum) % 10
  if (tenth < 0) tenth += 10
  if (tenth !== digits[9]) return false
  return (oddSum + evenSum + digits[9]) % 10 === digits[10]
}

function phoneDigits(raw: string) {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('90') && digits.length >= 12) {
    digits = `0${digits.slice(2)}`
  }
  return digits.slice(0, 11)
}

function formatPhoneMask(raw: string) {
  const digits = phoneDigits(raw)
  const chunks = [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)].filter(Boolean)
  return chunks.join(' ')
}

function isPlausiblePhone(digits: string) {
  return /^\d{10,11}$/.test(digits)
}

function isoDateLocal(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ageFromIso(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return 0
  const today = new Date()
  let age = today.getFullYear() - year
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age -= 1
  }
  return age
}

function RequiredMark() {
  return (
    <span className="ax-req" aria-hidden>
      *
    </span>
  )
}

function InfoTip({ id, text }: { id: string; text: string }) {
  return (
    <span className="ax-tip">
      <button type="button" className="ax-tip-btn" aria-describedby={id} aria-label="Bilgi">
        i
      </button>
      <span id={id} role="tooltip" className="ax-tip-pop">
        {text}
      </span>
    </span>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="ax-hint is-bad" role="alert">
      {message}
    </p>
  )
}

function StrengthMeter({ password }: { password: string }) {
  const score = passwordStrengthScore(password)
  const label = !password ? 'En az 8 karakter, harf ve rakam' : score <= 1 ? 'Zayıf' : score === 2 ? 'Orta' : score === 3 ? 'Güçlü' : 'Çok güçlü'
  return (
    <div className="ax-meter" aria-live="polite">
      <div className="ax-meter-bars" aria-hidden>
        {[1, 2, 3, 4].map((level) => (
          <span key={level} className={`ax-meter-bar${score >= level ? ` is-${score}` : ''}`} />
        ))}
      </div>
      <span className={!password ? '' : score <= 1 ? 'is-bad' : 'is-ok'}>{label}</span>
    </div>
  )
}

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
  const [optionalOpen, setOptionalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({})
  const [busy, setBusy] = useState(false)

  const maxAdultBirth = useMemo(() => {
    const limit = new Date()
    limit.setFullYear(limit.getFullYear() - 18)
    return isoDateLocal(limit)
  }, [])

  const nationalIdHint = useMemo(() => {
    const value = nationalId.trim()
    if (!value) return null
    if (!isValidTurkishNationalId(value)) return 'Biçim geçersiz.'
    return 'Biçim geçerli.'
  }, [nationalId])

  if (isAuthenticated) {
    return <Navigate to={next} replace />
  }

  function validate(): Partial<Record<FieldKey, string>> {
    const nextErrors: Partial<Record<FieldKey, string>> = {}
    if (!firstName.trim()) nextErrors.firstName = 'Ad zorunludur.'
    if (!lastName.trim()) nextErrors.lastName = 'Soyad zorunludur.'
    if (!email.trim()) nextErrors.email = 'E-posta zorunludur.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Geçerli bir e-posta girin.'
    const digits = phoneDigits(phoneNumber)
    if (!digits) nextErrors.phone = 'Telefon zorunludur.'
    else if (!isPlausiblePhone(digits)) nextErrors.phone = '10 veya 11 haneli telefon girin.'
    if (nationalId.trim() && !isValidTurkishNationalId(nationalId.trim())) {
      nextErrors.nationalId = 'Girildiyse 11 haneli ve geçerli olmalıdır.'
    }
    if (birthDate && ageFromIso(birthDate) < 18) {
      nextErrors.birthDate = 'Girildiyse 18 yaşında olmalısınız.'
    }
    if (!passwordStrengthOk(password.trim())) {
      nextErrors.password = 'En az 8 karakter, büyük/küçük harf ve rakam.'
    }
    if (password.trim() !== confirmPassword.trim()) nextErrors.confirm = 'Şifreler eşleşmiyor.'
    if (!acceptedTerms) nextErrors.terms = 'Bilgilendirmeyi kabul etmelisiniz.'
    return nextErrors
  }

  function clearError(key: FieldKey) {
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function focusFirst(errors: Partial<Record<FieldKey, string>>) {
    const firstKey = Object.keys(errors)[0]
    if (firstKey) document.getElementById(`ax-${firstKey}`)?.focus()
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setError(null)
    const nextErrors = validate()
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.nationalId || nextErrors.birthDate) setOptionalOpen(true)
      focusFirst(nextErrors)
      return
    }

    setBusy(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      const normalizedEmail = normalizeEmail(email)
      await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: normalizedEmail,
          fullName,
          phoneNumber: phoneDigits(phoneNumber),
          nationalId: nationalId.trim() || null,
          birthDate: birthDate || null,
          gender: gender || null,
          password: password.trim(),
        }),
      })
      await login(normalizedEmail, password.trim())
      navigate(next, { replace: true })
    } catch (err) {
      setError(friendlyRegisterError(err instanceof Error ? err.message : null))
    } finally {
      setBusy(false)
    }
  }

  const loginHref = next === '/panel' ? '/giris' : `/giris?next=${encodeURIComponent(next)}`

  return (
    <AuthShell
      wide
      compact
      title="Hesap oluşturun"
      lead="İletişim ve şifre yeterli. Kimlik numarası isteğe bağlı."
      footer={
        <>
          Zaten hesabınız var mı? <Link to={loginHref}>Giriş yapın</Link>
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
          <InputField
            id="ax-firstName"
            label="Ad"
            required
            value={firstName}
            autoComplete="given-name"
            error={fieldErrors.firstName}
            onChange={(value) => {
              setFirstName(value)
              clearError('firstName')
            }}
          />
          <InputField
            id="ax-lastName"
            label="Soyad"
            required
            value={lastName}
            autoComplete="family-name"
            error={fieldErrors.lastName}
            onChange={(value) => {
              setLastName(value)
              clearError('lastName')
            }}
          />
        </div>

        <div className="ax-pair">
          <InputField
            id="ax-email"
            label="E-posta"
            required
            type="email"
            value={email}
            autoComplete="email"
            placeholder="ornek@posta.adresi"
            error={fieldErrors.email}
            onChange={(value) => {
              setEmail(value)
              clearError('email')
            }}
            tip={EMAIL_VERIFICATION.tooltip}
            tipId="ax-email-tip"
          />
          <InputField
            id="ax-phone"
            label="Telefon"
            required
            value={phoneNumber}
            autoComplete="tel"
            inputMode="tel"
            placeholder="05xx xxx xx xx"
            error={fieldErrors.phone}
            onChange={(value) => {
              setPhoneNumber(formatPhoneMask(value))
              clearError('phone')
            }}
          />
        </div>

        <div className="ax-secure">
          <div className="ax-pair">
            <div className="field">
              <label htmlFor="ax-password">
                Şifre <RequiredMark />
              </label>
              <div className="ax-pass">
                <input
                  id="ax-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    clearError('password')
                  }}
                  minLength={8}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <PasswordRevealButton shown={showPassword} onToggle={() => setShowPassword((value) => !value)} />
              </div>
              <FieldError id="ax-password-err" message={fieldErrors.password} />
            </div>
            <div className="field">
              <label htmlFor="ax-confirm">
                Şifre tekrar <RequiredMark />
              </label>
              <div className="ax-pass">
                <input
                  id="ax-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    clearError('confirm')
                  }}
                  minLength={8}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.confirm)}
                />
              </div>
              <FieldError id="ax-confirm-err" message={fieldErrors.confirm} />
            </div>
          </div>
          <StrengthMeter password={password} />
        </div>

        <details
          className="ax-extra"
          open={optionalOpen}
          onToggle={(event) => setOptionalOpen(event.currentTarget.open)}
        >
          <summary>
            Kimlik bilgisi ekle
            <span className="ax-opt">isteğe bağlı</span>
          </summary>
          <p className="ax-extra-note">
            Demo ortamında zorunlu değildir. Gerçek doğrulama gereken hizmetlerde kullanılabilir.
          </p>
          <div className="ax-extra-body">
            <div className="field ax-sensitive">
              <label htmlFor="ax-nationalId">
                T.C. kimlik no
                <InfoTip
                  id="ax-nid-tip"
                  text="Demo ortamında zorunlu değildir. Gerçek doğrulama gereken hizmetlerde kullanılabilir."
                />
              </label>
              <input
                id="ax-nationalId"
                value={nationalId}
                onChange={(event) => {
                  setNationalId(event.target.value.replace(/\D/g, '').slice(0, 11))
                  clearError('nationalId')
                }}
                inputMode="numeric"
                maxLength={11}
                autoComplete="off"
                placeholder="Boş bırakılabilir"
                aria-invalid={Boolean(fieldErrors.nationalId)}
              />
              {nationalIdHint ? (
                <p className={`ax-hint${nationalIdHint.includes('geçersiz') ? ' is-bad' : ' is-ok'}`}>{nationalIdHint}</p>
              ) : null}
              <FieldError id="ax-nationalId-err" message={fieldErrors.nationalId} />
            </div>
            <div className="ax-pair">
              <div className="field">
                <label htmlFor="ax-birthDate">Doğum tarihi</label>
                <input
                  id="ax-birthDate"
                  type="date"
                  lang="tr"
                  value={birthDate}
                  onChange={(event) => {
                    setBirthDate(event.target.value)
                    clearError('birthDate')
                  }}
                  autoComplete="bday"
                  max={maxAdultBirth}
                  aria-invalid={Boolean(fieldErrors.birthDate)}
                />
                <FieldError id="ax-birthDate-err" message={fieldErrors.birthDate} />
              </div>
              <div className="field">
                <label htmlFor="ax-gender">Cinsiyet</label>
                <select id="ax-gender" value={gender} onChange={(event) => setGender(event.target.value as 'E' | 'K' | '')}>
                  <option value="">Belirtmek istemiyorum</option>
                  <option value="E">Erkek</option>
                  <option value="K">Kadın</option>
                </select>
              </div>
            </div>
          </div>
        </details>

        <label className="ax-check ax-terms" htmlFor="ax-terms">
          <input
            id="ax-terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => {
              setAcceptedTerms(event.target.checked)
              clearError('terms')
            }}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.terms)}
          />
          <span>
            Portföy/demo platformudur; resmi belediye işlemi değildir. <RequiredMark />
          </span>
        </label>
        <FieldError id="ax-terms-err" message={fieldErrors.terms} />

        <BusyButton busy={busy} busyLabel="Hesap oluşturuluyor…">
          Hesap oluştur
        </BusyButton>
      </form>
    </AuthShell>
  )
}

function InputField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = 'text',
  autoComplete,
  placeholder,
  inputMode,
  tip,
  tipId,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  type?: string
  autoComplete?: string
  placeholder?: string
  inputMode?: 'tel' | 'email' | 'numeric'
  tip?: string
  tipId?: string
}) {
  const describedBy = [error ? `${id}-err` : '', tipId].filter(Boolean).join(' ') || undefined
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {required ? <RequiredMark /> : null}
        {tip && tipId ? <InfoTip id={tipId} text={tip} /> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      <FieldError id={`${id}-err`} message={error} />
    </div>
  )
}
