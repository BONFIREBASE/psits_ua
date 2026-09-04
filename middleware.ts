import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// In-memory sliding window rate limiter
// Map structure: ip -> array of request timestamps (ms)
const ipRequestMap = new Map<string, number[]>()

// Rate limit settings: 45 requests per 10-second window
const WINDOW_MS = 10 * 1000
const MAX_REQUESTS = 45

// Periodic cleanup to avoid memory leak: purge IPs inactive for > 1 minute
setInterval(() => {
  const now = Date.now()
  for (const [ip, timestamps] of ipRequestMap.entries()) {
    const valid = timestamps.filter((t) => now - t < WINDOW_MS)
    if (valid.length === 0) {
      ipRequestMap.delete(ip)
    } else {
      ipRequestMap.set(ip, valid)
    }
  }
}, 60 * 1000)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Never rate-limit static assets or the 429 page itself
  if (
    pathname === '/429' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // Extract client IP (Vercel, Cloudflare, Nginx reverse proxy, or local fallback)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '127.0.0.1'

  const now = Date.now()
  const timestamps = ipRequestMap.get(ip) || []

  // Filter out timestamps outside the active window
  const recentTimestamps = timestamps.filter((t) => now - t < WINDOW_MS)

  if (recentTimestamps.length >= MAX_REQUESTS) {
    // Rate limit exceeded: Rewrite request to /429 with HTTP 429 status code
    return NextResponse.rewrite(new URL('/429', request.url), {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {
        'Retry-After': '10',
        'X-RateLimit-Limit': String(MAX_REQUESTS),
        'X-RateLimit-Remaining': '0',
      },
    })
  }

  // Record current request timestamp
  recentTimestamps.push(now)
  ipRequestMap.set(ip, recentTimestamps)

  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS))
  response.headers.set(
    'X-RateLimit-Remaining',
    String(Math.max(0, MAX_REQUESTS - recentTimestamps.length))
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|assets|favicon.ico).*)',
  ],
}
