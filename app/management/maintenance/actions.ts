'use server'

import { revalidatePath } from 'next/cache'
import { createServerAppwriteClient } from '@/lib/appwrite-server'
import { APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '@/lib/appwrite'
import { invalidateMaintenanceCache, type MaintenanceConfigData } from '@/lib/maintenance'

export interface MaintenanceActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface UpdateMaintenancePayload {
  is_enabled: boolean
  scope: 'all' | 'specific'
  blocked_routes: string[]
  title: string
  message: string
  estimated_return: string | null
  updated_by?: string | null
}

export async function getMaintenanceConfigAction(): Promise<MaintenanceActionResult<MaintenanceConfigData>> {
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

    return { success: true, data: config }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve maintenance config from Appwrite',
    }
  }
}

export async function updateMaintenanceConfigAction(
  payload: UpdateMaintenancePayload
): Promise<MaintenanceActionResult<MaintenanceConfigData>> {
  try {
    const { databases } = createServerAppwriteClient()

    const updatePayload = {
      is_enabled: payload.is_enabled,
      scope: payload.scope,
      blocked_routes: payload.blocked_routes || [],
      title: payload.title.trim() || 'System Under Scheduled Maintenance',
      message: payload.message.trim() || 'We are performing scheduled updates to improve our services.',
      estimated_return: payload.estimated_return || null,
      updated_at: new Date().toISOString(),
      updated_by: payload.updated_by || 'Admin',
    }

    const doc = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTIONS.MAINTENANCE,
      'active',
      updatePayload
    )

    const config: MaintenanceConfigData = {
      id: doc.$id,
      is_enabled: Boolean(doc.is_enabled),
      scope: (doc.scope as 'all' | 'specific') || 'all',
      blocked_routes: Array.isArray(doc.blocked_routes) ? doc.blocked_routes : [],
      title: String(doc.title),
      message: String(doc.message),
      estimated_return: doc.estimated_return ? String(doc.estimated_return) : null,
      updated_at: String(doc.updated_at),
      updated_by: doc.updated_by ? String(doc.updated_by) : null,
    }

    // Invalidate local memory cache
    invalidateMaintenanceCache()

    // Revalidate paths
    revalidatePath('/', 'layout')
    revalidatePath('/maintenance')

    return { success: true, data: config }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update maintenance settings in Appwrite',
    }
  }
}
