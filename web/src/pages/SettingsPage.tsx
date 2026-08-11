import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageChrome'
import { apiFetch } from '../lib/api'
import { RequireAuth } from './PanelPage'

type UserProfile = {
  userId: string
  fullName: string
  email: string
  nationalId: string
  phoneNumber: string
  birthDate: string | null
  gender: string
  roles: string[]
  createdAtUtc: string
}

const roleLabels: Record<string, string> = {
  Citizen: 'Vatandaş',
  Officer: 'Görevli',
  Administrator: 'Yönetici',
}

const genderLabels: Record<string, string> = {
  E: 'Erkek',
  K: 'Kadın',
}

function SettingsContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [phoneBusy, setPhoneBusy] = useState(false)
  const [passwordBusy, setPasswordBusy] = useState(false)

  async function loadProfile() {
    const me = await apiFetch<UserProfile>('/api/v1/auth/me', {}, true)
    setProfile(me)
    setPhoneNumber(me.phoneNumber)
  }

  useEffect(() => {
    void loadProfile().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Profil yüklenemedi.')
    })
  }, [])

  async function savePhone(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setPhoneBusy(true)
    try {
      await apiFetch(
        '/api/v1/auth/me/phone',
        {
          method: 'PUT',
          body: JSON.stringify({ phoneNumber }),
        },
        true,
      )
      setInfo('Telefon numarası güncellendi.')
      await loadProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Telefon güncellenemedi.')
    } finally {
      setPhoneBusy(false)
    }
  }

  async function changePassword(event: FormEvent) {
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

    setPasswordBusy(true)
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
      setPasswordBusy(false)
    }
  }

  return (
    <div className="container stack page" style={{ maxWidth: 640 }}>
      <PageHeader
        title="Hesap ayarları"
        description="Profil, telefon ve parola."
        actions={
          <Link className="btn btn-ghost" to="/panel">
            Panele dön
          </Link>
        }
      />

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <section className="panel stack">
        <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Profil</h2>
        {!profile ? (
          <p className="muted">Yükleniyor…</p>
        ) : (
          <dl className="profile-grid">
            <div>
              <dt>Ad soyad</dt>
              <dd>{profile.fullName}</dd>
            </div>
            <div>
              <dt>E-posta</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt>T.C. kimlik no</dt>
              <dd>{profile.nationalId}</dd>
            </div>
            <div>
              <dt>Doğum tarihi</dt>
              <dd>
                {profile.birthDate
                  ? new Date(profile.birthDate).toLocaleDateString('tr-TR')
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Cinsiyet</dt>
              <dd>{genderLabels[profile.gender] ?? (profile.gender || '—')}</dd>
            </div>
            <div>
              <dt>Roller</dt>
              <dd>
                {profile.roles.map((role) => roleLabels[role] ?? role).join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt>Kayıt tarihi</dt>
              <dd>{new Date(profile.createdAtUtc).toLocaleDateString('tr-TR')}</dd>
            </div>
          </dl>
        )}
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          E-posta giriş kimliğidir; ad soyad ve TCKN bu demoda değiştirilemez.
        </p>
      </section>

      <form className="panel stack" onSubmit={(e) => void savePhone(e)}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.35rem' }}>Telefon</h2>
        <div className="field">
          <label htmlFor="settingsPhone">Telefon numarası</label>
          <input
            id="settingsPhone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            autoComplete="tel"
            placeholder="05xxxxxxxxx"
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={phoneBusy}>
          {phoneBusy ? 'Kaydediliyor…' : 'Telefonu kaydet'}
        </button>
      </form>

      <form className="panel stack" onSubmit={(e) => void changePassword(e)}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.35rem' }}>Parola</h2>
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
          En az 8 karakter; en az bir harf ve bir rakam. Eski parola doğrulanır (referanstaki açıktan daha güvenli).
        </p>
        <button className="btn btn-primary" type="submit" disabled={passwordBusy}>
          {passwordBusy ? 'Kaydediliyor…' : 'Parolayı güncelle'}
        </button>
      </form>
    </div>
  )
}

export function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  )
}
