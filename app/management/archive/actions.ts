'use server'

import { revalidatePath } from 'next/cache'
import {
  supabaseAdmin,
  getArchivePhotos,
  type ArchivePhotoRow,
  type ArchivePhotoStatus,
} from '@/lib/supabase'
import { uploadToR2, deleteFromR2 } from '@/lib/r2'
import { archivePhotos as initialArchivePhotos } from '@/data/archive'

export interface ArchiveActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

function extractR2KeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname.replace(/^\//, '')
    if (pathname.startsWith('archive/')) {
      return pathname
    }
  } catch {}
  return null
}

/**
 * Fetch all archive photos
 */
export async function getArchivePhotosAction(): Promise<ArchiveActionResult<ArchivePhotoRow[]>> {
  try {
    const photos = await getArchivePhotos(false)
    return { success: true, data: photos }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve archive photos'
    return { success: false, error: message }
  }
}

/**
 * Add a new photo to the PSITS Archive
 */
export async function createArchivePhotoAction(formData: FormData): Promise<ArchiveActionResult<ArchivePhotoRow>> {
  try {
    const alt = (formData.get('alt') as string)?.trim()
    const caption = (formData.get('caption') as string)?.trim() || null
    const year = (formData.get('year') as string)?.trim() || null
    const status = ((formData.get('status') as string)?.trim() || 'active') as ArchivePhotoStatus
    const displayOrder = parseInt((formData.get('display_order') as string) || '0', 10)
    const photo = formData.get('photo') as File | null
    const directUrl = (formData.get('url') as string)?.trim() || null

    if (!alt) {
      return { success: false, error: 'Alt text / Photo description is required.' }
    }

    let imageUrl = directUrl

    if (photo && photo.size > 0) {
      const sanitized = photo.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const r2Key = `archive/${Date.now()}-${sanitized}`
      const arrayBuffer = await photo.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: photo.type || 'application/octet-stream',
      })
      imageUrl = upload.url
    }

    if (!imageUrl) {
      return { success: false, error: 'Please upload an image file or provide an image URL.' }
    }

    const id = `archive-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const { data, error } = await supabaseAdmin
      .from('archive_photos')
      .insert({
        id,
        url: imageUrl,
        alt,
        caption,
        year,
        status,
        display_order: displayOrder,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/about')
    revalidatePath('/management/archive')
    return { success: true, data: data as ArchivePhotoRow }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create archive photo'
    return { success: false, error: message }
  }
}

/**
 * Update metadata or replace photo in PSITS Archive
 */
export async function updateArchivePhotoAction(formData: FormData): Promise<ArchiveActionResult<ArchivePhotoRow>> {
  try {
    const id = (formData.get('id') as string)?.trim()
    const alt = (formData.get('alt') as string)?.trim()
    const caption = (formData.get('caption') as string)?.trim() || null
    const year = (formData.get('year') as string)?.trim() || null
    const status = ((formData.get('status') as string)?.trim() || 'active') as ArchivePhotoStatus
    const displayOrder = parseInt((formData.get('display_order') as string) || '0', 10)
    const photo = formData.get('photo') as File | null
    const existingUrl = (formData.get('existingUrl') as string)?.trim() || null
    const directUrl = (formData.get('url') as string)?.trim() || null

    if (!id) {
      return { success: false, error: 'Photo ID is missing.' }
    }
    if (!alt) {
      return { success: false, error: 'Alt text is required.' }
    }

    let imageUrl = directUrl || existingUrl

    // If a new image was uploaded to replace the existing one
    if (photo && photo.size > 0) {
      const sanitized = photo.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const r2Key = `archive/${Date.now()}-${sanitized}`
      const arrayBuffer = await photo.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: photo.type || 'application/octet-stream',
      })
      imageUrl = upload.url

      // Clean up previous image if it was in our R2 bucket
      if (existingUrl) {
        const oldKey = extractR2KeyFromUrl(existingUrl)
        if (oldKey) {
          try {
            await deleteFromR2(oldKey)
          } catch {}
        }
      }
    }

    if (!imageUrl) {
      return { success: false, error: 'An image URL is required.' }
    }

    const { data, error } = await supabaseAdmin
      .from('archive_photos')
      .update({
        url: imageUrl,
        alt,
        caption,
        year,
        status,
        display_order: displayOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // If table row doesn't exist yet (e.g. from static fallback), insert it
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('archive_photos')
        .insert({
          id,
          url: imageUrl,
          alt,
          caption,
          year,
          status,
          display_order: displayOrder,
        })
        .select()
        .single()

      if (insertError) {
        return { success: false, error: insertError.message }
      }
      revalidatePath('/about')
      revalidatePath('/management/archive')
      return { success: true, data: inserted as ArchivePhotoRow }
    }

    revalidatePath('/about')
    revalidatePath('/management/archive')
    return { success: true, data: data as ArchivePhotoRow }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update archive photo'
    return { success: false, error: message }
  }
}

/**
 * Move a photo directly between Kanban columns (Active Deck <-> Staging <-> Vault)
 */
export async function updatePhotoStatusAction(
  id: string,
  status: ArchivePhotoStatus
): Promise<ArchiveActionResult> {
  try {
    const { error } = await supabaseAdmin
      .from('archive_photos')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/about')
    revalidatePath('/management/archive')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update photo status'
    return { success: false, error: message }
  }
}

/**
 * Delete an archive photo
 */
export async function deleteArchivePhotoAction(id: string, url?: string): Promise<ArchiveActionResult> {
  try {
    if (!id) {
      return { success: false, error: 'Photo ID is required.' }
    }

    const { error } = await supabaseAdmin
      .from('archive_photos')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Try deleting from R2 if url is provided
    if (url) {
      const key = extractR2KeyFromUrl(url)
      if (key) {
        try {
          await deleteFromR2(key)
        } catch {}
      }
    }

    revalidatePath('/about')
    revalidatePath('/management/archive')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete archive photo'
    return { success: false, error: message }
  }
}

/**
 * Reorder photos by updating display_order
 */
export async function reorderArchivePhotosAction(items: { id: string; display_order: number }[]): Promise<ArchiveActionResult> {
  try {
    for (const item of items) {
      await supabaseAdmin
        .from('archive_photos')
        .update({ display_order: item.display_order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    }

    revalidatePath('/about')
    revalidatePath('/management/archive')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reorder archive photos'
    return { success: false, error: message }
  }
}

/**
 * Seed initial archive photos from static data into Supabase
 */
export async function seedDefaultArchivePhotosAction(): Promise<ArchiveActionResult> {
  try {
    const records = initialArchivePhotos.map((photo, index) => ({
      id: photo.id,
      url: photo.url,
      alt: photo.alt,
      caption: photo.caption || null,
      year: photo.year || null,
      status: 'active' as ArchivePhotoStatus,
      display_order: index + 1,
    }))

    const { error } = await supabaseAdmin
      .from('archive_photos')
      .upsert(records, { onConflict: 'id' })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/about')
    revalidatePath('/management/archive')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to seed default photos'
    return { success: false, error: message }
  }
}
