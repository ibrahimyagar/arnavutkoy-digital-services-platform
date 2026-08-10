export function isStaff(roles: string[] | undefined) {
  return Boolean(roles?.includes('Officer') || roles?.includes('Administrator'))
}

export function isAdmin(roles: string[] | undefined) {
  return Boolean(roles?.includes('Administrator'))
}
