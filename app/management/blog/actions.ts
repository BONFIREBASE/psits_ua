'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';
import { socialDispatches } from '@/data/announcements';

/**
 * Sanitize string to prevent PostgreSQL "Unicode low surrogate must follow a high surrogate" (22P02)
 * and ensure 100% valid UTF-8 and valid JSON.
 */
function cleanUnicode(str: string | null | undefined): string | null {
  if (typeof str !== 'string') return null;
  const wellFormed = typeof str.toWellFormed === 'function' ? str.toWellFormed() : str;
  const sanitized = wellFormed.replace(/\u0000/g, '').trim();
  return sanitized || null;
}

function cleanUnicodeRequired(str: string | null | undefined, fallback = ''): string {
  const cleaned = cleanUnicode(str);
  return cleaned !== null ? cleaned : fallback;
}

function slugify(text: string): string {
  const safeText = cleanUnicode(text) || 'post';
  const base = safeText
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
            let key = item.role.trim().toLowerCase().replace(/[\s-]+/g, '_');
            if (key === 'published_by' || key === 'prepared_by' || key === 'preparedby') key = 'publish_by';
            const name = cleanUnicode(item.name);
            if (name) {
              credits[key] = credits[key] ? `${credits[key]}, ${name}` : name;
            }
          }
        });
      } else if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([k, v]) => {
          if (typeof v === 'string' && v.trim()) {
            let key = k.toLowerCase().replace(/[\s-]+/g, '_');
            if (key === 'published_by' || key === 'prepared_by' || key === 'preparedby') key = 'publish_by';
            const val = cleanUnicode(v);
            if (val) {
              credits[key] = credits[key] ? `${credits[key]}, ${val}` : val;
            }
          }
        });
      }
    } catch {
      // Fallback if not valid JSON
    }
  }

  const creditWriter = cleanUnicode(formData.get('creditWriter') as string);
  const creditPhotographer = cleanUnicode(formData.get('creditPhotographer') as string);
  const creditPubmat = cleanUnicode(formData.get('creditPubmat') as string);
  const creditPublishBy = cleanUnicode((formData.get('creditPublishBy') || formData.get('creditPreparedBy')) as string);

  if (creditWriter && !credits.writer) credits.writer = creditWriter;
  if (creditPhotographer && !credits.photographer) credits.photographer = creditPhotographer;
  if (creditPubmat && !credits.pubmat) credits.pubmat = creditPubmat;
  if (creditPublishBy && !credits.publish_by) credits.publish_by = creditPublishBy;

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
    const title = cleanUnicodeRequired(formData.get('title') as string);
    const category = cleanUnicodeRequired(formData.get('category') as string, 'Official Advisory');
    const date = cleanUnicodeRequired(formData.get('date') as string, new Date().toISOString().split('T')[0]);
    const fullContent = cleanUnicodeRequired(formData.get('fullContent') as string);
    const rawExcerpt = cleanUnicode(formData.get('excerpt') as string);
    
    // Auto-generate clean excerpt from full content (first 160 chars) if not explicitly provided.
    // Use code-point splitting (Array.from) to NEVER slice an emoji surrogate pair in half!
    let excerpt = rawExcerpt;
    if (!excerpt && fullContent) {
      const codePoints = Array.from(fullContent);
      const sliced = codePoints.length > 160
        ? codePoints.slice(0, 157).join('').replace(/[\r\n#*`>-]+/g, ' ').trim() + '...'
        : fullContent.replace(/[\r\n#*`>-]+/g, ' ').trim();
      excerpt = cleanUnicode(sliced) || '';
    }
    excerpt = excerpt || '';

    const highlightQuote = cleanUnicode(formData.get('highlightQuote') as string);
    const quoteAuthor = cleanUnicode(formData.get('quoteAuthor') as string);
    const postUrl = cleanUnicode(formData.get('postUrl') as string);
    const tagsRaw = cleanUnicode(formData.get('tags') as string) || '';

    if (!title || !fullContent) {
      return { success: false, error: 'Title and content are required.' };
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => cleanUnicode(t.trim())).filter((t): t is string => Boolean(t))
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

      imageUrl = cleanUnicode(r2Upload.url);
    }

    const slug = slugify(title);

    // Build credits object from dynamic JSON array or fallback fields
    const credits = parseCreditsFromFormData(formData);

    const postPayload = {
      slug: cleanUnicodeRequired(slug, `post-${Date.now().toString(36)}`),
      title: cleanUnicodeRequired(title),
      category: cleanUnicodeRequired(category, 'Official Advisory'),
      date: cleanUnicodeRequired(date, new Date().toISOString().split('T')[0]),
      excerpt: cleanUnicodeRequired(excerpt),
      full_content: cleanUnicodeRequired(fullContent),
      image_url: cleanUnicode(imageUrl),
      highlight_quote: cleanUnicode(highlightQuote),
      quote_author: cleanUnicode(quoteAuthor),
      post_url: cleanUnicode(postUrl),
      tags: tags,
      credits: credits && Object.keys(credits).length > 0 ? credits : null,
    };

    let postData: unknown = null;
    let postErrorMsg: string | null = null;

    // 1. Try Supabase Client insert
    const { data: insertedRows, error: insertError } = await supabaseAdmin
      .from('posts')
      .insert([postPayload])
      .select();

    if (!insertError && insertedRows && insertedRows.length > 0) {
      postData = insertedRows[0];
    } else {
      if (insertError) {
        console.warn('[Supabase Client Insert Failed, running direct REST fallback]:', insertError);
      }

      // 2. Guaranteed Direct REST Call with verified JSON headers
      const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcegaknsectohxpilrdp.supabase.co').replace(/\/$/, '');
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      try {
        const restRes = await fetch(`${supabaseUrl}/rest/v1/posts`, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(postPayload),
        });

        if (restRes.ok) {
          const rows = await restRes.json();
          postData = Array.isArray(rows) ? rows[0] : rows;
        } else {
          const errBody = await restRes.text();
          console.error('[Supabase Direct REST Error]:', restRes.status, errBody);
          postErrorMsg = insertError ? `${insertError.message} (${insertError.details || errBody})` : `Insert failed (${restRes.status}): ${errBody}`;
        }
      } catch (fetchErr) {
        console.error('[Supabase Direct REST Fetch Exception]:', fetchErr);
        postErrorMsg = fetchErr instanceof Error ? fetchErr.message : 'Database network error';
      }
    }

    if (!postData) {
      return { success: false, error: postErrorMsg || 'Failed to save post to database.' };
    }

    revalidatePath('/');
    revalidatePath('/management/blog');
    revalidatePath('/management/dashboard');

    return { success: true, data: postData };
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
    const title = cleanUnicodeRequired(formData.get('title') as string);
    const category = cleanUnicodeRequired(formData.get('category') as string, 'Official Advisory');
    const date = cleanUnicodeRequired(formData.get('date') as string, new Date().toISOString().split('T')[0]);
    const fullContent = cleanUnicodeRequired(formData.get('fullContent') as string);
    const rawExcerpt = cleanUnicode(formData.get('excerpt') as string);
    
    let excerpt = rawExcerpt;
    if (!excerpt && fullContent) {
      const codePoints = Array.from(fullContent);
      const sliced = codePoints.length > 160
        ? codePoints.slice(0, 157).join('').replace(/[\r\n#*`>-]+/g, ' ').trim() + '...'
        : fullContent.replace(/[\r\n#*`>-]+/g, ' ').trim();
      excerpt = cleanUnicode(sliced) || '';
    }
    excerpt = excerpt || '';

    const highlightQuote = cleanUnicode(formData.get('highlightQuote') as string);
    const quoteAuthor = cleanUnicode(formData.get('quoteAuthor') as string);
    const postUrl = cleanUnicode(formData.get('postUrl') as string);
    const tagsRaw = cleanUnicode(formData.get('tags') as string) || '';

    if (!id || !title || !fullContent) {
      return { success: false, error: 'Post ID, title, and content are required.' };
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => cleanUnicode(t.trim())).filter((t): t is string => Boolean(t))
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

      imageUrl = cleanUnicode(r2Upload.url) || undefined;
    }

    // Build credits object from dynamic JSON array or fallback fields
    const credits = parseCreditsFromFormData(formData);

    const updatePayload: Record<string, unknown> = {
      title,
      category,
      date,
      excerpt,
      full_content: fullContent,
      highlight_quote: highlightQuote,
      quote_author: quoteAuthor,
      post_url: postUrl,
      tags,
      credits: credits && Object.keys(credits).length > 0 ? credits : null,
      updated_at: new Date().toISOString(),
    };

    if (imageUrl) {
      updatePayload.image_url = imageUrl;
    }

    let updatedData: unknown = null;
    let updateErrorMsg: string | null = null;

    const { data, error } = await supabaseAdmin
      .from('posts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (!error && data) {
      updatedData = data;
    } else {
      if (error) {
        console.warn('[Supabase Client Update Failed, running direct REST fallback]:', error);
      }

      // Direct REST PATCH fallback
      const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tcegaknsectohxpilrdp.supabase.co').replace(/\/$/, '');
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      try {
        const restRes = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updatePayload),
        });

        if (restRes.ok) {
          const rows = await restRes.json();
          updatedData = Array.isArray(rows) ? rows[0] : rows;
        } else {
          const errText = await restRes.text();
          console.error('[Supabase Direct REST Patch Error]:', restRes.status, errText);
          updateErrorMsg = error ? `${error.message} (${error.details || errText})` : `Update failed (${restRes.status}): ${errText}`;
        }
      } catch (fetchErr) {
        console.error('[Supabase Direct REST Patch Exception]:', fetchErr);
        updateErrorMsg = fetchErr instanceof Error ? fetchErr.message : 'Database network error';
      }
    }

    if (!updatedData) {
      return {
        success: false,
        error: updateErrorMsg || 'Post record not found in database. If this is a static dispatch, please seed initial posts to the database first.',
      };
    }

    revalidatePath('/');
    revalidatePath('/management/blog');
    revalidatePath('/management/dashboard');

    return { success: true, data: updatedData };
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
