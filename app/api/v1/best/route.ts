import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { getModelPrices } from '@/lib/price-fetcher'
import type { ModelPrice } from '@/lib/types'
import {
  getClientIp,
  handleOptions,
  parseBody,
  rateLimitedResponse,
  serverErrorResponse,
} from '@/lib/api-utils'

// ─── Zod schema ────────────────────────────────────────────────────────────────
const BestSchema = z.object({
  inputTokens:  z.number().int().nonnegative().max(10_000_000),
  outputTokens: z.number().int().nonnegative().max(10_000_000),
  cachedTokens: z.number().int().nonnegative().max(10_000_000).optional().default(0),
  filters: z
    .object({
      providers:    z.array(z.string().max(60)).max(20).optional(),
      minContext:   z.number().int().nonnegative().optional(),
      capabilities: z
        .array(z.enum(['vision', 'functions', 'reasoning', 'streaming', 'json']))
        .max(5)
        .optional(),
    })
    .optional()
    .default({}),
})

type BestInput = z.infer<typeof BestSchema>

// ─── Helpers ───────────────────────────────────────────────────────────────────
function calcCost(m: ModelPrice, input: number, output: number, cached: number): number {
  const effectiveInput = Math.max(0, input - cached)
  return (
    (effectiveInput / 1_000_000) * m.inputPricePer1M +
    (output         / 1_000_000) * m.outputPricePer1M +
    (m.cachedInputPricePer1M ? (cached / 1_000_000) * m.cachedInputPricePer1M : 0)
  )
}

// ─── Core logic ────────────────────────────────────────────────────────────────
async function handleBest(input: BestInput, rl: Awaited<ReturnType<typeof rateLimit>>) {
  const { inputTokens, outputTokens, cachedTokens = 0, filters = {} } = input

  const { models } = await getModelPrices()
  let filtered = models

  if (filters.providers?.length) {
    const lp = filters.providers.map((p) => p.toLowerCase())
    filtered = filtered.filter((p) => lp.includes(p.provider.toLowerCase()))
  }
  if (filters.minContext) {
    filtered = filtered.filter((p) => (p.contextWindow ?? 0) >= filters.minContext!)
  }
  if (filters.capabilities?.length) {
    filtered = filtered.filter((p) =>
      filters.capabilities!.every((cap) => {
        if (cap === 'vision')    return p.supportsVision
        if (cap === 'functions') return p.supportsFunctionCalling
        if (cap === 'reasoning') return p.isReasoning
        if (cap === 'streaming') return p.supportsStreaming
        if (cap === 'json')      return p.supportsJSON
        return true
      })
    )
  }

  if (filtered.length === 0) {
    return NextResponse.json(
      { error: 'No models found', message: 'No models match the specified filters.' },
      { status: 404, headers: getRateLimitHeaders(rl) }
    )
  }

  const ranked = filtered
    .map((m) => ({ m, cost: calcCost(m, inputTokens, outputTokens, cachedTokens) }))
    .sort((a, b) => a.cost - b.cost)

  const { m: best, cost: bestCost } = ranked[0]
  const effectiveInput = Math.max(0, inputTokens - cachedTokens)

  return NextResponse.json(
    {
      recommendation: {
        model:    best.model,
        provider: best.provider,
        costs: {
          input:  +((effectiveInput / 1_000_000) * best.inputPricePer1M).toFixed(8),
          output: +((outputTokens   / 1_000_000) * best.outputPricePer1M).toFixed(8),
          cached: +(best.cachedInputPricePer1M
            ? (cachedTokens / 1_000_000) * best.cachedInputPricePer1M
            : 0).toFixed(8),
          total:  +bestCost.toFixed(8),
        },
        prices: {
          inputPer1M:  best.inputPricePer1M,
          outputPer1M: best.outputPricePer1M,
          cachedPer1M: best.cachedInputPricePer1M ?? null,
        },
        contextWindow: best.contextWindow ?? null,
        capabilities: {
          vision:    best.supportsVision            ?? false,
          functions: best.supportsFunctionCalling   ?? false,
          reasoning: best.isReasoning               ?? false,
        },
      },
      alternatives: ranked.slice(1, 6).map(({ m, cost }) => ({
        model:     m.model,
        provider:  m.provider,
        totalCost: +cost.toFixed(8),
        extraCost: +(cost - bestCost).toFixed(8),
      })),
      meta: { inputTokens, outputTokens, cachedTokens, filters },
    },
    { headers: { ...getRateLimitHeaders(rl), 'Cache-Control': 'no-store' } }
  )
}

// ─── POST /api/v1/best ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(`best:${ip}`, { limit: 100, windowMs: 60_000 })
  if (!rl.success) return rateLimitedResponse(rl)

  const [data, err] = await parseBody(request, BestSchema, rl)
  if (err) return err

  try {
    return await handleBest(data!, rl)
  } catch {
    return serverErrorResponse(rl)
  }
}

// ─── GET /api/v1/best?input=1000&output=500&cached=200&providers=openai,anthropic ──
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(`best:${ip}`, { limit: 100, windowMs: 60_000 })
  if (!rl.success) return rateLimitedResponse(rl)

  const sp = request.nextUrl.searchParams
  const parsed = BestSchema.safeParse({
    inputTokens:  Number(sp.get('input')  ?? 0),
    outputTokens: Number(sp.get('output') ?? 0),
    cachedTokens: Number(sp.get('cached') ?? 0),
    filters: {
      providers:    sp.get('providers')?.split(',').filter(Boolean),
      minContext:   sp.get('minContext') ? Number(sp.get('minContext')) : undefined,
      capabilities: sp.get('capabilities')?.split(',').filter(Boolean),
    },
  })

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    return NextResponse.json(
      { error: 'Validation failed', issues },
      { status: 422, headers: getRateLimitHeaders(rl) }
    )
  }

  try {
    return await handleBest(parsed.data, rl)
  } catch {
    return serverErrorResponse(rl)
  }
}

// ─── OPTIONS — CORS preflight ──────────────────────────────────────────────────
export async function OPTIONS() {
  return handleOptions()
}
