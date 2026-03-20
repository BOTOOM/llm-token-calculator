// In-memory rate limiter (fixed window, 100 req/min per IP by default).
// Works per serverless instance. For distributed rate limiting across
// multiple Vercel edge instances, swap this store for Upstash Redis.

interface RateLimitEntry {
  count:   number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Purge expired entries every 60 s to prevent unbounded memory growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 60_000)
}

export interface RateLimitConfig {
  /** Max requests allowed per window */
  limit:    number
  /** Window length in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success:   boolean
  limit:     number
  remaining: number
  reset:     number // Unix timestamp (ms) when the window resets
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, windowMs: 60_000 }
): RateLimitResult {
  const now = Date.now()
  let entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + config.windowMs }
    store.set(identifier, entry)
    return { success: true, limit: config.limit, remaining: config.limit - 1, reset: entry.resetAt }
  }

  if (entry.count >= config.limit) {
    return { success: false, limit: config.limit, remaining: 0, reset: entry.resetAt }
  }

  entry.count++
  return {
    success:   true,
    limit:     config.limit,
    remaining: config.limit - entry.count,
    reset:     entry.resetAt,
  }
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit':     result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset':     result.reset.toString(),
    'X-RateLimit-Policy':    `${result.limit};w=60`,
  }
}
