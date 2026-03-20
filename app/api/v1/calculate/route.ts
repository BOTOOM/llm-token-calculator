import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { getModelPrices } from '@/lib/price-fetcher'
import {
  getClientIp,
  handleOptions,
  parseBody,
  rateLimitedResponse,
  serverErrorResponse,
} from '@/lib/api-utils'

// ─── Zod schema ────────────────────────────────────────────────────────────────
const CalculateSchema = z.object({
  model: z
    .string({ required_error: 'model is required' })
    .min(1)
    .max(120)
    .trim(),
  inputTokens: z
    .number({ required_error: 'inputTokens is required' })
    .int()
    .nonnegative()
    .max(10_000_000),
  outputTokens: z
    .number({ required_error: 'outputTokens is required' })
    .int()
    .nonnegative()
    .max(10_000_000),
  cachedTokens: z.number().int().nonnegative().max(10_000_000).optional().default(0),
})

type CalculateInput = z.infer<typeof CalculateSchema>

// ─── Shared response builder ────────────────────────────────────────────────────
function buildResponse(input: CalculateInput, model: Awaited<ReturnType<typeof getModelPrices>>[0]) {
  const { inputTokens, outputTokens, cachedTokens = 0 } = input
  const effectiveInput = Math.max(0, inputTokens - cachedTokens)

  const inputCost  = (effectiveInput  / 1_000_000) * model.inputPricePer1M
  const outputCost = (outputTokens    / 1_000_000) * model.outputPricePer1M
  const cachedCost = model.cachedInputPricePer1M
    ? (cachedTokens / 1_000_000) * model.cachedInputPricePer1M
    : 0

  return {
    model:   model.model,
    provider: model.provider,
    inputTokens,
    outputTokens,
    cachedTokens,
    costs: {
      input:  +inputCost.toFixed(8),
      output: +outputCost.toFixed(8),
      cached: +cachedCost.toFixed(8),
      total:  +(inputCost + outputCost + cachedCost).toFixed(8),
    },
    prices: {
      inputPer1M:  model.inputPricePer1M,
      outputPer1M: model.outputPricePer1M,
      cachedPer1M: model.cachedInputPricePer1M ?? null,
    },
  }
}

// ─── Core logic (shared by POST and GET) ───────────────────────────────────────
async function handleCalculate(input: CalculateInput, rlResult: Awaited<ReturnType<typeof rateLimit>>) {
  const prices  = await getModelPrices()
  const query   = input.model.toLowerCase()
  const modelData = prices.find(
    (p) => p.model.toLowerCase() === query || p.displayName.toLowerCase() === query
  )

  if (!modelData) {
    return NextResponse.json(
      {
        error: 'Model not found',
        message: `"${input.model}" not found. Use GET /api/v1/models to list available models.`,
      },
      { status: 404, headers: getRateLimitHeaders(rlResult) }
    )
  }

  return NextResponse.json(buildResponse(input, modelData), {
    headers: { ...getRateLimitHeaders(rlResult), 'Cache-Control': 'no-store' },
  })
}

// ─── POST /api/v1/calculate ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(`calc:${ip}`, { limit: 100, windowMs: 60_000 })
  if (!rl.success) return rateLimitedResponse(rl)

  const [data, err] = await parseBody(request, CalculateSchema, rl)
  if (err) return err

  try {
    return await handleCalculate(data!, rl)
  } catch {
    return serverErrorResponse(rl)
  }
}

// ─── GET /api/v1/calculate?model=gpt-4o&input=1000&output=500&cached=200 ───────
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(`calc:${ip}`, { limit: 100, windowMs: 60_000 })
  if (!rl.success) return rateLimitedResponse(rl)

  const sp = request.nextUrl.searchParams
  const parsed = CalculateSchema.safeParse({
    model:        sp.get('model') ?? '',
    inputTokens:  Number(sp.get('input')  ?? 0),
    outputTokens: Number(sp.get('output') ?? 0),
    cachedTokens: Number(sp.get('cached') ?? 0),
  })

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    return NextResponse.json(
      { error: 'Validation failed', issues },
      { status: 422, headers: getRateLimitHeaders(rl) }
    )
  }

  try {
    return await handleCalculate(parsed.data, rl)
  } catch {
    return serverErrorResponse(rl)
  }
}

// ─── OPTIONS /api/v1/calculate — CORS preflight ────────────────────────────────
export async function OPTIONS() {
  return handleOptions()
}
