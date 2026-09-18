'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadToR2, deleteFromR2 } from '@/lib/r2'

export interface BannerActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export async function createBannerAction(formData: FormData): Promise<BannerActionResult> {
  try {
    const title = (formData.get('title') as string)?.trim()
    const subtitle = (formData.get('subtitle') as string)?.trim() || ''
    const type = (formData.get('type') as string)?.trim() || 'general'
    const linkUrl = (formData.get('linkUrl') as string)?.trim() || null
    const linkText = (formData.get('linkText') as string)?.trim() || 'Learn More'
    const secondaryLinkUrl = (formData.get('secondaryLinkUrl') as string)?.trim() || null
    const secondaryLinkText = (formData.get('secondaryLinkText') as string)?.trim() || null
    const isActive = formData.get('isActive') === 'true'
    const displayOrder = parseInt((formData.get('displayOrder') as string) || '0', 10)
    const thumbnail = formData.get('thumbnail') as File | null

    if (!title) {
      return { success: false, error: 'Banner title is required.' }
    }

    let imageUrl: string | null = null
    if (thumbnail && thumbnail.size > 0) {
      const sanitized = thumbnail.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const r2Key = `banners/${Date.now()}-${sanitized}`
      const arrayBuffer = await thumbnail.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: thumbnail.type || 'application/octet-stream',
      })
      imageUrl = upload.url
    }

    const { data, error } = await supabaseAdmin
      .from('banners')
      .insert({
        title,
        subtitle,
        type,
        image_url: imageUrl,
        link_url: linkUrl,
        link_text: linkText,
        secondary_link_url: secondaryLinkUrl,
        secondary_link_text: secondaryLinkText,
        is_active: isActive,
        display_order: displayOrder,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/management/banners')
    return { success: true, data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create banner',
    }
  }
}

export async function updateBannerAction(id: string, formData: FormData): Promise<BannerActionResult> {
  try {
    const title = (formData.get('title') as string)?.trim()
    const subtitle = (formData.get('subtitle') as string)?.trim() || ''
    const type = (formData.get('type') as string)?.trim() || 'general'
    const linkUrl = (formData.get('linkUrl') as string)?.trim() || null
    const linkText = (formData.get('linkText') as string)?.trim() || 'Learn More'
    const secondaryLinkUrl = (formData.get('secondaryLinkUrl') as string)?.trim() || null
    const secondaryLinkText = (formData.get('secondaryLinkText') as string)?.trim() || null
    const isActive = formData.get('isActive') === 'true'
    const displayOrder = parseInt((formData.get('displayOrder') as string) || '0', 10)
    const existingImageUrl = (formData.get('existingImageUrl') as string)?.trim() || null
    const thumbnail = formData.get('thumbnail') as File | null

    if (!id || !title) {
      return { success: false, error: 'Banner ID and title are required.' }
    }

    let imageUrl = existingImageUrl
    if (thumbnail && thumbnail.size > 0) {
      const sanitized = thumbnail.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const r2Key = `banners/${Date.now()}-${sanitized}`
      const arrayBuffer = await thumbnail.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: thumbnail.type || 'application/octet-stream',
      })
      imageUrl = upload.url

      if (existingImageUrl && existingImageUrl.includes('.r2.dev')) {
        try {
          const parsed = new URL(existingImageUrl)
          const oldKey = parsed.pathname.replace(/^\//, '')
          if (oldKey) await deleteFromR2(oldKey)
        } catch {}
      }
    }

    const { data, error } = await supabaseAdmin
      .from('banners')
      .update({
        title,
        subtitle,
        type,
        image_url: imageUrl,
        link_url: linkUrl,
        link_text: linkText,
        secondary_link_url: secondaryLinkUrl,
        secondary_link_text: secondaryLinkText,
        is_active: isActive,
        display_order: displayOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/management/banners')
    return { success: true, data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update banner',
    }
  }
}

export async function deleteBannerAction(id: string, imageUrl?: string | null): Promise<BannerActionResult> {
  try {
    if (imageUrl && imageUrl.includes('.r2.dev')) {
      const parsed = new URL(imageUrl)
      const r2Key = parsed.pathname.replace(/^\//, '')
      if (r2Key) {
        try {
          await deleteFromR2(r2Key)
        } catch {}
      }
    }

    const { error } = await supabaseAdmin.from('banners').delete().eq('id', id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    revalidatePath('/management/banners')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete banner',
    }
  }
}

export async function toggleBannerActiveAction(id: string, isActive: boolean): Promise<BannerActionResult> {
  try {
    const { error } = await supabaseAdmin
      .from('banners')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    revalidatePath('/management/banners')
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to toggle banner status',
    }
  }
}

export async function seedDefaultBannerAction(): Promise<BannerActionResult> {
  try {
    const { count } = await supabaseAdmin
      .from('banners')
      .select('*', { count: 'exact', head: true })

    if (count && count > 0) return { success: true }

    const { data, error } = await supabaseAdmin
      .from('banners')
      .insert({
        title: 'Shape the future of tech with PSITS-UA.',
        subtitle: 'Connect with student developers, designers, and tech innovators across the University of Antique.',
        type: 'recruitment',
        image_url: '/assets/cover.jpg',
        link_url: 'https://docs.google.com/forms/d/e/1FAIpQLSd005fH-_fxNnf3qREIODWMGWVGi4K0svkFO3cA2qr0Nswc0w/viewform',
        link_text: 'Join Organization',
        secondary_link_url: '/projects',
        secondary_link_text: 'View Projects',
        is_active: true,
        display_order: 0,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/')
    revalidatePath('/management/banners')
    return { success: true, data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to seed banner',
    }
  }
}
