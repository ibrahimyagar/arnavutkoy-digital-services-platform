export type AuthResult = {
  userId: string
  fullName: string
  roles: string[]
  accessToken: string
  accessTokenExpiresAtUtc: string
  refreshToken: string
  refreshTokenExpiresAtUtc: string
}

export type UserProfile = {
  userId: string
  fullName: string
  email: string
  nationalId: string | null
  phoneNumber: string
  birthDate: string | null
  gender: string
  roles: string[]
  createdAtUtc: string
}

export type Paginated<T> = {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export type Debt = {
  id: string
  debtorUserId: string
  type: string
  principalAmount: number
  overdueInterest: number
  totalPayable: number
  dueDateUtc: string
  status: string
  paidAtUtc: string | null
  createdAtUtc?: string
  overdueDays?: number
  paymentId?: string | null
  paidAmount?: number | null
  maskedCardNumber?: string | null
}

export type CitizenRequestSummary = {
  id: string
  categoryId: string
  status: string
  createdAtUtc: string
  resolvedAtUtc: string | null
}

export type Announcement = {
  id: string
  title: string
  content: string
  status: string
  publishStartUtc: string | null
  publishEndUtc: string | null
  createdAtUtc: string
}

export type PortalContent = {
  id: string
  kind: string
  title: string
  summary: string
  body: string
  slug: string
  location: string | null
  category: string | null
  startsAtUtc: string | null
  endsAtUtc: string | null
  sortOrder: number
  createdAtUtc: string
}

export type EventRegistration = {
  id: string
  eventId: string
  eventTitle: string
  eventLocation: string | null
  eventCategory: string | null
  startsAtUtc: string | null
  endsAtUtc: string | null
  status: string
  registeredAtUtc: string
  cancelledAtUtc: string | null
}

export type EventRegistrationStatus = {
  eventId: string
  isRegistered: boolean
  registrationId: string | null
  status: string | null
  registeredCount: number
  quota: number | null
  remaining: number | null
}

export type SportsFacility = {
  id: string
  name: string
  address: string
  activityType: string
  capacityPerSlot: number
}

export type SportsAppointment = {
  id: string
  facilityId: string
  facilityName: string
  slotStartUtc: string
  slotEndUtc: string
  trackingCode: string
  status: string
}

export type MarriageSlot = {
  id: string
  hallName: string
  ceremonyAtUtc: string
  capacity: number
  remaining: number
  isOpen: boolean
}

export type MarriageBooking = {
  id: string
  slotId: string
  hallName: string
  ceremonyAtUtc: string
  partnerFullName: string
  trackingCode: string
  status: string
}

export type DocumentApplication = {
  id: string
  type: string
  title: string
  description: string
  trackingCode: string
  status: string
  staffNote: string | null
  createdAtUtc: string
}

export type TrackingLookup = {
  kind: string
  trackingCode: string
  status: string
  title: string
  whenUtc: string | null
  detail: string | null
}

export type ContactReceipt = {
  id: string
  trackingCode: string
  subject: string
  status: string
  createdAtUtc: string
}

export type ContactMessageSummary = {
  id: string
  trackingCode: string
  subject: string
  status: string
  preferredReply: string
  createdAtUtc: string
}

export type ZoningParcel = {
  id: string
  ada: string
  parsel: string
  neighborhoodName: string
  zoningStatus: string
  landUse: string
  areaSqm: number
  feePerSqm: number
}

export type ZoningFeeQuote = {
  ada: string
  parsel: string
  neighborhoodName: string
  zoningStatus: string
  landUse: string
  areaSqm: number
  feePerSqm: number
  requestedAreaSqm: number
  totalFee: number
}

export type TransportCard = {
  id: string
  ownerUserId: string
  cardNumber: string
  balance: number
  isActive: boolean
}

export type BoardingRecord = {
  id: string
  transportCardId: string
  busLineId: string
  fareCharged: number
  boardedAtUtc: string
}

export type RequestCategory = {
  id: string
  name: string
}

export type District = {
  id: string
  name: string
  neighborhoodCount: number
}

export type Neighborhood = {
  id: string
  districtId: string
  name: string
  headmanFullName: string
  headmanPhoneNumber: string
  population: number
}

export type Street = {
  id: string
  neighborhoodId: string
  name: string
}

export type Department = {
  id: string
  name: string
  description: string
  isActive: boolean
}

export type StaffMember = {
  id: string
  departmentId: string
  fullName: string
  title: string
  email: string
  phoneNumber: string
  isActive: boolean
}

export type CitizenProperty = {
  id: string
  ownerUserId: string
  neighborhoodId: string
  streetId: string | null
  type: string
  title: string
  doorNumber: string
  blockParcel: string
  isActive: boolean
}

export type WaterSubscription = {
  id: string
  subscriberUserId: string
  neighborhoodId: string
  propertyId: string | null
  subscriptionNumber: string
  status: string
  activatedAtUtc: string
  closedAtUtc: string | null
}

export type SocialAssistanceApplication = {
  id: string
  applicantUserId: string
  type: string
  householdSize: number
  monthlyIncome: number
  householdSummary: string
  extraFieldsJson: string
  status: string
  submittedAtUtc: string
  reviewedAtUtc: string | null
  reviewedByUserId: string | null
  reviewNote: string
}

export type BusLine = {
  id: string
  code: string
  name: string
  routeSummary: string
  baseFare: number
  isActive: boolean
}

export type BusLineStop = {
  id: string
  busLineId: string
  sequence: number
  name: string
}

export type BusLineDeparture = {
  id: string
  busLineId: string
  dayOfWeek: string
  departureTime: string
  note: string
}

export type BusLineDetails = BusLine & {
  stops: BusLineStop[]
  departures: BusLineDeparture[]
}


const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

if (import.meta.env.PROD && !API_BASE) {
  console.error(
    '[arnavutkoy] VITE_API_BASE_URL missing in production build — API calls will hit the Pages origin and fail.',
  )
}

type TokenStore = {
  accessToken: string
  refreshToken: string
  fullName: string
  userId: string
  roles: string[]
}

const STORAGE_KEY = 'arnavutkoy.auth'

function readStorage(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* Safari private / blocked storage */
  }
}

function removeStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function loadSession(): TokenStore | null {
  const raw = readStorage(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as TokenStore
  } catch {
    return null
  }
}

export function saveSession(auth: AuthResult) {
  const payload: TokenStore = {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    fullName: auth.fullName,
    userId: auth.userId,
    roles: auth.roles,
  }
  writeStorage(STORAGE_KEY, JSON.stringify(payload))
}

export function clearSession() {
  removeStorage(STORAGE_KEY)
}

function isAnonymousAuthPath(path: string) {
  return (
    path === '/api/v1/auth/login' ||
    path === '/api/v1/auth/register' ||
    path === '/api/v1/auth/refresh'
  )
}

export function normalizeEmail(email: string) {
  return email
    .replace(/[\u200B\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .trim()
    .replace(/\u0130/g, 'i')
    .replace(/\u0131/g, 'i')
    .toLocaleLowerCase('en-US')
}

async function readError(response: Response): Promise<string> {
  if (response.status === 429) {
    return 'Kısa süre sonra tekrar deneyin.'
  }
  try {
    const body = (await response.json()) as { detail?: string; title?: string }
    return body.detail || body.title || `İstek başarısız (${response.status})`
  } catch {
    return `İstek başarısız (${response.status})`
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const session = loadSession()
  if (!session?.refreshToken) return null

  const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  })

  if (!response.ok) {
    clearSession()
    return null
  }

  const auth = (await response.json()) as AuthResult
  saveSession(auth)
  return auth.accessToken
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  authRequired = false,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const session = loadSession()
  const skipBearer = isAnonymousAuthPath(path)
  if (!skipBearer && session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  } else if (authRequired && !session?.accessToken) {
    throw new Error('Oturum gerekli.')
  }

  let response = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (response.status === 401 && !skipBearer && session?.refreshToken) {
    const nextToken = await refreshAccessToken()
    if (nextToken) {
      headers.set('Authorization', `Bearer ${nextToken}`)
      response = await fetch(`${API_BASE}${path}`, { ...options, headers })
    }
  }

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function login(email: string, password: string) {
  const auth = await apiFetch<AuthResult>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: normalizeEmail(email), password: password.trim() }),
  })
  if (!auth?.accessToken || !auth.refreshToken) {
    throw new Error('Giriş yanıtı eksik. Lütfen tekrar deneyin.')
  }
  saveSession(auth)
  return auth
}

export async function logout() {
  const session = loadSession()
  if (session?.refreshToken) {
    try {
      await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      })
    } catch {
      // ignore network logout failures
    }
  }
  clearSession()
}
