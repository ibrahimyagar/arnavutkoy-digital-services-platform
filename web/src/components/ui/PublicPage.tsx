import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ContentCover } from '../../lib/contentVisuals'
import './public-page.css'

export function PublicPage({
  eyebrow,
  title,
  lead,
  cover,
  children,
}: {
  eyebrow?: string
  title: string
  lead?: string
  cover?: ContentCover
  children: ReactNode
}) {
  return (
    <div className="pub">
      <div className="pub-canvas">
        {cover ? (
          <div className="pub-cover">
            <img src={cover.src} alt={cover.alt} loading="eager" decoding="async" />
            <span className="pub-cover-shade" aria-hidden />
          </div>
        ) : null}
        <header className="pub-intro">
          {eyebrow ? <p className="pub-eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {lead ? <p className="pub-lead">{lead}</p> : null}
        </header>
        <div className="pub-body">{children}</div>
      </div>
    </div>
  )
}

export function PublicSection({
  title,
  children,
  tone = 'default',
}: {
  title?: string
  children: ReactNode
  tone?: 'default' | 'soft'
}) {
  return (
    <section className={`pub-section${tone === 'soft' ? ' pub-section--soft' : ''}`}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  )
}

export function PublicRelated({
  title = 'İlgili sayfalar',
  items,
}: {
  title?: string
  items: readonly { to: string; label: string; hint: string }[]
}) {
  return (
    <section className="pub-related" aria-label={title}>
      <h2>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item.to}>
            <Link to={item.to}>
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Oturum / panel sayfaları — aynı zemin ve tipografi, kapaksız. */
export function AppPage({
  eyebrow,
  title,
  lead,
  actions,
  children,
}: {
  eyebrow?: string
  title: string
  lead?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="pub pub--app">
      <div className="pub-canvas">
        <header className={`pub-intro${actions ? ' pub-intro--row' : ''}`}>
          <div>
            {eyebrow ? <p className="pub-eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
            {lead ? <p className="pub-lead">{lead}</p> : null}
          </div>
          {actions ? <div className="pub-intro-actions">{actions}</div> : null}
        </header>
        <div className="pub-body">{children}</div>
      </div>
    </div>
  )
}
