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
export let redis: Redis | null = null
let authRateLimiter: Ratelimit | null = null
let cronRateLimiter: Ratelimit | null = null
let voteRateLimiter: Ratelimit | null = null
let duesRateLimiter: Ratelimit | null = null

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

    // Dues & student registry mutations: 30 requests per 10 seconds per operator
    duesRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '10 s'),
      prefix: 'psits:rl:dues',
      analytics: true,
    })
  } catch (err) {
    console.warn('[Upstash Redis Init Warning]:', err)
    redis = null
  }
}

export async function checkRateLimit(
  identifier: string = 'anonymous',
  type: 'auth' | 'cron' | 'vote' | 'dues' = 'auth'
): Promise<RateLimitResult> {
  const limiter =
    type === 'auth'
      ? authRateLimiter
      : type === 'cron'
      ? cronRateLimiter
      : type === 'vote'
      ? voteRateLimiter
      : duesRateLimiter

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

/**
 * Get cached data from Upstash Redis (returns null if unconfigured or missing)
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    return await redis.get<T>(key)
  } catch (err) {
    console.warn('[Upstash Redis Get Cache Warning]:', err)
    return null
  }
}

/**
 * Cache data in Upstash Redis with a TTL in seconds (default: 300s / 5 mins)
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  if (!redis) return
  try {
    await redis.set(key, value, { ex: ttlSeconds })
  } catch (err) {
    console.warn('[Upstash Redis Set Cache Warning]:', err)
  }
}

/**
 * Invalidate/delete cache keys from Upstash Redis
 */
export async function deleteCache(key: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(key)
  } catch (err) {
    console.warn('[Upstash Redis Del Cache Warning]:', err)
  }
}

/**
 * Invalidate cache keys by pattern prefix using Redis SCAN/KEYS
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!redis) return
  try {
    const keys = await redis.keys(pattern)
    if (keys && keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (err) {
    console.warn('[Upstash Redis Del Pattern Warning]:', err)
  }
}

/**
 * Invalidate all student registry, dues summary, and student stats caches
 */
export async function invalidateStudentCaches(): Promise<void> {
  if (!redis) return
  try {
    await Promise.all([
      deleteCache('psits:cache:student_stats'),
      deleteCachePattern('psits:cache:registry:*'),
      deleteCachePattern('psits:cache:dues_summary:*'),
      deleteCachePattern('psits:cache:dues_students:*'),
    ])
  } catch (err) {
    console.warn('[Upstash Invalidate Student Caches Warning]:', err)
  }
}


