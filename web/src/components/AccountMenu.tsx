import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AccountMenu() {
  const { user, logout } = useAuth()
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
          <Link role="menuitem" to="/ayarlar#profil" onClick={() => setOpen(false)}>
            Profil bilgilerim
          </Link>
          <Link role="menuitem" to="/ayarlar#iletisim" onClick={() => setOpen(false)}>
            İletişim bilgilerim
          </Link>
          <Link role="menuitem" to="/ayarlar#parola" onClick={() => setOpen(false)}>
            Şifre değiştir
          </Link>
          <Link role="menuitem" to="/ayarlar#bildirimler" onClick={() => setOpen(false)}>
            Bildirim ayarları
          </Link>
          <button type="button" role="menuitem" onClick={() => void logout()}>
            Çıkış
          </button>
        </div>
      ) : null}
    </div>
  )
}
