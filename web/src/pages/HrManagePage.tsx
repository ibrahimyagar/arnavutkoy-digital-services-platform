import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AdminGate } from '../components/RoleGates'
import { apiFetch, type Department, type StaffMember } from '../lib/api'
import { RequireAuth } from './PanelPage'

const DEPT_TEMPLATES = [
  {
    name: 'Fen İşleri Müdürlüğü',
    description: 'Yol, kaldırım ve altyapı bakım taleplerinin koordinasyonu.',
  },
  {
    name: 'Sosyal Destek Birimi',
    description: 'Sosyal yardım başvurularının ön incelemesi ve yönlendirmesi.',
  },
  {
    name: 'Ulaşım ve Trafik',
    description: 'Hat planlama, durak ve sefer bilgilendirmesi.',
  },
] as const

const STAFF_TEMPLATES = [
  {
    fullName: 'Elif Demir',
    title: 'Birim Sorumlusu',
    email: 'elif.demir@demo.arnavutkoy.local',
    phone: '0212 555 10 01',
  },
  {
    fullName: 'Can Öztürk',
    title: 'Uzman',
    email: 'can.ozturk@demo.arnavutkoy.local',
    phone: '0212 555 10 02',
  },
] as const

type ActiveFilter = 'all' | 'active' | 'inactive'

function HrManageContent() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [deptName, setDeptName] = useState('')
  const [deptDescription, setDeptDescription] = useState('')
  const [staffDepartmentId, setStaffDepartmentId] = useState('')
  const [fullName, setFullName] = useState('')
  const [title, setTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [filterDeptId, setFilterDeptId] = useState('all')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active')
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [deps, members] = await Promise.all([
      apiFetch<Department[]>('/api/v1/departments?activeOnly=false', {}, true),
      apiFetch<StaffMember[]>('/api/v1/staff?activeOnly=false', {}, true),
    ])
    setDepartments(deps)
    setStaff(members)
    setStaffDepartmentId((current) => current || deps.find((d) => d.isActive)?.id || deps[0]?.id || '')
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'HR verisi yüklenemedi.')
    })
  }, [load])

  const deptMap = useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments],
  )

  const staffCountsByDept = useMemo(() => {
    const counts = new Map<string, number>()
    for (const member of staff) {
      counts.set(member.departmentId, (counts.get(member.departmentId) ?? 0) + 1)
    }
    return counts
  }, [staff])

  const counts = useMemo(() => {
    const next = {
      departments: departments.length,
      activeDepts: departments.filter((d) => d.isActive).length,
      staff: staff.length,
      activeStaff: staff.filter((m) => m.isActive).length,
    }
    return next
  }, [departments, staff])

  const filteredStaff = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return staff.filter((member) => {
      if (filterDeptId !== 'all' && member.departmentId !== filterDeptId) return false
      if (activeFilter === 'active' && !member.isActive) return false
      if (activeFilter === 'inactive' && member.isActive) return false
      if (!needle) return true
      const dept = deptMap.get(member.departmentId) ?? ''
      return `${member.fullName} ${member.title} ${member.email} ${member.phoneNumber} ${dept}`
        .toLocaleLowerCase('tr-TR')
        .includes(needle)
    })
  }, [staff, filterDeptId, activeFilter, q, deptMap])

  async function run(action: () => Promise<unknown>, okMessage: string) {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await action()
      setInfo(okMessage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.')
    } finally {
      setBusy(false)
    }
  }

  async function onCreateDepartment(event: FormEvent) {
    event.preventDefault()
    await run(async () => {
      await apiFetch(
        '/api/v1/departments',
        {
          method: 'POST',
          body: JSON.stringify({
            name: deptName.trim(),
            description: deptDescription.trim() || null,
          }),
        },
        true,
      )
      setDeptName('')
      setDeptDescription('')
    }, 'Departman oluşturuldu. Halka açık dizin: /birimler')
  }

  async function onCreateStaff(event: FormEvent) {
    event.preventDefault()
    if (!staffDepartmentId) return
    await run(async () => {
      await apiFetch(
        '/api/v1/staff',
        {
          method: 'POST',
          body: JSON.stringify({
            departmentId: staffDepartmentId,
            fullName: fullName.trim(),
            title: title.trim(),
            email: email.trim() || null,
            phoneNumber: phone.trim() || null,
          }),
        },
        true,
      )
      setFullName('')
      setTitle('')
      setEmail('')
      setPhone('')
    }, 'Personel kaydı oluşturuldu.')
  }

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Birim yönetimi</h1>
        <p className="muted">
          Departman ve dizin personeli (Identity hesabı değildir). Halka açık:{' '}
          <Link to="/birimler">/birimler</Link>
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <div className="stats-strip" aria-label="Birim özeti">
        <div>
          <span className="muted">Departman</span>
          <strong>{counts.departments}</strong>
        </div>
        <div>
          <span className="muted">Aktif birim</span>
          <strong>{counts.activeDepts}</strong>
        </div>
        <div>
          <span className="muted">Personel</span>
          <strong>{counts.staff}</strong>
        </div>
        <div>
          <span className="muted">Aktif personel</span>
          <strong>{counts.activeStaff}</strong>
        </div>
      </div>

      <form className="panel stack" onSubmit={(e) => void onCreateDepartment(e)}>
        <h3 style={{ margin: 0 }}>Yeni departman</h3>
        <div className="dept-chip-row" role="group" aria-label="Departman şablonları">
          {DEPT_TEMPLATES.map((template) => (
            <button
              key={template.name}
              type="button"
              onClick={() => {
                setDeptName(template.name)
                setDeptDescription(template.description)
              }}
            >
              {template.name.split(' ')[0]}…
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="deptName">Ad</label>
          <input
            id="deptName"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            required
            maxLength={150}
          />
        </div>
        <div className="field">
          <label htmlFor="deptDesc">Açıklama</label>
          <textarea
            id="deptDesc"
            rows={3}
            value={deptDescription}
            onChange={(e) => setDeptDescription(e.target.value)}
            maxLength={500}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          Departman ekle
        </button>
      </form>

      <form className="panel stack" onSubmit={(e) => void onCreateStaff(e)}>
        <h3 style={{ margin: 0 }}>Yeni personel (dizin)</h3>
        <div className="dept-chip-row" role="group" aria-label="Personel şablonları">
          {STAFF_TEMPLATES.map((template) => (
            <button
              key={template.email}
              type="button"
              onClick={() => {
                setFullName(template.fullName)
                setTitle(template.title)
                setEmail(template.email)
                setPhone(template.phone)
              }}
            >
              {template.fullName.split(' ')[0]}
              <span>{template.title}</span>
            </button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="staffDept">Departman</label>
          <select
            id="staffDept"
            value={staffDepartmentId}
            onChange={(e) => setStaffDepartmentId(e.target.value)}
            required
          >
            {departments
              .filter((d) => d.isActive)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
        </div>
        <div className="form-two-col">
          <div className="field">
            <label htmlFor="staffName">Ad soyad</label>
            <input
              id="staffName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="staffTitle">Unvan</label>
            <input
              id="staffTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-two-col">
          <div className="field">
            <label htmlFor="staffEmail">E-posta</label>
            <input
              id="staffEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="staffPhone">Telefon</label>
            <input id="staffPhone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy || !staffDepartmentId}>
          Personel ekle
        </button>
      </form>

      <section className="stack">
        <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Departmanlar</h2>
        <div className="dept-card-grid">
          {departments.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`dept-card${filterDeptId === d.id ? ' is-selected' : ''}`}
              onClick={() => setFilterDeptId((current) => (current === d.id ? 'all' : d.id))}
            >
              <strong>{d.name}</strong>
              <span className="muted">{d.description || 'Açıklama yok'}</span>
              <span className="dept-card-count">
                {staffCountsByDept.get(d.id) ?? 0} personel · {d.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Dizin personeli</h2>
          {filterDeptId !== 'all' ? (
            <button type="button" className="btn btn-ghost" onClick={() => setFilterDeptId('all')}>
              Birim filtresini temizle
            </button>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="hr-search">Ara</label>
          <input
            id="hr-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad, unvan, e-posta…"
          />
        </div>

        <div className="desk-tabs" role="tablist" aria-label="Personel aktiflik">
          {(
            [
              { id: 'active', label: 'Aktif' },
              { id: 'inactive', label: 'Pasif' },
              { id: 'all', label: 'Tümü' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.id}
              className={activeFilter === filter.id ? 'is-active' : undefined}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {filteredStaff.map((m) => (
          <article key={m.id} className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{m.fullName}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {m.title}
                  {' · '}
                  {deptMap.get(m.departmentId) ?? 'Birim'}
                </p>
                <div className="hr-contact" style={{ textAlign: 'left', marginTop: '0.45rem' }}>
                  {m.email ? <a href={`mailto:${m.email}`}>{m.email}</a> : null}
                  {m.phoneNumber ? <a href={`tel:${m.phoneNumber}`}>{m.phoneNumber}</a> : null}
                </div>
              </div>
              <span className={m.isActive ? 'badge badge-ok' : 'badge'}>
                {m.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </article>
        ))}
        {filteredStaff.length === 0 ? <p className="muted">Bu filtrede personel yok.</p> : null}
      </section>
    </div>
  )
}

export function HrManagePage() {
  return (
    <RequireAuth>
      <AdminGate>
        <HrManageContent />
      </AdminGate>
    </RequireAuth>
  )
}
