import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ContactMap } from '../components/contact/ContactMap'
import { PublicPage } from '../components/ui/PublicPage'
import { useAuth } from '../auth/AuthContext'
import {
  apiFetch,
  type ContactMessageSummary,
  type ContactReceipt,
  type TrackingLookup,
  type UserProfile,
} from '../lib/api'
import {
  CONTACT_ADDRESS,
  CONTACT_DIRECTIONS,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_OSM,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  CONTACT_INTENTS,
  CONTACT_TOPICS,
  CONTACT_WHATSAPP,
  contactDeskOpen,
  contactStatusLabel,
  intentFromTopicId,
  topicFromQuery,
  type ContactIntentId,
} from '../lib/contactCenter'
import { loginPath } from '../lib/returnUrl'
import './contact.css'

const BODY_MIN = 20

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, '').length
}

export function ContactPage() {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const [params] = useSearchParams()
  const open = contactDeskOpen()
  const initialTopic = topicFromQuery(params.get('konu'))

  const [topicId, setTopicId] = useState(initialTopic.id)
  const [intentId, setIntentId] = useState<ContactIntentId>(() => intentFromTopicId(initialTopic.id))
  const intent = CONTACT_INTENTS.find((item) => item.id === intentId) ?? CONTACT_INTENTS[0]
  const intentTopics = CONTACT_TOPICS.filter((item) => intent.topicIds.includes(item.id))
  const topic = CONTACT_TOPICS.find((item) => item.id === topicId) ?? intentTopics[0] ?? CONTACT_TOPICS[0]
  const [sub, setSub] = useState(topic.subs[0] ?? 'Genel')
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [body, setBody] = useState('')
  const [reply, setReply] = useState<'Email' | 'Phone'>('Email')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<ContactReceipt | null>(null)
  const [copied, setCopied] = useState(false)
  const [trackCode, setTrackCode] = useState(params.get('kod')?.trim() ?? '')
  const [trackResult, setTrackResult] = useState<TrackingLookup | null>(null)
  const [trackError, setTrackError] = useState<string | null>(null)
  const [trackBusy, setTrackBusy] = useState(false)
  const [mine, setMine] = useState<ContactMessageSummary[]>([])
  const [faqOpen, setFaqOpen] = useState<string | null>(null)

  const subject = useMemo(() => (sub ? `${topic.subject} · ${sub}` : topic.subject), [topic, sub])

  useEffect(() => {
    if (!intent.topicIds.includes(topicId)) {
      setTopicId(intent.topicIds[0] ?? 'info')
    }
  }, [intent, topicId])

  useEffect(() => {
    setSub(topic.subs[0] ?? 'Genel')
  }, [topic])

  useEffect(() => {
    if (!isAuthenticated) return
    void apiFetch<UserProfile>('/api/v1/auth/me', {}, true)
      .then((profile) => {
        setFullName((current) => current || profile.fullName)
        setEmail((current) => current || profile.email)
        setPhone((current) => current || profile.phoneNumber)
      })
      .catch(() => undefined)
    void apiFetch<ContactMessageSummary[]>('/api/v1/e-services/contact/mine', {}, true)
      .then(setMine)
      .catch(() => undefined)
  }, [isAuthenticated])

  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (!hash) return
    document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  function validate() {
    const next: Record<string, string> = {}
    if (!fullName.trim()) next.fullName = 'Ad soyad gerekli.'
    if (!isEmail(email)) next.email = 'E-posta adresinizi kontrol edin.'
    if (body.trim().length < BODY_MIN) next.body = 'Mesaj en az 20 karakter olmalıdır.'
    if (reply === 'Phone' && phoneDigits(phone) < 10) next.phone = 'Telefon numarası geçerli değil.'
    if (phone && phoneDigits(phone) < 10) next.phone = 'Telefon numarası geçerli değil.'
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function send() {
    setError(null)
    if (!validate()) return
    setBusy(true)
    try {
      const created = await apiFetch<ContactReceipt>('/api/v1/e-services/contact', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          subject,
          body: body.trim(),
          preferredReply: reply,
        }),
      })
      setReceipt(created)
      setBody('')
      if (isAuthenticated) {
        const list = await apiFetch<ContactMessageSummary[]>('/api/v1/e-services/contact/mine', {}, true).catch(
          () => [] as ContactMessageSummary[],
        )
        setMine(list)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.')
    } finally {
      setBusy(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    await send()
  }

  async function lookup(code: string) {
    setTrackBusy(true)
    setTrackError(null)
    setTrackResult(null)
    try {
      const result = await apiFetch<TrackingLookup>(`/api/v1/e-services/tracking/${encodeURIComponent(code.trim())}`)
      setTrackResult(result)
    } catch (err) {
      setTrackError(err instanceof Error ? err.message : 'Bu takip koduyla eşleşen kayıt bulunamadı.')
    } finally {
      setTrackBusy(false)
    }
  }

  async function copyCode(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <PublicPage immersive className="pub--wide" title="İletişim merkezi">
      <div className="cm">
        <header className="cm-hero">
          <p className="cm-kicker">Dijital iletişim merkezi</p>
          <h1>Size nasıl yardımcı olabiliriz?</h1>
          <p>Talep, öneri, bilgi ve başvurularınız için doğru kanala hızlıca ulaşın.</p>
          <div className="cm-actions" role="navigation" aria-label="Hızlı işlem">
            <Link to={isAuthenticated ? '/talepler' : loginPath('/talepler')}>Talep oluştur</Link>
            <a href="#cm-form">Mesaj gönder</a>
            <Link to="/basvuru-takip">Başvuru takibi</Link>
            <a href="#cm-faq">Sık sorulanlar</a>
          </div>
          <dl className="cm-pulse">
            <div>
              <dt>İletişim merkezi</dt>
              <dd>Portföy demosu</dd>
            </div>
            <div>
              <dt>Yanıt süresi</dt>
              <dd>Demo ortamında anlık</dd>
            </div>
            <div>
              <dt>Durum</dt>
              <dd>
                <span className={open ? 'cm-dot is-on' : 'cm-dot'}>{open ? 'Açık' : 'Kapalı'}</span>
              </dd>
            </div>
          </dl>
        </header>

        <section className="cm-channels" aria-labelledby="cm-ch-title">
          <header>
            <p className="cm-kicker">Kanallar</p>
            <h2 id="cm-ch-title">Demo iletişim bilgisi</h2>
          </header>
          <ul>
            <li>
              <span>Telefon</span>
              <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a>
            </li>
            <li>
              <span>E-posta</span>
              <a href={CONTACT_EMAIL_HREF}>{CONTACT_EMAIL}</a>
            </li>
            <li>
              <span>Adres</span>
              <a href="#cm-map">{CONTACT_ADDRESS}</a>
            </li>
            <li>
              <span>Çalışma</span>
              <strong>Hafta içi 09:00 – 17:00</strong>
            </li>
          </ul>
        </section>

        <div className="cm-split">
          <section className="cm-form-block" id="cm-form" aria-labelledby="cm-form-title">
            {receipt ? (
              <div className="cm-result">
                <p className="cm-kicker">Sonuç</p>
                <h2>Mesajınız başarıyla iletildi.</h2>
                <p>
                  Talep numarası: <strong>{receipt.trackingCode}</strong>
                </p>
                <p className="cm-muted">
                  {isAuthenticated
                    ? 'Panel ve başvuru takibi üzerinden durumunu izleyebilirsiniz.'
                    : 'Takip kodunu saklayın. Giriş yaparsanız sonraki yazışmalar panelde görünür.'}
                </p>
                <div className="cm-row">
                  <button type="button" className="btn btn-primary" onClick={() => void copyCode(receipt.trackingCode)}>
                    {copied ? 'Kopyalandı' : 'Takip kodunu kopyala'}
                  </button>
                  <Link className="btn btn-ghost" to={isAuthenticated ? '/panel' : loginPath('/panel')}>
                    Taleplerime git
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setReceipt(null)
                      setCopied(false)
                    }}
                  >
                    Yeni mesaj gönder
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="cm-kicker">Yazışma</p>
                <h2 id="cm-form-title">Mesaj formu</h2>
                <p className="cm-muted">
                  Önce konuyu seçin. Dosya eki bu demoda kaydedilmez; belge için{' '}
                  <Link to={isAuthenticated ? '/talepler' : loginPath('/talepler')}>talep oluşturun</Link>.
                </p>
                {error ? (
                  <div className="error-box">
                    {error}{' '}
                    <button type="button" className="btn btn-ghost" onClick={() => void send()}>
                      Tekrar dene
                    </button>
                  </div>
                ) : null}
                <form className="cm-form" onSubmit={(event) => void onSubmit(event)} noValidate>
                  <fieldset className="cm-intent">
                    <legend>Ne hakkında yazıyorsunuz?</legend>
                    {CONTACT_INTENTS.map((item) => (
                      <label key={item.id} className={intentId === item.id ? 'is-on' : undefined}>
                        <input
                          type="radio"
                          name="cm-intent"
                          checked={intentId === item.id}
                          onChange={() => {
                            setIntentId(item.id)
                            setTopicId(item.topicIds[0] ?? 'info')
                          }}
                        />
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.hint}</small>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  {intentTopics.length > 1 ? (
                    <div className="cm-pair">
                      <div className="field">
                        <label htmlFor="cm-topic">Konu</label>
                        <select
                          id="cm-topic"
                          value={topic.id}
                          onChange={(event) => setTopicId(event.target.value)}
                        >
                          {intentTopics.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {topic.subs.length > 1 ? (
                        <div className="field">
                          <label htmlFor="cm-sub">Ayrıntı</label>
                          <select id="cm-sub" value={sub} onChange={(event) => setSub(event.target.value)}>
                            {topic.subs.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>
                  ) : topic.subs.length > 1 ? (
                    <div className="field">
                      <label htmlFor="cm-sub">Ayrıntı</label>
                      <select id="cm-sub" value={sub} onChange={(event) => setSub(event.target.value)}>
                        {topic.subs.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  <div className="field">
                    <label htmlFor="cm-name">Ad soyad</label>
                    <input
                      id="cm-name"
                      required
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      aria-invalid={Boolean(fieldErrors.fullName)}
                    />
                    {fieldErrors.fullName ? <p className="cm-err">{fieldErrors.fullName}</p> : null}
                  </div>
                  <div className="cm-pair">
                    <div className="field">
                      <label htmlFor="cm-mail">E-posta</label>
                      <input
                        id="cm-mail"
                        required
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.email)}
                      />
                      {fieldErrors.email ? <p className="cm-err">{fieldErrors.email}</p> : null}
                    </div>
                    <div className="field">
                      <label htmlFor="cm-phone">Telefon</label>
                      <input
                        id="cm-phone"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        inputMode="tel"
                        aria-invalid={Boolean(fieldErrors.phone)}
                      />
                      {fieldErrors.phone ? <p className="cm-err">{fieldErrors.phone}</p> : null}
                    </div>
                  </div>
                  <fieldset className="cm-reply">
                    <legend>Tercih edilen geri dönüş</legend>
                    <label>
                      <input type="radio" name="reply" checked={reply === 'Email'} onChange={() => setReply('Email')} />
                      E-posta
                    </label>
                    <label>
                      <input type="radio" name="reply" checked={reply === 'Phone'} onChange={() => setReply('Phone')} />
                      Telefon
                    </label>
                  </fieldset>
                  <div className="field">
                    <label htmlFor="cm-body">Mesaj</label>
                    <textarea
                      id="cm-body"
                      required
                      rows={6}
                      minLength={BODY_MIN}
                      maxLength={4000}
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      aria-invalid={Boolean(fieldErrors.body)}
                    />
                    {fieldErrors.body ? <p className="cm-err">{fieldErrors.body}</p> : null}
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    {busy ? 'Mesajınız gönderiliyor…' : 'Gönder'}
                  </button>
                </form>
              </>
            )}
          </section>

          <aside className="cm-hours" aria-labelledby="cm-hours-title">
            <p className="cm-kicker">Masa</p>
            <h2 id="cm-hours-title">İletişim merkezi</h2>
            <p className={open ? 'cm-dot is-on' : 'cm-dot'}>{open ? 'Açık' : 'Kapalı'} · demo saat</p>
            <dl>
              <div>
                <dt>Pazartesi – Cuma</dt>
                <dd>09:00 – 17:00</dd>
              </div>
              <div>
                <dt>Cumartesi</dt>
                <dd>Kapalı</dd>
              </div>
              <div>
                <dt>Pazar</dt>
                <dd>Kapalı</dd>
              </div>
            </dl>
            <p className="cm-muted">Saatler Europe/Istanbul dilimine göredir. Resmi mesai değildir.</p>
          </aside>
        </div>

        <section className="cm-track" id="cm-track" aria-labelledby="cm-track-title">
          <p className="cm-kicker">Takip</p>
          <h2 id="cm-track-title">Mesajınızın durumunu takip edin</h2>
          <form
            className="cm-track-form"
            onSubmit={(event) => {
              event.preventDefault()
              void lookup(trackCode)
            }}
          >
            <label htmlFor="cm-kod">Takip kodu</label>
            <div>
              <input
                id="cm-kod"
                value={trackCode}
                onChange={(event) => setTrackCode(event.target.value)}
                placeholder="ILET-260816-4821"
                required
              />
              <button className="btn btn-primary" type="submit" disabled={trackBusy}>
                {trackBusy ? 'Sorgulanıyor…' : 'Durumu gör'}
              </button>
            </div>
          </form>
          {trackError ? <div className="error-box">{trackError}</div> : null}
          {trackResult ? (
            <p>
              <strong>{trackResult.trackingCode}</strong> · {contactStatusLabel(trackResult.status)} · {trackResult.title}
              {trackResult.kind === 'Contact' ? ' · İletişim mesajı' : ` · ${trackResult.kind}`}
            </p>
          ) : null}
          {mine.length > 0 ? (
            <ul className="cm-mine">
              {mine.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link to={`/basvuru-takip?kod=${encodeURIComponent(item.trackingCode)}`}>
                    {item.trackingCode}
                  </Link>
                  <span>
                    {item.subject} · {contactStatusLabel(item.status)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="cm-help" aria-labelledby="cm-help-title">
          <p className="cm-kicker">Kısayol</p>
          <h2 id="cm-help-title">Aradığınız bilgi burada olabilir</h2>
          <ol>
            <li>
              <Link to="/e-belediye">
                <strong>E-Belediye</strong>
                <span>Dijital işlemler hakkında bilgi</span>
              </Link>
            </li>
            <li>
              <Link to="/ulasim-agi">
                <strong>Ulaşım</strong>
                <span>Hat, kart ve güzergâh bilgileri</span>
              </Link>
            </li>
            <li>
              <Link to="/basvuru-takip">
                <strong>Başvuru</strong>
                <span>Başvuru durumunuzu kontrol edin</span>
              </Link>
            </li>
            <li>
              <Link to="/hizmet-rehberi">
                <strong>Hizmet rehberi</strong>
                <span>İhtiyacınız olan belediye hizmetini bulun</span>
              </Link>
            </li>
          </ol>
        </section>

        <section className="cm-place" id="cm-map" aria-labelledby="cm-map-title">
          <div>
            <p className="cm-kicker">Konum</p>
            <h2 id="cm-map-title">Demo konum</h2>
            <p>
              {CONTACT_ADDRESS}
              <br />
              Resmi belediye adresi değildir.
            </p>
            <div className="cm-row">
              <a className="btn btn-primary" href={CONTACT_OSM} target="_blank" rel="noreferrer">
                Haritada göster
              </a>
              <a className="btn btn-ghost" href={CONTACT_DIRECTIONS} target="_blank" rel="noreferrer">
                Yol tarifi
              </a>
            </div>
          </div>
          <ContactMap />
        </section>

        <section className="cm-digital" aria-labelledby="cm-digital-title">
          <p className="cm-kicker">Dijital iletişim</p>
          <h2 id="cm-digital-title">Demo kanal</h2>
          <ul>
            <li>
              <a href={CONTACT_WHATSAPP} target="_blank" rel="noreferrer">
                WhatsApp · hızlı mesaj gönder
              </a>
            </li>
            <li>
              <a href={CONTACT_EMAIL_HREF}>E-posta · e-posta gönder</a>
            </li>
            <li>
              <a href={CONTACT_PHONE_HREF}>Telefon · çağrı merkezini ara</a>
            </li>
          </ul>
        </section>

        <section className="cm-faq" id="cm-faq" aria-labelledby="cm-faq-title">
          <p className="cm-kicker">SSS</p>
          <h2 id="cm-faq-title">Sık sorulan sorular</h2>
          {(
            [
              {
                id: 'q1',
                q: 'Başvurumu nereden takip edebilirim?',
                a: (
                  <>
                    Belge, spor, nikah ve iletişim kodlarını <Link to="/basvuru-takip">başvuru takibi</Link> ekranında
                    sorgulayın.
                  </>
                ),
              },
              {
                id: 'q2',
                q: 'Belediyeye nasıl talep gönderebilirim?',
                a: (
                  <>
                    Hizmet talebi için <Link to={isAuthenticated ? '/talepler' : loginPath('/talepler')}>talep oluştur</Link>{' '}
                    sayfasını kullanın. Genel yazışma bu formdadır.
                  </>
                ),
              },
              {
                id: 'q3',
                q: 'Ulaşım kartımı nasıl yönetebilirim?',
                a: (
                  <>
                    Demo kart bakiyesi <Link to={isAuthenticated ? '/ulasim' : loginPath('/ulasim')}>kartlarım</Link>{' '}
                    ekranındadır.
                  </>
                ),
              },
              {
                id: 'q4',
                q: 'Online ödeme yapabilir miyim?',
                a: (
                  <>
                    Demo tahsilat <Link to={isAuthenticated ? '/vezne' : loginPath('/vezne')}>dijital vezne</Link>{' '}
                    üzerindendir; gerçek ödeme alınmaz.
                  </>
                ),
              },
            ] as const
          ).map((item) => (
            <div key={item.id}>
              <button
                type="button"
                className={faqOpen === item.id ? 'is-on' : ''}
                aria-expanded={faqOpen === item.id}
                onClick={() => setFaqOpen((current) => (current === item.id ? null : item.id))}
              >
                {item.q}
              </button>
              {faqOpen === item.id ? <p>{item.a}</p> : null}
            </div>
          ))}
        </section>

        <p className="cm-emergency">
          Acil durumlar — Bu portal bir portföy demosudur. Acil durumlarda resmi acil yardım kanallarını kullanın.
        </p>
      </div>
    </PublicPage>
  )
}
