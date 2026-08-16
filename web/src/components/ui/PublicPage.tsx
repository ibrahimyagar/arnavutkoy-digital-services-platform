import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { coverForRelatedPath, groupForRelatedPath, type ContentCover } from '../../lib/contentVisuals'
import './public-page.css'

export function PublicPage({
  eyebrow,
  title,
  lead,
  cover,
  children,
  className,
  immersive = false,
}: {
  eyebrow?: string
  title: string
  lead?: string
  cover?: ContentCover
  children: ReactNode
  className?: string
  /** Hero or article owns the heading; skip the generic intro block. */
  immersive?: boolean
}) {
  const rootClass = ['pub', immersive ? 'pub--immersive' : '', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <div className="pub-canvas">
        {cover ? (
          <div className="pub-cover">
            <img src={cover.src} alt={cover.alt} loading="eager" decoding="async" />
            <span className="pub-cover-shade" aria-hidden />
          </div>
        ) : null}
        {immersive ? null : (
          <header className="pub-intro">
            {eyebrow ? <p className="pub-eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
            {lead ? <p className="pub-lead">{lead}</p> : null}
          </header>
        )}
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
  items: readonly { to: string; label: string; hint: string; group?: string }[]
}) {
  const { pathname } = useLocation()
  const visible = items.filter((item) => item.to !== pathname)

  if (visible.length === 0) return null

  return (
    <section className="pub-related" aria-label={title}>
      <header className="pub-related-head">
        <p className="pub-related-kicker">Keşfet</p>
        <h2>{title}</h2>
      </header>
      <ul data-count={visible.length}>
        {visible.map((item) => {
          const cover = coverForRelatedPath(item.to)
          const group = groupForRelatedPath(item.to, item.group)
          return (
            <li key={item.to}>
              <Link to={item.to} className="pub-related-card">
                <span className="pub-related-media">
                  <img src={cover.src} alt="" loading="lazy" decoding="async" />
                  <span className="pub-related-shade" aria-hidden />
                  {group.toLocaleLowerCase('tr-TR') !== item.label.toLocaleLowerCase('tr-TR') ? (
                    <span className="pub-related-cat">{group}</span>
                  ) : null}
                </span>
                <span className="pub-related-copy">
                  <strong>{item.label}</strong>
                  <span>{item.hint}</span>
                  <em>Sayfaya git →</em>
                </span>
              </Link>
            </li>
          )
        })}
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
