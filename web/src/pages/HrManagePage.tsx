import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AdminGate } from '../components/RoleGates'
import { apiFetch, type Department, type StaffMember } from '../lib/api'
import { RequireAuth } from './PanelPage'

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
    setStaffDepartmentId((current) => current || deps[0]?.id || '')
  }, [])

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'HR verisi yüklenemedi.')
    })
  }, [load])

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
    }, 'Departman oluşturuldu.')
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
        <p className="muted">Departman ve dizin personeli ekleyin (Identity hesabı değildir).</p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {info ? <div className="notice">{info}</div> : null}

      <form className="panel stack" onSubmit={(e) => void onCreateDepartment(e)}>
        <h3>Yeni departman</h3>
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
        <h3>Yeni personel (dizin)</h3>
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
          <input id="staffTitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
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
        <button className="btn btn-primary" type="submit" disabled={busy || !staffDepartmentId}>
          Personel ekle
        </button>
      </form>

      <section className="stack">
        <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Departmanlar</h2>
        {departments.map((d) => (
          <article key={d.id} className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{d.name}</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  {d.description || '—'}
                </p>
              </div>
              <span className={d.isActive ? 'badge badge-ok' : 'badge'}>
                {d.isActive ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="stack">
        <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Dizin personeli</h2>
        {staff.map((m) => (
          <article key={m.id} className="panel">
            <h3 style={{ margin: 0 }}>{m.fullName}</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              {m.title}
              {' · '}
              {departments.find((d) => d.id === m.departmentId)?.name ?? 'Birim'}
              {m.email ? ` · ${m.email}` : ''}
            </p>
          </article>
        ))}
        {staff.length === 0 ? <p className="muted">Personel kaydı yok.</p> : null}
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
