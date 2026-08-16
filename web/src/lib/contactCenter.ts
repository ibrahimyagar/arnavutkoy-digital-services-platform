export const CONTACT_PHONE = '0212 600 00 00'
export const CONTACT_PHONE_HREF = 'tel:+902126000000'
export const CONTACT_EMAIL = 'iletisim@arnavutkoy-demo.local'
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`
export const CONTACT_WHATSAPP =
  'https://wa.me/905555000000?text=Merhaba%2C%20Arnavutk%C3%B6y%20dijital%20hizmetler%20demosunu%20inceledim.'
export const CONTACT_ADDRESS = 'Arnavutköy / İstanbul'
export const CONTACT_LAT = 41.1839
export const CONTACT_LNG = 28.7408
export const CONTACT_OSM = `https://www.openstreetmap.org/?mlat=${CONTACT_LAT}&mlon=${CONTACT_LNG}#map=15/${CONTACT_LAT}/${CONTACT_LNG}`
export const CONTACT_DIRECTIONS = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${CONTACT_LAT}%2C${CONTACT_LNG}`

export type ContactTopic = {
  id: string
  label: string
  subject: string
  subs: string[]
}

export const CONTACT_TOPICS: ContactTopic[] = [
  { id: 'info', label: 'Bilgi', subject: 'Bilgi', subs: ['Genel bilgi', 'Hizmet saatleri', 'Adres'] },
  { id: 'request', label: 'Talep / öneri', subject: 'Talep / öneri', subs: ['Öneri', 'Hizmet talebi', 'Diğer'] },
  { id: 'complaint', label: 'Şikayet / bildirim', subject: 'Şikayet / bildirim', subs: ['Altyapı', 'Temizlik', 'Gürültü', 'Diğer'] },
  { id: 'tech', label: 'Teknik destek', subject: 'Teknik destek', subs: ['Giriş / hesap', 'Portal hatası', 'Diğer'] },
  { id: 'ebelediye', label: 'E-Belediye', subject: 'E-Belediye', subs: ['Ödeme', 'Belge', 'Takip kodu', 'Diğer'] },
  { id: 'transport', label: 'Ulaşım', subject: 'Ulaşım', subs: ['Hat / durak', 'Sefer', 'Kart', 'Diğer'] },
  { id: 'culture', label: 'Kültür ve etkinlik', subject: 'Kültür ve etkinlik', subs: ['Etkinlik', 'Mekân', 'Kayıt', 'Diğer'] },
  { id: 'aid', label: 'Sosyal destek', subject: 'Sosyal destek', subs: ['Başvuru', 'Durum sorgusu', 'Diğer'] },
  { id: 'other', label: 'Diğer', subject: 'Diğer', subs: ['Genel'] },
]

export type ContactIntentId = 'info' | 'write' | 'service' | 'support'

export const CONTACT_INTENTS: {
  id: ContactIntentId
  label: string
  hint: string
  topicIds: string[]
}[] = [
  { id: 'info', label: 'Bilgi almak istiyorum', hint: 'Saat, adres, genel soru', topicIds: ['info'] },
  { id: 'write', label: 'Talep veya şikayet', hint: 'Öneri, bildirim, arıza', topicIds: ['request', 'complaint'] },
  { id: 'service', label: 'Bir hizmet hakkında', hint: 'E-Belediye, ulaşım, kültür, yardım', topicIds: ['ebelediye', 'transport', 'culture', 'aid'] },
  { id: 'support', label: 'Teknik destek', hint: 'Giriş, portal, diğer', topicIds: ['tech', 'other'] },
]

export function intentFromTopicId(topicId: string): ContactIntentId {
  const match = CONTACT_INTENTS.find((intent) => intent.topicIds.includes(topicId))
  return match?.id ?? 'info'
}

export function topicFromQuery(value: string | null): ContactTopic {
  if (!value) return CONTACT_TOPICS[0]
  const needle = value.trim().toLocaleLowerCase('tr-TR')
  return CONTACT_TOPICS.find((topic) => topic.id === needle || topic.subject.toLocaleLowerCase('tr-TR') === needle) ?? CONTACT_TOPICS[0]
}

export function contactDeskOpen(at = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at)
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? ''
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  const minutes = hour * 60 + minute
  const weekdayOpen = weekday !== 'Sat' && weekday !== 'Sun'
  return weekdayOpen && minutes >= 9 * 60 && minutes < 17 * 60
}

export function contactStatusLabel(status: string) {
  if (status === 'New') return 'Yanıt bekleniyor'
  if (status === 'Read') return 'İnceleniyor'
  if (status === 'Closed') return 'Kapatıldı'
  return status
}
