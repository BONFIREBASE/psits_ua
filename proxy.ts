import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ipRequestMap = new Map<string, number[]>()

const WINDOW_MS = 10 * 1000
const MAX_REQUESTS = 45

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

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

  // Redirect accidental trailing punctuation appended by social media post auto-linkers (e.g., /submission. or /submission,)
  if (/[.,;:!]+$/.test(pathname)) {
    const cleanPath = pathname.replace(/[.,;:!]+$/, '')
    const url = request.nextUrl.clone()
    url.pathname = cleanPath
    return NextResponse.redirect(url, 308)
  }

  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '127.0.0.1'

  const now = Date.now()
  const timestamps = ipRequestMap.get(ip) || []

  const recentTimestamps = timestamps.filter((t) => now - t < WINDOW_MS)

  if (recentTimestamps.length >= MAX_REQUESTS) {
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
    '/((?!_next/static|_next/image|assets|favicon.ico).*)',
  ],
}
