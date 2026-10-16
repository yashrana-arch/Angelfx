import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, tokenStore } from '../api'
import { setUnauthorizedHandler } from '../api/http'
import type { RegisterInput, User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  /** Re-reads the logged-in user (e.g. after KYC is submitted). */
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => !!tokenStore.get())

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Restore the session from a saved token on first load.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!tokenStore.get()) return
    api.auth
      .me()
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false))
  }, [logout])

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.auth.login(username, password)
    tokenStore.set(res.token)
    setUser(res.user)
    return res.user
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.auth.register(input)
    tokenStore.set(res.token)
    setUser(res.user)
    return res.user
  }, [])

  const refreshUser = useCallback(async () => {
    setUser(await api.auth.me())
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
