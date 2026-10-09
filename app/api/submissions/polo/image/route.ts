import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/r2";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * GET /api/submissions/polo/image
 *
 * Same-origin reliable image proxy that streams polo design assets directly from R2
 * bypassing third-party CDN DNS blocks, rate limits, and Facebook in-app browser restrictions.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");
  const rawKey = searchParams.get("key");
  const submissionId = searchParams.get("id");

  let r2Key = rawKey;

  if (!r2Key && rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      r2Key = parsed.pathname.replace(/^\//, "");
    } catch {
      r2Key = rawUrl.replace(/^\//, "");
    }
  }

  // If key is still missing but submissionId is provided, query Supabase
  if (!r2Key && submissionId) {
    try {
      const { data } = await supabaseAdmin
        .from("polo_submissions")
        .select("file_key, file_url")
        .eq("id", submissionId)
        .maybeSingle();

      if (data?.file_key) {
        r2Key = data.file_key;
      } else if (data?.file_url) {
        try {
          r2Key = new URL(data.file_url).pathname.replace(/^\//, "");
        } catch {
          r2Key = data.file_url.replace(/^\//, "");
        }
      }
    } catch (e) {
      console.warn("Could not query submission file key:", e);
    }
  }

  // 1. Direct fetch from Cloudflare R2 via S3 SDK
  if (r2Key) {
    try {
      const s3Res = await getR2Object(r2Key);
      if (s3Res.Body) {
        // Node / Web Stream
        const stream = s3Res.Body.transformToWebStream();
        return new NextResponse(stream, {
          status: 200,
          headers: {
            "Content-Type": s3Res.ContentType || "image/webp",
            "Content-Length": s3Res.ContentLength ? String(s3Res.ContentLength) : "",
            "Cache-Control": "public, max-age=31536000, immutable",
            "CDN-Cache-Control": "public, max-age=31536000, immutable",
            "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`R2 S3 fetch failed for key ${r2Key}:`, msg);
    }
  }

  // 2. Fallback: Direct HTTP fetch if rawUrl was provided
  if (rawUrl) {
    try {
      const fetchRes = await fetch(rawUrl);
      if (fetchRes.ok) {
        const buffer = await fetchRes.arrayBuffer();
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": fetchRes.headers.get("content-type") || "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable",
            "CDN-Cache-Control": "public, max-age=31536000, immutable",
            "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch (fetchErr) {
      console.warn("Direct HTTP fetch fallback failed:", fetchErr);
    }
  }

  return new NextResponse("Image not found", { status: 404 });
}
