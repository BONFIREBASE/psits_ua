'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { appwrite, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '@/lib/appwrite'
import type { MaintenanceConfigData } from '@/lib/maintenance'
import MaintenancePage from '@/app/maintenance/page'

const EXEMPT_PREFIXES = [
  '/management',
  '/api',
  '/maintenance',
  '/_next',
  '/assets',
]

export default function MaintenanceRealtimeWatcher() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeConfig, setActiveConfig] = useState<MaintenanceConfigData | null>(null)

  const isExempt = EXEMPT_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  )

  useEffect(() => {
    if (isExempt) return

    // 1. Initial fetch of maintenance status
    let isMounted = true
    async function checkInitialStatus() {
      try {
        const res = await fetch('/api/maintenance/status', { cache: 'no-store' })
        if (res.ok && isMounted) {
          const data = await res.json()
          if (data.config) {
            setActiveConfig(data.config)
          }
        }
      } catch {
        // Fallback
      }
    }
    checkInitialStatus()

    // 2. Real-time WebSocket subscription via Appwrite
    let unsubscribe: (() => void) | undefined
    try {
      const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLECTIONS.MAINTENANCE}.documents.active`
      unsubscribe = appwrite.subscribe(channel, (response: { payload: Record<string, unknown> }) => {
        const payload = response.payload
        if (payload && isMounted) {
          const updated: MaintenanceConfigData = {
            id: String(payload.$id || 'active'),
            is_enabled: Boolean(payload.is_enabled),
            scope: (payload.scope as 'all' | 'specific') || 'all',
            blocked_routes: Array.isArray(payload.blocked_routes) ? payload.blocked_routes : [],
            title: String(payload.title || 'System Under Scheduled Maintenance'),
            message: String(payload.message || 'We are performing scheduled updates to improve our services.'),
            estimated_return: payload.estimated_return ? String(payload.estimated_return) : null,
          }
          setActiveConfig(updated)
        }
      })
    } catch (err) {
      console.warn('Appwrite WebSocket maintenance subscription unavailable:', err)
    }

    return () => {
      isMounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [isExempt])

  if (isExempt || !activeConfig || !activeConfig.is_enabled) {
    return null
  }

  // Check if current route is blocked
  const isSiteWide = activeConfig.scope === 'all'
  const cleanPath = (pathname || '/').toLowerCase()
  const isRouteBlocked = (activeConfig.blocked_routes || []).some((route) => {
    const normalized = route.toLowerCase().trim()
    if (!normalized) return false
    if (normalized === '/' && cleanPath === '/') return true
    if (normalized !== '/' && (cleanPath === normalized || cleanPath.startsWith(`${normalized}/`))) {
      return true
    }
    return false
  })

  if (isSiteWide || isRouteBlocked) {
    // Render the maintenance overlay in real-time with cached live config
    return <MaintenancePage initialConfig={activeConfig} />
  }

  return null
}
