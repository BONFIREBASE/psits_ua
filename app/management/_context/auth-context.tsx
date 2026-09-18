'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase, findOfficerByEmail } from '@/lib/supabase'

export type UserRole = 'admin' | 'officer'

export interface AuthUser {
  email: string
  displayName: string
  role: UserRole
  position?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  loginWithAdminPassword: (password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  loginWithOfficerEmail: (email: string) => Promise<{ success: boolean; error?: string }>
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const ALLOWED_DOMAIN = '@antiquespride.edu.ph'
const ADMIN_EMAIL = 'psits-ua@antiquespride.edu.ph'
const STORAGE_KEY = 'psits_mgmt_session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verify and resolve user role & identity
  const resolveUserSession = useCallback(async (email: string): Promise<AuthUser | null> => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed.endsWith(ALLOWED_DOMAIN)) {
      return null
    }

    // 1. Super Admin check
    if (trimmed === ADMIN_EMAIL) {
      return {
        email: trimmed,
        displayName: 'PSITS-UA Super Admin',
        role: 'admin',
        position: 'System Administrator',
      }
    }

    // 2. Officer verification against Supabase officers directory
    const officer = await findOfficerByEmail(trimmed)
    if (officer) {
      return {
        email: trimmed,
        displayName: officer.name,
        role: 'officer',
        position: officer.position,
        avatarUrl: officer.image_url || undefined,
      }
    }

    // Email is not authorized
    return null
  }, [])

  // Initialize session from sessionStorage or Supabase Auth
  useEffect(() => {
    let mounted = true

    async function initSession() {
      try {
        // 1. Check local session cache
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser
          if (parsed.email?.endsWith(ALLOWED_DOMAIN)) {
            if (mounted) setUser(parsed)
            setIsLoading(false)
            return
          }
        }

        // 2. Check active Supabase session (e.g. from Google OAuth callback)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) {
          const resolved = await resolveUserSession(session.user.email)
          if (resolved) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(resolved))
            if (mounted) setUser(resolved)
          } else {
            // Unauthorized domain or unregistered email
            await supabase.auth.signOut()
            sessionStorage.removeItem(STORAGE_KEY)
            if (mounted) setUser(null)
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err)
        sessionStorage.removeItem(STORAGE_KEY)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initSession()

    // 3. Listen for OAuth redirects & auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const resolved = await resolveUserSession(session.user.email)
          if (resolved) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(resolved))
            setUser(resolved)
          } else {
            await supabase.auth.signOut()
            sessionStorage.removeItem(STORAGE_KEY)
            setUser(null)
          }
        } else if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem(STORAGE_KEY)
          setUser(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [resolveUserSession])

  // ─── Super Admin Password Login ───
  const loginWithAdminPassword = useCallback(
    async (password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true)

        // Attempt Supabase Auth password verification
        const { data, error } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password,
        })

        // Fallback for offline or static default credential
        const isCredentialValid = !error && data?.user || (password === 'PSITS-UA@_2026')

        if (!isCredentialValid) {
          return { success: false, error: 'Invalid administrator password.' }
        }

        const adminUser: AuthUser = {
          email: ADMIN_EMAIL,
          displayName: 'PSITS-UA Super Admin',
          role: 'admin',
          position: 'System Administrator',
        }

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser))
        setUser(adminUser)
        return { success: true }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Admin authentication failed.',
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // ─── Officer Google SSO ───
  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/management` : ''
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            hd: 'antiquespride.edu.ph', // Enforce Google Hosted Domain
          },
          redirectTo: redirectUrl,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Google authentication failed.',
      }
    }
  }, [])

  // ─── Officer Email Verification ───
  const loginWithOfficerEmail = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      try {
        setIsLoading(true)
        const trimmed = email.trim().toLowerCase()

        if (!trimmed) {
          return { success: false, error: 'Email address is required.' }
        }

        if (!trimmed.endsWith(ALLOWED_DOMAIN)) {
          return {
            success: false,
            error: `Only official ${ALLOWED_DOMAIN} accounts are authorized.`,
          }
        }

        // Admin shortcut if email is admin
        if (trimmed === ADMIN_EMAIL) {
          return {
            success: false,
            error: 'This is the Super Admin email. Please sign in via the Admin Password tab.',
          }
        }

        // Verify that the email is assigned to an officer in Supabase
        const officer = await findOfficerByEmail(trimmed)
        if (!officer) {
          return {
            success: false,
            error: `Access Denied: ${trimmed} is not registered as an active PSITS-UA officer. Contact administrator.`,
          }
        }

        const officerUser: AuthUser = {
          email: trimmed,
          displayName: officer.name,
          role: 'officer',
          position: officer.position,
          avatarUrl: officer.image_url || undefined,
        }

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(officerUser))
        setUser(officerUser)
        return { success: true }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Officer verification failed.',
        }
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // ─── Unified Login ───
  const login = useCallback(
    async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
      const trimmed = email.trim().toLowerCase()
      if (trimmed === ADMIN_EMAIL && password) {
        return loginWithAdminPassword(password)
      }
      return loginWithOfficerEmail(trimmed)
    },
    [loginWithAdminPassword, loginWithOfficerEmail]
  )

  // ─── Logout ───
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    sessionStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithAdminPassword,
        loginWithGoogle,
        loginWithOfficerEmail,
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
