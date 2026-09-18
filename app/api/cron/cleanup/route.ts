import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { deleteFromR2 } from '@/lib/r2';
import { checkRateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

/**
 * Automated Cron Cleanup Endpoint
 * Deletes blog dispatches older than 365 days and purges their Cloudflare R2 images.
 */
export async function GET(request: Request) {
  try {
    // 1. Edge Rate Limiting via Upstash (Fail-open)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const remoteIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const rateLimit = await checkRateLimit(remoteIp, 'cron');
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many cleanup requests. Please try again later.' },
        { status: 429 }
      );
    }

    // 2. Verify CRON Authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid cron authorization token.' },
        { status: 401 }
      );
    }

    // 2. Calculate threshold date (365 days ago)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - 365);
    const thresholdIso = thresholdDate.toISOString();

    // 3. Find expired posts
    const { data: expiredPosts, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, title, image_url, created_at')
      .lt('created_at', thresholdIso);

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    if (!expiredPosts || expiredPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts older than 365 days found. Storage is clean.',
        purgedCount: 0,
        mediaDeleted: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // 4. Delete R2 images for expired posts
    let mediaDeletedCount = 0;
    const postIdsToDelete: string[] = [];

    for (const post of expiredPosts) {
      postIdsToDelete.push(post.id);

      if (post.image_url && post.image_url.includes('.r2.dev')) {
        try {
          const parsed = new URL(post.image_url);
          const r2Key = parsed.pathname.replace(/^\//, '');
          if (r2Key) {
            await deleteFromR2(r2Key);
            mediaDeletedCount++;
          }
        } catch (r2Err) {
          console.warn(`[Cron Cleanup] Failed to delete R2 media for post ${post.id}:`, r2Err);
        }
      }
    }

    // 5. Delete database records
    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .in('id', postIdsToDelete);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    // 6. Revalidate cache
    revalidatePath('/');
    revalidatePath('/management/blog');
    revalidatePath('/management/dashboard');

    return NextResponse.json({
      success: true,
      message: `Successfully purged ${postIdsToDelete.length} expired posts and ${mediaDeletedCount} R2 images.`,
      purgedPostsCount: postIdsToDelete.length,
      purgedMediaCount: mediaDeletedCount,
      thresholdDate: thresholdIso,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[Cron Cleanup Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal Server Error during cleanup.',
      },
      { status: 500 }
    );
  }
}
