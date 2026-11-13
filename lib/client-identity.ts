import { supabase } from '@/lib/supabase'

export async function getClientUserIdentifier(): Promise<string> {
  if (typeof window === 'undefined') return ''

  // 1. Check Supabase authenticated session
  try {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.user?.email) {
      return data.session.user.email.toLowerCase().trim()
    }
  } catch {}

  // 2. Check localStorage auth token fallback
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const item = JSON.parse(localStorage.getItem(key) || '{}')
        const email = item?.user?.email
        if (email) return String(email).toLowerCase().trim()
      }
    }
  } catch {}

  // 3. Fallback to stable guest identifier persisted in localStorage
  try {
    let guestId = localStorage.getItem('psits_guest_device_id')
    if (!guestId) {
      guestId = `guest_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`
      localStorage.setItem('psits_guest_device_id', guestId)
    }
    return guestId
  } catch {
    return 'guest_anonymous'
  }
}

