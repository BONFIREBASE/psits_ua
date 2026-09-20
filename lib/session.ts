'use server'

import { supabaseAdmin } from './supabase'

export interface SessionData {
  token: string
  email: string
  displayName: string
  role: 'admin' | 'officer'
  position?: string
  avatarUrl?: string
  expiresAt: string
}

/**
 * Server Action: Create a new server-side session token
 */
export async function createSessionAction(
  user: {
    email: string
    displayName: string
    role: 'admin' | 'officer'
    position?: string
    avatarUrl?: string
  },
  expiresInHours = 8
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString()

    const { error } = await supabaseAdmin.from('sessions').insert({
      token,
      email: user.email.toLowerCase(),
      role: user.role,
      display_name: user.displayName,
      position: user.position || null,
      avatar_url: user.avatarUrl || null,
      expires_at: expiresAt,
      last_active_at: new Date().toISOString(),
    })

    if (error) {
      console.warn('[Session Warning]: Could not persist session to DB:', error.message)
      return { success: true, token }
    }

    return { success: true, token }
  } catch (err) {
    console.error('[Create Session Error]:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create session' }
  }
}

/**
 * Server Action: Validate an active session token against Supabase
 */
export async function validateSessionAction(token: string): Promise<{
  valid: boolean
  user?: {
    email: string
    displayName: string
    role: 'admin' | 'officer'
    position?: string
    avatarUrl?: string
  }
}> {
  try {
    if (!token) return { valid: false }

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) {
      return { valid: false }
    }

    // Check expiry
    const now = new Date().getTime()
    const expiresAt = new Date(data.expires_at).getTime()
    if (now > expiresAt) {
      // Expired - purge immediately from DB
      await supabaseAdmin.from('sessions').delete().eq('token', token)
      return { valid: false }
    }

    // Update last_active_at
    await supabaseAdmin
      .from('sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('token', token)

    return {
      valid: true,
      user: {
        email: data.email,
        displayName: data.display_name,
        role: data.role as 'admin' | 'officer',
        position: data.position || undefined,
        avatarUrl: data.avatar_url || undefined,
      },
    }
  } catch {
    return { valid: false }
  }
}

/**
 * Server Action: Invalidate and delete a session from Supabase (Strict Session Logout)
 */
export async function destroySessionAction(token: string): Promise<{ success: boolean }> {
  try {
    if (!token) return { success: true }
    await supabaseAdmin.from('sessions').delete().eq('token', token)
    return { success: true }
  } catch {
    return { success: false }
  }
}

/**
 * Server Action: Authenticate Super Admin credentials securely against server environment variables
 */
export async function verifyAdminPasswordAction(password: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      console.error('[Auth Error]: ADMIN_PASSWORD environment variable is not defined.')
      return { success: false, error: 'Server authentication configuration missing.' }
    }

    if (password !== adminPassword) {
      return { success: false, error: 'Invalid administrator password.' }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Admin authentication failed.',
    }
  }
}
