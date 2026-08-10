export const REQUEST_STATUSES = ['Pending', 'UnderReview', 'Resolved', 'Closed'] as const

export type RequestStatus = (typeof REQUEST_STATUSES)[number]

const STATUS_LABELS: Record<RequestStatus, string> = {
  Pending: 'Bekliyor',
  UnderReview: 'İncelemede',
  Resolved: 'Çözüldü',
  Closed: 'Kapandı',
}

const STATUS_RANK: Record<RequestStatus, number> = {
  Pending: 0,
  UnderReview: 1,
  Resolved: 2,
  Closed: 3,
}

export function isRequestStatus(value: string): value is RequestStatus {
  return REQUEST_STATUSES.includes(value as RequestStatus)
}

export function requestStatusLabel(status: string) {
  return isRequestStatus(status) ? STATUS_LABELS[status] : status
}

export function requestStatusBadgeClass(status: string) {
  switch (status) {
    case 'Pending':
      return 'badge badge-warn'
    case 'UnderReview':
      return 'badge'
    case 'Resolved':
      return 'badge badge-ok'
    case 'Closed':
      return 'badge'
    default:
      return 'badge'
  }
}

export type TimelineStepState = 'done' | 'current' | 'upcoming'

export type TimelineStep = {
  status: RequestStatus
  label: string
  state: TimelineStepState
}

export function buildRequestTimeline(status: string): TimelineStep[] {
  const current = isRequestStatus(status) ? status : 'Pending'
  const currentRank = STATUS_RANK[current]

  return REQUEST_STATUSES.map((step) => {
    const rank = STATUS_RANK[step]
    let state: TimelineStepState = 'upcoming'
    if (rank < currentRank) state = 'done'
    else if (rank === currentRank) state = 'current'
    return { status: step, label: STATUS_LABELS[step], state }
  })
}
