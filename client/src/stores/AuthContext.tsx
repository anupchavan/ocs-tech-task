import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'

const API = '/api'

export interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'core_member' | 'viewer'
  isActive: boolean
  token: string
}

type AuthResult = { success: true } | { success: false; message: string }

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('ocs_user')
    if (!stored) { setLoading(false); return }
    const parsed: User = JSON.parse(stored)
    setUser(parsed)
    // verify token still valid
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${parsed.token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((fresh) => {
        const updated = { ...fresh, token: parsed.token }
        setUser(updated)
        localStorage.setItem('ocs_user', JSON.stringify(updated))
      })
      .catch(() => {
        localStorage.removeItem('ocs_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, message: data.message || 'Login failed' }
      setUser(data)
      localStorage.setItem('ocs_user', JSON.stringify(data))
      return { success: true }
    } catch {
      return { success: false, message: 'Network error. Is the server running?' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('ocs_user')
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
