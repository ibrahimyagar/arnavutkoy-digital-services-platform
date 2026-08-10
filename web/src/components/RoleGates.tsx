import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { isAdmin, isStaff } from '../lib/roles'

export function StaffGate({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user || !isStaff(user.roles)) {
    return <Navigate to="/panel" replace />
  }
  return children
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user || !isAdmin(user.roles)) {
    return <Navigate to="/panel" replace />
  }
  return children
}
