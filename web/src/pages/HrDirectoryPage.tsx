import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicPage, PublicRelated } from '../components/ui/PublicPage'
import { apiFetch, type Department, type StaffMember } from '../lib/api'
import { COVERS, RELATED } from '../lib/contentVisuals'

export function HrDirectoryPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [departmentId, setDepartmentId] = useState<string>('all')
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [deps, members] = await Promise.all([
      apiFetch<Department[]>('/api/v1/departments'),
      apiFetch<StaffMember[]>('/api/v1/staff'),
    ])
    setDepartments(deps.filter((d) => d.isActive))
    setStaff(members.filter((m) => m.isActive))
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Birimler yüklenemedi.')
    })
  }, [load])

  const departmentMap = useMemo(
    () => new Map(departments.map((d) => [d.id, d])),
    [departments],
  )

  const staffCountByDept = useMemo(() => {
    const counts = new Map<string, number>()
    for (const member of staff) {
      counts.set(member.departmentId, (counts.get(member.departmentId) ?? 0) + 1)
    }
    return counts
  }, [staff])

  const filteredStaff = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr-TR')
    return staff.filter((member) => {
      if (departmentId !== 'all' && member.departmentId !== departmentId) return false
      if (!needle) return true
      const dep = departmentMap.get(member.departmentId)?.name ?? ''
      return `${member.fullName} ${member.title} ${member.email} ${member.phoneNumber} ${dep}`
        .toLocaleLowerCase('tr-TR')
        .includes(needle)
    })
  }, [staff, departmentId, q, departmentMap])

  const selectedDepartment =
    departmentId === 'all' ? null : departmentMap.get(departmentId) ?? null

  return (
    <PublicPage
      eyebrow="Kurumsal"
      title="Birimler ve personel"
      lead="Halka açık dizin; kimlik girişi gerektirmez. Kurgusal demo verileridir."
      cover={COVERS.mayor}
    >
      {error ? <div className="error-box">{error}</div> : null}

      <div className="request-stats" aria-label="Dizin özeti">
        <div>
          <strong>{departments.length}</strong>
          <span className="muted">Birim</span>
        </div>
        <div>
          <strong>{staff.length}</strong>
          <span className="muted">Personel</span>
        </div>
        <div>
          <strong>{filteredStaff.length}</strong>
          <span className="muted">Görünen</span>
        </div>
      </div>

      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor="hr-q">Personel ara</label>
        <input
          id="hr-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ad, unvan, e-posta, birim…"
        />
      </div>

      <div className="dept-chip-row" role="tablist" aria-label="Departman filtresi">
        <button
          type="button"
          role="tab"
          aria-selected={departmentId === 'all'}
          className={departmentId === 'all' ? 'is-active' : ''}
          onClick={() => setDepartmentId('all')}
        >
          Tümü
          <span>{staff.length}</span>
        </button>
        {departments.map((dep) => (
          <button
            key={dep.id}
            type="button"
            role="tab"
            aria-selected={departmentId === dep.id}
            className={departmentId === dep.id ? 'is-active' : ''}
            onClick={() => setDepartmentId(dep.id)}
          >
            {dep.name}
            <span>{staffCountByDept.get(dep.id) ?? 0}</span>
          </button>
        ))}
      </div>

      {selectedDepartment ? (
        <div className="notice">
          <strong>{selectedDepartment.name}</strong>
          {selectedDepartment.description ? ` — ${selectedDepartment.description}` : ''}
        </div>
      ) : (
        <div className="dept-card-grid">
          {departments.map((dep) => (
            <button
              key={dep.id}
              type="button"
              className="dept-card"
              onClick={() => setDepartmentId(dep.id)}
            >
              <strong>{dep.name}</strong>
              <span className="muted">{dep.description || 'Açıklama yok'}</span>
              <span className="dept-card-count">{staffCountByDept.get(dep.id) ?? 0} kişi</span>
            </button>
          ))}
        </div>
      )}

      <div className="stack">
        {filteredStaff.map((member) => (
          <article key={member.id} className="panel">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <p className="muted" style={{ margin: '0 0 0.25rem', fontSize: '0.85rem' }}>
                  {departmentMap.get(member.departmentId)?.name ?? 'Birim'}
                </p>
                <h3 style={{ margin: 0 }}>{member.fullName}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {member.title}
                </p>
              </div>
              <div className="hr-contact">
                {member.email ? <a href={`mailto:${member.email}`}>{member.email}</a> : null}
                {member.phoneNumber ? (
                  <a href={`tel:${member.phoneNumber}`}>{member.phoneNumber}</a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {filteredStaff.length === 0 && !error ? (
          <div className="panel stack">
            <h3 style={{ margin: 0 }}>Sonuç yok</h3>
            <p className="muted" style={{ margin: 0 }}>
              Filtreyi veya aramayı temizleyip tekrar deneyin. Hizmet talebi için{' '}
              <Link to="/talepler">hizmet masası</Link>.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ justifySelf: 'start' }}
              onClick={() => {
                setDepartmentId('all')
                setQ('')
              }}
            >
              Filtreleri sıfırla
            </button>
          </div>
        ) : null}
      </div>
      <PublicRelated items={RELATED.municipal} />
    </PublicPage>
  )
}
