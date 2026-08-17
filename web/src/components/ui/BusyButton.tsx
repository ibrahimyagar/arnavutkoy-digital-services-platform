import type { ButtonHTMLAttributes, ReactNode } from 'react'

type BusyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  busy: boolean
  busyLabel?: ReactNode
}

export function BusyButton({
  busy,
  busyLabel,
  children,
  className = 'btn btn-primary',
  type = 'submit',
  disabled,
  ...props
}: BusyButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`${className}${busy ? ' is-busy' : ''}`}
      disabled={busy || disabled}
      aria-busy={busy}
    >
      {busy ? <span className="btn-spinner" aria-hidden /> : null}
      {busy ? busyLabel ?? children : children}
    </button>
  )
}
