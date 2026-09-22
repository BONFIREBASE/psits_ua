'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase, findOfficerByEmail } from '@/lib/supabase'
import { createSessionAction, validateSessionAction, destroySessionAction, verifyAdminPasswordAction } from '@/lib/session'

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
const TOKEN_KEY = 'psits_mgmt_token'

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

  // Initialize session from server-backed session token or OAuth
  useEffect(() => {
    let mounted = true

    // Safety timeout to prevent indefinite loading in rare network freeze cases
    const safetyTimer = setTimeout(() => {
      if (mounted) setIsLoading(false)
    }, 4500)

    async function initSession() {
      try {
        const hasOAuthPayload =
          typeof window !== 'undefined' &&
          (window.location.hash.includes('access_token=') ||
            window.location.search.includes('code='))

        // If an OAuth PKCE code is present in query parameters, exchange it
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          const code = params.get('code')
          if (code) {
            try {
              await supabase.auth.exchangeCodeForSession(code)
            } catch (err) {
              console.warn('OAuth exchange code error:', err)
            }
          }
        }

        // 1. Validate server-side session token
        const token = sessionStorage.getItem(TOKEN_KEY)
        if (token) {
          const { valid, user: sessionUser } = await validateSessionAction(token)
          if (valid && sessionUser) {
            if (mounted) setUser(sessionUser)
            setIsLoading(false)
            return
          } else {
            // Token expired or invalid on server
            sessionStorage.removeItem(TOKEN_KEY)
            sessionStorage.removeItem(STORAGE_KEY)
          }
        }

        // 2. Check cached fallback
        const stored = sessionStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser
          if (parsed.email?.endsWith(ALLOWED_DOMAIN)) {
            if (mounted) setUser(parsed)
            setIsLoading(false)
            return
          }
        }

        // 3. Check active Supabase session (OAuth redirect)
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) {
          const resolved = await resolveUserSession(session.user.email)
          if (resolved) {
            const sessionRes = await createSessionAction(resolved)
            if (sessionRes.token) {
              sessionStorage.setItem(TOKEN_KEY, sessionRes.token)
            }
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(resolved))
            if (mounted) {
              setUser(resolved)
              setIsLoading(false)
            }
            sessionStorage.removeItem('psits_auth_redirect')
            localStorage.removeItem('psits_auth_redirect')
            return
          } else {
            await supabase.auth.signOut()
            sessionStorage.removeItem(TOKEN_KEY)
            sessionStorage.removeItem(STORAGE_KEY)
            if (mounted) {
              setUser(null)
              setIsLoading(false)
            }
            sessionStorage.setItem(
              'psits_auth_error',
              `Access Denied: ${session.user.email} is not registered as an active PSITS-UA officer.`
            )
            return
          }
        } else if (hasOAuthPayload) {
          // Allow onAuthStateChange to finish token processing
          return
        }
      } catch (err) {
        console.error('Session initialization error:', err)
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(STORAGE_KEY)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initSession()

    // 4. Listen for OAuth redirects & auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const resolved = await resolveUserSession(session.user.email)
          if (resolved) {
            const sessionRes = await createSessionAction(resolved)
            if (sessionRes.token) {
              sessionStorage.setItem(TOKEN_KEY, sessionRes.token)
            }
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(resolved))
            if (mounted) {
              setUser(resolved)
              setIsLoading(false)
            }
            sessionStorage.removeItem('psits_auth_redirect')
            localStorage.removeItem('psits_auth_redirect')
          } else {
            await supabase.auth.signOut()
            sessionStorage.removeItem(TOKEN_KEY)
            sessionStorage.removeItem(STORAGE_KEY)
            if (mounted) {
              setUser(null)
              setIsLoading(false)
            }
            sessionStorage.setItem(
              'psits_auth_error',
              `Access Denied: ${session.user.email} is not registered as an active PSITS-UA officer.`
            )
          }
        } else if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem(TOKEN_KEY)
          sessionStorage.removeItem(STORAGE_KEY)
          if (mounted) {
            setUser(null)
            setIsLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimer)
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

        // Verify via Supabase Auth or secure server-side environment password
        let isCredentialValid = !error && !!data?.user
        if (!isCredentialValid) {
          const serverAuth = await verifyAdminPasswordAction(password)
          isCredentialValid = serverAuth.success
        }

        if (!isCredentialValid) {
          return { success: false, error: 'Invalid administrator password.' }
        }

        const adminUser: AuthUser = {
          email: ADMIN_EMAIL,
          displayName: 'PSITS-UA Super Admin',
          role: 'admin',
          position: 'System Administrator',
        }

        // Create server-side session token
        const sessionRes = await createSessionAction(adminUser)
        if (sessionRes.token) {
          sessionStorage.setItem(TOKEN_KEY, sessionRes.token)
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
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('psits_auth_redirect', '/management/dashboard')
        localStorage.setItem('psits_auth_redirect', '/management/dashboard')
      }

      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/management/dashboard` : ''
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            hd: 'antiquespride.edu.ph',
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

        if (trimmed === ADMIN_EMAIL) {
          return {
            success: false,
            error: 'This is the Super Admin email. Please sign in via the Admin Password tab.',
          }
        }

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

        // Create server-side session token
        const sessionRes = await createSessionAction(officerUser)
        if (sessionRes.token) {
          sessionStorage.setItem(TOKEN_KEY, sessionRes.token)
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

  // ─── Proper Session-Based Logout ───
  const logout = useCallback(async () => {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY)
      if (token) {
        // Destroy the server-side session in Supabase immediately
        await destroySessionAction(token)
      }
    } catch (err) {
      console.error('Session destruction error:', err)
    }

    try {
      await supabase.auth.signOut()
    } catch {}

    sessionStorage.removeItem(TOKEN_KEY)
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
