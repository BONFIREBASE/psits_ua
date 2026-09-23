import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// 1. Check for Upstash Redis configuration
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

export const isUpstashConfigured = Boolean(redisUrl && redisToken)

// 2. Initialize Redis client conditionally
let redis: Redis | null = null
let authRateLimiter: Ratelimit | null = null
let cronRateLimiter: Ratelimit | null = null
let voteRateLimiter: Ratelimit | null = null

if (isUpstashConfigured && redisUrl && redisToken) {
  try {
    redis = new Redis({
      url: redisUrl,
      token: redisToken,
    })

    // Auth & login endpoints: 10 requests per 10 seconds per IP
    authRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      prefix: 'psits:rl:auth',
      analytics: true,
    })

    // Cron & cleanup endpoints: 5 requests per 60 seconds per IP
    cronRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      prefix: 'psits:rl:cron',
      analytics: true,
    })

    // Student voting endpoints: 10 requests per 30 seconds per student email
    voteRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '30 s'),
      prefix: 'psits:rl:vote',
      analytics: true,
    })
  } catch (err) {
    console.warn('[Upstash Redis Init Warning]:', err)
    redis = null
  }
}


export async function checkRateLimit(
  identifier: string = 'anonymous',
  type: 'auth' | 'cron' | 'vote' = 'auth'
): Promise<RateLimitResult> {
  const limiter =
    type === 'auth'
      ? authRateLimiter
      : type === 'cron'
      ? cronRateLimiter
      : voteRateLimiter


  if (!limiter) {
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: 0,
    }
  }

  try {
    const result = await limiter.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (err) {
    // Fail-open on network or Upstash service interruptions
    console.warn('[RateLimit Evaluation Warning]:', err)
    return {
      success: true,
      limit: 999,
      remaining: 1,
      reset: 0,
    }
  }
}
