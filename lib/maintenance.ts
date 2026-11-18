import { createServerAppwriteClient } from '@/lib/appwrite-server'
import { APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '@/lib/appwrite'

export interface MaintenanceConfigData {
  id?: string
  is_enabled: boolean
  scope: 'all' | 'specific'
  blocked_routes: string[]
  title: string
  message: string
  estimated_return: string | null
  updated_at?: string
  updated_by?: string | null
}

interface CachedMaintenanceState {
  data: MaintenanceConfigData | null
  expiresAt: number
}

// In-memory cache with 4-second TTL to keep proxy/middleware ultra-fast
let memoryCache: CachedMaintenanceState = {
  data: null,
  expiresAt: 0,
}

export const EXEMPT_ROUTE_PREFIXES = [
  '/_next',
  '/assets',
  '/favicon.ico',
  '/icon.png',
  '/apple-icon.png',
  '/robots.txt',
  '/sitemap.xml',
  '/management',
  '/api/management',
  '/maintenance',
  '/api/maintenance',
  '/429',
]

/**
 * Checks if a given path is exempted from maintenance restrictions
 */
export function isRouteExempt(pathname: string): boolean {
  const clean = pathname.toLowerCase()
  return EXEMPT_ROUTE_PREFIXES.some((prefix) => {
    const p = prefix.toLowerCase()
    return clean === p || clean.startsWith(p + '/') || clean.startsWith(p + '?')
  })
}

/**
 * Helper to check if an estimated return date has already passed
 */
export function isReturnTimePassed(estimatedReturn: string | null | undefined): boolean {
  if (!estimatedReturn) return false
  const returnTime = new Date(estimatedReturn).getTime()
  return !isNaN(returnTime) && returnTime <= Date.now()
}

/**
 * Helper to check if a maintenance config has expired based on estimated_return
 */
export function isMaintenanceExpired(config: MaintenanceConfigData | null): boolean {
  if (!config || !config.estimated_return) return false
  return isReturnTimePassed(config.estimated_return)
}

/**
 * Retrieves the active maintenance config from Appwrite with low-latency caching
 */
export async function getActiveMaintenanceConfig(): Promise<MaintenanceConfigData | null> {
  const now = Date.now()
  if (memoryCache.data && now < memoryCache.expiresAt) {
    if (isReturnTimePassed(memoryCache.data.estimated_return)) {
      memoryCache.data.is_enabled = false
      memoryCache.data.estimated_return = null
    }
    return memoryCache.data
  }

  try {
    const { databases } = createServerAppwriteClient()
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.MAINTENANCE,
      'active'
    )

    const config: MaintenanceConfigData = {
      id: doc.$id,
      is_enabled: Boolean(doc.is_enabled),
      scope: (doc.scope as 'all' | 'specific') || 'all',
      blocked_routes: Array.isArray(doc.blocked_routes) ? doc.blocked_routes : [],
      title: String(doc.title || 'System Under Scheduled Maintenance'),
      message: String(doc.message || 'We are performing scheduled updates to improve our services.'),
      estimated_return: doc.estimated_return ? String(doc.estimated_return) : null,
      updated_at: doc.updated_at ? String(doc.updated_at) : doc.$updatedAt,
      updated_by: doc.updated_by ? String(doc.updated_by) : null,
    }

    // Auto-lift check & stale date cleanup:
    // If estimated return timestamp has passed, disable maintenance and clear stale date from Appwrite
    if (isReturnTimePassed(config.estimated_return)) {
      const wasEnabled = config.is_enabled
      config.is_enabled = false
      config.estimated_return = null

      databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTIONS.MAINTENANCE,
        'active',
        {
          is_enabled: false,
          estimated_return: null,
          updated_at: new Date().toISOString(),
          updated_by: wasEnabled
            ? 'System (Auto-Lift Expired Timer)'
            : 'System (Cleared Stale Expired Date)',
        }
      ).catch(() => {})
    }

    memoryCache = {
      data: config,
      expiresAt: now + 4000, // 4-second cache
    }
    return config
  } catch (err) {
    return null
  }
}

/**
 * Checks if a specific pathname is currently under maintenance
 */
export async function isPathUnderMaintenance(pathname: string): Promise<{
  isUnderMaintenance: boolean
  config: MaintenanceConfigData | null
}> {
  if (isRouteExempt(pathname)) {
    return { isUnderMaintenance: false, config: null }
  }

  const config = await getActiveMaintenanceConfig()
  if (!config || !config.is_enabled || isMaintenanceExpired(config)) {
    return { isUnderMaintenance: false, config: config ? { ...config, is_enabled: false } : null }
  }

  // If site-wide maintenance
  if (config.scope === 'all') {
    return { isUnderMaintenance: true, config }
  }

  // If specific page maintenance
  const cleanPath = pathname.toLowerCase()
  const isBlocked = (config.blocked_routes || []).some((route) => {
    const normalizedRoute = route.toLowerCase().trim()
    if (!normalizedRoute) return false
    if (normalizedRoute === '/' && cleanPath === '/') return true
    if (normalizedRoute !== '/' && (cleanPath === normalizedRoute || cleanPath.startsWith(`${normalizedRoute}/`))) {
      return true
    }
    return false
  })

  return { isUnderMaintenance: isBlocked, config }
}

/**
 * Invalidates local memory cache immediately upon update
 */
export function invalidateMaintenanceCache() {
  memoryCache = {
    data: null,
    expiresAt: 0,
  }
}
