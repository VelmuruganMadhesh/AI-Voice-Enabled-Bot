import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { fetchProfile, login as apiLogin, register as apiRegister } from '../api/authApi'

type AuthUser = {
  _id: string
  name?: string
  email: string
  phone?: string
  language?: string
}

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  loading: boolean
  authError: string | null
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    name: string
    email: string
    phone?: string
    password: string
    language?: string
  }) => Promise<any>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getStoredToken() {
  return sessionStorage.getItem('access_token')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(getStoredToken())
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const refreshProfile = async () => {
    setLoading(true)
    setAuthError(null)
    try {
      const profileEnvelope = await fetchProfile()
      setUser(profileEnvelope.data as AuthUser)
    } catch (e: any) {
      setUser(null)
      setAccessToken(null)
      sessionStorage.removeItem('access_token')
      setAuthError(e?.response?.data?.message || 'Failed to fetch profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!accessToken) return
    // Best-effort refresh on reload
    refreshProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      authError,
      login: async (email, password) => {
        setLoading(true)
        setAuthError(null)
        try {
          const res = await apiLogin(email, password)
          sessionStorage.setItem('access_token', res.data.token)
          setAccessToken(res.data.token)
          setUser(res.data.user as AuthUser)
        } catch (e: any) {
          setAuthError(e?.response?.data?.message || 'Login failed.')
          throw e
        } finally {
          setLoading(false)
        }
      },
      register: async (payload) => {
        setLoading(true)
        setAuthError(null)
        try {
          const res = await apiRegister(payload)
          // After registration, we reuse profile fetch; login is handled by user next step.
          setUser(null)
          setAuthError(null)
          return res
        } catch (e: any) {
          setAuthError(e?.response?.data?.message || 'Registration failed.')
          throw e
        } finally {
          setLoading(false)
        }
      },
      logout: () => {
        sessionStorage.removeItem('access_token')
        setAccessToken(null)
        setUser(null)
        setAuthError(null)
      },
      refreshProfile,
    }),
    [accessToken, loading, authError, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

