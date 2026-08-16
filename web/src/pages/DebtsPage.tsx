import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { CardPaymentForm, type CardPaymentValues } from '../components/CardPaymentForm'
import { apiFetch, type Debt, type Paginated } from '../lib/api'
import {
  TYPE_LABEL,
  TYPE_SHORT,
  accountTotals,
  dateTimeTr,
  dateTr,
  displayStatus,
  dueYear,
  filterDebts,
  isOverdue,
  isUnpaid,
  maskCard,
  moneyTry,
  overdueDays,
  panelQuery,
  parsePanel,
  parseStatus,
  parseType,
  parseYear,
  recordCode,
  settledAmount,
  statusLabel,
  statusQuery,
  type PanelMode,
  type StatusFilter,
  type TypeFilter,
  typeQuery,
} from '../lib/debtsAccount'
import { RequireAuth } from './PanelPage'
import './debts.css'

type Receipt = {
  titles: string[]
  total: number
  masked: string
  at: string
  count: number
}

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'unpaid', label: 'Ödenmedi' },
  { id: 'paid', label: 'Ödendi' },
  { id: 'overdue', label: 'Gecikmiş' },
]

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'Property', label: 'Emlak' },
  { id: 'Water', label: 'Su' },
  { id: 'Other', label: 'Diğer' },
]

function DebtsContent() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [items, setItems] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkedAt, setCheckedAt] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [payIds, setPayIds] = useState<string[]>(() => {
    const mode = parsePanel(params.get('islem'))
    const id = params.get('kayit')
    return mode === 'pay' && id ? [id] : []
  })

  const status = parseStatus(params.get('durum'))
  const type = parseType(params.get('tur'))
  const year = parseYear(params.get('yil'))
  const query = params.get('q') ?? ''
  const panel = parsePanel(params.get('islem'))
  const activeId = params.get('kayit')

  const load = useCallback(async () => {
    const page = await apiFetch<Paginated<Debt>>('/api/v1/debts/mine?pageSize=100', {}, true)
    setItems(page.items)
    setCheckedAt(new Date().toISOString())
  }, [])

  useEffect(() => {
    setLoading(true)
    void load()
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Borçlar yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [load])

  useEffect(() => {
    if (panel === 'pay' && activeId && payIds.length === 0) {
      setPayIds([activeId])
    }
  }, [activeId, panel, payIds.length])

  useEffect(() => {
    const node = dialogRef.current
    if (!node) return
    if ((panel || receipt) && !node.open) node.showModal()
    if (!panel && !receipt && node.open) node.close()
  }, [panel, receipt])

  const totals = useMemo(() => accountTotals(items), [items])
  const years = useMemo(() => [...new Set(items.map(dueYear))].sort((a, b) => b - a), [items])
  const filtered = useMemo(
    () => filterDebts(items, status, type, year, query),
    [items, status, type, year, query],
  )
  const unpaid = useMemo(() => items.filter(isUnpaid), [items])
  const active = items.find((item) => item.id === activeId) ?? null
  const checkoutItems = useMemo(
    () => unpaid.filter((item) => payIds.includes(item.id)),
    [payIds, unpaid],
  )
  const checkoutTotal = checkoutItems.reduce((sum, item) => sum + item.totalPayable, 0)
  const meterTotal = totals.open + totals.paid
  const paidShare = meterTotal > 0 ? Math.round((totals.paid / meterTotal) * 100) : 0
  const canBulk = unpaid.length > 1
  const selectedDebts = unpaid.filter((item) => selected.includes(item.id))
  const selectedTotal = selectedDebts.reduce((sum, item) => sum + item.totalPayable, 0)

  function patch(next: Record<string, string | null>) {
    const copy = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (!value) copy.delete(key)
      else copy.set(key, value)
    }
    setParams(copy, { replace: true })
  }

  function openPanel(mode: PanelMode, id: string, ids?: string[]) {
    setReceipt(null)
    setError(null)
    setPayIds(mode === 'pay' ? ids ?? [id] : [])
    patch({ islem: panelQuery(mode), kayit: id })
  }

  function closePanel() {
    setReceipt(null)
    setProgress(null)
    setPayIds([])
    patch({ islem: null, kayit: null })
  }

  function toggleSelect(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  async function pay(values: CardPaymentValues) {
    if (checkoutItems.length === 0) return
    setBusy(true)
    setError(null)
    const paid: Debt[] = []
    try {
      for (const [index, debt] of checkoutItems.entries()) {
        if (debt.status === 'Paid') continue
        setProgress(`${index + 1} / ${checkoutItems.length}`)
        await apiFetch(
          `/api/v1/debts/${debt.id}/payments`,
          { method: 'POST', body: JSON.stringify(values) },
          true,
        )
        paid.push(debt)
      }
      setSelected([])
      setReceipt({
        titles: paid.map((item) => TYPE_LABEL[item.type] ?? item.type),
        total: paid.reduce((sum, item) => sum + item.totalPayable, 0),
        masked: maskCard(values.cardNumber),
        at: new Date().toISOString(),
        count: paid.length,
      })
      patch({ islem: 'dekont', kayit: paid[0]?.id ?? null })
      await load()
    } catch (err) {
      setError(
        paid.length > 0
          ? `${paid.length} kayıt tahsil edildi; sonraki ödeme durdu. ${err instanceof Error ? err.message : ''}`
          : err instanceof Error
            ? err.message
            : 'Ödeme başarısız.',
      )
      if (paid.length > 0) {
        setSelected((current) => current.filter((id) => !paid.some((item) => item.id === id)))
        await load()
      }
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  return (
    <div className="db">
      <div className="db-sheet">
        <header className="db-mast">
          <div className="db-mast-top">
            <div>
              <p className="db-kicker">Dijital hesap</p>
              <h1>Borçlarım</h1>
              <p className="db-mast-lead">
                Belediyeye ait açık borçlarınızı tek bakışta görün, kaydı inceleyin ve demo vezne
                üzerinden tahsilatı başlatın.
              </p>
            </div>
            <ul className="db-crumb">
              <li>
                <Link to="/e-belediye">E-Belediye</Link>
              </li>
              <li>
                <Link to="/vezne">Dijital vezne</Link>
              </li>
              <li>
                <Link to="/panel">Hesabım</Link>
              </li>
            </ul>
          </div>
          <div className="db-balance">
            <div className="db-balance-main">
              <span>Açık borç</span>
              <strong>{loading ? '—' : moneyTry(totals.open)}</strong>
              <em>
                {loading
                  ? 'Hesap yükleniyor'
                  : totals.openCount === 0
                    ? 'Açık kayıt yok'
                    : `${totals.openCount} açık kayıt`}
                {totals.overdueCount > 0 ? ` · ${totals.overdueCount} gecikmiş` : ''}
              </em>
            </div>
            <div className="db-side">
              <p>
                <span>Ödenmiş</span>
                <strong className="is-ok">{loading ? '—' : moneyTry(totals.paid)}</strong>
              </p>
              <p>
                <span>Vadesi gelmemiş</span>
                <strong>{loading ? '—' : moneyTry(totals.upcoming)}</strong>
              </p>
              <p>
                <span>Gecikmiş</span>
                <strong className={totals.overdue > 0 ? 'is-late' : undefined}>
                  {loading ? '—' : moneyTry(totals.overdue)}
                </strong>
              </p>
              {meterTotal > 0 ? (
                <div>
                  <div
                    className="db-meter"
                    role="img"
                    aria-label={`Ödenmiş ${paidShare} yüzde, açık ${moneyTry(totals.open)}`}
                  >
                    <span style={{ width: `${paidShare}%` }} />
                  </div>
                  <p className="db-meter-caption">
                    <span>Ödenmiş {moneyTry(totals.paid)}</span>
                    <span>Ödenecek {moneyTry(totals.open)}</span>
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          <p className="db-note">
            Demo hesap özeti · Son kontrol: {checkedAt ? dateTimeTr(checkedAt) : '—'} · Tutarlar API’deki
            gecikme faizi hesabına göredir.
          </p>
        </header>

        <div className="db-toolbar">
          <fieldset className="db-filters">
            <legend>Durum</legend>
            <div className="db-seg" role="tablist" aria-label="Borç durumu">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={status === item.id}
                  className={status === item.id ? 'is-on' : undefined}
                  onClick={() => patch({ durum: statusQuery(item.id) })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="db-filters">
            <legend>Tür</legend>
            <div className="db-seg" role="group" aria-label="Borç türü">
              {TYPE_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={type === item.id ? 'is-on' : undefined}
                  aria-pressed={type === item.id}
                  onClick={() => patch({ tur: typeQuery(item.id) })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="db-tools">
            <div className="db-search">
              <label htmlFor="db-q">Arama</label>
              <input
                id="db-q"
                value={query}
                onChange={(event) => patch({ q: event.target.value || null })}
                placeholder="Tür, yıl veya kayıt no"
              />
            </div>
            <div className="db-search">
              <label htmlFor="db-year">Dönem</label>
              <select
                id="db-year"
                value={year === 'all' ? 'tumu' : String(year)}
                onChange={(event) => patch({ yil: event.target.value === 'tumu' ? null : event.target.value })}
              >
                <option value="tumu">Tüm yıllar</option>
                {years.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && !panel && !receipt ? <div className="error-box">{error}</div> : null}

        {loading ? (
          <div className="db-skel" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        ) : null}

        {!loading && items.length === 0 ? (
          <div className="db-empty">
            <p className="db-kicker">Hesap</p>
            <h2>Harika, şu anda açık borcunuz bulunmuyor.</h2>
            <p>Belediye hesabınızda ödenmesi gereken aktif bir kayıt yok. Yeni tahakkuk personel veznesinden düşer.</p>
            <div className="db-empty-actions">
              <Link className="btn btn-primary" to="/hizmet-rehberi">
                Hizmet rehberine git
              </Link>
              <Link className="btn btn-ghost" to="/e-belediye">
                E-Belediye
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && items.length > 0 && filtered.length === 0 && status === 'unpaid' && type === 'all' && year === 'all' && !query.trim() ? (
          <div className="db-empty">
            <p className="db-kicker">Hesap</p>
            <h2>Harika, şu anda açık borcunuz bulunmuyor.</h2>
            <p>Ödenmesi gereken aktif kayıt yok. Geçmiş tahsilatları ödenmiş listesinden görebilirsiniz.</p>
            <div className="db-empty-actions">
              <button type="button" className="btn btn-primary" onClick={() => patch({ durum: 'odendi' })}>
                Ödenmiş kayıtlar
              </button>
              <Link className="btn btn-ghost" to="/hizmet-rehberi">
                Hizmet rehberine git
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && items.length > 0 && filtered.length === 0 && !(status === 'unpaid' && type === 'all' && year === 'all' && !query.trim()) ? (
          <div className="db-empty">
            <h2>Bu görünümde kayıt yok.</h2>
            <p>Filtreleri temizleyerek tüm hesap hareketlerinizi görebilirsiniz.</p>
            <div className="db-empty-actions">
              <button type="button" className="btn btn-primary" onClick={() => patch({ durum: 'tumu', tur: null, yil: null, q: null })}>
                Filtreleri sıfırla
              </button>
            </div>
          </div>
        ) : null}

        <div className="db-ledger">
          {filtered.map((debt) => {
            const late = isOverdue(debt)
            const paid = debt.status === 'Paid'
            const tone = displayStatus(debt)
            return (
              <article
                key={debt.id}
                className={`db-record${late ? ' is-late' : ''}${paid ? ' is-paid' : ''}${canBulk ? ' has-pick' : ''}`}
              >
                {canBulk && isUnpaid(debt) ? (
                  <label className="db-pick">
                    <input
                      type="checkbox"
                      checked={selected.includes(debt.id)}
                      onChange={() => toggleSelect(debt.id)}
                      aria-label={`${TYPE_LABEL[debt.type] ?? debt.type} kaydını seç`}
                    />
                  </label>
                ) : canBulk ? (
                  <span />
                ) : null}
                <div className="db-record-main">
                <div className="db-record-top">
                  <div>
                    <h2>{TYPE_LABEL[debt.type] ?? debt.type}</h2>
                    <p>
                      {dueYear(debt)} · {recordCode(debt.id)}
                      {late ? ` · ${overdueDays(debt)} gün gecikme` : ''}
                    </p>
                  </div>
                  <span className={`db-badge${tone === 'Overdue' ? ' is-late' : ''}${tone === 'Paid' ? ' is-ok' : ''}`}>
                    {statusLabel(debt)}
                  </span>
                </div>
                <dl className="db-lines">
                  <div>
                    <dt>Son ödeme</dt>
                    <dd>{dateTr(debt.dueDateUtc)}</dd>
                  </div>
                  {paid ? (
                    <>
                      <div>
                        <dt>Ödeme tarihi</dt>
                        <dd>{dateTr(debt.paidAtUtc)}</dd>
                      </div>
                      <div className="is-sum">
                        <dt>Ödenen</dt>
                        <dd>{moneyTry(settledAmount(debt))}</dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <dt>Ana tutar</dt>
                        <dd>{moneyTry(debt.principalAmount)}</dd>
                      </div>
                      <div>
                        <dt>Gecikme faizi</dt>
                        <dd>{moneyTry(debt.overdueInterest)}</dd>
                      </div>
                      <div className="is-sum">
                        <dt>Toplam</dt>
                        <dd>{moneyTry(debt.totalPayable)}</dd>
                      </div>
                    </>
                  )}
                </dl>
                <div className="db-record-foot">
                  <p>{TYPE_SHORT[debt.type] ?? debt.type} kaydı · demo tahakkuk</p>
                  <div className="db-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => openPanel('detail', debt.id)}>
                      Detayları gör
                    </button>
                    {paid ? (
                      <button type="button" className="btn btn-ghost" onClick={() => openPanel('receipt', debt.id)}>
                        Ödeme detayı
                      </button>
                    ) : (
                      <button type="button" className="btn btn-primary" onClick={() => openPanel('pay', debt.id)}>
                        {late ? 'Hemen öde' : 'Öde'}
                      </button>
                    )}
                  </div>
                </div>
                </div>
              </article>
            )
          })}
        </div>

        <p className="db-foot">
          Güvenli demo ödeme. Bu proje portföy amaçlıdır; gerçek banka veya kredi kartı işlemi
          yapılmaz. Kart numarası sunucuda saklanmaz.
        </p>
      </div>

      {canBulk && selectedDebts.length > 0 ? (
        <div className="db-paybar" role="status">
          <p>
            {selectedDebts.length} borç seçildi
            <strong>{moneyTry(selectedTotal)}</strong>
          </p>
          <div className="db-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setSelected([])}>
              Seçimi bırak
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => openPanel('pay', selectedDebts[0].id, selectedDebts.map((item) => item.id))}
            >
              Seçilenleri öde
            </button>
          </div>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        className="db-drawer"
        aria-labelledby="db-drawer-title"
        onClose={closePanel}
      >
        <div className="db-drawer-inner">
          <header>
            <div>
              <p className="db-kicker">
                {receipt || panel === 'receipt' ? 'Makbuz' : panel === 'pay' ? 'Tahsilat' : 'Kayıt'}
              </p>
              <h2 id="db-drawer-title">
                {receipt
                  ? 'Ödeme alındı'
                  : panel === 'pay'
                    ? 'Ödeme özeti'
                    : TYPE_LABEL[active?.type ?? ''] ?? 'Borç detayı'}
              </h2>
            </div>
            <button type="button" className="btn btn-ghost" onClick={closePanel}>
              Kapat
            </button>
          </header>

          {error && (panel || receipt) ? <div className="error-box">{error}</div> : null}

          {receipt ? (
            <>
              <div className="db-receipt">
                <p className="db-success">Demo tahsilat tamamlandı.</p>
                <h3>Dijital vezne makbuzu</h3>
                <p>{receipt.titles.join(', ')}</p>
                <p>Adet: {receipt.count}</p>
                <p>Tutar: {moneyTry(receipt.total)}</p>
                <p>Kart: {receipt.masked}</p>
                <p>Zaman: {dateTimeTr(receipt.at)}</p>
                <p>Bu bir portföy demosudur. PDF üretilmez; kayıt hesabınızda “Ödendi” olur.</p>
              </div>
              <div className="db-actions">
                <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                  Yazdır
                </button>
                <button type="button" className="btn btn-primary" onClick={closePanel}>
                  Hesaba dön
                </button>
              </div>
            </>
          ) : null}

          {!receipt && panel === 'pay' && checkoutItems.length > 0 ? (
            <>
              <p className="db-notice">
                Demo ödeme ortamı. Gerçek banka tahsilatı yoktur. Kart bilgisi kalıcı saklanmaz.
              </p>
              <dl className="db-facts">
                {checkoutItems.map((item) => (
                  <div key={item.id}>
                    <dt>{TYPE_SHORT[item.type] ?? item.type}</dt>
                    <dd>
                      {moneyTry(item.totalPayable)}
                      {isOverdue(item) ? ` · ${overdueDays(item)} gün gecikme` : ''}
                    </dd>
                  </div>
                ))}
                <div>
                  <dt>Yöntem</dt>
                  <dd>Demo kredi kartı</dd>
                </div>
                <div>
                  <dt>Toplam</dt>
                  <dd>
                    <strong>{moneyTry(checkoutTotal)}</strong>
                  </dd>
                </div>
              </dl>
              <CardPaymentForm
                initialHolder={user?.fullName}
                busy={busy}
                busyLabel={progress ? `${progress} tahsil ediliyor…` : 'İşleniyor…'}
                submitLabel={`${moneyTry(checkoutTotal)} onayla`}
                onSubmit={pay}
              />
              <button type="button" className="btn btn-ghost" onClick={closePanel} disabled={busy}>
                İptal
              </button>
            </>
          ) : null}

          {!receipt && panel === 'pay' && !loading && checkoutItems.length === 0 ? (
            <p>
              Ödenecek açık kayıt bulunamadı.{' '}
              <button type="button" className="btn btn-ghost" onClick={closePanel}>
                Geri
              </button>
            </p>
          ) : null}

          {!receipt && panel && panel !== 'pay' && !loading && !active ? (
            <p>
              Bu kayıt bulunamadı.{' '}
              <button type="button" className="btn btn-ghost" onClick={closePanel}>
                Geri
              </button>
            </p>
          ) : null}

          {!receipt && panel !== 'pay' && active ? (
            <>
              <dl className={active.status === 'Paid' ? 'db-facts db-receipt' : 'db-facts'}>
                <div>
                  <dt>Tür</dt>
                  <dd>{TYPE_LABEL[active.type] ?? active.type}</dd>
                </div>
                <div>
                  <dt>Kayıt no</dt>
                  <dd>{recordCode(active.id)}</dd>
                </div>
                {active.createdAtUtc ? (
                  <div>
                    <dt>Tahakkuk</dt>
                    <dd>{dateTr(active.createdAtUtc)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Son ödeme</dt>
                  <dd>{dateTr(active.dueDateUtc)}</dd>
                </div>
                {isOverdue(active) ? (
                  <div>
                    <dt>Gecikme</dt>
                    <dd>{overdueDays(active)} gün</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Ana tutar</dt>
                  <dd>{moneyTry(active.principalAmount)}</dd>
                </div>
                <div>
                  <dt>Faiz</dt>
                  <dd>{moneyTry(isUnpaid(active) ? active.overdueInterest : 0)}</dd>
                </div>
                <div>
                  <dt>{active.status === 'Paid' ? 'Ödenen' : 'Toplam'}</dt>
                  <dd>
                    <strong>
                      {moneyTry(active.status === 'Paid' ? settledAmount(active) : active.totalPayable)}
                    </strong>
                  </dd>
                </div>
                <div>
                  <dt>Durum</dt>
                  <dd>{statusLabel(active)}</dd>
                </div>
                {active.paidAtUtc ? (
                  <div>
                    <dt>Ödeme tarihi</dt>
                    <dd>{dateTr(active.paidAtUtc)}</dd>
                  </div>
                ) : null}
                {active.maskedCardNumber ? (
                  <div>
                    <dt>Kart</dt>
                    <dd>{active.maskedCardNumber}</dd>
                  </div>
                ) : null}
              </dl>
              {isUnpaid(active) ? (
                <button type="button" className="btn btn-primary" onClick={() => openPanel('pay', active.id)}>
                  Ödemeye geç
                </button>
              ) : (
                <>
                  <p className="db-notice">
                    Bu kayıt ödenmiştir. PDF dekont üretilmez; ekrandaki ödeme detayı demo makbuzdur.
                  </p>
                  <div className="db-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                      Yazdır
                    </button>
                    <button type="button" className="btn btn-primary" onClick={closePanel}>
                      Hesaba dön
                    </button>
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </dialog>
    </div>
  )
}

export function DebtsPage() {
  return (
    <RequireAuth>
      <DebtsContent />
    </RequireAuth>
  )
}
