import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  loadSession,
  login as apiLogin,
  logout as apiLogout,
} from '../lib/api'

type AuthState = {
  fullName: string
  userId: string
  roles: string[]
} | null

type AuthContextValue = {
  user: AuthState
  isAuthenticated: boolean
  login: (nationalId: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState>(() => {
    const session = loadSession()
    if (!session) return null
    return {
      fullName: session.fullName,
      userId: session.userId,
      roles: session.roles,
    }
  })

  const login = useCallback(async (nationalId: string, password: string) => {
    const auth = await apiLogin(nationalId, password)
    setUser({
      fullName: auth.fullName,
      userId: auth.userId,
      roles: auth.roles,
    })
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
