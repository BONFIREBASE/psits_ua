import { NextRequest, NextResponse } from 'next/server'
import { redis, isUpstashConfigured } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

const BASE_VIEWS = 2194
let localViews = BASE_VIEWS
const localActiveVisitors = new Map<string, number>()
const localSeenIps = new Map<string, number>()

function isLocalhostRequest(req: NextRequest, clientIp: string): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const host = req.headers.get('host') || ''
  if (host.includes('localhost') || host.includes('127.0.0.1')) return true
  if (
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === 'localhost' ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('10.')
  ) {
    return true
  }
  return false
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const isHeartbeat = searchParams.get('heartbeat') === '1'
  const isSync = searchParams.get('sync') === '1'

  // Extract client IP address from headers (reverse proxy / Vercel edge aware)
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || realIp || '127.0.0.1'

  const isLocalhost = isLocalhostRequest(req, clientIp)
  const now = Date.now()
  let totalViews = BASE_VIEWS
  let activeNow = 1

  if (isUpstashConfigured && redis) {
    try {
      if (isSync) {
        await redis.set('psits:analytics:page_views', BASE_VIEWS)
        totalViews = BASE_VIEWS
      } else {
        const current = await redis.get<number>('psits:analytics:page_views')
        const currentNum = current ? Number(current) : 0

        // Auto-recalibrate if legacy placeholder (3840+) was present or was incremented by localhost test (2195)
        if (currentNum > 3500 || currentNum === 2195 || currentNum < BASE_VIEWS) {
          await redis.set('psits:analytics:page_views', BASE_VIEWS)
          totalViews = BASE_VIEWS
        } else {
          totalViews = currentNum
        }

        // Strictly exclude localhost, development environments, and heartbeats from incrementing page views
        if (!isHeartbeat && !isLocalhost) {
          // Track unique IP visits with a 15-minute deduplication window in Redis
          const isNewVisit = await redis.set(`psits:analytics:ip_seen:${clientIp}`, '1', {
            nx: true,
            ex: 900, // 15 mins
          })

          if (isNewVisit) {
            totalViews = await redis.incr('psits:analytics:page_views')
          }
        }
      }

      // Track active visitors by unique IP in a 60-second window (exclude localhost from polluting production active set)
      if (!isLocalhost) {
        await redis.zadd('psits:analytics:active_users', { score: now, member: clientIp })
      }
      await redis.zremrangebyscore('psits:analytics:active_users', 0, now - 60000)
      activeNow = await redis.zcard('psits:analytics:active_users')
      if (activeNow < 1) activeNow = 1
    } catch (err) {
      console.warn('[Analytics Views Redis Warning]:', err)
      if (!isHeartbeat && !isLocalhost) {
        const lastSeen = localSeenIps.get(clientIp) || 0
        if (now - lastSeen > 900000) {
          localViews++
          localSeenIps.set(clientIp, now)
        }
      }
      totalViews = localViews
      activeNow = Math.max(1, localActiveVisitors.size)
    }
  } else {
    // In-memory fallback
    if (!isHeartbeat && !isLocalhost) {
      const lastSeen = localSeenIps.get(clientIp) || 0
      if (now - lastSeen > 900000) {
        localViews++
        localSeenIps.set(clientIp, now)
      }
    }
    if (!isLocalhost) {
      localActiveVisitors.set(clientIp, now)
    }
    for (const [ip, ts] of localActiveVisitors.entries()) {
      if (now - ts > 60000) localActiveVisitors.delete(ip)
    }
    totalViews = localViews
    activeNow = Math.max(1, localActiveVisitors.size)
  }

  return NextResponse.json({
    totalViews,
    activeNow,
    ip: clientIp,
    isLocalhost,
  })
}
