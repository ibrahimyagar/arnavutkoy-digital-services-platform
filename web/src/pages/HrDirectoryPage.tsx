import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch, type Department, type StaffMember } from '../lib/api'

export function HrDirectoryPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [departmentId, setDepartmentId] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [deps, members] = await Promise.all([
      apiFetch<Department[]>('/api/v1/departments'),
      apiFetch<StaffMember[]>('/api/v1/staff'),
    ])
    setDepartments(deps)
    setStaff(members)
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

  const filteredStaff = useMemo(() => {
    if (departmentId === 'all') return staff
    return staff.filter((m) => m.departmentId === departmentId)
  }, [staff, departmentId])

  const selectedDepartment =
    departmentId === 'all' ? null : departmentMap.get(departmentId) ?? null

  return (
    <div className="container stack">
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Birimler ve personel</h1>
        <p className="muted">
          Halka açık dizin; kimlik girişi gerektirmez. Kurgusal demo verileridir.
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="filter-row" role="tablist" aria-label="Departman filtresi">
        <button
          type="button"
          role="tab"
          aria-selected={departmentId === 'all'}
          className={departmentId === 'all' ? 'btn btn-primary' : 'btn btn-ghost'}
          onClick={() => setDepartmentId('all')}
        >
          Tümü
        </button>
        {departments.map((dep) => (
          <button
            key={dep.id}
            type="button"
            role="tab"
            aria-selected={departmentId === dep.id}
            className={departmentId === dep.id ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setDepartmentId(dep.id)}
          >
            {dep.name}
          </button>
        ))}
      </div>

      {selectedDepartment ? (
        <div className="notice">
          <strong>{selectedDepartment.name}</strong>
          {selectedDepartment.description ? ` — ${selectedDepartment.description}` : ''}
        </div>
      ) : null}

      <div className="stack">
        {filteredStaff.map((member) => (
          <article key={member.id} className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p className="muted" style={{ margin: '0 0 0.25rem', fontSize: '0.85rem' }}>
                  {departmentMap.get(member.departmentId)?.name ?? 'Birim'}
                </p>
                <h3 style={{ margin: 0 }}>{member.fullName}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {member.title}
                </p>
              </div>
              <div className="muted" style={{ fontSize: '0.9rem', textAlign: 'right' }}>
                {member.email ? <div>{member.email}</div> : null}
                {member.phoneNumber ? <div>{member.phoneNumber}</div> : null}
              </div>
            </div>
          </article>
        ))}
        {filteredStaff.length === 0 && !error ? (
          <p className="muted">Bu birimde listelenecek personel yok.</p>
        ) : null}
      </div>
    </div>
  )
}
