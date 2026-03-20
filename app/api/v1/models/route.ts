import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'
import { fallbackModelPrices } from '@/lib/model-prices'
import type { ModelPrice } from '@/lib/types'

let cachedPrices: ModelPrice[] | null = null
let cacheTime = 0
const CACHE_TTL = 3600000

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
      
      if (inputCost === 0 && outputCost === 0) continue
      
      const cleanId = modelId.replace(/^(openai\/|anthropic\/|vertex_ai\/|bedrock\/|groq\/)/, '')
      
      prices.push({
        provider: (d.litellm_provider as string) || 'unknown',
        model: cleanId,
        displayName: cleanId,
        inputPricePer1M: inputCost * 1_000_000,
        outputPricePer1M: outputCost * 1_000_000,
        cachedInputPricePer1M: d.cache_read_input_token_cost 
          ? (d.cache_read_input_token_cost as number) * 1_000_000 
          : undefined,
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

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'anonymous'
  
  const rateLimitResult = rateLimit(`models:${ip}`, { limit: 60, windowMs: 60000 })
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    )
  }
  
  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')?.toLowerCase()
  const hasCache = searchParams.get('hasCache') === 'true'
  const search = searchParams.get('search')?.toLowerCase()
  
  let prices = await getModelPrices()
  
  // Apply filters
  if (provider) {
    prices = prices.filter(p => p.provider.toLowerCase() === provider)
  }
  
  if (hasCache) {
    prices = prices.filter(p => p.cachedInputPricePer1M !== undefined)
  }
  
  if (search) {
    prices = prices.filter(p => 
      p.model.toLowerCase().includes(search) ||
      p.provider.toLowerCase().includes(search)
    )
  }
  
  // Get unique providers
  const providers = [...new Set(prices.map(p => p.provider))].sort()
  
  // Format response (minimal for bandwidth)
  const models = prices.map(p => ({
    id: p.model,
    provider: p.provider,
    input: p.inputPricePer1M,
    output: p.outputPricePer1M,
    cached: p.cachedInputPricePer1M || null,
    context: p.contextWindow || null,
  }))
  
  return NextResponse.json({
    count: models.length,
    providers,
    models,
    lastUpdated: new Date().toISOString(),
  }, {
    headers: {
      ...getRateLimitHeaders(rateLimitResult),
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    }
  })
}
