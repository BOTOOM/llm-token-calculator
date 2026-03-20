import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit'

// Max body size: 1 KB — all our endpoints only need a handful of numbers/strings
const MAX_BODY_BYTES = 1_024

/**
 * Extracts a trusted IP from the request.
 * Prefers Vercel's x-vercel-forwarded-for (set by the platform, not spoofable)
 * then falls back to the first entry of x-forwarded-for.
 * Never trusts the raw socket address directly.
 */
export function getClientIp(request: NextRequest): string {
  // Vercel sets this — not manipulable by the client
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp.split(',')[0].trim()

  // Standard proxy header — take only the first (leftmost) address
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  return request.headers.get('x-real-ip') || 'anonymous'
}

/**
 * Handles CORS preflight for the public API.
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

/**
 * Parses and validates the request body with a size cap.
 * Returns [data, errorResponse]. If errorResponse is set, return it immediately.
 */
export async function parseBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
  rlResult: RateLimitResult
): Promise<[T | null, NextResponse | null]> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return [
      null,
      NextResponse.json(
        { error: 'Payload too large', message: `Request body must be under ${MAX_BODY_BYTES} bytes` },
        { status: 413, headers: getRateLimitHeaders(rlResult) }
      ),
    ]
  }

  let raw: unknown
  try {
    const text = await request.text()
    if (text.length > MAX_BODY_BYTES) {
      return [
        null,
        NextResponse.json(
          { error: 'Payload too large', message: `Request body must be under ${MAX_BODY_BYTES} bytes` },
          { status: 413, headers: getRateLimitHeaders(rlResult) }
        ),
      ]
    }
    raw = JSON.parse(text)
  } catch {
    return [
      null,
      NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400, headers: getRateLimitHeaders(rlResult) }
      ),
    ]
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }))
    return [
      null,
      NextResponse.json(
        { error: 'Validation failed', issues },
        { status: 422, headers: getRateLimitHeaders(rlResult) }
      ),
    ]
  }

  return [result.data, null]
}

/**
 * Standard 429 response with Retry-After header.
 */
export function rateLimitedResponse(rlResult: RateLimitResult): NextResponse {
  const retryAfter = Math.ceil((rlResult.reset - Date.now()) / 1000)
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        ...getRateLimitHeaders(rlResult),
        'Retry-After': retryAfter.toString(),
      },
    }
  )
}

/**
 * Standard 500 response — never leaks internal details to the client.
 */
export function serverErrorResponse(rlResult?: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: 'Internal server error', message: 'An unexpected error occurred.' },
    {
      status: 500,
      headers: rlResult ? getRateLimitHeaders(rlResult) : {},
    }
  )
}
