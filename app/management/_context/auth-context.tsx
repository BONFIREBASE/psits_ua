'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface AuthUser {
  email: string
  displayName: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const ALLOWED_DOMAIN = '@antiquespride.edu.ph'
const STORAGE_KEY = 'psits_mgmt_session'

function deriveDisplayName(email: string): string {
  const local = email.split('@')[0]
  return local
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser
        if (parsed.email?.endsWith(ALLOWED_DOMAIN)) {
          setUser(parsed)
        } else {
          sessionStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = email.trim().toLowerCase()

    if (!trimmed) {
      return { success: false, error: 'Email address is required.' }
    }

    if (!trimmed.endsWith(ALLOWED_DOMAIN)) {
      return {
        success: false,
        error: `Only ${ALLOWED_DOMAIN} accounts are authorized.`,
      }
    }

    // Simulate async auth delay
    await new Promise((r) => setTimeout(r, 800))

    const authUser: AuthUser = {
      email: trimmed,
      displayName: deriveDisplayName(trimmed),
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser))
    setUser(authUser)

    return { success: true }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
