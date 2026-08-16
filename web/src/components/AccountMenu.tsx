import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AccountMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  const first = user.fullName.trim().split(/\s+/)[0] || 'Hesap'
  const mark = first.slice(0, 1).toUpperCase()

  async function onLogout() {
    setOpen(false)
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="shell-account" ref={rootRef}>
      <button
        type="button"
        className="shell-account-btn"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-label="Hesap menüsü"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="shell-account-mark" aria-hidden>
          {mark}
        </span>
        <span className="shell-account-name">{first}</span>
      </button>
      {open ? (
        <div className="shell-account-menu" id={menuId} role="menu">
          <Link role="menuitem" to="/panel" onClick={() => setOpen(false)}>
            Panel
          </Link>
          <Link role="menuitem" to="/ayarlar#profil" onClick={() => setOpen(false)}>
            Profilim
          </Link>
          <Link role="menuitem" to="/talepler" onClick={() => setOpen(false)}>
            Başvurularım
          </Link>
          <Link role="menuitem" to="/borclar" onClick={() => setOpen(false)}>
            Borçlarım
          </Link>
          <Link role="menuitem" to="/panel#bildirimler" onClick={() => setOpen(false)}>
            Bildirimler
          </Link>
          <Link role="menuitem" to="/ayarlar#parola" onClick={() => setOpen(false)}>
            Şifre değiştir
          </Link>
          <button type="button" role="menuitem" onClick={() => void onLogout()}>
            Çıkış yap
          </button>
        </div>
      ) : null}
    </div>
  )
}
