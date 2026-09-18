'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';
import { socialDispatches } from '@/data/announcements';

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'post'}-${Date.now().toString(36)}`;
}

function parseCreditsFromFormData(formData: FormData): Record<string, string> | null {
  const credits: Record<string, string> = {};
  const creditsRaw = (formData.get('credits') as string)?.trim();

  if (creditsRaw) {
    try {
      const parsed = JSON.parse(creditsRaw);
      if (Array.isArray(parsed)) {
        parsed.forEach((item: { role?: string; name?: string }) => {
          if (item?.role && item?.name) {
            const key = item.role.trim().toLowerCase().replace(/[\s-]+/g, '_');
            credits[key] = item.name.trim();
          }
        });
      } else if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([k, v]) => {
          if (typeof v === 'string' && v.trim()) {
            credits[k.toLowerCase().replace(/[\s-]+/g, '_')] = v.trim();
          }
        });
      }
    } catch {
      // Fallback if not valid JSON
    }
  }

  const creditWriter = (formData.get('creditWriter') as string)?.trim();
  const creditPhotographer = (formData.get('creditPhotographer') as string)?.trim();
  const creditPubmat = (formData.get('creditPubmat') as string)?.trim();

  if (creditWriter && !credits.writer) credits.writer = creditWriter;
  if (creditPhotographer && !credits.photographer) credits.photographer = creditPhotographer;
  if (creditPubmat && !credits.pubmat) credits.pubmat = creditPubmat;

  return Object.keys(credits).length > 0 ? credits : null;
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Create a new blog post
 * Uploads thumbnail directly to Cloudflare R2 and inserts record into Supabase.
 */
export async function createBlogPost(formData: FormData): Promise<ActionResult> {
  try {
    const title = (formData.get('title') as string)?.trim();
    const category = (formData.get('category') as string)?.trim() || 'Official Advisory';
    const date = (formData.get('date') as string)?.trim() || new Date().toISOString().split('T')[0];
    const fullContent = (formData.get('fullContent') as string)?.trim();
    const rawExcerpt = (formData.get('excerpt') as string)?.trim();
    // Auto-generate clean excerpt from full content (first 160 chars) if not explicitly provided
    const excerpt =
      rawExcerpt ||
      (fullContent
        ? (fullContent.length > 160
            ? fullContent.slice(0, 157).replace(/[\r\n#*`>-]+/g, ' ').trim() + '...'
            : fullContent.replace(/[\r\n#*`>-]+/g, ' ').trim())
        : '');

    const highlightQuote = (formData.get('highlightQuote') as string)?.trim() || null;
    const quoteAuthor = (formData.get('quoteAuthor') as string)?.trim() || null;
    const postUrl = (formData.get('postUrl') as string)?.trim() || null;
    const tagsRaw = (formData.get('tags') as string)?.trim() || '';
    const creditWriter = (formData.get('creditWriter') as string)?.trim() || null;
    const creditPhotographer = (formData.get('creditPhotographer') as string)?.trim() || null;
    const creditPubmat = (formData.get('creditPubmat') as string)?.trim() || null;

    if (!title || !fullContent) {
      return { success: false, error: 'Title and content are required.' };
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    let imageUrl: string | null = null;
    const thumbnailFile = formData.get('thumbnail') as File | null;

    if (thumbnailFile && thumbnailFile.size > 0) {
      const sanitizedName = thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `blog/${Date.now()}-${sanitizedName}`;
      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const r2Upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: thumbnailFile.type || 'application/octet-stream',
      });

      imageUrl = r2Upload.url;
    }

    const slug = slugify(title);

    // Build credits object from dynamic JSON array or fallback fields
    const credits = parseCreditsFromFormData(formData);

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        slug,
        title,
        category,
        date,
        excerpt,
        full_content: fullContent,
        image_url: imageUrl,
        highlight_quote: highlightQuote,
        quote_author: quoteAuthor,
        post_url: postUrl,
        tags,
        credits,
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase Insert Error]:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/management/blog');
    revalidatePath('/management/dashboard');

    return { success: true, data };
  } catch (err: unknown) {
    console.error('[Create Post Error]:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while saving post.',
    };
  }
}

/**
 * Server Action: Update an existing blog post
 */
export async function updateBlogPost(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const title = (formData.get('title') as string)?.trim();
    const category = (formData.get('category') as string)?.trim() || 'Official Advisory';
    const date = (formData.get('date') as string)?.trim() || new Date().toISOString().split('T')[0];
    const fullContent = (formData.get('fullContent') as string)?.trim();
    const rawExcerpt = (formData.get('excerpt') as string)?.trim();
    const excerpt =
      rawExcerpt ||
      (fullContent
        ? (fullContent.length > 160
            ? fullContent.slice(0, 157).replace(/[\r\n#*`>-]+/g, ' ').trim() + '...'
            : fullContent.replace(/[\r\n#*`>-]+/g, ' ').trim())
        : '');
    const highlightQuote = (formData.get('highlightQuote') as string)?.trim() || null;
    const quoteAuthor = (formData.get('quoteAuthor') as string)?.trim() || null;
    const postUrl = (formData.get('postUrl') as string)?.trim() || null;
    const tagsRaw = (formData.get('tags') as string)?.trim() || '';
    const creditWriter = (formData.get('creditWriter') as string)?.trim() || null;
    const creditPhotographer = (formData.get('creditPhotographer') as string)?.trim() || null;
    const creditPubmat = (formData.get('creditPubmat') as string)?.trim() || null;

    if (!id || !title || !fullContent) {
      return { success: false, error: 'Post ID, title, and content are required.' };
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    let imageUrl: string | undefined = undefined;
    const thumbnailFile = formData.get('thumbnail') as File | null;

    if (thumbnailFile && thumbnailFile.size > 0) {
      const sanitizedName = thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const r2Key = `blog/${Date.now()}-${sanitizedName}`;
      const arrayBuffer = await thumbnailFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const r2Upload = await uploadToR2({
        key: r2Key,
        body: buffer,
        contentType: thumbnailFile.type || 'application/octet-stream',
      });

      imageUrl = r2Upload.url;
    }

    // Build credits object from dynamic JSON array or fallback fields
    const credits = parseCreditsFromFormData(formData);

    const updatePayload: Record<string, any> = {
      title,
      category,
      date,
      excerpt,
      full_content: fullContent,
      highlight_quote: highlightQuote,
      quote_author: quoteAuthor,
      post_url: postUrl,
      tags,
      credits,
      updated_at: new Date().toISOString(),
    };

    if (imageUrl) {
      updatePayload.image_url = imageUrl;
    }

    const { data, error } = await supabaseAdmin
      .from('posts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/management/blog');
    revalidatePath('/management/dashboard');

    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update post.',
    };
  }
}

/**
 * Server Action: Delete a blog post
 * Removes the row from Supabase and cleans up thumbnail if applicable.
 */
export async function deleteBlogPost(id: string, imageUrl?: string | null): Promise<ActionResult> {
  try {
    if (imageUrl && imageUrl.includes('.r2.dev')) {
      const parsedUrl = new URL(imageUrl);
      const r2Key = parsedUrl.pathname.replace(/^\//, '');
      if (r2Key) {
        try {
          await deleteFromR2(r2Key);
        } catch (r2Err) {
          console.warn('[R2 Delete Warning]:', r2Err);
        }
      }
    }

    const { error } = await supabaseAdmin.from('posts').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/management/blog');
    revalidatePath('/management/dashboard');

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete post.',
    };
  }
}

/**
 * Server Action: Seed static dispatches into Supabase database if empty
 */
export async function seedInitialPosts(): Promise<ActionResult> {
  try {
    const { count } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      return { success: true, data: { message: 'Database already contains posts.' } };
    }

    const initialRows = socialDispatches.map((dispatch) => ({
      slug: slugify(dispatch.title),
      title: dispatch.title,
      category: dispatch.category,
      date: dispatch.date,
      excerpt: dispatch.excerpt,
      full_content: dispatch.fullContent,
      image_url: dispatch.imageUrl || null,
      highlight_quote: dispatch.highlightQuote || null,
      quote_author: dispatch.quoteAuthor || null,
      post_url: dispatch.postUrl || null,
      tags: dispatch.tags || [],
      credits: dispatch.credits || null,
    }));

    const { error } = await supabaseAdmin.from('posts').insert(initialRows);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/management/blog');

    return { success: true, data: { count: initialRows.length } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to seed initial posts.',
    };
  }
}

/**
 * Server Action: On-demand cleanup of posts older than specified days (default: 365)
 * Purges database rows and removes associated media from Cloudflare R2.
 */
export async function cleanupExpiredPosts(days = 365): Promise<ActionResult<{ purgedPosts: number; purgedMedia: number }>> {
  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    const thresholdIso = thresholdDate.toISOString();

    const { data: expired, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, image_url')
      .lt('created_at', thresholdIso);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!expired || expired.length === 0) {
      return { success: true, data: { purgedPosts: 0, purgedMedia: 0 } };
    }

    let purgedMedia = 0;
    const ids = expired.map((p) => p.id);

    for (const post of expired) {
      if (post.image_url && post.image_url.includes('.r2.dev')) {
        try {
          const parsed = new URL(post.image_url);
          const r2Key = parsed.pathname.replace(/^\//, '');
          if (r2Key) {
            await deleteFromR2(r2Key);
            purgedMedia++;
          }
        } catch (r2Err) {
          console.warn(`[Cleanup Action] Failed to delete R2 media:`, r2Err);
        }
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .in('id', ids);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/');
    revalidatePath('/management/blog');
    revalidatePath('/management/dashboard');

    return {
      success: true,
      data: { purgedPosts: ids.length, purgedMedia },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to execute cleanup.',
    };
  }
}
