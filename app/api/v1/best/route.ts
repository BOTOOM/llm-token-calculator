import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { fallbackModelPrices } from '@/lib/model-prices'
import type { ModelPrice } from '@/lib/types'

// Cache for model prices (shared with calculate endpoint via module cache)
let cachedPrices: ModelPrice[] | null = null
let cacheTime = 0
const CACHE_TTL = 3600000 // 1 hour

async function getModelPrices(): Promise<ModelPrice[]> {
  const now = Date.now()
  
  if (cachedPrices && (now - cacheTime) < CACHE_TTL) {
    return cachedPrices
  }
  
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json',
      { next: { revalidate: 3600 } }
    )
    
    if (!response.ok) throw new Error('Failed to fetch')
    
    const data = await response.json()
    
    const prices: ModelPrice[] = []
    for (const [modelId, modelData] of Object.entries(data)) {
      if (modelId === 'sample_spec') continue
      const d = modelData as Record<string, unknown>
      
      const inputCost = (d.input_cost_per_token as number) || 0
      const outputCost = (d.output_cost_per_token as number) || 0
      const cacheCost = (d.cache_read_input_token_cost as number) || undefined
      
      if (inputCost === 0 && outputCost === 0) continue
      
      const cleanId = modelId.replace(/^(openai\/|anthropic\/|vertex_ai\/|bedrock\/|groq\/)/, '')
      
      prices.push({
        provider: (d.litellm_provider as string) || 'unknown',
        model: cleanId,
        displayName: cleanId,
        inputPricePer1M: inputCost * 1_000_000,
        outputPricePer1M: outputCost * 1_000_000,
        cachedInputPricePer1M: cacheCost ? cacheCost * 1_000_000 : undefined,
        contextWindow: (d.max_input_tokens as number) || (d.max_tokens as number),
        maxOutputTokens: d.max_output_tokens as number,
        supportsVision: d.supports_vision as boolean,
        supportsFunctionCalling: d.supports_function_calling as boolean,
        isReasoning: (d.supports_reasoning as boolean) || modelId.includes('o1') || modelId.includes('o3'),
      })
    }
    
    cachedPrices = prices
    cacheTime = now
    return prices
  } catch {
    return fallbackModelPrices
  }
}

function calculateCost(
  inputTokens: number,
  outputTokens: number,
  cachedTokens: number,
  model: ModelPrice
): number {
  const effectiveInput = Math.max(0, inputTokens - cachedTokens)
  const inputCost = (effectiveInput / 1_000_000) * model.inputPricePer1M
  const outputCost = (outputTokens / 1_000_000) * model.outputPricePer1M
  const cachedCost = model.cachedInputPricePer1M 
    ? (cachedTokens / 1_000_000) * model.cachedInputPricePer1M
    : 0
  return inputCost + outputCost + cachedCost
}

interface BestRequest {
  inputTokens: number
  outputTokens: number
  cachedTokens?: number
  filters?: {
    providers?: string[]
    minContext?: number
    capabilities?: string[]
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous'
  
  const rateLimitResult = rateLimit(`best:${ip}`, { limit: 100, windowMs: 60000 })
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }
  
  try {
    const body: BestRequest = await request.json()
    
    if (typeof body.inputTokens !== 'number' || body.inputTokens < 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'inputTokens must be a non-negative number' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }
    
    if (typeof body.outputTokens !== 'number' || body.outputTokens < 0) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'outputTokens must be a non-negative number' },
        { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }
    
    const cachedTokens = body.cachedTokens || 0
    const filters = body.filters || {}
    
    let prices = await getModelPrices()
    
    // Apply filters
    if (filters.providers?.length) {
      const lowerProviders = filters.providers.map(p => p.toLowerCase())
      prices = prices.filter(p => lowerProviders.includes(p.provider.toLowerCase()))
    }
    
    if (filters.minContext) {
      prices = prices.filter(p => (p.contextWindow || 0) >= filters.minContext!)
    }
    
    if (filters.capabilities?.length) {
      prices = prices.filter(p => {
        return filters.capabilities!.every(cap => {
          switch (cap) {
            case 'vision': return p.supportsVision
            case 'functions': return p.supportsFunctionCalling
            case 'reasoning': return p.isReasoning
            default: return true
          }
        })
      })
    }
    
    if (prices.length === 0) {
      return NextResponse.json(
        { error: 'No models found', message: 'No models match the specified filters' },
        { status: 404, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }
    
    // Find best model
    const modelsWithCosts = prices.map(model => ({
      model,
      cost: calculateCost(body.inputTokens, body.outputTokens, cachedTokens, model)
    }))
    
    modelsWithCosts.sort((a, b) => a.cost - b.cost)
    
    const best = modelsWithCosts[0]
    const alternatives = modelsWithCosts.slice(1, 6)
    
    const effectiveInput = Math.max(0, body.inputTokens - cachedTokens)
    const inputCost = (effectiveInput / 1_000_000) * best.model.inputPricePer1M
    const outputCost = (body.outputTokens / 1_000_000) * best.model.outputPricePer1M
    const cachedCost = best.model.cachedInputPricePer1M 
      ? (cachedTokens / 1_000_000) * best.model.cachedInputPricePer1M
      : 0
    
    return NextResponse.json({
      recommendation: {
        model: best.model.model,
        provider: best.model.provider,
        costs: {
          input: Number(inputCost.toFixed(8)),
          output: Number(outputCost.toFixed(8)),
          cached: Number(cachedCost.toFixed(8)),
          total: Number(best.cost.toFixed(8)),
        },
        prices: {
          inputPer1M: best.model.inputPricePer1M,
          outputPer1M: best.model.outputPricePer1M,
          cachedPer1M: best.model.cachedInputPricePer1M || null,
        },
        contextWindow: best.model.contextWindow,
        capabilities: {
          vision: best.model.supportsVision || false,
          functions: best.model.supportsFunctionCalling || false,
          reasoning: best.model.isReasoning || false,
        }
      },
      alternatives: alternatives.map(a => ({
        model: a.model.model,
        provider: a.model.provider,
        totalCost: Number(a.cost.toFixed(8)),
        priceDiff: Number((a.cost - best.cost).toFixed(8)),
      })),
      query: {
        inputTokens: body.inputTokens,
        outputTokens: body.outputTokens,
        cachedTokens,
        filters,
      }
    }, {
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        'Cache-Control': 'no-store',
      }
    })
    
  } catch (error) {
    console.error('Best API error:', error)
    return NextResponse.json(
      { error: 'Invalid request', message: 'Could not parse request body' },
      { status: 400, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }
}

// GET for simple queries
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous'
  
  const rateLimitResult = rateLimit(`best:${ip}`, { limit: 100, windowMs: 60000 })
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }
  
  const { searchParams } = new URL(request.url)
  const inputTokens = parseInt(searchParams.get('input') || '0', 10)
  const outputTokens = parseInt(searchParams.get('output') || '0', 10)
  const cachedTokens = parseInt(searchParams.get('cached') || '0', 10)
  const providers = searchParams.get('providers')?.split(',').filter(Boolean)
  const minContext = searchParams.get('minContext') ? parseInt(searchParams.get('minContext')!, 10) : undefined
  const capabilities = searchParams.get('capabilities')?.split(',').filter(Boolean)
  
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ 
      inputTokens, 
      outputTokens, 
      cachedTokens,
      filters: { providers, minContext, capabilities }
    })
  })
  
  return POST(new NextRequest(mockRequest))
}
