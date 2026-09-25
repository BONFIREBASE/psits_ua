import { NextRequest, NextResponse } from 'next/server'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const remoteIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1'

    // 1. Edge Rate Limiting via Upstash (with fail-open resilience)
    const rateLimit = await checkRateLimit(remoteIp, 'auth')
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many verification attempts. Please wait a few seconds before trying again.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      )
    }

    // 2. Validate request body
    const body = await req.json()
    const token = body?.token
    const action = body?.action

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Verification security token is required' },
        { status: 400 }
      )
    }

    // 3. Cloudflare Turnstile token validation
    const result = await verifyTurnstileToken(token, {
      remoteIp,
      expectedAction: action,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 403 })
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error('[Verification Challenge Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Security challenge verification service unavailable.',
      },
      { status: 500 }
    )
  }
}
