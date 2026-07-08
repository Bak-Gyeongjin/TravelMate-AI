import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authLogin, authRegister } from './api'

interface User { userId: string; username: string }

interface AuthCtx {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx>(null!)

export function useAuth() { return useContext(AuthContext) }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tm_token'))
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('tm_user') || 'null') } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const saveAuth = useCallback((t: string, u: User) => {
    localStorage.setItem('tm_token', t)
    localStorage.setItem('tm_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem('tm_token')
    localStorage.removeItem('tm_user')
    setToken(null)
    setUser(null)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const res = await authLogin(username, password)
      saveAuth(res.token, res.user)
    } finally {
      setLoading(false)
    }
  }, [saveAuth])

  const register = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const res = await authRegister(username, password)
      saveAuth(res.token, res.user)
    } finally {
      setLoading(false)
    }
  }, [saveAuth])

  useEffect(() => {
    if (!token) clearAuth()
  }, [token, clearAuth])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout: clearAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
