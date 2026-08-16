import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicPage, PublicRelated } from '../components/ui/PublicPage'
import { apiFetch, type Announcement, type Department, type Paginated, type PortalContent, type StaffMember } from '../lib/api'
import { COVERS, RELATED } from '../lib/contentVisuals'
import {
  coverForDepartment,
  departmentCategory,
  departmentMatchesQuery,
  departmentMonogram,
  departmentVenue,
  dutyList,
  normalizeDeptHref,
  osmEmbedSrc,
  osmOpenSrc,
  parseDepartmentDescription,
  emptyDirectoryPublications,
  relatedDirectoryMedia,
  serviceList,
  staffInitials,
  staffMatchesQuery,
  formatStaffPhone,
} from '../lib/hrVisuals'
import './hr-directory.css'

type ViewMode = 'units' | 'people' | 'grouped'

function SearchIcon() {
  return (
    <svg className="org-search-icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.4 10.4 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden>
      <path d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function HrDirectoryPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('Tümü')
  const [title, setTitle] = useState('Tümü')
  const [mode, setMode] = useState<ViewMode>('units')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeJump, setActiveJump] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [deps, members] = await Promise.all([
          apiFetch<Department[]>('/api/v1/departments'),
          apiFetch<StaffMember[]>('/api/v1/staff'),
        ])
        if (cancelled) return
        setDepartments(deps.filter((item) => item.isActive))
        setStaff(members.filter((item) => item.isActive))
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Birimler yüklenemedi.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const departmentMap = useMemo(() => new Map(departments.map((item) => [item.id, item])), [departments])

  const staffCountByDept = useMemo(() => {
    const counts = new Map<string, number>()
    for (const member of staff) {
      counts.set(member.departmentId, (counts.get(member.departmentId) ?? 0) + 1)
    }
    return counts
  }, [staff])

  const parsedById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof parseDepartmentDescription>>()
    for (const department of departments) {
      map.set(department.id, parseDepartmentDescription(department.description))
    }
    return map
  }, [departments])

  const categories = useMemo(() => {
    const found = new Set<string>()
    for (const department of departments) {
      found.add(departmentCategory(department))
    }
    return ['Tümü', ...[...found].sort((a, b) => a.localeCompare(b, 'tr'))]
  }, [departments])

  const titles = useMemo(() => {
    const found = new Set(staff.map((member) => member.title.trim()).filter(Boolean))
    return ['Tümü', ...[...found].sort((a, b) => a.localeCompare(b, 'tr'))]
  }, [staff])

  const needle = q.trim().toLocaleLowerCase('tr-TR')

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) => {
      const parsed = parsedById.get(department.id)
      if (!parsed) return false
      if (category !== 'Tümü' && (parsed.extras.category ?? 'Kurumsal') !== category) return false
      return departmentMatchesQuery(department, parsed.extras, parsed.summary, needle)
    })
  }, [departments, parsedById, category, needle])

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      if (title !== 'Tümü' && member.title !== title) return false
      const department = departmentMap.get(member.departmentId)
      if (category !== 'Tümü') {
        if (!department || departmentCategory(department) !== category) return false
      }
      return staffMatchesQuery(member, department?.name ?? '', needle)
    })
  }, [staff, title, category, departmentMap, needle])

  const directorates = departments.filter((item) => item.name.toLocaleLowerCase('tr-TR').includes('müdürlük')).length

  const groupedSections = useMemo(() => {
    return filteredDepartments
      .map((department) => {
        const parsed = parsedById.get(department.id)
        const members = filteredStaff.filter((member) => member.departmentId === department.id)
        const deptMatched = parsed
          ? departmentMatchesQuery(department, parsed.extras, parsed.summary, needle)
          : false
        return { department, parsed, members, deptMatched }
      })
      .filter((row) => {
        if (row.members.length > 0) return true
        if (title !== 'Tümü') return false
        if (needle) return row.deptMatched
        return true
      })
  }, [filteredDepartments, filteredStaff, parsedById, needle, title])

  const groupedIds = groupedSections.map((row) => row.department.id).join()

  useEffect(() => {
    if (mode !== 'grouped' || groupedSections.length <= 6) {
      setActiveJump(null)
      return
    }
    const ids = groupedIds.split(',').filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const id = visible[0]?.target.id.replace(/^org-g-/, '')
        if (id) setActiveJump(id)
      },
      { rootMargin: '-18% 0px -62% 0px', threshold: 0.05 },
    )
    for (const id of ids) {
      const node = document.getElementById(`org-g-${id}`)
      if (node) observer.observe(node)
    }
    return () => observer.disconnect()
  }, [mode, groupedIds, groupedSections.length])

  const emptyHint = q.trim()
    ? `“${q.trim()}” için eşleşen dizin kaydı yok.`
    : title !== 'Tümü'
      ? `“${title}” unvanında dizin kaydı yok.`
      : category !== 'Tümü'
        ? `“${category}” görev alanında birim yok.`
        : 'Gösterilecek kayıt yok.'

  const visibleUnitCount = mode === 'grouped' ? groupedSections.length : filteredDepartments.length

  return (
    <PublicPage immersive className="pub--wide" title="Birimler ve personel">
      <div className="org">
        <header className="org-hero">
          <div className="org-hero-copy">
            <p className="org-kicker">Kurum rehberi</p>
            <h1>Birimler ve personel</h1>
            <p>
              Müdürlükler, görev alanları ve halka açık dizin kayıtları. Kişiler ve unvanlar kurgusal demo
              verisidir; gerçek personel listesi değildir.
            </p>
            <nav className="org-quick" aria-label="Hızlı erişim">
              <Link to="/baskan">Başkan</Link>
              <Link to="/kurumsal">Kurumsal</Link>
              <Link to="/hizmet-rehberi">Hizmetler</Link>
              <Link to="/iletisim">İletişim</Link>
            </nav>
          </div>
          <div className="org-hero-media">
            <img src={COVERS.mayor.src} alt={COVERS.mayor.alt} />
            <span aria-hidden />
          </div>
        </header>

        <div className="org-stats" aria-label="Dizin özeti">
          <div>
            <strong>{loading ? '—' : departments.length}</strong>
            <span>Birim</span>
          </div>
          <div>
            <strong>{loading ? '—' : staff.length}</strong>
            <span>Dizin kaydı</span>
          </div>
          <div>
            <strong>{loading ? '—' : directorates}</strong>
            <span>Müdürlük</span>
          </div>
          <div>
            <strong>{loading ? '—' : categories.length - 1}</strong>
            <span>Görev alanı</span>
          </div>
        </div>

        <div className="org-toolbar">
          <div className="org-toolbar-top">
            <p className="org-count" aria-live="polite">
              {loading ? 'Dizin yükleniyor…' : (
                <>
                  <strong>{visibleUnitCount}</strong> birim ·{' '}
                  <strong>{filteredStaff.length}</strong> personel kaydı
                </>
              )}
            </p>
            <div className="org-modes" role="tablist" aria-label="Görünüm">
              {([
                ['units', 'Birimler'],
                ['people', 'Personel'],
                ['grouped', 'Birime göre'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  className={`org-mode${mode === id ? ' is-on' : ''}`}
                  aria-selected={mode === id}
                  onClick={() => setMode(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="field org-search">
            <label htmlFor="org-q">Birim veya personel ara</label>
            <div className={`org-search-box${q ? ' has-clear' : ''}`}>
              <SearchIcon />
              <input
                id="org-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Fen, müdür, sosyal destek…"
                autoComplete="off"
              />
              {q ? (
                <button
                  type="button"
                  className="org-search-clear"
                  aria-label="Aramayı temizle"
                  onClick={() => {
                    setQ('')
                    document.getElementById('org-q')?.focus()
                  }}
                >
                  <ClearIcon />
                </button>
              ) : null}
            </div>
          </div>
          <div className="org-chip-row">
            <p className="org-chip-label" id="org-cat-label">Görev alanı</p>
            <div className="org-chips" role="toolbar" aria-labelledby="org-cat-label">
              {categories.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`org-chip${category === label ? ' is-on' : ''}`}
                  aria-pressed={category === label}
                  onClick={() => setCategory(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {mode !== 'units' ? (
            <div className="org-chip-row">
              <p className="org-chip-label" id="org-title-label">Unvan</p>
              <div className="org-chips" role="toolbar" aria-labelledby="org-title-label">
                {titles.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`org-chip${title === label ? ' is-on' : ''}`}
                    aria-pressed={title === label}
                    onClick={() => setTitle(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {error ? <div className="error-box" role="alert">{error}</div> : null}
        {loading ? <div className="org-skel" aria-busy="true" /> : null}

        {!loading && mode === 'units' ? (
          filteredDepartments.length > 0 ? (
            <div className="org-grid">
              {filteredDepartments.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  staffCount={staffCountByDept.get(department.id) ?? 0}
                />
              ))}
            </div>
          ) : (
            <EmptyDirectory
              hint={emptyHint}
              mode="units"
              onReset={() => { setQ(''); setCategory('Tümü'); setTitle('Tümü') }}
            />
          )
        ) : null}

        {!loading && mode === 'people' ? (
          filteredStaff.length > 0 ? (
            <div className="org-people">
              {filteredStaff.map((member) => (
                <PersonCard
                  key={member.id}
                  member={member}
                  departmentName={departmentMap.get(member.departmentId)?.name ?? 'Birim'}
                />
              ))}
            </div>
          ) : (
            <EmptyDirectory
              hint={emptyHint}
              mode="people"
              onReset={() => { setQ(''); setCategory('Tümü'); setTitle('Tümü') }}
            />
          )
        ) : null}

        {!loading && mode === 'grouped' ? (
          groupedSections.length > 0 ? (
            <>
              {groupedSections.length > 6 ? (
                <nav className="org-jump" aria-label="Birime atla">
                  {groupedSections.map(({ department }) => (
                    <a
                      key={department.id}
                      href={`#org-g-${department.id}`}
                      title={department.name}
                      aria-label={department.name}
                      aria-current={activeJump === department.id ? 'location' : undefined}
                      className={activeJump === department.id ? 'is-on' : undefined}
                      onClick={() => setActiveJump(department.id)}
                    >
                      {departmentMonogram(department.name)}
                    </a>
                  ))}
                </nav>
              ) : null}
              {groupedSections.map(({ department, parsed, members }) => (
              <section key={department.id} id={`org-g-${department.id}`} className="org-group">
                <header className="org-group-head">
                  <span className="org-group-mono" aria-hidden>
                    {departmentMonogram(department.name)}
                  </span>
                  <div className="org-group-copy">
                    <p className="org-group-meta">
                      <span className="org-cat">{parsed?.extras.category ?? 'Kurumsal'}</span>
                      <span>{members.length} kayıt</span>
                      {parsed?.extras.phone ? (
                        <span className="org-group-phone">{parsed.extras.phone}</span>
                      ) : null}
                    </p>
                    <h2>
                      <Link to={`/birimler/${department.id}`}>{department.name}</Link>
                    </h2>
                  </div>
                  <Link className="org-group-go" to={`/birimler/${department.id}`}>
                    Birim kartı →
                  </Link>
                </header>
                {members.length > 0 ? (
                  <div className="org-people">
                    {members.map((member) => (
                      <PersonCard
                        key={member.id}
                        member={member}
                        departmentName={department.name}
                        showUnit={false}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="org-group-none">Bu birimde aramaya uyan dizin kaydı yok.</p>
                )}
              </section>
            ))}
            </>
          ) : (
            <EmptyDirectory
              hint={emptyHint}
              mode="grouped"
              onReset={() => { setQ(''); setCategory('Tümü'); setTitle('Tümü') }}
            />
          )
        ) : null}

        <PublicRelated items={RELATED.directory} />
      </div>
    </PublicPage>
  )
}

function DepartmentCard({
  department,
  staffCount,
}: {
  department: Department
  staffCount: number
}) {
  const parsed = parseDepartmentDescription(department.description)
  const cover = coverForDepartment(department)
  return (
    <Link to={`/birimler/${department.id}`} className="org-card">
      <span className="org-card-media">
        <img src={cover.src} alt="" />
        <span className="org-mono">{departmentMonogram(department.name)}</span>
      </span>
      <span className="org-card-copy">
        <span className="org-card-meta">
          <span className="org-cat">{parsed.extras.category ?? 'Kurumsal'}</span>
          <span className="org-headcount">{staffCount} kişi</span>
        </span>
        <h2>{department.name}</h2>
        <p>{parsed.summary || 'Kurgusal demo birim kaydı.'}</p>
        {parsed.extras.phone ? <span className="org-phone">{parsed.extras.phone}</span> : <span />}
        <em className="org-go">Detayları gör →</em>
      </span>
    </Link>
  )
}

function PersonCard({
  member,
  departmentName,
  showUnit = true,
}: {
  member: StaffMember
  departmentName: string
  showUnit?: boolean
}) {
  return (
    <article className="org-person">
      <span className="org-avatar" aria-hidden>
        {staffInitials(member.fullName)}
      </span>
      <div>
        <h3>{member.fullName}</h3>
        <p>
          {member.title}
          {showUnit ? ` · ${departmentName}` : ''}
        </p>
        <div className="org-person-links">
          {member.email ? (
            <a href={`mailto:${member.email}`} className="org-mail" aria-label={member.email}>
              <span className="org-mail-full">{member.email}</span>
              <span className="org-mail-short">E-posta</span>
            </a>
          ) : null}
          {member.phoneNumber ? (
            <a href={`tel:${member.phoneNumber}`}>{formatStaffPhone(member.phoneNumber)}</a>
          ) : null}
          {showUnit ? <Link to={`/birimler/${member.departmentId}`}>Birime git</Link> : null}
        </div>
      </div>
    </article>
  )
}

function EmptyDirectory({
  hint,
  mode,
  onReset,
}: {
  hint: string
  mode: ViewMode
  onReset: () => void
}) {
  const title =
    mode === 'people' ? 'Dizin kaydı bulunamadı' : mode === 'grouped' ? 'Bu görünümde birim yok' : 'Birim bulunamadı'
  return (
    <div className="org-empty" role="status">
      <strong>{title}</strong>
      <p>
        {hint} Görev alanını değiştirin veya aramayı temizleyin. Kurum yapısı için{' '}
        <Link to="/kurumsal">kurumsal sayfa</Link>.
      </p>
      <button type="button" className="btn btn-ghost" onClick={onReset}>
        Süzgeci temizle
      </button>
    </div>
  )
}

export function HrDepartmentPage() {
  const { id } = useParams()
  const [department, setDepartment] = useState<Department | null>(null)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [news, setNews] = useState<PortalContent[]>([])
  const [projects, setProjects] = useState<PortalContent[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Birim bulunamadı.')
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const [deps, members, newsPage, projectPage, announcementPage] = await Promise.all([
          apiFetch<Department[]>('/api/v1/departments'),
          apiFetch<StaffMember[]>(`/api/v1/staff?departmentId=${id}`),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=News&pageSize=8'),
          apiFetch<Paginated<PortalContent>>('/api/v1/portal?kind=Project&pageSize=20'),
          apiFetch<Paginated<Announcement>>('/api/v1/announcements?pageSize=12'),
        ])
        if (cancelled) return
        const found = deps.find((item) => item.id === id && item.isActive) ?? null
        setDepartment(found)
        setStaff(members.filter((item) => item.isActive))
        setNews(newsPage.items)
        setProjects(projectPage.items)
        setAnnouncements(announcementPage.items)
        if (!found) setError('Birim bulunamadı.')
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Birim yüklenemedi.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const parsed = department ? parseDepartmentDescription(department.description) : null
  const cover = department ? coverForDepartment(department) : null
  const venue = parsed ? departmentVenue(parsed.extras) : null
  const href = parsed?.extras.link ? normalizeDeptHref(parsed.extras.link) : '/hizmet-rehberi'
  const manager = staff.find((member) => /müdür|amir|şef/i.test(member.title)) ?? staff[0]
  const related = department && parsed
    ? relatedDirectoryMedia(parsed.extras, department.name, announcements, news, projects)
    : { announcements: [], news: [], projects: [] }
  const emptyPubs = parsed ? emptyDirectoryPublications(parsed.extras.category) : null

  async function onShare() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: department?.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setNotice('Birim bağlantısı kopyalandı.')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setNotice(`Bağlantı: ${url}`)
    }
  }

  return (
    <PublicPage immersive className="pub--wide" title={department?.name ?? 'Birim'}>
      <p className="org-nav">
        <Link to="/birimler">← Tüm birimler</Link>
      </p>
      {error ? <div className="error-box" role="alert">{error}</div> : null}
      {notice ? <div className="success-box" role="status">{notice}</div> : null}

      {!department && !error ? (
        <>
          <h1 className="sr-only">Birim</h1>
          <div className="org-skel" aria-busy="true" />
        </>
      ) : null}

      {department && parsed && cover && venue ? (
        <div className="org">
          <header className="orgd-hero">
            <img src={cover.src} alt="" />
            <span className="orgd-hero-shade" aria-hidden />
            <div className="orgd-hero-copy">
              <p className="org-kicker">{parsed.extras.category ?? 'Kurumsal'}</p>
              <h1>{department.name}</h1>
              <p>{parsed.summary || 'Kurgusal demo birim kaydı.'}</p>
            </div>
          </header>

          <div className="orgd-facts">
            <div>
              <span>Telefon</span>
              <strong>{parsed.extras.phone ?? '444 00 00'}</strong>
            </div>
            <div>
              <span>Çalışma saati</span>
              <strong>{parsed.extras.hours ?? 'Hafta içi 08:30–17:00'}</strong>
            </div>
            <div>
              <span>Konum</span>
              <strong>{parsed.extras.location ?? venue.label}</strong>
            </div>
            <div>
              <span>Dizin</span>
              <strong>{staff.length} personel kaydı</strong>
            </div>
          </div>

          <div className="orgd-layout">
            <div className="orgd-main">
              <article className="orgd-prose">
                <h2>Görev ve sorumluluklar</h2>
                {dutyList(parsed.extras).length > 0 ? (
                  <ul>
                    {dutyList(parsed.extras).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{parsed.summary}</p>
                )}
              </article>

              {serviceList(parsed.extras).length > 0 ? (
                <section className="orgd-block">
                  <h2>Hizmet alanları</h2>
                  <ul>
                    {serviceList(parsed.extras).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {staff.length > 0 ? (
                <section className="orgd-block">
                  <h2>Dizin kayıtları</h2>
                  <p>Unvanlar kurgusal demo kayıttır; gerçek kişi listesi değildir.</p>
                  <div className="org-people">
                    {staff.map((member) => (
                      <PersonCard
                        key={member.id}
                        member={member}
                        departmentName={department.name}
                        showUnit={false}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="orgd-block">
                <h2>Konum</h2>
                <p>{parsed.extras.location ?? venue.label}</p>
                <div className="org-map">
                  <iframe title="Birim konumu" src={osmEmbedSrc(venue)} loading="lazy" />
                </div>
                <a href={osmOpenSrc(venue)} target="_blank" rel="noreferrer">
                  OpenStreetMap’te aç →
                </a>
              </section>

              {related.announcements.length > 0 ? (
                <section className="orgd-block">
                  <h2>Resmi bildirimler</h2>
                  <p>Bu birimin görev alanına düşen duyurular.</p>
                  <div className="orgd-related-grid">
                    {related.announcements.map((item) => {
                      const text = item.content.replace(/\s+/g, ' ').trim()
                      return (
                        <Link key={item.id} to={`/duyurular/${item.id}`}>
                          <strong>{item.title}</strong>
                          <span>{text.length > 110 ? `${text.slice(0, 110).trim()}…` : text}</span>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              ) : null}

              {related.news.length > 0 ? (
                <section className="orgd-block">
                  <h2>Haberler</h2>
                  <p>Aynı görev alanında yayımlanmış haberler; duyuru metninin tekrarı değildir.</p>
                  <div className="orgd-related-grid">
                    {related.news.map((item) => (
                      <Link key={item.id} to={`/haberler/${item.id}`}>
                        <strong>{item.title}</strong>
                        <span>{item.summary}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {related.announcements.length === 0 && related.news.length === 0 && emptyPubs ? (
                <section className="orgd-block">
                  <h2>{emptyPubs.title}</h2>
                  <p>{emptyPubs.body}</p>
                  <p className="orgd-related-links">
                    {emptyPubs.links.map((item) => (
                      <Link key={item.to} to={item.to}>{item.label}</Link>
                    ))}
                  </p>
                </section>
              ) : null}

              {related.projects.length > 0 ? (
                <section className="orgd-block">
                  <h2>Faaliyet defteri</h2>
                  <p>Bu birimin iş alanına kayıtlı yatırımlar.</p>
                  <div className="orgd-related-grid">
                    {related.projects.map((item) => (
                      <Link key={item.id} to={`/faaliyetler/${item.id}`}>
                        <strong>{item.title}</strong>
                        <span>{item.summary}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="orgd-plaque">
              <h2>Birim kartı</h2>
              <dl>
                {manager ? (
                  <div>
                    <dt>Yetkili (demo)</dt>
                    <dd>
                      {manager.fullName}
                      <br />
                      {manager.title}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>E-posta</dt>
                  <dd>
                    {parsed.extras.email ? (
                      <a href={`mailto:${parsed.extras.email}`}>{parsed.extras.email}</a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Telefon</dt>
                  <dd>
                    {parsed.extras.phone ? (
                      <a href={`tel:${parsed.extras.phone.replace(/\s/g, '')}`}>{parsed.extras.phone}</a>
                    ) : (
                      '444 00 00'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Saat</dt>
                  <dd>{parsed.extras.hours ?? 'Hafta içi 08:30–17:00'}</dd>
                </div>
              </dl>
              <div className="orgd-actions">
                <Link to={href}>Bağlı hizmet</Link>
                <button type="button" onClick={() => void onShare()}>
                  Paylaş
                </button>
                <Link to="/birimler">Geri dön</Link>
              </div>
            </aside>
          </div>

          <PublicRelated items={RELATED.directory} />
        </div>
      ) : null}
    </PublicPage>
  )
}
