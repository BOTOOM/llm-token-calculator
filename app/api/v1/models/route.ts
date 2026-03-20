import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { getModelPrices, PRICE_CACHE_MAX_AGE } from '@/lib/price-fetcher'
import { getClientIp, handleOptions, rateLimitedResponse, serverErrorResponse } from '@/lib/api-utils'

// ─── GET /api/v1/models ────────────────────────────────────────────────────────
// Lower limit: this is a heavier list endpoint
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(`models:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!rl.success) return rateLimitedResponse(rl)

  try {
    const sp       = request.nextUrl.searchParams
    const provider = sp.get('provider')?.toLowerCase()
    const hasCache = sp.get('hasCache') === 'true'
    const search   = sp.get('search')?.toLowerCase().slice(0, 80) // cap search length

    const { models: allModels } = await getModelPrices()
    let filtered = allModels

    if (provider) filtered = filtered.filter((p) => p.provider.toLowerCase() === provider)
    if (hasCache)  filtered = filtered.filter((p) => p.cachedInputPricePer1M !== undefined)
    if (search)    filtered = filtered.filter(
      (p) => p.model.toLowerCase().includes(search) || p.provider.toLowerCase().includes(search)
    )

    const providers = [...new Set(filtered.map((p) => p.provider))].sort()

    // Minimal payload — only fields consumers actually need
    const models = filtered.map((p) => ({
      id:       p.model,
      provider: p.provider,
      input:    p.inputPricePer1M,
      output:   p.outputPricePer1M,
      cached:   p.cachedInputPricePer1M ?? null,
      context:  p.contextWindow         ?? null,
    }))

    return NextResponse.json(
      { count: models.length, providers, models },
      {
        headers: {
          ...getRateLimitHeaders(rl),
          // Allow CDN / browser cache for 1 hour; serve stale for 2 hours while revalidating
          'Cache-Control': `public, s-maxage=${PRICE_CACHE_MAX_AGE}, stale-while-revalidate=${PRICE_CACHE_MAX_AGE * 2}`,
        },
      }
    )
  } catch {
    return serverErrorResponse(rl)
  }
}

// ─── OPTIONS — CORS preflight ──────────────────────────────────────────────────
export async function OPTIONS() {
  return handleOptions()
}
