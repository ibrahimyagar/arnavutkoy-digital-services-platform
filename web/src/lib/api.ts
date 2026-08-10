export type AuthResult = {
  userId: string
  fullName: string
  roles: string[]
  accessToken: string
  accessTokenExpiresAtUtc: string
  refreshToken: string
  refreshTokenExpiresAtUtc: string
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

export type TransportCard = {
  id: string
  ownerUserId: string
  cardNumber: string
  balance: number
  isActive: boolean
}

export type RequestCategory = {
  id: string
  name: string
}

export type Neighborhood = {
  id: string
  districtId: string
  name: string
  headmanFullName: string
  headmanPhoneNumber: string
  population: number
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

type TokenStore = {
  accessToken: string
  refreshToken: string
  fullName: string
  userId: string
  roles: string[]
}

const STORAGE_KEY = 'arnavutkoy.auth'

export function loadSession(): TokenStore | null {
  const raw = localStorage.getItem(STORAGE_KEY)
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

async function readError(response: Response): Promise<string> {
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
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  } else if (authRequired) {
    throw new Error('Oturum gerekli.')
  }

  let response = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (response.status === 401 && session?.refreshToken) {
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

export async function login(nationalId: string, password: string) {
  const auth = await apiFetch<AuthResult>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ nationalId, password }),
  })
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
